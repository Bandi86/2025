#!/usr/bin/env python3
"""
Alternative approach to get more matches
======================================

Try different strategies to get all matches from FlashScore
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

def try_alternative_approach():
    """Try different approaches to get more matches"""
    print("=== Alternative Match Extraction ===")

    scraper = FlashScoreScraper()

    # Get page content
    soup = scraper.get_page("https://www.flashscore.com/football/", force_selenium=True)

    if soup:
        print(f"Page content length: {len(str(soup))}")

        # Strategy 1: Try different event class patterns
        print("\n1. Testing different event class patterns:")
        event_patterns = [
            r"^event$",
            r"event",
            r"event__",
            r".*event.*"
        ]

        for pattern in event_patterns:
            elements = soup.find_all("div", class_=re.compile(pattern))
            print(f"  Pattern '{pattern}': {len(elements)} elements")

            if elements and len(elements) < 50:  # Show sample if reasonable amount
                for i, elem in enumerate(elements[:5]):
                    text = scraper._safe_extract_text(elem)
                    if text:
                        print(f"    {i+1}. {text[:60]}...")

        # Strategy 2: Look for match URLs more aggressively
        print("\n2. Looking for match URLs:")
        match_links = soup.find_all("a", href=re.compile(r"/match/"))
        print(f"Found {len(match_links)} match links")

        # Group by unique matches
        unique_matches = set()
        for link in match_links:
            href = link.get('href', '')
            if '/match/' in href:
                # Extract match ID
                match_id = href.split('/match/')[-1].split('/')[0] if '/match/' in href else href
                unique_matches.add(match_id)

        print(f"Unique match IDs: {len(unique_matches)}")

        # Strategy 3: Look for team name patterns
        print("\n3. Looking for team name patterns:")

        # Find all elements that might contain team names
        team_patterns = [
            r"participant",
            r"team",
            r".*home.*",
            r".*away.*"
        ]

        for pattern in team_patterns:
            elements = soup.find_all(["span", "div"], class_=re.compile(pattern, re.I))
            if elements:
                print(f"  Pattern '{pattern}': {len(elements)} elements")

                # Sample team names
                team_names = []
                for elem in elements[:10]:
                    text = scraper._safe_extract_text(elem)
                    if text and len(text) < 50 and not any(char in text for char in [':', '-', '()', '[]']):
                        team_names.append(text)

                if team_names:
                    print(f"    Sample teams: {team_names[:5]}")

        # Strategy 4: Try to find the actual match container structure
        print("\n4. Analyzing HTML structure for matches:")

        # Look for any div that contains match-like patterns
        all_divs = soup.find_all("div")
        match_like_divs = []

        for div in all_divs:
            text = scraper._safe_extract_text(div)
            if text and len(text) < 200:  # Reasonable length
                # Look for patterns like "Team1 vs Team2", "HH:MM", scores
                if (re.search(r'\\d{1,2}:\\d{2}', text) and  # Time pattern
                    (text.count('(') >= 2 or text.count(' vs ') > 0 or text.count('-') > 0)):
                    match_like_divs.append(text)

        print(f"Found {len(match_like_divs)} potential match containers")
        for i, text in enumerate(match_like_divs[:10]):
            print(f"  {i+1}. {text[:80]}...")

if __name__ == "__main__":
    try_alternative_approach()
