#!/usr/bin/env python3
"""
Quick Test of Fixed Patterns

Test the corrected regex patterns on a small sample to verify they work.
"""

import re
import json

def quick_pattern_test():
    """Test patterns on actual data from our advanced extractor"""

    print("🚀 QUICK PATTERN TEST")
    print("=" * 50)

    # Load some real data from the advanced extractor
    try:
        with open('data/demo_analysis/advanced_hungarian_football.json', 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Get the raw text lines that worked
        raw_lines = []
        for match in data['matches'][:20]:  # First 20 matches
            if match.get('raw_text'):
                raw_lines.append(match['raw_text'])

        print(f"📄 Testing {len(raw_lines)} raw lines from advanced extractor")

        # Test our fixed patterns
        match_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'
        special_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)\s+(Hendikep|Gólszám|Döntetlennél)\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

        main_matches = 0
        special_matches = 0

        print(f"\n🔍 TESTING PATTERNS:")
        print("-" * 30)

        for line in raw_lines:
            if not line:
                continue

            # Test main pattern
            main_match = re.search(match_pattern, line)
            if main_match:
                main_matches += 1
                print(f"✅ MAIN: {line}")
                print(f"   Teams: {main_match.group(3)} vs {main_match.group(4)}")
                print(f"   Odds: {main_match.group(5)}")
                continue

            # Test special pattern
            special_match = re.search(special_pattern, line)
            if special_match:
                special_matches += 1
                print(f"✅ SPECIAL: {line}")
                print(f"   Teams: {special_match.group(3)} vs {special_match.group(4)}")
                print(f"   Type: {special_match.group(5)}")
                continue

            print(f"❌ NO MATCH: {line}")

        print(f"\n📊 RESULTS:")
        print(f"Main pattern matches: {main_matches}")
        print(f"Special pattern matches: {special_matches}")
        print(f"Total matches: {main_matches + special_matches}")
        print(f"Total lines tested: {len(raw_lines)}")

    except Exception as e:
        print(f"❌ Error: {e}")

        # Fallback: test with known good lines
        print(f"\n🔄 FALLBACK: Testing with known good lines")
        test_lines = [
            "P 12:30 05336 Daejeon Citizen vs Jeju 2,04 3,30 3,15",
            "P 15:30 11151 Lengyelország vs Ukrajna 1,11 5,75 13,50",
            "P 15:30 11190 Lengyelország vs Ukrajna Hendikep 0:1 1,41 4,20 5,00",
            "P 19:00 11362 Szerbia vs Izland 3,80 3,40 1,69"
        ]

        match_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

        for line in test_lines:
            match = re.search(match_pattern, line)
            if match:
                print(f"✅ {line}")
                print(f"   Time: {match.group(1)}, ID: {match.group(2)}")
                print(f"   Teams: {match.group(3)} vs {match.group(4)}")
                print(f"   Odds: {match.group(5)}")
            else:
                print(f"❌ {line}")

if __name__ == "__main__":
    quick_pattern_test()
