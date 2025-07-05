"""
A mérkőzés menetrendek (fixtures) gyűjtésének fő logikája.
"""

import requests
from bs4 import BeautifulSoup
import random
import time
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from ..utils.logger import Logger
from ..config import Config
from .sources import (
    collect_from_bbc_sport, collect_from_espn, collect_from_sky_sports,
    collect_from_goal_com, collect_from_livescore, collect_from_flashscore,
    collect_from_sofascore, collect_from_transfermarkt
)
from .parser import (
    extract_fixture_from_element, extract_fixtures_from_text
)
from .utils import (
    is_football_content, contains_date_keywords, parse_fixture_text,
    clean_team_name, parse_match_time, extract_competition, extract_odds,
    remove_duplicates, sort_by_time
)

class MatchFixturesCollector:
    """
    Specializált mérkőzés fixture-ök gyűjtője
    Csak mai és holnapi meccsekre fókuszál
    """
    def __init__(self):
        self.logger = Logger('match_fixtures_collector')
        self.config = Config()
        self.session = requests.Session()
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]

    def collect_todays_fixtures(self) -> List[Dict[str, Any]]:
        """
        Mai mérkőzések gyűjtése
        """
        today = datetime.now().strftime('%Y-%m-%d')
        self.logger.info(f"Mai mérkőzések gyűjtése: {today}")
        return self._collect_fixtures_for_date(today, "today")

    def collect_tomorrows_fixtures(self) -> List[Dict[str, Any]]:
        """
        Holnapi mérkőzések gyűjtése
        """
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        self.logger.info(f"Holnapi mérkőzések gyűjtése: {tomorrow}")
        return self._collect_fixtures_for_date(tomorrow, "tomorrow")

    def collect_fixtures_for_date_range(self, days_ahead: int = 2) -> List[Dict[str, Any]]:
        """
        Adott napok előre mérkőzések gyűjtése
        Args:
            days_ahead: Hány napra előre (default: 2 = ma + holnap)
        """
        all_fixtures = []
        for day in range(days_ahead):
            date = (datetime.now() + timedelta(days=day)).strftime('%Y-%m-%d')
            day_name = "today" if day == 0 else "tomorrow" if day == 1 else f"day+{day}"
            self.logger.info(f"Mérkőzések gyűjtése {day_name} ({date})")
            fixtures = self._collect_fixtures_for_date(date, day_name)
            all_fixtures.extend(fixtures)
            if day < days_ahead - 1:
                time.sleep(random.uniform(1, 3))
        return all_fixtures

    def _collect_fixtures_for_date(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Adott dátumra mérkőzések gyűjtése több forrásból
        """
        try:
            all_fixtures = []
            sources = [
                collect_from_bbc_sport,
                collect_from_espn,
                collect_from_sky_sports,
                collect_from_goal_com,
                collect_from_livescore,
                collect_from_flashscore,
                collect_from_sofascore,
                collect_from_transfermarkt
            ]
            for source_func in sources:
                try:
                    self.logger.info(f"Gyűjtés {source_func.__name__} forrásból")
                    fixtures = source_func(date, day_name, self)
                    if fixtures:
                        all_fixtures.extend(fixtures)
                        self.logger.info(f"{source_func.__name__}: {len(fixtures)} mérkőzés találva")
                    time.sleep(random.uniform(0.5, 2))
                except Exception as e:
                    self.logger.warning(f"Hiba {source_func.__name__} gyűjtés során: {str(e)}")
                    continue
            unique_fixtures = remove_duplicates(all_fixtures)
            sorted_fixtures = sort_by_time(unique_fixtures)
            self.logger.info(f"Összesen {len(sorted_fixtures)} egyedi mérkőzés {day_name} ({date})")
            return sorted_fixtures
        except Exception as e:
            self.logger.error(f"Hiba a mérkőzések gyűjtése során {date}: {str(e)}")
            return []

    def get_fixture_summary(self, fixtures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Mérkőzések összefoglalása
        """
        try:
            if not fixtures:
                return {
                    'total_matches': 0,
                    'competitions': [],
                    'sources': [],
                    'time_slots': []
                }
            competitions = list(set([f.get('competition') for f in fixtures if f.get('competition')]))
            sources = list(set([f.get('source') for f in fixtures if f.get('source')]))
            times = [f.get('time') for f in fixtures if f.get('time')]
            return {
                'total_matches': len(fixtures),
                'competitions': competitions,
                'sources': sources,
                'time_slots': sorted(list(set(times))) if times else [],
                'earliest_match': min(times) if times else None,
                'latest_match': max(times) if times else None
            }
        except Exception as e:
            self.logger.warning(f"Hiba összefoglaló generálás során: {str(e)}")
            return {'total_matches': len(fixtures)}
