#!/usr/bin/env python3
"""
Test script for the enhanced TeamDatabase
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.agents.match_collector.team_database import TeamDatabase

def test_database():
    print("=== TEAM DATABASE TESZT ===")

    try:
        db = TeamDatabase()
        print("✓ Adatbázis sikeresen létrehozva")

        # Statisztikák
        stats = db.get_database_stats()
        print(f"\n=== STATISZTIKÁK ===")
        print(f"Összes liga: {stats['total_leagues']}")
        print(f"Összes csapat: {stats['total_teams']}")
        print(f"Összes változat: {stats['total_variations']}")
        print(f"Kontinensek: {stats['continents']}")

        # Csapat keresés
        print(f"\n=== CSAPAT KERESÉS ===")
        searches = ['Arsenal', 'Barcelona', 'Man City', 'Real Madrid', 'Liverpool']
        for query in searches:
            results = db.search_teams(query, 2)
            print(f"'{query}' -> {len(results)} találat")
            for result in results[:2]:
                print(f"  - {result['team']} ({result.get('league', 'N/A')})")

        # Liga információk
        print(f"\n=== LIGA INFORMÁCIÓK ===")
        key_leagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Major League Soccer']
        for league in key_leagues:
            info = db.get_league_info(league)
            print(f"{league}: {info['team_count']} csapat, Tier {info['tier']}")

        # Csapat erősség
        print(f"\n=== CSAPAT ERŐSSÉG ===")
        test_teams = ['Manchester City FC', 'FC Barcelona', 'Real Madrid CF']
        for team in test_teams:
            strength = db.get_team_strength(team)
            league = db.get_team_league(team)
            print(f"{team}: {strength:.2f} erősség, Liga: {league}")

        print("\n✓ Minden teszt sikeres!")

    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()
