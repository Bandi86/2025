import re
import json

input_file = "/tmp/pdf_lines.txt"  # több oldal
output_file = "/tmp/all_matches.json"

def clean_league(line):
    m = re.search(r"Labdarúgás,\s*(.*)", line)
    if m:
        league = m.group(1).strip()
        league = re.sub(r"[:]*\s*\d*\.?\s*oldal.*$", "", league, flags=re.IGNORECASE).strip()
        return league
    return None

def is_skip_league(line):
    skip_keywords = ["női", "U19", "U17", "U21", "leány", "junior", "ifjúsági"]
    return any(kw.lower() in line.lower() for kw in skip_keywords)

def parse_date(line):
    m = re.search(r"([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ]+) \((\d{4})\. (\w+) (\d{1,2})\.\)", line)
    if m:
        day = m.group(1)
        year = m.group(2)
        month = m.group(3)
        daynum = int(m.group(4))
        months = {"január":1,"február":2,"március":3,"április":4,"május":5,"június":6,"július":7,"augusztus":8,"szeptember":9,"október":10,"november":11,"december":12}
        monthnum = months.get(month.lower(), 1)
        return f"{year}-{monthnum:02d}-{daynum:02d}", day
    return None, None

def parse_match(line):
    # Nap rövidítés (P, Szo, Vas, H, K, Sz, Cs, etc.), idő, opcionális sorszám, csapatok, oddsok
    # Pl.: "Szo 02:00  Dep. Cuenca - Mushuc Runa 1,63 3,40 4,10"
    m = re.search(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*(\d+)?\s*([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9 .'-]+) - ([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9 .'-]+) ([0-9],[0-9]+) ([0-9],[0-9]+) ([0-9],[0-9]+)", line)
    if m:
        # m.group(1): nap rövidítés, m.group(2): idő, m.group(3): sorszám (opcionális)
        time = m.group(2)
        team1 = m.group(4).strip()
        team2 = m.group(5).strip()
        odds1 = m.group(6).replace(",", ".")
        oddsX = m.group(7).replace(",", ".")
        odds2 = m.group(8).replace(",", ".")
        return time, team1, team2, odds1, oddsX, odds2
    return None

def main():
    matches = []
    current_date = ""
    current_day = ""
    current_league = ""
    skip_league = False
    current_page = None
    with open(input_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # Oldalszám detektálása: "=== OLDAL 2 ==="
            m_page = re.match(r"=== OLDAL (\d+) ===", line)
            if m_page:
                current_page = int(m_page.group(1))
                continue
            # Sorszám eltávolítása
            line = re.sub(r"^\d{2}:\d{3}:\s*", "", line)
            # Dátum
            if "(" in line and ")" in line:
                date, day = parse_date(line)
                if date:
                    current_date = date
                    current_day = day
                continue
            # Bajnokság
            if line.startswith("Labdarúgás,"):
                if is_skip_league(line):
                    skip_league = True
                    continue
                league = clean_league(line)
                if league:
                    current_league = league
                    skip_league = False
                continue
            if skip_league:
                continue
            # Meccssor
            match = parse_match(line)
            if match and current_league and current_date and current_page:
                time, team1, team2, odds1, oddsX, odds2 = match
                matches.append({
                    "page": current_page,
                    "date": current_date,
                    "day": current_day,
                    "time": time,
                    "league": current_league,
                    "team1": team1,
                    "team2": team2,
                    "odds1": odds1,
                    "oddsX": oddsX,
                    "odds2": odds2
                })
    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(matches, out, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
