import json
import re
import unicodedata
import sys

def normalize_team_name(name):
    name = name.lower()
    name = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    name = re.sub(r'[^a-z0-9 ]', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name

def extract_base_teams_and_market(team1, team2):
    # This function is designed to handle two main formats of match data
    # and extract normalized team names and a market description.

    # OLD FORMAT: team1 contains both teams and market info, team2 is the market type
    # e.g., team1: "Palmeiras SP - Botafogo RJ 1. félidő", team2: "1X2"
    if ' - ' in team1:
        parts = team1.split(' - ')
        base_team1_str = parts[0].strip()
        remaining_str = ' - '.join(parts[1:]).strip()

        words = remaining_str.split()
        team2_words = []
        market_words = []

        # More robust indicators for where a market name might start
        market_indicators = [
            '1.', '2.', 'félidő', 'gólszám', 'szöglet', 'lapok', 'gól', 'továbbjutás',
            'mindkét', 'első', 'utolsó', 'hendikep', 'pontos', 'eredmény', 'félidő/végeredmény'
        ]

        team_name_ended = False
        for i, word in enumerate(words):
            word_lower = word.lower()

            # Check for market indicators or patterns that signal the end of the team name
            if not team_name_ended:
                # If word is a clear market indicator
                if any(indicator in word_lower for indicator in market_indicators):
                    team_name_ended = True
                # If word is a number or a pattern like "+5.5"
                elif re.match(r'^[\+\-]?\d+(\.\d+)?$', word):
                    team_name_ended = True
                # If word starts with an uppercase letter but is not the first word (potential start of market)
                elif i > 0 and word[0].isupper() and not words[i-1][0].isupper():
                     # Exception for common multi-word team names like "New York"
                    if not (i > 0 and words[i-1].lower() in ['new', 'real', 'la', 'san']):
                         team_name_ended = True

            if team_name_ended:
                market_words.append(word)
            else:
                team2_words.append(word)

        # If the loop finishes and we still haven't split, assume the first word is team2
        if not market_words and team2_words:
            market_words = team2_words[1:]
            team2_words = team2_words[:1]

        base_team1 = normalize_team_name(base_team1_str)
        base_team2 = normalize_team_name(' '.join(team2_words))

        market = ' '.join(market_words).strip()

        # Append the original team2 (e.g., "1X2") to the market if it provides additional info
        if team2 and team2.strip() and team2.strip().lower() not in ['x']:
            market = f"{market} {team2.strip()}".strip()

        if not market:
            market = "Fő piac"

        return base_team1, base_team2, market

    # NEW (EXTENDED) FORMAT: team1 is just the first team, team2 contains the second team and market info
    # e.g., team1: "Palmeiras SP", team2: "Botafogo RJ Ki jut tovább?"
    else:
        base_team1 = normalize_team_name(team1)

        words = team2.split()
        team2_words = []
        market_words = []

        # A comprehensive list of keywords that usually start a market description
        market_indicators = [
            'ki', 'kétesély', 'döntetlennél', 'mindkét', 'hendikep', 'gólszám', 'szögletszám',
            'félidő', 'végeredmény', 'lesz', 'továbbjutás', 'első', 'második', 'az', 'melyik',
            'pontos', 'szöglet', 'lapok', 'büntetőlap', 'játékos', 'speciális', 'lesz-e',
            'mindkét csapat szerez gólt', 'gólok száma', 'csapat', 'összesen'
        ]

        team_name_ended = False
        # Iterate through words to separate team name from market description
        for i, word in enumerate(words):
            word_lower = word.lower()

            if not team_name_ended:
                # Check for numeric patterns, market indicators, or case changes
                if word.rstrip('.').isdigit():
                    team_name_ended = True
                elif any(indicator in word_lower for indicator in market_indicators):
                    team_name_ended = True
                # A new word starting with uppercase might be the market
                elif i > 0 and word[0].isupper() and not words[i-1][0].isupper():
                    if not (i > 0 and words[i-1].lower() in ['new', 'real', 'la', 'san']):
                        team_name_ended = True
                # Limit team name length to avoid grabbing market words
                elif i >= 3 and word_lower not in ['fc', 'ac', 'sc', 'rj', 'sp', 'utd', 'city', 'cf', 'afc', 'bfc', 'united']:
                    team_name_ended = True

            if team_name_ended:
                market_words.append(word)
            else:
                team2_words.append(word)

        # Fallback: if no split, assume first two words are team name (for cases like 'Botafogo RJ')
        if not market_words and len(team2_words) > 1:
            market_words = team2_words[2:]
            team2_words = team2_words[:2]
        elif not market_words and team2_words:
            market_words = team2_words[1:]
            team2_words = team2_words[:1]

        base_team2 = normalize_team_name(' '.join(team2_words))
        market = ' '.join(market_words).strip()

        if not market:
            market = "Fő piac"

        return base_team1, base_team2, market

def main():
    # Paraméterezés: input/output fájl
    if len(sys.argv) >= 3:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    elif len(sys.argv) == 2:
        input_file = sys.argv[1]
        output_file = "./grouped_matches.json"
    else:
        input_file = "./extracted_matches.json"
        output_file = "./grouped_matches.json"
    with open(input_file, encoding="utf-8") as f:
        matches = json.load(f)

    grouped = {}
    for m in matches:
        base_team1, base_team2, market_name = extract_base_teams_and_market(m["team1"], m["team2"])
        key = (m["page"], m["date"], m["day"], m["time"], m["league"].lower(), base_team1, base_team2)
        market = {
            "name": market_name,
            "odds1": m.get("odds1"),
            "oddsX": m.get("oddsX"),
            "odds2": m.get("odds2"),
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
            if not any(mk["name"] == market["name"] and mk["odds1"] == market["odds1"] for mk in grouped[key]["markets"]):
                grouped[key]["markets"].append(market)

    result = list(grouped.values())
    # Add market_count to each match
    for match in result:
        match["market_count"] = len(match["markets"])
    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(result, out, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
