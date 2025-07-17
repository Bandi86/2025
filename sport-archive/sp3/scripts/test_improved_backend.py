#!/usr/bin/env python3
"""
🧪 BACKEND JAVÍTÁS TESZTELŐ
Teszteli az intelligens merge logikát
"""

import os
import subprocess
import shutil
from pathlib import Path

def test_improved_backend_logic():
    """Teszteli a javított backend logikát"""
    print("🧪 BACKEND JAVÍTÁS TESZTELŐ")
    print("=" * 50)

    # 1. Backup jelenlegi processed fájlok
    jsons_dir = Path("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons")
    processed_dir = jsons_dir / "processed"
    backup_dir = jsons_dir / "backup_test"

    print("📦 Fájlok mentése...")
    if backup_dir.exists():
        shutil.rmtree(backup_dir)
    shutil.copytree(processed_dir, backup_dir)

    # 2. Fájlok visszamozgatása a jsons mappába (szelektív)
    print("🔄 Teszt fájlok előkészítése...")

    # Csak a problémás fájlokat mozgatjuk vissza teszteléshez
    test_files = [
        "Web__46sz__K__06-10_lines.json",  # 5 piac
        "Web__47sz__P__06-13_lines.json",  # 1 piac (felülírná!)
    ]

    for file in test_files:
        src = processed_dir / file
        dst = jsons_dir / file
        if src.exists():
            print(f"   📁 {file} visszamozgatása...")
            shutil.move(str(src), str(dst))

    print("✅ Teszt környezet előkészítve")
    print(f"📋 Teszt fájlok a {jsons_dir} mappában:")
    for file in jsons_dir.glob("*.json"):
        print(f"   - {file.name}")

    print("\n🚀 MANUAL TESZT UTASÍTÁSOK:")
    print("=" * 40)
    print("1. Restart the backend container:")
    print("   docker restart sp3_backend")
    print("")
    print("2. Monitor the backend logs:")
    print("   docker logs sp3_backend -f")
    print("")
    print("3. Trigger import:")
    print("   docker exec sp3_backend npm run trigger-import")
    print("")
    print("4. Check for intelligent merge messages:")
    print("   - Look for '🔄 Market merge decision'")
    print("   - Look for '✅ Market frissítés' or '⏭️ Market megtartás'")
    print("")
    print("5. Verify database results:")
    print("   - Check if dalian yingbo vs meizhou hakka has 5 markets (not 1)")
    print("   - Check if wuhan three towns vs qingdao hainiu has 5 markets (not 1)")
    print("")
    print("6. Run this script again to restore files:")
    print("   python scripts/test_improved_backend.py --restore")

def restore_files():
    """Visszaállítja a fájlokat"""
    print("🔄 FÁJLOK VISSZAÁLLÍTÁSA")
    print("=" * 30)

    jsons_dir = Path("/home/bandi/Documents/code/2025/sp3/ml_pipeline/betting_extractor/jsons")
    processed_dir = jsons_dir / "processed"
    backup_dir = jsons_dir / "backup_test"

    # Minden JSON fájl visszamozgatása a processed mappába
    for file in jsons_dir.glob("*.json"):
        dst = processed_dir / file.name
        print(f"   📁 {file.name} visszamozgatása processed-be...")
        shutil.move(str(file), str(dst))

    # Backup törlése
    if backup_dir.exists():
        shutil.rmtree(backup_dir)

    print("✅ Fájlok visszaállítva")

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--restore":
        restore_files()
    else:
        test_improved_backend_logic()
