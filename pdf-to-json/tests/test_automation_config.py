"""
Unit tests for automation configuration system.
"""

import json
import os
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch

from src.automation.config import (
    AutomationConfig,
    WebDownloaderConfig,
    FileWatcherConfig,
    ProcessingConfig,
    CacheConfig,
    NotificationConfig,
    MonitoringConfig,
    SecurityConfig,
    DatabaseConfig,
    LogLevel,
    NotificationType,
    load_automation_config,
    create_default_config_files,
    _apply_environment_variables,
    _convert_env_value
)
from src.automation.exceptions import AutomationConfigError


class TestWebDownloaderConfig:
    """Test WebDownloaderConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid web downloader configuration."""
        config = WebDownloaderConfig(
            url="https://example.com/data",
            check_interval=3600,
            max_retries=3,
            timeout=30
        )
        assert config.url == "https://example.com/data"
        assert config.check_interval == 3600
        assert config.max_retries == 3
        assert config.timeout == 30
    
    def test_empty_url_raises_error(self):
        """Test that empty URL raises configuration error."""
        with pytest.raises(AutomationConfigError, match="Web downloader URL cannot be empty"):
            WebDownloaderConfig(url="")
    
    def test_invalid_check_interval_raises_error(self):
        """Test that check interval less than 60 seconds raises error."""
        with pytest.raises(AutomationConfigError, match="Check interval must be at least 60 seconds"):
            WebDownloaderConfig(url="https://example.com", check_interval=30)
    
    def test_negative_retries_raises_error(self):
        """Test that negative max retries raises error."""
        with pytest.raises(AutomationConfigError, match="Max retries cannot be negative"):
            WebDownloaderConfig(url="https://example.com", max_retries=-1)
    
    def test_zero_timeout_raises_error(self):
        """Test that zero or negative timeout raises error."""
        with pytest.raises(AutomationConfigError, match="Timeout must be positive"):
            WebDownloaderConfig(url="https://example.com", timeout=0)


class TestFileWatcherConfig:
    """Test FileWatcherConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid file watcher configuration."""
        config = FileWatcherConfig(
            watch_path="source/",
            file_patterns=["*.pdf", "*.json"],
            debounce_time=5.0
        )
        assert config.watch_path == "source/"
        assert config.file_patterns == ["*.pdf", "*.json"]
        assert config.debounce_time == 5.0
    
    def test_empty_watch_path_raises_error(self):
        """Test that empty watch path raises configuration error."""
        with pytest.raises(AutomationConfigError, match="Watch path cannot be empty"):
            FileWatcherConfig(watch_path="")
    
    def test_negative_debounce_time_raises_error(self):
        """Test that negative debounce time raises error."""
        with pytest.raises(AutomationConfigError, match="Debounce time cannot be negative"):
            FileWatcherConfig(debounce_time=-1.0)
    
    def test_empty_file_patterns_raises_error(self):
        """Test that empty file patterns list raises error."""
        with pytest.raises(AutomationConfigError, match="At least one file pattern must be specified"):
            FileWatcherConfig(file_patterns=[])


class TestProcessingConfig:
    """Test ProcessingConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid processing configuration."""
        config = ProcessingConfig(
            max_concurrent_jobs=4,
            retry_attempts=3,
            timeout=300
        )
        assert config.max_concurrent_jobs == 4
        assert config.retry_attempts == 3
        assert config.timeout == 300
    
    def test_zero_concurrent_jobs_raises_error(self):
        """Test that zero max concurrent jobs raises error."""
        with pytest.raises(AutomationConfigError, match="Max concurrent jobs must be positive"):
            ProcessingConfig(max_concurrent_jobs=0)
    
    def test_negative_retry_attempts_raises_error(self):
        """Test that negative retry attempts raises error."""
        with pytest.raises(AutomationConfigError, match="Retry attempts cannot be negative"):
            ProcessingConfig(retry_attempts=-1)
    
    def test_zero_timeout_raises_error(self):
        """Test that zero timeout raises error."""
        with pytest.raises(AutomationConfigError, match="Timeout must be positive"):
            ProcessingConfig(timeout=0)


class TestCacheConfig:
    """Test CacheConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid cache configuration."""
        config = CacheConfig(
            enabled=True,
            redis_url="redis://localhost:6379/0",
            default_ttl=3600
        )
        assert config.enabled is True
        assert config.redis_url == "redis://localhost:6379/0"
        assert config.default_ttl == 3600
    
    def test_zero_ttl_raises_error(self):
        """Test that zero TTL raises error."""
        with pytest.raises(AutomationConfigError, match="Default TTL must be positive"):
            CacheConfig(default_ttl=0)
    
    def test_zero_memory_cache_size_raises_error(self):
        """Test that zero memory cache size raises error."""
        with pytest.raises(AutomationConfigError, match="Max memory cache size must be positive"):
            CacheConfig(max_memory_cache_size=0)


class TestSecurityConfig:
    """Test SecurityConfig validation and functionality."""
    
    def test_valid_config_without_auth(self):
        """Test creating a valid security configuration without authentication."""
        config = SecurityConfig(
            enable_api_authentication=False,
            api_rate_limit_per_minute=100
        )
        assert config.enable_api_authentication is False
        assert config.api_rate_limit_per_minute == 100
    
    def test_valid_config_with_auth(self):
        """Test creating a valid security configuration with authentication."""
        config = SecurityConfig(
            enable_api_authentication=True,
            jwt_secret_key="test-secret-key"
        )
        assert config.enable_api_authentication is True
        assert config.jwt_secret_key == "test-secret-key"
    
    def test_auth_enabled_without_secret_raises_error(self):
        """Test that authentication enabled without secret key raises error."""
        with pytest.raises(AutomationConfigError, match="JWT secret key is required when authentication is enabled"):
            SecurityConfig(enable_api_authentication=True, jwt_secret_key="")
    
    def test_zero_rate_limit_raises_error(self):
        """Test that zero rate limit raises error."""
        with pytest.raises(AutomationConfigError, match="API rate limit must be positive"):
            SecurityConfig(api_rate_limit_per_minute=0)


class TestMonitoringConfig:
    """Test MonitoringConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid monitoring configuration."""
        config = MonitoringConfig(
            enabled=True,
            health_check_interval=30,
            log_level=LogLevel.INFO
        )
        assert config.enabled is True
        assert config.health_check_interval == 30
        assert config.log_level == LogLevel.INFO
    
    def test_zero_health_check_interval_raises_error(self):
        """Test that zero health check interval raises error."""
        with pytest.raises(AutomationConfigError, match="Health check interval must be positive"):
            MonitoringConfig(health_check_interval=0)
    
    def test_zero_metrics_interval_raises_error(self):
        """Test that zero metrics collection interval raises error."""
        with pytest.raises(AutomationConfigError, match="Metrics collection interval must be positive"):
            MonitoringConfig(metrics_collection_interval=0)


class TestDatabaseConfig:
    """Test DatabaseConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid database configuration."""
        config = DatabaseConfig(
            url="postgresql://user:pass@localhost/db",
            pool_size=5
        )
        assert config.url == "postgresql://user:pass@localhost/db"
        assert config.pool_size == 5
    
    def test_zero_pool_size_raises_error(self):
        """Test that zero pool size raises error."""
        with pytest.raises(AutomationConfigError, match="Database pool size must be positive"):
            DatabaseConfig(pool_size=0)
    
    def test_negative_max_overflow_raises_error(self):
        """Test that negative max overflow raises error."""
        with pytest.raises(AutomationConfigError, match="Database max overflow cannot be negative"):
            DatabaseConfig(max_overflow=-1)


class TestAutomationConfig:
    """Test main AutomationConfig class."""
    
    def test_default_config_creation(self):
        """Test creating default automation configuration."""
        config = AutomationConfig()
        assert config.environment == "development"
        assert config.debug is False
        assert isinstance(config.web_downloader, WebDownloaderConfig)
        assert isinstance(config.file_watcher, FileWatcherConfig)
        assert isinstance(config.processing, ProcessingConfig)
    
    def test_invalid_environment_raises_error(self):
        """Test that invalid environment raises error."""
        with pytest.raises(AutomationConfigError, match="Environment must be one of"):
            AutomationConfig(environment="invalid")
    
    def test_to_dict_conversion(self):
        """Test converting configuration to dictionary."""
        config = AutomationConfig()
        config_dict = config.to_dict()
        assert isinstance(config_dict, dict)
        assert "web_downloader" in config_dict
        assert "file_watcher" in config_dict
        assert "processing" in config_dict
    
    def test_from_dict_creation(self):
        """Test creating configuration from dictionary."""
        config_dict = {
            "environment": "testing",
            "debug": True,
            "web_downloader": {
                "url": "https://test.com",
                "check_interval": 1800
            }
        }
        config = AutomationConfig.from_dict(config_dict)
        assert config.environment == "testing"
        assert config.debug is True
        assert config.web_downloader.url == "https://test.com"
        assert config.web_downloader.check_interval == 1800
    
    def test_save_and_load_file(self):
        """Test saving configuration to file and loading it back."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name
        
        try:
            # Create and save config
            original_config = AutomationConfig(environment="testing", debug=True)
            original_config.save_to_file(temp_file)
            
            # Load config back
            loaded_config = AutomationConfig.from_file(temp_file)
            
            assert loaded_config.environment == "testing"
            assert loaded_config.debug is True
            assert loaded_config.web_downloader.url == original_config.web_downloader.url
        finally:
            os.unlink(temp_file)
    
    def test_load_nonexistent_file_raises_error(self):
        """Test that loading non-existent file raises error."""
        with pytest.raises(AutomationConfigError, match="Configuration file not found"):
            AutomationConfig.from_file("nonexistent.json")
    
    def test_load_invalid_json_raises_error(self):
        """Test that loading invalid JSON raises error."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("invalid json content")
            temp_file = f.name
        
        try:
            with pytest.raises(AutomationConfigError, match="Invalid JSON"):
                AutomationConfig.from_file(temp_file)
        finally:
            os.unlink(temp_file)


class TestEnvironmentVariables:
    """Test environment variable handling."""
    
    def test_convert_env_value_boolean(self):
        """Test converting environment variable to boolean."""
        assert _convert_env_value("true") is True
        assert _convert_env_value("false") is False
        assert _convert_env_value("True") is True
        assert _convert_env_value("FALSE") is False
    
    def test_convert_env_value_integer(self):
        """Test converting environment variable to integer."""
        assert _convert_env_value("123") == 123
        assert _convert_env_value("-456") == -456
    
    def test_convert_env_value_float(self):
        """Test converting environment variable to float."""
        assert _convert_env_value("123.45") == 123.45
        assert _convert_env_value("-67.89") == -67.89
    
    def test_convert_env_value_string(self):
        """Test converting environment variable to string."""
        assert _convert_env_value("hello") == "hello"
        assert _convert_env_value("123abc") == "123abc"
    
    @patch.dict(os.environ, {
        'FOOTBALL_AUTOMATION_ENVIRONMENT': 'production',
        'FOOTBALL_AUTOMATION_DEBUG': 'true',
        'FOOTBALL_AUTOMATION_WEB_URL': 'https://prod.example.com',
        'FOOTBALL_AUTOMATION_MAX_CONCURRENT_JOBS': '4',
        'FOOTBALL_AUTOMATION_CACHE_DEFAULT_TTL': '7200'
    })
    def test_apply_environment_variables(self):
        """Test applying environment variable overrides."""
        config = AutomationConfig()
        config = _apply_environment_variables(config, "FOOTBALL_AUTOMATION_")
        
        assert config.environment == "production"
        assert config.debug is True
        assert config.web_downloader.url == "https://prod.example.com"
        assert config.processing.max_concurrent_jobs == 4
        assert config.caching.default_ttl == 7200
    
    @patch.dict(os.environ, {
        'FOOTBALL_AUTOMATION_WEB_URL': 'https://env.example.com'
    })
    def test_load_automation_config_with_env_override(self):
        """Test loading configuration with environment variable override."""
        config = load_automation_config()
        assert config.web_downloader.url == "https://env.example.com"
    
    def test_load_automation_config_with_file(self):
        """Test loading configuration from file."""
        config_dict = {
            "environment": "testing",
            "web_downloader": {
                "url": "https://file.example.com",
                "check_interval": 1800
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config_dict, f)
            temp_file = f.name
        
        try:
            config = load_automation_config(config_file=temp_file)
            assert config.environment == "testing"
            assert config.web_downloader.url == "https://file.example.com"
            assert config.web_downloader.check_interval == 1800
        finally:
            os.unlink(temp_file)


class TestDefaultConfigFiles:
    """Test default configuration file creation."""
    
    def test_create_default_config_files(self):
        """Test creating default configuration files."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config_dir = Path(temp_dir) / "automation"
            create_default_config_files(str(config_dir))
            
            # Check that all files were created
            assert (config_dir / "automation.json").exists()
            assert (config_dir / "automation.development.json").exists()
            assert (config_dir / "automation.testing.json").exists()
            assert (config_dir / "automation.staging.json").exists()
            assert (config_dir / "automation.production.json").exists()
            
            # Verify content of main config file
            with open(config_dir / "automation.json", 'r') as f:
                config_data = json.load(f)
            
            assert "web_downloader" in config_data
            assert "file_watcher" in config_data
            assert "processing" in config_data
            assert config_data["environment"] == "development"
            
            # Verify environment-specific config
            with open(config_dir / "automation.production.json", 'r') as f:
                prod_config = json.load(f)
            
            assert prod_config["environment"] == "production"
            assert prod_config["debug"] is False
            assert prod_config["security"]["enable_api_authentication"] is True


class TestNotificationConfig:
    """Test NotificationConfig validation and functionality."""
    
    def test_valid_config(self):
        """Test creating a valid notification configuration."""
        config = NotificationConfig(
            enabled=True,
            types=[NotificationType.EMAIL, NotificationType.WEBHOOK],
            rate_limit=10
        )
        assert config.enabled is True
        assert NotificationType.EMAIL in config.types
        assert NotificationType.WEBHOOK in config.types
        assert config.rate_limit == 10
    
    def test_zero_rate_limit_raises_error(self):
        """Test that zero rate limit raises error."""
        with pytest.raises(AutomationConfigError, match="Notification rate limit must be positive"):
            NotificationConfig(rate_limit=0)
    
    def test_enum_conversion_in_from_dict(self):
        """Test that string values are converted to enums when loading from dict."""
        config_dict = {
            "enabled": True,
            "types": ["email", "webhook"],
            "notification_levels": ["ERROR", "CRITICAL"],
            "rate_limit": 5
        }
        
        main_config_dict = {"notifications": config_dict}
        config = AutomationConfig.from_dict(main_config_dict)
        
        assert NotificationType.EMAIL in config.notifications.types
        assert NotificationType.WEBHOOK in config.notifications.types
        assert LogLevel.ERROR in config.notifications.notification_levels
        assert LogLevel.CRITICAL in config.notifications.notification_levels


if __name__ == "__main__":
    pytest.main([__file__])