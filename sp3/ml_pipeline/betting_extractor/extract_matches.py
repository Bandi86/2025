import re
import json
import sys
from datetime import datetime
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

def parse_line(line):
    m = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d*\s*(.+?) - (.+)$", line)
    if not m:
        return None
    day = m.group(1)
    time = m.group(2)
    team1 = m.group(3).strip()
    rest_part = m.group(4).strip()

    # Különböző odds formátumok felismerése:
    # 1. Hagyományos 3 odds: "1,23 2,45 3,67"
    # 2. Kétesély 2 odds: "1,23 2,45"
    # 3. Kóddal: "01 1,23" vagy "02 1,23 2,45"

    odds_patterns = [
        r"(\d{1,2},\d{2}\s+\d{1,2},\d{2}\s+\d{1,2},\d{2})$",  # 3 odds
        r"(\d{1,2},\d{2}\s+\d{1,2},\d{2})$",                   # 2 odds
        r"(\d{1,2},\d{2})$",                                    # 1 odds
        r"(\d{2})\s+(\d{1,2},\d{2}(?:\s+\d{1,2},\d{2})*)$"    # kód + odds(ok)
    ]

    odds_match = None
    has_code = False

    for i, pattern in enumerate(odds_patterns):
        odds_match = re.search(pattern, rest_part)
        if odds_match:
            has_code = (i == 3)  # Az utolsó pattern tartalmaz kódot
            break

    if odds_match:
        # Van odds találat
        odds_start = odds_match.start()
        before_odds = rest_part[:odds_start].strip()

        if has_code:
            # Kód + odds formátum
            code = odds_match.group(1)
            odds_text = odds_match.group(2)
            odds = re.findall(r"(\d{1,2},\d{2})", odds_text)
        else:
            # Hagyományos odds formátum
            odds_text = odds_match.group(1)
            odds = re.findall(r"(\d{1,2},\d{2})", odds_text)
            code = None

        odds = [o.replace(",", ".") for o in odds]

        # Most kell elválasztani a team2-t és a market nevet
        # Gyakori market kezdetek
        market_starters = [
            "1X2 +", "Ki jut tovább?", "Kétesély", "Döntetlennél", "Mindkét csapat",
            "Gólszám", "Félidő", "Eredmény", "Handicap", "Pontos",
            "Első", "Utolsó", "Totál", "Szögletszám", "Lapszám", "Félidő/végeredmény",
            "1. félidő", "2. félidő", "Mindkét félidő", "Hazai csapat", "Vendégcsapat",
            "Büntetőlap-szám", "Szöglet", "Az első", "Melyik csapat", "Lesz",
            "A továbbjutás", "Melyik félidő", "Hendikep", "Ki nyeri a döntőt?"
        ]

        # Speciális minták felismerése (pl. játékosnevek)
        player_patterns = [
            r"([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű\s]+?)\s+(kezdőként szerez gólt\?.*)",
            r"([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű\s]+?)\s+(kapott.*lap.*)",
            r"([A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű\s]+?)\s+(melyik.*)"
        ]

        team2 = before_odds
        market_name = "Fő piac"

        # 1. Először nézzük meg a speciális mintákat (játékosnevek)
        pattern_found = False

        # Keresés a "kezdőként szerez gólt?" mintára
        goal_pattern = r"kezdőként szerez gólt\?"
        goal_match = re.search(goal_pattern, before_odds)
        if goal_match:
            # Megtaláltuk a "kezdőként szerez gólt?" részt
            goal_start = goal_match.start()
            before_goal = before_odds[:goal_start].strip()
            after_goal = before_odds[goal_start:].strip()

            # A before_goal utolsó szava(i) a játékosnév
            words = before_goal.split()
            if len(words) >= 3:  # Legalább "Team2 Keresztnév Vezetéknév"
                # Feltételezzük hogy az utolsó 2 szó a játékosnév
                team2_words = words[:-2]
                player_words = words[-2:]

                if team2_words:
                    team2 = " ".join(team2_words)
                    player_name = " ".join(player_words)
                    market_name = f"{player_name} {after_goal}"
                    pattern_found = True

        # Keresés egyéb játékosnév mintákra (pl. "Caroline" egyedül)
        if not pattern_found:
            words = before_odds.split()
            if len(words) >= 2:
                # Ha az utolsó szó nagybetűvel kezdődik és nem gyakori market szó
                last_word = words[-1]
                if (last_word[0].isupper() and
                    last_word not in ["Hendikep", "Gólszám", "Kétesély", "Döntetlennél", "X2)", "Nem)", "Igen)"] and
                    len(last_word) > 2 and
                    not last_word.endswith(")") and  # Nem zárójelre végződik
                    last_word.isalpha()):  # Csak betűket tartalmaz
                    # Valószínűleg játékosnév
                    team2_words = words[:-1]
                    player_name = last_word

                    if team2_words:
                        team2 = " ".join(team2_words)
                        market_name = f"{player_name} kezdőként szerez gólt? (H: Igen)"
                        pattern_found = True

        # 2. Ha nincs speciális minta, használjuk a hagyományos market_starters listát
        if not pattern_found:
            earliest_pos = len(before_odds)
            found_market = ""

            for starter in market_starters:
                pos = before_odds.find(starter)
                if pos != -1 and pos < earliest_pos:
                    earliest_pos = pos
                    found_market = starter

            if earliest_pos < len(before_odds):
                # Találtunk market kezdetet
                team2 = before_odds[:earliest_pos].strip()
                market_name = before_odds[earliest_pos:].strip()

                # Ha van kód, azt hozzáadjuk
                if has_code and code:
                    market_name += f" {code}"
            else:
                # Nincs ismert market kezdet, az egész before_odds a team2
                team2 = before_odds
                market_name = "Fő piac"
                if has_code and code:
                    market_name += f" {code}"

        # --- ÚJ: ha team2 végén van toldás, azt levágjuk ---
        # Pl. "norvegia caroline" -> "norvegia"
        team2_words = team2.split()
        if len(team2_words) > 1:
            # Ha az utolsó szó nagybetűs vagy ismert kereszt-/vezetéknév, levágjuk
            last = team2_words[-1]
            if last[0].isupper() or last in ["caroline", "hiroshima", "grenland", "olympic", "mendoza"]:
                team2 = " ".join(team2_words[:-1])

        market_text = odds_match.group(0)

    else:
        # Nincs odds
        team2 = rest_part
        odds = []
        market_name = "Fő piac"
        market_text = ""

    return day, time, team1, team2, market_name, odds, market_text

def main(input_file, output_file):
    matches = []
    current_date = ""
    current_league = None
    current_page = None
    match_map = {}

    # Összefoglaló adatok gyűjtése
    league_stats = {}
    total_matches = 0
    total_markets = 0

    with open(input_file, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)

            m_page = re.match(r"=== OLDAL (\d+) ===", line)
            if m_page:
                current_page = int(m_page.group(1))
                continue

            m_date = re.match(r"(\d{4})\.\s*\w+\s*\d{1,2}\.", line)
            if m_date:
                current_date = line.strip()
                continue

            # Szigorú sportág szűrés: csak a Labdarúgás, sorok után jöhetnek események
            if line.startswith("Labdarúgás,"):
                league = line.split(",", 1)[1].split(":")[0].strip()
                current_league = league
                continue
            elif (re.match(r"^[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+,", line) and not line.startswith("Labdarúgás,")) or ("bajnokság" in line.lower() or "rájátszás" in line.lower()):
                current_league = None
                continue

            if not current_league:
                continue

            parsed = parse_line(line)
            if parsed and current_page and current_league:
                day, time, team1, team2, market_name, odds, orig_market = parsed

                # Kulcs: csak az alap meccs adatok (team1, team2 normalizálva)
                key = (iso_date(current_date), time, current_league, normalize_team(team1), normalize_team(team2))

                if key not in match_map:
                    match_map[key] = {
                        "page": current_page,
                        "date": iso_date(current_date),
                        "day": get_hun_day(current_date),
                        "time": time,
                        "league": current_league,
                        "team1": normalize_team(team1),
                        "team2": normalize_team(team2),
                        "orig_team1": team1,
                        "orig_team2": team2,
                        "markets": []
                    }
                    # Statisztika számolás
                    if current_league not in league_stats:
                        league_stats[current_league] = {"matches": 0, "markets": 0}
                    league_stats[current_league]["matches"] += 1

                # Market hozzáadása
                market = {"name": market_name, "orig_market": orig_market}
                if len(odds) == 3:
                    market["odds1"] = odds[0]
                    market["oddsX"] = odds[1]
                    market["odds2"] = odds[2]
                elif len(odds) == 2:
                    market["odds1"] = odds[0]
                    market["odds2"] = odds[1]
                elif len(odds) == 1:
                    market["odds1"] = odds[0]

                # Duplikáció elkerülése
                if market not in match_map[key]["markets"]:
                    match_map[key]["markets"].append(market)
                    league_stats[current_league]["markets"] += 1
                    total_markets += 1

    # Végső feldolgozás
    for match in match_map.values():
        match["market_count"] = len(match["markets"])
        matches.append(match)
        total_matches += 1

    # Összefoglaló elkészítése
    summary = {
        "total_matches": total_matches,
        "total_markets": total_markets,
        "leagues": league_stats,
        "leagues_count": len(league_stats)
    }

    # JSON kimenet összefoglalóval
    output = {
        "summary": summary,
        "matches": matches
    }

    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(output, out, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # Script könyvtárának meghatározása
    script_dir = Path(__file__).parent
    txts_dir = script_dir / "txts"
    jsons_dir = script_dir / "jsons"

    # Mappák létrehozása ha nem léteznek
    jsons_dir.mkdir(exist_ok=True)

    force_reprocess = "--force" in sys.argv

    if len(sys.argv) >= 3 and not force_reprocess:
        # Manuális fájl megadás esetén
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    elif len(sys.argv) >= 3 and force_reprocess:
        # Force flag kezelése
        non_force_args = [arg for arg in sys.argv[1:] if arg != "--force"]
        if len(non_force_args) >= 2:
            input_file = non_force_args[0]
            output_file = non_force_args[1]
        else:
            input_file = non_force_args[0] if non_force_args else None
            output_file = None
    elif len(sys.argv) == 2 and sys.argv[1] != "--force":
        # Csak input fájl megadása esetén
        input_file = sys.argv[1]
        input_path = Path(input_file)
        output_file = jsons_dir / f"{input_path.stem}.json"
    else:
        # Automatikus mód: legújabb txt fájl keresése a txts mappában
        if not txts_dir.exists():
            print(f"HIBA: {txts_dir} mappa nem található!")
            print("Először futtasd a pdf_to_lines.py scriptet!")
            sys.exit(1)

        txt_files = list(txts_dir.glob("*.txt"))
        if not txt_files:
            print(f"HIBA: Nincs txt fájl a {txts_dir} mappában!")
            print("Először futtasd a pdf_to_lines.py scriptet!")
            sys.exit(1)

        # Legújabb fájl kiválasztása (módosítás dátuma alapján)
        latest_txt = max(txt_files, key=lambda x: x.stat().st_mtime)
        input_file = str(latest_txt)
        output_file = jsons_dir / f"{latest_txt.stem}.json"

        print(f"Automatikus mód: legújabb txt fájl feldolgozása")
        print(f"Input: {input_file}")

    # Ellenőrizzük hogy már létezik-e a JSON fájl
    if output_file and Path(output_file).exists() and not force_reprocess:
        txt_mtime = Path(input_file).stat().st_mtime
        json_mtime = Path(output_file).stat().st_mtime

        if json_mtime >= txt_mtime:
            print(f"⏩ JSON fájl már létezik és frissebb mint a TXT: {output_file}")
            print(f"✅ Feldolgozás kihagyva (használd --force a újrafeldolgozáshoz)")
            sys.exit(0)
        else:
            print(f"🔄 TXT újabb mint a JSON fájl, újrafeldolgozás...")

    print(f"Output: {output_file}")
    main(str(input_file), str(output_file))
