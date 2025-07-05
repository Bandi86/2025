#!/usr/bin/env python3
"""
Enhanced Google Search Agent teszt
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.agents.enhanced_google_search_agent import EnhancedGoogleSearchAgent
from src.utils.logger import Logger

def test_enhanced_google_search():
    """
    Enhanced Google Search Agent tesztelése
    """
    logger = Logger('test_enhanced_google_search')

    logger.info("Enhanced Google Search Agent teszt indítása")

    # Ügynök létrehozása
    agent = EnhancedGoogleSearchAgent()

    # Keresési kifejezések
    queries = [
        "football matches today",
        "premier league fixtures",
        "champions league results",
        "arsenal vs chelsea",
        "holnap foci meccsek"
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
                logger.info(f"     Verseny: {match.get('competition', 'N/A')}")
                logger.info(f"     Forrás: {match.get('source', 'N/A')}")
                logger.info(f"     Megbízhatóság: {match.get('confidence', 'N/A')}")
                logger.info("")

        except Exception as e:
            logger.error(f"Hiba a keresés során: {str(e)}")

        logger.info("=" * 50)

    logger.info("Enhanced Google Search Agent teszt befejezve")

if __name__ == "__main__":
    test_enhanced_google_search()
