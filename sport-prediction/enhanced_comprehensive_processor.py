#!/usr/bin/env python3
"""
TOVÁBBFEJLESZTETT PDF ELEMZŐ v2.0
==================================

Javítások:
- Jobb regex minták
- Kontextus alapú liga felismerés
- Több match formátum támogatása
- Robusztusabb eredmény feldolgozás
- Jobb hibaelhárítás

Verzió: 2.0
Dátum: 2025-01-12
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Set
import json
import logging

class EnhancedComprehensivePdfProcessor:
    """Továbbfejlesztett PDF feldolgozó minden adattípussal"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Logolás beállítása
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Kibővített liga felismerési minták
        self.league_patterns = {
            'Premier Liga': {
                'keywords': [
                    r'Premier Liga', r'angol.*bajnokság', r'angol.*liga', r'premier liga',
                    r'angol\s+élvonal', r'pL\b', r'england\s+1'
                ],
                'teams': [
                    'Arsenal', 'Chelsea', 'Liverpool', 'Manchester', 'Tottenham', 'City', 'United',
                    'Everton', 'Leicester', 'Brighton', 'Crystal Palace', 'Leeds', 'Aston Villa',
                    'Nottingham', 'Fulham', 'Wolves', 'Newcastle', 'West Ham', 'Bournemouth',
                    'Southampton', 'Brentford', 'Sheffield', 'Burnley', 'Watford'
                ]
            },
            'La Liga': {
                'keywords': [
                    r'spanyol.*bajnokság', r'spanyol.*liga', r'La Liga', r'spanyol Bajnokság',
                    r'spanyol\s+élvonal', r'españa\s+1'
                ],
                'teams': [
                    'Real Madrid', 'Barcelona', 'Atletico', 'Valencia', 'Sevilla', 'Real Sociedad',
                    'Athletic', 'Villarreal', 'Celta', 'Getafe', 'Betis', 'Rayo Vallecano',
                    'Osasuna', 'Mallorca', 'Girona', 'Almería', 'Valladolid', 'Espanyol',
                    'Cadiz', 'Granada', 'Elche'
                ]
            },
            'Serie A': {
                'keywords': [
                    r'olasz.*bajnokság', r'olasz.*liga', r'Serie A', r'Olasz A',
                    r'olasz\s+élvonal', r'italy\s+1'
                ],
                'teams': [
                    'Juventus', 'Milan', 'Inter', 'Napoli', 'Roma', 'Lazio', 'Atalanta',
                    'Fiorentina', 'Bologna', 'Torino', 'Salernitana', 'Sassuolo', 'Spezia',
                    'Lecce', 'Genoa', 'Sampdoria', 'Udinese', 'Empoli', 'Verona', 'Cremonese'
                ]
            },
            'Bundesliga': {
                'keywords': [
                    r'német.*bajnokság', r'német.*liga', r'Bundesliga',
                    r'német\s+élvonal', r'germany\s+1'
                ],
                'teams': [
                    'Bayern', 'Dortmund', 'Leipzig', 'Leverkusen', 'Frankfurt', 'Wolfsburg',
                    'Gladbach', 'Union Berlin', 'Freiburg', 'Köln', 'Hoffenheim', 'Mainz',
                    'Hertha', 'Augsburg', 'Stuttgart', 'Bochum', 'Schalke'
                ]
            },
            'Ligue 1': {
                'keywords': [
                    r'francia.*bajnokság', r'francia.*liga', r'Ligue 1',
                    r'francia\s+élvonal', r'france\s+1'
                ],
                'teams': [
                    'PSG', 'Marseille', 'Monaco', 'Lyon', 'Nice', 'Lille', 'Rennes',
                    'Montpellier', 'Strasbourg', 'Lens', 'Nantes', 'Reims', 'Brest',
                    'Clermont', 'Lorient', 'Angers', 'Troyes', 'Metz'
                ]
            },
            'Champions League': {
                'keywords': [
                    r'Bajnokok Liga', r'Champions League', r'BL\b', r'európa kupa',
                    r'champions\s+league', r'CL\b'
                ],
                'teams': []  # BL csapatok a többi ligából jöhetnek
            },
            'NB I': {
                'keywords': [
                    r'magyar.*bajnokság', r'NB I', r'OTP Bank Liga',
                    r'magyar\s+élvonal', r'hungary\s+1'
                ],
                'teams': [
                    'Ferencváros', 'FTC', 'Fradi', 'Újpest', 'MTK', 'Honvéd', 'Vasas',
                    'Debrecen', 'DVSC', 'Paks', 'Vidi', 'Fehérvár', 'Kisvárda', 'ZTE',
                    'Kecskemét', 'Puskás Akadémia'
                ]
            },
            'FA Kupa': {
                'keywords': [r'FA Kupa', r'angol.*kupa', r'fa\s+cup'],
                'teams': []
            },
            'Serie A (Brazil)': {
                'keywords': [
                    r'brasil.*serie', r'brazil.*serie', r'brasileirão',
                    r'brazil\s+1', r'brasil\s+1'
                ],
                'teams': [
                    'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Santos',
                    'Atlético MG', 'Internacional', 'Grêmio', 'Fluminense', 'Botafogo',
                    'Vasco', 'Cruzeiro', 'Bahia', 'Sport', 'Ceará', 'Fortaleza'
                ]
            },
            'J1 League': {
                'keywords': [
                    r'japán.*liga', r'j1.*league', r'j-league',
                    r'japan\s+1'
                ],
                'teams': [
                    'Kashima', 'Urawa', 'Kawasaki', 'FC Tokyo', 'Yokohama', 'Cerezo',
                    'Gamba', 'Vissel', 'Sanfrecce', 'Nagoya', 'Shimizu', 'Avispa'
                ]
            }
        }

        # Bővített match minták
        self.match_patterns = [
            # Alapvető minta: Team1 - Team2 (odds) időpont
            r'^\s*(\d{1,2}\.)?\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+.*?(\d{1,2}[:\.]?\d{0,2})\s*$',

            # Időpont előre: 19:00 Team1 - Team2 (odds)
            r'^\s*(\d{1,2}[:\.]?\d{2})\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})',

            # Egyszerű: Team1 vs Team2
            r'^\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+vs\s+([A-Za-z][A-Za-z\s\.]{2,25})',

            # Szám kezdésű: 1. Team1 - Team2
            r'^\s*\d{1,2}\.\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})',

            # Odds-szal: Team1 - Team2 1.50 3.20 2.10
            r'^\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+(\d{1,2}\.\d{2})',
        ]

        # Eredmény minták
        self.result_patterns = [
            # Team1 - Team2 1-3 (komplett eredmény)
            r'^\s*(\d{1,2}\.)?\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+(\d{1,2})-(\d{1,2})',

            # Team1 vs Team2 1:3
            r'^\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+vs\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+(\d{1,2}):(\d{1,2})',

            # Ligával: Team1 - Team2 Liga 1-3
            r'^\s*([A-Za-z][A-Za-z\s\.]{2,25})\s+[-–—]\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+([A-Za-z\s]+)\s+(\d{1,2})-(\d{1,2})',
        ]

        # Tabella minták
        self.table_patterns = [
            # 1. Arsenal 16 14 1 1 40:14 43
            r'^\s*(\d{1,2})\.\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3}):(\d{1,3})\s+(\d{1,3})',

            # Rövidítéssel: BL 1. Arsenal 16 14 1 1 40:14 43
            r'^(\w{1,4})\s+(\d{1,2})\.\s+([A-Za-z][A-Za-z\s\.]{2,25})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3}):(\d{1,3})\s+(\d{1,3})',
        ]

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése javított hibakezeléssel"""

        # Teszteléshez használjuk az előre kinyert fájlt csak ha explicitelt teszt PDF
        test_file = Path("/tmp/test_output.txt")
        if test_file.exists() and pdf_path.name == "test.pdf":
            self.logger.info(f"Előre kinyert teszt fájl használata: {test_file.name}")
            try:
                with open(test_file, 'r', encoding='utf-8') as f:
                    text = f.read()
                self.logger.info(f"✅ Szöveg betöltve: {len(text)} karakter")
                return text
            except Exception as e:
                self.logger.error(f"❌ Fájl betöltési hiba: {e}")

        # Valódi PDF feldolgozás
        try:
            self.logger.info(f"pdftotext futtatása: {pdf_path.name}")
            result = subprocess.run([
                'pdftotext', '-raw', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                text = result.stdout
                self.logger.info(f"✅ Szöveg kinyerve: {len(text)} karakter")
                return text
            else:
                self.logger.warning(f"⚠️ pdftotext hiba: returncode {result.returncode}")
                return None

        except subprocess.TimeoutExpired:
            self.logger.warning("⚠️ pdftotext timeout (60s)")
            return None
        except Exception as e:
            self.logger.error(f"⚠️ pdftotext egyéb hiba: {e}")
            return None

    def detect_league_from_context(self, context_lines: List[str], team1: str = "", team2: str = "") -> str:
        """Továbbfejlesztett liga felismerés pontossággal"""

        # Összesített kontextus készítése
        full_context = ' '.join(context_lines + [team1, team2]).lower()

        # Liga pontszámok számítása (több találat = magasabb pontszám)
        league_scores = {}

        # Kulcsszavak alapján pontozás
        for league, league_data in self.league_patterns.items():
            score = 0
            keywords = league_data.get('keywords', [])
            teams = league_data.get('teams', [])

            # Kulcsszó találatok
            for keyword in keywords:
                if re.search(keyword, full_context):
                    score += 3  # Kulcsszavak magas pontértéke
                    self.logger.debug(f"Liga kulcsszó találat: {league} ('{keyword}') +3 pont")

            # Csapat találatok
            for team in teams:
                if team.lower() in full_context:
                    score += 1  # Csapatnevek alacsonyabb pontértéke
                    self.logger.debug(f"Liga csapat találat: {league} ('{team}') +1 pont")

            if score > 0:
                league_scores[league] = score

        # Legjobb liga kiválasztása
        if league_scores:
            best_league = max(league_scores.items(), key=lambda x: x[1])
            self.logger.debug(f"Liga döntés: {best_league[0]} ({best_league[1]} pont)")
            return best_league[0]

        return 'Ismeretlen Liga'

    def extract_matches(self, text: str) -> List[Dict]:
        """Továbbfejlesztett meccs kinyerés"""

        matches = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()
            if len(line) < 10:  # Túl rövid sorok kihagyása
                continue

            # Minden match minta kipróbálása
            for pattern in self.match_patterns:
                match = re.search(pattern, line)
                if match:
                    try:
                        groups = match.groups()

                        # Minta alapján feldolgozás
                        if len(groups) >= 2:
                            # Csapat nevek kinyerése
                            if groups[0] and groups[0].endswith('.'):
                                # Számmal kezdődő sor: 1. Team1 - Team2
                                team1 = groups[1] if len(groups) > 1 else ""
                                team2 = groups[2] if len(groups) > 2 else ""
                            elif groups[0] and ':' in groups[0]:
                                # Időpont előre: 19:00 Team1 - Team2
                                team1 = groups[1] if len(groups) > 1 else ""
                                team2 = groups[2] if len(groups) > 2 else ""
                            else:
                                # Normál: Team1 - Team2
                                team1 = groups[0] if len(groups) > 0 else ""
                                team2 = groups[1] if len(groups) > 1 else ""

                            # Csapatnevek tisztítása
                            team1 = self.clean_team_name(team1)
                            team2 = self.clean_team_name(team2)

                            # Validáció
                            if not self.is_valid_team_name(team1) or not self.is_valid_team_name(team2):
                                continue

                            # Kontextus és liga felismerés
                            context_lines = lines[max(0, i-3):i+3]
                            league = self.detect_league_from_context(context_lines, team1, team2)

                            # Match adatok összeállítása
                            match_data = {
                                'home_team': team1,
                                'away_team': team2,
                                'league': league,
                                'status': 'upcoming',
                                'confidence': self.calculate_confidence(line, league, team1, team2),
                                'source_line': line.strip(),
                                'line_number': i + 1
                            }

                            matches.append(match_data)
                            break  # Egy minta talált, tovább a következő sorra

                    except (IndexError, AttributeError) as e:
                        self.logger.debug(f"Minta feldolgozási hiba a {i+1}. sorban: {e}")
                        continue

        # Duplikátumok eltávolítása
        unique_matches = self.remove_duplicate_matches(matches)

        self.logger.info(f"Meccsek kinyerve: {len(unique_matches)} (duplikátumok nélkül {len(matches)} -> {len(unique_matches)})")
        return unique_matches

    def extract_results(self, text: str) -> List[Dict]:
        """Továbbfejlesztett eredmény kinyerés"""

        results = []
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()

            for pattern in self.result_patterns:
                match = re.search(pattern, line)
                if match:
                    try:
                        groups = match.groups()

                        # Különböző minták kezelése
                        if len(groups) == 5:  # Team1 - Team2 1-3
                            team1, team2, score1, score2 = groups[1], groups[2], groups[3], groups[4]
                        elif len(groups) == 6:  # Liga-val: Team1 - Team2 Liga 1-3
                            team1, team2, league_hint, score1, score2 = groups[0], groups[1], groups[2], groups[3], groups[4]
                        elif len(groups) == 4:  # Team1 vs Team2 1:3
                            team1, team2, score1, score2 = groups[0], groups[1], groups[2], groups[3]
                        else:
                            continue

                        # Csapatnevek tisztítása
                        team1 = self.clean_team_name(team1)
                        team2 = self.clean_team_name(team2)

                        # Validáció
                        if not self.is_valid_team_name(team1) or not self.is_valid_team_name(team2):
                            continue

                        # Eredmény validáció
                        try:
                            home_score = int(score1)
                            away_score = int(score2)

                            if home_score < 0 or away_score < 0 or home_score > 20 or away_score > 20:
                                continue
                        except ValueError:
                            continue

                        # Kontextus és liga
                        context_lines = lines[max(0, i-3):i+3]
                        league = self.detect_league_from_context(context_lines, team1, team2)

                        result_data = {
                            'home_team': team1,
                            'away_team': team2,
                            'home_score': home_score,
                            'away_score': away_score,
                            'league': league,
                            'status': 'completed',
                            'confidence': self.calculate_confidence(line, league, team1, team2),
                            'source_line': line.strip(),
                            'line_number': i + 1
                        }

                        results.append(result_data)
                        break

                    except (IndexError, ValueError, AttributeError) as e:
                        self.logger.debug(f"Eredmény feldolgozási hiba a {i+1}. sorban: {e}")
                        continue

        # Duplikátumok eltávolítása
        unique_results = self.remove_duplicate_matches(results)

        self.logger.info(f"Eredmények kinyerve: {len(unique_results)} (duplikátumok nélkül {len(results)} -> {len(unique_results)})")
        return unique_results

    def extract_league_tables(self, text: str) -> List[Dict]:
        """Továbbfejlesztett tabella kinyerés"""

        tables = []
        lines = text.split('\n')
        current_table = None

        for i, line in enumerate(lines):
            line = line.strip()

            for pattern in self.table_patterns:
                match = re.search(pattern, line)
                if match:
                    try:
                        groups = match.groups()

                        if len(groups) >= 9:  # Teljes tabella sor
                            if len(groups) == 9:
                                # Egyszerű: 1. Arsenal 16 14 1 1 40:14 43
                                pos, team, matches, wins, draws, losses, gf, ga, points = groups
                                competition = ""
                            else:
                                # Rövidítéssel: BL 1. Arsenal 16 14 1 1 40:14 43
                                competition, pos, team, matches, wins, draws, losses, gf, ga, points = groups

                            # Csapatnév tisztítása
                            team = self.clean_team_name(team)

                            if not self.is_valid_team_name(team):
                                continue

                            # Új tabella kezdése ha szükséges
                            if current_table is None:
                                context_lines = lines[max(0, i-5):i+5]
                                league = self.detect_league_from_context(context_lines, team, "")

                                current_table = {
                                    'league': league,
                                    'teams': [],
                                    'date': datetime.now().date().isoformat(),  # snapshot_date field
                                    'season': '2024/25',  # Default season
                                    'matchday': None,
                                    'last_updated': datetime.now().isoformat(),
                                    'competition_type': competition if competition else 'regular'
                                }

                            # Csapat adatok
                            team_data = {
                                'team_name': team,  # Changed from 'team' to 'team_name'
                                'position': int(pos),
                                'matches_played': int(matches),
                                'wins': int(wins),
                                'draws': int(draws),
                                'losses': int(losses),
                                'goals_for': int(gf),
                                'goals_against': int(ga),
                                'goal_difference': int(gf) - int(ga),
                                'points': int(points),
                                'competition_status': competition if competition else ''
                            }

                            current_table['teams'].append(team_data)
                            break

                    except (ValueError, IndexError) as e:
                        self.logger.debug(f"Tabella feldolgozási hiba a {i+1}. sorban: {e}")
                        continue

            # Ha nem találunk újabb tabella sort, lezárjuk az aktuálisat
            if current_table and len(current_table['teams']) > 0:
                # Ellenőrizzük, hogy van-e még tabella sor a következő néhány sorban
                found_continuation = False
                for j in range(i+1, min(len(lines), i+5)):
                    for pattern in self.table_patterns:
                        if re.search(pattern, lines[j]):
                            found_continuation = True
                            break
                    if found_continuation:
                        break

                # Ha nincs folytatás és van legalább 3 csapat
                if not found_continuation and len(current_table['teams']) >= 3:
                    tables.append(current_table)
                    current_table = None

        # Utolsó tabella lezárása
        if current_table and len(current_table['teams']) >= 3:
            tables.append(current_table)

        self.logger.info(f"Tabellák kinyerve: {len(tables)}")
        return tables

    def clean_team_name(self, name: str) -> str:
        """Csapatnév tisztítása"""
        if not name:
            return ""

        # Alapvető tisztítás
        name = re.sub(r'\s+', ' ', name.strip())

        # Speciális karakterek eltávolítása
        name = re.sub(r'[^\w\s\.\-]', '', name)

        # Felesleges részek eltávolítása
        name = re.sub(r'\b(FC|CF|AC|SC|United|City|FC)\b\.?', r'\1', name)

        return name.strip()

    def is_valid_team_name(self, name: str) -> bool:
        """Csapatnév validáció"""
        if not name or len(name) < 2:
            return False

        if len(name) > 35:
            return False

        # Csak számok vagy speciális karakterek
        if re.match(r'^[\d\s\.\-]+$', name):
            return False

        # Túl sok szám
        if len(re.findall(r'\d', name)) > len(name) // 2:
            return False

        # Tiltott szavak
        forbidden = ['www', 'http', 'pdf', 'page', 'kínálat', 'tippek', 'fogadás']
        if any(word in name.lower() for word in forbidden):
            return False

        return True

    def calculate_confidence(self, source_line: str, league: str, team1: str, team2: str) -> float:
        """Biztonság számítás"""
        confidence = 0.5  # Alapérték

        # Liga információ növeli
        if league != 'Ismeretlen Liga':
            confidence += 0.2

        # Ismert csapatok növelik
        all_teams = []
        for league_data in self.league_patterns.values():
            all_teams.extend(league_data.get('teams', []))

        if any(team.lower() in team1.lower() for team in all_teams):
            confidence += 0.1
        if any(team.lower() in team2.lower() for team in all_teams):
            confidence += 0.1

        # Sor struktúra alapján
        if '-' in source_line or 'vs' in source_line.lower():
            confidence += 0.1

        # Időpont jelenléte
        if re.search(r'\d{1,2}[:\.]?\d{0,2}', source_line):
            confidence += 0.05

        return min(confidence, 1.0)

    def remove_duplicate_matches(self, matches: List[Dict]) -> List[Dict]:
        """Duplikátumok eltávolítása"""
        seen = set()
        unique_matches = []

        for match in matches:
            # Egyedi kulcs készítése
            key = f"{match['home_team'].lower()}_{match['away_team'].lower()}_{match['league']}"

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Teljes PDF feldolgozás"""
        self.logger.info(f"🔄 PDF feldolgozás kezdése: {pdf_path.name}")

        # Szöveg kinyerés
        text = self.extract_text_with_pdftotext(pdf_path)
        if not text:
            return {
                'success': False,
                'error': 'Szöveg kinyerés sikertelen',
                'pdf_path': str(pdf_path)
            }

        # Adatok kinyerése
        matches = self.extract_matches(text)
        results = self.extract_results(text)
        tables = self.extract_league_tables(text)

        result = {
            'success': True,
            'pdf_path': str(pdf_path),
            'extraction_date': datetime.now().isoformat(),
            'stats': {
                'text_length': len(text),
                'matches_found': len(matches),
                'results_found': len(results),
                'tables_found': len(tables)
            },
            'data': {
                'matches': matches,
                'results': results,
                'tables': tables
            }
        }

        self.logger.info(f"✅ Feldolgozás befejezve: {len(matches)} meccs, {len(results)} eredmény, {len(tables)} tabella")
        return result


def main():
    """Teszt futtatás"""
    processor = EnhancedComprehensivePdfProcessor()

    # Teszt PDF (a /tmp/test_output.txt-et használja)
    test_pdf = Path("/nonexistent/test.pdf")  # Nem létező, mert a test_output.txt-et használjuk

    result = processor.process_pdf(test_pdf)

    if result['success']:
        print("\n🎯 FELDOLGOZÁSI EREDMÉNYEK:")
        print("=" * 50)

        stats = result['stats']
        print(f"📊 Szöveg hossz: {stats['text_length']:,} karakter")
        print(f"⚽ Meccsek: {stats['matches_found']}")
        print(f"🏆 Eredmények: {stats['results_found']}")
        print(f"📋 Tabellák: {stats['tables_found']}")

        # Minta meccsek
        if result['data']['matches']:
            print(f"\n⚽ MINTA MECCSEK:")
            for i, match in enumerate(result['data']['matches'][:5]):
                print(f"  {i+1}. {match['home_team']} - {match['away_team']} ({match['league']}) [biztonság: {match['confidence']:.2f}]")

        # Minta eredmények
        if result['data']['results']:
            print(f"\n🏆 MINTA EREDMÉNYEK:")
            for i, res in enumerate(result['data']['results'][:5]):
                print(f"  {i+1}. {res['home_team']} - {res['away_team']} {res['home_score']}-{res['away_score']} ({res['league']})")

        # Minta tabellák
        if result['data']['tables']:
            print(f"\n📋 MINTA TABELLÁK:")
            for i, table in enumerate(result['data']['tables'][:2]):
                print(f"  Tabella {i+1}: {table['league']} ({len(table['teams'])} csapat)")
                for team in table['teams'][:3]:
                    print(f"    {team['position']}. {team['team_name']} ({team['points']} pont)")

    else:
        print(f"❌ Hiba: {result['error']}")


if __name__ == "__main__":
    main()
