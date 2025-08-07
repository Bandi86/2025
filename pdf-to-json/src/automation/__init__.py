# Automation Package

from .config import AutomationConfig, load_automation_config
from .exceptions import AutomationConfigError, FileWatcherError, ProcessingManagerError
from .web_downloader import WebDownloader, FileInfo, DownloadResult
from .file_watcher import FileWatcher, FileEvent, FileEventType
from .processing_manager import ProcessingManager, ProcessingResult, QueueStatus
from .models import Job, JobStatus, JobPriority, JobProgressLog, SystemMetrics

__all__ = [
    'AutomationConfig', 
    'load_automation_config', 
    'AutomationConfigError',
    'FileWatcherError',
    'ProcessingManagerError',
    'WebDownloader',
    'FileInfo',
    'DownloadResult',
    'FileWatcher',
    'FileEvent',
    'FileEventType',
    'ProcessingManager',
    'ProcessingResult',
    'QueueStatus',
    'Job',
    'JobStatus',
    'JobPriority',
    'JobProgressLog',
    'SystemMetrics'
]