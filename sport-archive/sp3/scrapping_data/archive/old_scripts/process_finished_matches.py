#!/usr/bin/env python3
"""
Process finished matches from saved JSON files and extract detailed data.

This script takes finished matches from the saved finished_matches.json files
and attempts to extract detailed match information for each match.
"""

import json
import os
import sys
from datetime import datetime, date
from typing import List, Dict, Any, Optional

# Add the parent directory to the Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.json_handler import JSONHandler

# Note: FlashScoreParser import removed since we're not using live scraping


def load_finished_matches(date_str: Optional[str] = None) -> Optional[List[Dict[str, Any]]]:
    """Load finished matches from the data directory."""
    if date_str is None:
        # Use today's date as default
        target_date = date.today()
    else:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            print(f"❌ Invalid date format: {date_str}. Use YYYY-MM-DD format.")
            return None
    
    # Construct path to finished matches file
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    day = target_date.strftime("%d")
    
    finished_matches_file = os.path.join(data_dir, year, month, day, 'finished_matches.json')
    
    if not os.path.exists(finished_matches_file):
        print(f"❌ No finished matches file found at: {finished_matches_file}")
        return None
    
    try:
        with open(finished_matches_file, 'r', encoding='utf-8') as f:
            matches = json.load(f)
        
        print(f"✅ Loaded {len(matches)} finished matches from {finished_matches_file}")
        return matches
    
    except Exception as e:
        print(f"❌ Error loading finished matches: {e}")
        return None


def analyze_finished_matches(matches: List[Dict[str, Any]]) -> None:
    """Analyze the structure and content of finished matches."""
    if not matches:
        print("❌ No matches to analyze")
        return
    
    print("\n" + "="*50)
    print("📊 FINISHED MATCHES ANALYSIS")
    print("="*50)
    
    # Sample match structure
    first_match = matches[0]
    print(f"\n🔍 Sample match structure:")
    for key, value in first_match.items():
        print(f"  {key}: {value}")
    
    # Statistics
    print(f"\n📈 Statistics:")
    print(f"  Total matches: {len(matches)}")
    
    # Group by league
    leagues = {}
    regions = {}
    has_urls = 0
    
    for match in matches:
        league = match.get('league', 'Unknown')
        region = match.get('region', 'Unknown')
        
        leagues[league] = leagues.get(league, 0) + 1
        regions[region] = regions.get(region, 0) + 1
        
        if match.get('match_url'):
            has_urls += 1
    
    print(f"  Matches with URLs: {has_urls}")
    print(f"  Unique leagues: {len(leagues)}")
    print(f"  Unique regions: {len(regions)}")
    
    # Top leagues
    print(f"\n🏆 Top 5 leagues:")
    top_leagues = sorted(leagues.items(), key=lambda x: x[1], reverse=True)[:5]
    for league, count in top_leagues:
        print(f"  {league}: {count} matches")
    
    # Top regions
    print(f"\n🌍 Regions:")
    top_regions = sorted(regions.items(), key=lambda x: x[1], reverse=True)
    for region, count in top_regions:
        print(f"  {region}: {count} matches")


def process_detailed_scraping(matches: List[Dict[str, Any]], limit: int = 3) -> List[Dict[str, Any]]:
    """
    Process finished matches for detailed scraping.
    
    Since most matches don't have match_url, we'll demonstrate the process
    with mock detailed data for now.
    """
    print(f"\n" + "="*50)
    print(f"🔍 DETAILED SCRAPING PROCESS (LIMITED TO {limit} MATCHES)")
    print("="*50)
    
    if not matches:
        print("❌ No matches to process")
        return []
    
    detailed_matches = []
    
    # Note: We're processing finished matches from saved data, not live scraping
    
    for i, match in enumerate(matches[:limit]):
        print(f"\n--- Processing match {i+1}/{min(limit, len(matches))} ---")
        print(f"🏆 {match['home_team']} vs {match['away_team']}")
        print(f"📊 Score: {match.get('score', 'N/A')}")
        print(f"🏟️  League: {match.get('league', 'N/A')}")
        print(f"🌍 Region: {match.get('region', 'N/A')}")
        
        # Check if match has URL
        match_url = match.get('match_url')
        if match_url:
            print(f"🔗 URL: {match_url}")
            
            # In a real scenario, we would scrape detailed data here
            # For demonstration, we'll create mock detailed data
            detailed_match = create_mock_detailed_match(match)
            detailed_matches.append(detailed_match)
            print("✅ Detailed data created (mock)")
            
        else:
            print("⚠️  No match URL available - cannot scrape detailed data")
            
            # Even without URL, we can create enhanced match data
            enhanced_match = enhance_basic_match(match)
            detailed_matches.append(enhanced_match)
            print("✅ Enhanced basic match data")
    
    return detailed_matches


def create_mock_detailed_match(basic_match: Dict[str, Any]) -> Dict[str, Any]:
    """Create mock detailed match data to demonstrate the structure."""
    detailed_match = basic_match.copy()
    
    # Add detailed match information
    detailed_match.update({
        'detailed_scraping': {
            'scraped_at': datetime.now().isoformat(),
            'method': 'mock_detailed_scraper',
            'success': True
        },
        'match_details': {
            'venue': f"Stadium of {basic_match['home_team']}",
            'attendance': "15,000",
            'referee': "John Doe",
            'weather': "Clear, 20°C"
        },
        'statistics': {
            'home_possession': "55%",
            'away_possession': "45%",
            'home_shots': 12,
            'away_shots': 8,
            'home_shots_on_target': 6,
            'away_shots_on_target': 3,
            'home_corners': 5,
            'away_corners': 3,
            'home_fouls': 11,
            'away_fouls': 14,
            'home_yellow_cards': 2,
            'away_yellow_cards': 1,
            'home_red_cards': 0,
            'away_red_cards': 0
        },
        'events': [
            {
                'time': '23\'',
                'type': 'goal',
                'team': 'home',
                'player': 'Player A',
                'description': f'Goal by Player A for {basic_match["home_team"]}'
            },
            {
                'time': '67\'',
                'type': 'goal',
                'team': 'away',
                'player': 'Player B',
                'description': f'Goal by Player B for {basic_match["away_team"]}'
            }
        ],
        'lineups': {
            'home': {
                'formation': '4-4-2',
                'starting_xi': [f'Player {i}' for i in range(1, 12)],
                'substitutes': [f'Sub {i}' for i in range(1, 8)]
            },
            'away': {
                'formation': '4-3-3',
                'starting_xi': [f'Away Player {i}' for i in range(1, 12)],
                'substitutes': [f'Away Sub {i}' for i in range(1, 8)]
            }
        }
    })
    
    return detailed_match


def enhance_basic_match(basic_match: Dict[str, Any]) -> Dict[str, Any]:
    """Enhance basic match data with additional computed information."""
    enhanced_match = basic_match.copy()
    
    # Add enhancement metadata
    enhanced_match.update({
        'enhancement': {
            'enhanced_at': datetime.now().isoformat(),
            'method': 'basic_enhancement',
            'enhanced_fields': ['computed_metrics', 'normalized_data']
        },
        'computed_metrics': {
            'goals_scored': {
                'home': int(basic_match.get('score', '0-0').split('-')[0]) if basic_match.get('score') else 0,
                'away': int(basic_match.get('score', '0-0').split('-')[1]) if basic_match.get('score') else 0
            },
            'result_type': get_match_result_type(basic_match.get('score', '0-0')),
            'scoring_match': int(basic_match.get('score', '0-0').split('-')[0]) + int(basic_match.get('score', '0-0').split('-')[1]) > 0 if basic_match.get('score') else False
        },
        'normalized_data': {
            'home_team_normalized': basic_match['home_team'].strip().title(),
            'away_team_normalized': basic_match['away_team'].strip().title(),
            'league_normalized': basic_match.get('league', '').strip().title()
        }
    })
    
    return enhanced_match


def get_match_result_type(score: str) -> str:
    """Determine match result type from score."""
    try:
        home_goals, away_goals = map(int, score.split('-'))
        if home_goals > away_goals:
            return 'home_win'
        elif away_goals > home_goals:
            return 'away_win'
        else:
            return 'draw'
    except:
        return 'unknown'


def save_detailed_matches(detailed_matches: List[Dict[str, Any]], date_str: Optional[str] = None) -> str:
    """Save detailed matches to output directory."""
    if date_str is None:
        target_date = date.today()
    else:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    # Create output directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    year = target_date.strftime("%Y")
    month = target_date.strftime("%m")
    day = target_date.strftime("%d")
    
    output_dir = os.path.join(data_dir, year, month, day, 'matches')
    os.makedirs(output_dir, exist_ok=True)
    
    # Save detailed matches
    detailed_file = os.path.join(output_dir, 'detailed_finished_matches.json')
    
    try:
        with open(detailed_file, 'w', encoding='utf-8') as f:
            json.dump(detailed_matches, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Saved {len(detailed_matches)} detailed matches to: {detailed_file}")
        return detailed_file
    
    except Exception as e:
        print(f"❌ Error saving detailed matches: {e}")
        return ""


def main():
    """Main function to process finished matches."""
    print("🚀 Processing Finished Matches for Detailed Extraction")
    print("="*60)
    
    # Default to today's date, but you can specify a date
    # Example: python process_finished_matches.py 2025-07-10
    if len(sys.argv) > 1:
        date_str = sys.argv[1]
    else:
        date_str = "2025-07-10"  # Use the date we know has data
    
    print(f"📅 Target date: {date_str}")
    
    # Step 1: Load finished matches
    finished_matches = load_finished_matches(date_str)
    if not finished_matches:
        return
    
    # Step 2: Analyze finished matches
    analyze_finished_matches(finished_matches)
    
    # Step 3: Process detailed scraping (limited to avoid overwhelming output)
    detailed_matches = process_detailed_scraping(finished_matches, limit=3)
    
    # Step 4: Save detailed matches
    if detailed_matches:
        output_file = save_detailed_matches(detailed_matches, date_str)
        
        print(f"\n" + "="*60)
        print("📋 SUMMARY")
        print("="*60)
        print(f"✅ Loaded: {len(finished_matches)} finished matches")
        print(f"✅ Processed: {len(detailed_matches)} detailed matches")
        print(f"✅ Saved to: {output_file}")
        print(f"\n🎯 This demonstrates the workflow for processing finished matches.")
        print(f"📝 In production, the detailed scraper would fetch real data from FlashScore URLs.")
    
    else:
        print("❌ No detailed matches were processed")


if __name__ == "__main__":
    main()
