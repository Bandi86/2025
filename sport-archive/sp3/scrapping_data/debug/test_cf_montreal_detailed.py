#!/usr/bin/env python3
"""
Test CF Montreal vs Forge detailed scraping
==========================================

Test script to verify detailed scraping works for the CF Montreal vs Forge match
and shows more detailed data like we expected.
"""

import sys
import os

# Add the parent directory to path
script_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(script_dir)
sys.path.insert(0, parent_dir)

import json
import logging
from datetime import datetime
from scripts.sources.flashscore import FlashScoreScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_cf_montreal_detailed():
    """Test detailed scraping with CF Montreal vs Forge match"""

    print("🔍 Testing CF Montreal vs Forge - Detailed Scraping")
    print("=" * 60)

    # Test match data (CF Montreal vs Forge - finished match 2-2)
    test_match = {
        "home_team": "CF Montreal",
        "away_team": "Forge",
        "match_time": "",
        "league": "Canadian Premier League",
        "match_url": "https://www.flashscore.com/match/football/2ycReLZo/#/match-summary",
        "score": "2-2",
        "status": "finished",
        "source": "flashscore",
        "match_date": "2025-07-10",
        "region": "CANADA"
    }

    print(f"🏆 Test Match: {test_match['home_team']} vs {test_match['away_team']}")
    print(f"📊 Score: {test_match['score']}")
    print(f"🌐 URL: {test_match['match_url']}")
    print(f"📅 League: {test_match['league']}")
    print(f"🌍 Region: {test_match['region']}")
    print(f"🏟️ Status: {test_match['status']}")
    print()

    # Initialize scraper
    print("🚀 Initializing FlashScore scraper...")
    scraper = FlashScoreScraper()

    # Test detailed scraping
    print("📝 Scraping detailed match information...")
    start_time = datetime.now()

    try:
        detailed_data = scraper.get_match_details(
            test_match['match_url'],
            base_match_data=test_match
        )

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        if detailed_data:
            print("✅ Detailed scraping successful!")
            print(f"⏱️ Scraping time: {duration:.2f} seconds")
            print()
            print("📋 Detailed Match Data:")
            print("-" * 30)

            # Display key fields
            key_fields = [
                'home_team', 'away_team', 'score', 'match_time',
                'league', 'status', 'region'
            ]

            for field in key_fields:
                value = detailed_data.get(field, 'N/A')
                print(f"  {field}: {value}")

            print()
            print("🔧 Additional fields found:")
            additional_fields = [k for k in detailed_data.keys() if k not in key_fields]
            for field in sorted(additional_fields):
                value = detailed_data[field]
                if isinstance(value, str) and len(value) > 100:
                    value = value[:100] + "..."
                elif isinstance(value, dict):
                    value = f"Dict with {len(value)} keys: {list(value.keys())}"
                elif isinstance(value, list):
                    value = f"List with {len(value)} items"
                print(f"  {field}: {value}")

            # Check for specific additional data we hope to find
            expected_extras = ['betting_odds', 'statistics', 'events']
            found_extras = [field for field in expected_extras if field in detailed_data]

            print()
            if found_extras:
                print(f"🎯 Found expected additional data: {found_extras}")

                # Show details of found extras
                for extra in found_extras:
                    data = detailed_data[extra]
                    if isinstance(data, dict):
                        print(f"  {extra}: {len(data)} entries")
                        for key in list(data.keys())[:3]:  # Show first 3 keys
                            print(f"    - {key}: {data[key]}")
                    elif isinstance(data, list):
                        print(f"  {extra}: {len(data)} items")
                        for item in data[:3]:  # Show first 3 items
                            print(f"    - {item}")
            else:
                print("⚠️ No additional data found (betting_odds, statistics, events)")

            # Save detailed data to file
            output_file = f"debug/cf_montreal_detailed_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(detailed_data, f, indent=2, ensure_ascii=False)

            print()
            print(f"💾 Full detailed data saved to: {output_file}")

            return True

        else:
            print("❌ Detailed scraping failed - no data returned")
            return False

    except Exception as e:
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        print(f"❌ Detailed scraping failed after {duration:.2f} seconds")
        print(f"🚨 Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_cf_montreal_detailed()
    print()
    if success:
        print("🎉 Test completed successfully!")
        print("✅ Detailed scraping is working correctly for CF Montreal vs Forge")
    else:
        print("💥 Test failed!")
        print("❌ Detailed scraping needs debugging")

    sys.exit(0 if success else 1)
