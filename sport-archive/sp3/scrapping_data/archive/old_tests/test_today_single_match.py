#!/usr/bin/env python3
"""
Test for today's matches with single match detailed scraping
===========================================================

1. Get today's match list
2. Save daily matches JSON
3. Pick the first match and scrape its details
4. Verify file structure
"""
import sys
import os
import json
from datetime import datetime, date

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(current_dir, 'scripts')
sys.path.insert(0, current_dir)
sys.path.insert(0, scripts_dir)

from scripts.sources.flashscore import FlashScoreScraper
from scripts.detailed_match_scraper import DetailedMatchScraper
from scripts.utils.json_handler import JSONHandler

def test_today_with_single_match():
    """Test today's matches and scrape details for first match"""
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
    print(f"=== Testing pipeline for TODAY: {today_str} ===")

    # Step 1: Get today's match list
    print("\n1. Getting today's match list...")
    scraper = FlashScoreScraper()
    matches = scraper.get_daily_matches(today)

    print(f"Found {len(matches)} matches for today")
    if len(matches) > 0:
        print("First 5 matches:")
        for i, match in enumerate(matches[:5]):
            print(f"  {i+1}. {match.get('home_team')} vs {match.get('away_team')} - Status: {match.get('status', 'Unknown')}")
        if len(matches) > 5:
            print(f"  ... and {len(matches) - 5} more matches")
    else:
        print("No matches found for today!")
        return False

    # Step 2: Save daily match list
    print("\n2. Saving today's match list...")
    json_handler = JSONHandler(".")  # Use current directory as base
    saved_file = json_handler.save_daily_matches(matches, today)
    print(f"Saved to: {saved_file}")

    # Verify the file was created
    if os.path.exists(saved_file):
        print(f"✓ Daily matches file created: {saved_file}")
        with open(saved_file, 'r', encoding='utf-8') as f:
            saved_data = json.load(f)
        print(f"✓ File contains {len(saved_data.get('matches', []))} matches")
    else:
        print(f"✗ Daily matches file NOT found: {saved_file}")
        return False

    # Step 3: Find a finished match for detailed scraping
    print("\n3. Looking for a finished match...")
    finished_match = None
    finished_statuses = ['finished', 'Finished', 'FT', 'ft', 'Final', 'FINAL']

    for match in matches:
        match_status = match.get('status', '').strip()
        if match_status in finished_statuses:
            finished_match = match
            print(f"Found finished match: {match.get('home_team')} vs {match.get('away_team')} - Status: {match_status}")
            break

    if not finished_match:
        print("No finished matches found. Looking for matches with scores...")
        # Look for matches that have scores (likely finished)
        for match in matches:
            score = match.get('score')
            if score and isinstance(score, str) and score.strip() and '-' in score:
                finished_match = match
                print(f"Found match with score: {match.get('home_team')} vs {match.get('away_team')} - Score: {score}")
                break

    if not finished_match:
        print("No finished matches found today. Using first match anyway for testing...")
        finished_match = matches[0]

    print(f"Selected match: {finished_match.get('home_team')} vs {finished_match.get('away_team')}")
    print(f"Match URL: {finished_match.get('match_url', 'No URL')}")
    print(f"Match status: {finished_match.get('status', 'Unknown')}")
    print(f"Match score: {finished_match.get('score', 'No score')}")

    # Try to scrape details for this specific match
    detailed_scraper = DetailedMatchScraper(".")

    if finished_match.get('match_url'):
        print("Scraping match details...")
        detailed_data = detailed_scraper.scrape_match_details(
            finished_match['match_url'],
            'flashscore',
            finished_match
        )

        if detailed_data:
            print("✓ Successfully scraped match details")
            print(f"  Home team: {detailed_data.get('home_team')}")
            print(f"  Away team: {detailed_data.get('away_team')}")
            print(f"  Score: {detailed_data.get('score', 'No score')}")
            print(f"  Status: {detailed_data.get('status', 'Unknown')}")
            print(f"  Match time: {detailed_data.get('match_time', 'No time')}")

            # Save the detailed match
            match_filename = f"{finished_match.get('home_team', 'Unknown')}_vs_{finished_match.get('away_team', 'Unknown')}.json"
            match_filename = match_filename.replace(' ', '_').replace('(', '').replace(')', '')

            # Create matches directory path manually since save_match_details might not exist
            matches_dir = f"data/{today_str.replace('-', '/')}/matches"
            os.makedirs(matches_dir, exist_ok=True)
            detailed_file_path = os.path.join(matches_dir, match_filename)

            with open(detailed_file_path, 'w', encoding='utf-8') as f:
                json.dump(detailed_data, f, indent=2, ensure_ascii=False)

            print(f"✓ Detailed match saved to: {detailed_file_path}")

        else:
            print("✗ Failed to scrape match details")
    else:
        print("✗ No match URL available for detailed scraping")

    # Step 4: Verify file structure
    print("\n4. Verifying file structure...")
    base_dir = f"data/{today_str.replace('-', '/')}"

    # Check daily matches file
    if os.path.exists(saved_file):
        print(f"✓ Daily matches file: {saved_file}")

    # Check matches directory
    matches_dir = os.path.join(base_dir, "matches")
    if os.path.exists(matches_dir):
        match_files = [f for f in os.listdir(matches_dir) if f.endswith('.json')]
        print(f"✓ Matches directory: {matches_dir} (contains {len(match_files)} files)")

        if match_files:
            print("  Match files:")
            for filename in match_files:
                print(f"    - {filename}")
    else:
        print(f"✗ Matches directory not found: {matches_dir}")

    print(f"\n=== Test completed for {today_str} ===")
    return True

if __name__ == "__main__":
    test_today_with_single_match()
