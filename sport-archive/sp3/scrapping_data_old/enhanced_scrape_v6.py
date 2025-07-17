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

# Magyar hónapnevek a dátum formázáshoz
HUNGARIAN_MONTHS = {
    1: 'január', 2: 'február', 3: 'március', 4: 'április',
    5: 'május', 6: 'június', 7: 'július', 8: 'augusztus',
    9: 'szeptember', 10: 'október', 11: 'november', 12: 'december'
}

# Statisztika magyar nevei és szöveg párosítások
STAT_TRANSLATIONS = {
    'shots on target': 'Kapura lövések',
    'shots off target': 'Kapu mellé lövések',
    'shots blocked': 'Blokkolt lövések',
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
    'substitutions': 'Cserék'
}

def close_cookie_consent(driver):
    """Cookie consent bezárása"""
    try:
        # Várunk egy kicsit
        time.sleep(2)

        # Keressük meg az Accept gombot
        accept_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Elfogad') or contains(text(), 'OK')]")

        for button in accept_buttons:
            try:
                if button.is_displayed():
                    driver.execute_script("arguments[0].click();", button)
                    print("Cookie consent closed via Accept button")
                    time.sleep(1)
                    return True
            except:
                continue

        # Keressük meg az X gombot vagy close gombot
        close_buttons = driver.find_elements(By.XPATH, "//button[@title='Close' or @title='×' or contains(@class, 'close')]")

        for button in close_buttons:
            try:
                if button.is_displayed():
                    driver.execute_script("arguments[0].click();", button)
                    print("Cookie consent closed via Close button")
                    time.sleep(1)
                    return True
            except:
                continue

        # JavaScript-tel próbálkozunk
        driver.execute_script("""
            // Cookie consent bezárása
            var cookieElements = document.querySelectorAll('[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"]');
            cookieElements.forEach(function(el) {
                if (el.style.display !== 'none' && el.offsetParent !== null) {
                    el.style.display = 'none';
                }
            });
        """)

        print("Cookie consent closed via JavaScript")
        return True

    except Exception as e:
        print(f"Cookie consent bezárási hiba: {e}")
        return False

def get_league_and_round_info(driver, soup, debug=False):
    """Bajnokság neve és forduló számának meghatározása többféle módszerrel"""
    league_info = {
        'full_league_name': '',
        'round_number': '',
        'formatted_header': ''
    }

    # 1. Meta és title elemek vizsgálata
    title = soup.find('title')
    if title and title.text:
        title_text = title.text.strip()
        if debug:
            print(f"Title: {title_text}")

        # Bolivia keresése a címben
        if 'bolivia' in title_text.lower():
            league_info['full_league_name'] = "Bolivia Division Profesional"

    # 2. Breadcrumb vagy navigáció keresése
    try:
        nav_elements = driver.find_elements(By.CSS_SELECTOR, "nav, .breadcrumb, .navigation, [class*='nav']")
        for nav in nav_elements:
            nav_text = nav.text.strip().lower()
            if 'bolivia' in nav_text or 'division' in nav_text:
                if debug:
                    print(f"Navigation found: {nav_text}")
                league_info['full_league_name'] = "Bolivia Division Profesional"
    except:
        pass

    # 3. Header vagy főcím keresése
    try:
        header_selectors = [
            "h1", "h2", ".header", ".title", "[class*='header']", "[class*='title']",
            "[class*='league']", "[class*='tournament']", "[class*='competition']"
        ]

        for selector in header_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for element in elements:
                text = element.text.strip().lower()
                if len(text) > 5 and ('bolivia' in text or 'division' in text or 'profesional' in text):
                    if debug:
                        print(f"Header found: {element.text.strip()}")
                    league_info['full_league_name'] = "Bolivia Division Profesional"
                    break
    except:
        pass

    # 4. Forduló szám keresése
    try:
        round_patterns = [
            r'round\s*(\d+)', r'jornada\s*(\d+)', r'fecha\s*(\d+)',
            r'forduló\s*(\d+)', r'runda\s*(\d+)', r'matchday\s*(\d+)',
            r'(\d+)\.?\s*forduló', r'(\d+)\.?\s*round', r'(\d+)\.?\s*jornada'
        ]

        # Keresés az összes szövegben
        all_text = driver.find_element(By.TAG_NAME, "body").text.lower()
        for pattern in round_patterns:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match:
                league_info['round_number'] = f"{match.group(1)}. forduló"
                if debug:
                    print(f"Round found: {league_info['round_number']}")
                break
    except:
        pass

    # 5. Fallback - ha Bolívia van a csapat nevekben
    if not league_info['full_league_name']:
        # Ha Bolívia van a csapat nevekben, akkor valószínűleg bolíviai bajnokság
        if 'Bolivar' in driver.title or 'Independiente' in driver.title:
            league_info['full_league_name'] = "Bolivia Division Profesional"
            if debug:
                print("Default league set based on team names")

    # 6. Formázott header létrehozása
    if league_info['full_league_name'] and league_info['round_number']:
        league_info['formatted_header'] = f"{league_info['full_league_name']} - {league_info['round_number']}"
    elif league_info['full_league_name']:
        league_info['formatted_header'] = league_info['full_league_name']

    return league_info

def search_extra_match_info_v6(driver, soup, debug=False):
    """V6 - Továbbfejlesztett extra meccs információk keresése"""
    extra_info = {
        'referee': '',
        'venue': '',
        'capacity': '',
        'attendance': ''
    }

    if debug:
        print("🏟️ EXTRA INFO V6 KERESÉS:")

    # 1. Lapozás a lap aljára, ahol az extra információk lehetnek
    try:
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)

        # Várunk, hogy betöltődjenek az alsó elemek
        WebDriverWait(driver, 5).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
    except:
        pass

    # 2. Speciális szelektorok a meccs részletekhez
    detail_selectors = [
        "[class*='match-detail']", "[class*='game-detail']", "[class*='info']",
        "[class*='detail']", "[class*='additional']", "[class*='extra']",
        "[class*='referee']", "[class*='venue']", "[class*='stadium']",
        "[class*='attendance']", "[class*='capacity']", "[class*='official']",
        ".match-info", ".game-info", ".additional-info", ".referee-info",
        ".venue-info", ".stadium-info", ".attendance-info"
    ]

    # 3. Keresés speciális szelektorokkal
    for selector in detail_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for element in elements:
                try:
                    text = element.text.strip()
                    if len(text) > 5 and len(text) < 500:  # Ésszerű szöveghossz
                        if debug:
                            print(f"Detail element found ({selector}): {text[:100]}...")

                        # Játékvezető keresése
                        if not extra_info['referee']:
                            ref_patterns = [
                                r'(?:referee|árbitro|bíró|játékvezető|arbitro|ref)\s*:?\s*([a-záéíóöőüű\w\s\.]+)',
                                r'(?:official|hivatalos)\s*:?\s*([a-záéíóöőüű\w\s\.]+)'
                            ]
                            for pattern in ref_patterns:
                                match = re.search(pattern, text, re.IGNORECASE)
                                if match:
                                    referee_name = match.group(1).strip()
                                    if len(referee_name) > 2 and len(referee_name) < 50:
                                        extra_info['referee'] = referee_name
                                        if debug:
                                            print(f"Referee found: {referee_name}")
                                        break

                        # Helyszín keresése
                        if not extra_info['venue']:
                            venue_patterns = [
                                r'(?:venue|stadium|helyszín|pálya|stadion|estadio)\s*:?\s*([a-záéíóöőüű\w\s\.\-]+)',
                                r'(?:played at|játszott|jugado en)\s*:?\s*([a-záéíóöőüű\w\s\.\-]+)'
                            ]
                            for pattern in venue_patterns:
                                match = re.search(pattern, text, re.IGNORECASE)
                                if match:
                                    venue_name = match.group(1).strip()
                                    if len(venue_name) > 2 and len(venue_name) < 100:
                                        extra_info['venue'] = venue_name
                                        if debug:
                                            print(f"Venue found: {venue_name}")
                                        break

                        # Befogadóképesség keresése
                        if not extra_info['capacity']:
                            capacity_patterns = [
                                r'(?:capacity|befogadóképesség|kapacitás|capacidad)\s*:?\s*(\d+(?:[\.,]\d+)*)',
                                r'(?:seats|ülőhely|asientos)\s*:?\s*(\d+(?:[\.,]\d+)*)'
                            ]
                            for pattern in capacity_patterns:
                                match = re.search(pattern, text, re.IGNORECASE)
                                if match:
                                    capacity = match.group(1).strip()
                                    extra_info['capacity'] = capacity
                                    if debug:
                                        print(f"Capacity found: {capacity}")
                                    break

                        # Nézőszám keresése
                        if not extra_info['attendance']:
                            attendance_patterns = [
                                r'(?:attendance|nézőszám|nézők|asistencia)\s*:?\s*(\d+(?:[\.,]\d+)*)',
                                r'(?:spectators|közönség|espectadores)\s*:?\s*(\d+(?:[\.,]\d+)*)'
                            ]
                            for pattern in attendance_patterns:
                                match = re.search(pattern, text, re.IGNORECASE)
                                if match:
                                    attendance = match.group(1).strip()
                                    extra_info['attendance'] = attendance
                                    if debug:
                                        print(f"Attendance found: {attendance}")
                                    break

                except Exception as e:
                    if debug:
                        print(f"Element processing error: {e}")
                    continue

        except Exception as e:
            if debug:
                print(f"Selector {selector} error: {e}")
            continue

    # 4. Táblázatok keresése (néha táblázatban vannak az adatok)
    try:
        tables = driver.find_elements(By.TAG_NAME, "table")
        for table in tables:
            table_text = table.text.strip()
            if len(table_text) > 10:
                if debug:
                    print(f"Table found: {table_text[:200]}...")

                # Játékvezető keresése táblázatban
                if not extra_info['referee'] and any(keyword in table_text.lower() for keyword in ['referee', 'bíró', 'játékvezető', 'árbitro']):
                    lines = table_text.split('\n')
                    for line in lines:
                        if any(keyword in line.lower() for keyword in ['referee', 'bíró', 'játékvezető', 'árbitro']):
                            # A következő sor lehet a név
                            line_index = lines.index(line)
                            if line_index + 1 < len(lines):
                                potential_referee = lines[line_index + 1].strip()
                                if len(potential_referee) > 2 and len(potential_referee) < 50:
                                    extra_info['referee'] = potential_referee
                                    if debug:
                                        print(f"Referee found in table: {potential_referee}")
                                    break

                # Helyszín keresése táblázatban
                if not extra_info['venue'] and any(keyword in table_text.lower() for keyword in ['venue', 'stadium', 'helyszín', 'pálya']):
                    lines = table_text.split('\n')
                    for line in lines:
                        if any(keyword in line.lower() for keyword in ['venue', 'stadium', 'helyszín', 'pálya']):
                            line_index = lines.index(line)
                            if line_index + 1 < len(lines):
                                potential_venue = lines[line_index + 1].strip()
                                if len(potential_venue) > 2 and len(potential_venue) < 100:
                                    extra_info['venue'] = potential_venue
                                    if debug:
                                        print(f"Venue found in table: {potential_venue}")
                                    break

    except Exception as e:
        if debug:
            print(f"Table search error: {e}")

    # 5. Lista elemek keresése
    try:
        lists = driver.find_elements(By.CSS_SELECTOR, "ul, ol, dl")
        for ul in lists:
            list_text = ul.text.strip()
            if len(list_text) > 10:
                # Játékvezető keresése listában
                if not extra_info['referee'] and any(keyword in list_text.lower() for keyword in ['referee', 'bíró', 'játékvezető']):
                    list_items = ul.find_elements(By.TAG_NAME, "li")
                    for li in list_items:
                        li_text = li.text.strip()
                        if any(keyword in li_text.lower() for keyword in ['referee', 'bíró', 'játékvezető']):
                            # Próbáljuk kinyerni a nevet
                            ref_match = re.search(r'(?:referee|bíró|játékvezető)\s*:?\s*([a-záéíóöőüű\w\s\.]+)', li_text, re.IGNORECASE)
                            if ref_match:
                                referee_name = ref_match.group(1).strip()
                                if len(referee_name) > 2 and len(referee_name) < 50:
                                    extra_info['referee'] = referee_name
                                    if debug:
                                        print(f"Referee found in list: {referee_name}")
                                    break

    except Exception as e:
        if debug:
            print(f"List search error: {e}")

    # 6. JavaScript alapú keresés DOM-ban
    try:
        js_script = """
        var result = {referee: '', venue: '', capacity: '', attendance: ''};
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
                var venueMatch = text.match(/(?:venue|stadium|helyszín|pálya|stadion|estadio)\\s*:?\\s*([a-záéíóöőüű\\w\\s\\.\\-]+)/i);
                if (venueMatch && venueMatch[1] && venueMatch[1].length > 2 && venueMatch[1].length < 100) {
                    result.venue = venueMatch[1].trim();
                }
            }

            // Capacity keresése
            if (!result.capacity) {
                var capacityMatch = text.match(/(?:capacity|befogadóképesség|kapacitás)\\s*:?\\s*(\\d+(?:[\\.,]\\d+)*)/i);
                if (capacityMatch && capacityMatch[1]) {
                    result.capacity = capacityMatch[1].trim();
                }
            }

            // Attendance keresése
            if (!result.attendance) {
                var attendanceMatch = text.match(/(?:attendance|nézőszám|nézők)\\s*:?\\s*(\\d+(?:[\\.,]\\d+)*)/i);
                if (attendanceMatch && attendanceMatch[1]) {
                    result.attendance = attendanceMatch[1].trim();
                }
            }
        }

        return result;
        """

        js_result = driver.execute_script(js_script)

        if js_result:
            for key, value in js_result.items():
                if value and not extra_info[key]:
                    extra_info[key] = value
                    if debug:
                        print(f"JS found {key}: {value}")

    except Exception as e:
        if debug:
            print(f"JavaScript search error: {e}")

    if debug:
        print(f"Final extra info: {extra_info}")

    return extra_info

def scrape_match_events_v6(driver, soup, debug=False):
    """V6 Enhanced esemény scraping továbbfejlesztett regex-szel"""
    events = []

    try:
        # Esemény szelektorok
        event_selectors = [
            "[class*='event']", "[class*='incident']", "[class*='timeline']",
            "[class*='summary']", "[class*='highlight']", "[class*='moment']"
        ]

        for selector in event_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)

            for element in elements:
                try:
                    event_text = element.text.strip()
                    if len(event_text) < 5:
                        continue

                    # Idő keresése
                    time_match = re.search(r"(\d{1,2}(?:\+\d+)?)'", event_text)
                    if not time_match:
                        continue

                    event_time = time_match.group(1)

                    # Esemény típusának felismerése továbbfejlesztett regex-szel
                    event_type = "Unknown"
                    player = ""
                    team = ""
                    description = event_text

                    # Gól regex-ek
                    goal_patterns = [
                        r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*gól",
                        r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*goal",
                        r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*⚽",
                        r"(\w+(?:\s+\w+)*)\s*\[(\w+)\](?:\s*\(\w+\))?"
                    ]

                    for pattern in goal_patterns:
                        match = re.search(pattern, event_text, re.IGNORECASE)
                        if match and ("gól" in event_text.lower() or "goal" in event_text.lower() or "⚽" in event_text):
                            event_type = "Gól"
                            player = match.group(1).strip()
                            team = match.group(2).strip()
                            break

                    # Tizenegyesgól
                    if event_type == "Unknown":
                        penalty_patterns = [
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*(?:penalty|tizenegyes|penalti)",
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*\(P\)"
                        ]

                        for pattern in penalty_patterns:
                            match = re.search(pattern, event_text, re.IGNORECASE)
                            if match:
                                event_type = "Tizenegyesgól"
                                player = match.group(1).strip()
                                team = match.group(2).strip()
                                break

                    # Sárga lap
                    if event_type == "Unknown":
                        yellow_patterns = [
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*(?:yellow|sárga|amarilla)",
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*🟨"
                        ]

                        for pattern in yellow_patterns:
                            match = re.search(pattern, event_text, re.IGNORECASE)
                            if match:
                                event_type = "Sárga lap"
                                player = match.group(1).strip()
                                team = match.group(2).strip()
                                break

                    # Piros lap
                    if event_type == "Unknown":
                        red_patterns = [
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*(?:red|piros|roja)",
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*🟥"
                        ]

                        for pattern in red_patterns:
                            match = re.search(pattern, event_text, re.IGNORECASE)
                            if match:
                                event_type = "Piros lap"
                                player = match.group(1).strip()
                                team = match.group(2).strip()
                                break

                    # Csere
                    if event_type == "Unknown":
                        sub_patterns = [
                            r"(\w+(?:\s+\w+)*)\s*\[(\w+)\].*(?:substitution|csere|cambio)",
                            r"(\w+(?:\s+\w+)*)\s*→\s*(\w+(?:\s+\w+)*)\s*\[(\w+)\]"
                        ]

                        for pattern in sub_patterns:
                            match = re.search(pattern, event_text, re.IGNORECASE)
                            if match:
                                event_type = "Csere"
                                if "→" in event_text:
                                    player = f"{match.group(1)} → {match.group(2)}"
                                    team = match.group(3).strip()
                                else:
                                    player = match.group(1).strip()
                                    team = match.group(2).strip()
                                break

                    # Ha nincs specifikus típus, de van játékos és csapat
                    if event_type == "Unknown":
                        general_match = re.search(r"(\w+(?:\s+\w+)*)\s*\[(\w+)\]", event_text)
                        if general_match:
                            player = general_match.group(1).strip()
                            team = general_match.group(2).strip()
                            event_type = "Esemény"

                    # Esemény hozzáadása
                    if event_time:
                        event = {
                            "time": event_time,
                            "type": event_type,
                            "player": player,
                            "team": team,
                            "description": description.strip()
                        }
                        events.append(event)

                        if debug:
                            print(f"Event found: {event}")

                except Exception as e:
                    if debug:
                        print(f"Event processing error: {e}")
                    continue

    except Exception as e:
        if debug:
            print(f"Events scraping error: {e}")

    return events

def enhanced_scrape_match_details_v6(match_url, debug=False):
    """V6 Enhanced scraper - extra információkkal és továbbfejlesztett eseményekkel"""

    # Chrome driver beállítás
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=chrome_options)

    try:
        if debug:
            print(f"🔍 V6 Enhanced Scraping: {match_url}")

        # Oldal betöltése
        driver.get(match_url)
        time.sleep(3)

        # Cookie consent bezárása
        close_cookie_consent(driver)
        time.sleep(2)

        # BeautifulSoup inicializálása
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Alapértelmezett struktúra
        match_details = {
            'header': {},
            'summary': [],
            'lineups': {'home_team': [], 'away_team': []},
            'statistics': {},
            'extra_info': {},
            'scraping_metadata': {
                'version': 'v6',
                'timestamp': '',
                'source_url': match_url
            }
        }

        # 1. Header információk (bajnokság és forduló)
        league_info = get_league_and_round_info(driver, soup, debug)

        # Csapat nevek
        team_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='team'], [class*='home'], [class*='away']")
        teams = []
        for element in team_elements:
            text = element.text.strip()
            if len(text) > 2 and len(text) < 30 and text not in teams:
                teams.append(text)

        if len(teams) >= 2:
            match_details['header']['home_team'] = teams[0]
            match_details['header']['away_team'] = teams[1]

        # Eredmény
        score_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='score'], [class*='result']")
        for element in score_elements:
            score_text = element.text.strip()
            score_match = re.search(r'(\d+)\s*[-:]\s*(\d+)', score_text)
            if score_match:
                match_details['header']['score'] = {
                    'home': score_match.group(1),
                    'away': score_match.group(2),
                    'full_score': score_text
                }
                break

        # Dátum
        date_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='date'], [class*='time']")
        for element in date_elements:
            date_text = element.text.strip()
            if len(date_text) > 5 and ('2025' in date_text or '2024' in date_text):
                match_details['header']['date_time'] = date_text
                break

        # League információk hozzáadása
        match_details['header'].update(league_info)

        # 2. V6 - Továbbfejlesztett extra információk
        match_details['extra_info'] = search_extra_match_info_v6(driver, soup, debug)

        # 3. V6 - Továbbfejlesztett események
        match_details['summary'] = scrape_match_events_v6(driver, soup, debug)

        # 4. Statisztikák (korábbi logika megtartása)
        try:
            stat_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='stat'], [class*='statistic']")

            for element in stat_elements:
                try:
                    stat_text = element.text.strip().lower()

                    # Statisztika név felismerése
                    stat_name = None
                    for eng_name, hun_name in STAT_TRANSLATIONS.items():
                        if eng_name in stat_text:
                            stat_name = hun_name
                            break

                    if stat_name:
                        # Számok keresése
                        numbers = re.findall(r'\d+%?', element.text)
                        if len(numbers) >= 2:
                            match_details['statistics'][stat_name] = {
                                'home': numbers[0],
                                'away': numbers[1]
                            }

                except Exception as e:
                    if debug:
                        print(f"Statistic error: {e}")
                    continue

        except Exception as e:
            if debug:
                print(f"Statistics scraping error: {e}")

        # 5. Lineups (korábbi logika megtartása)
        try:
            lineup_elements = driver.find_elements(By.CSS_SELECTOR, "[class*='lineup'], [class*='formation']")

            for element in lineup_elements:
                try:
                    lineup_text = element.text.strip()
                    if len(lineup_text) > 10:
                        # Játékos nevek keresése
                        player_names = re.findall(r'[A-ZÁÉÍÓÖŐÜŰ][a-záéíóöőüű]+(?:\s+[A-ZÁÉÍÓÖŐÜŰ][a-záéíóöőüű]+)*', lineup_text)

                        # Felosztás hazai és vendég csapatra
                        mid_point = len(player_names) // 2
                        if mid_point > 0:
                            match_details['lineups']['home_team'] = player_names[:mid_point]
                            match_details['lineups']['away_team'] = player_names[mid_point:]
                            break

                except Exception as e:
                    if debug:
                        print(f"Lineup error: {e}")
                    continue

        except Exception as e:
            if debug:
                print(f"Lineups scraping error: {e}")

        # Metadata frissítése
        from datetime import datetime
        match_details['scraping_metadata']['timestamp'] = datetime.now().isoformat()

        return match_details

    except Exception as e:
        if debug:
            print(f"Scraping error: {e}")
        return None

    finally:
        driver.quit()

def test_enhanced_scraper_v6():
    """V6 scraper tesztelése"""
    test_url = "https://www.eredmenyek.com/fodbold/bolivia/division-profesional/bolivar-vs-independiente/fVLU1Wtb/"

    print("=" * 70)
    print("🚀 ENHANCED V6 SCRAPER TESZT")
    print("=" * 70)

    match_details = enhanced_scrape_match_details_v6(test_url, debug=True)

    if not match_details:
        print("❌ Scraping failed!")
        return

    # JSON mentése
    filename = "/home/bandi/Documents/code/2025/sp3/scrapping_data/v6_enhanced_match_details.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(match_details, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Eredmény mentve: {filename}")

    # Összefoglaló
    header = match_details['header']
    extra = match_details['extra_info']

    print(f"\n📋 HEADER INFORMÁCIÓK:")
    print(f"🏆 Bajnokság: {header.get('full_league_name', 'Nincs adat')}")
    print(f"📅 Forduló: {header.get('round_number', 'Nincs adat')}")
    print(f"📝 Formázott header: {header.get('formatted_header', 'Nincs adat')}")
    print(f"🏠 Hazai csapat: {header.get('home_team', 'Nincs adat')}")
    print(f"✈️ Vendég csapat: {header.get('away_team', 'Nincs adat')}")
    print(f"⚽ Eredmény: {header.get('score', {}).get('full_score', 'Nincs adat')}")
    print(f"📅 Dátum: {header.get('date_time', 'Nincs adat')}")

    # Extra információk
    print(f"\n🏟️ EXTRA INFORMÁCIÓK:")
    print(f"👨‍⚖️ Játékvezető: {extra.get('referee', 'Nincs adat')}")
    print(f"🏟️ Helyszín: {extra.get('venue', 'Nincs adat')}")
    print(f"👥 Befogadóképesség: {extra.get('capacity', 'Nincs adat')}")
    print(f"📊 Nézőszám: {extra.get('attendance', 'Nincs adat')}")

    print(f"\n📋 Események száma: {len(match_details['summary'])}")
    print(f"📊 Statisztikák száma: {len(match_details['statistics'])}")
    print(f"👥 Hazai játékosok: {len(match_details['lineups'].get('home_team', []))}")
    print(f"👥 Vendég játékosok: {len(match_details['lineups'].get('away_team', []))}")

    # Első néhány esemény
    print(f"\n🔍 Események:")
    for i, event in enumerate(match_details['summary'][:10]):
        print(f"  {i+1}. {event['time']} - {event['type']} - {event.get('player', 'Nincs játékos')} [{event.get('team', '')}]")

    # Statisztikák
    if match_details['statistics']:
        print(f"\n📊 STATISZTIKÁK (első 5):")
        for i, (stat_name, values) in enumerate(list(match_details['statistics'].items())[:5]):
            print(f"  {stat_name}: {values['home']} - {values['away']}")

    print(f"=" * 70)

if __name__ == "__main__":
    test_enhanced_scraper_v6()
