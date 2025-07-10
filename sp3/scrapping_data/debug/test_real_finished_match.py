#!/usr/bin/env python3
"""
Test scraping with a real finished match from FlashScore.
This is a focused test that:
1. Uses a manually provided finished match URL
2. Tests detailed match data extraction
3. Verifies the output structure
"""

import json
import sys
from pathlib import Path

# Add scripts directory to path for imports
scripts_dir = Path(__file__).parent.parent / "scripts"
sys.path.append(str(scripts_dir))

from sources.flashscore import FlashScoreScraper

def test_real_finished_match():
    """Test scraping with a real finished match URL."""
    
    # TODO: Replace this with a real finished match URL from FlashScore
    # Example format: https://www.flashscore.com/match/[match_id]/#/match-summary/match-summary
    finished_match_url = "https://www.flashscore.com/match/YOUR_MATCH_ID_HERE/#/match-summary/match-summary"
    
    if "YOUR_MATCH_ID_HERE" in finished_match_url:
        print("❌ Please replace the URL with a real finished match from FlashScore!")
        print("Steps to get a real URL:")
        print("1. Go to https://www.flashscore.com")
        print("2. Navigate to a finished match (look for matches with final scores)")
        print("3. Copy the full URL and replace it in this script")
        return False
    
    print(f"🧪 Testing finished match: {finished_match_url}")
    
    scraper = FlashScoreScraper(headless=False, use_selenium=True)  # Visual mode for debugging
    
    try:
        # Check available methods
        print("📋 Available scraper methods:")
        methods = [method for method in dir(scraper) if not method.startswith('_') and callable(getattr(scraper, method))]
        for method in methods:
            print(f"   - {method}")
        
        # Use get_match_details method
        match_data = scraper.get_match_details(finished_match_url)
        
        if not match_data:
            print("❌ No match data extracted")
            return False
        
        print("✅ Match data extracted successfully!")
        print(f"📊 Match info:")
        print(f"   Keys available: {list(match_data.keys())}")
        
        # Display basic info if available
        if 'home_team' in match_data and 'away_team' in match_data:
            print(f"   Teams: {match_data.get('home_team')} vs {match_data.get('away_team')}")
        if 'score' in match_data:
            print(f"   Score: {match_data.get('score')}")
        if 'status' in match_data:
            print(f"   Status: {match_data.get('status')}")
        if 'match_time' in match_data:
            print(f"   Time: {match_data.get('match_time')}")
        
        # Check for detailed data
        detailed_keys = ['odds', 'statistics', 'lineups', 'events', 'betting_odds', 'match_stats']
        for key in detailed_keys:
            if key in match_data and match_data[key]:
                print(f"   ✅ {key.title()}: Available")
            else:
                print(f"   ❌ {key.title()}: Not available")
        
        # Save the result
        output_file = Path(__file__).parent / "real_match_test_result.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(match_data, f, indent=2, ensure_ascii=False)
        
        print(f"📁 Result saved to: {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        if hasattr(scraper, 'cleanup'):
            scraper.cleanup()
        else:
            print("ℹ️  No cleanup method found")

if __name__ == "__main__":
    success = test_real_finished_match()
    if success:
        print("✅ Test completed successfully!")
    else:
        print("❌ Test failed!")
        sys.exit(1)
