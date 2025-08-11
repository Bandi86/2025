"""
Automation configuration system for football data processing.

This module provides comprehensive configuration management for all automation
components including web downloading, file watching, processing, caching,
notifications, and monitoring.
"""

import os
import json
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
from enum import Enum

from .exceptions import AutomationConfigError


class LogLevel(Enum):
    """Supported log levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class NotificationType(Enum):
    """Supported notification types."""
    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"


@dataclass
class WebDownloaderConfig:
    """Configuration for web downloader component."""
    url: str = "https://example.com/football-data"
    check_interval: int = 3600  # seconds
    download_path: str = "source/"
    max_retries: int = 3
    timeout: int = 30
    headers: Dict[str, str] = field(default_factory=dict)
    verify_ssl: bool = True
    user_agent: str = "Football-Data-Processor/1.0"
    enable_conditional_requests: bool = True
    enable_resume: bool = True
    rate_limit_delay: float = 1.0
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.url:
            raise AutomationConfigError("Web downloader URL cannot be empty")
        if self.check_interval < 60:
            raise AutomationConfigError("Check interval must be at least 60 seconds")
        if self.max_retries < 0:
            raise AutomationConfigError("Max retries cannot be negative")
        if self.timeout <= 0:
            raise AutomationConfigError("Timeout must be positive")


@dataclass
class FileWatcherConfig:
    """Configuration for file watcher component."""
    watch_path: str = "source/"
    file_patterns: List[str] = field(default_factory=lambda: ["*.pdf"])
    debounce_time: float = 5.0  # seconds
    recursive: bool = False
    ignore_patterns: List[str] = field(default_factory=lambda: [".*", "*~", "*.tmp"])
    enable_lock_detection: bool = True
    lock_check_interval: float = 1.0
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.watch_path:
            raise AutomationConfigError("Watch path cannot be empty")
        if self.debounce_time < 0:
            raise AutomationConfigError("Debounce time cannot be negative")
        if not self.file_patterns:
            raise AutomationConfigError("At least one file pattern must be specified")


@dataclass
class ProcessingConfig:
    """Configuration for processing manager."""
    max_concurrent_jobs: int = 2
    retry_attempts: int = 3
    timeout: int = 300  # seconds
    queue_max_size: int = 100
    job_persistence_enabled: bool = True
    job_persistence_path: str = "data/jobs.db"
    enable_progress_tracking: bool = True
    cleanup_completed_jobs_after: int = 86400  # seconds (24 hours)
    priority_levels: int = 5
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.max_concurrent_jobs <= 0:
            raise AutomationConfigError("Max concurrent jobs must be positive")
        if self.retry_attempts < 0:
            raise AutomationConfigError("Retry attempts cannot be negative")
        if self.timeout <= 0:
            raise AutomationConfigError("Timeout must be positive")
        if self.queue_max_size <= 0:
            raise AutomationConfigError("Queue max size must be positive")


@dataclass
class CacheConfig:
    """Configuration for caching system."""
    enabled: bool = True
    redis_url: str = "redis://localhost:6379/0"
    default_ttl: int = 3600  # seconds
    max_memory_cache_size: int = 1000
    cache_strategies: Dict[str, int] = field(default_factory=lambda: {
        "team_normalization": 86400,  # 24 hours
        "market_classification": 43200,  # 12 hours
        "processing_results": 3600,  # 1 hour
        "configuration": 1800  # 30 minutes
    })
    enable_compression: bool = True
    connection_pool_size: int = 10
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.default_ttl <= 0:
            raise AutomationConfigError("Default TTL must be positive")
        if self.max_memory_cache_size <= 0:
            raise AutomationConfigError("Max memory cache size must be positive")


@dataclass
class EmailConfig:
    """Email notification configuration."""
    enabled: bool = False
    smtp_server: str = "localhost"
    smtp_port: int = 587
    use_tls: bool = True
    username: str = ""
    password: str = ""
    from_address: str = "automation@example.com"
    to_addresses: List[str] = field(default_factory=list)


@dataclass
class WebhookConfig:
    """Webhook notification configuration."""
    enabled: bool = False
    url: str = ""
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30


@dataclass
class NotificationConfig:
    """Configuration for notification system."""
    enabled: bool = True
    email: EmailConfig = field(default_factory=EmailConfig)
    webhook: WebhookConfig = field(default_factory=WebhookConfig)
    notification_levels: List[LogLevel] = field(default_factory=lambda: [LogLevel.ERROR, LogLevel.CRITICAL])
    rate_limit: int = 10  # notifications per minute
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.rate_limit <= 0:
            raise AutomationConfigError("Notification rate limit must be positive")


@dataclass
class MonitoringConfig:
    """Configuration for monitoring and health checks."""
    enabled: bool = True
    health_check_interval: int = 30  # seconds
    collection_interval: int = 60  # seconds - for metrics collection
    metrics_collection_interval: int = 60  # seconds - alias for collection_interval
    log_level: LogLevel = LogLevel.INFO
    log_format: str = "json"
    log_file: Optional[str] = "logs/automation.log"
    enable_structured_logging: bool = True
    metrics_retention_days: int = 30
    alert_thresholds: Dict[str, Union[int, float]] = field(default_factory=lambda: {
        "queue_length": 10,
        "error_rate_percent": 5.0,
        "memory_usage_percent": 80.0,
        "cpu_usage_percent": 80.0,
        "disk_usage_percent": 85.0,
        "processing_time_multiplier": 2.0,
        "failed_downloads": 3
    })
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.health_check_interval <= 0:
            raise AutomationConfigError("Health check interval must be positive")
        if self.collection_interval <= 0:
            raise AutomationConfigError("Collection interval must be positive")
        # Sync the two interval properties
        self.metrics_collection_interval = self.collection_interval


@dataclass
class SecurityConfig:
    """Configuration for security features."""
    enable_api_authentication: bool = False
    jwt_secret_key: str = "default-dev-secret-change-in-production"
    jwt_expiration_hours: int = 24
    api_rate_limit_per_minute: int = 100
    allowed_file_types: List[str] = field(default_factory=lambda: [".pdf"])
    max_file_size_mb: int = 100
    enable_ip_whitelisting: bool = False
    allowed_ips: List[str] = field(default_factory=list)
    enable_cors: bool = True
    cors_origins: List[str] = field(default_factory=lambda: ["*"])
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.enable_api_authentication and not self.jwt_secret_key:
            raise AutomationConfigError("JWT secret key is required when authentication is enabled")
        if self.jwt_expiration_hours <= 0:
            raise AutomationConfigError("JWT expiration hours must be positive")
        if self.api_rate_limit_per_minute <= 0:
            raise AutomationConfigError("API rate limit must be positive")
        if self.max_file_size_mb <= 0:
            raise AutomationConfigError("Max file size must be positive")


@dataclass
class DatabaseConfig:
    """Configuration for database connections."""
    url: str = "sqlite:///data/automation.db"
    pool_size: int = 5
    max_overflow: int = 10
    pool_timeout: int = 30
    pool_recycle: int = 3600
    enable_migrations: bool = True
    backup_enabled: bool = True
    backup_interval_hours: int = 24
    retention_days: int = 30
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.pool_size <= 0:
            raise AutomationConfigError("Database pool size must be positive")
        if self.max_overflow < 0:
            raise AutomationConfigError("Database max overflow cannot be negative")
        if self.pool_timeout <= 0:
            raise AutomationConfigError("Database pool timeout must be positive")


@dataclass
class PerformanceConfig:
    """Configuration for performance monitoring and optimization."""
    enabled: bool = True
    collection_interval: int = 60  # seconds
    enable_profiling: bool = True
    enable_memory_tracking: bool = True
    enable_database_monitoring: bool = True
    
    # Profiling settings
    max_profile_results: int = 50
    profile_slow_functions: bool = True
    slow_function_threshold: float = 1.0  # seconds
    
    # Memory monitoring settings
    max_memory_snapshots: int = 1000
    memory_leak_threshold: int = 10 * 1024 * 1024  # 10MB
    enable_gc_monitoring: bool = True
    
    # Database monitoring settings
    slow_query_threshold: float = 1.0  # seconds
    max_slow_queries: int = 100
    max_db_metrics: int = 1000
    
    # APM settings
    max_metrics_history: int = 10000
    max_timer_values: int = 1000
    enable_system_metrics: bool = True
    enable_application_metrics: bool = True
    
    # Performance optimization settings
    enable_query_optimization: bool = True
    enable_connection_pooling: bool = True
    enable_caching_optimization: bool = True
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.collection_interval <= 0:
            raise AutomationConfigError("Collection interval must be positive")
        if self.max_profile_results <= 0:
            raise AutomationConfigError("Max profile results must be positive")
        if self.slow_function_threshold <= 0:
            raise AutomationConfigError("Slow function threshold must be positive")
        if self.memory_leak_threshold <= 0:
            raise AutomationConfigError("Memory leak threshold must be positive")
        if self.slow_query_threshold <= 0:
            raise AutomationConfigError("Slow query threshold must be positive")


@dataclass
class AutomationConfig:
    """Main configuration class for the automation system."""
    web_downloader: WebDownloaderConfig = field(default_factory=WebDownloaderConfig)
    file_watcher: FileWatcherConfig = field(default_factory=FileWatcherConfig)
    processing: ProcessingConfig = field(default_factory=ProcessingConfig)
    caching: CacheConfig = field(default_factory=CacheConfig)
    notifications: NotificationConfig = field(default_factory=NotificationConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    performance: PerformanceConfig = field(default_factory=PerformanceConfig)
    
    # Global settings
    environment: str = "development"
    debug: bool = False
    config_hot_reload: bool = True
    data_directory: str = "data/"
    temp_directory: str = "temp/"
    
    def __post_init__(self):
        """Validate configuration after initialization."""
        if self.environment not in ["development", "testing", "staging", "production"]:
            raise AutomationConfigError("Environment must be one of: development, testing, staging, production")
        
        # Create directories if they don't exist
        for directory in [self.data_directory, self.temp_directory]:
            Path(directory).mkdir(parents=True, exist_ok=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        config_dict = asdict(self)
        
        # Convert enums to their values for JSON serialization
        if 'notifications' in config_dict:
            if 'types' in config_dict['notifications']:
                config_dict['notifications']['types'] = [
                    t.value if hasattr(t, 'value') else t 
                    for t in config_dict['notifications']['types']
                ]
            if 'notification_levels' in config_dict['notifications']:
                config_dict['notifications']['notification_levels'] = [
                    l.value if hasattr(l, 'value') else l 
                    for l in config_dict['notifications']['notification_levels']
                ]
        
        if 'monitoring' in config_dict:
            if 'log_level' in config_dict['monitoring']:
                log_level = config_dict['monitoring']['log_level']
                if hasattr(log_level, 'value'):
                    config_dict['monitoring']['log_level'] = log_level.value
        
        return config_dict
    
    def save_to_file(self, file_path: str) -> None:
        """Save configuration to JSON file."""
        try:
            def enum_serializer(obj):
                """Custom serializer for enum objects."""
                if hasattr(obj, 'value'):
                    return obj.value
                return str(obj)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.to_dict(), f, indent=2, ensure_ascii=False, default=enum_serializer)
        except Exception as e:
            raise AutomationConfigError(f"Failed to save configuration to {file_path}: {e}")
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'AutomationConfig':
        """Create configuration from dictionary."""
        try:
            # Convert nested dictionaries to dataclass instances
            if 'web_downloader' in config_dict:
                config_dict['web_downloader'] = WebDownloaderConfig(**config_dict['web_downloader'])
            if 'file_watcher' in config_dict:
                config_dict['file_watcher'] = FileWatcherConfig(**config_dict['file_watcher'])
            if 'processing' in config_dict:
                config_dict['processing'] = ProcessingConfig(**config_dict['processing'])
            if 'caching' in config_dict:
                config_dict['caching'] = CacheConfig(**config_dict['caching'])
            if 'notifications' in config_dict:
                # Handle nested email and webhook configs
                if 'email' in config_dict['notifications']:
                    config_dict['notifications']['email'] = EmailConfig(**config_dict['notifications']['email'])
                if 'webhook' in config_dict['notifications']:
                    config_dict['notifications']['webhook'] = WebhookConfig(**config_dict['notifications']['webhook'])
                
                # Convert notification levels from strings to enums
                if 'notification_levels' in config_dict['notifications']:
                    config_dict['notifications']['notification_levels'] = [
                        LogLevel(l) if isinstance(l, str) else l 
                        for l in config_dict['notifications']['notification_levels']
                    ]
                config_dict['notifications'] = NotificationConfig(**config_dict['notifications'])
            if 'monitoring' in config_dict:
                # Convert log level from string to enum
                if 'log_level' in config_dict['monitoring']:
                    if isinstance(config_dict['monitoring']['log_level'], str):
                        config_dict['monitoring']['log_level'] = LogLevel(config_dict['monitoring']['log_level'])
                config_dict['monitoring'] = MonitoringConfig(**config_dict['monitoring'])
            if 'security' in config_dict:
                config_dict['security'] = SecurityConfig(**config_dict['security'])
            if 'database' in config_dict:
                config_dict['database'] = DatabaseConfig(**config_dict['database'])
            if 'performance' in config_dict:
                config_dict['performance'] = PerformanceConfig(**config_dict['performance'])
            
            return cls(**config_dict)
        except Exception as e:
            raise AutomationConfigError(f"Failed to create configuration from dictionary: {e}")
    
    @classmethod
    def from_file(cls, file_path: str) -> 'AutomationConfig':
        """Load configuration from JSON file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                config_dict = json.load(f)
            return cls.from_dict(config_dict)
        except FileNotFoundError:
            raise AutomationConfigError(f"Configuration file not found: {file_path}")
        except json.JSONDecodeError as e:
            raise AutomationConfigError(f"Invalid JSON in configuration file {file_path}: {e}")
        except Exception as e:
            raise AutomationConfigError(f"Failed to load configuration from {file_path}: {e}")


def load_automation_config(
    config_file: Optional[str] = None,
    environment_prefix: str = "FOOTBALL_AUTOMATION_"
) -> AutomationConfig:
    """
    Load automation configuration from file and environment variables.
    
    Args:
        config_file: Path to configuration file (optional)
        environment_prefix: Prefix for environment variables
        
    Returns:
        AutomationConfig instance
        
    Raises:
        AutomationConfigError: If configuration loading fails
    """
    # Start with default configuration
    config = AutomationConfig()
    
    # Load from file if specified
    if config_file and Path(config_file).exists():
        config = AutomationConfig.from_file(config_file)
    
    # Override with environment variables
    config = _apply_environment_variables(config, environment_prefix)
    
    return config


def _apply_environment_variables(config: AutomationConfig, prefix: str) -> AutomationConfig:
    """Apply environment variable overrides to configuration."""
    config_dict = config.to_dict()
    
    # Environment variable mappings
    env_mappings = {
        f"{prefix}ENVIRONMENT": ("environment",),
        f"{prefix}DEBUG": ("debug",),
        f"{prefix}DATA_DIRECTORY": ("data_directory",),
        f"{prefix}TEMP_DIRECTORY": ("temp_directory",),
        
        # Web downloader
        f"{prefix}WEB_URL": ("web_downloader", "url"),
        f"{prefix}WEB_CHECK_INTERVAL": ("web_downloader", "check_interval"),
        f"{prefix}WEB_DOWNLOAD_PATH": ("web_downloader", "download_path"),
        f"{prefix}WEB_MAX_RETRIES": ("web_downloader", "max_retries"),
        f"{prefix}WEB_TIMEOUT": ("web_downloader", "timeout"),
        f"{prefix}WEB_VERIFY_SSL": ("web_downloader", "verify_ssl"),
        
        # File watcher
        f"{prefix}WATCH_PATH": ("file_watcher", "watch_path"),
        f"{prefix}DEBOUNCE_TIME": ("file_watcher", "debounce_time"),
        f"{prefix}RECURSIVE_WATCH": ("file_watcher", "recursive"),
        
        # Processing
        f"{prefix}MAX_CONCURRENT_JOBS": ("processing", "max_concurrent_jobs"),
        f"{prefix}RETRY_ATTEMPTS": ("processing", "retry_attempts"),
        f"{prefix}PROCESSING_TIMEOUT": ("processing", "timeout"),
        f"{prefix}QUEUE_MAX_SIZE": ("processing", "queue_max_size"),
        
        # Caching
        f"{prefix}CACHE_ENABLED": ("caching", "enabled"),
        f"{prefix}REDIS_URL": ("caching", "redis_url"),
        f"{prefix}CACHE_DEFAULT_TTL": ("caching", "default_ttl"),
        
        # Database
        f"{prefix}DATABASE_URL": ("database", "url"),
        f"{prefix}DB_POOL_SIZE": ("database", "pool_size"),
        
        # Security
        f"{prefix}JWT_SECRET_KEY": ("security", "jwt_secret_key"),
        f"{prefix}API_RATE_LIMIT": ("security", "api_rate_limit_per_minute"),
        f"{prefix}MAX_FILE_SIZE_MB": ("security", "max_file_size_mb"),
        
        # Monitoring
        f"{prefix}LOG_LEVEL": ("monitoring", "log_level"),
        f"{prefix}LOG_FILE": ("monitoring", "log_file"),
        f"{prefix}HEALTH_CHECK_INTERVAL": ("monitoring", "health_check_interval"),
    }
    
    for env_var, path in env_mappings.items():
        value = os.getenv(env_var)
        if value is not None:
            _set_nested_value(config_dict, path, _convert_env_value(value))
    
    return AutomationConfig.from_dict(config_dict)


def _set_nested_value(dictionary: Dict[str, Any], path: tuple, value: Any) -> None:
    """Set a nested value in a dictionary using a path tuple."""
    current = dictionary
    for key in path[:-1]:
        if key not in current:
            current[key] = {}
        current = current[key]
    current[path[-1]] = value


def _convert_env_value(value: str) -> Any:
    """Convert environment variable string to appropriate type."""
    # Boolean conversion
    if value.lower() in ('true', 'false'):
        return value.lower() == 'true'
    
    # Integer conversion
    try:
        return int(value)
    except ValueError:
        pass
    
    # Float conversion
    try:
        return float(value)
    except ValueError:
        pass
    
    # Return as string
    return value


def create_default_config_files(config_dir: str = "config/automation") -> None:
    """Create default configuration files for automation components."""
    config_path = Path(config_dir)
    config_path.mkdir(parents=True, exist_ok=True)
    
    # Create main automation config
    default_config = AutomationConfig()
    default_config.save_to_file(config_path / "automation.json")
    
    # Create environment-specific configs
    environments = ["development", "testing", "staging", "production"]
    
    for env in environments:
        env_config = AutomationConfig()
        env_config.environment = env
        
        # Environment-specific overrides
        if env == "development":
            env_config.debug = True
            env_config.monitoring.log_level = LogLevel.DEBUG
            env_config.caching.enabled = False
        elif env == "testing":
            env_config.database.url = "sqlite:///:memory:"
            env_config.caching.enabled = False
            env_config.notifications.enabled = False
        elif env == "production":
            env_config.debug = False
            env_config.monitoring.log_level = LogLevel.WARNING
            env_config.security.enable_api_authentication = True
            env_config.config_hot_reload = False
        
        env_config.save_to_file(config_path / f"automation.{env}.json")


def load_config(config_file: Optional[str] = None) -> AutomationConfig:
    """
    Load configuration for the automation system.
    
    This is a convenience function that loads the appropriate configuration
    based on the environment or specified file.
    
    Args:
        config_file: Optional path to specific config file
        
    Returns:
        AutomationConfig instance
    """
    if config_file:
        return AutomationConfig.from_file(config_file)
    
    # Try to load environment-specific config
    environment = os.getenv("FOOTBALL_AUTOMATION_ENVIRONMENT", "development")
    config_dir = Path("config/automation")
    
    # Try environment-specific config first
    env_config_file = config_dir / f"automation.{environment}.json"
    if env_config_file.exists():
        return AutomationConfig.from_file(str(env_config_file))
    
    # Fall back to main config file
    main_config_file = config_dir / "automation.json"
    if main_config_file.exists():
        return AutomationConfig.from_file(str(main_config_file))
    
    # Create default config if none exists
    config_dir.mkdir(parents=True, exist_ok=True)
    default_config = AutomationConfig()
    default_config.environment = environment
    default_config.save_to_file(str(main_config_file))
    
    return default_config