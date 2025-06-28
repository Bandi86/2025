#!/usr/bin/env python3
"""
Javított PDF feldolgozó a valódi formátum alapján
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

class ImprovedPdfProcessor:
    """Javított PDF feldolgozó a tényleges formátum alapján"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Liga felismerési minták
        self.league_patterns = {
            'Premier Liga': [
                r'Premier Liga', r'angol.*bajnokság', r'angol.*liga',
                r'Arsenal|Chelsea|Liverpool|Manchester|Tottenham|City|United|Everton|Leicester|Brighton|Crystal Palace|Leeds|Aston Villa|Nottingham|Fulham|Wolves|Newcastle|West Ham|Bournemouth|Southampton'
            ],
            'La Liga': [
                r'spanyol.*bajnokság', r'spanyol.*liga', r'La Liga',
                r'Real Madrid|Barcelona|Atletico|Valencia|Sevilla|Real Sociedad|Athletic|Villarreal|Celta|Getafe|Betis'
            ],
            'Serie A': [
                r'olasz.*bajnokság', r'olasz.*liga', r'Serie A', r'Olasz A',
                r'Juventus|Milan|Inter|Napoli|Roma|Lazio|Atalanta|Fiorentina|Bologna|Torino|Salernitana|Sassuolo|Spezia|Lecce'
            ],
            'Bundesliga': [
                r'német.*bajnokság', r'német.*liga', r'Bundesliga',
                r'Bayern|Dortmund|Leipzig|Leverkusen|Frankfurt|Wolfsburg|Gladbach|Union Berlin'
            ],
            'Champions League': [
                r'Bajnokok Liga|Champions League|BL|európa kupa',
                r'Barcelona|Real Madrid|Bayern|PSG|Milan|Juventus|Liverpool|Manchester|Chelsea'
            ],
            'NB I': [
                r'magyar.*bajnokság', r'NB I', r'OTP Bank Liga',
                r'Ferencváros|FTC|Fradi|Újpest|MTK|Honvéd|Vasas|Debrecen|DVSC|Paks|Vidi|Fehérvár|Kisvárda|ZTE'
            ],
            'Kupa': [
                r'kupa|cup|copa|FA Kupa|Olasz Kupa|Copa del Rey'
            ]
        }

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése pdftotext segítségével"""

        # Teszteléshez használjuk az előre kinyert fájlt
        test_file = Path("/tmp/test_output.txt")
        if test_file.exists():
            print(f"      Előre kinyert fájl használata: {test_file.name}")
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    text = f.read()
                print(f"      ✅ Szöveg betöltve: {len(text)} karakter")
                return text
            except Exception as e:
                print(f"      ❌ Fájl betöltési hiba: {e}")

        try:
            print(f"      pdftotext futtatása: {pdf_path.name}")
            result = subprocess.run([
                'pdftotext', '-layout', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                print(f"      ✅ Szöveg kinyerve: {len(result.stdout)} karakter")
                return result.stdout
            else:
                print(f"⚠️ pdftotext hiba: {result.stderr}")
                return None

        except subprocess.TimeoutExpired:
            print("⚠️ pdftotext timeout (60s)")
            return None
        except Exception as e:
            print(f"⚠️ pdftotext egyéb hiba: {e}")
            return None

    def detect_league_from_context(self, context_lines: List[str], home_team: str, away_team: str) -> str:
        """Liga felismerése kontextus és csapatnevek alapján"""

        # Keressük a legközelebbi liga információt a kontextusban
        for line in reversed(context_lines):
            line_lower = line.lower()

            for league_name, patterns in self.league_patterns.items():
                for pattern in patterns:
                    if re.search(pattern.lower(), line_lower):
                        return league_name

        # Ha nem találunk kontextusban, csapatnevek alapján
        full_teams = f"{home_team} {away_team}".lower()

        for league_name, patterns in self.league_patterns.items():
            for pattern in patterns:
                if re.search(pattern.lower(), full_teams):
                    return league_name

        return 'Ismeretlen Liga'

    def parse_szerencsemix_match_line(self, line: str, context_lines: List[str]) -> Optional[Dict]:
        """Szerencsemix specifikus meccs sor feldolgozása"""

        # A valódi Szerencsemix formátum:
        # Nap idő [szóközök] sorszám [szóközök] csapat1 - csapat2 [sok szóköz] szorzó1 szorzó2 szorzó3

        # Fő minta: K 20:45      06251            Arsenal - Newcastle                                                  1,80    4,00    4,50
        match_pattern = r'^(\w{1,3})\s+(\d{1,2}:\d{2})\s+(\d{4,6})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,3})\s*$'

        match = re.search(match_pattern, line.strip())
        if match:
            try:
                day, time_str, match_id, home_team, away_team, odds_str = match.groups()

                # Csapatnevek tisztítása (sok szóköz eltávolítása)
                home_team = re.sub(r'\s+', ' ', home_team.strip())
                away_team = re.sub(r'\s+', ' ', away_team.strip())

                # Szorzók feldolgozása
                odds_numbers = re.findall(r'\d+[.,]\d{2,3}', odds_str)
                if len(odds_numbers) >= 3:
                    odds_1 = float(odds_numbers[0].replace(',', '.'))
                    odds_x = float(odds_numbers[1].replace(',', '.'))
                    odds_2 = float(odds_numbers[2].replace(',', '.'))

                    # Szorzók érvényességének ellenőrzése
                    if not all(1.01 <= odds <= 50 for odds in [odds_1, odds_x, odds_2]):
                        return None
                else:
                    return None

                # Liga felismerése
                league = self.detect_league_from_context(context_lines, home_team, away_team)

                return {
                    'home_team': home_team,
                    'away_team': away_team,
                    'time': time_str,
                    'day': day,
                    'league': league,
                    'odds': {
                        '1': odds_1,
                        'X': odds_x,
                        '2': odds_2
                    },
                    'match_id': match_id,
                    'confidence': 0.9,
                    'source_line': line.strip()
                }

            except (ValueError, AttributeError, IndexError):
                return None

        # Alternatív minták (ha az első nem működik)
        # Csak szorzók egyszerű mintája: csapat1 - csapat2 szorzó1 szorzó2 szorzó3
        simple_pattern = r'(\w+(?:\s+\w+)*)\s+[-–—]\s+(\w+(?:\s+\w+)*)\s+((?:\d+[.,]\d{2,3}\s*){2,3})\s*$'
        match = re.search(simple_pattern, line.strip())
        if match:
            try:
                home_team, away_team, odds_str = match.groups()

                # Csapatnevek tisztítása
                home_team = re.sub(r'\s+', ' ', home_team.strip())
                away_team = re.sub(r'\s+', ' ', away_team.strip())

                # Túl hosszú nevek kiszűrése
                if len(home_team) > 30 or len(away_team) > 30 or len(home_team) < 3 or len(away_team) < 3:
                    return None

                # Szorzók feldolgozása
                odds_numbers = re.findall(r'\d+[.,]\d{2,3}', odds_str)
                if len(odds_numbers) >= 3:
                    odds_1 = float(odds_numbers[0].replace(',', '.'))
                    odds_x = float(odds_numbers[1].replace(',', '.'))
                    odds_2 = float(odds_numbers[2].replace(',', '.'))

                    if not all(1.01 <= odds <= 50 for odds in [odds_1, odds_x, odds_2]):
                        return None
                else:
                    return None

                # Liga felismerése
                league = self.detect_league_from_context(context_lines, home_team, away_team)

                # Idő és nap keresése a kontextusban
                time_str = self.extract_time_from_context(context_lines)
                day = self.extract_day_from_context(context_lines)

                return {
                    'home_team': home_team,
                    'away_team': away_team,
                    'time': time_str,
                    'day': day,
                    'league': league,
                    'odds': {
                        '1': odds_1,
                        'X': odds_x,
                        '2': odds_2
                    },
                    'match_id': f"AUTO_{abs(hash(line)) % 99999}",
                    'confidence': 0.6,
                    'source_line': line.strip()
                }

            except (ValueError, AttributeError, IndexError):
                return None

        return None

    def extract_day_from_context(self, context_lines: List[str]) -> Optional[str]:
        """Nap kinyerése kontextusból"""
        day_pattern = r'\b(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap|H|K|Sze|Cs|P|Szo|V)\b'

        # Először az aktuális sorban
        for line in context_lines:
            match = re.search(day_pattern, line)
            if match:
                return match.group(1)

        return None

    def extract_time_from_context(self, context_lines: List[str]) -> str:
        """Időpont kinyerése kontextusból"""
        time_pattern = r'\b(\d{1,2}:\d{2})\b'

        for line in context_lines:
            match = re.search(time_pattern, line)
            if match:
                return match.group(1)

        return '00:00'

    def parse_matches_from_text(self, text: str, pdf_date: str) -> Dict:
        """Meccs adatok felismerése szövegből javított logikával"""

        if not text:
            return {'future_matches': [], 'historical_matches': []}

        future_matches = []
        historical_matches = []

        lines = text.split('\n')
        print(f"   🔍 Feldolgozandó sorok: {len(lines)}")

        context_window = 5
        processed_lines = 0
        found_matches = 0

        for i, line in enumerate(lines):
            processed_lines += 1

            # Haladás kijelzése
            if processed_lines % 1000 == 0:
                print(f"      Feldolgozva: {processed_lines}/{len(lines)} sor, talált meccsek: {found_matches}")

            # Gyors szűrés: csak olyan sorok, amikben valószínűleg meccs van
            if not self.quick_match_filter(line):
                continue

            # Kontextus sorok
            context_start = max(0, i - context_window)
            context_end = min(len(lines), i + context_window)
            context_lines = lines[context_start:context_end]

            # Meccs felismerése
            match_data = self.parse_szerencsemix_match_line(line, context_lines)

            if match_data:
                found_matches += 1

                # Dátum becslése
                pdf_datetime = datetime.strptime(pdf_date, '%Y-%m-%d')

                # Nap alapján dátum becslése
                day_map = {
                    'Hétfő': 0, 'H': 0,
                    'Kedd': 1, 'K': 1,
                    'Szerda': 2, 'Sze': 2,
                    'Csütörtök': 3, 'Cs': 3,
                    'Péntek': 4, 'P': 4,
                    'Szombat': 5, 'Szo': 5,
                    'Vasárnap': 6, 'V': 6
                }

                if match_data['day'] and match_data['day'] in day_map:
                    target_weekday = day_map[match_data['day']]
                    days_ahead = (target_weekday - pdf_datetime.weekday()) % 7
                    if days_ahead == 0:  # Ha ugyanaz a nap
                        days_ahead = 7  # Következő hét
                    estimated_date = pdf_datetime + timedelta(days=days_ahead)
                else:
                    estimated_date = pdf_datetime + timedelta(days=1)  # Alapértelmezett

                match_data['date'] = estimated_date.strftime('%Y-%m-%d')

                # Jövő vagy múlt?
                if estimated_date.date() > datetime.now().date():
                    future_matches.append(match_data)
                else:
                    # Történelmi meccsként kezelés (szorzók nélkül)
                    historical_match = match_data.copy()
                    del historical_match['odds']
                    historical_match['status'] = 'completed'
                    historical_matches.append(historical_match)

        print(f"   📊 Talált jövőbeli meccsek: {len(future_matches)}")
        print(f"   📈 Talált történelmi meccsek: {len(historical_matches)}")

        return {
            'future_matches': future_matches,
            'historical_matches': historical_matches
        }

    def quick_match_filter(self, line: str) -> bool:
        """Gyors szűrés: valószínűleg meccs sort tartalmaz-e"""

        # Tartalmaz 3 szorzót?
        if re.search(r'\b\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\b', line):
            return True

        # Tartalmaz kötőjelet és időpontot?
        if ' - ' in line and re.search(r'\b\d{1,2}:\d{2}\b', line):
            return True

        return False

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Egyetlen PDF feldolgozása javított logikával"""

        print(f"🔍 Javított feldolgozás: {pdf_path.name}")

        # Dátum kinyerése fájlnévből
        date_pattern = r'(\d{4})\.(\d{2})\.(\d{2})'
        date_match = re.search(date_pattern, pdf_path.name)

        if not date_match:
            return {'success': False, 'error': 'Nem sikerült dátumot kinyerni'}

        year, month, day = date_match.groups()
        pdf_date = f"{year}-{month}-{day}"

        # PDF szöveg kinyerése
        text = self.extract_text_with_pdftotext(pdf_path)

        if not text:
            return {'success': False, 'error': 'Nem sikerült szöveget kinyerni'}

        # Meccsek felismerése javított logikával
        matches_data = self.parse_matches_from_text(text, pdf_date)

        print(f"   📅 PDF dátum: {pdf_date}")
        print(f"   📄 Szöveg hossz: {len(text)} karakter")

        # Mintameccsek kiírása
        if matches_data['future_matches']:
            print("   🚀 Jövőbeli meccsek (minta):")
            for match in matches_data['future_matches'][:5]:
                odds_str = f"{match['odds']['1']:.2f}/{match['odds']['X']:.2f}/{match['odds']['2']:.2f}"
                print(f"      🎯 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} ({odds_str}) [{match['league']}] (conf: {match['confidence']})")

        if matches_data['historical_matches']:
            print("   📊 Történelmi meccsek (minta):")
            for match in matches_data['historical_matches'][:5]:
                print(f"      📈 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} [{match['league']}] (conf: {match['confidence']})")

        # Liga statisztikák
        league_stats = {}
        for match in matches_data['future_matches'] + matches_data['historical_matches']:
            league = match['league']
            league_stats[league] = league_stats.get(league, 0) + 1

        if league_stats:
            print("   🏆 Liga eloszlás:")
            for league, count in sorted(league_stats.items(), key=lambda x: x[1], reverse=True):
                print(f"      {league}: {count} meccs")

        matches_data.update({
            'success': True,
            'pdf_date': pdf_date,
            'total_text_length': len(text),
            'total_lines': len(text.split('\n')),
            'league_stats': league_stats
        })

        return matches_data

def main():
    """Tesztelés a javított feldolgozóval"""

    processor = ImprovedPdfProcessor()

    # Konkrét PDF kiválasztása
    test_pdf = Path(__file__).parent / 'data' / 'szerencsemix_archive' / 'organized' / '2023' / '01-Január' / 'web_01sz__01-03_k16-4_2023.01.03.pdf'

    if test_pdf.exists():
        print("🚀 JAVÍTOTT PDF FELDOLGOZÁS TESZT")
        print("=" * 50)
        print(f"📄 Tesztfájl: {test_pdf.name}")
        print(f"📏 Fájlméret: {test_pdf.stat().st_size / 1024 / 1024:.1f} MB")

        result = processor.process_pdf(test_pdf)

        if result['success']:
            print("\n✅ Sikeres javított feldolgozás!")
            total_matches = len(result['future_matches']) + len(result['historical_matches'])
            print(f"📊 Összes meccs: {total_matches}")

        else:
            print(f"\n❌ Hiba: {result['error']}")
    else:
        print("❌ Nem találtam a tesztfájlt")

if __name__ == "__main__":
    main()
