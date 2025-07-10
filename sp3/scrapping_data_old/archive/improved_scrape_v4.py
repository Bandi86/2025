import requests
from bs4 import BeautifulSoup
from bs4.element import NavigableString
import json
from datetime import datetime, timezone
from collections import defaultdict
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Magyar hónapnevek a dátum formázáshoz
HUNGARIAN_MONTHS = {
    1: 'január', 2: 'február', 3: 'március', 4: 'április',
    5: 'május', 6: 'június', 7: 'július', 8: 'augusztus',
    9: 'szeptember', 10: 'október', 11: 'november', 12: 'december'
}

# Statisztika típusok magyar fordításokkal
STATS_TRANSLATION = {
    'ball possession': 'Labdabirtoklás',
    'possession': 'Labdabirtoklás',
    'shots': 'Lövések',
    'shots on target': 'Kapura lövések',
    'shots on goal': 'Kapura lövések',
    'corners': 'Szögletek',
    'corner kicks': 'Szögletek',
    'fouls': 'Szabálytalanságok',
    'yellow cards': 'Sárga lapok',
    'red cards': 'Piros lapok',
    'offsides': 'Lesek',
    'passes': 'Passzok',
    'pass accuracy': 'Passzpontosság',
    'free kicks': 'Szabadrúgások',
    'throw ins': 'Bedobások',
    'goal kicks': 'Kapusrúgások',
    'crosses': 'Beadások',
    'tackles': 'Szerelések',
    'saves': 'Védések',
    'goalkeeper saves': 'Kapus védések'
}

def format_hungarian_date(date_str, time_str):
    """Konvertálja a dátumot magyar formátumba"""
    try:
        # Próbáljuk meg különböző formátumokkal
        for date_format in ['%d.%m.', '%d.%m.%Y', '%Y-%m-%d']:
            try:
                if date_format == '%d.%m.':
                    # Hozzáadjuk az aktuális évet
                    current_year = datetime.now().year
                    full_date_str = f"{date_str}{current_year}"
                    parsed_date = datetime.strptime(full_date_str, '%d.%m.%Y')
                else:
                    parsed_date = datetime.strptime(date_str, date_format)
                break
            except ValueError:
                continue
        else:
            return f"{date_str} {time_str}"

        # Magyar formátum: 2025. július 8., 18:00
        month_name = HUNGARIAN_MONTHS[parsed_date.month]
        return f"{parsed_date.year}. {month_name} {parsed_date.day}., {time_str}"
    except:
        return f"{date_str} {time_str}"

def analyze_event_type_from_raw_text(raw_text):
    """Fejlett esemény típus felismerés a raw_text alapján"""
    text = raw_text.lower()

    # Gól felismerés (fejlesztett)
    if any(keyword in text for keyword in ['goal', 'gol', 'gól']):
        if 'penalty' in text or 'tizenegy' in text or 'pen' in text:
            return 'penalty_goal', 'Tizenegyesgól', parse_goal_details(raw_text)
        else:
            return 'goal', 'Gól', parse_goal_details(raw_text)

    # Csere felismerés (fejlesztett)
    if '(' in raw_text and ')' in raw_text:
        substitution_details = parse_substitution_details(raw_text)
        if substitution_details.get('type') == 'substitution':
            return 'substitution', 'Csere', substitution_details

    # Kártya felismerés (fejlesztett)
    if any(keyword in text for keyword in ['yellow', 'red', 'card', 'sárga', 'piros', 'lap']):
        if any(keyword in text for keyword in ['yellow', 'sárga']):
            return 'yellow_card', 'Sárga lap', parse_card_details(raw_text)
        elif any(keyword in text for keyword in ['red', 'piros']):
            return 'red_card', 'Piros lap', parse_card_details(raw_text)
        else:
            return 'card', 'Lap', parse_card_details(raw_text)

    # Egyéb események
    if any(keyword in text for keyword in ['injury', 'sérülés']):
        return 'injury', 'Sérülés', parse_general_event(raw_text)

    if any(keyword in text for keyword in ['var', 'video']):
        return 'var', 'VAR', parse_general_event(raw_text)

    # Alapértelmezett
    return 'event', 'Esemény', parse_general_event(raw_text)

def parse_goal_details(raw_text):
    """Gól részletek kinyerése"""
    # Formátum: "15'Player Name [TEAM]" vagy "15'Player Name (assist) [TEAM]"
    match = re.match(r"(\d+['+])([^[]+)\[([A-Z]+)\]", raw_text)
    if match:
        time = match.group(1)
        player_info = match.group(2).strip()
        team = match.group(3)

        # Gólpassz keresése
        assist_match = re.search(r'\(([^)]+)\)', player_info)
        assist = assist_match.group(1).strip() if assist_match else None

        # Játékos név tisztítása
        player = re.sub(r'\([^)]*\)', '', player_info).strip()

        return {
            'player': player,
            'team': team,
            'assist': assist,
            'type': 'goal'
        }

    return parse_general_event(raw_text)

def parse_substitution_details(raw_text):
    """Csere részletek kinyerése"""
    # Formátum: "46'Arteaga N.(Mercado A.)[IND]"
    match = re.match(r"(\d+['+])([^(]+)\(([^)]+)\)\s*\[([A-Z]+)\]", raw_text)
    if match:
        return {
            'time': match.group(1),
            'player_in': match.group(2).strip(),
            'player_out': match.group(3).strip(),
            'team': match.group(4),
            'type': 'substitution'
        }
    return parse_general_event(raw_text)

def parse_card_details(raw_text):
    """Kártya részletek kinyerése"""
    match = re.match(r"(\d+['+])([^[]+)\[([A-Z]+)\]", raw_text)
    if match:
        return {
            'time': match.group(1),
            'player': match.group(2).strip(),
            'team': match.group(3),
            'type': 'card'
        }
    return parse_general_event(raw_text)

def parse_general_event(raw_text):
    """Általános esemény feldolgozás"""
    match = re.match(r"(\d+['+])([^[]+)\[([A-Z]+)\]", raw_text)
    if match:
        return {
            'time': match.group(1),
            'player': match.group(2).strip(),
            'team': match.group(3),
            'type': 'general'
        }
    return {'raw': raw_text}

def extract_league_and_round_info(soup, debug=False):
    """Bajnokság és forduló információ kinyerése"""
    league_info = {
        'competition': '',
        'round': '',
        'full_name': ''
    }

    # Keressünk a navigációban vagy breadcrumb-ban
    nav_elements = soup.select('.breadcrumb, .navigation, nav, [class*="league"], [class*="competition"], [class*="round"]')

    for nav in nav_elements:
        text = nav.get_text(strip=True)
        if debug:
            print(f"Nav element text: {text}")

        # Keressük a bajnokság nevét és forduló számot
        if any(keyword in text.lower() for keyword in ['division', 'league', 'cup', 'bajnokság', 'forduló']):
            # Próbáljuk meg kinyerni a forduló számot
            round_match = re.search(r'(\d+)\.?\s*forduló', text, re.IGNORECASE)
            if round_match:
                league_info['round'] = f"{round_match.group(1)}. forduló"

            # Bajnokság név keresése
            comp_match = re.search(r'([A-Za-z\s]+(?:Division|League|Cup|Bajnokság)[A-Za-z\s]*)', text, re.IGNORECASE)
            if comp_match:
                league_info['competition'] = comp_match.group(1).strip()

    # Keressünk a header-ben vagy title-ben is
    header_elements = soup.select('h1, h2, h3, .header, .title, [class*="match-header"]')

    for header in header_elements:
        text = header.get_text(strip=True)
        if debug:
            print(f"Header element text: {text}")

        # Formátum keresése: "FociboBolíviaDivision Profesional - 13. forduló"
        league_round_match = re.search(r'([A-Za-z\s]+(?:Division|League|Cup)[A-Za-z\s]*)\s*-\s*(\d+\.?\s*forduló)', text, re.IGNORECASE)
        if league_round_match:
            league_info['competition'] = league_round_match.group(1).strip()
            league_info['round'] = league_round_match.group(2).strip()
            break

    # Teljes név összeállítása
    if league_info['competition'] and league_info['round']:
        league_info['full_name'] = f"{league_info['competition']} - {league_info['round']}"
    elif league_info['competition']:
        league_info['full_name'] = league_info['competition']

    return league_info

def scrape_statistics_improved(driver, base_url, debug=False):
    """Javított statisztikák scraping-je magyar elnevezésekkel"""
    try:
        stats_url = base_url + "?t=a-merkozes-statisztikaja"
        print(f"Trying stats URL: {stats_url}")
        driver.get(stats_url)

        # Várjunk egy kicsit
        import time
        time.sleep(2)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        statistics = {}

        # Keressük meg a statisztika táblázatokat
        stat_tables = soup.select('table, .stats, .statistics, [class*="stat"]')

        if debug:
            print(f"Found {len(stat_tables)} potential stats tables")

        for table in stat_tables:
            rows = table.select('tr, .stat-row, [class*="row"]')

            for row in rows:
                cells = row.select('td, th, .stat-cell, .value, [class*="cell"]')

                if len(cells) >= 3:  # Hazai - Statisztika név - Vendég
                    home_value = cells[0].get_text(strip=True)
                    stat_name = cells[1].get_text(strip=True)
                    away_value = cells[2].get_text(strip=True)

                    # Csak ha mindhárom érték létezik és a stat_name nem szám
                    if home_value and stat_name and away_value and not stat_name.replace('.', '').replace('%', '').isdigit():
                        # Magyar elnevezés keresése
                        hungarian_name = translate_stat_name(stat_name)

                        statistics[hungarian_name] = {
                            'hazai': home_value,
                            'vendég': away_value
                        }

                        if debug:
                            print(f"Stat: {hungarian_name} -> Hazai: {home_value}, Vendég: {away_value}")

        # Ha nincs eredmény, próbáljuk meg más módszerrel
        if not statistics:
            # Keressük meg a számokat és szövegeket párosítva
            all_elements = soup.select('span, div, td, th')
            potential_stats = []

            for elem in all_elements:
                text = elem.get_text(strip=True)
                if text and len(text) > 1:
                    # Ha számot vagy százalékot tartalmaz
                    if re.search(r'\d+', text):
                        potential_stats.append(text)

            # Próbáljuk meg párosítani a statisztikákat
            for i in range(0, len(potential_stats)-2, 3):
                try:
                    home_val = potential_stats[i]
                    stat_name = potential_stats[i+1]
                    away_val = potential_stats[i+2]

                    # Ellenőrizzük hogy értelmes-e
                    if (re.search(r'\d', home_val) and
                        re.search(r'\d', away_val) and
                        not stat_name.replace('.', '').replace('%', '').isdigit() and
                        len(stat_name) > 2):

                        hungarian_name = translate_stat_name(stat_name)
                        statistics[hungarian_name] = {
                            'hazai': home_val,
                            'vendég': away_val
                        }
                except:
                    continue

        return statistics

    except Exception as e:
        print(f"Error scraping statistics: {e}")
        return {}

def translate_stat_name(stat_name):
    """Statisztika név fordítása magyarra"""
    stat_lower = stat_name.lower().strip()

    # Keressük meg a megfelelő fordítást
    for english, hungarian in STATS_TRANSLATION.items():
        if english in stat_lower:
            return hungarian

    # Ha nincs fordítás, próbáljuk meg kitalálni a típust
    if any(word in stat_lower for word in ['possession', 'ball']):
        return 'Labdabirtoklás'
    elif any(word in stat_lower for word in ['shot', 'lövés']):
        return 'Lövések'
    elif any(word in stat_lower for word in ['corner', 'szöglet']):
        return 'Szögletek'
    elif any(word in stat_lower for word in ['foul', 'szabály']):
        return 'Szabálytalanságok'
    elif any(word in stat_lower for word in ['card', 'lap']):
        return 'Lapok'
    elif any(word in stat_lower for word in ['pass', 'passz']):
        return 'Passzok'

    # Ha semmi sem illeszkedik, visszaadjuk az eredetit
    return stat_name

def scrape_lineups(driver, base_url, debug=False):
    """Felállítások scraping-je"""
    try:
        lineups_url = base_url + "?t=osszeallitasok"
        print(f"Trying lineups URL: {lineups_url}")
        driver.get(lineups_url)

        # Várjunk egy kicsit
        import time
        time.sleep(2)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        lineups = {
            'hazai_csapat': [],
            'vendég_csapat': [],
            'cserék': {
                'hazai': [],
                'vendég': []
            }
        }

        # Keressük meg a felállítás táblázatokat
        lineup_tables = soup.select('table, .lineup, [class*="formation"], [class*="player"]')

        for table in lineup_tables:
            # Keressük meg a játékosokat
            players = table.select('tr, .player, [class*="player-name"]')

            current_team = None
            for player_elem in players:
                player_text = player_elem.get_text(strip=True)

                # Próbáljuk meghatározni melyik csapathoz tartozik
                if any(keyword in player_text.lower() for keyword in ['home', 'hazai', 'away', 'vendég']):
                    current_team = 'hazai' if any(keyword in player_text.lower() for keyword in ['home', 'hazai']) else 'vendég'
                    continue

                # Ha játékos nevnek tűnik
                if player_text and len(player_text) > 2 and not player_text.isdigit():
                    player_info = {
                        'név': player_text,
                        'mezszám': extract_player_number(player_text),
                        'pozíció': extract_player_position(player_text)
                    }

                    if current_team == 'hazai':
                        lineups['hazai_csapat'].append(player_info)
                    elif current_team == 'vendég':
                        lineups['vendég_csapat'].append(player_info)
                    else:
                        # Ha nem tudjuk meghatározni, próbáljuk meg a kontextusból
                        # Alapértelmezetten hazai csapat, ha kevesebb játékos van ott
                        if len(lineups['hazai_csapat']) <= len(lineups['vendég_csapat']):
                            lineups['hazai_csapat'].append(player_info)
                        else:
                            lineups['vendég_csapat'].append(player_info)

        return lineups

    except Exception as e:
        print(f"Error scraping lineups: {e}")
        return {
            'hazai_csapat': [],
            'vendég_csapat': [],
            'cserék': {'hazai': [], 'vendég': []}
        }

def extract_player_number(player_text):
    """Játékos mezszám kinyerése"""
    # Keressük meg a számot a szöveg elején vagy végén
    number_match = re.search(r'(\d+)', player_text)
    return number_match.group(1) if number_match else None

def extract_player_position(player_text):
    """Játékos pozíció kinyerése (ha van)"""
    # Keressük meg a pozíció rövidítéseket
    positions = ['GK', 'DF', 'MF', 'FW', 'SUB', 'K', 'V', 'KV', 'T', 'CS']
    for pos in positions:
        if pos in player_text.upper():
            return pos
    return None

def create_empty_match_details():
    """Üres match details struktúra létrehozása"""
    return {
        'header_info': {
            'main_title': '',
            'league_round': '',
            'competition': '',
            'round': '',
            'date_time_hungarian': '',
            'date': '',
            'time': '',
            'final_score': '',
            'home_team': '',
            'away_team': ''
        },
        'summary': [],
        'statistics': {},
        'lineups': {
            'hazai_csapat': [],
            'vendég_csapat': [],
            'cserék': {'hazai': [], 'vendég': []}
        }
    }

def scrape_match_details(url, debug=False):
    """Fő scraping function javított header és statisztika kezeléssel"""
    # Chrome driver beállítása
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

    try:
        print(f"🌐 Navigating to: {url}")
        driver.get(url)

        # Várjunk a teljes betöltésre
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        # További várakozás a JavaScript betöltésére
        import time
        time.sleep(5)

        # Cookie banner kezelése (ha van)
        try:
            cookie_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Elfogad') or contains(text(), 'OK')]")
            for button in cookie_buttons:
                try:
                    button.click()
                    time.sleep(2)
                    print("✅ Cookie banner elfogadva")
                    break
                except:
                    continue
        except:
            pass

        # Ellenőrizzük az aktuális URL-t
        current_url = driver.current_url
        print(f"📍 Current URL: {current_url}")

        # BeautifulSoup objektum létrehozása
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Ellenőrizzük a page title-t
        page_title = soup.title.string if soup.title else ""
        print(f"📄 Page title: {page_title}")

        # Keressünk meccs-specifikus elemeket
        team_elements = soup.select('[class*="team"], [class*="home"], [class*="away"], .participant')
        score_elements = soup.select('[class*="score"], [class*="result"]')

        print(f"🏟️  Found {len(team_elements)} team elements")
        print(f"⚽ Found {len(score_elements)} score elements")

        # Ha nincsenek meccs elemek, próbáljunk meg egy másik megközelítést
        if len(team_elements) < 2 and len(score_elements) < 1:
            print("⚠️  Warning: Minimal match elements found, trying alternative selectors...")
            # Alternatív szelektorok
            team_elements = soup.select('span, div, td')
            potential_teams = []
            for elem in team_elements:
                text = elem.get_text(strip=True)
                if any(team in text for team in ['Bolivar', 'Independiente', 'BOL', 'IND']):
                    potential_teams.append(text)
            print(f"🔍 Found potential team mentions: {potential_teams[:5]}")

        # === HEADER INFORMÁCIÓK KINYERÉSE (JAVÍTOTT) ===

        match_details = {
            'header_info': {
                'main_title': '',
                'league_round': '',
                'competition': '',
                'round': '',
                'date_time_hungarian': '',
                'date': '',
                'time': '',
                'final_score': '',
                'home_team': '',
                'away_team': ''
            },
            'summary': [],
            'statistics': {},
            'lineups': {}
        }

        # Page title elemzése
        page_title = soup.title.string if soup.title else ""
        match_details['header_info']['main_title'] = page_title

        # Bajnokság és forduló információ kinyerése
        league_info = extract_league_and_round_info(soup, debug)
        match_details['header_info']['competition'] = league_info['competition']
        match_details['header_info']['round'] = league_info['round']
        match_details['header_info']['league_round'] = league_info['full_name']

        # Ha nincs bajnokság info, próbáljuk meg a title-ből
        if not league_info['full_name']:
            # Keressük meg a breadcrumb vagy navigation elemeket
            breadcrumb_elements = soup.select('.breadcrumb a, nav a, [class*="nav"] a')
            for elem in breadcrumb_elements:
                text = elem.get_text(strip=True)
                if any(keyword in text.lower() for keyword in ['division', 'league', 'bajnokság', 'forduló']):
                    match_details['header_info']['league_round'] = text
                    break

        # Page title alapú információk kinyerése
        title_info = parse_page_title_info(page_title)
        match_details['header_info']['final_score'] = title_info['score']
        match_details['header_info']['home_team'] = title_info['home_team']
        match_details['header_info']['away_team'] = title_info['away_team']

        # Dátum és idő keresése
        date_elements = soup.select('.date, .time, [class*="date"], [class*="time"], .match-date, .match-time')

        for date_elem in date_elements:
            text = date_elem.get_text(strip=True)

            # Dátum felismerés
            date_match = re.search(r'(\d{1,2}[./]\d{1,2}[./]?\d{0,4})', text)
            if date_match and not match_details['header_info']['date']:
                match_details['header_info']['date'] = date_match.group(1)

            # Idő felismerés
            time_match = re.search(r'(\d{1,2}:\d{2})', text)
            if time_match and not match_details['header_info']['time']:
                match_details['header_info']['time'] = time_match.group(1)

        # Magyar dátum formázás
        if match_details['header_info']['date'] and match_details['header_info']['time']:
            match_details['header_info']['date_time_hungarian'] = format_hungarian_date(
                match_details['header_info']['date'],
                match_details['header_info']['time']
            )

        # === ESEMÉNYEK KINYERÉSE (TOVÁBBFEJLESZTETT) ===

        # Keressük meg a fő tartalom konténert
        main_content = soup.select_one('#detail-tab-content, .match-content, .match-events, body')

        if main_content:
            # Keressük meg az összes elemet ami időt tartalmaz
            time_elements = main_content.select('[class*="time"], p.time, .i-field.time, [class*="minute"]')

            if debug:
                print(f"Found {len(time_elements)} time elements")

            for time_elem in time_elements:
                # Szülő elem keresése ami tartalmazhatja az egész eseményt
                event_container = time_elem.parent
                if not event_container:
                    continue

                # Az egész esemény szövege
                full_event_text = event_container.get_text(strip=True)

                # Fejlett esemény típus felismerés
                event_type, description, details = analyze_event_type_from_raw_text(full_event_text)

                # Idő kinyerése
                time_text = time_elem.get_text(strip=True)
                time_match = re.search(r'(\d+)[:\'+]?', time_text)
                time = time_match.group(1) + "'" if time_match else time_text

                # Esemény objektum létrehozása
                event_data = {
                    'idő': time,
                    'típus': event_type,
                    'leírás': description,
                    'részletek': details
                }

                # Játékos név hozzáadása a details alapján
                if isinstance(details, dict):
                    if 'player' in details:
                        event_data['játékos'] = details['player']
                    elif 'player_in' in details:
                        event_data['játékos_be'] = details['player_in']
                        event_data['játékos_ki'] = details['player_out']

                # Raw text hozzáadása debug módban
                if debug:
                    event_data['raw_text'] = full_event_text

                match_details['summary'].append(event_data)

        # === STATISZTIKÁK KINYERÉSE (JAVÍTOTT) ===

        statistics = scrape_statistics_improved(driver, url, debug)
        match_details['statistics'] = statistics

        # === FELÁLLÍTÁSOK KINYERÉSE ===

        lineups = scrape_lineups(driver, url, debug)
        match_details['lineups'] = lineups

        return match_details

    finally:
        driver.quit()

def parse_page_title_info(page_title):
    """Kinyeri az információkat a page title-ből"""
    info = {
        'score': '',
        'home_team': '',
        'away_team': '',
        'competition': ''
    }

    if '|' in page_title:
        # Formátum: "THO 1-4 WES | Thornton Redbacks - West Wallsend"
        parts = page_title.split('|')

        if len(parts) >= 2:
            # Bal oldal: eredmény résszel
            left_part = parts[0].strip()
            # Jobb oldal: teljes csapat nevek
            right_part = parts[1].strip()

            # Eredmény keresése a bal oldalban
            score_match = re.search(r'(\d+[-:]\d+)', left_part)
            if score_match:
                info['score'] = score_match.group(1)

            # Csapat nevek a jobb oldalból
            if ' - ' in right_part:
                team_parts = right_part.split(' - ')
                info['home_team'] = team_parts[0].strip()
                info['away_team'] = team_parts[1].strip()

    return info

def test_single_match():
    """Teszt function egy meccs scraperléséhez"""
    # Próbáljunk meg egy egyszerűbb URL-t használni
    # url = "https://www.flashscore.hu/merkozes/pEekkCHe/#/a-merkozes-osszefoglaloja"
    url = "https://m.eredmenyek.com/merkozes/KOVqFIMi/"  # Mobile verzió, egyszerűbb

    print(f"🎯 Target URL: {url}")
    print("🚀 Starting scraping...")

    match_details = scrape_match_details(url, debug=True)

    # JSON fájlba mentés
    output_file = '/home/bandi/Documents/code/2025/sp3/scrapping_data/v4_match_details.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(match_details, f, ensure_ascii=False, indent=4)

    print(f"Eredmény mentve: {output_file}")

    # Összefoglaló
    header = match_details['header_info']
    print(f"\n" + "="*50)
    print(f"📄 Főcím: {header['main_title']}")
    print(f"🏆 Bajnokság: {header['competition']}")
    print(f"🔄 Forduló: {header['round']}")
    print(f"📋 Teljes név: {header['league_round']}")
    print(f"⚽ Eredmény: {header['final_score']}")
    print(f"🆚 Csapatok: {header['home_team']} vs {header['away_team']}")
    print(f"📅 Dátum: {header['date_time_hungarian']}")
    print(f"📋 Események száma: {len(match_details['summary'])}")
    print(f"📊 Statisztikák száma: {len(match_details['statistics'])}")
    print(f"👥 Hazai játékosok: {len(match_details['lineups'].get('hazai_csapat', []))}")
    print(f"👥 Vendég játékosok: {len(match_details['lineups'].get('vendég_csapat', []))}")

    # Statisztikák mintája
    print(f"\n📊 Statisztikák (első 5):")
    for i, (stat_name, values) in enumerate(list(match_details['statistics'].items())[:5]):
        print(f"  {i+1}. {stat_name}: {values['hazai']} - {values['vendég']}")

    # Események típusok szerinti bontása
    event_types = {}
    for event in match_details['summary']:
        event_type = event['típus']
        event_types[event_type] = event_types.get(event_type, 0) + 1

    print(f"\n📝 Esemény típusok:")
    for event_type, count in event_types.items():
        print(f"  - {event_type}: {count} db")

    # Első néhány esemény részletesen
    print(f"\n🔍 Első események részletesen:")
    for i, event in enumerate(match_details['summary'][:5]):
        print(f"  {i+1}. {event['idő']} - {event['leírás']}")
        if 'játékos' in event:
            print(f"     Játékos: {event['játékos']}")
        if 'játékos_ki' in event:
            print(f"     Ki: {event['játékos_ki']}")

    print(f"=" * 50)

if __name__ == "__main__":
    test_single_match()
