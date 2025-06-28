#!/usr/bin/env python3
"""
Cleanup Script - Törli a felesleges régi fájlokat a sikeres reorganizáció után

Ez a szkript:
1. Ellenőrzi, hogy a reorganizáció sikeres volt-e
2. Biztonságosan törli a régi organized mappát
3. Átnevezi a reorganized mappát organized-ra
4. Törli a felesleges ideiglenes fájlokat
"""

import os
import shutil
import json
from pathlib import Path
from datetime import datetime

class ArchiveCleanup:
    """PDF archive tisztítása"""

    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.archive_dir = self.base_dir / "data" / "szerencsemix_archive"
        self.organized_dir = self.archive_dir / "organized"
        self.reorganized_dir = self.archive_dir / "reorganized"
        self.backup_dir = self.archive_dir / "backup_original"

    def check_reorganization_complete(self) -> bool:
        """Ellenőrzi, hogy a reorganizáció sikeres volt-e"""
        if not self.reorganized_dir.exists():
            print("❌ A reorganized mappa nem létezik!")
            return False

        # Reorganized fájlok száma
        reorganized_count = 0
        for root, dirs, files in os.walk(self.reorganized_dir):
            for file in files:
                if file.lower().endswith('.pdf'):
                    reorganized_count += 1

        # Eredeti fájlok száma
        original_count = 0
        if self.organized_dir.exists():
            for root, dirs, files in os.walk(self.organized_dir):
                for file in files:
                    if file.lower().endswith('.pdf'):
                        original_count += 1

        print(f"📊 Reorganized: {reorganized_count} fájl")
        print(f"📊 Original: {original_count} fájl")

        # Legalább 95% sikerességi arány kell
        if reorganized_count >= original_count * 0.95:
            print("✅ Reorganizáció sikeresnek tekinthető")
            return True
        else:
            print("❌ Reorganizáció nem teljes, nem biztonságos a törlés")
            return False

    def create_backup(self) -> bool:
        """Biztonsági másolat készítése az eredeti organized mappáról"""
        try:
            if self.organized_dir.exists() and not self.backup_dir.exists():
                print("💾 Biztonsági másolat készítése...")
                shutil.copytree(self.organized_dir, self.backup_dir)
                print(f"✅ Backup létrehozva: {self.backup_dir}")
                return True
            elif self.backup_dir.exists():
                print("📁 Backup már létezik")
                return True
            else:
                print("❌ Nincs mit backup-olni")
                return False
        except Exception as e:
            print(f"❌ Backup hiba: {e}")
            return False

    def cleanup_old_organized(self):
        """Régi organized mappa törlése"""
        try:
            if self.organized_dir.exists():
                print("🗑️  Régi organized mappa törlése...")
                shutil.rmtree(self.organized_dir)
                print("✅ Régi organized mappa törölve")
            else:
                print("📁 Régi organized mappa már nem létezik")
        except Exception as e:
            print(f"❌ Törlési hiba: {e}")
            raise

    def rename_reorganized_to_organized(self):
        """Reorganized mappa átnevezése organized-ra"""
        try:
            if self.reorganized_dir.exists():
                print("📝 Reorganized -> organized átnevezés...")
                self.reorganized_dir.rename(self.organized_dir)
                print("✅ Átnevezés sikeres")
            else:
                print("❌ Reorganized mappa nem létezik")
        except Exception as e:
            print(f"❌ Átnevezési hiba: {e}")
            raise

    def cleanup_temp_files(self):
        """Ideiglenes fájlok törlése"""
        temp_files = [
            "/tmp/original_files.txt",
            "/tmp/reorganized_files.txt"
        ]

        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    print(f"🗑️  Törölve: {temp_file}")
                except Exception as e:
                    print(f"⚠️  Nem sikerült törölni {temp_file}: {e}")

    def update_statistics(self):
        """Frissíti a statisztikákat"""
        try:
            # Új statisztikák
            final_count = 0
            year_dist = {}
            month_dist = {}

            for root, dirs, files in os.walk(self.organized_dir):
                for file in files:
                    if file.lower().endswith('.pdf'):
                        final_count += 1

                        # Év és hónap kinyerése az útvonalból
                        path_parts = Path(root).parts
                        if len(path_parts) >= 2:
                            year = path_parts[-2]  # pl. "2024"
                            month = path_parts[-1]  # pl. "06-Június"

                            if year.isdigit():
                                year_dist[int(year)] = year_dist.get(int(year), 0) + 1

                            if '-' in month:
                                month_num = int(month.split('-')[0])
                                month_dist[month_num] = month_dist.get(month_num, 0) + 1

            # Cleanup report mentése
            cleanup_report = {
                "cleanup_date": datetime.now().isoformat(),
                "final_file_count": final_count,
                "year_distribution": year_dist,
                "month_distribution": month_dist,
                "cleanup_completed": True,
                "backup_location": str(self.backup_dir),
                "status": "success"
            }

            report_file = self.archive_dir / "cleanup_report.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(cleanup_report, f, indent=2, ensure_ascii=False)

            print(f"📊 Cleanup report mentve: {report_file}")
            print(f"📁 Végső fájlszám: {final_count}")

        except Exception as e:
            print(f"⚠️  Statisztika frissítési hiba: {e}")

    def perform_cleanup(self, force: bool = False):
        """Teljes cleanup végrehajtása"""
        print("🧹 PDF Archive Cleanup")
        print("=" * 50)

        # 1. Ellenőrzés
        if not force and not self.check_reorganization_complete():
            print("❌ Cleanup megszakítva - reorganizáció nem teljes")
            return False

        try:
            # 2. Backup
            if not self.create_backup():
                print("❌ Cleanup megszakítva - backup nem sikerült")
                return False

            # 3. Régi mappa törlése
            self.cleanup_old_organized()

            # 4. Új mappa átnevezése
            self.rename_reorganized_to_organized()

            # 5. Temp fájlok törlése
            self.cleanup_temp_files()

            # 6. Statisztikák frissítése
            self.update_statistics()

            print("\n" + "=" * 50)
            print("✅ CLEANUP SIKERES!")
            print(f"📁 Új organized mappa: {self.organized_dir}")
            print(f"💾 Backup helye: {self.backup_dir}")
            print("🎉 Az archívum most már tiszta és rendezett!")

            return True

        except Exception as e:
            print(f"\n❌ CLEANUP HIBA: {e}")
            print("💡 A backup biztonságban van, kézi helyreállítás szükséges")
            return False

def main():
    """Main function"""
    cleanup = ArchiveCleanup('/home/bandi/Documents/code/2025/sport-prediction')

    print("Szeretnéd végrehajtani a cleanup-ot? (y/N)")
    print("Ez törli a régi organized mappát és átnevezi a reorganized-ot!")
    print("(Biztonsági másolat készül)")

    answer = input().strip().lower()

    if answer in ['y', 'yes']:
        success = cleanup.perform_cleanup()
        if not success:
            print("\n💡 Ha mégis folytatni szeretnéd (force mode):")
            print("python cleanup_archive.py --force")
    else:
        print("Cleanup megszakítva.")

if __name__ == "__main__":
    main()
