#!/usr/bin/env python3
"""
Processing Progress Monitor
===========================

Folyamatos monitoring a batch feldolgozás alatt.
"""

import sqlite3
import time
from pathlib import Path
from datetime import datetime

def check_processing_progress():
    """Processing progress ellenőrzése"""

    db_path = Path("data/football_database.db")

    if not db_path.exists():
        print("❌ Adatbázis nem található")
        return

    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()

            # Utolsó extrakciók
            cursor.execute("""
                SELECT pdf_filename, status, processing_started, matches_found, avg_confidence
                FROM extraction_logs
                ORDER BY processing_started DESC
                LIMIT 10
            """)

            recent_extractions = cursor.fetchall()

            print(f"\n🔄 PROCESSING PROGRESS - {datetime.now().strftime('%H:%M:%S')}")
            print("=" * 60)

            if recent_extractions:
                print("📋 UTOLSÓ 10 EXTRAKCIÓ:")
                for pdf, status, started, matches, confidence in recent_extractions:
                    # Időpont formázása
                    try:
                        time_str = datetime.fromisoformat(started).strftime("%H:%M:%S") if started else "N/A"
                    except:
                        time_str = str(started)[:8] if started else "N/A"

                    status_icon = "✅" if status == "completed" else "⏳" if status == "processing" else "❌"
                    print(f"  {status_icon} {time_str} | {pdf[:30]:<30} | {matches:>2} meccs | {confidence:.2f}")

            # Összesítések
            cursor.execute("SELECT COUNT(*) FROM teams")
            team_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM historical_matches")
            historical_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM future_matches")
            future_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM extraction_logs WHERE status = 'completed'")
            completed_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM extraction_logs WHERE status = 'processing'")
            processing_count = cursor.fetchone()[0]

            print(f"\n📊 JELENLEGI ÁLLAPOT:")
            print(f"  👥 Csapatok: {team_count}")
            print(f"  ⚽ Történelmi meccsek: {historical_count}")
            print(f"  🔮 Jövőbeli meccsek: {future_count}")
            print(f"  ✅ Befejezett feldolgozások: {completed_count}")
            print(f"  ⏳ Folyamatban: {processing_count}")

    except Exception as e:
        print(f"❌ Hiba: {e}")

def monitor_continuously():
    """Folyamatos monitoring"""
    print("🔍 CONTINUOUS MONITORING STARTED")
    print("Press Ctrl+C to stop...")

    try:
        while True:
            check_processing_progress()
            time.sleep(30)  # 30 másodpercenként
            print("\n" + "="*60)
    except KeyboardInterrupt:
        print("\n\n👋 Monitoring leállítva")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        monitor_continuously()
    else:
        check_processing_progress()
