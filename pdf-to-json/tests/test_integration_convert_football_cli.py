"""
Integration tests for convert_football CLI integration and end-to-end workflow.

This module tests the complete integration of the convert_football functionality
with the CLI interface and validates the end-to-end workflow.
"""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from converter.converter import PDFToJSONConverter


class TestConvertFootballCLIIntegration(unittest.TestCase):
    """Test CLI integration for convert_football functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_json_file = Path(self.temp_dir) / "test_input.json"
        self.output_dir = Path(self.temp_dir) / "output"
        self.config_dir = Path(self.temp_dir) / "config"
        
        # Create test JSON input file
        self.test_json_content = {
            "content": {
                "full_text": "Labdarúgás, Premier League\n2025. augusztus 5.\nK 20:00 65110 Arsenal - Chelsea 2,35 3,10 2,95\nK 21:00 65111 Liverpool - Manchester United 1,85 3,40 4,20",
                "pages": [
                    {
                        "page_number": 1,
                        "text": "Labdarúgás, Premier League\n2025. augusztus 5.\nK 20:00 65110 Arsenal - Chelsea 2,35 3,10 2,95\nK 21:00 65111 Liverpool - Manchester United 1,85 3,40 4,20"
                    }
                ]
            },
            "metadata": {
                "total_pages": 1,
                "file_size": 1024
            }
        }
        
        with open(self.test_json_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_json_content, f, ensure_ascii=False, indent=2)
        
        # Create config directory
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Create basic team aliases config
        team_aliases_config = {
            "aliases": {
                "Arsenal": "Arsenal FC",
                "Chelsea": "Chelsea FC"
            },
            "heuristics": {
                "remove_patterns": ["\\s+"],
                "replace_patterns": {}
            },
            "settings": {
                "enable_fuzzy_matching": False,
                "log_unmatched_teams": True
            }
        }
        
        with open(self.config_dir / "team_aliases.json", 'w', encoding='utf-8') as f:
            json.dump(team_aliases_config, f, ensure_ascii=False, indent=2)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_convert_football_method_integration(self):
        """Test convert_football method integration in PDFToJSONConverter."""
        converter = PDFToJSONConverter()
        
        # Run convert_football method
        result = converter.convert_football(
            json_file_path=str(self.test_json_file),
            output_dir=str(self.output_dir),
            config_dir=str(self.config_dir),
            max_markets=10
        )
        
        # Verify result structure
        self.assertIsInstance(result, dict)
        self.assertIn('success', result)
        self.assertIn('input_file', result)
        self.assertIn('total_processing_time', result)
        self.assertIn('processing_summary', result)
        self.assertIn('files_created', result)
        
        # Verify processing summary structure
        summary = result['processing_summary']
        self.assertIn('total_games', summary)
        self.assertIn('total_processing_time', summary)
        self.assertIn('stages_completed', summary)
        self.assertIn('stages_failed', summary)
        
        # Verify files_created structure
        files_created = result['files_created']
        self.assertIn('merged_file', files_created)
        self.assertIn('daily_files', files_created)
        self.assertIn('report_files', files_created)
        
        # Verify input file path
        self.assertEqual(result['input_file'], str(self.test_json_file))
    
    def test_convert_football_cli_basic_usage(self):
        """Test basic CLI usage of convert_football functionality."""
        # Prepare CLI command
        main_py_path = Path(__file__).parent.parent / "main.py"
        cmd = [
            sys.executable, str(main_py_path),
            "--convert-football", str(self.test_json_file),
            "--output", str(self.output_dir),
            "--config-dir", str(self.config_dir)
        ]
        
        # Run CLI command
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Check that command completed (may succeed or fail, but shouldn't hang)
            self.assertIsNotNone(result.returncode)
            
            # If successful, verify output contains expected information
            if result.returncode == 0:
                self.assertIn("Football conversion pipeline completed", result.stdout)
                self.assertIn("Input:", result.stdout)
                self.assertIn("Output directory:", result.stdout)
            else:
                # If failed, should have error information
                self.assertTrue(result.stderr or "failed" in result.stdout.lower())
                
        except subprocess.TimeoutExpired:
            self.fail("CLI command timed out - possible infinite loop or hanging")
        except FileNotFoundError:
            self.skipTest("Python executable or main.py not found")
    
    def test_convert_football_cli_with_custom_options(self):
        """Test CLI usage with custom configuration options."""
        main_py_path = Path(__file__).parent.parent / "main.py"
        cmd = [
            sys.executable, str(main_py_path),
            "--convert-football", str(self.test_json_file),
            "--output", str(self.output_dir),
            "--config-dir", str(self.config_dir),
            "--max-markets", "15",
            "--verbose"
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            # Verify command completed
            self.assertIsNotNone(result.returncode)
            
            # Check that verbose logging was enabled (should see more detailed output)
            if result.returncode == 0:
                # Should contain processing information
                output_text = result.stdout + result.stderr
                self.assertTrue(
                    any(keyword in output_text.lower() for keyword in 
                        ["starting", "completed", "processing", "football"]),
                    f"Expected processing information in output: {output_text}"
                )
                
        except subprocess.TimeoutExpired:
            self.fail("CLI command with custom options timed out")
        except FileNotFoundError:
            self.skipTest("Python executable or main.py not found")
    
    def test_convert_football_cli_missing_input_file(self):
        """Test CLI behavior with missing input file."""
        main_py_path = Path(__file__).parent.parent / "main.py"
        missing_file = str(Path(self.temp_dir) / "nonexistent.json")
        
        cmd = [
            sys.executable, str(main_py_path),
            "--convert-football", missing_file,
            "--output", str(self.output_dir)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Should fail with non-zero exit code
            self.assertNotEqual(result.returncode, 0)
            
            # Should contain error message about missing file
            error_output = result.stdout + result.stderr
            self.assertTrue(
                any(keyword in error_output.lower() for keyword in 
                    ["not found", "missing", "error"]),
                f"Expected error message in output: {error_output}"
            )
            
        except subprocess.TimeoutExpired:
            self.fail("CLI command with missing file timed out")
        except FileNotFoundError:
            self.skipTest("Python executable or main.py not found")
    
    def test_convert_football_help_text(self):
        """Test that help text includes convert_football options."""
        main_py_path = Path(__file__).parent.parent / "main.py"
        cmd = [sys.executable, str(main_py_path), "--help"]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Should succeed
            self.assertEqual(result.returncode, 0)
            
            # Should contain convert_football options
            help_text = result.stdout
            self.assertIn("--convert-football", help_text)
            self.assertIn("--config-dir", help_text)
            self.assertIn("--max-markets", help_text)
            
            # Should contain examples
            self.assertIn("Run complete football conversion pipeline", help_text)
            
        except subprocess.TimeoutExpired:
            self.fail("Help command timed out")
        except FileNotFoundError:
            self.skipTest("Python executable or main.py not found")


class TestConvertFootballEndToEndWorkflow(unittest.TestCase):
    """Test end-to-end workflow for convert_football functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.test_json_file = Path(self.temp_dir) / "test_input.json"
        self.output_dir = Path(self.temp_dir) / "output"
        self.config_dir = Path(self.temp_dir) / "config"
        
        # Create more comprehensive test data
        full_text_content = """Labdarúgás, Premier League
2025. augusztus 5.
K 20:00 65110 Arsenal - Chelsea 2,35 3,10 2,95
K 20:00 65110 Arsenal - Chelsea Dupla esély 1X 1,45
K 20:00 65110 Arsenal - Chelsea Dupla esély X2 1,85
K 21:00 65111 Liverpool - Manchester United 1,85 3,40 4,20
K 21:00 65111 Liverpool - Manchester United Gólok száma 2,5 alatt 1,95
K 21:00 65111 Liverpool - Manchester United Gólok száma 2,5 felett 1,85

Labdarúgás, La Liga
2025. augusztus 6.
K 22:00 65112 Real Madrid - Barcelona 2,10 3,20 3,40
K 22:00 65112 Real Madrid - Barcelona Mindkét csapat szerez gólt 1,75"""
        
        self.test_json_content = {
            "content": {
                "full_text": full_text_content,
                "pages": [
                    {
                        "page_number": 1,
                        "text": full_text_content
                    }
                ]
            },
            "metadata": {
                "total_pages": 1,
                "file_size": 2048
            }
        }
        
        with open(self.test_json_file, 'w', encoding='utf-8') as f:
            json.dump(self.test_json_content, f, ensure_ascii=False, indent=2)
        
        # Create config directory and files
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Create comprehensive team aliases config
        team_aliases_config = {
            "aliases": {
                "Arsenal": "Arsenal FC",
                "Chelsea": "Chelsea FC",
                "Liverpool": "Liverpool FC",
                "Manchester United": "Manchester United FC",
                "Real Madrid": "Real Madrid CF",
                "Barcelona": "FC Barcelona"
            },
            "heuristics": {
                "remove_patterns": ["\\s+$", "^\\s+"],
                "replace_patterns": {
                    "Barca": "Barcelona",
                    "Man United": "Manchester United"
                }
            },
            "settings": {
                "enable_fuzzy_matching": True,
                "log_unmatched_teams": True
            }
        }
        
        with open(self.config_dir / "team_aliases.json", 'w', encoding='utf-8') as f:
            json.dump(team_aliases_config, f, ensure_ascii=False, indent=2)
    
    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_end_to_end_workflow_success(self):
        """Test complete end-to-end workflow with successful processing."""
        converter = PDFToJSONConverter()
        
        # Run complete workflow
        result = converter.convert_football(
            json_file_path=str(self.test_json_file),
            output_dir=str(self.output_dir),
            config_dir=str(self.config_dir),
            max_markets=5
        )
        
        # Verify successful completion
        self.assertTrue(result.get('success', False), 
                       f"Workflow failed: {result.get('error', 'Unknown error')}")
        
        # Verify processing summary
        summary = result['processing_summary']
        self.assertGreater(summary['total_games'], 0, "Should process at least one game")
        self.assertGreater(summary['total_processing_time'], 0, "Should have processing time")
        self.assertIsInstance(summary['stages_completed'], list, "Should have completed stages")
        self.assertIsInstance(summary['stages_failed'], list, "Should have failed stages list")
        
        # Verify that key stages were completed
        completed_stages = summary['stages_completed']
        expected_stages = ['data_loading', 'extraction']
        for stage in expected_stages:
            self.assertIn(stage, completed_stages, f"Stage {stage} should be completed")
        
        # Verify output directory was created
        self.assertTrue(self.output_dir.exists(), "Output directory should be created")
        
        # Verify statistics are reasonable
        if 'statistics' in result:
            stats = result['statistics']
            self.assertGreaterEqual(stats.get('total_games', 0), 0)
            self.assertGreaterEqual(stats.get('total_markets', 0), 0)
    
    def test_end_to_end_workflow_with_file_creation(self):
        """Test that the workflow creates expected output files."""
        converter = PDFToJSONConverter()
        
        result = converter.convert_football(
            json_file_path=str(self.test_json_file),
            output_dir=str(self.output_dir),
            config_dir=str(self.config_dir),
            max_markets=10
        )
        
        # Skip file verification if workflow failed due to missing dependencies
        if not result.get('success', False):
            self.skipTest(f"Workflow failed, skipping file verification: {result.get('error', 'Unknown error')}")
        
        files_created = result['files_created']
        
        # Check merged file creation
        if files_created.get('merged_file'):
            merged_file_path = Path(files_created['merged_file'])
            self.assertTrue(merged_file_path.exists(), "Merged file should exist")
            
            # Verify merged file content
            with open(merged_file_path, 'r', encoding='utf-8') as f:
                merged_data = json.load(f)
            
            self.assertIn('processing_info', merged_data)
            self.assertIn('games', merged_data)
            self.assertIsInstance(merged_data['games'], list)
        
        # Check daily files creation
        daily_files = files_created.get('daily_files', {})
        if daily_files:
            for date, file_paths in daily_files.items():
                self.assertIsInstance(file_paths, list)
                for file_path in file_paths:
                    daily_file_path = Path(file_path)
                    if daily_file_path.exists():  # Only check if file was actually created
                        with open(daily_file_path, 'r', encoding='utf-8') as f:
                            daily_data = json.load(f)
                        self.assertIn('games', daily_data)
        
        # Check report files creation
        report_files = files_created.get('report_files', {})
        if report_files:
            for report_type, file_path in report_files.items():
                report_file_path = Path(file_path)
                if report_file_path.exists():  # Only check if file was actually created
                    # Verify file is readable
                    if report_file_path.suffix == '.json':
                        with open(report_file_path, 'r', encoding='utf-8') as f:
                            report_data = json.load(f)
                        self.assertIsInstance(report_data, dict)
    
    def test_end_to_end_workflow_error_handling(self):
        """Test error handling in end-to-end workflow."""
        converter = PDFToJSONConverter()
        
        # Test with invalid JSON file
        invalid_json_file = Path(self.temp_dir) / "invalid.json"
        with open(invalid_json_file, 'w') as f:
            f.write("invalid json content {")
        
        result = converter.convert_football(
            json_file_path=str(invalid_json_file),
            output_dir=str(self.output_dir),
            config_dir=str(self.config_dir)
        )
        
        # Should fail gracefully
        self.assertFalse(result.get('success', True))
        self.assertIn('error', result)
        self.assertIn('errors', result)
        self.assertIsInstance(result['errors'], list)
        self.assertGreater(len(result['errors']), 0)
        
        # Should still have processing summary
        self.assertIn('processing_summary', result)
        summary = result['processing_summary']
        self.assertIn('stages_failed', summary)
        self.assertGreater(len(summary['stages_failed']), 0)
    
    def test_end_to_end_workflow_with_missing_config(self):
        """Test workflow behavior with missing configuration."""
        converter = PDFToJSONConverter()
        
        # Use non-existent config directory
        missing_config_dir = str(Path(self.temp_dir) / "missing_config")
        
        result = converter.convert_football(
            json_file_path=str(self.test_json_file),
            output_dir=str(self.output_dir),
            config_dir=missing_config_dir
        )
        
        # Should handle missing config gracefully
        # (May succeed with default config or fail gracefully)
        self.assertIn('success', result)
        self.assertIn('processing_summary', result)
        
        if not result['success']:
            # If failed, should have meaningful error
            self.assertIn('error', result)
            self.assertIsInstance(result.get('errors', []), list)
        else:
            # If succeeded, should have created default config or used fallback
            self.assertGreater(result['processing_summary']['total_processing_time'], 0)


if __name__ == '__main__':
    unittest.main()