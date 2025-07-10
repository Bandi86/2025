import requests
from bs4 import BeautifulSoup
import json
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

def debug_html_structure(match_url):
    """Debug funkció a HTML szerkezet elemzésére"""

    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)

    try:
        print(f"=== HTML SZERKEZET DEBUG ELEMZÉS ===")
        driver.get(match_url)

        import time
        time.sleep(3)

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # 1. Keressük a bajnokság nevét
        print("\n🏆 BAJNOKSÁG NÉV KERESÉSE:")

        # Minden h1, h2, h3 elem vizsgálata
        headers = soup.find_all(['h1', 'h2', 'h3'])
        for i, header in enumerate(headers):
            text = header.get_text(strip=True)
            if text and len(text) > 5:
                print(f"Header {i+1}: {text}")
                parent_text = header.parent.get_text(strip=True) if header.parent else "None"
                print(f"  Parent: {parent_text[:100]}...")
                print(f"  Classes: {header.get('class', [])}")

        # Breadcrumb típusú elemek
        print("\n📍 BREADCRUMB/NAVIGATION ELEMEK:")
        breadcrumbs = soup.select('.breadcrumb, nav, [class*="nav"], [class*="breadcrumb"]')
        for i, elem in enumerate(breadcrumbs):
            text = elem.get_text(strip=True)
            if text:
                print(f"Nav {i+1}: {text}")

        # Link elemek vizsgálata
        print("\n🔗 LINKEK VIZSGÁLATA:")
        links = soup.find_all('a')
        for i, link in enumerate(links[:20]):  # Első 20 link
            text = link.get_text(strip=True)
            href = link.get('href', '')
            if text and ('division' in text.lower() or 'league' in text.lower() or 'championship' in text.lower()):
                print(f"Link {i+1}: {text} -> {href}")

        # 2. Forduló szám keresése
        print("\n📋 FORDULÓ SZÁM KERESÉSE:")

        # Minden szöveges elem vizsgálata forduló kulcsszavakra
        all_text_elements = soup.find_all(text=True)
        for i, text in enumerate(all_text_elements):
            text_clean = text.strip()
            if text_clean and any(keyword in text_clean.lower() for keyword in ['forduló', 'round', 'week', 'matchday']):
                print(f"Round text {i+1}: {text_clean}")
                parent = text.parent if hasattr(text, 'parent') else None
                if parent:
                    print(f"  Parent tag: {parent.name}, classes: {parent.get('class', [])}")

        # 3. Extra információk keresése
        print("\n🏟️ EXTRA INFORMÁCIÓK KERESÉSE:")

        # Játékvezető keresése
        for i, text in enumerate(all_text_elements):
            text_clean = text.strip().lower()
            if any(keyword in text_clean for keyword in ['játékvezető', 'referee', 'bíró', 'ref']):
                print(f"Referee text {i+1}: {text.strip()}")
                parent = text.parent if hasattr(text, 'parent') else None
                if parent:
                    parent_text = parent.get_text(strip=True)
                    print(f"  Full parent text: {parent_text}")

        # Helyszín keresése
        for i, text in enumerate(all_text_elements):
            text_clean = text.strip().lower()
            if any(keyword in text_clean for keyword in ['helyszín', 'venue', 'stadium', 'pálya', 'stadion']):
                print(f"Venue text {i+1}: {text.strip()}")
                parent = text.parent if hasattr(text, 'parent') else None
                if parent:
                    parent_text = parent.get_text(strip=True)
                    print(f"  Full parent text: {parent_text}")

        # 4. Táblázatok vizsgálata extra infókhoz
        print("\n📊 TÁBLÁZATOK VIZSGÁLATA:")
        tables = soup.find_all('table')
        for i, table in enumerate(tables):
            rows = table.find_all('tr')
            print(f"Table {i+1}: {len(rows)} rows")
            for j, row in enumerate(rows[:5]):  # Első 5 sor
                cells = row.find_all(['td', 'th'])
                row_text = " | ".join([cell.get_text(strip=True) for cell in cells])
                if row_text:
                    print(f"  Row {j+1}: {row_text}")

        # 5. Minden div elem vizsgálata class alapján
        print("\n📦 DIVEK VIZSGÁLATA:")
        divs = soup.find_all('div')
        info_divs = []
        for div in divs:
            classes = div.get('class', [])
            text = div.get_text(strip=True)

            # Keressük az info, details, match stb. class-okat
            if any(keyword in ' '.join(classes).lower() for keyword in ['info', 'detail', 'match', 'game', 'meta']):
                if text and len(text) < 200:  # Ne nagyon hosszú szövegek
                    info_divs.append((classes, text))

        print(f"Info divek száma: {len(info_divs)}")
        for i, (classes, text) in enumerate(info_divs[:10]):
            print(f"Info div {i+1}: {classes} -> {text}")

        # 6. Meta információk keresése
        print("\n📝 META INFORMÁCIÓK:")
        metas = soup.find_all('meta')
        for meta in metas:
            name = meta.get('name', '')
            content = meta.get('content', '')
            if name and content and any(keyword in name.lower() for keyword in ['title', 'description', 'keywords']):
                print(f"Meta {name}: {content}")

        # 7. JSON-LD vagy structured data keresése
        print("\n🗂️ STRUCTURED DATA:")
        scripts = soup.find_all('script', type='application/ld+json')
        for i, script in enumerate(scripts):
            try:
                data = json.loads(script.string)
                print(f"JSON-LD {i+1}: {json.dumps(data, indent=2)[:500]}...")
            except:
                print(f"JSON-LD {i+1}: Invalid JSON")

        # 8. Az oldal teljes szövegének átvizsgálása
        print("\n📄 TELJES OLDAL SZÖVEG KERESÉSE:")
        full_text = soup.get_text()

        # Bajnokság név keresése a teljes szövegben
        lines = full_text.split('\n')
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if (line_clean and
                len(line_clean) > 10 and
                len(line_clean) < 100 and
                any(keyword in line_clean.lower() for keyword in ['division', 'professional', 'league', 'championship', 'cup'])):
                print(f"Potential league line {i+1}: {line_clean}")

        # Forduló keresése a teljes szövegben
        for i, line in enumerate(lines):
            line_clean = line.strip()
            if (line_clean and
                re.search(r'\d+\.?\s*forduló|round\s*\d+|week\s*\d+', line_clean.lower())):
                print(f"Potential round line {i+1}: {line_clean}")

    finally:
        driver.quit()

if __name__ == "__main__":
    debug_html_structure("https://m.eredmenyek.com/merkozes/KOVqFIMi/")
