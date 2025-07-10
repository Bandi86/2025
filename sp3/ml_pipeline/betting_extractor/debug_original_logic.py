#!/usr/bin/env python3

import re
from datetime import datetime, timedelta

def debug_original_logic(txt_file):
    """Debug the original date lookup logic"""

    print(f"=== DEBUGGING ORIGINAL DATE LOOKUP LOGIC ===")

    # Replicate the original build_date_lookup function
    date_lookup = {}
    with open(txt_file, encoding="utf-8") as f:
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

    print(f"\nDate lookup built: {len(date_lookup)} entries")

    # Replicate the find_applicable_date function
    def find_applicable_date(line_num, date_lookup):
        """Megkeresi a legközelebbi speciális dátumot az adott sorhoz."""
        # Visszafelé keres a legközelebbi speciális dátumot
        for lookup_line_num in sorted(date_lookup.keys(), reverse=True):
            if lookup_line_num <= line_num:
                return date_lookup[lookup_line_num]
        return None, None

    # Now simulate the main processing logic
    print(f"\n=== SIMULATING MAIN PROCESSING ===")

    current_date = None
    current_day_short = None
    current_league = None

    matches_processed = 0
    days_map = {"H": 0, "K": 1, "Sze": 2, "Cs": 3, "P": 4, "Szo": 5, "V": 6}

    with open(txt_file, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            if matches_processed >= 10:
                break

            original_line = line.strip()
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', original_line)

            # Liga sor felismerése
            m_league = re.match(r"Labdarúgás,\s*(.+?)(?:\s*:|$)", line)
            if m_league:
                current_league = m_league.group(1).strip()
                print(f"Line {line_num}: Liga found: {current_league}")
                continue

            # Dátum sor felismerése (sima dátum)
            m_date = re.match(r"(?:\d{2}:\d{3,4}:\s*)?(\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.", line)
            if m_date and current_date is None:
                y, mon, d = int(m_date.group(1)), m_date.group(2), int(m_date.group(3))
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                current_date = datetime(y, month_idx, d)
                current_day_short = None
                print(f"Line {line_num}: Sima dátum sor felismerve (első alkalommal): {y}-{month_idx:02d}-{d:02d}, current_day_short=None")
                continue

            # Speciális nap+dátum sor felismerése
            m_day_date = re.match(r"(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap)\s*\((\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.\)", line)
            if m_day_date:
                day_name, y, mon, d = m_day_date.groups()
                y, d = int(y), int(d)
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                current_date = datetime(y, month_idx, d)
                day_name_to_short = {"Hétfő": "H", "Kedd": "K", "Szerda": "Sze", "Csütörtök": "Cs", "Péntek": "P", "Szombat": "Szo", "Vasárnap": "V"}
                current_day_short = day_name_to_short[day_name]
                print(f"Line {line_num}: Speciális dátum sor felismerve: {day_name} ({y}-{month_idx:02d}-{d:02d}), current_day_short={current_day_short} - DÁTUM RESET!")
                continue

            # Match line processing
            m_match = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d+\s*(.+?) - (.+)$", line)
            if m_match and current_league:
                day, time, team1, team2 = m_match.groups()

                # Original logic: check for applicable date from lookup
                lookup_date, lookup_day_short = find_applicable_date(line_num, date_lookup)
                if lookup_date:
                    print(f"Line {line_num}: Közeli speciális dátum találva: {lookup_date.strftime('%Y-%m-%d')} ({lookup_day_short})")
                    match_date = lookup_date
                    # Napváltás kezelése a speciális dátumtól
                    if lookup_day_short != day:
                        # Számoljuk ki a napok közötti különbséget
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

                print(f"Line {line_num}: MATCH: {day} {time} {team1} - {team2[:30]}... -> {match_date.strftime('%Y-%m-%d')}")
                matches_processed += 1

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        debug_original_logic(sys.argv[1])
    else:
        debug_original_logic("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/txts/Web__49sz__P__06-20_lines.txt")
