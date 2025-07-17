#!/usr/bin/env python3
"""
🤖 ENHANCED AUTOMATION SYSTEM
Multi-liga automatizálás, API integráció, monitoring
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
import json
import logging
from typing import List, Dict

class EnhancedAutomationSystem:
    """Fejlett automatizálási rendszer multi-liga támogatással"""

    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.venv_python = os.path.join(self.project_root, 'venv', 'bin', 'python')
        self.log_dir = os.path.join(self.project_root, 'logs')
        self.scripts_dir = os.path.join(self.project_root, 'scripts')

        # Könyvtárak létrehozása
        os.makedirs(self.log_dir, exist_ok=True)
        os.makedirs(self.scripts_dir, exist_ok=True)

        # Logging beállítása
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(os.path.join(self.log_dir, 'automation.log')),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

        # Liga konfigurációk
        self.leagues = {
            'premier_league': {
                'name': 'Premier League',
                'active_days': [5, 6, 1, 2],  # Szombat, Vasárnap, Kedd, Szerda
                'analysis_time': '07:00',
                'priority': 1
            },
            'mls': {
                'name': 'Major League Soccer',
                'active_days': [5, 6, 2],  # Szombat, Vasárnap, Szerda
                'analysis_time': '06:00',  # Korábban az időzóna miatt
                'priority': 2
            },
            'brasileirao': {
                'name': 'Brasileirão Serie A',
                'active_days': [6, 2, 5],  # Vasárnap, Szerda, Szombat
                'analysis_time': '07:30',
                'priority': 3
            },
            'j_league': {
                'name': 'J1 League',
                'active_days': [5, 6, 2],  # Szombat, Vasárnap, Szerda
                'analysis_time': '05:00',  # Korai időzóna miatt
                'priority': 4
            }
        }

    def create_multi_league_cron_jobs(self):
        """Több liga cron job-jainak létrehozása"""
        print("🤖 Multi-liga cron job-ok létrehozása...")

        for league_key, config in self.leagues.items():
            self._create_league_cron_job(league_key, config)

        # Master monitoring cron
        self._create_monitoring_cron_job()

        # API adatok frissítése (naponta egyszer)
        self._create_api_refresh_cron_job()

        print("✅ Összes cron job létrehozva!")

    def _create_league_cron_job(self, league_key: str, config: Dict):
        """Egy liga cron job-jának létrehozása"""
        hour, minute = config['analysis_time'].split(':')
        league_name = config['name']

        # Napi elemzés script
        daily_script = f"""#!/bin/bash
# {league_name} napi elemzés
cd {self.project_root}

# Dátum és nap ellenőrzés
WEEKDAY=$(date +%u)
echo "$(date): {league_name} ellenőrzés - nap: $WEEKDAY"

# Aktív napok: {config['active_days']}
if [[ {' '.join([str(d) for d in config['active_days']])} =~ $WEEKDAY ]]; then
    echo "$(date): {league_name} aktív nap - elemzés indítása"

    # Daily betting assistant
    {self.venv_python} src/tools/daily_betting_assistant.py --league {league_key} >> {self.log_dir}/{league_key}_daily.log 2>&1

    # Live analysis if API available
    {self.venv_python} src/tools/live_betting_analyzer.py --league {league_key} --save >> {self.log_dir}/{league_key}_live.log 2>&1

    echo "$(date): {league_name} elemzés befejezve"
else
    echo "$(date): {league_name} inaktív nap - kihagyás"
fi
"""

        script_path = os.path.join(self.scripts_dir, f'daily_{league_key}.sh')
        with open(script_path, 'w') as f:
            f.write(daily_script)

        # Végrehajthatóvá tétel
        os.chmod(script_path, 0o755)

        # Cron bejegyzés
        cron_entry = f"{minute} {hour} * * * {script_path}"

        print(f"✅ {league_name} cron job: {cron_entry}")
        self._add_to_crontab(cron_entry, f"{league_key}_daily")

    def _create_monitoring_cron_job(self):
        """Monitoring cron job létrehozása"""
        monitoring_script = f"""#!/bin/bash
# Rendszer monitoring
cd {self.project_root}

echo "$(date): Monitoring futtatása"

# Performance tracking
{self.venv_python} src/tracking/performance_tracker.py --auto >> {self.log_dir}/monitoring.log 2>&1

# System health check
{self.venv_python} src/automation/system_monitor.py >> {self.log_dir}/monitoring.log 2>&1

echo "$(date): Monitoring befejezve"
"""

        script_path = os.path.join(self.scripts_dir, 'monitoring.sh')
        with open(script_path, 'w') as f:
            f.write(monitoring_script)

        os.chmod(script_path, 0o755)

        # Naponta háromszor futtatás
        cron_entries = [
            f"0 9 * * * {script_path}",   # Reggel 9
            f"0 15 * * * {script_path}",  # Délután 3
            f"0 21 * * * {script_path}"   # Este 9
        ]

        for entry in cron_entries:
            self._add_to_crontab(entry, "monitoring")

    def _create_api_refresh_cron_job(self):
        """API adatok frissítése cron job"""
        api_script = f"""#!/bin/bash
# API adatok frissítése
cd {self.project_root}

echo "$(date): API adatok frissítése kezdés"

# Összes aktív liga frissítése
for league in premier_league mls brasileirao j_league; do
    echo "$(date): $league API adatok..."
    {self.venv_python} src/api/live_api_client.py --league $league --download >> {self.log_dir}/api_refresh.log 2>&1
    sleep 30  # Rate limiting
done

echo "$(date): API frissítés befejezve"
"""

        script_path = os.path.join(self.scripts_dir, 'api_refresh.sh')
        with open(script_path, 'w') as f:
            f.write(api_script)

        os.chmod(script_path, 0o755)

        # Naponta egyszer hajnalban
        cron_entry = f"0 4 * * * {script_path}"
        self._add_to_crontab(cron_entry, "api_refresh")

    def _add_to_crontab(self, cron_entry: str, job_name: str):
        """Cron bejegyzés hozzáadása"""
        try:
            # Jelenlegi crontab
            result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
            current_crontab = result.stdout if result.returncode == 0 else ""

            # Ellenőrizzük, hogy már létezik-e
            if job_name in current_crontab:
                print(f"⚠️ {job_name} már létezik a crontab-ban")
                return

            # Új bejegyzés hozzáadása
            new_crontab = current_crontab + f"# Sport Betting - {job_name}\n{cron_entry}\n"

            # Crontab frissítése
            process = subprocess.Popen(['crontab', '-'], stdin=subprocess.PIPE, text=True)
            process.communicate(new_crontab)

            if process.returncode == 0:
                print(f"✅ {job_name} cron job hozzáadva")
            else:
                print(f"❌ {job_name} cron job hozzáadása sikertelen")

        except Exception as e:
            print(f"❌ Crontab hiba ({job_name}): {e}")

    def create_league_schedule(self) -> Dict:
        """Liga ütemterv létrehozása"""
        schedule = {}
        today = datetime.now()

        for i in range(7):  # Következő 7 nap
            date = today + timedelta(days=i)
            weekday = date.weekday()  # 0=Hétfő, 6=Vasárnap
            date_str = date.strftime('%Y-%m-%d')

            active_leagues = []
            for league_key, config in self.leagues.items():
                if weekday in config['active_days']:
                    active_leagues.append({
                        'league': league_key,
                        'name': config['name'],
                        'analysis_time': config['analysis_time'],
                        'priority': config['priority']
                    })

            # Prioritás szerint rendezés
            active_leagues.sort(key=lambda x: x['priority'])

            schedule[date_str] = {
                'date': date_str,
                'weekday': weekday,
                'weekday_name': date.strftime('%A'),
                'active_leagues': active_leagues
            }

        return schedule

    def show_schedule(self):
        """Ütemterv megjelenítése"""
        schedule = self.create_league_schedule()

        print("\n📅 MULTI-LIGA ÜTEMTERV")
        print("=" * 60)

        for date_str, day_info in schedule.items():
            print(f"\n📆 {day_info['weekday_name']} ({date_str})")

            if not day_info['active_leagues']:
                print("   😴 Nincs aktív liga")
            else:
                for league in day_info['active_leagues']:
                    print(f"   ⚽ {league['name']} - {league['analysis_time']}")

    def run_manual_analysis(self, league: str = None):
        """Manuális elemzés futtatása"""
        if league:
            leagues = [league] if league in self.leagues else []
        else:
            # Összes aktív liga mai napra
            today_weekday = datetime.now().weekday()
            leagues = [
                league_key for league_key, config in self.leagues.items()
                if today_weekday in config['active_days']
            ]

        if not leagues:
            print("❌ Nincs aktív liga ma.")
            return

        print(f"🔄 Manuális elemzés futtatása: {', '.join(leagues)}")

        for league_key in leagues:
            league_name = self.leagues[league_key]['name']
            print(f"\n⚽ {league_name} elemzés...")

            try:
                # Daily betting assistant
                cmd = f"{self.venv_python} src/tools/daily_betting_assistant.py --league {league_key}"
                subprocess.run(cmd, shell=True, cwd=self.project_root)

                # Live analysis
                cmd = f"{self.venv_python} src/tools/live_betting_analyzer.py --league {league_key} --save"
                subprocess.run(cmd, shell=True, cwd=self.project_root)

                print(f"✅ {league_name} elemzés befejezve")

            except Exception as e:
                print(f"❌ {league_name} elemzés hiba: {e}")

    def cleanup_old_logs(self, days: int = 30):
        """Régi log fájlok törlése"""
        print(f"🧹 {days} napnál régebbi log fájlok törlése...")

        cutoff_date = datetime.now() - timedelta(days=days)
        deleted_count = 0

        for filename in os.listdir(self.log_dir):
            file_path = os.path.join(self.log_dir, filename)

            if os.path.isfile(file_path):
                file_time = datetime.fromtimestamp(os.path.getmtime(file_path))

                if file_time < cutoff_date:
                    os.remove(file_path)
                    deleted_count += 1
                    print(f"🗑️ Törölve: {filename}")

        print(f"✅ {deleted_count} log fájl törölve")

    def get_system_status(self) -> Dict:
        """Rendszer státusz lekérése"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'leagues': {},
            'cron_jobs': self._check_cron_jobs(),
            'logs': self._get_log_info(),
            'api_status': self._check_api_status()
        }

        # Liga státuszok
        for league_key, config in self.leagues.items():
            today_weekday = datetime.now().weekday()
            is_active_today = today_weekday in config['active_days']

            status['leagues'][league_key] = {
                'name': config['name'],
                'active_today': is_active_today,
                'next_analysis': config['analysis_time'] if is_active_today else 'N/A',
                'priority': config['priority']
            }

        return status

    def _check_cron_jobs(self) -> Dict:
        """Cron job-ok ellenőrzése"""
        try:
            result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
            if result.returncode == 0:
                crontab_content = result.stdout
                job_count = len([line for line in crontab_content.split('\n')
                               if 'Sport Betting' in line])
                return {'status': 'OK', 'job_count': job_count}
            else:
                return {'status': 'ERROR', 'message': 'Crontab nem elérhető'}
        except Exception as e:
            return {'status': 'ERROR', 'message': str(e)}

    def _get_log_info(self) -> Dict:
        """Log információk"""
        log_files = [f for f in os.listdir(self.log_dir) if f.endswith('.log')]
        total_size = sum(os.path.getsize(os.path.join(self.log_dir, f))
                        for f in log_files)

        return {
            'file_count': len(log_files),
            'total_size_mb': round(total_size / (1024*1024), 2),
            'directory': self.log_dir
        }

    def _check_api_status(self) -> Dict:
        """API státusz ellenőrzése"""
        try:
            # Egyszerű import teszt
            sys.path.append(os.path.join(self.project_root, 'src', 'api'))
            from live_api_client import LiveAPIClient

            api_key = os.getenv('API_SPORTS_KEY')
            if api_key:
                client = LiveAPIClient(api_key)
                if client.test_connection():
                    return {'status': 'OK', 'api_key': 'Configured'}
                else:
                    return {'status': 'ERROR', 'message': 'API connection failed'}
            else:
                return {'status': 'WARNING', 'message': 'No API key configured'}

        except Exception as e:
            return {'status': 'ERROR', 'message': str(e)}

def main():
    """Fő futtatási függvény"""
    import argparse

    parser = argparse.ArgumentParser(description='Enhanced Automation System')
    parser.add_argument('--setup', action='store_true', help='Cron job-ok telepítése')
    parser.add_argument('--schedule', action='store_true', help='Ütemterv megjelenítése')
    parser.add_argument('--run', choices=['all'] + list(['premier_league', 'mls', 'brasileirao', 'j_league']),
                       help='Manuális elemzés futtatása')
    parser.add_argument('--status', action='store_true', help='Rendszer státusz')
    parser.add_argument('--cleanup', type=int, default=30, help='Log cleanup (napok)')

    args = parser.parse_args()

    automation = EnhancedAutomationSystem()

    if args.setup:
        automation.create_multi_league_cron_jobs()
    elif args.schedule:
        automation.show_schedule()
    elif args.run:
        league = None if args.run == 'all' else args.run
        automation.run_manual_analysis(league)
    elif args.status:
        status = automation.get_system_status()
        print("\n🔍 RENDSZER STÁTUSZ")
        print("=" * 50)
        print(json.dumps(status, indent=2, ensure_ascii=False))
    else:
        automation.cleanup_old_logs(args.cleanup)
        print("\n💡 Használat:")
        print("  --setup     Automatizálás telepítése")
        print("  --schedule  Heti ütemterv")
        print("  --run all   Összes aktív liga futtatása")
        print("  --status    Rendszer státusz")

if __name__ == "__main__":
    main()
