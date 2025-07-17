#!/usr/bin/env python3
"""
FEJLETT TIPPMIX FELDOLGOZÓ v2.0
===============================

Célok:
- Duplikált meccsek TELJES MEGSZÜNTETÉSE
- Pontos liga felismerés kontextus és szabályok alapján
- Fogadási szorzók megfelelő csoportosítása
- Robosztus és skálázható architektúra

Innovációk:
- Match signature alapú duplikáció kezelés
- Multi-pass liga felismerés
- Betting market aggregáció
- Smart confidence scoring
"""

import re
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Set
import json
import logging
from collections import defaultdict
import hashlib

class AdvancedTippmixProcessor:
    """Fejlett tippmix feldolgozó duplikáció-mentes működéssel"""

    def __init__(self):
        self.project_root = Path(__file__).parent

        # Logolás beállítása
        logging.basicConfig(level=logging.DEBUG)
        self.logger = logging.getLogger(__name__)

        # FEJLETT LIGA FELISMERÉSI SZABÁLYOK
        self.league_patterns = {
            'Champions League': {
                'keywords': [r'bajnokok\s+liga', r'\bbl\b', r'champions\s+league', r'uefa.*champions'],
                'team_indicators': ['Real Madrid', 'Barcelona', 'Bayern München', 'Manchester City', 'PSG'],
                'context_words': ['európai', 'bajnokok', 'döntő', 'elődöntő'],
                'priority': 10,
                'confidence_boost': 0.3
            },
            'Europa League': {
                'keywords': [r'europa\s+league', r'european.*league', r'uefa.*europa'],
                'team_indicators': ['Arsenal', 'Tottenham', 'Roma', 'Lazio'],
                'context_words': ['európai', 'európa', 'uefa'],
                'priority': 9,
                'confidence_boost': 0.25
            },
            'Premier League': {
                'keywords': [r'angol.*bajnokság', r'premier\s+league', r'angol.*liga', r'epl'],
                'team_indicators': ['Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham', 'Manchester Utd.', 'Newcastle', 'Aston Villa'],
                'context_words': ['angol', 'england', 'premier'],
                'priority': 8,
                'confidence_boost': 0.2
            },
            'La Liga': {
                'keywords': [r'spanyol.*bajnokság', r'la\s+liga', r'spanyol.*liga', r'primera.*division'],
                'team_indicators': ['Real Madrid', 'Barcelona', 'Atl. Madrid', 'Valencia', 'Sevilla', 'Betis', 'Villarreal'],
                'context_words': ['spanyol', 'spain', 'madrid', 'barcelona'],
                'priority': 8,
                'confidence_boost': 0.2
            },
            'Serie A': {
                'keywords': [r'olasz.*bajnokság', r'serie\s+a', r'olasz.*liga', r'italiana'],
                'team_indicators': ['Juventus', 'Milan', 'Inter', 'Napoli', 'Roma', 'Lazio', 'Fiorentina'],
                'context_words': ['olasz', 'italy', 'milano', 'roma'],
                'priority': 8,
                'confidence_boost': 0.2
            },
            'Bundesliga': {
                'keywords': [r'német.*bajnokság', r'bundesliga', r'német.*liga', r'germany'],
                'team_indicators': ['Bayern München', 'Dortmund', 'RB Leipzig', 'Leverkusen', 'E. Frankfurt', 'Wolfsburg'],
                'context_words': ['német', 'germany', 'münchen', 'berlin'],
                'priority': 8,
                'confidence_boost': 0.2
            },
            'Ligue 1': {
                'keywords': [r'francia.*bajnokság', r'ligue\s+1', r'francia.*liga'],
                'team_indicators': ['PSG', 'Monaco', 'Lyon', 'Marseille', 'Nice', 'Lille'],
                'context_words': ['francia', 'france', 'paris'],
                'priority': 8,
                'confidence_boost': 0.2
            },
            'MLS': {
                'keywords': [r'mls', r'major.*league.*soccer', r'amerikai.*foci'],
                'team_indicators': ['Inter Miami', 'Los Angeles FC', 'Atlanta', 'Seattle', 'Portland', 'New York City'],
                'context_words': ['amerikai', 'usa', 'soccer'],
                'priority': 7,
                'confidence_boost': 0.15
            },
            'Serie A (Brazil)': {
                'keywords': [r'brazil.*bajnokság', r'brasileirao', r'brazil.*serie'],
                'team_indicators': ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Atlético MG', 'Fluminense'],
                'context_words': ['brazil', 'rio', 'são paulo'],
                'priority': 7,
                'confidence_boost': 0.15
            },
            'NB I': {
                'keywords': [r'magyar.*bajnokság', r'nb\s+i', r'otp.*liga', r'mol.*liga'],
                'team_indicators': ['FTC', 'Ferencváros', 'MTK', 'Kecskemét', 'Puskás Akadémia', 'ZTE'],
                'context_words': ['magyar', 'hungary', 'budapest'],
                'priority': 9,  # Magasabb prioritás magyar bajnokságnak
                'confidence_boost': 0.25
            },
            'Válogatott': {
                'keywords': [r'válogatott.*mérkőzés', r'nemzetközi.*mérkőzés', r'nemzetek.*ligája'],
                'team_indicators': ['Magyarország', 'Anglia', 'Franciaország', 'Németország', 'Spanyolország', 'Olaszország'],
                'context_words': ['válogatott', 'nemzetek', 'barátságos'],
                'priority': 6,
                'confidence_boost': 0.1
            }
        }

        # FEJLETT MECCS FELISMERÉSI MINTÁK
        self.match_patterns = [
            # Teljes formátum: P 20:15 07518 Luxemburg - Málta 1,54 3,70 5,25
            r'^([HKPCSV])\s+(\d{1,2}:\d{2})\s+(\d{5,6})\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][^-]+?)\s+[-–]\s+([A-ZaelÁÉÍÓÖŐÚÜŰáéíóöőúüű][^0-9]+?)\s+([\d,\.]+)',

            # Időpont nélkül: 07518 Luxemburg - Málta 1,54 3,70 5,25
            r'^(\d{5,6})\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][^-]+?)\s+[-–]\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][^0-9]+?)\s+([\d,\.]+)',

            # Egyszerű: Csapat1 - Csapat2 odds
            r'^([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s\.]{2,35})\s+[-–]\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s\.]{2,35})\s+([\d,\.]+)',

            # Csak csapatok: Csapat1 - Csapat2
            r'^([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s\.]{2,35})\s+[-–]\s+([A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű\s\.]{2,35})(?=\s|$)'
        ]

        # Liga címek felismerése
        self.league_title_patterns = [
            r'Labdarúgás,\s*([^:]+?)(?:\s*:\s*\d+\.\s*oldal)?$',
            r'^([^,]+bajnokság[^,]*)',
            r'^([^,]+liga[^,]*)',
            r'^([A-Z][a-z]+\s+[A-Z]{1,3}(?:\s+\w+)?)',
            r'^(Premier\s+League|La\s+Liga|Serie\s+A|Bundesliga|Ligue\s+1|MLS)',
            r'Labdarúgás,\s+([^:]+):', # Tippmix specifikus formátum
            r'^([A-Za-z\s]+League):', # League formátumok
            r'^([A-Za-z\s]+Liga):', # Liga formátumok
            r'^(NB\s+I):', # Magyar bajnokság
        ]

        # Match deduplication cache
        self.processed_matches = {}
        self.match_signatures = set()

    def extract_text_with_pdftotext(self, pdf_path: Path) -> Optional[str]:
        """PDF szöveg kinyerése layout megőrzéssel"""
        try:
            self.logger.info(f"PDF feldolgozás: {pdf_path.name}")

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

        except Exception as e:
            self.logger.error(f"⚠️ pdftotext hiba: {e}")
            return None

    def create_match_signature(self, home_team: str, away_team: str, date: str = None) -> str:
        """Egyedi match signature létrehozása duplikáció elkerüléshez"""
        # Csapat nevek normalizálása
        home_norm = self.normalize_team_name(home_team)
        away_norm = self.normalize_team_name(away_team)

        # Konzisztens sorrend (ábécé szerint)
        if home_norm > away_norm:
            home_norm, away_norm = away_norm, home_norm

        # Signature készítése
        signature_string = f"{home_norm}_{away_norm}_{date or ''}"
        return hashlib.md5(signature_string.encode()).hexdigest()[:16]

    def normalize_team_name(self, name: str) -> str:
        """Csapat név normalizálása konzisztens összehasonlításhoz"""
        if not name:
            return ""

        # Alapvető tisztítás
        name = name.strip().lower()
        name = re.sub(r'\s+', ' ', name)

        # Diakritikus jelek eltávolítása és egyszerűsítés
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
            'ú': 'u', 'ü': 'u', 'ű': 'u', 'ç': 'c', 'ñ': 'n'
        }
        for old, new in replacements.items():
            name = name.replace(old, new)

        # Gyakori rövidítések egységesítése
        name = re.sub(r'\bfc\b', 'fc', name)
        name = re.sub(r'\bac\b', 'ac', name)
        name = re.sub(r'\bsc\b', 'sc', name)
        name = re.sub(r'\butd\.?\b', 'utd', name)
        name = re.sub(r'\bcity\b', 'city', name)
        name = re.sub(r'\bunited\b', 'utd', name)

        # Speciális karakterek eltávolítása
        name = re.sub(r'[^\w\s]', '', name)

        return name.strip()

    def detect_league_from_context(self, text_context: str, home_team: str, away_team: str) -> Tuple[str, float]:
        """Liga felismerés kontextus és csapat alapján"""

        best_league = "Ismeretlen Liga"
        best_confidence = 0.0

        # Szöveg előkészítése
        context_lower = text_context.lower()
        teams_text = f"{home_team} {away_team}".lower()

        for league_name, rules in self.league_patterns.items():
            confidence = 0.0

            # Kulcsszó keresés
            for keyword_pattern in rules['keywords']:
                if re.search(keyword_pattern, context_lower, re.IGNORECASE):
                    confidence += 0.4
                    break

            # Csapat indikátor keresés
            team_matches = 0
            for team_indicator in rules.get('team_indicators', []):
                if team_indicator.lower() in teams_text:
                    team_matches += 1

            if team_matches > 0:
                confidence += 0.3 * min(team_matches / 2, 1.0)

            # Kontextus szavak
            context_matches = 0
            for context_word in rules.get('context_words', []):
                if context_word.lower() in context_lower:
                    context_matches += 1

            if context_matches > 0:
                confidence += 0.2 * min(context_matches / 3, 1.0)

            # Prioritás bonus
            confidence += rules.get('confidence_boost', 0.0)

            # Legjobb eredmény kiválasztása
            if confidence > best_confidence:
                best_confidence = confidence
                best_league = league_name

        return best_league, min(best_confidence, 1.0)

    def parse_league_sections(self, text: str) -> List[Dict]:
        """Szöveg felosztása liga szekciókra fejlett logikával"""

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
                    'start_line': i,
                    'context': ' '.join(lines[max(0, i-3):i+4])  # Kontextus tárolása
                }
                self.logger.debug(f"Új liga szekció: {league_name}")

            # Sor hozzáadása az aktuális szekcióhoz
            elif current_section and line:
                current_section['content'].append(line)

        # Utolsó szekció lezárása
        if current_section and current_section['content']:
            sections.append(current_section)

        self.logger.info(f"Összesen {len(sections)} liga szekció található")
        return sections

    def detect_league_title(self, line: str) -> Optional[str]:
        """Liga cím felismerése a sorban"""

        line = line.strip()

        # Üres vagy rövid sorok kihagyása
        if len(line) < 3:
            return None

        # Liga minta keresése
        for pattern in self.league_title_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                title = match.group(1).strip()
                if len(title) > 3:  # Minimum hossz
                    return self.normalize_league_name(title)

        return None

    def normalize_league_name(self, name: str) -> str:
        """Liga név normalizálása"""

        # Alapvető tisztítás
        name = name.strip()
        name = re.sub(r'\s+', ' ', name)

        # Ismert ligák egységesítése
        normalizations = {
            r'angol.*bajnokság|premier.*league': 'Premier League',
            r'spanyol.*bajnokság|la.*liga': 'La Liga',
            r'olasz.*bajnokság|serie.*a': 'Serie A',
            r'német.*bajnokság|bundesliga': 'Bundesliga',
            r'francia.*bajnokság|ligue.*1': 'Ligue 1',
            r'magyar.*bajnokság|nb.*i|otp.*liga': 'NB I',
            r'bajnokok.*liga|champions.*league': 'Champions League',
            r'brasil.*bajnokság|brasileirao': 'Serie A (Brazil)',
            r'mls|major.*league.*soccer': 'MLS'
        }

        for pattern, standard_name in normalizations.items():
            if re.search(pattern, name, re.IGNORECASE):
                return standard_name

        return name

    def extract_matches_from_section(self, section: Dict) -> List[Dict]:
        """Meccsek kinyerése egy liga szekcióból duplikáció-mentesen"""

        matches = []
        league_name = section['league']
        section_context = section.get('context', '')

        self.logger.debug(f"Meccsek keresése: {league_name}")

        for line in section['content']:
            line = line.strip()

            # Meccs minta keresése
            for pattern in self.match_patterns:
                match = re.search(pattern, line)
                if match:
                    extracted_match = self.parse_match_from_regex(match, pattern, line)
                    if extracted_match:
                        # Liga és kontextus hozzáadása
                        extracted_match['league'] = league_name
                        extracted_match['section_context'] = section_context

                        # Liga finomhangolás kontextus alapján
                        refined_league, confidence = self.detect_league_from_context(
                            section_context + " " + line,
                            extracted_match['home_team'],
                            extracted_match['away_team']
                        )

                        if confidence > 0.6:  # Magas bizonyosság esetén felülírjuk
                            extracted_match['league'] = refined_league
                            extracted_match['league_confidence'] = confidence

                        # Duplikáció ellenőrzés
                        signature = self.create_match_signature(
                            extracted_match['home_team'],
                            extracted_match['away_team'],
                            extracted_match.get('date')
                        )

                        self.logger.debug(f"Signature ellenőrzés: {extracted_match['home_team']} - {extracted_match['away_team']} → {signature}")

                        if signature not in self.match_signatures:
                            self.match_signatures.add(signature)
                            extracted_match['signature'] = signature
                            matches.append(extracted_match)
                            self.logger.debug(f"Új meccs: {extracted_match['home_team']} - {extracted_match['away_team']}")
                        else:
                            # Duplikáció esetén csak a fogadási opciókat frissítjük
                            self.update_existing_match_odds_in_list(matches, signature, extracted_match)
                            self.logger.info(f"🔄 DUPLIKÁCIÓ ELKERÜLVE: {extracted_match['home_team']} - {extracted_match['away_team']}")

                    break  # Első találat esetén abbahagyjuk

        self.logger.info(f"Liga '{league_name}': {len(matches)} egyedi meccs találva")
        return matches

    def update_existing_match_odds_in_list(self, matches_list: List[Dict], signature: str, new_match: Dict):
        """Meglévő meccs fogadási opciói frissítése a listában"""

        self.logger.debug(f"Duplikáció keresése signature: {signature} | {len(matches_list)} meccs között")

        # Keressük meg a meglévő meccset a signature alapján
        for existing_match in matches_list:
            if existing_match.get('signature') == signature:
                # Mindenképpen növeljük a változatok számát (még ha nincs is odds)
                existing_match['match_variations'] += 1

                # Fogadási opciókat hozzáadjuk ha vannak
                new_odds = new_match.get('betting_odds', [])
                if new_odds and new_odds[0]:  # Ha van érvényes odds
                    existing_match['betting_odds'].extend(new_odds)
                else:
                    # Ha nincs odds, de van original_line, azt is tároljuk
                    if 'betting_markets' not in existing_match:
                        existing_match['betting_markets'] = []
                    existing_match['betting_markets'].append(new_match.get('original_line', ''))

                self.logger.info(f"✅ Duplikáció frissítve: {existing_match['home_team']} - {existing_match['away_team']} | Új változatok: {existing_match['match_variations']}")
                return

        self.logger.warning(f"⚠️ Nem találtam meglévő meccset signature-hoz: {signature}")

    def update_existing_match_odds(self, signature: str, new_match: Dict):
        """Meglévő meccs fogadási opciói frissítése (deprecated - használjuk az _in_list verziót)"""

        # Keressük meg a meglévő meccset a signature alapján
        for existing_match in self.processed_matches.values():
            if existing_match.get('signature') == signature:
                # Fogadási opciókat hozzáadjuk
                new_odds = new_match.get('betting_odds', [])
                if new_odds:
                    existing_match['betting_odds'].extend(new_odds)
                    existing_match['match_variations'] += 1
                break

    def parse_match_from_regex(self, match, pattern: str, original_line: str) -> Optional[Dict]:
        """Meccs adatok kinyerése regex találatból"""

        try:
            groups = match.groups()

            # Csoport számítás pattern alapján
            if len(groups) >= 5 and pattern.startswith(r'^([HKPCSV])'):
                # Teljes formátum: nap, idő, szám, hazai, vendég, odds
                day, time, number, home, away, odds_start = groups[:6]
                home_team = self.clean_team_name(home)
                away_team = self.clean_team_name(away)
                odds_text = original_line[match.end(5):]

            elif len(groups) >= 4 and pattern.startswith(r'^(\d{5,6})'):
                # Szám nélküli formátum: szám, hazai, vendég, odds
                number, home, away, odds_start = groups[:4]
                home_team = self.clean_team_name(home)
                away_team = self.clean_team_name(away)
                odds_text = original_line[match.end(3):]
                time = None

            elif len(groups) >= 3:
                # Egyszerű formátum: hazai, vendég, odds
                home, away, odds_start = groups[:3]
                home_team = self.clean_team_name(home)
                away_team = self.clean_team_name(away)
                odds_text = original_line[match.end(2):]
                time = None

            else:
                return None

            # Validálás
            if not home_team or not away_team or len(home_team) < 2 or len(away_team) < 2:
                return None

            # Odds feldolgozása
            betting_odds = self.parse_odds(odds_text)

            # Match objektum összeállítása
            match_data = {
                'home_team': home_team,
                'away_team': away_team,
                'time': time if 'time' in locals() else None,
                'betting_odds': [betting_odds] if betting_odds else [],
                'original_line': original_line,
                'confidence': 0.7,  # Alapértelmezett
                'match_variations': 1
            }

            return match_data

        except Exception as e:
            self.logger.warning(f"Meccs feldolgozási hiba: {e} | Sor: {original_line}")
            return None

    def parse_odds(self, odds_string: str) -> Optional[Dict]:
        """Fogadási szorzók kinyerése"""

        if not odds_string:
            return None

        odds = {}

        # Számok keresése (1,23 vagy 1.23 formátumban)
        numbers = re.findall(r'\d+[,\.]\d{2}', odds_string)

        if len(numbers) >= 3:
            try:
                odds['1'] = float(numbers[0].replace(',', '.'))
                odds['X'] = float(numbers[1].replace(',', '.'))
                odds['2'] = float(numbers[2].replace(',', '.'))
                odds['market'] = '1X2'
                return odds
            except ValueError:
                pass

        return None

    def clean_team_name(self, name: str) -> str:
        """Csapat név tisztítása és egységesítése"""
        if not name:
            return ""

        # Alapvető tisztítás
        name = name.strip()
        name = re.sub(r'\s+', ' ', name)

        # Felesleges karakterek eltávolítása
        name = re.sub(r'[^\w\s\.\-áéíóöőúüűÁÉÍÓÖŐÚÜŰ]', '', name)

        # Gyakori rövidítések kezelése
        name = re.sub(r'\bFC\b', 'FC', name)
        name = re.sub(r'\bAC\b', 'AC', name)
        name = re.sub(r'\bSC\b', 'SC', name)

        return name.strip()

    def calculate_match_confidence(self, match: Dict) -> float:
        """Meccs megbízhatóság számítása"""
        confidence = 0.5  # Alapérték

        # Liga ismertség
        league = match.get('league', '')
        if league in self.league_patterns:
            confidence += 0.2
        elif league != 'Ismeretlen Liga':
            confidence += 0.1

        # Csapat nevek minősége
        home_team = match.get('home_team', '')
        away_team = match.get('away_team', '')

        if len(home_team) > 3 and len(away_team) > 3:
            confidence += 0.1

        if len(home_team) > 10 and len(away_team) > 10:
            confidence += 0.1

        # Időpont megléte
        if match.get('time'):
            confidence += 0.1

        # Fogadási szorzók megléte
        if match.get('betting_odds') and len(match['betting_odds']) > 0:
            confidence += 0.1

        # Liga-specifikus bizonyosság
        league_confidence = match.get('league_confidence', 0.0)
        confidence += league_confidence * 0.1

        return min(confidence, 1.0)

    def process_pdf(self, pdf_path: Path) -> Dict:
        """Teljes PDF feldolgozás duplikáció-mentes logikával"""

        self.logger.info(f"🔄 Fejlett feldolgozás kezdése: {pdf_path.name}")

        # Cache törlése
        self.processed_matches = {}
        self.match_signatures = set()

        try:
            # Szöveg kinyerése
            text = self.extract_text_with_pdftotext(pdf_path)
            if not text:
                return {'success': False, 'error': 'Szöveg kinyerés sikertelen'}

            # Liga szekciók elemzése
            sections = self.parse_league_sections(text)

            # Meccsek kinyerése szekciónként
            all_matches = []
            total_betting_options = 0

            for section in sections:
                matches = self.extract_matches_from_section(section)
                all_matches.extend(matches)
                total_betting_options += sum(m.get('match_variations', 1) for m in matches)

            # Konfidencia számítása
            for match in all_matches:
                match['confidence'] = self.calculate_match_confidence(match)

            # Eredmény összeállítása
            result = {
                'success': True,
                'stats': {
                    'text_length': len(text),
                    'league_sections': len(sections),
                    'unique_matches': len(all_matches),
                    'total_betting_options': total_betting_options,
                    'deduplication_ratio': round(total_betting_options / max(len(all_matches), 1), 2),
                    'avg_confidence': round(sum(m['confidence'] for m in all_matches) / max(len(all_matches), 1), 3)
                },
                'data': {
                    'matches': all_matches,
                    'sections': [{'league': s['league'], 'matches': len([m for m in all_matches if m['league'] == s['league']])} for s in sections]
                }
            }

            self.logger.info(f"✅ Feldolgozás sikeres: {len(all_matches)} egyedi meccs, {total_betting_options} fogadási opció")
            self.logger.info(f"📊 Duplikáció arány: {result['stats']['deduplication_ratio']:.2f}x")
            self.logger.info(f"🎯 Átlag bizonyosság: {result['stats']['avg_confidence']:.3f}")

            return result

        except Exception as e:
            self.logger.error(f"❌ Feldolgozási hiba: {e}")
            return {'success': False, 'error': str(e)}


def main():
    """Fejlett tesztelés és kiértékelés"""
    processor = AdvancedTippmixProcessor()

    # Teszt PDF keresése
    archive_path = Path("data/szerencsemix_archive")
    pdf_files = []

    if archive_path.exists():
        pdf_files = list(archive_path.rglob("*.pdf"))

    if not pdf_files:
        print("❌ Nem található PDF fájl a data/szerencsemix_archive mappában")
        return

    # Legfrissebb PDF kiválasztása
    latest_pdf = sorted(pdf_files, key=lambda x: x.stat().st_mtime, reverse=True)[0]

    print(f"\n🚀 FEJLETT TIPPMIX FELDOLGOZÓ TESZT v2.0")
    print(f"=" * 50)
    print(f"📄 Feldolgozandó PDF: {latest_pdf.name}")
    print(f"📂 PDF méret: {latest_pdf.stat().st_size / 1024:.1f} KB")

    # Feldolgozás
    result = processor.process_pdf(latest_pdf)

    if result['success']:
        stats = result['stats']
        print(f"\n✅ FELDOLGOZÁS EREDMÉNYEI:")
        print(f"   📝 Szöveg hossz: {stats['text_length']:,} karakter")
        print(f"   🏆 Liga szekciók: {stats['league_sections']}")
        print(f"   ⚽ Egyedi meccsek: {stats['unique_matches']}")
        print(f"   🎯 Fogadási opciók: {stats['total_betting_options']}")
        print(f"   🔄 Duplikáció arány: {stats['deduplication_ratio']:.2f}x")
        print(f"   📊 Átlag bizonyosság: {stats['avg_confidence']:.3f}")

        # Liga statisztikák
        liga_stats = result['data']['sections']
        if liga_stats:
            print(f"\n🏆 LIGA MEGOSZLÁS:")
            for liga in sorted(liga_stats, key=lambda x: x['matches'], reverse=True)[:10]:
                print(f"   📌 {liga['league']}: {liga['matches']} meccs")

        # Minta meccsek
        matches = result['data']['matches']
        if matches:
            print(f"\n⚽ PÉLDA MECCSEK (top 5):")
            for i, match in enumerate(matches[:5]):
                confidence_emoji = "🟢" if match['confidence'] > 0.8 else "🟡" if match['confidence'] > 0.6 else "🔴"
                print(f"   {i+1}. {confidence_emoji} {match['home_team']} - {match['away_team']}")
                print(f"      🏆 Liga: {match['league']}")
                print(f"      📊 Bizonyosság: {match['confidence']:.3f}")
                print(f"      🎯 Fogadási változatok: {match.get('match_variations', 1)}")
                if match.get('betting_odds'):
                    odds = match['betting_odds'][0]
                    if odds:
                        print(f"      💰 Odds: {odds.get('1', 'N/A')} - {odds.get('X', 'N/A')} - {odds.get('2', 'N/A')}")
                print()

        # Problémás esetek
        low_confidence_matches = [m for m in matches if m['confidence'] < 0.6]
        unknown_league_matches = [m for m in matches if m['league'] == 'Ismeretlen Liga']

        print(f"\n⚠️  FIGYELEM SZÜKSÉGES:")
        print(f"   🔴 Alacsony bizonyosság: {len(low_confidence_matches)} meccs")
        print(f"   ❓ Ismeretlen liga: {len(unknown_league_matches)} meccs")

        if unknown_league_matches:
            print(f"\n❓ ISMERETLEN LIGA MECCSEK (első 3):")
            for match in unknown_league_matches[:3]:
                print(f"   • {match['home_team']} - {match['away_team']}")

    else:
        print(f"❌ HIBA: {result['error']}")

    print(f"\n{'=' * 50}")
    print(f"🏁 Teszt befejezve!")


if __name__ == "__main__":
    main()
