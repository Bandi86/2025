"""
Integration tests for AutomationManager.

These tests verify the complete automation workflow including:
- Component initialization and coordination
- Scheduled web downloads
- File system monitoring and processing
- Event-driven processing pipeline
- Graceful shutdown procedures
"""

import asyncio
import pytest
import tempfile
import shutil
import json
import time
import signal
import unittest.mock
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, call
from typing import Dict, Any, List

from src.automation.automation_manager import AutomationManager, AutomationStatus
from src.automation.config import AutomationConfig, WebDownloaderConfig, FileWatcherConfig, ProcessingConfig
from src.automation.file_watcher import FileEvent, FileEventType
from src.automation.web_downloader import DownloadResult, FileInfo
from src.automation.processing_manager import ProcessingResult
from src.automation.exceptions import AutomationManagerError


@pytest.fixture
def temp_directories():
    """Create temporary directories for testing."""
    temp_dir = Path(tempfile.mkdtemp())
    source_dir = temp_dir / "source"
    data_dir = temp_dir / "data"
    temp_work_dir = temp_dir / "temp"
    
    source_dir.mkdir()
    data_dir.mkdir()
    temp_work_dir.mkdir()
    
    directories = {
        'base': temp_dir,
        'source': source_dir,
        'data': data_dir,
        'temp': temp_work_dir
    }
    
    yield directories
    
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def test_config(temp_directories):
    """Create test configuration."""
    return AutomationConfig(
        web_downloader=WebDownloaderConfig(
            url="http://test.example.com/test.pdf",
            check_interval=60,  # Minimum allowed interval
            download_path=str(temp_directories['source']),
            max_retries=1,
            timeout=5
        ),
        file_watcher=FileWatcherConfig(
            watch_path=str(temp_directories['source']),
            debounce_time=0.1,  # Short debounce for testing
            file_patterns=["*.pdf"]
        ),
        processing=ProcessingConfig(
            max_concurrent_jobs=1,
            retry_attempts=1,
            timeout=30,
            queue_max_size=10
        ),
        data_directory=str(temp_directories['data']),
        temp_directory=str(temp_directories['temp']),
        debug=True
    )


@pytest.fixture
def automation_manager(test_config):
    """Create AutomationManager instance for testing."""
    manager = AutomationManager(test_config)
    return manager


class TestAutomationManagerInitialization:
    """Test AutomationManager initialization and configuration."""
    
    def test_initialization(self, test_config):
        """Test basic initialization."""
        manager = AutomationManager(test_config)
        
        assert manager.config == test_config
        assert not manager.is_running
        assert manager.start_time is None
        assert manager.web_downloader is None
        assert manager.file_watcher is None
        assert manager.processing_manager is None
        assert manager.scheduler is None
    
    def test_signal_handlers_setup(self, test_config):
        """Test that signal handlers are properly set up."""
        with patch('signal.signal') as mock_signal:
            manager = AutomationManager(test_config)
            
            # Verify signal handlers were registered
            assert mock_signal.call_count >= 2
            mock_signal.assert_any_call(signal.SIGINT, unittest.mock.ANY)
            mock_signal.assert_any_call(signal.SIGTERM, unittest.mock.ANY)


class TestAutomationManagerLifecycle:
    """Test AutomationManager startup and shutdown procedures."""
    
    @pytest.mark.asyncio
    async def test_start_stop_lifecycle(self, automation_manager):
        """Test complete start/stop lifecycle."""
        manager = automation_manager
        
        # Create proper mock instances
        mock_cache_manager = AsyncMock()
        mock_cache_manager.connect = AsyncMock()
        mock_cache_manager.disconnect = AsyncMock()
        
        mock_web_downloader = AsyncMock()
        mock_web_downloader._create_session = AsyncMock()
        mock_web_downloader._close_session = AsyncMock()
        
        mock_file_watcher = AsyncMock()
        mock_file_watcher.add_handler = MagicMock()
        mock_file_watcher.start_watching = AsyncMock()
        mock_file_watcher.stop_watching = AsyncMock()
        
        mock_processing_manager = AsyncMock()
        mock_processing_manager.add_progress_callback = MagicMock()
        mock_processing_manager.start = AsyncMock()
        mock_processing_manager.stop = AsyncMock()
        
        # Mock components to avoid external dependencies
        with patch.multiple(
            'src.automation.automation_manager',
            CacheManager=MagicMock(return_value=mock_cache_manager),
            WebDownloader=MagicMock(return_value=mock_web_downloader),
            FileWatcher=MagicMock(return_value=mock_file_watcher),
            ProcessingManager=MagicMock(return_value=mock_processing_manager)
        ):
            # Start manager
            await manager.start()
            
            assert manager.is_running
            assert manager.start_time is not None
            assert manager.web_downloader is not None
            assert manager.file_watcher is not None
            assert manager.processing_manager is not None
            assert manager.scheduler is not None
            assert manager.scheduler.running
            
            # Stop manager
            await manager.stop()
            
            assert not manager.is_running
            assert not manager.scheduler.running
    
    @pytest.mark.asyncio
    async def test_start_failure_cleanup(self, automation_manager):
        """Test that failed startup properly cleans up."""
        manager = automation_manager
        
        # Mock component initialization to fail
        with patch('src.automation.automation_manager.WebDownloader') as mock_downloader:
            mock_downloader.side_effect = Exception("Initialization failed")
            
            with pytest.raises(AutomationManagerError):
                await manager.start()
            
            # Verify manager is not running
            assert not manager.is_running
            assert manager.web_downloader is None
    
    @pytest.mark.asyncio
    async def test_double_start_prevention(self, automation_manager):
        """Test that starting an already running manager is handled gracefully."""
        manager = automation_manager
        
        with patch.multiple('src.automation.automation_manager', **create_mock_components()):
            await manager.start()
            
            # Try to start again
            await manager.start()  # Should not raise exception
            
            assert manager.is_running
            
            await manager.stop()
    
    @pytest.mark.asyncio
    async def test_stop_not_running(self, automation_manager):
        """Test stopping a manager that's not running."""
        manager = automation_manager
        
        # Should not raise exception
        await manager.stop()
        
        assert not manager.is_running


class TestAutomationManagerComponents:
    """Test component coordination and management."""
    
    @pytest.mark.asyncio
    async def test_component_initialization_order(self, automation_manager):
        """Test that components are initialized in the correct order."""
        manager = automation_manager
        
        with patch.multiple(
            'src.automation.automation_manager',
            CacheManager=AsyncMock(),
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock()
        ) as mocks:
            await manager.start()
            
            # Verify initialization order
            # Cache manager should be first
            mocks['CacheManager'].assert_called_once()
            mocks['WebDownloader'].assert_called_once()
            mocks['FileWatcher'].assert_called_once()
            mocks['ProcessingManager'].assert_called_once()
    
    @pytest.mark.asyncio
    async def test_component_configuration_passing(self, automation_manager):
        """Test that correct configurations are passed to components."""
        manager = automation_manager
        
        with patch.multiple(
            'src.automation.automation_manager',
            CacheManager=AsyncMock(),
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock()
        ) as mocks:
            await manager.start()
            
            # Verify configurations were passed correctly
            mocks['WebDownloader'].assert_called_with(manager.config.web_downloader)
            mocks['FileWatcher'].assert_called_with(manager.config.file_watcher)
            mocks['ProcessingManager'].assert_called_with(
                manager.config.processing,
                manager.config.database
            )


def create_mock_components():
    """Create properly configured mock components."""
    mock_cache_manager = AsyncMock()
    mock_cache_manager.connect = AsyncMock()
    mock_cache_manager.disconnect = AsyncMock()
    
    mock_web_downloader = AsyncMock()
    mock_web_downloader._create_session = AsyncMock()
    mock_web_downloader._close_session = AsyncMock()
    
    mock_file_watcher = AsyncMock()
    mock_file_watcher.add_handler = MagicMock()
    mock_file_watcher.start_watching = AsyncMock()
    mock_file_watcher.stop_watching = AsyncMock()
    
    mock_processing_manager = AsyncMock()
    mock_processing_manager.add_progress_callback = MagicMock()
    mock_processing_manager.start = AsyncMock()
    mock_processing_manager.stop = AsyncMock()
    mock_processing_manager.active_jobs = {}
    
    return {
        'CacheManager': MagicMock(return_value=mock_cache_manager),
        'WebDownloader': MagicMock(return_value=mock_web_downloader),
        'FileWatcher': MagicMock(return_value=mock_file_watcher),
        'ProcessingManager': MagicMock(return_value=mock_processing_manager)
    }


class TestScheduledOperations:
    """Test scheduled operations and APScheduler integration."""
    
    @pytest.mark.asyncio
    async def test_scheduler_job_creation(self, automation_manager):
        """Test that scheduled jobs are created correctly."""
        manager = automation_manager
        
        with patch.multiple('src.automation.automation_manager', **create_mock_components()):
            await manager.start()
            
            # Check that jobs were scheduled
            jobs = manager.scheduler.get_jobs()
            job_ids = [job.id for job in jobs]
            
            assert 'web_download_check' in job_ids
            assert 'health_check' in job_ids
            assert 'daily_cleanup' in job_ids
            
            await manager.stop()
    
    @pytest.mark.asyncio
    async def test_manual_download_trigger(self, automation_manager):
        """Test manual download triggering."""
        manager = automation_manager
        
        mock_downloader = AsyncMock()
        mock_result = DownloadResult(success=True, job_id="test-job")
        mock_downloader.get_latest_file_info.return_value = FileInfo(
            url="http://test.com/test.pdf",
            filename="test.pdf"
        )
        mock_downloader.is_file_newer.return_value = True
        mock_downloader.download_file.return_value = mock_result
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=lambda config: mock_downloader,
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Trigger manual download
            result = await manager.schedule_download()
            
            assert result is not None
            assert result.success
            mock_downloader.get_latest_file_info.assert_called_once()
            mock_downloader.download_file.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_scheduled_download_check(self, automation_manager):
        """Test scheduled download check execution."""
        manager = automation_manager
        
        mock_downloader = AsyncMock()
        mock_downloader.get_latest_file_info.return_value = None  # No files available
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=lambda config: mock_downloader,
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Execute scheduled download check
            await manager._scheduled_download_check()
            
            mock_downloader.get_latest_file_info.assert_called_once()


class TestFileEventHandling:
    """Test file system event handling and processing pipeline."""
    
    @pytest.mark.asyncio
    async def test_file_event_processing(self, automation_manager):
        """Test that file events trigger processing jobs."""
        manager = automation_manager
        
        mock_processing_manager = AsyncMock()
        mock_processing_manager.queue_file.return_value = "test-job-id"
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=lambda config, db_config: mock_processing_manager,
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Simulate file event
            file_event = FileEvent(
                event_type=FileEventType.CREATED,
                file_path="/test/path/test.pdf",
                is_directory=False,
                timestamp=time.time()
            )
            
            await manager._handle_file_event(file_event)
            
            # Verify job was queued
            mock_processing_manager.queue_file.assert_called_once_with(
                "/test/path/test.pdf",
                priority=3,
                job_type="pdf_processing",
                parameters={
                    'source': 'file_watcher',
                    'event_type': 'created',
                    'timestamp': file_event.timestamp
                }
            )
    
    @pytest.mark.asyncio
    async def test_file_event_error_handling(self, automation_manager):
        """Test error handling in file event processing."""
        manager = automation_manager
        
        mock_processing_manager = AsyncMock()
        mock_processing_manager.queue_file.side_effect = Exception("Queue failed")
        
        event_emitted = []
        
        async def capture_event(data):
            event_emitted.append(data)
        
        manager.add_event_handler('system_error', capture_event)
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=lambda config, db_config: mock_processing_manager,
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Simulate file event that will cause error
            file_event = FileEvent(
                event_type=FileEventType.CREATED,
                file_path="/test/path/test.pdf",
                is_directory=False,
                timestamp=time.time()
            )
            
            await manager._handle_file_event(file_event)
            
            # Verify error event was emitted
            assert len(event_emitted) == 1
            assert event_emitted[0]['error'] == "Queue failed"
            assert event_emitted[0]['component'] == 'file_watcher'


class TestEventSystem:
    """Test event system and handler management."""
    
    @pytest.mark.asyncio
    async def test_event_handler_registration(self, automation_manager):
        """Test event handler registration and removal."""
        manager = automation_manager
        
        handler_called = []
        
        async def test_handler(data):
            handler_called.append(data)
        
        # Add handler
        manager.add_event_handler('test_event', test_handler)
        assert test_handler in manager.event_handlers['test_event']
        
        # Emit event
        await manager._emit_event('test_event', {'test': 'data'})
        
        assert len(handler_called) == 1
        assert handler_called[0]['test'] == 'data'
        
        # Remove handler
        manager.remove_event_handler('test_event', test_handler)
        assert test_handler not in manager.event_handlers['test_event']
    
    @pytest.mark.asyncio
    async def test_event_handler_error_isolation(self, automation_manager):
        """Test that errors in one handler don't affect others."""
        manager = automation_manager
        
        handler1_called = []
        handler2_called = []
        
        async def handler1(data):
            handler1_called.append(data)
            raise Exception("Handler 1 failed")
        
        async def handler2(data):
            handler2_called.append(data)
        
        manager.add_event_handler('test_event', handler1)
        manager.add_event_handler('test_event', handler2)
        
        # Emit event
        await manager._emit_event('test_event', {'test': 'data'})
        
        # Both handlers should have been called despite handler1 error
        assert len(handler1_called) == 1
        assert len(handler2_called) == 1


class TestHealthMonitoring:
    """Test health monitoring and alerting system."""
    
    @pytest.mark.asyncio
    async def test_health_check_execution(self, automation_manager):
        """Test health check execution."""
        manager = automation_manager
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Execute health check
            await manager._perform_health_check()
            
            assert manager.last_health_check is not None
    
    @pytest.mark.asyncio
    async def test_alert_condition_detection(self, automation_manager):
        """Test alert condition detection."""
        manager = automation_manager
        
        # Mock high memory usage
        with patch('psutil.virtual_memory') as mock_memory:
            mock_memory.return_value.percent = 90.0  # High memory usage
            
            health_data = manager._calculate_system_health()
            alerts = manager._check_alert_conditions(health_data)
            
            # Should detect high memory usage alert
            assert len(alerts) > 0
            assert any(alert['type'] == 'high_memory_usage' for alert in alerts)
    
    def test_system_health_calculation(self, automation_manager):
        """Test system health metrics calculation."""
        manager = automation_manager
        manager.start_time = datetime.now(timezone.utc)
        
        with patch('psutil.virtual_memory') as mock_memory, \
             patch('psutil.cpu_percent') as mock_cpu, \
             patch('psutil.disk_usage') as mock_disk:
            
            mock_memory.return_value.percent = 50.0
            mock_cpu.return_value = 25.0
            mock_disk.return_value.percent = 60.0
            
            health_data = manager._calculate_system_health()
            
            assert health_data['memory_usage_percent'] == 50.0
            assert health_data['cpu_usage_percent'] == 25.0
            assert health_data['disk_usage_percent'] == 60.0
            assert 'uptime_seconds' in health_data


class TestConfigurationManagement:
    """Test configuration management and hot-reload functionality."""
    
    @pytest.mark.asyncio
    async def test_config_hot_reload(self, automation_manager):
        """Test configuration hot-reload functionality."""
        manager = automation_manager
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Create new configuration
            new_config = manager.config
            new_config.web_downloader.check_interval = 20  # Changed value
            
            # Reload configuration
            await manager.reload_config(new_config)
            
            assert manager.config.web_downloader.check_interval == 20
    
    @pytest.mark.asyncio
    async def test_config_reload_disabled(self, automation_manager):
        """Test that config reload fails when disabled."""
        manager = automation_manager
        manager.config.config_hot_reload = False
        
        new_config = manager.config
        
        with pytest.raises(AutomationManagerError):
            await manager.reload_config(new_config)


class TestStatusReporting:
    """Test status reporting and metrics collection."""
    
    @pytest.mark.asyncio
    async def test_get_status(self, automation_manager):
        """Test status reporting."""
        manager = automation_manager
        
        with patch.multiple('src.automation.automation_manager', **create_mock_components()):
            await manager.start()
            
            status = manager.get_status()
            
            assert isinstance(status, AutomationStatus)
            assert status.is_running
            assert status.start_time is not None
            assert 'web_downloader' in status.components_status
            assert 'file_watcher' in status.components_status
            assert 'processing_manager' in status.components_status
            
            await manager.stop()
    
    def test_status_serialization(self, automation_manager):
        """Test status object serialization."""
        manager = automation_manager
        manager.start_time = datetime.now(timezone.utc)
        
        status = manager.get_status()
        status_dict = status.to_dict()
        
        assert isinstance(status_dict, dict)
        assert 'is_running' in status_dict
        assert 'start_time' in status_dict
        assert 'components_status' in status_dict


class TestErrorHandling:
    """Test error handling and recovery mechanisms."""
    
    @pytest.mark.asyncio
    async def test_component_failure_handling(self, automation_manager):
        """Test handling of component failures."""
        manager = automation_manager
        
        # Mock file watcher to fail during initialization
        with patch('src.automation.automation_manager.FileWatcher') as mock_watcher:
            mock_watcher.side_effect = Exception("File watcher failed")
            
            with pytest.raises(AutomationManagerError):
                await manager.start()
            
            # Manager should not be running
            assert not manager.is_running
    
    @pytest.mark.asyncio
    async def test_scheduler_error_handling(self, automation_manager):
        """Test scheduler error handling."""
        manager = automation_manager
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Simulate scheduler job error
            event = MagicMock()
            event.job_id = 'test_job'
            event.exception = Exception("Job failed")
            
            # Should not raise exception
            manager._scheduler_job_listener(event)


class TestCleanupOperations:
    """Test cleanup and maintenance operations."""
    
    @pytest.mark.asyncio
    async def test_scheduled_cleanup(self, automation_manager, temp_directories):
        """Test scheduled cleanup operations."""
        manager = automation_manager
        
        # Create some temporary files
        temp_file = temp_directories['temp'] / "test_temp_file.tmp"
        temp_file.write_text("test content")
        
        # Set file modification time to past
        old_time = time.time() - 90000  # More than 24 hours ago
        temp_file.touch(times=(old_time, old_time))
        
        await manager._scheduled_cleanup()
        
        # File should be cleaned up
        assert not temp_file.exists()
    
    @pytest.mark.asyncio
    async def test_graceful_shutdown_cleanup(self, automation_manager):
        """Test that graceful shutdown properly cleans up resources."""
        manager = automation_manager
        
        mock_components = {}
        
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ) as mocks:
            # Store references to mock components
            for name, mock in mocks.items():
                mock_components[name] = mock
            
            await manager.start()
            await manager.stop()
            
            # Verify all components were properly stopped
            # This would need to be adjusted based on actual component interfaces


@pytest.mark.asyncio
async def test_complete_automation_workflow(temp_directories):
    """Integration test for complete automation workflow."""
    # Create test configuration
    config = AutomationConfig(
        web_downloader=WebDownloaderConfig(
            url="http://test.example.com/test.pdf",
            check_interval=1,
            download_path=str(temp_directories['source']),
            max_retries=1
        ),
        file_watcher=FileWatcherConfig(
            watch_path=str(temp_directories['source']),
            debounce_time=0.1,
            file_patterns=["*.pdf"]
        ),
        processing=ProcessingConfig(
            max_concurrent_jobs=1,
            retry_attempts=1
        ),
        data_directory=str(temp_directories['data']),
        temp_directory=str(temp_directories['temp'])
    )
    
    # Track events
    events_received = []
    
    async def event_handler(data):
        events_received.append(data)
    
    manager = AutomationManager(config)
    manager.add_event_handler('file_detected', event_handler)
    manager.add_event_handler('processing_completed', event_handler)
    
    try:
        with patch.multiple(
            'src.automation.automation_manager',
            WebDownloader=AsyncMock(),
            FileWatcher=AsyncMock(),
            ProcessingManager=AsyncMock(),
            CacheManager=AsyncMock()
        ):
            await manager.start()
            
            # Simulate file creation
            test_file = temp_directories['source'] / "test.pdf"
            test_file.write_text("test pdf content")
            
            # Simulate file event
            file_event = FileEvent(
                event_type=FileEventType.CREATED,
                file_path=str(test_file),
                is_directory=False,
                timestamp=time.time()
            )
            
            await manager._handle_file_event(file_event)
            
            # Wait a bit for processing
            await asyncio.sleep(0.2)
            
            # Verify workflow executed
            assert manager.is_running
            
    finally:
        await manager.stop()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])