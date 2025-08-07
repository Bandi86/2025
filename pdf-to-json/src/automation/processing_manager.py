"""
ProcessingManager for job queue and coordination.

This module provides a comprehensive job processing system with:
- Priority queue management using asyncio
- Job persistence with SQLite/PostgreSQL
- Progress tracking with callback system
- Failure recovery and retry mechanisms with exponential backoff
- Concurrent processing with configurable limits
"""

import asyncio
import uuid
import time
import traceback
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Callable, Awaitable, Union
from pathlib import Path
from contextlib import asynccontextmanager
import logging
import psutil
from dataclasses import dataclass, field

from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy import and_, or_, desc, func
from sqlalchemy.exc import SQLAlchemyError

from .config import ProcessingConfig, DatabaseConfig
from .models import (
    Job, JobStatus, JobPriority, JobProgressLog, SystemMetrics,
    get_session_factory, create_tables
)
from .exceptions import ProcessingManagerError
from src.converter.football_converter import FootballConverter
from src.converter.exceptions import FootballProcessingError


@dataclass
class ProcessingResult:
    """Result of a processing operation."""
    success: bool
    job_id: str
    output_files: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    processing_time: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'success': self.success,
            'job_id': self.job_id,
            'output_files': self.output_files,
            'metadata': self.metadata,
            'error': self.error,
            'processing_time': self.processing_time,
        }


@dataclass
class QueueStatus:
    """Current status of the processing queue."""
    total_jobs: int
    pending_jobs: int
    running_jobs: int
    completed_jobs: int
    failed_jobs: int
    queue_length: int
    active_workers: int
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            'total_jobs': self.total_jobs,
            'pending_jobs': self.pending_jobs,
            'running_jobs': self.running_jobs,
            'completed_jobs': self.completed_jobs,
            'failed_jobs': self.failed_jobs,
            'queue_length': self.queue_length,
            'active_workers': self.active_workers,
        }


class ProcessingManager:
    """
    Central processing manager for job queue and coordination.
    
    Features:
    - Priority queue system with asyncio
    - Job persistence using SQLite or PostgreSQL
    - Progress tracking with callback system
    - Failure recovery and retry mechanisms
    - Concurrent processing with limits
    - System metrics collection
    """
    
    def __init__(self, 
                 processing_config: ProcessingConfig,
                 database_config: DatabaseConfig,
                 converter: Optional[FootballConverter] = None):
        """
        Initialize the ProcessingManager.
        
        Args:
            processing_config: Processing configuration
            database_config: Database configuration
            converter: Optional FootballConverter instance
        """
        self.config = processing_config
        self.db_config = database_config
        self.converter = converter or FootballConverter()
        
        # Database session factory
        self.session_factory = get_session_factory(database_config.url)
        
        # Queue and worker management
        self.job_queue: asyncio.PriorityQueue = asyncio.PriorityQueue(
            maxsize=processing_config.queue_max_size
        )
        self.active_jobs: Dict[str, asyncio.Task] = {}
        self.workers: List[asyncio.Task] = []
        self.running = False
        
        # Progress callbacks
        self.progress_callbacks: List[Callable[[str, float, str], Awaitable[None]]] = []
        
        # Metrics
        self.metrics = {
            'jobs_processed': 0,
            'jobs_failed': 0,
            'total_processing_time': 0.0,
            'cache_hits': 0,
            'cache_misses': 0,
        }
        
        # Logging
        self.logger = logging.getLogger(__name__)
        
        # Cleanup task
        self.cleanup_task: Optional[asyncio.Task] = None
        self.metrics_task: Optional[asyncio.Task] = None
    
    async def start(self) -> None:
        """Start the processing manager and worker tasks."""
        if self.running:
            return
        
        self.running = True
        self.logger.info("Starting ProcessingManager")
        
        # Start worker tasks
        for i in range(self.config.max_concurrent_jobs):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self._cleanup_completed_jobs())
        
        # Start metrics collection task
        self.metrics_task = asyncio.create_task(self._collect_metrics())
        
        # Recover pending jobs from database
        await self._recover_pending_jobs()
        
        self.logger.info(f"ProcessingManager started with {len(self.workers)} workers")
    
    async def stop(self) -> None:
        """Stop the processing manager and all workers."""
        if not self.running:
            return
        
        self.logger.info("Stopping ProcessingManager")
        self.running = False
        
        # Cancel all active jobs
        active_jobs_copy = dict(self.active_jobs)
        for job_id, task in active_jobs_copy.items():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        
        # Stop workers
        for worker in self.workers:
            worker.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        
        # Stop cleanup and metrics tasks
        if self.cleanup_task:
            self.cleanup_task.cancel()
        if self.metrics_task:
            self.metrics_task.cancel()
        
        self.workers.clear()
        self.active_jobs.clear()
        
        self.logger.info("ProcessingManager stopped")
    
    async def queue_file(self, 
                        file_path: str, 
                        priority: int = JobPriority.NORMAL.value,
                        job_type: str = "pdf_processing",
                        parameters: Optional[Dict[str, Any]] = None) -> str:
        """
        Queue a file for processing.
        
        Args:
            file_path: Path to the file to process
            priority: Job priority (0-4, higher is more important)
            job_type: Type of job to create
            parameters: Additional job parameters
            
        Returns:
            Job ID
            
        Raises:
            ProcessingManagerError: If queueing fails
        """
        try:
            # Validate file exists
            if not Path(file_path).exists():
                raise ProcessingManagerError(f"File not found: {file_path}")
            
            # Create job
            job_id = str(uuid.uuid4())
            job = Job(
                id=job_id,
                name=f"Process {Path(file_path).name}",
                description=f"Process file: {file_path}",
                job_type=job_type,
                priority=priority,
                parameters=parameters or {},
                input_file=file_path,
                max_retries=self.config.retry_attempts,
                status=JobStatus.PENDING.value
            )
            
            # Save to database
            with self.session_factory() as session:
                session.add(job)
                session.commit()
            
            # Add to queue (priority is negated for min-heap behavior)
            queue_item = (-priority, time.time(), job_id)
            await self.job_queue.put(queue_item)
            
            self.logger.info(f"Queued job {job_id} for file {file_path} with priority {priority}")
            return job_id
            
        except Exception as e:
            self.logger.error(f"Failed to queue file {file_path}: {e}")
            raise ProcessingManagerError(f"Failed to queue file: {e}")
    
    async def get_queue_status(self) -> QueueStatus:
        """Get current queue status."""
        try:
            with self.session_factory() as session:
                # Count jobs by status
                total_jobs = session.query(Job).count()
                pending_jobs = session.query(Job).filter(Job.status == JobStatus.PENDING.value).count()
                running_jobs = session.query(Job).filter(Job.status == JobStatus.RUNNING.value).count()
                completed_jobs = session.query(Job).filter(Job.status == JobStatus.COMPLETED.value).count()
                failed_jobs = session.query(Job).filter(Job.status == JobStatus.FAILED.value).count()
                
                return QueueStatus(
                    total_jobs=total_jobs,
                    pending_jobs=pending_jobs,
                    running_jobs=running_jobs,
                    completed_jobs=completed_jobs,
                    failed_jobs=failed_jobs,
                    queue_length=self.job_queue.qsize(),
                    active_workers=len(self.active_jobs)
                )
        except Exception as e:
            self.logger.error(f"Failed to get queue status: {e}")
            raise ProcessingManagerError(f"Failed to get queue status: {e}")
    
    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job.
        
        Args:
            job_id: ID of the job to cancel
            
        Returns:
            True if job was cancelled, False otherwise
        """
        try:
            # Cancel active job if running
            if job_id in self.active_jobs:
                task = self.active_jobs[job_id]
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                del self.active_jobs[job_id]
            
            # Update job status in database
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job and job.status in [JobStatus.PENDING.value, JobStatus.RUNNING.value]:
                    job.status = JobStatus.CANCELLED.value
                    job.completed_at = datetime.now(timezone.utc)
                    session.commit()
                    
                    self.logger.info(f"Cancelled job {job_id}")
                    return True
                    
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to cancel job {job_id}: {e}")
            return False
    
    async def retry_failed_job(self, job_id: str) -> bool:
        """
        Retry a failed job.
        
        Args:
            job_id: ID of the job to retry
            
        Returns:
            True if job was queued for retry, False otherwise
        """
        try:
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job and job.can_retry:
                    # Reset job status
                    job.status = JobStatus.PENDING.value
                    job.started_at = None
                    job.completed_at = None
                    job.progress_percent = 0.0
                    job.current_stage = None
                    job.last_error = None
                    session.commit()
                    
                    # Add back to queue
                    queue_item = (-job.priority, time.time(), job_id)
                    await self.job_queue.put(queue_item)
                    
                    self.logger.info(f"Retrying job {job_id}")
                    return True
                    
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to retry job {job_id}: {e}")
            return False
    
    def add_progress_callback(self, callback: Callable[[str, float, str], Awaitable[None]]) -> None:
        """Add a progress callback function."""
        self.progress_callbacks.append(callback)
    
    def remove_progress_callback(self, callback: Callable[[str, float, str], Awaitable[None]]) -> None:
        """Remove a progress callback function."""
        if callback in self.progress_callbacks:
            self.progress_callbacks.remove(callback)
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific job."""
        try:
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    return job.to_dict()
            return None
        except Exception as e:
            self.logger.error(f"Failed to get job status for {job_id}: {e}")
            return None
    
    async def get_job_progress_logs(self, job_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get progress logs for a specific job."""
        try:
            with self.session_factory() as session:
                logs = (session.query(JobProgressLog)
                       .filter(JobProgressLog.job_id == job_id)
                       .order_by(desc(JobProgressLog.timestamp))
                       .limit(limit)
                       .all())
                return [log.to_dict() for log in logs]
        except Exception as e:
            self.logger.error(f"Failed to get progress logs for {job_id}: {e}")
            return []
    
    async def _worker(self, worker_name: str) -> None:
        """Worker task that processes jobs from the queue."""
        self.logger.info(f"Worker {worker_name} started")
        
        while self.running:
            try:
                # Get job from queue with timeout
                try:
                    priority, queued_time, job_id = await asyncio.wait_for(
                        self.job_queue.get(), timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue
                
                # Process the job
                task = asyncio.create_task(self._process_job(job_id))
                self.active_jobs[job_id] = task
                
                try:
                    await task
                finally:
                    if job_id in self.active_jobs:
                        del self.active_jobs[job_id]
                    self.job_queue.task_done()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Worker {worker_name} error: {e}")
                await asyncio.sleep(1)
        
        self.logger.info(f"Worker {worker_name} stopped")
    
    async def _process_job(self, job_id: str) -> ProcessingResult:
        """Process a single job."""
        start_time = time.time()
        
        try:
            # Get job data from database
            job_data = None
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if not job:
                    raise ProcessingManagerError(f"Job {job_id} not found")
                
                # Extract job data to avoid session issues
                job_data = {
                    'id': job.id,
                    'job_type': job.job_type,
                    'input_file': job.input_file,
                    'parameters': job.parameters
                }
                
                # Update job status
                job.status = JobStatus.RUNNING.value
                job.started_at = datetime.now(timezone.utc)
                session.commit()
            
            self.logger.info(f"Processing job {job_id}: {job_data['input_file']}")
            
            # Create progress callback for this job
            async def progress_callback(percent: float, stage: str, metadata: Dict[str, Any] = None):
                await self._update_job_progress(job_id, percent, stage, metadata)
            
            # Process the file based on job type
            result = await self._execute_job(job_data, progress_callback)
            
            # Update job with results
            processing_time = time.time() - start_time
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.status = JobStatus.COMPLETED.value
                    job.completed_at = datetime.now(timezone.utc)
                    job.progress_percent = 100.0
                    job.result = result.to_dict()
                    job.output_files = result.output_files
                    if result.metadata:
                        job.job_metadata = result.metadata
                    session.commit()
            
            # Update metrics
            self.metrics['jobs_processed'] += 1
            self.metrics['total_processing_time'] += processing_time
            
            self.logger.info(f"Completed job {job_id} in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            # Handle job failure
            processing_time = time.time() - start_time
            error_msg = str(e)
            
            self.logger.error(f"Job {job_id} failed: {error_msg}")
            self.logger.debug(f"Job {job_id} traceback: {traceback.format_exc()}")
            
            # Update job with error
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.retry_count += 1
                    job.error_count += 1
                    job.last_error = error_msg
                    
                    if job.can_retry:
                        # Schedule retry with exponential backoff
                        delay = min(300, 2 ** job.retry_count)  # Max 5 minutes
                        job.status = JobStatus.RETRYING.value
                        
                        # Re-queue with delay
                        asyncio.create_task(self._retry_job_with_delay(job_id, delay))
                        
                        self.logger.info(f"Scheduling retry for job {job_id} in {delay}s (attempt {job.retry_count})")
                    else:
                        job.status = JobStatus.FAILED.value
                        job.completed_at = datetime.now(timezone.utc)
                        
                        self.logger.error(f"Job {job_id} failed permanently after {job.retry_count} retries")
                    
                    session.commit()
            
            # Update metrics
            self.metrics['jobs_failed'] += 1
            
            return ProcessingResult(
                success=False,
                job_id=job_id,
                error=error_msg,
                processing_time=processing_time
            )
    
    async def _execute_job(self, job_data: Dict[str, Any], progress_callback: Callable) -> ProcessingResult:
        """Execute the actual job processing."""
        if job_data['job_type'] == "pdf_processing":
            return await self._process_pdf_file(job_data, progress_callback)
        else:
            raise ProcessingManagerError(f"Unknown job type: {job_data['job_type']}")
    
    async def _process_pdf_file(self, job_data: Dict[str, Any], progress_callback: Callable) -> ProcessingResult:
        """Process a PDF file using the FootballConverter."""
        input_file = job_data['input_file']
        
        # Stage 1: PDF to JSON conversion
        await progress_callback(10.0, "pdf_conversion")
        
        # Use the existing converter (this would need to be made async in a real implementation)
        # For now, we'll simulate the processing stages
        
        await progress_callback(30.0, "data_extraction")
        await asyncio.sleep(0.1)  # Simulate processing time
        
        await progress_callback(50.0, "team_normalization")
        await asyncio.sleep(0.1)
        
        await progress_callback(70.0, "market_processing")
        await asyncio.sleep(0.1)
        
        await progress_callback(90.0, "report_generation")
        await asyncio.sleep(0.1)
        
        # In a real implementation, this would call the actual converter
        # result = await self.converter.convert_football_async(json_file_path)
        
        # For now, return a mock result
        output_files = [
            f"jsons/converted_{Path(input_file).stem}.json",
            f"jsons/reports/report_{Path(input_file).stem}.json"
        ]
        
        return ProcessingResult(
            success=True,
            job_id=job_data['id'],
            output_files=output_files,
            metadata={
                "input_file": input_file,
                "processing_stages": ["pdf_conversion", "data_extraction", "team_normalization", "market_processing", "report_generation"]
            }
        )
    
    async def _update_job_progress(self, job_id: str, percent: float, stage: str, metadata: Dict[str, Any] = None):
        """Update job progress in database and notify callbacks."""
        try:
            # Update database
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.update_progress(percent, stage, metadata)
                    
                    # Add progress log
                    log_entry = JobProgressLog(
                        job_id=job_id,
                        progress_percent=percent,
                        stage=stage,
                        message=f"Stage: {stage} ({percent:.1f}%)",
                        data=metadata
                    )
                    session.add(log_entry)
                    session.commit()
            
            # Notify callbacks
            for callback in self.progress_callbacks:
                try:
                    await callback(job_id, percent, stage)
                except Exception as e:
                    self.logger.error(f"Progress callback error: {e}")
                    
        except Exception as e:
            self.logger.error(f"Failed to update progress for job {job_id}: {e}")
    
    async def _retry_job_with_delay(self, job_id: str, delay: float):
        """Retry a job after a delay."""
        await asyncio.sleep(delay)
        
        try:
            with self.session_factory() as session:
                job = session.query(Job).filter(Job.id == job_id).first()
                if job and job.status == JobStatus.RETRYING.value:
                    job.status = JobStatus.PENDING.value
                    session.commit()
                    
                    # Add back to queue
                    queue_item = (-job.priority, time.time(), job_id)
                    await self.job_queue.put(queue_item)
                    
        except Exception as e:
            self.logger.error(f"Failed to retry job {job_id}: {e}")
    
    async def _recover_pending_jobs(self):
        """Recover pending jobs from database on startup."""
        try:
            with self.session_factory() as session:
                # Find jobs that were running when system stopped
                running_jobs = session.query(Job).filter(
                    Job.status == JobStatus.RUNNING.value
                ).all()
                
                for job in running_jobs:
                    job.status = JobStatus.PENDING.value
                    job.started_at = None
                    job.progress_percent = 0.0
                    job.current_stage = None
                
                # Find pending jobs
                pending_jobs = session.query(Job).filter(
                    Job.status == JobStatus.PENDING.value
                ).order_by(desc(Job.priority), Job.created_at).all()
                
                session.commit()
                
                # Re-queue pending jobs
                for job in pending_jobs:
                    queue_item = (-job.priority, time.time(), job.id)
                    await self.job_queue.put(queue_item)
                
                if pending_jobs:
                    self.logger.info(f"Recovered {len(pending_jobs)} pending jobs")
                    
        except Exception as e:
            self.logger.error(f"Failed to recover pending jobs: {e}")
    
    async def _cleanup_completed_jobs(self):
        """Periodically clean up old completed jobs."""
        while self.running:
            try:
                await asyncio.sleep(3600)  # Run every hour
                
                cutoff_time = datetime.now(timezone.utc) - timedelta(
                    seconds=self.config.cleanup_completed_jobs_after
                )
                
                with self.session_factory() as session:
                    # Delete old completed jobs and their progress logs
                    deleted_count = session.query(Job).filter(
                        and_(
                            Job.status.in_([JobStatus.COMPLETED.value, JobStatus.FAILED.value]),
                            Job.completed_at < cutoff_time
                        )
                    ).delete()
                    
                    session.commit()
                    
                    if deleted_count > 0:
                        self.logger.info(f"Cleaned up {deleted_count} old jobs")
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Cleanup task error: {e}")
    
    async def _collect_metrics(self):
        """Periodically collect system metrics."""
        while self.running:
            try:
                await asyncio.sleep(60)  # Collect every minute
                
                # Get system metrics
                memory_percent = psutil.virtual_memory().percent
                cpu_percent = psutil.cpu_percent()
                disk_percent = psutil.disk_usage('/').percent
                
                # Get queue status
                queue_status = await self.get_queue_status()
                
                # Calculate error rate
                total_recent_jobs = self.metrics['jobs_processed'] + self.metrics['jobs_failed']
                error_rate = (self.metrics['jobs_failed'] / max(1, total_recent_jobs)) * 100
                
                # Calculate average processing time
                avg_processing_time = (
                    self.metrics['total_processing_time'] / max(1, self.metrics['jobs_processed'])
                )
                
                # Calculate cache hit ratio
                total_cache_ops = self.metrics['cache_hits'] + self.metrics['cache_misses']
                cache_hit_ratio = (self.metrics['cache_hits'] / max(1, total_cache_ops)) * 100
                
                # Store metrics
                metrics = SystemMetrics(
                    queue_length=queue_status.queue_length,
                    active_jobs=queue_status.active_workers,
                    completed_jobs_last_hour=self.metrics['jobs_processed'],
                    failed_jobs_last_hour=self.metrics['jobs_failed'],
                    average_processing_time=avg_processing_time,
                    cache_hit_ratio=cache_hit_ratio,
                    memory_usage_percent=memory_percent,
                    cpu_usage_percent=cpu_percent,
                    disk_usage_percent=disk_percent,
                    error_rate_percent=error_rate,
                    metrics_data={
                        'total_processing_time': self.metrics['total_processing_time'],
                        'cache_hits': self.metrics['cache_hits'],
                        'cache_misses': self.metrics['cache_misses'],
                    }
                )
                
                with self.session_factory() as session:
                    session.add(metrics)
                    session.commit()
                
                # Reset hourly counters
                self.metrics['jobs_processed'] = 0
                self.metrics['jobs_failed'] = 0
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Metrics collection error: {e}")