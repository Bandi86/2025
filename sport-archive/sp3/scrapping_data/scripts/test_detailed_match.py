#!/usr/bin/env python3
"""
Test Detailed Match Scraper
===========================

Teszt szkript az első befejezett meccs részletes adatainak kinyerésére.
Ez egy kísérleti verzió a linkek megtalálásához és a részletes scraping teszteléséhez.
"""

import sys
import os
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional, List

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_dir = current_dir
sys.path.insert(0, parent_dir)
sys.path.insert(0, scripts_dir)

# Import our scraper
from sources.flashscore import FlashScoreScraper

def get_finished_matches_data() -> List[Dict[str, Any]]:
    """Load finished matches from today's data."""
    today = date.today()
    data_dir = os.path.join(parent_dir, 'data', str(today.year), f"{today.month:02d}", f"{today.day:02d}")
    finished_file = os.path.join(data_dir, 'finished_matches.json')

    if os.path.exists(finished_file):
        with open(finished_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        print(f"❌ No finished matches file found: {finished_file}")
        return []

def get_live_matches_with_links() -> List[Dict[str, Any]]:
    """
    Kinyerjük a mai meccseket linkekkel együtt élő scraping-gel.

    Returns:
        Lista a meccsekről linkekkel együtt
    """
    print("� Getting live matches with links from FlashScore...")

    scraper = FlashScoreScraper(headless=True, use_selenium=True)

    try:
        # Get today's matches with links
        today = date.today()
        matches = scraper.get_daily_matches(target_date=today)

        if matches:
            print(f"✅ Found {len(matches)} matches with links")
            # Filter only matches that have URLs
            matches_with_urls = [match for match in matches if match.get('match_url')]
            print(f"🔗 {len(matches_with_urls)} matches have URLs")
            return matches_with_urls
        else:
            print("❌ No matches found")
            return []

    except Exception as e:
        print(f"❌ Error getting live matches: {e}")
        return []
    finally:
        if hasattr(scraper, 'driver') and scraper.driver:
            scraper.driver.quit()

def find_finished_match_with_url(home_team: str, away_team: str, live_matches: List[Dict[str, Any]]) -> Optional[str]:
    """
    Megkeressük a befejezett meccs URL-jét a live matches listából.

    Args:
        home_team: Hazai csapat neve
        away_team: Vendég csapat neve
        live_matches: Live matches lista URL-ekkel

    Returns:
        A meccs URL-je ha megtaláljuk, különben None
    """
    print(f"🔍 Looking for match URL: {home_team} vs {away_team}")

    for match in live_matches:
        match_home = match.get('home_team', '').lower()
        match_away = match.get('away_team', '').lower()
        match_url = match.get('match_url', '')

        # Check if team names match (with some flexibility for differences)
        if (home_team.lower() in match_home or match_home in home_team.lower()) and \
           (away_team.lower() in match_away or match_away in away_team.lower()):
            print(f"✅ Found match URL: {match_url}")
            return match_url

    print("❌ Could not find match URL in live data")
    return None

def test_detailed_scraping(match_url: str, match_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Teszteljük a részletes meccs adatok kinyerését.

    Args:
        match_url: A meccs URL-je
        match_data: Alap meccs adatok

    Returns:
        Részletes meccs adatok vagy None
    """
    print(f"📊 Testing detailed scraping for: {match_url}")

    scraper = FlashScoreScraper(headless=False, use_selenium=True)  # headless=False for debugging

    try:
        detailed_data = scraper.get_match_details(match_url, match_data)

        if detailed_data:
            print("✅ Successfully scraped detailed match data!")
            print(f"🎯 Keys found: {list(detailed_data.keys())}")
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
    filename = f"{today.strftime('%Y%m%d')}_{home_team}_vs_{away_team}.json"

    filepath = os.path.join(matches_dir, filename)

    # Combine base match data with detailed data
    combined_data = {**match_data, **detailed_data}

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, indent=2, ensure_ascii=False)

    print(f"💾 Detailed match data saved to: {filepath}")
    return filepath

def main():
    """Main test function."""
    print("🚀 Starting detailed match scraping test...")

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Step 1: Get live matches with URLs
    print("\n📡 Step 1: Getting live matches with URLs...")
    live_matches = get_live_matches_with_links()

    if not live_matches:
        print("❌ No live matches with URLs found!")
        return

    print(f"✅ Found {len(live_matches)} live matches with URLs")

    # Step 2: Load finished matches from our data
    print("\n📋 Step 2: Loading finished matches from our data...")
    finished_matches = get_finished_matches_data()

    if not finished_matches:
        print("❌ No finished matches found!")
        return

    print(f"📋 Found {len(finished_matches)} finished matches")

    # Step 3: Take the first finished match for testing
    test_match = finished_matches[0]
    print(f"\n🎯 Step 3: Testing with first match: {test_match['home_team']} vs {test_match['away_team']}")

    # Step 4: Find the match URL from live data
    print("\n🔍 Step 4: Finding match URL...")
    match_url = find_finished_match_with_url(
        test_match['home_team'],
        test_match['away_team'],
        live_matches
    )

    if match_url:
        print(f"✅ Found match URL: {match_url}")

        # Step 5: Test detailed scraping
        print(f"\n📊 Step 5: Testing detailed scraping...")
        detailed_data = test_detailed_scraping(match_url, test_match)

        if detailed_data:
            # Step 6: Save the detailed data
            print(f"\n💾 Step 6: Saving detailed data...")
            saved_file = save_detailed_match(detailed_data, test_match)
            print(f"🎉 Test completed successfully! Data saved to: {saved_file}")
        else:
            print("❌ Failed to get detailed data")
    else:
        print("❌ Could not find match URL - trying alternative approach...")

        # Alternative: check if any live match is marked as finished
        print("\n🔍 Looking for finished matches in live data...")
        finished_live_matches = []

        for match in live_matches:
            status = match.get('status', '').lower()
            home_score = match.get('home_score')
            away_score = match.get('away_score')

            # Check if match is finished (has score or finished status)
            if (status in ['finished', 'ft', 'full-time'] or
                (home_score is not None and away_score is not None and
                 home_score != '' and away_score != '')):
                finished_live_matches.append(match)

        if finished_live_matches:
            print(f"🎯 Found {len(finished_live_matches)} finished matches in live data")

            # Show all finished matches for selection
            for i, match in enumerate(finished_live_matches[:5]):  # Show first 5
                print(f"  {i+1}. {match['home_team']} {match.get('home_score', '?')} - {match.get('away_score', '?')} {match['away_team']} ({match.get('status', 'N/A')})")

            # Use the first finished match
            alt_match = finished_live_matches[0]
            alt_url = alt_match.get('match_url')

            if alt_url:
                print(f"\n🔄 Testing with finished match: {alt_match['home_team']} {alt_match.get('home_score', '?')} - {alt_match.get('away_score', '?')} {alt_match['away_team']}")
                print(f"🔗 Match URL: {alt_url}")

                detailed_data = test_detailed_scraping(alt_url, alt_match)

                if detailed_data:
                    saved_file = save_detailed_match(detailed_data, alt_match)
                    print(f"🎉 Test completed with finished match! Data saved to: {saved_file}")
                else:
                    print("❌ Failed to get detailed data for finished match")
            else:
                print("❌ Finished match has no URL")
        else:
            print("❌ No finished matches found in live data")
            print("\n🔍 DEBUG: Detailed match status analysis:")

            # Detailed status analysis for ALL matches
            statuses = {}
            matches_with_scores = 0
            matches_without_scores = 0

            print(f"\n📊 Analyzing all {len(live_matches)} matches:")
            for i, match in enumerate(live_matches):
                status = match.get('status', 'N/A')
                home_score = match.get('home_score')
                away_score = match.get('away_score')
                score = match.get('score', '')

                # Count statuses
                if status in statuses:
                    statuses[status] += 1
                else:
                    statuses[status] = 1

                # Count matches with/without scores
                if (home_score is not None and away_score is not None and
                    home_score != '' and away_score != '') or score != '':
                    matches_with_scores += 1
                else:
                    matches_without_scores += 1

                # Show first 20 matches for debugging
                if i < 20:
                    print(f"  {i+1:2d}. {match['home_team'][:20]:20} vs {match['away_team'][:20]:20} | Status: {status:10} | Score: '{score}' | Home: '{home_score}' | Away: '{away_score}' | Time: {match.get('match_time', 'N/A')}")

            if len(live_matches) > 20:
                print(f"  ... and {len(live_matches) - 20} more matches")

            print(f"\n📈 Status summary (total {len(live_matches)} matches):")
            for status, count in sorted(statuses.items()):
                percentage = (count / len(live_matches)) * 100
                print(f"  - {status:15}: {count:3d} matches ({percentage:5.1f}%)")

            print(f"\n⚽ Score analysis:")
            print(f"  - Matches WITH scores: {matches_with_scores}")
            print(f"  - Matches WITHOUT scores: {matches_without_scores}")

            # Try to find matches with any score indicators
            potential_finished = []
            for match in live_matches:
                status = match.get('status', '').lower()
                home_score = match.get('home_score')
                away_score = match.get('away_score')
                score = match.get('score', '')

                # More flexible finished match detection
                if (status in ['finished', 'ft', 'full-time', 'aet', 'pen', 'fin', 'ended', 'final'] or
                    score not in ['', '-', '- -'] or
                    (home_score not in [None, '', '-'] and away_score not in [None, '', '-'])):
                    potential_finished.append(match)

            if potential_finished:
                print(f"\n🎯 Found {len(potential_finished)} potentially finished matches:")
                for i, match in enumerate(potential_finished[:10]):  # Show first 10
                    print(f"  {i+1}. {match['home_team']} vs {match['away_team']} | Status: {match.get('status')} | Score: '{match.get('score')}' | URL: {match.get('match_url', 'NO_URL')[:50]}")

                # Test with first potentially finished match
                if potential_finished:
                    test_match = potential_finished[0]
                    test_url = test_match.get('match_url')
                    if test_url:
                        print(f"\n🧪 Testing with potentially finished match: {test_match['home_team']} vs {test_match['away_team']}")
                        detailed_data = test_detailed_scraping(test_url, test_match)

                        if detailed_data:
                            saved_file = save_detailed_match(detailed_data, test_match)
                            print(f"🎉 Test completed with potentially finished match! Data saved to: {saved_file}")
                            return  # Exit successfully
                        else:
                            print("❌ Failed to get detailed data for potentially finished match")
                    else:
                        print("❌ Potentially finished match has no URL")
            else:
                print("\n❌ No potentially finished matches found either")

            print("\n⚠️ No finished matches available for testing")

if __name__ == "__main__":
    main()
