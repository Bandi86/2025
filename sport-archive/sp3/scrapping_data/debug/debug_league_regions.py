#!/usr/bin/env python3
"""
Debug league/region detection
=============================

Debug script to understand why Brazilian matches get BELARUS region.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import logging
from datetime import date
from scripts.sources.flashscore import FlashScoreScraper

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def debug_league_detection():
    """Debug the league/region detection process"""

    print("🔍 Debugging League/Region Detection")
    print("=" * 50)

    # Initialize scraper with debug logging
    scraper = FlashScoreScraper()

    # Get today's date
    target_date = date(2025, 7, 10)

    print(f"📅 Scraping FlashScore for {target_date}")
    print("🔍 This will show detailed logs of league header detection...")
    print()

    # Run the scraper with detailed logging enabled
    matches = scraper.get_daily_matches(target_date)

    print(f"\n📊 Summary:")
    print(f"Total matches found: {len(matches)}")

    # Analyze region distribution
    regions = {}
    leagues = {}

    for match in matches:
        region = match.get('region', 'Unknown')
        league = match.get('league', 'Unknown')

        regions[region] = regions.get(region, 0) + 1
        leagues[league] = leagues.get(league, 0) + 1

    print(f"\n🌍 Region distribution:")
    for region, count in sorted(regions.items()):
        print(f"  {region}: {count} matches")

    print(f"\n🏆 Top leagues:")
    for league, count in sorted(leagues.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {league}: {count} matches")

    # Look for problematic cases
    print(f"\n⚠️ Checking for problematic cases:")

    brazilian_teams = ['Batalhao', 'CSA', 'Bahia', 'Fortaleza', 'Ferroviario', 'Tocantinopolis']
    for match in matches:
        home_team = match.get('home_team', '')
        away_team = match.get('away_team', '')
        region = match.get('region', '')
        league = match.get('league', '')

        # Check if Brazilian team names with wrong region
        is_likely_brazilian = any(team in home_team or team in away_team for team in brazilian_teams)
        if is_likely_brazilian and region != 'BRAZIL' and region != 'AMERICA':
            print(f"  🚨 Potential mismatch: {home_team} vs {away_team}")
            print(f"     League: {league}, Region: {region}")

    print(f"\n📁 Check the debug log above for detailed league header detection info.")

if __name__ == "__main__":
    debug_league_detection()
