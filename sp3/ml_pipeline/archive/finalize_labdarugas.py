import csv
import re
import os
import unicodedata
import pathlib
import logging
from collections import Counter
import sqlite3

# Új, rendezett pipeline mappák
PIPELINE_ROOT = pathlib.Path("./pdf_pipeline")
RAW_DIR = PIPELINE_ROOT / "raw"
INTERMEDIATE_DIR = PIPELINE_ROOT / "intermediate"
FINAL_DIR = PIPELINE_ROOT / "final"
DB_DIR = PIPELINE_ROOT / "db"

# Fájlnevek
INPUT_CSV = str(INTERMEDIATE_DIR / "labdarugas_meccsek_tisztitott.csv")
OUTPUT_CSV = str(FINAL_DIR / "labdarugas_meccsek_final.csv")
DB_PATH = str(DB_DIR / "labdarugas_meccsek.db")

# LOG fájl a pipeline végéhez
LOG_PATH = str(FINAL_DIR / "finalize_log.txt")
logging.basicConfig(filename=LOG_PATH, level=logging.INFO, format='%(message)s')

# Mappák automatikus létrehozása
for d in [RAW_DIR, INTERMEDIATE_DIR, FINAL_DIR, DB_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Regex a csapatok szétválasztásához
csapatok_re = re.compile(r"([^-]+)-([^-]+)")
# Csak klasszikus 1X2 piacok (fogadási típus üres vagy tartalmazza az 1X2-t)
klasszikus_1x2 = lambda s: (not s) or ("1x2" in s.lower()) or ("" == s.strip())

def normalize_name(name):
    # Kisbetű, ékezet eltávolítás, whitespace trim
    name = name.strip().lower()
    name = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    return name

def is_valid_team(name):
    # Legalább 2 karakter, csak betűk/számok, nem túl hosszú
    return name and 2 <= len(name) <= 32 and any(c.isalpha() for c in name)

def is_valid_league(name):
    # Legalább 4 karakter, nem túl hosszú, tartalmaz betűt
    return name and 4 <= len(name) <= 40 and any(c.isalpha() for c in name)

# Engedékenyebb 1X2 felismerés helyett szigorúbb, csak explicit 1X2 piacok
_1x2_keywords = ["1x2", "háromesély", "home/draw/away", "hazai/döntetlen/vendég", "hazai", "döntetlen", "vendég"]
# Szigorú kizáró szűrés: csak valódi fő 1X2 piacok
EXCLUDE_MARKETS = [
    "félidő", "1. félidő", "2. félidő", "döntetlennél", "draw no bet", "kétesély", "hendikep", "szöglet", "gól", "mindkét csapat", "over", "under", "tét visszajár", "handicap", "corner", "goal", "both teams", "double chance", "win either half", "clean sheet", "scorecast", "first goal", "last goal", "penalty", "büntető", "piros lap", "yellow card", "sárga lap", "piros lap", "csapat góljai", "hazai góljai", "vendég góljai", "hazai vagy döntetlen", "döntetlen vagy vendég", "hazai vagy vendég", "draw or home", "draw or away", "home or away", "hazai nem kap gólt", "vendég nem kap gólt", "mindkét félidő", "első félidő", "második félidő", "első gól", "utolsó gól", "szöglet hendikep", "szöglet szám", "szöglet piac", "szöglet összesen", "szöglet tipp", "szöglet fogadás", "szöglet eredmény", "szöglet különbség", "szöglet arány", "szöglet opció", "szöglet variáció", "szöglet alternatíva", "szöglet alternatív piac", "szöglet alternatív fogadás", "szöglet alternatív tipp", "szöglet alternatív eredmény", "szöglet alternatív különbség", "szöglet alternatív arány", "szöglet alternatív opció", "szöglet alternatív variáció", "szöglet alternatív alternatíva"
]

def is_1x2_market(s):
    if not s or s.strip() == "":
        return True
    s = s.lower()
    # Ha bármely kizáró kulcsszó szerepel, kizárjuk
    if any(ex in s for ex in EXCLUDE_MARKETS):
        return False
    # Szigorú: csak ha a fő 1X2 kulcsszavak egyike szerepel
    return any(kw in s for kw in _1x2_keywords)

# ALLOWED_LEAGUES üres: minden bajnokság átmegy
ALLOWED_LEAGUES = set([
    # 'angol', 'magyar', 'spanyol', 'olasz', 'német', 'francia', 'mls', ...
])

leagues_found = Counter()

rows_out = []
skip_reasons = Counter()

with open(INPUT_CSV, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        home = normalize_name(row["home"]) if row["home"] else None
        away = normalize_name(row["away"]) if row["away"] else None
        # Odds validáció: legalább 2 értelmes odds kötelező
        odds = []
        for k in ["odds_h", "odds_d", "odds_a"]:
            try:
                val = float(row[k])
                if 1.01 < val < 20.0:
                    odds.append(val)
                else:
                    odds.append(None)
            except:
                odds.append(None)
        odds_valid = sum(x is not None for x in odds) >= 2
        # Szűrési logika
        if not odds_valid:
            skip_reasons['rossz odds'] += 1
            continue
        if not (is_valid_team(home) and is_valid_team(away)):
            skip_reasons['rossz csapatnév'] += 1
            continue
        if not is_1x2_market(row["fogadas_tipus"]):
            skip_reasons['nem 1x2 piac'] += 1
            continue
        # Bajnokság kinyerés: vessző utáni első szó (pl. "MLS")
        bajnoksag_raw = row["bajnoksag"].split(",", 1)[-1].replace(":", "").replace("oldal", "").strip()
        bajnoksag_short = bajnoksag_raw.split()[0] if bajnoksag_raw else ""
        bajnoksag = normalize_name(bajnoksag_short)
        leagues_found[bajnoksag] += 1
        if not is_valid_league(bajnoksag):
            skip_reasons['rossz bajnokság'] += 1
            continue
        if ALLOWED_LEAGUES and bajnoksag not in ALLOWED_LEAGUES:
            skip_reasons['nem engedélyezett liga'] += 1
            continue
        # Minden oké, mentés
        rows_out.append({
            "forras": row["forras"],
            "bajnoksag": bajnoksag_raw.strip(),
            "kezd": row["kezd"].strip(),
            "home": home,
            "away": away,
            "odds_h": odds[0],
            "odds_d": odds[1],
            "odds_a": odds[2],
            "fogadas_tipus": row["fogadas_tipus"].strip() if row["fogadas_tipus"] else ""
        })

# Duplikált sorok kiszűrése: csak egyedi (home, away, kezd, odds_h, odds_d, odds_a, fogadas_tipus) kombinációk maradjanak
unique_rows = {}
for r in rows_out:
    key = (r["home"], r["away"], r["kezd"], r["odds_h"], r["odds_d"], r["odds_a"], r["fogadas_tipus"])
    if key not in unique_rows:
        unique_rows[key] = r
rows_out = list(unique_rows.values())

with open(OUTPUT_CSV, "w", newline='', encoding='utf-8') as f:
    fieldnames = ["forras", "bajnoksag", "kezd", "home", "away", "odds_h", "odds_d", "odds_a", "fogadas_tipus"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for r in rows_out:
        writer.writerow(r)

# Összefoglaló riport
summary = f"Összes sor: {sum(skip_reasons.values()) + len(rows_out)}\n" \
          f"Mentett meccsek: {len(rows_out)}\n" + \
          "\nSzűrési okok:\n" + "\n".join(f"{k}: {v}" for k, v in skip_reasons.items())
summary += "\n\nElőforduló bajnokságok (rövid név):\n" + "\n".join(f"{k}: {v}" for k, v in leagues_found.items())
print(summary)
logging.info(summary)
print(f"Tovább tisztított, klasszikus 1X2 meccsek: {len(rows_out)} db. Eredmény: {OUTPUT_CSV}\nLog: {LOG_PATH}")
logging.info(f"Tovább tisztított, klasszikus 1X2 meccsek: {len(rows_out)} db. Eredmény: {OUTPUT_CSV}")

def save_to_db(csv_path, db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    # Mindig eldobja a régit, így biztosan naprakész a struktúra
    c.execute("DROP TABLE IF EXISTS matches")
    c.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            forras TEXT,
            bajnoksag TEXT,
            kezd TEXT,
            home TEXT,
            away TEXT,
            odds_h REAL,
            odds_d REAL,
            odds_a REAL,
            fogadas_tipus TEXT
        )
    """)
    c.execute("DELETE FROM matches")  # Frissítéskor töröljük a régit
    with open(csv_path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = [(
            row['forras'], row['bajnoksag'], row['kezd'], row['home'], row['away'],
            float(row['odds_h']) if row['odds_h'] else None,
            float(row['odds_d']) if row['odds_d'] else None,
            float(row['odds_a']) if row['odds_a'] else None,
            row['fogadas_tipus'] if 'fogadas_tipus' in row else ""
        ) for row in reader]
    c.executemany("""
        INSERT INTO matches (forras, bajnoksag, kezd, home, away, odds_h, odds_d, odds_a, fogadas_tipus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    conn.commit()
    conn.close()
    print(f"Adatbázisba mentve: {len(rows)} meccs. DB: {db_path}")
    logging.info(f"Adatbázisba mentve: {len(rows)} meccs. DB: {db_path}")

# Pipeline végén adatbázisba mentés
save_to_db(OUTPUT_CSV, DB_PATH)

def check_duplicates_in_db(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    query = '''
        SELECT home, away, kezd, COUNT(*) as db,
               GROUP_CONCAT(odds_h || '/' || odds_d || '/' || odds_a, '; ') as oddsok,
               GROUP_CONCAT(fogadas_tipus, '; ') as tipusok
        FROM matches
        GROUP BY home, away, kezd
        HAVING db > 1
        ORDER BY db DESC
        LIMIT 10
    '''
    results = c.execute(query).fetchall()
    if results:
        print("\nFIGYELEM: Duplikált meccsek az adatbázisban (azonos home-away-kezd, eltérő odds/típus):")
        for row in results:
            print(f"{row[0]} - {row[1]} @ {row[2]} | db: {row[3]} | oddsok: {row[4]} | tipusok: {row[5]}")
    else:
        print("\nNincs duplikált meccs az adatbázisban (azonos home-away-kezd).")
    conn.close()

# Pipeline végén duplikáció-ellenőrzés
check_duplicates_in_db(DB_PATH)
