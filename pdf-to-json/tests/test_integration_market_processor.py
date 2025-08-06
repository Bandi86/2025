#!/usr/bin/env python3
"""
Quick integration test for MarketProcessor with sample data
"""

from src.converter.market_processor import MarketProcessor

# Sample match data that would come from FootballExtractor
sample_matches = [
    {
        'league': 'Premier League',
        'date': '2025. augusztus 5.',
        'time': 'K 20:00',
        'home_team': 'Arsenal',
        'away_team': 'Chelsea',
        'home_odds': 2.50,
        'draw_odds': 3.20,
        'away_odds': 2.80,
        'raw_line': 'K 20:00 65110 Arsenal - Chelsea 2,50 3,20 2,80'
    },
    {
        'league': 'Premier League',
        'date': '2025. augusztus 5.',
        'time': 'K 20:00',
        'home_team': 'Arsenal Hendikep (-1)',
        'away_team': 'Chelsea',
        'home_odds': 3.50,
        'draw_odds': None,
        'away_odds': 1.30,
        'raw_line': 'K 20:00 Arsenal Hendikep (-1) - Chelsea 3,50 1,30'
    },
    {
        'league': 'Premier League',
        'date': '2025. augusztus 5.',
        'time': 'K 20:00',
        'home_team': 'Arsenal Gólszám több mint 2.5',
        'away_team': 'Chelsea kevesebb mint 2.5',
        'home_odds': 1.85,
        'draw_odds': None,
        'away_odds': 1.95,
        'raw_line': 'K 20:00 Arsenal Gólszám több mint 2.5 - Chelsea kevesebb mint 2.5 1,85 1,95'
    }
]

def test_integration():
    """Test MarketProcessor integration"""
    processor = MarketProcessor()
    
    print("=== MarketProcessor Integration Test ===")
    print(f"Input: {len(sample_matches)} individual matches")
    
    # Test merging
    merged_games = processor.merge_matches_by_game(sample_matches)
    
    print(f"Output: {len(merged_games)} merged games")
    
    for i, game in enumerate(merged_games, 1):
        print(f"\nGame {i}:")
        print(f"  Teams: {game['home_team']} vs {game['away_team']}")
        print(f"  Time: {game['time']}")
        print(f"  Main Market: {game['main_market']}")
        print(f"  Additional Markets: {len(game['additional_markets'])}")
        print(f"  Total Markets: {game['total_markets']}")
        
        for j, market in enumerate(game['additional_markets'], 1):
            print(f"    Market {j}: {market['market_type']} - {market['description']} (Priority: {market['priority']})")
    
    print("\n=== Test Classification ===")
    for match in sample_matches:
        market_type = processor.classify_market_type(match)
        is_main = processor._is_main_market(match)
        print(f"Match: {match['home_team']} vs {match['away_team']}")
        print(f"  Type: {market_type}, Is Main: {is_main}")

if __name__ == '__main__':
    test_integration()