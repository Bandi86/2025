"""
Configuration Manager for PDF to JSON Converter

This module provides centralized configuration management for the application.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class AppConfig:
    """Application configuration data class."""
    name: str
    version: str
    input_dir: Path
    output_dir: Path
    processed_dir: Path
    temp_dir: Path
    logs_dir: Path
    config_dir: Path
    default_json_type: str
    max_file_size_mb: int
    max_pages_preview: int
    max_markets_per_game: int
    api_host: str
    api_port: int
    log_level: str


class ConfigManager:
    """Centralized configuration manager."""

    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self._configs: Dict[str, Dict[str, Any]] = {}
        self._app_config: Optional[AppConfig] = None
        self._load_all_configs()

    def _load_config_file(self, filename: str) -> Dict[str, Any]:
        """Load a single configuration file."""
        config_path = self.config_dir / filename
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Configuration file not found: {config_path}")
            return {}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing configuration file {config_path}: {e}")
            return {}

    def _load_all_configs(self):
        """Load all configuration files."""
        config_files = [
            "app.json",
            "logging.json",
            "extractor_patterns.json",
            "market_keywords.json",
            "market_priorities.json",
            "team_aliases.json"
        ]

        for filename in config_files:
            name = filename.replace('.json', '')
            self._configs[name] = self._load_config_file(filename)

        # Create AppConfig from loaded data
        self._create_app_config()

    def _create_app_config(self):
        """Create AppConfig from loaded configuration."""
        app_config = self._configs.get("app", {})

        # Set up paths
        paths = app_config.get("paths", {})
        base_path = Path.cwd()

        self._app_config = AppConfig(
            name=app_config.get("app", {}).get("name", "PDF to JSON Converter"),
            version=app_config.get("app", {}).get("version", "1.0.0"),
            input_dir=base_path / paths.get("input_dir", "data/input"),
            output_dir=base_path / paths.get("output_dir", "data/output"),
            processed_dir=base_path / paths.get("processed_dir", "data/processed"),
            temp_dir=base_path / paths.get("temp_dir", "data/temp"),
            logs_dir=base_path / paths.get("logs_dir", "logs"),
            config_dir=base_path / paths.get("config_dir", "config"),
            default_json_type=app_config.get("processing", {}).get("default_json_type", "basic"),
            max_file_size_mb=app_config.get("processing", {}).get("max_file_size_mb", 100),
            max_pages_preview=app_config.get("processing", {}).get("max_pages_preview", 3),
            max_markets_per_game=app_config.get("football", {}).get("max_markets_per_game", 25),
            api_host=app_config.get("api", {}).get("host", "0.0.0.0"),
            api_port=app_config.get("api", {}).get("port", 8000),
            log_level=app_config.get("logging", {}).get("log_level", "INFO")
        )

    def get_app_config(self) -> AppConfig:
        """Get the application configuration."""
        return self._app_config

    def get_config(self, name: str) -> Dict[str, Any]:
        """Get a specific configuration by name."""
        return self._configs.get(name, {})

    def get_nested_config(self, *keys: str) -> Any:
        """Get nested configuration value using dot notation."""
        config = self._configs
        for key in keys:
            if isinstance(config, dict) and key in config:
                config = config[key]
            else:
                return None
        return config

    def update_config(self, name: str, updates: Dict[str, Any]):
        """Update a configuration section."""
        if name in self._configs:
            self._configs[name].update(updates)
            logger.info(f"Updated configuration: {name}")

    def save_config(self, name: str, filepath: Optional[str] = None):
        """Save a configuration to file."""
        if name not in self._configs:
            logger.error(f"Configuration not found: {name}")
            return False

        filepath = filepath or (self.config_dir / f"{name}.json")
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self._configs[name], f, indent=2, ensure_ascii=False)
            logger.info(f"Saved configuration to: {filepath}")
            return True
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
            return False

    def ensure_directories_exist(self):
        """Ensure all configured directories exist."""
        if self._app_config:
            directories = [
                self._app_config.input_dir,
                self._app_config.output_dir,
                self._app_config.processed_dir,
                self._app_config.temp_dir,
                self._app_config.logs_dir / "processing",
                self._app_config.logs_dir / "api",
                self._app_config.logs_dir / "debug"
            ]

            for directory in directories:
                directory.mkdir(parents=True, exist_ok=True)
                logger.debug(f"Ensured directory exists: {directory}")

    def get_logging_config_path(self) -> Path:
        """Get the logging configuration file path."""
        return self.config_dir / "logging.json"

    def reload_configs(self):
        """Reload all configurations from files."""
        self._configs.clear()
        self._load_all_configs()
        logger.info("Reloaded all configurations")


# Global configuration manager instance
_config_manager: Optional[ConfigManager] = None


def get_config_manager(config_dir: str = "config") -> ConfigManager:
    """Get the global configuration manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager(config_dir)
        _config_manager.ensure_directories_exist()
    return _config_manager


def get_app_config() -> AppConfig:
    """Get the global application configuration."""
    return get_config_manager().get_app_config()
