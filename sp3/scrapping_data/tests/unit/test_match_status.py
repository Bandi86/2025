#!/usr/bin/env python3

"""
Test match status filtering logic
"""

import json
from datetime import date, datetime
from scripts.detailed_match_scraper import DetailedMatchScraper

def test_match_status_logic():
    """Test the match status filtering logic"""

    print("=== TESTING MATCH STATUS FILTERING ===\n")

    # Create scraper instance
    scraper = DetailedMatchScraper("/tmp/test_scraping")

    # Test cases for different match statuses
    test_matches = [
        {
            'home_team': 'Team A',
            'away_team': 'Team B',
            'status': 'finished',
            'match_url': 'http://example.com/match1',
            'source': 'flashscore'
        },
        {
            'home_team': 'Team C',
            'away_team': 'Team D',
            'status': 'scheduled',
            'match_url': 'http://example.com/match2',
            'source': 'flashscore'
        },
        {
            'home_team': 'Team E',
            'away_team': 'Team F',
            'status': 'live',
            'match_url': 'http://example.com/match3',
            'source': 'flashscore'
        },
        {
            'home_team': 'Team G',
            'away_team': 'Team H',
            'status': 'postponed',
            'match_url': 'http://example.com/match4',
            'source': 'flashscore'
        }
    ]

    # Test for today's date
    today = date.today()
    print(f"Testing for today's date: {today}")
    print("-" * 50)

    for i, match in enumerate(test_matches):
        should_scrape, reason = scraper._should_scrape_match(match, today)
        status = "✓ SCRAPE" if should_scrape else "✗ SKIP"
        print(f"Match {i+1}: {match['home_team']} vs {match['away_team']}")
        print(f"  Status: {match['status']}")
        print(f"  Decision: {status}")
        print(f"  Reason: {reason}")
        print()

    # Test for past date
    from datetime import timedelta
    past_date = today - timedelta(days=2)
    print(f"\nTesting for past date: {past_date}")
    print("-" * 50)

    for i, match in enumerate(test_matches):
        should_scrape, reason = scraper._should_scrape_match(match, past_date)
        status = "✓ SCRAPE" if should_scrape else "✗ SKIP"
        print(f"Match {i+1}: {match['home_team']} vs {match['away_team']}")
        print(f"  Status: {match['status']}")
        print(f"  Decision: {status}")
        print(f"  Reason: {reason}")
        print()

def test_with_real_data():
    """Test with real daily matches data"""

    print("=== TESTING WITH REAL DATA ===\n")

    # Load real daily matches
    daily_file = "/tmp/test_data/data/2025/07/10/matches/daily_matches_2025-07-10.json"

    try:
        with open(daily_file, 'r') as f:
            data = json.load(f)

        matches = data.get('matches', [])
        print(f"Loaded {len(matches)} matches from daily file")

        scraper = DetailedMatchScraper("/tmp/test_data")
        target_date = date(2025, 7, 10)

        matches_to_scrape = []
        matches_to_skip = []

        for match in matches[:5]:  # Test first 5 matches
            should_scrape, reason = scraper._should_scrape_match(match, target_date)

            if should_scrape:
                matches_to_scrape.append(match)
                status = "✓ SCRAPE"
            else:
                matches_to_skip.append({'match': match, 'skip_reason': reason})
                status = "✗ SKIP"

            print(f"{match.get('home_team')} vs {match.get('away_team')}")
            print(f"  Status: {match.get('status', 'unknown')}")
            print(f"  Decision: {status}")
            print(f"  Reason: {reason}")
            print()

        print(f"\nSummary:")
        print(f"  Matches to scrape: {len(matches_to_scrape)}")
        print(f"  Matches to skip: {len(matches_to_skip)}")

    except Exception as e:
        print(f"Error loading real data: {e}")

if __name__ == "__main__":
    test_match_status_logic()
    test_with_real_data()
