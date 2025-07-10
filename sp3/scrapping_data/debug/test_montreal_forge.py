#!/usr/bin/env python3
"""
Test CF Montreal vs Forge detailed scraping
==========================================

Test detailed scraping with a Canadian match that should have more data.
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

def test_montreal_forge_match():
    """Test detailed scraping with CF Montreal vs Forge match"""

    print("🔍 Testing CF Montreal vs Forge - Detailed Scraping")
    print("=" * 60)

    # Test match data from daily_matches.json
    test_match = {
        "home_team": "CF Montreal",
        "away_team": "ForgeAdvancing to next round",  # Note: problematic team name
        "match_time": "",
        "league": "Championship",
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
    print(f"⚠️ Note: Away team name looks problematic (includes 'Advancing to next round')")
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
            print(f"✅ Success! Scraping time: {duration:.2f} seconds")
            print()
            print("📋 Detailed Match Data:")
            print("-" * 40)

            # Display key fields
            key_fields = [
                'home_team', 'away_team', 'score', 'match_time',
                'league', 'region', 'status'
            ]

            for field in key_fields:
                value = detailed_data.get(field, 'N/A')
                print(f"  {field}: {value}")

            print()
            print("🔧 Additional fields found:")
            additional_fields = [k for k in detailed_data.keys() if k not in key_fields]
            for field in sorted(additional_fields):
                value = detailed_data[field]
                if isinstance(value, dict):
                    print(f"  {field}: {json.dumps(value, indent=4)}")
                elif isinstance(value, str) and len(value) > 100:
                    print(f"  {field}: {value[:100]}...")
                else:
                    print(f"  {field}: {value}")

            # Save detailed data to file
            output_file = f"debug/montreal_forge_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(detailed_data, f, indent=2, ensure_ascii=False)

            print()
            print(f"💾 Full detailed data saved to: {output_file}")

            # Check for additional data like statistics, betting odds, events
            extra_data_fields = ['statistics', 'betting_odds', 'events']
            extra_data_found = [field for field in extra_data_fields if detailed_data.get(field)]

            if extra_data_found:
                print(f"🎯 Extra data found: {', '.join(extra_data_found)}")
            else:
                print("⚠️ No extra data fields found (statistics, betting_odds, events)")

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
    success = test_montreal_forge_match()
    print()
    if success:
        print("🎉 Test completed successfully!")
        print("✅ Montreal vs Forge detailed scraping worked")
    else:
        print("💥 Test failed!")
        print("❌ Detailed scraping needs debugging")

    sys.exit(0 if success else 1)
