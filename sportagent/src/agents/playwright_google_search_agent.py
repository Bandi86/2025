"""
Playwright Google Search Agent - Még fejlettebb Google keresés Playwright-tal
"""
import asyncio
from playwright.async_api import async_playwright
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time
import random
import re
from urllib.parse import quote_plus

from ..utils.logger import Logger
from ..config import Config

class PlaywrightGoogleSearchAgent:
    """
    Playwright alapú Google keresési ügynök
    """

    def __init__(self):
        self.logger = Logger('playwright_google_search_agent')
        self.config = Config()

        # User agent pool
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]

    async def search_football_matches(self, query: Optional[str] = None, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Aszinkron foci mérkőzések keresése Playwright-tal
        """
        try:
            if not query:
                query = "football matches today tomorrow fixtures results"

            self.logger.info(f"Playwright Google keresés indítása: {query}")

            async with async_playwright() as p:
                # Böngésző indítása
                browser = await p.chromium.launch(
                    headless=getattr(self.config, 'headless_browser', True),
                    args=[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                )

                # Új oldal létrehozása
                page = await browser.new_page(
                    user_agent=random.choice(self.user_agents)
                )

                # Extra stealth beállítások
                await page.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                    });
                """)

                matches = []

                # Különböző keresési stratégiák
                strategies = [
                    self._search_google_main,
                    self._search_google_news,
                    self._search_sports_sites
                ]

                for strategy in strategies:
                    try:
                        self.logger.info(f"Próbálkozás {strategy.__name__} stratégiával")
                        strategy_matches = await strategy(page, query)
                        matches.extend(strategy_matches)

                        if len(matches) >= 20:
                            break

                        # Várakozás a kérések között
                        await asyncio.sleep(random.uniform(2, 5))

                    except Exception as e:
                        self.logger.warning(f"Hiba {strategy.__name__} stratégiával: {str(e)}")
                        continue

                await browser.close()

                # Duplikátumok eltávolítása
                unique_matches = self._remove_duplicates(matches)

                self.logger.info(f"Playwright keresés befejezve: {len(unique_matches)} mérkőzés találva")
                return unique_matches

        except Exception as e:
            self.logger.error(f"Hiba Playwright keresés során: {str(e)}")
            return []

    async def _search_google_main(self, page, query: str) -> List[Dict[str, Any]]:
        """
        Google fő keresés
        """
        try:
            # Google keresés
            search_url = f"https://www.google.com/search?q={quote_plus(query)}"

            # Emberi viselkedés szimulálása
            await self._simulate_human_behavior(page)

            # Oldal betöltése
            await page.goto(search_url, wait_until='networkidle')

            # Várakozás a keresési eredményekre
            await page.wait_for_selector('div.g', timeout=10000)

            # Eredmények kinyerése
            results = await page.query_selector_all('div.g')

            matches = []
            for result in results:
                try:
                    # Cím
                    title_element = await result.query_selector('h3')
                    title = await title_element.inner_text() if title_element else ""

                    # Link
                    link_element = await result.query_selector('a')
                    link = await link_element.get_attribute('href') if link_element else ""

                    # Leírás
                    snippet_element = await result.query_selector('span.st, div.s')
                    snippet = await snippet_element.inner_text() if snippet_element else ""

                    # Sport tartalom szűrés
                    if self._is_sports_content(title, snippet):
                        match_data = self._extract_match_data(title, snippet, link)
                        if match_data:
                            match_data['source'] = 'playwright_google_main'
                            matches.append(match_data)

                except Exception as e:
                    self.logger.warning(f"Hiba eredmény feldolgozásában: {str(e)}")
                    continue

            return matches

        except Exception as e:
            self.logger.error(f"Hiba Google fő keresés során: {str(e)}")
            return []

    async def _search_google_news(self, page, query: str) -> List[Dict[str, Any]]:
        """
        Google News keresés
        """
        try:
            # Google News keresés
            search_url = f"https://www.google.com/search?q={quote_plus(query)}&tbm=nws"

            await page.goto(search_url, wait_until='networkidle')

            # Várakozás a hírekre
            await page.wait_for_selector('div.g', timeout=10000)

            # Eredmények kinyerése
            results = await page.query_selector_all('div.g')

            matches = []
            for result in results:
                try:
                    # Cím
                    title_element = await result.query_selector('h3')
                    title = await title_element.inner_text() if title_element else ""

                    # Link
                    link_element = await result.query_selector('a')
                    link = await link_element.get_attribute('href') if link_element else ""

                    # Leírás
                    snippet_element = await result.query_selector('span.st, div.s')
                    snippet = await snippet_element.inner_text() if snippet_element else ""

                    # Sport tartalom szűrés
                    if self._is_sports_content(title, snippet):
                        match_data = self._extract_match_data(title, snippet, link)
                        if match_data:
                            match_data['source'] = 'playwright_google_news'
                            matches.append(match_data)

                except Exception as e:
                    self.logger.warning(f"Hiba hír feldolgozásában: {str(e)}")
                    continue

            return matches

        except Exception as e:
            self.logger.error(f"Hiba Google News keresés során: {str(e)}")
            return []

    async def _search_sports_sites(self, page, query: str) -> List[Dict[str, Any]]:
        """
        Közvetlen sport weboldalak keresése
        """
        try:
            # Ismert sport weboldalak
            sports_sites = [
                'https://www.bbc.com/sport/football',
                'https://www.espn.com/soccer/',
                'https://www.skysports.com/football',
                'https://www.goal.com/',
                'https://www.footballtransfertavern.com/'
            ]

            all_matches = []

            for site in sports_sites:
                try:
                    self.logger.info(f"Közvetlen scraping: {site}")

                    await page.goto(site, wait_until='networkidle')

                    # Címek keresése
                    headings = await page.query_selector_all('h1, h2, h3, h4')

                    for heading in headings:
                        try:
                            text = await heading.inner_text()
                            if self._is_sports_content(text, ""):
                                match_data = self._extract_match_data(text, "", site)
                                if match_data:
                                    match_data['source'] = f'playwright_direct_{site}'
                                    all_matches.append(match_data)
                        except Exception as e:
                            continue

                    # Linkek keresése
                    links = await page.query_selector_all('a')

                    for link in links:
                        try:
                            text = await link.inner_text()
                            if self._is_sports_content(text, ""):
                                match_data = self._extract_match_data(text, "", site)
                                if match_data:
                                    match_data['source'] = f'playwright_direct_{site}'
                                    all_matches.append(match_data)
                        except Exception as e:
                            continue

                    # Rövid várakozás
                    await asyncio.sleep(random.uniform(1, 3))

                except Exception as e:
                    self.logger.warning(f"Hiba {site} scraping során: {str(e)}")
                    continue

            return all_matches

        except Exception as e:
            self.logger.error(f"Hiba közvetlen sport site keresés során: {str(e)}")
            return []

    async def _simulate_human_behavior(self, page):
        """
        Emberi viselkedés szimulálása
        """
        try:
            # Véletlenszerű egér mozgás
            await page.mouse.move(random.randint(0, 100), random.randint(0, 100))

            # Rövid várakozás
            await asyncio.sleep(random.uniform(0.5, 2))

            # Scroll szimuláció
            await page.evaluate('window.scrollTo(0, 100)')
            await asyncio.sleep(random.uniform(0.3, 1))

        except Exception as e:
            self.logger.warning(f"Hiba emberi viselkedés szimulálása során: {str(e)}")

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
                'source': 'playwright_google_search',
                'source_url': link,
                'confidence': 0.85
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

    def search_football_matches_sync(self, query: Optional[str] = None, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """
        Szinkron wrapper az aszinkron kereséshez
        """
        try:
            return asyncio.run(self.search_football_matches(query, days_ahead))
        except Exception as e:
            self.logger.error(f"Hiba szinkron wrapper során: {str(e)}")
            return []
