"""
Unit tests for default configuration creation and loading.

This module tests the creation and loading of default configuration files
for team aliases and market priorities.
"""

import json
import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, mock_open

from src.converter.config_loader import (
    ConfigLoader,
    create_default_team_aliases_config,
    create_default_market_priorities_config,
    load_team_aliases_config
)
from src.converter.data_processor import DataProcessor
from src.converter.team_normalizer import TeamNormalizer
from src.converter.exceptions import ConfigurationError


class TestDefaultTeamAliasesConfig:
    """Test default team aliases configuration creation and loading."""
    
    def test_create_default_team_aliases_config_success(self):
        """Test successful creation of default team aliases configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config = create_default_team_aliases_config(temp_dir)
            
            # Verify config structure
            assert isinstance(config, dict)
            assert 'aliases' in config
            assert 'heuristics' in config
            assert 'settings' in config
            
            # Verify aliases section
            aliases = config['aliases']
            assert isinstance(aliases, dict)
            assert len(aliases) > 0
            assert 'Kongói Közársság' in aliases
            assert aliases['Kongói Közársság'] == 'Kongói Köztársaság'
            
            # Verify heuristics section
            heuristics = config['heuristics']
            assert 'remove_patterns' in heuristics
            assert 'replace_patterns' in heuristics
            assert isinstance(heuristics['remove_patterns'], list)
            assert isinstance(heuristics['replace_patterns'], dict)
            
            # Verify settings section
            settings = config['settings']
            assert 'max_edit_distance' in settings
            assert 'min_confidence_threshold' in settings
            assert 'enable_fuzzy_matching' in settings
            assert 'log_unmatched_teams' in settings
            
            # Verify file was created
            config_path = Path(temp_dir) / "team_aliases.json"
            assert config_path.exists()
            
            # Verify file content
            with open(config_path, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
            assert file_config == config
    
    def test_create_default_team_aliases_config_custom_filename(self):
        """Test creation with custom filename."""
        with tempfile.TemporaryDirectory() as temp_dir:
            custom_filename = "custom_aliases.json"
            config = create_default_team_aliases_config(temp_dir, custom_filename)
            
            config_path = Path(temp_dir) / custom_filename
            assert config_path.exists()
            
            with open(config_path, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
            assert file_config == config
    
    def test_create_default_team_aliases_config_creates_directory(self):
        """Test that configuration creation creates directory if it doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            nested_dir = Path(temp_dir) / "nested" / "config"
            config = create_default_team_aliases_config(str(nested_dir))
            
            config_path = nested_dir / "team_aliases.json"
            assert config_path.exists()
            assert nested_dir.exists()
    
    def test_create_default_team_aliases_config_file_error(self):
        """Test error handling when file creation fails."""
        with patch('builtins.open', mock_open()) as mock_file:
            mock_file.side_effect = PermissionError("Permission denied")
            
            with pytest.raises(ConfigurationError, match="Error creating default configuration file"):
                create_default_team_aliases_config("/invalid/path")
    
    def test_load_team_aliases_config_with_default(self):
        """Test loading team aliases configuration after creating default."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create default config
            default_config = create_default_team_aliases_config(temp_dir)
            
            # Load the config
            loaded_config = load_team_aliases_config(temp_dir)
            
            assert loaded_config == default_config
            
            # Verify it can be used with TeamNormalizer
            normalizer = TeamNormalizer(temp_dir)
            assert normalizer.aliases == default_config['aliases']


class TestDefaultMarketPrioritiesConfig:
    """Test default market priorities configuration creation and loading."""
    
    def test_create_default_market_priorities_config_success(self):
        """Test successful creation of default market priorities configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config = create_default_market_priorities_config(temp_dir)
            
            # Verify config structure
            assert isinstance(config, dict)
            assert 'market_priorities' in config
            assert 'settings' in config
            assert 'market_type_patterns' in config
            assert 'description' in config
            
            # Verify market priorities section
            priorities = config['market_priorities']
            assert isinstance(priorities, dict)
            assert len(priorities) > 0
            assert '1x2' in priorities
            assert priorities['1x2'] == 1  # Highest priority
            assert 'unknown' in priorities
            assert priorities['unknown'] == 99  # Low priority
            
            # Verify settings section
            settings = config['settings']
            assert 'max_additional_markets' in settings
            assert 'default_priority' in settings
            assert 'enable_priority_sorting' in settings
            assert settings['max_additional_markets'] == 10
            
            # Verify market type patterns
            patterns = config['market_type_patterns']
            assert isinstance(patterns, dict)
            assert '1x2' in patterns
            assert isinstance(patterns['1x2'], list)
            
            # Verify file was created
            config_path = Path(temp_dir) / "market_priorities.json"
            assert config_path.exists()
            
            # Verify file content
            with open(config_path, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
            assert file_config == config
    
    def test_create_default_market_priorities_config_custom_filename(self):
        """Test creation with custom filename."""
        with tempfile.TemporaryDirectory() as temp_dir:
            custom_filename = "custom_priorities.json"
            config = create_default_market_priorities_config(temp_dir, custom_filename)
            
            config_path = Path(temp_dir) / custom_filename
            assert config_path.exists()
            
            with open(config_path, 'r', encoding='utf-8') as f:
                file_config = json.load(f)
            assert file_config == config
    
    def test_create_default_market_priorities_config_creates_directory(self):
        """Test that configuration creation creates directory if it doesn't exist."""
        with tempfile.TemporaryDirectory() as temp_dir:
            nested_dir = Path(temp_dir) / "nested" / "config"
            config = create_default_market_priorities_config(str(nested_dir))
            
            config_path = nested_dir / "market_priorities.json"
            assert config_path.exists()
            assert nested_dir.exists()
    
    def test_create_default_market_priorities_config_file_error(self):
        """Test error handling when file creation fails."""
        with patch('builtins.open', mock_open()) as mock_file:
            mock_file.side_effect = PermissionError("Permission denied")
            
            with pytest.raises(ConfigurationError, match="Error creating default market priorities configuration file"):
                create_default_market_priorities_config("/invalid/path")
    
    def test_data_processor_loads_default_priorities(self):
        """Test that DataProcessor can load default market priorities."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create default config
            default_config = create_default_market_priorities_config(temp_dir)
            
            # Create DataProcessor with the config directory
            processor = DataProcessor(config_dir=temp_dir)
            
            # Verify priorities were loaded
            expected_priorities = default_config['market_priorities']
            assert processor.market_priorities == expected_priorities
            
            # Verify max_markets was updated from config
            expected_max_markets = default_config['settings']['max_additional_markets']
            assert processor.max_markets == expected_max_markets
    
    def test_data_processor_uses_defaults_when_config_missing(self):
        """Test that DataProcessor uses default priorities when config file is missing."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Don't create config file
            processor = DataProcessor(config_dir=temp_dir)
            
            # Verify default priorities are used
            assert '1x2' in processor.market_priorities
            assert processor.market_priorities['1x2'] == 1
            assert 'unknown' in processor.market_priorities
            assert processor.market_priorities['unknown'] == 99


class TestConfigLoaderDefaultCreation:
    """Test ConfigLoader default configuration creation methods."""
    
    def test_config_loader_create_default_config(self):
        """Test ConfigLoader.create_default_config method."""
        with tempfile.TemporaryDirectory() as temp_dir:
            loader = ConfigLoader(temp_dir)
            config = loader.create_default_config()
            
            # Verify config structure
            assert 'aliases' in config
            assert 'heuristics' in config
            assert 'settings' in config
            
            # Verify file was created
            config_path = Path(temp_dir) / "team_aliases.json"
            assert config_path.exists()
    
    def test_config_loader_create_default_config_custom_filename(self):
        """Test ConfigLoader.create_default_config with custom filename."""
        with tempfile.TemporaryDirectory() as temp_dir:
            loader = ConfigLoader(temp_dir)
            custom_filename = "custom.json"
            config = loader.create_default_config(custom_filename)
            
            config_path = Path(temp_dir) / custom_filename
            assert config_path.exists()
    
    def test_config_loader_validates_created_config(self):
        """Test that ConfigLoader validates the created default configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            loader = ConfigLoader(temp_dir)
            config = loader.create_default_config()
            
            # The created config should be valid for loading
            loaded_config = loader.load_team_aliases_config()
            assert loaded_config == config


class TestConfigurationIntegration:
    """Test integration between different configuration components."""
    
    def test_team_normalizer_with_default_config(self):
        """Test TeamNormalizer integration with default configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create default config
            create_default_team_aliases_config(temp_dir)
            
            # Initialize TeamNormalizer
            normalizer = TeamNormalizer(temp_dir)
            
            # Test normalization with default aliases
            result = normalizer.normalize("Kongói Közársság")
            assert result == "Kongói Köztársaság"
            
            # Test heuristic normalization
            result = normalizer.normalize("Test Team   ")  # Extra spaces
            assert result == "Test Team"  # Should be cleaned
    
    def test_data_processor_with_default_config(self):
        """Test DataProcessor integration with default configuration."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create default config
            create_default_market_priorities_config(temp_dir)
            
            # Initialize DataProcessor
            processor = DataProcessor(config_dir=temp_dir)
            
            # Test priority calculation
            market_1x2 = {'market_type': '1x2'}
            market_unknown = {'market_type': 'unknown'}
            
            priority_1x2 = processor._calculate_market_priority(market_1x2)
            priority_unknown = processor._calculate_market_priority(market_unknown)
            
            assert priority_1x2 < priority_unknown  # 1x2 should have higher priority
            assert priority_1x2 == 1
            assert priority_unknown == 99
    
    def test_both_configs_created_together(self):
        """Test creating both default configurations in the same directory."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create both default configs
            team_config = create_default_team_aliases_config(temp_dir)
            market_config = create_default_market_priorities_config(temp_dir)
            
            # Verify both files exist
            team_config_path = Path(temp_dir) / "team_aliases.json"
            market_config_path = Path(temp_dir) / "market_priorities.json"
            
            assert team_config_path.exists()
            assert market_config_path.exists()
            
            # Verify both can be loaded and used
            normalizer = TeamNormalizer(temp_dir)
            processor = DataProcessor(config_dir=temp_dir)
            
            assert normalizer.aliases == team_config['aliases']
            assert processor.market_priorities == market_config['market_priorities']


class TestConfigurationValidation:
    """Test validation of default configurations."""
    
    def test_default_team_aliases_config_is_valid(self):
        """Test that the default team aliases configuration is valid."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config = create_default_team_aliases_config(temp_dir)
            
            # Should be able to load without errors
            loader = ConfigLoader(temp_dir)
            loaded_config = loader.load_team_aliases_config()
            
            assert loaded_config == config
    
    def test_default_market_priorities_config_has_valid_priorities(self):
        """Test that default market priorities are valid integers."""
        with tempfile.TemporaryDirectory() as temp_dir:
            config = create_default_market_priorities_config(temp_dir)
            
            priorities = config['market_priorities']
            
            # All priorities should be positive integers
            for market_type, priority in priorities.items():
                assert isinstance(priority, int)
                assert priority > 0
                assert isinstance(market_type, str)
                assert len(market_type) > 0
    
    def test_default_configs_have_required_sections(self):
        """Test that default configurations have all required sections."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Test team aliases config
            team_config = create_default_team_aliases_config(temp_dir, "team_test.json")
            required_team_sections = ['aliases', 'heuristics', 'settings']
            for section in required_team_sections:
                assert section in team_config
                assert isinstance(team_config[section], dict)
            
            # Test market priorities config
            market_config = create_default_market_priorities_config(temp_dir, "market_test.json")
            required_market_sections = ['market_priorities', 'settings', 'market_type_patterns']
            for section in required_market_sections:
                assert section in market_config
                assert isinstance(market_config[section], dict)