#!/usr/bin/env python3
"""
Egyszerű teszt script az adatfeldolgozás mintázatainak tesztelésére
"""

import re

def test_patterns():
    """Mintázatok tesztelése valós PDF sorokkal"""

    # Mintázatok definiálása (javított verzió)
    patterns = {
        'p_k_format': re.compile(r'^([PK])\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)'),
        'day_format': re.compile(r'^([A-Z]\w*)\s+(\d{2}:\d{2})\s+(\d+)\s+(.+?)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)\s+(\d+[,.]?\d*)'),
        'betting_line': re.compile(r'^\s*(\d+)\s+(.+?)\s+(\d+[,.]?\d*)(?:\s+(\d+[,.]?\d*))?(?:\s+(\d+[,.]?\d*))?\s*$'),  # Opcionális 2. és 3. odds
        'teams': re.compile(r'^(.+?)\s*-\s*(.+?)$')
    }

    # Tesztadatok - tipikus PDF sorok
    test_lines = [
        "H 23:30      27529            CDT Real Oruro - Jorge Wilstermann                                                                                                           1,58 3,55 4,25",
        "V 23:15      27067           Aurora Cochabamba - Always Ready La Paz                                                                                           2,57 3,60 2,07",
        "P 20:00      12345            Barcelona - Real Madrid                                                                                                        1,85 3,20 4,10",
        "K 18:30      54321            Liverpool - Manchester City                                                                                                    2,10 3,40 3,20",
        "      27529  1X2 első félidő                                                                                     2,25 1,95 4,80",
        "      27529  Összesen gól 2,5 felett/alatt                                                                       1,75 2,05",
        "      27529  Szöglet szám 8,5 felett/alatt                                                                       1,90 1,85",
        "Kedd 19:45    67890           PSG - Bayern München                                                                                                          1,95 3,15 3,85"
    ]

    print("🔍 Mintázat tesztelés PDF sorokkal")
    print("=" * 60)

    main_matches = []
    current_match_id = None

    for i, line in enumerate(test_lines):
        print(f"\n📄 Sor {i+1}: {line}")

        # P/K formátum tesztelése
        match = patterns['p_k_format'].match(line)
        if match:
            format_type, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
            print(f"  ✅ P/K formátum:")
            print(f"     Típus: {format_type}, Idő: {time_info}, ID: {match_id}")
            print(f"     Csapatok: {teams_text}")
            print(f"     Odds: {odds1}, {odds2}, {odds3}")

            main_matches.append({
                'match_id': match_id,
                'teams': teams_text,
                'betting_options': [f"1X2: {odds1}, {odds2}, {odds3}"]
            })
            current_match_id = match_id
            continue

        # Nap formátum tesztelése
        match = patterns['day_format'].match(line)
        if match:
            day_info, time_info, match_id, teams_text, odds1, odds2, odds3 = match.groups()
            print(f"  ✅ Nap formátum:")
            print(f"     Nap: {day_info}, Idő: {time_info}, ID: {match_id}")
            print(f"     Csapatok: {teams_text}")
            print(f"     Odds: {odds1}, {odds2}, {odds3}")

            main_matches.append({
                'match_id': match_id,
                'teams': teams_text,
                'betting_options': [f"1X2: {odds1}, {odds2}, {odds3}"]
            })
            current_match_id = match_id
            continue

        # További fogadási opciók tesztelése
        match = patterns['betting_line'].match(line)
        if match:
            bet_match_id = match.group(1)
            description = match.group(2)
            odds1 = match.group(3)
            odds2 = match.group(4) if match.group(4) else ""
            odds3 = match.group(5) if match.group(5) else ""

            print(f"  ✅ Fogadási opció:")
            print(f"     Match ID: {bet_match_id}, Leírás: {description}")
            print(f"     Odds: {odds1}, {odds2}, {odds3}")

            # Kapcsoljuk a megfelelő meccshez a match ID alapján
            print(f"     🔍 Keresés: bet_match_id={bet_match_id}")
            found_match = False
            for main_match in main_matches:
                if main_match['match_id'] == bet_match_id:
                    odds_text = f"{odds1}"
                    if odds2: odds_text += f", {odds2}"
                    if odds3: odds_text += f", {odds3}"
                    main_match['betting_options'].append(f"{description}: {odds_text}")
                    print(f"     🔗 Hozzáadva a {bet_match_id} meccshez!")
                    found_match = True
                    break

            if not found_match:
                print(f"     ❌ Nem találtam meccset ezzel az ID-vel: {bet_match_id}")
            continue

        print("  ❌ Nincs egyezés egyetlen mintázattal sem")

    print("\n\n🏆 Feldolgozott meccsek összegzése:")
    print("=" * 60)

    for i, match in enumerate(main_matches):
        print(f"\n⚽ Meccs {i+1}:")
        print(f"   ID: {match['match_id']}")
        print(f"   Csapatok: {match['teams']}")
        print(f"   Fogadási opciók ({len(match['betting_options'])}):")
        for j, bet_option in enumerate(match['betting_options']):
            print(f"     {j+1}. {bet_option}")

    print(f"\n📊 Összesen: {len(main_matches)} meccs")

if __name__ == "__main__":
    test_patterns()
