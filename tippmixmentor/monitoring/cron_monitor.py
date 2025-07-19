#!/usr/bin/env python3
"""
Cron Job Monitoring és Debugging Rendszer
Ellenőrzi, hogy a cron job-ok futnak-e és jelentést készít
"""

import os
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import subprocess
import psutil

# Logging beállítása
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(message)s',
    handlers=[
        logging.FileHandler('monitoring.log'),
        logging.StreamHandler()
    ]
)

class CronMonitor:
    """Cron job monitoring és debugging"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.report_data = {
            'timestamp': datetime.now().isoformat(),
            'cron_jobs': {},
            'data_sources': {},
            'issues': [],
            'recommendations': []
        }
        
    def check_cron_jobs(self) -> Dict:
        """Cron job-ok ellenőrzése"""
        
        logging.info("🔍 Cron job-ok ellenőrzése...")
        
        # Cron job-ok listázása
        try:
            result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
            if result.returncode == 0:
                cron_content = result.stdout
                self.report_data['cron_jobs']['installed'] = True
                self.report_data['cron_jobs']['content'] = cron_content
                logging.info("✅ Cron job-ok telepítve")
            else:
                self.report_data['cron_jobs']['installed'] = False
                self.report_data['issues'].append("❌ Nincs cron job telepítve")
                logging.warning("❌ Nincs cron job telepítve")
        except Exception as e:
            self.report_data['cron_jobs']['error'] = str(e)
            self.report_data['issues'].append(f"❌ Cron job ellenőrzési hiba: {e}")
            
        return self.report_data['cron_jobs']
        
    def check_sofascore_status(self) -> Dict:
        """Sofascore scraper státusz ellenőrzése"""
        
        logging.info("🔍 Sofascore státusz ellenőrzése...")
        
        sofascore_dir = self.project_root / "webscrapper" / "src" / "sofascore"
        log_file = sofascore_dir / "logs" / "sofascore_update.log"
        
        status = {
            'last_run': None,
            'log_exists': log_file.exists(),
            'recent_activity': False,
            'data_files': 0,
            'errors': []
        }
        
        # Log fájl ellenőrzése
        if log_file.exists():
            try:
                # Utolsó módosítás ideje
                last_modified = datetime.fromtimestamp(log_file.stat().st_mtime)
                status['last_run'] = last_modified.isoformat()
                
                # Legutóbbi aktivitás (24 órán belül)
                if datetime.now() - last_modified < timedelta(hours=24):
                    status['recent_activity'] = True
                    logging.info("✅ Sofascore: Legutóbbi aktivitás 24 órán belül")
                else:
                    status['recent_activity'] = False
                    self.report_data['issues'].append("⚠️ Sofascore: Nincs legutóbbi aktivitás")
                    
                # Log tartalom ellenőrzése
                with open(log_file, 'r') as f:
                    log_content = f.read()
                    if 'ERROR' in log_content or 'Failed' in log_content:
                        status['errors'].append("Log tartalmaz hibákat")
                        
            except Exception as e:
                status['errors'].append(f"Log olvasási hiba: {e}")
        else:
            self.report_data['issues'].append("❌ Sofascore log fájl nem található")
            
        # Adatfájlok ellenőrzése
        data_dir = sofascore_dir / "jsons"
        if data_dir.exists():
            json_files = list(data_dir.glob("*.json"))
            status['data_files'] = len(json_files)
            
            # Legfrissebb fájl ellenőrzése
            if json_files:
                latest_file = max(json_files, key=lambda x: x.stat().st_mtime)
                latest_modified = datetime.fromtimestamp(latest_file.stat().st_mtime)
                status['latest_data_file'] = {
                    'name': latest_file.name,
                    'modified': latest_modified.isoformat(),
                    'size': latest_file.stat().st_size
                }
                
        self.report_data['data_sources']['sofascore'] = status
        return status
        
    def check_merge_status(self) -> Dict:
        """Merge rendszer státusz ellenőrzése"""
        
        logging.info("🔍 Merge rendszer ellenőrzése...")
        
        merge_dir = self.project_root / "merge_json_data"
        
        status = {
            'config_exists': (merge_dir / "config.json").exists(),
            'script_exists': (merge_dir / "merge_json.py").exists(),
            'output_files': 0,
            'latest_merge': None,
            'id_issues': []
        }
        
        # Kimeneti fájlok ellenőrzése
        merged_data_dir = merge_dir / "merged_data"
        if merged_data_dir.exists():
            json_files = list(merged_data_dir.glob("merged_matches_*.json"))
            status['output_files'] = len(json_files)
            
            if json_files:
                # Legfrissebb merge fájl
                latest_file = max(json_files, key=lambda x: x.stat().st_mtime)
                latest_modified = datetime.fromtimestamp(latest_file.stat().st_mtime)
                status['latest_merge'] = {
                    'file': latest_file.name,
                    'modified': latest_modified.isoformat(),
                    'size': latest_file.stat().st_size
                }
                
                # ID problémák ellenőrzése
                try:
                    with open(latest_file, 'r') as f:
                        data = json.load(f)
                        matches = data.get('matches', [])
                        
                    # ID egyediség ellenőrzése
                    ids = [match.get('id', '') for match in matches]
                    unique_ids = set(ids)
                    
                    if len(ids) != len(unique_ids):
                        duplicate_count = len(ids) - len(unique_ids)
                        status['id_issues'].append(f"Duplikált ID-k: {duplicate_count}")
                        self.report_data['issues'].append(f"❌ Merge: {duplicate_count} duplikált ID")
                        
                    # Üres ID-k ellenőrzése
                    empty_ids = sum(1 for id in ids if not id or id.strip() == '')
                    if empty_ids > 0:
                        status['id_issues'].append(f"Üres ID-k: {empty_ids}")
                        self.report_data['issues'].append(f"❌ Merge: {empty_ids} üres ID")
                        
                    # ID formátum ellenőrzése
                    invalid_format = 0
                    for id in ids:
                        if id and ':' not in id:
                            invalid_format += 1
                            
                    if invalid_format > 0:
                        status['id_issues'].append(f"Hibás formátumú ID-k: {invalid_format}")
                        self.report_data['issues'].append(f"❌ Merge: {invalid_format} hibás formátumú ID")
                        
                except Exception as e:
                    status['id_issues'].append(f"ID ellenőrzési hiba: {e}")
                    
        self.report_data['data_sources']['merge'] = status
        return status
        
    def check_flashscore_scraper(self) -> Dict:
        """Flashscore scraper ellenőrzése"""
        
        logging.info("🔍 Flashscore scraper ellenőrzése...")
        
        scraper_dir = self.project_root / "webscrapper" / "automated-flashscore-scraper"
        
        status = {
            'config_exists': (scraper_dir / "src" / "config" / "index.js").exists(),
            'scraped_data_exists': (scraper_dir / "scraped_data").exists(),
            'countries': 0,
            'total_matches': 0,
            'latest_scrape': None
        }
        
        # Scraped data ellenőrzése
        scraped_data_dir = scraper_dir / "scraped_data"
        if scraped_data_dir.exists():
            countries = [d for d in scraped_data_dir.iterdir() if d.is_dir()]
            status['countries'] = len(countries)
            
            total_matches = 0
            latest_file = None
            latest_time = None
            
            for country_dir in countries:
                for league_dir in country_dir.iterdir():
                    if league_dir.is_dir():
                        for season_dir in league_dir.iterdir():
                            if season_dir.is_dir():
                                json_files = list(season_dir.glob("*.json"))
                                for json_file in json_files:
                                    try:
                                        with open(json_file, 'r') as f:
                                            data = json.load(f)
                                            total_matches += len(data)
                                            
                                        # Legfrissebb fájl keresése
                                        file_time = datetime.fromtimestamp(json_file.stat().st_mtime)
                                        if latest_time is None or file_time > latest_time:
                                            latest_time = file_time
                                            latest_file = json_file
                                            
                                    except Exception as e:
                                        logging.warning(f"Hiba {json_file} olvasásakor: {e}")
                                        
            status['total_matches'] = total_matches
            
            if latest_file and latest_time:
                status['latest_scrape'] = {
                    'file': str(latest_file.relative_to(scraper_dir)),
                    'modified': latest_time.isoformat(),
                    'matches_count': total_matches
                }
                
        self.report_data['data_sources']['flashscore'] = status
        return status
        
    def generate_recommendations(self):
        """Javaslatok generálása a problémák alapján"""
        
        logging.info("💡 Javaslatok generálása...")
        
        # Cron job javaslatok
        if not self.report_data['cron_jobs'].get('installed', False):
            self.report_data['recommendations'].append({
                'priority': 'HIGH',
                'category': 'Cron Jobs',
                'issue': 'Nincs cron job beállítva',
                'solution': 'Telepítsd a cron job-okat: crontab merge_json_data/my_cron_jobs.txt',
                'command': 'crontab merge_json_data/my_cron_jobs.txt'
            })
            
        # Sofascore javaslatok
        sofascore = self.report_data['data_sources'].get('sofascore', {})
        if not sofascore.get('recent_activity', False):
            self.report_data['recommendations'].append({
                'priority': 'HIGH',
                'category': 'Sofascore',
                'issue': 'Nincs legutóbbi aktivitás',
                'solution': 'Ellenőrizd a Sofascore scraper működését',
                'command': 'cd webscrapper/src/sofascore && python3 scripts/daily_update.py'
            })
            
        # Merge javaslatok
        merge = self.report_data['data_sources'].get('merge', {})
        if merge.get('id_issues'):
            self.report_data['recommendations'].append({
                'priority': 'MEDIUM',
                'category': 'Merge System',
                'issue': 'ID problémák a merge rendszerben',
                'solution': 'Javítsd az ID generálási logikát a merge_json.py-ban',
                'command': 'cd merge_json_data && python3 merge_json.py --fix-ids'
            })
            
    def create_report(self) -> str:
        """Részletes jelentés készítése"""
        
        report = []
        report.append("# 🔍 RENDSZER MONITORING JELENTÉS")
        report.append(f"**Generálva:** {self.report_data['timestamp']}")
        report.append("")
        
        # Összefoglaló
        total_issues = len(self.report_data['issues'])
        if total_issues == 0:
            report.append("## ✅ ÖSSZEFOGLALÓ: Minden rendben!")
        else:
            report.append(f"## ⚠️ ÖSSZEFOGLALÓ: {total_issues} probléma azonosítva")
            
        report.append("")
        
        # Problémák
        if self.report_data['issues']:
            report.append("## 🚨 AZONOSÍTOTT PROBLÉMÁK:")
            for issue in self.report_data['issues']:
                report.append(f"- {issue}")
            report.append("")
            
        # Adatforrások státusza
        report.append("## 📊 ADATFORRÁSOK STÁTUSZA:")
        
        for source_name, source_data in self.report_data['data_sources'].items():
            report.append(f"### {source_name.upper()}")
            
            if source_name == 'sofascore':
                report.append(f"- **Utolsó futás:** {source_data.get('last_run', 'N/A')}")
                report.append(f"- **Legutóbbi aktivitás:** {'✅' if source_data.get('recent_activity') else '❌'}")
                report.append(f"- **Adatfájlok:** {source_data.get('data_files', 0)}")
                
            elif source_name == 'merge':
                report.append(f"- **Kimeneti fájlok:** {source_data.get('output_files', 0)}")
                report.append(f"- **Legutóbbi merge:** {source_data.get('latest_merge', {}).get('file', 'N/A')}")
                if source_data.get('id_issues'):
                    report.append(f"- **ID problémák:** {', '.join(source_data['id_issues'])}")
                    
            elif source_name == 'flashscore':
                report.append(f"- **Országok:** {source_data.get('countries', 0)}")
                report.append(f"- **Összes meccs:** {source_data.get('total_matches', 0)}")
                report.append(f"- **Legutóbbi scrape:** {source_data.get('latest_scrape', {}).get('file', 'N/A')}")
                
            report.append("")
            
        # Javaslatok
        if self.report_data['recommendations']:
            report.append("## 💡 JAVASLATOK:")
            for rec in self.report_data['recommendations']:
                report.append(f"### {rec['priority']} - {rec['category']}")
                report.append(f"**Probléma:** {rec['issue']}")
                report.append(f"**Megoldás:** {rec['solution']}")
                if rec.get('command'):
                    report.append(f"**Parancs:** `{rec['command']}`")
                report.append("")
                
        return "\n".join(report)
        
    def run_full_check(self) -> Dict:
        """Teljes rendszer ellenőrzés futtatása"""
        
        logging.info("🚀 Teljes rendszer ellenőrzés indítása...")
        
        # Összes ellenőrzés futtatása
        self.check_cron_jobs()
        self.check_sofascore_status()
        self.check_merge_status()
        self.check_flashscore_scraper()
        
        # Javaslatok generálása
        self.generate_recommendations()
        
        # Jelentés készítése
        report_text = self.create_report()
        
        # Jelentés mentése
        report_file = Path("monitoring_report.md")
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
            
        logging.info(f"📄 Jelentés mentve: {report_file}")
        
        return self.report_data


if __name__ == "__main__":
    monitor = CronMonitor()
    results = monitor.run_full_check()
    
    # Konzol kimenet
    print("\n" + "="*60)
    print("🔍 RENDSZER MONITORING EREDMÉNYEK")
    print("="*60)
    
    print(f"\n📊 ÖSSZEFOGLALÓ:")
    print(f"- Problémák: {len(results['issues'])}")
    print(f"- Javaslatok: {len(results['recommendations'])}")
    
    if results['issues']:
        print(f"\n🚨 PROBLÉMÁK:")
        for issue in results['issues']:
            print(f"  {issue}")
            
    if results['recommendations']:
        print(f"\n💡 SÜRGŐS JAVASLATOK:")
        high_priority = [r for r in results['recommendations'] if r['priority'] == 'HIGH']
        for rec in high_priority:
            print(f"  - {rec['issue']}")
            print(f"    Megoldás: {rec['command']}")
            
    print(f"\n📄 Részletes jelentés: monitoring_report.md")