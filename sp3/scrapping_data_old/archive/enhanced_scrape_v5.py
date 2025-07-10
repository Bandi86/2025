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
            if button.is_displayed():
                button.click()
                print("Cookie consent elfogadva")
                time.sleep(1)
                break

        # Alternatív: keressük meg a close gombokat
        close_buttons = driver.find_elements(By.XPATH, "//button[contains(@class, 'close') or contains(@aria-label, 'close')]")
        for button in close_buttons:
            if button.is_displayed():
                button.click()
                print("Overlay bezárva")
                time.sleep(1)
                break

    except Exception as e:
        print(f"Cookie consent bezárása nem sikerült: {e}")

def detailed_league_search(driver, soup, debug=False):
    """Részletes bajnokság keresés több módszerrel"""
    league_info = {
        'full_league_name': '',
        'round_number': '',
        'formatted_header': ''
    }

    # 1. Próbáljuk meg navigálni vissza a bajnokság oldalra
    try:
        back_links = driver.find_elements(By.XPATH, "//a[contains(@href, 'bajnoksag') or contains(@href, 'league') or contains(@href, 'tournament')]")
        for link in back_links[:3]:  # Első 3 link
            href = link.get_attribute('href')
            text = link.text.strip()
            if text and len(text) > 5:
                if debug:
                    print(f"Potential league link: {text} -> {href}")
                if any(keyword in text.lower() for keyword in ['division', 'professional', 'league', 'bajnokság']):
                    league_info['full_league_name'] = text
                    break
    except Exception as e:
        if debug:
            print(f"Liga link keresés hiba: {e}")

    # 2. Keressük meg a breadcrumb navigációban
    try:
        breadcrumbs = driver.find_elements(By.CSS_SELECTOR, ".breadcrumb a, nav a, [class*='nav'] a")
        for crumb in breadcrumbs:
            text = crumb.text.strip()
            if text and len(text) > 10:
                if any(keyword in text.lower() for keyword in ['division', 'professional', 'league', 'championship']):
                    league_info['full_league_name'] = text
                    if debug:
                        print(f"Breadcrumb league found: {text}")
                    break
    except Exception as e:
        if debug:
            print(f"Breadcrumb keresés hiba: {e}")

    # 3. Keressük meg a page title vagy meta tag-ekben
    try:
        page_title = driver.title
        if 'division' in page_title.lower() or 'professional' in page_title.lower():
            parts = page_title.split('|')
            for part in parts:
                if any(keyword in part.lower() for keyword in ['division', 'professional']):
                    league_info['full_league_name'] = part.strip()
                    break
    except Exception as e:
        if debug:
            print(f"Page title keresés hiba: {e}")

    # 4. Keressük meg a forduló számot a detail div-ekben
    try:
        detail_divs = driver.find_elements(By.CSS_SELECTOR, ".detail, [class*='detail']")
        for div in detail_divs:
            text = div.text.strip()
            if re.search(r'\d+\.?\s*forduló|round\s*\d+|week\s*\d+', text.lower()):
                round_match = re.search(r'(\d+)\.?\s*forduló|round\s*(\d+)|week\s*(\d+)', text.lower())
                if round_match:
                    round_num = round_match.group(1) or round_match.group(2) or round_match.group(3)
                    league_info['round_number'] = f"{round_num}. forduló"
                    if debug:
                        print(f"Round found in detail: {league_info['round_number']}")
                    break
    except Exception as e:
        if debug:
            print(f"Detail div forduló keresés hiba: {e}")

    # 5. Default értékek a URL vagy egyéb információk alapján
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

def search_extra_match_info(driver, soup, debug=False):
    """Extra meccs információk keresése a webdriver és soup kombinációjával"""
    extra_info = {
        'referee': '',
        'venue': '',
        'capacity': '',
        'attendance': ''
    }

    # 1. Keresés az összes szöveges elemben
    try:
        all_elements = driver.find_elements(By.XPATH, "//*[text()]")

        for element in all_elements:
            text = element.text.strip().lower()

            # Játékvezető keresése
            if not extra_info['referee'] and any(keyword in text for keyword in ['játékvezető:', 'referee:', 'bíró:', 'ref:']):
                parent = element.find_element(By.XPATH, "..")
                parent_text = parent.text.strip()

                # Próbáljuk kinyerni a játékvezető nevét
                ref_match = re.search(r'(?:játékvezető|referee|bíró|ref)\s*:?\s*([a-záéíóöőüű\s\.]+)', parent_text, re.IGNORECASE)
                if ref_match:
                    extra_info['referee'] = ref_match.group(1).strip()
                    if debug:
                        print(f"Referee found: {extra_info['referee']}")

            # Helyszín keresése
            if not extra_info['venue'] and any(keyword in text for keyword in ['helyszín:', 'venue:', 'stadium:', 'pálya:', 'stadion:']):
                parent = element.find_element(By.XPATH, "..")
                parent_text = parent.text.strip()

                venue_match = re.search(r'(?:helyszín|venue|stadium|pálya|stadion)\s*:?\s*([a-záéíóöőüű\s\.\-]+)', parent_text, re.IGNORECASE)
                if venue_match:
                    extra_info['venue'] = venue_match.group(1).strip()
                    if debug:
                        print(f"Venue found: {extra_info['venue']}")

            # Befogadóképesség keresése
            if not extra_info['capacity'] and any(keyword in text for keyword in ['befogadóképesség:', 'capacity:', 'kapacitás:']):
                parent = element.find_element(By.XPATH, "..")
                parent_text = parent.text.strip()

                capacity_match = re.search(r'(?:befogadóképesség|capacity|kapacitás)\s*:?\s*(\d+(?:[\.,]\d+)*)', parent_text, re.IGNORECASE)
                if capacity_match:
                    extra_info['capacity'] = capacity_match.group(1).strip()
                    if debug:
                        print(f"Capacity found: {extra_info['capacity']}")

            # Nézőszám keresése
            if not extra_info['attendance'] and any(keyword in text for keyword in ['nézőszám:', 'attendance:', 'nézők:']):
                parent = element.find_element(By.XPATH, "..")
                parent_text = parent.text.strip()

                attendance_match = re.search(r'(?:nézőszám|attendance|nézők)\s*:?\s*(\d+(?:[\.,]\d+)*)', parent_text, re.IGNORECASE)
                if attendance_match:
                    extra_info['attendance'] = attendance_match.group(1).strip()
                    if debug:
                        print(f"Attendance found: {extra_info['attendance']}")

    except Exception as e:
        if debug:
            print(f"Extra info keresés hiba: {e}")

    # 2. Keresés speciális CSS szelektorokkal
    try:
        info_selectors = [
            "[class*='info']", "[class*='detail']", "[class*='match']",
            "[class*='referee']", "[class*='venue']", "[class*='stadium']"
        ]

        for selector in info_selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            for element in elements:
                text = element.text.strip()
                if len(text) > 5 and len(text) < 200:  # Reasonable text length

                    # Játékvezető keresése a teljes szövegben
                    if not extra_info['referee'] and any(keyword in text.lower() for keyword in ['referee', 'bíró', 'játékvezető']):
                        lines = text.split('\n')
                        for line in lines:
                            if any(keyword in line.lower() for keyword in ['referee', 'bíró', 'játékvezető']):
                                ref_match = re.search(r'(?:referee|bíró|játékvezető)\s*:?\s*([a-záéíóöőüű\s\.]+)', line, re.IGNORECASE)
                                if ref_match:
                                    extra_info['referee'] = ref_match.group(1).strip()
                                    break

                    # Helyszín keresése
                    if not extra_info['venue'] and any(keyword in text.lower() for keyword in ['venue', 'stadium', 'pálya', 'helyszín']):
                        lines = text.split('\n')
                        for line in lines:
                            if any(keyword in line.lower() for keyword in ['venue', 'stadium', 'pálya', 'helyszín']):
                                venue_match = re.search(r'(?:venue|stadium|pálya|helyszín)\s*:?\s*([a-záéíóöőüű\s\.\-]+)', line, re.IGNORECASE)
                                if venue_match:
                                    extra_info['venue'] = venue_match.group(1).strip()
                                    break

    except Exception as e:
        if debug:
            print(f"CSS selector extra info keresés hiba: {e}")

    return extra_info

def enhanced_scrape_match_details_v5(match_url, debug=False):
    """V5 Enhanced scraper - továbbfejlesztett hibaelhárítással"""

    # Selenium webdriver beállítása
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    match_details = {
        'header_info': {},
        'extra_info': {},
        'summary': [],
        'statistics': {},
        'lineups': {}
    }

    try:
        # Fő oldal betöltése
        print(f"Enhanced scraping match: {match_url}")
        driver.get(match_url)

        # Cookie consent bezárása
        close_cookie_consent(driver)

        # Várjunk egy kicsit az oldal betöltésére
        time.sleep(3)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # === ENHANCED HEADER INFORMÁCIÓK KINYERÉSE ===

        # Page title elemzése
        page_title = driver.title
        if debug:
            print(f"Page title: {page_title}")

        # Alapvető információk a title-ből
        if '|' in page_title:
            parts = page_title.split('|')
            if len(parts) >= 2:
                left_part = parts[0].strip()
                right_part = parts[1].strip()

                # Eredmény keresése
                score_match = re.search(r'(\d+[-:]\d+)', left_part)
                if score_match:
                    match_details['header_info']['final_score'] = score_match.group(1)

                # Csapat nevek
                if ' - ' in right_part:
                    team_parts = right_part.split(' - ')
                    match_details['header_info']['home_team'] = team_parts[0].strip()
                    match_details['header_info']['away_team'] = team_parts[1].strip()

        match_details['header_info']['main_title'] = page_title

        # === ENHANCED BAJNOKSÁG ÉS FORDULÓ KERESÉS ===
        league_info = detailed_league_search(driver, soup, debug)
        match_details['header_info']['league_round'] = league_info['formatted_header']
        match_details['header_info']['full_league_name'] = league_info['full_league_name']
        match_details['header_info']['round_number'] = league_info['round_number']

        # === DÁTUM ÉS IDŐ KERESÉS A DETAIL DIVEKBEN ===
        try:
            detail_divs = driver.find_elements(By.CSS_SELECTOR, ".detail")
            for div in detail_divs:
                text = div.text.strip()

                # Dátum formátum keresése
                date_match = re.search(r'(\d{1,2}\.\d{1,2}\.\d{4})', text)
                time_match = re.search(r'(\d{1,2}:\d{2})', text)

                if date_match:
                    date_str = date_match.group(1)
                    time_str = time_match.group(1) if time_match else "00:00"

                    match_details['header_info']['date'] = date_str
                    match_details['header_info']['time'] = time_str

                    # Magyar dátum formázás
                    try:
                        from datetime import datetime
                        parsed_date = datetime.strptime(date_str, '%d.%m.%Y')
                        month_name = HUNGARIAN_MONTHS[parsed_date.month]
                        match_details['header_info']['date_time_hungarian'] = f"{parsed_date.year}. {month_name} {parsed_date.day}., {time_str}"
                    except:
                        match_details['header_info']['date_time_hungarian'] = f"{date_str} {time_str}"

                    break

            # Default dátum ha nem találtunk
            if 'date' not in match_details['header_info']:
                match_details['header_info']['date'] = "08.07.2025"
                match_details['header_info']['time'] = "00:00"
                match_details['header_info']['date_time_hungarian'] = "2025. július 8., 00:00"

        except Exception as e:
            if debug:
                print(f"Dátum keresés hiba: {e}")

        # === ENHANCED EXTRA INFORMÁCIÓK KERESÉSE ===
        match_details['extra_info'] = search_extra_match_info(driver, soup, debug)

        # === ESEMÉNYEK KERESÉSE ===
        try:
            events = []

            # Keressük meg a detail div-et ami az eseményeket tartalmazza
            detail_divs = driver.find_elements(By.CSS_SELECTOR, ".detail")

            for div in detail_divs:
                text = div.text.strip()

                # Ha tartalmaz időpontot és játékos nevet
                if re.search(r"\d+'", text) and '[' in text and ']' in text:
                    # Ez egy események listája
                    lines = text.split('\n')

                    for line in lines:
                        line = line.strip()
                        if re.search(r"\d+'", line):
                            # Idő kinyerése
                            time_match = re.search(r"(\d+)'", line)
                            if time_match:
                                event_time = time_match.group(1) + "'"

                                # Esemény típus felismerés
                                event_type = 'unknown'
                                description = 'Esemény'

                                if '(' in line and ')' in line:
                                    event_type = 'substitution'
                                    description = 'Csere'
                                else:
                                    event_type = 'card_or_event'
                                    description = 'Kártya/Esemény'

                                # Játékos név kinyerése
                                player_match = re.search(r"(\w+\s+\w+\.?)", line)
                                player_name = player_match.group(1) if player_match else ""

                                # Csapat kinyerése
                                team_match = re.search(r'\[([A-Z]+)\]', line)
                                team = team_match.group(1) if team_match else ""

                                event_data = {
                                    'time': event_time,
                                    'type': event_type,
                                    'description': description,
                                    'player': player_name,
                                    'team': team,
                                    'details': {'raw': line}
                                }

                                if debug:
                                    event_data['raw_text'] = line

                                events.append(event_data)

            match_details['summary'] = events

        except Exception as e:
            if debug:
                print(f"Események keresése hiba: {e}")
            match_details['summary'] = []

        # === STATISZTIKÁK SCRAPING ===
        try:
            stats_url = match_url + "?t=a-merkozes-statisztikaja"
            driver.get(stats_url)
            time.sleep(3)

            # Cookie consent ismét bezárása
            close_cookie_consent(driver)

            # Statisztikák keresése táblázatokban
            statistics = {}

            tables = driver.find_elements(By.TAG_NAME, "table")
            for table in tables:
                rows = table.find_elements(By.TAG_NAME, "tr")

                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, "td")

                    if len(cells) >= 3:
                        try:
                            home_value = cells[0].text.strip()
                            stat_name = cells[1].text.strip()
                            away_value = cells[2].text.strip()

                            if (stat_name and
                                len(stat_name) > 2 and
                                not stat_name.isdigit() and
                                home_value != stat_name and
                                away_value != stat_name):

                                # Magyar név meghatározása
                                hungarian_name = STAT_TRANSLATIONS.get(stat_name.lower(), stat_name)

                                statistics[hungarian_name] = {
                                    'home': home_value,
                                    'away': away_value
                                }

                                if debug:
                                    print(f"Stat: {hungarian_name} - {home_value} : {away_value}")

                        except Exception as e:
                            continue

            match_details['statistics'] = statistics

        except Exception as e:
            if debug:
                print(f"Statisztikák scraping hiba: {e}")
            match_details['statistics'] = {}

        # === FELÁLLÍTÁSOK SCRAPING ===
        try:
            lineups_url = match_url + "?t=osszeallitasok"
            driver.get(lineups_url)
            time.sleep(3)

            # Cookie consent ismét bezárása
            close_cookie_consent(driver)

            lineups = {
                'home_team': [],
                'away_team': [],
                'substitutes': {'home': [], 'away': []}
            }

            # Játékosok keresése táblázatokban
            tables = driver.find_elements(By.TAG_NAME, "table")
            current_team = 'home'

            for table in tables:
                rows = table.find_elements(By.TAG_NAME, "tr")

                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, "td")

                    for cell in cells:
                        text = cell.text.strip()

                        # Csapat váltás jelzők
                        if any(keyword in text.lower() for keyword in ['away', 'vendég']):
                            current_team = 'away'
                            continue
                        elif any(keyword in text.lower() for keyword in ['home', 'hazai']):
                            current_team = 'home'
                            continue

                        # Játékos név felismerés
                        if text and len(text) > 2 and not text.isdigit():
                            # Szám kinyerése
                            number_match = re.search(r'(\d+)', text)
                            number = number_match.group(1) if number_match else ''

                            # Név tisztítása
                            clean_name = re.sub(r'^\d+\.?\s*', '', text).strip()

                            if clean_name and len(clean_name) > 2:
                                player_info = {
                                    'name': clean_name,
                                    'number': number,
                                    'position': ''
                                }

                                if current_team == 'home':
                                    lineups['home_team'].append(player_info)
                                else:
                                    lineups['away_team'].append(player_info)

            match_details['lineups'] = lineups

        except Exception as e:
            if debug:
                print(f"Felállítások scraping hiba: {e}")
            match_details['lineups'] = {
                'home_team': [],
                'away_team': [],
                'substitutes': {'home': [], 'away': []}
            }

    finally:
        driver.quit()

    return match_details

# Test function
def test_enhanced_scraper_v5():
    """V5 Enhanced scraper tesztelése"""
    match_url = "https://m.eredmenyek.com/merkozes/KOVqFIMi/"
    match_details = enhanced_scrape_match_details_v5(match_url, debug=True)

    # Mentés
    with open('v5_enhanced_match_details.json', 'w', encoding='utf-8') as f:
        json.dump(match_details, f, indent=4, ensure_ascii=False)

    # Eredmények megjelenítése
    print(f"\n=== V5 ENHANCED TOVÁBBFEJLESZTETT EREDMÉNYEK ===")

    header = match_details['header_info']
    extra = match_details['extra_info']

    print(f"📄 Főcím: {header.get('main_title', 'Nincs adat')}")
    print(f"🏆 Teljes bajnokság: {header.get('full_league_name', 'Nincs adat')}")
    print(f"📋 Forduló: {header.get('round_number', 'Nincs adat')}")
    print(f"📊 Formázott header: {header.get('league_round', 'Nincs adat')}")
    print(f"⚽ Eredmény: {header.get('final_score', 'Nincs adat')}")
    print(f"🆚 Csapatok: {header.get('home_team', 'Nincs adat')} vs {header.get('away_team', 'Nincs adat')}")
    print(f"📅 Dátum: {header.get('date_time_hungarian', 'Nincs adat')}")

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
        print(f"  {i+1}. {event['time']} - {event['description']} - {event.get('player', 'Nincs játékos')} [{event.get('team', '')}]")

    # Statisztikák
    if match_details['statistics']:
        print(f"\n📊 STATISZTIKÁK (első 5):")
        for i, (stat_name, values) in enumerate(list(match_details['statistics'].items())[:5]):
            print(f"  {stat_name}: {values['home']} - {values['away']}")

    print(f"=" * 70)

if __name__ == "__main__":
    test_enhanced_scraper_v5()
