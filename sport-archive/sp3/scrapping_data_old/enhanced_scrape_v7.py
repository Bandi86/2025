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

# Magyar hónapnevek a dátum formázáshoz
HUNGARIAN_MONTHS = {
    1: 'január', 2: 'február', 3: 'március', 4: 'április',
    5: 'május', 6: 'június', 7: 'július', 8: 'augusztus',
    9: 'september', 10: 'október', 11: 'november', 12: 'december'
}

# Statisztika magyar nevei és szöveg párosítások
STAT_TRANSLATIONS = {
    'shots on target': 'Kapura lövések',
    'shots off target': 'Kapu mellé lövések',
    'shots blocked': 'Blokkolt lövések',
    'total shots': 'Összes lövés',
    'possession': 'Labdabirtoklás',
    'corner kicks': 'Szögletek',
    'offsides': 'Lesek',
    'fouls': 'Szabálytalanságok',
    'yellow cards': 'Sárga lapok',
    'red cards': 'Piros lapok',
    'goal kicks': 'Kapusrúgások',
    'throw ins': 'Bedobások',
    'passes': 'Passz',
    'attacks': 'Támadások',
    'dangerous attacks': 'Veszélyes támadások',
    'free kicks': 'Szabadrúgások',
    'crosses': 'Beadások',
    'substitutions': 'Cserék',
    'saves': 'Védések',
    'pass accuracy': 'Passz pontosság'
}

# Esemény típusok felismerése
EVENT_TYPE_PATTERNS = {
    'Gól': [
        r'(?:gól|goal|⚽)',
        r'(?:scored|szerzett)',
        r'(?:finds the net|betalál)',
    ],
    'Tizenegyesgól': [
        r'(?:penalty|tizenegyes|penalti)',
        r'\(P\)',
        r'(?:from the spot|a pontról)',
    ],
    'Öngól': [
        r'(?:own goal|öngól|autogol)',
        r'\(OG\)',
    ],
    'Sárga lap': [
        r'(?:yellow card|sárga lap|amarilla)',
        r'🟨',
        r'(?:booked|könyvelték)',
    ],
    'Piros lap': [
        r'(?:red card|piros lap|roja)',
        r'🟥',
        r'(?:sent off|kiállították)',
    ],
    'Második sárga lap': [
        r'(?:second yellow|második sárga)',
        r'(?:2nd yellow|2\. sárga)',
    ],
    'Csere': [
        r'(?:substitution|csere|cambio)',
        r'→|->',
        r'(?:replaced by|lecserélte)',
    ],
    'VAR': [
        r'(?:VAR|video)',
        r'(?:reviewed|ellenőrizte)',
    ],
}

class MatchScraper:
    """Enhanced V7 Match Scraper osztály"""

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

        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        try:
            self.driver = webdriver.Chrome(
                service=ChromeService(ChromeDriverManager().install()),
                options=chrome_options
            )

            # Webdriver tulajdonság elrejtése
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            logger.info("Chrome driver successfully initialized")

        except Exception as e:
            logger.error(f"Failed to initialize Chrome driver: {e}")
            raise

    def close_driver(self):
        """Driver bezárása"""
        if self.driver:
            self.driver.quit()
            logger.info("Chrome driver closed")

    def handle_cookie_consent(self):
        """Továbbfejlesztett cookie consent kezelés"""
        try:
            time.sleep(2)

            # Többféle cookie banner keresése
            cookie_selectors = [
                "button[class*='accept']",
                "button[class*='cookie']",
                "button[class*='consent']",
                "button[id*='accept']",
                "button[id*='cookie']",
                "button[id*='consent']",
                "[class*='cookie-consent'] button",
                "[class*='gdpr'] button",
                "button:contains('Accept')",
                "button:contains('Elfogad')",
                "button:contains('OK')",
            ]

            for selector in cookie_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed() and element.is_enabled():
                            self.driver.execute_script("arguments[0].click();", element)
                            logger.info(f"Cookie consent closed with selector: {selector}")
                            time.sleep(1)
                            return True
                except:
                    continue

            # JavaScript alapú bezárás
            self.driver.execute_script("""
                var cookieElements = document.querySelectorAll('[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"]');
                cookieElements.forEach(function(el) {
                    if (el.style.display !== 'none' && el.offsetParent !== null) {
                        el.style.display = 'none';
                    }
                });

                // Overlay-ek eltávolítása
                var overlays = document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"]');
                overlays.forEach(function(el) {
                    el.style.display = 'none';
                });
            """)

            logger.info("Cookie consent closed via JavaScript")
            return True

        except Exception as e:
            logger.warning(f"Cookie consent handling error: {e}")
            return False

    def extract_league_info(self, soup):
        """Bajnokság és forduló információk kinyerése"""
        league_info = {
            'full_league_name': '',
            'short_league_name': '',
            'round_number': '',
            'season': '',
            'formatted_header': ''
        }

        try:
            # 1. Title elemből
            title = soup.find('title')
            if title and title.text:
                title_text = title.text.strip()
                if self.debug:
                    logger.debug(f"Title: {title_text}")

                # Bolivia keresése
                if 'bolivia' in title_text.lower():
                    league_info['full_league_name'] = "Bolivia Division Profesional"
                    league_info['short_league_name'] = "BDP"

            # 2. Meta információkból
            meta_elements = soup.find_all('meta')
            for meta in meta_elements:
                content = meta.get('content', '')
                if 'bolivia' in content.lower() or 'division profesional' in content.lower():
                    league_info['full_league_name'] = "Bolivia Division Profesional"
                    league_info['short_league_name'] = "BDP"

            # 3. Strukturált keresés a lap tartalmában
            try:
                # Keresés speciális szelektorokkal
                league_selectors = [
                    "[class*='league']", "[class*='tournament']", "[class*='competition']",
                    "[class*='championship']", "h1", "h2", ".title", ".header"
                ]

                for selector in league_selectors:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        text = element.text.strip().lower()
                        if 'bolivia' in text or 'division' in text:
                            league_info['full_league_name'] = "Bolivia Division Profesional"
                            league_info['short_league_name'] = "BDP"
                            break

                # 4. Forduló keresése
                round_patterns = [
                    r'(?:round|jornada|fecha|forduló|matchday)\s*(\d+)',
                    r'(\d+)\.?\s*(?:forduló|round|jornada)',
                    r'week\s*(\d+)',
                    r'(\d+)\.?\s*hét'
                ]

                page_text = self.driver.find_element(By.TAG_NAME, "body").text
                for pattern in round_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        round_num = match.group(1)
                        league_info['round_number'] = f"{round_num}. forduló"
                        break

                # 5. Szezon keresése
                season_patterns = [
                    r'(20\d{2}[-/]20?\d{2})',
                    r'(20\d{2})',
                    r'season\s*(20\d{2})'
                ]

                for pattern in season_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        league_info['season'] = match.group(1)
                        break

            except Exception as e:
                logger.warning(f"League info extraction error: {e}")

            # 6. Formázott header létrehozása
            parts = []
            if league_info['full_league_name']:
                parts.append(league_info['full_league_name'])
            if league_info['season']:
                parts.append(f"({league_info['season']})")
            if league_info['round_number']:
                parts.append(f"- {league_info['round_number']}")

            league_info['formatted_header'] = ' '.join(parts)

        except Exception as e:
            logger.error(f"League info extraction failed: {e}")

        return league_info

    def extract_teams_and_score(self, soup):
        """Csapatok és eredmény kinyerése"""
        teams_info = {
            'home_team': '',
            'away_team': '',
            'score': {
                'home': '',
                'away': '',
                'full_score': ''
            }
        }

        try:
            # 1. Csapat nevek keresése
            team_selectors = [
                "[class*='team']", "[class*='home']", "[class*='away']",
                "[class*='participant']", "[class*='competitor']"
            ]

            teams = []
            for selector in team_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.text.strip()
                    # Szűrés: ésszerű csapatnév hossz
                    if 3 <= len(text) <= 30 and text not in teams:
                        # Kizárjuk a számokat és dátumokat
                        if not re.match(r'^\d+[-:]\d+$', text) and not re.match(r'^\d{2}[./]\d{2}', text):
                            teams.append(text)

            # Az első két csapat valószínűleg a hazai és vendég
            if len(teams) >= 2:
                teams_info['home_team'] = teams[0]
                teams_info['away_team'] = teams[1]

            # 2. Eredmény keresése
            score_selectors = [
                "[class*='score']", "[class*='result']", "[class*='goals']"
            ]

            for selector in score_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    score_text = element.text.strip()
                    score_match = re.search(r'(\d+)\s*[-:]\s*(\d+)', score_text)
                    if score_match:
                        teams_info['score'] = {
                            'home': score_match.group(1),
                            'away': score_match.group(2),
                            'full_score': score_text
                        }
                        break

                if teams_info['score']['full_score']:
                    break

        except Exception as e:
            logger.error(f"Teams and score extraction failed: {e}")

        return teams_info

    def extract_datetime_info(self, soup):
        """Dátum és idő információk kinyerése"""
        datetime_info = {
            'date': '',
            'time': '',
            'datetime_formatted': '',
            'timezone': ''
        }

        try:
            # 1. Meta elemek keresése
            meta_elements = soup.find_all('meta')
            for meta in meta_elements:
                if meta.get('property') == 'article:published_time' or meta.get('name') == 'date':
                    content = meta.get('content', '')
                    if content:
                        datetime_info['datetime_formatted'] = content
                        break

            # 2. Strukturált keresés
            datetime_selectors = [
                "[class*='date']", "[class*='time']", "[class*='datetime']",
                "[datetime]", "time", "[class*='kickoff']"
            ]

            for selector in datetime_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    text = element.text.strip()

                    # Dátum keresése
                    date_patterns = [
                        r'(\d{1,2})[./](\d{1,2})[./](20\d{2})',
                        r'(20\d{2})[/-](\d{1,2})[/-](\d{1,2})',
                        r'(\d{1,2})\s+(januar|februar|március|április|május|június|július|augusztus|szeptember|október|november|december)\s+(20\d{2})'
                    ]

                    for pattern in date_patterns:
                        match = re.search(pattern, text, re.IGNORECASE)
                        if match:
                            datetime_info['date'] = text
                            break

                    # Idő keresése
                    time_pattern = r'(\d{1,2}):(\d{2})'
                    time_match = re.search(time_pattern, text)
                    if time_match:
                        datetime_info['time'] = f"{time_match.group(1)}:{time_match.group(2)}"

                    if datetime_info['date'] and datetime_info['time']:
                        break

                if datetime_info['date']:
                    break

        except Exception as e:
            logger.error(f"DateTime extraction failed: {e}")

        return datetime_info

    def extract_enhanced_extra_info(self, soup):
        """Továbbfejlesztett extra információk kinyerése"""
        extra_info = {
            'referee': '',
            'venue': '',
            'capacity': '',
            'attendance': '',
            'weather': '',
            'temperature': ''
        }

        try:
            # Lapozás a lap aljára
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)

            # 1. Speciális információs blokkok keresése
            info_selectors = [
                "[class*='match-detail']", "[class*='game-detail']", "[class*='match-info']",
                "[class*='additional-info']", "[class*='referee']", "[class*='venue']",
                "[class*='stadium']", "[class*='attendance']", "[class*='weather']",
                ".match-facts", ".game-facts", ".additional-facts"
            ]

            for selector in info_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for element in elements:
                    try:
                        text = element.text.strip()
                        if 5 <= len(text) <= 500:
                            self._parse_extra_info_text(text, extra_info)
                    except:
                        continue

            # 2. Táblázatok keresése
            tables = self.driver.find_elements(By.TAG_NAME, "table")
            for table in tables:
                try:
                    table_text = table.text.strip()
                    if len(table_text) > 10:
                        self._parse_table_extra_info(table, extra_info)
                except:
                    continue

            # 3. JavaScript alapú keresés
            js_extra_info = self._extract_extra_info_js()
            for key, value in js_extra_info.items():
                if value and not extra_info[key]:
                    extra_info[key] = value

        except Exception as e:
            logger.error(f"Extra info extraction failed: {e}")

        return extra_info

    def _parse_extra_info_text(self, text, extra_info):
        """Szöveges extra információk feldolgozása"""
        # Játékvezető
        if not extra_info['referee']:
            ref_patterns = [
                r'(?:referee|árbitro|bíró|játékvezető|arbitro|ref)\s*:?\s*([a-záéíóöőüű\w\s\.]+)',
                r'(?:official|hivatalos)\s*:?\s*([a-záéíóöőüű\w\s\.]+)'
            ]
            for pattern in ref_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    referee_name = match.group(1).strip()
                    if 2 < len(referee_name) < 50:
                        extra_info['referee'] = referee_name
                        break

        # Helyszín
        if not extra_info['venue']:
            venue_patterns = [
                r'(?:venue|stadium|helyszín|pálya|stadion|estadio)\s*:?\s*([a-záéíóöőüű\w\s\.\-]+)',
                r'(?:played at|játszott|jugado en)\s*:?\s*([a-záéíóöőüű\w\s\.\-]+)'
            ]
            for pattern in venue_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    venue_name = match.group(1).strip()
                    if 2 < len(venue_name) < 100:
                        extra_info['venue'] = venue_name
                        break

        # Befogadóképesség
        if not extra_info['capacity']:
            capacity_patterns = [
                r'(?:capacity|befogadóképesség|kapacitás|capacidad)\s*:?\s*(\d+(?:[\.,]\d+)*)',
                r'(?:seats|ülőhely|asientos)\s*:?\s*(\d+(?:[\.,]\d+)*)'
            ]
            for pattern in capacity_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extra_info['capacity'] = match.group(1).strip()
                    break

        # Nézőszám
        if not extra_info['attendance']:
            attendance_patterns = [
                r'(?:attendance|nézőszám|nézők|asistencia)\s*:?\s*(\d+(?:[\.,]\d+)*)',
                r'(?:spectators|közönség|espectadores)\s*:?\s*(\d+(?:[\.,]\d+)*)'
            ]
            for pattern in attendance_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extra_info['attendance'] = match.group(1).strip()
                    break

        # Időjárás
        if not extra_info['weather']:
            weather_patterns = [
                r'(?:weather|időjárás|clima)\s*:?\s*([a-záéíóöőüű\w\s]+)',
                r'(?:conditions|körülmények|condiciones)\s*:?\s*([a-záéíóöőüű\w\s]+)'
            ]
            for pattern in weather_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    weather = match.group(1).strip()
                    if 2 < len(weather) < 50:
                        extra_info['weather'] = weather
                        break

        # Hőmérséklet
        if not extra_info['temperature']:
            temp_patterns = [
                r'(?:temperature|hőmérséklet|temperatura)\s*:?\s*(\d+(?:\.\d+)?°?[CF]?)',
                r'(\d+°[CF])',
                r'(\d+\s*degrees?)'
            ]
            for pattern in temp_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    extra_info['temperature'] = match.group(1).strip()
                    break

    def _parse_table_extra_info(self, table, extra_info):
        """Táblázat alapú extra információk feldolgozása"""
        try:
            rows = table.find_elements(By.TAG_NAME, "tr")
            for row in rows:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 2:
                    key_cell = cells[0].text.strip().lower()
                    value_cell = cells[1].text.strip()

                    if 'referee' in key_cell or 'bíró' in key_cell:
                        if not extra_info['referee'] and value_cell:
                            extra_info['referee'] = value_cell
                    elif 'venue' in key_cell or 'stadium' in key_cell or 'helyszín' in key_cell:
                        if not extra_info['venue'] and value_cell:
                            extra_info['venue'] = value_cell
                    elif 'attendance' in key_cell or 'nézőszám' in key_cell:
                        if not extra_info['attendance'] and value_cell:
                            extra_info['attendance'] = value_cell
                    elif 'capacity' in key_cell or 'kapacitás' in key_cell:
                        if not extra_info['capacity'] and value_cell:
                            extra_info['capacity'] = value_cell
        except:
            pass

    def _extract_extra_info_js(self):
        """JavaScript alapú extra információ kinyerés"""
        try:
            js_script = """
            var result = {referee: '', venue: '', capacity: '', attendance: '', weather: '', temperature: ''};
            var allElements = document.querySelectorAll('*');

            for (var i = 0; i < allElements.length; i++) {
                var element = allElements[i];
                var text = element.textContent || element.innerText || '';

                if (text.length < 5 || text.length > 200) continue;

                // Referee keresése
                if (!result.referee) {
                    var refMatch = text.match(/(?:referee|árbitro|bíró|játékvezető)\\s*:?\\s*([a-záéíóöőüű\\w\\s\\.]+)/i);
                    if (refMatch && refMatch[1] && refMatch[1].length > 2 && refMatch[1].length < 50) {
                        result.referee = refMatch[1].trim();
                    }
                }

                // Venue keresése
                if (!result.venue) {
                    var venueMatch = text.match(/(?:venue|stadium|helyszín|pálya|stadion)\\s*:?\\s*([a-záéíóöőüű\\w\\s\\.\\-]+)/i);
                    if (venueMatch && venueMatch[1] && venueMatch[1].length > 2 && venueMatch[1].length < 100) {
                        result.venue = venueMatch[1].trim();
                    }
                }

                // További mezők...
            }

            return result;
            """

            return self.driver.execute_script(js_script) or {}

        except Exception as e:
            logger.warning(f"JavaScript extra info extraction failed: {e}")
            return {}

    def extract_enhanced_events(self, soup):
        """Továbbfejlesztett események kinyerése"""
        events = []

        try:
            # Események keresése több szelektorral
            event_selectors = [
                "[class*='event']", "[class*='incident']", "[class*='timeline']",
                "[class*='summary']", "[class*='highlight']", "[class*='moment']",
                "[class*='action']", "[class*='match-event']"
            ]

            for selector in event_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                for element in elements:
                    try:
                        event_text = element.text.strip()
                        if len(event_text) < 5:
                            continue

                        event = self._parse_event_text(event_text)
                        if event:
                            events.append(event)

                    except Exception as e:
                        if self.debug:
                            logger.debug(f"Event parsing error: {e}")
                        continue

            # Duplikátumok eltávolítása
            events = self._remove_duplicate_events(events)

            # Időrend szerinti rendezés
            events.sort(key=lambda x: self._parse_event_time(x.get('time', '0')))

        except Exception as e:
            logger.error(f"Events extraction failed: {e}")

        return events

    def _parse_event_text(self, event_text):
        """Esemény szöveg feldolgozása"""
        # Idő keresése
        time_match = re.search(r"(\d{1,2}(?:\+\d+)?)'", event_text)
        if not time_match:
            return None

        event_time = time_match.group(1)

        # Esemény típus és részletek felismerése
        event_type = "Esemény"
        player = ""
        team = ""
        description = event_text

        # Esemény típusok ellenőrzése
        for event_name, patterns in EVENT_TYPE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, event_text, re.IGNORECASE):
                    event_type = event_name
                    break
            if event_type != "Esemény":
                break

        # Játékos és csapat kinyerése
        player_team_patterns = [
            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\]",
            r"(\w+(?:\s+\w+)*)\s*\((\w+)\)",
            r"(\w+(?:\s+\w+)*)\s*-\s*(\w+)"
        ]

        for pattern in player_team_patterns:
            match = re.search(pattern, event_text)
            if match:
                player = match.group(1).strip()
                team = match.group(2).strip()
                break

        # Csere speciális kezelése
        if event_type == "Csere" and "→" in event_text:
            sub_match = re.search(r"(\w+(?:\s+\w+)*)\s*→\s*(\w+(?:\s+\w+)*)\s*\[(\w+)\]", event_text)
            if sub_match:
                player = f"{sub_match.group(1)} → {sub_match.group(2)}"
                team = sub_match.group(3).strip()

        return {
            "time": event_time,
            "type": event_type,
            "player": player,
            "team": team,
            "description": description.strip()
        }

    def _parse_event_time(self, time_str):
        """Esemény idő konvertálása rendezéshez"""
        try:
            if '+' in time_str:
                base_time, extra_time = time_str.split('+')
                return int(base_time) + int(extra_time)
            return int(time_str.replace("'", ""))
        except:
            return 0

    def _remove_duplicate_events(self, events):
        """Duplikált események eltávolítása"""
        seen = set()
        unique_events = []

        for event in events:
            event_key = (event.get('time', ''), event.get('type', ''), event.get('player', ''))
            if event_key not in seen:
                seen.add(event_key)
                unique_events.append(event)

        return unique_events

    def extract_enhanced_statistics(self, soup):
        """Továbbfejlesztett statisztikák kinyerése"""
        statistics = {}

        try:
            # Statisztika szelektorok
            stat_selectors = [
                "[class*='stat']", "[class*='statistic']", "[class*='stats']",
                "[class*='data']", "[class*='numbers']"
            ]

            for selector in stat_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                for element in elements:
                    try:
                        stat_text = element.text.strip().lower()

                        # Statisztika név azonosítása
                        stat_name = None
                        for eng_name, hun_name in STAT_TRANSLATIONS.items():
                            if eng_name in stat_text:
                                stat_name = hun_name
                                break

                        if stat_name:
                            # Számok keresése
                            numbers = re.findall(r'\d+%?', element.text)
                            if len(numbers) >= 2:
                                statistics[stat_name] = {
                                    'home': numbers[0],
                                    'away': numbers[1],
                                    'raw_text': element.text.strip()
                                }
                            elif len(numbers) == 1:
                                # Százalékos érték esetén
                                if '%' in numbers[0]:
                                    statistics[stat_name] = {
                                        'home': numbers[0],
                                        'away': '',
                                        'raw_text': element.text.strip()
                                    }

                    except Exception as e:
                        if self.debug:
                            logger.debug(f"Statistic parsing error: {e}")
                        continue

        except Exception as e:
            logger.error(f"Statistics extraction failed: {e}")

        return statistics

    def extract_lineups(self, soup):
        """Csapatösszeállítások kinyerése"""
        lineups = {
            'home_team': [],
            'away_team': [],
            'formations': {
                'home': '',
                'away': ''
            }
        }

        try:
            # Lineup szelektorok
            lineup_selectors = [
                "[class*='lineup']", "[class*='formation']", "[class*='team-list']",
                "[class*='players']", "[class*='starting']"
            ]

            for selector in lineup_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                for element in elements:
                    try:
                        lineup_text = element.text.strip()
                        if len(lineup_text) > 10:

                            # Játékos nevek kinyerése (nevek nagy betűvel kezdődnek)
                            player_names = re.findall(
                                r'[A-ZÁÉÍÓÖŐÜŰ][a-záéíóöőüű]+(?:\s+[A-ZÁÉÍÓÖŐÜŰ][a-záéíóöőüű]+)*',
                                lineup_text
                            )

                            # Szűrés: csak valódi nevek
                            filtered_players = []
                            for name in player_names:
                                if (2 < len(name) < 30 and
                                    not re.match(r'^\d+$', name) and
                                    name.lower() not in ['team', 'formation', 'lineup', 'players']):
                                    filtered_players.append(name)

                            # Felosztás hazai és vendég csapatra
                            if len(filtered_players) > 10:  # Legalább 11 játékos
                                mid_point = len(filtered_players) // 2
                                lineups['home_team'] = filtered_players[:mid_point]
                                lineups['away_team'] = filtered_players[mid_point:]
                                break

                    except Exception as e:
                        if self.debug:
                            logger.debug(f"Lineup parsing error: {e}")
                        continue

                if lineups['home_team'] or lineups['away_team']:
                    break

            # Formációk keresése
            formation_patterns = [
                r'(\d{1}-\d{1}-\d{1})',
                r'(\d{1}-\d{1}-\d{1}-\d{1})',
                r'(\d{1}-\d{2}-\d{1})',
                r'(\d{1}-\d{2}-\d{2})'
            ]

            page_text = self.driver.find_element(By.TAG_NAME, "body").text
            formations_found = []

            for pattern in formation_patterns:
                matches = re.findall(pattern, page_text)
                formations_found.extend(matches)

            if len(formations_found) >= 2:
                lineups['formations']['home'] = formations_found[0]
                lineups['formations']['away'] = formations_found[1]
            elif len(formations_found) == 1:
                lineups['formations']['home'] = formations_found[0]

        except Exception as e:
            logger.error(f"Lineups extraction failed: {e}")

        return lineups

    def scrape_match_details(self, match_url):
        """Fő scraping funkció"""
        logger.info(f"🚀 V7 Enhanced Scraping: {match_url}")

        try:
            # Oldal betöltése
            self.driver.get(match_url)
            time.sleep(3)

            # Cookie consent kezelése
            self.handle_cookie_consent()
            time.sleep(2)

            # BeautifulSoup inicializálása
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Alapértelmezett struktúra
            match_details = {
                'header': {},
                'summary': [],
                'lineups': {},
                'statistics': {},
                'extra_info': {},
                'scraping_metadata': {
                    'version': 'v7',
                    'timestamp': datetime.now().isoformat(),
                    'source_url': match_url,
                    'user_agent': 'Enhanced Scraper V7'
                }
            }

            # Adatok kinyerése
            logger.info("Extracting league information...")
            league_info = self.extract_league_info(soup)

            logger.info("Extracting teams and score...")
            teams_info = self.extract_teams_and_score(soup)

            logger.info("Extracting datetime information...")
            datetime_info = self.extract_datetime_info(soup)

            logger.info("Extracting extra information...")
            extra_info = self.extract_enhanced_extra_info(soup)

            logger.info("Extracting events...")
            events = self.extract_enhanced_events(soup)

            logger.info("Extracting statistics...")
            statistics = self.extract_enhanced_statistics(soup)

            logger.info("Extracting lineups...")
            lineups = self.extract_lineups(soup)

            # Adatok összevonása
            match_details['header'] = {**league_info, **teams_info, **datetime_info}
            match_details['extra_info'] = extra_info
            match_details['summary'] = events
            match_details['statistics'] = statistics
            match_details['lineups'] = lineups

            logger.info("✅ Scraping completed successfully")
            return match_details

        except Exception as e:
            logger.error(f"❌ Scraping failed: {e}")
            return None

def test_enhanced_scraper_v7():
    """V7 scraper tesztelése"""
    test_url = "https://www.eredmenyek.com/fodbold/bolivia/division-profesional/bolivar-vs-independiente/fVLU1Wtb/"

    print("=" * 70)
    print("🚀 ENHANCED V7 SCRAPER TESZT")
    print("=" * 70)

    scraper = MatchScraper(headless=True, debug=True)

    try:
        match_details = scraper.scrape_match_details(test_url)

        if not match_details:
            print("❌ Scraping failed!")
            return

        # JSON mentése
        filename = "/home/bandi/Documents/code/2025/sp3/scrapping_data/v7_enhanced_match_details.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(match_details, f, ensure_ascii=False, indent=2)

        print(f"\n✅ Eredmény mentve: {filename}")

        # Összefoglaló kiírása
        print_summary(match_details)

    finally:
        scraper.close_driver()

def print_summary(match_details):
    """Összefoglaló kiírása"""
    header = match_details['header']
    extra = match_details['extra_info']

    print(f"\n📋 HEADER INFORMÁCIÓK:")
    print(f"🏆 Bajnokság: {header.get('full_league_name', 'Nincs adat')}")
    print(f"📅 Szezon: {header.get('season', 'Nincs adat')}")
    print(f"📅 Forduló: {header.get('round_number', 'Nincs adat')}")
    print(f"📝 Formázott header: {header.get('formatted_header', 'Nincs adat')}")
    print(f"🏠 Hazai csapat: {header.get('home_team', 'Nincs adat')}")
    print(f"✈️ Vendég csapat: {header.get('away_team', 'Nincs adat')}")
    print(f"⚽ Eredmény: {header.get('score', {}).get('full_score', 'Nincs adat')}")
    print(f"📅 Dátum: {header.get('date', 'Nincs adat')}")
    print(f"🕐 Idő: {header.get('time', 'Nincs adat')}")

    print(f"\n🏟️ EXTRA INFORMÁCIÓK:")
    print(f"👨‍⚖️ Játékvezető: {extra.get('referee', 'Nincs adat')}")
    print(f"🏟️ Helyszín: {extra.get('venue', 'Nincs adat')}")
    print(f"👥 Befogadóképesség: {extra.get('capacity', 'Nincs adat')}")
    print(f"📊 Nézőszám: {extra.get('attendance', 'Nincs adat')}")
    print(f"🌤️ Időjárás: {extra.get('weather', 'Nincs adat')}")
    print(f"🌡️ Hőmérséklet: {extra.get('temperature', 'Nincs adat')}")

    print(f"\n📊 ÖSSZESÍTÉS:")
    print(f"📋 Események száma: {len(match_details['summary'])}")
    print(f"📊 Statisztikák száma: {len(match_details['statistics'])}")
    print(f"👥 Hazai játékosok: {len(match_details['lineups'].get('home_team', []))}")
    print(f"👥 Vendég játékosok: {len(match_details['lineups'].get('away_team', []))}")
    print(f"⚽ Hazai formáció: {match_details['lineups'].get('formations', {}).get('home', 'Nincs adat')}")
    print(f"⚽ Vendég formáció: {match_details['lineups'].get('formations', {}).get('away', 'Nincs adat')}")

    # Első néhány esemény
    if match_details['summary']:
        print(f"\n🔍 ESEMÉNYEK (első 10):")
        for i, event in enumerate(match_details['summary'][:10]):
            print(f"  {i+1}. {event['time']} - {event['type']} - {event.get('player', 'Nincs játékos')} [{event.get('team', '')}]")

    # Statisztikák
    if match_details['statistics']:
        print(f"\n📊 STATISZTIKÁK (első 8):")
        for i, (stat_name, values) in enumerate(list(match_details['statistics'].items())[:8]):
            print(f"  {stat_name}: {values['home']} - {values['away']}")

    print(f"=" * 70)

if __name__ == "__main__":
    test_enhanced_scraper_v7()
