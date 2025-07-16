# scrape.py

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import json

# --- Setup WebDriver ---
# Manually specify the path to ChromeDriver
print("Setting up ChromeDriver...")
# Make sure to download the correct ChromeDriver for your Chrome version (138.0.7204.101)
# and place it in the project root directory (C:\Users\bandi\Documents\code\2025\scrap\chromedriver.exe)
options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu') # Required for headless on Windows
service = Service("C:/Users/bandi/.wdm/drivers/chromedriver/win64/138.0.7204.94/chromedriver-win32/chromedriver.exe")
driver = webdriver.Chrome(service=service, options=options)

all_matches_data = []

try:
    # --- Navigate to the Website ---
    url = "https://www.flashscore.com/"
    print(f"Navigating to {url}")
    driver.get(url)

    # --- Handle Cookie Consent ---
    # Wait for a maximum of 10 seconds for the cookie button to be clickable
    print("Waiting for cookie consent banner...")
    wait = WebDriverWait(driver, 10)
    # The element ID for the accept button is 'onetrust-accept-btn-handler'
    accept_button = wait.until(EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
    accept_button.click()
    print("Cookie consent accepted.")

    # --- Scrape Match Data ---
    # Wait for the main content (the list of matches) to be loaded
    # We look for elements with the class 'event__match'
    print("Waiting for match list to load...")
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".event__match")))
    time.sleep(2) # A small extra wait for all dynamic content to settle

    # Find all match containers
    matches = driver.find_elements(By.CSS_SELECTOR, ".event__match")
    print(f"\nFound {len(matches)} matches on the page. Scraping data...\n")

    for match in matches:
        try:
            wait_match_elements = WebDriverWait(match, 5)

            home_team = wait_match_elements.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".event__participant--home"))).text
            away_team = wait_match_elements.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".event__participant--away"))).text
            
            # Scores might not be present for scheduled matches, so we use find_elements and check if present
            home_score_elements = match.find_elements(By.CSS_SELECTOR, ".event__score--home")
            away_score_elements = match.find_elements(By.CSS_SELECTOR, ".event__score--away")

            if home_score_elements and away_score_elements:
                home_score = home_score_elements[0].text
                away_score = away_score_elements[0].text
                score = f"{home_score}-{away_score}"
            else:
                score = "Not started"

            # Time or status of the match (e.g., '15:00', 'Finished', 'HT')
            match_time = wait_match_elements.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".event__time"))).text

            match_data = {
                "home_team": home_team,
                "away_team": away_team,
                "score": score,
                "match_time": match_time
            }
            all_matches_data.append(match_data)

            print(f"Time/Status: {match_time: <10} | {home_team: >20} vs {away_team: <20} | Score: {score}")

        except Exception as e:
            # This will catch errors if a specific element isn't found in one of the match containers
            print(f"Could not process a match row. Error: {e}")

finally:
    # --- Save to JSON ---
    output_filename = "matches.json"
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_matches_data, f, ensure_ascii=False, indent=4)
    print(f"\nMatch data saved to {output_filename}")

    # --- Clean Up ---
    print("Scraping finished. Closing browser.")
    driver.quit()
