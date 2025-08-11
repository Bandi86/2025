"""
Data retention policies and cleanup procedures.

This module provides automated cleanup procedures for maintaining database
performance and managing data retention according to configured policies.
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from .connection import get_db_session, get_async_db_session
from .repositories import (
    JobRepository, GameRepository, SystemMetricsRepository,
    ProcessingReportRepository, AlertRepository
)

logger = logging.getLogger(__name__)


@dataclass
class RetentionPolicy:
    """Data retention policy configuration."""
    jobs_completed_days: int = 30
    jobs_failed_days: int = 90
    games_days: int = 365
    system_metrics_days: int = 30
    processing_reports_days: int = 90
    alerts_resolved_days: int = 60
    job_logs_days: int = 30


@dataclass
class CleanupResult:
    """Result of cleanup operation."""
    table_name: str
    records_deleted: int
    execution_time_seconds: float
    error: Optional[str] = None


class DatabaseCleaner:
    """Database cleanup manager with configurable retention policies."""
    
    def __init__(self, retention_policy: Optional[RetentionPolicy] = None):
        """
        Initialize database cleaner.
        
        Args:
            retention_policy: Data retention policy configuration
        """
        self.retention_policy = retention_policy or RetentionPolicy()
        self.cleanup_results: List[CleanupResult] = []
    
    def cleanup_all(self, dry_run: bool = False) -> List[CleanupResult]:
        """
        Run all cleanup procedures.
        
        Args:
            dry_run: If True, only calculate what would be deleted without actually deleting
        
        Returns:
            List[CleanupResult]: Results of all cleanup operations
        """
        self.cleanup_results = []
        
        logger.info(f"Starting database cleanup (dry_run={dry_run})")
        
        # Run all cleanup procedures
        cleanup_procedures = [
            self._cleanup_completed_jobs,
            self._cleanup_failed_jobs,
            self._cleanup_old_games,
            self._cleanup_system_metrics,
            self._cleanup_processing_reports,
            self._cleanup_resolved_alerts,
            self._cleanup_job_logs,
        ]
        
        for procedure in cleanup_procedures:
            try:
                result = procedure(dry_run=dry_run)
                self.cleanup_results.append(result)
                
                if result.error:
                    logger.error(f"Cleanup error in {result.table_name}: {result.error}")
                else:
                    logger.info(f"Cleaned up {result.records_deleted} records from {result.table_name}")
                    
            except Exception as e:
                logger.error(f"Unexpected error in cleanup procedure {procedure.__name__}: {e}")
                self.cleanup_results.append(CleanupResult(
                    table_name=procedure.__name__,
                    records_deleted=0,
                    execution_time_seconds=0.0,
                    error=str(e)
                ))
        
        total_deleted = sum(r.records_deleted for r in self.cleanup_results if not r.error)
        logger.info(f"Database cleanup completed. Total records deleted: {total_deleted}")
        
        return self.cleanup_results
    
    def _cleanup_completed_jobs(self, dry_run: bool = False) -> CleanupResult:
        """Clean up completed jobs older than retention period."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                job_repo = JobRepository(session)
                
                if dry_run:
                    # Count records that would be deleted
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.jobs_completed_days)
                    count = (session.query(job_repo.Job)
                            .filter(
                                job_repo.Job.status == 'completed',
                                job_repo.Job.completed_at < cutoff_date
                            )
                            .count())
                    deleted_count = count
                else:
                    deleted_count = job_repo.cleanup_old_jobs(days=self.retention_policy.jobs_completed_days)
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="jobs (completed)",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="jobs (completed)",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_failed_jobs(self, dry_run: bool = False) -> CleanupResult:
        """Clean up failed jobs older than retention period."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                job_repo = JobRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.jobs_failed_days)
                    count = (session.query(job_repo.Job)
                            .filter(
                                job_repo.Job.status == 'failed',
                                job_repo.Job.completed_at < cutoff_date
                            )
                            .count())
                    deleted_count = count
                else:
                    # Custom cleanup for failed jobs with different retention period
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.jobs_failed_days)
                    deleted_count = (session.query(job_repo.Job)
                                   .filter(
                                       job_repo.Job.status == 'failed',
                                       job_repo.Job.completed_at < cutoff_date
                                   )
                                   .delete())
                    session.commit()
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="jobs (failed)",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="jobs (failed)",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_old_games(self, dry_run: bool = False) -> CleanupResult:
        """Clean up old game records."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                game_repo = GameRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now().date() - timedelta(days=self.retention_policy.games_days)
                    count = (session.query(game_repo.Game)
                            .filter(game_repo.Game.date < cutoff_date)
                            .count())
                    deleted_count = count
                else:
                    deleted_count = game_repo.cleanup_old_games(days=self.retention_policy.games_days)
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="games",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="games",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_system_metrics(self, dry_run: bool = False) -> CleanupResult:
        """Clean up old system metrics."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                metrics_repo = SystemMetricsRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.system_metrics_days)
                    count = (session.query(metrics_repo.SystemMetric)
                            .filter(metrics_repo.SystemMetric.timestamp < cutoff_date)
                            .count())
                    deleted_count = count
                else:
                    deleted_count = metrics_repo.cleanup_old_metrics(days=self.retention_policy.system_metrics_days)
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="system_metrics",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="system_metrics",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_processing_reports(self, dry_run: bool = False) -> CleanupResult:
        """Clean up old processing reports."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                report_repo = ProcessingReportRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.processing_reports_days)
                    count = (session.query(report_repo.ProcessingReport)
                            .filter(report_repo.ProcessingReport.generated_at < cutoff_date)
                            .count())
                    deleted_count = count
                else:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.processing_reports_days)
                    deleted_count = (session.query(report_repo.ProcessingReport)
                                   .filter(report_repo.ProcessingReport.generated_at < cutoff_date)
                                   .delete())
                    session.commit()
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="processing_reports",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="processing_reports",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_resolved_alerts(self, dry_run: bool = False) -> CleanupResult:
        """Clean up resolved alerts older than retention period."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                alert_repo = AlertRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.alerts_resolved_days)
                    count = (session.query(alert_repo.Alert)
                            .filter(
                                alert_repo.Alert.status == 'resolved',
                                alert_repo.Alert.resolved_at < cutoff_date
                            )
                            .count())
                    deleted_count = count
                else:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.alerts_resolved_days)
                    deleted_count = (session.query(alert_repo.Alert)
                                   .filter(
                                       alert_repo.Alert.status == 'resolved',
                                       alert_repo.Alert.resolved_at < cutoff_date
                                   )
                                   .delete())
                    session.commit()
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="alerts (resolved)",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="alerts (resolved)",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def _cleanup_job_logs(self, dry_run: bool = False) -> CleanupResult:
        """Clean up old job logs."""
        start_time = datetime.now()
        
        try:
            with get_db_session() as session:
                job_repo = JobRepository(session)
                
                if dry_run:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.job_logs_days)
                    count = (session.query(job_repo.JobLog)
                            .filter(job_repo.JobLog.timestamp < cutoff_date)
                            .count())
                    deleted_count = count
                else:
                    cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.retention_policy.job_logs_days)
                    deleted_count = (session.query(job_repo.JobLog)
                                   .filter(job_repo.JobLog.timestamp < cutoff_date)
                                   .delete())
                    session.commit()
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                return CleanupResult(
                    table_name="job_logs",
                    records_deleted=deleted_count,
                    execution_time_seconds=execution_time
                )
                
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            return CleanupResult(
                table_name="job_logs",
                records_deleted=0,
                execution_time_seconds=execution_time,
                error=str(e)
            )
    
    def get_cleanup_summary(self) -> Dict[str, Any]:
        """Get summary of cleanup results."""
        total_deleted = sum(r.records_deleted for r in self.cleanup_results if not r.error)
        total_time = sum(r.execution_time_seconds for r in self.cleanup_results)
        errors = [r for r in self.cleanup_results if r.error]
        
        return {
            'total_records_deleted': total_deleted,
            'total_execution_time_seconds': total_time,
            'operations_count': len(self.cleanup_results),
            'errors_count': len(errors),
            'errors': [{'table': r.table_name, 'error': r.error} for r in errors],
            'details': [
                {
                    'table': r.table_name,
                    'records_deleted': r.records_deleted,
                    'execution_time': r.execution_time_seconds,
                    'success': r.error is None
                }
                for r in self.cleanup_results
            ]
        }


def run_scheduled_cleanup(
    retention_policy: Optional[RetentionPolicy] = None,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Run scheduled database cleanup.
    
    Args:
        retention_policy: Custom retention policy (uses default if None)
        dry_run: If True, only calculate what would be deleted
    
    Returns:
        Dict[str, Any]: Cleanup summary
    """
    cleaner = DatabaseCleaner(retention_policy)
    cleaner.cleanup_all(dry_run=dry_run)
    return cleaner.get_cleanup_summary()


def get_database_size_info() -> Dict[str, Any]:
    """
    Get information about database size and table statistics.
    
    Returns:
        Dict[str, Any]: Database size information
    """
    try:
        with get_db_session() as session:
            # Get table sizes (PostgreSQL specific)
            table_sizes_query = """
            SELECT 
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname IN ('automation', 'football', 'monitoring')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
            """
            
            result = session.execute(table_sizes_query)
            table_sizes = [
                {
                    'schema': row[0],
                    'table': row[1],
                    'size_pretty': row[2],
                    'size_bytes': row[3]
                }
                for row in result.fetchall()
            ]
            
            # Get total database size
            db_size_query = "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;"
            db_size_result = session.execute(db_size_query)
            db_size = db_size_result.fetchone()[0]
            
            return {
                'database_size': db_size,
                'table_sizes': table_sizes,
                'total_tables': len(table_sizes)
            }
            
    except Exception as e:
        logger.error(f"Failed to get database size info: {e}")
        return {
            'error': str(e),
            'database_size': 'unknown',
            'table_sizes': [],
            'total_tables': 0
        }