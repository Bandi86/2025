#!/usr/bin/env python3
"""
Quick test for the enhanced parsing logic
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
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_enhanced_parsing():
    """Test the enhanced FlashScore parsing with Selenium"""
    print("=== Testing Enhanced FlashScore Parsing ===")

    try:
        # Initialize scraper with Selenium enabled, headless for faster testing
        scraper = FlashScoreScraper(headless=True, use_selenium=True)

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
            print(f"  URL: {match.get('match_url')}")

        # Close the scraper
        scraper.close()

        return len(matches) > 0

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_parsing()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
