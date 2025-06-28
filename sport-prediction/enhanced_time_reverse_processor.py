#!/usr/bin/env python3
"""
🕒 FORDÍTOTT IDŐRENDI PDF FELDOLGOZÓ
========================================

Célja: A legfrissebb PDF-ektől visszafelé haladva feldolgozni az archívumot
- Jövőbeli meccsek kinyerése (holnapi meccsek listája)
- Történelmi adatok mentése
- Időrendi sorrend: 2025.06.27 → 2019

Készítette: Sport Prediction System
Dátum: 2025-06-28
"""

import os
import sys
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import glob

# Saját modulok importálása
sys.path.append('/home/bandi/Documents/code/2025/sport-prediction')
from szerencsemix_football_extractor import SzerencseMixFootballExtractor

class TimeReverseProcessor:
    def __init__(self):
        self.base_dir = Path('/home/bandi/Documents/code/2025/sport-prediction')
        self.archive_dir = self.base_dir / 'data' / 'szerencsemix_archive' / 'organized'
        self.db_path = self.base_dir / 'data' / 'football_database.db'
        self.extractor = SzerencseMixFootballExtractor()

        # Státusz követés
        self.stats = {
            'processed_files': 0,
            'successful_extractions': 0,
            'failed_extractions': 0,
            'future_matches_found': 0,
            'historical_matches_found': 0,
            'processing_start': datetime.now(),
            'errors': []
        }

        print("🕒 FORDÍTOTT IDŐRENDI FELDOLGOZÓ")
        print("="*50)
        print(f"📁 Archívum: {self.archive_dir}")
        print(f"🗄️ Adatbázis: {self.db_path}")
        print()

    def get_all_pdfs_time_sorted(self):
        """
        Összes PDF fájl lekérése fordított időrendi sorrendben
        Returns: List[tuple] - (pdf_path, extracted_date)
        """
        pdf_files = []

        print("📊 PDF fájlok feltérképezése...")

        # Végigmegyünk az éveken (fordított sorrendben)
        years = sorted([d for d in self.archive_dir.iterdir() if d.is_dir()], reverse=True)

        for year_dir in years:
            year = year_dir.name
            print(f"  📅 {year} feldolgozása...")

            # Hónapok (fordított sorrendben)
            months = sorted([d for d in year_dir.iterdir() if d.is_dir()], reverse=True)

            for month_dir in months:
                month = month_dir.name

                # PDF fájlok a hónapban
                pdf_pattern = month_dir / "*.pdf"
                month_pdfs = glob.glob(str(pdf_pattern))

                for pdf_path in month_pdfs:
                    # Dátum kinyerése a fájlnévből
                    filename = Path(pdf_path).name
                    try:
                        # Példa: Web__51sz__P__06-27_2025.06.27.pdf
                        if '_2025.' in filename:
                            date_part = filename.split('_2025.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2025.{date_part}", "%Y.%m.%d")
                        elif '_2024.' in filename:
                            date_part = filename.split('_2024.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2024.{date_part}", "%Y.%m.%d")
                        elif '_2023.' in filename:
                            date_part = filename.split('_2023.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2023.{date_part}", "%Y.%m.%d")
                        elif '_2022.' in filename:
                            date_part = filename.split('_2022.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2022.{date_part}", "%Y.%m.%d")
                        elif '_2021.' in filename:
                            date_part = filename.split('_2021.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2021.{date_part}", "%Y.%m.%d")
                        elif '_2020.' in filename:
                            date_part = filename.split('_2020.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2020.{date_part}", "%Y.%m.%d")
                        elif '_2019.' in filename:
                            date_part = filename.split('_2019.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2019.{date_part}", "%Y.%m.%d")
                        else:
                            print(f"    ⚠️ Ismeretlen dátum formátum: {filename}")
                            continue

                        pdf_files.append((pdf_path, extracted_date))

                    except Exception as e:
                        print(f"    ❌ Hiba a dátum feldolgozásában ({filename}): {e}")
                        continue

        # Időrendi rendezés (legfrissebb először)
        pdf_files.sort(key=lambda x: x[1], reverse=True)

        print(f"📁 Összesen {len(pdf_files)} PDF fájl található.")
        print()

        return pdf_files

    def process_pdf_for_future_matches(self, pdf_path, pdf_date):
        """
        Egy PDF feldolgozása jövőbeli meccsek keresésére
        """
        try:
            print(f"  ⚡ {Path(pdf_path).name} feldolgozása...")

            # PDF feldolgozás
            result = self.extractor.extract_matches(pdf_path)

            if not result.get('success', False):
                print(f"    ❌ Sikertelen feldolgozás: {result.get('error', 'Ismeretlen hiba')}")
                self.stats['failed_extractions'] += 1
                return None

            matches = result.get('matches', [])
            if not matches:
                print(f"    ⚠️ Nincs meccs találat")
                self.stats['failed_extractions'] += 1
                return None

            print(f"    ✅ {len(matches)} meccs találat")
            self.stats['successful_extractions'] += 1

            # Jövőbeli vs történelmi meccsek szétválasztása
            today = datetime.now().date()
            future_matches = []
            historical_matches = []

            for match in matches:
                match_date_str = match.get('date', '')
                try:
                    match_date = datetime.strptime(match_date_str, '%Y-%m-%d').date()

                    if match_date > today:
                        future_matches.append(match)
                        self.stats['future_matches_found'] += 1
                    else:
                        historical_matches.append(match)
                        self.stats['historical_matches_found'] += 1

                except ValueError:
                    print(f"    ⚠️ Hibás dátum formátum: {match_date_str}")
                    continue

            return {
                'pdf_path': pdf_path,
                'pdf_date': pdf_date,
                'total_matches': len(matches),
                'future_matches': future_matches,
                'historical_matches': historical_matches,
                'extraction_success': True
            }

        except Exception as e:
            print(f"    ❌ Hiba a feldolgozás során: {e}")
            self.stats['errors'].append(f"{Path(pdf_path).name}: {e}")
            self.stats['failed_extractions'] += 1
            return None

    def get_tomorrows_matches(self, limit_pdfs=10):
        """
        Holnapi meccsek listájának létrehozása
        """
        tomorrow = (datetime.now() + timedelta(days=1)).date()
        print(f"🔍 HOLNAPI MECCSEK KERESÉSE ({tomorrow})")
        print("="*50)

        pdf_files = self.get_all_pdfs_time_sorted()
        tomorrows_matches = []
        processed_count = 0

        for pdf_path, pdf_date in pdf_files:
            if processed_count >= limit_pdfs:
                print(f"⏹️ Elérte a limit-et: {limit_pdfs} PDF")
                break

            result = self.process_pdf_for_future_matches(pdf_path, pdf_date)
            processed_count += 1
            self.stats['processed_files'] += 1

            if result and result['future_matches']:
                for match in result['future_matches']:
                    match_date_str = match.get('date', '')
                    try:
                        match_date = datetime.strptime(match_date_str, '%Y-%m-%d').date()
                        if match_date == tomorrow:
                            tomorrows_matches.append({
                                'date': match_date_str,
                                'time': match.get('time', 'N/A'),
                                'home_team': match.get('home_team', 'N/A'),
                                'away_team': match.get('away_team', 'N/A'),
                                'league': match.get('league', 'N/A'),
                                'odds': match.get('odds', {}),
                                'source_pdf': Path(pdf_path).name,
                                'confidence': match.get('confidence', 0.0)
                            })
                    except ValueError:
                        continue

        # Eredmények
        print()
        print(f"🏆 HOLNAPI MECCSEK EREDMÉNYE")
        print("="*40)
        print(f"📅 Holnap dátuma: {tomorrow}")
        print(f"⚽ Találat: {len(tomorrows_matches)} meccs")

        if tomorrows_matches:
            print()
            print("📋 HOLNAPI MECCSEK LISTÁJA:")
            print("-" * 60)
            for i, match in enumerate(tomorrows_matches, 1):
                print(f"{i:2d}. {match['time']:>5} | {match['home_team']:<20} vs {match['away_team']:<20}")
                print(f"     Liga: {match['league']} | Bizonyosság: {match['confidence']:.2f}")
                print(f"     Forrás: {match['source_pdf']}")
                if match['odds']:
                    odds_str = " | ".join([f"{k}: {v}" for k, v in match['odds'].items()])
                    print(f"     Szorzók: {odds_str}")
                print()
        else:
            print("❌ Nincs holnapi meccs találat")

        return tomorrows_matches

    def save_historical_data_sample(self, limit_pdfs=20):
        """
        Történelmi adatok mintája mentése
        """
        print(f"📊 TÖRTÉNELMI ADATOK MINTAVÉTELE")
        print("="*50)

        pdf_files = self.get_all_pdfs_time_sorted()
        all_historical = []
        processed_count = 0

        for pdf_path, pdf_date in pdf_files:
            if processed_count >= limit_pdfs:
                print(f"⏹️ Elérte a limit-et: {limit_pdfs} PDF")
                break

            result = self.process_pdf_for_future_matches(pdf_path, pdf_date)
            processed_count += 1

            if result and result['historical_matches']:
                all_historical.extend(result['historical_matches'])

        # Eredmények mentése JSON fájlba
        output_file = self.base_dir / 'data' / 'historical_sample.json'

        sample_data = {
            'extraction_date': datetime.now().isoformat(),
            'processed_pdfs': processed_count,
            'total_historical_matches': len(all_historical),
            'matches': all_historical[:100]  # Első 100 meccs
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Történelmi adatok mentve: {output_file}")
        print(f"📊 Összesen {len(all_historical)} történelmi meccs feldolgozva")
        print(f"📄 JSON fájlban az első 100 meccs részletei")

        return all_historical

    def print_processing_summary(self):
        """
        Feldolgozási összesítő kiírása
        """
        processing_time = datetime.now() - self.stats['processing_start']

        print()
        print("📋 FELDOLGOZÁSI ÖSSZESÍTŐ")
        print("="*50)
        print(f"⏱️ Feldolgozási idő: {processing_time}")
        print(f"📁 Feldolgozott PDF-ek: {self.stats['processed_files']}")
        print(f"✅ Sikeres kinyerések: {self.stats['successful_extractions']}")
        print(f"❌ Sikertelen kinyerések: {self.stats['failed_extractions']}")
        print(f"🔮 Jövőbeli meccsek: {self.stats['future_matches_found']}")
        print(f"📚 Történelmi meccsek: {self.stats['historical_matches_found']}")

        if self.stats['errors']:
            print()
            print("⚠️ HIBÁK:")
            for error in self.stats['errors'][:5]:  # Első 5 hiba
                print(f"  - {error}")
            if len(self.stats['errors']) > 5:
                print(f"  ... és még {len(self.stats['errors']) - 5} hiba")

def main():
    """
    Fő feldolgozási folyamat
    """
    processor = TimeReverseProcessor()

    try:
        # 1. Holnapi meccsek keresése
        tomorrows_matches = processor.get_tomorrows_matches(limit_pdfs=15)

        # 2. Történelmi adatok mintavétele
        historical_sample = processor.save_historical_data_sample(limit_pdfs=25)

        # 3. Összesítő
        processor.print_processing_summary()

        # 4. Holnapi meccsek JSON mentése
        if tomorrows_matches:
            tomorrow_file = processor.base_dir / 'data' / 'tomorrows_matches.json'
            with open(tomorrow_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'date': (datetime.now() + timedelta(days=1)).date().isoformat(),
                    'extraction_time': datetime.now().isoformat(),
                    'matches_count': len(tomorrows_matches),
                    'matches': tomorrows_matches
                }, f, indent=2, ensure_ascii=False)
            print(f"💾 Holnapi meccsek mentve: {tomorrow_file}")

        print()
        print("🏁 FELDOLGOZÁS BEFEJEZVE!")

    except KeyboardInterrupt:
        print("\n⏹️ Feldolgozás megszakítva!")
        processor.print_processing_summary()
    except Exception as e:
        print(f"\n❌ Kritikus hiba: {e}")
        processor.print_processing_summary()

if __name__ == "__main__":
    main()
