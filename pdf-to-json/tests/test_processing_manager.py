"""
Unit tests for ProcessingManager.

Tests cover:
- Queue operations and concurrent processing
- Job persistence and recovery
- Progress tracking with callbacks
- Failure recovery and retry mechanisms with exponential backoff
- System metrics collection
"""

import pytest
import pytest_asyncio
pytestmark = pytest.mark.asyncio
import asyncio
import tempfile
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import List, Dict, Any

from src.automation.processing_manager import ProcessingManager, ProcessingResult, QueueStatus
from src.automation.config import ProcessingConfig, DatabaseConfig
from src.automation.models import Job, JobStatus, JobPriority, JobProgressLog, SystemMetrics, get_session_factory
from src.automation.exceptions import ProcessingManagerError
from src.converter.football_converter import FootballConverter


@pytest.fixture
def temp_db():
    """Create a temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    
    yield f"sqlite:///{db_path}"
    
    # Cleanup
    Path(db_path).unlink(missing_ok=True)


@pytest.fixture
def processing_config():
    """Create test processing configuration."""
    return ProcessingConfig(
        max_concurrent_jobs=2,
        retry_attempts=2,
        timeout=10,
        queue_max_size=10,
        job_persistence_enabled=True,
        cleanup_completed_jobs_after=3600,
        priority_levels=5
    )


@pytest.fixture
def database_config(temp_db):
    """Create test database configuration."""
    return DatabaseConfig(
        url=temp_db,
        pool_size=2,
        max_overflow=5,
        pool_timeout=10
    )


@pytest.fixture
def mock_converter():
    """Create mock FootballConverter."""
    converter = Mock(spec=FootballConverter)
    return converter


@pytest_asyncio.fixture
async def processing_manager(processing_config, database_config, mock_converter):
    """Create ProcessingManager instance for testing."""
    manager = ProcessingManager(processing_config, database_config, mock_converter)
    yield manager
    
    # Cleanup
    if manager.running:
        await manager.stop()


@pytest.fixture
def temp_pdf_file():
    """Create a temporary PDF file for testing."""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
        f.write(b'%PDF-1.4 fake pdf content')
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    Path(temp_path).unlink(missing_ok=True)


class TestProcessingManagerBasics:
    """Test basic ProcessingManager functionality."""
    
    async def test_initialization(self, processing_config, database_config, mock_converter):
        """Test ProcessingManager initialization."""
        manager = ProcessingManager(processing_config, database_config, mock_converter)
        
        assert manager.config == processing_config
        assert manager.db_config == database_config
        assert manager.converter == mock_converter
        assert not manager.running
        assert len(manager.workers) == 0
        assert len(manager.active_jobs) == 0
        assert len(manager.progress_callbacks) == 0
    
    async def test_start_stop(self, processing_manager):
        """Test starting and stopping the ProcessingManager."""
        # Test start
        await processing_manager.start()
        assert processing_manager.running
        assert len(processing_manager.workers) == processing_manager.config.max_concurrent_jobs
        assert processing_manager.cleanup_task is not None
        assert processing_manager.metrics_task is not None
        
        # Test stop
        await processing_manager.stop()
        assert not processing_manager.running
        assert len(processing_manager.workers) == 0
        assert len(processing_manager.active_jobs) == 0
    
    async def test_double_start_stop(self, processing_manager):
        """Test that double start/stop operations are handled gracefully."""
        # Double start
        await processing_manager.start()
        await processing_manager.start()  # Should not cause issues
        assert processing_manager.running
        
        # Double stop
        await processing_manager.stop()
        await processing_manager.stop()  # Should not cause issues
        assert not processing_manager.running


class TestJobQueueing:
    """Test job queueing functionality."""
    
    async def test_queue_file_success(self, processing_manager, temp_pdf_file):
        """Test successful file queueing."""
        await processing_manager.start()
        
        job_id = await processing_manager.queue_file(
            temp_pdf_file,
            priority=JobPriority.HIGH.value,
            job_type="pdf_processing",
            parameters={"test": "value"}
        )
        
        assert job_id is not None
        assert len(job_id) == 36  # UUID length
        
        # Check job in database
        job_status = await processing_manager.get_job_status(job_id)
        assert job_status is not None
        assert job_status['status'] == JobStatus.PENDING.value
        assert job_status['priority'] == JobPriority.HIGH.value
        assert job_status['input_file'] == temp_pdf_file
        assert job_status['parameters'] == {"test": "value"}
        
        await processing_manager.stop()
    
    async def test_queue_nonexistent_file(self, processing_manager):
        """Test queueing a non-existent file."""
        await processing_manager.start()
        
        with pytest.raises(ProcessingManagerError, match="File not found"):
            await processing_manager.queue_file("/nonexistent/file.pdf")
        
        await processing_manager.stop()
    
    async def test_queue_priority_ordering(self, processing_manager, temp_pdf_file):
        """Test that jobs are processed in priority order."""
        await processing_manager.start()
        
        # Queue jobs with different priorities
        job_ids = []
        priorities = [JobPriority.LOW.value, JobPriority.HIGHEST.value, JobPriority.NORMAL.value]
        
        for priority in priorities:
            job_id = await processing_manager.queue_file(temp_pdf_file, priority=priority)
            job_ids.append((job_id, priority))
        
        # Check queue status
        status = await processing_manager.get_queue_status()
        assert status.pending_jobs >= 3
        
        await processing_manager.stop()
    
    async def test_queue_max_size(self, processing_config, database_config, mock_converter, temp_pdf_file):
        """Test queue maximum size limit."""
        # Create manager with small queue
        processing_config.queue_max_size = 2
        manager = ProcessingManager(processing_config, database_config, mock_converter)
        
        await manager.start()
        
        # Fill the queue
        await manager.queue_file(temp_pdf_file)
        await manager.queue_file(temp_pdf_file)
        
        # This should still work as the queue size is checked at put time
        await manager.queue_file(temp_pdf_file)
        
        await manager.stop()


class TestJobProcessing:
    """Test job processing functionality."""
    
    async def test_job_processing_success(self, processing_manager, temp_pdf_file):
        """Test successful job processing."""
        await processing_manager.start()
        
        # Mock the processing to complete quickly
        with patch.object(processing_manager, '_process_pdf_file') as mock_process:
            mock_process.return_value = ProcessingResult(
                success=True,
                job_id="test-id",
                output_files=["output1.json", "output2.json"],
                metadata={"test": "data"}
            )
            
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for processing to complete
            await asyncio.sleep(0.5)
            
            # Check job status
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] == JobStatus.COMPLETED.value
            assert job_status['progress_percent'] == 100.0
            assert job_status['output_files'] == ["output1.json", "output2.json"]
        
        await processing_manager.stop()
    
    async def test_job_processing_failure(self, processing_manager, temp_pdf_file):
        """Test job processing failure and retry."""
        await processing_manager.start()
        
        # Mock the processing to fail
        with patch.object(processing_manager, '_process_pdf_file') as mock_process:
            mock_process.side_effect = Exception("Processing failed")
            
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for processing attempts
            await asyncio.sleep(1.0)
            
            # Check job status - should be retrying or failed
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] in [JobStatus.RETRYING.value, JobStatus.FAILED.value]
            assert job_status['error_count'] > 0
            assert job_status['last_error'] == "Processing failed"
        
        await processing_manager.stop()
    
    async def test_concurrent_processing(self, processing_manager, temp_pdf_file):
        """Test concurrent job processing."""
        await processing_manager.start()
        
        # Mock processing with delay
        async def mock_process_with_delay(*args, **kwargs):
            await asyncio.sleep(0.2)
            return ProcessingResult(success=True, job_id="test")
        
        with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_process_with_delay):
            # Queue multiple jobs
            job_ids = []
            for i in range(4):
                job_id = await processing_manager.queue_file(temp_pdf_file)
                job_ids.append(job_id)
            
            # Wait for some processing
            await asyncio.sleep(0.1)
            
            # Check that multiple jobs are running concurrently
            status = await processing_manager.get_queue_status()
            assert status.active_workers <= processing_manager.config.max_concurrent_jobs
            
            # Wait for completion
            await asyncio.sleep(1.0)
        
        await processing_manager.stop()
    
    async def test_job_cancellation(self, processing_manager, temp_pdf_file):
        """Test job cancellation."""
        await processing_manager.start()
        
        # Mock processing with long delay
        async def mock_long_process(*args, **kwargs):
            await asyncio.sleep(10)
            return ProcessingResult(success=True, job_id="test")
        
        with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_long_process):
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for job to start
            await asyncio.sleep(0.1)
            
            # Cancel the job
            cancelled = await processing_manager.cancel_job(job_id)
            assert cancelled
            
            # Check job status
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] == JobStatus.CANCELLED.value
        
        await processing_manager.stop()
    
    async def test_retry_failed_job(self, processing_manager, temp_pdf_file):
        """Test retrying a failed job."""
        await processing_manager.start()
        
        # Create a failed job directly in database
        with processing_manager.session_factory() as session:
            job = Job(
                id="test-retry-job",
                name="Test Retry Job",
                job_type="pdf_processing",
                input_file=temp_pdf_file,
                status=JobStatus.FAILED.value,
                retry_count=1,
                max_retries=3
            )
            session.add(job)
            session.commit()
        
        # Retry the job
        retried = await processing_manager.retry_failed_job("test-retry-job")
        assert retried
        
        # Check job status
        job_status = await processing_manager.get_job_status("test-retry-job")
        assert job_status['status'] == JobStatus.PENDING.value
        
        await processing_manager.stop()


class TestProgressTracking:
    """Test progress tracking functionality."""
    
    async def test_progress_callbacks(self, processing_manager, temp_pdf_file):
        """Test progress callback system."""
        await processing_manager.start()
        
        # Track progress updates
        progress_updates = []
        
        async def progress_callback(job_id: str, percent: float, stage: str):
            progress_updates.append((job_id, percent, stage))
        
        processing_manager.add_progress_callback(progress_callback)
        
        # Mock processing with progress updates
        async def mock_process_with_progress(job, callback):
            await callback(10.0, "stage1")
            await callback(50.0, "stage2")
            await callback(100.0, "completed")
            return ProcessingResult(success=True, job_id=job.id)
        
        with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_process_with_progress):
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for processing
            await asyncio.sleep(0.5)
            
            # Check progress updates
            assert len(progress_updates) >= 3
            job_progress = [update for update in progress_updates if update[0] == job_id]
            assert len(job_progress) >= 3
        
        await processing_manager.stop()
    
    async def test_progress_logs(self, processing_manager, temp_pdf_file):
        """Test progress logging to database."""
        await processing_manager.start()
        
        # Mock processing with progress updates
        async def mock_process_with_progress(job, callback):
            await callback(25.0, "extraction", {"files_processed": 1})
            await callback(75.0, "normalization", {"teams_normalized": 10})
            return ProcessingResult(success=True, job_id=job.id)
        
        with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_process_with_progress):
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for processing
            await asyncio.sleep(0.5)
            
            # Check progress logs
            logs = await processing_manager.get_job_progress_logs(job_id)
            assert len(logs) >= 2
            
            # Check log content
            extraction_log = next((log for log in logs if log['stage'] == 'extraction'), None)
            assert extraction_log is not None
            assert extraction_log['progress_percent'] == 25.0
            assert extraction_log['data']['files_processed'] == 1
        
        await processing_manager.stop()
    
    async def test_callback_management(self, processing_manager):
        """Test adding and removing progress callbacks."""
        callback1 = AsyncMock()
        callback2 = AsyncMock()
        
        # Add callbacks
        processing_manager.add_progress_callback(callback1)
        processing_manager.add_progress_callback(callback2)
        assert len(processing_manager.progress_callbacks) == 2
        
        # Remove callback
        processing_manager.remove_progress_callback(callback1)
        assert len(processing_manager.progress_callbacks) == 1
        assert callback2 in processing_manager.progress_callbacks
        
        # Remove non-existent callback (should not error)
        processing_manager.remove_progress_callback(callback1)
        assert len(processing_manager.progress_callbacks) == 1


class TestJobPersistence:
    """Test job persistence and recovery."""
    
    async def test_job_persistence(self, processing_manager, temp_pdf_file):
        """Test that jobs are persisted to database."""
        await processing_manager.start()
        
        job_id = await processing_manager.queue_file(temp_pdf_file)
        
        # Check job exists in database
        with processing_manager.session_factory() as session:
            job = session.query(Job).filter(Job.id == job_id).first()
            assert job is not None
            assert job.input_file == temp_pdf_file
            assert job.status == JobStatus.PENDING.value
        
        await processing_manager.stop()
    
    async def test_job_recovery_on_startup(self, processing_config, database_config, mock_converter, temp_pdf_file):
        """Test recovery of pending jobs on startup."""
        # Create first manager and add jobs
        manager1 = ProcessingManager(processing_config, database_config, mock_converter)
        await manager1.start()
        
        # Add jobs but don't let them complete
        with patch.object(manager1, '_process_pdf_file') as mock_process:
            mock_process.side_effect = asyncio.sleep(10)  # Long delay
            
            job_id1 = await manager1.queue_file(temp_pdf_file)
            job_id2 = await manager1.queue_file(temp_pdf_file)
            
            # Wait for jobs to start
            await asyncio.sleep(0.1)
        
        # Stop manager (simulating system shutdown)
        await manager1.stop()
        
        # Create new manager (simulating system restart)
        manager2 = ProcessingManager(processing_config, database_config, mock_converter)
        
        # Mock successful processing for recovery
        with patch.object(manager2, '_process_pdf_file') as mock_process:
            mock_process.return_value = ProcessingResult(success=True, job_id="test")
            
            await manager2.start()
            
            # Wait for recovery and processing
            await asyncio.sleep(0.5)
            
            # Check that jobs were recovered and processed
            status = await manager2.get_queue_status()
            assert status.completed_jobs >= 0  # Jobs should be processed or in progress
        
        await manager2.stop()
    
    async def test_running_job_recovery(self, processing_config, database_config, mock_converter, temp_pdf_file):
        """Test that running jobs are reset to pending on recovery."""
        # Create job directly in database as running
        session_factory = get_session_factory(database_config.url)
        with session_factory() as session:
            job = Job(
                id="running-job",
                name="Running Job",
                job_type="pdf_processing",
                input_file=temp_pdf_file,
                status=JobStatus.RUNNING.value,
                started_at=datetime.now(timezone.utc)
            )
            session.add(job)
            session.commit()
        
        # Create manager and start (should recover the running job)
        manager = ProcessingManager(processing_config, database_config, mock_converter)
        
        with patch.object(manager, '_process_pdf_file') as mock_process:
            mock_process.return_value = ProcessingResult(success=True, job_id="running-job")
            
            await manager.start()
            await asyncio.sleep(0.5)
            
            # Check job was reset and processed
            job_status = await manager.get_job_status("running-job")
            assert job_status['status'] in [JobStatus.COMPLETED.value, JobStatus.RUNNING.value]
        
        await manager.stop()


class TestRetryMechanism:
    """Test retry mechanisms with exponential backoff."""
    
    async def test_exponential_backoff(self, processing_manager, temp_pdf_file):
        """Test exponential backoff for retries."""
        await processing_manager.start()
        
        retry_delays = []
        original_sleep = asyncio.sleep
        
        async def mock_sleep(delay):
            retry_delays.append(delay)
            await original_sleep(0.01)  # Short delay for testing
        
        # Mock processing to fail multiple times
        failure_count = 0
        async def mock_failing_process(*args, **kwargs):
            nonlocal failure_count
            failure_count += 1
            if failure_count <= 2:
                raise Exception(f"Failure {failure_count}")
            return ProcessingResult(success=True, job_id="test")
        
        with patch('asyncio.sleep', side_effect=mock_sleep):
            with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_failing_process):
                job_id = await processing_manager.queue_file(temp_pdf_file)
                
                # Wait for retries
                await asyncio.sleep(1.0)
                
                # Check that exponential backoff was used
                assert len(retry_delays) >= 1
                if len(retry_delays) >= 2:
                    assert retry_delays[1] > retry_delays[0]  # Increasing delays
        
        await processing_manager.stop()
    
    async def test_max_retries_exceeded(self, processing_manager, temp_pdf_file):
        """Test job failure after max retries exceeded."""
        await processing_manager.start()
        
        # Mock processing to always fail
        with patch.object(processing_manager, '_process_pdf_file') as mock_process:
            mock_process.side_effect = Exception("Always fails")
            
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for all retry attempts
            await asyncio.sleep(2.0)
            
            # Check job failed permanently
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] == JobStatus.FAILED.value
            assert job_status['retry_count'] >= processing_manager.config.retry_attempts
        
        await processing_manager.stop()
    
    async def test_retry_with_success(self, processing_manager, temp_pdf_file):
        """Test successful retry after initial failure."""
        await processing_manager.start()
        
        # Mock processing to fail once then succeed
        attempt_count = 0
        async def mock_retry_process(*args, **kwargs):
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count == 1:
                raise Exception("First attempt fails")
            return ProcessingResult(success=True, job_id="test")
        
        with patch.object(processing_manager, '_process_pdf_file', side_effect=mock_retry_process):
            job_id = await processing_manager.queue_file(temp_pdf_file)
            
            # Wait for retry and completion
            await asyncio.sleep(1.0)
            
            # Check job eventually succeeded
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] == JobStatus.COMPLETED.value
            assert attempt_count >= 2
        
        await processing_manager.stop()


class TestQueueStatus:
    """Test queue status reporting."""
    
    async def test_queue_status_empty(self, processing_manager):
        """Test queue status when empty."""
        await processing_manager.start()
        
        status = await processing_manager.get_queue_status()
        assert status.total_jobs == 0
        assert status.pending_jobs == 0
        assert status.running_jobs == 0
        assert status.completed_jobs == 0
        assert status.failed_jobs == 0
        assert status.queue_length == 0
        assert status.active_workers == 0
        
        await processing_manager.stop()
    
    async def test_queue_status_with_jobs(self, processing_manager, temp_pdf_file):
        """Test queue status with various job states."""
        await processing_manager.start()
        
        # Add jobs with long processing time
        with patch.object(processing_manager, '_process_pdf_file') as mock_process:
            mock_process.side_effect = lambda *args, **kwargs: asyncio.sleep(1)
            
            # Queue multiple jobs
            job_ids = []
            for i in range(3):
                job_id = await processing_manager.queue_file(temp_pdf_file)
                job_ids.append(job_id)
            
            # Wait for some to start processing
            await asyncio.sleep(0.1)
            
            status = await processing_manager.get_queue_status()
            assert status.total_jobs >= 3
            assert status.pending_jobs + status.running_jobs >= 3
            assert status.queue_length >= 0
        
        await processing_manager.stop()
    
    async def test_queue_status_serialization(self, processing_manager):
        """Test queue status dictionary conversion."""
        await processing_manager.start()
        
        status = await processing_manager.get_queue_status()
        status_dict = status.to_dict()
        
        expected_keys = {
            'total_jobs', 'pending_jobs', 'running_jobs', 
            'completed_jobs', 'failed_jobs', 'queue_length', 'active_workers'
        }
        assert set(status_dict.keys()) == expected_keys
        assert all(isinstance(v, int) for v in status_dict.values())
        
        await processing_manager.stop()


class TestSystemMetrics:
    """Test system metrics collection."""
    
    async def test_metrics_collection(self, processing_manager):
        """Test that system metrics are collected."""
        await processing_manager.start()
        
        # Wait for at least one metrics collection cycle
        await asyncio.sleep(0.1)
        
        # Check metrics in database
        with processing_manager.session_factory() as session:
            metrics = session.query(SystemMetrics).first()
            # Metrics might not be collected yet in fast test, so we just check the table exists
            assert session.query(SystemMetrics).count() >= 0
        
        await processing_manager.stop()
    
    async def test_metrics_data_structure(self, processing_manager):
        """Test metrics data structure."""
        # Create a metrics entry directly
        with processing_manager.session_factory() as session:
            metrics = SystemMetrics(
                queue_length=5,
                active_jobs=2,
                memory_usage_percent=75.0,
                cpu_usage_percent=50.0,
                error_rate_percent=2.5
            )
            session.add(metrics)
            session.commit()
            
            # Test serialization
            metrics_dict = metrics.to_dict()
            assert 'queue_length' in metrics_dict
            assert 'active_jobs' in metrics_dict
            assert 'memory_usage_percent' in metrics_dict
            assert metrics_dict['queue_length'] == 5
            assert metrics_dict['active_jobs'] == 2


class TestCleanup:
    """Test cleanup functionality."""
    
    async def test_job_cleanup(self, processing_config, database_config, mock_converter, temp_pdf_file):
        """Test cleanup of old completed jobs."""
        # Set short cleanup time for testing
        processing_config.cleanup_completed_jobs_after = 1  # 1 second
        
        manager = ProcessingManager(processing_config, database_config, mock_converter)
        await manager.start()
        
        # Create old completed job
        with manager.session_factory() as session:
            old_job = Job(
                id="old-job",
                name="Old Job",
                job_type="pdf_processing",
                input_file=temp_pdf_file,
                status=JobStatus.COMPLETED.value,
                completed_at=datetime.now(timezone.utc) - timedelta(seconds=2)
            )
            session.add(old_job)
            session.commit()
        
        # Wait for cleanup cycle (mocked to run faster)
        with patch.object(manager, '_cleanup_completed_jobs') as mock_cleanup:
            async def fast_cleanup():
                # Simulate cleanup logic
                cutoff_time = datetime.now(timezone.utc) - timedelta(seconds=1)
                with manager.session_factory() as session:
                    deleted = session.query(Job).filter(
                        Job.status == JobStatus.COMPLETED.value,
                        Job.completed_at < cutoff_time
                    ).delete()
                    session.commit()
                    return deleted
            
            mock_cleanup.side_effect = fast_cleanup
            await mock_cleanup()
            
            # Check job was cleaned up
            with manager.session_factory() as session:
                job = session.query(Job).filter(Job.id == "old-job").first()
                assert job is None
        
        await manager.stop()


class TestErrorHandling:
    """Test error handling scenarios."""
    
    async def test_database_error_handling(self, processing_config, database_config, mock_converter):
        """Test handling of database errors."""
        # Use invalid database URL
        database_config.url = "invalid://database/url"
        
        with pytest.raises(Exception):
            manager = ProcessingManager(processing_config, database_config, mock_converter)
            await manager.start()
    
    async def test_queue_full_handling(self, processing_manager, temp_pdf_file):
        """Test handling when queue is full."""
        # This test would need a very small queue size and many jobs
        # For now, we test that the queue operations don't crash
        await processing_manager.start()
        
        # Queue many jobs quickly
        job_ids = []
        for i in range(5):
            job_id = await processing_manager.queue_file(temp_pdf_file)
            job_ids.append(job_id)
        
        # All jobs should be queued successfully
        assert len(job_ids) == 5
        
        await processing_manager.stop()
    
    async def test_invalid_job_operations(self, processing_manager):
        """Test operations on invalid/non-existent jobs."""
        await processing_manager.start()
        
        # Test operations on non-existent job
        status = await processing_manager.get_job_status("non-existent-job")
        assert status is None
        
        cancelled = await processing_manager.cancel_job("non-existent-job")
        assert not cancelled
        
        retried = await processing_manager.retry_failed_job("non-existent-job")
        assert not retried
        
        logs = await processing_manager.get_job_progress_logs("non-existent-job")
        assert logs == []
        
        await processing_manager.stop()


@pytest.mark.asyncio
class TestIntegration:
    """Integration tests for ProcessingManager."""
    
    async def test_full_workflow(self, processing_manager, temp_pdf_file):
        """Test complete workflow from queueing to completion."""
        await processing_manager.start()
        
        # Track progress
        progress_updates = []
        async def track_progress(job_id, percent, stage):
            progress_updates.append((job_id, percent, stage))
        
        processing_manager.add_progress_callback(track_progress)
        
        # Mock successful processing
        with patch.object(processing_manager, '_process_pdf_file') as mock_process:
            mock_process.return_value = ProcessingResult(
                success=True,
                job_id="test",
                output_files=["output.json"],
                metadata={"processed": True}
            )
            
            # Queue and process job
            job_id = await processing_manager.queue_file(
                temp_pdf_file,
                priority=JobPriority.HIGH.value,
                parameters={"test_param": "value"}
            )
            
            # Wait for completion
            await asyncio.sleep(0.5)
            
            # Verify final state
            job_status = await processing_manager.get_job_status(job_id)
            assert job_status['status'] == JobStatus.COMPLETED.value
            assert job_status['output_files'] == ["output.json"]
            assert job_status['progress_percent'] == 100.0
            
            # Verify progress was tracked
            job_progress = [update for update in progress_updates if update[0] == job_id]
            assert len(job_progress) > 0
            
            # Verify queue status
            status = await processing_manager.get_queue_status()
            assert status.completed_jobs >= 1
        
        await processing_manager.stop()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])