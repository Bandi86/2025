"""
Simplified Enhanced Google Search Agent - Egyszerűsített, működő verzió
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

class SimplifiedEnhancedGoogleSearchAgent:
    """
    Egyszerűsített, működő Google keresési ügynök
    """

    def __init__(self):
        self.logger = Logger('simplified_enhanced_google_search_agent')
        self.config = Config()
        self.session = requests.Session()

        # User agent pool
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]

    def search_football_matches(self, query: Optional[str] = None, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Foci mérkőzések keresése több módszerrel
        """
        try:
            if not query:
                query = "football matches today tomorrow fixtures results"

            self.logger.info(f"Simplified Enhanced Google keresés indítása: {query}")

            # Működő módszerek prioritás szerint
            methods = [
                self._search_direct_sites,
                self._search_alternative_engines,
                self._search_with_advanced_requests
            ]

            all_matches = []

            for method in methods:
                try:
                    self.logger.info(f"Próbálkozás {method.__name__} módszerrel")
                    matches = method(query)

                    if matches:
                        all_matches.extend(matches)
                        self.logger.info(f"Sikeres keresés {method.__name__} módszerrel: {len(matches)} mérkőzés")

                    # Ha már van elég adat, megállunk
                    if len(all_matches) >= 15:
                        break

                    # Várunk a kérések között
                    time.sleep(random.uniform(1, 3))

                except Exception as e:
                    self.logger.warning(f"Hiba {method.__name__} módszerrel: {str(e)}")
                    continue

            # Duplikátumok eltávolítása
            unique_matches = self._remove_duplicates(all_matches)

            # Ha semmi sem működött, fallback
            if not unique_matches:
                self.logger.info("Fallback adatok használata")
                unique_matches = self._get_fallback_matches()

            self.logger.info(f"Simplified Enhanced keresés befejezve: {len(unique_matches)} mérkőzés")
            return unique_matches

        except Exception as e:
            self.logger.error(f"Hiba a simplified enhanced keresés során: {str(e)}")
            return self._get_fallback_matches()

    def _search_direct_sites(self, query: str) -> List[Dict[str, Any]]:
        """
        Közvetlen sport weboldalak scraping-je
        """
        try:
            # Ismert sport weboldalak
            sports_sites = [
                'https://www.bbc.com/sport/football',
                'https://www.espn.com/soccer/',
                'https://www.skysports.com/football',
                'https://www.goal.com/',
                'https://www.footballtransfertavern.com/',
                'https://www.transfermarkt.com/',
                'https://www.fourfourtwo.com/',
                'https://www.theguardian.com/football'
            ]

            all_matches = []

            for site in sports_sites:
                try:
                    self.logger.info(f"Közvetlen scraping: {site}")

                    headers = self._get_advanced_headers()
                    response = requests.get(site, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')

                        # Címek és linkek keresése
                        elements = soup.find_all(['h1', 'h2', 'h3', 'h4', 'a', 'span', 'div'])

                        for element in elements:
                            try:
                                text = element.get_text(strip=True)

                                # Túl rövid vagy túl hosszú szövegek kiszűrése
                                if len(text) < 10 or len(text) > 200:
                                    continue

                                if self._is_sports_content(text, ""):
                                    match_data = self._extract_match_data(text, "", site)
                                    if match_data:
                                        match_data['source'] = f'direct_scraping_{site}'
                                        all_matches.append(match_data)
                            except Exception as e:
                                continue

                    # Rövid várakozás
                    time.sleep(random.uniform(0.5, 2))

                    # Ha már van elég adat, megállunk
                    if len(all_matches) >= 10:
                        break

                except Exception as e:
                    self.logger.warning(f"Hiba {site} scraping során: {str(e)}")
                    continue

            return all_matches

        except Exception as e:
            self.logger.error(f"Hiba közvetlen site scraping során: {str(e)}")
            return []

    def _search_alternative_engines(self, query: str) -> List[Dict[str, Any]]:
        """
        Alternatív keresőmotorok
        """
        try:
            all_matches = []

            # DuckDuckGo keresés
            duckduckgo_matches = self._search_duckduckgo(query)
            all_matches.extend(duckduckgo_matches)

            # Bing keresés
            bing_matches = self._search_bing(query)
            all_matches.extend(bing_matches)

            # Yandex keresés
            yandex_matches = self._search_yandex(query)
            all_matches.extend(yandex_matches)

            return all_matches

        except Exception as e:
            self.logger.error(f"Hiba alternatív keresőmotorok használata során: {str(e)}")
            return []

    def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """
        DuckDuckGo keresés
        """
        try:
            search_url = f"https://duckduckgo.com/html/?q={quote_plus(query + ' football matches')}"
            headers = self._get_advanced_headers()

            response = requests.get(search_url, headers=headers, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                matches = []

                # DuckDuckGo eredmények parseolása
                results = soup.find_all('div', class_='result')

                for result in results:
                    try:
                        title_elem = result.find('h2')
                        if not title_elem:
                            continue

                        title = title_elem.get_text(strip=True)
                        link_elem = result.find('a')
                        link = link_elem.get('href') if link_elem else None

                        snippet_elem = result.find('a', class_='result__snippet')
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                        if self._is_sports_content(title, snippet):
                            match_data = self._extract_match_data(title, snippet, link or "")
                            if match_data:
                                match_data['source'] = 'duckduckgo'
                                matches.append(match_data)

                    except Exception as e:
                        self.logger.warning(f"Hiba DuckDuckGo eredmény feldolgozásában: {str(e)}")
                        continue

                return matches

            return []

        except Exception as e:
            self.logger.warning(f"Hiba DuckDuckGo keresés során: {str(e)}")
            return []

    def _search_bing(self, query: str) -> List[Dict[str, Any]]:
        """
        Bing keresés
        """
        try:
            search_url = f"https://www.bing.com/search?q={quote_plus(query + ' football matches')}"
            headers = self._get_advanced_headers()

            response = requests.get(search_url, headers=headers, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                matches = []

                # Bing eredmények parseolása
                results = soup.find_all('li', class_='b_algo')

                for result in results:
                    try:
                        title_elem = result.find('h2')
                        if not title_elem:
                            continue

                        title = title_elem.get_text(strip=True)
                        link_elem = result.find('a')
                        link = link_elem.get('href') if link_elem else None

                        snippet_elem = result.find('p')
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                        if self._is_sports_content(title, snippet):
                            match_data = self._extract_match_data(title, snippet, link or "")
                            if match_data:
                                match_data['source'] = 'bing'
                                matches.append(match_data)

                    except Exception as e:
                        self.logger.warning(f"Hiba Bing eredmény feldolgozásában: {str(e)}")
                        continue

                return matches

            return []

        except Exception as e:
            self.logger.warning(f"Hiba Bing keresés során: {str(e)}")
            return []

    def _search_yandex(self, query: str) -> List[Dict[str, Any]]:
        """
        Yandex keresés
        """
        try:
            search_url = f"https://yandex.com/search/?text={quote_plus(query + ' football matches')}"
            headers = self._get_advanced_headers()

            response = requests.get(search_url, headers=headers, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                matches = []

                # Yandex eredmények parseolása
                results = soup.find_all('div', class_='serp-item')

                for result in results:
                    try:
                        title_elem = result.find('h2')
                        if not title_elem:
                            continue

                        title = title_elem.get_text(strip=True)
                        link_elem = result.find('a')
                        link = link_elem.get('href') if link_elem else None

                        snippet_elem = result.find('div', class_='text-container')
                        snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                        if self._is_sports_content(title, snippet):
                            match_data = self._extract_match_data(title, snippet, link or "")
                            if match_data:
                                match_data['source'] = 'yandex'
                                matches.append(match_data)

                    except Exception as e:
                        self.logger.warning(f"Hiba Yandex eredmény feldolgozásában: {str(e)}")
                        continue

                return matches

            return []

        except Exception as e:
            self.logger.warning(f"Hiba Yandex keresés során: {str(e)}")
            return []

    def _search_with_advanced_requests(self, query: str) -> List[Dict[str, Any]]:
        """
        Fejlett requests alapú keresés
        """
        try:
            # Próbálkozás Google keresésssel különböző módszerekkel
            strategies = [
                self._search_google_delayed,
                self._search_google_mobile,
                self._search_google_scholar
            ]

            for strategy in strategies:
                try:
                    matches = strategy(query)
                    if matches:
                        return matches
                except Exception as e:
                    self.logger.warning(f"Hiba {strategy.__name__} stratégiával: {str(e)}")
                    continue

            return []

        except Exception as e:
            self.logger.error(f"Hiba advanced requests keresés során: {str(e)}")
            return []

    def _search_google_delayed(self, query: str) -> List[Dict[str, Any]]:
        """
        Google keresés késleltetéssel
        """
        try:
            # Lassú keresés
            time.sleep(random.uniform(3, 7))

            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            headers = self._get_advanced_headers()

            response = self.session.get(search_url, headers=headers, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                return self._parse_google_results(soup)

            return []

        except Exception as e:
            self.logger.warning(f"Hiba Google delayed keresés során: {str(e)}")
            return []

    def _search_google_mobile(self, query: str) -> List[Dict[str, Any]]:
        """
        Google mobil keresés
        """
        try:
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            headers = self._get_mobile_headers()

            response = self.session.get(search_url, headers=headers, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                return self._parse_google_results(soup)

            return []

        except Exception as e:
            self.logger.warning(f"Hiba Google mobile keresés során: {str(e)}")
            return []

    def _search_google_scholar(self, query: str) -> List[Dict[str, Any]]:
        """
        Google Scholar keresés
        """
        try:
            search_url = f"https://scholar.google.com/scholar?q={quote_plus(query)}"
            headers = self._get_advanced_headers()

            response = self.session.get(search_url, headers=headers, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                return self._parse_google_results(soup)

            return []

        except Exception as e:
            self.logger.warning(f"Hiba Google Scholar keresés során: {str(e)}")
            return []

    def _get_advanced_headers(self) -> Dict[str, str]:
        """
        Fejlett header generálás
        """
        return {
            'User-Agent': random.choice(self.user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,hu;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1'
        }

    def _get_mobile_headers(self) -> Dict[str, str]:
        """
        Mobil header generálás
        """
        mobile_agents = [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36'
        ]

        return {
            'User-Agent': random.choice(mobile_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def _parse_google_results(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Google eredmények parseolása
        """
        try:
            matches = []

            # Google search results parsing
            search_results = soup.find_all('div', class_='g')

            for result in search_results:
                try:
                    title_elem = result.find('h3')
                    if not title_elem:
                        continue

                    title = title_elem.get_text(strip=True)

                    link_elem = result.find('a')
                    link = link_elem.get('href') if link_elem else None

                    snippet_elem = result.find('span', class_='st') or result.find('div', class_='s')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""

                    if self._is_sports_content(title, snippet):
                        match_data = self._extract_match_data(title, snippet, link or "")
                        if match_data:
                            match_data['source'] = 'google_search'
                            matches.append(match_data)

                except Exception as e:
                    self.logger.warning(f"Hiba Google eredmény feldolgozásában: {str(e)}")
                    continue

            return matches

        except Exception as e:
            self.logger.error(f"Hiba Google eredmények parseolása során: {str(e)}")
            return []

    def _is_sports_content(self, title: str, snippet: str) -> bool:
        """
        Sport tartalom ellenőrzés
        """
        sport_keywords = [
            'football', 'soccer', 'match', 'game', 'fixture', 'result', 'score',
            'league', 'premier', 'champions', 'europa', 'cup', 'tournament',
            'vs', 'against', 'kick off', 'full time', 'half time', 'goal',
            'team', 'player', 'stadium', 'referee', 'injury', 'transfer',
            'bundesliga', 'la liga', 'serie a', 'ligue 1', 'world cup',
            'liverpool', 'arsenal', 'manchester', 'chelsea', 'tottenham',
            'barcelona', 'real madrid', 'bayern', 'juventus', 'psg'
        ]

        text = f"{title} {snippet}".lower()
        return any(keyword in text for keyword in sport_keywords)

    def _extract_match_data(self, title: str, snippet: str, link: str) -> Optional[Dict[str, Any]]:
        """
        Mérkőzés adatok kinyerése
        """
        try:
            # Csapat nevek keresése
            vs_patterns = [
                r'([A-Za-z\s]+)\s+(?:vs?\.?|v\.?|against)\s+([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s*[-–]\s*([A-Za-z\s]+)',
                r'([A-Za-z\s]+)\s+(\d+)\s*[-–:]\s*(\d+)\s+([A-Za-z\s]+)'
            ]

            home_team = None
            away_team = None
            home_score = None
            away_score = None

            text = f"{title} {snippet}"

            for pattern in vs_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 2:
                        home_team = match.group(1).strip()
                        away_team = match.group(2).strip()
                    elif len(match.groups()) == 4:
                        home_team = match.group(1).strip()
                        home_score = int(match.group(2))
                        away_score = int(match.group(3))
                        away_team = match.group(4).strip()
                    break

            # Alapszintű tisztítás
            if home_team:
                home_team = re.sub(r'[^\w\s]', '', home_team)[:50]
            if away_team:
                away_team = re.sub(r'[^\w\s]', '', away_team)[:50]

            if not home_team or not away_team:
                return None

            # Eredmény keresése ha még nincs
            if home_score is None and away_score is None:
                score_pattern = r'(\d+)\s*[-–:]\s*(\d+)'
                score_match = re.search(score_pattern, text)
                if score_match:
                    home_score = int(score_match.group(1))
                    away_score = int(score_match.group(2))

            # Dátum keresése
            match_date = self._extract_date(text)

            # Status meghatározás
            status = "scheduled"
            if home_score is not None and away_score is not None:
                status = "finished"
            elif any(word in text.lower() for word in ['live', 'playing', 'ongoing']):
                status = "live"

            return {
                'home_team': home_team,
                'away_team': away_team,
                'home_score': home_score,
                'away_score': away_score,
                'date': match_date,
                'status': status,
                'competition': self._extract_competition(title, snippet),
                'source': 'simplified_enhanced_search',
                'source_url': link,
                'confidence': 0.75
            }

        except Exception as e:
            self.logger.warning(f"Hiba mérkőzés adatok kinyerésében: {str(e)}")
            return None

    def _extract_date(self, text: str) -> Optional[str]:
        """
        Dátum kinyerése
        """
        try:
            # Mai nap
            today_keywords = ['today', 'tonight', 'this evening', 'ma', 'ma este']
            if any(keyword in text.lower() for keyword in today_keywords):
                return datetime.now().strftime('%Y-%m-%d')

            # Holnap
            tomorrow_keywords = ['tomorrow', 'next day', 'holnap']
            if any(keyword in text.lower() for keyword in tomorrow_keywords):
                return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

            # Dátum minták
            date_patterns = [
                r'(\d{1,2})/(\d{1,2})/(\d{4})',
                r'(\d{1,2})-(\d{1,2})-(\d{4})',
                r'(\d{4})-(\d{1,2})-(\d{1,2})',
                r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})'
            ]

            for pattern in date_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 3:
                        if len(match.group(1)) == 4:  # YYYY-MM-DD
                            return f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
                        elif match.group(2).isalpha():  # DD Mon YYYY
                            month_map = {
                                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                                'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                                'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                            }
                            month = month_map.get(match.group(2).lower()[:3], '01')
                            return f"{match.group(3)}-{month}-{match.group(1).zfill(2)}"
                        else:  # MM/DD/YYYY
                            return f"{match.group(3)}-{match.group(1).zfill(2)}-{match.group(2).zfill(2)}"

            return None

        except Exception as e:
            self.logger.warning(f"Hiba dátum kinyerésében: {str(e)}")
            return None

    def _extract_competition(self, title: str, snippet: str) -> Optional[str]:
        """
        Verseny neve kinyerése
        """
        competitions = [
            'Premier League', 'Champions League', 'Europa League', 'FA Cup',
            'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'World Cup',
            'Euro', 'Copa America', 'Europa Conference League', 'Nations League',
            'EFL Cup', 'Community Shield', 'Copa del Rey', 'DFB Pokal',
            'Coppa Italia', 'Coupe de France', 'MLS', 'Liga MX'
        ]

        text = f"{title} {snippet}".lower()

        for comp in competitions:
            if comp.lower() in text:
                return comp

        return None

    def _remove_duplicates(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Duplikátumok eltávolítása
        """
        seen = set()
        unique_matches = []

        for match in matches:
            key = f"{match.get('home_team', '')}-{match.get('away_team', '')}-{match.get('date', '')}"
            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def _get_fallback_matches(self) -> List[Dict[str, Any]]:
        """
        Fallback mérkőzések ha semmi sem működik
        """
        self.logger.info("Fallback mérkőzések generálása")

        # Valós csapatok és ligák
        premier_league_teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United',
            'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham'
        ]

        champions_league_teams = [
            'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG', 'Juventus',
            'AC Milan', 'Inter Milan', 'Borussia Dortmund', 'Atletico Madrid'
        ]

        fallback_matches = []

        # Premier League mérkőzések
        for i in range(3):
            home_team = random.choice(premier_league_teams)
            away_team = random.choice([t for t in premier_league_teams if t != home_team])

            fallback_matches.append({
                'home_team': home_team,
                'away_team': away_team,
                'home_score': None,
                'away_score': None,
                'date': (datetime.now() + timedelta(days=i+1)).strftime('%Y-%m-%d'),
                'status': 'scheduled',
                'competition': 'Premier League',
                'source': 'fallback_data',
                'source_url': '',
                'confidence': 0.3
            })

        # Champions League mérkőzések
        for i in range(2):
            home_team = random.choice(champions_league_teams)
            away_team = random.choice([t for t in champions_league_teams if t != home_team])

            fallback_matches.append({
                'home_team': home_team,
                'away_team': away_team,
                'home_score': None,
                'away_score': None,
                'date': (datetime.now() + timedelta(days=i+3)).strftime('%Y-%m-%d'),
                'status': 'scheduled',
                'competition': 'Champions League',
                'source': 'fallback_data',
                'source_url': '',
                'confidence': 0.3
            })

        return fallback_matches

    def search_sports_news(self, query: str = "football news today") -> List[Dict[str, Any]]:
        """
        Sport hírek keresése
        """
        try:
            self.logger.info(f"Sport hírek keresése: {query}")

            # Hírek keresése a direct site scraping módszerrel
            news_sites = [
                'https://www.bbc.com/sport/football',
                'https://www.espn.com/soccer/',
                'https://www.skysports.com/football',
                'https://www.goal.com/'
            ]

            all_news = []

            for site in news_sites:
                try:
                    headers = self._get_advanced_headers()
                    response = requests.get(site, headers=headers, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')

                        # Hírek keresése
                        news_elements = soup.find_all(['h1', 'h2', 'h3', 'h4'])

                        for element in news_elements:
                            try:
                                title = element.get_text(strip=True)

                                if len(title) > 20 and self._is_sports_content(title, ""):
                                    all_news.append({
                                        'title': title,
                                        'content': title,
                                        'url': site,
                                        'published_date': datetime.now().strftime('%Y-%m-%d'),
                                        'source': f'news_scraping_{site}',
                                        'confidence': 0.7
                                    })

                                    if len(all_news) >= 10:
                                        break
                            except Exception as e:
                                continue

                    time.sleep(random.uniform(1, 3))

                except Exception as e:
                    self.logger.warning(f"Hiba {site} hírek scraping során: {str(e)}")
                    continue

            return all_news[:10]  # Maximum 10 hír

        except Exception as e:
            self.logger.error(f"Hiba sport hírek keresése során: {str(e)}")
            return []
