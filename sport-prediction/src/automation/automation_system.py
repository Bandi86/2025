#!/usr/bin/env python3
"""
🤖 AUTOMATIZÁLÁSI RENDSZER
Napi futtatás, cron jobbok, bot integrálás
"""

import os
import sys
import subprocess
from datetime import datetime, timedelta
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

class AutomationSystem:
    """Automatizálási rendszer"""

    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.venv_python = os.path.join(self.project_root, 'venv', 'bin', 'python')
        self.log_dir = os.path.join(self.project_root, 'logs')

        # Log könyvtár létrehozása
        os.makedirs(self.log_dir, exist_ok=True)

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

    def create_cron_job(self, time: str = "08:00", league: str = "premier_league"):
        """Cron job létrehozása napi futtatáshoz"""
        hour, minute = time.split(':')

        # Cron script
        cron_script = f"""#!/bin/bash
# Napi fogadási asszisztens futtatása
cd {self.project_root}
{self.venv_python} src/tools/daily_betting_assistant.py --league {league} --auto >> {self.log_dir}/daily_assistant.log 2>&1
"""

        script_path = os.path.join(self.project_root, 'scripts', 'daily_run.sh')
        os.makedirs(os.path.dirname(script_path), exist_ok=True)

        with open(script_path, 'w') as f:
            f.write(cron_script)

        # Executable jogok
        os.chmod(script_path, 0o755)

        # Crontab entry
        cron_entry = f"{minute} {hour} * * * {script_path}"

        print("🕐 CRON JOB BEÁLLÍTÁS")
        print("=" * 30)
        print(f"⏰ Időpont: Minden nap {time}")
        print(f"⚽ Liga: {league}")
        print(f"📁 Script: {script_path}")
        print(f"📝 Crontab entry:")
        print(f"   {cron_entry}")
        print("\n🔧 Manuális beállítás:")
        print("   crontab -e")
        print(f"   # Majd add hozzá: {cron_entry}")

        return script_path, cron_entry

    def setup_telegram_bot(self):
        """Telegram bot konfiguráció"""
        bot_script = '''#!/usr/bin/env python3
"""
📱 TELEGRAM BOT - Napi fogadási értesítések
"""

import os
import sys
import asyncio
from datetime import datetime
import subprocess

# Telegram bot imports (telepíteni kell: pip install python-telegram-bot)
try:
    from telegram import Bot
    from telegram.ext import Application, CommandHandler, ContextTypes
except ImportError:
    print("❌ Telegram bot library hiányzik!")
    print("📦 Telepítés: pip install python-telegram-bot")
    sys.exit(1)

class BettingBot:
    def __init__(self, token: str, chat_ids: list):
        self.token = token
        self.chat_ids = chat_ids
        self.bot = Bot(token=token)

    async def send_daily_tips(self):
        """Napi tippek küldése"""
        try:
            # Daily assistant futtatása
            result = subprocess.run([
                sys.executable,
                'src/tools/daily_betting_assistant.py',
                '--format', 'telegram'
            ], capture_output=True, text=True, cwd=os.path.dirname(__file__))

            if result.returncode == 0:
                message = f"🌅 **NAPI FOGADÁSI JAVASLATOK**\\n{result.stdout}"

                for chat_id in self.chat_ids:
                    await self.bot.send_message(
                        chat_id=chat_id,
                        text=message,
                        parse_mode='Markdown'
                    )
                print("✅ Telegram üzenetek elküldve")
            else:
                error_msg = f"❌ Hiba a daily assistant futtatásában: {result.stderr}"
                print(error_msg)

        except Exception as e:
            print(f"❌ Telegram bot hiba: {e}")

# Bot konfiguráció
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_IDS = os.getenv('TELEGRAM_CHAT_IDS', '').split(',')

if __name__ == "__main__":
    if not TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN környezeti változó hiányzik!")
        sys.exit(1)

    bot = BettingBot(TOKEN, CHAT_IDS)
    asyncio.run(bot.send_daily_tips())
'''

        bot_path = os.path.join(self.project_root, 'src', 'automation', 'telegram_bot.py')
        with open(bot_path, 'w') as f:
            f.write(bot_script)

        print("📱 TELEGRAM BOT KONFIGURÁCIÓ")
        print("=" * 35)
        print("1. 🤖 Bot létrehozása: @BotFather telegram-on")
        print("2. 🔑 Token mentése:")
        print("   export TELEGRAM_BOT_TOKEN='your_bot_token'")
        print("3. 💬 Chat ID megszerzése:")
        print("   - Küldj üzenetet a botnak")
        print("   - https://api.telegram.org/bot<TOKEN>/getUpdates")
        print("4. 🎯 Chat ID beállítása:")
        print("   export TELEGRAM_CHAT_IDS='chat_id1,chat_id2'")
        print(f"5. ✅ Bot script: {bot_path}")

        return bot_path

    def setup_email_notifications(self):
        """Email értesítések beállítása"""
        email_script = '''#!/usr/bin/env python3
"""
📧 EMAIL ÉRTESÍTÉSEK - Napi jelentések
"""

import smtplib
import os
import sys
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailNotifier:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email = os.getenv('EMAIL_ADDRESS')
        self.password = os.getenv('EMAIL_PASSWORD')
        self.recipients = os.getenv('EMAIL_RECIPIENTS', '').split(',')

    def send_daily_report(self):
        """Napi jelentés küldése"""
        try:
            # Daily assistant futtatása
            result = subprocess.run([
                sys.executable,
                'src/tools/daily_betting_assistant.py',
                '--format', 'email'
            ], capture_output=True, text=True)

            if result.returncode == 0:
                # Email összeállítása
                msg = MimeMultipart()
                msg['From'] = self.email
                msg['To'] = ', '.join(self.recipients)
                msg['Subject'] = f"🌅 Napi Fogadási Javaslatok - {datetime.now().strftime('%Y-%m-%d')}"

                body = f"""
Napi fogadási javaslatok:

{result.stdout}

---
Automatikus jelentés a Sport Betting Prediction System-től
{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

                msg.attach(MIMEText(body, 'plain', 'utf-8'))

                # Email küldése
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.email, self.password)
                server.send_message(msg)
                server.quit()

                print("✅ Email jelentés elküldve")
            else:
                print(f"❌ Hiba a daily assistant futtatásában: {result.stderr}")

        except Exception as e:
            print(f"❌ Email küldési hiba: {e}")

if __name__ == "__main__":
    notifier = EmailNotifier()
    notifier.send_daily_report()
'''

        email_path = os.path.join(self.project_root, 'src', 'automation', 'email_notifier.py')
        with open(email_path, 'w') as f:
            f.write(email_script)

        print("📧 EMAIL ÉRTESÍTÉSEK KONFIGURÁCIÓ")
        print("=" * 38)
        print("1. 📮 Gmail App Password létrehozása:")
        print("   - Google Account > Security > 2-Step Verification > App passwords")
        print("2. 🔑 Környezeti változók:")
        print("   export EMAIL_ADDRESS='your@gmail.com'")
        print("   export EMAIL_PASSWORD='app_password'")
        print("   export EMAIL_RECIPIENTS='recipient1@email.com,recipient2@email.com'")
        print("3. 🔧 SMTP beállítások (opcionális):")
        print("   export SMTP_SERVER='smtp.gmail.com'")
        print("   export SMTP_PORT='587'")
        print(f"4. ✅ Email script: {email_path}")

        return email_path

    def create_monitoring_script(self):
        """Monitoring script a rendszer állapotának követésére"""
        monitoring_script = '''#!/usr/bin/env python3
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
            print(f"\\n📁 {os.path.basename(log_file)}:")
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
        print("\\n🏥 RENDSZER EGÉSZSÉG:")

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
        print("\\n📋 NAPI ÖSSZEFOGLALÓ:")
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
'''

        monitor_path = os.path.join(self.project_root, 'src', 'automation', 'system_monitor.py')
        with open(monitor_path, 'w') as f:
            f.write(monitoring_script)

        print("📊 MONITORING RENDSZER")
        print("=" * 25)
        print("🎯 Funkciók:")
        print("  • Napi futások követése")
        print("  • Hibajelzések")
        print("  • Rendszer állapot")
        print("  • Összefoglaló jelentések")
        print(f"✅ Monitor script: {monitor_path}")

        return monitor_path

def main():
    """Főprogram"""
    print("🤖 AUTOMATIZÁLÁSI RENDSZER TELEPÍTÉSE")
    print("=" * 45)

    automation = AutomationSystem()

    # 1. Cron job
    print("1️⃣ CRON JOB BEÁLLÍTÁSA:")
    cron_script, cron_entry = automation.create_cron_job(time="08:00", league="premier_league")

    print("\n" + "="*50)

    # 2. Telegram bot
    print("2️⃣ TELEGRAM BOT:")
    telegram_script = automation.setup_telegram_bot()

    print("\n" + "="*50)

    # 3. Email notifications
    print("3️⃣ EMAIL ÉRTESÍTÉSEK:")
    email_script = automation.setup_email_notifications()

    print("\n" + "="*50)

    # 4. Monitoring
    print("4️⃣ MONITORING RENDSZER:")
    monitor_script = automation.create_monitoring_script()

    print("\n" + "="*50)
    print("🎯 GYORS INDÍTÁS:")
    print("1. Cron job aktiválása:")
    print("   crontab -e")
    print(f"   # Add hozzá: {cron_entry}")
    print("\n2. Telegram bot tesztelése:")
    print(f"   python {telegram_script}")
    print("\n3. Email értesítés tesztelése:")
    print(f"   python {email_script}")
    print("\n4. Monitoring futtatása:")
    print(f"   python {monitor_script}")

    print("\n✅ Automatizálási rendszer telepítve!")

if __name__ == "__main__":
    main()
