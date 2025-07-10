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

class AdvancedMatchScraper:
    """Továbbfejlesztett V7 Match Scraper debug képességekkel"""

    def __init__(self, headless=True, debug=False):
        self.debug = debug
        self.headless = headless
        self.driver = None
        self.setup_driver()

    def setup_driver(self):
        """Chrome driver beállítása jobb felismerés érdekében"""
        chrome_options = webdriver.ChromeOptions()

        if self.headless:
            chrome_options.add_argument('--headless')

        # Emberi viselkedés szimulálása
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Valódi felhasználó szimulálása
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_argument('--accept-lang=hu-HU,hu;q=0.9,en;q=0.8')
        chrome_options.add_argument('--disable-web-security')
        chrome_options.add_argument('--allow-running-insecure-content')

        try:
            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # További bot-ellenes védelem kikerülése
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})")
            self.driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['hu-HU', 'hu', 'en-US', 'en']})")

            logger.info("Advanced Chrome driver successfully initialized")

        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            raise

    def save_debug_html(self, filename_suffix=""):
        """Debug céljára HTML mentése"""
        if self.debug and self.driver:
            try:
                html_content = self.driver.page_source
                filename = f"/home/bandi/Documents/code/2025/sp3/scrapping_data/debug_v7_page{filename_suffix}.html"
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                logger.info(f"Debug HTML saved: {filename}")
                return filename
            except Exception as e:
                logger.error(f"Failed to save debug HTML: {e}")
                return None

    def analyze_page_structure(self):
        """Oldal struktúrájának elemzése debug céljából"""
        if not self.debug or not self.driver:
            return {}

        try:
            analysis = {
                'title': self.driver.title,
                'url': self.driver.current_url,
                'body_text_length': len(self.driver.find_element(By.TAG_NAME, "body").text),
                'elements_with_classes': {},
                'common_selectors': {}
            }

            # Gyakori szelektorok vizsgálata
            common_selectors = [
                "[class*='team']", "[class*='score']", "[class*='match']",
                "[class*='event']", "[class*='stat']", "[class*='lineup']",
                "h1", "h2", "h3", ".title", ".header"
            ]

            for selector in common_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    analysis['common_selectors'][selector] = {
                        'count': len(elements),
                        'sample_text': [elem.text.strip()[:100] for elem in elements[:3] if elem.text.strip()]
                    }
                except:
                    analysis['common_selectors'][selector] = {'count': 0, 'sample_text': []}

            # Class attribútumok gyűjtése
            try:
                elements_with_class = self.driver.find_elements(By.CSS_SELECTOR, "[class]")
                class_counts = {}

                for element in elements_with_class[:50]:  # Első 50 elem
                    classes = element.get_attribute('class').split()
                    for cls in classes:
                        if cls:
                            class_counts[cls] = class_counts.get(cls, 0) + 1

                # Top 20 leggyakoribb class
                analysis['elements_with_classes'] = dict(
                    sorted(class_counts.items(), key=lambda x: x[1], reverse=True)[:20]
                )

            except Exception as e:
                logger.warning(f"Class analysis failed: {e}")

            # Eredmény mentése
            if self.debug:
                analysis_file = "/home/bandi/Documents/code/2025/sp3/scrapping_data/debug_v7_analysis.json"
                with open(analysis_file, 'w', encoding='utf-8') as f:
                    json.dump(analysis, f, ensure_ascii=False, indent=2)
                logger.info(f"Page analysis saved: {analysis_file}")

            return analysis

        except Exception as e:
            logger.error(f"Page analysis failed: {e}")
            return {}

    def smart_wait_for_content(self):
        """Okos várakozás a tartalom betöltésére"""
        if not self.driver:
            return False

        try:
            # Várakozás alapvető elemekre
            wait = WebDriverWait(self.driver, 10)

            # Próbálunk várni valamilyen tartalomra
            content_indicators = [
                "body",
                "[class*='content']",
                "[class*='main']",
                "[class*='match']",
                "[class*='game']"
            ]

            for indicator in content_indicators:
                try:
                    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, indicator)))
                    logger.info(f"Content indicator found: {indicator}")
                    break
                except TimeoutException:
                    continue

            # További várakozás JavaScript betöltésre
            wait.until(lambda driver: driver.execute_script("return document.readyState") == "complete")

            # Extra várakozás dinamikus tartalomra
            time.sleep(3)

            return True

        except Exception as e:
            logger.warning(f"Smart wait failed: {e}")
            return False

    def extract_all_possible_data(self):
        """Minden lehetséges adat kinyerése debug céljából"""
        extracted_data = {
            'all_text_elements': [],
            'potential_teams': [],
            'potential_scores': [],
            'potential_times': [],
            'potential_events': []
        }

        if not self.driver:
            return extracted_data

        try:
            # Összes szöveges elem
            all_elements = self.driver.find_elements(By.CSS_SELECTOR, "*")

            for element in all_elements:
                try:
                    text = element.text.strip()
                    if 5 <= len(text) <= 100 and text not in extracted_data['all_text_elements']:
                        extracted_data['all_text_elements'].append(text)

                        # Csapat nevek keresése
                        if any(keyword in text.lower() for keyword in ['bolivar', 'independiente', 'club', 'fc', 'cf']):
                            extracted_data['potential_teams'].append(text)

                        # Eredmény keresése
                        if re.search(r'\d+\s*[-:]\s*\d+', text):
                            extracted_data['potential_scores'].append(text)

                        # Idő keresése
                        if re.search(r'\d{1,2}[:\.]?\d{2}', text):
                            extracted_data['potential_times'].append(text)

                        # Esemény keresése
                        if any(keyword in text.lower() for keyword in ['gól', 'goal', 'card', 'lap', 'minute']):
                            extracted_data['potential_events'].append(text)

                except:
                    continue

            # Limitálás a túl hosszú listákra
            for key in extracted_data:
                if len(extracted_data[key]) > 50:
                    extracted_data[key] = extracted_data[key][:50]

            if self.debug:
                debug_file = "/home/bandi/Documents/code/2025/sp3/scrapping_data/debug_v7_extracted_data.json"
                with open(debug_file, 'w', encoding='utf-8') as f:
                    json.dump(extracted_data, f, ensure_ascii=False, indent=2)
                logger.info(f"All extracted data saved: {debug_file}")

            return extracted_data

        except Exception as e:
            logger.error(f"All data extraction failed: {e}")
            return extracted_data

    def advanced_scrape_match_details(self, match_url):
        """Továbbfejlesztett scraping debug képességekkel"""
        logger.info(f"🚀 Advanced V7 Scraping: {match_url}")

        if not self.driver:
            logger.error("Driver not initialized")
            return None

        try:
            # Oldal betöltése
            self.driver.get(match_url)

            # Okos várakozás
            self.smart_wait_for_content()

            # Debug HTML mentése betöltés után
            self.save_debug_html("_after_load")

            # Cookie banner kezelése
            self.handle_cookie_consent()
            time.sleep(2)

            # Debug HTML mentése cookie kezelés után
            self.save_debug_html("_after_cookies")

            # Oldal struktúra elemzése
            structure_analysis = self.analyze_page_structure()

            # Minden lehetséges adat kinyerése
            all_data = self.extract_all_possible_data()

            # BeautifulSoup inicializálása
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Eredmény struktúra
            match_details = {
                'header': {
                    'home_team': '',
                    'away_team': '',
                    'score': {'home': '', 'away': '', 'full_score': ''},
                    'date': '',
                    'league': '',
                    'status': 'scraped'
                },
                'summary': [],
                'lineups': {'home_team': [], 'away_team': []},
                'statistics': {},
                'extra_info': {},
                'debug_info': {
                    'structure_analysis': structure_analysis,
                    'extracted_data': all_data,
                    'page_title': self.driver.title,
                    'current_url': self.driver.current_url,
                    'body_text_sample': self.driver.find_element(By.TAG_NAME, "body").text[:500]
                },
                'scraping_metadata': {
                    'version': 'v7_advanced',
                    'timestamp': datetime.now().isoformat(),
                    'source_url': match_url,
                    'debug_mode': self.debug
                }
            }

            # Intelligent data extraction alapján
            self.intelligent_data_extraction(match_details, all_data)

            logger.info("✅ Advanced scraping completed successfully")
            return match_details

        except Exception as e:
            logger.error(f"❌ Advanced scraping failed: {e}")
            return None

    def intelligent_data_extraction(self, match_details, all_data):
        """Intelligens adatkinyerés a debug adatok alapján"""
        try:
            # Csapatok intelligens felismerése
            potential_teams = all_data.get('potential_teams', [])
            if len(potential_teams) >= 2:
                # Szűrés és rangsorolás
                filtered_teams = []
                for team in potential_teams:
                    if (3 <= len(team) <= 30 and
                        not re.match(r'^\d+$', team) and
                        team.lower() not in ['team', 'teams', 'home', 'away']):
                        filtered_teams.append(team)

                if len(filtered_teams) >= 2:
                    match_details['header']['home_team'] = filtered_teams[0]
                    match_details['header']['away_team'] = filtered_teams[1]

            # Eredmény intelligens felismerése
            potential_scores = all_data.get('potential_scores', [])
            for score in potential_scores:
                score_match = re.search(r'(\d+)\s*[-:]\s*(\d+)', score)
                if score_match:
                    match_details['header']['score'] = {
                        'home': score_match.group(1),
                        'away': score_match.group(2),
                        'full_score': score
                    }
                    break

            # Liga felismerése a title vagy URL alapján
            title = match_details['debug_info']['page_title'].lower()
            url = match_details['debug_info']['current_url'].lower()

            if 'bolivia' in title or 'bolivia' in url:
                match_details['header']['league'] = 'Bolivia Division Profesional'

            # Események intelligens felismerése
            potential_events = all_data.get('potential_events', [])
            for event_text in potential_events:
                time_match = re.search(r"(\d{1,2})'", event_text)
                if time_match:
                    event = {
                        'time': time_match.group(1),
                        'description': event_text,
                        'type': 'event'
                    }
                    match_details['summary'].append(event)

        except Exception as e:
            logger.error(f"Intelligent extraction failed: {e}")

    def handle_cookie_consent(self):
        """Cookie consent kezelés"""
        if not self.driver:
            return False

        try:
            time.sleep(2)

            # JavaScript alapú cookie banner eltávolítás
            self.driver.execute_script("""
                // Cookie banner és overlay eltávolítása
                var selectors = [
                    '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]',
                    '[class*="banner"]', '[class*="modal"]', '[class*="overlay"]',
                    '[class*="popup"]', '[id*="cookie"]', '[id*="consent"]'
                ];

                selectors.forEach(function(selector) {
                    var elements = document.querySelectorAll(selector);
                    elements.forEach(function(el) {
                        if (el.offsetParent !== null) {
                            el.style.display = 'none';
                            el.remove();
                        }
                    });
                });

                // Accept gombok kattintása
                var buttons = document.querySelectorAll('button');
                buttons.forEach(function(btn) {
                    var text = btn.textContent.toLowerCase();
                    if (text.includes('accept') || text.includes('elfogad') || text.includes('ok')) {
                        btn.click();
                    }
                });
            """)

            logger.info("Cookie consent handled via JavaScript")
            time.sleep(1)
            return True

        except Exception as e:
            logger.warning(f"Cookie consent handling failed: {e}")
            return False

    def close_driver(self):
        """Driver bezárása"""
        if self.driver:
            self.driver.quit()
            logger.info("Chrome driver closed")

def test_advanced_scraper():
    """Advanced scraper tesztelése debug móddal"""
    test_url = "https://www.eredmenyek.com/fodbold/bolivia/division-profesional/bolivar-vs-independiente/fVLU1Wtb/"

    print("=" * 70)
    print("🚀 ADVANCED V7 SCRAPER DEBUG TESZT")
    print("=" * 70)

    # Debug módban futtatás
    scraper = AdvancedMatchScraper(headless=False, debug=True)  # headless=False a vizuális debugginghez

    try:
        match_details = scraper.advanced_scrape_match_details(test_url)

        if not match_details:
            print("❌ Scraping failed!")
            return

        # JSON mentése
        filename = "/home/bandi/Documents/code/2025/sp3/scrapping_data/v7_advanced_match_details.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(match_details, f, ensure_ascii=False, indent=2)

        print(f"\n✅ Eredmény mentve: {filename}")

        # Debug információk kiírása
        print_debug_summary(match_details)

    finally:
        scraper.close_driver()

def print_debug_summary(match_details):
    """Debug összefoglaló kiírása"""
    header = match_details['header']
    debug_info = match_details['debug_info']

    print(f"\n📋 KINYERT ADATOK:")
    print(f"🏠 Hazai csapat: {header.get('home_team', 'Nincs adat')}")
    print(f"✈️ Vendég csapat: {header.get('away_team', 'Nincs adat')}")
    print(f"⚽ Eredmény: {header.get('score', {}).get('full_score', 'Nincs adat')}")
    print(f"🏆 Liga: {header.get('league', 'Nincs adat')}")
    print(f"📅 Dátum: {header.get('date', 'Nincs adat')}")

    print(f"\n🔍 DEBUG INFORMÁCIÓK:")
    print(f"📄 Oldal címe: {debug_info.get('page_title', 'Nincs')}")
    print(f"🌐 Aktuális URL: {debug_info.get('current_url', 'Nincs')}")
    print(f"📊 Oldal szöveg hossza: {len(debug_info.get('body_text_sample', ''))}")

    # Struktura elemzés
    structure = debug_info.get('structure_analysis', {})
    common_selectors = structure.get('common_selectors', {})

    print(f"\n🏗️ OLDAL STRUKTÚRA:")
    for selector, info in list(common_selectors.items())[:10]:
        print(f"  {selector}: {info['count']} elem")
        if info['sample_text']:
            print(f"    Minta: {info['sample_text'][0][:60]}...")

    # Kinyert adatok
    extracted = debug_info.get('extracted_data', {})
    print(f"\n📊 KINYERT ADATOK ÖSSZESÍTÉS:")
    print(f"🏆 Potenciális csapatok: {len(extracted.get('potential_teams', []))}")
    print(f"⚽ Potenciális eredmények: {len(extracted.get('potential_scores', []))}")
    print(f"⏰ Potenciális időpontok: {len(extracted.get('potential_times', []))}")
    print(f"📋 Potenciális események: {len(extracted.get('potential_events', []))}")

    if extracted.get('potential_teams'):
        print(f"\n🏆 Talált csapatok:")
        for team in extracted['potential_teams'][:5]:
            print(f"  - {team}")

    if extracted.get('potential_scores'):
        print(f"\n⚽ Talált eredmények:")
        for score in extracted['potential_scores'][:5]:
            print(f"  - {score}")

    print(f"=" * 70)

if __name__ == "__main__":
    test_advanced_scraper()
