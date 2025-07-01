import re
import json
import sys
from datetime import datetime
import unicodedata

def normalize_team(name):
    name = name.lower().strip()
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
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
    m = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d*\s*(.+?) - (.+?)(?: (.+))?$", line)
    if not m:
        return None
    day = m.group(1)
    time = m.group(2)
    team1 = m.group(3).strip()
    rest = m.group(4).strip()
    after_team2 = m.group(5) or ""
    
    # Először keressük meg az oddsokat a sor végén
    odds_match = re.search(r"(\d{1,2},\d{2}(?:\s+\d{1,2},\d{2})*)$", rest)
    if odds_match:
        # A team2 az odds előtti rész
        team2 = rest[:odds_match.start()].strip()
        # A market_text az odds utáni rész + after_team2
        market_text = rest[odds_match.start():].strip() + (" " + after_team2 if after_team2 else "")
    else:
        # Ha nincs odds a rest-ben, akkor a teljes rest a team2
        team2 = rest.strip()
        market_text = after_team2.strip()
    
    # Odds kinyerése
    odds = re.findall(r"(\d{1,2},\d{2})", market_text)
    odds = [o.replace(",", ".") for o in odds]
    
    # Market név: az odds nélküli rész
    market_name = re.sub(r"(\d{1,2},\d{2}\s*)+", "", market_text).strip()
    if not market_name:
        market_name = "Fő piac"
    
    return day, time, team1, team2, market_name, odds, market_text

def main():
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
    if len(sys.argv) >= 3:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    elif len(sys.argv) == 2:
        input_file = sys.argv[1]
        output_file = "./extracted_matches.json"
    else:
        input_file = "/tmp/pdf_lines.txt"
        output_file = "./extracted_matches.json"
    main()
