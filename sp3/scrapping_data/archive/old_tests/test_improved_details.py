#!/usr/bin/env python3
"""
Test the improved match detail extraction with base match data fallback.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.sources.flashscore import FlashScoreScraper
from datetime import datetime

def test_improved_match_details():
    """Test the improved match detail extraction."""

    scraper = FlashScoreScraper()

    # Get a sample match
    print("Getting daily matches...")
    matches = scraper.get_daily_matches(datetime.now())

    if not matches:
        print("No matches found")
        return

    # Test with the first match
    sample_match = matches[0]
    match_url = sample_match['match_url']

    print(f"\n=== Testing improved match detail extraction ===")
    print(f"Match URL: {match_url}")
    print(f"Base match data:")
    for key, value in sample_match.items():
        print(f"  {key}: {repr(value)}")

    print(f"\n=== Calling get_match_details with base_match_data ===")

    # Test the improved method
    details = scraper.get_match_details(match_url, sample_match)

    if details:
        print(f"SUCCESS: Got match details")
        print(f"\nDetailed match data:")
        for key, value in details.items():
            print(f"  {key}: {repr(value)}")

        # Check specifically if match_time is populated
        match_time = details.get('match_time', '')
        if match_time:
            print(f"\n*** SUCCESS: match_time is populated: '{match_time}' ***")
        else:
            print(f"\n*** PROBLEM: match_time is still empty ***")

        # Check the key validation fields
        required_fields = ['home_team', 'away_team', 'match_time']
        missing_fields = [field for field in required_fields if not details.get(field)]

        if not missing_fields:
            print(f"*** ALL REQUIRED FIELDS ARE POPULATED ***")
        else:
            print(f"*** MISSING FIELDS: {missing_fields} ***")

    else:
        print("FAILED: No details returned")

    scraper.close()

if __name__ == "__main__":
    test_improved_match_details()
