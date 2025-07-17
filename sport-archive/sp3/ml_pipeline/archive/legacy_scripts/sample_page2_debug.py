#!/usr/bin/env python3
"""
PDF 2. oldalának mintafeldolgozása: minden sorra kiírja, hogy szerinte mi (dátum, liga, meccs, piac, vagy kihagyva), a szabályaid szerint.
"""
import re

PDF_LINES_PATH = "/tmp/page2_lines.txt"

# Minták
DATE_PATTERN = re.compile(r"(hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap).*\(\d{4}\.\s*\w+\s*\d+\.\)", re.IGNORECASE)
LEAGUE_PATTERN = re.compile(r"Labdarúgás, ([^,\d]+)", re.IGNORECASE)
MATCH_LINE_PATTERN = re.compile(r"^[PKVSzCs] \d{1,2}:\d{2} \d+ ([^\-]+) - ([^\d]+) (\d{1,2}[,.]\d{2}) (\d{1,2}[,.]\d{2}) (\d{1,2}[,.]\d{2})$")
SKIP_PATTERNS = [
    re.compile(r"női", re.IGNORECASE),
    re.compile(r"válogatott mérkőzés, női", re.IGNORECASE),
    re.compile(r"\d+\. oldal"),
]


def is_skip(line):
    return any(pat.search(line) for pat in SKIP_PATTERNS)

def main():
    with open(PDF_LINES_PATH, "r", encoding="utf-8") as f:
        in_offer = False
        current_date = None
        current_league = None
        for raw in f:
            line = raw.strip()
            if line.startswith("=== OLDAL 2 ===") or not line:
                in_offer = False
                continue
            if line.startswith("=== OLDAL "):
                break
            # Sorszám levágása (pl. 02:014: ...)
            content = line
            if re.match(r"\d{2}:\d{3}: ", line):
                content = line[8:]
            # Belépési pont
            if "fogadási ajánlat" in content.lower() or "Fogadási esemény Kim." in content:
                in_offer = True
                print(f"[START OFFER] {line}")
                continue
            if not in_offer:
                continue
            # Szűrés
            if is_skip(content):
                print(f"[SKIP] {line}")
                continue
            # Dátum
            if "(" in content and ")" in content and any(day in content.lower() for day in ["hétfő","kedd","szerda","csütörtök","péntek","szombat","vasárnap"]):
                current_date = content
                print(f"[DATE] {line}")
                continue
            # Liga
            if content.lower().startswith("labdarúgás"):
                current_league = content
                print(f"[LEAGUE] {line}")
                continue
            # Fő meccssor (1X2 odds)
            if re.match(r"^[PKVSzCs] \d{1,2}:\d{2} \d+ .+ - .+ \d{1,2}[,.]\d{2} \d{1,2}[,.]\d{2} \d{1,2}[,.]\d{2}$", content):
                print(f"[MATCH] {line}")
                continue
            # Piac (ugyanaz a két csapat, de nem 1X2)
            if re.match(r"^[PKVSzCs] \d{1,2}:\d{2} \d+ .+ - .+", content):
                print(f"[MARKET?] {line}")
                continue
            # Egyéb
            print(f"[OTHER] {line}")

if __name__ == "__main__":
    main()
