"""
Configuration loading utilities for football data processing.

This module provides utilities for loading and validating configuration files,
particularly for team alias mappings and processing settings.
"""

import json
import os
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path


class ConfigurationError(Exception):
    """Exception raised for configuration-related errors."""
    pass


class ConfigLoader:
    """Utility class for loading and validating configuration files."""
    
    def __init__(self, config_dir: str = "config"):
        """
        Initialize the ConfigLoader.
        
        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = Path(config_dir)
        self._validate_config_directory()
    
    def _validate_config_directory(self) -> None:
        """Validate that the configuration directory exists or can be created."""
        if self.config_dir.exists() and not self.config_dir.is_dir():
            raise ConfigurationError(f"Configuration path '{self.config_dir}' is not a directory")
    
    def load_team_aliases_config(self, filename: str = "team_aliases.json") -> Dict[str, Any]:
        """
        Load and validate team aliases configuration.
        
        Args:
            filename: Name of the team aliases configuration file
            
        Returns:
            Dictionary containing validated configuration
            
        Raises:
            ConfigurationError: If configuration is invalid or missing
        """
        config_path = self.config_dir / filename
        
        if not config_path.exists():
            raise ConfigurationError(f"Team aliases configuration file '{config_path}' not found")
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in configuration file '{config_path}': {e}")
        except Exception as e:
            raise ConfigurationError(f"Error reading configuration file '{config_path}': {e}")
        
        # Validate configuration structure
        self._validate_team_aliases_config(config, config_path)
        
        return config
    
    def _validate_team_aliases_config(self, config: Dict[str, Any], config_path: Path) -> None:
        """
        Validate the structure and content of team aliases configuration.
        
        Args:
            config: Configuration dictionary to validate
            config_path: Path to configuration file (for error messages)
            
        Raises:
            ConfigurationError: If configuration is invalid
        """
        required_sections = ['aliases', 'heuristics', 'settings']
        
        # Check required top-level sections
        for section in required_sections:
            if section not in config:
                raise ConfigurationError(
                    f"Missing required section '{section}' in configuration file '{config_path}'"
                )
        
        # Validate aliases section
        self._validate_aliases_section(config['aliases'], config_path)
        
        # Validate heuristics section
        self._validate_heuristics_section(config['heuristics'], config_path)
        
        # Validate settings section
        self._validate_settings_section(config['settings'], config_path)
    
    def _validate_aliases_section(self, aliases: Any, config_path: Path) -> None:
        """Validate the aliases section of the configuration."""
        if not isinstance(aliases, dict):
            raise ConfigurationError(
                f"'aliases' section must be a dictionary in '{config_path}'"
            )
        
        for original, normalized in aliases.items():
            if not isinstance(original, str) or not isinstance(normalized, str):
                raise ConfigurationError(
                    f"All alias mappings must be strings in '{config_path}'. "
                    f"Found: {original} -> {normalized}"
                )
            
            if not original.strip() or not normalized.strip():
                raise ConfigurationError(
                    f"Empty team names not allowed in aliases in '{config_path}'. "
                    f"Found: '{original}' -> '{normalized}'"
                )
    
    def _validate_heuristics_section(self, heuristics: Any, config_path: Path) -> None:
        """Validate the heuristics section of the configuration."""
        if not isinstance(heuristics, dict):
            raise ConfigurationError(
                f"'heuristics' section must be a dictionary in '{config_path}'"
            )
        
        required_heuristic_keys = ['remove_patterns', 'replace_patterns']
        for key in required_heuristic_keys:
            if key not in heuristics:
                raise ConfigurationError(
                    f"Missing required heuristics key '{key}' in '{config_path}'"
                )
        
        # Validate remove_patterns
        if not isinstance(heuristics['remove_patterns'], list):
            raise ConfigurationError(
                f"'remove_patterns' must be a list in '{config_path}'"
            )
        
        for pattern in heuristics['remove_patterns']:
            if not isinstance(pattern, str):
                raise ConfigurationError(
                    f"All remove patterns must be strings in '{config_path}'"
                )
            self._validate_regex_pattern(pattern, config_path)
        
        # Validate replace_patterns
        if not isinstance(heuristics['replace_patterns'], dict):
            raise ConfigurationError(
                f"'replace_patterns' must be a dictionary in '{config_path}'"
            )
        
        for pattern, replacement in heuristics['replace_patterns'].items():
            if not isinstance(pattern, str) or not isinstance(replacement, str):
                raise ConfigurationError(
                    f"All replace patterns and replacements must be strings in '{config_path}'"
                )
            self._validate_regex_pattern(pattern, config_path)
    
    def _validate_settings_section(self, settings: Any, config_path: Path) -> None:
        """Validate the settings section of the configuration."""
        if not isinstance(settings, dict):
            raise ConfigurationError(
                f"'settings' section must be a dictionary in '{config_path}'"
            )
        
        # Validate numeric settings
        numeric_settings = {
            'max_edit_distance': int,
            'min_confidence_threshold': float
        }
        
        for setting, expected_type in numeric_settings.items():
            if setting in settings:
                value = settings[setting]
                if not isinstance(value, (int, float)) or (expected_type == int and not isinstance(value, int)):
                    raise ConfigurationError(
                        f"Setting '{setting}' must be a {expected_type.__name__} in '{config_path}'"
                    )
                
                if setting == 'max_edit_distance' and value < 0:
                    raise ConfigurationError(
                        f"'max_edit_distance' must be non-negative in '{config_path}'"
                    )
                
                if setting == 'min_confidence_threshold' and not (0.0 <= value <= 1.0):
                    raise ConfigurationError(
                        f"'min_confidence_threshold' must be between 0.0 and 1.0 in '{config_path}'"
                    )
        
        # Validate boolean settings
        boolean_settings = ['enable_fuzzy_matching', 'log_unmatched_teams']
        for setting in boolean_settings:
            if setting in settings and not isinstance(settings[setting], bool):
                raise ConfigurationError(
                    f"Setting '{setting}' must be a boolean in '{config_path}'"
                )
    
    def _validate_regex_pattern(self, pattern: str, config_path: Path) -> None:
        """
        Validate that a string is a valid regex pattern.
        
        Args:
            pattern: Regex pattern to validate
            config_path: Path to configuration file (for error messages)
            
        Raises:
            ConfigurationError: If pattern is invalid
        """
        try:
            re.compile(pattern)
        except re.error as e:
            raise ConfigurationError(
                f"Invalid regex pattern '{pattern}' in '{config_path}': {e}"
            )
    
    def create_default_config(self, filename: str = "team_aliases.json") -> Dict[str, Any]:
        """
        Create a default team aliases configuration file.
        
        Args:
            filename: Name of the configuration file to create
            
        Returns:
            Dictionary containing the default configuration
            
        Raises:
            ConfigurationError: If unable to create the configuration file
        """
        default_config = {
            "aliases": {
                "Kongói Közársság": "Kongói Köztársaság",
                "Hunik Krkkó": "Hutnik Krakkó",
                "FTC": "Ferencváros"
            },
            "heuristics": {
                "remove_patterns": [
                    "\\s+$",
                    "^\\s+",
                    "\\.$"
                ],
                "replace_patterns": {
                    "Közársság": "Köztársaság",
                    "Krkkó": "Krakkó"
                }
            },
            "settings": {
                "max_edit_distance": 2,
                "min_confidence_threshold": 0.8,
                "enable_fuzzy_matching": True,
                "log_unmatched_teams": True
            }
        }
        
        config_path = self.config_dir / filename
        
        try:
            # Create config directory if it doesn't exist
            self.config_dir.mkdir(parents=True, exist_ok=True)
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=2, ensure_ascii=False)
        except Exception as e:
            raise ConfigurationError(f"Error creating default configuration file '{config_path}': {e}")
        
        return default_config


def load_team_aliases_config(config_dir: str = "config", filename: str = "team_aliases.json") -> Dict[str, Any]:
    """
    Convenience function to load team aliases configuration.
    
    Args:
        config_dir: Directory containing configuration files
        filename: Name of the team aliases configuration file
        
    Returns:
        Dictionary containing validated configuration
        
    Raises:
        ConfigurationError: If configuration is invalid or missing
    """
    loader = ConfigLoader(config_dir)
    return loader.load_team_aliases_config(filename)


def create_default_team_aliases_config(config_dir: str = "config", filename: str = "team_aliases.json") -> Dict[str, Any]:
    """
    Convenience function to create default team aliases configuration.
    
    Args:
        config_dir: Directory to create configuration in
        filename: Name of the configuration file to create
        
    Returns:
        Dictionary containing the default configuration
        
    Raises:
        ConfigurationError: If unable to create the configuration file
    """
    loader = ConfigLoader(config_dir)
    return loader.create_default_config(filename)