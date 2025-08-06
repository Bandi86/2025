"""
Integration test for ReportGenerator to verify all requirements are met
"""

import pytest
import tempfile
import shutil
from pathlib import Path
import json
import csv

from src.converter.report_generator import ReportGenerator


def test_report_generator_meets_all_requirements():
    """
    Integration test to verify ReportGenerator meets all requirements:
    - 5.1: Generate JSON and CSV reports
    - 5.2: Include counts of games, markets, and processing actions
    - 5.3: Log anomalies with details in reports
    - 5.4: Include normalization mapping statistics in reports
    - 5.5: Store reports in jsons/reports/ directory with timestamps
    - 7.4: Comprehensive unit tests for report generation
    """
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Create ReportGenerator
        report_generator = ReportGenerator()
        
        # Sample data with various scenarios to test all features
        sample_games = [
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
                'home_team': '',  # This will trigger anomaly
                'away_team': 'Real Madrid',
                'original_home_team': '',
                'original_away_team': 'Real Madrid CF',
                'main_market': {
                    'market_type': '1x2',
                    'odds': {
                        'home_odds': 2.10,
                        'draw_odds': None,  # This will trigger anomaly
                        'away_odds': 3.20
                    }
                },
                'additional_markets': [
                    {
                        'market_type': 'unknown',  # This will trigger anomaly
                        'description': 'Unknown market',
                        'priority': 10,
                        'odds': {'home_odds': 1.90, 'away_odds': 1.90}
                    }
                ],
                'total_markets': 2,
                'processing_info': {
                    'team_normalized': False,
                    'markets_capped': True,
                    'duplicates_removed': 1
                }
            }
        ]
        
        sample_processing_stats = {
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
                        'game_key': ' - Real Madrid',
                        'time': 'V 18:30',
                        'duplicates_removed': 1,
                        'original_count': 2,
                        'final_count': 1
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
        
        normalization_mapping = {
            'Arsenal FC': 'Arsenal',
            'Real Madrid CF': 'Real Madrid'
        }
        
        # Create reports directory structure
        reports_dir = Path(temp_dir) / "jsons" / "reports"
        
        # Generate reports
        generated_files = report_generator.generate_reports(
            games=sample_games,
            processing_stats=sample_processing_stats,
            output_dir=str(reports_dir),
            normalization_mapping=normalization_mapping
        )
        
        # Requirement 5.1: Generate JSON and CSV reports
        assert 'json' in generated_files
        assert 'summary_csv' in generated_files
        assert 'daily_csv' in generated_files
        assert 'normalization_csv' in generated_files
        assert 'anomalies_csv' in generated_files  # Should be generated due to anomalies
        
        # Requirement 5.5: Store reports in jsons/reports/ directory with timestamps
        for file_path in generated_files.values():
            assert str(reports_dir) in file_path
            assert Path(file_path).exists()
            # Check timestamp in filename
            filename = Path(file_path).name
            assert any(char.isdigit() for char in filename)  # Contains timestamp
        
        # Verify JSON report content
        with open(generated_files['json'], 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        # Requirement 5.2: Include counts of games, markets, and processing actions
        summary = json_data['summary']
        assert summary['total_games'] == 2
        assert summary['total_markets'] == 4
        assert summary['main_markets'] == 2
        assert summary['additional_markets'] == 2
        assert summary['leagues_count'] == 2
        assert summary['teams_count'] == 3  # Arsenal, Chelsea, Real Madrid (empty name not counted)
        
        processing_summary = summary['processing_summary']
        assert processing_summary['teams_normalized'] == 1
        assert processing_summary['games_with_capped_markets'] == 1
        assert processing_summary['total_duplicates_removed'] == 1
        
        # Requirement 5.3: Log anomalies with details in reports
        anomalies = json_data['anomalies']
        assert len(anomalies) > 0
        
        # Check for different types of anomalies
        anomaly_types = [a['type'] for a in anomalies]
        assert 'invalid_team_name' in anomaly_types
        assert 'missing_odds' in anomaly_types
        assert 'unknown_market_types' in anomaly_types
        
        # Verify anomaly details
        for anomaly in anomalies:
            assert 'type' in anomaly
            assert 'description' in anomaly
            assert 'severity' in anomaly
            assert 'game_info' in anomaly
        
        # Requirement 5.4: Include normalization mapping statistics in reports
        assert 'normalization_mapping' in json_data
        assert json_data['normalization_mapping'] == normalization_mapping
        
        # Verify daily breakdown
        daily_breakdown = json_data['daily_breakdown']
        assert '2025-08-05' in daily_breakdown
        assert '2025-08-06' in daily_breakdown
        
        day1 = daily_breakdown['2025-08-05']
        assert day1['games_count'] == 1
        assert day1['markets_count'] == 2
        assert 'Premier League' in day1['leagues']
        
        day2 = daily_breakdown['2025-08-06']
        assert day2['games_count'] == 1
        assert day2['markets_count'] == 2
        assert 'La Liga' in day2['leagues']
        
        # Verify CSV files content
        
        # Summary CSV
        with open(generated_files['summary_csv'], 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        assert rows[0] == ['Metric', 'Value']
        metrics = {row[0]: row[1] for row in rows[1:]}
        assert metrics['Total Games'] == '2'
        assert metrics['Total Markets'] == '4'
        
        # Anomalies CSV
        with open(generated_files['anomalies_csv'], 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        assert rows[0] == ['Type', 'Severity', 'Description', 'Game Key', 'Time', 'Additional Info']
        assert len(rows) > 1  # Should have anomaly data
        
        # Daily breakdown CSV
        with open(generated_files['daily_csv'], 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        assert rows[0] == ['Date', 'Games Count', 'Markets Count', 'Leagues Count', 'Teams Count', 'Leagues']
        assert len(rows) == 3  # Header + 2 days
        
        # Normalization mapping CSV
        with open(generated_files['normalization_csv'], 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        assert rows[0] == ['Original Team Name', 'Normalized Team Name']
        assert len(rows) == 3  # Header + 2 mappings
        
        # Verify report stats were updated
        stats = report_generator.get_report_stats()
        assert stats['reports_generated'] == 1
        assert stats['anomalies_detected'] > 0
        assert stats['last_generation_time'] is not None
        
        print("✅ All requirements verified successfully!")
        print(f"Generated files: {list(generated_files.keys())}")
        print(f"Anomalies detected: {len(anomalies)}")
        print(f"Reports directory: {reports_dir}")
        
    finally:
        # Clean up
        shutil.rmtree(temp_dir)


if __name__ == '__main__':
    test_report_generator_meets_all_requirements()