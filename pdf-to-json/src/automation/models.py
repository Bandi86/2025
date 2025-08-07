"""
Database models for the automation system.

This module defines SQLAlchemy models for job persistence, progress tracking,
and system state management.
"""

import json
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, Optional, List
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Boolean, Float, 
    ForeignKey, Index, create_engine, event
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.types import TypeDecorator, VARCHAR

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


class JSONType(TypeDecorator):
    """Custom JSON type that works with SQLite."""
    impl = VARCHAR
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value


class Job(Base):
    """
    Job model for tracking processing tasks.
    
    Stores job metadata, status, progress, and results for persistence
    and recovery across system restarts.
    """
    __tablename__ = 'jobs'
    
    # Primary key and identification
    id = Column(String(36), primary_key=True)  # UUID
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Job configuration
    job_type = Column(String(50), nullable=False)  # e.g., 'pdf_processing', 'web_download'
    priority = Column(Integer, default=JobPriority.NORMAL.value)
    parameters = Column(JSONType)  # Job-specific parameters
    
    # Status and timing
    status = Column(String(20), default=JobStatus.PENDING.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Progress tracking
    progress_percent = Column(Float, default=0.0)
    current_stage = Column(String(100))
    total_stages = Column(Integer, default=1)
    
    # Retry and error handling
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    last_error = Column(Text)
    error_count = Column(Integer, default=0)
    
    # Results and metadata
    result = Column(JSONType)  # Job results
    job_metadata = Column(JSONType)  # Additional metadata
    
    # File tracking
    input_file = Column(String(500))
    output_files = Column(JSONType)  # List of output file paths
    
    # Relationships
    progress_logs = relationship("JobProgressLog", back_populates="job", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_job_status', 'status'),
        Index('idx_job_priority', 'priority'),
        Index('idx_job_created', 'created_at'),
        Index('idx_job_type', 'job_type'),
        Index('idx_job_status_priority', 'status', 'priority'),
    )
    
    def __repr__(self):
        return f"<Job(id='{self.id}', name='{self.name}', status='{self.status}')>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'job_type': self.job_type,
            'priority': self.priority,
            'parameters': self.parameters,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'progress_percent': self.progress_percent,
            'current_stage': self.current_stage,
            'total_stages': self.total_stages,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries,
            'last_error': self.last_error,
            'error_count': self.error_count,
            'result': self.result,
            'metadata': self.job_metadata,
            'input_file': self.input_file,
            'output_files': self.output_files,
        }
    
    @property
    def is_active(self) -> bool:
        """Check if job is in an active state."""
        return self.status in [JobStatus.PENDING.value, JobStatus.RUNNING.value, JobStatus.RETRYING.value]
    
    @property
    def is_completed(self) -> bool:
        """Check if job is completed (successfully or failed)."""
        return self.status in [JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value]
    
    @property
    def can_retry(self) -> bool:
        """Check if job can be retried."""
        return (self.status == JobStatus.FAILED.value and 
                self.retry_count < self.max_retries)
    
    def update_progress(self, percent: float, stage: str = None, metadata: Dict[str, Any] = None):
        """Update job progress."""
        self.progress_percent = max(0.0, min(100.0, percent))
        if stage:
            self.current_stage = stage
        if metadata:
            if self.job_metadata is None:
                self.job_metadata = {}
            self.job_metadata.update(metadata)
        self.updated_at = datetime.now(timezone.utc)


class JobProgressLog(Base):
    """
    Progress log entries for detailed job tracking.
    
    Stores detailed progress information and stage transitions
    for debugging and monitoring purposes.
    """
    __tablename__ = 'job_progress_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), ForeignKey('jobs.id'), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Progress information
    progress_percent = Column(Float)
    stage = Column(String(100))
    message = Column(Text)
    level = Column(String(20), default='INFO')  # INFO, WARNING, ERROR
    
    # Additional data
    data = Column(JSONType)
    
    # Relationships
    job = relationship("Job", back_populates="progress_logs")
    
    # Indexes
    __table_args__ = (
        Index('idx_progress_job_id', 'job_id'),
        Index('idx_progress_timestamp', 'timestamp'),
        Index('idx_progress_level', 'level'),
    )
    
    def __repr__(self):
        return f"<JobProgressLog(job_id='{self.job_id}', stage='{self.stage}', progress={self.progress_percent}%)>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert progress log to dictionary representation."""
        return {
            'id': self.id,
            'job_id': self.job_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'progress_percent': self.progress_percent,
            'stage': self.stage,
            'message': self.message,
            'level': self.level,
            'data': self.data,
        }


class SystemMetrics(Base):
    """
    System metrics for monitoring and alerting.
    
    Stores periodic system health and performance metrics.
    """
    __tablename__ = 'system_metrics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Queue metrics
    queue_length = Column(Integer, default=0)
    active_jobs = Column(Integer, default=0)
    completed_jobs_last_hour = Column(Integer, default=0)
    failed_jobs_last_hour = Column(Integer, default=0)
    
    # Performance metrics
    average_processing_time = Column(Float, default=0.0)
    cache_hit_ratio = Column(Float, default=0.0)
    memory_usage_percent = Column(Float, default=0.0)
    cpu_usage_percent = Column(Float, default=0.0)
    disk_usage_percent = Column(Float, default=0.0)
    
    # Error metrics
    error_rate_percent = Column(Float, default=0.0)
    last_error_timestamp = Column(DateTime)
    
    # Additional metrics
    metrics_data = Column(JSONType)
    
    # Indexes
    __table_args__ = (
        Index('idx_metrics_timestamp', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<SystemMetrics(timestamp='{self.timestamp}', queue_length={self.queue_length})>"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary representation."""
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'queue_length': self.queue_length,
            'active_jobs': self.active_jobs,
            'completed_jobs_last_hour': self.completed_jobs_last_hour,
            'failed_jobs_last_hour': self.failed_jobs_last_hour,
            'average_processing_time': self.average_processing_time,
            'cache_hit_ratio': self.cache_hit_ratio,
            'memory_usage_percent': self.memory_usage_percent,
            'cpu_usage_percent': self.cpu_usage_percent,
            'disk_usage_percent': self.disk_usage_percent,
            'error_rate_percent': self.error_rate_percent,
            'last_error_timestamp': self.last_error_timestamp.isoformat() if self.last_error_timestamp else None,
            'metrics_data': self.metrics_data,
        }


def create_tables(engine):
    """Create all database tables."""
    Base.metadata.create_all(engine)


def get_session_factory(database_url: str) -> sessionmaker:
    """Create a session factory for the given database URL."""
    engine = create_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
    )
    
    # Create tables if they don't exist
    create_tables(engine)
    
    return sessionmaker(bind=engine)


# Event listeners for automatic timestamp updates
@event.listens_for(Job, 'before_update')
def job_before_update(mapper, connection, target):
    """Update the updated_at timestamp before job updates."""
    target.updated_at = datetime.now(timezone.utc)


@event.listens_for(JobProgressLog, 'before_insert')
def progress_log_before_insert(mapper, connection, target):
    """Set timestamp for progress log entries."""
    if target.timestamp is None:
        target.timestamp = datetime.now(timezone.utc)