"""
AutomationManager - Central coordinator for all automation components.

This module provides the main orchestration layer that coordinates:
- Scheduled web downloads using APScheduler
- File system monitoring and event handling
- Processing job management and coordination
- System health monitoring and alerting
- Graceful shutdown and cleanup procedures
"""

import asyncio
import logging
import signal
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Callable, Awaitable
from pathlib import Path
from contextlib import asynccontextmanager
from dataclasses import dataclass

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from .config import AutomationConfig
from .web_downloader import WebDownloader, DownloadResult, FileInfo
from .file_watcher import FileWatcher, FileEvent, FileEventType
from .processing_manager import ProcessingManager, ProcessingResult
from .cache_manager import CacheManager
from .exceptions import AutomationManagerError
from .models import get_session_factory, create_tables


@dataclass
class AutomationStatus:
    """Current status of the automation system."""
    is_running: bool
    start_time: Optional[datetime]
    components_status: Dict[str, Dict[str, Any]]
    scheduler_status: Dict[str, Any]
    last_download_check: Optional[datetime]
    last_file_event: Optional[datetime]
    active_jobs: int
    total_jobs_processed: int
    system_health: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'is_running': self.is_running,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'components_status': self.components_status,
            'scheduler_status': self.scheduler_status,
            'last_download_check': self.last_download_check.isoformat() if self.last_download_check else None,
            'last_file_event': self.last_file_event.isoformat() if self.last_file_event else None,
            'active_jobs': self.active_jobs,
            'total_jobs_processed': self.total_jobs_processed,
            'system_health': self.system_health,
        }


class AutomationManager:
    """
    Central coordinator for all automation components.
    
    Features:
    - Orchestrates web downloader, file watcher, and processing manager
    - Provides scheduled web downloads using APScheduler
    - Event-driven processing pipeline with proper error handling
    - System health monitoring and alerting
    - Graceful shutdown and cleanup procedures
    - Configuration hot-reload support
    """
    
    def __init__(self, config: AutomationConfig):
        """
        Initialize the AutomationManager.
        
        Args:
            config: AutomationConfig instance
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Core components
        self.web_downloader: Optional[WebDownloader] = None
        self.file_watcher: Optional[FileWatcher] = None
        self.processing_manager: Optional[ProcessingManager] = None
        self.cache_manager: Optional[CacheManager] = None
        
        # Scheduler for periodic tasks
        self.scheduler: Optional[AsyncIOScheduler] = None
        
        # State management
        self.is_running = False
        self.start_time: Optional[datetime] = None
        self.shutdown_event = asyncio.Event()
        
        # Statistics
        self.stats = {
            'downloads_attempted': 0,
            'downloads_successful': 0,
            'files_processed': 0,
            'processing_errors': 0,
            'last_download_check': None,
            'last_file_event': None,
        }
        
        # Event handlers
        self.event_handlers: Dict[str, List[Callable]] = {
            'download_completed': [],
            'file_detected': [],
            'processing_completed': [],
            'processing_failed': [],
            'system_error': [],
        }
        
        # Health monitoring
        self.health_check_task: Optional[asyncio.Task] = None
        self.last_health_check: Optional[datetime] = None
        
        # Setup signal handlers for graceful shutdown
        self._setup_signal_handlers()
    
    async def start(self) -> None:
        """Start the automation manager and all components."""
        if self.is_running:
            self.logger.warning("AutomationManager is already running")
            return
        
        try:
            self.logger.info("Starting AutomationManager")
            self.start_time = datetime.now(timezone.utc)
            
            # Initialize database
            await self._initialize_database()
            
            # Initialize components
            await self._initialize_components()
            
            # Start scheduler
            await self._start_scheduler()
            
            # Start health monitoring
            if self.config.monitoring.enabled:
                self.health_check_task = asyncio.create_task(self._health_check_loop())
            
            self.is_running = True
            self.logger.info("AutomationManager started successfully")
            
            # Emit startup event
            await self._emit_event('system_started', {
                'start_time': self.start_time,
                'config': self.config.to_dict()
            })
            
        except Exception as e:
            self.logger.error(f"Failed to start AutomationManager: {e}")
            await self.stop()
            raise AutomationManagerError(f"Failed to start automation manager: {e}")
    
    async def stop(self) -> None:
        """Stop the automation manager and all components gracefully."""
        if not self.is_running:
            self.logger.warning("AutomationManager is not running")
            return
        
        try:
            self.logger.info("Stopping AutomationManager")
            self.is_running = False
            
            # Signal shutdown to all waiting tasks
            self.shutdown_event.set()
            
            # Stop health monitoring
            if self.health_check_task:
                self.health_check_task.cancel()
                try:
                    await self.health_check_task
                except asyncio.CancelledError:
                    pass
            
            # Stop scheduler
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown(wait=False)
                # Wait a bit for scheduler to stop
                await asyncio.sleep(0.1)
                self.logger.info("Scheduler stopped")
            
            # Stop components in reverse order
            await self._stop_components()
            
            # Emit shutdown event
            await self._emit_event('system_stopped', {
                'stop_time': datetime.now(timezone.utc),
                'uptime_seconds': (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
            })
            
            self.logger.info("AutomationManager stopped successfully")
            
        except Exception as e:
            self.logger.error(f"Error during AutomationManager shutdown: {e}")
            raise AutomationManagerError(f"Failed to stop automation manager: {e}")
    
    async def schedule_download(self) -> Optional[DownloadResult]:
        """
        Manually trigger a download check.
        
        Returns:
            DownloadResult if download was attempted, None otherwise
        """
        if not self.web_downloader:
            raise AutomationManagerError("Web downloader not initialized")
        
        try:
            self.logger.info("Manual download check triggered")
            return await self._check_and_download()
        except Exception as e:
            self.logger.error(f"Manual download failed: {e}")
            await self._emit_event('system_error', {
                'error': str(e),
                'component': 'web_downloader',
                'operation': 'manual_download'
            })
            raise
    
    async def process_file(self, file_path: str, priority: int = 2) -> str:
        """
        Manually queue a file for processing.
        
        Args:
            file_path: Path to the file to process
            priority: Processing priority (0-4, higher is more important)
            
        Returns:
            Job ID
        """
        if not self.processing_manager:
            raise AutomationManagerError("Processing manager not initialized")
        
        try:
            self.logger.info(f"Manually queuing file for processing: {file_path}")
            job_id = await self.processing_manager.queue_file(file_path, priority)
            
            await self._emit_event('file_queued', {
                'file_path': file_path,
                'job_id': job_id,
                'priority': priority,
                'source': 'manual'
            })
            
            return job_id
            
        except Exception as e:
            self.logger.error(f"Failed to queue file {file_path}: {e}")
            await self._emit_event('system_error', {
                'error': str(e),
                'component': 'processing_manager',
                'operation': 'queue_file',
                'file_path': file_path
            })
            raise
    
    def get_status(self) -> AutomationStatus:
        """Get current status of the automation system."""
        # Get component statuses
        components_status = {}
        
        if self.web_downloader:
            components_status['web_downloader'] = {
                'initialized': True,
                'stats': self.web_downloader.get_download_stats()
            }
        
        if self.file_watcher:
            components_status['file_watcher'] = self.file_watcher.get_status()
        
        if self.processing_manager:
            # This would need to be made async in a real implementation
            components_status['processing_manager'] = {
                'initialized': True,
                'active_jobs': len(self.processing_manager.active_jobs)
            }
        
        if self.cache_manager:
            components_status['cache_manager'] = {
                'initialized': True,
                'enabled': self.config.caching.enabled
            }
        
        # Get scheduler status
        scheduler_status = {}
        if self.scheduler:
            scheduler_status = {
                'running': self.scheduler.running,
                'jobs_count': len(self.scheduler.get_jobs()),
                'next_run_time': None
            }
            
            # Get next scheduled job
            jobs = self.scheduler.get_jobs()
            if jobs:
                next_job = min(jobs, key=lambda j: j.next_run_time or datetime.max.replace(tzinfo=timezone.utc))
                if next_job.next_run_time:
                    scheduler_status['next_run_time'] = next_job.next_run_time.isoformat()
        
        # Calculate system health
        system_health = self._calculate_system_health()
        
        return AutomationStatus(
            is_running=self.is_running,
            start_time=self.start_time,
            components_status=components_status,
            scheduler_status=scheduler_status,
            last_download_check=self.stats.get('last_download_check'),
            last_file_event=self.stats.get('last_file_event'),
            active_jobs=len(self.processing_manager.active_jobs) if self.processing_manager else 0,
            total_jobs_processed=self.stats.get('files_processed', 0),
            system_health=system_health
        )
    
    def add_event_handler(self, event_type: str, handler: Callable[[Dict[str, Any]], Awaitable[None]]) -> None:
        """
        Add an event handler for system events.
        
        Args:
            event_type: Type of event to handle
            handler: Async function to handle the event
        """
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        
        self.event_handlers[event_type].append(handler)
        self.logger.debug(f"Added event handler for {event_type}")
    
    def remove_event_handler(self, event_type: str, handler: Callable) -> None:
        """Remove an event handler."""
        if event_type in self.event_handlers and handler in self.event_handlers[event_type]:
            self.event_handlers[event_type].remove(handler)
            self.logger.debug(f"Removed event handler for {event_type}")
    
    async def reload_config(self, new_config: AutomationConfig) -> None:
        """
        Reload configuration with hot-reload support.
        
        Args:
            new_config: New configuration to apply
        """
        if not self.config.config_hot_reload:
            raise AutomationManagerError("Configuration hot-reload is disabled")
        
        try:
            self.logger.info("Reloading configuration")
            old_config = self.config
            self.config = new_config
            
            # Update component configurations
            await self._update_component_configs(old_config, new_config)
            
            # Restart scheduler if needed
            if self._scheduler_config_changed(old_config, new_config):
                await self._restart_scheduler()
            
            await self._emit_event('config_reloaded', {
                'timestamp': datetime.now(timezone.utc),
                'changes': self._get_config_changes(old_config, new_config)
            })
            
            self.logger.info("Configuration reloaded successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to reload configuration: {e}")
            # Rollback to old config
            self.config = old_config
            raise AutomationManagerError(f"Failed to reload configuration: {e}")
    
    async def _initialize_database(self) -> None:
        """Initialize database connection and tables."""
        try:
            self.session_factory = get_session_factory(self.config.database.url)
            self.logger.info("Database initialized successfully")
        except Exception as e:
            raise AutomationManagerError(f"Failed to initialize database: {e}")
    
    async def _initialize_components(self) -> None:
        """Initialize all automation components."""
        try:
            # Initialize cache manager first (other components may depend on it)
            if self.config.caching.enabled:
                self.cache_manager = CacheManager(self.config.caching)
                await self.cache_manager.connect()
                self.logger.info("Cache manager initialized")
            
            # Initialize web downloader
            self.web_downloader = WebDownloader(self.config.web_downloader)
            await self.web_downloader._create_session()
            self.logger.info("Web downloader initialized")
            
            # Initialize file watcher
            self.file_watcher = FileWatcher(self.config.file_watcher)
            self.file_watcher.add_handler(self._handle_file_event)
            await self.file_watcher.start_watching()
            self.logger.info("File watcher initialized")
            
            # Initialize processing manager
            self.processing_manager = ProcessingManager(
                self.config.processing,
                self.config.database
            )
            self.processing_manager.add_progress_callback(self._handle_processing_progress)
            await self.processing_manager.start()
            self.logger.info("Processing manager initialized")
            
        except Exception as e:
            await self._stop_components()
            raise AutomationManagerError(f"Failed to initialize components: {e}")
    
    async def _stop_components(self) -> None:
        """Stop all components gracefully."""
        # Stop processing manager first to finish active jobs
        if self.processing_manager:
            try:
                await self.processing_manager.stop()
                self.logger.info("Processing manager stopped")
            except Exception as e:
                self.logger.error(f"Error stopping processing manager: {e}")
        
        # Stop file watcher
        if self.file_watcher:
            try:
                await self.file_watcher.stop_watching()
                self.logger.info("File watcher stopped")
            except Exception as e:
                self.logger.error(f"Error stopping file watcher: {e}")
        
        # Stop web downloader
        if self.web_downloader:
            try:
                await self.web_downloader._close_session()
                self.logger.info("Web downloader stopped")
            except Exception as e:
                self.logger.error(f"Error stopping web downloader: {e}")
        
        # Stop cache manager
        if self.cache_manager:
            try:
                await self.cache_manager.disconnect()
                self.logger.info("Cache manager stopped")
            except Exception as e:
                self.logger.error(f"Error stopping cache manager: {e}")
    
    async def _start_scheduler(self) -> None:
        """Start the APScheduler for periodic tasks."""
        try:
            self.scheduler = AsyncIOScheduler()
            
            # Add job listener for monitoring
            self.scheduler.add_listener(self._scheduler_job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
            
            # Schedule periodic web download checks
            if self.config.web_downloader.check_interval > 0:
                self.scheduler.add_job(
                    self._scheduled_download_check,
                    IntervalTrigger(seconds=self.config.web_downloader.check_interval),
                    id='web_download_check',
                    name='Periodic Web Download Check',
                    max_instances=1,
                    coalesce=True
                )
                self.logger.info(f"Scheduled web download checks every {self.config.web_downloader.check_interval} seconds")
            
            # Schedule health checks
            if self.config.monitoring.enabled and self.config.monitoring.health_check_interval > 0:
                self.scheduler.add_job(
                    self._scheduled_health_check,
                    IntervalTrigger(seconds=self.config.monitoring.health_check_interval),
                    id='health_check',
                    name='System Health Check',
                    max_instances=1,
                    coalesce=True
                )
                self.logger.info(f"Scheduled health checks every {self.config.monitoring.health_check_interval} seconds")
            
            # Schedule cleanup tasks
            self.scheduler.add_job(
                self._scheduled_cleanup,
                CronTrigger(hour=2, minute=0),  # Daily at 2 AM
                id='daily_cleanup',
                name='Daily Cleanup Task',
                max_instances=1,
                coalesce=True
            )
            
            self.scheduler.start()
            self.logger.info("Scheduler started successfully")
            
        except Exception as e:
            raise AutomationManagerError(f"Failed to start scheduler: {e}")
    
    async def _restart_scheduler(self) -> None:
        """Restart the scheduler with new configuration."""
        if self.scheduler and self.scheduler.running:
            self.scheduler.shutdown(wait=True)
        
        await self._start_scheduler()
        self.logger.info("Scheduler restarted with new configuration")
    
    async def _scheduled_download_check(self) -> None:
        """Scheduled task for checking and downloading new files."""
        try:
            self.logger.debug("Running scheduled download check")
            result = await self._check_and_download()
            
            if result and result.success:
                self.logger.info(f"Scheduled download completed: {result.file_path}")
            
        except Exception as e:
            self.logger.error(f"Scheduled download check failed: {e}")
            await self._emit_event('system_error', {
                'error': str(e),
                'component': 'scheduler',
                'operation': 'download_check'
            })
    
    async def _scheduled_health_check(self) -> None:
        """Scheduled health check task."""
        try:
            await self._perform_health_check()
        except Exception as e:
            self.logger.error(f"Scheduled health check failed: {e}")
    
    async def _scheduled_cleanup(self) -> None:
        """Scheduled cleanup task."""
        try:
            self.logger.info("Running scheduled cleanup")
            
            # Clean up old log files
            await self._cleanup_old_logs()
            
            # Clean up temporary files
            await self._cleanup_temp_files()
            
            # Clean up old metrics
            await self._cleanup_old_metrics()
            
            self.logger.info("Scheduled cleanup completed")
            
        except Exception as e:
            self.logger.error(f"Scheduled cleanup failed: {e}")
    
    def _scheduler_job_listener(self, event) -> None:
        """Listen to scheduler job events."""
        if event.exception:
            self.logger.error(f"Scheduled job {event.job_id} failed: {event.exception}")
        else:
            self.logger.debug(f"Scheduled job {event.job_id} completed successfully")
    
    async def _check_and_download(self) -> Optional[DownloadResult]:
        """Check for new files and download if available."""
        if not self.web_downloader:
            return None
        
        try:
            self.stats['downloads_attempted'] += 1
            self.stats['last_download_check'] = datetime.now(timezone.utc)
            
            # Check for new files
            latest_file = await self.web_downloader.get_latest_file_info()
            if not latest_file:
                self.logger.debug("No files available for download")
                return None
            
            # Check if we need to download
            local_path = Path(self.config.web_downloader.download_path) / latest_file.filename
            if not self.web_downloader.is_file_newer(latest_file, local_path):
                self.logger.debug(f"Local file {local_path} is up to date")
                return None
            
            # Download the file
            self.logger.info(f"Downloading new file: {latest_file.filename}")
            result = await self.web_downloader.download_file(latest_file)
            
            if result.success:
                self.stats['downloads_successful'] += 1
                
                # Emit download completed event
                await self._emit_event('download_completed', {
                    'file_path': str(result.file_path),
                    'file_info': latest_file.__dict__,
                    'download_result': result.to_dict()
                })
                
                self.logger.info(f"Download completed successfully: {result.file_path}")
            else:
                self.logger.error(f"Download failed: {result.error_message}")
                await self._emit_event('system_error', {
                    'error': result.error_message,
                    'component': 'web_downloader',
                    'operation': 'download_file'
                })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Download check failed: {e}")
            await self._emit_event('system_error', {
                'error': str(e),
                'component': 'web_downloader',
                'operation': 'check_and_download'
            })
            return None
    
    async def _handle_file_event(self, event: FileEvent) -> None:
        """Handle file system events from the file watcher."""
        try:
            self.stats['last_file_event'] = datetime.now(timezone.utc)
            
            self.logger.info(f"File event detected: {event.event_type.value} - {event.file_path}")
            
            # Only process file creation and modification events
            if event.event_type in [FileEventType.CREATED, FileEventType.MODIFIED]:
                # Queue the file for processing
                job_id = await self.processing_manager.queue_file(
                    event.file_path,
                    priority=3,  # High priority for file watcher events
                    job_type="pdf_processing",
                    parameters={
                        'source': 'file_watcher',
                        'event_type': event.event_type.value,
                        'timestamp': event.timestamp
                    }
                )
                
                await self._emit_event('file_detected', {
                    'file_path': event.file_path,
                    'event_type': event.event_type.value,
                    'job_id': job_id,
                    'timestamp': event.timestamp
                })
                
                self.logger.info(f"Queued file for processing: {event.file_path} (job: {job_id})")
            
        except Exception as e:
            self.logger.error(f"Error handling file event {event.file_path}: {e}")
            await self._emit_event('system_error', {
                'error': str(e),
                'component': 'file_watcher',
                'operation': 'handle_file_event',
                'file_path': event.file_path
            })
    
    async def _handle_processing_progress(self, job_id: str, progress: float, stage: str) -> None:
        """Handle processing progress updates."""
        self.logger.debug(f"Job {job_id} progress: {progress:.1f}% - {stage}")
        
        # Emit progress event for real-time updates
        await self._emit_event('processing_progress', {
            'job_id': job_id,
            'progress': progress,
            'stage': stage,
            'timestamp': datetime.now(timezone.utc)
        })
        
        # Check if processing is complete
        if progress >= 100.0:
            self.stats['files_processed'] += 1
            await self._emit_event('processing_completed', {
                'job_id': job_id,
                'timestamp': datetime.now(timezone.utc)
            })
    
    async def _emit_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Emit an event to all registered handlers."""
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    await handler(data)
                except Exception as e:
                    self.logger.error(f"Event handler error for {event_type}: {e}")
    
    async def _health_check_loop(self) -> None:
        """Continuous health monitoring loop."""
        while self.is_running and not self.shutdown_event.is_set():
            try:
                await self._perform_health_check()
                await asyncio.sleep(self.config.monitoring.health_check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Health check loop error: {e}")
                await asyncio.sleep(60)  # Wait before retrying
    
    async def _perform_health_check(self) -> None:
        """Perform a comprehensive health check."""
        self.last_health_check = datetime.now(timezone.utc)
        health_data = self._calculate_system_health()
        
        # Check for alerts
        alerts = self._check_alert_conditions(health_data)
        if alerts:
            await self._emit_event('health_alert', {
                'alerts': alerts,
                'health_data': health_data,
                'timestamp': self.last_health_check
            })
        
        # Log health status
        if self.config.monitoring.log_level.value in ['DEBUG', 'INFO']:
            self.logger.info(f"Health check completed: {health_data}")
    
    def _calculate_system_health(self) -> Dict[str, Any]:
        """Calculate current system health metrics."""
        import psutil
        
        return {
            'memory_usage_percent': psutil.virtual_memory().percent,
            'cpu_usage_percent': psutil.cpu_percent(),
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'components_healthy': all([
                self.web_downloader is not None,
                self.file_watcher is not None and self.file_watcher.is_watching,
                self.processing_manager is not None,
                self.scheduler is not None and self.scheduler.running
            ]),
            'last_health_check': self.last_health_check.isoformat() if self.last_health_check else None,
            'uptime_seconds': (datetime.now(timezone.utc) - self.start_time).total_seconds() if self.start_time else 0
        }
    
    def _check_alert_conditions(self, health_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for alert conditions based on health data."""
        alerts = []
        thresholds = self.config.monitoring.alert_thresholds
        
        # Memory usage alert
        if health_data['memory_usage_percent'] > thresholds.get('memory_usage_percent', 80):
            alerts.append({
                'type': 'high_memory_usage',
                'severity': 'warning',
                'message': f"Memory usage is {health_data['memory_usage_percent']:.1f}%",
                'threshold': thresholds.get('memory_usage_percent', 80)
            })
        
        # Queue length alert
        if self.processing_manager:
            queue_length = self.processing_manager.job_queue.qsize()
            if queue_length > thresholds.get('queue_length', 10):
                alerts.append({
                    'type': 'high_queue_length',
                    'severity': 'warning',
                    'message': f"Processing queue length is {queue_length}",
                    'threshold': thresholds.get('queue_length', 10)
                })
        
        # Component health alert
        if not health_data['components_healthy']:
            alerts.append({
                'type': 'component_unhealthy',
                'severity': 'error',
                'message': "One or more components are not healthy"
            })
        
        return alerts
    
    async def _update_component_configs(self, old_config: AutomationConfig, new_config: AutomationConfig) -> None:
        """Update component configurations during hot-reload."""
        # Update web downloader config
        if self.web_downloader and old_config.web_downloader != new_config.web_downloader:
            self.web_downloader.config = new_config.web_downloader
            self.logger.info("Web downloader configuration updated")
        
        # Update file watcher config (requires restart)
        if self.file_watcher and old_config.file_watcher != new_config.file_watcher:
            await self.file_watcher.stop_watching()
            self.file_watcher = FileWatcher(new_config.file_watcher)
            self.file_watcher.add_handler(self._handle_file_event)
            await self.file_watcher.start_watching()
            self.logger.info("File watcher configuration updated")
        
        # Update processing manager config
        if self.processing_manager and old_config.processing != new_config.processing:
            self.processing_manager.config = new_config.processing
            self.logger.info("Processing manager configuration updated")
    
    def _scheduler_config_changed(self, old_config: AutomationConfig, new_config: AutomationConfig) -> bool:
        """Check if scheduler configuration has changed."""
        return (
            old_config.web_downloader.check_interval != new_config.web_downloader.check_interval or
            old_config.monitoring.health_check_interval != new_config.monitoring.health_check_interval
        )
    
    def _get_config_changes(self, old_config: AutomationConfig, new_config: AutomationConfig) -> List[str]:
        """Get a list of configuration changes."""
        changes = []
        
        if old_config.web_downloader != new_config.web_downloader:
            changes.append("web_downloader")
        if old_config.file_watcher != new_config.file_watcher:
            changes.append("file_watcher")
        if old_config.processing != new_config.processing:
            changes.append("processing")
        if old_config.caching != new_config.caching:
            changes.append("caching")
        if old_config.monitoring != new_config.monitoring:
            changes.append("monitoring")
        
        return changes
    
    async def _cleanup_old_logs(self) -> None:
        """Clean up old log files."""
        if not self.config.monitoring.log_file:
            return
        
        try:
            log_path = Path(self.config.monitoring.log_file)
            if log_path.exists():
                # Implement log rotation logic here
                pass
        except Exception as e:
            self.logger.error(f"Failed to cleanup old logs: {e}")
    
    async def _cleanup_temp_files(self) -> None:
        """Clean up temporary files."""
        try:
            temp_dir = Path(self.config.temp_directory)
            if temp_dir.exists():
                # Clean up files older than 24 hours
                cutoff_time = time.time() - 86400
                for file_path in temp_dir.glob("*"):
                    if file_path.is_file() and file_path.stat().st_mtime < cutoff_time:
                        file_path.unlink()
                        self.logger.debug(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            self.logger.error(f"Failed to cleanup temp files: {e}")
    
    async def _cleanup_old_metrics(self) -> None:
        """Clean up old metrics from database."""
        try:
            from datetime import timedelta
            from .models import SystemMetrics
            
            cutoff_time = datetime.now(timezone.utc) - timedelta(
                days=self.config.monitoring.metrics_retention_days
            )
            
            with self.session_factory() as session:
                deleted_count = session.query(SystemMetrics).filter(
                    SystemMetrics.timestamp < cutoff_time
                ).delete()
                session.commit()
                
                if deleted_count > 0:
                    self.logger.info(f"Cleaned up {deleted_count} old metrics records")
                    
        except Exception as e:
            self.logger.error(f"Failed to cleanup old metrics: {e}")
    
    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        def signal_handler(signum, frame):
            self.logger.info(f"Received signal {signum}, initiating graceful shutdown")
            asyncio.create_task(self.stop())
        
        # Register signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop()


# Convenience function for creating and running automation manager
async def run_automation_manager(config: AutomationConfig) -> None:
    """
    Run the automation manager with proper error handling.
    
    Args:
        config: AutomationConfig instance
    """
    manager = AutomationManager(config)
    
    try:
        await manager.start()
        
        # Wait for shutdown signal
        await manager.shutdown_event.wait()
        
    except KeyboardInterrupt:
        logging.info("Received keyboard interrupt, shutting down")
    except Exception as e:
        logging.error(f"Automation manager error: {e}")
        raise
    finally:
        await manager.stop()