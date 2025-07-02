#!/usr/bin/env python3
"""
Debug script: tesztelés konkrét sorokon
"""
import sys
sys.path.append('.')
from extract_matches import parse_line

def test_problematic_lines():
    """Problémás sorok tesztelése"""
    test_lines = [
        "K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93",
        "K 21:00 21864 Real Madrid - Juventus Mindkét csapat szerez gólt (H: Igen, V: Nem) 1,69 1,92",
        "P 15:30 11152 Lengyelország - Ukrajna Kétesély (H: 1X, D: 12, V: X2) 1,02 1,04 2,80",
        "P 15:30 11154 Lengyelország - Ukrajna Mindkét csapat szerez gólt (H: Igen, V: Nem) 2,24 1,51"
    ]

    for i, line in enumerate(test_lines):
        print(f"\n🔍 Teszt #{i+1}:")
        print(f"Input: {line}")

        result = parse_line(line)
        if result:
            day, time, team1, team2, market_name, odds, orig_market = result
            print(f"✅ Parsing sikeres:")
            print(f"   team1: '{team1}'")
            print(f"   team2: '{team2}'")
            print(f"   market_name: '{market_name}'")
            print(f"   odds: {odds}")
            print(f"   orig_market: '{orig_market}'")
        else:
            print("❌ Parsing sikertelen!")

if __name__ == "__main__":
    test_problematic_lines()
