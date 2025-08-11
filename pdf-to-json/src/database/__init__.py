"""
Database package for football automation system.

This package provides SQLAlchemy models, database connection management,
migrations, and data persistence functionality.
"""

from .models import *
from .connection import DatabaseManager, get_db_session, get_async_db_session
from .migrations import run_migrations, create_migration
from .repositories import *

__all__ = [
    # Models
    'Base', 'Job', 'JobLog', 'SystemMetric', 'Game', 'ProcessingReport', 
    'Alert', 'Webhook', 'JobStatus', 'JobPriority', 'AlertSeverity',
    
    # Connection management
    'DatabaseManager', 'get_db_session', 'get_async_db_session',
    
    # Migrations
    'run_migrations', 'create_migration',
    
    # Repositories
    'JobRepository', 'GameRepository', 'SystemMetricsRepository',
    'ProcessingReportRepository', 'AlertRepository', 'WebhookRepository',
]