"""
Google Search Agent - Sport adatok keresése Google-n keresztül
"""
import requests
from bs4 import BeautifulSoup
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time
import random
from urllib.parse import quote_plus

from ..utils.logger import Logger
from ..config import Config

class GoogleSearchAgent:
    """
    Google keresési eredmények alapján sport adatok gyűjtése
    """

    def __init__(self):
        self.logger = Logger('google_search_agent')
        self.config = Config()
        self.session = requests.Session()

        # User agent rotáció bot detection ellen
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
        ]

    def _get_random_headers(self) -> Dict[str, str]:
        """Véletlen header generálás bot detection ellen"""
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    def _delay_request(self):
        """Késleltetés a túl gyors kérések elkerülésére"""
        time.sleep(random.uniform(1, 3))

    def search_football_matches(self, query: Optional[str] = None, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Foci mérkőzések keresése Google-n

        Args:
            query: Egyedi keresési kifejezés
            days_ahead: Hány napra előre keresünk

        Returns:
            List[Dict]: Mérkőzések listája
        """
        try:
            if not query:
                query = "football matches today results fixtures"

            search_queries = [
                f"{query} site:bbc.com/sport",
                f"{query} site:espn.com",
                f"{query} site:skysports.com",
                f"Premier League matches today results",
                f"Champions League fixtures results",
                f"football scores today {datetime.now().strftime('%Y-%m-%d')}"
            ]

            all_matches = []

            for search_query in search_queries:
                self.logger.info(f"Keresés: {search_query}")
                matches = self._search_google(search_query)
                all_matches.extend(matches)
                self._delay_request()

                # Maximum 5 keresés bot detection elkerülésére
                if len(all_matches) >= 20:
                    break

            # Duplikátumok eltávolítása
            unique_matches = self._remove_duplicates(all_matches)

            self.logger.info(f"Összesen {len(unique_matches)} mérkőzés találva")
            return unique_matches

        except Exception as e:
            self.logger.error(f"Hiba a Google keresés során: {str(e)}")
            return []

    def _search_google(self, query: str) -> List[Dict[str, Any]]:
        """
        Google keresés végrehajtása

        Args:
            query: Keresési kifejezés

        Returns:
            List[Dict]: Talált mérkőzések
        """
        try:
            # Google keresési URL
            encoded_query = quote_plus(query)
            url = f"https://www.google.com/search?q={encoded_query}&num=20"

            headers = self._get_random_headers()

            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            matches = []

            # Google search results parsing
            search_results = soup.find_all('div', class_='g')

            for result in search_results:
                try:
                    # Cím és link
                    title_elem = result.find('h3')
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    # Link keresése
                    link_elem = result.find('a')
                    link = link_elem.get('href') if link_elem else None

                    # Snippet/leírás
                    snippet_elem = result.find('span', class_='st') or result.find('div', class_='s')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                    # Sport tartalom szűrés
                    if self._is_sports_content(title, snippet):
                        match_data = self._extract_match_data(title, snippet, link or "")
                        if match_data:
                            matches.append(match_data)

                except Exception as e:
                    self.logger.warning(f"Hiba egy keresési eredmény feldolgozásában: {str(e)}")
                    continue

            return matches

        except Exception as e:
            self.logger.error(f"Hiba a Google keresés során: {str(e)}")
            return []

    def _is_sports_content(self, title: str, snippet: str) -> bool:
        """
        Ellenőrzi, hogy a tartalom sport-releváns-e

        Args:
            title: Cím
            snippet: Leírás

        Returns:
            bool: Sport tartalom-e
        """
        sport_keywords = [
            'football', 'soccer', 'match', 'game', 'fixture', 'result', 'score',
            'league', 'premier', 'champions', 'europa', 'cup', 'tournament',
            'vs', 'against', 'kick off', 'full time', 'half time', 'goal',
            'team', 'player', 'stadium', 'referee', 'injury', 'transfer'
        ]

        text = f"{title} {snippet}".lower()

        return any(keyword in text for keyword in sport_keywords)

    def _extract_match_data(self, title: str, snippet: str, link: str) -> Optional[Dict[str, Any]]:
        """
        Mérkőzés adatok kinyerése a szövegből

        Args:
            title: Cím
            snippet: Leírás
            link: Link

        Returns:
            Optional[Dict]: Mérkőzés adatok
        """
        try:
            # Csapat nevek keresése (Team A vs Team B formátum)
            vs_pattern = r'([A-Za-z\s]+)\s+(?:vs?\.?|v\.?|against)\s+([A-Za-z\s]+)'
            vs_match = re.search(vs_pattern, title, re.IGNORECASE)

            if not vs_match:
                vs_match = re.search(vs_pattern, snippet, re.IGNORECASE)

            if vs_match:
                home_team = vs_match.group(1).strip()
                away_team = vs_match.group(2).strip()
            else:
                # Alternatív formátum keresése
                dash_pattern = r'([A-Za-z\s]+)\s*[-–]\s*([A-Za-z\s]+)'
                dash_match = re.search(dash_pattern, title, re.IGNORECASE)
                if dash_match:
                    home_team = dash_match.group(1).strip()
                    away_team = dash_match.group(2).strip()
                else:
                    return None

            # Eredmény keresése
            score_pattern = r'(\d+)\s*[-–:]\s*(\d+)'
            score_match = re.search(score_pattern, f"{title} {snippet}")

            home_score = None
            away_score = None
            if score_match:
                home_score = int(score_match.group(1))
                away_score = int(score_match.group(2))

            # Dátum keresése
            date_text = f"{title} {snippet}"
            match_date = self._extract_date(date_text)

            # Status meghatározás
            status = "scheduled"
            if home_score is not None and away_score is not None:
                status = "finished"
            elif any(word in date_text.lower() for word in ['live', 'playing', 'ongoing']):
                status = "live"

            return {
                'home_team': home_team,
                'away_team': away_team,
                'home_score': home_score,
                'away_score': away_score,
                'date': match_date,
                'status': status,
                'competition': self._extract_competition(title, snippet),
                'source': 'google_search',
                'source_url': link,
                'confidence': 0.7  # Google keresés közepes megbízhatóság
            }

        except Exception as e:
            self.logger.warning(f"Hiba a mérkőzés adatok kinyerésében: {str(e)}")
            return None

    def _extract_date(self, text: str) -> Optional[str]:
        """
        Dátum kinyerése a szövegből

        Args:
            text: Szöveg

        Returns:
            Optional[str]: Dátum ISO formátumban
        """
        try:
            # Mai nap kulcsszavak
            today_keywords = ['today', 'tonight', 'this evening']
            if any(keyword in text.lower() for keyword in today_keywords):
                return datetime.now().strftime('%Y-%m-%d')

            # Holnap kulcsszavak
            tomorrow_keywords = ['tomorrow', 'next day']
            if any(keyword in text.lower() for keyword in tomorrow_keywords):
                return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

            # Dátum minták
            date_patterns = [
                r'(\d{1,2})/(\d{1,2})/(\d{4})',  # MM/DD/YYYY
                r'(\d{1,2})-(\d{1,2})-(\d{4})',  # MM-DD-YYYY
                r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
            ]

            for pattern in date_patterns:
                match = re.search(pattern, text)
                if match:
                    if len(match.group(1)) == 4:  # YYYY-MM-DD
                        return f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
                    else:  # MM/DD/YYYY vagy MM-DD-YYYY
                        return f"{match.group(3)}-{match.group(1).zfill(2)}-{match.group(2).zfill(2)}"

            return None

        except Exception as e:
            self.logger.warning(f"Hiba a dátum kinyerésében: {str(e)}")
            return None

    def _extract_competition(self, title: str, snippet: str) -> Optional[str]:
        """
        Verseny/liga neve kinyerése

        Args:
            title: Cím
            snippet: Leírás

        Returns:
            Optional[str]: Verseny neve
        """
        competitions = [
            'Premier League', 'Champions League', 'Europa League', 'FA Cup',
            'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup',
            'Euro', 'Copa America', 'Champions League', 'Europa Conference League'
        ]

        text = f"{title} {snippet}".lower()

        for comp in competitions:
            if comp.lower() in text:
                return comp

        return None

    def _remove_duplicates(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Duplikátumok eltávolítása

        Args:
            matches: Mérkőzések listája

        Returns:
            List[Dict]: Egyedi mérkőzések
        """
        seen = set()
        unique_matches = []

        for match in matches:
            # Egyedi kulcs: csapatok + dátum
            key = f"{match.get('home_team', '')}-{match.get('away_team', '')}-{match.get('date', '')}"
            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def search_sports_news(self, query: str = "football news today") -> List[Dict[str, Any]]:
        """
        Sport hírek keresése

        Args:
            query: Keresési kifejezés

        Returns:
            List[Dict]: Hírek listája
        """
        try:
            news_queries = [
                f"{query} site:bbc.com/sport",
                f"{query} site:espn.com",
                f"{query} site:skysports.com",
                f"football transfer news today",
                f"premier league news {datetime.now().strftime('%Y-%m-%d')}"
            ]

            all_news = []

            for search_query in news_queries:
                self.logger.info(f"Hírek keresése: {search_query}")
                news = self._search_google_news(search_query)
                all_news.extend(news)
                self._delay_request()

                if len(all_news) >= 15:
                    break

            return all_news[:15]  # Maximum 15 hír

        except Exception as e:
            self.logger.error(f"Hiba a hírek keresése során: {str(e)}")
            return []

    def _search_google_news(self, query: str) -> List[Dict[str, Any]]:
        """Google hírek keresése"""
        try:
            encoded_query = quote_plus(query)
            url = f"https://www.google.com/search?q={encoded_query}&tbm=nws&num=10"

            headers = self._get_random_headers()
            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            news = []
            news_results = soup.find_all('div', class_='g')

            for result in news_results:
                try:
                    title_elem = result.find('h3')
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    link_elem = result.find('a')
                    link = link_elem.get('href') if link_elem else None

                    snippet_elem = result.find('span', class_='st') or result.find('div', class_='s')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                    # Dátum keresése
                    date_elem = result.find('span', class_='f')
                    date_text = date_elem.get_text(strip=True) if date_elem else ""

                    news.append({
                        'title': title,
                        'content': snippet,
                        'url': link,
                        'published_date': date_text,
                        'source': 'google_news',
                        'confidence': 0.8
                    })

                except Exception as e:
                    self.logger.warning(f"Hiba egy hír feldolgozásában: {str(e)}")
                    continue

            return news

        except Exception as e:
            self.logger.error(f"Hiba a Google hírek keresése során: {str(e)}")
            return []
