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

    # Gólok felismerése
    if '(büntető)' in text or '(penalty)' in text:
        return 'penalty_goal', 'Tizenegyesgól', extract_penalty_info(raw_text)
    elif 'gól' in text or 'goal' in text:
        return 'goal', 'Gól', extract_goal_info(raw_text)

    # Cserék felismerése - ha két név van zárójelekkel
    if '(' in raw_text and ')' in raw_text and not '(büntető)' in text:
        # Formátum: "46'Arteaga N.(Mercado A.)[IND]"
        return 'substitution', 'Csere', extract_substitution_info(raw_text)

    # Kártyák felismerése - ha csak egy név van
    # Ez spekuláció, de a 4-0-s eredménynél valószínűleg vannak kártyák
    single_name_match = re.match(r"\d+['+]([^()\[\]]+)\s*\[[A-Z]+\]", raw_text)
    if single_name_match:
        player_name = single_name_match.group(1).strip()
        # Ha nincsenek zárójelek, valószínűleg kártya vagy egyéb esemény
        return 'card_or_event', 'Kártya/Esemény', {'player': player_name, 'details': 'Ismeretlen típus'}

    return 'unknown', 'Ismeretlen esemény', {'raw': raw_text}

def extract_penalty_info(raw_text):
    """Büntetőgól információk kinyerése"""
    # Formátum: "72'Romero D. (Büntető) [BOL]"
    match = re.match(r"(\d+['+])([^(]+)\(Büntető\)\s*\[([A-Z]+)\]", raw_text)
    if match:
        return {
            'time': match.group(1),
            'player': match.group(2).strip(),
            'team': match.group(3),
            'type': 'penalty'
        }
    return {'raw': raw_text}

def extract_goal_info(raw_text):
    """Normál gól információk kinyerése"""
    match = re.match(r"(\d+['+])([^()\[\]]+)\s*\[([A-Z]+)\]", raw_text)
    if match:
        return {
            'time': match.group(1),
            'player': match.group(2).strip(),
            'team': match.group(3),
            'type': 'goal'
        }
    return {'raw': raw_text}

def extract_substitution_info(raw_text):
    """Csere információk kinyerése"""
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
    return {'raw': raw_text}

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

def scrape_statistics(driver, base_url, debug=False):
    """Statisztikák scraping-je"""
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
        stat_containers = soup.select('.statistics, [class*="stat"], table, .data-table')

        for container in stat_containers:
            # Keressük meg a sorokat
            rows = container.select('tr, .stat-row, [class*="row"]')

            for row in rows:
                # Keressük meg a statisztika nevét és értékeit
                cells = row.select('td, .stat-value, [class*="value"], [class*="home"], [class*="away"]')

                if len(cells) >= 3:  # név, hazai érték, vendég érték
                    stat_name = cells[0].get_text(strip=True)
                    home_value = cells[1].get_text(strip=True)
                    away_value = cells[2].get_text(strip=True)

                    if stat_name and (home_value or away_value):
                        statistics[stat_name] = {
                            'home': home_value,
                            'away': away_value
                        }

        # Ha nem találtunk strukturált adatokat, keressük szövegesen
        if not statistics:
            text = soup.get_text()
            # Keressük a gyakori statisztikákat
            common_stats = ['Lövés', 'Kapura lövés', 'Szögletek', 'Sárga lap', 'Piros lap', 'Labdabirtoklás']
            for stat in common_stats:
                pattern = f"{stat}.*?(\d+).*?(\d+)"
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    statistics[stat] = {
                        'home': match.group(1),
                        'away': match.group(2)
                    }

        if debug:
            print(f"Found {len(statistics)} statistics")

        return statistics

    except Exception as e:
        print(f"Error scraping statistics: {e}")
        return {}

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
            'home_team': [],
            'away_team': [],
            'substitutes': {
                'home': [],
                'away': []
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
                    current_team = 'home' if any(keyword in player_text.lower() for keyword in ['home', 'hazai']) else 'away'
                    continue

                # Ha játékos nevnek tűnik
                if player_text and len(player_text) > 2 and not player_text.isdigit():
                    player_info = {
                        'name': player_text,
                        'number': extract_player_number(player_text),
                        'position': extract_player_position(player_text)
                    }

                    if current_team == 'home':
                        lineups['home_team'].append(player_info)
                    elif current_team == 'away':
                        lineups['away_team'].append(player_info)
                    else:
                        # Ha nem tudjuk melyik csapat, próbáljuk kitalálni a pozíció alapján
                        if len(lineups['home_team']) < 11:
                            lineups['home_team'].append(player_info)
                        else:
                            lineups['away_team'].append(player_info)

        if debug:
            print(f"Found {len(lineups['home_team'])} home players, {len(lineups['away_team'])} away players")

        return lineups

    except Exception as e:
        print(f"Error scraping lineups: {e}")
        return {}

def extract_player_number(player_text):
    """Játékos szám kinyerése"""
    number_match = re.search(r'(\d+)', player_text)
    return number_match.group(1) if number_match else None

def extract_player_position(player_text):
    """Játékos pozíció kinyerése"""
    # Ez nehéz anélkül hogy látnánk a pontos HTML struktúrát
    return None

def scrape_match_details_v3(match_url, debug=True):
    """Továbbfejlesztett meccs részletek scraping-je v3"""
    print(f"Scraping details from: {match_url}")

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

    match_details = {
        'header_info': {
            'main_title': '',
            'league_round': '',
            'date_time_hungarian': '',
            'date': '',
            'time': '',
            'final_score': '',
            'home_team': '',
            'away_team': ''
        },
        'summary': [],
        'statistics': {},
        'lineups': {},
        'debug_info': {} if debug else None
    }

    try:
        driver.get(match_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Várunk egy kicsit hogy betöltsön minden
        import time
        time.sleep(2)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # === HEADER INFORMÁCIÓK KINYERÉSE ===

        # 1. Page title elemzése
        page_title = soup.title.get_text() if soup.title else ''
        title_info = parse_page_title_info(page_title)

        match_details['header_info']['main_title'] = page_title
        match_details['header_info']['final_score'] = title_info['score']
        match_details['header_info']['home_team'] = title_info['home_team']
        match_details['header_info']['away_team'] = title_info['away_team']

        # 2. Dátum és idő keresése a body szövegében
        body_text = soup.get_text()

        # Dátum formátumok: "08.07.2025 12:00" vagy "08.07. 12:00"
        datetime_match = re.search(r'(\d{1,2}\.\d{1,2}\.(?:\d{4})?)\s+(\d{1,2}:\d{2})', body_text)
        if datetime_match:
            date_str = datetime_match.group(1)
            time_str = datetime_match.group(2)

            match_details['header_info']['date'] = date_str
            match_details['header_info']['time'] = time_str
            match_details['header_info']['date_time_hungarian'] = format_hungarian_date(date_str, time_str)

        # 3. Liga/verseny információ keresése
        # Keressük meg a főcímeket ami nem GDPR vonatkozású
        headings = soup.select('h1, h2, h3, h4')
        for heading in headings:
            text = heading.get_text(strip=True)
            if (text and
                len(text) > 5 and
                'consent' not in text.lower() and
                'cookie' not in text.lower() and
                'privacy' not in text.lower() and
                'data' not in text.lower()):
                match_details['header_info']['league_round'] = text
                break

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
                    'time': time,
                    'type': event_type,
                    'description': description,
                    'details': details,
                    'raw_text': full_event_text if debug else None
                }

                # Játékos név hozzáadása a details alapján
                if isinstance(details, dict):
                    if 'player' in details:
                        event_data['player'] = details['player']
                    elif 'player_in' in details:
                        event_data['player'] = details['player_in']
                        event_data['player_out'] = details['player_out']

                match_details['summary'].append(event_data)

            if debug:
                match_details['debug_info']['events_extracted'] = len(match_details['summary'])

        # === STATISZTIKÁK SCRAPING-JE ===
        print("Scraping statistics...")
        match_details['statistics'] = scrape_statistics(driver, match_url, debug)

        # === FELÁLLÍTÁSOK SCRAPING-JE ===
        print("Scraping lineups...")
        match_details['lineups'] = scrape_lineups(driver, match_url, debug)

        if debug:
            match_details['debug_info'].update({
                'page_title': page_title,
                'url': match_url,
                'title_info_parsed': title_info,
                'datetime_found': bool(datetime_match),
                'main_content_found': bool(main_content),
                'statistics_count': len(match_details['statistics']),
                'lineups_home_count': len(match_details['lineups'].get('home_team', [])),
                'lineups_away_count': len(match_details['lineups'].get('away_team', []))
            })

    except Exception as e:
        print(f"Error during scraping: {e}")
        if debug:
            match_details['debug_info']['error'] = str(e)

    finally:
        driver.quit()

    return match_details

# Test function
def test_single_match():
    """Egyetlen meccs tesztelése"""
    match_url = "https://m.eredmenyek.com/merkozes/KOVqFIMi/"
    match_details = scrape_match_details_v3(match_url, debug=True)

    # Mentés
    with open('v3_match_details.json', 'w', encoding='utf-8') as f:
        json.dump(match_details, f, indent=4, ensure_ascii=False)

    # Eredmények megjelenítése
    print(f"\n=== TOVÁBBFEJLESZTETT EREDMÉNYEK ===")

    header = match_details['header_info']
    print(f"📄 Főcím: {header['main_title']}")
    print(f"⚽ Eredmény: {header['final_score']}")
    print(f"🆚 Csapatok: {header['home_team']} vs {header['away_team']}")
    print(f"📋 Események száma: {len(match_details['summary'])}")
    print(f"📊 Statisztikák száma: {len(match_details['statistics'])}")
    print(f"👥 Hazai játékosok: {len(match_details['lineups'].get('home_team', []))}")
    print(f"👥 Vendég játékosok: {len(match_details['lineups'].get('away_team', []))}")

    # Események típusok szerinti bontása
    event_types = {}
    for event in match_details['summary']:
        event_type = event['type']
        event_types[event_type] = event_types.get(event_type, 0) + 1

    print(f"\n📝 Esemény típusok:")
    for event_type, count in event_types.items():
        print(f"  - {event_type}: {count} db")

    # Első néhány esemény részletesen
    print(f"\n🔍 Első események részletesen:")
    for i, event in enumerate(match_details['summary'][:5]):
        print(f"  {i+1}. {event['time']} - {event['description']}")
        if 'player' in event:
            print(f"     Játékos: {event['player']}")
        if 'player_out' in event:
            print(f"     Ki: {event['player_out']}")
        if isinstance(event.get('details'), dict) and 'type' in event['details']:
            print(f"     Típus: {event['details']['type']}")

    print(f"=" * 50)

if __name__ == "__main__":
    test_single_match()
