import json
import re
import unicodedata

def normalize_team_name(name):
    # Kisbetű, ékezetmentes, csak betűk/számok/szóköz
    name = name.lower()
    name = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    name = re.sub(r'[^a-z0-9 ]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def extract_base_teams_and_market(team1, team2):
    # Pl. "Palmeiras SP - Botafogo RJ Kétesély ..." -> "palmeiras sp", "botafogo rj", "Kétesély ..."
    if ' - ' in team1:
        parts = team1.split(' - ', 1)
        base_team1 = normalize_team_name(parts[0])
        rest = parts[1].strip()
        rest_split = rest.split()
        # Csapat2: az első 1 vagy 2 szó (ha a második is nagybetűvel vagy számmal kezdődik)
        base_team2 = rest_split[0]
        if len(rest_split) > 1 and (rest_split[1][0].isupper() or rest_split[1][0].isdigit()):
            base_team2 += ' ' + rest_split[1]
            market = ' '.join(rest_split[2:]).strip()
        else:
            market = ' '.join(rest_split[1:]).strip()
        base_team2 = normalize_team_name(base_team2)
        if not market:
            market = "Fő piac"
        return base_team1, base_team2, market
    # Ha nincs kötőjel, fallback
    return normalize_team_name(team1), normalize_team_name(team2), "Fő piac"

def main():
    input_file = "/tmp/all_matches.json"
    output_file = "/tmp/all_matches_grouped.json"
    with open(input_file, encoding="utf-8") as f:
        matches = json.load(f)

    grouped = {}
    for m in matches:
        base_team1, base_team2, market_name = extract_base_teams_and_market(m["team1"], m["team2"])
        key = (m["page"], m["date"], m["day"], m["time"], m["league"].lower(), base_team1, base_team2)
        market = {
            "name": market_name,
            "odds1": m["odds1"],
            "oddsX": m["oddsX"],
            "odds2": m["odds2"],
            "orig_team1": m["team1"],
            "orig_team2": m["team2"],
            "orig_market": market_name if market_name != "Fő piac" else ""
        }
        if key not in grouped:
            grouped[key] = {
                "page": m["page"],
                "date": m["date"],
                "day": m["day"],
                "time": m["time"],
                "league": m["league"],
                "team1": base_team1,
                "team2": base_team2,
                "orig_team1": m["team1"],
                "orig_team2": m["team2"],
                "markets": [market]
            }
        else:
            # Duplikált piacok kiszűrése
            if not any(mk["name"] == market["name"] and mk["odds1"] == market["odds1"] for mk in grouped[key]["markets"]):
                grouped[key]["markets"].append(market)

    result = list(grouped.values())
    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(result, out, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
