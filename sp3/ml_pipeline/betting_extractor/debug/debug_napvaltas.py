#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from datetime import datetime, timedelta

def simulate_extended_logic():
    napok = ["H", "K", "Sze", "Cs", "P", "Szo", "V"]

    # Szimulálunk egy sort: "Péntek (2025. június 27.)"
    print("=== Speciális dátum sor: Péntek (2025. június 27.) ===")
    current_date = datetime(2025, 6, 27)  # péntek
    current_day_short = "P"
    print(f"current_date = {current_date.strftime('%Y-%m-%d %A')}, current_day_short = {current_day_short}")

    scenarios = [
        ("P", "Péntek meccs"),
        ("Szo", "Szombat meccs"),
        ("V", "Vasárnap meccs"),
        ("H", "Hétfő meccs"),
        ("K", "Kedd meccs"),
        ("V", "Újabb vasárnap meccs"),  # Ez itt fog problémát okozni
    ]

    for day_short, desc in scenarios:
        print(f"\n=== {desc}: {day_short} ===")

        if current_day_short != day_short:
            print(f"Napváltás: {current_day_short} -> {day_short}")

            # Napváltás: számoljuk ki az új napot
            days_to_monday = current_date.weekday()
            week_start = current_date - timedelta(days=days_to_monday)

            target_weekday = napok.index(day_short)
            new_date = week_start + timedelta(days=target_weekday)

            print(f"  current_date.weekday() = {current_date.weekday()} (0=hétfő)")
            print(f"  days_to_monday = {days_to_monday}")
            print(f"  week_start = {week_start.strftime('%Y-%m-%d %A')}")
            print(f"  target_weekday = {target_weekday} ({day_short})")
            print(f"  new_date = {new_date.strftime('%Y-%m-%d %A')}")

            # Ha az új dátum korábbi lenne a jelenlegi dátumnál, következő hétre lépünk
            if new_date < current_date:
                print(f"  new_date < current_date -> következő hétre lépünk")
                new_date += timedelta(days=7)
                print(f"  new_date (javított) = {new_date.strftime('%Y-%m-%d %A')}")

            current_date = new_date
            current_day_short = day_short
        else:
            print(f"Nincs napváltás, ugyanaz a nap: {day_short}")

        print(f"EREDMÉNY: current_date = {current_date.strftime('%Y-%m-%d %A')}, current_day_short = {current_day_short}")

if __name__ == "__main__":
    simulate_extended_logic()
