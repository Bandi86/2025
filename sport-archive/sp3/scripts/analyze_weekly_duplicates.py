#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
Heteken belüli duplikátumok és frissített piacok elemzése.
Megvizsgálja, hogy ugyanazon meccs több forrásban való megjelenése esetén
van-e új vagy frissített piaci információ.
"""

import json
import os
import sys
from typing import Dict, List, Any, Set, Tuple
from collections import defaultdict
from datetime import datetime, timedelta

def get_match_id(match: Dict[str, Any]) -> str:
    """Generate match ID same way as backend"""
    date = match.get('date', '')
    team1 = match.get('team1', match.get('home_team', ''))
    team2 = match.get('team2', match.get('away_team', ''))
    competition = match.get('competition', match.get('league', ''))
    return f"{date}_{team1}_{team2}_{competition}"

def normalize_market(market: Dict) -> Tuple[str, str, str, float]:
    """Normalize market for comparison"""
    return (
        market.get('type', ''),
        market.get('selection', ''),
        market.get('handicap', ''),
        float(market.get('odds', 0)) if market.get('odds') else 0.0
    )

def get_json_matches_with_sources() -> Dict[str, List[Dict[str, Any]]]:
    """Load all matches from JSON files, keeping all occurrences with source info"""
    json_dir = "/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed"

    if not os.path.exists(json_dir):
        print(f"JSON directory not found: {json_dir}")
        return {}

    matches_by_id = defaultdict(list)
    total_matches = 0

    for filename in sorted(os.listdir(json_dir)):
        if filename.endswith('.json'):
            filepath = os.path.join(json_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    matches = data.get('matches', [])

                    for match in matches:
                        match['source_file'] = filename
                        match['source_date'] = filename.replace('.json', '')  # Assuming filename is date-based
                        match_id = get_match_id(match)
                        matches_by_id[match_id].append(match)
                        total_matches += 1

            except Exception as e:
                print(f"Error reading {filename}: {e}")

    print(f"Összes meccs betöltve: {total_matches}")
    print(f"Egyedi meccs ID-k: {len(matches_by_id)}")

    return dict(matches_by_id)

def analyze_duplicate_sources(matches_by_id: Dict[str, List[Dict]]) -> Dict[str, Any]:
    """Analyze matches that appear in multiple sources"""

    duplicates = {}
    single_source = 0
    multi_source = 0

    for match_id, match_list in matches_by_id.items():
        if len(match_list) == 1:
            single_source += 1
        else:
            multi_source += 1
            duplicates[match_id] = {
                'count': len(match_list),
                'sources': [m['source_file'] for m in match_list],
                'matches': match_list
            }

    print(f"Egyetlen forrásból: {single_source}")
    print(f"Több forrásból: {multi_source}")

    return duplicates

def compare_match_markets(match1: Dict, match2: Dict) -> Dict[str, Any]:
    """Compare markets between two instances of the same match"""

    markets1 = match1.get('markets', [])
    markets2 = match2.get('markets', [])

    # Normalize markets for comparison
    norm_markets1 = set(normalize_market(m) for m in markets1)
    norm_markets2 = set(normalize_market(m) for m in markets2)

    # Find differences
    only_in_first = norm_markets1 - norm_markets2
    only_in_second = norm_markets2 - norm_markets1
    common = norm_markets1 & norm_markets2

    # Check for odds differences in common markets
    odds_differences = []
    for market1 in markets1:
        norm1 = normalize_market(market1)
        for market2 in markets2:
            norm2 = normalize_market(market2)
            # Same market type and selection, different odds
            if (norm1[0] == norm2[0] and norm1[1] == norm2[1] and
                norm1[2] == norm2[2] and norm1[3] != norm2[3]):
                odds_differences.append({
                    'type': norm1[0],
                    'selection': norm1[1],
                    'handicap': norm1[2],
                    'odds1': norm1[3],
                    'odds2': norm2[3],
                    'source1': match1['source_file'],
                    'source2': match2['source_file']
                })

    return {
        'markets1_count': len(markets1),
        'markets2_count': len(markets2),
        'common_markets': len(common),
        'only_in_first': len(only_in_first),
        'only_in_second': len(only_in_second),
        'identical': len(only_in_first) == 0 and len(only_in_second) == 0 and len(odds_differences) == 0,
        'odds_differences': odds_differences,
        'new_markets_in_second': list(only_in_second) if only_in_second else [],
        'removed_markets': list(only_in_first) if only_in_first else []
    }

def analyze_temporal_progression(duplicates: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze how matches evolve over time in different sources"""

    temporal_analysis = {}

    for match_id, duplicate_info in duplicates.items():
        matches = duplicate_info['matches']

        # Sort by source file (assuming chronological order)
        sorted_matches = sorted(matches, key=lambda x: x['source_file'])

        progression = []
        for i in range(len(sorted_matches) - 1):
            current = sorted_matches[i]
            next_match = sorted_matches[i + 1]

            comparison = compare_match_markets(current, next_match)
            progression.append({
                'from_source': current['source_file'],
                'to_source': next_match['source_file'],
                'comparison': comparison
            })

        temporal_analysis[match_id] = {
            'total_sources': len(sorted_matches),
            'sources': [m['source_file'] for m in sorted_matches],
            'progression': progression
        }

    return temporal_analysis

def find_valuable_duplicates(temporal_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Find duplicates that contain valuable new information"""

    valuable_duplicates = []

    for match_id, analysis in temporal_analysis.items():
        has_new_markets = False
        has_odds_changes = False

        for step in analysis['progression']:
            comp = step['comparison']
            if comp['only_in_second'] > 0:
                has_new_markets = True
            if comp['odds_differences']:
                has_odds_changes = True

        if has_new_markets or has_odds_changes:
            valuable_duplicates.append({
                'match_id': match_id,
                'has_new_markets': has_new_markets,
                'has_odds_changes': has_odds_changes,
                'analysis': analysis
            })

    return valuable_duplicates

def main():
    print("=== HETEKEN BELÜLI DUPLIKÁTUMOK ÉS FRISSÍTETT PIACOK ELEMZÉSE ===\n")

    # Load all matches with source information
    matches_by_id = get_json_matches_with_sources()

    if not matches_by_id:
        print("Hiba az adatok betöltésénél!")
        return

    # Analyze duplicates
    duplicates = analyze_duplicate_sources(matches_by_id)

    if not duplicates:
        print("Nincsenek duplikátumok!")
        return

    print(f"\n=== DUPLIKÁTUM STATISZTIKÁK ===")

    # Count distribution
    count_distribution = defaultdict(int)
    for duplicate_info in duplicates.values():
        count_distribution[duplicate_info['count']] += 1

    print("Duplikátum eloszlás:")
    for count, freq in sorted(count_distribution.items()):
        print(f"  {count} forrásból: {freq} meccs")

    # Temporal analysis
    print(f"\n=== IDŐBELI PROGRESSZIÓ ELEMZÉSE ===")
    temporal_analysis = analyze_temporal_progression(duplicates)

    # Find valuable duplicates
    valuable_duplicates = find_valuable_duplicates(temporal_analysis)

    print(f"Értékes duplikátumok (új piaccal vagy odds változással): {len(valuable_duplicates)}")

    if valuable_duplicates:
        print(f"\n=== PÉLDA ÉRTÉKES DUPLIKÁTUMOK ===")

        for i, valuable in enumerate(valuable_duplicates[:5], 1):
            print(f"\n{i}. {valuable['match_id']}")
            analysis = valuable['analysis']
            print(f"   Források: {' -> '.join(analysis['sources'])}")

            if valuable['has_new_markets']:
                print("   ✓ Új piacok találhatók")
            if valuable['has_odds_changes']:
                print("   ✓ Odds változások találhatók")

            # Show details for first progression step
            if analysis['progression']:
                first_step = analysis['progression'][0]
                comp = first_step['comparison']
                print(f"   Első változás ({first_step['from_source']} -> {first_step['to_source']}):")
                print(f"     Közös piacok: {comp['common_markets']}")
                print(f"     Új piacok: {comp['only_in_second']}")
                print(f"     Eltávolított piacok: {comp['only_in_first']}")
                print(f"     Odds változások: {len(comp['odds_differences'])}")

    # Generate recommendations
    print(f"\n=== AJÁNLÁSOK ===")

    total_duplicates = len(duplicates)
    valuable_count = len(valuable_duplicates)
    ignored_valuable = valuable_count

    if valuable_count > 0:
        print(f"🚨 FIGYELEM: {valuable_count}/{total_duplicates} duplikátum tartalmaz értékes új információt!")
        print(f"Ezek jelenleg figyelmen kívül maradnak az importnál.")
        print(f"\nJavaslatok:")
        print(f"1. Implementálj 'merge' vagy 'update' logikát a backend-ben")
        print(f"2. Duplikátum esetén ellenőrizd van-e új piac vagy frissített odds")
        print(f"3. Ha igen, frissítsd a meglévő meccset új adatokkal")
        print(f"4. Alternatív: verzionálás bevezetése (match versions)")
    else:
        print(f"✅ Minden duplikátum azonos tartalommal rendelkezik.")
        print(f"A jelenlegi 'ignore duplicate' logika megfelelő.")

    # Save detailed results
    results = {
        'summary': {
            'total_matches': sum(len(matches) for matches in matches_by_id.values()),
            'unique_match_ids': len(matches_by_id),
            'duplicates_count': len(duplicates),
            'valuable_duplicates_count': len(valuable_duplicates)
        },
        'count_distribution': dict(count_distribution),
        'valuable_duplicates': valuable_duplicates[:20],  # Save top 20
        'temporal_analysis_sample': dict(list(temporal_analysis.items())[:10])
    }

    with open('/home/bandi/Documents/code/2025/sp3/reports/weekly_duplicates_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nRészletes eredmények mentve: reports/weekly_duplicates_analysis.json")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Hiba: {e}")
        import traceback
        traceback.print_exc()
