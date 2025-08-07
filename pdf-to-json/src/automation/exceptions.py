"""
Automation-specific exceptions.
"""


class AutomationConfigError(Exception):
    """Raised when there's an error with automation configuration."""
    pass


class AutomationError(Exception):
    """Base exception for automation-related errors."""
    pass


class WebDownloadError(AutomationError):
    """Raised when web download operations fail."""
    pass


class FileWatcherError(AutomationError):
    """Raised when file watching operations fail."""
    pass


class ProcessingManagerError(AutomationError):
    """Raised when processing manager operations fail."""
    pass


class CacheManagerError(AutomationError):
    """Raised when cache manager operations fail."""
    pass


class AutomationManagerError(AutomationError):
    """Raised when automation manager operations fail."""
    pass