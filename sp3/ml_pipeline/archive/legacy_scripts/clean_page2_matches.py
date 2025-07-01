import re
import sys

# Bemeneti és kimeneti fájlok
input_file = "/tmp/page2_lines.txt"
output_file = "/tmp/page2_cleaned.csv"

def clean_league(line):
    # "Labdarúgás, Dél-koreai bajnokság : 9. oldal" -> "Dél-koreai bajnokság"
    m = re.search(r"Labdarúgás,\s*(.*)", line)
    if m:
        league = m.group(1).strip()
        # Töröljük a sor végéről az oldalszámot és furcsa karaktereket
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
    m = re.search(r"^[A-Z] \d{2}:\d{2} \d+ (.+)", line)
    if m:
        line = m.group(1)
    m = re.search(r"([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9 .'-]+) - ([A-Za-záéíóöőúüűÁÉÍÓÖŐÚÜŰ0-9 .'-]+) ([0-9],[0-9]+) ([0-9],[0-9]+) ([0-9],[0-9]+)", line)
    if m:
        team1 = m.group(1).strip()
        team2 = m.group(2).strip()
        odds1 = m.group(3).replace(",", ".")
        oddsX = m.group(4).replace(",", ".")
        odds2 = m.group(5).replace(",", ".")
        return team1, team2, odds1, oddsX, odds2
    return None

def main():
    current_date = ""
    current_day = ""
    current_league = ""
    skip_league = False
    with open(input_file, encoding="utf-8") as f, open(output_file, "w", encoding="utf-8") as out:
        out.write("date,day,league,team1,team2,odds1,oddsX,odds2\n")
        for line in f:
            line = line.strip()
            line = re.sub(r"^\d{2}:\d{3}:\s*", "", line)
            if "(" in line and ")" in line:
                date, day = parse_date(line)
                if date:
                    current_date = date
                    current_day = day
                continue
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
            match = parse_match(line)
            if match and current_league and current_date:
                team1, team2, odds1, oddsX, odds2 = match
                out.write(f"{current_date},{current_day},{current_league},{team1},{team2},{odds1},{oddsX},{odds2}\n")

if __name__ == "__main__":
    main()
