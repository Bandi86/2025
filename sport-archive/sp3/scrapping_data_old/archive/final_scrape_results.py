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

def detect_event_type_advanced(element_text, parent_classes=None):
    """Fejlettebb esemény típus felismerés"""
    text = element_text.lower()

    # Gól felismerése
    if any(keyword in text for keyword in ['goal', 'gól', 'score']):
        return 'goal', 'Gól'

    # Kártyák felismerése
    if any(keyword in text for keyword in ['yellow', 'sárga', 'sarga']):
        return 'yellow_card', 'Sárga lap'
    elif any(keyword in text for keyword in ['red', 'piros']):
        return 'red_card', 'Piros lap'

    # Csere felismerése
    if any(keyword in text for keyword in ['substitution', 'sub', 'csere', '→', '->', '↔']):
        return 'substitution', 'Csere'

    # Osztályok alapú felismerés
    if parent_classes:
        class_text = ' '.join(parent_classes).lower()
        if 'goal' in class_text:
            return 'goal', 'Gól'
        elif 'card' in class_text:
            if 'yellow' in class_text:
                return 'yellow_card', 'Sárga lap'
            elif 'red' in class_text:
                return 'red_card', 'Piros lap'

    # Ha idő van benne, valószínűleg esemény
    if re.search(r'\d+[:\'+]', text):
        return 'event', 'Esemény'

    return 'unknown', 'Ismeretlen'

def extract_events_from_container(container, debug=False):
    """Események kinyerése egy konténerből"""
    events = []

    # Keressük meg az összes elemet ami időt tartalmaz
    time_elements = container.select('[class*="time"], p.time, .i-field.time, [class*="minute"]')

    if debug:
        print(f"Found {len(time_elements)} time elements")

    for time_elem in time_elements:
        # Szülő elem keresése ami tartalmazhatja az egész eseményt
        event_container = time_elem.parent
        if not event_container:
            continue

        # Idő kinyerése
        time_text = time_elem.get_text(strip=True)
        time_match = re.search(r'(\d+)[:\'+]?', time_text)
        time = time_match.group(1) + "'" if time_match else time_text

        # Az egész esemény szövege
        full_event_text = event_container.get_text(strip=True)

        # Esemény típus felismerése
        event_type, description = detect_event_type_advanced(
            full_event_text,
            event_container.get('class', [])
        )

        # Játékos név kinyerése - mindent ami nem idő
        player_parts = re.split(r'\d+[:\'+]', full_event_text)
        player_text = ''.join(player_parts).strip()

        # Csapat jelölés eltávolítása [BOL], [IND] stb.
        player_text = re.sub(r'\[.*?\]', '', player_text).strip()

        # Extra karakterek eltávolítása
        player_text = re.sub(r'[()]+', '', player_text).strip()

        if player_text and len(player_text) > 1:
            events.append({
                'time': time,
                'type': event_type,
                'description': description,
                'player': player_text,
                'raw_text': full_event_text if debug else None
            })

    return events

def scrape_match_details_v2(match_url, debug=True):
    """Továbbfejlesztett meccs részletek scraping-je"""
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

        # === ESEMÉNYEK KINYERÉSE ===

        # Keressük meg a fő tartalom konténert
        main_content = soup.select_one('#detail-tab-content, .match-content, .match-events, body')

        if main_content:
            events = extract_events_from_container(main_content, debug)
            match_details['summary'] = events

            if debug:
                match_details['debug_info']['events_extracted'] = len(events)
                match_details['debug_info']['sample_events'] = events[:3] if events else []

        if debug:
            match_details['debug_info'].update({
                'page_title': page_title,
                'url': match_url,
                'title_info_parsed': title_info,
                'datetime_found': bool(datetime_match),
                'main_content_found': bool(main_content)
            })

    except Exception as e:
        print(f"Error during scraping: {e}")
        if debug:
            match_details['debug_info']['error'] = str(e)

    finally:
        driver.quit()

    return match_details

def scrape_and_process_results_v2():
    """Továbbfejlesztett fő funkció"""
    base_url = "https://m.eredmenyek.com"
    url = f"{base_url}/"
    response = requests.get(url)
    raw_results = []

    if response.status_code != 200:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    score_data = soup.find('div', id='score-data')

    if not score_data:
        print("Could not find the main score data container.")
        return

    current_league = "Unknown"
    match_links = score_data.find_all('a', class_=['sched', 'fin', 'live'])

    for link in match_links:
        league_tag = link.find_previous('h4')
        if league_tag:
            current_league = league_tag.get_text(strip=True).replace("Tabella", "").strip()

        crawler = link.previous_sibling
        teams_text = ""
        while crawler and hasattr(crawler, 'name') and crawler.name != 'span':
            if isinstance(crawler, NavigableString):
                teams_text = str(crawler) + teams_text
            crawler = crawler.previous_sibling

        teams_text = teams_text.strip()

        if crawler and hasattr(crawler, 'name') and crawler.name == 'span':
            time_or_status = crawler.get_text(strip=True)
            score = link.get_text(strip=True)

            # Status class kinyerése biztonságosan
            status_classes = link.get('class', [])
            status_class = status_classes[0] if status_classes else 'unknown'

            detail_path = link.get('href')
            detail_page_url = f"{base_url}{detail_path}" if detail_path else None

            teams_text = teams_text.replace('\n', ' ').replace('    ', ' ').strip()
            team_parts = teams_text.split(' - ')
            if len(team_parts) < 2:
                team_parts = teams_text.split('-')

            home_team = team_parts[0].strip() if len(team_parts) > 0 else 'N/A'
            away_team = team_parts[1].strip() if len(team_parts) > 1 else 'N/A'

            raw_results.append({
                'league': current_league,
                'time_status': time_or_status,
                'home_team': home_team,
                'away_team': away_team,
                'score': score,
                'match_status': status_class,
                'detail_page_url': detail_page_url
            })

    if not raw_results:
        print("No matches found.")
        return

    def get_sort_key(match):
        time_str = match['time_status'].split('Törölve')[0].split('Elhalasztva')[0]
        try:
            if "'" in time_str:
                return f"00:{time_str.replace("'", "")}"
            return datetime.strptime(time_str, '%H:%M').strftime('%H:%M')
        except ValueError:
            return "99:99"

    sorted_matches = sorted(raw_results, key=get_sort_key)

    total_matches = len(sorted_matches)
    friendly_matches = sum(1 for m in sorted_matches if 'Barátságos' in m['league'])
    matches_by_league = defaultdict(int)
    for m in sorted_matches:
        matches_by_league[m['league']] += 1

    statistics = {
        'total_matches': total_matches,
        'friendly_matches': friendly_matches,
        'matches_by_league': dict(matches_by_league)
    }

    grouped_matches = {
        'live': [m for m in sorted_matches if m['match_status'] == 'live'],
        'finished': [m for m in sorted_matches if m['match_status'] == 'fin'],
        'scheduled': [m for m in sorted_matches if m['match_status'] == 'sched']
    }

    final_output = {
        'metadata': {
            'source': url,
            'scrape_timestamp_utc': datetime.now(timezone.utc).isoformat() + 'Z',
            'date_for_matches': datetime.now().strftime('%Y-%m-%d')
        },
        'statistics': statistics,
        'matches': grouped_matches
    }

    list_file_name = f"v2_{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(list_file_name, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)

    print(f"Successfully scraped and processed {total_matches} matches.")
    print(f"List of matches saved to {list_file_name}")

    # --- Scrape details for the first finished match ---
    first_finished_match = next((m for m in grouped_matches['finished'] if m['detail_page_url']), None)

    if first_finished_match:
        print(f"\n=== Scraping detailed match info ===")
        print(f"Match: {first_finished_match['home_team']} vs {first_finished_match['away_team']}")
        print(f"League: {first_finished_match['league']}")
        print(f"Score: {first_finished_match['score']}")

        details_url = first_finished_match['detail_page_url']
        match_details_data = scrape_match_details_v2(details_url, debug=True)

        if match_details_data:
            details_file_name = f"v2_{first_finished_match['home_team'].replace(' ', '_')}-vs-{first_finished_match['away_team'].replace(' ', '_')}_details.json"
            with open(details_file_name, 'w', encoding='utf-8') as f:
                json.dump(match_details_data, f, indent=4, ensure_ascii=False)
            print(f"Match details saved to {details_file_name}")

            # Eredmények összefoglalása
            print(f"\n=== EREDMÉNYEK ÖSSZEFOGLALÁSA ===")
            header = match_details_data['header_info']

            if header['main_title']:
                print(f"📄 Főcím: {header['main_title']}")
            if header['league_round']:
                print(f"🏆 Liga/Forduló: {header['league_round']}")
            if header['date_time_hungarian']:
                print(f"📅 Magyar dátum: {header['date_time_hungarian']}")
            if header['final_score']:
                print(f"⚽ Eredmény: {header['final_score']}")
            if header['home_team'] and header['away_team']:
                print(f"🆚 Csapatok: {header['home_team']} vs {header['away_team']}")

            print(f"📋 Események száma: {len(match_details_data['summary'])}")

            # Első néhány esemény megjelenítése
            if match_details_data['summary']:
                print(f"\n📝 Első események:")
                for i, event in enumerate(match_details_data['summary'][:5]):
                    print(f"  {i+1}. {event['time']} - {event['description']} ({event['player']})")

                if len(match_details_data['summary']) > 5:
                    print(f"  ... és még {len(match_details_data['summary'])-5} esemény")

            print(f"=" * 50)
    else:
        print("No finished matches with details found to scrape.")

if __name__ == "__main__":
    scrape_and_process_results_v2()
