#!/usr/bin/env python3
"""
Enhanced detailed scraping test
===============================

Test script to extract more detailed data (lineups, stats, events) from FlashScore match pages.
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

def test_enhanced_detailed_scraping():
    """Test enhanced detailed scraping with more data extraction"""

    print("🔍 Testing Enhanced Detailed Scraping - CF Montreal vs Forge")
    print("=" * 65)

    # Test match data (CF Montreal vs Forge - should have more data)
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
    print(f"🏟️ Status: {test_match['status']}")
    print()

    # Initialize scraper
    print("🚀 Initializing FlashScore scraper...")
    scraper = FlashScoreScraper()

    try:
        print("📝 Scraping detailed match information...")
        print("🔍 Looking for: lineups, statistics, events, betting odds...")

        start_time = datetime.now()

        # First get the raw page to debug what selectors are available
        print("📄 Getting page content...")
        soup = scraper.get_page(test_match['match_url'], force_selenium=True, timeout=30)

        if soup:
            print("✅ Page loaded successfully!")
            print()

            # Debug: Look for various sections
            print("🔍 Searching for available data sections...")

            sections_to_check = [
                ("Statistics", [".section-header:contains('Statistics')", "[data-testid*='stat']", ".stat", "[class*='stat']"]),
                ("Lineups", [".section-header:contains('Lineups')", "[data-testid*='lineup']", ".lineup", "[class*='lineup']"]),
                ("Events", [".section-header:contains('Events')", "[data-testid*='event']", ".event", "[class*='event']"]),
                ("Odds", [".section-header:contains('Odds')", "[data-testid*='odds']", ".odds", "[class*='odds']"]),
                ("H2H", [".section-header:contains('H2H')", "[data-testid*='h2h']", ".h2h", "[class*='h2h']"])
            ]

            found_sections = {}
            for section_name, selectors in sections_to_check:
                found_elements = []
                for selector in selectors:
                    try:
                        elements = soup.select(selector)
                        if elements:
                            found_elements.extend(elements)
                    except Exception:
                        continue

                if found_elements:
                    found_sections[section_name] = len(found_elements)
                    print(f"  ✅ {section_name}: {len(found_elements)} elements found")
                else:
                    print(f"  ❌ {section_name}: No elements found")

            # Look for any navigation tabs or links that might lead to more data
            print("\n🔗 Checking for navigation tabs/links...")
            nav_selectors = [
                "a[href*='statistics']",
                "a[href*='lineups']",
                "a[href*='events']",
                "a[href*='odds']",
                "a[href*='h2h']",
                "[class*='tab']",
                "[class*='nav']",
                "[data-testid*='tab']"
            ]

            for selector in nav_selectors:
                try:
                    elements = soup.select(selector)
                    if elements:
                        print(f"  🔗 {selector}: {len(elements)} navigation elements found")
                        # Show first few links
                        for i, elem in enumerate(elements[:3]):
                            text = scraper._safe_extract_text(elem)
                            href = elem.get('href', '')
                            if text and len(text.strip()) > 0:
                                print(f"    - {text} -> {href}")
                except Exception:
                    continue

            # Try to get detailed data using the existing methods
            print("\n📊 Attempting detailed data extraction...")
            detailed_data = scraper.get_match_details(test_match['match_url'], base_match_data=test_match)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            if detailed_data:
                print(f"✅ Detailed data extracted in {duration:.2f} seconds")
                print()
                print("📋 Extracted Data Fields:")
                for field, value in detailed_data.items():
                    if isinstance(value, dict):
                        print(f"  {field}: {len(value)} items")
                        for k, v in value.items():
                            print(f"    - {k}: {v}")
                    elif isinstance(value, list):
                        print(f"  {field}: {len(value)} items")
                        for i, item in enumerate(value[:3]):  # Show first 3
                            print(f"    {i+1}. {item}")
                    else:
                        print(f"  {field}: {value}")

                # Save detailed data
                output_file = f"debug/enhanced_detailed_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(detailed_data, f, indent=2, ensure_ascii=False)

                print(f"\n💾 Full detailed data saved to: {output_file}")

                # Summary of what we found
                extra_data_fields = ['betting_odds', 'statistics', 'events', 'lineups', 'h2h']
                found_extra = [field for field in extra_data_fields if field in detailed_data and detailed_data[field]]
                missing_extra = [field for field in extra_data_fields if field not in detailed_data or not detailed_data[field]]

                print(f"\n📈 Enhanced Data Summary:")
                print(f"  ✅ Found extra data: {found_extra}")
                print(f"  ❌ Missing extra data: {missing_extra}")

                return len(found_extra) > 0

            else:
                print("❌ Failed to extract detailed data")
                return False

        else:
            print("❌ Failed to load page")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_detailed_scraping()
    print()
    if success:
        print("🎉 Enhanced detailed scraping test completed!")
        print("✅ Found additional data beyond basic match info")
    else:
        print("💥 Enhanced detailed scraping needs more work")
        print("❌ Only basic match data available")

    sys.exit(0 if success else 1)
