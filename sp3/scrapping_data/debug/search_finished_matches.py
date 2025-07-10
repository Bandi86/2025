#!/usr/bin/env python3
"""
Search for finished matches specifically
======================================

Try to find today's finished matches on FlashScore
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

def search_finished_matches():
    """Search specifically for finished matches"""
    print("=== Searching for Finished Matches ===")

    scraper = FlashScoreScraper()

    # Try different FlashScore pages that might have finished matches
    urls_to_try = [
        "https://www.flashscore.com/football/",
        "https://www.flashscore.com/football/results/",
        "https://www.flashscore.com/football/live/",
        "https://www.flashscore.com/"
    ]

    for url in urls_to_try:
        print(f"\n--- Checking: {url} ---")

        soup = scraper.get_page(url, force_selenium=True)

        if soup:
            # Look for finished match indicators
            page_text = soup.get_text()

            # Count different status indicators
            status_counts = {
                'FT': len(re.findall(r'\\bFT\\b', page_text)),
                'Final': len(re.findall(r'\\bFinal\\b', page_text, re.I)),
                'Finished': len(re.findall(r'\\bFinished\\b', page_text, re.I)),
                'After Pen.': len(re.findall(r'After Pen\\.', page_text)),
                'Score patterns': len(re.findall(r'\\b\\d+\\s*-\\s*\\d+\\b', page_text))
            }

            print(f"Status indicators found:")
            for status, count in status_counts.items():
                if count > 0:
                    print(f"  {status}: {count}")

            # Look for specific finished match patterns
            finished_patterns = [
                r'FT\\s*\\d+\\s*-\\s*\\d+',
                r'\\d+\\s*-\\s*\\d+\\s*FT',
                r'Final\\s*\\d+\\s*-\\s*\\d+',
                r'\\d+\\s*-\\s*\\d+.*(?:Final|FT|Finished)'
            ]

            finished_matches_text = []
            for pattern in finished_patterns:
                matches = re.findall(pattern, page_text, re.I)
                if matches:
                    finished_matches_text.extend(matches)

            if finished_matches_text:
                print(f"Found {len(finished_matches_text)} finished match patterns:")
                for i, match_text in enumerate(finished_matches_text[:5]):
                    print(f"  {i+1}. {match_text}")

            # Try to find actual match elements with scores
            match_links = soup.find_all("a", href=re.compile(r"/match/"))
            potential_finished = []

            for link in match_links:
                # Look in the parent elements for score information
                parent = link.find_parent("div")
                if parent:
                    parent_text = scraper._safe_extract_text(parent)
                    if parent_text and re.search(r'\\d+\\s*-\\s*\\d+', parent_text):
                        potential_finished.append(parent_text[:100])

            if potential_finished:
                print(f"Found {len(potential_finished)} potential finished matches:")
                for i, match_text in enumerate(potential_finished[:5]):
                    print(f"  {i+1}. {match_text}...")

            # If this is the results page and we found finished matches, we can stop
            if "results" in url and (finished_matches_text or potential_finished):
                break

if __name__ == "__main__":
    search_finished_matches()
