"""
Unit tests for configuration loading utilities.

Tests the ConfigLoader class and related functions for loading and validating
team aliases configuration files.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, mock_open

from src.converter.config_loader import (
    ConfigLoader,
    ConfigurationError,
    load_team_aliases_config,
    create_default_team_aliases_config
)


class TestConfigLoader(unittest.TestCase):
    """Test cases for the ConfigLoader class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Valid configuration for testing
        self.valid_config = {
            "aliases": {
                "Kongói Közársság": "Kongói Köztársaság",
                "FTC": "Ferencváros"
            },
            "heuristics": {
                "remove_patterns": ["\\s+$", "^\\s+"],
                "replace_patterns": {
                    "Közársság": "Köztársaság"
                },
                "case_normalization": {
                    "enabled": True
                }
            },
            "settings": {
                "max_edit_distance": 2,
                "min_confidence_threshold": 0.8,
                "enable_fuzzy_matching": True,
                "log_unmatched_teams": True
            }
        }
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def _write_config_file(self, config: dict, filename: str = "team_aliases.json"):
        """Helper method to write configuration to file."""
        config_path = self.config_dir / filename
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return config_path
    
    def test_init_valid_config_dir(self):
        """Test ConfigLoader initialization with valid config directory."""
        loader = ConfigLoader(str(self.config_dir))
        self.assertEqual(loader.config_dir, self.config_dir)
    
    def test_init_nonexistent_config_dir(self):
        """Test ConfigLoader initialization with nonexistent config directory."""
        nonexistent_dir = Path(self.temp_dir) / "nonexistent"
        # Should not raise an error - directory can be created later
        loader = ConfigLoader(str(nonexistent_dir))
        self.assertEqual(loader.config_dir, nonexistent_dir)
    
    def test_init_config_dir_is_file(self):
        """Test ConfigLoader initialization when config path is a file."""
        file_path = Path(self.temp_dir) / "not_a_dir"
        file_path.touch()
        
        with self.assertRaises(ConfigurationError) as context:
            ConfigLoader(str(file_path))
        
        self.assertIn("is not a directory", str(context.exception))
    
    def test_load_team_aliases_config_valid(self):
        """Test loading valid team aliases configuration."""
        self._write_config_file(self.valid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        config = loader.load_team_aliases_config()
        
        self.assertEqual(config, self.valid_config)
    
    def test_load_team_aliases_config_missing_file(self):
        """Test loading team aliases configuration when file is missing."""
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("not found", str(context.exception))
    
    def test_load_team_aliases_config_invalid_json(self):
        """Test loading team aliases configuration with invalid JSON."""
        config_path = self.config_dir / "team_aliases.json"
        with open(config_path, 'w') as f:
            f.write("{ invalid json }")
        
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("Invalid JSON", str(context.exception))
    
    def test_validate_team_aliases_config_missing_section(self):
        """Test validation with missing required section."""
        invalid_config = {"aliases": {}}  # Missing heuristics and settings
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("Missing required section", str(context.exception))
    
    def test_validate_aliases_section_invalid_type(self):
        """Test validation of aliases section with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["aliases"] = "not a dict"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a dictionary", str(context.exception))
    
    def test_validate_aliases_section_non_string_values(self):
        """Test validation of aliases section with non-string values."""
        invalid_config = self.valid_config.copy()
        invalid_config["aliases"] = {"team1": 123}  # Non-string value
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be strings", str(context.exception))
    
    def test_validate_aliases_section_empty_strings(self):
        """Test validation of aliases section with empty strings."""
        invalid_config = self.valid_config.copy()
        invalid_config["aliases"] = {"": "valid_team"}  # Empty original name
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("Empty team names not allowed", str(context.exception))
    
    def test_validate_heuristics_section_invalid_type(self):
        """Test validation of heuristics section with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"] = "not a dict"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a dictionary", str(context.exception))
    
    def test_validate_heuristics_section_missing_keys(self):
        """Test validation of heuristics section with missing required keys."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"] = {}  # Missing required keys
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("Missing required heuristics key", str(context.exception))
    
    def test_validate_remove_patterns_invalid_type(self):
        """Test validation of remove_patterns with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"]["remove_patterns"] = "not a list"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a list", str(context.exception))
    
    def test_validate_remove_patterns_non_string_items(self):
        """Test validation of remove_patterns with non-string items."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"]["remove_patterns"] = [123, "valid_pattern"]
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be strings", str(context.exception))
    
    def test_validate_replace_patterns_invalid_type(self):
        """Test validation of replace_patterns with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"]["replace_patterns"] = "not a dict"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a dictionary", str(context.exception))
    
    def test_validate_replace_patterns_non_string_values(self):
        """Test validation of replace_patterns with non-string values."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"]["replace_patterns"] = {"pattern": 123}
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be strings", str(context.exception))
    
    def test_validate_settings_section_invalid_type(self):
        """Test validation of settings section with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"] = "not a dict"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a dictionary", str(context.exception))
    
    def test_validate_settings_max_edit_distance_invalid_type(self):
        """Test validation of max_edit_distance with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"]["max_edit_distance"] = "not an int"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a int", str(context.exception))
    
    def test_validate_settings_max_edit_distance_negative(self):
        """Test validation of max_edit_distance with negative value."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"]["max_edit_distance"] = -1
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be non-negative", str(context.exception))
    
    def test_validate_settings_confidence_threshold_invalid_type(self):
        """Test validation of min_confidence_threshold with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"]["min_confidence_threshold"] = "not a float"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a float", str(context.exception))
    
    def test_validate_settings_confidence_threshold_out_of_range(self):
        """Test validation of min_confidence_threshold with out-of-range value."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"]["min_confidence_threshold"] = 1.5  # > 1.0
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be between 0.0 and 1.0", str(context.exception))
    
    def test_validate_settings_boolean_invalid_type(self):
        """Test validation of boolean settings with invalid type."""
        invalid_config = self.valid_config.copy()
        invalid_config["settings"]["enable_fuzzy_matching"] = "not a bool"
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("must be a boolean", str(context.exception))
    
    def test_validate_regex_pattern_invalid(self):
        """Test validation of invalid regex patterns."""
        invalid_config = self.valid_config.copy()
        invalid_config["heuristics"]["remove_patterns"] = ["[invalid_regex"]  # Missing closing bracket
        self._write_config_file(invalid_config)
        loader = ConfigLoader(str(self.config_dir))
        
        with self.assertRaises(ConfigurationError) as context:
            loader.load_team_aliases_config()
        
        self.assertIn("Invalid regex pattern", str(context.exception))
    
    def test_create_default_config(self):
        """Test creating default configuration file."""
        loader = ConfigLoader(str(self.config_dir))
        
        config = loader.create_default_config()
        
        # Verify file was created
        config_path = self.config_dir / "team_aliases.json"
        self.assertTrue(config_path.exists())
        
        # Verify content
        with open(config_path, 'r', encoding='utf-8') as f:
            saved_config = json.load(f)
        
        self.assertEqual(config, saved_config)
        self.assertIn("aliases", config)
        self.assertIn("heuristics", config)
        self.assertIn("settings", config)
    
    def test_create_default_config_custom_filename(self):
        """Test creating default configuration with custom filename."""
        loader = ConfigLoader(str(self.config_dir))
        custom_filename = "custom_aliases.json"
        
        config = loader.create_default_config(custom_filename)
        
        # Verify file was created with custom name
        config_path = self.config_dir / custom_filename
        self.assertTrue(config_path.exists())
    
    def test_create_default_config_directory_creation(self):
        """Test creating default configuration when directory doesn't exist."""
        new_config_dir = Path(self.temp_dir) / "new_config"
        loader = ConfigLoader(str(new_config_dir))
        
        # This should create the directory
        config = loader.create_default_config()
        
        # Verify directory and file were created
        self.assertTrue(new_config_dir.exists())
        config_path = new_config_dir / "team_aliases.json"
        self.assertTrue(config_path.exists())


class TestConvenienceFunctions(unittest.TestCase):
    """Test cases for convenience functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        self.valid_config = {
            "aliases": {"FTC": "Ferencváros"},
            "heuristics": {
                "remove_patterns": ["\\s+$"],
                "replace_patterns": {"test": "replacement"}
            },
            "settings": {
                "max_edit_distance": 2,
                "min_confidence_threshold": 0.8,
                "enable_fuzzy_matching": True,
                "log_unmatched_teams": True
            }
        }
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_load_team_aliases_config_function(self):
        """Test the load_team_aliases_config convenience function."""
        # Write config file
        config_path = self.config_dir / "team_aliases.json"
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(self.valid_config, f)
        
        config = load_team_aliases_config(str(self.config_dir))
        
        self.assertEqual(config, self.valid_config)
    
    def test_create_default_team_aliases_config_function(self):
        """Test the create_default_team_aliases_config convenience function."""
        config = create_default_team_aliases_config(str(self.config_dir))
        
        # Verify file was created
        config_path = self.config_dir / "team_aliases.json"
        self.assertTrue(config_path.exists())
        
        # Verify structure
        self.assertIn("aliases", config)
        self.assertIn("heuristics", config)
        self.assertIn("settings", config)


if __name__ == '__main__':
    unittest.main()