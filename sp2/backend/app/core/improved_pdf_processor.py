#!/usr/bin/env python3
"""
Javított PDF feldolgozó - csoportosított fogadásokkal
"""

import os
import subprocess
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from .improved_db_manager import ImprovedDatabaseManager
from .improved_match_extractor import ImprovedMatchExtractor, MatchGroup

# Logging konfiguráció
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImprovedPDFProcessor:
    """Javított PDF feldolgozó - egy meccshez több fogadási opció"""

    def __init__(self, db_path: str = "../../../shared/data/optimized_sport_data.db"):
        self.db_manager = ImprovedDatabaseManager(db_path)
        self.match_extractor = ImprovedMatchExtractor()
        self.processed_pdfs = set()
        logger.info("Javított PDF Processor inicializálva")

    def extract_text_from_pdf(self, pdf_path: Path) -> str:
        """PDF szöveg kinyerése pdftotext segítségével"""
        try:
            # Próbáljuk a pdftotext parancsot
            result = subprocess.run(
                ['pdftotext', '-layout', str(pdf_path), '-'],
                capture_output=True,
                text=True,
                encoding='utf-8'
            )

            if result.returncode == 0:
                return result.stdout
            else:
                logger.warning(f"pdftotext hiba: {result.stderr}")

        except FileNotFoundError:
            logger.warning("pdftotext nem található, PyPDF2 próbálkozás...")

        # Fallback: PyPDF2
        try:
            import PyPDF2
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\\n"
                return text
        except ImportError:
            logger.error("PyPDF2 nincs telepítve!")
            return ""
        except Exception as e:
            logger.error(f"PyPDF2 hiba: {e}")
            return ""

    def process_pdf(self, pdf_path: Path) -> Dict[str, Any]:
        """Egyetlen PDF feldolgozása"""
        logger.info(f"PDF feldolgozás kezdése: {pdf_path.name}")

        try:
            # Szöveg kinyerése
            logger.info(f"PDF szöveg kinyerése: {pdf_path.name}")
            text = self.extract_text_from_pdf(pdf_path)

            if not text:
                return {
                    'success': False,
                    'error': 'Nem sikerült szöveget kinyerni a PDF-ből',
                    'pdf': pdf_path.name
                }

            logger.info(f"Szöveg kinyerve: {len(text)} karakter")

            # Meccek kinyerése és csoportosítása
            logger.info("Meccek kinyerése és csoportosítása...")
            matches = self.match_extractor.extract_matches_from_text(text)

            if not matches:
                return {
                    'success': False,
                    'error': 'Nem találhatók meccselyek a PDF-ben',
                    'pdf': pdf_path.name
                }

            logger.info(f"Kinyert meccsk: {len(matches)}")

            # Mentés az adatbázisba
            saved_matches = 0
            for match in matches:
                match_data = {
                    'match_id': match.match_id,
                    'team_home': match.team_home,
                    'team_away': match.team_away,
                    'match_time': match.match_time,
                    'match_day': match.match_day,
                    'source_pdf': pdf_path.name
                }

                betting_options = []
                for bet_option in match.betting_options:
                    betting_options.append({
                        'bet_type': bet_option.bet_type.value,
                        'bet_description': bet_option.bet_description,
                        'odds_1': bet_option.odds_1,
                        'odds_2': bet_option.odds_2,
                        'odds_3': bet_option.odds_3,
                        'raw_line': bet_option.raw_line,
                        'line_number': bet_option.line_number
                    })

                if self.db_manager.save_match_with_bets(match_data, betting_options):
                    saved_matches += 1

            self.processed_pdfs.add(pdf_path.name)

            # Statisztikák
            stats = self.match_extractor.get_statistics(matches)

            return {
                'success': True,
                'pdf': pdf_path.name,
                'saved_matches': saved_matches,
                'total_betting_options': stats['total_betting_options'],
                'stats': stats
            }

        except Exception as e:
            logger.error(f"Hiba a PDF feldolgozáskor ({pdf_path.name}): {e}")
            return {
                'success': False,
                'error': str(e),
                'pdf': pdf_path.name
            }

    def get_summary(self) -> Dict[str, Any]:
        """Feldolgozási összesítő"""
        matches_with_bets = self.db_manager.get_matches_with_bets()
        total_betting_options = sum(len(match['betting_options']) for match in matches_with_bets)

        return {
            'total_pdfs': len(self.processed_pdfs),
            'total_matches': len(matches_with_bets),
            'total_betting_options': total_betting_options,
            'avg_bets_per_match': total_betting_options / len(matches_with_bets) if matches_with_bets else 0,
            'processed_pdfs': list(self.processed_pdfs)
        }


def process_single_pdf(pdf_path: str):
    """Egyetlen PDF fájl feldolgozása"""
    print("🚀 JAVÍTOTT EGYETLEN PDF FELDOLGOZÁSA")
    print("="*50)

    try:
        processor = ImprovedPDFProcessor()

        pdf_file = Path(pdf_path)
        if not pdf_file.exists():
            print(f"❌ A PDF fájl nem található: {pdf_path}")
            return

        print(f"📄 Feldolgozás: {pdf_file.name}")

        # Feldolgozás
        result = processor.process_pdf(pdf_file)

        if result.get('success'):
            print(f"✅ {result['pdf']}: {result['saved_matches']} meccs mentve")
            print(f"🎯 Összes fogadási opció: {result['total_betting_options']}")
            if 'stats' in result:
                stats = result['stats']
                print(f"📊 Átlag fogadás/meccs: {stats['avg_bets_per_match']:.1f}")
                print("🏷️  Fogadás típusok:")
                for bet_type, count in stats['bet_type_distribution'].items():
                    print(f"   {bet_type}: {count}")
        else:
            print(f"❌ {result['pdf']}: {result.get('error', 'Ismeretlen hiba')}")

        # Összesítő statisztikák
        summary = processor.get_summary()
        print("\n" + "="*50)
        print("📊 STATISZTIKÁK")
        print("="*50)
        print(f"🏅 Mentett meccset: {summary['total_matches']}")
        print(f"🎯 Összes fogadási opció: {summary['total_betting_options']}")
        print(f"📈 Átlag fogadás/meccs: {summary['avg_bets_per_match']:.1f}")
        print(f"💾 Adatbázis: {processor.db_manager.db_path}")
        print("✅ Feldolgozás befejezve!")

    except Exception as e:
        logger.error(f"Kritikus hiba: {e}")
        print(f"❌ Kritikus hiba: {e}")


def reset_database():
    """Adatbázis újraindítása"""
    print("🗑️  ADATBÁZIS TÖRLÉSE ÉS ÚJRAINDÍTÁSA")
    print("="*50)

    db_manager = ImprovedDatabaseManager()
    db_manager.drop_all_tables()
    db_manager.setup_database()
    print("✅ Adatbázis újraindítva!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--reset":
            reset_database()
        else:
            process_single_pdf(sys.argv[1])
    else:
        print("Használat: python improved_pdf_processor.py <pdf_fájl> vagy --reset")
