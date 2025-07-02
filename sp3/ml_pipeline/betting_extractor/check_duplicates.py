#!/usr/bin/env python3
"""
Duplikáció ellenőrző script: JSON fájlokban keresett duplikált meccsek
"""
import json
import sys
from pathlib import Path
from collections import defaultdict

def check_duplicates(json_file):
    """Egy JSON fájl duplikáció ellenőrzése"""
    print(f"\n🔍 Duplikáció ellenőrzés: {json_file}")

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    matches = data.get('matches', [])
    print(f"📊 Összes meccs: {len(matches)}")

    # Meccs kulcsok gyűjtése (szigorúbb ellenőrzés)
    match_keys = defaultdict(list)
    team_pairs = defaultdict(list)

    for i, match in enumerate(matches):
        # Kulcs: dátum, idő, liga, team1, team2
        key = (
            match.get('date', ''),
            match.get('time', ''),
            match.get('league', ''),
            match.get('team1', ''),
            match.get('team2', '')
        )
        match_keys[key].append(i)

        # Csapatpár ellenőrzés (potenciális duplikációk)
        team_key = (
            match.get('date', ''),
            match.get('time', ''),
            match.get('league', ''),
            match.get('team1', ''),
            # Itt csak a csapat alapnevet nézzük, market nélkül
            match.get('team2', '').split()[0] if match.get('team2', '') else ''
        )
        team_pairs[team_key].append((i, match.get('team2', '')))

    # Duplikációk keresése
    duplicates_found = []
    potential_duplicates = []
    total_duplicates = 0

    for key, indices in match_keys.items():
        if len(indices) > 1:
            duplicates_found.append((key, indices))
            total_duplicates += len(indices) - 1

    # Potenciális duplikációk (hasonló csapatnevek)
    for team_key, matches_data in team_pairs.items():
        if len(matches_data) > 1:
            # Csak akkor tekintjük potenciális duplikációnak, ha nem pontos duplikáció
            team2_names = [team2 for _, team2 in matches_data]
            if len(set(team2_names)) > 1:  # Különböző team2 nevek
                potential_duplicates.append((team_key, matches_data))

    if duplicates_found:
        print(f"❌ {len(duplicates_found)} pontos duplikáció találva!")
        print(f"❌ Összesen {total_duplicates} duplikált objektum!")

        for i, (key, indices) in enumerate(duplicates_found[:5]):
            date, time, league, team1, team2 = key
            print(f"\n🚨 Pontos duplikáció #{i+1}:")
            print(f"   📅 {date} {time}")
            print(f"   🏆 {league}")
            print(f"   ⚽ {team1} vs {team2}")
            print(f"   📍 Objektumok: {indices}")

    if potential_duplicates:
        print(f"\n⚠️  {len(potential_duplicates)} potenciális duplikáció találva!")

        for i, (team_key, matches_data) in enumerate(potential_duplicates[:5]):
            date, time, league, team1, base_team2 = team_key
            print(f"\n⚠️  Potenciális duplikáció #{i+1}:")
            print(f"   📅 {date} {time}")
            print(f"   🏆 {league}")
            print(f"   ⚽ {team1} vs {base_team2}*")
            for idx, team2_full in matches_data:
                market_count = matches[idx].get('market_count', 0)
                print(f"      #{idx}: '{team2_full}' ({market_count} markets)")

    if not duplicates_found and not potential_duplicates:
        print("✅ Nincs duplikáció!")

    return len(duplicates_found), total_duplicates, len(potential_duplicates)

def main():
    """Összes JSON fájl ellenőrzése"""
    script_dir = Path(__file__).parent
    jsons_dir = script_dir / "jsons"

    if not jsons_dir.exists():
        print("❌ Nincs jsons mappa!")
        return

    json_files = list(jsons_dir.glob("*.json"))
    if not json_files:
        print("❌ Nincsenek JSON fájlok!")
        return

    print("🔍 Duplikáció ellenőrzés JSON fájlokban")
    print("=" * 50)

    total_duplicate_types = 0
    total_duplicate_objects = 0
    total_potential = 0

    for json_file in sorted(json_files):
        if json_file.name == "test_output.json":
            continue  # Teszt fájl kihagyása

        dup_types, dup_objects, potential = check_duplicates(json_file)
        total_duplicate_types += dup_types
        total_duplicate_objects += dup_objects
        total_potential += potential

    print("\n" + "=" * 50)
    print("📊 ÖSSZESÍTÉS:")
    if total_duplicate_types > 0:
        print(f"❌ {total_duplicate_types} pontos duplikáció")
        print(f"❌ {total_duplicate_objects} duplikált objektum")
    if total_potential > 0:
        print(f"⚠️  {total_potential} potenciális duplikáció")
        print("\n💡 Javasolt művelet: Az extract_matches.py parsing logikájának javítása")
    if total_duplicate_types == 0 and total_potential == 0:
        print("✅ NINCS DUPLIKÁCIÓ az összes JSON fájlban!")
        print("🎉 A rendszer tökéletesen működik!")

if __name__ == "__main__":
    main()
