#!/usr/bin/env python3
"""
Komplett PDF feldolgozó teszt
============================

Egy valódi PDF-et dolgoz fel és ment az adatbázisba
"""

import sys
from pathlib import Path
from enhanced_comprehensive_processor import EnhancedComprehensivePdfProcessor
from data_loader_pipeline import DatabaseLoader
import sqlite3

def process_real_pdf():
    """Valódi PDF feldolgozása és mentése"""

    print("🔄 VALÓDI PDF FELDOLGOZÁS TESZT")
    print("=" * 50)

    # PDF fájl keresése
    archive_path = Path("data/szerencsemix_archive/organized")
    pdf_files = list(archive_path.rglob("*.pdf"))

    if not pdf_files:
        print("❌ Nem található PDF fájl az archívumban")
        return

    # Legfrissebb PDF kiválasztása
    latest_pdf = sorted(pdf_files, key=lambda x: x.stat().st_mtime, reverse=True)[0]
    print(f"📄 Feldolgozandó PDF: {latest_pdf.name}")
    print(f"   Elérési út: {latest_pdf}")
    print(f"   Méret: {latest_pdf.stat().st_size / 1024:.1f} KB")

    # Processzorok inicializálása
    processor = EnhancedComprehensivePdfProcessor()
    db_loader = DatabaseLoader("data/football_database.db")

    # Kezdeti adatbázis állapot
    with sqlite3.connect("data/football_database.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM league_tables")
        initial_tables = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM future_matches")
        initial_matches = cursor.fetchone()[0]

    print(f"📊 Kezdeti állapot:")
    print(f"   Tabellák: {initial_tables}")
    print(f"   Jövőbeli meccsek: {initial_matches}")

    # PDF feldolgozás
    print(f"\n🔄 PDF feldolgozás...")
    result = processor.process_pdf(latest_pdf)

    if not result['success']:
        print(f"❌ Feldolgozás sikertelen: {result['error']}")
        return

    print(f"✅ Feldolgozás sikeres:")
    print(f"   Meccsek: {result['stats']['matches_found']}")
    print(f"   Eredmények: {result['stats']['results_found']}")
    print(f"   Tabellák: {result['stats']['tables_found']}")

    # Adatbázis mentés
    print(f"\n💾 Adatbázis mentés...")

    # Extraction log
    log_id = db_loader.log_extraction(
        pdf_filename=latest_pdf.name,
        pdf_path=str(latest_pdf),
        status='processing'
    )

    save_stats = {
        'matches_saved': 0,
        'tables_saved': 0,
        'errors': []
    }

    data = result['data']

    # Meccsek mentése (jövőbeli meccsekként)
    for match in data['matches']:
        try:
            match_id = db_loader.load_future_match(
                home_team=match['home_team'],
                away_team=match['away_team'],
                match_date="2025-01-15",  # Placeholder date
                match_time="19:00",
                league=match['league'],
                source_pdf=latest_pdf.name,
                confidence=match['confidence']
            )

            if match_id:
                save_stats['matches_saved'] += 1

        except Exception as e:
            save_stats['errors'].append(f"Meccs mentési hiba: {e}")

    # Tabellák mentése
    for table in data['tables']:
        try:
            success = db_loader.load_league_table(
                table_data=table,
                source_pdf=latest_pdf.name,
                confidence=0.8
            )

            if success:
                save_stats['tables_saved'] += 1

        except Exception as e:
            save_stats['errors'].append(f"Tabella mentési hiba: {e}")

    # Extraction log frissítése
    db_loader.update_extraction_log(
        log_id=log_id,
        status='completed',
        stats={
            'matches_found': len(data['matches']),
            'tables_found': len(data['tables']),
            'avg_confidence': sum(m.get('confidence', 0.5) for m in data['matches']) / max(len(data['matches']), 1)
        }
    )

    # Végső állapot ellenőrzése
    with sqlite3.connect("data/football_database.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM league_tables")
        final_tables = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM future_matches")
        final_matches = cursor.fetchone()[0]

    print(f"\n📊 MENTÉSI EREDMÉNYEK:")
    print(f"   Meccsek mentve: {save_stats['matches_saved']}")
    print(f"   Tabellák mentve: {save_stats['tables_saved']}")
    print(f"   Hibák: {len(save_stats['errors'])}")

    print(f"\n📊 VÉGSŐ ÁLLAPOT:")
    print(f"   Tabellák: {initial_tables} -> {final_tables} (+{final_tables - initial_tables})")
    print(f"   Jövőbeli meccsek: {initial_matches} -> {final_matches} (+{final_matches - initial_matches})")

    if save_stats['errors']:
        print(f"\n❌ HIBÁK:")
        for error in save_stats['errors'][:3]:
            print(f"   - {error}")

    # Liga összesítés
    with sqlite3.connect("data/football_database.db") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT league, COUNT(*) as count FROM league_tables GROUP BY league ORDER BY count DESC LIMIT 10")
        league_stats = cursor.fetchall()

        if league_stats:
            print(f"\n🏆 LIGA TABELLÁK:")
            for league, count in league_stats:
                print(f"   {league}: {count} bejegyzés")

    print(f"\n✅ VALÓDI PDF FELDOLGOZÁS BEFEJEZVE")

if __name__ == "__main__":
    process_real_pdf()
