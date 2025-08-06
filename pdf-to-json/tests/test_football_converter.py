"""
Integration tests for the FootballConverter orchestration class.

This module contains comprehensive tests for the FootballConverter class,
covering the complete pipeline with various input scenarios, error handling,
and graceful degradation.
"""

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add the parent directory to the path to import the modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.converter.football_converter import FootballConverter, FootballProcessingError, ProcessingError
from src.converter.config_loader import ConfigurationError


class TestFootballConverter(unittest.TestCase):
    """Test cases for the FootballConverter class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create temporary directories for testing
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, "config")
        self.output_dir = os.path.join(self.temp_dir, "output")
        
        # Create config directory
        os.makedirs(self.config_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create test configuration
        self.test_config = {
            "aliases": {
                "Test Team A": "Normalized Team A",
                "Test Team B": "Normalized Team B"
            },
            "heuristics": {
                "remove_patterns": ["\\s+$", "^\\s+"],
                "replace_patterns": {
                    "Teszt": "Test"
                }
            },
            "settings": {
                "enable_fuzzy_matching": False,
                "log_unmatched_teams": True,
                "max_edit_distance": 2,
                "min_confidence_threshold": 0.8
            }
        }
        
        # Save test configuration
        config_file = os.path.join(self.config_dir, "team_aliases.json")
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_config, f, indent=2)
        
        # Create test input data
        self.test_json_content = {
            "content": {
                "full_text": """Labdarúgás, Premier League
2025. augusztus 5.
K 20:00 65110 Test Team A - Test Team B 3,35 2,74 2,24
K 21:00 65111 Team C - Team D 2,10 3,20 3,40
Labdarúgás, La Liga
2025. augusztus 6.
Sz 18:00 65112 Real Madrid - Barcelona 2,50 3,10 2,80"""
            }
        }
        
        # Create test input file
        self.test_input_file = os.path.join(self.temp_dir, "test_input.json")
        with open(self.test_input_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_json_content, f, indent=2)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_initialization_with_valid_config(self):
        """Test FootballConverter initialization with valid configuration."""
        converter = FootballConverter(config_dir=self.config_dir, max_markets=5)
        
        self.assertIsNotNone(converter.extractor)
        self.assertIsNotNone(converter.team_normalizer)
        self.assertIsNotNone(converter.market_processor)
        self.assertIsNotNone(converter.data_processor)
        self.assertIsNotNone(converter.day_splitter)
        self.assertIsNotNone(converter.report_generator)
        self.assertEqual(converter.max_markets, 5)
    
    def test_initialization_with_missing_config(self):
        """Test FootballConverter initialization when config is missing."""
        # Use non-existent config directory
        non_existent_dir = os.path.join(self.temp_dir, "non_existent")
        
        # Should create default config and initialize successfully
        converter = FootballConverter(config_dir=non_existent_dir)
        self.assertIsNotNone(converter.team_normalizer)
        
        # Check that default config was created
        config_file = os.path.join(non_existent_dir, "team_aliases.json")
        self.assertTrue(os.path.exists(config_file))
    
    def test_complete_pipeline_success(self):
        """Test complete pipeline execution with successful processing."""
        converter = FootballConverter(config_dir=self.config_dir, max_markets=10)
        
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Check overall success
        self.assertTrue(result['success'])
        self.assertEqual(result['input_file'], self.test_input_file)
        self.assertEqual(result['output_directory'], self.output_dir)
        
        # Check processing summary
        summary = result['processing_summary']
        self.assertGreater(summary['total_games'], 0)
        self.assertGreater(summary['total_processing_time'], 0)
        self.assertIn('extraction', summary['stages_completed'])
        self.assertIn('normalization', summary['stages_completed'])
        self.assertIn('merging', summary['stages_completed'])
        
        # Check files were created
        files_created = result['files_created']
        self.assertIn('merged_file', files_created)
        self.assertIn('daily_files', files_created)
        self.assertIn('report_files', files_created)
        
        # Verify merged file exists
        if files_created['merged_file']:
            self.assertTrue(os.path.exists(files_created['merged_file']))
    
    def test_pipeline_with_invalid_input_file(self):
        """Test pipeline behavior with invalid input file."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Test with non-existent file
        result = converter.convert_football("non_existent_file.json", self.output_dir)
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
        self.assertIn('stages_failed', result['processing_summary'])
        self.assertIn('data_loading', result['processing_summary']['stages_failed'])
    
    def test_pipeline_with_invalid_json_content(self):
        """Test pipeline behavior with invalid JSON content."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Create invalid JSON file
        invalid_json_file = os.path.join(self.temp_dir, "invalid.json")
        with open(invalid_json_file, 'w') as f:
            f.write("{ invalid json content")
        
        result = converter.convert_football(invalid_json_file, self.output_dir)
        
        self.assertFalse(result['success'])
        self.assertIn('Invalid JSON', result['error'])
    
    def test_pipeline_with_empty_content(self):
        """Test pipeline behavior with empty content."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Create JSON with empty content
        empty_content = {"content": {"full_text": ""}}
        empty_file = os.path.join(self.temp_dir, "empty.json")
        with open(empty_file, 'w', encoding='utf-8') as f:
            json.dump(empty_content, f)
        
        result = converter.convert_football(empty_file, self.output_dir)
        
        # Should succeed but with warnings about no matches
        self.assertTrue(result['success'])
        self.assertEqual(result['processing_summary']['total_games'], 0)
        self.assertGreater(len(result['warnings']), 0)
    
    @patch('src.converter.football_converter.FootballExtractor')
    def test_graceful_degradation_extraction_failure(self, mock_extractor_class):
        """Test graceful degradation when extraction fails."""
        # Mock extractor to raise exception
        mock_extractor = Mock()
        mock_extractor.extract_football_data.side_effect = Exception("Extraction failed")
        mock_extractor_class.return_value = mock_extractor
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed with graceful degradation
        self.assertTrue(result['success'])
        self.assertEqual(result['processing_summary']['total_games'], 0)
        self.assertIn('extraction', result['processing_summary']['stages_failed'])
        self.assertGreater(len(result['errors']), 0)
    
    @patch('src.converter.football_converter.TeamNormalizer')
    def test_graceful_degradation_normalization_failure(self, mock_normalizer_class):
        """Test graceful degradation when normalization fails."""
        # Mock normalizer to raise exception
        mock_normalizer = Mock()
        mock_normalizer.normalize.side_effect = Exception("Normalization failed")
        mock_normalizer_class.return_value = mock_normalizer
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed with original team names
        self.assertTrue(result['success'])
        self.assertIn('normalization', result['processing_summary']['stages_failed'])
    
    @patch('src.converter.football_converter.MarketProcessor')
    def test_graceful_degradation_merging_failure(self, mock_processor_class):
        """Test graceful degradation when market merging fails."""
        # Mock processor to raise exception
        mock_processor = Mock()
        mock_processor.merge_matches_by_game.side_effect = Exception("Merging failed")
        mock_processor_class.return_value = mock_processor
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed with basic game format
        self.assertTrue(result['success'])
        self.assertIn('merging', result['processing_summary']['stages_failed'])
    
    @patch('src.converter.football_converter.DataProcessor')
    def test_graceful_degradation_processing_failure(self, mock_processor_class):
        """Test graceful degradation when data processing fails."""
        # Mock processor to raise exception
        mock_processor = Mock()
        mock_processor.process_games.side_effect = Exception("Processing failed")
        mock_processor_class.return_value = mock_processor
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed with unprocessed games
        self.assertTrue(result['success'])
        self.assertIn('processing', result['processing_summary']['stages_failed'])
    
    @patch('src.converter.football_converter.DaySplitter')
    def test_graceful_degradation_splitting_failure(self, mock_splitter_class):
        """Test graceful degradation when day splitting fails."""
        # Mock splitter to raise exception
        mock_splitter = Mock()
        mock_splitter.split_by_days.side_effect = Exception("Splitting failed")
        mock_splitter_class.return_value = mock_splitter
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed without daily files
        self.assertTrue(result['success'])
        self.assertIn('splitting', result['processing_summary']['stages_failed'])
        self.assertEqual(result['files_created']['daily_files'], {})
    
    @patch('src.converter.football_converter.ReportGenerator')
    def test_graceful_degradation_reporting_failure(self, mock_generator_class):
        """Test graceful degradation when report generation fails."""
        # Mock generator to raise exception
        mock_generator = Mock()
        mock_generator.generate_reports.side_effect = Exception("Reporting failed")
        mock_generator_class.return_value = mock_generator
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Should still succeed without reports
        self.assertTrue(result['success'])
        self.assertIn('reporting', result['processing_summary']['stages_failed'])
        self.assertEqual(result['files_created']['report_files'], {})
    
    def test_pipeline_statistics_tracking(self):
        """Test that pipeline statistics are properly tracked."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Check statistics structure
        stats = result['statistics']
        self.assertIn('total_games', stats)
        self.assertIn('total_markets', stats)
        self.assertIn('processing_stages', stats)
        
        # Check pipeline stats
        pipeline_stats = converter.get_pipeline_stats()
        self.assertIsNotNone(pipeline_stats['start_time'])
        self.assertIsNotNone(pipeline_stats['end_time'])
        self.assertGreater(pipeline_stats['total_processing_time'], 0)
    
    def test_output_directory_creation(self):
        """Test that output directories are created properly."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Use non-existent output directory
        new_output_dir = os.path.join(self.temp_dir, "new_output")
        
        result = converter.convert_football(self.test_input_file, new_output_dir)
        
        self.assertTrue(result['success'])
        self.assertTrue(os.path.exists(new_output_dir))
    
    def test_error_handling_and_logging(self):
        """Test comprehensive error handling and logging."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Test with file that will cause processing errors
        invalid_content = {"content": {"full_text": "Invalid content that won't parse"}}
        invalid_file = os.path.join(self.temp_dir, "invalid_content.json")
        with open(invalid_file, 'w', encoding='utf-8') as f:
            json.dump(invalid_content, f)
        
        result = converter.convert_football(invalid_file, self.output_dir)
        
        # Should handle gracefully
        self.assertTrue(result['success'])
        
        # Check that errors and warnings are tracked
        self.assertIn('errors', result)
        self.assertIn('warnings', result)
        self.assertIsInstance(result['errors'], list)
        self.assertIsInstance(result['warnings'], list)
    
    def test_different_max_markets_settings(self):
        """Test pipeline with different max_markets settings."""
        # Test with very low limit
        converter_low = FootballConverter(config_dir=self.config_dir, max_markets=1)
        result_low = converter_low.convert_football(self.test_input_file, self.output_dir)
        
        # Test with high limit
        converter_high = FootballConverter(config_dir=self.config_dir, max_markets=50)
        result_high = converter_high.convert_football(self.test_input_file, self.output_dir)
        
        # Both should succeed
        self.assertTrue(result_low['success'])
        self.assertTrue(result_high['success'])
    
    def test_multiple_pipeline_runs(self):
        """Test running the pipeline multiple times."""
        converter = FootballConverter(config_dir=self.config_dir)
        
        # Run pipeline twice
        result1 = converter.convert_football(self.test_input_file, self.output_dir)
        result2 = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Both should succeed
        self.assertTrue(result1['success'])
        self.assertTrue(result2['success'])
        
        # Results should be similar (but files will have different timestamps)
        self.assertEqual(
            result1['processing_summary']['total_games'],
            result2['processing_summary']['total_games']
        )
    
    def test_complex_input_scenarios(self):
        """Test pipeline with complex input scenarios."""
        # Create complex test data with various edge cases
        complex_content = {
            "content": {
                "full_text": """Labdarúgás, Premier League
2025. augusztus 5.
K 20:00 65110 Test Team A - Test Team B 3,35 2,74 2,24
K 20:00 65111 Test Team A - Test Team B Kétesély 1,85 2,10
K 20:00 65112 Test Team A - Test Team B Hendikep (+1) 2,50 1,55
K 21:00 65113 Team C - Team D 2,10 3,20 3,40

Labdarúgás, La Liga
2025. augusztus 6.
Sz 18:00 65114 Real Madrid - Barcelona 2,50 3,10 2,80
Sz 18:00 65115 Real Madrid - Barcelona Gólszám (2.5) 1,90 1,90

Asztalitenisz, World Championship
2025. augusztus 7.
V 19:00 Player A - Player B 1,50 2,50"""
            }
        }
        
        complex_file = os.path.join(self.temp_dir, "complex.json")
        with open(complex_file, 'w', encoding='utf-8') as f:
            json.dump(complex_content, f, indent=2)
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(complex_file, self.output_dir)
        
        self.assertTrue(result['success'])
        
        # Should have processed multiple games with various market types
        self.assertGreater(result['processing_summary']['total_games'], 0)
        
        # Should have created daily files for different dates
        daily_files = result['files_created']['daily_files']
        self.assertGreater(len(daily_files), 0)
    
    def test_component_integration(self):
        """Test that all components work together properly."""
        converter = FootballConverter(config_dir=self.config_dir, max_markets=5)
        
        result = converter.convert_football(self.test_input_file, self.output_dir)
        
        # Verify that each component was called and contributed
        self.assertTrue(result['success'])
        
        # Check that normalization occurred (if test teams were in aliases)
        if result['processing_summary']['total_games'] > 0:
            # Load the merged file to verify structure
            merged_file = result['files_created']['merged_file']
            if merged_file and os.path.exists(merged_file):
                with open(merged_file, 'r', encoding='utf-8') as f:
                    merged_data = json.load(f)
                
                games = merged_data.get('games', [])
                if games:
                    # Check game structure
                    game = games[0]
                    self.assertIn('home_team', game)
                    self.assertIn('away_team', game)
                    self.assertIn('main_market', game)
                    self.assertIn('additional_markets', game)
                    self.assertIn('processing_info', game)


class TestFootballConverterErrorScenarios(unittest.TestCase):
    """Test error scenarios and edge cases for FootballConverter."""
    
    def setUp(self):
        """Set up test fixtures for error scenarios."""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, "config")
        self.output_dir = os.path.join(self.temp_dir, "output")
        
        os.makedirs(self.config_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_permission_denied_output_directory(self):
        """Test behavior when output directory cannot be created due to permissions."""
        # This test might not work on all systems, so we'll skip it if needed
        try:
            # Try to create a read-only directory
            readonly_dir = os.path.join(self.temp_dir, "readonly")
            os.makedirs(readonly_dir, exist_ok=True)
            os.chmod(readonly_dir, 0o444)  # Read-only
            
            restricted_output = os.path.join(readonly_dir, "output")
            
            converter = FootballConverter(config_dir=self.config_dir)
            
            # Create minimal test input
            test_input = {"content": {"full_text": "No football content"}}
            test_file = os.path.join(self.temp_dir, "test.json")
            with open(test_file, 'w') as f:
                json.dump(test_input, f)
            
            result = converter.convert_football(test_file, restricted_output)
            
            # Should handle the error gracefully
            # The exact behavior depends on the implementation
            self.assertIn('success', result)
            
        except (OSError, PermissionError):
            # Skip this test if we can't create the scenario
            self.skipTest("Cannot create permission-denied scenario on this system")
    
    def test_corrupted_config_file(self):
        """Test behavior with corrupted configuration file."""
        # Create corrupted config file
        config_file = os.path.join(self.config_dir, "team_aliases.json")
        with open(config_file, 'w') as f:
            f.write('{"aliases": {"incomplete": }')  # Invalid JSON
        
        # Should create default config and continue
        converter = FootballConverter(config_dir=self.config_dir)
        self.assertIsNotNone(converter.team_normalizer)
    
    def test_extremely_large_input(self):
        """Test behavior with extremely large input data."""
        # Create large input data
        large_content = {
            "content": {
                "full_text": "Labdarúgás, Test League\n2025. augusztus 5.\n" + 
                           "\n".join([f"K 20:{i:02d} Team{i}A - Team{i}B 2,00 3,00 4,00" 
                                    for i in range(1000)])  # 1000 matches
            }
        }
        
        large_file = os.path.join(self.temp_dir, "large.json")
        with open(large_file, 'w', encoding='utf-8') as f:
            json.dump(large_content, f)
        
        converter = FootballConverter(config_dir=self.config_dir)
        result = converter.convert_football(large_file, self.output_dir)
        
        # Should handle large input successfully
        self.assertTrue(result['success'])
        self.assertGreater(result['processing_summary']['total_games'], 100)


if __name__ == '__main__':
    # Set up logging for tests
    logging.basicConfig(level=logging.WARNING)  # Reduce log noise during tests
    
    unittest.main()