#!/usr/bin/env python3
"""
INTELLIGENS TIPPMIX FELDOLGOZÓ v1.0
==================================

Célok:
- Duplikált meccsek összevonása (egy meccs - több fogadási lehetőség)
- Pontos liga felismerés kontextus alapján
- Fogadási szorzók csoportosítása meccsekhez
- Logikus adatstruktúra kialakítása

Megoldja:
- Liga azonosítás problémáit
- Duplikáció problémákat
- Fogadási adatok kezelését
- PDF formátum komplexitását
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Set
import json
import logging
from collections import defaultdict

class SmartTippmixProcessor:
    """Intelligens tippmix feldolgozó a SzerencseMix PDF-ekhez"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Logolás beállítása
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

        # Liga felismerési minták - még pontosabbak
        self.league_patterns = {
            'Champions League': {
                'keywords': [r'bajnokok\s+liga', r'bl\b', r'champions\s+league', r'europa\s+kupa'],
                'indicators': ['BL-döntő', 'BL', 'Champions League'],
                'priority': 10
            },
            'Premier League': {
                'keywords': [r'angol.*bajnokság', r'premier\s+league', r'angol.*liga'],
                'indicators': ['angol bajnokság', 'Premier League'],
                'priority': 8
            },
            'La Liga': {
                'keywords': [r'spanyol.*bajnokság', r'la\s+liga', r'spanyol.*liga'],
                'indicators': ['spanyol bajnokság', 'La Liga'],
                'priority': 8
            },
            'Serie A': {
                'keywords': [r'olasz.*bajnokság', r'serie\s+a', r'olasz.*liga'],
                'indicators': ['olasz bajnokság', 'Serie A'],
                'priority': 8
            },
            'Bundesliga': {
                'keywords': [r'német.*bajnokság', r'bundesliga', r'német.*liga'],
                'indicators': ['német bajnokság', 'Bundesliga'],
                'priority': 8
            },
            'Brazil Serie A': {
                'keywords': [r'brazil.*bajnokság', r'brasileirao'],
                'indicators': ['Brazil bajnokság'],
                'priority': 7
            },
            'Válogatott': {
                'keywords': [r'válogatott.*mérkőzés', r'nemzetközi'],
                'indicators': ['Válogatott mérkőzés', 'válogatott'],
                'priority': 6
            },
            'NB I': {
                'keywords': [r'magyar.*bajnokság', r'nb\s+i', r'otp.*liga'],
                'indicators': ['magyar bajnokság', 'NB I'],
                'priority': 5
            }
        }

        # Tippmix-specifikus regex minták
        self.match_patterns = [
            # Időpont + sorszám + csapatok + odds formátum
            # P 20:15 07518 Luxemburg - Málta 1,54 3,70 5,25
            r'^([HKPCSV])\s+(\d{1,2}:\d{2})\s+(\d{5,6})\s+([A-Za-z][^-]+?)\s+[-–]\s+([A-Za-z][^0-9]+?)\s+([\d,\.]+)',

            # Sorszám nélkül: Szo 21:00 Manchester City - Internazionale 1,38 4,45 6,25
            r'^(\w{2,3})\s+(\d{1,2}:\d{2})\s+([A-Za-z][^-]+?)\s+[-–]\s+([A-Za-z][^0-9]+?)\s+([\d,\.]+)',

            # Egyszerű: Csapat1 - Csapat2
            r'^([A-Za-z][A-Za-z\s\.]{2,30})\s+[-–]\s+([A-Za-z][A-Za-z\s\.]{2,30})(?=\s|$)'
        ]

        # Liga cím felismerési minták
        self.league_title_patterns = [
            r'Labdarúgás,\s*([^:]+?)(?:\s*:\s*\d+\.\s*oldal)?$',
            r'([A-Za-z][^,]+bajnokság[^,]*)',
            r'([A-Za-z][^,]+liga[^,]*)',
            r'([A-Za-z]+\s+[A-Z]{1,2}(?:\s+\w+)?)'
        ]

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése layout megőrzéssel"""
        try:
            self.logger.info(f"PDF feldolgozás: {pdf_path.name}")

            # Layout megőrzése fontos a tippmix formátumhoz
            result = subprocess.run([
                'pdftotext', '-layout', '-enc', 'UTF-8', str(pdf_path), '-'
            ], capture_output=True, text=True, timeout=120)

            if result.returncode == 0:
                text = result.stdout
                self.logger.info(f"✅ Szöveg kinyerve: {len(text):,} karakter")
                return text
            else:
                self.logger.warning(f"⚠️ pdftotext hiba: {result.stderr}")
                return None

        except subprocess.TimeoutExpired:
            self.logger.warning("⚠️ pdftotext timeout (120s)")
            return None
        except Exception as e:
            self.logger.error(f"⚠️ pdftotext hiba: {e}")
            return None

    def parse_league_sections(self, text: str) -> List[Dict]:
        """Szöveg felosztása liga szekciókra"""

        sections = []
        lines = text.split('\n')
        current_section = None

        for i, line in enumerate(lines):
            line = line.strip()

            # Liga cím keresése
            league_name = self.detect_league_title(line)
            if league_name:
                # Előző szekció lezárása
                if current_section and current_section['content']:
                    sections.append(current_section)

                # Új szekció kezdése
                current_section = {
                    'league': league_name,
                    'content': [],
                    'start_line': i
                }
                self.logger.debug(f"Liga szekció kezdése: {league_name}")
                continue

            # Tartalom hozzáadása aktuális szekcióhoz
            if current_section:
                current_section['content'].append(line)

        # Utolsó szekció lezárása
        if current_section and current_section['content']:
            sections.append(current_section)

        self.logger.info(f"Liga szekciók találva: {len(sections)}")
        return sections

    def detect_league_title(self, line: str) -> Optional[str]:
        """Liga cím felismerése a sorból"""

        # Tippmix specifikus liga címek
        for pattern in self.league_title_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                league_name = match.group(1).strip()
                return self.normalize_league_name(league_name)

        return None

    def normalize_league_name(self, raw_name: str) -> str:
        """Liga név normalizálása"""

        # Tisztítás
        normalized = re.sub(r'\s+', ' ', raw_name.strip())

        # Ismert ligák felismerése
        normalized_lower = normalized.lower()

        for league, data in self.league_patterns.items():
            for keyword in data['keywords']:
                if re.search(keyword, normalized_lower):
                    return league

            for indicator in data.get('indicators', []):
                if indicator.lower() in normalized_lower:
                    return league

        return normalized

    def extract_matches_from_section(self, section: Dict) -> List[Dict]:
        """Meccsek kinyerése egy liga szekcióból"""

        matches = []
        league = section['league']
        lines = section['content']

        # Meccsek csoportosítása (ugyanaz a meccs többféle fogadással)
        match_groups = defaultdict(list)

        for line in lines:
            line = line.strip()
            if len(line) < 10:
                continue

            # Meccs felismerése
            match_data = self.parse_match_line(line, league)
            if match_data:
                # Kulcs a meccs azonosításához
                match_key = f"{match_data['home_team']} vs {match_data['away_team']}"
                match_groups[match_key].append(match_data)

        # Csoportok összevonása
        for match_key, match_list in match_groups.items():
            if not match_list:
                continue

            # Első meccs alapadatai
            base_match = match_list[0]

            # Összes fogadási szorzó összegyűjtése
            all_odds = []
            for match in match_list:
                if match.get('odds'):
                    all_odds.append(match['odds'])

            # Kombinált meccs létrehozása
            combined_match = {
                'home_team': base_match['home_team'],
                'away_team': base_match['away_team'],
                'league': league,
                'date': base_match.get('date'),
                'time': base_match.get('time'),
                'odds_count': len(all_odds),
                'betting_odds': all_odds,
                'match_variations': len(match_list),
                'confidence': self.calculate_match_confidence(base_match, league)
            }

            matches.append(combined_match)

        self.logger.info(f"Liga {league}: {len(matches)} egyedi meccs ({sum(len(group) for group in match_groups.values())} változatból)")
        return matches

    def parse_match_line(self, line: str, league: str) -> Optional[Dict]:
        """Egy sor elemzése meccs adatok kinyerésére"""

        for pattern in self.match_patterns:
            match = re.search(pattern, line)
            if match:
                groups = match.groups()

                # Mintától függő feldolgozás
                if len(groups) >= 6:  # Teljes formátum időponttal + sorszámmal
                    day_code, time, seq_num, home_team, away_team, odds = groups[:6]
                    return {
                        'home_team': self.clean_team_name(home_team),
                        'away_team': self.clean_team_name(away_team),
                        'time': time,
                        'day_code': day_code,
                        'sequence_number': seq_num,
                        'odds': self.parse_odds_from_string(line[match.end():]),
                        'raw_line': line
                    }

                elif len(groups) >= 5:  # Időpont + csapatok + odds
                    day, time, home_team, away_team, odds = groups[:5]
                    return {
                        'home_team': self.clean_team_name(home_team),
                        'away_team': self.clean_team_name(away_team),
                        'time': time,
                        'day_name': day,
                        'odds': self.parse_odds_from_string(line[match.end():]),
                        'raw_line': line
                    }

                elif len(groups) >= 2:  # Csak csapatok
                    home_team, away_team = groups[:2]
                    return {
                        'home_team': self.clean_team_name(home_team),
                        'away_team': self.clean_team_name(away_team),
                        'odds': self.parse_odds_from_string(line[match.end():]),
                        'raw_line': line
                    }

        return None

    def parse_odds_from_string(self, odds_string: str) -> Dict:
        """Fogadási szorzók kinyerése szövegből"""

        odds = {}

        # Alapvető 1X2 szorzók keresése
        numbers = re.findall(r'\d+[,\.]\d{2}', odds_string)

        if len(numbers) >= 3:
            try:
                odds['1'] = float(numbers[0].replace(',', '.'))
                odds['X'] = float(numbers[1].replace(',', '.'))
                odds['2'] = float(numbers[2].replace(',', '.'))
            except ValueError:
                pass

        return odds

    def clean_team_name(self, name: str) -> str:
        """Csapat név tisztítása"""
        if not name:
            return ""

        # Alapvető tisztítás
        name = name.strip()
        name = re.sub(r'\s+', ' ', name)

        # Felesleges karakterek eltávolítása
        name = re.sub(r'[^\w\s\.\-áéíóöőúüű]', '', name)

        return name.strip()

    def calculate_match_confidence(self, match: Dict, league: str) -> float:
        """Meccs konfidencia számítása"""
        confidence = 0.5

        # Liga ismertség
        if league in self.league_patterns:
            confidence += 0.2

        # Csapat nevek hossza
        if len(match['home_team']) > 3 and len(match['away_team']) > 3:
            confidence += 0.1

        # Időpont megléte
        if match.get('time'):
            confidence += 0.1

        # Odds megléte
        if match.get('odds'):
            confidence += 0.1

        return min(confidence, 1.0)

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Teljes PDF feldolgozás"""

        self.logger.info(f"🔄 Intelligens feldolgozás kezdése: {pdf_path.name}")

        try:
            # Szöveg kinyerése
            text = self.extract_text_with_pdftotext(pdf_path)
            if not text:
                return {'success': False, 'error': 'Szöveg kinyerés sikertelen'}

            # Liga szekciók elemzése
            sections = self.parse_league_sections(text)

            # Meccsek kinyerése szekciónként
            all_matches = []
            for section in sections:
                matches = self.extract_matches_from_section(section)
                all_matches.extend(matches)

            # Eredmény összeállítása
            result = {
                'success': True,
                'stats': {
                    'text_length': len(text),
                    'league_sections': len(sections),
                    'unique_matches': len(all_matches),
                    'total_betting_options': sum(m['match_variations'] for m in all_matches)
                },
                'data': {
                    'matches': all_matches,
                    'sections': sections
                }
            }

            self.logger.info(f"✅ Feldolgozás sikeres: {len(all_matches)} egyedi meccs, {len(sections)} liga szekció")
            return result

        except Exception as e:
            self.logger.error(f"❌ Feldolgozási hiba: {e}")
            return {'success': False, 'error': str(e)}


def main():
    """Teszt futtatás"""
    processor = SmartTippmixProcessor()

    # Teszt PDF
    archive_path = Path("data/szerencsemix_archive")
    pdf_files = list(archive_path.rglob("*.pdf"))

    if not pdf_files:
        print("❌ Nem található PDF fájl")
        return

    # Friss PDF kiválasztása
    latest_pdf = sorted(pdf_files, key=lambda x: x.stat().st_mtime, reverse=True)[0]

    print(f"🧪 INTELLIGENS TIPPMIX FELDOLGOZÓ TESZT")
    print(f"📄 Feldolgozandó: {latest_pdf.name}")

    result = processor.process_pdf(latest_pdf)

    if result['success']:
        stats = result['stats']
        print(f"\n✅ EREDMÉNYEK:")
        print(f"   Liga szekciók: {stats['league_sections']}")
        print(f"   Egyedi meccsek: {stats['unique_matches']}")
        print(f"   Összes fogadási opció: {stats['total_betting_options']}")
        print(f"   Duplikáció arány: {stats['total_betting_options']/max(stats['unique_matches'], 1):.1f}x")

        # Minta meccsek
        if result['data']['matches']:
            print(f"\n⚽ MINTA MECCSEK:")
            for i, match in enumerate(result['data']['matches'][:5]):
                print(f"   {i+1}. {match['home_team']} - {match['away_team']}")
                print(f"      Liga: {match['league']}")
                print(f"      Fogadási változatok: {match['match_variations']}")
                if match.get('betting_odds'):
                    print(f"      Odds: {match['betting_odds'][0] if match['betting_odds'] else 'N/A'}")

        # Liga szekciók
        if result['data']['sections']:
            print(f"\n🏆 LIGA SZEKCIÓK:")
            for section in result['data']['sections']:
                print(f"   - {section['league']}")

    else:
        print(f"❌ Hiba: {result['error']}")


if __name__ == "__main__":
    main()
