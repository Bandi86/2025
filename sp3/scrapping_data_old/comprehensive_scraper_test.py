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
import time
from datetime import datetime
import logging

# Logging beállítása
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FlexibleMatchScraper:
    """Rugalmas match scraper több oldalhoz"""

    def __init__(self, headless=True, debug=False):
        self.debug = debug
        self.headless = headless
        self.driver = None
        self.setup_driver()

    def setup_driver(self):
        """Chrome driver beállítása"""
        chrome_options = webdriver.ChromeOptions()

        if self.headless:
            chrome_options.add_argument('--headless')

        # Alapvető beállítások
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Több user agent rotálás
        user_agents = [
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]

        import random
        chrome_options.add_argument(f'--user-agent={random.choice(user_agents)}')

        try:
            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # Bot védelem elkerülése
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})")
            self.driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['hu-HU', 'hu', 'en-US', 'en']})")

            logger.info("Flexible Chrome driver initialized")

        except Exception as e:
            logger.error(f"Driver initialization failed: {e}")
            raise

    def test_multiple_urls(self):
        """Több URL tesztelése, hogy találjunk működőt"""
        if not self.driver:
            return []

        test_urls = [
            # Eredmenyek.com
            "https://www.eredmenyek.com/fodbold/bolivia/division-profesional/",
            "https://www.eredmenyek.com/fodbold/",
            "https://www.eredmenyek.com",

            # Alternatív sportoldalak
            "https://www.flashscore.com/football/bolivia/division-profesional/",
            "https://www.sofascore.com/football/bolivia/division-profesional",
            "https://www.livescore.com/football/bolivia/division-profesional/",

            # BBC Sport
            "https://www.bbc.com/sport/football",

            # ESPN
            "https://www.espn.com/soccer/",
        ]

        working_urls = []

        for url in test_urls:
            logger.info(f"Testing URL: {url}")

            try:
                self.driver.get(url)
                time.sleep(3)

                # Ellenőrizzük hogy betöltött-e
                body_text = self.driver.find_element(By.TAG_NAME, "body").text
                title = self.driver.title

                if len(body_text) > 500 and "hiba" not in body_text.lower() and "error" not in body_text.lower():
                    working_urls.append({
                        'url': url,
                        'title': title,
                        'body_length': len(body_text),
                        'status': 'working'
                    })
                    logger.info(f"✅ URL working: {url}")
                else:
                    logger.warning(f"❌ URL not working or minimal content: {url}")

            except Exception as e:
                logger.error(f"❌ URL failed: {url} - {e}")

        return working_urls

    def find_bolivia_matches(self, base_url):
        """Bolíviai meccsek keresése egy adott oldalon"""
        if not self.driver:
            return []

        try:
            self.driver.get(base_url)
            time.sleep(3)

            # Cookie consent kezelése
            self.handle_cookie_consent()

            # Keresés a "Bolivia" szóra
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.lower()

            if "bolivia" in body_text:
                logger.info(f"Bolivia content found on: {base_url}")

                # Linkek keresése
                links = self.driver.find_elements(By.TAG_NAME, "a")
                bolivia_links = []

                for link in links:
                    try:
                        href = link.get_attribute('href')
                        text = link.text.lower()

                        if href and ("bolivia" in href.lower() or "bolivia" in text):
                            bolivia_links.append({
                                'url': href,
                                'text': link.text.strip(),
                                'type': 'bolivia_link'
                            })
                    except:
                        continue

                return bolivia_links

            return []

        except Exception as e:
            logger.error(f"Bolivia search failed on {base_url}: {e}")
            return []

    def handle_cookie_consent(self):
        """Cookie consent kezelés"""
        if not self.driver:
            return False

        try:
            time.sleep(1)

            # Gyakori cookie gombok
            cookie_buttons = [
                "//button[contains(text(), 'Accept')]",
                "//button[contains(text(), 'Elfogad')]",
                "//button[contains(text(), 'OK')]",
                "//button[contains(text(), 'Agree')]",
                "//button[contains(@id, 'accept')]",
                "//button[contains(@class, 'accept')]"
            ]

            for xpath in cookie_buttons:
                try:
                    buttons = self.driver.find_elements(By.XPATH, xpath)
                    for button in buttons:
                        if button.is_displayed():
                            button.click()
                            logger.info(f"Cookie button clicked: {xpath}")
                            time.sleep(1)
                            return True
                except:
                    continue

            return False

        except Exception as e:
            logger.warning(f"Cookie handling failed: {e}")
            return False

    def scrape_basic_match_info(self, url):
        """Alapvető meccs információk scraping-je bármilyen oldalról"""
        if not self.driver:
            return None

        try:
            self.driver.get(url)
            time.sleep(3)

            self.handle_cookie_consent()
            time.sleep(1)

            # Alapvető információk gyűjtése
            match_info = {
                'url': url,
                'title': self.driver.title,
                'teams': [],
                'scores': [],
                'times': [],
                'dates': [],
                'leagues': [],
                'all_text_sample': '',
                'scraping_metadata': {
                    'timestamp': datetime.now().isoformat(),
                    'method': 'flexible_scraper'
                }
            }

            # Oldal szöveg
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            match_info['all_text_sample'] = body_text[:1000]  # Első 1000 karakter

            # Csapatok keresése (közös minták)
            team_patterns = [
                r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:vs|v|VS|V)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*',
                r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+-\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*',
                r'(Bolivar|Independiente|Always Ready|The Strongest|Oriente Petrolero)'
            ]

            for pattern in team_patterns:
                teams = re.findall(pattern, body_text, re.IGNORECASE)
                match_info['teams'].extend(teams)

            # Eredmények keresése
            score_patterns = [
                r'\b(\d+)\s*[-:]\s*(\d+)\b',
                r'\b(\d+)\s*-\s*(\d+)\b'
            ]

            for pattern in score_patterns:
                scores = re.findall(pattern, body_text)
                match_info['scores'].extend([f"{s[0]}-{s[1]}" for s in scores])

            # Dátumok keresése
            date_patterns = [
                r'\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b',
                r'\b(20\d{2})[/-](\d{1,2})[/-](\d{1,2})\b'
            ]

            for pattern in date_patterns:
                dates = re.findall(pattern, body_text)
                match_info['dates'].extend([f"{d[0]}.{d[1]}.{d[2]}" for d in dates])

            # Ligák keresése
            if "bolivia" in body_text.lower():
                match_info['leagues'].append("Bolivia Division Profesional")

            return match_info

        except Exception as e:
            logger.error(f"Basic scraping failed for {url}: {e}")
            return None

    def close_driver(self):
        """Driver bezárása"""
        if self.driver:
            self.driver.quit()
            logger.info("Driver closed")

def comprehensive_test():
    """Átfogó teszt több URL-lel és módszerrel"""
    print("=" * 70)
    print("🔍 COMPREHENSIVE MATCH SCRAPER TEST")
    print("=" * 70)

    scraper = FlexibleMatchScraper(headless=False, debug=True)

    try:
        # 1. URL-ek tesztelése
        print("\n📡 Testing multiple URLs...")
        working_urls = scraper.test_multiple_urls()

        print(f"\n✅ Found {len(working_urls)} working URLs:")
        for url_info in working_urls:
            print(f"  - {url_info['url']}")
            print(f"    Title: {url_info['title']}")
            print(f"    Content length: {url_info['body_length']}")

        # 2. Bolíviai tartalom keresése
        print(f"\n🇧🇴 Searching for Bolivia content...")
        bolivia_content = []

        for url_info in working_urls[:3]:  # Első 3 működő URL
            bolivia_links = scraper.find_bolivia_matches(url_info['url'])
            bolivia_content.extend(bolivia_links)

        print(f"✅ Found {len(bolivia_content)} Bolivia-related links:")
        for link in bolivia_content[:10]:  # Első 10 link
            print(f"  - {link['text'][:50]}... -> {link['url'][:70]}...")

        # 3. Alapvető scraping tesztelése
        print(f"\n⚽ Testing basic scraping...")
        test_results = []

        # Eredeti URL próbálása újra más módszerrel
        original_url = "https://www.eredmenyek.com/fodbold/bolivia/division-profesional/bolivar-vs-independiente/fVLU1Wtb/"
        result = scraper.scrape_basic_match_info(original_url)
        if result:
            test_results.append(result)

        # Bolíviai linkek próbálása
        for link in bolivia_content[:2]:
            result = scraper.scrape_basic_match_info(link['url'])
            if result:
                test_results.append(result)

        # Eredmények mentése
        output_file = "/home/bandi/Documents/code/2025/sp3/scrapping_data/comprehensive_test_results.json"
        final_results = {
            'working_urls': working_urls,
            'bolivia_content': bolivia_content,
            'scraping_results': test_results,
            'test_metadata': {
                'timestamp': datetime.now().isoformat(),
                'total_urls_tested': len(working_urls),
                'bolivia_links_found': len(bolivia_content),
                'successful_scrapes': len(test_results)
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_results, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Results saved to: {output_file}")

        # Összefoglaló
        print(f"\n📊 SUMMARY:")
        print(f"Working URLs: {len(working_urls)}")
        print(f"Bolivia links: {len(bolivia_content)}")
        print(f"Successful scrapes: {len(test_results)}")

        if test_results:
            print(f"\n🎯 Sample scraped data:")
            for i, result in enumerate(test_results[:2]):
                print(f"\nResult {i+1}:")
                print(f"  URL: {result['url']}")
                print(f"  Title: {result['title']}")
                print(f"  Teams found: {len(result['teams'])}")
                print(f"  Scores found: {len(result['scores'])}")
                if result['teams']:
                    print(f"  Sample teams: {result['teams'][:3]}")
                if result['scores']:
                    print(f"  Sample scores: {result['scores'][:3]}")

    finally:
        scraper.close_driver()

    print("=" * 70)

if __name__ == "__main__":
    comprehensive_test()
