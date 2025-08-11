"""
Comprehensive monitoring and alerting system.

This module provides system metrics collection, health checks, alerting,
and structured logging for the automation system.
"""

import asyncio
import logging
import smtplib
import time
from datetime import datetime, timezone, timedelta
from email.mime.text import MIMEText as MimeText
from email.mime.multipart import MIMEMultipart as MimeMultipart
from typing import Dict, Any, List, Optional, Callable, Awaitable
from dataclasses import dataclass, asdict
from pathlib import Path
import json
import psutil
import structlog
import requests
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry, generate_latest

from .models import SystemMetrics, get_session_factory
from .config import MonitoringConfig, NotificationConfig
from .exceptions import MonitoringError


@dataclass
class SystemHealth:
    """System health status."""
    timestamp: datetime
    cpu_usage_percent: float
    memory_usage_percent: float
    disk_usage_percent: float
    queue_length: int
    active_jobs: int
    error_rate_percent: float
    cache_hit_ratio: float
    average_processing_time: float
    components_healthy: bool
    uptime_seconds: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            **asdict(self),
            'timestamp': self.timestamp.isoformat(),
            'status': 'healthy' if self.is_healthy() else 'unhealthy'
        }
    
    def is_healthy(self) -> bool:
        """Check if system is healthy based on thresholds."""
        return (
            self.cpu_usage_percent < 80 and
            self.memory_usage_percent < 80 and
            self.disk_usage_percent < 90 and
            self.error_rate_percent < 5 and
            self.components_healthy
        )


@dataclass
class Alert:
    """Alert definition."""
    id: str
    type: str
    severity: str  # 'info', 'warning', 'error', 'critical'
    message: str
    timestamp: datetime
    data: Dict[str, Any]
    resolved: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            **asdict(self),
            'timestamp': self.timestamp.isoformat()
        }

class MetricsCollector:
    """Collects and manages system metrics."""
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Prometheus metrics
        self.registry = CollectorRegistry()
        self._setup_prometheus_metrics()
        
        # Internal metrics storage
        self.metrics_history: List[SystemHealth] = []
        self.max_history_size = 1000
        
        # Component references (set by monitoring manager)
        self.processing_manager = None
        self.cache_manager = None
        self.automation_manager = None
    
    def _setup_prometheus_metrics(self):
        """Setup Prometheus metrics."""
        self.cpu_usage = Gauge('system_cpu_usage_percent', 'CPU usage percentage', registry=self.registry)
        self.memory_usage = Gauge('system_memory_usage_percent', 'Memory usage percentage', registry=self.registry)
        self.disk_usage = Gauge('system_disk_usage_percent', 'Disk usage percentage', registry=self.registry)
        self.queue_length = Gauge('processing_queue_length', 'Number of jobs in queue', registry=self.registry)
        self.active_jobs = Gauge('processing_active_jobs', 'Number of active jobs', registry=self.registry)
        self.error_rate = Gauge('system_error_rate_percent', 'Error rate percentage', registry=self.registry)
        self.cache_hit_ratio = Gauge('cache_hit_ratio', 'Cache hit ratio', registry=self.registry)
        self.processing_time = Histogram('job_processing_duration_seconds', 'Job processing time', registry=self.registry)
        
        # Counters
        self.jobs_total = Counter('jobs_total', 'Total number of jobs', ['status'], registry=self.registry)
        self.errors_total = Counter('errors_total', 'Total number of errors', ['component'], registry=self.registry)
        self.downloads_total = Counter('downloads_total', 'Total number of downloads', ['status'], registry=self.registry)
    
    async def collect_metrics(self) -> SystemHealth:
        """Collect current system metrics."""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Queue metrics
            queue_length = 0
            active_jobs = 0
            if self.processing_manager:
                queue_status = await self.processing_manager.get_queue_status()
                queue_length = queue_status.pending_jobs
                active_jobs = queue_status.active_jobs
            
            # Cache metrics
            cache_hit_ratio = 0.0
            if self.cache_manager:
                cache_stats = await self.cache_manager.get_stats()
                cache_hit_ratio = cache_stats.hit_ratio
            
            # Error rate calculation (last hour)
            error_rate = await self._calculate_error_rate()
            
            # Average processing time
            avg_processing_time = await self._calculate_avg_processing_time()
            
            # Component health
            components_healthy = await self._check_components_health()
            
            # Uptime
            uptime_seconds = 0.0
            if self.automation_manager and self.automation_manager.start_time:
                uptime_seconds = (datetime.now(timezone.utc) - self.automation_manager.start_time).total_seconds()
            
            health = SystemHealth(
                timestamp=datetime.now(timezone.utc),
                cpu_usage_percent=cpu_percent,
                memory_usage_percent=memory.percent,
                disk_usage_percent=(disk.used / disk.total) * 100,
                queue_length=queue_length,
                active_jobs=active_jobs,
                error_rate_percent=error_rate,
                cache_hit_ratio=cache_hit_ratio,
                average_processing_time=avg_processing_time,
                components_healthy=components_healthy,
                uptime_seconds=uptime_seconds
            )
            
            # Update Prometheus metrics
            self._update_prometheus_metrics(health)
            
            # Store in history
            self.metrics_history.append(health)
            if len(self.metrics_history) > self.max_history_size:
                self.metrics_history.pop(0)
            
            self.logger.debug("Metrics collected", **health.to_dict())
            return health
            
        except Exception as e:
            self.logger.error("Failed to collect metrics", error=str(e))
            raise MonitoringError(f"Failed to collect metrics: {e}")
    
    def _update_prometheus_metrics(self, health: SystemHealth):
        """Update Prometheus metrics."""
        self.cpu_usage.set(health.cpu_usage_percent)
        self.memory_usage.set(health.memory_usage_percent)
        self.disk_usage.set(health.disk_usage_percent)
        self.queue_length.set(health.queue_length)
        self.active_jobs.set(health.active_jobs)
        self.error_rate.set(health.error_rate_percent)
        self.cache_hit_ratio.set(health.cache_hit_ratio)
    
    async def _calculate_error_rate(self) -> float:
        """Calculate error rate for the last hour."""
        try:
            if not hasattr(self, 'session_factory'):
                return 0.0
            
            # This would need database session - simplified for now
            return 0.0
        except Exception:
            return 0.0
    
    async def _calculate_avg_processing_time(self) -> float:
        """Calculate average processing time."""
        try:
            if not hasattr(self, 'session_factory'):
                return 0.0
            
            # This would need database session - simplified for now
            return 0.0
        except Exception:
            return 0.0
    
    async def _check_components_health(self) -> bool:
        """Check if all components are healthy."""
        try:
            if not self.automation_manager:
                return False
            
            status = self.automation_manager.get_status()
            return (
                status.is_running and
                status.components_status.get('web_downloader', {}).get('initialized', False) and
                status.components_status.get('file_watcher', {}).get('initialized', False) and
                status.components_status.get('processing_manager', {}).get('initialized', False)
            )
        except Exception:
            return False
    
    def get_metrics_export(self) -> str:
        """Get Prometheus metrics export."""
        return generate_latest(self.registry).decode('utf-8')
    
    def get_recent_metrics(self, minutes: int = 60) -> List[SystemHealth]:
        """Get recent metrics within specified minutes."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=minutes)
        return [m for m in self.metrics_history if m.timestamp >= cutoff]
class AlertManager:
    """Manages alerts and notifications."""
    
    def __init__(self, config: MonitoringConfig, notification_config: NotificationConfig):
        self.config = config
        self.notification_config = notification_config
        self.logger = structlog.get_logger(__name__)
        
        # Active alerts
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.max_history_size = 1000
        
        # Alert handlers
        self.alert_handlers: List[Callable[[Alert], Awaitable[None]]] = []
    
    def add_alert_handler(self, handler: Callable[[Alert], Awaitable[None]]):
        """Add an alert handler."""
        self.alert_handlers.append(handler)
    
    async def check_alerts(self, health: SystemHealth) -> List[Alert]:
        """Check for alert conditions and create alerts."""
        alerts = []
        thresholds = self.config.alert_thresholds
        
        # CPU usage alert
        if health.cpu_usage_percent > thresholds.get('cpu_usage_percent', 80):
            alert = Alert(
                id=f"high_cpu_{int(time.time())}",
                type='high_cpu_usage',
                severity='warning' if health.cpu_usage_percent < 90 else 'error',
                message=f"High CPU usage: {health.cpu_usage_percent:.1f}%",
                timestamp=health.timestamp,
                data={'cpu_usage': health.cpu_usage_percent, 'threshold': thresholds.get('cpu_usage_percent', 80)}
            )
            alerts.append(alert)
        
        # Memory usage alert
        if health.memory_usage_percent > thresholds.get('memory_usage_percent', 80):
            alert = Alert(
                id=f"high_memory_{int(time.time())}",
                type='high_memory_usage',
                severity='warning' if health.memory_usage_percent < 90 else 'error',
                message=f"High memory usage: {health.memory_usage_percent:.1f}%",
                timestamp=health.timestamp,
                data={'memory_usage': health.memory_usage_percent, 'threshold': thresholds.get('memory_usage_percent', 80)}
            )
            alerts.append(alert)
        
        # Disk usage alert
        if health.disk_usage_percent > thresholds.get('disk_usage_percent', 85):
            alert = Alert(
                id=f"high_disk_{int(time.time())}",
                type='high_disk_usage',
                severity='warning' if health.disk_usage_percent < 95 else 'critical',
                message=f"High disk usage: {health.disk_usage_percent:.1f}%",
                timestamp=health.timestamp,
                data={'disk_usage': health.disk_usage_percent, 'threshold': thresholds.get('disk_usage_percent', 85)}
            )
            alerts.append(alert)
        
        # Queue length alert
        if health.queue_length > thresholds.get('queue_length', 10):
            alert = Alert(
                id=f"high_queue_{int(time.time())}",
                type='high_queue_length',
                severity='warning',
                message=f"High queue length: {health.queue_length} jobs",
                timestamp=health.timestamp,
                data={'queue_length': health.queue_length, 'threshold': thresholds.get('queue_length', 10)}
            )
            alerts.append(alert)
        
        # Error rate alert
        if health.error_rate_percent > thresholds.get('error_rate_percent', 5):
            alert = Alert(
                id=f"high_error_rate_{int(time.time())}",
                type='high_error_rate',
                severity='error',
                message=f"High error rate: {health.error_rate_percent:.1f}%",
                timestamp=health.timestamp,
                data={'error_rate': health.error_rate_percent, 'threshold': thresholds.get('error_rate_percent', 5)}
            )
            alerts.append(alert)
        
        # Component health alert
        if not health.components_healthy:
            alert = Alert(
                id=f"components_unhealthy_{int(time.time())}",
                type='components_unhealthy',
                severity='critical',
                message="One or more system components are unhealthy",
                timestamp=health.timestamp,
                data={'components_healthy': health.components_healthy}
            )
            alerts.append(alert)
        
        # Process new alerts
        for alert in alerts:
            await self._process_alert(alert)
        
        return alerts
    
    async def _process_alert(self, alert: Alert):
        """Process a new alert."""
        # Check if this is a duplicate alert
        if alert.id in self.active_alerts:
            return
        
        # Add to active alerts
        self.active_alerts[alert.id] = alert
        self.alert_history.append(alert)
        
        # Trim history
        if len(self.alert_history) > self.max_history_size:
            self.alert_history.pop(0)
        
        self.logger.warning("Alert triggered", alert_type=alert.type, severity=alert.severity, message=alert.message)
        
        # Notify handlers
        for handler in self.alert_handlers:
            try:
                await handler(alert)
            except Exception as e:
                self.logger.error("Alert handler failed", handler=str(handler), error=str(e))
        
        # Send notifications
        await self._send_notifications(alert)
    
    async def _send_notifications(self, alert: Alert):
        """Send alert notifications."""
        if not self.notification_config.enabled:
            return
        
        # Email notification
        if self.notification_config.email.enabled:
            await self._send_email_notification(alert)
        
        # Webhook notification
        if self.notification_config.webhook.enabled:
            await self._send_webhook_notification(alert)
    
    async def _send_email_notification(self, alert: Alert):
        """Send email notification."""
        try:
            smtp_config = self.notification_config.email
            
            msg = MimeMultipart()
            msg['From'] = smtp_config.from_address
            msg['To'] = ', '.join(smtp_config.to_addresses)
            msg['Subject'] = f"[{alert.severity.upper()}] Football Automation Alert: {alert.type}"
            
            body = f"""
Alert Details:
- Type: {alert.type}
- Severity: {alert.severity}
- Message: {alert.message}
- Timestamp: {alert.timestamp.isoformat()}
- Data: {json.dumps(alert.data, indent=2)}

This is an automated alert from the Football Automation System.
            """
            
            msg.attach(MimeText(body, 'plain'))
            
            with smtplib.SMTP(smtp_config.smtp_server, smtp_config.smtp_port) as server:
                if smtp_config.use_tls:
                    server.starttls()
                if smtp_config.username and smtp_config.password:
                    server.login(smtp_config.username, smtp_config.password)
                server.send_message(msg)
            
            self.logger.info("Email notification sent", alert_id=alert.id, recipients=smtp_config.to_addresses)
            
        except Exception as e:
            self.logger.error("Failed to send email notification", alert_id=alert.id, error=str(e))
    
    async def _send_webhook_notification(self, alert: Alert):
        """Send webhook notification."""
        try:
            webhook_config = self.notification_config.webhook
            
            payload = {
                'alert': alert.to_dict(),
                'system': 'football-automation',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            headers = {'Content-Type': 'application/json'}
            if webhook_config.headers:
                headers.update(webhook_config.headers)
            
            response = requests.post(
                webhook_config.url,
                json=payload,
                headers=headers,
                timeout=webhook_config.timeout
            )
            response.raise_for_status()
            
            self.logger.info("Webhook notification sent", alert_id=alert.id, url=webhook_config.url)
            
        except Exception as e:
            self.logger.error("Failed to send webhook notification", alert_id=alert.id, error=str(e))
    
    async def resolve_alert(self, alert_id: str):
        """Resolve an active alert."""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            del self.active_alerts[alert_id]
            self.logger.info("Alert resolved", alert_id=alert_id, alert_type=alert.type)
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts."""
        return list(self.active_alerts.values())
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Get alert history for specified hours."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [a for a in self.alert_history if a.timestamp >= cutoff]
class HealthCheckManager:
    """Manages health check endpoints and monitoring."""
    
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.logger = structlog.get_logger(__name__)
        
        # Component references
        self.metrics_collector = None
        self.automation_manager = None
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status."""
        try:
            if not self.metrics_collector:
                return {'status': 'error', 'message': 'Metrics collector not initialized'}
            
            health = await self.metrics_collector.collect_metrics()
            
            return {
                'status': 'healthy' if health.is_healthy() else 'unhealthy',
                'timestamp': health.timestamp.isoformat(),
                'checks': {
                    'cpu_usage': {
                        'status': 'ok' if health.cpu_usage_percent < 80 else 'warning',
                        'value': health.cpu_usage_percent,
                        'unit': 'percent'
                    },
                    'memory_usage': {
                        'status': 'ok' if health.memory_usage_percent < 80 else 'warning',
                        'value': health.memory_usage_percent,
                        'unit': 'percent'
                    },
                    'disk_usage': {
                        'status': 'ok' if health.disk_usage_percent < 90 else 'warning',
                        'value': health.disk_usage_percent,
                        'unit': 'percent'
                    },
                    'queue_length': {
                        'status': 'ok' if health.queue_length < 10 else 'warning',
                        'value': health.queue_length,
                        'unit': 'jobs'
                    },
                    'components': {
                        'status': 'ok' if health.components_healthy else 'error',
                        'value': health.components_healthy
                    }
                },
                'uptime_seconds': health.uptime_seconds
            }
            
        except Exception as e:
            self.logger.error("Health check failed", error=str(e))
            return {
                'status': 'error',
                'message': f'Health check failed: {e}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def get_readiness_status(self) -> Dict[str, Any]:
        """Get readiness status for container orchestration."""
        try:
            if not self.automation_manager:
                return {'ready': False, 'message': 'Automation manager not initialized'}
            
            status = self.automation_manager.get_status()
            
            ready = (
                status.is_running and
                all(comp.get('initialized', False) for comp in status.components_status.values())
            )
            
            return {
                'ready': ready,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'components': status.components_status
            }
            
        except Exception as e:
            self.logger.error("Readiness check failed", error=str(e))
            return {
                'ready': False,
                'message': f'Readiness check failed: {e}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    async def get_liveness_status(self) -> Dict[str, Any]:
        """Get liveness status for container orchestration."""
        try:
            if not self.automation_manager:
                return {'alive': False, 'message': 'Automation manager not initialized'}
            
            status = self.automation_manager.get_status()
            
            return {
                'alive': status.is_running,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'uptime_seconds': (datetime.now(timezone.utc) - status.start_time).total_seconds() if status.start_time else 0
            }
            
        except Exception as e:
            self.logger.error("Liveness check failed", error=str(e))
            return {
                'alive': False,
                'message': f'Liveness check failed: {e}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }


class MonitoringManager:
    """Central monitoring and alerting coordinator."""
    
    def __init__(self, config: MonitoringConfig, notification_config: NotificationConfig):
        self.config = config
        self.notification_config = notification_config
        self.logger = structlog.get_logger(__name__)
        
        # Components
        self.metrics_collector = MetricsCollector(config)
        self.alert_manager = AlertManager(config, notification_config)
        self.health_check_manager = HealthCheckManager(config)
        
        # Set cross-references
        self.health_check_manager.metrics_collector = self.metrics_collector
        
        # Monitoring loop
        self.monitoring_task: Optional[asyncio.Task] = None
        self.is_running = False
        self.shutdown_event = asyncio.Event()
    
    def set_component_references(self, automation_manager, processing_manager=None, cache_manager=None):
        """Set references to other system components."""
        self.metrics_collector.automation_manager = automation_manager
        self.metrics_collector.processing_manager = processing_manager
        self.metrics_collector.cache_manager = cache_manager
        self.health_check_manager.automation_manager = automation_manager
    
    async def start(self):
        """Start the monitoring system."""
        if self.is_running:
            self.logger.warning("Monitoring system is already running")
            return
        
        try:
            self.logger.info("Starting monitoring system")
            self.is_running = True
            
            # Start monitoring loop
            if self.config.enabled:
                self.monitoring_task = asyncio.create_task(self._monitoring_loop())
            
            self.logger.info("Monitoring system started successfully")
            
        except Exception as e:
            self.logger.error("Failed to start monitoring system", error=str(e))
            await self.stop()
            raise MonitoringError(f"Failed to start monitoring system: {e}")
    
    async def stop(self):
        """Stop the monitoring system."""
        if not self.is_running:
            return
        
        try:
            self.logger.info("Stopping monitoring system")
            self.is_running = False
            self.shutdown_event.set()
            
            # Stop monitoring loop
            if self.monitoring_task:
                self.monitoring_task.cancel()
                try:
                    await self.monitoring_task
                except asyncio.CancelledError:
                    pass
            
            self.logger.info("Monitoring system stopped successfully")
            
        except Exception as e:
            self.logger.error("Error stopping monitoring system", error=str(e))
    
    async def _monitoring_loop(self):
        """Main monitoring loop."""
        while self.is_running and not self.shutdown_event.is_set():
            try:
                # Collect metrics
                health = await self.metrics_collector.collect_metrics()
                
                # Check for alerts
                alerts = await self.alert_manager.check_alerts(health)
                
                # Log monitoring status
                if alerts:
                    self.logger.info("Monitoring cycle completed with alerts", 
                                   alert_count=len(alerts), 
                                   health_status=health.to_dict()['status'])
                else:
                    self.logger.debug("Monitoring cycle completed", 
                                    health_status=health.to_dict()['status'])
                
                # Wait for next cycle
                await asyncio.sleep(self.config.collection_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in monitoring loop", error=str(e))
                await asyncio.sleep(60)  # Wait before retrying
    
    def get_metrics_export(self) -> str:
        """Get Prometheus metrics export."""
        return self.metrics_collector.get_metrics_export()
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get health status."""
        return await self.health_check_manager.get_health_status()
    
    async def get_readiness_status(self) -> Dict[str, Any]:
        """Get readiness status."""
        return await self.health_check_manager.get_readiness_status()
    
    async def get_liveness_status(self) -> Dict[str, Any]:
        """Get liveness status."""
        return await self.health_check_manager.get_liveness_status()
    
    def get_active_alerts(self) -> List[Alert]:
        """Get active alerts."""
        return self.alert_manager.get_active_alerts()
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Get alert history."""
        return self.alert_manager.get_alert_history(hours)
    
    def get_recent_metrics(self, minutes: int = 60) -> List[SystemHealth]:
        """Get recent metrics."""
        return self.metrics_collector.get_recent_metrics(minutes)
    
    def add_alert_handler(self, handler: Callable[[Alert], Awaitable[None]]):
        """Add an alert handler."""
        self.alert_manager.add_alert_handler(handler)