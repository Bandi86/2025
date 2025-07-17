"""
Sports API integráció modul
"""
import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from ..config import Config

class SportsAPI:
    """
    Külső sport API-k integrációja
    """

    def __init__(self):
        self.config = Config()
        self.session = requests.Session()
        self.logger = logging.getLogger(__name__)

    def get_matches(self, date: datetime) -> List[Dict]:
        """
        Meccsek lekérése API-kból
        """
        all_matches = []

        # Football-Data.org API
        if self.config.FOOTBALL_API_KEY:
            try:
                football_matches = self._get_football_data_matches(date)
                all_matches.extend(football_matches)
            except Exception as e:
                self.logger.error(f"Football-Data API hiba: {e}")

        # The Odds API
        if self.config.ODDS_API_KEY:
            try:
                odds_matches = self._get_odds_api_matches(date)
                all_matches.extend(odds_matches)
            except Exception as e:
                self.logger.error(f"Odds API hiba: {e}")

        # Sports Data API
        if self.config.SPORTS_API_KEY:
            try:
                sports_matches = self._get_sports_data_matches(date)
                all_matches.extend(sports_matches)
            except Exception as e:
                self.logger.error(f"Sports Data API hiba: {e}")

        return all_matches

    def _get_football_data_matches(self, date: datetime) -> List[Dict]:
        """
        Football-Data.org API meccsek
        """
        matches = []

        try:
            headers = self.config.get_api_headers('football_api')

            # Premier League
            url = f"{self.config.API_ENDPOINTS['football_api']}competitions/PL/matches"
            params = {
                'dateFrom': date.strftime('%Y-%m-%d'),
                'dateTo': date.strftime('%Y-%m-%d')
            }

            response = self.session.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            for match in data.get('matches', []):
                match_data = {
                    'id': f"fd_{match['id']}",
                    'source': 'Football-Data.org',
                    'home_team': match['homeTeam']['name'],
                    'away_team': match['awayTeam']['name'],
                    'date': date.strftime('%Y-%m-%d'),
                    'time': match['utcDate'],
                    'league': match['competition']['name'],
                    'status': match['status'],
                    'api_data': match
                }
                matches.append(match_data)

            self.logger.info(f"Football-Data: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"Football-Data API hiba: {e}")

        return matches

    def _get_odds_api_matches(self, date: datetime) -> List[Dict]:
        """
        The Odds API meccsek
        """
        matches = []

        try:
            headers = {'X-API-KEY': self.config.ODDS_API_KEY}

            # Foci odds
            url = f"{self.config.API_ENDPOINTS['odds_api']}sports/soccer_epl/odds"
            params = {
                'regions': 'eu',
                'markets': 'h2h',
                'dateFormat': 'iso',
                'oddsFormat': 'decimal'
            }

            response = self.session.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            for match in data:
                match_date = datetime.fromisoformat(match['commence_time'].replace('Z', '+00:00'))

                if match_date.date() == date.date():
                    odds_data = {}

                    # Odds feldolgozás
                    for bookmaker in match.get('bookmakers', []):
                        for market in bookmaker.get('markets', []):
                            if market['key'] == 'h2h':
                                for outcome in market['outcomes']:
                                    if outcome['name'] == match['home_team']:
                                        odds_data['odds_home'] = outcome['price']
                                    elif outcome['name'] == match['away_team']:
                                        odds_data['odds_away'] = outcome['price']
                                    else:
                                        odds_data['odds_draw'] = outcome['price']

                    match_data = {
                        'id': f"odds_{match['id']}",
                        'source': 'The Odds API',
                        'home_team': match['home_team'],
                        'away_team': match['away_team'],
                        'date': date.strftime('%Y-%m-%d'),
                        'time': match['commence_time'],
                        'league': match['sport_title'],
                        'status': 'scheduled',
                        **odds_data,
                        'api_data': match
                    }
                    matches.append(match_data)

            self.logger.info(f"Odds API: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"Odds API hiba: {e}")

        return matches

    def _get_sports_data_matches(self, date: datetime) -> List[Dict]:
        """
        Sports Data API meccsek
        """
        matches = []

        try:
            headers = {'Ocp-Apim-Subscription-Key': self.config.SPORTS_API_KEY}

            # NBA meccsek
            url = f"{self.config.API_ENDPOINTS['sports_api']}nba/scores/json/GamesByDate/{date.strftime('%Y-%m-%d')}"

            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()

            for match in data:
                match_data = {
                    'id': f"sd_{match['GameID']}",
                    'source': 'Sports Data API',
                    'home_team': match['HomeTeam'],
                    'away_team': match['AwayTeam'],
                    'date': date.strftime('%Y-%m-%d'),
                    'time': match['DateTime'],
                    'league': 'NBA',
                    'status': match['Status'],
                    'api_data': match
                }
                matches.append(match_data)

            self.logger.info(f"Sports Data: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"Sports Data API hiba: {e}")

        return matches

    def get_match_details(self, match_id: str) -> Dict:
        """
        Meccs részletes adatainak lekérése
        """
        # API forrás alapján különböző lekérés
        if match_id.startswith('fd_'):
            return self._get_football_data_details(match_id)
        elif match_id.startswith('odds_'):
            return self._get_odds_api_details(match_id)
        elif match_id.startswith('sd_'):
            return self._get_sports_data_details(match_id)
        else:
            return {}

    def get_match_statistics(self, match_id: str) -> Dict:
        """
        Meccs statisztikák lekérése
        """
        # Implementálni kell az API-k alapján
        return {
            'possession': {'home': 0, 'away': 0},
            'shots': {'home': 0, 'away': 0},
            'shots_on_target': {'home': 0, 'away': 0},
            'corners': {'home': 0, 'away': 0},
            'fouls': {'home': 0, 'away': 0},
            'cards': {'home': {'yellow': 0, 'red': 0}, 'away': {'yellow': 0, 'red': 0}}
        }

    def get_match_odds(self, match_id: str) -> Dict:
        """
        Meccs odds lekérése
        """
        # Implementálni kell az API-k alapján
        return {
            'home_win': 2.50,
            'draw': 3.20,
            'away_win': 2.80,
            'over_2_5': 1.85,
            'under_2_5': 1.95,
            'both_teams_score': 1.75
        }

    def get_head_to_head(self, home_team: str, away_team: str) -> Dict:
        """
        Két csapat korábbi találkozóinak adatai
        """
        # Implementálni kell az API-k alapján
        return {
            'total_matches': 0,
            'home_wins': 0,
            'draws': 0,
            'away_wins': 0,
            'last_5_matches': [],
            'average_goals': {'home': 0, 'away': 0}
        }

    def _get_football_data_details(self, match_id: str) -> Dict:
        """
        Football-Data.org meccs részletek
        """
        # Implementálni kell
        return {}

    def _get_odds_api_details(self, match_id: str) -> Dict:
        """
        Odds API meccs részletek
        """
        # Implementálni kell
        return {}

    def _get_sports_data_details(self, match_id: str) -> Dict:
        """
        Sports Data API meccs részletek
        """
        # Implementálni kell
        return {}
