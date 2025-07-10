#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
Részletes duplikáció és anomália elemzés
Megvizsgálja:
1. Mi volt a duplikáció ha tiszta volt a DB?
2. Miért ilyen nagy különbség a TXT és JSON között?
3. Mi okozza az anomáliákat?
"""

import json
import os
import psycopg2
from collections import defaultdict, Counter
from typing import Dict, List, Any
import re

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'database': 'sp3_db',
    'user': 'sp3_user',
    'password': 'sp3_password',
    'port': 55432
}

def analyze_json_duplicates():
    """Részletes JSON duplikáció elemzés"""
    print("🔍 JSON DUPLIKÁCIÓ RÉSZLETES ELEMZÉSE")
    print("=" * 50)

    json_dir = "/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed"

    all_matches = []
    match_id_counts = defaultdict(list)

    # Collect all matches
    for filename in os.listdir(json_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(json_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                matches = data.get('matches', [])

                for i, match in enumerate(matches):
                    match_id = f"{match.get('date', 'NO_DATE')}_{match.get('team1', 'NO_TEAM1')}_{match.get('team2', 'NO_TEAM2')}_{match.get('competition', 'NO_COMP')}"

                    match_info = {
                        'match_id': match_id,
                        'file': filename,
                        'index': i,
                        'date': match.get('date'),
                        'team1': match.get('team1'),
                        'team2': match.get('team2'),
                        'competition': match.get('competition'),
                        'league': match.get('league'),
                        'time': match.get('time'),
                        'markets_count': len(match.get('markets', [])),
                        'markets': match.get('markets', [])
                    }

                    all_matches.append(match_info)
                    match_id_counts[match_id].append(match_info)

    print(f"📊 Összes JSON meccs: {len(all_matches)}")
    print(f"📊 Egyedi match ID-k: {len(match_id_counts)}")

    # Find duplicates
    duplicates = {mid: matches for mid, matches in match_id_counts.items() if len(matches) > 1}
    print(f"📊 Duplikált match ID-k: {len(duplicates)}")
    print(f"📊 Duplikált meccsek száma: {sum(len(matches) for matches in duplicates.values())}")

    if duplicates:
        print(f"\n🔍 DUPLIKÁTUMOK RÉSZLETEI:")

        # Analyze duplicate patterns
        duplicate_patterns = defaultdict(int)
        file_combinations = defaultdict(int)

        for match_id, duplicate_matches in list(duplicates.items())[:10]:
            print(f"\n📝 Match ID: {match_id}")

            files = [m['file'] for m in duplicate_matches]
            file_combinations[tuple(sorted(files))] += 1

            for i, match in enumerate(duplicate_matches):
                print(f"   {i+1}. {match['file']} - {match['markets_count']} piac")
                print(f"      Date: {match['date']}")
                print(f"      Teams: {match['team1']} vs {match['team2']}")
                print(f"      Competition: {match['competition']}")
                print(f"      League: {match['league']}")

                # Check for content differences
                if i > 0:
                    prev_match = duplicate_matches[i-1]
                    if match['markets'] != prev_match['markets']:
                        print(f"      ⚠️ Markets DIFFER from previous!")
                        print(f"         Prev: {len(prev_match['markets'])} markets")
                        print(f"         This: {len(match['markets'])} markets")
                        duplicate_patterns['different_markets'] += 1
                    else:
                        print(f"      ✅ Markets identical to previous")
                        duplicate_patterns['identical_markets'] += 1

        print(f"\n📈 DUPLIKÁTUM MINTÁK:")
        for pattern, count in duplicate_patterns.items():
            print(f"   {pattern}: {count}")

        print(f"\n📈 FÁJL KOMBINÁCIÓK:")
        for file_combo, count in sorted(file_combinations.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"   {' + '.join(file_combo)}: {count} duplikátum")

    return len(all_matches), len(match_id_counts), len(duplicates)

def analyze_txt_vs_json_difference():
    """Elemzi a TXT és JSON közötti nagy különbségeket"""
    print(f"\n🔍 TXT vs JSON KÜLÖNBSÉGEK ELEMZÉSE")
    print("=" * 50)

    txt_dir = "/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/txts"
    json_dir = "/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed"

    # Analyze a specific TXT file in detail
    txt_file = "Web__47sz__P__06-13_lines.txt"
    json_file = "Web__47sz__P__06-13_lines.json"

    txt_path = os.path.join(txt_dir, txt_file)
    json_path = os.path.join(json_dir, json_file)

    print(f"📄 Részletes elemzés: {txt_file}")

    # Read TXT file
    with open(txt_path, 'r', encoding='utf-8') as f:
        txt_lines = f.readlines()

    print(f"📊 TXT sorok száma: {len(txt_lines)}")

    # Analyze TXT patterns
    team_vs_patterns = []
    time_patterns = []
    odds_patterns = []
    other_lines = []

    for i, line in enumerate(txt_lines[:50]):  # First 50 lines
        line = line.strip()
        if not line:
            continue

        # Check for team vs team pattern
        if ' vs ' in line.lower() or ' - ' in line:
            team_vs_patterns.append((i, line))
        # Check for time pattern
        elif re.search(r'\d{1,2}:\d{2}', line):
            time_patterns.append((i, line))
        # Check for odds pattern (decimal numbers)
        elif re.search(r'\d+\.\d+', line):
            odds_patterns.append((i, line))
        else:
            other_lines.append((i, line))

    print(f"\n📈 TXT PATTERN ELEMZÉS (első 50 sor):")
    print(f"   Team vs Team pattern: {len(team_vs_patterns)}")
    print(f"   Time patterns: {len(time_patterns)}")
    print(f"   Odds patterns: {len(odds_patterns)}")
    print(f"   Other lines: {len(other_lines)}")

    print(f"\n📝 PÉLDA SOROK:")
    print(f"Team vs Team minták:")
    for i, (line_num, line) in enumerate(team_vs_patterns[:3]):
        print(f"   {line_num}: {line}")

    print(f"Time minták:")
    for i, (line_num, line) in enumerate(time_patterns[:3]):
        print(f"   {line_num}: {line}")

    print(f"Odds minták:")
    for i, (line_num, line) in enumerate(odds_patterns[:3]):
        print(f"   {line_num}: {line}")

    print(f"Other sorok:")
    for i, (line_num, line) in enumerate(other_lines[:3]):
        print(f"   {line_num}: {line}")

    # Read JSON file
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    json_matches = json_data.get('matches', [])
    print(f"\n📊 JSON meccsek száma: {len(json_matches)}")

    # Analyze JSON content
    competition_counts = Counter()
    league_counts = Counter()
    market_counts = []

    for match in json_matches:
        competition_counts[match.get('competition')] += 1
        league_counts[match.get('league')] += 1
        market_counts.append(len(match.get('markets', [])))

    print(f"\n📈 JSON TARTALOM ELEMZÉS:")
    print(f"   Competition értékek:")
    for comp, count in competition_counts.most_common(5):
        print(f"      '{comp}': {count}")

    print(f"   League értékek:")
    for league, count in league_counts.most_common(5):
        print(f"      '{league}': {count}")

    print(f"   Piacok száma (statisztika):")
    print(f"      Min: {min(market_counts) if market_counts else 0}")
    print(f"      Max: {max(market_counts) if market_counts else 0}")
    print(f"      Átlag: {sum(market_counts)/len(market_counts) if market_counts else 0:.1f}")

    return len(txt_lines), len(json_matches)

def analyze_database_vs_json():
    """Elemzi a database és JSON közötti kapcsolatot"""
    print(f"\n🔍 DATABASE vs JSON ELEMZÉS")
    print("=" * 50)

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Get DB counts
        cur.execute("SELECT COUNT(*) FROM matches")
        db_matches = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM markets")
        db_markets = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM odds")
        db_odds = cur.fetchone()[0]

        print(f"📊 Database statisztikák:")
        print(f"   Meccsek: {db_matches}")
        print(f"   Piacok: {db_markets}")
        print(f"   Odds: {db_odds}")

        # Check for duplicate detection in DB
        cur.execute("""
            SELECT
                m.date::date,
                ht.name as home_team,
                at.name as away_team,
                c.name as competition,
                COUNT(*) as count
            FROM matches m
            LEFT JOIN teams ht ON ht.id = m."homeTeamId"
            LEFT JOIN teams at ON at.id = m."awayTeamId"
            LEFT JOIN competitions c ON c.id = m."competitionId"
            GROUP BY m.date::date, ht.name, at.name, c.name
            HAVING COUNT(*) > 1
            ORDER BY count DESC
            LIMIT 5
        """)

        db_duplicates = cur.fetchall()

        if db_duplicates:
            print(f"\n⚠️ DB-ben talált duplikátumok:")
            for dup in db_duplicates:
                print(f"   {dup[0]} {dup[1]} vs {dup[2]} ({dup[3]}): {dup[4]} példány")
        else:
            print(f"\n✅ Nincsenek duplikátumok a DB-ben")

        # Get sample matches to see what got imported
        cur.execute("""
            SELECT
                m.date::date,
                ht.name as home_team,
                at.name as away_team,
                c.name as competition,
                COUNT(mk.id) as market_count
            FROM matches m
            LEFT JOIN teams ht ON ht.id = m."homeTeamId"
            LEFT JOIN teams at ON at.id = m."awayTeamId"
            LEFT JOIN competitions c ON c.id = m."competitionId"
            LEFT JOIN markets mk ON mk."matchId" = m.id
            GROUP BY m.id, m.date, ht.name, at.name, c.name
            ORDER BY m.date
            LIMIT 10
        """)

        sample_matches = cur.fetchall()

        print(f"\n📝 Minta meccsek a DB-ben:")
        for match in sample_matches:
            print(f"   {match[0]} {match[1]} vs {match[2]} ({match[3]}) - {match[4]} piac")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Database hiba: {e}")

def main():
    print("=" * 70)
    print("SP3 RÉSZLETES ANOMÁLIA ÉS DUPLIKÁCIÓ ELEMZÉS")
    print("=" * 70)

    # 1. JSON duplikáció elemzés
    total_json, unique_json, duplicated_json = analyze_json_duplicates()

    # 2. TXT vs JSON különbség elemzés
    txt_lines, json_matches = analyze_txt_vs_json_difference()

    # 3. Database vs JSON elemzés
    analyze_database_vs_json()

    print(f"\n📋 ÖSSZEGZÉS")
    print("=" * 50)
    print(f"📊 JSON összesen: {total_json} meccs")
    print(f"📊 JSON egyedi: {unique_json} meccs")
    print(f"📊 JSON duplikált: {duplicated_json} match ID")
    print(f"📊 TXT sorok: {txt_lines}")
    print(f"📊 JSON meccsek (sample): {json_matches}")

    conversion_rate = (json_matches / txt_lines * 100) if txt_lines > 0 else 0
    duplication_rate = ((total_json - unique_json) / total_json * 100) if total_json > 0 else 0

    print(f"📈 TXT→JSON konverziós ráta: {conversion_rate:.1f}%")
    print(f"📈 JSON duplikációs ráta: {duplication_rate:.1f}%")

if __name__ == '__main__':
    main()
