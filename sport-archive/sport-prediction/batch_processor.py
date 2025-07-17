#!/usr/bin/env python3
"""
SZERENCSEMIX TÖMEGES PDF FELDOLGOZÓ
==================================

Célja: A teljes PDF archívum feldolgozása nagy mennyiségben,
robusztus hibakezeléssel és haladás követéssel.

Funkciók:
1. Teljes archívum feltérképezése és prioritási sorba rendezése
2. Batch feldolgozás hibakezeléssel és újrapróbálkozással
3. Folyamat követés és jelentés készítés
4. Automatikus adatminőség ellenőrzés
5. Leállítható és folytatható feldolgozás

Használat:
    python batch_processor.py --batch-size 50 --max-workers 4
    python batch_processor.py --resume --from-date 2024-01-01
    python batch_processor.py --priority recent --limit 100

Verzió: 1.0
Dátum: 2025-06-28
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
from dataclasses import dataclass, asdict
import re
import logging

# Relatív importok
from real_pdf_processor import RealPdfProcessor
from data_cleaner import SzerencseMixDataCleaner
from data_loader_pipeline import DatabaseLoader

@dataclass
class ProcessingJob:
    """Egyetlen PDF feldolgozási feladat"""
    pdf_path: str
    priority: int  # 1=legmagasabb, 10=legalacsonyabb
    estimated_date: Optional[str]
    file_size: int
    last_attempt: Optional[str] = None
    attempt_count: int = 0
    status: str = "pending"  # pending, processing, completed, failed, skipped
    error_message: Optional[str] = None
    processing_time: Optional[float] = None
    matches_extracted: int = 0

@dataclass
class BatchProgress:
    """Batch feldolgozás állapota"""
    total_files: int
    completed: int
    failed: int
    skipped: int
    in_progress: int
    start_time: datetime
    estimated_completion: Optional[datetime] = None
    current_rate: float = 0.0  # files per minute

class SzerencseMixBatchProcessor:
    def __init__(self, archive_path: str, db_path: str, log_level: str = "INFO"):
        self.archive_path = Path(archive_path)
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

        # Logging setup
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('batch_processing.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

        # PDF feldolgozó és adatbetöltő
        self.pdf_processor = RealPdfProcessor()
        self.data_loader = DatabaseLoader(db_path)

        # Progress tracking
        self.progress_file = Path("batch_progress.json")
        self.jobs: List[ProcessingJob] = []
        self.progress: Optional[BatchProgress] = None

    def discover_pdfs(self, priority_strategy: str = "chronological") -> List[ProcessingJob]:
        """PDF fájlok felderítése és prioritási sorba rendezése"""
        self.logger.info(f"PDF fájlok felderítése: {self.archive_path}")

        if not self.archive_path.exists():
            raise FileNotFoundError(f"Archívum mappa nem található: {self.archive_path}")

        # Összes PDF fájl keresése
        pdf_files = list(self.archive_path.rglob("*.pdf"))
        self.logger.info(f"Talált PDF fájlok: {len(pdf_files)}")

        jobs = []
        for pdf_file in pdf_files:
            job = ProcessingJob(
                pdf_path=str(pdf_file),
                priority=self._calculate_priority(pdf_file, priority_strategy),
                estimated_date=self._extract_date_from_filename(pdf_file.name),
                file_size=pdf_file.stat().st_size
            )
            jobs.append(job)

        # Prioritás szerinti rendezés
        jobs.sort(key=lambda x: (x.priority, x.estimated_date or "0000-00-00"), reverse=True)

        self.logger.info(f"Feldolgozási sorrend meghatározva: {len(jobs)} fájl")
        return jobs

    def _calculate_priority(self, pdf_file: Path, strategy: str) -> int:
        """Prioritás számítás különböző stratégiák szerint"""
        if strategy == "recent":
            # Újabb fájlok magasabb prioritással
            date_str = self._extract_date_from_filename(pdf_file.name)
            if date_str:
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    days_ago = (datetime.now() - date_obj).days
                    return max(1, 10 - min(days_ago // 30, 9))  # 1-10 skála
                except:
                    pass
            return 5

        elif strategy == "size":
            # Kisebb fájlok magasabb prioritással (gyorsabb)
            size_kb = pdf_file.stat().st_size / 1024
            if size_kb < 100:
                return 9
            elif size_kb < 500:
                return 7
            elif size_kb < 1000:
                return 5
            else:
                return 3

        elif strategy == "chronological":
            # Régebbiek alacsonyabb prioritással
            date_str = self._extract_date_from_filename(pdf_file.name)
            if date_str:
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    days_ago = (datetime.now() - date_obj).days
                    return min(10, max(1, days_ago // 30))
                except:
                    pass
            return 5

        return 5  # default priority

    def _extract_date_from_filename(self, filename: str) -> Optional[str]:
        """Dátum kinyerése a fájlnévből"""
        # Különböző dátum formátumok keresése
        patterns = [
            r'(\d{4})\.(\d{2})\.(\d{2})',  # 2025.06.27
            r'(\d{4})-(\d{2})-(\d{2})',   # 2025-06-27
            r'(\d{2})-(\d{2})_(\d{4})',   # 06-27_2025
        ]

        for pattern in patterns:
            match = re.search(pattern, filename)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    if len(groups[0]) == 4:  # YYYY-MM-DD vagy YYYY.MM.DD
                        return f"{groups[0]}-{groups[1]}-{groups[2]}"
                    else:  # MM-DD_YYYY
                        return f"{groups[2]}-{groups[0]}-{groups[1]}"

        return None

    def check_already_processed(self) -> List[str]:
        """Már feldolgozott fájlok listája"""
        cursor = self.conn.cursor()
        cursor.execute("SELECT DISTINCT source_pdf FROM historical_matches WHERE source_pdf IS NOT NULL")
        processed_historical = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT DISTINCT source_pdf FROM future_matches WHERE source_pdf IS NOT NULL")
        processed_future = [row[0] for row in cursor.fetchall()]

        cursor.execute("SELECT pdf_filename FROM extraction_logs WHERE status = 'completed'")
        processed_logs = [row[0] for row in cursor.fetchall()]

        all_processed = set(processed_historical + processed_future + processed_logs)
        self.logger.info(f"Már feldolgozott fájlok: {len(all_processed)}")
        return list(all_processed)

    def filter_jobs(self, jobs: List[ProcessingJob],
                   skip_processed: bool = True,
                   from_date: Optional[str] = None,
                   to_date: Optional[str] = None,
                   limit: Optional[int] = None) -> List[ProcessingJob]:
        """Feladatok szűrése"""

        if skip_processed:
            processed_files = self.check_already_processed()
            processed_basenames = {Path(f).name for f in processed_files}
            jobs = [job for job in jobs if Path(job.pdf_path).name not in processed_basenames]
            self.logger.info(f"Szűrés után: {len(jobs)} új fájl")

        if from_date:
            jobs = [job for job in jobs if not job.estimated_date or job.estimated_date >= from_date]
            self.logger.info(f"Dátum szűrés után (>= {from_date}): {len(jobs)} fájl")

        if to_date:
            jobs = [job for job in jobs if not job.estimated_date or job.estimated_date <= to_date]
            self.logger.info(f"Dátum szűrés után (<= {to_date}): {len(jobs)} fájl")

        if limit:
            jobs = jobs[:limit]
            self.logger.info(f"Limit alkalmazva: {len(jobs)} fájl")

        return jobs

    def process_batch(self, jobs: List[ProcessingJob],
                     batch_size: int = 10,
                     max_workers: int = 2,
                     max_retries: int = 3) -> BatchProgress:
        """Batch feldolgozás végrehajtása"""

        self.jobs = jobs
        self.progress = BatchProgress(
            total_files=len(jobs),
            completed=0,
            failed=0,
            skipped=0,
            in_progress=0,
            start_time=datetime.now()
        )

        self.logger.info(f"Batch feldolgozás kezdése: {len(jobs)} fájl, {max_workers} worker")

        # Batch-ek létrehozása
        batches = [jobs[i:i + batch_size] for i in range(0, len(jobs), batch_size)]

        for batch_idx, batch in enumerate(batches):
            self.logger.info(f"Batch {batch_idx + 1}/{len(batches)} feldolgozása ({len(batch)} fájl)")

            # Párhuzamos feldolgozás
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {executor.submit(self._process_single_pdf, job): job for job in batch}

                for future in as_completed(futures):
                    job = futures[future]
                    try:
                        result = future.result()
                        self._update_progress(job, result)
                    except Exception as e:
                        self.logger.error(f"Hiba a {job.pdf_path} feldolgozásában: {e}")
                        job.status = "failed"
                        job.error_message = str(e)
                        self.progress.failed += 1

            # Progress mentése
            self._save_progress()

            # Adatminőség ellenőrzés minden 5. batch után
            if (batch_idx + 1) % 5 == 0:
                self._run_quality_check()

        self.logger.info("Batch feldolgozás befejezve")
        return self.progress

    def _process_single_pdf(self, job: ProcessingJob) -> Dict:
        """Egyetlen PDF feldolgozása"""
        start_time = time.time()
        job.status = "processing"
        job.last_attempt = datetime.now().isoformat()
        job.attempt_count += 1

        self.logger.debug(f"Feldolgozás: {job.pdf_path}")

        try:
            # PDF feldolgozás - meccsek kinyerése
            pdf_path = Path(job.pdf_path)
            result = self.pdf_processor.process_pdf(pdf_path)

            if result and result.get('success', False):
                # Adatok betöltése az adatbázisba
                future_matches = result.get('future_matches', [])
                historical_matches = result.get('historical_matches', [])

                # Log kezdése
                log_id = self.data_loader.log_extraction(pdf_path.name, str(pdf_path), 'processing')

                try:
                    # Betöltés az adatbázisba
                    inserted_future = 0
                    for match in future_matches:
                        if self.data_loader.load_future_match(match, pdf_path.name, confidence=0.8):
                            inserted_future += 1

                    inserted_historical = 0
                    for match in historical_matches:
                        if self.data_loader.load_historical_match(match, pdf_path.name, confidence=0.8):
                            inserted_historical += 1

                    total_inserted = inserted_future + inserted_historical

                    # Log lezárása
                    self.data_loader.update_extraction_log(
                        log_id,
                        'completed',
                        {
                            'records_extracted': total_inserted,
                            'matches_found': len(future_matches) + len(historical_matches),
                            'future_matches': inserted_future,
                            'historical_matches': inserted_historical
                        }
                    )

                    job.status = "completed"
                    job.matches_extracted = total_inserted
                    self.logger.info(f"Sikeres: {pdf_path.name} ({total_inserted} meccs mentve)")

                except Exception as db_error:
                    self.data_loader.update_extraction_log(log_id, 'failed', {'error': str(db_error)})
                    raise db_error

            else:
                job.status = "failed"
                job.error_message = result.get('error', 'PDF feldolgozás sikertelen')
                self.logger.warning(f"Sikertelen: {pdf_path.name} - {job.error_message}")

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            self.logger.error(f"Kivétel: {Path(job.pdf_path).name} - {e}")

        job.processing_time = time.time() - start_time
        return {"job": job, "success": job.status == "completed"}

    def _update_progress(self, job: ProcessingJob, result: Dict):
        """Progress frissítése"""
        if result["success"]:
            self.progress.completed += 1
        else:
            self.progress.failed += 1

        # Sebesség számítás
        elapsed = (datetime.now() - self.progress.start_time).total_seconds() / 60
        if elapsed > 0:
            self.progress.current_rate = (self.progress.completed + self.progress.failed) / elapsed

            # Becslés a befejezésre
            remaining = self.progress.total_files - self.progress.completed - self.progress.failed
            if self.progress.current_rate > 0:
                eta_minutes = remaining / self.progress.current_rate
                self.progress.estimated_completion = datetime.now() + timedelta(minutes=eta_minutes)

    def _save_progress(self):
        """Progress mentése JSON fájlba"""
        progress_data = {
            "progress": asdict(self.progress),
            "jobs": [asdict(job) for job in self.jobs],
            "last_updated": datetime.now().isoformat()
        }

        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(progress_data, f, indent=2, ensure_ascii=False, default=str)

    def load_progress(self) -> bool:
        """Mentett progress betöltése"""
        if not self.progress_file.exists():
            return False

        try:
            with open(self.progress_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            self.progress = BatchProgress(**data["progress"])
            self.jobs = [ProcessingJob(**job_data) for job_data in data["jobs"]]

            self.logger.info(f"Progress betöltve: {len(self.jobs)} feladat")
            return True
        except Exception as e:
            self.logger.error(f"Progress betöltése sikertelen: {e}")
            return False

    def _run_quality_check(self):
        """Adatminőség ellenőrzés"""
        self.logger.info("Adatminőség ellenőrzés...")
        try:
            cleaner = SzerencseMixDataCleaner(self.db_path)
            metrics = cleaner.update_quality_metrics()
            cleaner.close()

            self.logger.info(f"Minőségi metrikák: {metrics}")
        except Exception as e:
            self.logger.error(f"Minőség ellenőrzés hiba: {e}")

    def generate_report(self) -> str:
        """Részletes jelentés generálása"""
        if not self.progress:
            return "Nincs feldolgozási adat."

        report = []
        report.append("=" * 60)
        report.append("SZERENCSEMIX BATCH FELDOLGOZÁSI JELENTÉS")
        report.append("=" * 60)

        # Összesítő statisztikák
        report.append(f"\n📊 ÖSSZESÍTŐ:")
        report.append(f"   Összes fájl: {self.progress.total_files}")
        report.append(f"   Sikeres: {self.progress.completed}")
        report.append(f"   Sikertelen: {self.progress.failed}")
        report.append(f"   Kihagyott: {self.progress.skipped}")
        report.append(f"   Feldolgozás alatt: {self.progress.in_progress}")

        success_rate = (self.progress.completed / self.progress.total_files * 100) if self.progress.total_files > 0 else 0
        report.append(f"   Sikerességi arány: {success_rate:.1f}%")

        # Időzítés
        elapsed = datetime.now() - self.progress.start_time
        report.append(f"\n⏱️ IDŐZÍTÉS:")
        report.append(f"   Kezdés: {self.progress.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"   Eltelt idő: {elapsed}")
        report.append(f"   Jelenlegi sebesség: {self.progress.current_rate:.1f} fájl/perc")

        if self.progress.estimated_completion:
            report.append(f"   Becsült befejezés: {self.progress.estimated_completion.strftime('%Y-%m-%d %H:%M:%S')}")

        # Hibák elemzése
        failed_jobs = [job for job in self.jobs if job.status == "failed"]
        if failed_jobs:
            report.append(f"\n❌ HIBÁK ({len(failed_jobs)}):")
            error_counts = {}
            for job in failed_jobs:
                error_type = job.error_message.split(':')[0] if job.error_message else "Ismeretlen"
                error_counts[error_type] = error_counts.get(error_type, 0) + 1

            for error_type, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True):
                report.append(f"   {error_type}: {count} eset")

        # Top performerek
        completed_jobs = [job for job in self.jobs if job.status == "completed"]
        if completed_jobs:
            top_jobs = sorted(completed_jobs, key=lambda x: x.matches_extracted, reverse=True)[:5]
            report.append(f"\n🏆 LEGJOBB TALÁLATOK:")
            for job in top_jobs:
                filename = Path(job.pdf_path).name
                report.append(f"   {filename}: {job.matches_extracted} meccs")

        return "\n".join(report)

    def close(self):
        """Erőforrások felszabadítása"""
        if self.conn:
            self.conn.close()
        if hasattr(self, 'pdf_processor'):
            # Assuming pdf_processor has a close method
            pass

def main():
    parser = argparse.ArgumentParser(description='SzerencseMix batch PDF processor')
    parser.add_argument('--archive', default='data/szerencsemix_archive', help='PDF archívum mappa')
    parser.add_argument('--db', default='data/football_database.db', help='Adatbázis fájl')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch méret')
    parser.add_argument('--max-workers', type=int, default=2, help='Párhuzamos worker-ek száma')
    parser.add_argument('--priority', choices=['recent', 'chronological', 'size'], default='recent', help='Prioritási stratégia')
    parser.add_argument('--limit', type=int, help='Maximum feldolgozandó fájlok száma')
    parser.add_argument('--from-date', help='Kezdő dátum (YYYY-MM-DD)')
    parser.add_argument('--to-date', help='Befejező dátum (YYYY-MM-DD)')
    parser.add_argument('--resume', action='store_true', help='Korábbi feldolgozás folytatása')
    parser.add_argument('--skip-processed', action='store_true', default=True, help='Már feldolgozott fájlok kihagyása')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], default='INFO', help='Log szint')

    args = parser.parse_args()

    # Adatbázis ellenőrzése
    if not Path(args.db).exists():
        print(f"❌ Adatbázis nem található: {args.db}")
        return 1

    processor = SzerencseMixBatchProcessor(args.archive, args.db, args.log_level)

    try:
        # Progress betöltése ha --resume
        if args.resume and processor.load_progress():
            print("📥 Korábbi feldolgozás betöltve")
            jobs = processor.jobs
        else:
            # PDF-ek felderítése
            print("🔍 PDF fájlok felderítése...")
            jobs = processor.discover_pdfs(args.priority)

            # Szűrés
            jobs = processor.filter_jobs(
                jobs,
                skip_processed=args.skip_processed,
                from_date=args.from_date,
                to_date=args.to_date,
                limit=args.limit
            )

        if not jobs:
            print("✅ Nincs feldolgozandó fájl")
            return 0

        print(f"🚀 {len(jobs)} fájl feldolgozása kezdődik...")

        # Batch feldolgozás
        progress = processor.process_batch(
            jobs,
            batch_size=args.batch_size,
            max_workers=args.max_workers
        )

        # Jelentés
        report = processor.generate_report()
        print("\n" + report)

        # Jelentés mentése
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"batch_report_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\n💾 Jelentés mentve: {report_file}")

        return 0 if progress.failed == 0 else 1

    except KeyboardInterrupt:
        print("\n⏹️ Feldolgozás megszakítva felhasználó által")
        processor._save_progress()
        return 130
    except Exception as e:
        print(f"\n❌ Kritikus hiba: {e}")
        return 1
    finally:
        processor.close()

if __name__ == "__main__":
    sys.exit(main())
