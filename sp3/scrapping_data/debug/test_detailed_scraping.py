#!/usr/bin/env python3
"""
Test detailed scraping functionality
=====================================

Test script to verify that detailed match scraping works for finished matches.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import json
import logging
from datetime import datetime
from scripts.sources.flashscore import FlashScoreScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def test_detailed_scraping():
    """Test detailed scraping with a finished match"""

    print("🔍 Testing Detailed Match Scraping")
    print("=" * 50)

    # Test match data (Samoa W vs Tahiti W - finished match)
    test_match = {
        "home_team": "Samoa W",
        "away_team": "Tahiti W",
        "match_time": "",
        "league": "OFC Nations Cup Women",
        "match_url": "https://www.flashscore.com/match/football/W42s0H6D/#/match-summary",
        "score": "3-1",
        "status": "finished",
        "source": "flashscore",
        "match_date": "2025-07-10",
        "region": "AUSTRALIA & OCEANIA"
    }

    print(f"🏆 Test Match: {test_match['home_team']} vs {test_match['away_team']}")
    print(f"📊 Score: {test_match['score']}")
    print(f"🌐 URL: {test_match['match_url']}")
    print(f"📅 League: {test_match['league']}")
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
                if isinstance(value, str) and len(value) > 50:
                    value = value[:50] + "..."
                print(f"  {field}: {value}")

            # Save detailed data to file
            output_file = f"debug/detailed_match_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
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
    success = test_detailed_scraping()
    print()
    if success:
        print("🎉 Test completed successfully!")
        print("✅ Detailed scraping is working correctly")
    else:
        print("💥 Test failed!")
        print("❌ Detailed scraping needs debugging")

    sys.exit(0 if success else 1)
