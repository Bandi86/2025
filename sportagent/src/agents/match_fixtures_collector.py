"""
Match Fixtures Collector - Specializált mérkőzés fixture-ök gyűjtése
Csak mai és holnapi meccsekre koncentrál: dátum, időpont, csapatok, bajnokság, odds
"""
import requests
from bs4 import BeautifulSoup
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time
import random
from urllib.parse import quote_plus
import json

from ..utils.logger import Logger
from ..config import Config

class MatchFixturesCollector:
    """
    Specializált mérkőzés fixture-ök gyűjtője
    Csak mai és holnapi meccsekre fókuszál
    """

    def __init__(self):
        self.logger = Logger('match_fixtures_collector')
        self.config = Config()
        self.session = requests.Session()

        # User agent pool
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

            # Rövid várakozás a kérések között
            if day < days_ahead - 1:
                time.sleep(random.uniform(1, 3))

        return all_fixtures

    def _collect_fixtures_for_date(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Adott dátumra mérkőzések gyűjtése több forrásból
        """
        try:
            all_fixtures = []

            # Különböző források prioritás szerint
            sources = [
                self._collect_from_bbc_sport,
                self._collect_from_espn,
                self._collect_from_sky_sports,
                self._collect_from_goal_com,
                self._collect_from_livescore,
                self._collect_from_flashscore,
                self._collect_from_sofascore,
                self._collect_from_transfermarkt
            ]

            for source_func in sources:
                try:
                    self.logger.info(f"Gyűjtés {source_func.__name__} forrásból")
                    fixtures = source_func(date, day_name)

                    if fixtures:
                        all_fixtures.extend(fixtures)
                        self.logger.info(f"{source_func.__name__}: {len(fixtures)} mérkőzés találva")

                    # Rövid várakozás
                    time.sleep(random.uniform(0.5, 2))

                except Exception as e:
                    self.logger.warning(f"Hiba {source_func.__name__} gyűjtés során: {str(e)}")
                    continue

            # Duplikátumok eltávolítása
            unique_fixtures = self._remove_duplicates(all_fixtures)

            # Időpont szerint rendezés
            sorted_fixtures = self._sort_by_time(unique_fixtures)

            self.logger.info(f"Összesen {len(sorted_fixtures)} egyedi mérkőzés {day_name} ({date})")
            return sorted_fixtures

        except Exception as e:
            self.logger.error(f"Hiba a mérkőzések gyűjtése során {date}: {str(e)}")
            return []

    def _collect_from_bbc_sport(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        BBC Sport mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.bbc.com/sport/football/fixtures',
                'https://www.bbc.com/sport/football',
                'https://www.bbc.com/sport/football/scores-fixtures'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')

                        # BBC fixture specifikus parseolás
                        fixtures.extend(self._parse_bbc_fixtures(soup, date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba BBC URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba BBC Sport gyűjtés során: {str(e)}")
            return []

    def _parse_bbc_fixtures(self, soup: BeautifulSoup, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        BBC HTML parseolása mérkőzésekhez
        """
        fixtures = []

        try:
            # Különböző BBC fixture formátumok
            selectors = [
                '.fixture-team',
                '.fixture-list',
                '.match-list',
                '.fixture',
                '.game',
                '.match'
            ]

            for selector in selectors:
                elements = soup.find_all(class_=selector)

                for element in elements:
                    try:
                        fixture = self._extract_fixture_from_element(element, 'bbc_sport', date, day_name)
                        if fixture:
                            fixtures.append(fixture)
                    except Exception as e:
                        continue

            # Általános szöveg keresés is
            fixtures.extend(self._extract_fixtures_from_text(soup, 'bbc_sport', date, day_name))

        except Exception as e:
            self.logger.warning(f"Hiba BBC parseolás során: {str(e)}")

        return fixtures

    def _collect_from_espn(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        ESPN mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.espn.com/soccer/fixtures',
                'https://www.espn.com/soccer/',
                'https://www.espn.com/soccer/schedule'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._parse_espn_fixtures(soup, date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba ESPN URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba ESPN gyűjtés során: {str(e)}")
            return []

    def _parse_espn_fixtures(self, soup: BeautifulSoup, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        ESPN HTML parseolása
        """
        fixtures = []

        try:
            # ESPN specifikus selectorok
            selectors = [
                '.scoreboard',
                '.schedule-item',
                '.game-strip',
                '.event-card'
            ]

            for selector in selectors:
                elements = soup.find_all(class_=selector)

                for element in elements:
                    try:
                        fixture = self._extract_fixture_from_element(element, 'espn', date, day_name)
                        if fixture:
                            fixtures.append(fixture)
                    except Exception as e:
                        continue

            fixtures.extend(self._extract_fixtures_from_text(soup, 'espn', date, day_name))

        except Exception as e:
            self.logger.warning(f"Hiba ESPN parseolás során: {str(e)}")

        return fixtures

    def _collect_from_sky_sports(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Sky Sports mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.skysports.com/football/fixtures',
                'https://www.skysports.com/football',
                'https://www.skysports.com/football/live-scores'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._parse_sky_sports_fixtures(soup, date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba Sky Sports URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba Sky Sports gyűjtés során: {str(e)}")
            return []

    def _parse_sky_sports_fixtures(self, soup: BeautifulSoup, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Sky Sports HTML parseolása
        """
        fixtures = []

        try:
            selectors = [
                '.fixres__item',
                '.match-fixture',
                '.fixture-list-item'
            ]

            for selector in selectors:
                elements = soup.find_all(class_=selector)

                for element in elements:
                    try:
                        fixture = self._extract_fixture_from_element(element, 'sky_sports', date, day_name)
                        if fixture:
                            fixtures.append(fixture)
                    except Exception as e:
                        continue

            fixtures.extend(self._extract_fixtures_from_text(soup, 'sky_sports', date, day_name))

        except Exception as e:
            self.logger.warning(f"Hiba Sky Sports parseolás során: {str(e)}")

        return fixtures

    def _collect_from_goal_com(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Goal.com mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.goal.com/en/fixtures',
                'https://www.goal.com/en',
                'https://www.goal.com/en/live-scores'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._parse_goal_fixtures(soup, date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba Goal.com URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba Goal.com gyűjtés során: {str(e)}")
            return []

    def _parse_goal_fixtures(self, soup: BeautifulSoup, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Goal.com HTML parseolása
        """
        fixtures = []

        try:
            fixtures.extend(self._extract_fixtures_from_text(soup, 'goal_com', date, day_name))

        except Exception as e:
            self.logger.warning(f"Hiba Goal.com parseolás során: {str(e)}")

        return fixtures

    def _collect_from_livescore(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        LiveScore mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.livescore.com/en/football/',
                'https://www.livescore.com/'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._extract_fixtures_from_text(soup, 'livescore', date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba LiveScore URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba LiveScore gyűjtés során: {str(e)}")
            return []

    def _collect_from_flashscore(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        FlashScore mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.flashscore.com/',
                'https://www.flashscore.com/football/'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._extract_fixtures_from_text(soup, 'flashscore', date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba FlashScore URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba FlashScore gyűjtés során: {str(e)}")
            return []

    def _collect_from_sofascore(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        SofaScore mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.sofascore.com/',
                'https://www.sofascore.com/football'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._extract_fixtures_from_text(soup, 'sofascore', date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba SofaScore URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba SofaScore gyűjtés során: {str(e)}")
            return []

    def _collect_from_transfermarkt(self, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Transfermarkt mérkőzések gyűjtése
        """
        try:
            urls = [
                'https://www.transfermarkt.com/',
                'https://www.transfermarkt.com/premier-league/spieltag/wettbewerb/GB1'
            ]

            fixtures = []

            for url in urls:
                try:
                    headers = self._get_headers()
                    response = requests.get(url, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        fixtures.extend(self._extract_fixtures_from_text(soup, 'transfermarkt', date, day_name))

                except Exception as e:
                    self.logger.warning(f"Hiba Transfermarkt URL {url}: {str(e)}")
                    continue

            return fixtures

        except Exception as e:
            self.logger.warning(f"Hiba Transfermarkt gyűjtés során: {str(e)}")
            return []

    def _extract_fixture_from_element(self, element, source: str, date: str, day_name: str) -> Optional[Dict[str, Any]]:
        """
        HTML elemből mérkőzés adatok kinyerése
        """
        try:
            # Elem szövegének kinyerése
            text = element.get_text(strip=True)

            if len(text) < 10 or len(text) > 300:
                return None

            # Sport tartalom ellenőrzés
            if not self._is_football_content(text):
                return None

            # Mérkőzés adatok kinyerése
            fixture = self._parse_fixture_text(text, source, date, day_name)

            # Időpont keresése az elemben
            if fixture:
                time_elem = element.find(class_=re.compile(r'time|kick.*off|start'))
                if time_elem:
                    time_text = time_elem.get_text(strip=True)
                    parsed_time = self._parse_match_time(time_text)
                    if parsed_time:
                        fixture['time'] = parsed_time

            return fixture

        except Exception as e:
            self.logger.warning(f"Hiba elem parseolás során: {str(e)}")
            return None

    def _extract_fixtures_from_text(self, soup: BeautifulSoup, source: str, date: str, day_name: str) -> List[Dict[str, Any]]:
        """
        Általános szöveg alapú mérkőzés kinyerés
        """
        fixtures = []

        try:
            # Minden szöveges elem átnézése
            elements = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'div', 'span', 'p', 'a'])

            for element in elements:
                try:
                    text = element.get_text(strip=True)

                    # Hossz ellenőrzés
                    if len(text) < 15 or len(text) > 200:
                        continue

                    # Football tartalom ellenőrzés
                    if not self._is_football_content(text):
                        continue

                    # Mai/holnapi kulcsszavak keresése
                    if not self._contains_date_keywords(text, day_name):
                        continue

                    # Mérkőzés parseolása
                    fixture = self._parse_fixture_text(text, source, date, day_name)
                    if fixture:
                        fixtures.append(fixture)

                except Exception as e:
                    continue

        except Exception as e:
            self.logger.warning(f"Hiba szöveg alapú kinyerés során: {str(e)}")

        return fixtures

    def _is_football_content(self, text: str) -> bool:
        """
        Football tartalom ellenőrzés
        """
        football_keywords = [
            'vs', 'v', 'against', 'match', 'fixture', 'kick off', 'kickoff',
            'premier league', 'champions league', 'europa league', 'la liga',
            'serie a', 'bundesliga', 'ligue 1', 'fa cup', 'league cup',
            'arsenal', 'chelsea', 'liverpool', 'manchester', 'tottenham',
            'barcelona', 'real madrid', 'bayern', 'juventus', 'psg',
            'football', 'soccer', 'goal', 'penalty', 'referee'
        ]

        text_lower = text.lower()
        return any(keyword in text_lower for keyword in football_keywords)

    def _contains_date_keywords(self, text: str, day_name: str) -> bool:
        """
        Dátum kulcsszavak ellenőrzése
        """
        text_lower = text.lower()

        if day_name == "today":
            today_keywords = ['today', 'tonight', 'this evening', 'ma', 'ma este']
            if any(keyword in text_lower for keyword in today_keywords):
                return True

        if day_name == "tomorrow":
            tomorrow_keywords = ['tomorrow', 'holnap']
            if any(keyword in text_lower for keyword in tomorrow_keywords):
                return True

        # Időpont minták
        time_patterns = [
            r'\d{1,2}:\d{2}',  # 15:30
            r'\d{1,2}\.\d{2}',  # 15.30
            r'\d{1,2}am|\d{1,2}pm',  # 3pm
        ]

        for pattern in time_patterns:
            if re.search(pattern, text_lower):
                return True

        return False

    def _parse_fixture_text(self, text: str, source: str, date: str, day_name: str) -> Optional[Dict[str, Any]]:
        """
        Szövegből mérkőzés adatok parseolása
        """
        try:
            # Csapat nevek keresése
            vs_patterns = [
                r'([A-Za-z\s]+)\s+(?:vs?\.?|v\.?|against)\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s*[-–—]\s*([A-Za-z\s]+)',
            ]

            home_team = None
            away_team = None

            for pattern in vs_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    home_team = match.group(1).strip()
                    away_team = match.group(2).strip()
                    break

            if not home_team or not away_team:
                return None

            # Csapat nevek tisztítása
            home_team = self._clean_team_name(home_team)
            away_team = self._clean_team_name(away_team)

            if not home_team or not away_team:
                return None

            # Időpont keresése
            match_time = self._parse_match_time(text)

            # Bajnokság keresése
            competition = self._extract_competition(text)

            # Odds keresése
            odds = self._extract_odds(text)

            return {
                'date': date,
                'time': match_time,
                'home_team': home_team,
                'away_team': away_team,
                'competition': competition,
                'odds': odds,
                'source': source,
                'confidence': 0.8,
                'day_name': day_name,
                'raw_text': text[:100]  # Debug célra
            }

        except Exception as e:
            self.logger.warning(f"Hiba fixture parseolás során: {str(e)}")
            return None

    def _clean_team_name(self, team: str) -> Optional[str]:
        """
        Csapat név tisztítása
        """
        if not team:
            return None

        # Tisztítás
        team = re.sub(r'[^\w\s]', '', team).strip()

        # Túl rövid vagy túl hosszú nevek kiszűrése
        if len(team) < 3 or len(team) > 30:
            return None

        # Ismert csapat nevek validálása
        known_teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United',
            'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
            'Barcelona', 'Real Madrid', 'Atletico Madrid', 'Valencia', 'Sevilla',
            'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
            'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma',
            'PSG', 'Monaco', 'Lyon', 'Marseille'
        ]

        # Részleges egyezés keresése
        team_lower = team.lower()
        for known in known_teams:
            if known.lower() in team_lower or team_lower in known.lower():
                return known

        # Ha nincs egyezés, megtartjuk az eredeti nevet (tisztított formában)
        return team.title()

    def _parse_match_time(self, text: str) -> Optional[str]:
        """
        Időpont parseolása szövegből
        """
        try:
            # Időpont minták
            time_patterns = [
                r'(\d{1,2}):(\d{2})',  # 15:30
                r'(\d{1,2})\.(\d{2})',  # 15.30
                r'(\d{1,2})\s*(am|pm)',  # 3pm
                r'(\d{1,2}):(\d{2})\s*(am|pm)'  # 3:30pm
            ]

            for pattern in time_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 2:
                        hour, minute = match.groups()
                        return f"{hour.zfill(2)}:{minute.zfill(2)}"
                    elif len(match.groups()) == 2 and match.group(2).lower() in ['am', 'pm']:
                        hour = match.group(1)
                        period = match.group(2).lower()

                        hour_int = int(hour)
                        if period == 'pm' and hour_int != 12:
                            hour_int += 12
                        elif period == 'am' and hour_int == 12:
                            hour_int = 0

                        return f"{hour_int:02d}:00"
                    elif len(match.groups()) == 3:
                        hour, minute, period = match.groups()

                        hour_int = int(hour)
                        if period.lower() == 'pm' and hour_int != 12:
                            hour_int += 12
                        elif period.lower() == 'am' and hour_int == 12:
                            hour_int = 0

                        return f"{hour_int:02d}:{minute.zfill(2)}"

            return None

        except Exception as e:
            self.logger.warning(f"Hiba időpont parseolás során: {str(e)}")
            return None

    def _extract_competition(self, text: str) -> Optional[str]:
        """
        Bajnokság kinyerése
        """
        competitions = [
            'Premier League', 'Champions League', 'Europa League', 'FA Cup',
            'EFL Cup', 'League Cup', 'Community Shield',
            'La Liga', 'Copa del Rey', 'Supercopa de España',
            'Serie A', 'Coppa Italia', 'Supercoppa Italiana',
            'Bundesliga', 'DFB Pokal', 'DFL Supercup',
            'Ligue 1', 'Coupe de France', 'Trophée des Champions',
            'World Cup', 'Euro', 'Nations League', 'Copa America',
            'Europa Conference League', 'Club World Cup'
        ]

        text_lower = text.lower()

        for comp in competitions:
            if comp.lower() in text_lower:
                return comp

        return None

    def _extract_odds(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Odds kinyerése szövegből
        """
        try:
            # Odds minták
            odds_patterns = [
                r'(\d+\/\d+)',  # 5/1
                r'(\d+\.\d+)',  # 2.50
                r'(\+\d+)',     # +200
                r'(-\d+)'       # -150
            ]

            odds_found = []

            for pattern in odds_patterns:
                matches = re.findall(pattern, text)
                odds_found.extend(matches)

            if odds_found:
                return {
                    'raw_odds': odds_found,
                    'type': 'mixed'
                }

            return None

        except Exception as e:
            self.logger.warning(f"Hiba odds kinyerés során: {str(e)}")
            return None

    def _get_headers(self) -> Dict[str, str]:
        """
        HTTP headers generálása
        """
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'DNT': '1'
        }

    def _remove_duplicates(self, fixtures: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Duplikátumok eltávolítása
        """
        seen = set()
        unique_fixtures = []

        for fixture in fixtures:
            # Egyedi kulcs generálás
            key = f"{fixture.get('home_team', '')}-{fixture.get('away_team', '')}-{fixture.get('date', '')}-{fixture.get('time', '')}"

            if key not in seen:
                seen.add(key)
                unique_fixtures.append(fixture)

        return unique_fixtures

    def _sort_by_time(self, fixtures: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Mérkőzések időpont szerint rendezése
        """
        try:
            def time_sort_key(fixture):
                time_str = fixture.get('time', '99:99')
                if time_str and ':' in time_str:
                    try:
                        hour, minute = time_str.split(':')
                        return int(hour) * 60 + int(minute)
                    except:
                        return 9999
                return 9999

            return sorted(fixtures, key=time_sort_key)

        except Exception as e:
            self.logger.warning(f"Hiba rendezés során: {str(e)}")
            return fixtures

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

            # None és üres értékek kiszűrése a time listából
            times = []
            for f in fixtures:
                time_val = f.get('time')
                if time_val is not None and time_val != '':
                    times.append(time_val)

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
