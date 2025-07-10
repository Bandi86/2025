#!/usr/bin/env python3
"""
Debug script to test the enhanced FlashScore scraper with Selenium
"""

import sys
import os
import logging
from datetime import datetime, date, timedelta

# Add the scripts directory to Python path
scripts_dir = os.path.join(os.path.dirname(__file__), 'scripts')
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_flashscore_selenium():
    """Test FlashScore scraper with Selenium"""
    print("=== Testing FlashScore Scraper with Selenium ===")

    try:
        # Initialize scraper with Selenium enabled
        scraper = FlashScoreScraper(headless=False, use_selenium=True)  # Non-headless for debugging

        # Test connection first
        print("\n--- Testing connection ---")
        test_result = scraper.test_connection()
        print(f"Connection test: {test_result}")

        # Get matches for today
        today = date.today()
        print(f"\n--- Getting matches for {today} ---")

        matches = scraper.get_daily_matches(today)
        print(f"Found {len(matches)} matches")

        for i, match in enumerate(matches):
            print(f"\nMatch {i+1}:")
            print(f"  Home: {match.get('home_team')}")
            print(f"  Away: {match.get('away_team')}")
            print(f"  Time: {match.get('match_time')}")
            print(f"  League: {match.get('league')}")
            print(f"  Status: {match.get('status')}")
            print(f"  Score: {match.get('score')}")

        # Test with yesterday and tomorrow as well
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        for test_date in [yesterday, tomorrow]:
            print(f"\n--- Testing date: {test_date} ---")
            matches = scraper.get_daily_matches(test_date)
            print(f"Found {len(matches)} matches for {test_date}")

        # Close the scraper
        scraper.close()

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_flashscore_selenium()
