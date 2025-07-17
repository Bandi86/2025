"""
Napi Mérkőzések Ügynök - Specializált aznapi és holnapi meccsek gyűjtésére
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import time
import requests
from bs4 import BeautifulSoup
import re

from ..utils.logger import Logger
from ..config import Config
from ..utils.date_utils import DateUtils

class DailyMatchesAgent:
    """
    Specializált ügynök aznapi és holnapi meccsek gyűjtésére
    Csak a legfontosabb adatokat gyűjti: dátum, időpont, csapatok, bajnokság
    """

    def __init__(self):
        self.logger = Logger('daily_matches_agent')
        self.config = Config()
        self.date_utils = DateUtils()
        self.session = requests.Session()

        # User agent beállítás
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Támogatott sport típusok
        self.supported_sports = ['football', 'basketball', 'tennis', 'hockey']

        # Megbízható források
        self.sources = {
            'sport_api': 'https://api.sportmonks.com/v3/football/fixtures',
            'free_api': 'https://api.football-data.org/v4/matches',
            'flashscore': 'https://www.flashscore.com',
            'espn': 'https://www.espn.com'
        }

    def collect_today_matches(self, sports: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Mai meccsek gyűjtése

        Args:
            sports: Sport típusok listája (opcionális)

        Returns:
            List[Dict]: Mai meccsek listája
        """
        today = datetime.now().strftime('%Y-%m-%d')
        self.logger.info(f"Mai meccsek gyűjtése: {today}")

        return self._collect_matches_for_date(today, sports or ['football'])

    def collect_tomorrow_matches(self, sports: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Holnapi meccsek gyűjtése

        Args:
            sports: Sport típusok listája (opcionális)

        Returns:
            List[Dict]: Holnapi meccsek listája
        """
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        self.logger.info(f"Holnapi meccsek gyűjtése: {tomorrow}")

        return self._collect_matches_for_date(tomorrow, sports or ['football'])

    def collect_specific_date_matches(self, date: str, sports: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Konkrét dátum meccsek gyűjtése

        Args:
            date: Dátum YYYY-MM-DD formátumban
            sports: Sport típusok listája (opcionális)

        Returns:
            List[Dict]: Meccsek listája
        """
        self.logger.info(f"Meccsek gyűjtése dátumra: {date}")

        return self._collect_matches_for_date(date, sports or ['football'])

    def _collect_matches_for_date(self, date: str, sports: List[str]) -> List[Dict[str, Any]]:
        """
        Meccsek gyűjtése egy konkrét dátumra

        Args:
            date: Dátum YYYY-MM-DD formátumban
            sports: Sport típusok listája

        Returns:
            List[Dict]: Meccsek listája
        """
        all_matches = []

        for sport in sports:
            if sport in self.supported_sports:
                try:
                    # Próbálunk különböző forrásokból gyűjteni
                    sport_matches = self._collect_from_multiple_sources(date, sport)
                    all_matches.extend(sport_matches)

                    self.logger.info(f"{sport} - {len(sport_matches)} meccs találva")

                except Exception as e:
                    self.logger.error(f"Hiba {sport} adatgyűjtés során: {str(e)}")

        # Duplikátumok eltávolítása
        unique_matches = self._remove_duplicates(all_matches)

        # Meccsek rendezése időpont szerint
        sorted_matches = sorted(unique_matches, key=lambda x: x.get('time', '00:00'))

        self.logger.info(f"Összesen {len(sorted_matches)} egyedi meccs találva {date} dátumra")

        return sorted_matches

    def _collect_from_multiple_sources(self, date: str, sport: str) -> List[Dict[str, Any]]:
        """
        Adatok gyűjtése több forrásból

        Args:
            date: Dátum
            sport: Sport típus

        Returns:
            List[Dict]: Meccsek listája
        """
        matches = []

        # 1. Próbálkozás ingyenes API-val
        try:
            api_matches = self._collect_from_free_api(date, sport)
            matches.extend(api_matches)
            self.logger.info(f"API forrás - {len(api_matches)} meccs")
        except Exception as e:
            self.logger.warning(f"API forrás sikertelen: {str(e)}")

        # 2. Web scraping alternatíva
        try:
            scraped_matches = self._collect_from_web_scraping(date, sport)
            matches.extend(scraped_matches)
            self.logger.info(f"Web scraping - {len(scraped_matches)} meccs")
        except Exception as e:
            self.logger.warning(f"Web scraping sikertelen: {str(e)}")

        # 3. Demo adatok ha minden más sikertelen
        if not matches:
            demo_matches = self._get_demo_matches(date, sport)
            matches.extend(demo_matches)
            self.logger.info(f"Demo adatok - {len(demo_matches)} meccs")

        return matches

    def _collect_from_free_api(self, date: str, sport: str) -> List[Dict[str, Any]]:
        """
        Ingyenes API-ból adatgyűjtés

        Args:
            date: Dátum
            sport: Sport típus

        Returns:
            List[Dict]: Meccsek listája
        """
        matches = []

        if sport == 'football':
            try:
                # Football-data.org API próbálkozás
                url = f"https://api.football-data.org/v4/matches"
                params = {
                    'dateFrom': date,
                    'dateTo': date
                }

                headers = {
                    'X-Auth-Token': self.config.get('football_data_api_key', 'demo_key')
                }

                response = self.session.get(url, params=params, headers=headers, timeout=10)

                if response.status_code == 200:
                    data = response.json()

                    for match in data.get('matches', []):
                        match_data = {
                            'id': str(match.get('id')),
                            'date': date,
                            'time': match.get('utcDate', '').split('T')[1][:5] if match.get('utcDate') else 'TBD',
                            'home_team': match.get('homeTeam', {}).get('name', 'Unknown'),
                            'away_team': match.get('awayTeam', {}).get('name', 'Unknown'),
                            'league': match.get('competition', {}).get('name', 'Unknown'),
                            'sport': sport,
                            'status': match.get('status', 'SCHEDULED'),
                            'source': 'football-data.org'
                        }
                        matches.append(match_data)

            except Exception as e:
                self.logger.error(f"Football API hiba: {str(e)}")

        return matches

    def _collect_from_web_scraping(self, date: str, sport: str) -> List[Dict[str, Any]]:
        """
        Web scraping adatgyűjtés

        Args:
            date: Dátum
            sport: Sport típus

        Returns:
            List[Dict]: Meccsek listája
        """
        matches = []

        try:
            # Egyszerű web scraping demonstráció
            # Valós implementációban itt különböző sport oldalakat scrapelnénk

            # ESPN példa
            if sport == 'football':
                # Ez csak egy példa struktura
                demo_data = self._get_demo_web_data(date, sport)
                matches.extend(demo_data)

        except Exception as e:
            self.logger.error(f"Web scraping hiba: {str(e)}")

        return matches

    def _get_demo_matches(self, date: str, sport: str) -> List[Dict[str, Any]]:
        """
        Demo meccsek generálása amikor valós adatok nem érhetők el

        Args:
            date: Dátum
            sport: Sport típus

        Returns:
            List[Dict]: Demo meccsek listája
        """
        demo_matches = []

        if sport == 'football':
            demo_teams = [
                ('Manchester United', 'Liverpool'),
                ('Barcelona', 'Real Madrid'),
                ('Bayern Munich', 'Borussia Dortmund'),
                ('Chelsea', 'Arsenal'),
                ('Juventus', 'AC Milan'),
                ('PSG', 'Marseille')
            ]

            for i, (home, away) in enumerate(demo_teams[:4]):  # Maximum 4 demo meccs
                match_data = {
                    'id': f"demo_{date}_{i}",
                    'date': date,
                    'time': f"{15 + i*2}:{30 if i%2 else 0:02d}",
                    'home_team': home,
                    'away_team': away,
                    'league': 'Demo Liga',
                    'sport': sport,
                    'status': 'SCHEDULED',
                    'source': 'demo_data'
                }
                demo_matches.append(match_data)

        return demo_matches

    def _get_demo_web_data(self, date: str, sport: str) -> List[Dict[str, Any]]:
        """
        Demo web scraping adatok

        Args:
            date: Dátum
            sport: Sport típus

        Returns:
            List[Dict]: Demo meccsek listája
        """
        return self._get_demo_matches(date, sport)

    def _remove_duplicates(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Duplikátumok eltávolítása

        Args:
            matches: Meccsek listája

        Returns:
            List[Dict]: Egyedi meccsek listája
        """
        seen = set()
        unique_matches = []

        for match in matches:
            # Kulcs létrehozása a duplikátum ellenőrzéshez
            key = (
                match.get('home_team', '').lower(),
                match.get('away_team', '').lower(),
                match.get('date', ''),
                match.get('time', '')
            )

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def get_status_summary(self, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Meccsek állapotának összegzése

        Args:
            matches: Meccsek listája

        Returns:
            Dict: Állapot összegzés
        """
        if not matches:
            return {'total': 0, 'by_sport': {}, 'by_league': {}, 'by_status': {}}

        by_sport = {}
        by_league = {}
        by_status = {}

        for match in matches:
            sport = match.get('sport', 'unknown')
            league = match.get('league', 'unknown')
            status = match.get('status', 'unknown')

            by_sport[sport] = by_sport.get(sport, 0) + 1
            by_league[league] = by_league.get(league, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1

        return {
            'total': len(matches),
            'by_sport': by_sport,
            'by_league': by_league,
            'by_status': by_status,
            'collection_time': datetime.now().isoformat()
        }
