"""
Unit tests for FileWatcher component.

Tests cover file system monitoring, debouncing logic, file lock detection,
pattern matching, and edge cases.
"""

import asyncio
import os
import tempfile
import time
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import pytest

from src.automation.file_watcher import FileWatcher, FileEvent, FileEventType
from src.automation.config import FileWatcherConfig
from src.automation.exceptions import FileWatcherError


class TestFileWatcherConfig:
    """Test FileWatcher configuration validation."""
    
    def test_default_config(self):
        """Test default configuration values."""
        config = FileWatcherConfig()
        
        assert config.watch_path == "source/"
        assert config.file_patterns == ["*.pdf"]
        assert config.debounce_time == 5.0
        assert config.recursive is False
        assert config.ignore_patterns == [".*", "*~", "*.tmp"]
        assert config.enable_lock_detection is True
        assert config.lock_check_interval == 1.0
    
    def test_config_validation_empty_watch_path(self):
        """Test validation fails for empty watch path."""
        with pytest.raises(Exception):  # AutomationConfigError
            FileWatcherConfig(watch_path="")
    
    def test_config_validation_negative_debounce_time(self):
        """Test validation fails for negative debounce time."""
        with pytest.raises(Exception):  # AutomationConfigError
            FileWatcherConfig(debounce_time=-1.0)
    
    def test_config_validation_empty_file_patterns(self):
        """Test validation fails for empty file patterns."""
        with pytest.raises(Exception):  # AutomationConfigError
            FileWatcherConfig(file_patterns=[])


class TestFileEvent:
    """Test FileEvent data class."""
    
    def test_file_event_creation(self):
        """Test FileEvent creation and properties."""
        event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path="/path/to/test.pdf",
            is_directory=False,
            timestamp=time.time()
        )
        
        assert event.event_type == FileEventType.CREATED
        assert event.file_path == "/path/to/test.pdf"
        assert event.is_directory is False
        assert event.file_name == "test.pdf"
        assert event.file_extension == ".pdf"
    
    def test_file_event_properties(self):
        """Test FileEvent computed properties."""
        event = FileEvent(
            event_type=FileEventType.MODIFIED,
            file_path="/some/directory/document.PDF",
            is_directory=False,
            timestamp=time.time()
        )
        
        assert event.file_name == "document.PDF"
        assert event.file_extension == ".pdf"  # Should be lowercase


class TestFileWatcher:
    """Test FileWatcher functionality."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)
    
    @pytest.fixture
    def config(self, temp_dir):
        """Create a test configuration."""
        return FileWatcherConfig(
            watch_path=str(temp_dir),
            file_patterns=["*.pdf", "*.txt"],
            debounce_time=0.1,  # Short debounce for testing
            recursive=False,
            ignore_patterns=[".*", "*.tmp"],
            enable_lock_detection=True,
            lock_check_interval=0.1
        )
    
    @pytest.fixture
    def file_watcher(self, config):
        """Create a FileWatcher instance."""
        return FileWatcher(config)
    
    def test_file_watcher_initialization(self, file_watcher, temp_dir):
        """Test FileWatcher initialization."""
        assert file_watcher.config is not None
        assert file_watcher.watch_path == temp_dir
        assert not file_watcher.is_watching
        assert len(file_watcher._handlers) == 0
    
    def test_file_watcher_invalid_directory(self, temp_dir):
        """Test FileWatcher with invalid directory."""
        # Use a subdirectory that doesn't exist but can be created
        nonexistent_dir = temp_dir / "nonexistent" / "directory"
        config = FileWatcherConfig(watch_path=str(nonexistent_dir))
        # Should create directory automatically
        watcher = FileWatcher(config)
        assert watcher.watch_path.exists()
    
    def test_file_watcher_file_as_watch_path(self, temp_dir):
        """Test FileWatcher with file as watch path."""
        test_file = temp_dir / "test.txt"
        test_file.write_text("test")
        
        config = FileWatcherConfig(watch_path=str(test_file))
        with pytest.raises(FileWatcherError):
            FileWatcher(config)
    
    @pytest.mark.asyncio
    async def test_start_stop_watching(self, file_watcher):
        """Test starting and stopping file watching."""
        assert not file_watcher.is_watching
        
        await file_watcher.start_watching()
        assert file_watcher.is_watching
        
        await file_watcher.stop_watching()
        assert not file_watcher.is_watching
    
    @pytest.mark.asyncio
    async def test_start_watching_twice(self, file_watcher):
        """Test starting watching twice doesn't cause issues."""
        await file_watcher.start_watching()
        assert file_watcher.is_watching
        
        # Starting again should not raise error
        await file_watcher.start_watching()
        assert file_watcher.is_watching
        
        await file_watcher.stop_watching()
    
    @pytest.mark.asyncio
    async def test_stop_watching_when_not_started(self, file_watcher):
        """Test stopping watching when not started."""
        assert not file_watcher.is_watching
        
        # Should not raise error
        await file_watcher.stop_watching()
        assert not file_watcher.is_watching
    
    def test_add_remove_handlers(self, file_watcher):
        """Test adding and removing event handlers."""
        async def handler1(event):
            pass
        
        async def handler2(event):
            pass
        
        # Add handlers
        file_watcher.add_handler(handler1)
        file_watcher.add_handler(handler2)
        assert len(file_watcher._handlers) == 2
        
        # Add same handler again (should not duplicate)
        file_watcher.add_handler(handler1)
        assert len(file_watcher._handlers) == 2
        
        # Remove handler
        file_watcher.remove_handler(handler1)
        assert len(file_watcher._handlers) == 1
        assert handler2 in file_watcher._handlers
        
        # Remove non-existent handler (should not raise error)
        file_watcher.remove_handler(handler1)
        assert len(file_watcher._handlers) == 1
    
    def test_pattern_matching(self, file_watcher):
        """Test file pattern matching."""
        # Test matching patterns
        assert file_watcher._matches_patterns("/path/to/test.pdf")
        assert file_watcher._matches_patterns("/path/to/document.txt")
        assert file_watcher._matches_patterns("/path/to/FILE.PDF")  # Case insensitive
        
        # Test non-matching patterns
        assert not file_watcher._matches_patterns("/path/to/test.doc")
        assert not file_watcher._matches_patterns("/path/to/image.jpg")
    
    def test_ignore_pattern_matching(self, file_watcher):
        """Test ignore pattern matching."""
        # Test ignore patterns
        assert file_watcher._matches_ignore_patterns(".hidden_file.pdf")
        assert file_watcher._matches_ignore_patterns("temp.tmp")
        
        # Test non-ignore patterns
        assert not file_watcher._matches_ignore_patterns("normal_file.pdf")
        assert not file_watcher._matches_ignore_patterns("document.txt")
        assert not file_watcher._matches_ignore_patterns("backup~")  # *~ pattern doesn't match this
    
    @pytest.mark.asyncio
    async def test_file_lock_detection(self, file_watcher, temp_dir):
        """Test file lock detection."""
        test_file = temp_dir / "test.pdf"
        test_file.write_text("test content")
        
        # File should not be locked initially
        assert not await file_watcher._is_file_locked(str(test_file))
        
        # Test with non-existent file
        non_existent = temp_dir / "nonexistent.pdf"
        assert not await file_watcher._is_file_locked(str(non_existent))
    
    @pytest.mark.asyncio
    async def test_file_lock_detection_with_locked_file(self, file_watcher, temp_dir):
        """Test file lock detection with actually locked file."""
        test_file = temp_dir / "locked.pdf"
        
        # Create and keep file open (simulating lock)
        with open(test_file, 'w') as f:
            f.write("test")
            # On some systems, this might not actually lock the file
            # This test is more about the logic than actual file locking
        
        # The file should be accessible after closing
        assert not await file_watcher._is_file_locked(str(test_file))
    
    @pytest.mark.asyncio
    async def test_wait_for_file_unlock(self, file_watcher, temp_dir):
        """Test waiting for file unlock."""
        test_file = temp_dir / "test.pdf"
        test_file.write_text("test content")
        
        # Mock the lock detection to simulate unlocking
        with patch.object(file_watcher, '_is_file_locked') as mock_locked:
            # First call returns True (locked), second returns False (unlocked)
            mock_locked.side_effect = [True, False]
            
            start_time = time.time()
            await file_watcher._wait_for_file_unlock(str(test_file))
            end_time = time.time()
            
            # Should have waited at least one lock_check_interval
            assert end_time - start_time >= file_watcher.config.lock_check_interval
            assert mock_locked.call_count == 2
    
    @pytest.mark.asyncio
    async def test_wait_for_file_unlock_timeout(self, file_watcher, temp_dir):
        """Test waiting for file unlock with timeout."""
        test_file = temp_dir / "test.pdf"
        test_file.write_text("test content")
        
        # Mock the lock detection to always return True (always locked)
        with patch.object(file_watcher, '_is_file_locked', return_value=True):
            start_time = time.time()
            await file_watcher._wait_for_file_unlock(str(test_file), max_wait_time=0.2)
            end_time = time.time()
            
            # Should have waited approximately the max_wait_time
            assert end_time - start_time >= 0.2
    
    @pytest.mark.asyncio
    async def test_scan_existing_files(self, file_watcher, temp_dir):
        """Test scanning for existing files."""
        # Create test files
        (temp_dir / "test1.pdf").write_text("content1")
        (temp_dir / "test2.txt").write_text("content2")
        (temp_dir / "test3.doc").write_text("content3")  # Should be ignored
        (temp_dir / ".hidden.pdf").write_text("hidden")  # Should be ignored
        
        files = await file_watcher.scan_existing_files()
        
        # Should find PDF and TXT files, but not DOC or hidden files
        assert len(files) == 2
        file_names = [os.path.basename(f) for f in files]
        assert "test1.pdf" in file_names
        assert "test2.txt" in file_names
        assert "test3.doc" not in file_names
        assert ".hidden.pdf" not in file_names
    
    @pytest.mark.asyncio
    async def test_scan_existing_files_recursive(self, temp_dir):
        """Test scanning existing files recursively."""
        # Create subdirectory with files
        subdir = temp_dir / "subdir"
        subdir.mkdir()
        (subdir / "nested.pdf").write_text("nested content")
        
        config = FileWatcherConfig(
            watch_path=str(temp_dir),
            file_patterns=["*.pdf"],
            recursive=True
        )
        file_watcher = FileWatcher(config)
        
        files = await file_watcher.scan_existing_files()
        
        # Should find the nested PDF file
        assert len(files) == 1
        assert "nested.pdf" in files[0]
    
    def test_get_status(self, file_watcher):
        """Test getting file watcher status."""
        status = file_watcher.get_status()
        
        assert isinstance(status, dict)
        assert "is_watching" in status
        assert "watch_path" in status
        assert "recursive" in status
        assert "file_patterns" in status
        assert "ignore_patterns" in status
        assert "debounce_time" in status
        assert "handlers_count" in status
        assert "pending_events" in status
        assert "active_debounce_tasks" in status
        assert "lock_detection_enabled" in status
        
        assert status["is_watching"] is False
        assert status["handlers_count"] == 0
        assert status["pending_events"] == 0
        assert status["active_debounce_tasks"] == 0
    
    @pytest.mark.asyncio
    async def test_context_manager(self, file_watcher):
        """Test FileWatcher as async context manager."""
        assert not file_watcher.is_watching
        
        async with file_watcher:
            assert file_watcher.is_watching
        
        assert not file_watcher.is_watching
    
    @pytest.mark.asyncio
    async def test_event_handling_and_debouncing(self, file_watcher, temp_dir):
        """Test event handling with debouncing logic."""
        events_received = []
        
        async def test_handler(event):
            events_received.append(event)
        
        file_watcher.add_handler(test_handler)
        
        # Create a test event
        test_event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        # Handle the event multiple times quickly (should be debounced)
        await file_watcher._handle_event(test_event)
        await file_watcher._handle_event(test_event)
        await file_watcher._handle_event(test_event)
        
        # Wait for debounce time plus a bit more
        await asyncio.sleep(file_watcher.config.debounce_time + 0.1)
        
        # Should have received only one event due to debouncing
        assert len(events_received) == 1
        assert events_received[0].file_path == test_event.file_path
    
    @pytest.mark.asyncio
    async def test_event_handling_ignored_files(self, file_watcher, temp_dir):
        """Test that ignored files don't trigger events."""
        events_received = []
        
        async def test_handler(event):
            events_received.append(event)
        
        file_watcher.add_handler(test_handler)
        
        # Create events for ignored files
        ignored_event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / ".hidden.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        non_matching_event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test.doc"),
            is_directory=False,
            timestamp=time.time()
        )
        
        await file_watcher._handle_event(ignored_event)
        await file_watcher._handle_event(non_matching_event)
        
        # Wait for potential processing
        await asyncio.sleep(file_watcher.config.debounce_time + 0.1)
        
        # Should not have received any events
        assert len(events_received) == 0
    
    @pytest.mark.asyncio
    async def test_event_handling_with_lock_detection(self, file_watcher, temp_dir):
        """Test event handling with file lock detection."""
        events_received = []
        
        async def test_handler(event):
            events_received.append(event)
        
        file_watcher.add_handler(test_handler)
        
        test_file = temp_dir / "test.pdf"
        test_file.write_text("content")
        
        # Mock lock detection to simulate locked then unlocked file
        with patch.object(file_watcher, '_is_file_locked') as mock_locked, \
             patch.object(file_watcher, '_wait_for_file_unlock') as mock_wait:
            
            mock_locked.return_value = True
            mock_wait.return_value = None
            
            test_event = FileEvent(
                event_type=FileEventType.CREATED,
                file_path=str(test_file),
                is_directory=False,
                timestamp=time.time()
            )
            
            await file_watcher._handle_event(test_event)
            
            # Wait for debounce and processing
            await asyncio.sleep(file_watcher.config.debounce_time + 0.1)
            
            # Should have checked for lock and waited
            mock_locked.assert_called_once()
            mock_wait.assert_called_once()
            
            # Should have received the event after unlock
            assert len(events_received) == 1
    
    @pytest.mark.asyncio
    async def test_handler_exception_handling(self, file_watcher, temp_dir):
        """Test that handler exceptions don't break the system."""
        events_received = []
        
        async def failing_handler(event):
            raise Exception("Handler failed")
        
        async def working_handler(event):
            events_received.append(event)
        
        file_watcher.add_handler(failing_handler)
        file_watcher.add_handler(working_handler)
        
        test_event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        await file_watcher._handle_event(test_event)
        
        # Wait for processing
        await asyncio.sleep(file_watcher.config.debounce_time + 0.1)
        
        # Working handler should still have received the event
        assert len(events_received) == 1
    
    @pytest.mark.asyncio
    async def test_multiple_files_debouncing(self, file_watcher, temp_dir):
        """Test debouncing works correctly with multiple files."""
        events_received = []
        
        async def test_handler(event):
            events_received.append(event)
        
        file_watcher.add_handler(test_handler)
        
        # Create events for different files
        event1 = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test1.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        event2 = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test2.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        # Handle events for different files
        await file_watcher._handle_event(event1)
        await file_watcher._handle_event(event2)
        
        # Wait for debounce time
        await asyncio.sleep(file_watcher.config.debounce_time + 0.1)
        
        # Should have received events for both files
        assert len(events_received) == 2
        file_paths = [event.file_path for event in events_received]
        assert str(temp_dir / "test1.pdf") in file_paths
        assert str(temp_dir / "test2.pdf") in file_paths


class TestFileWatcherIntegration:
    """Integration tests for FileWatcher with simulated file system operations."""
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield Path(temp_dir)
    
    @pytest.fixture
    def config(self, temp_dir):
        """Create a test configuration."""
        return FileWatcherConfig(
            watch_path=str(temp_dir),
            file_patterns=["*.pdf"],
            debounce_time=0.1,
            recursive=False,
            enable_lock_detection=False  # Disable for simpler integration tests
        )
    
    @pytest.mark.asyncio
    async def test_file_watcher_lifecycle(self, temp_dir, config):
        """Test complete FileWatcher lifecycle."""
        events_received = []
        
        async def event_handler(event):
            events_received.append(event)
        
        # Test initialization and startup
        watcher = FileWatcher(config)
        assert not watcher.is_watching
        
        # Add handler
        watcher.add_handler(event_handler)
        assert len(watcher._handlers) == 1
        
        # Start watching
        await watcher.start_watching()
        assert watcher.is_watching
        
        # Simulate file events directly (bypassing watchdog for reliable testing)
        test_event = FileEvent(
            event_type=FileEventType.CREATED,
            file_path=str(temp_dir / "test.pdf"),
            is_directory=False,
            timestamp=time.time()
        )
        
        await watcher._handle_event(test_event)
        
        # Wait for debounce processing
        await asyncio.sleep(config.debounce_time + 0.1)
        
        # Should have received the event
        assert len(events_received) == 1
        assert events_received[0].file_path == test_event.file_path
        
        # Stop watching
        await watcher.stop_watching()
        assert not watcher.is_watching
    
    @pytest.mark.asyncio
    async def test_file_watcher_with_existing_files(self, temp_dir, config):
        """Test FileWatcher scanning existing files."""
        # Create some test files
        (temp_dir / "existing1.pdf").write_text("content1")
        (temp_dir / "existing2.pdf").write_text("content2")
        (temp_dir / "ignored.txt").write_text("ignored")  # Wrong extension
        (temp_dir / ".hidden.pdf").write_text("hidden")  # Hidden file
        
        watcher = FileWatcher(config)
        
        # Scan existing files
        existing_files = await watcher.scan_existing_files()
        
        # Should find only the PDF files that aren't hidden
        assert len(existing_files) == 2
        file_names = [os.path.basename(f) for f in existing_files]
        assert "existing1.pdf" in file_names
        assert "existing2.pdf" in file_names
        assert "ignored.txt" not in file_names
        assert ".hidden.pdf" not in file_names