#!/usr/bin/env python3
"""
Debug script: konkrét sor parsing
"""
import sys
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extract_matches import parse_line, normalize_team
import re

def debug_specific_line():
    """Konkrét problémás sor debug"""
    line = "02:028: K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93"

    print("🔍 KONKRÉT SOR DEBUG")
    print("=" * 50)
    print(f"📝 Eredeti sor: {line}")

    # Sorszám eltávolítás
    cleaned = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)
    print(f"📝 Tisztított: {cleaned}")

    # Parse-olás
    result = parse_line(cleaned)
    if result:
        day, time, team1, team2, market_name, odds, orig_market = result
        print(f"✅ Parsing eredmény:")
        print(f"   day: '{day}'")
        print(f"   time: '{time}'")
        print(f"   team1: '{team1}' -> normalized: '{normalize_team(team1)}'")
        print(f"   team2: '{team2}' -> normalized: '{normalize_team(team2)}'")
        print(f"   market_name: '{market_name}'")
        print(f"   odds: {odds}")
        print(f"   orig_market: '{orig_market}'")

        # Kulcs
        key = ("2025-07-01", time, "Klubcsapat vb ", normalize_team(team1), normalize_team(team2))
        print(f"   KEY: {key}")

        print(f"\n🤔 PROBLÉMA ELEMZÉS:")
        print(f"   - A team2 '{team2}' NEM 'juventus'!")
        print(f"   - Ez magyarázza a duplikációt!")
        print(f"   - A market parsing nem megfelelő!")

    else:
        print("❌ Parsing sikertelen!")

if __name__ == "__main__":
    debug_specific_line()
