#!/usr/bin/env python3
"""
Quick integration test for the enhanced FootballExtractor
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from converter.football_extractor import FootballExtractor

def test_enhanced_features():
    """Test the enhanced features of FootballExtractor"""
    extractor = FootballExtractor()
    
    # Test sample data with various market types and OCR errors
    sample_json = {
        'content': {
            'full_text': """Labdarúgás Premier League
2025. augusztus 5.
K 20:00 65110 Real Madrid - Barcelona 2,50 3,20 2,80
K 20:00 65111 Real Madrid Kétesély - Barcelona 1,50 2,80
K 20:00 65112 Real Madrid Hendikep +1.5 - Barcelona 2,20 1,65
K 20:00 65113 Real Madrid Gólszám Over 2.5 - Barcelona 1,80 2,00
Sze 19:30 65120 Kongói Közársság - Hunik Krkkó 1,85 3,40 4,20
Sze 19:30 65121 Kongói Közársság Mindkét csapat gólzik - Hunik Krkkó Igen Nem
P 21:00 65130 AIK Sockholm - Brbrnd 2,10 3,10 3,50"""
        }
    }
    
    print("Testing enhanced FootballExtractor...")
    matches = extractor.extract_football_data(sample_json)
    
    print(f"\nExtracted {len(matches)} matches:")
    for i, match in enumerate(matches, 1):
        print(f"{i}. {match['time']} | {match['home_team']} - {match['away_team']}")
        print(f"   Odds: {match['home_odds']} | {match['draw_odds']} | {match['away_odds']}")
        
        # Test market classification
        is_main = extractor._is_main_1x2_market(match)
        market_type = extractor._classify_market_type(match['raw_line'], match['home_team'], match['away_team'])
        print(f"   Market Type: {market_type}, Is Main: {is_main}")
        print()
    
    # Test extraction stats
    stats = extractor.get_extraction_stats()
    print("Extraction Statistics:")
    print(f"- Football patterns: {stats['patterns_used']['football_patterns']}")
    print(f"- Market type patterns: {stats['patterns_used']['market_type_patterns']}")
    print(f"- Supported market types: {', '.join(stats['supported_market_types'])}")
    
    # Test OCR fixes
    print("\nTesting OCR fixes:")
    ocr_test_cases = [
        "Kongói Közársság",
        "Hunik Krkkó", 
        "AIK Sockholm",
        "Brbrnd",
        "Normal Team Name"
    ]
    
    for team_name in ocr_test_cases:
        fixed_name = extractor._fix_team_name(team_name)
        if fixed_name != team_name:
            print(f"- Fixed: '{team_name}' -> '{fixed_name}'")
        else:
            print(f"- No fix needed: '{team_name}'")
    
    print("\nEnhanced FootballExtractor test completed successfully!")

if __name__ == "__main__":
    test_enhanced_features()