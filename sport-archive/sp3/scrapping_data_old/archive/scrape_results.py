import requests
from bs4 import BeautifulSoup, NavigableString
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

def scrape_match_details(match_url, debug=True):
    """Scrapes detailed information (summary, stats, lineups) from a given match URL using Selenium."""
    print(f"Scraping details from: {match_url} with Selenium")
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

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
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "detail-tab-content")))
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        if debug:
            match_details['debug_info']['page_title'] = soup.title.get_text() if soup.title else 'No title'

        # --- Extract Match Header Info (League, Date, Time, Result) with multiple selectors ---
        try:
            # Próbáljunk több CSS szelektort a főcím/liga információhoz
            league_selectors = [
                'span.wcl-title_100',
                '.wcl-title_100',
                'h1.match-title',
                '.match-header h1',
                '.league-name',
                'h1',
                '.competition-name'
            ]

            for selector in league_selectors:
                league_elem = soup.select_one(selector)
                if league_elem and league_elem.get_text(strip=True):
                    match_details['header_info']['main_title'] = league_elem.get_text(strip=True)
                    match_details['header_info']['league_round'] = league_elem.get_text(strip=True)
                    if debug:
                        match_details['debug_info']['league_selector_used'] = selector
                    break

            # Dátum és idő kiolvasása több szelektorral
            datetime_selectors = [
                'p.wcl-info_100',
                '.wcl-info_100',
                '.match-date',
                '.date-time',
                '.match-info p'
            ]

            for selector in datetime_selectors:
                date_time_elem = soup.select_one(selector)
                if date_time_elem:
                    date_time_text = date_time_elem.get_text(strip=True)

                    # Különböző dátum formátumok keresése
                    date_match = re.search(r'(\d{1,2}\.\d{1,2}\.(?:\d{4})?)', date_time_text)
                    time_match = re.search(r'(\d{1,2}:\d{2})', date_time_text)

                    if date_match:
                        match_details['header_info']['date'] = date_match.group(1)
                    if time_match:
                        match_details['header_info']['time'] = time_match.group(1)

                    # Magyar formátum létrehozása
                    if date_match and time_match:
                        hungarian_datetime = format_hungarian_date(date_match.group(1), time_match.group(1))
                        match_details['header_info']['date_time_hungarian'] = hungarian_datetime

                    if debug:
                        match_details['debug_info']['datetime_selector_used'] = selector
                        match_details['debug_info']['datetime_raw_text'] = date_time_text
                    break

            # Eredmény kiolvasása több szelektorral
            score_selectors = [
                'div.wcl-score_100',
                '.wcl-score_100',
                '.match-score',
                '.final-score',
                '.score',
                '.result'
            ]

            for selector in score_selectors:
                score_elem = soup.select_one(selector)
                if score_elem:
                    score_text = score_elem.get_text(strip=True)
                    match_details['header_info']['final_score'] = score_text
                    if debug:
                        match_details['debug_info']['score_selector_used'] = selector
                    break

            # Csapat nevek kiolvasása
            team_selectors = [
                '.team-home',
                '.home-team',
                '.team-name',
                'h2'
            ]

            teams = soup.select('.team-name, .home-team, .away-team, h2')
            if len(teams) >= 2:
                match_details['header_info']['home_team'] = teams[0].get_text(strip=True)
                match_details['header_info']['away_team'] = teams[1].get_text(strip=True)

        except Exception as e:
            print(f"Error extracting match header info: {e}")
            if debug:
                match_details['debug_info']['header_error'] = str(e)

        # 1. Scrape Summary with improved event detection
        summary_content = soup.find('div', id='detail-tab-content')
        if summary_content:
            # Próbáljunk különböző szelektorokat az eseményekhez
            event_selectors = [
                'div.incident',
                '.incident',
                '.match-event',
                '.event',
                '.timeline-event'
            ]

            events = []
            for selector in event_selectors:
                events = summary_content.select(selector)
                if events:
                    if debug:
                        match_details['debug_info']['event_selector_used'] = selector
                    break

            if debug:
                match_details['debug_info']['events_found'] = len(events)

            for i, event in enumerate(events):
                # Idő kiolvasása több módszerrel
                time_elem = None
                time_selectors = ['p[class*="time"]', '.time', '[class*="minute"]', 'span[class*="time"]']

                for time_sel in time_selectors:
                    time_elem = event.select_one(time_sel)
                    if time_elem:
                        break

                time = time_elem.get_text(strip=True) if time_elem else 'N/A'

                # Esemény típus felismerése több módszerrel
                event_type_class = 'unknown'
                event_description = ''

                # 1. Próbáljuk meg az ikon osztályokból
                icon_elem = None
                icon_selectors = ['p[class*="icon"]', '.icon', '[class*="icon"]', 'i', 'span[class*="icon"]']

                for icon_sel in icon_selectors:
                    icon_elem = event.select_one(icon_sel)
                    if icon_elem:
                        break

                if icon_elem and hasattr(icon_elem, 'get') and icon_elem.get('class'):
                    classes = ' '.join(icon_elem.get('class', []))

                    # Ikonok felismerése
                    if 'yellowcard' in classes or 'yellow-card' in classes or 'sarga' in classes.lower():
                        event_type_class = 'yellow_card'
                        event_description = 'Sárga lap'
                    elif 'redcard' in classes or 'red-card' in classes or 'piros' in classes.lower():
                        event_type_class = 'red_card'
                        event_description = 'Piros lap'
                    elif 'goal' in classes or 'gol' in classes.lower():
                        event_type_class = 'goal'
                        event_description = 'Gól'
                    elif 'substitution' in classes or 'csere' in classes.lower():
                        event_type_class = 'substitution'
                        event_description = 'Csere'
                    else:
                        # Ha nem találjuk, próbáljuk meg a teljes szövegből
                        full_text = event.get_text().lower()
                        if 'gól' in full_text or 'goal' in full_text:
                            event_type_class = 'goal'
                            event_description = 'Gól'
                        elif 'sárga' in full_text or 'yellow' in full_text:
                            event_type_class = 'yellow_card'
                            event_description = 'Sárga lap'
                        elif 'piros' in full_text or 'red' in full_text:
                            event_type_class = 'red_card'
                            event_description = 'Piros lap'
                        elif 'csere' in full_text or 'substitution' in full_text:
                            event_type_class = 'substitution'
                            event_description = 'Csere'

                # 2. Ha nincs ikon, próbáljuk meg a szövegből kitalálni
                if event_type_class == 'unknown':
                    full_text = event.get_text().lower()
                    if any(word in full_text for word in ['gól', 'goal', 'score']):
                        event_type_class = 'goal'
                        event_description = 'Gól'
                    elif any(word in full_text for word in ['sárga', 'yellow', 'card']):
                        event_type_class = 'yellow_card'
                        event_description = 'Sárga lap'
                    elif any(word in full_text for word in ['piros', 'red']):
                        event_type_class = 'red_card'
                        event_description = 'Piros lap'
                    elif any(word in full_text for word in ['csere', 'substitution', 'sub']):
                        event_type_class = 'substitution'
                        event_description = 'Csere'

                # Játékos név kiolvasása
                player_name = "N/A"
                player_off = None

                if event_type_class == 'substitution':
                    # Csere esetén próbáljuk meg mindkét játékost megtalálni
                    player_in_elem = event.select_one('.substitution-in, [class*="in"], .player-in')
                    player_out_elem = event.select_one('.substitution-out, [class*="out"], .player-out')

                    if player_in_elem:
                        player_name = player_in_elem.get_text(strip=True)
                    if player_out_elem:
                        player_off = player_out_elem.get_text(strip=True).replace('(','').replace(')','')
                else:
                    # Egyéb események esetén próbáljuk meg a játékos nevet megtalálni
                    player_selectors = ['.player', '[class*="player"]', '.name', '[class*="name"]']
                    for player_sel in player_selectors:
                        player_elem = event.select_one(player_sel)
                        if player_elem and player_elem.get_text(strip=True):
                            player_name = player_elem.get_text(strip=True)
                            break

                    # Ha még mindig nincs, próbáljuk meg a teljes szövegből kinyerni
                    if player_name == "N/A":
                        text_parts = [s.strip() for s in event.stripped_strings if s.strip()]
                        # Kiszűrjük az időt és az ismert kulcsszavakat
                        filtered_parts = [part for part in text_parts
                                        if not re.match(r'^\d+[:\']', part)
                                        and part.lower() not in ['gól', 'goal', 'sárga', 'piros', 'csere']]
                        if filtered_parts:
                            player_name = filtered_parts[0]

                event_data = {
                    'time': time,
                    'type': event_type_class,
                    'description': event_description,
                    'player': player_name,
                    'raw_text': event.get_text(strip=True) if debug else None
                }

                if player_off:
                    event_data['player_off'] = player_off

                match_details['summary'].append(event_data)

        # 2. Scrape Statistics
        stats_url = match_url + "?t=a-merkozes-statisztikaja"
        driver.get(stats_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "detail-tab-content")))
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        stats_content = soup.find('div', id='detail-tab-content')
        if stats_content:
            stats_rows = stats_content.find_all('div', class_=re.compile(r'wcl-row_OFViZ statisticsMobi'))
            for row in stats_rows:
                category_elem = row.find('div', class_=re.compile(r'wcl-category_7qsgP'))
                home_val_elem = row.find('div', class_=re.compile(r'wcl-homeValue'))
                away_val_elem = row.find('div', class_=re.compile(r'wcl-awayValue'))

                category = category_elem.get_text(strip=True) if category_elem else 'N/A'
                home_val = home_val_elem.get_text(strip=True) if home_val_elem else 'N/A'
                away_val = away_val_elem.get_text(strip=True) if away_val_elem else 'N/A'

                match_details['statistics'][category] = {'home': home_val, 'away': away_val}

        # 3. Scrape Lineups
        lineups_url = match_url + "?t=osszeallitasok"
        driver.get(lineups_url)
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "detail-tab-content")))
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        lineups_content = soup.find('div', id='detail-tab-content')
        if lineups_content:
            # Find all h4 tags which contain team names
            team_headers = lineups_content.find_all('h4')

            # Helper function to extract players and their ratings
            def extract_players_with_ratings(table_soup):
                players_data = []
                if table_soup:
                    player_rows = table_soup.find_all('tr')
                    for row in player_rows:
                        player_name_elem = row.find('td', class_='player-name') # Assuming this class exists for player name
                        rating_elem = row.find('span', class_='rating') # Assuming this class exists for rating

                        player_name = player_name_elem.get_text(strip=True) if player_name_elem else 'N/A'
                        rating = rating_elem.get_text(strip=True) if rating_elem else 'N/A'

                        players_data.append({'name': player_name, 'rating': rating})
                return players_data

            if len(team_headers) >= 1:
                home_team_name_in_header = team_headers[0].get_text(strip=True)
                home_table = team_headers[0].find_next_sibling('table', class_='lineup')
                match_details['lineups']['home_team'] = extract_players_with_ratings(home_table)

                current_element = home_table.next_sibling if home_table else None
                while current_element:
                    if current_element.name == 'hr' and 'lineup-separator' in current_element.get('class', []):
                        sub_table = current_element.find_next_sibling('table', class_='lineup')
                        match_details['lineups']['substitutes']['home'].extend(extract_players_with_ratings(sub_table))
                        break
                    current_element = current_element.next_sibling

            if len(team_headers) >= 2:
                away_team_name_in_header = team_headers[1].get_text(strip=True)
                away_table = team_headers[1].find_next_sibling('table', class_='lineup')
                match_details['lineups']['away_team'] = extract_players_with_ratings(away_table)

                current_element = away_table.next_sibling if away_table else None
                while current_element:
                    if current_element.name == 'hr' and 'lineup-separator' in current_element.get('class', []):
                        sub_table = current_element.find_next_sibling('table', class_='lineup')
                        match_details['lineups']['substitutes']['away'].extend(extract_players_with_ratings(sub_table))
                        break
                    current_element = current_element.next_sibling

        # --- Scrape Odds ---
        try:
            odds_url = match_url + "?t=odds-osszehasonlitas" # Assuming this is the URL for odds
            driver.get(odds_url)
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "detail-tab-content")))
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            odds_content = soup.find('div', id='detail-tab-content')
            if odds_content:
                # Look for common elements that contain odds, e.g., tables, divs with specific classes
                # This part will require inspecting the actual HTML of the odds page
                # For now, a placeholder:
                match_details['odds']['placeholder'] = 'Odds scraping not yet implemented, needs HTML inspection.'
        except Exception as e:
            print(f"Error extracting odds: {e}")

        # --- Scrape Head-to-Head Data ---
        try:
            h2h_url = match_url + "?t=egymas-elleni" # Assuming this is the URL for H2H
            driver.get(h2h_url)
            WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.ID, "detail-tab-content")))
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            h2h_content = soup.find('div', id='detail-tab-content')
            if h2h_content:
                # Look for common elements that contain H2H data, e.g., tables, divs with specific classes
                # This part will require inspecting the actual HTML of the H2H page
                # For now, a placeholder:
                match_details['h2h_data']['placeholder'] = 'H2H scraping not yet implemented, needs HTML inspection.'
        except Exception as e:
            print(f"Error extracting H2H data: {e}")

    finally:
        driver.quit()

    return match_details

def scrape_and_process_results():
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

    print(f"Successfully scraped and processed {total_matches} matches.\n")
    print(f"List of matches saved to {list_file_name}\n")

    # --- Scrape details for the first finished match ---
    first_finished_match = next((m for m in grouped_matches['finished'] if m['detail_page_url']), None)

    if first_finished_match:
        details_url = first_finished_match['detail_page_url']
        match_details_data = scrape_match_details(details_url, debug=True)
        if match_details_data:
            details_file_name = f"{first_finished_match['home_team'].replace(' ', '_')}-vs-{first_finished_match['away_team'].replace(' ', '_')}_details.json"
            with open(details_file_name, 'w', encoding='utf-8') as f:
                json.dump(match_details_data, f, indent=4, ensure_ascii=False)
            print(f"Match details saved to {details_file_name}\n")

            # Debug információk kiírása
            if match_details_data.get('debug_info'):
                print("=== DEBUG INFORMÁCIÓK ===")
                for key, value in match_details_data['debug_info'].items():
                    print(f"{key}: {value}")
                print("========================")
    else:
        print("No finished matches with details found to scrape.\n")

if __name__ == "__main__":
    scrape_and_process_results()