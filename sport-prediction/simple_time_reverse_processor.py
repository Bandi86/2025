#!/usr/bin/env python3
"""
🕒 EGYSZERŰ FORDÍTOTT IDŐRENDI PDF FELDOLGOZÓ
==============================================

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
from real_pdf_processor import RealPdfProcessor

class SimpleTimeReverseProcessor:
    def __init__(self):
        self.base_dir = Path('/home/bandi/Documents/code/2025/sport-prediction')
        self.archive_dir = self.base_dir / 'data' / 'szerencsemix_archive' / 'organized'
        self.db_path = self.base_dir / 'data' / 'football_database.db'
        self.processor = RealPdfProcessor()

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

        print("🕒 EGYSZERŰ FORDÍTOTT IDŐRENDI FELDOLGOZÓ")
        print("="*55)
        print(f"📁 Archívum: {self.archive_dir}")
        print(f"🗄️ Adatbázis: {self.db_path}")
        print()

    def get_recent_pdfs_sorted(self, limit=20):
        """
        Legfrissebb PDF fájlok lekérése fordított időrendi sorrendben
        """
        pdf_files = []

        print("📊 PDF fájlok feltérképezése...")

        # 2025-ös fájlok keresése (legfrissebb először)
        year_2025 = self.archive_dir / '2025'
        if year_2025.exists():
            months = sorted([d for d in year_2025.iterdir() if d.is_dir()], reverse=True)
            for month_dir in months:
                pdf_pattern = month_dir / "*.pdf"
                month_pdfs = sorted(glob.glob(str(pdf_pattern)), reverse=True)

                for pdf_path in month_pdfs:
                    filename = Path(pdf_path).name
                    try:
                        # Dátum kinyerése a fájlnévből
                        if '_2025.' in filename:
                            date_part = filename.split('_2025.')[1].replace('.pdf', '')
                            extracted_date = datetime.strptime(f"2025.{date_part}", "%Y.%m.%d")
                            pdf_files.append((pdf_path, extracted_date))
                    except Exception as e:
                        print(f"    ⚠️ Dátum hiba ({filename}): {e}")
                        continue

        # Időrendi rendezés (legfrissebb először)
        pdf_files.sort(key=lambda x: x[1], reverse=True)

        # Limitálás
        if limit:
            pdf_files = pdf_files[:limit]

        print(f"📁 {len(pdf_files)} legfrissebb PDF fájl kiválasztva.")
        print()

        return pdf_files

    def process_single_pdf(self, pdf_path, pdf_date):
        """
        Egy PDF feldolgozása
        """
        try:
            print(f"  ⚡ {Path(pdf_path).name} feldolgozása...")

            # PDF szöveg kinyerése
            text = self.processor.extract_text_with_pdftotext(Path(pdf_path))

            if not text:
                print(f"    ❌ Szöveg kinyerés sikertelen")
                self.stats['failed_extractions'] += 1
                return None

            # Meccsek felismerése
            pdf_date_str = pdf_date.strftime('%Y-%m-%d')
            matches_result = self.processor.parse_matches_from_text(text, pdf_date_str)

            if not matches_result:
                print(f"    ⚠️ Nincs meccs találat")
                self.stats['failed_extractions'] += 1
                return None

            future_matches = matches_result.get('future_matches', [])
            historical_matches = matches_result.get('historical_matches', [])

            total_matches = len(future_matches) + len(historical_matches)

            if total_matches > 0:
                print(f"    ✅ {total_matches} meccs találat (jövő: {len(future_matches)}, múlt: {len(historical_matches)})")
                self.stats['successful_extractions'] += 1
                self.stats['future_matches_found'] += len(future_matches)
                self.stats['historical_matches_found'] += len(historical_matches)
            else:
                print(f"    ⚠️ Nincs meccs találat")
                self.stats['failed_extractions'] += 1
                return None

            return {
                'pdf_path': pdf_path,
                'pdf_date': pdf_date,
                'total_matches': total_matches,
                'future_matches': future_matches,
                'historical_matches': historical_matches,
                'extraction_success': True
            }

        except Exception as e:
            print(f"    ❌ Hiba a feldolgozás során: {e}")
            self.stats['errors'].append(f"{Path(pdf_path).name}: {e}")
            self.stats['failed_extractions'] += 1
            return None

    def find_tomorrows_matches(self, limit_pdfs=15):
        """
        Holnapi meccsek keresése
        """
        tomorrow = (datetime.now() + timedelta(days=1)).date()
        print(f"🔍 HOLNAPI MECCSEK KERESÉSE ({tomorrow})")
        print("="*50)

        pdf_files = self.get_recent_pdfs_sorted(limit_pdfs)
        tomorrows_matches = []
        processed_count = 0

        for pdf_path, pdf_date in pdf_files:
            result = self.process_single_pdf(pdf_path, pdf_date)
            processed_count += 1
            self.stats['processed_files'] += 1

            if result and result['future_matches']:
                for match in result['future_matches']:
                    match_date_str = match.get('date', '')
                    try:
                        if match_date_str:
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
                                    'confidence': match.get('confidence', 0.0),
                                    'raw_line': match.get('raw_line', '')
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
            print("-" * 70)
            for i, match in enumerate(tomorrows_matches, 1):
                print(f"{i:2d}. {match['time']:>5} | {match['home_team']:<25} vs {match['away_team']:<25}")
                print(f"     Liga: {match['league']} | Bizonyosság: {match['confidence']:.2f}")
                print(f"     Forrás: {match['source_pdf']}")
                if match.get('raw_line'):
                    print(f"     Eredeti: {match['raw_line'][:60]}...")
                print()
        else:
            print("❌ Nincs holnapi meccs találat")

        return tomorrows_matches

    def collect_historical_sample(self, limit_pdfs=25):
        """
        Történelmi adatok mintavételezése
        """
        print(f"📊 TÖRTÉNELMI ADATOK MINTAVÉTELE")
        print("="*50)

        pdf_files = self.get_recent_pdfs_sorted(limit_pdfs)
        all_historical = []
        processed_count = 0

        for pdf_path, pdf_date in pdf_files:
            result = self.process_single_pdf(pdf_path, pdf_date)
            processed_count += 1

            if result and result['historical_matches']:
                for match in result['historical_matches']:
                    match['source_pdf'] = Path(pdf_path).name
                    all_historical.append(match)

        # Eredmények mentése
        output_file = self.base_dir / 'data' / 'historical_sample_simple.json'

        sample_data = {
            'extraction_date': datetime.now().isoformat(),
            'processed_pdfs': processed_count,
            'total_historical_matches': len(all_historical),
            'sample_matches': all_historical[:50]  # Első 50 meccs részletei
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Történelmi adatok mintája mentve: {output_file}")
        print(f"📊 Összesen {len(all_historical)} történelmi meccs feldolgozva")
        print(f"📄 JSON fájlban az első 50 meccs részletei")

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

        success_rate = 0
        if self.stats['processed_files'] > 0:
            success_rate = (self.stats['successful_extractions'] / self.stats['processed_files']) * 100
        print(f"📈 Sikeres feldolgozás aránya: {success_rate:.1f}%")

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
    processor = SimpleTimeReverseProcessor()

    try:
        # 1. Holnapi meccsek keresése
        print("1️⃣ HOLNAPI MECCSEK KERESÉSE")
        tomorrows_matches = processor.find_tomorrows_matches(limit_pdfs=15)

        print()
        print("2️⃣ TÖRTÉNELMI ADATOK MINTAVÉTELE")
        # 2. Történelmi adatok mintavétele
        historical_sample = processor.collect_historical_sample(limit_pdfs=20)

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
