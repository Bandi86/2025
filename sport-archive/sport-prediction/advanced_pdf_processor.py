#!/usr/bin/env python3
"""
Fejlett PDF feldolgozó nagyobb pontossággal
Több regex minta és kifinomultabb szöveg elemzés
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import json

class AdvancedPdfProcessor:
    """Fejlett PDF feldolgozó több regex mintával és jobb felismeréssel"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Liga felismerési minták
        self.league_patterns = {
            'Premier Liga': [
                r'Premier Liga', r'angol.*bajnokság', r'angol.*liga',
                # Premier League csapatok
                r'Arsenal|Chelsea|Liverpool|Manchester|Tottenham|City|United|Everton|Leicester|Brighton|Crystal Palace|Leeds|Aston Villa|Nottingham|Fulham|Wolves|Newcastle|West Ham|Bournemouth|Southampton'
            ],
            'La Liga': [
                r'spanyol.*bajnokság', r'spanyol.*liga', r'La Liga',
                r'Real Madrid|Barcelona|Atletico|Valencia|Sevilla|Real Sociedad|Athletic|Villarreal|Celta|Getafe'
            ],
            'Serie A': [
                r'olasz.*bajnokság', r'olasz.*liga', r'Serie A',
                r'Juventus|Milan|Inter|Napoli|Roma|Lazio|Atalanta|Fiorentina|Bologna|Torino'
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
            'FA Kupa': [
                r'FA Kupa|angol.*kupa'
            ],
            'Kupa': [
                r'kupa|cup|copa'
            ]
        }

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése pdftotext segítségével"""
        try:
            print(f"      pdftotext futtatása: {pdf_path.name}")
            result = subprocess.run([
                'pdftotext', '-layout', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                return result.stdout
            else:
                print(f"⚠️ pdftotext hiba: {result.stderr}")
                return None

        except FileNotFoundError:
            print("⚠️ pdftotext nincs telepítve")
            return None
        except subprocess.TimeoutExpired:
            print("⚠️ pdftotext timeout")
            return None
        except Exception as e:
            print(f"⚠️ pdftotext egyéb hiba: {e}")
            return None

    def detect_league_from_context(self, text_chunk: str, home_team: str, away_team: str) -> str:
        """Liga felismerése kontextus és csapatnevek alapján"""

        full_context = f"{text_chunk} {home_team} {away_team}".lower()

        # Pontos egyezések keresése
        for league_name, patterns in self.league_patterns.items():
            for pattern in patterns:
                if re.search(pattern.lower(), full_context):
                    return league_name

        return 'Ismeretlen Liga'

    def extract_odds_from_line(self, line: str) -> Dict[str, Optional[float]]:
        """Szorzók kinyerése sorból"""

        # Minden lehetséges szorzó formátum
        odds_patterns = [
            r'\b(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\b',  # 3 szorzó egymás után
            r'\b(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\s+(\d+[.,]\d{2,3})\s*$',  # sor végén
        ]

        for pattern in odds_patterns:
            match = re.search(pattern, line)
            if match:
                try:
                    odds_1 = float(match.group(1).replace(',', '.'))
                    odds_x = float(match.group(2).replace(',', '.'))
                    odds_2 = float(match.group(3).replace(',', '.'))

                    # Érvényesség ellenőrzése (szorzók általában 1.01 és 50 között vannak)
                    if all(1.01 <= odds <= 50 for odds in [odds_1, odds_x, odds_2]):
                        return {'1': odds_1, 'X': odds_x, '2': odds_2}
                except (ValueError, AttributeError):
                    continue

        return {'1': None, 'X': None, '2': None}

    def parse_match_line(self, line: str, context_lines: List[str]) -> Optional[Dict]:
        """Meccs sor feldolgozása kontextussal"""

        # Különböző meccs minták
        match_patterns = [
            # Teljes minta: Nap idő sorszám csapat1 - csapat2 szorzók
            r'(\w{1,3})\s+(\d{1,2}:\d{2})\s+(\d{4,6})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})',
            # Csak idő és meccs: idő sorszám csapat1 - csapat2 szorzók
            r'(\d{1,2}:\d{2})\s+(\d{4,6})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})',
            # Egyszerűbb minta: csapat1 - csapat2 szorzók
            r'(\w+(?:\s+\w+)*)\s+[-–—]\s+(\w+(?:\s+\w+)*)\s+((?:\d+[.,]\d{2,3}\s*){2,})'
        ]

        for i, pattern in enumerate(match_patterns):
            match = re.search(pattern, line)
            if match:
                try:
                    if i == 0:  # Teljes minta
                        day, time_str, match_id, home_team, away_team, odds_str = match.groups()
                    elif i == 1:  # Idő minta
                        time_str, match_id, home_team, away_team, odds_str = match.groups()
                        day = self.extract_day_from_context(context_lines)
                    else:  # Egyszerű minta
                        home_team, away_team, odds_str = match.groups()
                        time_str = self.extract_time_from_context(context_lines)
                        match_id = f"AUTO_{abs(hash(line)) % 99999}"
                        day = self.extract_day_from_context(context_lines)

                    # Csapatnevek tisztítása
                    home_team = home_team.strip()
                    away_team = away_team.strip()

                    # Túl hosszú csapatnevek kiszűrése (valószínűleg hibás match)
                    if len(home_team) > 50 or len(away_team) > 50:
                        return None

                    # Szorzók feldolgozása
                    odds = self.extract_odds_from_line(line)

                    # Ha nincs érvényes szorzó, próbáljuk megtalálni a kontextusban
                    if not any(odds.values()):
                        continue

                    # Liga felismerése
                    context_text = ' '.join(context_lines)
                    league = self.detect_league_from_context(context_text, home_team, away_team)

                    return {
                        'home_team': home_team,
                        'away_team': away_team,
                        'time': time_str if 'time_str' in locals() else '00:00',
                        'day': day if 'day' in locals() else None,
                        'league': league,
                        'odds': odds,
                        'match_id': match_id if 'match_id' in locals() else f"AUTO_{abs(hash(line)) % 99999}",
                        'confidence': 0.8 if i == 0 else (0.6 if i == 1 else 0.4),
                        'source_line': line.strip()
                    }

                except (ValueError, AttributeError, IndexError) as e:
                    continue

        return None

    def extract_day_from_context(self, context_lines: List[str]) -> Optional[str]:
        """Nap kinyerése kontextusból"""
        day_pattern = r'\b(Hétfő|Kedd|Szerda|Csütörtök|Péntek|Szombat|Vasárnap|H|K|Sze|Cs|P|Szo|V)\b'

        for line in reversed(context_lines[-10:]):  # Utolsó 10 sor
            match = re.search(day_pattern, line, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def extract_time_from_context(self, context_lines: List[str]) -> str:
        """Időpont kinyerése kontextusból"""
        time_pattern = r'\b(\d{1,2}:\d{2})\b'

        for line in reversed(context_lines[-5:]):  # Utolsó 5 sor
            match = re.search(time_pattern, line)
            if match:
                return match.group(1)
        return '00:00'

    def parse_results_from_text(self, text: str) -> List[Dict]:
        """Eredmények felismerése szövegből"""

        results = []

        # Eredmény minták
        result_patterns = [
            r'(\w+(?:\s+\w+)*)\s+[-–—]\s+(\w+(?:\s+\w+)*)\s+(\d+):(\d+)',  # Csapat1 - Csapat2 1:2
            r'(\w+(?:\s+\w+)*)\s+(\d+):(\d+)\s+(\w+(?:\s+\w+)*)',  # Csapat1 1:2 Csapat2
        ]

        lines = text.split('\n')

        for line in lines:
            for pattern in result_patterns:
                matches = re.finditer(pattern, line)
                for match in matches:
                    try:
                        if ':' in line and re.search(r'\d+:\d+', line):
                            if pattern == result_patterns[0]:
                                home_team, away_team, home_score, away_score = match.groups()
                            else:
                                home_team, home_score, away_score, away_team = match.groups()

                            results.append({
                                'home_team': home_team.strip(),
                                'away_team': away_team.strip(),
                                'home_score': int(home_score),
                                'away_score': int(away_score),
                                'status': 'completed',
                                'source_line': line.strip()
                            })
                    except (ValueError, AttributeError):
                        continue

        return results

    def parse_matches_from_text(self, text: str, pdf_date: str) -> Dict:
        """Meccs adatok felismerése szövegből továbbfejlesztett logikával"""

        if not text:
            return {'future_matches': [], 'historical_matches': [], 'results': []}

        future_matches = []
        historical_matches = []

        lines = text.split('\n')
        print(f"   🔍 Feldolgozandó sorok: {len(lines)}")

        # Kontextus ablak a liga felismeréshez
        context_window = 5  # Csökkentett kontextus a sebességért
        processed_lines = 0

        for i, line in enumerate(lines):
            processed_lines += 1

            # Haladás kijelzése
            if processed_lines % 500 == 0:
                print(f"      Feldolgozva: {processed_lines}/{len(lines)} sor")

            # Gyors szűrés: csak olyan sorok, amikben valószínűleg meccs van
            if not self.quick_match_filter(line):
                continue

            # Kontextus sorok
            context_start = max(0, i - context_window)
            context_end = min(len(lines), i + context_window)
            context_lines = lines[context_start:context_end]

            # Meccs felismerése
            match_data = self.parse_match_line(line, context_lines)

            if match_data:
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

        # Eredmények külön keresése (korlátozott számban)
        results = self.parse_results_from_text(text[:50000])  # Csak első 50k karakter

        print(f"   📊 Talált jövőbeli meccsek: {len(future_matches)}")
        print(f"   📈 Talált történelmi meccsek: {len(historical_matches)}")
        print(f"   🏆 Talált eredmények: {len(results)}")

        return {
            'future_matches': future_matches,
            'historical_matches': historical_matches,
            'results': results
        }

    def quick_match_filter(self, line: str) -> bool:
        """Gyors szűrés: valószínűleg meccs sort tartalmaz-e"""
        line_lower = line.lower()

        # Tartalmaz időpontot?
        if re.search(r'\b\d{1,2}:\d{2}\b', line):
            return True

        # Tartalmaz szorzókat?
        if re.search(r'\b\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\b', line):
            return True

        # Tartalmaz kötőjelet (csapat1 - csapat2)?
        if ' - ' in line and len(line.split()) > 3:
            return True

        # Tartalmaz gyakori csapatneveket?
        common_teams = ['arsenal', 'chelsea', 'liverpool', 'manchester', 'barcelona', 'real madrid', 'bayern', 'milan']
        if any(team in line_lower for team in common_teams):
            return True

        return False

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Egyetlen PDF feldolgozása fejlett logikával"""

        print(f"🔍 Fejlett feldolgozás: {pdf_path.name}")

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

        # Meccsek felismerése fejlett logikával
        matches_data = self.parse_matches_from_text(text, pdf_date)

        print(f"   📅 PDF dátum: {pdf_date}")
        print(f"   📄 Szöveg hossz: {len(text)} karakter")

        # Mintameccsek kiírása
        if matches_data['future_matches']:
            print("   🚀 Jövőbeli meccsek (minta):")
            for match in matches_data['future_matches'][:3]:
                odds_str = f"{match['odds']['1']}/{match['odds']['X']}/{match['odds']['2']}"
                print(f"      🎯 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} ({odds_str}) [{match['league']}]")

        if matches_data['historical_matches']:
            print("   📊 Történelmi meccsek (minta):")
            for match in matches_data['historical_matches'][:3]:
                print(f"      📈 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} [{match['league']}]")

        if matches_data['results']:
            print("   🏆 Eredmények (minta):")
            for result in matches_data['results'][:3]:
                print(f"      🎯 {result['home_team']} {result['home_score']}:{result['away_score']} {result['away_team']}")

        matches_data.update({
            'success': True,
            'pdf_date': pdf_date,
            'total_text_length': len(text),
            'total_lines': len(text.split('\n'))
        })

        return matches_data

def main():
    """Tesztelés egy kisebb PDF-fel"""

    processor = AdvancedPdfProcessor()

    # Konkrét kisebb PDF kiválasztása
    test_pdf = Path(__file__).parent / 'data' / 'szerencsemix_archive' / 'organized' / '2023' / '01-Január' / 'web_01sz__01-03_k16-4_2023.01.03.pdf'

    if test_pdf.exists():
        print("🚀 FEJLETT PDF FELDOLGOZÁS TESZT")
        print("=" * 50)
        print(f"📄 Tesztfájl: {test_pdf.name}")
        print(f"📏 Fájlméret: {test_pdf.stat().st_size / 1024 / 1024:.1f} MB")

        result = processor.process_pdf(test_pdf)

        if result['success']:
            print("\n✅ Sikeres fejlett feldolgozás!")
            total_matches = len(result['future_matches']) + len(result['historical_matches'])
            total_results = len(result.get('results', []))
            print(f"📊 Összes meccs: {total_matches}")
            print(f"🏆 Összes eredmény: {total_results}")

            # Részletes összefoglaló
            leagues = {}
            for match in result['future_matches'] + result['historical_matches']:
                league = match['league']
                leagues[league] = leagues.get(league, 0) + 1

            print("\n📋 Liga eloszlás:")
            for league, count in sorted(leagues.items(), key=lambda x: x[1], reverse=True):
                print(f"   {league}: {count} meccs")
        else:
            print(f"\n❌ Hiba: {result['error']}")
    else:
        print("❌ Nem találtam PDF fájlt")

if __name__ == "__main__":
    main()
