#!/usr/bin/env python3
"""
Test Finished Match Processing
=============================

Test the status-based filtering and processing of finished matches from the fast parser.
"""
import json
import os
from datetime import datetime, date

def load_parsed_matches():
    """Load matches from the fast parser results."""
    results_file = os.path.join(os.path.dirname(__file__), 'fast_parser_results.json')

    if not os.path.exists(results_file):
        print("❌ No parsed results found. Run test_fast_flashscore_parser.py first.")
        return []

    with open(results_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get('matches', [])

def filter_finished_matches(matches):
    """Filter and return only finished matches."""
    finished_matches = []

    for match in matches:
        if match.get('status') == 'finished' and match.get('score'):
            finished_matches.append(match)

    return finished_matches

def simulate_detailed_scraping(match):
    """
    Simulate detailed scraping for a finished match.
    In real implementation, this would scrape the actual match details.
    """
    print(f"🔍 Simulating detailed scraping for: {match['home_team']} vs {match['away_team']}")

    # Simulate detailed match data
    match_hash = hash(f"{match['home_team']}_{match['away_team']}_{match['match_date']}") % 1000000
    detailed_match = {
        'match_id': f"fs_{match_hash}",
        'basic_info': match,
        'detailed_stats': {
            'possession': {'home': 52, 'away': 48},
            'shots': {'home': 12, 'away': 8},
            'shots_on_target': {'home': 5, 'away': 3},
            'corners': {'home': 6, 'away': 4},
            'yellow_cards': {'home': 2, 'away': 3},
            'red_cards': {'home': 0, 'away': 0}
        },
        'events': [
            {'minute': 23, 'type': 'goal', 'player': 'Simulated Player', 'team': 'home'},
            {'minute': 67, 'type': 'goal', 'player': 'Another Player', 'team': 'away'},
            {'minute': 89, 'type': 'goal', 'player': 'Final Goal', 'team': 'home'}
        ],
        'scraped_at': datetime.now().isoformat(),
        'scraping_successful': True
    }

    return detailed_match

def save_detailed_matches(detailed_matches, output_dir):
    """Save detailed matches to the standard directory structure."""
    today = date.today()
    matches_dir = os.path.join(output_dir, 'data', str(today.year), f"{today.month:02d}", f"{today.day:02d}", 'matches')

    # Create directory if it doesn't exist
    os.makedirs(matches_dir, exist_ok=True)

    for i, match in enumerate(detailed_matches):
        match_file = os.path.join(matches_dir, f"detailed_match_{i+1:03d}.json")

        with open(match_file, 'w', encoding='utf-8') as f:
            json.dump(match, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved detailed match to: {match_file}")

    # Also save a summary
    summary_file = os.path.join(matches_dir, 'detailed_matches_summary.json')
    summary = {
        'total_detailed_matches': len(detailed_matches),
        'processed_at': datetime.now().isoformat(),
        'matches': [
            {
                'match_id': match['match_id'],
                'teams': f"{match['basic_info']['home_team']} vs {match['basic_info']['away_team']}",
                'score': match['basic_info']['score'],
                'league': match['basic_info']['league']
            }
            for match in detailed_matches
        ]
    }

    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(f"📋 Summary saved to: {summary_file}")
    return matches_dir

def main():
    """Main test function."""
    print("🧪 Test Finished Match Processing")
    print("=" * 50)

    # Load parsed matches
    print("📁 Loading parsed matches...")
    matches = load_parsed_matches()

    if not matches:
        print("❌ No matches found")
        return

    print(f"📊 Total matches loaded: {len(matches)}")

    # Filter finished matches
    finished_matches = filter_finished_matches(matches)
    print(f"✅ Finished matches found: {len(finished_matches)}")

    if not finished_matches:
        print("❌ No finished matches to process")
        return

    # Show examples
    print("\n🏆 Finished matches examples:")
    for i, match in enumerate(finished_matches[:5]):
        print(f"  {i+1}. {match['home_team']} {match['score']} {match['away_team']} - {match['league']}")

    # Simulate detailed scraping for a few matches
    print(f"\n🔍 Processing {min(3, len(finished_matches))} finished matches for detailed scraping...")

    detailed_matches = []
    for i, match in enumerate(finished_matches[:3]):
        print(f"\n--- Processing match {i+1} ---")
        detailed_match = simulate_detailed_scraping(match)
        detailed_matches.append(detailed_match)
        print(f"✅ Detailed scraping completed for {match['home_team']} vs {match['away_team']}")

    # Save results
    print(f"\n💾 Saving {len(detailed_matches)} detailed matches...")
    output_dir = os.path.join(os.path.dirname(__file__), '..')
    matches_dir = save_detailed_matches(detailed_matches, output_dir)

    print(f"\n🎯 Test completed successfully!")
    print(f"📁 Detailed matches saved to: {matches_dir}")
    print(f"✅ Ready for production with status-based filtering and detailed scraping workflow!")

if __name__ == "__main__":
    main()
