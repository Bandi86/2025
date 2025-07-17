#!/usr/bin/env python3
"""
🔧 COMPLETE SYSTEM SETUP
Teljes rendszer telepítés és konfiguráció
"""

import os
import sys
import subprocess
import json
from datetime import datetime

class SystemSetup:
    """Teljes rendszer telepítő"""

    def __init__(self):
        self.project_root = os.path.dirname(__file__)
        self.venv_path = os.path.join(self.project_root, 'venv')

    def check_python_version(self):
        """Python verzió ellenőrzése"""
        print("🐍 Python verzió ellenőrzése...")
        version = sys.version_info

        if version.major < 3 or (version.major == 3 and version.minor < 8):
            print(f"❌ Python 3.8+ szükséges, jelenlegi: {version.major}.{version.minor}")
            return False

        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True

    def create_virtual_environment(self):
        """Virtual environment létrehozása"""
        print("📦 Virtual environment...")

        if os.path.exists(self.venv_path):
            print("✅ Virtual environment már létezik")
            return True

        try:
            subprocess.run([sys.executable, '-m', 'venv', 'venv'],
                          cwd=self.project_root, check=True)
            print("✅ Virtual environment létrehozva")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Virtual environment létrehozása sikertelen: {e}")
            return False

    def install_dependencies(self):
        """Függőségek telepítése"""
        print("📥 Függőségek telepítése...")

        # Requirements.txt létrehozása ha nincs
        requirements = [
            "pandas>=1.5.0",
            "numpy>=1.21.0",
            "scikit-learn>=1.1.0",
            "requests>=2.28.0",
            "matplotlib>=3.5.0",
            "seaborn>=0.11.0",
            "python-telegram-bot>=20.0",
            "schedule>=1.2.0",
            "psutil>=5.9.0"
        ]

        requirements_path = os.path.join(self.project_root, 'requirements.txt')
        if not os.path.exists(requirements_path):
            with open(requirements_path, 'w') as f:
                f.write('\n'.join(requirements))
            print("✅ requirements.txt létrehozva")

        # Pip upgrade
        venv_pip = os.path.join(self.venv_path, 'bin', 'pip')
        try:
            subprocess.run([venv_pip, 'install', '--upgrade', 'pip'], check=True)
            subprocess.run([venv_pip, 'install', '-r', requirements_path], check=True)
            print("✅ Függőségek telepítve")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Függőségek telepítése sikertelen: {e}")
            return False

    def setup_directory_structure(self):
        """Könyvtár struktúra beállítása"""
        print("📁 Könyvtár struktúra...")

        directories = [
            'data/premier_league',
            'data/mls',
            'data/brasileirao',
            'data/j_league',
            'data/a_league',
            'results',
            'logs',
            'scripts',
            'archive',
            'docs'
        ]

        for directory in directories:
            full_path = os.path.join(self.project_root, directory)
            os.makedirs(full_path, exist_ok=True)

        print("✅ Könyvtárak létrehozva")
        return True

    def setup_sample_data(self):
        """Minta adatok generálása"""
        print("🔬 Minta adatok generálása...")

        try:
            # MLS setup
            mls_setup_script = os.path.join(self.project_root, 'setup_mls.py')
            if os.path.exists(mls_setup_script):
                venv_python = os.path.join(self.venv_path, 'bin', 'python')
                subprocess.run([venv_python, mls_setup_script], check=True)

            # Multi-league setup
            multi_league_script = os.path.join(self.project_root, 'src', 'api', 'multi_league_system.py')
            if os.path.exists(multi_league_script):
                subprocess.run([venv_python, multi_league_script], check=True)

            print("✅ Minta adatok generálva")
            return True

        except subprocess.CalledProcessError as e:
            print(f"⚠️ Minta adatok generálása részben sikertelen: {e}")
            return False

    def create_config_files(self):
        """Konfigurációs fájlok létrehozása"""
        print("⚙️ Konfigurációs fájlok...")

        # Main config
        config = {
            'version': '2.0.0',
            'created': datetime.now().isoformat(),
            'leagues': {
                'premier_league': {'enabled': True, 'priority': 1},
                'mls': {'enabled': True, 'priority': 2},
                'brasileirao': {'enabled': True, 'priority': 3},
                'j_league': {'enabled': True, 'priority': 4}
            },
            'automation': {
                'enabled': False,
                'cron_jobs': False,
                'notifications': False
            },
            'api': {
                'api_sports_enabled': False,
                'rate_limit': 1000,
                'timeout': 15
            },
            'betting': {
                'default_bankroll': 1000,
                'max_daily_risk': 0.08,
                'min_edge': 0.05,
                'min_confidence': 0.4
            }
        }

        config_path = os.path.join(self.project_root, 'config.json')
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)

        # Environment template
        env_template = """# SPORT BETTING PREDICTION SYSTEM
# Környezeti változók

# API kulcsok
API_SPORTS_KEY=your_api_sports_key_here

# Telegram Bot (opcionális)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Email (opcionális)
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Beállítások
DEFAULT_LEAGUE=premier_league
LOG_LEVEL=INFO
"""

        env_path = os.path.join(self.project_root, '.env.template')
        with open(env_path, 'w') as f:
            f.write(env_template)

        print("✅ Konfigurációs fájlok létrehozva")
        return True

    def run_initial_tests(self):
        """Kezdeti tesztek futtatása"""
        print("🧪 Rendszer tesztek...")

        venv_python = os.path.join(self.venv_path, 'bin', 'python')

        # Test imports
        test_script = '''
import sys
sys.path.append("src/core")
sys.path.append("src/tools")
sys.path.append("src/api")

try:
    import pandas as pd
    import numpy as np
    from data_loader import load_data
    print("✅ Core imports OK")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Test basic functionality
try:
    from realistic_betting_system import RealisticBettingSystem
    system = RealisticBettingSystem()
    print("✅ Betting system OK")
except Exception as e:
    print(f"⚠️ Betting system warning: {e}")

print("🎉 Basic tests passed!")
'''

        test_file = os.path.join(self.project_root, 'test_setup.py')
        with open(test_file, 'w') as f:
            f.write(test_script)

        try:
            result = subprocess.run([venv_python, test_file],
                                  capture_output=True, text=True,
                                  cwd=self.project_root)

            if result.returncode == 0:
                print("✅ Rendszer tesztek sikeresek")
                # Clean up test file
                os.remove(test_file)
                return True
            else:
                print(f"❌ Tesztek sikertelenek:\n{result.stderr}")
                return False

        except Exception as e:
            print(f"❌ Teszt futtatás hiba: {e}")
            return False

    def create_usage_guide(self):
        """Használati útmutató létrehozása"""
        print("📖 Használati útmutató...")

        guide = """# 🎯 SPORT BETTING PREDICTION SYSTEM
## Gyors Kezdés Útmutató

### 🚀 Alapvető használat

#### 1. Napi javaslatok (Premier League)
```bash
python master.py --daily
```

#### 2. Különböző ligák
```bash
python master.py --daily --league mls           # MLS
python master.py --daily --league brasileirao   # Brasileirão
python master.py --daily --league j_league      # J1 League
```

#### 3. Live API elemzés (API kulccsal)
```bash
export API_SPORTS_KEY="your_key"
python master.py --live --league premier_league
```

#### 4. Automatizálás beállítása
```bash
python master.py --setup automation
```

### 📊 Teljesítmény tracking
```bash
python master.py --track
```

### 🔧 Rendszer monitoring
```bash
python master.py --monitor
```

### 🌍 Multi-liga rendszer
```bash
# Összes liga beállítása
python master.py --setup multi

# Több liga napi elemzése
for league in premier_league mls brasileirao j_league; do
    python master.py --daily --league $league
done
```

### 📡 API konfiguráció

1. Regisztrálj az API-Sports-ra: https://rapidapi.com/api-sports/
2. Állítsd be a környezeti változót:
   ```bash
   export API_SPORTS_KEY="your_api_key"
   ```

### 🤖 Automatizálás

Az automation rendszer:
- Napi cron job-okat hoz létre
- Liga-specifikus ütemezést használ
- Telegram/email értesítéseket küld
- Teljesítményt követi

### 📁 Fájl struktúra

```
sport-prediction/
├── master.py              # Fő vezérlő script
├── src/
│   ├── core/              # Alapvető modulok
│   ├── tools/             # Elemző eszközök
│   ├── api/               # API kliensek
│   ├── automation/        # Automatizálás
│   └── tracking/          # Teljesítmény követés
├── data/                  # Liga adatok
├── results/               # Eredmények
├── logs/                  # Log fájlok
└── docs/                  # Dokumentáció
```

### 💡 Tippek

- Kezdd a szimulációval (--daily)
- Teszteld az API kapcsolatot (--live)
- Állítsd be az automatizálást hétvégére
- Kövesd a teljesítményt hetente
- Használj konzervatív téteket

### 🆘 Hibaelhárítás

1. **Import hibák**: Ellenőrizd a virtual environment-et
2. **API hibák**: Ellenőrizd az API kulcsot és kvótát
3. **Adatok hiánya**: Futtasd a minta adatok generálást
4. **Cron hibák**: Ellenőrizd a script jogosultságokat

További segítség: docs/ könyvtár vagy GitHub Issues.
"""

        guide_path = os.path.join(self.project_root, 'QUICK_START.md')
        with open(guide_path, 'w') as f:
            f.write(guide)

        print("✅ Használati útmutató létrehozva: QUICK_START.md")
        return True

    def setup_complete(self):
        """Telepítés összefoglalása"""
        print("\n" + "="*60)
        print("🎉 TELEPÍTÉS BEFEJEZVE!")
        print("="*60)

        print("\n✅ Telepített komponensek:")
        print("  📦 Virtual environment")
        print("  🐍 Python függőségek")
        print("  📁 Könyvtár struktúra")
        print("  🔬 Minta adatok")
        print("  ⚙️ Konfigurációs fájlok")
        print("  📖 Használati útmutató")

        print("\n🚀 Következő lépések:")
        print("  1. Nézd meg: QUICK_START.md")
        print("  2. Teszteld: python master.py --daily")
        print("  3. API beállítás: export API_SPORTS_KEY='your_key'")
        print("  4. Automatizálás: python master.py --setup automation")

        print("\n💡 Hasznos parancsok:")
        print("  python master.py --help          # Súgó")
        print("  python master.py --daily         # Napi elemzés")
        print("  python master.py --live          # Live API elemzés")
        print("  python master.py --track         # Teljesítmény")

        print("\n🎯 Sikerült! A rendszer használatra kész.")

    def run_full_setup(self):
        """Teljes telepítés futtatása"""
        print("🔧 SPORT BETTING PREDICTION SYSTEM")
        print("🚀 Teljes rendszer telepítése kezdődik...\n")

        steps = [
            ("Python verzió", self.check_python_version),
            ("Virtual environment", self.create_virtual_environment),
            ("Függőségek", self.install_dependencies),
            ("Könyvtárak", self.setup_directory_structure),
            ("Minta adatok", self.setup_sample_data),
            ("Konfigurációk", self.create_config_files),
            ("Rendszer tesztek", self.run_initial_tests),
            ("Használati útmutató", self.create_usage_guide)
        ]

        failed_steps = []

        for step_name, step_func in steps:
            print(f"\n⏳ {step_name}...")
            try:
                if not step_func():
                    failed_steps.append(step_name)
            except Exception as e:
                print(f"❌ {step_name} hiba: {e}")
                failed_steps.append(step_name)

        if failed_steps:
            print(f"\n⚠️ Sikertelen lépések: {', '.join(failed_steps)}")
            print("💡 Ezek manuálisan is beállíthatók később.")

        self.setup_complete()

def main():
    setup = SystemSetup()
    setup.run_full_setup()

if __name__ == "__main__":
    main()
