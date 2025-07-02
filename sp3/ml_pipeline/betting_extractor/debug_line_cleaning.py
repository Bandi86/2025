#!/usr/bin/env python3
"""
Debug script: sorszám eltávolítás tesztelése
"""
import re

def test_line_cleaning():
    """Sorszám eltávolítás tesztelése"""
    test_lines = [
        "02:028: K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93",
        "02:030: K 21:00 21864 Real Madrid - Juventus Mindkét csapat szerez gólt (H: Igen, V: Nem) 1,69 1,92"
    ]

    for i, line in enumerate(test_lines):
        print(f"\n🔍 Teszt #{i+1}:")
        print(f"Eredeti: {line}")

        cleaned = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)
        print(f"Tisztított: {cleaned}")

        # Parsing teszt
        sys.path.append('.')
        from extract_matches import parse_line

        result = parse_line(cleaned)
        if result:
            day, time, team1, team2, market_name, odds, orig_market = result
            print(f"✅ Parsing sikeres:")
            print(f"   team2: '{team2}'")
            print(f"   market_name: '{market_name}'")
        else:
            print("❌ Parsing sikertelen!")

if __name__ == "__main__":
    import sys
    test_line_cleaning()
