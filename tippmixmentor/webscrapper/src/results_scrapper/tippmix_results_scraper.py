from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from bs4 import BeautifulSoup
import json
import re
import os
from datetime import datetime
import logging

# Configure logging
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'scraper.log')

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def scrape_tippmix_results(url):
    """
    Scrapes sport event results from the given Tippmix URL using Selenium, extracts team names and times,
    and returns them in a structured format.
    """
    logging.info(f"Starting scraping for URL: {url}")

    # Set up Chrome options for headless browsing
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080") # Set a common window size

    # Path to chromedriver - assuming it's in the PATH or current directory
    # You might need to specify the full path if it's not found
    # service = Service('/path/to/chromedriver') # Uncomment and modify if chromedriver is not in PATH

    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options) #, service=service)
        driver.get(url)

        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CLASS_NAME, 'title.ng-binding')))
        logging.info("Found title.ng-binding element, assuming data is loaded.")
        
        page_source = driver.page_source
        # Save page source for inspection (optional, for debugging)
        # with open("tippmix_page_source.html", "w", encoding="utf-8") as f:
        #     f.write(page_source)
        # logging.info("Page source saved to tippmix_page_source.html for inspection.")

        soup = BeautifulSoup(page_source, 'html.parser')
        all_matches = []
        league_match_counts = {}

        match_tables = soup.find_all('div', class_=['table-default', 'table-market'])
        logging.info(f"Found {len(match_tables)} match tables.")
        
        for table_div in match_tables:
            league_name_tag = table_div.find('h2', class_='market-name ng-binding')
            league_name = league_name_tag.get_text(strip=True) if league_name_tag else 'Unknown League'
            
            tbody = table_div.find('tbody')
            if not tbody:
                logging.warning(f"No tbody found in table for league: {league_name}")
                continue
            
            rows = tbody.find_all('tr', recursive=False)
            logging.info(f"Processing {len(rows)} rows in league: {league_name}")

            current_league_matches = 0
            for row in rows:
                if 'dropdown' in row.get('class', []):
                    continue

                all_tds = row.find_all('td')
                team1, team2, match_time, score = 'N/A', 'N/A', 'N/A', 'N/A'

                if len(all_tds) > 0:
                    team_names_tag = all_tds[0]
                    teams_text = team_names_tag.get_text(strip=True)
                    team_match = re.match(r'(.+?)\s*-\s*(.+)', teams_text)
                    if team_match:
                        team1 = team_match.group(1).strip()
                        team2 = team_match.group(2).strip()
                    else:
                        team1 = teams_text # Fallback if parsing fails
                        team2 = 'N/A'

                if len(all_tds) > 1:
                    time_tag = all_tds[1]
                    full_time_text = time_tag.get_text(strip=True)
                    time_match = re.search(r'\d{2}:\d{2}', full_time_text)
                    if time_match:
                        match_time = time_match.group(0)

                if len(all_tds) > 2:
                    outcome_tag = all_tds[2]
                    score_tag = outcome_tag.find('event-results-scoreboard')
                    if score_tag:
                        score = score_tag.get_text(strip=True)

                if team1 != 'N/A' and team2 != 'N/A' and match_time != 'N/A':
                    all_matches.append({
                        'league': league_name,
                        'team1': team1,
                        'team2': team2,
                        'time': match_time,
                        'score': score
                    })
                    current_league_matches += 1
                else:
                    logging.warning(f"Could not find all required data (team names, time) in a row for league: {league_name}. Row HTML: {row}")
            
            if current_league_matches > 0:
                league_match_counts[league_name] = league_match_counts.get(league_name, 0) + current_league_matches

        logging.info(f"Scraping completed. Found {len(all_matches)} matches.")
        return {
            'total_matches': len(all_matches),
            'matches_by_league': league_match_counts,
            'matches': all_matches
        }

    except TimeoutException:
        logging.error(f"Timeout waiting for page to load at {url}")
        return None
    except WebDriverException as e:
        logging.error(f"WebDriver error: {e}. Please ensure you have a compatible ChromeDriver installed and it's in your system's PATH. You can download ChromeDriver from: https://googlechromelabs.github.io/chrome-for-testing/")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
        return None
    finally:
        if driver:
            driver.quit()

def save_results_to_json(data, filename):
    """
    Saves the scraped data to a JSON file in the 'data' subdirectory, appending if file exists.
    """
    output_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(output_dir, exist_ok=True)
    full_path = os.path.join(output_dir, filename)

    existing_data = {'total_matches': 0, 'matches_by_league': {}, 'matches': []}
    if os.path.exists(full_path):
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            logging.info(f"Existing data loaded from {full_path}")
        except json.JSONDecodeError:
            logging.warning(f"Could not decode existing JSON from {full_path}. Starting with empty data.")
        except IOError as e:
            logging.error(f"Error reading existing data from {full_path}: {e}")

    # Merge new matches, avoiding duplicates
    existing_matches_set = set((m['league'], m['team1'], m['team2'], m['time']) for m in existing_data['matches'])
    new_matches_to_add = []
    for new_match in data['matches']:
        match_tuple = (new_match['league'], new_match['team1'], new_match['team2'], new_match['time'])
        if match_tuple not in existing_matches_set:
            new_matches_to_add.append(new_match)
            existing_matches_set.add(match_tuple)
            # Update league counts for newly added matches
            existing_data['matches_by_league'][new_match['league']] = existing_data['matches_by_league'].get(new_match['league'], 0) + 1

    existing_data['matches'].extend(new_matches_to_add)
    existing_data['total_matches'] = len(existing_data['matches'])

    try:
        with open(full_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=4)
        logging.info(f"Results successfully saved/appended to {full_path}. Total matches: {existing_data['total_matches']}")
    except IOError as e:
        logging.error(f"Error saving results to {full_path}: {e}")

if __name__ == "__main__":
    today = datetime.now().strftime("%Y-%m-%d")
    url = f"https://www.tippmix.hu/eredmenyek#?sportid=1&interval=1&sorting=date&date={today}"
    output_filename = f"tippmix_results_{today}.json"

    logging.info(f"Script started for date: {today}")
    logging.info(f"Target URL: {url}")

    scraped_data = scrape_tippmix_results(url)

    if scraped_data:
        save_results_to_json(scraped_data, output_filename)
    else:
        logging.error("Scraping failed or returned no data.")
    
    logging.info("Script finished.")