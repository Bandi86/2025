#!/usr/bin/env python3
"""
Optimalizált PDF feldolgozó - tiszta architektúrával
"""

import os
import subprocess
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from match_extractor import MatchExtractor, MatchData, MatchFormat

# Logging konfiguráció
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Adatbázis kezelő osztály"""

    def __init__(self, db_path: str = "data/optimized_sport_data.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.setup_database()

    def setup_database(self):
        """Adatbázis tábla létrehozása"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id TEXT NOT NULL,
                teams TEXT NOT NULL,
                time_info TEXT,
                day_info TEXT,
                odds_1 REAL,
                odds_2 REAL,
                odds_3 REAL,
                match_type TEXT,
                raw_line TEXT,
                source_pdf TEXT,
                line_number INTEGER,
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(match_id, teams, source_pdf)
            )
        ''')

        conn.commit()
        conn.close()
        logger.info(f"Adatbázis inicializálva: {self.db_path}")

    def save_matches(self, matches: List[MatchData], source_pdf: str) -> int:
        """Meccsek mentése adatbázisba"""
        if not matches:
            return 0

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        saved_count = 0
        for match in matches:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO matches
                    (match_id, teams, time_info, day_info, odds_1, odds_2, odds_3,
                     match_type, raw_line, source_pdf, line_number)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    match.match_id,
                    match.teams,
                    match.time_info,
                    match.day_info,
                    match.odds[0],
                    match.odds[1],
                    match.odds[2],
                    match.match_type.value,
                    match.raw_line,
                    source_pdf,
                    match.line_number
                ))

                if cursor.rowcount > 0:
                    saved_count += 1

            except sqlite3.Error as e:
                logger.error(f"Hiba meccs mentésekor: {e}")
                continue

        conn.commit()
        conn.close()

        logger.info(f"Mentett meccsek: {saved_count}/{len(matches)}")
        return saved_count

    def get_statistics(self) -> Dict[str, Any]:
        """Adatbázis statisztikák"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        stats = {}

        # Összes meccs
        cursor.execute("SELECT COUNT(*) FROM matches")
        stats['total_matches'] = cursor.fetchone()[0]

        # PDF források
        cursor.execute("SELECT COUNT(DISTINCT source_pdf) FROM matches")
        stats['total_pdfs'] = cursor.fetchone()[0]

        # Formátum szerinti bontás
        cursor.execute("SELECT match_type, COUNT(*) FROM matches GROUP BY match_type")
        stats['by_format'] = dict(cursor.fetchall())

        # Legutóbbi kinyerés
        cursor.execute("SELECT MAX(extracted_at) FROM matches")
        stats['last_extraction'] = cursor.fetchone()[0]

        conn.close()
        return stats

class PDFTextExtractor:
    """PDF szöveg kinyerő osztály"""

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self._check_pdftotext()

    def _check_pdftotext(self):
        """Ellenőrzi, hogy a pdftotext elérhető-e"""
        try:
            subprocess.run(['pdftotext', '-v'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            raise RuntimeError("pdftotext nem elérhető. Telepítsd: sudo apt-get install poppler-utils")

    def extract_text(self, pdf_path: Path) -> Optional[str]:
        """Szöveg kinyerése PDF-ből"""
        try:
            logger.info(f"PDF szöveg kinyerése: {pdf_path.name}")

            result = subprocess.run(
                ['pdftotext', '-layout', str(pdf_path), '-'],
                capture_output=True,
                text=True,
                timeout=self.timeout
            )

            if result.returncode == 0:
                text_length = len(result.stdout)
                logger.info(f"Szöveg kinyerve: {text_length} karakter")
                return result.stdout
            else:
                logger.error(f"pdftotext hiba: {result.stderr}")
                return None

        except subprocess.TimeoutExpired:
            logger.error(f"Timeout ({self.timeout}s) - PDF túl nagy: {pdf_path.name}")
            return None
        except Exception as e:
            logger.error(f"Kivétel: {e}")
            return None

class SzerencseMixProcessor:
    """Fő feldolgozó osztály - tiszta architektúrával"""

    def __init__(self, db_path: str = "data/optimized_sport_data.db"):
        self.extractor = MatchExtractor()
        self.pdf_extractor = PDFTextExtractor()
        self.db_manager = DatabaseManager(db_path)

        logger.info("SzerencseMix Processor inicializálva")

    def process_pdf(self, pdf_path: Path) -> Dict[str, Any]:
        """Egy PDF teljes feldolgozása"""
        logger.info(f"PDF feldolgozás kezdése: {pdf_path.name}")

        # 1. Szöveg kinyerése
        text = self.pdf_extractor.extract_text(pdf_path)
        if not text:
            return {'error': 'Szöveg kinyerés sikertelen', 'pdf': pdf_path.name}

        # 2. Meccsek keresése
        matches = self.extractor.extract_from_text(text)
        logger.info(f"Talált meccsek: {len(matches)}")

        # 3. Adatbázisba mentés
        saved_count = self.db_manager.save_matches(matches, pdf_path.name)

        # 4. Statisztikák
        match_stats = self.extractor.get_statistics(matches)

        result = {
            'pdf': pdf_path.name,
            'total_matches': len(matches),
            'saved_matches': saved_count,
            'text_length': len(text),
            'statistics': match_stats,
            'success': True
        }

        logger.info(f"PDF feldolgozás kész: {saved_count} meccs mentve")
        return result

    def process_directory(self, directory: Path, pattern: str = "*.pdf") -> List[Dict[str, Any]]:
        """Mappa összes PDF-jének feldolgozása"""
        pdf_files = list(directory.glob(pattern))

        if not pdf_files:
            logger.warning(f"Nincsenek PDF fájlok: {directory}")
            return []

        logger.info(f"PDF fájlok feldolgozása: {len(pdf_files)} fájl")

        results = []
        for pdf_path in pdf_files:
            try:
                result = self.process_pdf(pdf_path)
                results.append(result)
            except Exception as e:
                logger.error(f"Hiba {pdf_path.name} feldolgozásakor: {e}")
                results.append({
                    'pdf': pdf_path.name,
                    'error': str(e),
                    'success': False
                })

        return results

    def get_summary(self) -> Dict[str, Any]:
        """Feldolgozás összesítője"""
        return self.db_manager.get_statistics()

def find_pdf_files() -> List[Path]:
    """PDF fájlok keresése a projekt mappákban"""
    search_dirs = [
        Path("../../pdf/organized"),  # Új útvonal a reorganizált struktúrához
        Path("pdf_processed"),
        Path("pdf_input"),
        Path("."),
    ]

    pdf_files = []
    for directory in search_dirs:
        if directory.exists():
            pdf_files.extend(directory.rglob("*.pdf"))

    return sorted(list(set(pdf_files)))  # Duplikátumok eltávolítása és rendezés

def process_single_pdf(pdf_path: str):
    """Egyetlen PDF fájl feldolgozása"""
    print("🚀 EGYETLEN PDF FELDOLGOZÁSA")
    print("="*50)

    try:
        processor = SzerencseMixProcessor()

        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            print(f"❌ A PDF fájl nem található: {pdf_path}")
            return

        print(f"📄 Feldolgozás: {pdf_file.name}")

        # Feldolgozás
        result = processor.process_pdf(pdf_file)

        if result.get('success'):
            print(f"✅ {result['pdf']}: {result['saved_matches']} meccs mentve")
        else:
            print(f"❌ {result['pdf']}: {result.get('error', 'Ismeretlen hiba')}")

        # Összesítő statisztikák
        summary = processor.get_summary()
        print("\n" + "="*50)
        print("📊 STATISZTIKÁK")
        print("="*50)
        print(f"🏅 Mentett meccset: {result.get('saved_matches', 0)}")
        print(f"💾 Adatbázis: {processor.db_manager.db_path}")
        print("✅ Feldolgozás befejezve!")

    except Exception as e:
        logger.error(f"Kritikus hiba: {e}")
        print(f"❌ Kritikus hiba: {e}")

def main():
    """Fő futási logika"""
    print("🚀 OPTIMALIZÁLT SZERENCSMIX PROCESSOR")
    print("="*50)

    try:
        processor = SzerencseMixProcessor()

        # PDF fájlok keresése
        pdf_files = find_pdf_files()

        if not pdf_files:
            print("❌ Nincsenek PDF fájlok!")
            return

        print(f"📚 Talált PDF fájlok: {len(pdf_files)}")

        # Feldolgozás
        results = []
        for pdf_path in pdf_files[:3]:  # Első 3 PDF tesztelése
            result = processor.process_pdf(pdf_path)
            results.append(result)

            if result.get('success'):
                print(f"✅ {result['pdf']}: {result['saved_matches']} meccs")
            else:
                print(f"❌ {result['pdf']}: {result.get('error', 'Ismeretlen hiba')}")

        # Összesítő statisztikák
        summary = processor.get_summary()

        print("\n" + "="*50)
        print("📊 VÉGSŐ STATISZTIKÁK")
        print("="*50)
        print(f"📄 Feldolgozott PDF-ek: {summary['total_pdfs']}")
        print(f"🏅 Összes meccs: {summary['total_matches']}")
        print("🏷️  Formátumok szerint:")
        for format_type, count in summary['by_format'].items():
            print(f"   {format_type}: {count}")

        if summary['last_extraction']:
            print(f"⏰ Utolsó kinyerés: {summary['last_extraction']}")

        print(f"\n💾 Adatbázis: {processor.db_manager.db_path}")
        print("✅ Feldolgozás befejezve!")

    except Exception as e:
        logger.error(f"Kritikus hiba: {e}")
        print(f"❌ Kritikus hiba: {e}")

if __name__ == "__main__":
    main()
