#!/usr/bin/env python3
"""
Simplified Enhanced Google Search Agent teszt
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.agents.simplified_enhanced_google_search_agent import SimplifiedEnhancedGoogleSearchAgent
from src.utils.logger import Logger

def test_simplified_enhanced_google_search():
    """
    Simplified Enhanced Google Search Agent tesztelése
    """
    logger = Logger('test_simplified_enhanced_google_search')

    logger.info("Simplified Enhanced Google Search Agent teszt indítása")

    # Ügynök létrehozása
    agent = SimplifiedEnhancedGoogleSearchAgent()

    # Keresési kifejezések
    queries = [
        "football matches today",
        "premier league fixtures",
        "champions league results",
        "arsenal vs chelsea"
    ]

    for query in queries:
        logger.info(f"Keresés: '{query}'")

        try:
            # Keresés végrehajtása
            matches = agent.search_football_matches(query)

            logger.info(f"Találatok száma: {len(matches)}")

            # Eredmények kiírása
            for i, match in enumerate(matches[:5]):  # Első 5 találat
                logger.info(f"  {i+1}. {match.get('home_team', 'N/A')} vs {match.get('away_team', 'N/A')}")
                logger.info(f"     Dátum: {match.get('date', 'N/A')}")
                logger.info(f"     Status: {match.get('status', 'N/A')}")
                logger.info(f"     Verseny: {match.get('competition', 'N/A')}")
                logger.info(f"     Forrás: {match.get('source', 'N/A')}")
                logger.info(f"     Megbízhatóság: {match.get('confidence', 'N/A')}")
                if match.get('home_score') is not None:
                    logger.info(f"     Eredmény: {match.get('home_score')}-{match.get('away_score')}")
                logger.info("")

        except Exception as e:
            logger.error(f"Hiba a keresés során: {str(e)}")

        logger.info("=" * 50)

    # Hírek tesztelése
    logger.info("Sport hírek tesztelése")
    try:
        news = agent.search_sports_news("football news today")
        logger.info(f"Hírek száma: {len(news)}")

        for i, article in enumerate(news[:3]):  # Első 3 hír
            logger.info(f"  {i+1}. {article.get('title', 'N/A')}")
            logger.info(f"     Forrás: {article.get('source', 'N/A')}")
            logger.info("")
    except Exception as e:
        logger.error(f"Hiba a hírek keresése során: {str(e)}")

    logger.info("Simplified Enhanced Google Search Agent teszt befejezve")

if __name__ == "__main__":
    test_simplified_enhanced_google_search()
