#!/usr/bin/env python3
"""
Test Real Finished Match
========================

Teszt szkript ami egy valós befejezett meccset keres és kinyeri a részletes adatokat.
"""

import sys
import os
import json
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, List

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_dir = current_dir
sys.path.insert(0, parent_dir)
sys.path.insert(0, scripts_dir)

# Import our scraper
from sources.flashscore import FlashScoreScraper

def get_matches_from_past_days(days_back: int = 3) -> List[Dict[str, Any]]:
    """
    Kinyerjük az elmúlt napok meccseit, hogy találjunk befejezett meccseket linkekkel együtt.

    Args:
        days_back: Hány napra menjünk vissza

    Returns:
        Lista az elmúlt napok meccseiről
    """
    all_matches = []

    for i in range(days_back):
        target_date = date.today() - timedelta(days=i+1)
        print(f"🔍 Checking matches for {target_date}...")

        scraper = FlashScoreScraper(headless=True, use_selenium=True)

        try:
            matches = scraper.get_daily_matches(target_date=target_date)

            if matches:
                print(f"✅ Found {len(matches)} matches for {target_date}")

                # Filter finished matches
                finished_matches = []
                for match in matches:
                    status = match.get('status', '').lower()
                    home_score = match.get('home_score')
                    away_score = match.get('away_score')
                    score = match.get('score', '')

                    # Check if match is finished
                    if (status in ['finished', 'ft', 'full-time', 'aet', 'pen', 'fin', 'ended', 'final'] or
                        score not in ['', '-', '- -'] or
                        (home_score not in [None, '', '-'] and away_score not in [None, '', '-'])):
                        finished_matches.append(match)

                if finished_matches:
                    print(f"🎯 Found {len(finished_matches)} finished matches for {target_date}")
                    all_matches.extend(finished_matches)
                else:
                    print(f"❌ No finished matches found for {target_date}")

        except Exception as e:
            print(f"❌ Error getting matches for {target_date}: {e}")
        finally:
            if hasattr(scraper, 'driver') and scraper.driver:
                scraper.driver.quit()

    return all_matches

def test_detailed_scraping(match_url: str, match_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Teszteljük a részletes meccs adatok kinyerését.
    """
    print(f"📊 Testing detailed scraping for: {match_url}")

    scraper = FlashScoreScraper(headless=False, use_selenium=True)  # headless=False for debugging

    try:
        detailed_data = scraper.get_match_details(match_url, match_data)

        if detailed_data:
            print("✅ Successfully scraped detailed match data!")
            print(f"🎯 Keys found: {list(detailed_data.keys())}")

            # Show some key details
            if 'events' in detailed_data:
                print(f"📝 Events found: {len(detailed_data['events'])}")
            if 'stats' in detailed_data:
                print(f"📊 Stats categories: {list(detailed_data['stats'].keys()) if isinstance(detailed_data['stats'], dict) else 'N/A'}")
            if 'lineups' in detailed_data:
                print(f"👥 Lineups available: {bool(detailed_data['lineups'])}")

            return detailed_data
        else:
            print("❌ Failed to scrape detailed data")
            return None

    except Exception as e:
        print(f"❌ Error during detailed scraping: {e}")
        return None
    finally:
        if hasattr(scraper, 'driver') and scraper.driver:
            scraper.driver.quit()

def save_detailed_match(detailed_data: Dict[str, Any], match_data: Dict[str, Any]) -> str:
    """Save detailed match data to the matches directory."""
    today = date.today()
    matches_dir = os.path.join(parent_dir, 'data', str(today.year), f"{today.month:02d}", f"{today.day:02d}", 'matches')
    os.makedirs(matches_dir, exist_ok=True)

    # Create filename based on teams and date
    home_team = match_data.get('home_team', 'unknown').replace(' ', '_').replace('/', '-')
    away_team = match_data.get('away_team', 'unknown').replace(' ', '_').replace('/', '-')
    match_date = match_data.get('match_date', today.strftime('%Y-%m-%d'))
    filename = f"{match_date.replace('-', '')}_{home_team}_vs_{away_team}_detailed.json"

    filepath = os.path.join(matches_dir, filename)

    # Combine base match data with detailed data
    combined_data = {**match_data, **detailed_data}

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)

    print(f"💾 Detailed match data saved to: {filepath}")
    return filepath

def main():
    """Main test function."""
    print("🚀 Starting real finished match test...")

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Step 1: Get finished matches from past days
    print("\n📅 Step 1: Getting finished matches from past days...")
    finished_matches = get_matches_from_past_days(days_back=3)

    if not finished_matches:
        print("❌ No finished matches found in the past days!")
        return

    print(f"\n✅ Found {len(finished_matches)} finished matches total")

    # Show some matches for selection
    print("\n🎯 Available finished matches:")
    for i, match in enumerate(finished_matches[:10]):  # Show first 10
        match_date = match.get('match_date', 'Unknown')
        score = match.get('score', '')
        home_score = match.get('home_score', '')
        away_score = match.get('away_score', '')
        status = match.get('status', 'N/A')

        display_score = score if score else f"{home_score}-{away_score}" if home_score and away_score else "N/A"

        print(f"  {i+1:2d}. [{match_date}] {match['home_team']} {display_score} {match['away_team']} ({status}) - {match.get('league', 'N/A')}")

    # Use the first match for testing
    test_match = finished_matches[0]
    test_url = test_match.get('match_url')

    if not test_url:
        print("❌ First match has no URL!")
        return

    print(f"\n🧪 Testing with: {test_match['home_team']} vs {test_match['away_team']}")
    print(f"🔗 Match URL: {test_url}")
    print(f"📅 Date: {test_match.get('match_date', 'Unknown')}")
    print(f"⚽ Score: {test_match.get('score', 'N/A')}")

    # Test detailed scraping
    print(f"\n📊 Step 2: Testing detailed scraping...")
    detailed_data = test_detailed_scraping(test_url, test_match)

    if detailed_data:
        # Save the detailed data
        print(f"\n💾 Step 3: Saving detailed data...")
        saved_file = save_detailed_match(detailed_data, test_match)
        print(f"🎉 Test completed successfully! Data saved to: {saved_file}")

        # Show summary of what was found
        print(f"\n📋 Summary of detailed data:")
        for key, value in detailed_data.items():
            if isinstance(value, list):
                print(f"  - {key}: {len(value)} items")
            elif isinstance(value, dict):
                print(f"  - {key}: {len(value)} fields")
            else:
                print(f"  - {key}: {type(value).__name__}")

    else:
        print("❌ Failed to get detailed data")

if __name__ == "__main__":
    main()
