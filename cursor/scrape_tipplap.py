import os
import json
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

# Load environment variables
load_dotenv()
OUTPUT_JSON = os.getenv('OUTPUT_JSON', 'output.json')


def scrape_tipplap():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('https://www.tipplap.hu/kalkulator', timeout=60000)
        # TODO: Wait for match data to load (update selector as needed)
        page.wait_for_selector('div.match')  # Placeholder selector
        # TODO: Extract match data here
        matches = []
        # ... extraction logic ...
        # Save to JSON
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(matches, f, ensure_ascii=False, indent=2)
        browser.close()

if __name__ == '__main__':
    scrape_tipplap() 