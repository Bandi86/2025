#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python
import re
import json
import sys
from datetime import datetime, timedelta
import unicodedata
from pathlib import Path

def normalize_team(name):
    name = name.lower().strip()
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
    # Egységesítő mapping (bővíthető)
    mapping = {
        "pors": "pors grenland",
        "pors grenland": "pors grenland",
        "sanfrecce": "sanfrecce hiroshima",
        "sanfrecce hiroshima": "sanfrecce hiroshima",
        "bk": "bk olympic",
        "bk olympic": "bk olympic",
        "independiente de": "independiente de mendoza",
        "independiente de mendoza": "independiente de mendoza",
        "norvegia caroline": "norvegia",
        "los": "los angeles",
        "los angeles": "los angeles",
        # Ide bővítsd a többit is, ha kell
    }
    # Csak a legelső szót nézzük, ha nincs teljes egyezés
    if name in mapping:
        return mapping[name]
    # Ha a név első szava egyezik egy mapping-gel, azt is normalizáljuk
    first = name.split()[0]
    if first in mapping:
        return mapping[first]
    return name

def get_hun_day(date_str):
    months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
    m = re.match(r"(\d{4})\.\s*(\w+)\s*(\d{1,2})\.", date_str)
    if not m:
        return ""
    y, mon, d = int(m.group(1)), m.group(2), int(m.group(3))
    try:
        month_idx = months.index(mon) + 1
        dt = datetime(y, month_idx, d)
        days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
        return days[dt.weekday()]
    except Exception:
        return ""

def iso_date(date_str):
    m = re.match(r"(\d{4})\.\s*(\w+)\s*(\d{1,2})\.", date_str)
    months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
    if not m:
        return ""
    y, mon, d = int(m.group(1)), m.group(2), int(m.group(3))
    try:
        month_idx = months.index(mon) + 1
        return f"{y:04d}-{month_idx:02d}-{d:02d}"
    except Exception:
        return ""

def normalize_time(t):
    return t.strip().zfill(5)  # pl. '9:5' -> '09:05', '21:15' -> '21:15'

def parse_line(line):
    m = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d+\s*(.+?) - (.+)$", line)
    if not m:
        return None
    day = m.group(1)
    time = m.group(2)
    team1 = m.group(3).strip()
    rest_part = m.group(4).strip()

    # Piacnév minták regexp listája (bővíthető)
    market_patterns = [
        r"(1X2|1x2|Kétesély|Döntetlennél|Mindkét csapat|Gólszám|Félidő|Eredmény|Handicap|Pontos|Első|Utolsó|Totál|Szögletszám|Lapszám|Félidő/végeredmény|1\\. félidő|2\\. félidő|Mindkét félidő|Hazai csapat|Vendégcsapat|Büntetőlap-szám|Szöglet|Az első|Melyik csapat|Lesz|A továbbjutás|Melyik félidő|Hendikep|Ki nyeri a döntőt\\?|Ki jut tovább\\?|kezdőként szerez gólt\\?)",
        r"(\d+X\d+|\d+x\d+|\d+\\. félidő|\d+\\. gól|\d+\\. perc|\d+\\. szöglet|\d+\\. lap)",
        r"(\\(.*?\\))",  # zárójelezett piacok
    ]

    odds_patterns = [
        r"(\d{1,2},\d{2}\s+\d{1,2},\d{2}\s+\d{1,2},\d{2})$",  # 3 odds
        r"(\d{1,2},\d{2}\s+\d{1,2},\d{2})$",                   # 2 odds
        r"(\d{1,2},\d{2})$",                                    # 1 odds
        r"(\d{2})\s+(\d{1,2},\d{2}(?:\s+\d{1,2},\d{2})*)$"    # kód + odds(ok)
    ]

    odds_match = None
    has_code = False
    player = None

    for i, pattern in enumerate(odds_patterns):
        odds_match = re.search(pattern, rest_part)
        if odds_match:
            has_code = (i == 3)
            break

    if odds_match:
        odds_start = odds_match.start()
        before_odds = rest_part[:odds_start].strip()

        # Speciális: játékos kezdőként szerez gólt? piac
        if re.search(r"kezdőként szerez gólt\\?", before_odds, re.IGNORECASE):
            # [csapat] [játékosnév] kezdőként szerez gólt?
            # Pl.: 'olaszorszag Martina Piemonte kezdőként szerez gólt?'
            m_player = re.match(r"^([\w .ÁÉÍÓÖŐÚÜŰáéíóöőúüű-]+?) ([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+(?: [A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)*) kezdőként szerez gólt\\?$", before_odds)
            if m_player:
                team2 = m_player.group(1).strip()
                player = m_player.group(2).strip()
                market_name = "kezdőként szerez gólt?"
            else:
                # fallback: próbáljuk legalább a csapatot külön venni
                parts = before_odds.split(" ")
                team2 = parts[0].strip()
                player = " ".join(parts[1:-3]).strip() if len(parts) > 3 else ""
                market_name = "kezdőként szerez gólt?"
        else:
            # Piacnév felismerése regexp-pel
            market_name = "Fő piac"
            team2 = before_odds
            for pat in market_patterns:
                mkt = re.search(pat, before_odds, re.IGNORECASE)
                if mkt:
                    idx = mkt.start()
                    team2 = before_odds[:idx].strip()
                    market_name = before_odds[idx:].strip()
                    break
            # Ha a piacnév üres vagy túl rövid, visszaállítjuk "Fő piac"-ra
            if not market_name or len(market_name) < 3:
                market_name = "Fő piac"
            if not team2:
                team2 = before_odds.strip()
        # Odds feldolgozás
        if has_code:
            code = odds_match.group(1)
            odds_text = odds_match.group(2)
            odds = re.findall(r"(\d{1,2},\d{2})", odds_text)
        else:
            odds_text = odds_match.group(1)
            odds = re.findall(r"(\d{1,2},\d{2})", odds_text)
            code = None
        odds = [o.replace(",", ".") for o in odds]
        market_text = odds_match.group(0)
    else:
        # Nincs odds
        team2 = rest_part
        odds = []
        market_name = "Fő piac"
        market_text = ""
        player = None

    # A parse_line végén, mielőtt visszatérünk:
    # team2 tisztítása minden piacnévtől, sorszámtól, extra szövegtől
    # Szigorúbb team2 tisztítás: csak az első nagybetűvel kezdődő szavakig engedjük, utána minden mást levágunk
    # Pl. "Chelsea Ki jut tovább?" → "Chelsea"
    team2_clean = re.match(r"^([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüűA-ZÁÉÍÓÖŐÚÜŰ0-9 .'-]+)", team2)
    if team2_clean:
        team2 = team2_clean.group(1).strip()
    else:
        team2 = team2.strip()
    # Végső team2 tisztítás: csak az első nagybetűvel kezdődő szavak sorozata maradjon
    # Pl. "Chelsea ki jut tovabb?" -> "Chelsea", "Chelsea 1." -> "Chelsea"
    # De ne vágja szét normál csapatneveket mint "Sp. Trinidense"
    team2_clean = re.split(r' (ki jut tov[aáb]+|félidő|gólszám|\d+\.|kezdőként|\(|\)|\?|:|vs\.|ellen)', team2, flags=re.IGNORECASE)[0].strip()
    team2 = team2_clean
    return day, time, team1, team2, market_name, odds, market_text, player

def clean_league_name(name):
    return name.replace("", "").strip()

def build_date_lookup(txt_path):
    """Előre beolvassa az összes speciális dátumot és a soraikkal együtt eltárolja."""
    date_lookup = {}
    with open(txt_path, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            original_line = line.strip()
            # Időbélyeg eltávolítása
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', original_line)
            # Speciális nap+dátum sor felismerése
            m_day_date = re.match(r"(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap)\s*\((\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.\)", line)
            if m_day_date:
                day_name, y, mon, d = m_day_date.groups()
                y, d = int(y), int(d)
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                date_obj = datetime(y, month_idx, d)
                day_name_to_short = {"Hétfő": "H", "Kedd": "K", "Szerda": "Sze", "Csütörtök": "Cs", "Péntek": "P", "Szombat": "Szo", "Vasárnap": "V"}
                day_short = day_name_to_short[day_name]
                date_lookup[line_num] = (date_obj, day_short)
                print(f"Speciális dátum betöltve sor {line_num}: {day_name} ({date_obj.strftime('%Y-%m-%d')}) = {day_short}")
    return date_lookup

def find_applicable_date(line_num, date_lookup):
    """Megkeresi a legközelebbi speciális dátumot az adott sorhoz."""
    # Visszafelé keres a legközelebbi speciális dátumot
    for lookup_line_num in sorted(date_lookup.keys(), reverse=True):
        if lookup_line_num <= line_num:
            return date_lookup[lookup_line_num]
    return None, None

# --- ÚJ: összefoglaló sorok feldolgozása ---
def build_summary_lookup(txt_path):
    lookup = {}
    # Liga helyén tetszőleges szavak (.+?)
    summary_pattern = re.compile(r"(?:\d+\.)?\s*([\w .ÁÉÍÓÖŐÚÜŰáéíóöőúüű-]+) - ([\w .ÁÉÍÓÖŐÚÜŰáéíóöőúüű-]+) (.+?) (\d{4}\.\s*\w+\s*\d{1,2}\.) (\d{2}:\d{2})")
    with open(txt_path, encoding="utf-8") as f:
        for line in f:
            m = summary_pattern.search(line)
            if m:
                t1 = normalize_team(m.group(1))
                t2 = normalize_team(m.group(2))
                league = clean_league_name(m.group(3).strip())
                date = m.group(4).strip()
                time = normalize_time(m.group(5).strip())
                key = (t1, t2, league, time)
                lookup[key] = date
    return lookup

def main(input_file, output_file):
    print(f"Processing {input_file}...")
    matches = []
    current_date = ""
    current_league = None
    current_page = None
    match_map = {}

    # --- ÚJ: dátum lookup betöltése ---
    date_lookup = build_date_lookup(input_file)
    print(f"Talált speciális dátumok: {len(date_lookup)}")

    # --- ÚJ: összefoglaló lookup betöltése ---
    summary_lookup = build_summary_lookup(input_file)

    league_stats = {}
    total_matches = 0
    total_markets = 0
    current_day = ""
    nap_map = {}  # nap rövidítés és teljes napnév → dátum
    napok = ["H", "K", "Sze", "Cs", "P", "Szo", "V"]
    napnev_map = {"H": "Hétfő", "K": "Kedd", "Sze": "Szerda", "Cs": "Csütörtök", "P": "Péntek", "Szo": "Szombat", "V": "Vasárnap"}
    current_date = None
    current_day_short = None

    with open(input_file, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)

            # Oldal sor felismerése pl. "=== OLDAL 9 ==="
            m_page = re.match(r"=== OLDAL (\d+) ===", line)
            if m_page:
                current_page = int(m_page.group(1))
                continue

            # Liga sor felismerése pl. "Labdarúgás, Norvég 3., 1. csoport : 12. oldal"
            # vagy "Labdarúgás, Paraguayi bajnokság" (kettőspont nélkül)
            # Csak labdarúgás meccseket dolgozunk fel!
            m_league = re.match(r"Labdarúgás,\s*(.+?)(?:\s*:|$)", line)
            if m_league:
                current_league = m_league.group(1).strip()
                continue

            # Ha nem labdarúgás sport, reseteljük a ligát
            if re.search(r"(Kosárlabda|Amerikai foci|Jégkorong|Tenisz|Futsal|Kézilabda|Röplabda|Baseball|Motorsport|Rögbi),", line):
                current_league = None
                continue

            # Dátum sor felismerése pl. "2025. július 4." vagy "02:001: 2025. július 1."
            # FIGYELEM: Csak akkor használjuk ha még nincs current_date beállítva!
            m_date = re.match(r"(?:\d{2}:\d{3,4}:\s*)?(\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.", line)
            if m_date and current_date is None:
                y, mon, d = int(m_date.group(1)), m_date.group(2), int(m_date.group(3))
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                current_date = datetime(y, month_idx, d)
                current_day_short = None  # Fontos: nullázzuk a napot, hogy újra lehessen kezdeni
                print(f"Sima dátum sor felismerve (első alkalommal): {y}-{month_idx:02d}-{d:02d}, current_day_short=None")
                continue

            # Speciális nap+dátum sor felismerése pl. "Hétfő (2025. június 30.)"
            # PRIORITÁS: Ez mindig felülírja a current_date-t, függetlenül attól, hogy volt-e már beállítva
            m_day_date = re.match(r"(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap)\s*\((\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.\)", line)
            if m_day_date:
                day_name, y, mon, d = m_day_date.groups()
                y, d = int(y), int(d)
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                current_date = datetime(y, month_idx, d)

                # A napnév alapján beállítjuk a current_day_short értéket is
                day_name_to_short = {"Hétfő": "H", "Kedd": "K", "Szerda": "Sze", "Csütörtök": "Cs", "Péntek": "P", "Szombat": "Szo", "Vasárnap": "V"}
                current_day_short = day_name_to_short[day_name]

                print(f"Speciális dátum sor felismerve: {day_name} ({y}-{month_idx:02d}-{d:02d}), current_day_short={current_day_short} - DÁTUM RESET!")
                continue

            # Napváltó sor felismerése (pl. "P 01:30 ...")
            # DE: Csak akkor használjuk ha már van érvényes current_date speciális dátumsorból!
            # MEGJEGYZÉS: A napváltás kezelését lentebb tesszük, a parsed eredmény alapján
            parsed = parse_line(line)
            if parsed and current_page and current_league:
                day, time, team1, team2, market_name, odds, orig_market, player = parsed

                t1n = normalize_team(team1)
                t2n = normalize_team(team2)
                league_clean = clean_league_name(current_league)
                time_norm = normalize_time(time)

                # ÚJ: Ellenőrizzük, hogy van-e közeli speciális dátum
                lookup_date, lookup_day_short = find_applicable_date(line_num, date_lookup)
                if lookup_date:
                    print(f"Sor {line_num}: Közeli speciális dátum találva: {lookup_date.strftime('%Y-%m-%d')} ({lookup_day_short})")
                    match_date = lookup_date
                    # Napváltás kezelése a speciális dátumtól
                    if lookup_day_short != day:
                        # Számoljuk ki a napok közötti különbséget
                        days_map = {"H": 0, "K": 1, "Sze": 2, "Cs": 3, "P": 4, "Szo": 5, "V": 6}
                        if day in days_map and lookup_day_short in days_map:
                            diff = days_map[day] - days_map[lookup_day_short]
                            if diff < 0:
                                diff += 7  # Következő hét
                            match_date = lookup_date + timedelta(days=diff)
                            print(f"  Napváltás: {lookup_day_short} -> {day} = +{diff} nap -> {match_date.strftime('%Y-%m-%d')}")
                        else:
                            match_date = lookup_date
                    else:
                        match_date = lookup_date
                elif current_date:
                    # Fallback: korábbi logika
                    match_date = current_date
                    # Napváltás ellenőrzése és dátum frissítése
                    if current_day_short is None:
                        current_day_short = day
                    elif current_day_short != day:
                        # Napváltás: egyszerűen léptetjük a dátumot a következő napra
                        current_date = current_date + timedelta(days=1)
                        current_day_short = day
                        print(f"Napváltás: {day} -> {current_date.strftime('%Y-%m-%d')}")
                    match_date = current_date
                else:
                    # Nincs dátum info, kihagyjuk
                    continue

                date_iso = match_date.strftime("%Y-%m-%d")
                # A day mezőt mindig a korrekt dátum alapján generáljuk
                days = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
                day_full = days[match_date.weekday()]

                # Kulcsképzés: minden mezőt normalizálunk
                key = (date_iso, time_norm, league_clean, t1n, t2n)

                if key not in match_map:
                    match_map[key] = {
                        "page": current_page,
                        "date": date_iso,
                        "day": day_full,
                        "time": time_norm,
                        "league": league_clean,
                        "team1": t1n,
                        "team2": t2n,
                        "orig_team1": team1,
                        "orig_team2": team2,
                        "markets": []
                    }
                    if league_clean not in league_stats:
                        league_stats[league_clean] = {"matches": 0, "markets": 0}
                    league_stats[league_clean]["matches"] += 1

                market = {"name": market_name, "orig_market": orig_market}
                if player:
                    market["player"] = player

                # --- Fő piac odds validáció és speciális eset kezelése ---
                if market_name.lower() in ["fő piac", "1x2", "1x2"]:
                    if len(odds) == 3:
                        try:
                            odds_floats = [float(o) for o in odds]
                        except Exception:
                            print(f"[WARN] Nem konvertálható odds: {odds} ({orig_market})")
                            continue
                        if all(1.01 <= o <= 100.0 for o in odds_floats):
                            market["odds1"] = odds[0]
                            market["oddsX"] = odds[1]
                            market["odds2"] = odds[2]
                        else:
                            print(f"[WARN] Irreális odds érték(ek) Fő piacnál: {odds} ({orig_market})")
                            continue
                    elif len(odds) == 2:
                        # Speciális eset: csak X és 2 van, 1 nincs (pl. nagyon esélytelen hazai)
                        try:
                            odds_floats = [float(o) for o in odds]
                        except Exception:
                            print(f"[WARN] Nem konvertálható odds: {odds} ({orig_market})")
                            continue
                        if all(1.01 <= o <= 100.0 for o in odds_floats):
                            market["oddsX"] = odds[0]
                            market["odds2"] = odds[1]
                        else:
                            print(f"[WARN] Irreális odds érték(ek) Fő piacnál (2 odds): {odds} ({orig_market})")
                            continue
                    else:
                        print(f"[WARN] Hibás odds szám Fő piacnál: {odds} ({orig_market})")
                        continue
                else:
                    if len(odds) == 3:
                        market["odds1"] = odds[0]
                        market["oddsX"] = odds[1]
                        market["odds2"] = odds[2]
                    elif len(odds) == 2:
                        market["odds1"] = odds[0]
                        market["odds2"] = odds[1]
                    elif len(odds) == 1:
                        market["odds1"] = odds[0]

                if market not in match_map[key]["markets"]:
                    match_map[key]["markets"].append(market)
                    league_stats[league_clean]["markets"] += 1
                    total_markets += 1

    # --- Kimeneti fájl generálása ---
    output_data = {
        "matches": list(match_map.values()),
        "summary_lookup": summary_lookup,
        "league_stats": league_stats,
        "total_matches": len(match_map),
        "total_markets": total_markets,
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)

    print(f"Feldolgozott meccsek: {len(match_map)}, Összes piac: {total_markets}")
    print(f"Bajnokságok száma: {len(league_stats)}")
    print("Bajnokságok részletei:")
    for league, stats in sorted(league_stats.items()):
        print(f"  - {league}: {stats['matches']} meccs, {stats['markets']} piac")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python extract_matches.py <input_txt> <output_json>")
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
