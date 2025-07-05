#!/usr/bin/env python3
"""
Intelligens Data Coordinator tesztelő script
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.intelligent_data_coordinator import IntelligentDataCoordinator

def test_intelligent_coordinator():
    """Intelligens Coordinator tesztelése"""

    print("🔍 Intelligens Data Coordinator tesztelése...")

    coordinator = IntelligentDataCoordinator()

    # Gyors adatgyűjtés
    print("\n⚡ Gyors adatgyűjtés...")
    requirements = coordinator.get_data_collection_requirements('quick')

    print(f"✅ Követelmények: {len(requirements)} elem")
    for key, value in requirements.items():
        print(f"   {key}: {value}")

    # Adatok gyűjtése
    print("\n📊 Adatok gyűjtése...")
    data = coordinator.collect_comprehensive_data(requirements)

    print(f"✅ Adatgyűjtés kész!")
    print(f"   Mérkőzések: {len(data.get('matches', []))}")
    print(f"   Hírek: {len(data.get('news', []))}")
    print(f"   Csapat adatok: {len(data.get('team_data', {}))}")
    print(f"   Liga adatok: {'Van' if data.get('league_data') else 'Nincs'}")
    print(f"   Minőségi pontszám: {data.get('quality_score', 0):.2f}")
    print(f"   Használt források: {data.get('sources_used', [])}")
    print(f"   Összes elem: {data.get('total_items', 0)}")

    # Mérkőzés adatok részletesen
    if data.get('matches'):
        print("\n🏆 Mérkőzések (első 3):")
        for i, match in enumerate(data['matches'][:3]):
            print(f"\n{i+1}. {match.get('home_team', 'N/A')} vs {match.get('away_team', 'N/A')}")
            print(f"   Dátum: {match.get('date', 'N/A')}")
            print(f"   Státusz: {match.get('status', 'N/A')}")
            print(f"   Forrás: {match.get('source', 'N/A')}")
            print(f"   Megbízhatóság: {match.get('confidence', 0):.2f}")
            if match.get('home_score') is not None:
                print(f"   Eredmény: {match.get('home_score')}-{match.get('away_score')}")

    # Hírek részletesen
    if data.get('news'):
        print("\n📰 Hírek (első 3):")
        for i, article in enumerate(data['news'][:3]):
            print(f"\n{i+1}. {article.get('title', 'N/A')}")
            print(f"   Tartalom: {article.get('content', 'N/A')[:100]}...")
            print(f"   Forrás: {article.get('source', 'N/A')}")
            print(f"   Megbízhatóság: {article.get('confidence', 0):.2f}")

if __name__ == "__main__":
    test_intelligent_coordinator()
