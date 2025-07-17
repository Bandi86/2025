#!/usr/bin/env python3
"""
Optimized FlashScore test based on real data structure
====================================================

Based on the manual save from flashscoreindex.json, create a faster,
more accurate test that can find finished matches.
"""
import sys
import os
import json
import re
from datetime import datetime, date

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper
from scripts.utils.json_handler import JSONHandler

def parse_flashscore_text_data(text_data: str) -> list:
    """Parse the text data similar to flashscoreindex.json"""
    matches = []
    current_region = "Unknown"
    current_league = "Unknown"

    lines = [line.strip() for line in text_data.split('\n') if line.strip()]
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check for region:league pattern
        if ':' in line and any(region in line.upper() for region in ['EUROPE', 'WORLD', 'AFRICA', 'ASIA', 'AMERICA', 'BRAZIL', 'USA', 'CANADA', 'CHILE', 'VENEZUELA']):
            parts = line.split(':', 1)
            if len(parts) == 2:
                current_region = parts[0].strip()
                current_league = parts[1].strip()
                print(f"Found league: {current_region} - {current_league}")
            i += 1
            continue

        # Skip metadata lines
        if line in ['Draw', 'Standings', 'Live Standings', 'display matches (1)', 'display matches (2)', 'display matches (3)', 'display matches (4)', 'display matches (35)']:
            i += 1
            continue

        # Check for match status indicators
        status_indicators = ['Finished', 'Half Time', 'After Pen.', 'Live', 'Cancelled', 'Postponed', 'Interrupted']
        match_status = 'scheduled'

        if line in status_indicators:
            match_status = line.lower()
            i += 1

            # Next should be home team
            if i < len(lines):
                home_team = lines[i]
                i += 1

                # Skip duplicate home team line
                if i < len(lines) and lines[i] == home_team:
                    i += 1

                # Next should be away team
                if i < len(lines):
                    away_team = lines[i]
                    i += 1

                    # Skip duplicate away team line
                    if i < len(lines) and lines[i] == away_team:
                        i += 1

                    # Next should be scores
                    home_score = ""
                    away_score = ""

                    if i < len(lines) and lines[i].isdigit():
                        home_score = lines[i]
                        i += 1
                        if i < len(lines) and lines[i].isdigit():
                            away_score = lines[i]
                            i += 1

                    # Create match object
                    match_data = {
                        'home_team': home_team,
                        'away_team': away_team,
                        'match_time': '',  # No time for finished matches
                        'score': f"{home_score}-{away_score}" if home_score and away_score else "",
                        'status': match_status,
                        'league': current_league,
                        'region': current_region,
                        'source': 'flashscore_text',
                        'scraped_at': datetime.now().isoformat(),
                        'match_date': date.today().isoformat()
                    }

                    matches.append(match_data)
                    print(f"Found {match_status} match: {home_team} vs {away_team} ({home_score}-{away_score}) - {current_league}")
                    continue

        # Check for time pattern (HH:MM) for scheduled matches
        time_match = re.match(r'^(\d{1,2}:\d{2})$', line)
        if time_match:
            match_time = time_match.group(1)
            i += 1

            # Next should be home team
            if i < len(lines):
                home_team = lines[i]
                i += 1

                # Skip duplicate home team line
                if i < len(lines) and lines[i] == home_team:
                    i += 1

                # Next should be away team
                if i < len(lines):
                    away_team = lines[i]
                    i += 1

                    # Skip duplicate away team line
                    if i < len(lines) and lines[i] == away_team:
                        i += 1

                    # Skip score dashes for scheduled matches
                    if i < len(lines) and lines[i] == '-':
                        i += 1
                        if i < len(lines) and lines[i] == '-':
                            i += 1

                    # Create match object
                    match_data = {
                        'home_team': home_team,
                        'away_team': away_team,
                        'match_time': match_time,
                        'score': "",
                        'status': 'scheduled',
                        'league': current_league,
                        'region': current_region,
                        'source': 'flashscore_text',
                        'scraped_at': datetime.now().isoformat(),
                        'match_date': date.today().isoformat()
                    }

                    matches.append(match_data)
                    print(f"Found scheduled match: {home_team} vs {away_team} at {match_time} - {current_league}")
                    continue

        i += 1

    return matches

def test_optimized_flashscore():
    """Test optimized approach using the real data structure"""
    print("=== Optimized FlashScore Test ===")

    # First, try to parse the manual saved data as reference
    manual_file = "example/flashscoreindex.json"
    if os.path.exists(manual_file):
        print(f"\n1. Parsing manual saved data from {manual_file}...")
        with open(manual_file, 'r', encoding='utf-8') as f:
            manual_text = f.read()

        manual_matches = parse_flashscore_text_data(manual_text)
        print(f"Found {len(manual_matches)} matches in manual data")

        # Count by status
        status_counts = {}
        for match in manual_matches:
            status = match['status']
            status_counts[status] = status_counts.get(status, 0) + 1

        print("Status distribution in manual data:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")

        # Find first finished match for testing
        finished_matches = [m for m in manual_matches if m['status'] == 'finished']
        if finished_matches:
            print(f"\nFound {len(finished_matches)} finished matches!")
            sample_finished = finished_matches[0]
            print(f"Sample finished match: {sample_finished['home_team']} vs {sample_finished['away_team']}")
            print(f"  Score: {sample_finished['score']}")
            print(f"  League: {sample_finished['region']} - {sample_finished['league']}")

    # Now try to get similar data from live scraping (but optimized)
    print(f"\n2. Testing live scraping with optimized approach...")

    scraper = FlashScoreScraper()

    # Get page content but with shorter timeout
    soup = scraper.get_page("https://www.flashscore.com/football/", force_selenium=True, timeout=10)

    if soup:
        page_text = soup.get_text()
        print(f"Got page text ({len(page_text)} chars)")

        # Parse similar to manual data
        live_matches = parse_flashscore_text_data(page_text)
        print(f"Found {len(live_matches)} matches in live data")

        # Count by status
        status_counts = {}
        for match in live_matches:
            status = match['status']
            status_counts[status] = status_counts.get(status, 0) + 1

        print("Status distribution in live data:")
        for status, count in status_counts.items():
            print(f"  {status}: {count}")

        # Save the results
        today = date.today()
        json_handler = JSONHandler(".")

        if live_matches:
            saved_file = json_handler.save_daily_matches(live_matches, today)
            print(f"\nSaved {len(live_matches)} matches to: {saved_file}")

            # Find a finished match for detailed testing
            finished_matches = [m for m in live_matches if m['status'] == 'finished']
            if finished_matches:
                print(f"\nTesting detailed scraping with finished match...")
                test_match = finished_matches[0]
                print(f"Selected: {test_match['home_team']} vs {test_match['away_team']}")

                # For now, just show that we found it - detailed scraping would need match URL
                print("✅ Found finished match - ready for detailed scraping!")
            else:
                print("❌ No finished matches found in live data")
        else:
            print("❌ No matches found in live data")

    print("\n=== Optimized test completed ===")

if __name__ == "__main__":
    test_optimized_flashscore()
