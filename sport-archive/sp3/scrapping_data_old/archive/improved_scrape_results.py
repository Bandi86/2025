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

def detect_event_type(event_element):
    """Megpróbálja felismerni az esemény típusát különböző módszerekkel"""

    # Az egész esemény szövege
    full_text = event_element.get_text().lower()

    # 1. Direkt szöveg alapú felismerés
    if any(word in full_text for word in ['gól', 'goal', 'score']):
        return 'goal', 'Gól'
    elif any(word in full_text for word in ['sárga', 'yellow']):
        return 'yellow_card', 'Sárga lap'
    elif any(word in full_text for word in ['piros', 'red']):
        return 'red_card', 'Piros lap'
    elif any(word in full_text for word in ['csere', 'substitution', 'sub']):
        return 'substitution', 'Csere'

    # 2. Osztály alapú felismerés
    all_classes = []
    for elem in event_element.find_all(True):
        if elem.get('class'):
            all_classes.extend(elem.get('class'))

    classes_text = ' '.join(all_classes).lower()

    if any(keyword in classes_text for keyword in ['goal', 'gol']):
        return 'goal', 'Gól'
    elif any(keyword in classes_text for keyword in ['yellow', 'sarga']):
        return 'yellow_card', 'Sárga lap'
    elif any(keyword in classes_text for keyword in ['red', 'piros']):
        return 'red_card', 'Piros lap'
    elif any(keyword in classes_text for keyword in ['substitution', 'sub', 'csere']):
        return 'substitution', 'Csere'

    # 3. Unicode vagy emoji alapú felismerés
    if '⚽' in full_text or '🥅' in full_text:
        return 'goal', 'Gól'
    elif '🟨' in full_text:
        return 'yellow_card', 'Sárga lap'
    elif '🟥' in full_text:
        return 'red_card', 'Piros lap'
    elif '🔄' in full_text or '↔️' in full_text:
        return 'substitution', 'Csere'

    return 'unknown', 'Ismeretlen esemény'

def extract_player_names(event_element, event_type):
    """Játékos neveket próbál kinyerni az eseményből"""
    player_name = "N/A"
    player_off = None

    # Csere esetén speciális kezelés
    if event_type == 'substitution':
        # Próbáljuk meg megtalálni a be- és kilépő játékost
        text_parts = event_element.get_text().strip().split()

        # Keressük a "be" és "ki" indikátorokat
        for i, part in enumerate(text_parts):
            if part.lower() in ['→', '->', 'be:', 'in:', 'beáll:']:
                if i + 1 < len(text_parts):
                    player_name = text_parts[i + 1]
            elif part.lower() in ['←', '<-', 'ki:', 'out:', 'leáll:']:
                if i + 1 < len(text_parts):
                    player_off = text_parts[i + 1]

    # Általános játékos név keresés
    if player_name == "N/A":
        # Szűrjük ki az időt és az esemény típust
        text_parts = [s.strip() for s in event_element.stripped_strings]
        filtered_parts = []

        for part in text_parts:
            # Kiszűrjük az időt (pl. "45'", "90+2'")
            if not re.match(r'^\d+[:\'+]', part):
                # Kiszűrjük az ismert esemény kulcsszavakat
                if part.lower() not in ['gól', 'goal', 'sárga', 'piros', 'csere', 'yellow', 'red', 'substitution']:
                    filtered_parts.append(part)

        if filtered_parts:
            player_name = filtered_parts[0]

    return player_name, player_off

def scrape_match_details(match_url, debug=True):
    """Javított meccs részletek scraping-je"""
    print(f"Scraping details from: {match_url} with Selenium")

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
        'lineups': {
            'home_team': [],
            'away_team': [],
            'substitutes': {
                'home': [],
                'away': []
            }
        },
        'odds': {},
        'h2h_data': {},
        'debug_info': {} if debug else None
    }

    try:
        driver.get(match_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        if debug:
            match_details['debug_info']['page_title'] = soup.title.get_text() if soup.title else 'No title'
            match_details['debug_info']['url'] = match_url

        # === HEADER INFORMÁCIÓK ===
        print("Extracting header information...")

        # Főcím/Liga keresése
        title_selectors = [
            'h1', 'h2', '.title', '.league-name', '.competition-name',
            '[class*="title"]', '[class*="league"]', '[class*="competition"]'
        ]

        for selector in title_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)
                if text and len(text) > 5:  # Csak értelmes hosszúságú szövegeket
                    match_details['header_info']['main_title'] = text
                    match_details['header_info']['league_round'] = text
                    if debug:
                        match_details['debug_info']['title_selector_used'] = selector
                    break
            if match_details['header_info']['main_title']:
                break

        # Dátum és idő keresése
        datetime_selectors = [
            '.date', '.time', '.datetime', '[class*="date"]', '[class*="time"]'
        ]

        for selector in datetime_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)

                # Dátum keresése (pl. "08.07." vagy "2025-07-08")
                date_match = re.search(r'(\d{1,2}\.\d{1,2}\.(?:\d{4})?)', text)
                if date_match:
                    match_details['header_info']['date'] = date_match.group(1)

                # Idő keresése (pl. "18:00")
                time_match = re.search(r'(\d{1,2}:\d{2})', text)
                if time_match:
                    match_details['header_info']['time'] = time_match.group(1)

                if date_match and time_match:
                    hungarian_datetime = format_hungarian_date(date_match.group(1), time_match.group(1))
                    match_details['header_info']['date_time_hungarian'] = hungarian_datetime
                    if debug:
                        match_details['debug_info']['datetime_selector_used'] = selector
                    break

        # Eredmény keresése
        score_selectors = [
            '.score', '.result', '[class*="score"]', '[class*="result"]'
        ]

        for selector in score_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)
                # Eredmény formátum: "4 - 0" vagy "4-0" vagy "4:0"
                if re.match(r'\d+\s*[-:]\s*\d+', text):
                    match_details['header_info']['final_score'] = text
                    if debug:
                        match_details['debug_info']['score_selector_used'] = selector
                    break

        # === SUMMARY/ESEMÉNYEK ===
        print("Extracting match events...")

        # Különböző esemény konténerek keresése
        event_containers = soup.select('#detail-tab-content, .match-events, .timeline, .incidents, [class*="event"]')

        for container in event_containers:
            # Események keresése a konténerben
            events = container.select('div, li, tr')

            for event in events:
                event_text = event.get_text(strip=True)

                # Csak akkor dolgozzuk fel, ha van benne idő
                if re.search(r'\d+[:\'+]', event_text):
                    # Idő kinyerése
                    time_match = re.search(r'(\d+)[:\'+]', event_text)
                    time = time_match.group(1) + "'" if time_match else 'N/A'

                    # Esemény típus felismerése
                    event_type, event_description = detect_event_type(event)

                    # Játékos nevek kinyerése
                    player_name, player_off = extract_player_names(event, event_type)

                    event_data = {
                        'time': time,
                        'type': event_type,
                        'description': event_description,
                        'player': player_name,
                        'raw_text': event_text if debug else None
                    }

                    if player_off:
                        event_data['player_off'] = player_off

                    match_details['summary'].append(event_data)

            # Ha találtunk eseményeket, kilépünk
            if match_details['summary']:
                if debug:
                    match_details['debug_info']['events_found'] = len(match_details['summary'])
                break

        print(f"Found {len(match_details['summary'])} events")

    except Exception as e:
        print(f"Error during scraping: {e}")
        if debug:
            match_details['debug_info']['error'] = str(e)

    finally:
        driver.quit()

    return match_details

def scrape_and_process_results():
    """Főfunkció a meccsek összegyűjtésére és feldolgozására"""
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
        print("Could not find the main score data container. The website structure may have changed.")
        return

    current_league = "Unknown"
    match_links = score_data.find_all('a', class_=['sched', 'fin', 'live'])

    for link in match_links:
        league_tag = link.find_previous('h4')
        if league_tag:
            current_league = league_tag.get_text(strip=True).replace("Tabella", "").strip()

        crawler = link.previous_sibling
        teams_text = ""
        while crawler and crawler.name != 'span':
            if isinstance(crawler, NavigableString):
                teams_text = str(crawler) + teams_text
            crawler = crawler.previous_sibling

        teams_text = teams_text.strip()

        if crawler and crawler.name == 'span':
            time_or_status = crawler.get_text(strip=True)
            score = link.get_text(strip=True)
            status_class = link.get('class', [''])[0]
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

    list_file_name = f"{datetime.now().strftime('%Y-%m-%d')}.json"
    with open(list_file_name, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)

    print(f"Successfully scraped and processed {total_matches} matches.")
    print(f"List of matches saved to {list_file_name}")

    # --- Scrape details for the first finished match ---
    first_finished_match = next((m for m in grouped_matches['finished'] if m['detail_page_url']), None)

    if first_finished_match:
        print(f"\nScraping details for: {first_finished_match['home_team']} vs {first_finished_match['away_team']}")
        details_url = first_finished_match['detail_page_url']
        match_details_data = scrape_match_details(details_url, debug=True)

        if match_details_data:
            details_file_name = f"{first_finished_match['home_team'].replace(' ', '_')}-vs-{first_finished_match['away_team'].replace(' ', '_')}_details.json"
            with open(details_file_name, 'w', encoding='utf-8') as f:
                json.dump(match_details_data, f, indent=4, ensure_ascii=False)
            print(f"Match details saved to {details_file_name}")

            # Debug információk kiírása
            if match_details_data.get('debug_info'):
                print("\n=== DEBUG INFORMÁCIÓK ===")
                for key, value in match_details_data['debug_info'].items():
                    print(f"{key}: {value}")
                print("========================")

            # Header információk kiírása
            if match_details_data.get('header_info'):
                print("\n=== HEADER INFORMÁCIÓK ===")
                header = match_details_data['header_info']
                if header.get('main_title'):
                    print(f"Főcím: {header['main_title']}")
                if header.get('date_time_hungarian'):
                    print(f"Magyar dátum: {header['date_time_hungarian']}")
                if header.get('final_score'):
                    print(f"Eredmény: {header['final_score']}")
                print("=========================")
    else:
        print("No finished matches with details found to scrape.")

if __name__ == "__main__":
    scrape_and_process_results()
