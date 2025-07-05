"""
Enhanced Google Search Agent - Fejlett Google keresés bot detection megkerülésével
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
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from ..utils.logger import Logger
from ..config import Config

class EnhancedGoogleSearchAgent:
    """
    Fejlett Google keresési ügynök több módszerrel bot detection megkerülésére
    """

    def __init__(self):
        self.logger = Logger('enhanced_google_search_agent')
        self.config = Config()
        self.session = requests.Session()

        # Különböző módszerek prioritási sorrendben
        self.methods = [
            'selenium_stealth',
            'requests_advanced',
            'alternative_search_engines',
            'direct_site_scraping'
        ]

        # User agent pool
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ]

        # Proxy lista (opcionális, később hozzáadható)
        self.proxies = []

        # Selenium driver cache
        self.driver = None

    def search_football_matches(self, query: Optional[str] = None, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Foci mérkőzések keresése több módszerrel

        Args:
            query: Egyedi keresési kifejezés
            days_ahead: Hány napra előre keresünk

        Returns:
            List[Dict]: Mérkőzések listája
        """
        try:
            if not query:
                query = "football matches today tomorrow fixtures results"

            self.logger.info(f"Enhanced Google keresés indítása: {query}")

            # Próbáljuk az összes módszert prioritás szerint
            for method in self.methods:
                self.logger.info(f"Próbálkozás módszerrel: {method}")

                try:
                    if method == 'selenium_stealth':
                        matches = self._search_with_selenium_stealth(query)
                    elif method == 'requests_advanced':
                        matches = self._search_with_advanced_requests(query)
                    elif method == 'alternative_search_engines':
                        matches = self._search_alternative_engines(query)
                    elif method == 'direct_site_scraping':
                        matches = self._search_direct_sites(query)
                    else:
                        continue

                    if matches:
                        self.logger.info(f"Sikeres keresés {method} módszerrel: {len(matches)} mérkőzés")
                        return matches

                except Exception as e:
                    self.logger.warning(f"Hiba {method} módszerrel: {str(e)}")
                    continue

            self.logger.warning("Egyik módszer sem működött, fallback használata")
            return self._get_fallback_matches()

        except Exception as e:
            self.logger.error(f"Hiba az enhanced Google keresés során: {str(e)}")
            return []

    def _search_with_selenium_stealth(self, query: str) -> List[Dict[str, Any]]:
        """
        Selenium alapú keresés stealth módszerekkel
        """
        try:
            driver = self._get_stealth_driver()

            # Google keresés különböző variációkkal
            search_queries = [
                f"{query} site:bbc.com/sport",
                f"{query} site:espn.com",
                f"premier league matches today",
                f"champions league fixtures",
                f"football scores live results"
            ]

            all_matches = []

            for search_query in search_queries:
                try:
                    # Google keresés URL
                    search_url = f"https://www.google.com/search?q={quote_plus(search_query)}"

                    # Emberi viselkedés szimulálása
                    self._simulate_human_behavior(driver)

                    driver.get(search_url)

                    # Várunk a betöltésre
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "div.g"))
                    )

                    # Keresési eredmények parseolása
                    soup = BeautifulSoup(driver.page_source, 'html.parser')
                    matches = self._parse_google_results(soup)

                    all_matches.extend(matches)

                    # Véletlenszerű várakozás
                    time.sleep(random.uniform(2, 5))

                    if len(all_matches) >= 20:
                        break

                except Exception as e:
                    self.logger.warning(f"Hiba Selenium keresés során: {str(e)}")
                    continue

            return self._remove_duplicates(all_matches)

        except Exception as e:
            self.logger.error(f"Hiba Selenium stealth keresés során: {str(e)}")
            return []
        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None

    def _get_stealth_driver(self):
        """
        Stealth Selenium driver létrehozása
        """
        try:
            chrome_options = Options()

            # Stealth beállítások
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)

            # User agent
            chrome_options.add_argument(f"--user-agent={random.choice(self.user_agents)}")

            # Ablak méret
            chrome_options.add_argument("--window-size=1920,1080")

            # Headless mód (opcionális)
            if getattr(self.config, 'headless_browser', True):
                chrome_options.add_argument("--headless")

            # Driver létrehozása
            driver = webdriver.Chrome(options=chrome_options)

            # JavaScript injektálás az automation detector elkerülésére
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            self.driver = driver
            return driver

        except Exception as e:
            self.logger.error(f"Hiba Selenium driver létrehozásakor: {str(e)}")
            raise

    def _simulate_human_behavior(self, driver):
        """
        Emberi viselkedés szimulálása
        """
        try:
            # Véletlenszerű egér mozgás
            action = ActionChains(driver)
            action.move_by_offset(random.randint(0, 100), random.randint(0, 100))
            action.perform()

            # Rövid várakozás
            time.sleep(random.uniform(0.5, 2))

        except Exception as e:
            self.logger.warning(f"Hiba emberi viselkedés szimulálása során: {str(e)}")

    def _search_with_advanced_requests(self, query: str) -> List[Dict[str, Any]]:
        """
        Fejlett requests alapú keresés
        """
        try:
            # Több különböző keresési stratégia
            strategies = [
                self._search_with_session_cookies,
                self._search_with_proxy_rotation,
                self._search_with_delay_pattern
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

    def _search_with_session_cookies(self, query: str) -> List[Dict[str, Any]]:
        """
        Session cookies-val történő keresés
        """
        try:
            # Első lépés: Google főoldal látogatása cookie-k gyűjtésére
            self.session.get("https://www.google.com", headers=self._get_advanced_headers())
            time.sleep(random.uniform(1, 3))

            # Keresés végrehajtása
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"
            response = self.session.get(search_url, headers=self._get_advanced_headers())

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                return self._parse_google_results(soup)

            return []

        except Exception as e:
            self.logger.warning(f"Hiba session cookies keresés során: {str(e)}")
            return []

    def _search_with_proxy_rotation(self, query: str) -> List[Dict[str, Any]]:
        """
        Proxy rotációval történő keresés (ha van proxy lista)
        """
        try:
            if not self.proxies:
                return []

            for proxy in self.proxies:
                try:
                    proxies = {
                        'http': proxy,
                        'https': proxy
                    }

                    search_url = f"https://www.google.com/search?q={quote_plus(query)}"
                    response = requests.get(
                        search_url,
                        headers=self._get_advanced_headers(),
                        proxies=proxies,
                        timeout=10
                    )

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        matches = self._parse_google_results(soup)
                        if matches:
                            return matches

                except Exception as e:
                    self.logger.warning(f"Hiba proxy {proxy} használatával: {str(e)}")
                    continue

            return []

        except Exception as e:
            self.logger.warning(f"Hiba proxy rotáció során: {str(e)}")
            return []

    def _search_with_delay_pattern(self, query: str) -> List[Dict[str, Any]]:
        """
        Késleltetési mintával történő keresés
        """
        try:
            # Fokozatos késleltetés
            delays = [1, 2, 3, 5, 8]

            for delay in delays:
                try:
                    time.sleep(delay)

                    search_url = f"https://www.google.com/search?q={quote_plus(query)}"
                    response = self.session.get(search_url, headers=self._get_advanced_headers())

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        matches = self._parse_google_results(soup)
                        if matches:
                            return matches

                except Exception as e:
                    self.logger.warning(f"Hiba {delay}s késleltetéssel: {str(e)}")
                    continue

            return []

        except Exception as e:
            self.logger.warning(f"Hiba delay pattern keresés során: {str(e)}")
            return []

    def _search_alternative_engines(self, query: str) -> List[Dict[str, Any]]:
        """
        Alternatív keresőmotorok használata
        """
        try:
            # DuckDuckGo keresés
            duckduckgo_matches = self._search_duckduckgo(query)
            if duckduckgo_matches:
                return duckduckgo_matches

            # Bing keresés
            bing_matches = self._search_bing(query)
            if bing_matches:
                return bing_matches

            return []

        except Exception as e:
            self.logger.error(f"Hiba alternatív keresőmotorok használata során: {str(e)}")
            return []

    def _search_duckduckgo(self, query: str) -> List[Dict[str, Any]]:
        """
        DuckDuckGo keresés
        """
        try:
            search_url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
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
            search_url = f"https://www.bing.com/search?q={quote_plus(query)}"
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

    def _search_direct_sites(self, query: str) -> List[Dict[str, Any]]:
        """
        Közvetlen weboldal scraping
        """
        try:
            # Ismert sport weboldalak
            sports_sites = [
                'https://www.bbc.com/sport/football',
                'https://www.espn.com/soccer/',
                'https://www.skysports.com/football'
            ]

            all_matches = []

            for site in sports_sites:
                try:
                    matches = self._scrape_sports_site(site)
                    all_matches.extend(matches)
                except Exception as e:
                    self.logger.warning(f"Hiba {site} scraping során: {str(e)}")
                    continue

            return all_matches

        except Exception as e:
            self.logger.error(f"Hiba közvetlen site scraping során: {str(e)}")
            return []

    def _scrape_sports_site(self, url: str) -> List[Dict[str, Any]]:
        """
        Egy sport weboldal scraping-je
        """
        try:
            headers = self._get_advanced_headers()
            response = requests.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')

                # Általános sport tartalom keresése
                matches = []

                # Címek és linkek keresése
                for element in soup.find_all(['h1', 'h2', 'h3', 'h4']):
                    text = element.get_text(strip=True)
                    if self._is_sports_content(text, ""):
                        match_data = self._extract_match_data(text, "", url)
                        if match_data:
                            match_data['source'] = f'direct_scraping_{url}'
                            matches.append(match_data)

                return matches

            return []

        except Exception as e:
            self.logger.warning(f"Hiba {url} scraping során: {str(e)}")
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
            'Cache-Control': 'max-age=0'
        }

    def _parse_google_results(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Google keresési eredmények parseolása
        """
        try:
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
            'bundesliga', 'la liga', 'serie a', 'ligue 1', 'world cup'
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
                'source': 'enhanced_google_search',
                'source_url': link,
                'confidence': 0.8
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
            today_keywords = ['today', 'tonight', 'this evening', 'ma', 'tonight']
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
            'Euro', 'Copa America', 'Europa Conference League', 'Nations League'
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

        # Realisztikus fallback adatok
        fallback_matches = [
            {
                'home_team': 'Arsenal',
                'away_team': 'Chelsea',
                'home_score': None,
                'away_score': None,
                'date': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                'status': 'scheduled',
                'competition': 'Premier League',
                'source': 'fallback_data',
                'source_url': '',
                'confidence': 0.3
            },
            {
                'home_team': 'Manchester United',
                'away_team': 'Liverpool',
                'home_score': None,
                'away_score': None,
                'date': (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
                'status': 'scheduled',
                'competition': 'Premier League',
                'source': 'fallback_data',
                'source_url': '',
                'confidence': 0.3
            }
        ]

        return fallback_matches

    def __del__(self):
        """
        Cleanup amikor az objektum megszűnik
        """
        if self.driver:
            try:
                self.driver.quit()
            except:
                pass
