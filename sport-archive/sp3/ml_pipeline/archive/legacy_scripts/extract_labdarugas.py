import csv
import os
import glob
import re

INPUT_DIR = "./pdf_output"
OUTPUT_CSV = "./pdf_output/labdarugas_meccsek_kigyujtott.csv"

# Regexek
labdarugas_re = re.compile(r"Labdarúgás", re.IGNORECASE)
meccs_re = re.compile(r"^(P|Szo|V|H|K|Sze|Cs)\s+\d{1,2}:\d{2}")

# Eredmény tároló
rows = []

for fname in glob.glob(os.path.join(INPUT_DIR, "*_camelot-*.csv")):
    with open(fname, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        current_league = None
        for row in reader:
            # Bajnoság/sportág detektálás
            joined = " ".join(row)
            if labdarugas_re.search(joined):
                current_league = joined.strip()
                continue
            # Meccssor detektálás
            if meccs_re.match(row[0].strip() if row and row[0] else "") and current_league:
                # Próbáljuk kinyerni a főbb mezőket
                kezd = row[0].strip()
                csapat = row[3].strip() if len(row) > 3 else ""
                odds_h = row[6].replace(",", ".").strip() if len(row) > 6 else ""
                odds_d = row[7].replace(",", ".").strip() if len(row) > 7 else ""
                odds_a = row[8].replace(",", ".").strip() if len(row) > 8 else ""
                fogadas_tipus = row[4].strip() if len(row) > 4 else ""
                rows.append({
                    "forras": os.path.basename(fname),
                    "bajnoksag": current_league,
                    "kezd": kezd,
                    "csapat": csapat,
                    "odds_h": odds_h,
                    "odds_d": odds_d,
                    "odds_a": odds_a,
                    "fogadas_tipus": fogadas_tipus
                })

with open(OUTPUT_CSV, "w", newline='', encoding='utf-8') as f:
    fieldnames = ["forras", "bajnoksag", "kezd", "csapat", "odds_h", "odds_d", "odds_a", "fogadas_tipus"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows:
        writer.writerow(r)

print(f"Kigyűjtött labdarúgás meccsek: {len(rows)} db. Eredmény: {OUTPUT_CSV}")
