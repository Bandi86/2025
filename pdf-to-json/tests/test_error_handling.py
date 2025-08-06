"""
Tests for error handling and recovery mechanisms in the football data processing pipeline.

This module tests the custom exception classes, graceful degradation strategies,
and error recovery mechanisms throughout the system.
"""

import pytest
import json
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any, List

from src.converter.exceptions import (
    FootballProcessingError, ConfigurationError, DataQualityError,
    ProcessingError, ExtractionError, NormalizationError,
    MarketProcessingError, DataProcessingError, SplittingError,
    ReportingError, FileSystemError, ValidationError,
    create_exception
)
from src.converter.logging_config import LoggingConfig, ContextLoggerAdapter
from src.converter.football_converter import FootballConverter
from src.converter.team_normalizer import TeamNormalizer
from src.converter.config_loader import ConfigLoader


class TestCustomExceptions:
    """Test custom exception classes and their functionality."""
    
    def test_football_processing_error_basic(self):
        """Test basic FootballProcessingError functionality."""
        error = FootballProcessingError("Test error message")
        
        assert str(error) == "Test error message"
        assert error.message == "Test error message"
        assert error.error_code is None
        assert error.context == {}
        assert error.original_exception is None
    
    def test_football_processing_error_with_context(self):
        """Test FootballProcessingError with context information."""
        context = {'stage': 'extraction', 'file': 'test.json'}
        error = FootballProcessingError(
            "Test error with context",
            error_code="TEST_ERROR",
            context=context
        )
        
        assert error.error_code == "TEST_ERROR"
        assert error.context == context
        assert "[TEST_ERROR]" in str(error)
        assert "stage=extraction" in str(error)
    
    def test_football_processing_error_to_dict(self):
        """Test FootballProcessingError serialization."""
        original_error = ValueError("Original error")
        error = FootballProcessingError(
            "Test error",
            error_code="TEST_ERROR",
            context={'key': 'value'},
            original_exception=original_error
        )
        
        error_dict = error.to_dict()
        
        assert error_dict['error_type'] == 'FootballProcessingError'
        assert error_dict['message'] == 'Test error'
        assert error_dict['error_code'] == 'TEST_ERROR'
        assert error_dict['context'] == {'key': 'value'}
        assert error_dict['original_exception'] == 'Original error'
    
    def test_configuration_error(self):
        """Test ConfigurationError specific functionality."""
        error = ConfigurationError(
            "Config file not found",
            config_file="config/test.json",
            config_section="aliases"
        )
        
        assert error.config_file == "config/test.json"
        assert error.config_section == "aliases"
        assert error.error_code == "CONFIG_ERROR"
        assert "config_file=config/test.json" in str(error)
    
    def test_data_quality_error(self):
        """Test DataQualityError specific functionality."""
        error = DataQualityError(
            "Invalid team name",
            data_field="home_team",
            data_value="",
            validation_rule="non_empty"
        )
        
        assert error.data_field == "home_team"
        assert error.data_value == ""
        assert error.validation_rule == "non_empty"
        assert error.error_code == "DATA_QUALITY_ERROR"
    
    def test_processing_error_with_stage(self):
        """Test ProcessingError with stage information."""
        game_info = {'home_team': 'Team A', 'away_team': 'Team B'}
        error = ProcessingError(
            "Processing failed",
            stage="normalization",
            game_info=game_info
        )
        
        assert error.stage == "normalization"
        assert error.game_info == game_info
        assert error.error_code == "PROCESSING_ERROR"
    
    def test_extraction_error(self):
        """Test ExtractionError specific functionality."""
        error = ExtractionError(
            "Failed to extract data",
            source_file="test.pdf",
            extraction_method="pdfplumber"
        )
        
        assert error.source_file == "test.pdf"
        assert error.extraction_method == "pdfplumber"
        assert error.stage == "extraction"
        assert error.error_code == "EXTRACTION_ERROR"
    
    def test_normalization_error(self):
        """Test NormalizationError specific functionality."""
        error = NormalizationError(
            "Failed to normalize team name",
            team_name="Invalid Team",
            normalization_method="fuzzy_matching"
        )
        
        assert error.team_name == "Invalid Team"
        assert error.normalization_method == "fuzzy_matching"
        assert error.stage == "normalization"
        assert error.error_code == "NORMALIZATION_ERROR"
    
    def test_create_exception_factory(self):
        """Test the exception factory function."""
        error = create_exception(
            'configuration',
            'Test config error',
            config_file='test.json'
        )
        
        assert isinstance(error, ConfigurationError)
        assert error.message == 'Test config error'
        assert error.config_file == 'test.json'
    
    def test_create_exception_unknown_type(self):
        """Test exception factory with unknown type."""
        error = create_exception('unknown_type', 'Test error')
        
        assert isinstance(error, FootballProcessingError)
        assert error.message == 'Test error'


class TestLoggingConfiguration:
    """Test logging configuration and context logging."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.log_dir = Path(self.temp_dir) / "logs"
    
    def teardown_method(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def test_logging_config_initialization(self):
        """Test LoggingConfig initialization."""
        config = LoggingConfig(str(self.log_dir), "DEBUG")
        
        assert config.log_dir == self.log_dir
        assert config.log_dir.exists()
        assert config.log_level == 10  # DEBUG level
    
    def test_get_logger(self):
        """Test getting a logger with context."""
        config = LoggingConfig(str(self.log_dir))
        context = {'component': 'test', 'version': '1.0'}
        
        logger = config.get_logger('test_logger', context)
        
        assert isinstance(logger, ContextLoggerAdapter)
        assert logger.extra == context
    
    def test_get_component_logger(self):
        """Test getting a component-specific logger."""
        config = LoggingConfig(str(self.log_dir))
        
        logger = config.get_component_logger('extractor', version='1.0')
        
        assert isinstance(logger, ContextLoggerAdapter)
        assert logger.extra['component'] == 'extractor'
        assert logger.extra['version'] == '1.0'
    
    def test_context_logger_adapter(self):
        """Test ContextLoggerAdapter functionality."""
        import logging
        base_logger = logging.getLogger('test')
        context = {'key1': 'value1'}
        
        adapter = ContextLoggerAdapter(base_logger, context)
        
        # Test adding context
        new_adapter = adapter.add_context(key2='value2')
        assert new_adapter.extra['key1'] == 'value1'
        assert new_adapter.extra['key2'] == 'value2'
    
    def test_log_pipeline_events(self):
        """Test pipeline event logging methods."""
        config = LoggingConfig(str(self.log_dir))
        logger = config.get_logger('test')
        
        # Test pipeline start logging
        input_info = {'file': 'test.json', 'size': 1024}
        config.log_pipeline_start(logger, 'test_pipeline', input_info)
        
        # Test pipeline end logging
        results = {'games': 10, 'errors': 0}
        config.log_pipeline_end(logger, 'test_pipeline', True, 5.5, results)
        
        # Test error logging
        error = ValueError("Test error")
        config.log_error_with_context(logger, error, 'extraction', {'file': 'test.json'})
        
        # Verify log files were created
        log_files = list(self.log_dir.glob("*.log"))
        assert len(log_files) > 0


class TestErrorHandlingInComponents:
    """Test error handling in individual components."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir(parents=True)
    
    def teardown_method(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def test_config_loader_missing_file(self):
        """Test ConfigLoader with missing configuration file."""
        loader = ConfigLoader(str(self.config_dir))
        
        with pytest.raises(ConfigurationError) as exc_info:
            loader.load_team_aliases_config("nonexistent.json")
        
        assert "not found" in str(exc_info.value)
        assert exc_info.value.error_code == "CONFIG_ERROR"
    
    def test_config_loader_invalid_json(self):
        """Test ConfigLoader with invalid JSON."""
        config_file = self.config_dir / "invalid.json"
        config_file.write_text("{ invalid json }")
        
        loader = ConfigLoader(str(self.config_dir))
        
        with pytest.raises(ConfigurationError) as exc_info:
            loader.load_team_aliases_config("invalid.json")
        
        assert "Invalid JSON" in str(exc_info.value)
    
    def test_config_loader_missing_sections(self):
        """Test ConfigLoader with missing required sections."""
        config_file = self.config_dir / "incomplete.json"
        config_file.write_text('{"aliases": {}}')  # Missing heuristics and settings
        
        loader = ConfigLoader(str(self.config_dir))
        
        with pytest.raises(ConfigurationError) as exc_info:
            loader.load_team_aliases_config("incomplete.json")
        
        assert "Missing required section" in str(exc_info.value)
    
    def test_team_normalizer_fallback_behavior(self):
        """Test TeamNormalizer fallback behavior with invalid config."""
        # Create invalid config
        config_file = self.config_dir / "team_aliases.json"
        config_file.write_text('{"invalid": "config"}')
        
        with pytest.raises(ConfigurationError):
            TeamNormalizer(str(self.config_dir))
    
    def test_football_converter_initialization_error(self):
        """Test FootballConverter initialization with invalid config."""
        with patch('src.converter.football_converter.TeamNormalizer') as mock_normalizer:
            mock_normalizer.side_effect = Exception("Initialization failed")
            
            with pytest.raises(ConfigurationError) as exc_info:
                FootballConverter(str(self.config_dir))
            
            assert "Failed to initialize FootballConverter" in str(exc_info.value)


class TestGracefulDegradation:
    """Test graceful degradation strategies."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.output_dir = Path(self.temp_dir) / "output"
        
        # Create minimal valid config
        self.config_dir.mkdir(parents=True)
        config_data = {
            "aliases": {},
            "heuristics": {
                "remove_patterns": [],
                "replace_patterns": {}
            },
            "settings": {
                "enable_fuzzy_matching": False,
                "log_unmatched_teams": False
            }
        }
        config_file = self.config_dir / "team_aliases.json"
        config_file.write_text(json.dumps(config_data))
    
    def teardown_method(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def test_converter_with_extraction_failure(self):
        """Test converter behavior when extraction fails."""
        converter = FootballConverter(str(self.config_dir))
        
        # Mock extractor to fail
        with patch.object(converter.extractor, 'extract_football_data') as mock_extract:
            mock_extract.side_effect = Exception("Extraction failed")
            
            # Create test input file
            input_file = Path(self.temp_dir) / "test_input.json"
            input_file.write_text('{"content": "test content"}')
            
            result = converter.convert_football(str(input_file), str(self.output_dir))
            
            # Should continue with empty matches list
            assert result['success'] is True  # Pipeline continues despite extraction failure
            assert result['processing_summary']['total_games'] == 0
            assert 'extraction' in result['processing_summary']['stages_failed']
    
    def test_converter_with_normalization_failure(self):
        """Test converter behavior when normalization fails partially."""
        converter = FootballConverter(str(self.config_dir))
        
        # Mock extractor to return test matches
        test_matches = [
            {'home_team': 'Team A', 'away_team': 'Team B', 'home_odds': 2.0, 'away_odds': 3.0},
            {'home_team': 'Team C', 'away_team': 'Team D', 'home_odds': 1.5, 'away_odds': 4.0}
        ]
        
        with patch.object(converter.extractor, 'extract_football_data') as mock_extract:
            mock_extract.return_value = test_matches
            
            # Mock normalizer to fail on second match
            with patch.object(converter.team_normalizer, 'normalize') as mock_normalize:
                def normalize_side_effect(team_name):
                    if team_name in ['Team C', 'Team D']:
                        raise Exception("Normalization failed")
                    return team_name
                
                mock_normalize.side_effect = normalize_side_effect
                
                # Create test input file
                input_file = Path(self.temp_dir) / "test_input.json"
                input_file.write_text('{"content": "test content"}')
                
                result = converter.convert_football(str(input_file), str(self.output_dir))
                
                # Should continue with partial normalization
                assert result['success'] is True
                assert len(result['warnings']) > 0  # Should have warnings about failed normalizations
    
    def test_converter_with_file_system_error(self):
        """Test converter behavior with file system errors."""
        converter = FootballConverter(str(self.config_dir))
        
        # Try to write to a read-only directory
        readonly_dir = Path(self.temp_dir) / "readonly"
        readonly_dir.mkdir()
        readonly_dir.chmod(0o444)  # Read-only
        
        try:
            # Create test input file
            input_file = Path(self.temp_dir) / "test_input.json"
            input_file.write_text('{"content": "test content"}')
            
            result = converter.convert_football(str(input_file), str(readonly_dir))
            
            # Should continue with graceful degradation despite file system errors
            assert result['success'] is True  # Pipeline continues despite file system errors
            assert len(result['errors']) > 0 or len(result['warnings']) > 0  # But should have errors/warnings
        finally:
            # Restore permissions for cleanup
            readonly_dir.chmod(0o755)
    
    def test_converter_with_invalid_input_file(self):
        """Test converter behavior with invalid input file."""
        converter = FootballConverter(str(self.config_dir))
        
        # Test with non-existent file
        result = converter.convert_football("nonexistent.json", str(self.output_dir))
        
        assert result['success'] is False
        assert "not found" in result['error'].lower()
        assert 'data_loading' in result['processing_summary']['stages_failed']
    
    def test_converter_with_invalid_json_content(self):
        """Test converter behavior with invalid JSON content."""
        converter = FootballConverter(str(self.config_dir))
        
        # Create invalid JSON file
        input_file = Path(self.temp_dir) / "invalid.json"
        input_file.write_text('{ invalid json content }')
        
        result = converter.convert_football(str(input_file), str(self.output_dir))
        
        assert result['success'] is False
        assert "Invalid JSON" in result['error']
    
    def test_converter_with_missing_content_section(self):
        """Test converter behavior with missing content section."""
        converter = FootballConverter(str(self.config_dir))
        
        # Create JSON without content section
        input_file = Path(self.temp_dir) / "no_content.json"
        input_file.write_text('{"other_section": "data"}')
        
        result = converter.convert_football(str(input_file), str(self.output_dir))
        
        assert result['success'] is False
        assert "missing 'content' section" in result['error']


class TestErrorRecoveryMechanisms:
    """Test error recovery mechanisms and retry logic."""
    
    def setup_method(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = Path(self.temp_dir) / "config"
        self.config_dir.mkdir(parents=True)
    
    def teardown_method(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)
    
    def test_team_normalizer_fallback_config_creation(self):
        """Test TeamNormalizer fallback configuration creation."""
        # Initialize converter with non-existent config directory
        nonexistent_dir = str(Path(self.temp_dir) / "nonexistent")
        
        converter = FootballConverter(nonexistent_dir)
        
        # Should have created default configuration
        assert converter.team_normalizer is not None
        config_file = Path(nonexistent_dir) / "team_aliases.json"
        assert config_file.exists()
        
        # Verify config content
        with open(config_file) as f:
            config = json.load(f)
        assert "aliases" in config
        assert "heuristics" in config
        assert "settings" in config
    
    def test_converter_stage_isolation(self):
        """Test that failure in one stage doesn't prevent others from running."""
        converter = FootballConverter(str(self.config_dir))
        
        # Mock various stages to fail
        with patch.object(converter.market_processor, 'merge_matches_by_game') as mock_merge:
            mock_merge.side_effect = Exception("Merging failed")
            
            with patch.object(converter.extractor, 'extract_football_data') as mock_extract:
                mock_extract.return_value = [
                    {'home_team': 'Team A', 'away_team': 'Team B', 'home_odds': 2.0, 'away_odds': 3.0}
                ]
                
                # Create test input file
                input_file = Path(self.temp_dir) / "test_input.json"
                input_file.write_text('{"content": "test content"}')
                
                result = converter.convert_football(str(input_file), str(self.temp_dir))
                
                # Should continue despite merging failure
                assert result['success'] is True
                assert 'merging' in result['processing_summary']['stages_failed']
                assert 'extraction' in result['processing_summary']['stages_completed']
    
    def test_error_context_preservation(self):
        """Test that error context is preserved through the pipeline."""
        converter = FootballConverter(str(self.config_dir))
        
        # Create a custom error with context
        original_error = DataQualityError(
            "Invalid team name",
            data_field="home_team",
            data_value="",
            context={'match_id': 123, 'line_number': 45}
        )
        
        with patch.object(converter.extractor, 'extract_football_data') as mock_extract:
            mock_extract.side_effect = original_error
            
            # Create test input file
            input_file = Path(self.temp_dir) / "test_input.json"
            input_file.write_text('{"content": "test content"}')
            
            result = converter.convert_football(str(input_file), str(self.temp_dir))
            
            # Pipeline continues with graceful degradation, but error should be logged
            assert result['success'] is True  # Pipeline continues despite extraction failure
            assert 'extraction' in result['processing_summary']['stages_failed']
            assert len(result['errors']) > 0  # Error should be recorded


if __name__ == '__main__':
    pytest.main([__file__])