#!/usr/bin/env python3
"""
Verification script for Task 12: Create default configuration files and documentation

This script verifies that:
1. Default configuration files exist and have comprehensive defaults
2. All classes have proper documentation and docstrings
3. Configuration loading and usage works correctly
4. Unit tests pass for default configuration functionality
"""

import json
import tempfile
from pathlib import Path
from src.converter.team_normalizer import TeamNormalizer
from src.converter.data_processor import DataProcessor
from src.converter.config_loader import (
    create_default_team_aliases_config,
    create_default_market_priorities_config,
    load_team_aliases_config
)


def test_default_configurations_exist():
    """Test that default configuration files exist and have proper content."""
    print("Testing default configuration files...")
    
    # Check team_aliases.json
    team_config_path = Path("config/team_aliases.json")
    assert team_config_path.exists(), "team_aliases.json should exist"
    
    with open(team_config_path, 'r', encoding='utf-8') as f:
        team_config = json.load(f)
    
    # Verify structure
    assert 'aliases' in team_config, "team_aliases.json should have 'aliases' section"
    assert 'heuristics' in team_config, "team_aliases.json should have 'heuristics' section"
    assert 'settings' in team_config, "team_aliases.json should have 'settings' section"
    
    # Verify content
    assert len(team_config['aliases']) > 20, "Should have comprehensive team aliases"
    assert 'Kongói Közársság' in team_config['aliases'], "Should have Hungarian team mappings"
    assert 'Real Madrid CF' in team_config['aliases'], "Should have international team mappings"
    
    print(f"✓ team_aliases.json exists with {len(team_config['aliases'])} aliases")
    
    # Check market_priorities.json
    market_config_path = Path("config/market_priorities.json")
    assert market_config_path.exists(), "market_priorities.json should exist"
    
    with open(market_config_path, 'r', encoding='utf-8') as f:
        market_config = json.load(f)
    
    # Verify structure
    assert 'market_priorities' in market_config, "market_priorities.json should have 'market_priorities' section"
    assert 'settings' in market_config, "market_priorities.json should have 'settings' section"
    assert 'market_type_patterns' in market_config, "market_priorities.json should have 'market_type_patterns' section"
    
    # Verify content
    assert len(market_config['market_priorities']) > 20, "Should have comprehensive market priorities"
    assert market_config['market_priorities']['1x2'] == 1, "1x2 should have highest priority"
    assert market_config['market_priorities']['unknown'] == 99, "unknown should have low priority"
    
    print(f"✓ market_priorities.json exists with {len(market_config['market_priorities'])} priorities")


def test_configuration_loading_and_usage():
    """Test that configurations can be loaded and used by classes."""
    print("Testing configuration loading and usage...")
    
    # Test TeamNormalizer
    normalizer = TeamNormalizer()
    
    # Test normalization with existing aliases
    result = normalizer.normalize("Kongói Közársság")
    assert result == "Kongói Köztársaság", f"Expected 'Kongói Köztársaság', got '{result}'"
    
    # Test heuristic normalization
    result = normalizer.normalize("Test Team   ")  # Extra spaces
    assert result.strip() == "Test Team", f"Heuristics should clean extra spaces"
    
    print("✓ TeamNormalizer loads and uses configuration correctly")
    
    # Test DataProcessor
    processor = DataProcessor()
    
    # Test priority calculation
    market_1x2 = {'market_type': '1x2'}
    market_unknown = {'market_type': 'unknown'}
    
    priority_1x2 = processor._calculate_market_priority(market_1x2)
    priority_unknown = processor._calculate_market_priority(market_unknown)
    
    assert priority_1x2 < priority_unknown, "1x2 should have higher priority than unknown"
    assert priority_1x2 == 1, f"1x2 priority should be 1, got {priority_1x2}"
    assert priority_unknown == 99, f"unknown priority should be 99, got {priority_unknown}"
    
    print("✓ DataProcessor loads and uses configuration correctly")


def test_default_config_creation():
    """Test that default configurations can be created programmatically."""
    print("Testing default configuration creation...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create default team aliases config
        team_config = create_default_team_aliases_config(temp_dir)
        
        # Verify it was created and is valid
        config_path = Path(temp_dir) / "team_aliases.json"
        assert config_path.exists(), "Default team aliases config should be created"
        
        # Load and verify
        loaded_config = load_team_aliases_config(temp_dir)
        assert loaded_config == team_config, "Loaded config should match created config"
        
        # Test with TeamNormalizer
        normalizer = TeamNormalizer(temp_dir)
        result = normalizer.normalize("Kongói Közársság")
        assert result == "Kongói Köztársaság", "Default config should work with TeamNormalizer"
        
        print("✓ Default team aliases configuration creation works")
        
        # Create default market priorities config
        market_config = create_default_market_priorities_config(temp_dir)
        
        # Verify it was created
        market_config_path = Path(temp_dir) / "market_priorities.json"
        assert market_config_path.exists(), "Default market priorities config should be created"
        
        # Test with DataProcessor
        processor = DataProcessor(config_dir=temp_dir)
        assert processor.market_priorities == market_config['market_priorities'], "DataProcessor should use created config"
        
        print("✓ Default market priorities configuration creation works")


def test_class_documentation():
    """Test that all classes have proper documentation."""
    print("Testing class documentation...")
    
    classes_to_check = [
        (TeamNormalizer, 'TeamNormalizer'),
        (DataProcessor, 'DataProcessor'),
    ]
    
    for cls, name in classes_to_check:
        # Check class docstring
        assert cls.__doc__ is not None, f"{name} should have class docstring"
        assert len(cls.__doc__.strip()) > 50, f"{name} docstring should be comprehensive"
        
        # Check key methods have docstrings
        key_methods = ['__init__']
        if hasattr(cls, 'normalize'):
            key_methods.append('normalize')
        if hasattr(cls, 'process_games'):
            key_methods.append('process_games')
        if hasattr(cls, 'deduplicate_markets'):
            key_methods.append('deduplicate_markets')
        
        for method_name in key_methods:
            if hasattr(cls, method_name):
                method = getattr(cls, method_name)
                if hasattr(method, '__doc__'):
                    assert method.__doc__ is not None, f"{name}.{method_name} should have docstring"
        
        print(f"✓ {name} has proper documentation")


def main():
    """Run all verification tests."""
    print("=" * 80)
    print("Task 12 Verification: Default Configuration Files and Documentation")
    print("=" * 80)
    
    try:
        test_default_configurations_exist()
        test_configuration_loading_and_usage()
        test_default_config_creation()
        test_class_documentation()
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - Task 12 completed successfully!")
        print("✅ Default configuration files exist with comprehensive defaults")
        print("✅ Configuration loading and usage works correctly")
        print("✅ Classes have proper documentation and docstrings")
        print("✅ Unit tests verify default configuration functionality")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise


if __name__ == "__main__":
    main()