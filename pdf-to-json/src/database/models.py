"""
SQLAlchemy models for the football automation system.

This module defines all database models for job tracking, game data storage,
system monitoring, and reporting functionality using PostgreSQL.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional, List
from sqlalchemy import (
    Column, String, DateTime, Text, Boolean, Float, Integer,
    ForeignKey, Index, JSON, Date, ARRAY, UUID
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.sql import func

Base = declarative_base()


class JobStatus(Enum):
    """Job status enumeration."""
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class JobPriority(Enum):
    """Job priority levels."""
    LOWEST = 0
    LOW = 1
    NORMAL = 2
    HIGH = 3
    HIGHEST = 4


class AlertSeverity(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Job(Base):
    """
    Job model for tracking processing tasks.
    
    Stores job metadata, status, progress, and results for persistence
    and recovery across system restarts.
    """
    __tablename__ = 'jobs'
    __table_args__ = {'schema': 'automation'}
    
    # Primary key and identification
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default=JobStatus.PENDING.value)
    priority = Column(Integer, nullable=False, default=JobPriority.NORMAL.value)
    
    # File and parameters
    file_path = Column(Text)
    parameters = Column(JSON)
    result = Column(JSON)
    error_message = Column(Text)
    
    # Progress tracking
    progress_percent = Column(Float, default=0.0)
    current_stage = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Retry handling
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    
    # Relationships
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_jobs_status', 'status'),
        Index('idx_jobs_created_at', 'created_at'),
        Index('idx_jobs_job_type', 'job_type'),
        {'schema': 'automation'}
    )
    
    def __repr__(self):
        return f"<Job(id='{self.id}', type='{self.job_type}', status='{self.status}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary representation."""
        return {
            'id': str(self.id),
            'job_type': self.job_type,
            'status': self.status,
            'priority': self.priority,
            'file_path': self.file_path,
            'parameters': self.parameters,
            'result': self.result,
            'error_message': self.error_message,
            'progress_percent': self.progress_percent,
            'current_stage': self.current_stage,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries,
        }
    
    @property
    def is_active(self) -> bool:
        """Check if job is in an active state."""
        return self.status in [JobStatus.PENDING.value, JobStatus.RUNNING.value, JobStatus.RETRYING.value]
    
    @property
    def can_retry(self) -> bool:
        """Check if job can be retried."""
        return (self.status == JobStatus.FAILED.value and 
                self.retry_count < self.max_retries)


class JobLog(Base):
    """
    Job log entries for detailed tracking and debugging.
    """
    __tablename__ = 'job_logs'
    __table_args__ = {'schema': 'automation'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(PostgresUUID(as_uuid=True), ForeignKey('automation.jobs.id'), nullable=False)
    level = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    stage = Column(String(100))
    log_metadata = Column(JSON)
    
    # Relationships
    job = relationship("Job", back_populates="logs")
    
    # Indexes
    __table_args__ = (
        Index('idx_job_logs_job_id', 'job_id'),
        Index('idx_job_logs_timestamp', 'timestamp'),
        {'schema': 'automation'}
    )
    
    def __repr__(self):
        return f"<JobLog(job_id='{self.job_id}', level='{self.level}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert log entry to dictionary representation."""
        return {
            'id': str(self.id),
            'job_id': str(self.job_id),
            'level': self.level,
            'message': self.message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'stage': self.stage,
            'metadata': self.log_metadata,
        }


class SystemMetric(Base):
    """
    System metrics for monitoring and alerting.
    """
    __tablename__ = 'system_metrics'
    __table_args__ = {'schema': 'automation'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    tags = Column(JSON)
    component = Column(String(50))
    
    # Indexes
    __table_args__ = (
        Index('idx_system_metrics_timestamp', 'timestamp'),
        Index('idx_system_metrics_name', 'metric_name'),
        Index('idx_system_metrics_component', 'component'),
        {'schema': 'automation'}
    )
    
    def __repr__(self):
        return f"<SystemMetric(name='{self.metric_name}', value={self.metric_value})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metric to dictionary representation."""
        return {
            'id': str(self.id),
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'metric_name': self.metric_name,
            'metric_value': self.metric_value,
            'tags': self.tags,
            'component': self.component,
        }


class Game(Base):
    """
    Football game data model.
    """
    __tablename__ = 'games'
    __table_args__ = {'schema': 'football'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    league = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    iso_date = Column(String(20), nullable=False)
    time = Column(String(10), nullable=False)
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    original_home_team = Column(String(100), nullable=False)
    original_away_team = Column(String(100), nullable=False)
    main_market = Column(JSON)
    additional_markets = Column(JSON)
    processing_metadata = Column(JSON)
    quality_score = Column(Float)
    confidence_scores = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_games_league', 'league'),
        Index('idx_games_date', 'date'),
        Index('idx_games_teams', 'home_team', 'away_team'),
        Index('idx_games_created_at', 'created_at'),
        {'schema': 'football'}
    )
    
    def __repr__(self):
        return f"<Game(id='{self.id}', {self.home_team} vs {self.away_team})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert game to dictionary representation."""
        return {
            'id': str(self.id),
            'league': self.league,
            'date': self.date.isoformat() if self.date else None,
            'iso_date': self.iso_date,
            'time': self.time,
            'home_team': self.home_team,
            'away_team': self.away_team,
            'original_home_team': self.original_home_team,
            'original_away_team': self.original_away_team,
            'main_market': self.main_market,
            'additional_markets': self.additional_markets,
            'processing_metadata': self.processing_metadata,
            'quality_score': self.quality_score,
            'confidence_scores': self.confidence_scores,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProcessingReport(Base):
    """
    Processing reports and analytics data.
    """
    __tablename__ = 'processing_reports'
    __table_args__ = {'schema': 'football'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_type = Column(String(50), nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    data = Column(JSON, nullable=False)
    file_path = Column(Text)
    summary = Column(JSON)
    anomalies = Column(JSON)
    trends = Column(JSON)
    
    def __repr__(self):
        return f"<ProcessingReport(id='{self.id}', type='{self.report_type}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary representation."""
        return {
            'id': str(self.id),
            'report_type': self.report_type,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'data': self.data,
            'file_path': self.file_path,
            'summary': self.summary,
            'anomalies': self.anomalies,
            'trends': self.trends,
        }


class Alert(Base):
    """
    System alerts and notifications.
    """
    __tablename__ = 'alerts'
    __table_args__ = {'schema': 'monitoring'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    status = Column(String(20), default='active')
    alert_metadata = Column(JSON)
    
    # Indexes
    __table_args__ = (
        Index('idx_alerts_status', 'status'),
        Index('idx_alerts_triggered_at', 'triggered_at'),
        Index('idx_alerts_type', 'alert_type'),
        {'schema': 'monitoring'}
    )
    
    def __repr__(self):
        return f"<Alert(id='{self.id}', type='{self.alert_type}', severity='{self.severity}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary representation."""
        return {
            'id': str(self.id),
            'alert_type': self.alert_type,
            'severity': self.severity,
            'title': self.title,
            'description': self.description,
            'triggered_at': self.triggered_at.isoformat() if self.triggered_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'status': self.status,
            'metadata': self.alert_metadata,
        }


class Webhook(Base):
    """
    Webhook configurations for external notifications.
    """
    __tablename__ = 'webhooks'
    __table_args__ = {'schema': 'monitoring'}
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(Text, nullable=False)
    events = Column(ARRAY(String), nullable=False)
    secret = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_triggered = Column(DateTime(timezone=True))
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<Webhook(id='{self.id}', url='{self.url}', active={self.is_active})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert webhook to dictionary representation."""
        return {
            'id': str(self.id),
            'url': self.url,
            'events': self.events,
            'secret': self.secret,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_triggered': self.last_triggered.isoformat() if self.last_triggered else None,
            'success_count': self.success_count,
            'failure_count': self.failure_count,
        }