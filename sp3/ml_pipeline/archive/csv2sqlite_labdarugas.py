import csv
import sqlite3
import os

CSV_PATH = "./pdf_output/labdarugas_meccsek_tisztitott.csv"
DB_PATH = "./pdf_output/labdarugas_meccsek.db"

# Töröljük a régi adatbázist, ha van
if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Fő táblák: match (egyedi meccs), event (fogadási esemény)
c.execute('''
CREATE TABLE match (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bajnoksag TEXT,
    kezd TEXT,
    home TEXT,
    away TEXT
)
''')
c.execute('''
CREATE TABLE event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER,
    odds_h REAL,
    odds_d REAL,
    odds_a REAL,
    fogadas_tipus TEXT,
    forras TEXT,
    FOREIGN KEY(match_id) REFERENCES match(id)
)
''')

# Meccs-azonosítás: bajnokság, kezd, home, away
match_index = {}
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        key = (row['bajnoksag'], row['kezd'], row['home'], row['away'])
        if key not in match_index:
            c.execute('INSERT INTO match (bajnoksag, kezd, home, away) VALUES (?, ?, ?, ?)', key)
            match_id = c.lastrowid
            match_index[key] = match_id
        else:
            match_id = match_index[key]
        c.execute('''
            INSERT INTO event (match_id, odds_h, odds_d, odds_a, fogadas_tipus, forras)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            match_id,
            row['odds_h'] if row['odds_h'] else None,
            row['odds_d'] if row['odds_d'] else None,
            row['odds_a'] if row['odds_a'] else None,
            row['fogadas_tipus'],
            row['forras']
        ))

conn.commit()
print(f"Adatbázis elkészült: {DB_PATH}")
print(f"Meccsek száma: {len(match_index)}")
conn.close()
