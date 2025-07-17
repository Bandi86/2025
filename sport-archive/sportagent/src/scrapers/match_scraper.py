"""
Web scraping modul sportmérkőzések adatainak gyűjtésére
"""
import requests
from bs4 import BeautifulSoup
import time
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from urllib.parse import urljoin

class MatchScraper:
    """
    Sportmérkőzések adatainak scraping-je különböző forrásokból
    """

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.logger = logging.getLogger(__name__)

    def scrape_matches(self, date: datetime) -> List[Dict]:
        """
        Meccsek scraping-je a megadott dátumra
        """
        all_matches = []

        # ESPN scraping
        try:
            espn_matches = self._scrape_espn_football(date)
            all_matches.extend(espn_matches)
        except Exception as e:
            self.logger.error(f"ESPN scraping hiba: {e}")

        # BBC Sport scraping
        try:
            bbc_matches = self._scrape_bbc_sport(date)
            all_matches.extend(bbc_matches)
        except Exception as e:
            self.logger.error(f"BBC Sport scraping hiba: {e}")

        # Sky Sports scraping
        try:
            sky_matches = self._scrape_sky_sports(date)
            all_matches.extend(sky_matches)
        except Exception as e:
            self.logger.error(f"Sky Sports scraping hiba: {e}")

        # Deduplikálás
        unique_matches = self._deduplicate_matches(all_matches)

        return unique_matches

    def _scrape_espn_football(self, date: datetime) -> List[Dict]:
        """
        ESPN football fixtures scraping
        """
        matches = []

        try:
            # ESPN fixtures URL
            date_str = date.strftime('%Y%m%d')
            url = f"https://www.espn.com/soccer/fixtures/_/date/{date_str}"

            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Meccsek keresése
            fixture_blocks = soup.find_all('div', class_='Table__TR')

            for block in fixture_blocks:
                try:
                    match_data = self._parse_espn_match(block, date)
                    if match_data:
                        matches.append(match_data)
                except Exception as e:
                    self.logger.warning(f"ESPN meccs parsing hiba: {e}")
                    continue

            self.logger.info(f"ESPN: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"ESPN scraping hiba: {e}")

        return matches

    def _scrape_bbc_sport(self, date: datetime) -> List[Dict]:
        """
        BBC Sport fixtures scraping
        """
        matches = []

        try:
            # BBC Sport fixtures URL
            date_str = date.strftime('%Y-%m-%d')
            url = f"https://www.bbc.com/sport/football/fixtures"

            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Meccsek keresése
            fixture_items = soup.find_all('div', class_='fixture')

            for item in fixture_items:
                try:
                    match_data = self._parse_bbc_match(item, date)
                    if match_data:
                        matches.append(match_data)
                except Exception as e:
                    self.logger.warning(f"BBC meccs parsing hiba: {e}")
                    continue

            self.logger.info(f"BBC Sport: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"BBC Sport scraping hiba: {e}")

        return matches

    def _scrape_sky_sports(self, date: datetime) -> List[Dict]:
        """
        Sky Sports fixtures scraping
        """
        matches = []

        try:
            # Sky Sports fixtures URL
            url = "https://www.skysports.com/football/fixtures"

            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Meccsek keresése
            fixture_cards = soup.find_all('div', class_='fixres__item')

            for card in fixture_cards:
                try:
                    match_data = self._parse_sky_match(card, date)
                    if match_data:
                        matches.append(match_data)
                except Exception as e:
                    self.logger.warning(f"Sky Sports meccs parsing hiba: {e}")
                    continue

            self.logger.info(f"Sky Sports: {len(matches)} meccs találva")

        except Exception as e:
            self.logger.error(f"Sky Sports scraping hiba: {e}")

        return matches

    def _parse_espn_match(self, block, date: datetime) -> Optional[Dict]:
        """
        ESPN meccs adatok parsing
        """
        try:
            # Csapatok
            teams = block.find_all('span', class_='Table__Team')
            if len(teams) < 2:
                return None

            home_team = teams[0].get_text(strip=True)
            away_team = teams[1].get_text(strip=True)

            # Idő
            time_elem = block.find('div', class_='game-time')
            match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

            # Liga
            league_elem = block.find('div', class_='league-name')
            league = league_elem.get_text(strip=True) if league_elem else "Unknown"

            return {
                'id': f"espn_{home_team}_{away_team}_{date.strftime('%Y%m%d')}",
                'source': 'ESPN',
                'home_team': home_team,
                'away_team': away_team,
                'date': date.strftime('%Y-%m-%d'),
                'time': match_time,
                'league': league,
                'status': 'scheduled'
            }

        except Exception as e:
            self.logger.error(f"ESPN meccs parsing hiba: {e}")
            return None

    def _parse_bbc_match(self, item, date: datetime) -> Optional[Dict]:
        """
        BBC Sport meccs adatok parsing
        """
        try:
            # Csapatok
            home_team_elem = item.find('span', class_='fixture__team--home')
            away_team_elem = item.find('span', class_='fixture__team--away')

            if not home_team_elem or not away_team_elem:
                return None

            home_team = home_team_elem.get_text(strip=True)
            away_team = away_team_elem.get_text(strip=True)

            # Idő
            time_elem = item.find('span', class_='fixture__time')
            match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

            # Liga
            league_elem = item.find('div', class_='fixture__competition')
            league = league_elem.get_text(strip=True) if league_elem else "Unknown"

            return {
                'id': f"bbc_{home_team}_{away_team}_{date.strftime('%Y%m%d')}",
                'source': 'BBC Sport',
                'home_team': home_team,
                'away_team': away_team,
                'date': date.strftime('%Y-%m-%d'),
                'time': match_time,
                'league': league,
                'status': 'scheduled'
            }

        except Exception as e:
            self.logger.error(f"BBC meccs parsing hiba: {e}")
            return None

    def _parse_sky_match(self, card, date: datetime) -> Optional[Dict]:
        """
        Sky Sports meccs adatok parsing
        """
        try:
            # Csapatok
            home_team_elem = card.find('span', class_='swap-text--bp30')
            away_team_elem = card.find('span', class_='swap-text--bp30')

            if not home_team_elem or not away_team_elem:
                return None

            teams = [team.get_text(strip=True) for team in card.find_all('span', class_='swap-text--bp30')]

            if len(teams) < 2:
                return None

            home_team = teams[0]
            away_team = teams[1]

            # Idő
            time_elem = card.find('span', class_='fixres__time')
            match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

            # Liga
            league_elem = card.find('div', class_='fixres__header')
            league = league_elem.get_text(strip=True) if league_elem else "Unknown"

            return {
                'id': f"sky_{home_team}_{away_team}_{date.strftime('%Y%m%d')}",
                'source': 'Sky Sports',
                'home_team': home_team,
                'away_team': away_team,
                'date': date.strftime('%Y-%m-%d'),
                'time': match_time,
                'league': league,
                'status': 'scheduled'
            }

        except Exception as e:
            self.logger.error(f"Sky Sports meccs parsing hiba: {e}")
            return None

    def _deduplicate_matches(self, matches: List[Dict]) -> List[Dict]:
        """
        Duplikált meccsek eltávolítása
        """
        seen = set()
        unique_matches = []

        for match in matches:
            # Egyedi kulcs létrehozása
            key = f"{match['home_team']}_{match['away_team']}_{match['date']}"
            key = key.lower().replace(' ', '_')

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def _random_delay(self, min_delay: float = 0.5, max_delay: float = 2.0):
        """
        Véletlenszerű késleltetés a scraping között
        """
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
