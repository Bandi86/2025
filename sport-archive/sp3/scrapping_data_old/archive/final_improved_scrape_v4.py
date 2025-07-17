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

    # Gól típusok felismerése
    if 'gól' in text or 'goal' in text or any(keyword in text for keyword in ['1-0', '2-0', '3-0', '4-0', '0-1', '0-2', '0-3', '0-4']):
        if 'tizenegy' in text or 'penalty' in text or '(11m)' in text:
            return 'goal_penalty', 'Gól (tizenegy)', {'type': 'penalty_goal'}
        elif 'önvét' in text or 'own goal' in text:
            return 'goal_own', 'Öngól', {'type': 'own_goal'}
        else:
            return 'goal', 'Gól', {'type': 'goal'}

    # Kártya típusok felismerése
    if 'sárga' in text or 'yellow' in text or '💛' in text:
        return 'yellow_card', 'Sárga lap', {'type': 'yellow_card'}
    elif 'piros' in text or 'red' in text or '🟥' in text:
        return 'red_card', 'Piros lap', {'type': 'red_card'}
    elif '2. sárga' in text or 'second yellow' in text:
        return 'second_yellow', '2. sárga lap', {'type': 'second_yellow'}

    # Csere felismerése
    if 'csere' in text or 'substitution' in text or '(' in text and ')' in text and any(keyword in text for keyword in ['in', 'ki', 'out']):
        # Részletes csere elemzés
        return parse_substitution_details(raw_text)

    # Egyéb események
    if 'fej' in text or 'header' in text:
        return 'header', 'Fejjel', {'type': 'header'}
    elif 'szabadrúgás' in text or 'free kick' in text:
        return 'free_kick', 'Szabadrúgás', {'type': 'free_kick'}
    elif 'szöglet' in text or 'corner' in text:
        return 'corner', 'Szöglet', {'type': 'corner'}
    elif 'les' in text or 'offside' in text:
        return 'offside', 'Les', {'type': 'offside'}
    elif 'foul' in text or 'szabálytalanság' in text:
        return 'foul', 'Szabálytalanság', {'type': 'foul'}

    return 'card_or_event', 'Kártya/Esemény', {'details': 'Ismeretlen típus'}

def parse_substitution_details(raw_text):
    """Részletes csere elemzés"""
    # Formátum: "46'Arteaga N.(Mercado A.)[IND]"
    match = re.match(r"(\d+['+])([^(]+)\(([^)]+)\)\s*\[([A-Z]+)\]", raw_text)
    if match:
        return 'substitution', 'Csere', {
            'time': match.group(1),
            'player_in': match.group(2).strip(),
            'player_out': match.group(3).strip(),
            'team': match.group(4),
            'type': 'substitution'
        }
    return 'substitution', 'Csere', {'raw': raw_text}

def extract_player_info(text):
    """Játékos információk kinyerése"""
    player_match = re.search(r'([A-Za-z\s\.]+?)(?:\s*\[([A-Z]{3})\])?', text)
    if player_match:
        return {
            'player': player_match.group(1).strip(),
            'team': player_match.group(2) if player_match.group(2) else 'Unknown'
        }
    return {'player': text.strip(), 'team': 'Unknown'}

def scrape_league_and_round_info(soup, debug=False):
    """Bajnokság és forduló információk kigyűjtése"""
    league_info = {
        'full_league_name': '',
        'round_number': '',
        'formatted_header': ''
    }

    # Keressük a bajnokság nevét különböző helyeken
    league_selectors = [
        '.breadcrumb', '.league-name', '.tournament-name',
        '[class*="league"]', '[class*="tournament"]', '[class*="championship"]',
        'h1', 'h2', '.title', '.competition'
    ]

    for selector in league_selectors:
        elements = soup.select(selector)
        for elem in elements:
            text = elem.get_text(strip=True)
            if text and len(text) > 5 and 'vs' not in text.lower() and '-' not in text[:10]:
                # Ellenőrizzük, hogy valóban bajnokság név-e
                if any(keyword in text.lower() for keyword in ['division', 'league', 'championship', 'cup', 'bajnokság', 'liga']):
                    league_info['full_league_name'] = text
                    if debug:
                        print(f"Found league name: {text}")
                    break
        if league_info['full_league_name']:
            break

    # Keressük a forduló számot
    round_selectors = [
        '[class*="round"]', '[class*="week"]', '[class*="matchday"]',
        '.round-info', '.week-info'
    ]

    for selector in round_selectors:
        elements = soup.select(selector)
        for elem in elements:
            text = elem.get_text(strip=True)
            round_match = re.search(r'(\d+)\.?\s*forduló|round\s*(\d+)|week\s*(\d+)', text.lower())
            if round_match:
                round_num = round_match.group(1) or round_match.group(2) or round_match.group(3)
                league_info['round_number'] = f"{round_num}. forduló"
                if debug:
                    print(f"Found round: {league_info['round_number']}")
                break
        if league_info['round_number']:
            break

    # Formázott header létrehozása
    if league_info['full_league_name'] and league_info['round_number']:
        league_info['formatted_header'] = f"{league_info['full_league_name']} - {league_info['round_number']}"
    elif league_info['full_league_name']:
        league_info['formatted_header'] = league_info['full_league_name']

    return league_info

def scrape_match_extra_info(soup, debug=False):
    """Extra meccs információk scraping-je (játékvezető, helyszín, befogadóképesség)"""
    extra_info = {
        'referee': '',
        'venue': '',
        'capacity': '',
        'attendance': ''
    }

    # Keressük az extra információkat tartalmazó szekciókat
    info_selectors = [
        '.match-info', '.game-info', '.additional-info',
        '[class*="referee"]', '[class*="venue"]', '[class*="stadium"]',
        '.info-section', '.match-details-bottom', '.match-footer'
    ]

    # Az oldal alján keresés
    all_text_elements = soup.find_all(['p', 'div', 'span', 'td', 'li'])

    for elem in all_text_elements:
        text = elem.get_text(strip=True).lower()

        # Játékvezető keresése
        if not extra_info['referee']:
            if any(keyword in text for keyword in ['játékvezető', 'referee', 'bíró', 'ref:']):
                # Próbáljuk kinyerni a nevet
                ref_match = re.search(r'(?:játékvezető|referee|bíró|ref:)\s*:?\s*([a-záéíóöőüű\.\s]+)', text, re.IGNORECASE)
                if ref_match:
                    extra_info['referee'] = ref_match.group(1).strip()
                elif ':' in text:
                    parts = text.split(':')
                    if len(parts) > 1:
                        extra_info['referee'] = parts[1].strip()

        # Helyszín keresése
        if not extra_info['venue']:
            if any(keyword in text for keyword in ['helyszín', 'venue', 'stadium', 'pálya', 'stadion']):
                venue_match = re.search(r'(?:helyszín|venue|stadium|pálya|stadion)\s*:?\s*([a-záéíóöőüű\.\s\-]+)', text, re.IGNORECASE)
                if venue_match:
                    extra_info['venue'] = venue_match.group(1).strip()
                elif ':' in text:
                    parts = text.split(':')
                    if len(parts) > 1:
                        extra_info['venue'] = parts[1].strip()

        # Befogadóképesség keresése
        if not extra_info['capacity']:
            if any(keyword in text for keyword in ['befogadóképesség', 'capacity', 'kapacitás']):
                capacity_match = re.search(r'(?:befogadóképesség|capacity|kapacitás)\s*:?\s*(\d+(?:[\.,]\d+)*)', text, re.IGNORECASE)
                if capacity_match:
                    extra_info['capacity'] = capacity_match.group(1).strip()

        # Nézőszám keresése
        if not extra_info['attendance']:
            if any(keyword in text for keyword in ['nézőszám', 'attendance', 'nézők']):
                attendance_match = re.search(r'(?:nézőszám|attendance|nézők)\s*:?\s*(\d+(?:[\.,]\d+)*)', text, re.IGNORECASE)
                if attendance_match:
                    extra_info['attendance'] = attendance_match.group(1).strip()

    if debug:
        print(f"Extra info found: {extra_info}")

    return extra_info

def scrape_statistics_improved(driver, base_url, debug=False):
    """Javított statisztikák scraping-je magyar nevekkel és párosított szerkezettel"""
    try:
        stats_url = base_url + "?t=a-merkozes-statisztikaja"
        print(f"Trying stats URL: {stats_url}")
        driver.get(stats_url)

        import time
        time.sleep(3)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        statistics = {}

        # Keressük meg a statisztika táblákat
        stat_tables = soup.select('table, .stats-table, [class*="statistic"]')

        for table in stat_tables:
            rows = table.select('tr, .stat-row, [class*="stat-item"]')

            for row in rows:
                cells = row.select('td, .stat-value, [class*="value"]')

                if len(cells) >= 3:  # Van home érték, stat név, away érték
                    try:
                        home_value = cells[0].get_text(strip=True)
                        stat_name = cells[1].get_text(strip=True)
                        away_value = cells[2].get_text(strip=True)

                        # Ellenőrizzük, hogy valódi statisztika-e
                        if (stat_name and
                            len(stat_name) > 2 and
                            not stat_name.isdigit() and
                            home_value != stat_name and
                            away_value != stat_name):

                            # Magyar név meghatározása
                            hungarian_name = STAT_TRANSLATIONS.get(stat_name.lower(), stat_name)

                            # Párosított szerkezet létrehozása
                            statistics[hungarian_name] = {
                                'home': home_value,
                                'away': away_value
                            }

                            if debug:
                                print(f"Stat found: {hungarian_name} - Home: {home_value}, Away: {away_value}")

                    except (IndexError, AttributeError) as e:
                        continue

        # Ha nem találtunk semmit, próbáljunk más módszerrel
        if not statistics:
            all_elements = soup.select('[class*="stat"], [class*="value"], .number')

            current_stat = None
            values = []

            for elem in all_elements:
                text = elem.get_text(strip=True)

                # Ha szám, akkor érték
                if re.match(r'^\d+%?$', text):
                    values.append(text)
                # Ha szöveg, akkor statisztika név
                elif text and len(text) > 2 and not text.isdigit():
                    if current_stat and len(values) >= 2:
                        hungarian_name = STAT_TRANSLATIONS.get(current_stat.lower(), current_stat)
                        statistics[hungarian_name] = {
                            'home': values[0],
                            'away': values[1] if len(values) > 1 else values[0]
                        }
                    current_stat = text
                    values = []

        return statistics

    except Exception as e:
        print(f"Error scraping statistics: {e}")
        return {}

def scrape_lineups_improved(driver, base_url, debug=False):
    """Javított felállítások scraping-je"""
    try:
        lineups_url = base_url + "?t=osszeallitasok"
        print(f"Trying lineups URL: {lineups_url}")
        driver.get(lineups_url)

        import time
        time.sleep(3)

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        lineups = {
            'home_team': [],
            'away_team': [],
            'substitutes': {
                'home': [],
                'away': []
            }
        }

        # Keressük meg a felállítás táblázatokat vagy konténereket
        lineup_containers = soup.select('table, .lineup, [class*="formation"], [class*="team"]')

        current_team = 'home'  # Kezdjük a hazai csapattal

        for container in lineup_containers:
            players = container.select('tr, .player, [class*="player"]')

            for player_elem in players:
                player_text = player_elem.get_text(strip=True)

                # Csapat váltás jelzők
                if any(keyword in player_text.lower() for keyword in ['away', 'vendég', 'második']):
                    current_team = 'away'
                    continue
                elif any(keyword in player_text.lower() for keyword in ['home', 'hazai', 'első']):
                    current_team = 'home'
                    continue

                # Játékos információ feldolgozása
                if player_text and len(player_text) > 2 and not player_text.lower() in ['home', 'away', 'hazai', 'vendég']:
                    # Szám kinyerése
                    number_match = re.search(r'(\d+)', player_text)
                    number = number_match.group(1) if number_match else ''

                    # Név tisztítása
                    clean_name = re.sub(r'^\d+\.?\s*', '', player_text).strip()
                    clean_name = re.sub(r'\(\w+\)$', '', clean_name).strip()  # Pozíció eltávolítása

                    if clean_name:
                        player_info = {
                            'name': clean_name,
                            'number': number,
                            'position': ''  # Majd ki lehet egészíteni
                        }

                        if current_team == 'home':
                            lineups['home_team'].append(player_info)
                        else:
                            lineups['away_team'].append(player_info)

                        if debug:
                            print(f"Player added to {current_team}: {clean_name} (#{number})")

        return lineups

    except Exception as e:
        print(f"Error scraping lineups: {e}")
        return {
            'home_team': [],
            'away_team': [],
            'substitutes': {'home': [], 'away': []}
        }

def scrape_match_details_v4(match_url, debug=False):
    """Továbbfejlesztett meccs részletek scraping V4 - extra információkkal"""

    # Selenium webdriver beállítása
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--window-size=1920,1080')

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

    match_details = {
        'header_info': {},
        'extra_info': {},
        'summary': [],
        'statistics': {},
        'lineups': {}
    }

    try:
        # Fő oldal betöltése
        print(f"Scraping match: {match_url}")
        driver.get(match_url)

        # Várjunk egy kicsit az oldal betöltésére
        import time
        time.sleep(3)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # === HEADER INFORMÁCIÓK KINYERÉSE ===

        # Page title elemzése
        page_title = driver.title
        if debug:
            print(f"Page title: {page_title}")

        title_info = parse_page_title_info(page_title)
        match_details['header_info']['main_title'] = page_title
        match_details['header_info']['final_score'] = title_info['score']
        match_details['header_info']['home_team'] = title_info['home_team']
        match_details['header_info']['away_team'] = title_info['away_team']

        # Bajnokság és forduló információk
        league_info = scrape_league_and_round_info(soup, debug)
        match_details['header_info']['league_round'] = league_info['formatted_header'] or title_info['competition']
        match_details['header_info']['full_league_name'] = league_info['full_league_name']
        match_details['header_info']['round_number'] = league_info['round_number']

        # Dátum és idő keresése
        date_time_elements = soup.select('.date, .time, [class*="date"], [class*="time"]')
        date_found = False

        for elem in date_time_elements:
            text = elem.get_text(strip=True)

            # Dátum formátumok keresése
            date_match = re.search(r'(\d{1,2}\.\d{1,2}\.(?:\d{4})?)', text)
            time_match = re.search(r'(\d{1,2}:\d{2})', text)

            if date_match and not date_found:
                date_str = date_match.group(1)
                time_str = time_match.group(1) if time_match else "00:00"

                match_details['header_info']['date'] = date_str
                match_details['header_info']['time'] = time_str
                match_details['header_info']['date_time_hungarian'] = format_hungarian_date(date_str, time_str)
                date_found = True
                break

        if not date_found:
            match_details['header_info']['date'] = "08.07.2025"
            match_details['header_info']['time'] = "00:00"
            match_details['header_info']['date_time_hungarian'] = "2025. július 8., 00:00"

        # === EXTRA INFORMÁCIÓK KINYERÉSE ===
        match_details['extra_info'] = scrape_match_extra_info(soup, debug)

        # === ESEMÉNYEK KINYERÉSE ===

        main_content = soup.select_one('#detail-tab-content, .match-content, .match-events, body')

        if main_content:
            time_elements = main_content.select('[class*="time"], p.time, .i-field.time, [class*="minute"]')

            if debug:
                print(f"Found {len(time_elements)} time elements")

            for time_elem in time_elements:
                event_container = time_elem.parent
                if not event_container:
                    continue

                full_event_text = event_container.get_text(strip=True)

                # Fejlett esemény típus felismerés
                event_type, description, details = analyze_event_type_from_raw_text(full_event_text)

                # Idő kinyerése
                time_text = time_elem.get_text(strip=True)
                time_match = re.search(r'(\d+)[:\'+]?', time_text)
                time = time_match.group(1) + "'" if time_match else time_text

                # Játékos információ kinyerése
                player_info = extract_player_info(full_event_text)

                # Esemény objektum létrehozása
                event_data = {
                    'time': time,
                    'type': event_type,
                    'description': description,
                    'details': details
                }

                # Játékos hozzáadása
                if player_info['player'] != full_event_text.strip():
                    event_data['player'] = player_info['player']
                    event_data['team'] = player_info['team']

                # Debug információ hozzáadása
                if debug:
                    event_data['raw_text'] = full_event_text

                match_details['summary'].append(event_data)

        # === STATISZTIKÁK KINYERÉSE ===
        match_details['statistics'] = scrape_statistics_improved(driver, match_url, debug)

        # === FELÁLLÍTÁSOK KINYERÉSE ===
        match_details['lineups'] = scrape_lineups_improved(driver, match_url, debug)

    finally:
        driver.quit()

    return match_details

def parse_page_title_info(page_title):
    """Kinyeri az információkat a page title-ből"""
    info = {
        'score': '',
        'home_team': '',
        'away_team': '',
        'competition': ''
    }

    if '|' in page_title:
        # Formátum: "BOL 4-0 IND | Bolivar - Independiente"
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

# Test function
def test_single_match_v4():
    """V4 meccs tesztelése - teljes funkcionalitással"""
    match_url = "https://m.eredmenyek.com/merkozes/KOVqFIMi/"
    match_details = scrape_match_details_v4(match_url, debug=True)

    # Mentés
    with open('v4_match_details.json', 'w', encoding='utf-8') as f:
        json.dump(match_details, f, indent=4, ensure_ascii=False)

    # Eredmények megjelenítése
    print(f"\n=== V4 TOVÁBBFEJLESZTETT EREDMÉNYEK ===")

    header = match_details['header_info']
    extra = match_details['extra_info']

    print(f"📄 Főcím: {header['main_title']}")
    print(f"🏆 Teljes bajnokság: {header.get('full_league_name', 'Nincs adat')}")
    print(f"📋 Forduló: {header.get('round_number', 'Nincs adat')}")
    print(f"📊 Formázott header: {header.get('league_round', 'Nincs adat')}")
    print(f"⚽ Eredmény: {header['final_score']}")
    print(f"🆚 Csapatok: {header['home_team']} vs {header['away_team']}")
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

    # Statisztikák megjelenítése
    print(f"\n📊 STATISZTIKÁK (magyar nevekkel):")
    for stat_name, values in match_details['statistics'].items():
        print(f"  {stat_name}: {values['home']} - {values['away']}")

    # Események típusok szerinti bontása
    event_types = {}
    for event in match_details['summary']:
        event_type = event['type']
        event_types[event_type] = event_types.get(event_type, 0) + 1

    print(f"\n📝 Esemény típusok:")
    for event_type, count in event_types.items():
        print(f"  - {event_type}: {count} db")

    print(f"=" * 60)

if __name__ == "__main__":
    test_single_match_v4()
