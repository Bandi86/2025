#!/usr/bin/env python3
"""
Google Search Agent tesztelő script
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.agents.google_search_agent import GoogleSearchAgent

def test_google_search_agent():
    """Google Search Agent tesztelése"""

    print("🔍 Google Search Agent tesztelése...")

    agent = GoogleSearchAgent()

    # Mérkőzések keresése
    print("\n📊 Mérkőzések keresése...")
    matches = agent.search_football_matches("Premier League matches today")

    print(f"✅ Találatok: {len(matches)} mérkőzés")

    for i, match in enumerate(matches[:3]):  # Első 3 mérkőzés
        print(f"\n{i+1}. {match.get('home_team', 'N/A')} vs {match.get('away_team', 'N/A')}")
        print(f"   Dátum: {match.get('date', 'N/A')}")
        print(f"   Forrás: {match.get('source', 'N/A')}")
        print(f"   Megbízhatóság: {match.get('confidence', 0):.2f}")
        if match.get('home_score') is not None:
            print(f"   Eredmény: {match.get('home_score')}-{match.get('away_score')}")

    # Hírek keresése
    print("\n📰 Hírek keresése...")
    news = agent.search_sports_news("football news today")

    print(f"✅ Találatok: {len(news)} hír")

    for i, article in enumerate(news[:3]):  # Első 3 hír
        print(f"\n{i+1}. {article.get('title', 'N/A')}")
        print(f"   Tartalom: {article.get('content', 'N/A')[:100]}...")
        print(f"   Forrás: {article.get('source', 'N/A')}")
        print(f"   Megbízhatóság: {article.get('confidence', 0):.2f}")

if __name__ == "__main__":
    test_google_search_agent()
