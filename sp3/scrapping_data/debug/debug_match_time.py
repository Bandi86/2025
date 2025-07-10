#!/usr/bin/env python3
"""
Debug script to examine match time extraction from FlashScore detail pages.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.sources.flashscore import FlashScoreScraper
import re

def debug_match_time():
    """Debug match time extraction from FlashScore detail pages."""

    scraper = FlashScoreScraper()

    # Use a known match URL - get one from the recent test
    # Instead of dynamically finding one, let's use a simpler approach

    print("Getting daily matches to find sample match URLs...")

    try:
        # Get matches from today
        from datetime import datetime
        today = datetime.now()
        matches = scraper.get_daily_matches(today)

        if not matches:
            print("No matches found for today")
            return

        print(f"Found {len(matches)} matches, examining the first one...")

        # Get the first match that has a URL
        sample_match = None
        for match in matches:
            if match.get('match_url'):  # Changed from 'url' to 'match_url'
                sample_match = match
                break

        if not sample_match:
            print("No matches with URLs found")
            return

        match_url = sample_match['match_url']  # Changed from 'url' to 'match_url'
        print(f"Examining match detail page: {match_url}")
        print(f"Match: {sample_match.get('home_team', 'Unknown')} vs {sample_match.get('away_team', 'Unknown')}")

        # Get match details with Selenium
        detail_soup = scraper.get_page(match_url, force_selenium=True, timeout=10)
        if not detail_soup:
            print("Failed to get match detail page")
            return

    except Exception as e:
        print(f"Error getting matches: {e}")
        # Fallback to a direct URL approach
        match_url = "https://www.flashscore.com/match/football/wUGW8u8D/#/match-summary/match-summary"
        print(f"Using fallback URL: {match_url}")

        detail_soup = scraper.get_page(match_url, force_selenium=True, timeout=10)
        if not detail_soup:
            print("Failed to get fallback match detail page")
            return

    print("\n=== EXAMINING TIME-RELATED ELEMENTS ===")

    # Look for various time-related selectors
    time_selectors = [
        "div[class*='time']",
        "div[class*='Time']",
        "span[class*='time']",
        "span[class*='Time']",
        ".duelParticipant__startTime",
        ".startTime",
        "[class*='startTime']",
        "[class*='matchTime']",
        "[class*='date']",
        "[class*='Date']",
        ".fixedHeaderDuel__startTime",
        ".duel__time",
        ".time",
        "[data-time]"
    ]

    found_elements = []

    for selector in time_selectors:
        try:
            elements = detail_soup.select(selector)
            for elem in elements[:3]:  # Limit to first 3 matches per selector
                text = elem.get_text(strip=True)
                if text and len(text) < 50:  # Filter out very long text
                    found_elements.append({
                        'selector': selector,
                        'text': text,
                        'class': elem.get('class') or [],
                        'attrs': dict(elem.attrs)
                    })
        except Exception as e:
            print(f"Error with selector {selector}: {e}")

    # Remove duplicates and sort by text content
    unique_elements = []
    seen_texts = set()

    for elem in found_elements:
        if elem['text'] not in seen_texts:
            seen_texts.add(elem['text'])
            unique_elements.append(elem)

    print(f"\nFound {len(unique_elements)} unique time-related elements:")

    for i, elem in enumerate(unique_elements, 1):
        print(f"\n{i}. Selector: {elem['selector']}")
        print(f"   Text: '{elem['text']}'")
        print(f"   Classes: {elem['class']}")
        print(f"   Attributes: {elem['attrs']}")

        # Check if text looks like time format
        time_patterns = [
            r'\d{2}:\d{2}',           # HH:MM
            r'\d{1,2}:\d{2}',         # H:MM or HH:MM
            r'\d{2}\.\d{2}\.',        # DD.MM.
            r'\d{1,2}/\d{1,2}',       # M/D or MM/DD
            r'finished|live|ft',      # Status indicators
        ]

        matches_pattern = False
        for pattern in time_patterns:
            if re.search(pattern, elem['text'], re.IGNORECASE):
                matches_pattern = True
                print(f"   *** MATCHES TIME PATTERN: {pattern} ***")
                break

        if not matches_pattern:
            print(f"   (No time pattern match)")

    print("\n=== EXAMINING GENERAL STRUCTURE ===")

    # Look for the main match header/info area
    main_areas = [
        ".fixedHeaderDuel",
        ".duel",
        "[class*='duel']",
        "[class*='Duel']",
        ".matchHeader",
        "[class*='header']"
    ]

    for selector in main_areas:
        try:
            elements = detail_soup.select(selector)
            for elem in elements[:2]:  # First 2 matches
                text = elem.get_text(strip=True)
                if text and len(text) < 200:  # Not too long
                    print(f"\n{selector}: '{text[:100]}{'...' if len(text) > 100 else ''}'")

                    # Look for time patterns in this area
                    time_matches = re.findall(r'\d{1,2}:\d{2}', text)
                    if time_matches:
                        print(f"   Found time patterns: {time_matches}")

        except Exception as e:
            print(f"Error with selector {selector}: {e}")

    print("\n=== RAW HTML SAMPLE ===")
    # Print a sample of the raw HTML to help identify patterns
    html_str = str(detail_soup)[:2000]
    print(html_str)

    scraper.close()

if __name__ == "__main__":
    debug_match_time()
