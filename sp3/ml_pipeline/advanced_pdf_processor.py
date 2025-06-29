import PyPDF2
import pdfplumber
import pandas as pd
import re
import json
from datetime import datetime
import os

class AdvancedPDFProcessor:
    """
    Fejlett PDF feldolgozó futball meccsek és odds-ok kinyeréséhez
    """

    def __init__(self):
        self.matches = []
        self.debug_output = []

    def extract_text_from_pdf(self, pdf_path, method='pdfplumber'):
        """PDF szöveg kinyerése különböző módszerekkel"""
        print(f"📄 PDF szöveg kinyerése: {method}")

        if method == 'pdfplumber':
            return self._extract_with_pdfplumber(pdf_path)
        elif method == 'pypdf2':
            return self._extract_with_pypdf2(pdf_path)
        else:
            raise ValueError("Ismeretlen módszer")

    def _extract_with_pdfplumber(self, pdf_path):
        """PDFplumber használata (általában pontosabb)"""
        text_content = ""

        try:
            with pdfplumber.open(pdf_path) as pdf:
                print(f"📊 PDF oldalak száma: {len(pdf.pages)}")

                for page_num, page in enumerate(pdf.pages):
                    print(f"🔍 Oldal {page_num + 1} feldolgozása...")

                    # Szöveg kinyerése
                    page_text = page.extract_text()
                    if page_text:
                        text_content += f"\\n=== OLDAL {page_num + 1} ===\\n"
                        text_content += page_text
                        text_content += "\\n\\n"

                    # Táblázatok kinyerése is
                    tables = page.extract_tables()
                    if tables:
                        print(f"📋 {len(tables)} táblázat találva az oldalon")
                        for table_idx, table in enumerate(tables):
                            text_content += f"\\n=== TÁBLÁZAT {table_idx + 1} ===\\n"
                            for row in table:
                                if row:
                                    text_content += " | ".join([str(cell) if cell else "" for cell in row]) + "\\n"

        except Exception as e:
            print(f"❌ PDFplumber hiba: {e}")
            return None

        return text_content

    def _extract_with_pypdf2(self, pdf_path):
        """PyPDF2 használata (backup módszer)"""
        text_content = ""

        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                print(f"📊 PDF oldalak száma: {len(pdf_reader.pages)}")

                for page_num, page in enumerate(pdf_reader.pages):
                    print(f"🔍 Oldal {page_num + 1} feldolgozása...")
                    page_text = page.extract_text()

                    if page_text:
                        text_content += f"\\n=== OLDAL {page_num + 1} ===\\n"
                        text_content += page_text
                        text_content += "\\n\\n"

        except Exception as e:
            print(f"❌ PyPDF2 hiba: {e}")
            return None

        return text_content

    def save_extracted_text(self, text_content, output_file):
        """Kinyert szöveg mentése fájlba vizsgálat céljából"""
        print(f"💾 Szöveg mentése: {output_file}")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(text_content)

        print(f"✅ Szöveg elmentve: {len(text_content)} karakter")

    def analyze_text_structure(self, text_content):
        """Szöveg struktúra elemzése a pattern felismeréséhez"""
        print("🔍 Szöveg struktúra elemzése...")

        lines = text_content.split('\\n')

        # Statisztikák
        total_lines = len(lines)
        non_empty_lines = [line for line in lines if line.strip()]

        print(f"📊 Összes sor: {total_lines}")
        print(f"📊 Nem üres sorok: {len(non_empty_lines)}")

        # Mintakeresés
        date_patterns = []
        time_patterns = []
        odds_patterns = []
        team_patterns = []

        for line in non_empty_lines[:50]:  # Első 50 sor elemzése
            line = line.strip()

            # Dátum minták
            if re.search(r'\\d{4}\\.\\s*(január|február|március|április|május|június|július|augusztus|szeptember|október|november|december)', line):
                date_patterns.append(line)

            # Idő minták
            if re.search(r'\\d{1,2}:\\d{2}', line):
                time_patterns.append(line)

            # Odds minták (pl. 1,85 formátum)
            if re.search(r'\\d{1,2},\\d{2}', line):
                odds_patterns.append(line)

            # Csapat minták (vs, -, között szavak)
            if any(sep in line for sep in [' - ', ' vs ', ' : ']):
                team_patterns.append(line)

        # Eredmények kiírása
        if date_patterns:
            print("📅 Dátum minták:")
            for pattern in date_patterns[:5]:
                print(f"  • {pattern}")

        if time_patterns:
            print("⏰ Idő minták:")
            for pattern in time_patterns[:5]:
                print(f"  • {pattern}")

        if odds_patterns:
            print("💰 Odds minták:")
            for pattern in odds_patterns[:5]:
                print(f"  • {pattern}")

        if team_patterns:
            print("⚽ Csapat minták:")
            for pattern in team_patterns[:5]:
                print(f"  • {pattern}")

        return {
            'total_lines': total_lines,
            'non_empty_lines': len(non_empty_lines),
            'date_patterns': date_patterns,
            'time_patterns': time_patterns,
            'odds_patterns': odds_patterns,
            'team_patterns': team_patterns
        }

    def extract_matches_advanced(self, text_content):
        """Fejlett meccs kinyerés Tippmix PDF struktúra alapján"""
        print("⚽ Meccsek kinyerése fejlett módszerrel...")

        lines = text_content.split('\\n')
        matches = []

        # Tippmix specifikus regex minták
        # Formátum: P 12:30 05336 Daejeon Citizen - Jeju 2,04 3,30 3,15
        tippmix_pattern = re.compile(r'^P\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.+?)\s+-\s+(.+?)\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})\s*$')

        # Alternatív pattern: P 12:30 05336 Daejeon Citizen - Jeju (csak csapat nevek, odds később)
        tippmix_basic_pattern = re.compile(r'^P\s+(\d{1,2}:\d{2})\s+(\d+)\s+(.+?)\s+-\s+(.+?)\s*$')

        # Odds pattern külön sorokhoz
        odds_pattern = re.compile(r'^(\d{1,2},\d{2})\s+(\d{1,2},\d{2})\s+(\d{1,2},\d{2})\s*$')

        # Dátum keresés
        date_pattern = re.compile(r'(\d{4}\.\s*\w+\s*\d{1,2})|Péntek \((\d{4}\.\s*\w+\s*\d{1,2})\)')

        current_date = "2025. június 27."  # Default a PDF-ből
        current_league = None

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            # Dátum keresése
            date_match = date_pattern.search(line)
            if date_match:
                current_date = date_match.group(1) or date_match.group(2)
                print(f"📅 Dátum találva: {current_date}")
                i += 1
                continue

            # Liga/verseny keresése (pl. "Labdarúgás, Dél-koreai bajnokság")
            if "Labdarúgás," in line:
                current_league = line
                print(f"🏆 Liga: {current_league}")
                i += 1
                continue

            # Teljes meccs + odds egy sorban
            full_match = tippmix_pattern.match(line)
            if full_match:
                time_str = full_match.group(1)
                match_id = full_match.group(2)
                home_team = full_match.group(3).strip()
                away_team = full_match.group(4).strip()
                odds_home = full_match.group(5)
                odds_draw = full_match.group(6)
                odds_away = full_match.group(7)

                match_data = {
                    'line_number': i,
                    'date': current_date,
                    'time': time_str,
                    'match_id': match_id,
                    'home_team': home_team,
                    'away_team': away_team,
                    'odds_home': float(odds_home.replace(',', '.')),
                    'odds_draw': float(odds_draw.replace(',', '.')),
                    'odds_away': float(odds_away.replace(',', '.')),
                    'league': current_league,
                    'raw_line': line,
                    'bet_type': '1X2'
                }

                matches.append(match_data)
                print(f"⚽ {home_team} vs {away_team} | {time_str} | {odds_home}-{odds_draw}-{odds_away}")
                i += 1
                continue

            # Csak csapat nevek (odds külön sorban)
            basic_match = tippmix_basic_pattern.match(line)
            if basic_match:
                time_str = basic_match.group(1)
                match_id = basic_match.group(2)
                home_team = basic_match.group(3).strip()
                away_team = basic_match.group(4).strip()

                # Következő sorok keresése odds-okért
                odds_home = odds_draw = odds_away = None
                j = i + 1
                while j < min(i + 5, len(lines)):  # Maximum 5 sort néz előre
                    next_line = lines[j].strip()
                    odds_match = odds_pattern.match(next_line)
                    if odds_match:
                        odds_home = odds_match.group(1)
                        odds_draw = odds_match.group(2)
                        odds_away = odds_match.group(3)
                        break
                    j += 1

                match_data = {
                    'line_number': i,
                    'date': current_date,
                    'time': time_str,
                    'match_id': match_id,
                    'home_team': home_team,
                    'away_team': away_team,
                    'odds_home': float(odds_home.replace(',', '.')) if odds_home else None,
                    'odds_draw': float(odds_draw.replace(',', '.')) if odds_draw else None,
                    'odds_away': float(odds_away.replace(',', '.')) if odds_away else None,
                    'league': current_league,
                    'raw_line': line,
                    'bet_type': '1X2'
                }

                matches.append(match_data)
                print(f"⚽ {home_team} vs {away_team} | {time_str} | {odds_home or 'N/A'}-{odds_draw or 'N/A'}-{odds_away or 'N/A'}")
                i += 1
                continue

            i += 1

        print(f"✅ {len(matches)} meccs találva")
        return matches

    def extract_matches_basic(self, text_content):
        """Alapvető meccs kinyerés (fallback)"""
        print("⚽ Meccsek kinyerése alapvető módszerrel (fallback)...")

        lines = text_content.split('\\n')
        matches = []

        # Egyszerű regex minták
        team_pattern = re.compile(r'(.+?)\s*[-–]\s*(.+)')
        odds_pattern = re.compile(r'(\d{1,2},\d{2})')
        time_pattern = re.compile(r'(\d{1,2}:\d{2})')
        date_pattern = re.compile(r'(\d{4}\.\s*\w+\s*\d{1,2})')

        current_date = None

        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Dátum keresése
            date_match = date_pattern.search(line)
            if date_match:
                current_date = date_match.group(1)
                print(f"📅 Dátum találva: {current_date}")
                continue

            # Csapat nevek keresése
            team_match = team_pattern.search(line)
            if team_match:
                home_team = team_match.group(1).strip()
                away_team = team_match.group(2).strip()

                # Idő keresése a sorban vagy környéken
                time_match = time_pattern.search(line)
                match_time = time_match.group(1) if time_match else "TBD"

                # Odds keresése a sorban
                odds_matches = odds_pattern.findall(line)

                match_data = {
                    'line_number': line_num,
                    'date': current_date,
                    'time': match_time,
                    'home_team': home_team,
                    'away_team': away_team,
                    'raw_line': line,
                    'odds_found': odds_matches
                }

                matches.append(match_data)
                print(f"⚽ Meccs: {home_team} vs {away_team} | {match_time} | Odds: {odds_matches}")

        print(f"✅ {len(matches)} meccs találva")
        return matches

    def save_matches_to_json(self, matches, output_file):
        """Meccsek mentése JSON fájlba"""
        print(f"💾 Meccsek mentése: {output_file}")

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(matches, f, indent=2, ensure_ascii=False)

        print(f"✅ {len(matches)} meccs elmentve")

    def save_matches_to_csv(self, matches, output_file):
        """Meccsek mentése CSV fájlba"""
        print(f"💾 Meccsek mentése CSV-be: {output_file}")

        df = pd.DataFrame(matches)
        df.to_csv(output_file, index=False, encoding='utf-8')

        print(f"✅ {len(matches)} meccs elmentve CSV-be")

    def validate_and_filter_matches(self, matches):
        """Meccsek validálása és szűrése"""
        print("🔍 Meccsek validálása és szűrése...")

        valid_matches = []

        for match in matches:
            # Alapvető validáció
            if not match.get('home_team') or not match.get('away_team'):
                continue

            # Csapat nevek tisztítása
            home_team = match['home_team'].strip()
            away_team = match['away_team'].strip()

            # Túl rövid vagy túl hosszú nevek kiszűrése
            if len(home_team) < 2 or len(away_team) < 2:
                continue
            if len(home_team) > 50 or len(away_team) > 50:
                continue

            # Speciális karakterek kiszűrése
            if any(char in home_team + away_team for char in ['|', '=', '+', '*']):
                continue

            # Odds validáció (ha van)
            if match.get('odds_home') is not None:
                try:
                    home_odds = float(match['odds_home']) if isinstance(match['odds_home'], str) else match['odds_home']
                    draw_odds = float(match['odds_draw']) if isinstance(match['odds_draw'], str) else match['odds_draw']
                    away_odds = float(match['odds_away']) if isinstance(match['odds_away'], str) else match['odds_away']

                    # Reális odds tartomány (1.00 - 50.00)
                    if not (1.0 <= home_odds <= 50.0 and 1.0 <= draw_odds <= 50.0 and 1.0 <= away_odds <= 50.0):
                        continue

                    match['odds_home'] = home_odds
                    match['odds_draw'] = draw_odds
                    match['odds_away'] = away_odds
                except (ValueError, TypeError):
                    # Ha odds hibás, nullázzuk
                    match['odds_home'] = None
                    match['odds_draw'] = None
                    match['odds_away'] = None

            # Frissített adatok
            match['home_team'] = home_team
            match['away_team'] = away_team

            valid_matches.append(match)

        print(f"✅ {len(valid_matches)}/{len(matches)} meccs validálva")
        return valid_matches

    def convert_to_ml_format(self, matches):
        """Konvertálás ML pipeline-hoz"""
        print("🔄 Konvertálás ML formátumra...")

        ml_matches = []

        for match in matches:
            # Csak 1X2 odds-okkal rendelkező meccsek
            if match.get('odds_home') and match.get('odds_draw') and match.get('odds_away'):
                ml_match = {
                    'date': match.get('date', '2025-06-27'),
                    'time': match.get('time', '00:00'),
                    'home_team': match['home_team'],
                    'away_team': match['away_team'],
                    'league': match.get('league', 'Unknown'),
                    'season': '2025',
                    'home_odds': match['odds_home'],
                    'draw_odds': match['odds_draw'],
                    'away_odds': match['odds_away'],
                    'source': 'Tippmix PDF',
                    'match_id': match.get('match_id', f"pdf_{match.get('line_number', 0)}")
                }
                ml_matches.append(ml_match)

        print(f"✅ {len(ml_matches)} meccs ML formátumra konvertálva")
        return ml_matches

def main():
    """PDF feldolgozás tesztelése"""
    pdf_path = '/home/bandi/Documents/code/2025/sp3/pdf/Web__51sz__P__06-27_2025.06.27.pdf'

    if not os.path.exists(pdf_path):
        print(f"❌ PDF fájl nem található: {pdf_path}")
        return

    processor = AdvancedPDFProcessor()

    print("🚀 FEJLETT PDF FELDOLGOZÓ TESZT")
    print("=" * 50)

    # 1. Szöveg kinyerése PDFplumber-rel
    print("\\n1️⃣ SZÖVEG KINYERÉSE (PDFplumber)")
    text_content = processor.extract_text_from_pdf(pdf_path, method='pdfplumber')

    if text_content:
        # Szöveg mentése
        processor.save_extracted_text(text_content, 'extracted_text_pdfplumber.txt')

        # Struktúra elemzése
        print("\\n2️⃣ STRUKTÚRA ELEMZÉSE")
        analysis = processor.analyze_text_structure(text_content)

        # Meccsek kinyerése
        print("\\n3️⃣ MECCSEK KINYERÉSE (FEJLETT)")
        matches = processor.extract_matches_advanced(text_content)

        # Ha a fejlett nem talál semmit, próbáljuk az alapvetőt
        if not matches:
            print("\\n🔄 FALLBACK: ALAPVETŐ KINYERÉS")
            matches = processor.extract_matches_basic(text_content)

        if matches:
            # Validálás és szűrés
            print("\\n4️⃣ VALIDÁLÁS ÉS SZŰRÉS")
            validated_matches = processor.validate_and_filter_matches(matches)

            # ML formátumra konvertálás
            print("\\n5️⃣ ML FORMÁTUM KONVERTÁLÁS")
            ml_matches = processor.convert_to_ml_format(validated_matches)

            # Mentés JSON és CSV formátumban
            processor.save_matches_to_json(validated_matches, 'extracted_matches.json')
            processor.save_matches_to_csv(validated_matches, 'extracted_matches.csv')

            # ML formátum mentése
            if ml_matches:
                processor.save_matches_to_json(ml_matches, 'ml_matches.json')
                processor.save_matches_to_csv(ml_matches, 'ml_matches.csv')
                print(f"📊 ML adatok: ml_matches.json, ml_matches.csv")

            print("\\n✅ TESZT BEFEJEZVE")
            print(f"📄 Szöveg: extracted_text_pdfplumber.txt")
            print(f"📊 Nyers: extracted_matches.json/.csv")
            print(f"🤖 ML: ml_matches.json/.csv ({len(ml_matches)} meccs)")
        else:
            print("❌ Nincs találat a fejlett kinyeréssel")

    # 2. Backup: PyPDF2 próbálkozás
    print("\\n4️⃣ BACKUP TESZT (PyPDF2)")
    backup_text = processor.extract_text_from_pdf(pdf_path, method='pypdf2')

    if backup_text:
        processor.save_extracted_text(backup_text, 'extracted_text_pypdf2.txt')
        print("📄 Backup szöveg: extracted_text_pypdf2.txt")

if __name__ == "__main__":
    main()
