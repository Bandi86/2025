#!/usr/bin/env python3
"""
Test multiple finished matches detailed scraping
==============================================

Test script to verify detailed scraping works for multiple finished matches.
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

def test_multiple_finished_matches():
    """Test detailed scraping with multiple finished matches"""

    print("🔍 Testing Multiple Finished Matches - Detailed Scraping")
    print("=" * 60)

    # Test matches from the daily_matches.json (all finished)
    test_matches = [
        {
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
        },
        {
            "home_team": "Cook Islands W",
            "away_team": "Papua New Guinea W",
            "match_time": "",
            "league": "OFC Nations Cup Women",
            "match_url": "https://www.flashscore.com/match/football/bBfTNKbK/#/match-summary",
            "score": "0-8",
            "status": "finished",
            "source": "flashscore",
            "match_date": "2025-07-10",
            "region": "AUSTRALIA & OCEANIA"
        }
    ]

    # Initialize scraper
    print("🚀 Initializing FlashScore scraper...")
    scraper = FlashScoreScraper()

    results = []
    success_count = 0

    for i, test_match in enumerate(test_matches, 1):
        print(f"\n🏆 Test Match {i}: {test_match['home_team']} vs {test_match['away_team']}")
        print(f"📊 Score: {test_match['score']}")
        print(f"🌐 URL: {test_match['match_url']}")
        print(f"📅 League: {test_match['league']}")

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

                # Verify key fields
                key_fields = ['home_team', 'away_team', 'score', 'league', 'region', 'status']
                all_fields_present = all(detailed_data.get(field) for field in key_fields)

                if all_fields_present:
                    print("✅ All key fields present")
                    success_count += 1
                else:
                    print("⚠️ Some key fields missing")
                    missing = [f for f in key_fields if not detailed_data.get(f)]
                    print(f"   Missing: {missing}")

                results.append({
                    'match': f"{test_match['home_team']} vs {test_match['away_team']}",
                    'success': True,
                    'duration': duration,
                    'data': detailed_data
                })

            else:
                print("❌ Failed - no data returned")
                results.append({
                    'match': f"{test_match['home_team']} vs {test_match['away_team']}",
                    'success': False,
                    'duration': duration,
                    'error': 'No data returned'
                })

        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            print(f"❌ Failed after {duration:.2f} seconds")
            print(f"🚨 Error: {e}")
            results.append({
                'match': f"{test_match['home_team']} vs {test_match['away_team']}",
                'success': False,
                'duration': duration,
                'error': str(e)
            })

    # Save results
    output_file = f"debug/multiple_match_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n📊 Summary:")
    print(f"   Total matches tested: {len(test_matches)}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {len(test_matches) - success_count}")
    print(f"   Success rate: {success_count/len(test_matches)*100:.1f}%")
    print(f"💾 Full results saved to: {output_file}")

    return success_count == len(test_matches)

if __name__ == "__main__":
    success = test_multiple_finished_matches()
    print()
    if success:
        print("🎉 All tests completed successfully!")
        print("✅ Detailed scraping is working correctly for multiple matches")
    else:
        print("💥 Some tests failed!")
        print("❌ Detailed scraping needs debugging for some matches")

    sys.exit(0 if success else 1)
