#!/usr/bin/env python3
"""
Integráció teszt - Enhanced Processor + Database Loader
======================================================

Teszteli hogy a továbbfejlesztett processor tudja-e menteni az adatokat az adatbázisba
"""

import json
from pathlib import Path
from enhanced_comprehensive_processor import EnhancedComprehensivePdfProcessor
from data_loader_pipeline import DatabaseLoader

def test_integration():
    """Teljes integráció teszt"""

    print("🧪 INTEGRÁCIÓ TESZT KEZDÉSE")
    print("=" * 50)

    # Processzorok inicializálása
    processor = EnhancedComprehensivePdfProcessor()
    db_loader = DatabaseLoader("data/football_database.db")

    # PDF feldolgozás (teszt output.txt használatával)
    test_pdf = Path("/nonexistent/test.pdf")  # A processor a /tmp/test_output.txt-et fogja használni
    result = processor.process_pdf(test_pdf)

    if not result['success']:
        print(f"❌ Feldolgozás sikertelen: {result['error']}")
        return

    print(f"✅ Feldolgozás sikeres:")
    print(f"   Meccsek: {result['stats']['matches_found']}")
    print(f"   Eredmények: {result['stats']['results_found']}")
    print(f"   Tabellák: {result['stats']['tables_found']}")

    # Adatbázis mentés tesztelése
    print(f"\n💾 ADATBÁZIS MENTÉS TESZTELÉSE")
    print("-" * 30)

    save_stats = {
        'matches_added': 0,
        'results_added': 0,
        'tables_added': 0,
        'errors': []
    }

    # Extraction log kezdése
    log_id = db_loader.log_extraction(
        pdf_filename="test.pdf",
        pdf_path="/tmp/test.pdf",
        status='processing'
    )

    print(f"📋 Extraction log létrehozva: ID {log_id}")

    # Meccsek mentése
    data = result['data']
    for match in data['matches'][:5]:  # Csak 5 meccs tesztelésre
        try:
            match_id = db_loader.load_future_match(
                home_team=match['home_team'],
                away_team=match['away_team'],
                match_date="2025-01-15",  # Test date
                match_time="19:00",
                league=match['league'],
                source_pdf="test.pdf",
                confidence=match['confidence']
            )

            if match_id:
                save_stats['matches_added'] += 1

        except Exception as e:
            save_stats['errors'].append(f"Meccs mentési hiba: {e}")

    # Tabellák mentése
    for table in data['tables'][:2]:  # Csak 2 tabella tesztelésre
        try:
            print(f"🔄 Tabella mentése: {table['league']} ({len(table['teams'])} csapat)")
            print(f"   Tabella mezők: {list(table.keys())}")
            if table['teams']:
                print(f"   Első csapat mezők: {list(table['teams'][0].keys())}")

            success = db_loader.load_league_table(
                table_data=table,
                source_pdf="test.pdf",
                confidence=0.8
            )

            if success:
                save_stats['tables_added'] += 1
                print(f"   ✅ Mentés sikeres")
            else:
                print(f"   ❌ Mentés sikertelen")

        except Exception as e:
            error_msg = f"Tabella mentési hiba: {e}"
            save_stats['errors'].append(error_msg)
            print(f"   ❌ {error_msg}")

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

    # Eredmények kiírása
    print(f"\n📊 MENTÉSI EREDMÉNYEK:")
    print(f"   Meccsek mentve: {save_stats['matches_added']}")
    print(f"   Tabellák mentve: {save_stats['tables_added']}")
    print(f"   Hibák száma: {len(save_stats['errors'])}")

    if save_stats['errors']:
        print(f"\n❌ HIBÁK:")
        for error in save_stats['errors'][:5]:
            print(f"   - {error}")

    print(f"\n✅ INTEGRÁCIÓ TESZT BEFEJEZVE")


if __name__ == "__main__":
    test_integration()
