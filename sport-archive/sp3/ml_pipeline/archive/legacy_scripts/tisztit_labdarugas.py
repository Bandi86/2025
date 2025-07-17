import csv
import re
import os

INPUT_CSV = "./pdf_output/labdarugas_meccsek_kigyujtott.csv"
OUTPUT_CSV = "./pdf_output/labdarugas_meccsek_tisztitott.csv"

# Regex a csapatok szétválasztásához
csapatok_re = re.compile(r"([^-]+)-([^-]+)")

rows_out = []

with open(INPUT_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Csapatok szétválasztása
        csapat = row["csapat"].replace("  ", " ").replace("–", "-").replace("—", "-").strip()
        m = csapatok_re.match(csapat)
        home, away = (m.group(1).strip(), m.group(2).strip()) if m else (csapat, "")
        # Oddsok validálása
        try:
            odds_h = float(row["odds_h"].replace(",", ".")) if row["odds_h"] else None
        except:
            odds_h = None
        try:
            odds_d = float(row["odds_d"].replace(",", ".")) if row["odds_d"] else None
        except:
            odds_d = None
        try:
            odds_a = float(row["odds_a"].replace(",", ".")) if row["odds_a"] else None
        except:
            odds_a = None
        # Csak ha van legalább 2 odds
        if sum(x is not None for x in [odds_h, odds_d, odds_a]) >= 2 and home and away:
            rows_out.append({
                "forras": row["forras"],
                "bajnoksag": row["bajnoksag"],
                "kezd": row["kezd"],
                "home": home,
                "away": away,
                "odds_h": odds_h,
                "odds_d": odds_d,
                "odds_a": odds_a,
                "fogadas_tipus": row["fogadas_tipus"]
            })

with open(OUTPUT_CSV, "w", newline='', encoding='utf-8') as f:
    fieldnames = ["forras", "bajnoksag", "kezd", "home", "away", "odds_h", "odds_d", "odds_a", "fogadas_tipus"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows_out:
        writer.writerow(r)

print(f"Tisztított labdarúgás meccsek: {len(rows_out)} db. Eredmény: {OUTPUT_CSV}")
