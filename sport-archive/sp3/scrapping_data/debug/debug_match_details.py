#!/usr/bin/env python3
"""
Debug script for FlashScore match details page structure
"""

from scripts.sources.flashscore import FlashScoreScraper
import re

def debug_match_details():
    """Debug match details page structure"""

    scraper = FlashScoreScraper()
    match_url = "https://www.flashscore.com/match/football/hIwbiFUp/#/match-summary"

    print(f"Debugging match details for: {match_url}")
    print("="*60)

    # Get the page content with Selenium
    soup = scraper.get_page(match_url, force_selenium=True)

    if not soup:
        print("❌ Failed to get page content")
        return

    print("✅ Successfully got page content")
    print(f"Page title: {soup.title.string if soup.title else 'No title'}")

    # Debug team name selectors
    print("\n🔍 Looking for team names...")

    # Try various selectors for team names
    selectors_to_try = [
        # Original selectors
        ("participant__participant--home", "participant__participantName"),
        ("participant__participant--away", "participant__participantName"),

        # Alternative selectors that might exist on match detail pages
        (".participant--home", ".participant__participantName"),
        (".participant--away", ".participant__participantName"),
        (".duelParticipant__home", ".participant__participantName"),
        (".duelParticipant__away", ".participant__participantName"),

        # Generic team selectors
        (".team", ".teamName"),
        (".team-name", None),
        (".participant", ".participantName"),

        # Header selectors
        ("h1", None),
        ("h2", None),
        (".matchHeader", None),
        (".match-header", None),
    ]

    for container_class, name_class in selectors_to_try:
        print(f"\nTrying selector: {container_class} -> {name_class}")

        if container_class.startswith('.'):
            # CSS selector
            container_elements = soup.select(container_class)
        else:
            # Class name with regex
            container_elements = soup.find_all("div", class_=re.compile(container_class))

        if container_elements:
            print(f"  Found {len(container_elements)} container elements")
            for i, elem in enumerate(container_elements[:3]):  # Show first 3
                if name_class:
                    if name_class.startswith('.'):
                        name_elem = elem.select_one(name_class)
                    else:
                        name_elem = elem.find("div", class_=name_class)

                    if name_elem:
                        text = name_elem.get_text(strip=True)
                        print(f"    [{i}] Name element text: '{text}'")
                    else:
                        print(f"    [{i}] No name element found")
                else:
                    text = elem.get_text(strip=True)
                    print(f"    [{i}] Direct text: '{text}'")
        else:
            print(f"  No elements found")

    # Debug score selectors
    print("\n🔍 Looking for scores...")

    score_selectors = [
        "detailScore",
        ".detailScore__home",
        ".detailScore__away",
        ".score",
        ".match-score",
        ".result",
        "span[class*='score']",
        "div[class*='score']"
    ]

    for selector in score_selectors:
        print(f"\nTrying score selector: {selector}")

        if selector.startswith('.') or selector.startswith('['):
            elements = soup.select(selector)
        else:
            elements = soup.find_all("div", class_=re.compile(selector))

        if elements:
            print(f"  Found {len(elements)} score elements")
            for i, elem in enumerate(elements[:3]):
                text = elem.get_text(strip=True)
                print(f"    [{i}] Score text: '{text}'")
        else:
            print(f"  No score elements found")

    # Debug general structure
    print("\n🔍 General page structure...")

    # Look for any text containing Bolivian team names
    bolivian_teams = ['Academia del Balompie', 'Nacional Potosi', 'Bolivar', 'Always Ready',
                     'Oriente Petrolero', 'Guabira', 'Wilstermann']

    page_text = soup.get_text()
    found_teams = [team for team in bolivian_teams if team in page_text]

    if found_teams:
        print(f"✅ Found team names in page text: {found_teams}")
    else:
        print("❌ No Bolivian team names found in page text")

    # Look for any elements containing team names
    for team in bolivian_teams[:2]:  # Check first 2 teams
        elements = soup.find_all(string=re.compile(team, re.IGNORECASE))
        if elements:
            print(f"\n'{team}' found in {len(elements)} text nodes")
            for elem in elements[:2]:
                parent = elem.parent
                print(f"  Parent tag: {parent.name}, classes: {parent.get('class', [])}")

    print("\n" + "="*60)
    print("Debug completed!")

if __name__ == "__main__":
    debug_match_details()
