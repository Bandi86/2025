import re
import json
import sys

def parse_tippmix_ocr(ocr_content):
    matches = []
    current_date = None
    current_match = None # To associate subsequent odds lines
    lines = ocr_content.split('\n')

    date_patterns = {
        "Péntek": "2025. június 27.",
        "Szombat": "2025. június 28.",
        "Vasárnap": "2025. június 29.",
        "Hétfő": "2025. június 30.",
        "Kedd": "2025. július 1."
    }

    # Regex for a main match line with 1X2 odds
    # Captures: (DayPrefix) (Time) (Sorszam) (EventDesc) (H_Odds) (D_Odds) (A_Odds)
    match_line_pattern = re.compile(
        r'^(P|Szo|V|H)\s+(\d{2}:\d{2})\s+(\d{5,})\s+'  # Day, Time, Sorszám
        r'(.+?)\s+'                                   # Event description (non-greedy)
        r'(\d{1,2},\d{2})\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})' # Basic 1X2 odds (H D V)
    )

    # Regex for Kétesély (Double Chance) odds
    # Captures: (1X_Odds) (12_Odds) (X2_Odds)
    double_chance_pattern = re.compile(
        r'Kétesély\s+\(H:\s*(\d{1,2},\d{2}),\s*D:\s*(\d{1,2},\d{2}),\s*V:\s*(\d{1,2},\d{2})\)'
    )

    # Regex for Gólszám (Over/Under) odds, specifically for 2.5
    # Captures: (Under_Odds) (Over_Odds)
    goals_2_5_pattern = re.compile(
        r'Gólszám\s+2,5\s+\(H:\s*kev\.,\s*V:\s*több\)\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})'
    )

    # Regex for Mindkét csapat szerez gólt (Both Teams to Score - BTTS) odds
    # Captures: (Yes_Odds) (No_Odds)
    btts_pattern = re.compile(
        r'Mindkét\s+csapat\s+szerez\s+gólt\s+\(H:\s*Igen,\s*V:\s*Nem\)\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})'
    )

    for line in lines:
        line = line.strip()
        if not line: # Skip empty lines
            continue

        # 1. Detect date sections
        date_found = False
        for day_keyword, full_date in date_patterns.items():
            if day_keyword in line and "2025" in line:
                current_date = full_date
                date_found = True
                break
        if date_found:
            continue # Move to next line after finding a date header

        if not current_date:
            continue # Skip lines until a date is identified

        # 2. Try to parse main match lines (which also contain 1X2 odds)
        match_header = match_line_pattern.match(line)
        if match_header:
            day_prefix, time, sorszam, event_desc, h_odds, d_odds, a_odds = match_header.groups()

            # Clean up event description
            event_desc = re.sub(r':\d{1,2}\.\s*oldal$', '', event_desc).strip()
            event_desc = re.sub(r'Labdarúgás,\s*', '', event_desc).strip()

            teams = event_desc.split(' - ')
            home_team = teams[0].strip() if len(teams) > 0 else ""
            away_team = teams[1].strip() if len(teams) > 1 else ""

            current_match = {
                "date": current_date,
                "time": time,
                "sorszam": sorszam,
                "home_team": home_team,
                "away_team": away_team,
                "markets": {
                    "1X2": {
                        "home_win": float(h_odds.replace(',', '.')),
                        "draw": float(d_odds.replace(',', '.')),
                        "away_win": float(a_odds.replace(',', '.'))
                    }
                },
                "raw_line": line
            }
            matches.append(current_match)
            continue # Move to next line

        # 3. Try to parse other market lines and associate with the current_match
        if current_match:
            dc_match = double_chance_pattern.search(line)
            if dc_match:
                dc_1x, dc_12, dc_x2 = [float(o.replace(',', '.')) for o in dc_match.groups()]
                current_match["markets"]["Kétesély"] = {
                    "1X": dc_1x,
                    "12": dc_12,
                    "X2": dc_x2
                }
                continue

            goals_2_5_match = goals_2_5_pattern.search(line)
            if goals_2_5_match:
                under_2_5, over_2_5 = [float(o.replace(',', '.')) for o in goals_2_5_match.groups()]
                current_match["markets"]["Gólszám 2.5"] = {
                    "under": under_2_5,
                    "over": over_2_5
                }
                continue

            btts_match = btts_pattern.search(line)
            if btts_match:
                btts_yes, btts_no = [float(o.replace(',', '.')) for o in btts_match.groups()]
                current_match["markets"]["Mindkét csapat szerez gólt"] = {
                    "yes": btts_yes,
                    "no": btts_no
                }
                continue

    return matches

if __name__ == "__main__":
    try:
        # Read OCR content from stdin or a file
        if len(sys.argv) > 1:
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                ocr_content = f.read()
        else:
            # If no file argument, read from stdin (e.g., for piping output)
            ocr_content = sys.stdin.read()
        
        # Remove the OCR start/end markers if present
        ocr_content = re.sub(r'==Start of OCR for page \d+==', '', ocr_content)
        ocr_content = re.sub(r'==End of OCR for page \d+==', '', ocr_content)

        parsed_data = parse_tippmix_ocr(ocr_content)
        print(json.dumps(parsed_data, indent=2, ensure_ascii=False))

    except FileNotFoundError:
        print("Error: Input file not found. Please provide the path to tippmix_ocr.txt or pipe content.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)
        sys.exit(1)