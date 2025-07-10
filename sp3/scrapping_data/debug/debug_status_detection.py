#!/usr/bin/env python3
"""
Debug script to analyze match status detection in FlashScore scraper
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import date
from scripts.sources.flashscore import FlashScoreScraper

def debug_status_detection():
    """Debug the status detection logic"""

    # Initialize scraper
    scraper = FlashScoreScraper(headless=False, use_selenium=True)

    # Test with today's date
    target_date = date.today()
    print(f"Testing status detection for date: {target_date}")

    try:
        # Override the _parse_match_element method to add debug info
        original_parse = scraper._parse_match_element
        original_status = scraper._detect_match_status

        def debug_parse_match_element(match_elem, target_date):
            raw_text = match_elem.get_text(strip=True)
            print(f"\n--- DEBUGGING MATCH ELEMENT ---")
            print(f"Raw text: {repr(raw_text)}")
            print(f"HTML: {str(match_elem)[:200]}...")

            # Call original status detection
            status, score = original_status(match_elem, raw_text)
            print(f"Detected status: {status}, score: {score}")

            return original_parse(match_elem, target_date)

        # Temporarily replace the method
        scraper._parse_match_element = debug_parse_match_element

        # Get matches with debug info
        matches = scraper.get_daily_matches(target_date)

        # Print summary
        print(f"\n=== FINAL SUMMARY ===")
        print(f"Total matches found: {len(matches)}")

        status_counts = {}
        for match in matches:
            status = match.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1

            # Print first few matches of each status
            if status_counts[status] <= 3:
                print(f"  {status}: {match.get('home_team')} vs {match.get('away_team')} - {match.get('score')}")

        print(f"\nStatus distribution: {status_counts}")

    except Exception as e:
        print(f"Error in debug: {e}")
    finally:
        scraper.close()

if __name__ == "__main__":
    debug_status_detection()
