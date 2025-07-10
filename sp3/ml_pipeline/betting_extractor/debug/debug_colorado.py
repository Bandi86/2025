#!/usr/bin/env python3
import re
from datetime import datetime, timedelta

# Keressük meg a Colorado Rapids meccset és nézzük meg a napváltást
def debug_colorado():
    input_file = "txts/Web__52sz__K__07-01_lines.txt"
    current_date = None
    current_day_short = None
    current_page = None

    napok_sorrend = ["H", "K", "Sze", "Cs", "P", "Szo", "V"]

    with open(input_file, encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            line = re.sub(r'^\d{2}:\d{3,4}:\s*', '', line)

            # Oldal sor felismerése
            m_page = re.match(r"=== OLDAL (\d+) ===", line)
            if m_page:
                current_page = int(m_page.group(1))
                print(f"Line {line_num}: Oldal {current_page}")
                continue

            # Dátum sor felismerése
            m_date = re.match(r"(?:\d{2}:\d{3,4}:\s*)?(\d{4})\.\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)\s*(\d{1,2})\.", line)
            if m_date:
                y, mon, d = int(m_date.group(1)), m_date.group(2), int(m_date.group(3))
                months = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]
                month_idx = months.index(mon) + 1
                current_date = datetime(y, month_idx, d)
                current_day_short = None
                print(f"Line {line_num}: Dátum beállítva: {current_date.strftime('%Y-%m-%d %A')}")
                continue

            # Napváltó sor felismerése
            m_match = re.match(r"^(H|K|Sze|Cs|P|Szo|V) (\d{2}:\d{2})", line)
            if m_match and current_date is not None and current_page == 19:
                day_short = m_match.group(1)

                print(f"Line {line_num}: Nap sor találva: {day_short} {m_match.group(2)}")

                # Ha még nincs nap beállítva, az alapdátumból számoljuk ki az aktuális hét elejét
                if current_day_short is None:
                    old_date = current_date
                    current_day_short = day_short
                    # Az alapdátum hétfőjének megkeresése
                    days_to_monday = current_date.weekday()  # 0=hétfő, 6=vasárnap
                    week_start = current_date - timedelta(days=days_to_monday)

                    # A kért nap kiszámítása az aktuális héten belül
                    target_weekday = napok_sorrend.index(day_short)
                    current_date = week_start + timedelta(days=target_weekday)
                    print(f"  Első nap: hét eleje {week_start.strftime('%Y-%m-%d')} + {target_weekday} nap = {current_date.strftime('%Y-%m-%d %A')}")

                elif current_day_short != day_short:
                    old_date = current_date
                    old_day = current_day_short
                    # Napváltás: az aktuális hét közepén maradunk
                    days_to_monday = current_date.weekday()
                    week_start = current_date - timedelta(days=days_to_monday)

                    target_weekday = napok_sorrend.index(day_short)
                    new_date = week_start + timedelta(days=target_weekday)

                    print(f"  Napváltás: {old_day} → {day_short}, hét eleje {week_start.strftime('%Y-%m-%d')} + {target_weekday} nap = {new_date.strftime('%Y-%m-%d %A')}")

                    current_date = new_date
                    current_day_short = day_short

            # Colorado Rapids keresése
            if "Colorado Rapids" in line and current_page == 19:
                print(f"Line {line_num}: Colorado Rapids meccs találva!")
                print(f"  Aktuális dátum: {current_date.strftime('%Y-%m-%d %A') if current_date else 'None'}")
                print(f"  Aktuális nap: {current_day_short}")
                print(f"  Sor: {line}")
                break

if __name__ == "__main__":
    debug_colorado()
