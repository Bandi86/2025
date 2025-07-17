import requests
from bs4 import BeautifulSoup
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime
import logging

# Logging beállítása
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FlashScoreScraper:
    """Specializált FlashScore scraper bolíviai meccsekhez"""

    def __init__(self, headless=True, debug=False):
        self.debug = debug
        self.headless = headless
        self.driver = None
        self.base_url = "https://www.flashscore.com/football/bolivia/division-profesional/"
        self.setup_driver()

    def setup_driver(self):
        """Chrome driver beállítása FlashScore-hoz optimalizálva"""
        chrome_options = webdriver.ChromeOptions()

        if self.headless:
            chrome_options.add_argument('--headless')

        # FlashScore specifikus beállítások
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Valós böngésző szimulálása
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_argument('--accept-lang=en-US,en;q=0.9')

        try:
            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # Bot védelem kikerülése
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            logger.info("FlashScore Chrome driver initialized")

        except Exception as e:
            logger.error(f"Driver initialization failed: {e}")
            raise

    def handle_flashscore_cookies(self):
        """FlashScore specifikus cookie kezelés"""
        if not self.driver:
            return False

        try:
            time.sleep(2)

            # FlashScore cookie gombok
            cookie_selectors = [
                "button[data-testid='wcmw-accept-all']",
                "button[id*='accept']",
                "button[class*='accept']",
                ".consent button",
                "#consent-accept",
                "[data-consent='accept']"
            ]

            for selector in cookie_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed():
                            element.click()
                            logger.info(f"FlashScore cookie accepted: {selector}")
                            time.sleep(1)
                            return True
                except:
                    continue

            # JavaScript alapú
            self.driver.execute_script("""
                var buttons = document.querySelectorAll('button');
                for (var i = 0; i < buttons.length; i++) {
                    var text = buttons[i].textContent.toLowerCase();
                    if (text.includes('accept') || text.includes('agree')) {
                        buttons[i].click();
                        break;
                    }
                }
            """)

            logger.info("FlashScore cookies handled")
            return True

        except Exception as e:
            logger.warning(f"Cookie handling failed: {e}")
            return False

    def wait_for_flashscore_content(self):
        """FlashScore tartalom betöltésére várakozás"""
        if not self.driver:
            return False

        try:
            wait = WebDriverWait(self.driver, 15)

            # FlashScore specifikus elemek
            content_selectors = [
                "[class*='event']",
                "[class*='match']",
                "[class*='fixture']",
                ".leagues--static",
                ".event__match"
            ]

            for selector in content_selectors:
                try:
                    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, selector)))
                    logger.info(f"FlashScore content loaded: {selector}")
                    break
                except TimeoutException:
                    continue

            # Extra várakozás JavaScript renderingre
            time.sleep(3)

            return True

        except Exception as e:
            logger.warning(f"Content wait failed: {e}")
            return False

    def extract_match_links(self):
        """Meccs linkek kinyerése FlashScore-ról"""
        match_links = []

        try:
            # Fixtures oldal betöltése
            fixtures_url = f"{self.base_url}fixtures/"
            self.driver.get(fixtures_url)

            self.handle_flashscore_cookies()
            self.wait_for_flashscore_content()

            # Meccs linkek keresése
            link_selectors = [
                "a[class*='event']",
                "a[href*='match']",
                ".event__match a",
                ".fixture a",
                "[data-testid*='match'] a"
            ]

            for selector in link_selectors:
                try:
                    links = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    for link in links:
                        href = link.get_attribute('href')
                        text = link.text.strip()

                        if href and 'flashscore.com' in href and len(text) > 3:
                            match_links.append({
                                'url': href,
                                'text': text,
                                'selector': selector
                            })

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Link extraction error for {selector}: {e}")

            # Duplikátumok eltávolítása
            unique_links = []
            seen_urls = set()

            for link in match_links:
                if link['url'] not in seen_urls:
                    seen_urls.add(link['url'])
                    unique_links.append(link)

            logger.info(f"Found {len(unique_links)} unique match links")
            return unique_links

        except Exception as e:
            logger.error(f"Match links extraction failed: {e}")
            return []

    def extract_teams_from_flashscore(self):
        """Csapatok kinyerése FlashScore-ról"""
        teams_data = []

        try:
            # Standings oldal
            standings_url = f"{self.base_url}standings/"
            self.driver.get(standings_url)

            self.handle_flashscore_cookies()
            self.wait_for_flashscore_content()

            # Csapat szelektorok
            team_selectors = [
                ".tableCellParticipant__name",
                "[class*='team']",
                "[class*='participant']",
                ".table__row .table__cell a"
            ]

            for selector in team_selectors:
                try:
                    teams = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    for team in teams:
                        team_text = team.text.strip()
                        team_link = team.get_attribute('href') if team.tag_name == 'a' else None

                        if team_text and 3 <= len(team_text) <= 50:
                            teams_data.append({
                                'name': team_text,
                                'link': team_link,
                                'selector': selector
                            })

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Team extraction error for {selector}: {e}")

            logger.info(f"Found {len(teams_data)} teams")
            return teams_data

        except Exception as e:
            logger.error(f"Teams extraction failed: {e}")
            return []

    def extract_recent_results(self):
        """Legutóbbi eredmények kinyerése"""
        results_data = []

        try:
            # Results oldal
            results_url = f"{self.base_url}results/"
            self.driver.get(results_url)

            self.handle_flashscore_cookies()
            self.wait_for_flashscore_content()

            # Eredmény szelektorok
            result_selectors = [
                ".event__match",
                "[class*='fixture']",
                "[class*='result']"
            ]

            for selector in result_selectors:
                try:
                    results = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    for result in results:
                        result_text = result.text.strip()
                        result_link = None

                        # Link keresése a result elemben
                        try:
                            link_elem = result.find_element(By.TAG_NAME, "a")
                            result_link = link_elem.get_attribute('href')
                        except:
                            pass

                        if result_text and len(result_text) > 10:
                            # Csapatok és eredmény parseolása
                            match_info = self.parse_flashscore_match_text(result_text)

                            if match_info:
                                match_info['link'] = result_link
                                match_info['selector'] = selector
                                results_data.append(match_info)

                except Exception as e:
                    if self.debug:
                        logger.debug(f"Result extraction error for {selector}: {e}")

            logger.info(f"Found {len(results_data)} results")
            return results_data

        except Exception as e:
            logger.error(f"Results extraction failed: {e}")
            return []

    def parse_flashscore_match_text(self, match_text):
        """FlashScore meccs szöveg parseolása"""
        try:
            # Bolíviai csapatok
            bolivia_teams = [
                'Bolivar', 'Independiente', 'The Strongest', 'Always Ready',
                'Oriente Petrolero', 'Jorge Wilstermann', 'Real Santa Cruz',
                'Nacional Potosi', 'Aurora', 'Blooming', 'Real Tomayapo',
                'Guabira', 'Real Potosi'
            ]

            match_info = {
                'home_team': '',
                'away_team': '',
                'score_home': '',
                'score_away': '',
                'date': '',
                'time': '',
                'status': '',
                'raw_text': match_text
            }

            # Csapatok keresése
            found_teams = []
            for team in bolivia_teams:
                if team.lower() in match_text.lower():
                    found_teams.append(team)

            if len(found_teams) >= 2:
                match_info['home_team'] = found_teams[0]
                match_info['away_team'] = found_teams[1]

            # Eredmény keresése
            score_patterns = [
                r'(\d+)\s*[-:]\s*(\d+)',
                r'(\d+)\s*-\s*(\d+)'
            ]

            for pattern in score_patterns:
                score_match = re.search(pattern, match_text)
                if score_match:
                    match_info['score_home'] = score_match.group(1)
                    match_info['score_away'] = score_match.group(2)
                    break

            # Dátum és idő keresése
            date_patterns = [
                r'(\d{1,2})[./](\d{1,2})[./](20\d{2})',
                r'(\d{1,2})[./](\d{1,2})'
            ]

            for pattern in date_patterns:
                date_match = re.search(pattern, match_text)
                if date_match:
                    match_info['date'] = date_match.group(0)
                    break

            time_pattern = r'(\d{1,2}):(\d{2})'
            time_match = re.search(time_pattern, match_text)
            if time_match:
                match_info['time'] = f"{time_match.group(1)}:{time_match.group(2)}"

            # Státusz
            if 'FT' in match_text:
                match_info['status'] = 'Finished'
            elif 'LIVE' in match_text:
                match_info['status'] = 'Live'
            elif any(keyword in match_text.lower() for keyword in ['today', 'tomorrow']):
                match_info['status'] = 'Scheduled'

            return match_info if match_info['home_team'] and match_info['away_team'] else None

        except Exception as e:
            if self.debug:
                logger.debug(f"Match text parsing error: {e}")
            return None

    def scrape_detailed_match(self, match_url):
        """Részletes meccs adatok scraping-je"""
        try:
            self.driver.get(match_url)
            self.handle_flashscore_cookies()
            self.wait_for_flashscore_content()

            match_details = {
                'url': match_url,
                'header': {},
                'events': [],
                'statistics': {},
                'lineups': {},
                'scraping_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'source': 'flashscore',
                    'version': 'v7_flashscore'
                }
            }

            # Header információk
            try:
                title = self.driver.title
                match_details['header']['title'] = title

                # Csapatok a title-ból
                title_parts = title.split(' - ')
                if len(title_parts) >= 2:
                    teams_part = title_parts[0]
                    vs_match = re.search(r'(.+?)\s+vs?\s+(.+)', teams_part, re.IGNORECASE)
                    if vs_match:
                        match_details['header']['home_team'] = vs_match.group(1).strip()
                        match_details['header']['away_team'] = vs_match.group(2).strip()

            except Exception as e:
                logger.warning(f"Header extraction failed: {e}")

            # Eredmény
            try:
                score_selectors = [
                    ".detailScore__wrapper",
                    "[class*='score']",
                    ".smv__homeResult, .smv__awayResult"
                ]

                for selector in score_selectors:
                    score_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in score_elements:
                        score_text = elem.text.strip()
                        score_match = re.search(r'(\d+)\s*[-:]\s*(\d+)', score_text)
                        if score_match:
                            match_details['header']['score'] = {
                                'home': score_match.group(1),
                                'away': score_match.group(2),
                                'full': score_text
                            }
                            break
                    if 'score' in match_details['header']:
                        break

            except Exception as e:
                logger.warning(f"Score extraction failed: {e}")

            # Események
            try:
                event_selectors = [
                    ".smv__incident",
                    "[class*='incident']",
                    "[class*='event']"
                ]

                for selector in event_selectors:
                    events = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for event in events:
                        event_text = event.text.strip()
                        if len(event_text) > 5:
                            event_data = self.parse_flashscore_event(event_text)
                            if event_data:
                                match_details['events'].append(event_data)

            except Exception as e:
                logger.warning(f"Events extraction failed: {e}")

            return match_details

        except Exception as e:
            logger.error(f"Detailed match scraping failed: {e}")
            return None

    def parse_flashscore_event(self, event_text):
        """FlashScore esemény parseolása"""
        try:
            # Idő keresése
            time_match = re.search(r"(\d{1,2}(?:\+\d+)?)'", event_text)
            if not time_match:
                return None

            event_time = time_match.group(1)

            # Esemény típus felismerése
            event_type = "Event"
            if "goal" in event_text.lower() or "⚽" in event_text:
                event_type = "Goal"
            elif "yellow" in event_text.lower() or "🟨" in event_text:
                event_type = "Yellow Card"
            elif "red" in event_text.lower() or "🟥" in event_text:
                event_type = "Red Card"
            elif "substitution" in event_text.lower() or "sub" in event_text.lower():
                event_type = "Substitution"

            return {
                'time': event_time,
                'type': event_type,
                'description': event_text,
                'raw_text': event_text
            }

        except Exception as e:
            return None

    def comprehensive_scrape(self):
        """Átfogó FlashScore scraping"""
        logger.info("🚀 Starting comprehensive FlashScore scraping...")

        scraping_results = {
            'teams': [],
            'match_links': [],
            'recent_results': [],
            'detailed_matches': [],
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'source': 'flashscore',
                'base_url': self.base_url
            }
        }

        try:
            # 1. Csapatok kinyerése
            logger.info("Extracting teams...")
            scraping_results['teams'] = self.extract_teams_from_flashscore()

            # 2. Meccs linkek kinyerése
            logger.info("Extracting match links...")
            scraping_results['match_links'] = self.extract_match_links()

            # 3. Legutóbbi eredmények
            logger.info("Extracting recent results...")
            scraping_results['recent_results'] = self.extract_recent_results()

            # 4. Részletes meccs adatok (első néhány)
            logger.info("Extracting detailed match data...")
            for i, match_link in enumerate(scraping_results['match_links'][:3]):  # Első 3 meccs
                logger.info(f"Scraping detailed match {i+1}: {match_link['url']}")
                detailed_match = self.scrape_detailed_match(match_link['url'])
                if detailed_match:
                    scraping_results['detailed_matches'].append(detailed_match)
                time.sleep(2)  # Rate limiting

            return scraping_results

        except Exception as e:
            logger.error(f"Comprehensive scraping failed: {e}")
            return scraping_results

    def close_driver(self):
        """Driver bezárása"""
        if self.driver:
            self.driver.quit()
            logger.info("FlashScore driver closed")

def test_flashscore_scraper():
    """FlashScore scraper tesztelése"""
    print("=" * 70)
    print("⚡ FLASHSCORE BOLIVIA SCRAPER TEST")
    print("=" * 70)

    scraper = FlashScoreScraper(headless=False, debug=True)

    try:
        # Átfogó scraping
        results = scraper.comprehensive_scrape()

        # Eredmények mentése
        output_file = "/home/bandi/Documents/code/2025/sp3/scrapping_data/flashscore_bolivia_data.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Results saved to: {output_file}")

        # Összefoglaló
        print(f"\n📊 SCRAPING SUMMARY:")
        print(f"🏆 Teams found: {len(results['teams'])}")
        print(f"🔗 Match links found: {len(results['match_links'])}")
        print(f"📋 Recent results: {len(results['recent_results'])}")
        print(f"⚽ Detailed matches: {len(results['detailed_matches'])}")

        # Sample adatok
        if results['teams']:
            print(f"\n🏆 Sample teams:")
            for team in results['teams'][:5]:
                print(f"  - {team['name']}")

        if results['recent_results']:
            print(f"\n📋 Sample results:")
            for result in results['recent_results'][:3]:
                home = result.get('home_team', 'N/A')
                away = result.get('away_team', 'N/A')
                score_h = result.get('score_home', '')
                score_a = result.get('score_away', '')
                print(f"  - {home} {score_h}-{score_a} {away}")

        if results['detailed_matches']:
            print(f"\n⚽ Sample detailed match:")
            match = results['detailed_matches'][0]
            header = match.get('header', {})
            print(f"  Title: {header.get('title', 'N/A')}")
            print(f"  Teams: {header.get('home_team', 'N/A')} vs {header.get('away_team', 'N/A')}")
            if 'score' in header:
                print(f"  Score: {header['score'].get('full', 'N/A')}")
            print(f"  Events: {len(match.get('events', []))}")

    finally:
        scraper.close_driver()

    print("=" * 70)

if __name__ == "__main__":
    test_flashscore_scraper()
