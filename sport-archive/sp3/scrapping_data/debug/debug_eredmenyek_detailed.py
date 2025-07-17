#!/usr/bin/env python3
"""
Detailed debug of Eredmenyek.com Bolivia page
"""

import requests
from bs4 import BeautifulSoup
import json
import re

def debug_eredmenyek_bolivia():
    print("=== Analyzing Eredmenyek.com Bolivia page ===")

    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'hu-HU,hu;q=0.9,en;q=0.8',
    }

    url = "https://www.eredmenyek.com/labdarugas/bolivia/"

    try:
        response = requests.get(url, headers=headers, timeout=15)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Save the HTML for manual inspection
            with open('debug_eredmenyek_bolivia.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Saved HTML to debug_eredmenyek_bolivia.html")

            # Look for various possible match containers
            print("\n--- Searching for match elements ---")

            # Try different approaches
            all_divs = soup.find_all('div')
            print(f"Total divs: {len(all_divs)}")

            # Look for specific classes that might contain matches
            potential_classes = []
            for div in all_divs[:50]:  # Check first 50 divs
                if div.get('class'):
                    classes = ' '.join(div.get('class'))
                    if any(keyword in classes.lower() for keyword in ['match', 'event', 'fixture', 'team', 'score']):
                        potential_classes.append(classes)

            print(f"Potential match-related classes found: {set(potential_classes)}")

            # Look for team names
            bolivia_teams = ['Always Ready', 'The Strongest', 'Blooming', 'Bolivar', 'Independiente', 'Wilstermann', 'Guabira', 'Nacional Potosi']
            content_text = soup.get_text()

            print("\n--- Searching for team names in content ---")
            found_teams = []
            for team in bolivia_teams:
                if team.lower() in content_text.lower():
                    found_teams.append(team)
                    print(f"Found team: {team}")

            # Look for score patterns
            print("\n--- Searching for score patterns ---")
            score_pattern = r'\d+:\d+|\d+-\d+'
            scores = re.findall(score_pattern, content_text)
            if scores:
                print(f"Found potential scores: {scores[:10]}")  # First 10

            # Look for links that might lead to match details
            print("\n--- Searching for match links ---")
            links = soup.find_all('a', href=True)
            match_links = []
            for link in links:
                href = link.get('href')
                if href and any(keyword in href.lower() for keyword in ['merkozes', 'match', 'game']):
                    match_links.append(href)

            if match_links:
                print(f"Found {len(match_links)} potential match links:")
                for link in match_links[:5]:  # First 5
                    print(f"  {link}")

            # Check for JavaScript-loaded content indicators
            print("\n--- Checking for dynamic content ---")
            scripts = soup.find_all('script')
            js_content = []
            for script in scripts:
                if script.string and any(keyword in script.string.lower() for keyword in ['match', 'bolivia', 'fixture']):
                    js_content.append(script.string[:200])  # First 200 chars

            if js_content:
                print("Found JavaScript that might load match data:")
                for js in js_content[:3]:
                    print(f"  {js}...")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    debug_eredmenyek_bolivia()
