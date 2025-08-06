"""
Unit tests for DaySplitter class
"""

import json
import pytest
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, mock_open
from datetime import datetime

from src.converter.day_splitter import DaySplitter


class TestDaySplitter:
    """Test cases for DaySplitter class"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.day_splitter = DaySplitter()
        self.temp_dir = tempfile.mkdtemp()
        
        # Sample game data for testing
        self.sample_games = [
            {
                'league': 'Premier League',
                'date': '2025. augusztus 5.',
                'time': 'K 20:00',
                'home_team': 'Arsenal',
                'away_team': 'Chelsea',
                'main_market': {
                    'home_odds': 2.5,
                    'draw_odds': 3.2,
                    'away_odds': 2.8,
                    'market_type': '1X2'
                },
                'additional_markets': [],
                'total_markets': 1
            },
            {
                'league': 'Premier League',
                'date': '2025. augusztus 5.',
                'time': 'K 22:00',
                'home_team': 'Liverpool',
                'away_team': 'Manchester United',
                'main_market': {
                    'home_odds': 1.8,
                    'draw_odds': 3.5,
                    'away_odds': 4.2,
                    'market_type': '1X2'
                },
                'additional_markets': [],
                'total_markets': 1
            },
            {
                'league': 'La Liga',
                'date': '2025. augusztus 6.',
                'time': 'Sz 18:00',
                'home_team': 'Barcelona',
                'away_team': 'Real Madrid',
                'main_market': {
                    'home_odds': 2.1,
                    'draw_odds': 3.0,
                    'away_odds': 3.4,
                    'market_type': '1X2'
                },
                'additional_markets': [],
                'total_markets': 1
            },
            {
                'league': 'Bundesliga',
                'date': None,  # Undated game
                'time': 'V 19:00',
                'home_team': 'Bayern Munich',
                'away_team': 'Borussia Dortmund',
                'main_market': {
                    'home_odds': 1.9,
                    'draw_odds': 3.8,
                    'away_odds': 3.9,
                    'market_type': '1X2'
                },
                'additional_markets': [],
                'total_markets': 1
            }
        ]
    
    def teardown_method(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_init(self):
        """Test DaySplitter initialization"""
        splitter = DaySplitter()
        
        assert hasattr(splitter, 'hungarian_months')
        assert hasattr(splitter, 'date_patterns')
        assert hasattr(splitter, 'processing_stats')
        
        # Check Hungarian months mapping
        assert splitter.hungarian_months['augusztus'] == '08'
        assert splitter.hungarian_months['január'] == '01'
        assert splitter.hungarian_months['december'] == '12'
        
        # Check initial stats
        assert splitter.processing_stats['total_games'] == 0
        assert splitter.processing_stats['dated_games'] == 0
        assert splitter.processing_stats['undated_games'] == 0
    
    def test_split_by_days_basic(self):
        """Test basic day splitting functionality"""
        result = self.day_splitter.split_by_days(self.sample_games, self.temp_dir)
        
        # Check return structure
        assert isinstance(result, dict)
        assert '2025-08-05' in result
        assert '2025-08-06' in result
        assert 'undated' in result
        
        # Check files were created
        assert len(result['2025-08-05']) == 1
        assert len(result['2025-08-06']) == 1
        assert len(result['undated']) == 1
        
        # Verify files exist
        for date, files in result.items():
            for file_path in files:
                assert Path(file_path).exists()
    
    def test_split_by_days_statistics(self):
        """Test processing statistics after splitting"""
        self.day_splitter.split_by_days(self.sample_games, self.temp_dir)
        
        stats = self.day_splitter.get_processing_stats()
        
        assert stats['total_games'] == 4
        assert stats['dated_games'] == 3
        assert stats['undated_games'] == 1
        assert stats['files_created'] == 3
        assert '2025-08-05' in stats['dates_processed']
        assert '2025-08-06' in stats['dates_processed']
    
    def test_extract_date_from_game_hungarian_format(self):
        """Test date extraction from Hungarian format"""
        game = {'date': '2025. augusztus 5.'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result == '2025-08-05'
        
        game = {'date': '2025. január 15.'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result == '2025-01-15'
        
        game = {'date': '2025. december 31.'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result == '2025-12-31'
    
    def test_extract_date_from_game_iso_format(self):
        """Test date extraction from ISO format"""
        game = {'iso_date': '2025-08-05'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result == '2025-08-05'
        
        game = {'date': '2025-12-25'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result == '2025-12-25'
    
    def test_extract_date_from_game_missing_date(self):
        """Test date extraction when date is missing"""
        game = {'home_team': 'Arsenal', 'away_team': 'Chelsea'}
        result = self.day_splitter._extract_date_from_game(game)
        assert result is None
        
        game = {'date': None}
        result = self.day_splitter._extract_date_from_game(game)
        assert result is None
        
        game = {'date': ''}
        result = self.day_splitter._extract_date_from_game(game)
        assert result is None
    
    def test_is_iso_date(self):
        """Test ISO date format validation"""
        assert self.day_splitter._is_iso_date('2025-08-05') is True
        assert self.day_splitter._is_iso_date('2025-12-31') is True
        assert self.day_splitter._is_iso_date('2025-01-01') is True
        
        assert self.day_splitter._is_iso_date('2025-8-5') is False
        assert self.day_splitter._is_iso_date('25-08-05') is False
        assert self.day_splitter._is_iso_date('2025.08.05') is False
        assert self.day_splitter._is_iso_date('2025/08/05') is False
        assert self.day_splitter._is_iso_date('invalid') is False
        assert self.day_splitter._is_iso_date(None) is False
        assert self.day_splitter._is_iso_date(123) is False
    
    def test_convert_to_iso_date_hungarian(self):
        """Test conversion of Hungarian date formats"""
        # Standard format
        assert self.day_splitter._convert_to_iso_date('2025. augusztus 5.') == '2025-08-05'
        assert self.day_splitter._convert_to_iso_date('2025. január 1.') == '2025-01-01'
        assert self.day_splitter._convert_to_iso_date('2025. december 31.') == '2025-12-31'
        
        # Alternative format without dots
        assert self.day_splitter._convert_to_iso_date('2025 augusztus 5') == '2025-08-05'
        
        # Abbreviated months
        assert self.day_splitter._convert_to_iso_date('2025. aug 5.') == '2025-08-05'
        assert self.day_splitter._convert_to_iso_date('2025. jan 1.') == '2025-01-01'
    
    def test_convert_to_iso_date_other_formats(self):
        """Test conversion of other date formats"""
        # ISO format (should return as-is)
        assert self.day_splitter._convert_to_iso_date('2025-08-05') == '2025-08-05'
        
        # US format
        assert self.day_splitter._convert_to_iso_date('08/05/2025') == '2025-08-05'
        
        # European format
        assert self.day_splitter._convert_to_iso_date('05.08.2025') == '2025-08-05'
        assert self.day_splitter._convert_to_iso_date('5.8.2025') == '2025-08-05'
    
    def test_convert_to_iso_date_invalid(self):
        """Test conversion of invalid date formats"""
        assert self.day_splitter._convert_to_iso_date('invalid date') is None
        assert self.day_splitter._convert_to_iso_date('') is None
        assert self.day_splitter._convert_to_iso_date(None) is None
        assert self.day_splitter._convert_to_iso_date('2025. invalidmonth 5.') is None
        assert self.day_splitter._convert_to_iso_date('not a date') is None
    
    def test_save_daily_file(self):
        """Test saving daily file"""
        games = self.sample_games[:2]  # First two games
        file_path = self.day_splitter._save_daily_file(games, '2025-08-05', self.temp_dir)
        
        # Check file was created
        assert Path(file_path).exists()
        assert file_path.endswith('2025-08-05_games.json')
        
        # Check file content
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert 'file_info' in data
        assert 'games' in data
        assert data['file_info']['date'] == '2025-08-05'
        assert data['file_info']['total_games'] == 2
        assert data['file_info']['format'] == 'daily_split'
        assert len(data['games']) == 2
        
        # Check statistics
        assert data['file_info']['total_markets'] == 2
        assert 'Premier League' in data['file_info']['leagues']
        assert data['file_info']['leagues_count'] == 1
    
    def test_save_daily_file_undated(self):
        """Test saving undated games file"""
        undated_games = [self.sample_games[3]]  # Last game (undated)
        file_path = self.day_splitter._save_daily_file(undated_games, 'undated', self.temp_dir)
        
        # Check file was created
        assert Path(file_path).exists()
        assert file_path.endswith('undated_games.json')
        
        # Check file content
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert data['file_info']['date'] == 'undated'
        assert data['file_info']['total_games'] == 1
        assert len(data['games']) == 1
    
    def test_validate_date_range(self):
        """Test date range validation"""
        validation_report = self.day_splitter.validate_date_range(self.sample_games)
        
        assert validation_report['total_games'] == 4
        assert validation_report['valid_dates'] == 3
        assert validation_report['invalid_dates'] == 1
        assert validation_report['date_range']['earliest'] == '2025-08-05'
        assert validation_report['date_range']['latest'] == '2025-08-06'
        
        # Check issues
        assert len(validation_report['issues']) == 1
        assert validation_report['issues'][0]['issue'] == 'missing_date'
        assert 'Bayern Munich' in validation_report['issues'][0]['game_info']
    
    def test_validate_date_range_all_valid(self):
        """Test date range validation with all valid dates"""
        valid_games = [game for game in self.sample_games if game['date']]
        validation_report = self.day_splitter.validate_date_range(valid_games)
        
        assert validation_report['total_games'] == 3
        assert validation_report['valid_dates'] == 3
        assert validation_report['invalid_dates'] == 0
        assert len(validation_report['issues']) == 0
    
    def test_validate_date_range_all_invalid(self):
        """Test date range validation with all invalid dates"""
        invalid_games = [
            {'home_team': 'Team A', 'away_team': 'Team B', 'date': 'invalid'},
            {'home_team': 'Team C', 'away_team': 'Team D', 'date': None},
            {'home_team': 'Team E', 'away_team': 'Team F'}  # No date field
        ]
        
        validation_report = self.day_splitter.validate_date_range(invalid_games)
        
        assert validation_report['total_games'] == 3
        assert validation_report['valid_dates'] == 0
        assert validation_report['invalid_dates'] == 3
        assert validation_report['date_range']['earliest'] is None
        assert validation_report['date_range']['latest'] is None
        assert len(validation_report['issues']) == 3
    
    def test_empty_games_list(self):
        """Test handling of empty games list"""
        result = self.day_splitter.split_by_days([], self.temp_dir)
        
        assert result == {}
        
        stats = self.day_splitter.get_processing_stats()
        assert stats['total_games'] == 0
        assert stats['dated_games'] == 0
        assert stats['undated_games'] == 0
        assert stats['files_created'] == 0
    
    def test_directory_creation(self):
        """Test that output directory is created if it doesn't exist"""
        non_existent_dir = Path(self.temp_dir) / 'new_dir' / 'nested'
        
        result = self.day_splitter.split_by_days(self.sample_games, str(non_existent_dir))
        
        # Check directory was created
        assert non_existent_dir.exists()
        assert non_existent_dir.is_dir()
        
        # Check files were created in the new directory
        assert len(result) > 0
        for files in result.values():
            for file_path in files:
                assert str(non_existent_dir) in file_path
    
    def test_games_with_iso_date_field(self):
        """Test games that already have iso_date field"""
        games_with_iso = [
            {
                'league': 'Test League',
                'date': '2025. augusztus 5.',
                'iso_date': '2025-08-05',  # Already in ISO format
                'time': 'K 20:00',
                'home_team': 'Team A',
                'away_team': 'Team B',
                'total_markets': 1
            }
        ]
        
        result = self.day_splitter.split_by_days(games_with_iso, self.temp_dir)
        
        assert '2025-08-05' in result
        assert len(result['2025-08-05']) == 1
    
    def test_multiple_games_same_date(self):
        """Test multiple games on the same date"""
        same_date_games = [
            {
                'league': 'League 1',
                'date': '2025. augusztus 5.',
                'time': 'K 18:00',
                'home_team': 'Team A',
                'away_team': 'Team B',
                'total_markets': 1
            },
            {
                'league': 'League 2',
                'date': '2025. augusztus 5.',
                'time': 'K 20:00',
                'home_team': 'Team C',
                'away_team': 'Team D',
                'total_markets': 1
            },
            {
                'league': 'League 3',
                'date': '2025. augusztus 5.',
                'time': 'K 22:00',
                'home_team': 'Team E',
                'away_team': 'Team F',
                'total_markets': 1
            }
        ]
        
        result = self.day_splitter.split_by_days(same_date_games, self.temp_dir)
        
        assert len(result) == 1
        assert '2025-08-05' in result
        assert len(result['2025-08-05']) == 1
        
        # Check file contains all games
        file_path = result['2025-08-05'][0]
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert data['file_info']['total_games'] == 3
        assert len(data['games']) == 3
    
    @patch('src.converter.day_splitter.logger')
    def test_logging(self, mock_logger):
        """Test that appropriate logging occurs"""
        self.day_splitter.split_by_days(self.sample_games, self.temp_dir)
        
        # Check that info logs were called
        mock_logger.info.assert_called()
        
        # Check specific log messages
        log_calls = [call.args[0] for call in mock_logger.info.call_args_list]
        assert any('Starting day splitting' in msg for msg in log_calls)
        assert any('Day splitting completed' in msg for msg in log_calls)
        assert any('Saved' in msg and 'games for' in msg for msg in log_calls)
    
    def test_edge_case_date_formats(self):
        """Test edge cases in date format parsing"""
        edge_cases = [
            {'date': '2025. aug 5.', 'expected': '2025-08-05'},  # Abbreviated month
            {'date': '2025 augusztus 5', 'expected': '2025-08-05'},  # No dots
            {'date': '5.8.2025', 'expected': '2025-08-05'},  # European short
            {'date': '08/05/2025', 'expected': '2025-08-05'},  # US format
            {'date': '2025-08-05', 'expected': '2025-08-05'},  # Already ISO
        ]
        
        for case in edge_cases:
            game = {'date': case['date'], 'home_team': 'A', 'away_team': 'B'}
            result = self.day_splitter._extract_date_from_game(game)
            assert result == case['expected'], f"Failed for date: {case['date']}"
    
    def test_file_save_error_handling(self):
        """Test error handling during file save"""
        # Try to save to a read-only directory (simulate permission error)
        with patch('builtins.open', mock_open()) as mock_file:
            mock_file.side_effect = PermissionError("Permission denied")
            
            with pytest.raises(PermissionError):
                self.day_splitter._save_daily_file(
                    self.sample_games[:1], 
                    '2025-08-05', 
                    '/readonly/path'
                )
    
    def test_get_processing_stats_copy(self):
        """Test that get_processing_stats returns a copy"""
        self.day_splitter.split_by_days(self.sample_games, self.temp_dir)
        
        stats1 = self.day_splitter.get_processing_stats()
        stats2 = self.day_splitter.get_processing_stats()
        
        # Modify one copy
        stats1['total_games'] = 999
        
        # Other copy should be unchanged
        assert stats2['total_games'] != 999
        assert stats2['total_games'] == 4