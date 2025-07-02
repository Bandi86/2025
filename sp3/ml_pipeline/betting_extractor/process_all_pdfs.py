#!/usr/bin/env python3
"""
Batch feldolgozó script: minden PDF-et feldolgoz a pdfs mappából
Okos kihagyás: ha a TXT és JSON fájlok már léteznek és frissek, kihagyja a feldolgozást
"""
import os
import subprocess
import sys
from pathlib import Path

def process_all_pdfs():
    """Összes PDF feldolgozása a pdfs mappából"""
    script_dir = Path(__file__).parent
    pdfs_dir = script_dir / "pdfs"

    force_reprocess = "--force" in sys.argv

    if not pdfs_dir.exists():
        print("❌ Nincs pdfs mappa!")
        return

    pdf_files = list(pdfs_dir.glob("*.pdf"))

    if not pdf_files:
        print("❌ Nincsenek PDF fájlok a pdfs mappában!")
        return

    print(f"📄 {len(pdf_files)} PDF fájl feldolgozása...")
    if force_reprocess:
        print("🔄 Force mód: minden fájl újrafeldolgozása")
    else:
        print("⚡ Okos mód: meglévő fájlok kihagyása")

    processed = 0
    skipped = 0
    failed = 0

    for pdf_file in pdf_files:
        print(f"\n🔄 Feldolgozás: {pdf_file.name}")

        # 1. PDF -> TXT konverzió
        print("  → PDF szöveg kinyerése...")
        try:
            cmd = ["python3", "pdf_to_lines.py", str(pdf_file)]
            if force_reprocess:
                cmd.append("--force")

            result = subprocess.run(cmd, capture_output=True, text=True, cwd=script_dir)

            if result.returncode != 0:
                print(f"  ❌ Hiba a PDF feldolgozásban: {result.stderr}")
                failed += 1
                continue
            else:
                output_lines = result.stdout.strip().split('\n')
                if "⏩" in result.stdout:
                    print(f"  ⏩ {output_lines[-2]}")  # A skip üzenet
                    print(f"  ✅ {output_lines[-1]}")  # A sikeres üzenet
                else:
                    print(f"  ✅ {output_lines[-1]}")  # Csak a sikeres üzenet
        except Exception as e:
            print(f"  ❌ Hiba: {e}")
            failed += 1
            continue

        # 2. TXT -> JSON konverzió
        print("  → JSON létrehozása...")
        txt_file = script_dir / "txts" / f"{pdf_file.stem}_lines.txt"

        try:
            cmd = ["python3", "extract_matches.py", str(txt_file)]
            if force_reprocess:
                cmd.append("--force")

            result = subprocess.run(cmd, capture_output=True, text=True, cwd=script_dir)

            if result.returncode != 0:
                print(f"  ❌ Hiba a JSON készítésben: {result.stderr}")
                failed += 1
                continue
            else:
                if "⏩" in result.stdout:
                    print(f"  ⏩ JSON fájl már létezik és friss")
                    skipped += 1
                else:
                    print(f"  ✅ JSON elkészült")
                    processed += 1
        except Exception as e:
            print(f"  ❌ Hiba: {e}")
            failed += 1
            continue

    print(f"\n🎉 Feldolgozás befejezve!")

    # Összesítő
    txts_dir = script_dir / "txts"
    jsons_dir = script_dir / "jsons"

    txt_count = len(list(txts_dir.glob("*.txt"))) if txts_dir.exists() else 0
    json_count = len(list(jsons_dir.glob("*.json"))) if jsons_dir.exists() else 0

    print(f"📊 Eredmény:")
    print(f"  - Feldolgozott: {processed}")
    print(f"  - Kihagyott: {skipped}")
    print(f"  - Sikertelen: {failed}")
    print(f"  - TXT fájlok: {txt_count}")
    print(f"  - JSON fájlok: {json_count}")

    if not force_reprocess and skipped > 0:
        print(f"\n💡 Használd a --force flag-et az újrafeldolgozáshoz")

if __name__ == "__main__":
    process_all_pdfs()
