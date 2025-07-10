#!/usr/bin/env python3
"""
Daily FlashScore Scraper
========================

LOGIKUS EGYSZERŰ SCRIPT - webscraping linkekkel és mentés
"""
import sys
import os
import json
import argparse
from datetime import datetime, date
from typing import List, Dict, Any, Optional

# Paths
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
sys.path.insert(0, current_dir)

# Import the FlashScore scraper
from sources.flashscore import FlashScoreScraper


def get_date_directory(target_date: date, base_dir: str) -> str:
    """Create date-based directory structure."""
    return os.path.join(base_dir, str(target_date.year), f"{target_date.month:02d}", f"{target_date.day:02d}")


def scrape_daily_matches_with_links(target_date: date) -> List[Dict[str, Any]]:
    """
    Scrape daily matches with links from FlashScore using Selenium.

    Returns:
        List of matches with match_url included for detailed scraping
    """
    print(f"🌐 Scraping FlashScore for daily matches on {target_date}")

    scraper = FlashScoreScraper(headless=True, use_selenium=True)

    try:
        # Get matches with links for the target date
        matches = scraper.get_daily_matches(target_date=target_date)

        if matches:
            print(f"✅ Successfully scraped {len(matches)} matches")

            # Count matches with URLs for detailed scraping
            with_urls = len([m for m in matches if m.get('match_url')])
            print(f"🔗 {with_urls} matches have URLs for detailed scraping")

            return matches
        else:
            print("❌ No matches found")
            return []

    except Exception as e:
        print(f"❌ Error scraping matches: {e}")
        return []
    finally:
        if hasattr(scraper, 'driver') and scraper.driver:
            scraper.driver.quit()


def save_daily_matches(matches: List[Dict[str, Any]], target_date: date, output_dir: str) -> str:
    """Save ALL matches to a single JSON file per day."""
    date_dir = get_date_directory(target_date, output_dir)
    daily_file = os.path.join(date_dir, 'daily_matches.json')

    # Ensure directory exists
    os.makedirs(date_dir, exist_ok=True)

    # Count matches by status
    status_count = {}
    with_urls_count = 0
    for match in matches:
        status = match.get('status', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1
        if match.get('match_url'):
            with_urls_count += 1

    # Organize matches with metadata
    organized_data = {
        'date': target_date.isoformat(),
        'scraped_at': datetime.now().isoformat(),
        'total_matches': len(matches),
        'matches_with_urls': with_urls_count,
        'status_breakdown': status_count,
        'matches': matches
    }

    # Save all matches to single file
    with open(daily_file, 'w', encoding='utf-8') as f:
        json.dump(organized_data, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved {len(matches)} matches to: {daily_file}")
    print(f"📊 Status breakdown: {status_count}")
    print(f"🔗 Matches with URLs: {with_urls_count}")
    return daily_file


def get_finished_matches_with_urls(matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter finished matches that have URLs for detailed scraping."""
    finished_with_urls = [
        match for match in matches
        if match.get('status', '').lower() in ['finished', 'ft', 'full-time'] and match.get('match_url')
    ]

    print(f"🏆 Found {len(finished_with_urls)} finished matches with URLs")
    return finished_with_urls


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Daily FlashScore Scraper')
    parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD), default: today')
    parser.add_argument('--output', type=str, default='data', help='Output directory')

    args = parser.parse_args()

    # Parse target date
    if args.date:
        try:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            print("❌ Invalid date format. Use YYYY-MM-DD")
            return
    else:
        target_date = date.today()

    print("🚀 Daily FlashScore Scraper")
    print("=" * 50)
    print(f"📅 Target date: {target_date}")
    print(f"📁 Output directory: {args.output}")

    # Step 1: Scrape daily matches with links
    matches = scrape_daily_matches_with_links(target_date)

    if not matches:
        print("❌ No matches found. Exiting.")
        return

    # Step 2: Save all matches to daily file
    daily_file = save_daily_matches(matches, target_date, args.output)

    # Step 3: Show summary of finished matches with URLs
    finished_with_urls = get_finished_matches_with_urls(matches)

    if finished_with_urls:
        print(f"\n🎯 Finished matches ready for detailed scraping:")
        for i, match in enumerate(finished_with_urls[:5], 1):  # Show first 5
            print(f"  {i}. {match['home_team']} vs {match['away_team']} ({match.get('score', 'N/A')})")
            print(f"     URL: {match.get('match_url', 'N/A')[:60]}...")

        if len(finished_with_urls) > 5:
            print(f"  ... and {len(finished_with_urls) - 5} more")

    print(f"\n✅ Daily scraping completed!")
    print(f"📄 Data saved to: {daily_file}")
    print(f"🔍 Next step: Use detailed_scraper.py to get match details")


if __name__ == "__main__":
    main()
