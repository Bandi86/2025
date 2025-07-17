#!/usr/bin/env python3

import re
from datetime import datetime, timedelta

def debug_date_extraction(txt_file):
    """Debug the date extraction logic to understand where July 7-10 dates come from"""

    print(f"=== DEBUGGING DATE EXTRACTION FROM {txt_file} ===")

    # Track all date-related lines
    publication_dates = []
    special_dates = []
    simple_dates = []
    match_lines = []

    with open(txt_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            original_line = line.strip()
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', original_line)

            # Publication date (line 2 usually)
            if re.match(r'^\d{4}\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*\d{1,2}\.$', line):
                publication_dates.append((line_num, line))
                print(f"Line {line_num}: Publication date found: {line}")

            # Special date pattern: "Péntek (2025. június 20.)"
            m_special = re.match(r'(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap)\s*\((\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.\)', line)
            if m_special:
                special_dates.append((line_num, line, m_special.groups()))
                print(f"Line {line_num}: Special date found: {line}")

            # Simple date pattern: "2025. július 1."
            m_simple = re.match(r'(\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.$', line)
            if m_simple:
                simple_dates.append((line_num, line, m_simple.groups()))
                print(f"Line {line_num}: Simple date found: {line}")

            # Match lines with day codes
            m_match = re.match(r'^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d+\s*(.+?) - (.+)$', line)
            if m_match:
                match_lines.append((line_num, line, m_match.groups()))
                if len(match_lines) <= 10:  # Only show first 10 matches
                    print(f"Line {line_num}: Match found: {m_match.group(1)} {m_match.group(2)} {m_match.group(3)} - {m_match.group(4)}")

    print(f"\n=== SUMMARY ===")
    print(f"Publication dates found: {len(publication_dates)}")
    print(f"Special dates found: {len(special_dates)}")
    print(f"Simple dates found: {len(simple_dates)}")
    print(f"Match lines found: {len(match_lines)}")

    print(f"\n=== SPECIAL DATES DETAIL ===")
    for line_num, line, groups in special_dates:
        day_name, year, month, day = groups
        print(f"Line {line_num}: {day_name} -> {year}-{month}-{day}")

    # Now simulate the extraction logic
    print(f"\n=== SIMULATING EXTRACTION LOGIC ===")

    current_date = None
    current_day_short = None

    # Day name mapping
    day_name_to_short = {"Hétfő": "H", "Kedd": "K", "Szerda": "Sze", "Csütörtök": "Cs", "Péntek": "P", "Szombat": "Szo", "Vasárnap": "V"}
    days_map = {"H": 0, "K": 1, "Sze": 2, "Cs": 3, "P": 4, "Szo": 5, "V": 6}
    months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]

    # Process special dates first
    for line_num, line, groups in special_dates:
        day_name, year, month, day = groups
        year, day = int(year), int(day)
        month_idx = months.index(month) + 1
        date_obj = datetime(year, month_idx, day)
        day_short = day_name_to_short[day_name]

        print(f"Special date: {day_name} ({date_obj.strftime('%Y-%m-%d')}) = {day_short}")

        # This would be the base date for subsequent matches
        if current_date is None:
            current_date = date_obj
            current_day_short = day_short
            print(f"  -> Set as base date: {current_date.strftime('%Y-%m-%d')}, day_short: {current_day_short}")

    # Now process a few match lines to see the day switching logic
    print(f"\n=== PROCESSING MATCH LINES ===")
    processed_matches = 0

    for line_num, line, groups in match_lines:
        if processed_matches >= 10:  # Only process first 10 matches
            break

        day, time, team1, team2 = groups

        if current_date is None:
            print(f"Line {line_num}: No base date available, skipping match")
            continue

        # Day switching logic from the original code
        if current_day_short != day:
            # Calculate day difference
            if day in days_map and current_day_short in days_map:
                diff = days_map[day] - days_map[current_day_short]
                if diff < 0:
                    diff += 7  # Next week
                new_date = current_date + timedelta(days=diff)
                print(f"Line {line_num}: Day switch: {current_day_short} -> {day} = +{diff} days -> {new_date.strftime('%Y-%m-%d')}")
                current_date = new_date
                current_day_short = day
            else:
                print(f"Line {line_num}: Unknown day code: {day}")

        print(f"Line {line_num}: {day} {time} {team1} - {team2[:30]}... -> {current_date.strftime('%Y-%m-%d')}")
        processed_matches += 1

if __name__ == "__main__":
    # Debug the file that shows July 7-10 dates
    debug_date_extraction("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/txts/Web__49sz__P__06-20_lines.txt")
