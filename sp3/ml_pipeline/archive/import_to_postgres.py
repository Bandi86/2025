import csv
import psycopg2
from psycopg2.extras import execute_values

# Állítsd be a Postgres elérési adatokat!
PG_CONN = dict(
    host='localhost',
    port=5432,
    dbname='bandiapp',
    user='bandi',
    password='valami123',
)

CSV_PATH = './pdf_pipeline/final/labdarugas_meccsek_final.csv'

def get_or_create(cursor, table, unique_col, value, extra_cols=None):
    cursor.execute(f"SELECT id FROM {table} WHERE {unique_col} = %s", (value,))
    row = cursor.fetchone()
    if row:
        return row[0]
    # Insert
    cols = [unique_col]
    vals = [value]
    if extra_cols:
        for k, v in extra_cols.items():
            cols.append(k)
            vals.append(v)
    cols_str = ','.join(cols)
    ph = ','.join(['%s']*len(vals))
    cursor.execute(f"INSERT INTO {table} ({cols_str}) VALUES ({ph}) RETURNING id", tuple(vals))
    return cursor.fetchone()[0]

def safe_float(val):
    try:
        return float(val) if val not in (None, '', 'NULL') else None
    except Exception:
        return None

def main():
    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()
    inserted_matches = 0
    inserted_odds = 0
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            league = row['bajnoksag'].strip() if row['bajnoksag'] else None
            home = row['home'].strip() if row['home'] else None
            away = row['away'].strip() if row['away'] else None
            kezd = row['kezd'].strip() if row['kezd'] else None
            odds_h = safe_float(row['odds_h'])
            odds_d = safe_float(row['odds_d'])
            odds_a = safe_float(row['odds_a'])
            if not (league and home and away and kezd):
                print(f"SKIP: hiányos sor: {row}")
                continue
            league_id = get_or_create(cur, 'leagues', 'name', league)
            home_id = get_or_create(cur, 'teams', 'name', home)
            away_id = get_or_create(cur, 'teams', 'name', away)
            # Insert match
            cur.execute("""
                INSERT INTO matches (home_team_id, away_team_id, league_id, matchDate, season, status, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                RETURNING id
            """, (
                home_id, away_id, league_id, kezd, '2025', 'SCHEDULED', None
            ))
            match_row = cur.fetchone()
            if match_row:
                match_id = match_row[0]
                inserted_matches += 1
            else:
                cur.execute("SELECT id FROM matches WHERE home_team_id=%s AND away_team_id=%s AND league_id=%s AND matchDate=%s", (home_id, away_id, league_id, kezd))
                match_id = cur.fetchone()[0]
            # Insert odds only if at least two odds are present
            if sum(x is not None for x in [odds_h, odds_d, odds_a]) >= 2:
                cur.execute("""
                    INSERT INTO odds (match_id, bookmaker, homeWinOdds, drawOdds, awayWinOdds, lastUpdated)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                    ON CONFLICT DO NOTHING
                """, (
                    match_id, 'pipeline', odds_h, odds_d, odds_a
                ))
                inserted_odds += 1
            else:
                print(f"SKIP: odds hiányos: {row}")
    conn.commit()
    cur.close()
    conn.close()
    print(f'Import kész! Új meccsek: {inserted_matches}, odds beszúrás: {inserted_odds}')

if __name__ == '__main__':
    main()
