import re
from datetime import datetime, timedelta

# Mini debug szkript
input_file = 'txts/Web__52sz__K__07-01_lines.txt'

current_page = None
current_league = None
current_date = None
current_day_short = None

with open(input_file, encoding="utf-8") as f:
    for i, line in enumerate(f):
        if i < 105:  # Ugorjuk az első 105 sort
            continue
        if i > 125:  # Csak 105-125-ig
            break

        original_line = line.strip()
        line = line.strip()
        line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)

        print(f"Line {i+1}: {original_line}")
        print(f"  After strip: {line}")

        # Oldal sor
        m_page = re.match(r"=== OLDAL (\d+) ===", line)
        if m_page:
            current_page = int(m_page.group(1))
            print(f"  -> PAGE: {current_page}")
            continue

        # Dátum sor
        m_date = re.match(r"(?:\d{2}:\d{3,4}:\s*)?(\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.", line)
        if m_date:
            y, mon, d = int(m_date.group(1)), m_date.group(2), int(m_date.group(3))
            months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
            month_idx = months.index(mon) + 1
            current_date = datetime(y, month_idx, d)
            current_day_short = None
            print(f"  -> DATE: {current_date}")
            continue

        # Liga sor
        m_league = re.match(r"Labdarúgás,\s*(.+?)\s*:", line)
        if m_league:
            current_league = m_league.group(1).strip()
            print(f"  -> LEAGUE: {current_league}")
            continue

        # Meccssor
        m = re.match(r"^(P|Szo|Vas|H|K|Sz|Cs|Sze|Pén|Sza|V) (\d{2}:\d{2})\s*\d+\s*(.+?) - (.+)$", line)
        if m:
            day, time, team1, rest = m.groups()
            print(f"  -> MATCH: {day} {time} {team1} vs {rest[:20]}...")
            print(f"  -> CONDITIONS: page={current_page}, league={current_league}, date={current_date}")
            if current_page and current_league and current_date:
                print(f"  -> MATCH WOULD BE PROCESSED!")
            else:
                print(f"  -> MATCH SKIPPED!")

        print()

print(f"\nFinal state:")
print(f"Page: {current_page}")
print(f"League: {current_league}")
print(f"Date: {current_date}")
print(f"Day short: {current_day_short}")
