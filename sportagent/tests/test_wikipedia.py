#!/usr/bin/env python3
"""
Wikipedia Agent tesztelő script
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.wikipedia_agent import WikipediaAgent

def test_wikipedia_agent():
    """Wikipedia Agent tesztelése"""

    print("🔍 Wikipedia Agent tesztelése...")

    agent = WikipediaAgent()

    # Liga adatok keresése
    print("\n🏆 Liga adatok keresése...")
    league_data = agent.get_current_season_data("Premier League")

    print(f"✅ Liga adatok: {len(league_data)} elem")

    if league_data:
        print(f"   Cím: {league_data.get('title', 'N/A')}")
        print(f"   URL: {league_data.get('url', 'N/A')}")
        print(f"   Megbízhatóság: {league_data.get('confidence', 0):.2f}")

        if 'data' in league_data:
            print(f"   Adatok: {len(league_data['data'])} mezők")
            for key, value in list(league_data['data'].items())[:5]:
                print(f"     {key}: {value}")

    # Csapat adatok keresése
    print("\n⚽ Csapat adatok keresése...")
    team_data = agent.get_team_data("Manchester United")

    print(f"✅ Csapat adatok: {len(team_data)} elem")

    if team_data:
        print(f"   Cím: {team_data.get('title', 'N/A')}")
        print(f"   URL: {team_data.get('url', 'N/A')}")
        print(f"   Megbízhatóság: {team_data.get('confidence', 0):.2f}")

        if 'data' in team_data:
            print(f"   Adatok: {len(team_data['data'])} mezők")
            for key, value in list(team_data['data'].items())[:5]:
                print(f"     {key}: {value}")

    # Mérkőzések keresése
    print("\n📊 Mérkőzések keresése...")
    matches = agent.get_recent_matches("Manchester United")

    print(f"✅ Mérkőzések: {len(matches)} találat")

    for i, match in enumerate(matches[:3]):  # Első 3 mérkőzés
        print(f"\n{i+1}. {match.get('home_team', 'N/A')} vs {match.get('away_team', 'N/A')}")
        print(f"   Dátum: {match.get('date', 'N/A')}")
        print(f"   Státusz: {match.get('status', 'N/A')}")
        print(f"   Megbízhatóság: {match.get('confidence', 0):.2f}")
        if match.get('home_score') is not None:
            print(f"   Eredmény: {match.get('home_score')}-{match.get('away_score')}")

if __name__ == "__main__":
    test_wikipedia_agent()
