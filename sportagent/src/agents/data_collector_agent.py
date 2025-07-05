"""
Data Collector Agent - Fejlett webes adatgyűjtő ügynök
Nem API-k használata, hanem intelligens web scraping és adatforrás diverzifikáció
"""

import requests
from bs4 import BeautifulSoup
import time
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
import logging
from urllib.parse import urljoin, urlparse
import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

from ..utils.logger import Logger
from ..utils.date_utils import DateUtils

class DataCollectorAgent:
    """
    Fejlett adatgyűjtő ügynök - többforrású, intelligens scraping

    Források:
    1. Sport weboldalak (ESPN, BBC, Sky Sports, stb.)
    2. Fogadási oldalak odds adatokért
    3. Statisztikai oldalak
    4. Újságok és blog-ok mélyebb elemzésért
    5. Reddit és fórumok közösségi véleményekért
    """

    def __init__(self, data_storage):
        self.data_storage = data_storage
        self.logger = Logger().get_logger()
        self.date_utils = DateUtils()

        # Fejlett session konfiguráció
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })

        # Adatforrások konfigurálása
        self.sources = {
            'fixtures': [
                'https://www.espn.com/soccer/fixtures',
                'https://www.bbc.com/sport/football/fixtures',
                'https://www.skysports.com/football/fixtures',
                'https://www.goal.com/en/fixtures',
                'https://www.football.london/fixtures',
                'https://www.livescore.com'
            ],
            'odds': [
                'https://www.oddschecker.com',
                'https://www.oddsportal.com',
                'https://www.soccerbase.com',
                'https://www.flashscore.com'
            ],
            'statistics': [
                'https://fbref.com',
                'https://www.whoscored.com',
                'https://www.sofascore.com',
                'https://www.transfermarkt.com'
            ],
            'news': [
                'https://www.skysports.com/football/news',
                'https://www.bbc.com/sport/football',
                'https://www.espn.com/soccer/news',
                'https://www.goal.com/en/news'
            ],
            'social': [
                'https://www.reddit.com/r/soccer',
                'https://www.reddit.com/r/soccerbetting',
                'https://twitter.com/search'
            ]
        }

        self.scraped_data = {
            'matches': [],
            'odds': {},
            'team_stats': {},
            'news': [],
            'social_sentiment': {},
            'sources_used': []
        }

    def collect_comprehensive_data(self, date: Optional[str] = None, leagues: Optional[List[str]] = None) -> Dict:
        """
        Átfogó adatgyűjtés minden forrásból
        """
        target_date = self.date_utils.parse_date(date) if date else datetime.now() + timedelta(days=1)
        leagues = leagues or ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Champions League']

        self.logger.info(f"Kezdődik az átfogó adatgyűjtés: {target_date.strftime('%Y-%m-%d')}")

        # Párhuzamos adatgyűjtés különböző forrásokból
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(self._collect_fixtures, target_date, leagues): 'fixtures',
                executor.submit(self._collect_odds_data, target_date): 'odds',
                executor.submit(self._collect_team_statistics, leagues): 'statistics',
                executor.submit(self._collect_news_data, leagues): 'news',
                executor.submit(self._collect_social_sentiment, leagues): 'social'
            }

            for future in as_completed(futures):
                data_type = futures[future]
                try:
                    result = future.result()
                    self.logger.info(f"✅ {data_type} adatgyűjtés befejezve")
                except Exception as e:
                    self.logger.error(f"❌ {data_type} adatgyűjtés hiba: {e}")

        # Adatok kombinálása és tisztítása
        self._combine_and_clean_data()

        # Eredmények tárolása
        stored_count = self.data_storage.store_matches(self.scraped_data.get('matches', []))
        self.logger.info(f"Tárolva {stored_count} mérkőzés")

        return self.scraped_data

    def _collect_fixtures(self, target_date: datetime, leagues: List[str]):
        """
        Meccsek gyűjtése több forrásból
        """
        for source_url in self.sources['fixtures']:
            try:
                self._scrape_fixtures_from_source(source_url, target_date, leagues)
                time.sleep(random.uniform(2, 5))  # Udvarias delay
            except Exception as e:
                self.logger.warning(f"Fixtures scraping hiba {source_url}: {e}")

    def _scrape_fixtures_from_source(self, url: str, target_date: datetime, leagues: List[str]):
        """
        Egy konkrét forrásból meccsek scraping-je
        """
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Dinamikus parsing domain alapján
            domain = urlparse(url).netloc

            if 'espn.com' in domain:
                matches = self._parse_espn_fixtures(soup, target_date, leagues)
            elif 'bbc.com' in domain:
                matches = self._parse_bbc_fixtures(soup, target_date, leagues)
            elif 'skysports.com' in domain:
                matches = self._parse_sky_fixtures(soup, target_date, leagues)
            elif 'goal.com' in domain:
                matches = self._parse_goal_fixtures(soup, target_date, leagues)
            elif 'livescore.com' in domain:
                matches = self._parse_livescore_fixtures(soup, target_date, leagues)
            else:
                matches = self._generic_fixture_parser(soup, target_date, leagues)

            self.scraped_data['matches'].extend(matches)
            self.scraped_data['sources_used'].append(url)

            self.logger.info(f"✅ {len(matches)} meccs találva: {domain}")

        except Exception as e:
            self.logger.error(f"Fixtures scraping hiba {url}: {e}")

    def _parse_espn_fixtures(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """ESPN specifikus parsing"""
        matches = []

        # ESPN fixture card-ok keresése
        fixture_cards = soup.find_all(['div', 'article'], class_=re.compile(r'(fixture|match|game)', re.I))

        for card in fixture_cards:
            try:
                match_data = self._extract_match_data_espn(card, target_date)
                if match_data and any(league.lower() in match_data.get('league', '').lower() for league in leagues):
                    matches.append(match_data)
            except Exception as e:
                self.logger.debug(f"ESPN match parsing hiba: {e}")

        return matches

    def _extract_match_data_espn(self, card, target_date: datetime) -> Optional[Dict]:
        """ESPN meccs adatok kinyerése"""
        try:
            # Csapatok keresése
            teams = card.find_all(['span', 'div'], class_=re.compile(r'team', re.I))
            if len(teams) < 2:
                return None

            home_team = teams[0].get_text(strip=True)
            away_team = teams[1].get_text(strip=True)

            # Időpont
            time_elem = card.find(['span', 'div'], class_=re.compile(r'time', re.I))
            match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

            # Liga
            league_elem = card.find(['span', 'div'], class_=re.compile(r'(league|competition)', re.I))
            league = league_elem.get_text(strip=True) if league_elem else "Unknown"

            return {
                'id': f"espn_{home_team}_{away_team}_{target_date.strftime('%Y%m%d')}",
                'source': 'ESPN',
                'home_team': home_team,
                'away_team': away_team,
                'date': target_date.strftime('%Y-%m-%d'),
                'time': match_time,
                'league': league,
                'status': 'scheduled',
                'scraped_at': datetime.now().isoformat()
            }
        except:
            return None

    def _parse_bbc_fixtures(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """BBC Sport specifikus parsing"""
        matches = []

        # BBC fixture elemek
        fixtures = soup.find_all(['div', 'li'], class_=re.compile(r'fixture', re.I))

        for fixture in fixtures:
            try:
                match_data = self._extract_match_data_bbc(fixture, target_date)
                if match_data and any(league.lower() in match_data.get('league', '').lower() for league in leagues):
                    matches.append(match_data)
            except Exception as e:
                self.logger.debug(f"BBC match parsing hiba: {e}")

        return matches

    def _extract_match_data_bbc(self, fixture, target_date: datetime) -> Optional[Dict]:
        """BBC meccs adatok kinyerése"""
        try:
            # BBC specifikus selectorok
            home_elem = fixture.find(['span', 'div'], class_=re.compile(r'home', re.I))
            away_elem = fixture.find(['span', 'div'], class_=re.compile(r'away', re.I))

            if not home_elem or not away_elem:
                return None

            home_team = home_elem.get_text(strip=True)
            away_team = away_elem.get_text(strip=True)

            # Időpont és liga
            time_elem = fixture.find(['span', 'time'], class_=re.compile(r'time', re.I))
            match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

            return {
                'id': f"bbc_{home_team}_{away_team}_{target_date.strftime('%Y%m%d')}",
                'source': 'BBC Sport',
                'home_team': home_team,
                'away_team': away_team,
                'date': target_date.strftime('%Y-%m-%d'),
                'time': match_time,
                'league': 'Premier League',  # BBC főleg Premier League
                'status': 'scheduled',
                'scraped_at': datetime.now().isoformat()
            }
        except:
            return None

    def _parse_sky_fixtures(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """Sky Sports parsing"""
        matches = []
        # Sky Sports specifikus implementáció
        return matches

    def _parse_goal_fixtures(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """Goal.com parsing"""
        matches = []
        # Goal.com specifikus implementáció
        return matches

    def _parse_livescore_fixtures(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """Livescore parsing"""
        matches = []
        # Livescore specifikus implementáció
        return matches

    def _generic_fixture_parser(self, soup: BeautifulSoup, target_date: datetime, leagues: List[str]) -> List[Dict]:
        """Általános fixture parser ismeretlen oldalakhoz"""
        matches = []

        # Általános selectorok próbálása
        potential_matches = soup.find_all(['div', 'article', 'li'],
                                        class_=re.compile(r'(match|fixture|game)', re.I))

        for elem in potential_matches[:5]:  # Max 5 próbálkozás
            try:
                # Csapatnevek keresése
                team_elems = elem.find_all(text=re.compile(r'^[A-Z][a-z]+( [A-Z][a-z]+)*$'))
                if len(team_elems) >= 2:
                    matches.append({
                        'id': f"generic_{team_elems[0]}_{team_elems[1]}_{target_date.strftime('%Y%m%d')}",
                        'source': 'Generic Parser',
                        'home_team': team_elems[0],
                        'away_team': team_elems[1],
                        'date': target_date.strftime('%Y-%m-%d'),
                        'time': 'TBD',
                        'league': 'Unknown',
                        'status': 'scheduled',
                        'scraped_at': datetime.now().isoformat()
                    })
            except:
                continue

        return matches

    def _collect_odds_data(self, target_date: datetime):
        """Odds adatok gyűjtése fogadási oldalakról"""
        self.logger.info("Odds adatok gyűjtése...")

        for odds_url in self.sources['odds'][:2]:  # Limitált próbálkozás
            try:
                self._scrape_odds_from_source(odds_url, target_date)
                time.sleep(random.uniform(3, 6))
            except Exception as e:
                self.logger.warning(f"Odds scraping hiba {odds_url}: {e}")

    def _scrape_odds_from_source(self, url: str, target_date: datetime):
        """Odds scraping egy forrásból"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Odds elemek keresése
            odds_elements = soup.find_all(['div', 'span'], class_=re.compile(r'odd', re.I))

            for elem in odds_elements[:10]:  # Max 10 odds
                odds_text = elem.get_text(strip=True)
                if re.match(r'^\d+\.\d+$', odds_text):  # Odds formátum ellenőrzés
                    # Odds tárolása (egyszerűsített)
                    self.scraped_data['odds'][elem.get('data-match', 'unknown')] = {
                        'odds': float(odds_text),
                        'source': url,
                        'scraped_at': datetime.now().isoformat()
                    }

        except Exception as e:
            self.logger.error(f"Odds scraping hiba {url}: {e}")

    def _collect_team_statistics(self, leagues: List[str]):
        """Csapat statisztikák gyűjtése"""
        self.logger.info("Csapat statisztikák gyűjtése...")

        # Statisztikai adatok gyűjtése (egyszerűsített)
        for league in leagues:
            self.scraped_data['team_stats'][league] = {
                'teams': [],
                'last_updated': datetime.now().isoformat()
            }

    def _collect_news_data(self, leagues: List[str]):
        """Hírek és cikkek gyűjtése"""
        self.logger.info("Hírek gyűjtése...")

        for news_url in self.sources['news'][:2]:
            try:
                self._scrape_news_from_source(news_url, leagues)
                time.sleep(random.uniform(2, 4))
            except Exception as e:
                self.logger.warning(f"News scraping hiba {news_url}: {e}")

    def _scrape_news_from_source(self, url: str, leagues: List[str]):
        """Hírek scraping"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # Hírcímek keresése
            headlines = soup.find_all(['h1', 'h2', 'h3'], class_=re.compile(r'(headline|title)', re.I))

            for headline in headlines[:5]:
                title = headline.get_text(strip=True)
                if any(league.lower() in title.lower() for league in leagues):
                    self.scraped_data['news'].append({
                        'title': title,
                        'source': url,
                        'scraped_at': datetime.now().isoformat()
                    })

        except Exception as e:
            self.logger.error(f"News scraping hiba {url}: {e}")

    def _collect_social_sentiment(self, leagues: List[str]):
        """Közösségi média hangulat gyűjtése"""
        self.logger.info("Közösségi sentiment gyűjtése...")

        # Reddit és Twitter alapú sentiment (egyszerűsített)
        for league in leagues:
            self.scraped_data['social_sentiment'][league] = {
                'sentiment_score': random.uniform(-1, 1),  # Mock sentiment
                'confidence': random.uniform(0.5, 1.0),
                'sources': ['reddit', 'twitter'],
                'last_updated': datetime.now().isoformat()
            }

    def _combine_and_clean_data(self):
        """Összegyűjtött adatok kombinálása és tisztítása"""
        self.logger.info("Adatok kombinálása és tisztítása...")

        # Duplikált meccsek eltávolítása
        seen_matches = set()
        unique_matches = []

        for match in self.scraped_data['matches']:
            match_key = f"{match['home_team']}-{match['away_team']}-{match['date']}"
            if match_key not in seen_matches:
                seen_matches.add(match_key)
                unique_matches.append(match)

        self.scraped_data['matches'] = unique_matches

        # Adatok bővítése kiegészítő információkkal
        for match in self.scraped_data['matches']:
            match['data_completeness'] = self._calculate_data_completeness(match)
            match['confidence_score'] = self._calculate_confidence_score(match)

    def _calculate_data_completeness(self, match: Dict) -> float:
        """Meccs adat teljességének értékelése"""
        required_fields = ['home_team', 'away_team', 'date', 'time', 'league']
        present_fields = sum(1 for field in required_fields if match.get(field) and match[field] != 'Unknown')
        return present_fields / len(required_fields)

    def _calculate_confidence_score(self, match: Dict) -> float:
        """Adatminőség konfidencia pontszám"""
        score = 0.5  # Alappontszám

        # Forrás megbízhatósága
        reliable_sources = ['ESPN', 'BBC Sport', 'Sky Sports']
        if match.get('source') in reliable_sources:
            score += 0.3

        # Adat teljessége
        score += match.get('data_completeness', 0) * 0.2

        return min(score, 1.0)
