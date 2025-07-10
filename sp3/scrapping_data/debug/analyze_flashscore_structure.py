#!/usr/bin/env python3
"""
FlashScore structure analyzer
============================

Analyze the FlashScore page structure to understand:
1. How matches are grouped (leagues, competitions)
2. How many matches are actually available
3. How to identify finished vs scheduled matches
"""
import sys
import os
from datetime import datetime, date

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper

def analyze_flashscore_structure():
    """Analyze FlashScore page structure"""
    print("=== FlashScore Structure Analysis ===")

    # Initialize scraper with detailed logging
    scraper = FlashScoreScraper()

    # Try different URLs to see what we can find
    urls_to_try = [
        "https://www.flashscore.com/football/",
        "https://www.flashscore.com/",
        "https://www.flashscore.com/football/results/",
        "https://www.flashscore.com/football/live/",
    ]

    for url in urls_to_try:
        print(f"\n--- Analyzing: {url} ---")

        try:
            # Get page content
            soup = scraper.get_page(url, force_selenium=True)

            if soup:
                print(f"Page content length: {len(str(soup))}")

                # Look for league/competition headers
                print("\n1. Looking for competition/league headers...")

                # Strategy 1: Look for section headers
                headers = soup.find_all(["h2", "h3", "h4"], class_=re.compile(r"title|header|league|competition", re.I))
                print(f"Found {len(headers)} potential headers")
                for i, header in enumerate(headers[:10]):
                    text = scraper._safe_extract_text(header)
                    if text:
                        print(f"  {i+1}. {text}")

                # Strategy 2: Look for specific FlashScore league containers
                league_containers = soup.find_all("div", class_=re.compile(r"league|tournament|competition"))
                print(f"\nFound {len(league_containers)} league/tournament containers")

                # Strategy 3: Look for all text that might be league names
                page_text = soup.get_text()
                potential_leagues = []

                # Look for common patterns
                europe_patterns = ["Europa League", "Champions League", "Conference League", "EURO"]
                america_patterns = ["Copa America", "CONMEBOL", "CONCACAF"]
                country_patterns = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"]

                all_patterns = europe_patterns + america_patterns + country_patterns

                for pattern in all_patterns:
                    if pattern.lower() in page_text.lower():
                        potential_leagues.append(pattern)

                if potential_leagues:
                    print(f"\nFound potential leagues in text: {potential_leagues}")

                # Strategy 4: Count all match elements more carefully
                print("\n2. Detailed match element analysis...")

                # Try different selectors
                selectors_to_try = [
                    ("event__match", "div"),
                    ("event", "div"),
                    ("match", "div"),
                    ("ui-table__row", "div"),
                    ("participant", "span"),
                ]

                for selector, tag in selectors_to_try:
                    elements = soup.find_all(tag, class_=re.compile(selector))
                    print(f"  {selector}: {len(elements)} elements")

                    # Sample some elements
                    if elements:
                        for i, elem in enumerate(elements[:3]):
                            text = scraper._safe_extract_text(elem)
                            if text and len(text) < 200:  # Reasonable length
                                print(f"    Sample {i+1}: {text[:100]}...")

                # Strategy 5: Look for finished matches specifically
                print("\n3. Looking for finished matches...")

                finished_indicators = ["FT", "Final", "Finished", r"\d+-\d+"]
                finished_elements = []

                for indicator in finished_indicators:
                    elements = soup.find_all(string=re.compile(indicator, re.I))
                    finished_elements.extend(elements)

                print(f"Found {len(finished_elements)} potential finished match indicators")

                if finished_elements:
                    print("Sample finished match indicators:")
                    for i, elem in enumerate(finished_elements[:5]):
                        print(f"  {i+1}. {str(elem).strip()[:50]}")

                break  # Stop at first successful URL

        except Exception as e:
            print(f"Error analyzing {url}: {e}")

    print("\n=== Analysis Complete ===")

if __name__ == "__main__":
    import re
    analyze_flashscore_structure()
