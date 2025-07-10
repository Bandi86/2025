#!/usr/bin/env python3
"""
🔍 ESPECÍFIKUS DUPLIKÁTUM ELEMZŐ
Megvizsgálja azokat a duplikátumokat ahol valóban eltérőek a piacok
"""

import json
from pathlib import Path

def analyze_specific_duplicates():
    """Elemzi a konkrét különbségeket a duplikátumokban"""

    # A korábbi elemzésből tudjuk, hogy ezekben VAN különbség:
    interesting_matches = [
        "2025-06-13_dalian yingbo_meizhou hakka_Kínai_bajnokság",
        "2025-06-13_wuhan three towns_qingdao hainiu_Kínai_bajnokság"
    ]

    jsons_dir = Path("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed")

    file1_path = jsons_dir / "Web__46sz__K__06-10_lines.json"
    file2_path = jsons_dir / "Web__47sz__P__06-13_lines.json"

    print("🔍 RÉSZLETES DUPLIKÁTUM ELEMZÉS")
    print("=" * 60)

    # Betöltés
    with open(file1_path, 'r', encoding='utf-8') as f:
        data1 = json.load(f)

    with open(file2_path, 'r', encoding='utf-8') as f:
        data2 = json.load(f)

    # Meccsek indexelése
    matches1 = {}
    matches2 = {}

    for match in data1.get('matches', []):
        team1 = match.get('team1', '').lower().strip()
        team2 = match.get('team2', '').lower().strip()
        date = match.get('date', '')
        league = match.get('league', 'NO_COMP').replace(' ', '_')
        match_id = f"{date}_{team1}_{team2}_{league}"
        matches1[match_id] = match

    for match in data2.get('matches', []):
        team1 = match.get('team1', '').lower().strip()
        team2 = match.get('team2', '').lower().strip()
        date = match.get('date', '')
        league = match.get('league', 'NO_COMP').replace(' ', '_')
        match_id = f"{date}_{team1}_{team2}_{league}"
        matches2[match_id] = match

    print(f"📄 Fájl 1: {len(matches1)} meccs")
    print(f"📄 Fájl 2: {len(matches2)} meccs")

    # Közös meccsek keresése
    common_matches = set(matches1.keys()) & set(matches2.keys())
    print(f"🔗 Közös meccsek: {len(common_matches)}")

    # Érdekes meccsek elemzése
    for match_id in interesting_matches:
        if match_id in matches1 and match_id in matches2:
            print(f"\n🎯 ELEMZÉS: {match_id}")

            match1 = matches1[match_id]
            match2 = matches2[match_id]

            markets1 = match1.get('markets', [])
            markets2 = match2.get('markets', [])

            print(f"   📊 Web__46sz__K__06-10: {len(markets1)} piac")
            for i, market in enumerate(markets1):
                print(f"      {i+1}. {market.get('name', 'Unknown')}")
                print(f"         Odds: {market.get('odds1', 'N/A')} | {market.get('oddsX', 'N/A')} | {market.get('odds2', 'N/A')}")

            print(f"   📊 Web__47sz__P__06-13: {len(markets2)} piac")
            for i, market in enumerate(markets2):
                print(f"      {i+1}. {market.get('name', 'Unknown')}")
                print(f"         Odds: {market.get('odds1', 'N/A')} | {market.get('oddsX', 'N/A')} | {market.get('odds2', 'N/A')}")

            # Különbség elemzése
            if len(markets1) != len(markets2):
                print(f"   ⚠️ PIAC SZÁMKÜLÖNBSÉG: {len(markets1)} vs {len(markets2)}")

                if len(markets1) > len(markets2):
                    print(f"   🥇 GYŐZTES: Web__46sz__K__06-10 ({len(markets1)} piac)")
                    print(f"   📈 ELVESZETT PIACOK: {len(markets1) - len(markets2)}")
                else:
                    print(f"   🥇 GYŐZTES: Web__47sz__P__06-13 ({len(markets2)} piac)")
                    print(f"   📈 ELVESZETT PIACOK: {len(markets2) - len(markets1)}")
            else:
                print(f"   ✅ Azonos piacszám")

    # Backend feldolgozási sorrend szimulációja
    print(f"\n🔄 BACKEND FELDOLGOZÁSI SORREND SZIMULÁCIÓ")
    print("=" * 50)

    # A backend ábécé sorrendben dolgozza fel?
    file_order = [
        "Web__46sz__K__06-10_lines.json",
        "Web__47sz__P__06-13_lines.json",
        "Web__48sz__K__06-17_lines.json",
        # stb...
    ]

    print("Feldolgozási sorrend:")
    for i, filename in enumerate(file_order, 1):
        print(f"   {i}. {filename}")

    # Mi történik a konkrét duplikátumokkal?
    for match_id in interesting_matches:
        if match_id in matches1 and match_id in matches2:
            print(f"\n📋 FELDOLGOZÁS: {match_id}")

            # 1. Első fájl (Web__46sz__K__06-10)
            match1 = matches1[match_id]
            markets1 = match1.get('markets', [])
            print(f"   1️⃣ Első import (Web__46sz__K__06-10): {len(markets1)} piac")
            print(f"      → Meccs létrehozva az adatbázisban")

            # 2. Második fájl (Web__47sz__P__06-13)
            match2 = matches2[match_id]
            markets2 = match2.get('markets', [])
            print(f"   2️⃣ Második import (Web__47sz__P__06-13): {len(markets2)} piac")

            if len(markets2) > len(markets1):
                print(f"      ❌ PROBLÉMA: Több piac ({len(markets2)}) törli a kevesebbet ({len(markets1)})")
                print(f"      📈 EREDMÉNY: {len(markets2)} piac marad")
            elif len(markets1) > len(markets2):
                print(f"      ❌ PROBLÉMA: Kevesebb piac ({len(markets2)}) felülírja a többet ({len(markets1)})")
                print(f"      📉 EREDMÉNY: {len(markets2)} piac marad (VESZTESÉG!)")
            else:
                print(f"      ✅ OK: Azonos piacszám")

if __name__ == "__main__":
    analyze_specific_duplicates()
