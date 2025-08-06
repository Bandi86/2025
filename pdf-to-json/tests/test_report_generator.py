"""
Unit tests for ReportGenerator

Tests cover:
- JSON and CSV report generation
- Statistics calculation
- Anomaly detection
- Daily breakdown creation
- Normalization mapping reports
"""

import pytest
import json
import csv
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, mock_open
from datetime import datetime

from src.converter.report_generator import ReportGenerator


class TestReportGenerator:
    """Test suite for ReportGenerator class"""
    
    @pytest.fixture
    def report_generator(self):
        """Create a ReportGenerator instance for testing"""
        return ReportGenerator()
    
    @pytest.fixture
    def sample_games(self):
        """Sample game data for testing"""
        return [
            {
                'league': 'Premier League',
                'date': '2025. augusztus 5.',
                'iso_date': '2025-08-05',
                'time': 'K 20:00',
                'home_team': 'Arsenal',
                'away_team': 'Chelsea',
                'original_home_team': 'Arsenal FC',
                'original_away_team': 'Chelsea FC',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.50,
                        'draw_odds': 3.20,
                        'away_odds': 2.80
                    }
                },
                'additional_markets': [
                    {
                        'market_type': 'total_goals',
                        'description': 'Over/Under 2.5',
                        'priority': 4,
                        'odds': {'home_odds': 1.85, 'away_odds': 1.95}
                    }
                ],
                'total_markets': 2,
                'processing_info': {
                    'team_normalized': True,
                    'markets_capped': False,
                    'duplicates_removed': 0
                }
            },
            {
                'league': 'La Liga',
                'date': '2025. augusztus 6.',
                'iso_date': '2025-08-06',
                'time': 'V 18:30',
                'home_team': 'Barcelona',
                'away_team': 'Real Madrid',
                'original_home_team': 'FC Barcelona',
                'original_away_team': 'Real Madrid CF',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.10,
                        'draw_odds': 3.50,
                        'away_odds': 3.20
                    }
                },
                'additional_markets': [
                    {
                        'market_type': 'handicap',
                        'description': 'Asian Handicap',
                        'priority': 3,
                        'odds': {'home_odds': 1.90, 'away_odds': 1.90}
                    },
                    {
                        'market_type': 'both_teams_score',
                        'description': 'Both Teams to Score',
                        'priority': 5,
                        'odds': {'home_odds': 1.70, 'away_odds': 2.10}
                    }
                ],
                'total_markets': 3,
                'processing_info': {
                    'team_normalized': False,
                    'markets_capped': True,
                    'duplicates_removed': 1
                }
            }
        ]
    
    @pytest.fixture
    def sample_processing_stats(self):
        """Sample processing statistics for testing"""
        return {
            'summary': {
                'games_processed': 2,
                'total_duplicates_removed': 1,
                'total_markets_capped': 0,
                'games_with_duplicates': 1,
                'games_with_capping': 1
            },
            'deduplication': {
                'games_affected': 1,
                'total_duplicates': 1,
                'details': [
                    {
                        'game_key': 'Barcelona - Real Madrid',
                        'time': 'V 18:30',
                        'duplicates_removed': 1,
                        'original_count': 3,
                        'final_count': 2
                    }
                ]
            },
            'capping': {
                'games_affected': 1,
                'total_markets_removed': 0,
                'max_markets_limit': 10,
                'details': []
            }
        }
    
    @pytest.fixture
    def temp_dir(self):
        """Create a temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    def test_init(self, report_generator):
        """Test ReportGenerator initialization"""
        assert report_generator is not None
        assert len(report_generator.anomaly_detectors) == 6
        assert 'missing_odds' in report_generator.anomaly_detectors
        assert 'invalid_team_names' in report_generator.anomaly_detectors
        assert report_generator.report_stats['reports_generated'] == 0
    
    def test_calculate_statistics_empty_games(self, report_generator):
        """Test statistics calculation with empty games list"""
        stats = report_generator._calculate_statistics([])
        
        assert stats['total_games'] == 0
        assert stats['total_markets'] == 0
        assert stats['leagues_count'] == 0
        assert stats['teams_count'] == 0
        assert stats['average_markets_per_game'] == 0.0
        assert stats['dates_processed'] == []
    
    def test_calculate_statistics_with_games(self, report_generator, sample_games):
        """Test statistics calculation with sample games"""
        stats = report_generator._calculate_statistics(sample_games)
        
        assert stats['total_games'] == 2
        assert stats['total_markets'] == 5  # 2 + 3
        assert stats['main_markets'] == 2
        assert stats['additional_markets'] == 3
        assert stats['leagues_count'] == 2
        assert stats['teams_count'] == 4
        assert stats['average_markets_per_game'] == 2.5
        assert len(stats['dates_processed']) == 2
        assert '2025-08-05' in stats['dates_processed']
        assert '2025-08-06' in stats['dates_processed']
        
        # Check processing summary
        processing = stats['processing_summary']
        assert processing['teams_normalized'] == 1
        assert processing['games_with_capped_markets'] == 1
        assert processing['total_duplicates_removed'] == 1
        
        # Check market type distribution
        market_dist = stats['market_type_distribution']
        assert market_dist['1x2'] == 2
        assert market_dist['total_goals'] == 1
        assert market_dist['handicap'] == 1
        assert market_dist['both_teams_score'] == 1
    
    def test_detect_missing_odds(self, report_generator):
        """Test missing odds anomaly detection"""
        games_with_missing_odds = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'time': '20:00',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.50,
                        'draw_odds': None,  # Missing draw odds
                        'away_odds': 2.80
                    }
                },
                'additional_markets': [
                    {
                        'market_type': 'total_goals',
                        'odds': {}  # Empty odds
                    }
                ]
            }
        ]
        
        anomalies = report_generator._detect_missing_odds(games_with_missing_odds)
        
        assert len(anomalies) == 2
        
        # Check main market anomaly
        main_anomaly = anomalies[0]
        assert main_anomaly['type'] == 'missing_odds'
        assert main_anomaly['severity'] == 'medium'
        assert 'draw_odds' in main_anomaly['description']
        
        # Check additional market anomaly
        additional_anomaly = anomalies[1]
        assert additional_anomaly['type'] == 'missing_odds'
        assert additional_anomaly['severity'] == 'low'
        assert 'additional market' in additional_anomaly['description']
    
    def test_detect_invalid_team_names(self, report_generator):
        """Test invalid team names anomaly detection"""
        games_with_invalid_names = [
            {
                'home_team': '',  # Empty name
                'away_team': 'Valid Team',
                'time': '20:00'
            },
            {
                'home_team': 'Team123456',  # Long number sequence
                'away_team': 'team name',  # Lowercase start
                'time': '21:00'
            },
            {
                'home_team': 'A',  # Too short
                'away_team': 'Team  With  Spaces',  # Multiple spaces
                'time': '22:00'
            }
        ]
        
        anomalies = report_generator._detect_invalid_team_names(games_with_invalid_names)
        
        # Should detect multiple issues
        assert len(anomalies) >= 4
        
        # Check for different types of issues
        anomaly_types = [a['type'] for a in anomalies]
        assert 'invalid_team_name' in anomaly_types
        assert 'suspicious_team_name' in anomaly_types
    
    def test_detect_date_parsing_issues(self, report_generator):
        """Test date parsing issues anomaly detection"""
        games_with_date_issues = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'time': '20:00'
                # No date field
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'time': '21:00',
                'date': 'invalid date format'
                # No iso_date field
            }
        ]
        
        anomalies = report_generator._detect_date_parsing_issues(games_with_date_issues)
        
        assert len(anomalies) == 2
        
        # Check missing date anomaly
        missing_date = next(a for a in anomalies if a['type'] == 'missing_date')
        assert missing_date['severity'] == 'medium'
        
        # Check parsing failed anomaly
        parsing_failed = next(a for a in anomalies if a['type'] == 'date_parsing_failed')
        assert parsing_failed['severity'] == 'medium'
        assert 'invalid date format' in parsing_failed['description']
    
    def test_detect_market_classification_issues(self, report_generator):
        """Test market classification issues anomaly detection"""
        games_with_market_issues = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'time': '20:00',
                'total_markets': 2
                # No main_market
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'time': '21:00',
                'main_market': {'market_type': '1x2'},
                'additional_markets': [
                    {
                        'market_type': 'unknown',
                        'description': 'Unknown market 1'
                    },
                    {
                        'market_type': 'unknown',
                        'description': 'Unknown market 2'
                    }
                ]
            }
        ]
        
        anomalies = report_generator._detect_market_classification_issues(games_with_market_issues)
        
        assert len(anomalies) == 2
        
        # Check missing main market
        missing_main = next(a for a in anomalies if a['type'] == 'missing_main_market')
        assert missing_main['severity'] == 'high'
        
        # Check unknown market types
        unknown_markets = next(a for a in anomalies if a['type'] == 'unknown_market_types')
        assert unknown_markets['severity'] == 'low'
        assert '2 markets' in unknown_markets['description']
    
    def test_detect_duplicate_games(self, report_generator):
        """Test duplicate games anomaly detection"""
        duplicate_games = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'time': '20:00',
                'iso_date': '2025-08-05'
            },
            {
                'home_team': 'Team A',  # Same game
                'away_team': 'Team B',
                'time': '20:00',
                'iso_date': '2025-08-05'
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'time': '21:00',
                'iso_date': '2025-08-05'
            }
        ]
        
        anomalies = report_generator._detect_duplicate_games(duplicate_games)
        
        assert len(anomalies) == 1
        
        duplicate_anomaly = anomalies[0]
        assert duplicate_anomaly['type'] == 'duplicate_games'
        assert duplicate_anomaly['severity'] == 'medium'
        assert duplicate_anomaly['game_info']['count'] == 2
    
    def test_detect_unusual_odds_ranges(self, report_generator):
        """Test unusual odds ranges anomaly detection"""
        games_with_unusual_odds = [
            {
                'home_team': 'Team A',
                'away_team': 'Team B',
                'time': '20:00',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 1.005,  # Extremely low
                        'draw_odds': 3.20,
                        'away_odds': 2.80
                    }
                }
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'time': '21:00',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.50,
                        'draw_odds': 3.20,
                        'away_odds': 150.0  # Extremely high
                    }
                }
            }
        ]
        
        anomalies = report_generator._detect_unusual_odds_ranges(games_with_unusual_odds)
        
        assert len(anomalies) == 2
        
        # Check for low odds anomaly
        low_odds = next(a for a in anomalies if 'low odds' in a['description'])
        assert low_odds['severity'] == 'medium'
        assert low_odds['game_info']['min_odd'] == 1.005
        
        # Check for high odds anomaly
        high_odds = next(a for a in anomalies if 'high odds' in a['description'])
        assert high_odds['severity'] == 'medium'
        assert high_odds['game_info']['max_odd'] == 150.0
    
    def test_create_daily_breakdown(self, report_generator, sample_games):
        """Test daily breakdown creation"""
        breakdown = report_generator._create_daily_breakdown(sample_games)
        
        assert len(breakdown) == 2
        assert '2025-08-05' in breakdown
        assert '2025-08-06' in breakdown
        
        # Check first day
        day1 = breakdown['2025-08-05']
        assert day1['games_count'] == 1
        assert day1['markets_count'] == 2
        assert day1['leagues_count'] == 1
        assert 'Premier League' in day1['leagues']
        assert day1['teams_count'] == 2
        
        # Check second day
        day2 = breakdown['2025-08-06']
        assert day2['games_count'] == 1
        assert day2['markets_count'] == 3
        assert day2['leagues_count'] == 1
        assert 'La Liga' in day2['leagues']
        assert day2['teams_count'] == 2
    
    def test_generate_json_report(self, report_generator, temp_dir):
        """Test JSON report generation"""
        test_data = {
            'test_key': 'test_value',
            'number': 42,
            'list': [1, 2, 3]
        }
        
        output_path = Path(temp_dir) / 'test_report.json'
        report_generator._generate_json_report(test_data, str(output_path))
        
        # Verify file was created and contains correct data
        assert output_path.exists()
        
        with open(output_path, 'r', encoding='utf-8') as f:
            loaded_data = json.load(f)
        
        assert loaded_data == test_data
    
    def test_write_summary_csv(self, report_generator, temp_dir):
        """Test summary CSV generation"""
        summary_data = {
            'total_games': 10,
            'total_markets': 25,
            'main_markets': 10,
            'additional_markets': 15,
            'leagues_count': 3,
            'teams_count': 20,
            'average_markets_per_game': 2.5,
            'date_range': {
                'earliest': '2025-08-01',
                'latest': '2025-08-10',
                'total_days': 10
            },
            'processing_summary': {
                'teams_normalized': 5,
                'games_with_capped_markets': 2,
                'total_duplicates_removed': 3
            }
        }
        
        output_path = Path(temp_dir) / 'summary.csv'
        report_generator._write_summary_csv(summary_data, str(output_path))
        
        # Verify file was created and contains expected rows
        assert output_path.exists()
        
        with open(output_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # Check header
        assert rows[0] == ['Metric', 'Value']
        
        # Check some key metrics
        metrics = {row[0]: row[1] for row in rows[1:]}
        assert metrics['Total Games'] == '10'
        assert metrics['Total Markets'] == '25'
        assert metrics['Average Markets per Game'] == '2.5'
    
    def test_write_anomalies_csv(self, report_generator, temp_dir):
        """Test anomalies CSV generation"""
        anomalies_data = [
            {
                'type': 'missing_odds',
                'severity': 'medium',
                'description': 'Missing draw odds',
                'game_info': {
                    'game_key': 'Team A - Team B',
                    'time': '20:00',
                    'additional_field': 'extra_info'
                }
            },
            {
                'type': 'invalid_team_name',
                'severity': 'high',
                'description': 'Empty team name',
                'game_info': {
                    'game_key': 'Team C - Team D',
                    'time': '21:00'
                }
            }
        ]
        
        output_path = Path(temp_dir) / 'anomalies.csv'
        report_generator._write_anomalies_csv(anomalies_data, str(output_path))
        
        # Verify file was created and contains expected data
        assert output_path.exists()
        
        with open(output_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # Check header
        assert rows[0] == ['Type', 'Severity', 'Description', 'Game Key', 'Time', 'Additional Info']
        
        # Check first anomaly
        assert rows[1][0] == 'missing_odds'
        assert rows[1][1] == 'medium'
        assert rows[1][3] == 'Team A - Team B'
        assert rows[1][4] == '20:00'
    
    def test_write_daily_breakdown_csv(self, report_generator, temp_dir):
        """Test daily breakdown CSV generation"""
        daily_data = {
            '2025-08-05': {
                'games_count': 5,
                'markets_count': 12,
                'leagues_count': 2,
                'teams_count': 10,
                'leagues': ['Premier League', 'La Liga']
            },
            '2025-08-06': {
                'games_count': 3,
                'markets_count': 8,
                'leagues_count': 1,
                'teams_count': 6,
                'leagues': ['Bundesliga']
            }
        }
        
        output_path = Path(temp_dir) / 'daily.csv'
        report_generator._write_daily_breakdown_csv(daily_data, str(output_path))
        
        # Verify file was created and contains expected data
        assert output_path.exists()
        
        with open(output_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # Check header
        assert rows[0] == ['Date', 'Games Count', 'Markets Count', 'Leagues Count', 'Teams Count', 'Leagues']
        
        # Check data rows (should be sorted by date)
        assert rows[1][0] == '2025-08-05'
        assert rows[1][1] == '5'
        assert 'Premier League, La Liga' in rows[1][5]
        
        assert rows[2][0] == '2025-08-06'
        assert rows[2][1] == '3'
        assert 'Bundesliga' in rows[2][5]
    
    def test_write_normalization_csv(self, report_generator, temp_dir):
        """Test normalization mapping CSV generation"""
        normalization_data = {
            'Arsenal FC': 'Arsenal',
            'Chelsea FC': 'Chelsea',
            'FC Barcelona': 'Barcelona'
        }
        
        output_path = Path(temp_dir) / 'normalization.csv'
        report_generator._write_normalization_csv(normalization_data, str(output_path))
        
        # Verify file was created and contains expected data
        assert output_path.exists()
        
        with open(output_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # Check header
        assert rows[0] == ['Original Team Name', 'Normalized Team Name']
        
        # Check data rows (should be sorted)
        assert len(rows) == 4  # Header + 3 data rows
        assert rows[1] == ['Arsenal FC', 'Arsenal']
        assert rows[2] == ['Chelsea FC', 'Chelsea']
        assert rows[3] == ['FC Barcelona', 'Barcelona']
    
    def test_generate_reports_full_integration(self, report_generator, sample_games, 
                                             sample_processing_stats, temp_dir):
        """Test full report generation integration"""
        normalization_mapping = {
            'Arsenal FC': 'Arsenal',
            'Chelsea FC': 'Chelsea'
        }
        
        generated_files = report_generator.generate_reports(
            games=sample_games,
            processing_stats=sample_processing_stats,
            output_dir=temp_dir,
            normalization_mapping=normalization_mapping
        )
        
        # Check that all expected files were generated
        assert 'json' in generated_files
        assert 'summary_csv' in generated_files
        assert 'daily_csv' in generated_files
        assert 'normalization_csv' in generated_files
        
        # Anomalies CSV is only generated if anomalies are detected
        # The sample games are clean, so no anomalies CSV should be generated
        
        # Verify all files exist
        for file_path in generated_files.values():
            assert Path(file_path).exists()
        
        # Check JSON report content
        with open(generated_files['json'], 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        assert 'generation_info' in json_data
        assert 'summary' in json_data
        assert 'processing_stats' in json_data
        assert 'anomalies' in json_data
        assert 'normalization_mapping' in json_data
        assert 'daily_breakdown' in json_data
        
        # Check that statistics were calculated correctly
        assert json_data['summary']['total_games'] == 2
        assert json_data['summary']['total_markets'] == 5
        
        # Check report stats were updated
        stats = report_generator.get_report_stats()
        assert stats['reports_generated'] == 1
        assert stats['last_generation_time'] is not None
    
    def test_generate_reports_with_anomalies(self, report_generator, sample_processing_stats, temp_dir):
        """Test report generation when anomalies are detected"""
        # Create games with anomalies
        games_with_anomalies = [
            {
                'home_team': '',  # This will trigger an anomaly
                'away_team': 'Team B',
                'time': '20:00',
                'league': 'Test League',
                'iso_date': '2025-08-05',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.50,
                        'draw_odds': 3.20,
                        'away_odds': 2.80
                    }
                },
                'total_markets': 1,
                'processing_info': {
                    'team_normalized': False,
                    'markets_capped': False,
                    'duplicates_removed': 0
                }
            }
        ]
        
        generated_files = report_generator.generate_reports(
            games=games_with_anomalies,
            processing_stats=sample_processing_stats,
            output_dir=temp_dir
        )
        
        # Check that anomalies CSV was generated
        assert 'anomalies_csv' in generated_files
        assert Path(generated_files['anomalies_csv']).exists()
        
        # Verify anomalies CSV content
        with open(generated_files['anomalies_csv'], 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        # Should have header + at least one anomaly
        assert len(rows) >= 2
        assert rows[0] == ['Type', 'Severity', 'Description', 'Game Key', 'Time', 'Additional Info']
    
    def test_get_report_stats(self, report_generator):
        """Test report statistics retrieval"""
        initial_stats = report_generator.get_report_stats()
        
        assert initial_stats['reports_generated'] == 0
        assert initial_stats['anomalies_detected'] == 0
        assert initial_stats['last_generation_time'] is None
        
        # Modify internal stats
        report_generator.report_stats['reports_generated'] = 5
        report_generator.report_stats['anomalies_detected'] = 10
        
        updated_stats = report_generator.get_report_stats()
        assert updated_stats['reports_generated'] == 5
        assert updated_stats['anomalies_detected'] == 10
        
        # Ensure it returns a copy (not reference)
        updated_stats['reports_generated'] = 999
        final_stats = report_generator.get_report_stats()
        assert final_stats['reports_generated'] == 5  # Should not be modified
    
    def test_error_handling_in_anomaly_detection(self, report_generator):
        """Test error handling in anomaly detection"""
        # Create a mock detector that raises an exception
        def failing_detector(games):
            raise ValueError("Test error")
        
        # Replace one detector with failing one
        original_detector = report_generator.anomaly_detectors['missing_odds']
        report_generator.anomaly_detectors['missing_odds'] = failing_detector
        
        try:
            anomalies = report_generator._detect_anomalies([])
            
            # Should have one anomaly about the detector error
            detector_errors = [a for a in anomalies if a['type'] == 'detector_error']
            assert len(detector_errors) == 1
            assert detector_errors[0]['detector'] == 'missing_odds'
            assert 'Test error' in detector_errors[0]['description']
            assert detector_errors[0]['severity'] == 'high'
            
        finally:
            # Restore original detector
            report_generator.anomaly_detectors['missing_odds'] = original_detector
    
    @patch('builtins.open', side_effect=IOError("Permission denied"))
    def test_json_report_generation_error(self, mock_file, report_generator, temp_dir):
        """Test error handling in JSON report generation"""
        test_data = {'test': 'data'}
        output_path = Path(temp_dir) / 'test.json'
        
        with pytest.raises(IOError):
            report_generator._generate_json_report(test_data, str(output_path))
    
    def test_anomaly_severity_sorting(self, report_generator):
        """Test that anomalies are sorted by severity"""
        # Create games that will trigger different severity anomalies
        test_games = [
            {
                'home_team': '',  # High severity: invalid team name
                'away_team': 'Team B',
                'time': '20:00'
            },
            {
                'home_team': 'Team C',
                'away_team': 'Team D',
                'time': '21:00',
                'main_market': {
                    'odds': {
                        'home_odds': 2.50,
                        'draw_odds': None,  # Medium severity: missing odds
                        'away_odds': 2.80
                    }
                },
                'additional_markets': [
                    {
                        'market_type': 'unknown'  # Low severity: unknown market type
                    }
                ]
            }
        ]
        
        anomalies = report_generator._detect_anomalies(test_games)
        
        # Check that high severity anomalies come first
        severities = [a['severity'] for a in anomalies]
        
        # Should have high severity first
        assert severities[0] == 'high'
        
        # Should be sorted (high, medium, low)
        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        for i in range(len(severities) - 1):
            current_order = severity_order.get(severities[i], 2)
            next_order = severity_order.get(severities[i + 1], 2)
            assert current_order <= next_order


if __name__ == '__main__':
    pytest.main([__file__])