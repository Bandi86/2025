#!/usr/bin/env python3
"""
Debug script: részletes parsing és kulcsgenerálás vizsgálat
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extract_matches import parse_line, normalize_team, iso_date, get_hun_day
import re

def debug_problematic_lines():
    """Problémás sorok részletes vizsgálata"""
    test_lines = [
        # Real Madrid vs Juventus esetek
        "K 21:00 21859 Real Madrid - Juventus 1,28 5,25 10,50",  # Alap
        "K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93",  # Kétesély
        "K 21:00 21898 Real Madrid - Juventus Mindkét csapat szerez gólt (H: Igen, V: Nem) 1,58 2,25",  # Mindkét csapat
    ]

    current_date = "2025. július 1."
    current_league = "Klubcsapat vb "

    print("🔍 PROBLÉMÁS SOROK RÉSZLETES ELEMZÉSE")
    print("=" * 60)

    match_keys = {}

    for i, line in enumerate(test_lines):
        print(f"\n📝 Teszt #{i+1}:")
        print(f"   Input: {line}")

        # Sorszám eltávolítás (mint az extract_matches.py-ban)
        cleaned = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)
        print(f"   Tisztított: {cleaned}")

        result = parse_line(cleaned)
        if result:
            day, time, team1, team2, market_name, odds, orig_market = result
            print(f"   ✅ Parsing sikeres:")
            print(f"      team1: '{team1}' -> normalized: '{normalize_team(team1)}'")
            print(f"      team2: '{team2}' -> normalized: '{normalize_team(team2)}'")
            print(f"      market_name: '{market_name}'")
            print(f"      odds: {odds}")

            # Kulcs generálás (mint az extract_matches.py-ban)
            key = (iso_date(current_date), time, current_league, normalize_team(team1), normalize_team(team2))
            print(f"      KEY: {key}")

            # Ellenőrizzük, hogy ez a kulcs már létezik-e
            if key in match_keys:
                print(f"      🔄 MEGLÉVŐ KULCS! Market hozzáadva a #{match_keys[key]} meccshez")
            else:
                match_keys[key] = i + 1
                print(f"      ✨ ÚJ KULCS! Új meccs #{i + 1} létrehozva")
        else:
            print("   ❌ Parsing sikertelen!")

    print(f"\n📊 ÖSSZESÍTÉS:")
    print(f"   Összes kulcs: {len(match_keys)}")
    print(f"   Várt kulcsok száma: 1 (minden market ugyanahhoz a meccshez tartozik)")

    if len(match_keys) == 1:
        print("   ✅ Minden rendben! Nincs duplikáció.")
    else:
        print("   ❌ PROBLÉMA! Duplikáció van.")
        for i, (key, match_num) in enumerate(match_keys.items()):
            print(f"      Kulcs #{i+1}: {key} -> Meccs #{match_num}")

if __name__ == "__main__":
    debug_problematic_lines()
