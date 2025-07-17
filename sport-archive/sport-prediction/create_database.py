#!/usr/bin/env python3
"""
Adatbázis létrehozás szkript
Végrehajtja a database_schema.sql fájlt és létrehozza a főadatbázist
"""

import sqlite3
import os
from pathlib import Path

def create_database():
    """Létrehozza az adatbázist a séma alapján"""

    # Útvonalak
    project_root = Path(__file__).parent
    schema_file = project_root / 'database_schema.sql'
    db_file = project_root / 'data' / 'football_database.db'

    print(f"🔨 Adatbázis létrehozása: {db_file}")
    print(f"📋 Séma fájl: {schema_file}")

    # Ellenőrizzük, hogy létezik-e a séma fájl
    if not schema_file.exists():
        print(f"❌ Hiba: Nem található a séma fájl: {schema_file}")
        return False

    # Data könyvtár létrehozása ha nem létezik
    db_file.parent.mkdir(exist_ok=True)

    # Ha már létezik az adatbázis, készítsünk róla biztonsági másolatot
    if db_file.exists():
        backup_file = db_file.with_suffix('.backup.db')
        print(f"🔄 Biztonsági másolat: {backup_file}")
        import shutil
        shutil.copy2(db_file, backup_file)

    try:
        # Séma beolvasása
        with open(schema_file, 'r', encoding='utf-8') as f:
            schema_sql = f.read()

        # Adatbázis létrehozása
        conn = sqlite3.connect(str(db_file))

        # Séma végrehajtása
        print("📝 Séma végrehajtása...")
        conn.executescript(schema_sql)

        # Ellenőrizzük a létrehozott táblákat
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [row[0] for row in cursor.fetchall()]

        print(f"✅ Sikeresen létrehozott táblák ({len(tables)} db):")
        for table in tables:
            cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   - {table}: {count} rekord")

        # View-k ellenőrzése
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;")
        views = [row[0] for row in cursor.fetchall()]

        if views:
            print(f"🔍 Létrehozott view-k ({len(views)} db):")
            for view in views:
                print(f"   - {view}")

        # Trigger-ek ellenőrzése
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name;")
        triggers = [row[0] for row in cursor.fetchall()]

        if triggers:
            print(f"⚡ Létrehozott trigger-ek ({len(triggers)} db):")
            for trigger in triggers:
                print(f"   - {trigger}")

        # Adatminőségi metrikák ellenőrzése
        cursor = conn.execute("SELECT metric_name, metric_value, metric_target FROM data_quality_metrics")
        metrics = cursor.fetchall()

        print(f"📊 Alapértelmezett metrikák ({len(metrics)} db):")
        for metric_name, metric_value, metric_target in metrics:
            print(f"   - {metric_name}: {metric_value} (cél: {metric_target})")

        conn.close()

        print(f"\n🎉 Adatbázis sikeresen létrehozva: {db_file}")
        print(f"📂 Fájl méret: {db_file.stat().st_size / 1024:.1f} KB")

        return True

    except Exception as e:
        print(f"❌ Hiba az adatbázis létrehozásakor: {e}")
        return False

if __name__ == "__main__":
    success = create_database()
    exit(0 if success else 1)
