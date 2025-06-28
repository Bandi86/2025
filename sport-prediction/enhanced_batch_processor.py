#!/usr/bin/env python3
"""
BATCH FELDOLGOZÓ v2.0 - TOVÁBBFEJLESZTETT PDF ELEMZÉSSEL
=========================================================

Továbbfejlesztések:
- Enhanced comprehensive processor integrálása
- Jobb hibakezelés és logging
- Részletes progress jelentések
- Automatikus adatbázis mentés
- Liga és csapat normalizálás

Használat:
    python enhanced_batch_processor.py --batch-size 10 --recent-first
    python enhanced_batch_processor.py --specific-pdf "Web__51sz__P__06-27_2025.06.27.pdf"
    python enhanced_batch_processor.py --test-mode --limit 3

Verzió: 2.0
Dátum: 2025-01-12
"""

import sqlite3
import argparse
import json
import time
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import logging
import traceback

# Relatív importok
from enhanced_comprehensive_processor import EnhancedComprehensivePdfProcessor
from data_loader_pipeline import DatabaseLoader

class EnhancedBatchProcessor:
    """Továbbfejlesztett tömeges PDF feldolgozó"""

    def __init__(self, db_path: str = "data/football_database.db"):
        self.db_path = Path(db_path)
        self.project_root = Path(__file__).parent
        self.pdf_processor = EnhancedComprehensivePdfProcessor()
        self.db_loader = DatabaseLoader(str(self.db_path))

        # Logging beállítása
        self.setup_logging()

        # Statisztikák
        self.stats = {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'matches_extracted': 0,
            'results_extracted': 0,
            'tables_extracted': 0,
            'start_time': None,
            'end_time': None
        }

    def setup_logging(self):
        """Logging konfiguráció"""
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler('enhanced_batch_processing.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def find_all_pdfs(self, archive_path: str = "data/szerencsemix_archive/organized") -> List[Path]:
        """PDF fájlok feltérképezése"""
        archive_path = Path(archive_path)

        if not archive_path.exists():
            self.logger.error(f"Archív könyvtár nem található: {archive_path}")
            return []

        pdf_files = list(archive_path.rglob("*.pdf"))
        self.logger.info(f"PDF fájlok találva: {len(pdf_files)}")

        return pdf_files

    def get_processed_files(self) -> set:
        """Már feldolgozott fájlok lekérdezése"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT pdf_filename FROM extraction_logs WHERE status = 'completed'")
                processed = {row[0] for row in cursor.fetchall()}
                self.logger.info(f"Már feldolgozott fájlok: {len(processed)}")
                return processed
        except Exception as e:
            self.logger.warning(f"Feldolgozott fájlok lekérdezése sikertelen: {e}")
            return set()

    def extract_date_from_filename(self, pdf_path: Path) -> Optional[datetime]:
        """Dátum kinyerése fájlnévből"""
        import re

        # Minta: Web__51sz__P__06-27_2025.06.27.pdf
        patterns = [
            r'(\d{4})\.(\d{2})\.(\d{2})\.pdf$',  # 2025.06.27.pdf
            r'(\d{2})-(\d{2})_(\d{4})',          # 06-27_2025
            r'(\d{4})-(\d{2})-(\d{2})',          # 2025-06-27
        ]

        filename = pdf_path.name

        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                try:
                    if '.' in pattern:  # 2025.06.27 formátum
                        year, month, day = match.groups()
                        return datetime(int(year), int(month), int(day))
                    elif '_' in pattern:  # 06-27_2025 formátum
                        month, day, year = match.groups()
                        return datetime(int(year), int(month), int(day))
                    else:  # 2025-06-27 formátum
                        year, month, day = match.groups()
                        return datetime(int(year), int(month), int(day))
                except ValueError:
                    continue

        return None

    def prioritize_pdfs(self, pdf_files: List[Path], recent_first: bool = True) -> List[Path]:
        """PDF fájlok prioritizálása"""

        # Dátum és fájlnév alapján rendezés
        pdf_with_dates = []

        for pdf_path in pdf_files:
            date = self.extract_date_from_filename(pdf_path)
            pdf_with_dates.append((pdf_path, date))

        # Rendezés
        if recent_first:
            # Legújabb először (None értékek a végére)
            pdf_with_dates.sort(key=lambda x: x[1] if x[1] else datetime.min, reverse=True)
        else:
            # Legrégebbi először
            pdf_with_dates.sort(key=lambda x: x[1] if x[1] else datetime.max)

        sorted_pdfs = [pdf for pdf, _ in pdf_with_dates]

        self.logger.info(f"PDF fájlok priorizálva: {'legújabb' if recent_first else 'legrégebbi'} először")
        return sorted_pdfs

    def process_single_pdf(self, pdf_path: Path) -> Dict:
        """Egyetlen PDF feldolgozása"""
        start_time = time.time()

        try:
            self.logger.info(f"🔄 Feldolgozás kezdése: {pdf_path.name}")

            # PDF elemzés
            result = self.pdf_processor.process_pdf(pdf_path)

            if not result['success']:
                return {
                    'pdf_path': str(pdf_path),
                    'success': False,
                    'error': result.get('error', 'Ismeretlen hiba'),
                    'processing_time': time.time() - start_time
                }

            # Adatok mentése adatbázisba
            save_result = self.save_to_database(pdf_path, result)

            processing_time = time.time() - start_time

            success_result = {
                'pdf_path': str(pdf_path),
                'success': True,
                'stats': result['stats'],
                'database_result': save_result,
                'processing_time': processing_time
            }

            self.logger.info(f"✅ Siker: {pdf_path.name} ({processing_time:.1f}s)")
            return success_result

        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Kivétel: {str(e)}"
            self.logger.error(f"❌ Hiba {pdf_path.name}: {error_msg}")
            self.logger.debug(traceback.format_exc())

            return {
                'pdf_path': str(pdf_path),
                'success': False,
                'error': error_msg,
                'processing_time': processing_time
            }

    def save_to_database(self, pdf_path: Path, extraction_result: Dict) -> Dict:
        """Kinyert adatok mentése adatbázisba"""

        save_stats = {
            'teams_added': 0,
            'matches_added': 0,
            'results_added': 0,
            'tables_added': 0,
            'errors': []
        }

        try:
            data = extraction_result['data']

            # Extraction log létrehozása
            log_id = self.db_loader.log_extraction(
                pdf_filename=pdf_path.name,
                pdf_path=str(pdf_path),
                status='processing'
            )

            # Meccsek mentése
            for match in data['matches']:
                try:
                    # Jövőbeli meccs mentése
                    match_id = self.db_loader.load_future_match(
                        match_data={
                            'home_team': match['home_team'],
                            'away_team': match['away_team'],
                            'match_date': datetime.now().date(),  # Placeholder
                            'league': match['league']
                        },
                        source_pdf=pdf_path.name,
                        confidence=match.get('confidence', 0.5)
                    )

                    if match_id:
                        save_stats['matches_added'] += 1

                except Exception as e:
                    save_stats['errors'].append(f"Meccs mentési hiba: {e}")

            # Eredmények mentése
            for result in data['results']:
                try:
                    # Történelmi meccs mentése
                    match_id = self.db_loader.load_historical_match(
                        match_data={
                            'home_team': result['home_team'],
                            'away_team': result['away_team'],
                            'match_date': datetime.now().date(),  # Placeholder
                            'home_score': result['home_score'],
                            'away_score': result['away_score'],
                            'league': result['league']
                        },
                        source_pdf=pdf_path.name,
                        confidence=result.get('confidence', 0.5)
                    )

                    if match_id:
                        save_stats['results_added'] += 1

                except Exception as e:
                    save_stats['errors'].append(f"Eredmény mentési hiba: {e}")

            # Tabellák mentése
            for table in data['tables']:
                try:
                    success = self.db_loader.load_league_table(
                        table_data=table,
                        source_pdf=pdf_path.name,
                        confidence=0.8  # Tabellák általában megbízhatóak
                    )

                    if success:
                        save_stats['tables_added'] += 1

                except Exception as e:
                    save_stats['errors'].append(f"Tabella mentési hiba: {e}")

            # Extraction log frissítése
            self.db_loader.update_extraction_log(
                log_id=log_id,
                status='completed',
                stats={
                    'matches_found': len(data['matches']),
                    'tables_found': len(data['tables']),
                    'avg_confidence': sum(m.get('confidence', 0.5) for m in data['matches']) / max(len(data['matches']), 1)
                }
            )

        except Exception as e:
            save_stats['errors'].append(f"Adatbázis mentési fő hiba: {e}")

        return save_stats

    def process_batch(self, pdf_files: List[Path], max_workers: int = 2) -> Dict:
        """Batch feldolgozás"""

        self.stats['start_time'] = datetime.now()
        self.logger.info(f"📦 Batch feldolgozás kezdése: {len(pdf_files)} fájl, {max_workers} worker")

        results = []

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Feladatok beküldése
            future_to_pdf = {
                executor.submit(self.process_single_pdf, pdf): pdf
                for pdf in pdf_files
            }

            # Eredmények gyűjtése
            for future in as_completed(future_to_pdf):
                pdf = future_to_pdf[future]

                try:
                    result = future.result()
                    results.append(result)

                    # Statisztikák frissítése
                    self.stats['processed'] += 1
                    if result['success']:
                        self.stats['successful'] += 1
                        if 'stats' in result:
                            self.stats['matches_extracted'] += result['stats'].get('matches_found', 0)
                            self.stats['results_extracted'] += result['stats'].get('results_found', 0)
                            self.stats['tables_extracted'] += result['stats'].get('tables_found', 0)
                    else:
                        self.stats['failed'] += 1

                    # Progress jelentés
                    progress = (self.stats['processed'] / len(pdf_files)) * 100
                    self.logger.info(f"📊 Progress: {progress:.1f}% ({self.stats['processed']}/{len(pdf_files)})")

                except Exception as e:
                    self.logger.error(f"Future eredmény hiba {pdf.name}: {e}")
                    self.stats['failed'] += 1

        self.stats['end_time'] = datetime.now()

        # Összegző jelentés
        return {
            'results': results,
            'stats': self.stats.copy()
        }

    def generate_report(self, batch_result: Dict) -> str:
        """Részletes jelentés generálása"""

        stats = batch_result['stats']
        results = batch_result['results']

        duration = stats['end_time'] - stats['start_time']

        report = f"""
TOVÁBBFEJLESZTETT BATCH FELDOLGOZÁSI JELENTÉS
============================================

🕐 Időtartam: {duration}
📊 Összesen feldolgozva: {stats['processed']} fájl
✅ Sikeres: {stats['successful']} fájl
❌ Sikertelen: {stats['failed']} fájl
📈 Sikerességi arány: {(stats['successful']/max(stats['processed'],1)*100):.1f}%

📋 KINYERT ADATOK:
⚽ Meccsek: {stats['matches_extracted']}
🏆 Eredmények: {stats['results_extracted']}
📊 Tabellák: {stats['tables_extracted']}

⏱️ TELJESÍTMÉNY:
🔄 Átlag feldolgozási idő: {sum(r.get('processing_time', 0) for r in results) / max(len(results), 1):.1f}s/fájl
🚀 Throughput: {stats['processed'] / max(duration.total_seconds(), 1):.2f} fájl/perc

🚨 HIBÁK:
"""

        # Hibaanalízis
        error_summary = {}
        for result in results:
            if not result['success']:
                error = result.get('error', 'Ismeretlen hiba')
                error_type = error.split(':')[0] if ':' in error else error
                error_summary[error_type] = error_summary.get(error_type, 0) + 1

        for error_type, count in error_summary.items():
            report += f"   {error_type}: {count}x\n"

        if not error_summary:
            report += "   Nincsenek hibák! 🎉\n"

        # Top teljesítmény
        successful_results = [r for r in results if r['success']]
        if successful_results:
            # Legtöbb meccs
            top_matches = max(successful_results, key=lambda x: x.get('stats', {}).get('matches_found', 0))
            report += f"\n🏆 Legtöbb meccs: {Path(top_matches['pdf_path']).name} ({top_matches.get('stats', {}).get('matches_found', 0)} meccs)"

            # Leggyorsabb
            fastest = min(successful_results, key=lambda x: x.get('processing_time', float('inf')))
            report += f"\n⚡ Leggyorsabb: {Path(fastest['pdf_path']).name} ({fastest.get('processing_time', 0):.1f}s)"

        return report


def main():
    """Főprogram"""
    parser = argparse.ArgumentParser(description='Továbbfejlesztett Szerencsemix PDF batch feldolgozó')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch méret')
    parser.add_argument('--max-workers', type=int, default=2, help='Worker szálak száma')
    parser.add_argument('--recent-first', action='store_true', help='Legújabb fájlok először')
    parser.add_argument('--limit', type=int, help='Maximum fájlok száma')
    parser.add_argument('--specific-pdf', type=str, help='Specifikus PDF fájlnév')
    parser.add_argument('--test-mode', action='store_true', help='Teszt mód (kis batch)')
    parser.add_argument('--archive-path', type=str, default='data/szerencsemix_archive/organized', help='PDF archív elérési út')

    args = parser.parse_args()

    # Batch processor létrehozása
    processor = EnhancedBatchProcessor()

    # PDF fájlok keresése
    all_pdfs = processor.find_all_pdfs(args.archive_path)
    if not all_pdfs:
        print("❌ Nincsenek PDF fájlok!")
        return

    # Specifikus PDF
    if args.specific_pdf:
        specific_pdfs = [pdf for pdf in all_pdfs if args.specific_pdf in pdf.name]
        if not specific_pdfs:
            print(f"❌ Nem található PDF: {args.specific_pdf}")
            return
        pdf_files = specific_pdfs
    else:
        # Már feldolgozott fájlok kihagyása
        processed_files = processor.get_processed_files()
        pdf_files = [pdf for pdf in all_pdfs if pdf.name not in processed_files]

        # Prioritizálás
        pdf_files = processor.prioritize_pdfs(pdf_files, args.recent_first)

    # Limit alkalmazása
    if args.test_mode:
        pdf_files = pdf_files[:3]
    elif args.limit:
        pdf_files = pdf_files[:args.limit]
    elif args.batch_size:
        pdf_files = pdf_files[:args.batch_size]

    print(f"📦 Feldolgozásra váró fájlok: {len(pdf_files)}")

    if not pdf_files:
        print("✅ Minden fájl fel van dolgozva!")
        return

    # Batch feldolgozás
    batch_result = processor.process_batch(pdf_files, args.max_workers)

    # Jelentés
    report = processor.generate_report(batch_result)
    print(report)

    # Jelentés mentése
    report_file = f"enhanced_batch_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)

    print(f"\n📋 Részletes jelentés mentve: {report_file}")


if __name__ == "__main__":
    main()
