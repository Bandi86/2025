#!/usr/bin/env python3
"""
Debug league detection
=====================

Test the league header detection specifically
"""
import sys
import os
import re
from datetime import datetime, date

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper

def debug_league_detection():
    """Debug league header detection"""
    print("=== Debug League Detection ===")

    scraper = FlashScoreScraper()

    # Get page content
    soup = scraper.get_page("https://www.flashscore.com/football/", force_selenium=True)

    if soup:
        print(f"Page content length: {len(str(soup))}")

        # Find all event containers
        all_events = soup.find_all("div", class_=re.compile(r"^event$"))
        print(f"\nFound {len(all_events)} event containers")

        # Analyze each event
        for i, event in enumerate(all_events[:20]):  # Check first 20
            event_text = scraper._safe_extract_text(event)
            if event_text:
                # Check if it looks like a league header
                is_header = scraper._is_league_header(event_text)
                print(f"{i+1:2d}. {'[HEADER]' if is_header else '[MATCH ]'} {event_text[:80]}...")

                if is_header:
                    league, region = scraper._parse_league_header(event_text)
                    print(f"    -> Region: '{region}', League: '{league}'")

        # Also check for league patterns in the page text
        print(f"\n=== Searching for league patterns in page text ===")
        page_text = soup.get_text()

        # Look for common league patterns
        patterns = [
            r"EUROPE:\s*([^\\n]+)",
            r"WORLD:\s*([^\\n]+)",
            r"AFRICA:\s*([^\\n]+)",
            r"AMERICA:\s*([^\\n]+)",
            r"Europa League[^\\n]*",
            r"Champions League[^\\n]*",
            r"Conference League[^\\n]*"
        ]

        for pattern in patterns:
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            if matches:
                print(f"Pattern '{pattern}': {matches[:5]}")  # Show first 5 matches

if __name__ == "__main__":
    debug_league_detection()
