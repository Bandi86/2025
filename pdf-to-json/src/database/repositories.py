"""
Repository classes for data access patterns.

This module provides repository classes that encapsulate database operations
for different entities, following the repository pattern for clean separation
of concerns.
"""

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Union
from sqlalchemy import and_, or_, desc, asc, func, select, update, delete
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, NoResultFound

from .models import (
    Job, JobLog, SystemMetric, Game, ProcessingReport, Alert, Webhook,
    JobStatus, JobPriority, AlertSeverity
)


class BaseRepository:
    """Base repository class with common operations."""
    
    def __init__(self, session: Union[Session, AsyncSession]):
        self.session = session
        self.is_async = isinstance(session, AsyncSession)


class JobRepository(BaseRepository):
    """Repository for job-related database operations."""
    
    def create_job(
        self,
        job_type: str,
        file_path: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        priority: int = JobPriority.NORMAL.value,
        max_retries: int = 3
    ) -> Job:
        """Create a new job."""
        job = Job(
            id=uuid.uuid4(),
            job_type=job_type,
            file_path=file_path,
            parameters=parameters or {},
            priority=priority,
            max_retries=max_retries,
            status=JobStatus.PENDING.value
        )
        
        self.session.add(job)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(job)
        
        return job
    
    async def create_job_async(
        self,
        job_type: str,
        file_path: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        priority: int = JobPriority.NORMAL.value,
        max_retries: int = 3
    ) -> Job:
        """Create a new job asynchronously."""
        job = Job(
            id=uuid.uuid4(),
            job_type=job_type,
            file_path=file_path,
            parameters=parameters or {},
            priority=priority,
            max_retries=max_retries,
            status=JobStatus.PENDING.value
        )
        
        self.session.add(job)
        await self.session.commit()
        await self.session.refresh(job)
        
        return job
    
    def get_job(self, job_id: Union[str, uuid.UUID]) -> Optional[Job]:
        """Get a job by ID."""
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        
        return self.session.query(Job).filter(Job.id == job_id).first()
    
    async def get_job_async(self, job_id: Union[str, uuid.UUID]) -> Optional[Job]:
        """Get a job by ID asynchronously."""
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        
        result = await self.session.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()
    
    def get_jobs_by_status(
        self,
        status: Union[str, List[str]],
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Job]:
        """Get jobs by status."""
        query = self.session.query(Job)
        
        if isinstance(status, str):
            query = query.filter(Job.status == status)
        else:
            query = query.filter(Job.status.in_(status))
        
        query = query.order_by(desc(Job.priority), asc(Job.created_at))
        
        if offset > 0:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    async def get_jobs_by_status_async(
        self,
        status: Union[str, List[str]],
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Job]:
        """Get jobs by status asynchronously."""
        query = select(Job)
        
        if isinstance(status, str):
            query = query.where(Job.status == status)
        else:
            query = query.where(Job.status.in_(status))
        
        query = query.order_by(desc(Job.priority), asc(Job.created_at))
        
        if offset > 0:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    def update_job_status(
        self,
        job_id: Union[str, uuid.UUID],
        status: str,
        error_message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        progress_percent: Optional[float] = None,
        current_stage: Optional[str] = None
    ) -> bool:
        """Update job status and related fields."""
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        
        update_data = {'status': status}
        
        if status == JobStatus.RUNNING.value:
            update_data['started_at'] = datetime.now(timezone.utc)
        elif status in [JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value]:
            update_data['completed_at'] = datetime.now(timezone.utc)
        
        if error_message is not None:
            update_data['error_message'] = error_message
        if result is not None:
            update_data['result'] = result
        if progress_percent is not None:
            update_data['progress_percent'] = progress_percent
        if current_stage is not None:
            update_data['current_stage'] = current_stage
        
        rows_updated = self.session.query(Job).filter(Job.id == job_id).update(update_data)
        
        if not self.is_async:
            self.session.commit()
        
        return rows_updated > 0
    
    async def update_job_status_async(
        self,
        job_id: Union[str, uuid.UUID],
        status: str,
        error_message: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        progress_percent: Optional[float] = None,
        current_stage: Optional[str] = None
    ) -> bool:
        """Update job status and related fields asynchronously."""
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        
        update_data = {'status': status}
        
        if status == JobStatus.RUNNING.value:
            update_data['started_at'] = datetime.now(timezone.utc)
        elif status in [JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value]:
            update_data['completed_at'] = datetime.now(timezone.utc)
        
        if error_message is not None:
            update_data['error_message'] = error_message
        if result is not None:
            update_data['result'] = result
        if progress_percent is not None:
            update_data['progress_percent'] = progress_percent
        if current_stage is not None:
            update_data['current_stage'] = current_stage
        
        stmt = update(Job).where(Job.id == job_id).values(**update_data)
        result = await self.session.execute(stmt)
        await self.session.commit()
        
        return result.rowcount > 0
    
    def add_job_log(
        self,
        job_id: Union[str, uuid.UUID],
        level: str,
        message: str,
        stage: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> JobLog:
        """Add a log entry for a job."""
        if isinstance(job_id, str):
            job_id = uuid.UUID(job_id)
        
        log_entry = JobLog(
            job_id=job_id,
            level=level,
            message=message,
            stage=stage,
            log_metadata=metadata
        )
        
        self.session.add(log_entry)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(log_entry)
        
        return log_entry
    
    def get_pending_jobs(self, limit: Optional[int] = None) -> List[Job]:
        """Get pending jobs ordered by priority and creation time."""
        query = (self.session.query(Job)
                .filter(Job.status == JobStatus.PENDING.value)
                .order_by(desc(Job.priority), asc(Job.created_at)))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def cleanup_old_jobs(self, days: int = 30) -> int:
        """Clean up completed jobs older than specified days."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        deleted_count = (self.session.query(Job)
                        .filter(
                            and_(
                                Job.status.in_([JobStatus.COMPLETED.value, JobStatus.FAILED.value]),
                                Job.completed_at < cutoff_date
                            )
                        )
                        .delete())
        
        if not self.is_async:
            self.session.commit()
        
        return deleted_count


class GameRepository(BaseRepository):
    """Repository for game-related database operations."""
    
    def create_game(self, game_data: Dict[str, Any]) -> Game:
        """Create a new game record."""
        game = Game(**game_data)
        self.session.add(game)
        
        if not self.is_async:
            self.session.commit()
            self.session.refresh(game)
        
        return game
    
    def get_games_by_date(self, date: datetime.date, league: Optional[str] = None) -> List[Game]:
        """Get games by date and optionally by league."""
        query = self.session.query(Game).filter(Game.date == date)
        
        if league:
            query = query.filter(Game.league == league)
        
        return query.order_by(Game.time).all()
    
    def get_games_by_league(self, league: str, limit: Optional[int] = None) -> List[Game]:
        """Get games by league."""
        query = self.session.query(Game).filter(Game.league == league).order_by(desc(Game.date))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def bulk_create_games(self, games_data: List[Dict[str, Any]]) -> List[Game]:
        """Bulk create game records."""
        games = [Game(**game_data) for game_data in games_data]
        self.session.add_all(games)
        
        if not self.is_async:
            self.session.commit()
            for game in games:
                self.session.refresh(game)
        
        return games
    
    def cleanup_old_games(self, days: int = 90) -> int:
        """Clean up games older than specified days."""
        cutoff_date = datetime.now().date() - timedelta(days=days)
        
        deleted_count = (self.session.query(Game)
                        .filter(Game.date < cutoff_date)
                        .delete())
        
        if not self.is_async:
            self.session.commit()
        
        return deleted_count


class SystemMetricsRepository(BaseRepository):
    """Repository for system metrics operations."""
    
    def record_metric(
        self,
        metric_name: str,
        metric_value: float,
        component: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None
    ) -> SystemMetric:
        """Record a system metric."""
        metric = SystemMetric(
            metric_name=metric_name,
            metric_value=metric_value,
            component=component,
            tags=tags
        )
        
        self.session.add(metric)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(metric)
        
        return metric
    
    def get_metrics(
        self,
        metric_name: Optional[str] = None,
        component: Optional[str] = None,
        hours: int = 24,
        limit: Optional[int] = None
    ) -> List[SystemMetric]:
        """Get system metrics with optional filtering."""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        query = self.session.query(SystemMetric).filter(SystemMetric.timestamp >= cutoff_time)
        
        if metric_name:
            query = query.filter(SystemMetric.metric_name == metric_name)
        if component:
            query = query.filter(SystemMetric.component == component)
        
        query = query.order_by(desc(SystemMetric.timestamp))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def cleanup_old_metrics(self, days: int = 7) -> int:
        """Clean up metrics older than specified days."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        deleted_count = (self.session.query(SystemMetric)
                        .filter(SystemMetric.timestamp < cutoff_date)
                        .delete())
        
        if not self.is_async:
            self.session.commit()
        
        return deleted_count


class ProcessingReportRepository(BaseRepository):
    """Repository for processing report operations."""
    
    def create_report(
        self,
        report_type: str,
        data: Dict[str, Any],
        file_path: Optional[str] = None,
        summary: Optional[Dict[str, Any]] = None,
        anomalies: Optional[Dict[str, Any]] = None,
        trends: Optional[Dict[str, Any]] = None
    ) -> ProcessingReport:
        """Create a new processing report."""
        report = ProcessingReport(
            report_type=report_type,
            data=data,
            file_path=file_path,
            summary=summary,
            anomalies=anomalies,
            trends=trends
        )
        
        self.session.add(report)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(report)
        
        return report
    
    def get_reports_by_type(
        self,
        report_type: str,
        limit: Optional[int] = None
    ) -> List[ProcessingReport]:
        """Get reports by type."""
        query = (self.session.query(ProcessingReport)
                .filter(ProcessingReport.report_type == report_type)
                .order_by(desc(ProcessingReport.generated_at)))
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
    def get_latest_report(self, report_type: str) -> Optional[ProcessingReport]:
        """Get the latest report of a specific type."""
        return (self.session.query(ProcessingReport)
                .filter(ProcessingReport.report_type == report_type)
                .order_by(desc(ProcessingReport.generated_at))
                .first())


class AlertRepository(BaseRepository):
    """Repository for alert operations."""
    
    def create_alert(
        self,
        alert_type: str,
        severity: str,
        title: str,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Alert:
        """Create a new alert."""
        alert = Alert(
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            alert_metadata=metadata
        )
        
        self.session.add(alert)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(alert)
        
        return alert
    
    def get_active_alerts(self, severity: Optional[str] = None) -> List[Alert]:
        """Get active alerts, optionally filtered by severity."""
        query = self.session.query(Alert).filter(Alert.status == 'active')
        
        if severity:
            query = query.filter(Alert.severity == severity)
        
        return query.order_by(desc(Alert.triggered_at)).all()
    
    def resolve_alert(self, alert_id: Union[str, uuid.UUID]) -> bool:
        """Resolve an alert."""
        if isinstance(alert_id, str):
            alert_id = uuid.UUID(alert_id)
        
        rows_updated = (self.session.query(Alert)
                       .filter(Alert.id == alert_id)
                       .update({
                           'status': 'resolved',
                           'resolved_at': datetime.now(timezone.utc)
                       }))
        
        if not self.is_async:
            self.session.commit()
        
        return rows_updated > 0


class WebhookRepository(BaseRepository):
    """Repository for webhook operations."""
    
    def create_webhook(
        self,
        url: str,
        events: List[str],
        secret: Optional[str] = None,
        is_active: bool = True
    ) -> Webhook:
        """Create a new webhook."""
        webhook = Webhook(
            url=url,
            events=events,
            secret=secret,
            is_active=is_active
        )
        
        self.session.add(webhook)
        if not self.is_async:
            self.session.commit()
            self.session.refresh(webhook)
        
        return webhook
    
    def get_active_webhooks(self, event_type: Optional[str] = None) -> List[Webhook]:
        """Get active webhooks, optionally filtered by event type."""
        query = self.session.query(Webhook).filter(Webhook.is_active == True)
        
        if event_type:
            query = query.filter(Webhook.events.contains([event_type]))
        
        return query.all()
    
    def update_webhook_stats(
        self,
        webhook_id: Union[str, uuid.UUID],
        success: bool
    ) -> bool:
        """Update webhook success/failure statistics."""
        if isinstance(webhook_id, str):
            webhook_id = uuid.UUID(webhook_id)
        
        if success:
            update_data = {
                'success_count': Webhook.success_count + 1,
                'last_triggered': datetime.now(timezone.utc)
            }
        else:
            update_data = {
                'failure_count': Webhook.failure_count + 1,
                'last_triggered': datetime.now(timezone.utc)
            }
        
        rows_updated = (self.session.query(Webhook)
                       .filter(Webhook.id == webhook_id)
                       .update(update_data))
        
        if not self.is_async:
            self.session.commit()
        
        return rows_updated > 0