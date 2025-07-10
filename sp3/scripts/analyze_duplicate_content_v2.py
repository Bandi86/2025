#!/usr/bin/env python3
"""
🔍 DUPLIKÁTUM TARTALOM ELEMZŐ - JAVÍTOTT VERZIÓ
Részletesen elemzi a duplikált meccseket és javasol intelligens merge stratégiát
"""

import json
import os
from collections import defaultdict
from pathlib import Path

def generate_match_id(match):
    """Match ID generálása normalizált formában"""
    team1 = match.get('team1', '').lower().strip()
    team2 = match.get('team2', '').lower().strip()
    date = match.get('date', '')
    league = match.get('league', 'NO_COMP').replace(' ', '_')

    if not team1 or not team2:
        return None

    return f"{date}_{team1}_{team2}_{league}"

def load_all_jsons():
    """Betölti az összes JSON fájlt és generálja a match ID-kat"""
    jsons_dir = Path("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons/processed")
    all_matches = []

    for json_file in jsons_dir.glob("*.json"):
        print(f"📄 Betöltés: {json_file.name}")
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                matches = data.get('matches', [])
                print(f"   ✅ {len(matches)} meccs")

                for match in matches:
                    match_id = generate_match_id(match)
                    if match_id:
                        match['match_id'] = match_id
                        match['source_file'] = json_file.name
                        all_matches.append(match)
        except Exception as e:
            print(f"❌ Hiba {json_file.name} betöltésében: {e}")

    return all_matches

def analyze_markets_content(instances):
    """Elemzi a piacokat és odds különbségeket"""
    market_analysis = {}

    for i, instance in enumerate(instances):
        markets = instance.get('markets', [])
        source = instance.get('source_file', f'instance_{i}')

        market_analysis[source] = {
            'markets_count': len(markets),
            'markets_detail': [],
            'total_odds': 0
        }

        for market in markets:
            market_name = market.get('name', 'Unknown')
            odds_data = {}

            # Odds kinyerése különböző formátumokban
            if 'odds1' in market:
                odds_data['odds1'] = market.get('odds1')
                odds_data['oddsX'] = market.get('oddsX')
                odds_data['odds2'] = market.get('odds2')
            elif 'odds' in market:
                odds_data = market.get('odds', {})

            odds_count = len([v for v in odds_data.values() if v])
            market_analysis[source]['total_odds'] += odds_count

            market_analysis[source]['markets_detail'].append({
                'name': market_name,
                'odds_count': odds_count,
                'odds_data': odds_data
            })

    return market_analysis

def suggest_merge_strategy(instances, market_analysis):
    """Javasol merge stratégiát a különböző példányok alapján"""

    # Összes egyedi piac összegyűjtése
    all_unique_markets = {}
    best_odds_per_market = {}

    for source, analysis in market_analysis.items():
        for market_detail in analysis['markets_detail']:
            market_name = market_detail['name']
            odds_count = market_detail['odds_count']
            odds_data = market_detail['odds_data']

            if market_name not in all_unique_markets:
                all_unique_markets[market_name] = {
                    'best_source': source,
                    'best_odds_count': odds_count,
                    'best_odds_data': odds_data
                }
            else:
                # Ha több odds van, azt preferáljuk
                if odds_count > all_unique_markets[market_name]['best_odds_count']:
                    all_unique_markets[market_name] = {
                        'best_source': source,
                        'best_odds_count': odds_count,
                        'best_odds_data': odds_data
                    }

    # Jelenlegi best instance kiválasztása (legtöbb piaccal)
    best_instance = max(instances, key=lambda x: len(x.get('markets', [])))
    current_markets = len(best_instance.get('markets', []))
    current_total_odds = sum(len([v for v in m.get('odds', {}).values() if v] +
                                [v for k, v in m.items() if k.startswith('odds') and v])
                            for m in best_instance.get('markets', []))

    # Potenciális merge eredmény
    merged_markets_count = len(all_unique_markets)
    merged_total_odds = sum(market['best_odds_count'] for market in all_unique_markets.values())

    return {
        'current_markets': current_markets,
        'current_odds': current_total_odds,
        'merged_markets': merged_markets_count,
        'merged_odds': merged_total_odds,
        'lost_markets': merged_markets_count - current_markets,
        'lost_odds': merged_total_odds - current_total_odds,
        'unique_markets': all_unique_markets
    }

def analyze_duplicates():
    """Fő elemzési funkció"""
    print("🔍 DUPLIKÁTUM TARTALOM ELEMZÉS - JAVÍTOTT VERZIÓ")
    print("=" * 70)

    matches = load_all_jsons()
    print(f"\n📊 Összesen {len(matches)} meccs betöltve")

    # Csoportosítás match_id szerint
    by_id = defaultdict(list)
    for match in matches:
        match_id = match.get('match_id', 'NO_ID')
        by_id[match_id].append(match)

    duplicates = {k: v for k, v in by_id.items() if len(v) > 1}
    unique_matches = {k: v for k, v in by_id.items() if len(v) == 1}

    print(f"📊 {len(unique_matches)} egyedi meccs")
    print(f"📊 {len(duplicates)} duplikált match ID")

    if not duplicates:
        print("✅ Nincsenek duplikátumok!")
        return

    # Részletes duplikátum elemzés
    total_lost_markets = 0
    total_lost_odds = 0
    detailed_analysis = []

    print(f"\n🔍 RÉSZLETES DUPLIKÁTUM ELEMZÉS:")
    print("=" * 50)

    for match_id, instances in list(duplicates.items())[:10]:  # Első 10 duplikátum
        print(f"\n🎯 MATCH: {match_id}")
        print(f"   📁 Példányok: {len(instances)}")

        # Forrás fájlok
        sources = [inst.get('source_file', 'unknown') for inst in instances]
        print(f"   📄 Források: {', '.join(sources)}")

        # Piac elemzés
        market_analysis = analyze_markets_content(instances)

        print(f"   📊 PIAC ELEMZÉS:")
        for source, analysis in market_analysis.items():
            print(f"      {source}: {analysis['markets_count']} piac, {analysis['total_odds']} odds")
            for market in analysis['markets_detail'][:2]:  # Első 2 piac
                print(f"         - {market['name']}: {market['odds_count']} odds")

        # Merge javaslat
        merge_strategy = suggest_merge_strategy(instances, market_analysis)

        print(f"   💡 MERGE EREDMÉNY:")
        print(f"      Jelenlegi: {merge_strategy['current_markets']} piac, {merge_strategy['current_odds']} odds")
        print(f"      Merged:    {merge_strategy['merged_markets']} piac, {merge_strategy['merged_odds']} odds")
        print(f"      ❌ Veszteség: {merge_strategy['lost_markets']} piac, {merge_strategy['lost_odds']} odds")

        total_lost_markets += merge_strategy['lost_markets']
        total_lost_odds += merge_strategy['lost_odds']

        detailed_analysis.append({
            'match_id': match_id,
            'instances_count': len(instances),
            'sources': sources,
            'merge_strategy': merge_strategy
        })

    # Összegzés
    print(f"\n📊 VÉGSŐ ÖSSZEGZÉS")
    print("=" * 30)
    print(f"💔 Összes elveszett piac: {total_lost_markets}")
    print(f"💔 Összes elveszett odds: {total_lost_odds}")
    print(f"📈 Elemezhető duplikátumok: {len(detailed_analysis)}")

    # TOP veszteségek
    top_losses = sorted(detailed_analysis,
                       key=lambda x: x['merge_strategy']['lost_markets'] + x['merge_strategy']['lost_odds'],
                       reverse=True)

    print(f"\n🚨 TOP 5 LEGNAGYOBB VESZTESÉG:")
    for i, analysis in enumerate(top_losses[:5], 1):
        strategy = analysis['merge_strategy']
        print(f"   {i}. {analysis['match_id'][:50]}...")
        print(f"      🔥 Veszteség: {strategy['lost_markets']} piac + {strategy['lost_odds']} odds")
        print(f"      📁 Források: {len(analysis['sources'])} fájl")

    # Backend import javítási javaslat
    print(f"\n🔧 BACKEND IMPORT JAVÍTÁSI JAVASLAT:")
    print("1. 📥 DUPLIKÁTUM MERGE STRATÉGIA:")
    print("   - Ne dobjuk el a duplikátumokat")
    print("   - Union operation az összes piacra")
    print("   - Legjobb odds megőrzése piaconként")
    print("   - Frissebb/teljesebb verzió preferálása")
    print("2. 🎯 IMPLEMENTÁCIÓ:")
    print("   - json-importer.service.ts módosítása")
    print("   - Deduplikáció helyett merge logika")
    print("   - Market-level conflict resolution")

if __name__ == "__main__":
    analyze_duplicates()
