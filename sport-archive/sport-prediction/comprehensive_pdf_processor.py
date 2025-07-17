#!/usr/bin/env python3
"""
Teljes PDF elemző: meccsek, tabellák, eredmények
Átfogó adatkinyerés a Szerencsemix PDF-ekből
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import json

class ComprehensivePdfProcessor:
    """Teljes PDF feldolgozó minden adattípussal"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Liga felismerési minták (bővített)
        self.league_patterns = {
            'Premier Liga': [
                r'Premier Liga', r'angol.*bajnokság', r'angol.*liga', r'premier liga',
                r'Arsenal|Chelsea|Liverpool|Manchester|Tottenham|City|United|Everton|Leicester|Brighton|Crystal Palace|Leeds|Aston Villa|Nottingham|Fulham|Wolves|Newcastle|West Ham|Bournemouth|Southampton'
            ],
            'La Liga': [
                r'spanyol.*bajnokság', r'spanyol.*liga', r'La Liga', r'spanyol Bajnokság',
                r'Real Madrid|Barcelona|Atletico|Valencia|Sevilla|Real Sociedad|Athletic|Villarreal|Celta|Getafe|Betis|Rayo Vallecano|Osasuna|Mallorca|Girona|Almería|Valladolid|Espanyol'
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
            'FA Kupa': [
                r'FA Kupa|angol.*kupa'
            ],
            'Olasz Kupa': [
                r'Olasz Kupa|olasz.*kupa'
            ],
            'Liga 2': [
                r'angol liga 2|league 2'
            ]
        }

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése"""

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

    def detect_league_from_context(self, context_lines: List[str], team1: str = "", team2: str = "") -> str:
        """Liga felismerése kontextus és csapatnevek alapján (javított)"""

        # Keressük a legközelebbi liga információt a kontextusban
        for line in reversed(context_lines):
            line_lower = line.lower()

            # Direkt liga említések prioritása
            if 'premier liga' in line_lower:
                return 'Premier Liga'
            elif 'spanyol bajnokság' in line_lower or 'spanyol Bajnokság' in line_lower:
                return 'La Liga'
            elif 'olasz a' in line_lower or 'olasz kupa' in line_lower:
                return 'Serie A'
            elif 'német bajnokság' in line_lower:
                return 'Bundesliga'
            elif 'fa kupa' in line_lower:
                return 'FA Kupa'
            elif 'angol liga 2' in line_lower:
                return 'Liga 2'

            # Egyéb minták
            for league_name, patterns in self.league_patterns.items():
                for pattern in patterns:
                    if re.search(pattern.lower(), line_lower):
                        return league_name

        # Ha nem találunk kontextusban, csapatnevek alapján
        full_teams = f"{team1} {team2}".lower()

        for league_name, patterns in self.league_patterns.items():
            for pattern in patterns:
                if re.search(pattern.lower(), full_teams):
                    return league_name

        return 'Ismeretlen Liga'

    def parse_league_table(self, lines: List[str], start_idx: int) -> Dict:
        """Bajnokság tabella felismerése és feldolgozása"""

        tables = []
        current_table = None

        # Liga típus felismerése
        league_context = ' '.join(lines[max(0, start_idx-5):start_idx+15]).lower()

        if 'premier liga' in league_context:
            league_name = 'Premier Liga'
        elif 'spanyol' in league_context:
            league_name = 'La Liga'
        elif 'olasz' in league_context:
            league_name = 'Serie A'
        elif 'német' in league_context:
            league_name = 'Bundesliga'
        else:
            league_name = 'Ismeretlen Liga'

        # Tabella bejegyzések keresése
        # Minta: "BL     1. Arsenal                     16 14   1   1    40:14   43   5-1-0"
        table_pattern = r'^(\w{0,3})\s*(\d{1,2})\.\s+([A-Za-z][A-Za-z\s.]+?)\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3}):(\d{1,3})\s+(\d{1,3})\s+(.*)$'

        for i in range(start_idx, min(len(lines), start_idx + 30)):
            line = lines[i].strip()
            match = re.search(table_pattern, line)

            if match:
                try:
                    competition, position, team_name, matches, wins, draws, losses, goals_for, goals_against, points, form = match.groups()

                    # Csapatnév tisztítása
                    team_name = re.sub(r'\s+', ' ', team_name.strip())

                    if current_table is None:
                        current_table = {
                            'league': league_name,
                            'teams': [],
                            'last_updated': None
                        }

                    team_data = {
                        'position': int(position),
                        'team': team_name,
                        'matches': int(matches),
                        'wins': int(wins),
                        'draws': int(draws),
                        'losses': int(losses),
                        'goals_for': int(goals_for),
                        'goals_against': int(goals_against),
                        'goal_difference': int(goals_for) - int(goals_against),
                        'points': int(points),
                        'form': form.strip(),
                        'competition_status': competition.strip() if competition else ''
                    }

                    current_table['teams'].append(team_data)

                except (ValueError, AttributeError):
                    continue

            # Ha nem találunk több tabella sort, befejezzük
            elif current_table and len(current_table['teams']) > 0:
                break

        if current_table and len(current_table['teams']) >= 3:  # Minimum 3 csapat
            tables.append(current_table)

        return tables

    def parse_match_results(self, lines: List[str]) -> List[Dict]:
        """Történelmi meccs eredmények felismerése"""

        results = []

        # Eredmény minták
        result_patterns = [
            # "1. Leeds - Manchester City                Premier Liga          1-3           2"
            r'^\s*\d{1,2}\.\s+(.+?)\s+[-–—]\s+(.+?)\s+([A-Za-z\s]+)\s+(\d+)-(\d+)\s+([12X])\s*$',
            # Egyszerűbb: "Team1 - Team2 1-3"
            r'^(.+?)\s+[-–—]\s+(.+?)\s+(\d+)-(\d+)\s*$',
        ]

        for line in lines:
            line = line.strip()

            for pattern in result_patterns:
                match = re.search(pattern, line)
                if match:
                    try:
                        if len(match.groups()) == 6:  # Teljes minta
                            home_team, away_team, league, home_score, away_score, outcome = match.groups()
                        else:  # Egyszerű minta
                            home_team, away_team, home_score, away_score = match.groups()
                            league = 'Ismeretlen Liga'

                        # Csapatnevek tisztítása
                        home_team = re.sub(r'\s+', ' ', home_team.strip())
                        away_team = re.sub(r'\s+', ' ', away_team.strip())

                        # Túl hosszú nevek kiszűrése
                        if len(home_team) > 30 or len(away_team) > 30:
                            continue

                        result_data = {
                            'home_team': home_team,
                            'away_team': away_team,
                            'home_score': int(home_score),
                            'away_score': int(away_score),
                            'league': league.strip() if isinstance(league, str) else 'Ismeretlen Liga',
                            'status': 'completed',
                            'source': 'historical_results'
                        }

                        results.append(result_data)

                    except (ValueError, AttributeError):
                        continue

        return results

    def parse_szerencsemix_match_line(self, line: str, context_lines: List[str]) -> Optional[Dict]:
        """Szerencsemix meccs sor feldolgozása (javított liga felismeréssel)"""

        # A valódi Szerencsemix formátum
        match_pattern = r'^(\w{1,3})\s+(\d{1,2}:\d{2})\s+(\d{4,6})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,3})\s*$'

        match = re.search(match_pattern, line.strip())
        if match:
            try:
                day, time_str, match_id, home_team, away_team, odds_str = match.groups()

                # Csapatnevek tisztítása
                home_team = re.sub(r'\s+', ' ', home_team.strip())
                away_team = re.sub(r'\s+', ' ', away_team.strip())

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

                # Liga felismerése (javított)
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
                    'source': 'upcoming_matches',
                    'source_line': line.strip()
                }

            except (ValueError, AttributeError, IndexError):
                return None

        return None

    def process_comprehensive_pdf(self, text: str, pdf_date: str) -> Dict:
        """Teljes PDF feldolgozás: meccsek, tabellák, eredmények"""

        if not text:
            return {
                'future_matches': [],
                'historical_matches': [],
                'league_tables': [],
                'historical_results': []
            }

        future_matches = []
        historical_matches = []
        league_tables = []
        historical_results = []

        lines = text.split('\n')
        print(f"   🔍 Teljes feldolgozás: {len(lines)} sor")

        context_window = 5
        matches_found = 0
        tables_found = 0
        results_found = 0

        # 1. MECCSEK FELDOLGOZÁSA
        print("   ⚽ Meccsek keresése...")
        for i, line in enumerate(lines):
            if not self.quick_match_filter(line):
                continue

            context_lines = lines[max(0, i-context_window):min(len(lines), i+context_window)]
            match_data = self.parse_szerencsemix_match_line(line, context_lines)

            if match_data:
                matches_found += 1

                # Dátum becslése
                pdf_datetime = datetime.strptime(pdf_date, '%Y-%m-%d')
                day_map = {
                    'Hétfő': 0, 'H': 0, 'Kedd': 1, 'K': 1, 'Szerda': 2, 'Sze': 2,
                    'Csütörtök': 3, 'Cs': 3, 'Péntek': 4, 'P': 4, 'Szombat': 5, 'Szo': 5,
                    'Vasárnap': 6, 'V': 6
                }

                if match_data['day'] and match_data['day'] in day_map:
                    target_weekday = day_map[match_data['day']]
                    days_ahead = (target_weekday - pdf_datetime.weekday()) % 7
                    if days_ahead == 0:
                        days_ahead = 7
                    estimated_date = pdf_datetime + timedelta(days=days_ahead)
                else:
                    estimated_date = pdf_datetime + timedelta(days=1)

                match_data['date'] = estimated_date.strftime('%Y-%m-%d')

                # Jövő vagy múlt?
                if estimated_date.date() > datetime.now().date():
                    future_matches.append(match_data)
                else:
                    historical_match = match_data.copy()
                    del historical_match['odds']
                    historical_match['status'] = 'completed'
                    historical_matches.append(historical_match)

        # 2. TABELLÁK KERESÉSE
        print("   📊 Tabellák keresése...")
        for i, line in enumerate(lines):
            # Tabella kezdet felismerése: "1. Arsenal" típusú sorok
            if re.search(r'^\s*(?:\w{0,3}\s*)?1\.\s+[A-Za-z]', line.strip()):
                table_data = self.parse_league_table(lines, i)
                if table_data:
                    league_tables.extend(table_data)
                    tables_found += len(table_data)

        # 3. EREDMÉNYEK KERESÉSE
        print("   🏆 Eredmények keresése...")
        result_data = self.parse_match_results(lines)
        historical_results = result_data
        results_found = len(result_data)

        print(f"   📊 Találatok: {matches_found} meccs, {tables_found} tabella, {results_found} eredmény")

        return {
            'future_matches': future_matches,
            'historical_matches': historical_matches,
            'league_tables': league_tables,
            'historical_results': historical_results
        }

    def quick_match_filter(self, line: str) -> bool:
        """Gyors szűrés meccsekhez"""
        return re.search(r'\b\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\s+\d+[.,]\d{2,3}\b', line) or \
               (' - ' in line and re.search(r'\b\d{1,2}:\d{2}\b', line))

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Egyetlen PDF teljes feldolgozása"""

        print(f"🔍 TELJES PDF FELDOLGOZÁS: {pdf_path.name}")

        # Dátum kinyerése
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

        # Teljes feldolgozás
        data = self.process_comprehensive_pdf(text, pdf_date)

        print(f"   📅 PDF dátum: {pdf_date}")
        print(f"   📄 Szöveg hossz: {len(text)} karakter")

        # Összefoglalók
        future_count = len(data['future_matches'])
        historical_count = len(data['historical_matches'])
        table_count = len(data['league_tables'])
        result_count = len(data['historical_results'])

        print(f"\n📈 ÖSSZEFOGLALÓ:")
        print(f"   🚀 Jövőbeli meccsek: {future_count}")
        print(f"   📊 Történelmi meccsek: {historical_count}")
        print(f"   🏆 Bajnokság tabellák: {table_count}")
        print(f"   📋 Történelmi eredmények: {result_count}")

        # Részletes kiírás
        if future_count > 0:
            print("\n🚀 JÖVŐBELI MECCSEK (minta):")
            for match in data['future_matches'][:5]:
                odds_str = f"{match['odds']['1']:.2f}/{match['odds']['X']:.2f}/{match['odds']['2']:.2f}"
                print(f"   🎯 {match['date']} {match['time']}: {match['home_team']} vs {match['away_team']} ({odds_str}) [{match['league']}]")

        if table_count > 0:
            print("\n🏆 BAJNOKSÁG TABELLÁK:")
            for table in data['league_tables']:
                print(f"   📊 {table['league']} ({len(table['teams'])} csapat)")
                for team in table['teams'][:3]:  # Top 3
                    print(f"      {team['position']:2d}. {team['team']:20s} {team['points']:2d} pont ({team['wins']}-{team['draws']}-{team['losses']})")

        if result_count > 0:
            print("\n📋 TÖRTÉNELMI EREDMÉNYEK (minta):")
            for result in data['historical_results'][:5]:
                print(f"   🏆 {result['home_team']} {result['home_score']}:{result['away_score']} {result['away_team']} [{result['league']}]")

        # Liga statisztikák
        all_matches = data['future_matches'] + data['historical_matches']
        league_stats = {}
        for match in all_matches:
            league = match['league']
            league_stats[league] = league_stats.get(league, 0) + 1

        if league_stats:
            print("\n🌍 LIGA ELOSZLÁS (meccsek):")
            for league, count in sorted(league_stats.items(), key=lambda x: x[1], reverse=True):
                print(f"   {league}: {count} meccs")

        data.update({
            'success': True,
            'pdf_date': pdf_date,
            'total_text_length': len(text),
            'total_lines': len(text.split('\n')),
            'summary': {
                'future_matches': future_count,
                'historical_matches': historical_count,
                'league_tables': table_count,
                'historical_results': result_count,
                'league_distribution': league_stats
            }
        })

        return data

def main():
    """Tesztelés a teljes feldolgozóval"""

    processor = ComprehensivePdfProcessor()

    test_pdf = Path(__file__).parent / 'data' / 'szerencsemix_archive' / 'organized' / '2023' / '01-Január' / 'web_01sz__01-03_k16-4_2023.01.03.pdf'

    if test_pdf.exists():
        print("🚀 TELJES PDF ELEMZÉS TESZT")
        print("=" * 60)
        print(f"📄 Tesztfájl: {test_pdf.name}")
        print(f"📏 Fájlméret: {test_pdf.stat().st_size / 1024 / 1024:.1f} MB")

        result = processor.process_pdf(test_pdf)

        if result['success']:
            print("\n✅ SIKERES TELJES FELDOLGOZÁS!")
            summary = result['summary']
            total_data = sum([
                summary['future_matches'],
                summary['historical_matches'],
                summary['league_tables'],
                summary['historical_results']
            ])
            print(f"📊 Összes kinyert adat: {total_data} elem")

            # JSON kiírás
            output_file = Path(__file__).parent / 'data' / 'comprehensive_pdf_analysis.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'meta': {
                        'pdf_file': test_pdf.name,
                        'processed_at': datetime.now().isoformat(),
                        'summary': summary
                    },
                    'data': {
                        'future_matches': result['future_matches'],
                        'historical_matches': result['historical_matches'],
                        'league_tables': result['league_tables'],
                        'historical_results': result['historical_results']
                    }
                }, f, ensure_ascii=False, indent=2)

            print(f"\n💾 Részletes adatok mentve: {output_file}")

        else:
            print(f"\n❌ Hiba: {result['error']}")
    else:
        print("❌ Nem találtam a tesztfájlt")

if __name__ == "__main__":
    main()
