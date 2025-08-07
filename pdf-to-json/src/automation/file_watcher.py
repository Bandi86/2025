"""
FileWatcher for monitoring source directory for new PDF files.

This module provides cross-platform file monitoring with debouncing logic,
file lock detection, and pattern matching for PDF files.
"""

import asyncio
import fnmatch
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, List, Optional, Set, Awaitable, Dict, Any
from enum import Enum

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent, FileCreatedEvent, FileModifiedEvent

from .config import FileWatcherConfig
from .exceptions import FileWatcherError


class FileEventType(Enum):
    """Types of file events."""
    CREATED = "created"
    MODIFIED = "modified"
    DELETED = "deleted"
    MOVED = "moved"


@dataclass
class FileEvent:
    """Represents a file system event."""
    event_type: FileEventType
    file_path: str
    is_directory: bool
    timestamp: float
    source_event: Optional[FileSystemEvent] = None
    
    @property
    def file_name(self) -> str:
        """Get the file name from the path."""
        return os.path.basename(self.file_path)
    
    @property
    def file_extension(self) -> str:
        """Get the file extension."""
        return os.path.splitext(self.file_path)[1].lower()


class AsyncFileSystemEventHandler(FileSystemEventHandler):
    """Async-compatible file system event handler."""
    
    def __init__(self, file_watcher: 'FileWatcher'):
        super().__init__()
        self.file_watcher = file_watcher
        self.logger = logging.getLogger(__name__)
    
    def on_created(self, event: FileSystemEvent) -> None:
        """Handle file creation events."""
        if not event.is_directory:
            file_event = FileEvent(
                event_type=FileEventType.CREATED,
                file_path=event.src_path,
                is_directory=event.is_directory,
                timestamp=time.time(),
                source_event=event
            )
            self._schedule_event_handling(file_event)
    
    def on_modified(self, event: FileSystemEvent) -> None:
        """Handle file modification events."""
        if not event.is_directory:
            file_event = FileEvent(
                event_type=FileEventType.MODIFIED,
                file_path=event.src_path,
                is_directory=event.is_directory,
                timestamp=time.time(),
                source_event=event
            )
            self._schedule_event_handling(file_event)
    
    def _schedule_event_handling(self, file_event: FileEvent) -> None:
        """Schedule event handling in the event loop."""
        try:
            # Try to get the running event loop
            loop = asyncio.get_running_loop()
            # Schedule the coroutine to run in the event loop
            asyncio.run_coroutine_threadsafe(
                self.file_watcher._handle_event(file_event), loop
            )
        except RuntimeError:
            # No running event loop, store event for later processing
            self.file_watcher._pending_events[file_event.file_path] = file_event


class FileWatcher:
    """
    Cross-platform file watcher with debouncing and lock detection.
    
    Features:
    - Cross-platform file monitoring using watchdog
    - Debouncing logic to handle rapid file system changes
    - File lock detection to avoid processing incomplete files
    - Pattern matching for PDF files and filtering
    - Async event handling
    """
    
    def __init__(self, config: FileWatcherConfig):
        """
        Initialize FileWatcher.
        
        Args:
            config: FileWatcher configuration
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Event handling
        self._handlers: List[Callable[[FileEvent], Awaitable[None]]] = []
        self._observer: Optional[Observer] = None
        self._event_handler: Optional[AsyncFileSystemEventHandler] = None
        
        # Debouncing
        self._pending_events: Dict[str, FileEvent] = {}
        self._debounce_tasks: Dict[str, asyncio.Task] = {}
        
        # State
        self._is_watching = False
        self._watch_path = Path(config.watch_path)
        
        # Validate configuration
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate the configuration."""
        if not self._watch_path.exists():
            try:
                self._watch_path.mkdir(parents=True, exist_ok=True)
                self.logger.info(f"Created watch directory: {self._watch_path}")
            except Exception as e:
                raise FileWatcherError(f"Cannot create watch directory {self._watch_path}: {e}")
        
        if not self._watch_path.is_dir():
            raise FileWatcherError(f"Watch path is not a directory: {self._watch_path}")
    
    async def start_watching(self) -> None:
        """Start watching the configured directory."""
        if self._is_watching:
            self.logger.warning("FileWatcher is already watching")
            return
        
        try:
            self.logger.info(f"Starting file watcher on: {self._watch_path}")
            
            # Create event handler and observer
            self._event_handler = AsyncFileSystemEventHandler(self)
            self._observer = Observer()
            
            # Start watching
            self._observer.schedule(
                self._event_handler,
                str(self._watch_path),
                recursive=self.config.recursive
            )
            
            self._observer.start()
            self._is_watching = True
            
            self.logger.info("FileWatcher started successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to start FileWatcher: {e}")
            raise FileWatcherError(f"Failed to start file watching: {e}")
    
    async def stop_watching(self) -> None:
        """Stop watching the directory."""
        if not self._is_watching:
            self.logger.warning("FileWatcher is not currently watching")
            return
        
        try:
            self.logger.info("Stopping file watcher")
            
            # Stop observer
            if self._observer:
                self._observer.stop()
                self._observer.join(timeout=5.0)
                self._observer = None
            
            # Cancel pending debounce tasks
            for task in self._debounce_tasks.values():
                if not task.done():
                    task.cancel()
            
            self._debounce_tasks.clear()
            self._pending_events.clear()
            self._event_handler = None
            self._is_watching = False
            
            self.logger.info("FileWatcher stopped successfully")
            
        except Exception as e:
            self.logger.error(f"Error stopping FileWatcher: {e}")
            raise FileWatcherError(f"Failed to stop file watching: {e}")
    
    def add_handler(self, handler: Callable[[FileEvent], Awaitable[None]]) -> None:
        """
        Add an event handler.
        
        Args:
            handler: Async function to handle file events
        """
        if handler not in self._handlers:
            self._handlers.append(handler)
            self.logger.debug(f"Added event handler: {handler.__name__}")
    
    def remove_handler(self, handler: Callable[[FileEvent], Awaitable[None]]) -> None:
        """
        Remove an event handler.
        
        Args:
            handler: Handler to remove
        """
        if handler in self._handlers:
            self._handlers.remove(handler)
            self.logger.debug(f"Removed event handler: {handler.__name__}")
    
    async def _handle_event(self, event: FileEvent) -> None:
        """
        Handle a file system event with debouncing.
        
        Args:
            event: File system event to handle
        """
        try:
            # Check if file matches patterns
            if not self._matches_patterns(event.file_path):
                self.logger.debug(f"File {event.file_path} doesn't match patterns, ignoring")
                return
            
            # Check ignore patterns
            if self._matches_ignore_patterns(event.file_path):
                self.logger.debug(f"File {event.file_path} matches ignore patterns, ignoring")
                return
            
            self.logger.debug(f"Processing event: {event.event_type.value} for {event.file_path}")
            
            # Store the event for debouncing
            self._pending_events[event.file_path] = event
            
            # Cancel existing debounce task for this file
            if event.file_path in self._debounce_tasks:
                self._debounce_tasks[event.file_path].cancel()
            
            # Create new debounce task
            self._debounce_tasks[event.file_path] = asyncio.create_task(
                self._debounced_process_event(event.file_path)
            )
            
        except Exception as e:
            self.logger.error(f"Error handling event for {event.file_path}: {e}")
    
    async def _debounced_process_event(self, file_path: str) -> None:
        """
        Process an event after debounce delay.
        
        Args:
            file_path: Path of the file to process
        """
        try:
            # Wait for debounce time
            await asyncio.sleep(self.config.debounce_time)
            
            # Get the latest event for this file
            event = self._pending_events.get(file_path)
            if not event:
                return
            
            # Remove from pending events
            self._pending_events.pop(file_path, None)
            self._debounce_tasks.pop(file_path, None)
            
            # Check if file is locked (if enabled)
            if self.config.enable_lock_detection and await self._is_file_locked(file_path):
                self.logger.info(f"File {file_path} is locked, waiting...")
                await self._wait_for_file_unlock(file_path)
            
            # Notify all handlers
            await self._notify_handlers(event)
            
        except asyncio.CancelledError:
            # Task was cancelled, clean up
            self._pending_events.pop(file_path, None)
            self._debounce_tasks.pop(file_path, None)
        except Exception as e:
            self.logger.error(f"Error in debounced processing for {file_path}: {e}")
    
    async def _notify_handlers(self, event: FileEvent) -> None:
        """
        Notify all registered handlers about an event.
        
        Args:
            event: File event to notify about
        """
        if not self._handlers:
            self.logger.debug("No handlers registered for file events")
            return
        
        self.logger.info(f"Notifying {len(self._handlers)} handlers about {event.event_type.value} event for {event.file_path}")
        
        # Notify all handlers concurrently
        tasks = []
        for handler in self._handlers:
            try:
                task = asyncio.create_task(handler(event))
                tasks.append(task)
            except Exception as e:
                self.logger.error(f"Error creating task for handler {handler.__name__}: {e}")
        
        if tasks:
            # Wait for all handlers to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log any exceptions
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    handler_name = self._handlers[i].__name__ if i < len(self._handlers) else "unknown"
                    self.logger.error(f"Handler {handler_name} failed: {result}")
    
    def _matches_patterns(self, file_path: str) -> bool:
        """
        Check if file matches any of the configured patterns.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if file matches any pattern
        """
        file_name = os.path.basename(file_path)
        
        for pattern in self.config.file_patterns:
            if fnmatch.fnmatch(file_name.lower(), pattern.lower()):
                return True
        
        return False
    
    def _matches_ignore_patterns(self, file_path: str) -> bool:
        """
        Check if file matches any ignore patterns.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if file should be ignored
        """
        file_name = os.path.basename(file_path)
        
        for pattern in self.config.ignore_patterns:
            if fnmatch.fnmatch(file_name, pattern):
                return True
        
        return False
    
    async def _is_file_locked(self, file_path: str) -> bool:
        """
        Check if a file is locked (being written to).
        
        Args:
            file_path: Path to check
            
        Returns:
            True if file appears to be locked
        """
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                return False
            
            # Try to open file in append mode (should fail if locked)
            with open(file_path, 'a'):
                pass
            
            return False
            
        except (OSError, IOError):
            # File is likely locked
            return True
        except Exception as e:
            self.logger.warning(f"Unexpected error checking file lock for {file_path}: {e}")
            return False
    
    async def _wait_for_file_unlock(self, file_path: str, max_wait_time: float = 60.0) -> None:
        """
        Wait for a file to be unlocked.
        
        Args:
            file_path: Path to wait for
            max_wait_time: Maximum time to wait in seconds
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            if not await self._is_file_locked(file_path):
                self.logger.info(f"File {file_path} is now unlocked")
                return
            
            await asyncio.sleep(self.config.lock_check_interval)
        
        self.logger.warning(f"File {file_path} remained locked after {max_wait_time} seconds")
    
    @property
    def is_watching(self) -> bool:
        """Check if the watcher is currently active."""
        return self._is_watching
    
    @property
    def watch_path(self) -> Path:
        """Get the path being watched."""
        return self._watch_path
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current status of the file watcher.
        
        Returns:
            Dictionary with status information
        """
        return {
            "is_watching": self._is_watching,
            "watch_path": str(self._watch_path),
            "recursive": self.config.recursive,
            "file_patterns": self.config.file_patterns,
            "ignore_patterns": self.config.ignore_patterns,
            "debounce_time": self.config.debounce_time,
            "handlers_count": len(self._handlers),
            "pending_events": len(self._pending_events),
            "active_debounce_tasks": len(self._debounce_tasks),
            "lock_detection_enabled": self.config.enable_lock_detection
        }
    
    async def scan_existing_files(self) -> List[str]:
        """
        Scan for existing files that match patterns.
        
        Returns:
            List of file paths that match the patterns
        """
        matching_files = []
        
        try:
            if self.config.recursive:
                pattern = "**/*"
            else:
                pattern = "*"
            
            for file_path in self._watch_path.glob(pattern):
                if file_path.is_file() and self._matches_patterns(str(file_path)):
                    if not self._matches_ignore_patterns(str(file_path)):
                        matching_files.append(str(file_path))
            
            self.logger.info(f"Found {len(matching_files)} existing files matching patterns")
            
        except Exception as e:
            self.logger.error(f"Error scanning existing files: {e}")
            raise FileWatcherError(f"Failed to scan existing files: {e}")
        
        return matching_files
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.start_watching()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.stop_watching()