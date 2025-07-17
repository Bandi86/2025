#!/usr/bin/env python3
"""
Simple Production FlashScore Scraper
===================================

Simplified production script for daily FlashScore scraping optimized for testing.
"""
import sys
import os
import json
import argparse
from datetime import datetime, date
from typing import List, Dict, Any, Optional

# Add current directory and scripts directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
scripts_dir = current_dir
sys.path.insert(0, parent_dir)
sys.path.insert(0, scripts_dir)

def get_date_directory(target_date: date, base_dir: str) -> str:
    """Create date-based directory structure."""
    return os.path.join(base_dir, str(target_date.year), f"{target_date.month:02d}", f"{target_date.day:02d}")

def save_all_matches_to_single_file(matches: List[Dict[str, Any]], target_date: date, output_dir: str) -> str:
    """Save ALL matches to a single JSON file per day."""
    date_dir = get_date_directory(target_date, output_dir)
    daily_file = os.path.join(date_dir, 'all_matches.json')

    # Ensure directory exists
    os.makedirs(date_dir, exist_ok=True)

    # Organize matches with metadata
    organized_data = {
        'date': target_date.isoformat(),
        'scraped_at': datetime.now().isoformat(),
        'total_matches': len(matches),
        'matches': matches
    }

    # Save all matches to single file
    with open(daily_file, 'w', encoding='utf-8') as f:
        json.dump(organized_data, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved {len(matches)} ALL matches to single file: {daily_file}")
    return daily_file

def load_saved_matches() -> List[Dict[str, Any]]:
    """Load matches from saved fast parser results."""
    fast_results_file = os.path.join(parent_dir, 'archive', 'fast_parser_results.json')

    if os.path.exists(fast_results_file):
        with open(fast_results_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        matches = data.get('matches', [])
        print(f"📊 Loaded {len(matches)} matches from fast parser results")
        return matches

    print("❌ No saved data available. Run test_fast_flashscore_parser.py first.")
    return []

def filter_matches_by_status(matches: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Filter matches by status for processing."""
    filtered = {
        'scheduled': [],
        'finished': [],
        'live': [],
        'other': []
    }

    for match in matches:
        status = match.get('status', 'unknown').lower()

        if status == 'scheduled':
            filtered['scheduled'].append(match)
        elif status == 'finished':
            filtered['finished'].append(match)
        elif status in ['live', 'half_time']:
            filtered['live'].append(match)
        else:
            filtered['other'].append(match)

    print(f"📈 Match status distribution:")
    for status, match_list in filtered.items():
        if match_list:
            print(f"  {status}: {len(match_list)}")

    return filtered

def create_detailed_match_files(matches: List[Dict[str, Any]], target_date: date, output_dir: str) -> int:
    """Create detailed match files for finished matches with URLs."""
    if not matches:
        print("ℹ️  No matches to process for detailed files")
        return 0

    # Find finished matches with URLs
    finished_with_urls = [
        match for match in matches
        if match.get('status', '').lower() == 'finished' and match.get('match_url')
    ]

    if not finished_with_urls:
        print("ℹ️  No finished matches with URLs found for detailed scraping")
        return 0

    print(f"🔍 Found {len(finished_with_urls)} finished matches with URLs for detailed processing...")

    # Create matches directory
    date_dir = get_date_directory(target_date, output_dir)
    matches_dir = os.path.join(date_dir, 'matches')
    os.makedirs(matches_dir, exist_ok=True)

    # Show examples but don't create files yet (that would be the detailed scraper's job)
    print("🏆 Finished matches ready for detailed scraping:")
    for i, match in enumerate(finished_with_urls[:5]):
        print(f"  {i+1}. {match['home_team']} {match.get('score', 'N/A')} {match['away_team']} - {match['league']}")
        print(f"     URL: {match.get('match_url', 'No URL')[:80]}...")

    return len(finished_with_urls)

def run_daily_scraping(development_mode: bool = True, target_date: Optional[date] = None, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Run the complete daily scraping workflow."""
    start_time = datetime.now()
    target_date = target_date or date.today()
    output_dir = output_dir or os.path.join(parent_dir, 'data')

    print(f"🚀 Starting daily FlashScore scraping for {target_date}")
    print(f"📍 Mode: {'Development' if development_mode else 'Production'}")
    print(f"📁 Output: {output_dir}")
    print("=" * 60)

    # Step 1: Get all matches (currently only development mode)
    if development_mode:
        all_matches = load_saved_matches()
    else:
        print("❌ Production mode not yet implemented. Use --dev flag.")
        return {'success': False, 'error': 'Production mode not implemented'}

    if not all_matches:
        print("❌ No matches found")
        return {'success': False, 'error': 'No matches found'}

    # Step 2: Filter matches by status
    filtered_matches = filter_matches_by_status(all_matches)

    # Step 3: Save ALL matches to single daily file
    daily_file = save_all_matches_to_single_file(all_matches, target_date, output_dir)

    # Step 4: Prepare matches directory and show finished matches
    detailed_ready_count = create_detailed_match_files(all_matches, target_date, output_dir)

    # Calculate processing time
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds()

    # Generate summary
    summary = {
        'success': True,
        'date': target_date.isoformat(),
        'mode': 'development' if development_mode else 'production',
        'stats': {
            'total_matches': len(all_matches),
            'scheduled_matches': len(filtered_matches['scheduled']),
            'finished_matches': len(filtered_matches['finished']),
            'live_matches': len(filtered_matches['live']),
            'other_matches': len(filtered_matches['other']),
            'processing_time': processing_time
        },
        'files': {
            'all_matches': daily_file,
            'detailed_ready_count': detailed_ready_count
        },
        'timestamp': end_time.isoformat()
    }

    # Print summary
    print("\\n" + "=" * 60)
    print("📊 Daily Scraping Summary")
    print("=" * 60)
    print(f"✅ Total matches: {len(all_matches)}")
    print(f"🕐 Scheduled matches: {len(filtered_matches['scheduled'])}")
    print(f"🏆 Finished matches: {len(filtered_matches['finished'])}")
    print(f"🔴 Live matches: {len(filtered_matches['live'])}")
    print(f"❓ Other matches: {len(filtered_matches['other'])}")
    print(f"⏱️  Processing time: {processing_time:.2f} seconds")
    print(f"📁 Output directory: {output_dir}")

    return summary

def main():
    """Main function with command line argument parsing."""
    parser = argparse.ArgumentParser(description='Simple Production FlashScore Daily Scraper')
    parser.add_argument('--dev', action='store_true', help='Run in development mode (use saved HTML)', default=True)
    parser.add_argument('--date', type=str, help='Target date (YYYY-MM-DD format, defaults to today)')
    parser.add_argument('--output', type=str, help='Output directory (defaults to ../data)')

    args = parser.parse_args()

    # Parse target date
    target_date = date.today()
    if args.date:
        try:
            target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
        except ValueError:
            print(f"❌ Invalid date format: {args.date}. Use YYYY-MM-DD format.")
            return

    # Run scraping
    try:
        result = run_daily_scraping(
            development_mode=args.dev,
            target_date=target_date,
            output_dir=args.output
        )

        if result['success']:
            print("\\n🎯 Daily scraping completed successfully!")
        else:
            print(f"\\n❌ Daily scraping failed: {result.get('error', 'Unknown error')}")

    except KeyboardInterrupt:
        print("\\n⚠️  Scraping interrupted by user")
    except Exception as e:
        print(f"\\n❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
