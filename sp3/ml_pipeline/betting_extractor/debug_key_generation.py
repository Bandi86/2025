#!/usr/bin/env python3
"""
Debug script: kulcs generálás tesztelése
"""
import sys
sys.path.append('.')
from extract_matches import parse_line, normalize_team

def test_key_generation():
    """Kulcs generálás tesztelése problémás sorokon"""
    test_lines = [
        "02:028: K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93",
        "03:013: K 21:00 21898 Real Madrid - Juventus 1. félidő - Kétesély (H: 1X, D: 12, V: X2) 1,14 1,43 1,55",
        "03:044: K 21:00 22042 Real Madrid - Juventus 2. félidő - Kétesély (H: 1X, D: 12, V: X2) 1,14 1,30 1,52"
    ]

    import re

    for i, line in enumerate(test_lines):
        print(f"\n🔍 Teszt #{i+1}:")
        print(f"Input: {line}")

        # Sorszám eltávolítás
        cleaned = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)
        print(f"Tisztított: {cleaned}")

        result = parse_line(cleaned)
        if result:
            day, time, team1, team2, market_name, odds, orig_market = result
            print(f"✅ Parsing sikeres:")
            print(f"   team1: '{team1}' -> normalized: '{normalize_team(team1)}'")
            print(f"   team2: '{team2}' -> normalized: '{normalize_team(team2)}'")
            print(f"   market_name: '{market_name}'")

            # Kulcs generálás
            key = ("2025-07-01", time, "Klubcsapat vb ", normalize_team(team1), normalize_team(team2))
            print(f"   key: {key}")
        else:
            print("❌ Parsing sikertelen!")

if __name__ == "__main__":
    test_key_generation()
