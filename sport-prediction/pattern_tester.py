#!/usr/bin/env python3
"""
Quick Pattern Tester for SzerencseMix PDF Patterns

Let's test our regex patterns against the actual data we found.
"""

import re

def test_patterns():
    """Test our patterns against known working examples"""

    # These are the actual lines we found that work:
    test_lines = [
        "P 12:30 05336 Daejeon Citizen vs Jeju 2,04 3,30 3,15",
        "P 12:30 05498 Gimcheon Sangmu vs Jeonbuk 2,78 3,30 2,25",
        "P 15:30 11151 Lengyelország vs Ukrajna 1,11 5,75 13,50",
        "P 15:30 11153 Lengyelország vs Ukrajna Döntetlennél a tét visszajár 1,02 7,75",
        "P 15:30 11190 Lengyelország vs Ukrajna Hendikep 0:1 1,41 4,20 5,00",
        "P 15:30 11193 Lengyelország vs Ukrajna Gólszám 2,5 (H: kev., V: több) 2,62 1,37",
        "P 19:00 11362 Szerbia vs Izland 3,80 3,40 1,69",
        "P 21:00 12057 Spanyolország vs Japán 1,30 4,30 6,75"
    ]

    print("🧪 TESTING REGEX PATTERNS")
    print("=" * 60)

    # Original pattern from ultra-precise extractor
    original_pattern = r'^[A-Z]\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

    # Improved pattern (more flexible)
    improved_pattern = r'^[A-Z]\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)\s+((?:\d+[.,]\d{2,3}(?:\s+|$)){2,})'

    # Even more flexible pattern
    flexible_pattern = r'^([A-Z])\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)(?:\s+((?:\d+[.,]\d{1,3}(?:\s+|$)){2,}))?'

    patterns = [
        ("Original Pattern", original_pattern),
        ("Improved Pattern", improved_pattern),
        ("Flexible Pattern", flexible_pattern)
    ]

    for pattern_name, pattern in patterns:
        print(f"\n📋 Testing: {pattern_name}")
        print(f"Pattern: {pattern}")
        print("-" * 40)

        matches_found = 0
        for line in test_lines:
            match = re.search(pattern, line)
            if match:
                matches_found += 1
                print(f"✅ MATCH: {line}")
                print(f"   Groups: {match.groups()}")
            else:
                print(f"❌ NO MATCH: {line}")

        print(f"\n📊 Result: {matches_found}/{len(test_lines)} matches")

    print(f"\n" + "=" * 60)
    print("🔍 MANUAL ANALYSIS OF PROBLEM LINES:")

    # Let's analyze what makes these lines special
    for line in test_lines:
        print(f"\nAnalyzing: {line}")

        # Basic structure analysis
        parts = line.split()
        print(f"  Parts: {parts}")

        # Find 'vs' position
        if 'vs' in parts:
            vs_idx = parts.index('vs')
            print(f"  'vs' at position: {vs_idx}")
            print(f"  Before vs: {' '.join(parts[:vs_idx])}")
            print(f"  After vs: {' '.join(parts[vs_idx+1:])}")

        # Find odds (numbers with comma/dot)
        odds_pattern = r'\d+[.,]\d{1,3}'
        odds = re.findall(odds_pattern, line)
        print(f"  Odds found: {odds}")

def create_working_pattern():
    """Create a pattern that should work based on our analysis"""

    print(f"\n🎯 CREATING WORKING PATTERN")
    print("=" * 60)

    # Based on analysis, let's create a simpler, more robust pattern
    # Structure: P TIME ID TEAM vs TEAM [optional stuff] ODDS ODDS ODDS

    working_pattern = r'^P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+vs\s+(.+?)(?:\s+(?:Hendikep|Gólszám|Döntetlennél).*?)?\s+((?:\d+[.,]\d{1,3}\s*){2,})'

    print(f"Working Pattern: {working_pattern}")

    test_lines = [
        "P 12:30 05336 Daejeon Citizen vs Jeju 2,04 3,30 3,15",
        "P 15:30 11151 Lengyelország vs Ukrajna 1,11 5,75 13,50",
        "P 15:30 11190 Lengyelország vs Ukrajna Hendikep 0:1 1,41 4,20 5,00",
        "P 19:00 11362 Szerbia vs Izland 3,80 3,40 1,69"
    ]

    print("\n🧪 Testing working pattern:")
    for line in test_lines:
        match = re.search(working_pattern, line)
        if match:
            print(f"✅ {line}")
            print(f"   Time: {match.group(1)}")
            print(f"   ID: {match.group(2)}")
            print(f"   Home: '{match.group(3)}'")
            print(f"   Away: '{match.group(4)}'")
            print(f"   Odds: '{match.group(5)}'")
        else:
            print(f"❌ {line}")

    return working_pattern

if __name__ == "__main__":
    test_patterns()
    working_pattern = create_working_pattern()

    print(f"\n💡 RECOMMENDATION:")
    print(f"Use this pattern in the ultra-precise extractor:")
    print(f"'{working_pattern}'")
