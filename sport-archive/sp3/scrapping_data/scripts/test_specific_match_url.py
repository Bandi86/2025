#!/usr/bin/env python3
"""
Test Specific Match URL
=======================

Teszt szkript ami egy konkrét meccs URL-lel teszteli a részletes adatok kinyerését.
"""

import sys
import os
import json
import logging
from datetime import datetime, date
from typing import Dict, Any, Optional

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_dir = current_dir
sys.path.insert(0, parent_dir)
sys.path.insert(0, scripts_dir)

# Import our scraper
from sources.flashscore import FlashScoreScraper

def test_detailed_scraping_with_url(match_url: str) -> Optional[Dict[str, Any]]:
    """
    Teszteljük a részletes meccs adatok kinyerését egy konkrét URL-lel.

    Args:
        match_url: A meccs FlashScore URL-je

    Returns:
        Részletes meccs adatok vagy None
    """
    print(f"📊 Testing detailed scraping for URL: {match_url}")

    # Create basic match data for testing
    match_data = {
        "home_team": "Test Team A",
        "away_team": "Test Team B",
        "match_url": match_url,
        "source": "test",
        "scraped_at": datetime.now().isoformat(),
        "match_date": date.today().strftime('%Y-%m-%d')
    }

    scraper = FlashScoreScraper(headless=False, use_selenium=True)  # headless=False for debugging

    try:
        detailed_data = scraper.get_match_details(match_url, match_data)

        if detailed_data:
            print("✅ Successfully scraped detailed match data!")
            print(f"🎯 Keys found: {list(detailed_data.keys())}")

            # Show detailed information about what was found
            for key, value in detailed_data.items():
                if key == 'events' and isinstance(value, list):
                    print(f"📝 Events: {len(value)} items")
                    if value:
                        print(f"    Sample event: {value[0] if value else 'None'}")
                elif key == 'stats' and isinstance(value, dict):
                    print(f"📊 Stats: {len(value)} categories")
                    print(f"    Categories: {list(value.keys())}")
                elif key == 'lineups' and isinstance(value, dict):
                    print(f"👥 Lineups available")
                    print(f"    Keys: {list(value.keys()) if value else 'None'}")
                elif key == 'h2h' and isinstance(value, list):
                    print(f"🔄 Head-to-head: {len(value)} matches")
                elif isinstance(value, list):
                    print(f"📋 {key}: {len(value)} items")
                elif isinstance(value, dict):
                    print(f"📁 {key}: {len(value)} fields")
                elif isinstance(value, str) and len(value) > 100:
                    print(f"📄 {key}: {len(value)} characters")
                else:
                    print(f"📄 {key}: {value}")

            return detailed_data
        else:
            print("❌ Failed to scrape detailed data")
            return None

    except Exception as e:
        print(f"❌ Error during detailed scraping: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        if hasattr(scraper, 'driver') and scraper.driver:
            scraper.driver.quit()

def save_test_result(detailed_data: Dict[str, Any], match_url: str) -> str:
    """Save test results to a file."""
    today = date.today()
    test_dir = os.path.join(parent_dir, 'data', str(today.year), f"{today.month:02d}", f"{today.day:02d}", 'test_results')
    os.makedirs(test_dir, exist_ok=True)

    # Create filename based on URL and timestamp
    timestamp = datetime.now().strftime('%H%M%S')
    filename = f"test_detailed_scraping_{timestamp}.json"

    filepath = os.path.join(test_dir, filename)

    # Create test result data
    test_result = {
        "test_info": {
            "timestamp": datetime.now().isoformat(),
            "match_url": match_url,
            "test_type": "detailed_scraping"
        },
        "detailed_data": detailed_data
    }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(test_result, f, indent=2, ensure_ascii=False)

    print(f"💾 Test results saved to: {filepath}")
    return filepath

def main():
    """Main test function."""
    print("🚀 Starting detailed scraping test with specific URL...")

    # Set up logging
    logging.basicConfig(level=logging.INFO)

    # Test URLs - these should be real FlashScore match URLs
    test_urls = [
        # Add some real FlashScore match URLs here for testing
        # For example: "https://www.flashscore.com/match/football/MaSHdxIF/#/match-summary"
        "https://www.flashscore.com/match/football/MaSHdxIF/#/match-summary",  # Sabah Baku vs Celje
        "https://www.flashscore.com/match/football/8xxOzeed/#/match-summary",  # AEK Larnaca vs Partizan
    ]

    if not test_urls:
        print("❌ No test URLs provided!")
        print("ℹ️  Please add some real FlashScore match URLs to the test_urls list")
        return

    for i, url in enumerate(test_urls):
        print(f"\n🧪 Test {i+1}/{len(test_urls)}: {url}")

        detailed_data = test_detailed_scraping_with_url(url)

        if detailed_data:
            saved_file = save_test_result(detailed_data, url)
            print(f"✅ Test {i+1} completed successfully!")

            # Ask if user wants to continue with next URL
            if i < len(test_urls) - 1:
                print(f"\n🔄 Continue with next URL? (y/n): ", end="")
                # For automated testing, just continue
                print("y (auto-continue)")
                continue
        else:
            print(f"❌ Test {i+1} failed!")

            # Ask if user wants to continue with next URL
            if i < len(test_urls) - 1:
                print(f"\n🔄 Continue with next URL despite failure? (y/n): ", end="")
                # For automated testing, just continue
                print("y (auto-continue)")
                continue

    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main()
