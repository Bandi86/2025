#!/usr/bin/env python3
"""
Debug script to compare old vs new scraping methods
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime, date

# Test the old approach - let's check what the old system was actually doing
def test_old_flashscore_approach():
    print("=== Testing OLD FlashScore approach ===")

    # Headers from the old system
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.flashscore.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }

    # URLs from the old system
    urls_to_test = [
        "https://www.flashscore.com/football/bolivia/division-profesional/",
        "https://www.flashscore.com/football/bolivia/division-profesional/fixtures/",
        "https://www.flashscore.com/football/bolivia/division-profesional/results/",
    ]

    for url in urls_to_test:
        print(f"\n--- Testing URL: {url} ---")
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Content length: {len(response.text)}")

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Look for various selectors that might contain matches
                selectors_to_check = [
                    ("div[class*='event']", "Event divs"),
                    ("div[class*='match']", "Match divs"),
                    ("div[class*='fixture']", "Fixture divs"),
                    ("span[class*='participant']", "Participant spans"),
                    ("div[class*='team']", "Team divs"),
                    (".event__match", "Standard event match"),
                    (".tableCellParticipant__name", "Table cell participant"),
                ]

                for selector, desc in selectors_to_check:
                    elements = soup.select(selector)
                    print(f"  {desc}: {len(elements)} found")
                    if elements and len(elements) < 10:  # Show first few
                        for i, elem in enumerate(elements[:3]):
                            text = elem.get_text(strip=True)[:100]
                            print(f"    [{i}]: {text}")

                # Look for Bolivian team names in the content
                bolivia_teams = ['Always Ready', 'The Strongest', 'Blooming', 'Bolivar', 'Independiente', 'Wilstermann']
                content_lower = response.text.lower()
                found_teams = [team for team in bolivia_teams if team.lower() in content_lower]
                if found_teams:
                    print(f"  Found Bolivian teams in content: {found_teams}")
                else:
                    print("  No Bolivian teams found in content")

        except Exception as e:
            print(f"ERROR: {e}")

def test_eredmenyek_approach():
    print("\n\n=== Testing Eredmenyek.com approach ===")

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
    }

    # Test today's date
    today = datetime.now().strftime("%Y-%m-%d")

    urls_to_test = [
        f"https://www.eredmenyek.com/labdarugas/merkozes/{today}/",
        f"https://m.eredmenyek.com/merkozes/{today}/",
        "https://www.eredmenyek.com/labdarugas/bolivia/",
    ]

    for url in urls_to_test:
        print(f"\n--- Testing URL: {url} ---")
        try:
            response = requests.get(url, headers=headers, timeout=10)
            print(f"Status: {response.status_code}")
            print(f"Content length: {len(response.text)}")

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Look for match containers
                selectors_to_check = [
                    ("div[class*='match']", "Match divs"),
                    ("div[class*='event']", "Event divs"),
                    ("div[class*='fixture']", "Fixture divs"),
                    (".match", "Match class"),
                    (".event", "Event class"),
                    ("tr", "Table rows"),
                ]

                for selector, desc in selectors_to_check:
                    elements = soup.select(selector)
                    print(f"  {desc}: {len(elements)} found")

                # Look for Bolivia specific content
                content_lower = response.text.lower()
                if 'bolivia' in content_lower or 'bolívia' in content_lower:
                    print("  Found Bolivia-related content!")
                else:
                    print("  No Bolivia content found")

        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    test_old_flashscore_approach()
    test_eredmenyek_approach()
