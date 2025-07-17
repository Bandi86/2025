#!/usr/bin/env python3

"""
Test with past date to see recheck logic
"""

from datetime import date, timedelta
from scripts.detailed_match_scraper import DetailedMatchScraper

def test_past_date_recheck():
    """Test detailed scraping with past date (should recheck scheduled matches)"""

    print("=== TESTING PAST DATE RECHECK LOGIC ===\n")

    # Use a past date
    past_date = date.today() - timedelta(days=3)  # 3 days ago

    print(f"Testing with past date: {past_date}")
    print("This should:")
    print("  ✓ Recheck scheduled matches (might be finished now)")
    print("  ✓ Scrape finished matches")
    print("  ✗ Skip postponed matches")
    print()

    # Create fresh daily matches for past date
    scraper = DetailedMatchScraper("/tmp/test_past")

    # First, let's manually create some test data for the past date
    import os
    import json
    from scripts.utils.date_utils import ensure_data_directory

    # Create directory structure
    data_dir = ensure_data_directory("/tmp/test_past", past_date)

    # Create test daily matches for past date
    test_matches = [
        {
            'home_team': 'Team A',
            'away_team': 'Team B',
            'status': 'finished',
            'match_url': 'https://www.flashscore.com/test1',
            'source': 'flashscore',
            'match_time': '20:00',
            'league': 'Test League'
        },
        {
            'home_team': 'Team C',
            'away_team': 'Team D',
            'status': 'scheduled',  # Was scheduled 3 days ago, might be finished now
            'match_url': 'https://www.flashscore.com/test2',
            'source': 'flashscore',
            'match_time': '21:00',
            'league': 'Test League'
        },
        {
            'home_team': 'Team E',
            'away_team': 'Team F',
            'status': 'postponed',
            'match_url': 'https://www.flashscore.com/test3',
            'source': 'flashscore',
            'match_time': '22:00',
            'league': 'Test League'
        }
    ]

    # Save test daily matches
    daily_data = {
        'date': past_date.isoformat(),
        'total_matches': len(test_matches),
        'scraped_at': '2025-07-10T10:00:00',
        'matches': test_matches
    }

    daily_file = os.path.join(data_dir, f"daily_matches_{past_date.isoformat()}.json")
    with open(daily_file, 'w') as f:
        json.dump(daily_data, f, indent=2)

    print(f"Created test data with {len(test_matches)} matches")

    # Now test the filtering logic
    matches_to_scrape = []
    matches_to_skip = []

    for match in test_matches:
        should_scrape, reason = scraper._should_scrape_match(match, past_date)

        if should_scrape:
            matches_to_scrape.append(match)
            status = "✓ SCRAPE"
        else:
            matches_to_skip.append({'match': match, 'skip_reason': reason})
            status = "✗ SKIP"

        print(f"{match['home_team']} vs {match['away_team']}")
        print(f"  Original status: {match['status']}")
        print(f"  Decision: {status}")
        print(f"  Reason: {reason}")
        print()

    print(f"Summary for past date ({past_date}):")
    print(f"  Matches to scrape: {len(matches_to_scrape)}")
    print(f"  Matches to skip: {len(matches_to_skip)}")
    print()

    # Show what would happen if we ran detailed scraping
    print("Expected behavior:")
    for match in matches_to_scrape:
        print(f"  ✓ Would scrape: {match['home_team']} vs {match['away_team']}")
        print(f"    Reason: {match['status']} match or recheck scheduled")

    for skipped in matches_to_skip:
        match = skipped['match']
        print(f"  ✗ Would skip: {match['home_team']} vs {match['away_team']}")
        print(f"    Reason: {skipped['skip_reason']}")

if __name__ == "__main__":
    test_past_date_recheck()
