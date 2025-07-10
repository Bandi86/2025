#!/usr/bin/env python3
"""
Simple script to test match detail extraction and examine time-related output.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.sources.flashscore import FlashScoreScraper
from datetime import datetime

def test_match_details():
    """Test match detail extraction to see what we get."""

    scraper = FlashScoreScraper()

    # Get a sample match URL from recent data
    print("Getting daily matches...")

    matches = scraper.get_daily_matches(datetime.now())

    if not matches:
        print("No matches found")
        return

    print(f"Found {len(matches)} matches")

    # Test the first match
    sample_match = matches[0]
    match_url = sample_match['match_url']

    print(f"\nTesting match detail extraction for:")
    print(f"URL: {match_url}")
    print(f"Teams: {sample_match['home_team']} vs {sample_match['away_team']}")
    print(f"Current match_time from list: {sample_match['match_time']}")

    # Get detailed information
    print(f"\nCalling get_match_details...")
    details = scraper.get_match_details(match_url)

    if details:
        print(f"SUCCESS: Got match details")
        print(f"Keys in details: {list(details.keys())}")

        # Check key fields
        for key in ['home_team', 'away_team', 'match_time', 'score', 'league']:
            value = details.get(key, 'NOT_FOUND')
            print(f"{key}: {repr(value)}")

        # Check if match_time is empty and why
        if not details.get('match_time'):
            print(f"\n*** match_time IS EMPTY - this is the issue we need to fix ***")
        else:
            print(f"\n*** match_time is populated: {details['match_time']} ***")

    else:
        print("FAILED: No details returned")

    scraper.close()

if __name__ == "__main__":
    test_match_details()
