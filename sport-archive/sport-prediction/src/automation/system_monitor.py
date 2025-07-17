#!/usr/bin/env python3
"""
📊 RENDSZER MONITORING
Napi futások monitorozása és hibajelzések
"""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta
import glob

class SystemMonitor:
    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.log_dir = os.path.join(self.project_root, 'logs')
        
    def check_daily_runs(self, days_back: int = 7):
        """Utóbbi napok futásainak ellenőrzése"""
        print(f"📊 RENDSZER ÁLLAPOT ELLENŐRZÉS (utóbbi {days_back} nap)")
        print("=" * 50)
        
        # Log fájlok keresése
        log_files = glob.glob(os.path.join(self.log_dir, "*.log"))
        
        for log_file in log_files:
            print(f"\n📁 {os.path.basename(log_file)}:")
            try:
                with open(log_file, 'r') as f:
                    lines = f.readlines()[-50:]  # Utolsó 50 sor
                    
                success_count = sum(1 for line in lines if "✅" in line or "SUCCESS" in line)
                error_count = sum(1 for line in lines if "❌" in line or "ERROR" in line)
                
                print(f"  ✅ Sikeres futások: {success_count}")
                print(f"  ❌ Hibák: {error_count}")
                
                if error_count > 0:
                    print("  🚨 Legutóbbi hibák:")
                    for line in lines[-10:]:
                        if "❌" in line or "ERROR" in line:
                            print(f"    {line.strip()}")
                            
            except Exception as e:
                print(f"  ❌ Log olvasási hiba: {e}")
    
    def check_system_health(self):
        """Rendszer egészségének ellenőrzése"""
        print("\n🏥 RENDSZER EGÉSZSÉG:")
        
        # Python környezet
        try:
            result = subprocess.run([sys.executable, '--version'], 
                                 capture_output=True, text=True)
            print(f"  🐍 Python: {result.stdout.strip()}")
        except:
            print("  ❌ Python hiba")
        
        # Virtuális környezet
        venv_python = os.path.join(self.project_root, 'venv', 'bin', 'python')
        if os.path.exists(venv_python):
            print("  ✅ Virtual environment: OK")
        else:
            print("  ❌ Virtual environment: Hiányzik")
        
        # Adatfájlok
        data_dirs = ['data/premier_league', 'data/mls', 'data/brasileirao']
        for data_dir in data_dirs:
            full_path = os.path.join(self.project_root, data_dir)
            if os.path.exists(full_path):
                csv_files = glob.glob(os.path.join(full_path, "*.csv"))
                print(f"  📊 {data_dir}: {len(csv_files)} fájl")
            else:
                print(f"  ⚠️ {data_dir}: Hiányzik")
        
        # Eredmény fájlok
        results_dir = os.path.join(self.project_root, 'results')
        if os.path.exists(results_dir):
            result_files = glob.glob(os.path.join(results_dir, "*"))
            print(f"  📈 Results: {len(result_files)} fájl")
        
    def generate_daily_summary(self):
        """Napi összefoglaló generálása"""
        print("\n📋 NAPI ÖSSZEFOGLALÓ:")
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Mai eredmények keresése
        results_pattern = os.path.join(self.project_root, 'results', f"*{today}*")
        today_results = glob.glob(results_pattern)
        
        print(f"  📅 Dátum: {today}")
        print(f"  📊 Mai eredmények: {len(today_results)} fájl")
        
        for result_file in today_results:
            print(f"    • {os.path.basename(result_file)}")

if __name__ == "__main__":
    monitor = SystemMonitor()
    monitor.check_daily_runs()
    monitor.check_system_health()
    monitor.generate_daily_summary()
