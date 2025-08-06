"""
Integration test for DaySplitter with football data
"""

import json
import tempfile
import shutil
from pathlib import Path

from src.converter.day_splitter import DaySplitter


def test_day_splitter_integration():
    """Test DaySplitter with realistic football data"""
    
    # Create sample football data similar to what FootballExtractor produces
    sample_football_data = [
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
            'additional_markets': [
                {
                    'market_type': 'double_chance',
                    'description': 'Kétesély (1X/12/X2)',
                    'odds': {
                        'home_odds': 1.8,
                        'draw_odds': None,
                        'away_odds': 1.9
                    }
                }
            ],
            'total_markets': 2,
            'raw_lines': ['K 20:00 Arsenal - Chelsea 2,5 3,2 2,8']
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
            'total_markets': 1,
            'raw_lines': ['Sz 18:00 Barcelona - Real Madrid 2,1 3,0 3,4']
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
            'total_markets': 1,
            'raw_lines': ['V 19:00 Bayern Munich - Borussia Dortmund 1,9 3,8 3,9']
        }
    ]
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Initialize DaySplitter
        day_splitter = DaySplitter()
        
        # Split games by days
        result = day_splitter.split_by_days(sample_football_data, temp_dir)
        
        print("=== Day Splitting Results ===")
        print(f"Files created: {result}")
        
        # Verify results
        assert '2025-08-05' in result
        assert '2025-08-06' in result
        assert 'undated' in result
        
        # Check file contents
        for date, files in result.items():
            for file_path in files:
                print(f"\n--- Content of {Path(file_path).name} ---")
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                print(f"Date: {data['file_info']['date']}")
                print(f"Total games: {data['file_info']['total_games']}")
                print(f"Total markets: {data['file_info']['total_markets']}")
                print(f"Leagues: {data['file_info']['leagues']}")
                
                for i, game in enumerate(data['games'], 1):
                    print(f"  Game {i}: {game['home_team']} vs {game['away_team']}")
                    print(f"    League: {game['league']}")
                    print(f"    Time: {game['time']}")
                    print(f"    Markets: {game['total_markets']}")
        
        # Get processing statistics
        stats = day_splitter.get_processing_stats()
        print(f"\n=== Processing Statistics ===")
        print(f"Total games: {stats['total_games']}")
        print(f"Dated games: {stats['dated_games']}")
        print(f"Undated games: {stats['undated_games']}")
        print(f"Files created: {stats['files_created']}")
        print(f"Dates processed: {stats['dates_processed']}")
        
        # Validate date range
        validation_report = day_splitter.validate_date_range(sample_football_data)
        print(f"\n=== Date Validation Report ===")
        print(f"Valid dates: {validation_report['valid_dates']}")
        print(f"Invalid dates: {validation_report['invalid_dates']}")
        print(f"Date range: {validation_report['date_range']['earliest']} to {validation_report['date_range']['latest']}")
        
        if validation_report['issues']:
            print("Issues found:")
            for issue in validation_report['issues']:
                print(f"  - {issue['issue']}: {issue['game_info']}")
        
        print("\n✅ Integration test passed!")
        
    finally:
        # Clean up
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    test_day_splitter_integration()