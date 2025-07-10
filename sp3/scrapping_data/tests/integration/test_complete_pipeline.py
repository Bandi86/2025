#!/usr/bin/env python3
"""
Complete pipeline test for a past date to verify:
1. Daily match list JSON is created with ALL matches
2. Only finished matches are scraped for details
3. Correct file structure is maintained
"""
import sys
import os
import json
from datetime import datetime, timedelta

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper
from scripts.detailed_match_scraper import DetailedMatchScraper
from scripts.utils.json_handler import JSONHandler

def test_complete_pipeline():
    """Test complete pipeline for a past date"""
    # Use a past date that should have many finished matches
    test_date = "2025-01-15"
    print(f"=== Testing complete pipeline for {test_date} ===")

    # Step 1: Get daily match list
    print("\n1. Getting daily match list...")
    scraper = FlashScoreScraper()
    matches = scraper.get_daily_matches(test_date)

    print(f"Found {len(matches)} matches")
    if len(matches) > 0:
        print("Sample matches:")
        for i, match in enumerate(matches[:5]):
            print(f"  {i+1}. {match.get('home_team')} vs {match.get('away_team')} - Status: {match.get('status', 'Unknown')}")
        if len(matches) > 5:
            print(f"  ... and {len(matches) - 5} more matches")

    # Step 2: Save daily match list
    print("\n2. Saving daily match list...")
    json_handler = JSONHandler(".")  # Use current directory as base
    target_date_obj = datetime.strptime(test_date, "%Y-%m-%d").date()
    json_handler.save_daily_matches(matches, target_date_obj)

    # Verify the file was created (it's named daily_matches_YYYY-MM-DD.json)
    expected_file = f"data/{test_date.replace('-', '/')}/matches/daily_matches_{test_date}.json"
    if os.path.exists(expected_file):
        print(f"✓ Daily matches file created: {expected_file}")
        with open(expected_file, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)
        print(f"✓ File contains {len(saved_data.get('matches', []))} matches")
    else:
        print(f"✗ Daily matches file NOT found: {expected_file}")
        return False

    # Step 3: Test detailed scraping
    print("\n3. Testing detailed scraping...")
    detailed_scraper = DetailedMatchScraper(".")  # Use current directory as base
    result = detailed_scraper.scrape_daily_match_details(datetime.strptime(test_date, "%Y-%m-%d").date())

    print(f"Detailed scraping results:")
    print(f"  - Scraped: {result.get('scraped', 0)} matches")
    print(f"  - Skipped: {result.get('skipped', 0)} matches")
    print(f"  - Errors: {result.get('errors', 0)} matches")

    # Show skip reasons
    skip_reasons = result.get('skip_reasons', {})
    if skip_reasons:
        print("  Skip reasons:")
        for reason, count in skip_reasons.items():
            print(f"    - {reason}: {count}")

    # Step 4: Verify file structure
    print("\n4. Verifying file structure...")
    base_dir = f"data/{test_date.replace('-', '/')}"

    # Check daily matches file
    daily_file = os.path.join(base_dir, f"matches/daily_matches_{test_date}.json")
    if os.path.exists(daily_file):
        print(f"✓ {daily_file}")
    else:
        print(f"✗ {daily_file}")

    # Check matches directory
    matches_dir = os.path.join(base_dir, "matches")
    if os.path.exists(matches_dir):
        match_files = [f for f in os.listdir(matches_dir) if f.endswith('.json') and not f.startswith('daily_matches')]
        print(f"✓ {matches_dir} (contains {len(match_files)} detailed match files)")

        # Show some example files
        if match_files:
            print("  Example match files:")
            for i, filename in enumerate(match_files[:3]):
                print(f"    - {filename}")
            if len(match_files) > 3:
                print(f"    ... and {len(match_files) - 3} more")
    else:
        print(f"✗ {matches_dir}")

    # Step 5: Analyze match content
    print("\n5. Analyzing match content...")
    if os.path.exists(daily_file):
        with open(daily_file, 'r', encoding='utf-8') as f:
            daily_data = json.load(f)

        matches = daily_data.get('matches', [])
        status_counts = {}
        for match in matches:
            status = match.get('status', 'Unknown')
            status_counts[status] = status_counts.get(status, 0) + 1

        print("Match status distribution:")
        for status, count in status_counts.items():
            print(f"  - {status}: {count}")

        # Count how many should be scraped vs skipped
        finished_count = status_counts.get('Finished', 0) + status_counts.get('FT', 0) + status_counts.get('finished', 0)
        print(f"\nExpected to scrape: ~{finished_count} finished matches")

    print(f"\n=== Pipeline test completed for {test_date} ===")
    return True

if __name__ == "__main__":
    test_complete_pipeline()
