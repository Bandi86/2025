#!/usr/bin/env python3
"""
Test match detail extraction with forced fallback to check time fix logic.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.sources.flashscore import FlashScoreScraper
from datetime import datetime

def test_forced_fallback():
    """Test match detail extraction with a bad URL to force fallback."""

    scraper = FlashScoreScraper()

    # Use a bad URL to force fallback
    bad_url = "https://www.flashscore.com/match/football/INVALID_URL/"

    # Create base match data with problematic time format
    base_match_data = {
        'home_team': 'Wilstermann',
        'away_team': 'Guabira',
        'match_time': '08.07. 02:00',  # This needs to be fixed
        'league': 'División Profesional',
        'match_url': bad_url,
        'score': '1-1',
        'status': 'finished',
        'source': 'flashscore',
        'scraped_at': '2025-07-10T11:49:59.769999',
        'match_date': '2025-07-10T11:49:53.286278'
    }

    print("Testing forced fallback with time format fix:")
    print(f"Original time: '{base_match_data['match_time']}'")
    print(f"Bad URL: {bad_url}")

    # This should trigger the fallback logic
    details = scraper.get_match_details(bad_url, base_match_data)

    if details:
        print(f"SUCCESS: Got fallback match details")
        print(f"Fixed time: '{details.get('match_time', 'NOT_FOUND')}'")

        # Check if the time was properly fixed
        original_time = base_match_data['match_time']
        fixed_time = details.get('match_time', '')

        if fixed_time != original_time:
            print(f"*** TIME FIX APPLIED: '{original_time}' -> '{fixed_time}' ***")
        else:
            print(f"*** TIME FIX NOT APPLIED: still '{fixed_time}' ***")

    else:
        print("FAILED: No details returned from fallback")

    scraper.close()

if __name__ == "__main__":
    test_forced_fallback()
