import time
import json
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_todays_football_match_ids(driver):
    """Navigates to Flashscore, handles cookies, and scrapes today's football match IDs."""
    logging.info("Navigating to Flashscore.com to get today's football matches...")
    driver.get("https://www.flashscore.com/")

    # Handle cookie consent banner
    try:
        WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
        ).click()
        logging.info("Accepted cookies.")
    except Exception:
        logging.info("Cookie banner not found or already accepted.")

    time.sleep(2)  # Wait for page to load events

    soup = BeautifulSoup(driver.page_source, 'html.parser')
    match_ids = []

    # Find all match containers
    events = soup.find_all('div', class_='event__match event__match--scheduled')
    for event in events:
        # Check if the event is a football match
        sport_icon = event.find('svg', class_='sport-icon')
        if sport_icon and sport_icon.get('title', '').lower() == 'football':
            match_id = event.get('id', '').split('_')[-1]
            if match_id:
                match_ids.append(match_id)

    logging.info(f"Found {len(match_ids)} football matches for today.")
    return match_ids

def scrape_match_data(driver, match_id):
    """Scrapes detailed data for a given match ID."""
    url = f"https://www.flashscore.com/match/{match_id}/#/match-summary"
    driver.get(url)

    try:
        # Wait for the main score element to be visible
        WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CLASS_NAME, 'detailScore__wrapper'))
        )
    except Exception:
        logging.warning(f"Could not load details for match {match_id}. Skipping.")
        return None

    soup = BeautifulSoup(driver.page_source, 'html.parser')

    def get_text(element, selector):
        try:
            return element.select_one(selector).get_text(strip=True)
        except AttributeError:
            return None

    country = get_text(soup, '.tournamentHeader__country a')
    league = get_text(soup, '.tournamentHeader__league a')
    home_team = get_text(soup, '.duelParticipant--home .participant__participantName--showLong')
    away_team = get_text(soup, '.duelParticipant--away .participant__participantName--showLong')
    home_score = get_text(soup, '.detailScore__wrapper span:nth-of-type(1)')
    away_score = get_text(soup, '.detailScore__wrapper span:nth-of-type(3)')
    status = get_text(soup, '.fixedHeaderDuel__detailStatus')

    ht_score_element = soup.select_one('.detailScore__status')
    half_time_score = ht_score_element.get_text(strip=True) if ht_score_element else None

    return {
        'match_id': match_id,
        'country': country,
        'league': league,
        'home_team': home_team,
        'away_team': away_team,
        'home_score': home_score,
        'away_score': away_score,
        'status': status,
        'half_time_score': half_time_score,
        'url': url
    }

def main():
    """Main function to orchestrate the scraping process."""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless') # Run in headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)

    match_ids = get_todays_football_match_ids(driver)
    all_matches_data = []

    for match_id in match_ids:
        data = scrape_match_data(driver, match_id)
        if data:
            logging.info(f"Scraped data for {data['home_team']} vs {data['away_team']}")
            all_matches_data.append(data)

    driver.quit()

    if all_matches_data:
        output_file = 'todays_football_matches.json'
        with open(output_file, 'w') as f:
            json.dump(all_matches_data, f, indent=4)
        logging.info(f"Successfully saved {len(all_matches_data)} matches to {output_file}")
    else:
        logging.info("No match data was scraped.")

if __name__ == '__main__':
    main()