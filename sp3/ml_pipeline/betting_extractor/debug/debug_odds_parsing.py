#!/usr/bin/env python3
"""
Debug script: odds parsing részletes vizsgálat
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extract_matches import parse_line, normalize_team
import re

def debug_odds_parsing():
    """Odds parsing részletes vizsgálat"""
    line = "K 21:00 21859 Real Madrid - Juventus Kétesély (H: 1X, D: 12, V: X2) 1,14 1,21 1,93"

    print("🔍 ODDS PARSING RÉSZLETES DEBUG")
    print("=" * 60)
    print(f"📝 Input: {line}")
    print()

    # Regex alapú parsing (mint a parse_line-ban)
    m = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d*\s*(.+?) - (.+)$", line)
    if m:
        day = m.group(1)
        time = m.group(2)
        team1 = m.group(3).strip()
        rest_part = m.group(4).strip()

        print(f"✅ Regex match sikeres:")
        print(f"   day: '{day}'")
        print(f"   time: '{time}'")
        print(f"   team1: '{team1}'")
        print(f"   rest_part: '{rest_part}'")
        print()

        # Odds patterns vizsgálata
        odds_patterns = [
            r"(\d{1,2},\d{2}\s+\d{1,2},\d{2}\s+\d{1,2},\d{2})$",  # 3 odds
            r"(\d{1,2},\d{2}\s+\d{1,2},\d{2})$",                   # 2 odds
            r"(\d{1,2},\d{2})$",                                    # 1 odds
            r"(\d{2})\s+(\d{1,2},\d{2}(?:\s+\d{1,2},\d{2})*)$"    # kód + odds(ok)
        ]

        for i, pattern in enumerate(odds_patterns):
            print(f"🔍 Pattern #{i+1}: {pattern}")
            odds_match = re.search(pattern, rest_part)
            if odds_match:
                print(f"   ✅ MATCH! Groups: {odds_match.groups()}")
                has_code = (i == 3)

                if has_code:
                    code = odds_match.group(1)
                    odds_text = odds_match.group(2)
                    print(f"   🏷️  Code: {code}")
                    print(f"   📊 Odds text: '{odds_text}'")
                else:
                    odds_text = odds_match.group(1)
                    print(f"   📊 Odds text: '{odds_text}'")

                odds_start = odds_match.start()
                before_odds = rest_part[:odds_start].strip()
                print(f"   📍 Odds start position: {odds_start}")
                print(f"   📝 Before odds: '{before_odds}'")

                # Market starters keresése
                market_starters = [
                    "1X2 +", "Ki jut tovább?", "Kétesély", "Döntetlennél", "Mindkét csapat",
                    "Gólszám", "Félidő", "Eredmény", "Handicap", "Pontos",
                    "Első", "Utolsó", "Totál", "Szögletszám", "Lapszám", "Félidő/végeredmény",
                    "1. félidő", "2. félidő", "Mindkét félidő", "Hazai csapat", "Vendégcsapat",
                    "Büntetőlap-szám", "Szöglet", "Az első", "Melyik csapat", "Lesz",
                    "A továbbjutás", "Melyik félidő", "Hendikep", "Ki nyeri a döntőt?"
                ]

                earliest_pos = len(before_odds)
                found_market = ""

                for starter in market_starters:
                    pos = before_odds.find(starter)
                    if pos != -1 and pos < earliest_pos:
                        earliest_pos = pos
                        found_market = starter
                        print(f"   🎯 Találat: '{starter}' @ pos {pos}")

                if earliest_pos < len(before_odds):
                    team2 = before_odds[:earliest_pos].strip()
                    market_name = before_odds[earliest_pos:].strip()
                    print(f"   🏆 EREDMÉNY:")
                    print(f"      team2: '{team2}'")
                    print(f"      market_name: '{market_name}'")
                else:
                    print(f"   ❌ Nincs market starter!")
                    team2 = before_odds
                    market_name = "Fő piac"
                    print(f"   🏆 EREDMÉNY (fallback):")
                    print(f"      team2: '{team2}'")
                    print(f"      market_name: '{market_name}'")

                break
            else:
                print(f"   ❌ Nincs match")

    else:
        print("❌ Regex sikertelen!")

if __name__ == "__main__":
    debug_odds_parsing()
