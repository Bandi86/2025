#!/usr/bin/env python3
"""
PDF elemzés a már kinyert szövegből
"""

import re
from pathlib import Path

def analyze_extracted_text():
    """Elemezzük a már kinyert szöveget"""

    text_file = Path("/tmp/test_output.txt")

    if not text_file.exists():
        print("❌ Nincs kinyert szöveg fájl")
        return

    print(f"📄 Szöveg elemzés: {text_file.name}")

    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"✅ Szöveg betöltve: {len(text)} karakter")

    lines = text.split('\n')
    print(f"📝 Sorok száma: {len(lines)}")

    # Futball keresés
    print("\n🔍 FUTBALL MECCSEK KERESÉSE:")
    football_lines = []

    # Keresési minták
    football_keywords = ['premier', 'liga', 'arsenal', 'chelsea', 'liverpool', 'manchester', 'barcelona', 'real madrid']

    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in football_keywords):
            # Ellenőrizzük, hogy van-e benne valami meccs-szerű
            if '-' in line or re.search(r'\d+[.,]\d{2,3}', line):
                football_lines.append((i, line.strip()))

    print(f"📊 Futball kapcsolatos sorok: {len(football_lines)}")

    # Első 20 sor megjelenítése
    for line_num, line in football_lines[:20]:
        print(f"  {line_num:4d}: {line}")

    # Szorzó minták részletes keresése
    print("\n🎲 SZORZÓ MINTÁK KERESÉSE:")
    odds_patterns = [
        r'\b(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\b',
        r'(\d+[.,]\d{2,3})\s*[-–—]\s*(\d+[.,]\d{2,3})\s*[-–—]\s*(\d+[.,]\d{2,3})',
    ]

    odds_matches = []
    for i, line in enumerate(lines):
        for pattern in odds_patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                odds_matches.append((i, line.strip(), match.groups()))

    print(f"📊 Szorzó minták: {len(odds_matches)}")

    for line_num, line, odds in odds_matches[:15]:
        print(f"  {line_num:4d}: {line}")
        print(f"        Szorzók: {odds}")

    # Meccs minták keresése
    print("\n⚽ MECCS MINTÁK KERESÉSE:")
    match_patterns = [
        r'(\w+(?:\s+\w+)*)\s+[-–—]\s+(\w+(?:\s+\w+)*)',  # Csapat1 - Csapat2
        r'(\w{1,3})\s+(\d{1,2}:\d{2})\s+(\d{4,6})\s+(.+?)\s+[-–—]\s+(.+)',  # Nap Idő Szám Csapat1 - Csapat2
    ]

    match_lines = []
    for i, line in enumerate(lines):
        for pattern in match_patterns:
            matches = re.finditer(pattern, line)
            for match in matches:
                # Szűrjük a túl rövideket
                groups = match.groups()
                if len(groups) >= 2:
                    team1 = groups[-2].strip() if len(groups) > 2 else groups[0].strip()
                    team2 = groups[-1].strip() if len(groups) > 1 else groups[1].strip()

                    # Minimum hossz ellenőrzés
                    if len(team1) >= 3 and len(team2) >= 3 and len(team1) < 30 and len(team2) < 30:
                        match_lines.append((i, line.strip(), team1, team2))

    print(f"📊 Meccs minták: {len(match_lines)}")

    for line_num, line, team1, team2 in match_lines[:15]:
        print(f"  {line_num:4d}: {team1} vs {team2}")
        print(f"        {line}")

    # Liga információk keresése
    print("\n🏆 LIGA INFORMÁCIÓK:")
    league_patterns = [
        r'Premier Liga', r'angol.*bajnokság', r'La Liga', r'spanyol.*bajnokság',
        r'Serie A', r'olasz.*bajnokság', r'Bundesliga', r'német.*bajnokság',
        r'Champions League', r'Bajnokok Liga', r'NB I', r'magyar.*bajnokság'
    ]

    league_mentions = []
    for i, line in enumerate(lines):
        for pattern in league_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                league_mentions.append((i, line.strip(), pattern))

    print(f"📊 Liga említések: {len(league_mentions)}")

    for line_num, line, pattern in league_mentions[:10]:
        print(f"  {line_num:4d}: {pattern} -> {line}")

if __name__ == "__main__":
    analyze_extracted_text()
