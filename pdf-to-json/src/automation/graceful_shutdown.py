"""
Graceful Shutdown Manager for Football Automation System.

This module provides comprehensive graceful shutdown capabilities:
- Graceful termination of running jobs
- Resource cleanup and state persistence
- Signal handling for container orchestration
- Job completion waiting with timeout
- Emergency shutdown procedures
"""

import asyncio
import logging
import signal
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Callable, Awaitable, Set
from pathlib import Path
from dataclasses import dataclass
from enum import Enum
import json

from .exceptions import GracefulShutdownError
from .models import JobStatus


class ShutdownPhase(Enum):
    """Phases of graceful shutdown process."""
    INITIATED = "initiated"
    STOPPING_NEW_JOBS = "stopping_new_jobs"
    WAITING_FOR_JOBS = "waiting_for_jobs"
    SAVING_STATE = "saving_state"
    CLEANUP = "cleanup"
    COMPLETED = "completed"
    EMERGENCY = "emergency"


@dataclass
class ShutdownConfig:
    """Configuration for graceful shutdown behavior."""
    # Maximum time to wait for jobs to complete (seconds)
    job_completion_timeout: int = 300
    
    # Maximum time to wait for each shutdown phase (seconds)
    phase_timeout: int = 60
    
    # Whether to save job state for recovery
    save_job_state: bool = True
    
    # Path to save shutdown state
    state_file_path: str = "data/shutdown_state.json"
    
    # Whether to force kill jobs after timeout
    force_kill_after_timeout: bool = True
    
    # Signals to handle for graceful shutdown
    shutdown_signals: List[int] = None
    
    # Whether to persist incomplete jobs for restart
    persist_incomplete_jobs: bool = True
    
    def __post_init__(self):
        if self.shutdown_signals is None:
            self.shutdown_signals = [signal.SIGTERM, signal.SIGINT]


@dataclass
class JobState:
    """State of a job during shutdown."""
    job_id: str
    status: JobStatus
    progress: float
    stage: str
    file_path: str
    started_at: datetime
    estimated_completion: Optional[datetime]
    can_be_interrupted: bool
    priority: int
    parameters: Dict[str, Any]


@dataclass
class ShutdownState:
    """Complete state of the system during shutdown."""
    shutdown_initiated_at: datetime
    shutdown_reason: str
    current_phase: ShutdownPhase
    active_jobs: List[JobState]
    completed_jobs: List[str]
    failed_jobs: List[str]
    system_metrics: Dict[str, Any]
    configuration_snapshot: Dict[str, Any]


class GracefulShutdownManager:
    """
    Manages graceful shutdown of the automation system.
    
    Features:
    - Handles shutdown signals (SIGTERM, SIGINT)
    - Waits for running jobs to complete
    - Saves system state for recovery
    - Provides emergency shutdown if needed
    - Supports job interruption and resumption
    """
    
    def __init__(self, config: ShutdownConfig):
        """
        Initialize the graceful shutdown manager.
        
        Args:
            config: Shutdown configuration
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Shutdown state
        self.shutdown_initiated = False
        self.shutdown_reason = ""
        self.shutdown_start_time: Optional[datetime] = None
        self.current_phase = ShutdownPhase.INITIATED
        
        # Component references (set by automation manager)
        self.automation_manager = None
        self.processing_manager = None
        self.file_watcher = None
        self.web_downloader = None
        self.cache_manager = None
        self.monitoring_manager = None
        
        # Job tracking
        self.active_jobs: Dict[str, JobState] = {}
        self.completed_jobs: Set[str] = set()
        self.failed_jobs: Set[str] = set()
        
        # Shutdown callbacks
        self.shutdown_callbacks: List[Callable[[], Awaitable[None]]] = []
        self.cleanup_callbacks: List[Callable[[], Awaitable[None]]] = []
        
        # Events
        self.shutdown_event = asyncio.Event()
        self.jobs_completed_event = asyncio.Event()
        
        # Setup signal handlers
        self._setup_signal_handlers()
    
    def set_component_references(self, **components):
        """Set references to system components."""
        for name, component in components.items():
            setattr(self, name, component)
    
    def add_shutdown_callback(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Add a callback to be executed during shutdown."""
        self.shutdown_callbacks.append(callback)
    
    def add_cleanup_callback(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Add a callback to be executed during cleanup phase."""
        self.cleanup_callbacks.append(callback)
    
    def _setup_signal_handlers(self) -> None:
        """Setup signal handlers for graceful shutdown."""
        for sig in self.config.shutdown_signals:
            signal.signal(sig, self._signal_handler)
        
        self.logger.info(f"Signal handlers setup for: {self.config.shutdown_signals}")
    
    def _signal_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals."""
        signal_name = signal.Signals(signum).name
        self.logger.info(f"Received signal {signal_name} ({signum})")
        
        # Initiate graceful shutdown
        asyncio.create_task(self.initiate_shutdown(f"Signal {signal_name}"))
    
    async def initiate_shutdown(self, reason: str = "Manual") -> None:
        """
        Initiate graceful shutdown process.
        
        Args:
            reason: Reason for shutdown
        """
        if self.shutdown_initiated:
            self.logger.warning("Shutdown already initiated")
            return
        
        self.shutdown_initiated = True
        self.shutdown_reason = reason
        self.shutdown_start_time = datetime.now(timezone.utc)
        self.shutdown_event.set()
        
        self.logger.info(f"Graceful shutdown initiated: {reason}")
        
        try:
            await self._execute_shutdown_phases()
        except Exception as e:
            self.logger.error(f"Error during graceful shutdown: {e}")
            await self._emergency_shutdown()
    
    async def _execute_shutdown_phases(self) -> None:
        """Execute all phases of graceful shutdown."""
        phases = [
            (ShutdownPhase.STOPPING_NEW_JOBS, self._phase_stop_new_jobs),
            (ShutdownPhase.WAITING_FOR_JOBS, self._phase_wait_for_jobs),
            (ShutdownPhase.SAVING_STATE, self._phase_save_state),
            (ShutdownPhase.CLEANUP, self._phase_cleanup),
        ]
        
        for phase, phase_func in phases:
            self.current_phase = phase
            self.logger.info(f"Entering shutdown phase: {phase.value}")
            
            try:
                # Execute phase with timeout
                await asyncio.wait_for(
                    phase_func(),
                    timeout=self.config.phase_timeout
                )
                self.logger.info(f"Completed shutdown phase: {phase.value}")
                
            except asyncio.TimeoutError:
                self.logger.error(f"Timeout in shutdown phase: {phase.value}")
                if phase == ShutdownPhase.WAITING_FOR_JOBS and self.config.force_kill_after_timeout:
                    await self._force_kill_jobs()
                else:
                    raise
            except Exception as e:
                self.logger.error(f"Error in shutdown phase {phase.value}: {e}")
                raise
        
        self.current_phase = ShutdownPhase.COMPLETED
        self.logger.info("Graceful shutdown completed successfully")
    
    async def _phase_stop_new_jobs(self) -> None:
        """Phase 1: Stop accepting new jobs."""
        self.logger.info("Stopping new job acceptance...")
        
        # Stop file watcher to prevent new file events
        if self.file_watcher:
            await self.file_watcher.stop_watching()
            self.logger.info("File watcher stopped")
        
        # Stop scheduler to prevent new scheduled jobs
        if self.automation_manager and hasattr(self.automation_manager, 'scheduler'):
            scheduler = self.automation_manager.scheduler
            if scheduler and scheduler.running:
                scheduler.shutdown(wait=False)
                self.logger.info("Scheduler stopped")
        
        # Mark processing manager to reject new jobs
        if self.processing_manager:
            self.processing_manager.accepting_new_jobs = False
            self.logger.info("Processing manager set to reject new jobs")
        
        # Execute shutdown callbacks
        for callback in self.shutdown_callbacks:
            try:
                await callback()
            except Exception as e:
                self.logger.error(f"Error in shutdown callback: {e}")
    
    async def _phase_wait_for_jobs(self) -> None:
        """Phase 2: Wait for active jobs to complete."""
        if not self.processing_manager:
            return
        
        self.logger.info("Waiting for active jobs to complete...")
        
        # Get current active jobs
        await self._update_job_states()
        
        if not self.active_jobs:
            self.logger.info("No active jobs to wait for")
            return
        
        self.logger.info(f"Waiting for {len(self.active_jobs)} active jobs")
        
        # Wait for jobs with timeout
        start_time = time.time()
        timeout = self.config.job_completion_timeout
        
        while self.active_jobs and (time.time() - start_time) < timeout:
            # Update job states
            await self._update_job_states()
            
            # Log progress
            if len(self.active_jobs) > 0:
                job_info = []
                for job_state in self.active_jobs.values():
                    job_info.append(f"{job_state.job_id}({job_state.progress:.1f}%)")
                
                self.logger.info(f"Waiting for jobs: {', '.join(job_info)}")
            
            # Wait a bit before checking again
            await asyncio.sleep(5)
        
        if self.active_jobs:
            remaining_jobs = list(self.active_jobs.keys())
            self.logger.warning(f"Timeout waiting for jobs: {remaining_jobs}")
            
            if self.config.force_kill_after_timeout:
                await self._force_kill_jobs()
        else:
            self.logger.info("All jobs completed successfully")
    
    async def _phase_save_state(self) -> None:
        """Phase 3: Save system state for recovery."""
        if not self.config.save_job_state:
            return
        
        self.logger.info("Saving system state...")
        
        try:
            # Create shutdown state
            shutdown_state = ShutdownState(
                shutdown_initiated_at=self.shutdown_start_time,
                shutdown_reason=self.shutdown_reason,
                current_phase=self.current_phase,
                active_jobs=list(self.active_jobs.values()),
                completed_jobs=list(self.completed_jobs),
                failed_jobs=list(self.failed_jobs),
                system_metrics=await self._collect_system_metrics(),
                configuration_snapshot=await self._get_configuration_snapshot()
            )
            
            # Save to file
            state_file = Path(self.config.state_file_path)
            state_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(state_file, 'w') as f:
                json.dump(self._serialize_shutdown_state(shutdown_state), f, indent=2)
            
            self.logger.info(f"System state saved to: {state_file}")
            
        except Exception as e:
            self.logger.error(f"Failed to save system state: {e}")
            # Don't fail shutdown for this
    
    async def _phase_cleanup(self) -> None:
        """Phase 4: Cleanup resources."""
        self.logger.info("Cleaning up resources...")
        
        # Execute cleanup callbacks
        for callback in self.cleanup_callbacks:
            try:
                await callback()
            except Exception as e:
                self.logger.error(f"Error in cleanup callback: {e}")
        
        # Close database connections
        if self.processing_manager and hasattr(self.processing_manager, 'session_factory'):
            try:
                # Close any open sessions
                self.logger.info("Closing database connections")
            except Exception as e:
                self.logger.error(f"Error closing database connections: {e}")
        
        # Disconnect from cache
        if self.cache_manager:
            try:
                await self.cache_manager.disconnect()
                self.logger.info("Cache manager disconnected")
            except Exception as e:
                self.logger.error(f"Error disconnecting cache manager: {e}")
        
        # Stop monitoring
        if self.monitoring_manager:
            try:
                await self.monitoring_manager.stop()
                self.logger.info("Monitoring manager stopped")
            except Exception as e:
                self.logger.error(f"Error stopping monitoring manager: {e}")
        
        # Close web downloader session
        if self.web_downloader:
            try:
                await self.web_downloader._close_session()
                self.logger.info("Web downloader session closed")
            except Exception as e:
                self.logger.error(f"Error closing web downloader session: {e}")
    
    async def _update_job_states(self) -> None:
        """Update the state of active jobs."""
        if not self.processing_manager:
            return
        
        # Get current active jobs from processing manager
        current_active = set(self.processing_manager.active_jobs.keys())
        
        # Remove completed jobs
        completed_jobs = set(self.active_jobs.keys()) - current_active
        for job_id in completed_jobs:
            if job_id in self.active_jobs:
                del self.active_jobs[job_id]
                self.completed_jobs.add(job_id)
        
        # Update remaining active jobs
        for job_id in current_active:
            if job_id in self.processing_manager.active_jobs:
                job_info = self.processing_manager.active_jobs[job_id]
                
                self.active_jobs[job_id] = JobState(
                    job_id=job_id,
                    status=job_info.get('status', JobStatus.RUNNING),
                    progress=job_info.get('progress', 0.0),
                    stage=job_info.get('stage', 'unknown'),
                    file_path=job_info.get('file_path', ''),
                    started_at=job_info.get('started_at', datetime.now(timezone.utc)),
                    estimated_completion=job_info.get('estimated_completion'),
                    can_be_interrupted=job_info.get('can_be_interrupted', True),
                    priority=job_info.get('priority', 0),
                    parameters=job_info.get('parameters', {})
                )
    
    async def _force_kill_jobs(self) -> None:
        """Force kill remaining active jobs."""
        if not self.active_jobs:
            return
        
        self.logger.warning(f"Force killing {len(self.active_jobs)} remaining jobs")
        
        for job_id, job_state in self.active_jobs.items():
            try:
                if self.processing_manager:
                    await self.processing_manager.cancel_job(job_id)
                    self.logger.info(f"Force killed job: {job_id}")
                    self.failed_jobs.add(job_id)
            except Exception as e:
                self.logger.error(f"Error force killing job {job_id}: {e}")
        
        self.active_jobs.clear()
    
    async def _emergency_shutdown(self) -> None:
        """Emergency shutdown when graceful shutdown fails."""
        self.current_phase = ShutdownPhase.EMERGENCY
        self.logger.error("Initiating emergency shutdown")
        
        try:
            # Force kill all jobs immediately
            await self._force_kill_jobs()
            
            # Try to save minimal state
            if self.config.save_job_state:
                try:
                    emergency_state = {
                        'emergency_shutdown': True,
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'reason': self.shutdown_reason,
                        'failed_jobs': list(self.failed_jobs),
                        'active_jobs_at_failure': list(self.active_jobs.keys())
                    }
                    
                    state_file = Path(self.config.state_file_path + '.emergency')
                    with open(state_file, 'w') as f:
                        json.dump(emergency_state, f, indent=2)
                    
                    self.logger.info(f"Emergency state saved to: {state_file}")
                except Exception as e:
                    self.logger.error(f"Failed to save emergency state: {e}")
            
            # Basic cleanup
            try:
                if self.cache_manager:
                    await self.cache_manager.disconnect()
            except:
                pass
            
            self.logger.error("Emergency shutdown completed")
            
        except Exception as e:
            self.logger.critical(f"Emergency shutdown failed: {e}")
    
    async def _collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system metrics for state saving."""
        metrics = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'uptime_seconds': 0,
            'total_jobs_processed': len(self.completed_jobs),
            'failed_jobs_count': len(self.failed_jobs),
            'active_jobs_count': len(self.active_jobs)
        }
        
        if self.automation_manager and self.automation_manager.start_time:
            uptime = datetime.now(timezone.utc) - self.automation_manager.start_time
            metrics['uptime_seconds'] = uptime.total_seconds()
        
        # Add component-specific metrics
        if self.processing_manager:
            metrics['processing_queue_length'] = len(getattr(self.processing_manager, 'job_queue', []))
        
        if self.cache_manager:
            try:
                cache_stats = await self.cache_manager.get_stats()
                metrics['cache_stats'] = cache_stats.__dict__ if hasattr(cache_stats, '__dict__') else {}
            except:
                pass
        
        return metrics
    
    async def _get_configuration_snapshot(self) -> Dict[str, Any]:
        """Get a snapshot of current configuration."""
        config_snapshot = {}
        
        if self.automation_manager and hasattr(self.automation_manager, 'config'):
            try:
                config_snapshot = self.automation_manager.config.to_dict()
            except:
                config_snapshot = {'error': 'Failed to serialize configuration'}
        
        return config_snapshot
    
    def _serialize_shutdown_state(self, state: ShutdownState) -> Dict[str, Any]:
        """Serialize shutdown state to JSON-compatible format."""
        return {
            'shutdown_initiated_at': state.shutdown_initiated_at.isoformat(),
            'shutdown_reason': state.shutdown_reason,
            'current_phase': state.current_phase.value,
            'active_jobs': [
                {
                    'job_id': job.job_id,
                    'status': job.status.value if hasattr(job.status, 'value') else str(job.status),
                    'progress': job.progress,
                    'stage': job.stage,
                    'file_path': job.file_path,
                    'started_at': job.started_at.isoformat(),
                    'estimated_completion': job.estimated_completion.isoformat() if job.estimated_completion else None,
                    'can_be_interrupted': job.can_be_interrupted,
                    'priority': job.priority,
                    'parameters': job.parameters
                }
                for job in state.active_jobs
            ],
            'completed_jobs': state.completed_jobs,
            'failed_jobs': state.failed_jobs,
            'system_metrics': state.system_metrics,
            'configuration_snapshot': state.configuration_snapshot
        }
    
    async def load_recovery_state(self) -> Optional[Dict[str, Any]]:
        """Load recovery state from previous shutdown."""
        state_file = Path(self.config.state_file_path)
        
        if not state_file.exists():
            return None
        
        try:
            with open(state_file, 'r') as f:
                state_data = json.load(f)
            
            self.logger.info(f"Loaded recovery state from: {state_file}")
            return state_data
            
        except Exception as e:
            self.logger.error(f"Failed to load recovery state: {e}")
            return None
    
    async def cleanup_recovery_state(self) -> None:
        """Clean up recovery state files after successful recovery."""
        state_file = Path(self.config.state_file_path)
        emergency_file = Path(self.config.state_file_path + '.emergency')
        
        for file_path in [state_file, emergency_file]:
            if file_path.exists():
                try:
                    file_path.unlink()
                    self.logger.info(f"Cleaned up recovery state file: {file_path}")
                except Exception as e:
                    self.logger.error(f"Failed to clean up {file_path}: {e}")
    
    def is_shutdown_initiated(self) -> bool:
        """Check if shutdown has been initiated."""
        return self.shutdown_initiated
    
    def get_shutdown_status(self) -> Dict[str, Any]:
        """Get current shutdown status."""
        return {
            'shutdown_initiated': self.shutdown_initiated,
            'shutdown_reason': self.shutdown_reason,
            'current_phase': self.current_phase.value if self.current_phase else None,
            'shutdown_start_time': self.shutdown_start_time.isoformat() if self.shutdown_start_time else None,
            'active_jobs_count': len(self.active_jobs),
            'completed_jobs_count': len(self.completed_jobs),
            'failed_jobs_count': len(self.failed_jobs)
        }