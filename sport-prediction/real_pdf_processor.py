#!/usr/bin/env python3
"""
Valódi PDF feldolgozó pdfplumber nélkül
Regex alapú szöveg elemzés
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json

class RealPdfProcessor:
    """Valódi PDF feldolgozó pdftotext segítségével"""

    def __init__(self):
        self.project_root = Path(__file__).parent

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése pdftotext segítségével"""
        try:
            # pdftotext parancs futtatása
            result = subprocess.run([
                'pdftotext', '-layout', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=30)

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

    def parse_matches_from_text(self, text: str, pdf_date: str) -> Dict:
        """Meccs adatok felismerése szövegből"""

        if not text:
            return {'future_matches': [], 'historical_matches': []}

        future_matches = []
        historical_matches = []

        # Meccs minták keresése
        # Minta: "P 15:30 12345 Arsenal - Chelsea 2.10 3.20 2.80"
        match_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{4,5})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

        lines = text.split('\n')

        for line in lines:
            match = re.search(match_pattern, line)
            if match:
                time_str = match.group(1)
                match_id = match.group(2)
                home_team = match.group(3).strip()
                away_team = match.group(4).strip()
                odds_str = match.group(5).strip()

                # Szorzók feldolgozása
                odds_numbers = re.findall(r'\d+[.,]\d{2,3}', odds_str)
                odds_1 = float(odds_numbers[0].replace(',', '.')) if len(odds_numbers) > 0 else None
                odds_x = float(odds_numbers[1].replace(',', '.')) if len(odds_numbers) > 1 else None
                odds_2 = float(odds_numbers[2].replace(',', '.')) if len(odds_numbers) > 2 else None

                # Liga információ keresése a sorban
                league_info = self.detect_league(home_team, away_team)

                # Dátum becslése (PDF dátum után 1-7 nappal)
                pdf_datetime = datetime.strptime(pdf_date, '%Y-%m-%d')
                estimated_date = pdf_datetime + timedelta(days=1)  # Alapértelmezett következő nap

                match_data = {
                    'home_team': home_team,
                    'away_team': away_team,
                    'date': estimated_date.strftime('%Y-%m-%d'),
                    'time': time_str,
                    'league': league_info,
                    'odds': {
                        '1': odds_1,
                        'X': odds_x,
                        '2': odds_2
                    },
                    'match_id': match_id,
                    'confidence': 0.7
                }

                # Ma után van-e?
                if estimated_date.date() > datetime.now().date():
                    future_matches.append(match_data)
                else:
                    # Történelmi meccshez próbáljunk eredményt találni
                    result_pattern = rf'{re.escape(home_team)}.*?{re.escape(away_team)}.*?(\d+)\s*[-:]\s*(\d+)'
                    result_match = re.search(result_pattern, text, re.IGNORECASE)

                    if result_match:
                        match_data.update({
                            'home_score': int(result_match.group(1)),
                            'away_score': int(result_match.group(2)),
                            'status': 'completed'
                        })
                        del match_data['odds']  # Történelmi meccsben nincs odds
                        historical_matches.append(match_data)

        return {
            'future_matches': future_matches,
            'historical_matches': historical_matches
        }

    def detect_league(self, home_team: str, away_team: str) -> str:
        """Liga felismerése csapatnevek alapján"""

        # Magyar csapatok
        hungarian_teams = [
            'Ferencváros', 'FTC', 'Fradi', 'Újpest', 'MTK', 'Honvéd', 'Vasas',
            'Debrecen', 'DVSC', 'Paks', 'Vidi', 'Fehérvár', 'Kisvárda', 'ZTE'
        ]

        # Premier League csapatok
        epl_teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester', 'Tottenham', 'City',
            'United', 'Everton', 'Leicester', 'Brighton', 'Crystal Palace'
        ]

        # La Liga csapatok
        laliga_teams = [
            'Real Madrid', 'Barcelona', 'Atletico', 'Valencia', 'Sevilla',
            'Real Sociedad', 'Athletic', 'Villarreal'
        ]

        # Champions League kulcsszavak
        cl_keywords = ['Barcelona', 'Real Madrid', 'Bayern', 'PSG', 'Milan', 'Juventus']

        all_teams = f"{home_team} {away_team}".lower()

        # Ellenőrzések
        if any(team.lower() in all_teams for team in hungarian_teams):
            return 'NB I'
        elif any(team.lower() in all_teams for team in epl_teams):
            return 'Premier League'
        elif any(team.lower() in all_teams for team in laliga_teams):
            return 'La Liga'
        elif any(keyword.lower() in all_teams for keyword in cl_keywords):
            return 'Champions League'
        else:
            return 'Ismeretlen Liga'

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Egyetlen PDF feldolgozása"""

        print(f"🔍 Feldolgozás: {pdf_path.name}")

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

        # Meccsek felismerése
        matches_data = self.parse_matches_from_text(text, pdf_date)

        print(f"   📅 PDF dátum: {pdf_date}")
        print(f"   🚀 Jövőbeli meccsek: {len(matches_data['future_matches'])}")
        print(f"   📊 Történelmi meccsek: {len(matches_data['historical_matches'])}")

        # Mintameccsek kiírása
        for match in matches_data['future_matches'][:3]:
            odds_str = f"{match['odds']['1']}/{match['odds']['X']}/{match['odds']['2']}"
            print(f"      🎯 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} ({odds_str})")

        matches_data.update({
            'success': True,
            'pdf_date': pdf_date,
            'total_text_length': len(text)
        })

        return matches_data

def main():
    """Tesztelés a legfrissebb PDF-fel"""

    processor = RealPdfProcessor()

    # Legfrissebb PDF keresése
    archive_path = Path(__file__).parent / 'data' / 'szerencsemix_archive' / 'organized'

    latest_pdf = None
    for year_dir in sorted(archive_path.iterdir(), reverse=True):
        if year_dir.is_dir() and year_dir.name.startswith('2025'):
            for month_dir in sorted(year_dir.iterdir(), reverse=True):
                if month_dir.is_dir():
                    pdfs = sorted(month_dir.glob('*.pdf'), reverse=True)
                    if pdfs:
                        latest_pdf = pdfs[0]
                        break
            if latest_pdf:
                break

    if latest_pdf:
        print("🚀 VALÓDI PDF FELDOLGOZÁS TESZT")
        print("=" * 40)

        result = processor.process_pdf(latest_pdf)

        if result['success']:
            print("\n✅ Sikeres feldolgozás!")
            print(f"📄 Szöveg hossz: {result['total_text_length']} karakter")
        else:
            print(f"\n❌ Hiba: {result['error']}")
    else:
        print("❌ Nem találtam PDF fájlt")

if __name__ == "__main__":
    main()
