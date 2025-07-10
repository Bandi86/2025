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

def debug_page_structure(match_url):
    """Debug funkció ami elmenti a HTML struktúrát"""
    print(f"Debugging page structure for: {match_url}")

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

    try:
        driver.get(match_url)

        # Várjunk, hogy töltse be a tartalmat
        WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

        # Esetleg várjunk egy kicsit többet a dinamikus tartalom betöltéséhez
        import time
        time.sleep(3)

        html_content = driver.page_source

        # Mentsük el a teljes HTML-t
        with open('debug_page.html', 'w', encoding='utf-8') as f:
            f.write(html_content)

        soup = BeautifulSoup(html_content, 'html.parser')

        # Elemzési jelentés készítése
        analysis = {
            'page_title': soup.title.get_text() if soup.title else 'No title',
            'h1_tags': [h1.get_text(strip=True) for h1 in soup.find_all('h1')],
            'h2_tags': [h2.get_text(strip=True) for h2 in soup.find_all('h2')],
            'h3_tags': [h3.get_text(strip=True) for h3 in soup.find_all('h3')],
            'h4_tags': [h4.get_text(strip=True) for h4 in soup.find_all('h4')],
            'elements_with_score_class': [],
            'elements_with_date_class': [],
            'elements_with_time_class': [],
            'elements_with_event_class': [],
            'all_unique_classes': set()
        }

        # Keressük meg az összes elemet ami score-t tartalmazhat
        for elem in soup.find_all(True):
            if elem.get('class'):
                classes = elem.get('class')
                analysis['all_unique_classes'].update(classes)

                # Score-ra utaló osztályok
                if any('score' in cls.lower() for cls in classes):
                    text = elem.get_text(strip=True)
                    if text:
                        analysis['elements_with_score_class'].append({
                            'classes': classes,
                            'text': text,
                            'tag': elem.name
                        })

                # Dátumra utaló osztályok
                if any(word in cls.lower() for word in ['date', 'time', 'datetime'] for cls in classes):
                    text = elem.get_text(strip=True)
                    if text:
                        analysis['elements_with_date_class'].append({
                            'classes': classes,
                            'text': text,
                            'tag': elem.name
                        })

                # Eseményekre utaló osztályok
                if any(word in cls.lower() for word in ['event', 'incident', 'timeline', 'summary'] for cls in classes):
                    text = elem.get_text(strip=True)
                    if text and len(text) < 200:  # Ne vegyük be a túl hosszú szövegeket
                        analysis['elements_with_event_class'].append({
                            'classes': classes,
                            'text': text,
                            'tag': elem.name
                        })

        # Keressük meg az elemeket amik számokat tartalmaznak (eredmény)
        potential_scores = []
        for elem in soup.find_all(True):
            text = elem.get_text(strip=True)
            if re.match(r'^\d+\s*[-:]\s*\d+$', text):
                potential_scores.append({
                    'text': text,
                    'tag': elem.name,
                    'classes': elem.get('class', []),
                    'parent_classes': elem.parent.get('class', []) if elem.parent else []
                })

        analysis['potential_scores'] = potential_scores
        analysis['unique_classes_list'] = sorted(list(analysis['all_unique_classes']))
        del analysis['all_unique_classes']  # Hogy JSON serializable legyen

        # Mentsük el az elemzést
        with open('page_analysis.json', 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)

        print("Debug files saved:")
        print("- debug_page.html (teljes HTML)")
        print("- page_analysis.json (elemzés)")

        # Kiírjuk a legfontosabb infókat
        print(f"\nPage title: {analysis['page_title']}")
        print(f"H1 tags found: {analysis['h1_tags']}")
        print(f"Potential scores: {[s['text'] for s in potential_scores]}")

        return analysis

    finally:
        driver.quit()

def get_first_finished_match():
    """Megkeresi az első befejezett meccset"""
    base_url = "https://m.eredmenyek.com"
    url = f"{base_url}/"
    response = requests.get(url)

    if response.status_code != 200:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    score_data = soup.find('div', id='score-data')

    if not score_data:
        print("Could not find the main score data container.")
        return None

    match_links = score_data.find_all('a', class_=['fin'])  # Csak befejezett meccsek

    for link in match_links:
        detail_path = link.get('href')
        if detail_path:
            detail_page_url = f"{base_url}{detail_path}"
            return detail_page_url

    return None

if __name__ == "__main__":
    # Keressünk egy befejezett meccset
    match_url = get_first_finished_match()

    if match_url:
        print(f"Found match URL: {match_url}")
        debug_page_structure(match_url)
    else:
        print("No finished matches found to debug")
