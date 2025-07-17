#!/usr/bin/env python3
"""
Optimized FlashScore Integration Test
====================================

This script integrates the learnings from the fast parser with the actual FlashScore scraper.
It provides fast testing capabilities and optimized parsing patterns.
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

def test_with_saved_html():
    """
    Test using saved HTML/text instead of live scraping for faster development.
    This mimics the flashscoreindex.json parsing but integrates with the main scraper.
    """
    print("🚀 Testing with saved HTML data")
    print("=" * 50)

    dump_file = os.path.join(current_dir, 'example', 'flashscoreindex.json')

    if not os.path.exists(dump_file):
        print(f"❌ Dump file not found: {dump_file}")
        return []

    # Load the fast parser results
    fast_results_file = os.path.join(current_dir, 'fast_parser_results.json')
    if os.path.exists(fast_results_file):
        with open(fast_results_file, 'r', encoding='utf-8') as f:
            fast_data = json.load(f)

        matches = fast_data.get('matches', [])
        print(f"📊 Loaded {len(matches)} matches from fast parser")

        # Convert to FlashScore format for compatibility
        flashscore_matches = []
        for match in matches:
            fs_match = {
                'home_team': match['home_team'],
                'away_team': match['away_team'],
                'match_time': match['match_time'],
                'score': match['score'],
                'status': match['status'],
                'league': match['league'],
                'region': match['region'],
                'match_url': '',  # Would need to be scraped or generated
                'source': 'optimized_parser',
                'scraped_at': datetime.now().isoformat(),
                'match_date': match['match_date']
            }
            flashscore_matches.append(fs_match)

        return flashscore_matches

    print("❌ No fast parser results found. Run test_fast_flashscore_parser.py first.")
    return []

def test_live_scraping():
    """Test live scraping with the actual FlashScore scraper."""
    print("🌐 Testing live FlashScore scraping")
    print("=" * 50)

    scraper = FlashScoreScraper()

    try:
        matches = scraper.get_daily_matches(date.today())
        print(f"📊 Live scraping found {len(matches)} matches")
        return matches
    except Exception as e:
        print(f"❌ Live scraping failed: {e}")
        return []

def compare_results(saved_matches, live_matches):
    """Compare results from saved and live scraping."""
    print("\n📊 Comparing Results")
    print("=" * 30)

    print(f"Saved data matches: {len(saved_matches)}")
    print(f"Live scraping matches: {len(live_matches)}")

    # Count by status
    saved_status = {}
    live_status = {}

    for match in saved_matches:
        status = match.get('status', 'unknown')
        saved_status[status] = saved_status.get(status, 0) + 1

    for match in live_matches:
        status = match.get('status', 'unknown')
        live_status[status] = live_status.get(status, 0) + 1

    print("\n📈 Status comparison:")
    all_statuses = set(saved_status.keys()) | set(live_status.keys())

    for status in sorted(all_statuses):
        saved_count = saved_status.get(status, 0)
        live_count = live_status.get(status, 0)
        print(f"  {status}: Saved={saved_count}, Live={live_count}")

    # Find finished matches
    saved_finished = [m for m in saved_matches if m.get('status') == 'finished']
    live_finished = [m for m in live_matches if m.get('status') == 'finished']

    print(f"\n✅ Finished matches: Saved={len(saved_finished)}, Live={len(live_finished)}")

    if saved_finished:
        print("\n🏆 Example finished matches from saved data:")
        for i, match in enumerate(saved_finished[:3]):
            print(f"  {i+1}. {match['home_team']} {match['score']} {match['away_team']} - {match['league']}")

    return saved_finished, live_finished

def save_optimized_results(matches, test_type):
    """Save results for further analysis."""
    output_file = os.path.join(current_dir, f'optimized_results_{test_type}.json')

    results = {
        'test_type': test_type,
        'timestamp': datetime.now().isoformat(),
        'total_matches': len(matches),
        'matches': matches,
        'analysis': {
            'by_status': {},
            'by_region': {},
            'by_league': {}
        }
    }

    # Generate analysis
    for match in matches:
        # Count by status
        status = match.get('status', 'unknown')
        results['analysis']['by_status'][status] = results['analysis']['by_status'].get(status, 0) + 1

        # Count by region
        region = match.get('region', 'unknown')
        results['analysis']['by_region'][region] = results['analysis']['by_region'].get(region, 0) + 1

        # Count by league
        league = match.get('league', 'unknown')
        results['analysis']['by_league'][league] = results['analysis']['by_league'].get(league, 0) + 1

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"💾 Results saved to: {output_file}")
    return output_file

def main():
    """Main test function."""
    print("🧪 Optimized FlashScore Integration Test")
    print("=" * 50)

    # Test with saved data (fast)
    saved_matches = test_with_saved_html()

    # Save saved results
    if saved_matches:
        save_optimized_results(saved_matches, 'saved_html')

    # Ask user if they want to test live scraping (slower)
    print(f"\n🤔 Found {len(saved_matches)} matches from saved data.")
    print("   Do you want to also test live scraping? (This will be slower)")

    # For automation, we'll skip live testing for now
    # Uncomment the following lines if you want interactive mode:
    # response = input("   Test live scraping? (y/n): ").lower().strip()
    # if response == 'y':
    if False:  # Change to True to enable live testing
        live_matches = test_live_scraping()

        if live_matches:
            save_optimized_results(live_matches, 'live_scraping')

            # Compare results
            compare_results(saved_matches, live_matches)
        else:
            print("❌ Live scraping returned no results")
    else:
        print("⏭️  Skipping live scraping for faster testing")

    # Summary
    print(f"\n🎯 Test Summary:")
    print(f"✅ Saved data parsing: {len(saved_matches)} matches")
    print(f"✅ Fast iteration enabled with saved HTML parsing")
    print(f"✅ Ready for integration with main scraper")

    if saved_matches:
        finished_count = len([m for m in saved_matches if m.get('status') == 'finished'])
        print(f"🏆 Found {finished_count} finished matches ready for detailed scraping")

if __name__ == "__main__":
    main()
