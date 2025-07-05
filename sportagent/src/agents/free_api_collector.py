"""
Free API integráció sport adatokhoz
Ingyenes sport API-k használata
"""

import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import time

from ..utils.logger import Logger

logger = Logger().get_logger()

class FreeAPICollector:
    """
    Ingyenes sport API-k integrálása
    """

    def __init__(self):
        self.logger = Logger().get_logger()
        self.session = requests.Session()

        # Free API endpoints
        self.apis = {
            'football_data': {
                'base_url': 'https://api.football-data.org/v4',
                'headers': {},  # No key needed for some endpoints
                'endpoints': {
                    'competitions': '/competitions',
                    'matches': '/matches',
                    'teams': '/teams'
                }
            },
            'api_football_free': {
                'base_url': 'https://api.api-football.com/v3',
                'headers': {},  # Free tier available
                'endpoints': {
                    'fixtures': '/fixtures',
                    'leagues': '/leagues',
                    'teams': '/teams'
                }
            },
            'sports_api': {
                'base_url': 'https://www.thesportsdb.com/api/v1/json/3',
                'headers': {},
                'endpoints': {
                    'events': '/eventsday.php',
                    'leagues': '/all_leagues.php',
                    'teams': '/search_all_teams.php'
                }
            }
        }

        logger.info("Free API Collector inicializálva")

    def collect_free_api_data(self, date: str = None, leagues: List[str] = None) -> Dict[str, Any]:
        """
        Free API-k használata adatgyűjtésre
        """
        logger.info("Free API adatgyűjtés kezdése...")

        target_date = self._parse_date(date) if date else datetime.now().date()

        results = {
            'matches': [],
            'leagues': [],
            'teams': [],
            'sources_used': [],
            'last_updated': datetime.now().isoformat()
        }

        # TheSportsDB API (teljesen ingyenes)
        sports_db_data = self._collect_from_sports_db(target_date)
        if sports_db_data:
            results['matches'].extend(sports_db_data.get('matches', []))
            results['sources_used'].append('thesportsdb')

        # Football-Data.org (korlátozott ingyenes)
        football_data = self._collect_from_football_data(target_date)
        if football_data:
            results['matches'].extend(football_data.get('matches', []))
            results['sources_used'].append('football-data.org')

        # OpenLigaDB (német liga, ingyenes)
        openliga_data = self._collect_from_openliga(target_date)
        if openliga_data:
            results['matches'].extend(openliga_data.get('matches', []))
            results['sources_used'].append('openligadb')

        logger.info(f"Free API adatgyűjtés befejezve: {len(results['matches'])} meccs")
        return results

    def _collect_from_sports_db(self, target_date: datetime.date) -> Dict[str, Any]:
        """
        TheSportsDB API adatgyűjtés
        """
        try:
            logger.info("TheSportsDB API adatgyűjtés...")

            # Napi események
            url = f"{self.apis['sports_api']['base_url']}/eventsday.php"
            params = {
                'd': target_date.strftime('%Y-%m-%d'),
                's': 'Soccer'  # Sport type
            }

            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            matches = []

            if data.get('events'):
                for event in data['events']:
                    match = self._parse_sports_db_event(event)
                    if match:
                        matches.append(match)

            logger.info(f"✅ TheSportsDB: {len(matches)} meccs")
            return {'matches': matches}

        except Exception as e:
            logger.error(f"TheSportsDB API hiba: {e}")
            return {}

    def _collect_from_football_data(self, target_date: datetime.date) -> Dict[str, Any]:
        """
        Football-Data.org API adatgyűjtés
        """
        try:
            logger.info("Football-Data.org API adatgyűjtés...")

            # Public endpoints (no API key needed for some)
            url = f"{self.apis['football_data']['base_url']}/matches"
            params = {
                'dateFrom': target_date.strftime('%Y-%m-%d'),
                'dateTo': target_date.strftime('%Y-%m-%d')
            }

            response = self.session.get(url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                matches = []

                if data.get('matches'):
                    for match in data['matches']:
                        parsed_match = self._parse_football_data_match(match)
                        if parsed_match:
                            matches.append(parsed_match)

                logger.info(f"✅ Football-Data.org: {len(matches)} meccs")
                return {'matches': matches}
            else:
                logger.warning(f"Football-Data.org API limitált: {response.status_code}")
                return {}

        except Exception as e:
            logger.error(f"Football-Data.org API hiba: {e}")
            return {}

    def _collect_from_openliga(self, target_date: datetime.date) -> Dict[str, Any]:
        """
        OpenLigaDB API adatgyűjtés (német ligák)
        """
        try:
            logger.info("OpenLigaDB API adatgyűjtés...")

            # Bundesliga (bl1) aktuális szezon
            url = "https://api.openligadb.de/getmatchdata/bl1"

            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            data = response.json()
            matches = []

            for match in data:
                parsed_match = self._parse_openliga_match(match, target_date)
                if parsed_match:
                    matches.append(parsed_match)

            logger.info(f"✅ OpenLigaDB: {len(matches)} meccs")
            return {'matches': matches}

        except Exception as e:
            logger.error(f"OpenLigaDB API hiba: {e}")
            return {}

    def _parse_sports_db_event(self, event: Dict) -> Optional[Dict]:
        """
        TheSportsDB esemény parsing
        """
        try:
            # Csak jövőbeli meccsek
            event_date = event.get('dateEvent')
            if not event_date:
                return None

            match_date = datetime.strptime(event_date, '%Y-%m-%d').date()
            if match_date < datetime.now().date():
                return None

            return {
                'home_team': event.get('strHomeTeam', ''),
                'away_team': event.get('strAwayTeam', ''),
                'date': event_date,
                'time': event.get('strTime', '15:00'),
                'league': event.get('strLeague', 'Unknown'),
                'status': 'scheduled',
                'source': 'thesportsdb',
                'event_id': event.get('idEvent'),
                'confidence_score': 0.8,
                'data_completeness': 0.6
            }

        except Exception as e:
            logger.error(f"TheSportsDB parsing hiba: {e}")
            return None

    def _parse_football_data_match(self, match: Dict) -> Optional[Dict]:
        """
        Football-Data.org meccs parsing
        """
        try:
            utc_date = match.get('utcDate')
            if not utc_date:
                return None

            match_datetime = datetime.fromisoformat(utc_date.replace('Z', '+00:00'))

            return {
                'home_team': match.get('homeTeam', {}).get('name', ''),
                'away_team': match.get('awayTeam', {}).get('name', ''),
                'date': match_datetime.strftime('%Y-%m-%d'),
                'time': match_datetime.strftime('%H:%M'),
                'league': match.get('competition', {}).get('name', 'Unknown'),
                'status': match.get('status', 'scheduled'),
                'source': 'football-data.org',
                'match_id': match.get('id'),
                'confidence_score': 0.9,
                'data_completeness': 0.8
            }

        except Exception as e:
            logger.error(f"Football-Data parsing hiba: {e}")
            return None

    def _parse_openliga_match(self, match: Dict, target_date: datetime.date) -> Optional[Dict]:
        """
        OpenLigaDB meccs parsing
        """
        try:
            match_datetime_str = match.get('matchDateTime')
            if not match_datetime_str:
                return None

            match_datetime = datetime.fromisoformat(match_datetime_str.replace('Z', '+00:00'))
            match_date = match_datetime.date()

            # Csak a célnap körüli meccsek
            if abs((match_date - target_date).days) > 7:
                return None

            team1 = match.get('team1', {}).get('teamName', '')
            team2 = match.get('team2', {}).get('teamName', '')

            return {
                'home_team': team1,
                'away_team': team2,
                'date': match_date.strftime('%Y-%m-%d'),
                'time': match_datetime.strftime('%H:%M'),
                'league': 'Bundesliga',
                'status': 'scheduled',
                'source': 'openligadb',
                'match_id': match.get('matchID'),
                'confidence_score': 0.9,
                'data_completeness': 0.7
            }

        except Exception as e:
            logger.error(f"OpenLigaDB parsing hiba: {e}")
            return None

    def _parse_date(self, date_str: str) -> datetime.date:
        """
        Dátum string parsing
        """
        try:
            if date_str.lower() == 'today':
                return datetime.now().date()
            elif date_str.lower() == 'tomorrow':
                return datetime.now().date() + timedelta(days=1)
            else:
                return datetime.strptime(date_str, '%Y-%m-%d').date()
        except:
            return datetime.now().date()

    def test_api_endpoints(self) -> Dict[str, bool]:
        """
        API endpoint-ok tesztelése
        """
        results = {}

        # TheSportsDB teszt
        try:
            url = f"{self.apis['sports_api']['base_url']}/eventsday.php"
            response = self.session.get(url, params={'d': '2024-01-01', 's': 'Soccer'}, timeout=5)
            results['thesportsdb'] = response.status_code == 200
        except:
            results['thesportsdb'] = False

        # Football-Data.org teszt
        try:
            url = f"{self.apis['football_data']['base_url']}/competitions"
            response = self.session.get(url, timeout=5)
            results['football-data'] = response.status_code in [200, 429]  # 429 = rate limited but working
        except:
            results['football-data'] = False

        # OpenLigaDB teszt
        try:
            url = "https://api.openligadb.de/getavailableleagues"
            response = self.session.get(url, timeout=5)
            results['openligadb'] = response.status_code == 200
        except:
            results['openligadb'] = False

        return results

    def get_available_leagues(self) -> List[str]:
        """
        Elérhető ligák listája
        """
        leagues = []

        # TheSportsDB ligák
        try:
            url = f"{self.apis['sports_api']['base_url']}/all_leagues.php"
            response = self.session.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('leagues'):
                    for league in data['leagues']:
                        if league.get('strSport') == 'Soccer':
                            leagues.append(league.get('strLeague', ''))
        except:
            pass

        # Alapértelmezett ligák
        default_leagues = [
            'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
            'Champions League', 'Europa League', 'Championship'
        ]

        leagues.extend(default_leagues)
        return list(set(leagues))  # Duplikátumok eltávolítása

    def get_api_status(self) -> Dict[str, Any]:
        """
        API-k állapotának ellenőrzése
        """
        status = {
            'timestamp': datetime.now().isoformat(),
            'apis': self.test_api_endpoints(),
            'total_working': 0,
            'recommendations': []
        }

        status['total_working'] = sum(1 for working in status['apis'].values() if working)

        if status['total_working'] == 0:
            status['recommendations'].append("Nincs működő API - RSS feed-ek használata javasolt")
        elif status['total_working'] < len(status['apis']):
            status['recommendations'].append("Részleges API hozzáférés - hibrid adatgyűjtés javasolt")
        else:
            status['recommendations'].append("Minden API működik - teljes adatgyűjtés lehetséges")

        return status
