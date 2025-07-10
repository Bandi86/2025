#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
JSON és database tartalmának összehasonlítása.
Megvizsgálja van-e eltérés a JSON forrásban és a database-ben tárolt adatok között.
"""

import json
import os
import sys
import psycopg2
from typing import Dict, List, Any, Set
from collections import defaultdict

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'database': 'sp3_db',
    'user': 'sp3_user',
    'password': 'sp3_password',
    'port': 55432
}

def get_match_id(match: Dict[str, Any]) -> str:
    """Generate match ID same way as backend"""
    date = match.get('date', '')
    team1 = match.get('team1', match.get('home_team', ''))
    team2 = match.get('team2', match.get('away_team', ''))
    competition = match.get('competition', match.get('league', ''))
    return f"{date}_{team1}_{team2}_{competition}"

def get_json_matches() -> Dict[str, Dict[str, Any]]:
    """Load all matches from JSON files"""
    json_dir = "/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed"

    if not os.path.exists(json_dir):
        print(f"JSON directory not found: {json_dir}")
        return {}

    all_matches = {}
    duplicates_found = 0

    for filename in os.listdir(json_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(json_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    matches = data.get('matches', [])

                    for match in matches:
                        match['source_file'] = filename
                        match_id = get_match_id(match)

                        if match_id in all_matches:
                            duplicates_found += 1
                            # Keep first occurrence for consistency with backend logic
                            continue

                        all_matches[match_id] = match

            except Exception as e:
                print(f"Error reading {filename}: {e}")

    print(f"JSON fájlokból betöltve: {len(all_matches)} egyedi meccs")
    print(f"Duplikátumok átugorva: {duplicates_found}")
    return all_matches

def get_db_matches() -> Dict[str, Dict[str, Any]]:
    """Load all matches from database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Get matches with their markets and odds
        cur.execute("""
            SELECT m.id, NULL as match_id,
                   m.date, ht.name as home_team, at.name as away_team, c.name as competition,
                   c.name as league, EXTRACT(HOUR FROM m.date) || ':' || EXTRACT(MINUTE FROM m.date) as time,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'type', mk.name,
                               'selection', o.type,
                               'odds', o.value
                           ) ORDER BY mk.id, o.id
                       ) FILTER (WHERE mk.id IS NOT NULL),
                       '[]'::json
                   ) as markets
            FROM matches m
            LEFT JOIN teams ht ON ht.id = m."homeTeamId"
            LEFT JOIN teams at ON at.id = m."awayTeamId"
            LEFT JOIN competitions c ON c.id = m."competitionId"
            LEFT JOIN markets mk ON mk."matchId" = m.id
            LEFT JOIN odds o ON o."marketId" = mk.id
            GROUP BY m.id, m.date, ht.name, at.name, c.name
            ORDER BY m.date, ht.name, at.name
        """)

        results = cur.fetchall()
        cur.close()
        conn.close()

        db_matches = {}
        for row in results:
            # Extract date part only (without time)
            full_date = row[2]  # This is the full datetime
            date_only = full_date.strftime('%Y-%m-%d') if full_date else ''

            # Generate match_id with date only
            team1 = row[3]  # home_team
            team2 = row[4]  # away_team
            competition = row[5]  # competition
            match_id = f"{date_only}_{team1}_{team2}_{competition}"

            # Convert to same format as JSON
            db_match = {
                'date': date_only,
                'team1': team1,
                'team2': team2,
                'competition': competition,
                'league': row[6],  # league
                'time': row[7],    # time
                'markets': [market for market in row[8] if market is not None]
            }

            db_matches[match_id] = db_match

        print(f"Database-ből betöltve: {len(db_matches)} meccs")
        return db_matches

    except Exception as e:
        print(f"Database hiba: {e}")
        return {}

def compare_markets(json_markets: List[Dict], db_markets: List[Dict]) -> Dict[str, Any]:
    """Compare markets between JSON and database"""

    def normalize_market(market):
        """Normalize market for comparison"""
        return {
            'type': market.get('type', ''),
            'selection': market.get('selection', ''),
            'odds': float(market.get('odds', 0)) if market.get('odds') else None,
            'handicap': market.get('handicap', '')
        }

    json_normalized = [normalize_market(m) for m in json_markets]
    db_normalized = [normalize_market(m) for m in db_markets]

    # Sort for comparison
    json_sorted = sorted(json_normalized, key=lambda x: (x['type'], x['selection'], x['handicap']))
    db_sorted = sorted(db_normalized, key=lambda x: (x['type'], x['selection'], x['handicap']))

    comparison = {
        'json_count': len(json_markets),
        'db_count': len(db_markets),
        'json_markets': json_sorted,
        'db_markets': db_sorted,
        'identical': json_sorted == db_sorted
    }

    if not comparison['identical']:
        # Find differences
        json_set = set(str(m) for m in json_sorted)
        db_set = set(str(m) for m in db_sorted)

        comparison['only_in_json'] = list(json_set - db_set)
        comparison['only_in_db'] = list(db_set - json_set)

    return comparison

def compare_match_fields(json_match: Dict, db_match: Dict) -> Dict[str, Any]:
    """Compare non-market fields"""
    differences = {}

    fields_to_compare = ['date', 'team1', 'team2', 'competition', 'league', 'time']

    for field in fields_to_compare:
        json_val = json_match.get(field)
        db_val = db_match.get(field)

        if json_val != db_val:
            differences[field] = {
                'json': json_val,
                'db': db_val
            }

    return differences

def main():
    print("=== JSON vs DATABASE ÖSSZEHASONLÍTÁS ===\n")

    # Load data
    json_matches = get_json_matches()
    db_matches = get_db_matches()

    if not json_matches or not db_matches:
        print("Hiba az adatok betöltésénél!")
        return

    # Find matches in both
    json_ids = set(json_matches.keys())
    db_ids = set(db_matches.keys())

    common_ids = json_ids & db_ids
    only_in_json = json_ids - db_ids
    only_in_db = db_ids - json_ids

    print(f"JSON-ban: {len(json_ids)} meccs")
    print(f"Database-ben: {len(db_ids)} meccs")
    print(f"Közös meccsek: {len(common_ids)}")
    print(f"Csak JSON-ban: {len(only_in_json)}")
    print(f"Csak database-ben: {len(only_in_db)}")

    # Detailed comparison for common matches
    field_differences = defaultdict(int)
    market_differences = 0
    perfect_matches = 0

    print(f"\n=== RÉSZLETES ÖSSZEHASONLÍTÁS ===")

    sample_differences = []

    for match_id in list(common_ids)[:50]:  # Check first 50 for detailed analysis
        json_match = json_matches[match_id]
        db_match = db_matches[match_id]

        # Compare fields
        field_diff = compare_match_fields(json_match, db_match)

        # Compare markets
        market_comparison = compare_markets(
            json_match.get('markets', []),
            db_match.get('markets', [])
        )

        has_differences = bool(field_diff) or not market_comparison['identical']

        if has_differences:
            # Count field differences
            for field in field_diff:
                field_differences[field] += 1

            if not market_comparison['identical']:
                market_differences += 1

            # Save sample for detailed output
            if len(sample_differences) < 5:
                sample_differences.append({
                    'match_id': match_id,
                    'field_differences': field_diff,
                    'market_comparison': market_comparison
                })
        else:
            perfect_matches += 1

    print(f"Tökéletesen egyező meccsek: {perfect_matches}")
    print(f"Különbséggel rendelkező meccsek: {50 - perfect_matches}")

    if field_differences:
        print(f"\nMező különbségek:")
        for field, count in sorted(field_differences.items(), key=lambda x: x[1], reverse=True):
            print(f"  {field}: {count} esetben")

    if market_differences:
        print(f"\nPiaci különbségek: {market_differences} esetben")

    # Show sample differences
    if sample_differences:
        print(f"\n=== PÉLDA KÜLÖNBSÉGEK ===")
        for i, diff in enumerate(sample_differences[:3], 1):
            print(f"\n{i}. Meccs: {diff['match_id']}")

            if diff['field_differences']:
                print("  Mező különbségek:")
                for field, values in diff['field_differences'].items():
                    print(f"    {field}: JSON='{values['json']}' vs DB='{values['db']}'")

            if not diff['market_comparison']['identical']:
                mc = diff['market_comparison']
                print(f"  Piac különbségek:")
                print(f"    JSON: {mc['json_count']} piac")
                print(f"    DB: {mc['db_count']} piac")

                if mc.get('only_in_json'):
                    print(f"    Csak JSON-ban: {len(mc['only_in_json'])} piac")
                if mc.get('only_in_db'):
                    print(f"    Csak DB-ben: {len(mc['only_in_db'])} piac")

    # Summary and recommendation
    print(f"\n=== ÖSSZEGZÉS ===")

    data_coverage = len(common_ids) / len(json_ids) * 100 if json_ids else 0
    print(f"Adatok lefedettség: {data_coverage:.1f}% (JSON meccsek a DB-ben)")

    if only_in_json:
        print(f"Hiányzó meccsek a DB-ből: {len(only_in_json)}")
        # Show a few examples
        examples = list(only_in_json)[:5]
        for ex in examples:
            match = json_matches[ex]
            print(f"  - {match.get('date')} {match.get('team1')} vs {match.get('team2')}")

    if only_in_db:
        print(f"Extra meccsek a DB-ben: {len(only_in_db)} (korábbi importokból)")

    # Save detailed results
    results = {
        'summary': {
            'json_matches': len(json_ids),
            'db_matches': len(db_ids),
            'common_matches': len(common_ids),
            'only_in_json': len(only_in_json),
            'only_in_db': len(only_in_db),
            'data_coverage_percent': data_coverage
        },
        'differences': {
            'field_differences': dict(field_differences),
            'market_differences': market_differences,
            'perfect_matches': perfect_matches
        },
        'sample_differences': sample_differences[:10]
    }

    with open('/home/bandi/Documents/code/2025/sp3/reports/json_vs_db_comparison.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\nRészletes eredmények mentve: reports/json_vs_db_comparison.json")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Hiba: {e}")
        import traceback
        traceback.print_exc()
