#!/usr/bin/env python3
"""
🚀 MASTER CONTROL SCRIPT
Az összes új funkció központi irányítása.
"""

import os
import sys
import argparse
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description='Sport Betting Prediction System - Master Control')

    # Főbb funkciók
    parser.add_argument('--daily', action='store_true', help='Napi fogadási javaslatok')
    parser.add_argument('--league', default='premier_league',
                       choices=['premier_league', 'mls', 'brasileirao', 'j_league'],
                       help='Liga választás (premier_league, mls, brasileirao, j_league)')
    parser.add_argument('--setup', choices=['mls', 'multi', 'automation', 'tracking', 'enhanced'], help='Rendszer telepítése')
    parser.add_argument('--api', action='store_true', help='Valós API adatok letöltése')
    parser.add_argument('--live', action='store_true', help='Live betting elemzés')
    parser.add_argument('--track', action='store_true', help='Teljesítmény tracking')
    parser.add_argument('--monitor', action='store_true', help='Rendszer monitoring')
    parser.add_argument('--enhanced', action='store_true', help='Bővített multi-liga elemzés')
    parser.add_argument('--live-predict', action='store_true', help='Következő 4 óra meccsek predikciója')
    parser.add_argument('--enhanced-live-predict', action='store_true', help='Továbbfejlesztett 4 órás meccs predikció (aszinkron, több API)')
    parser.add_argument('--demo-enhanced-live', action='store_true', help='Továbbfejlesztett predikció demo (szimulált adatokkal)')
    parser.add_argument('--pdf-betting', action='store_true', help='PDF-alapú fogadási rendszer (magyar odds)')
    parser.add_argument('--enhanced-prediction', action='store_true', help='Továbbfejlesztett predikció (gólok, szögletek, lapok)')
    parser.add_argument('--pdf-demo', action='store_true', help='PDF workflow egyszerű demo')

    # Új archívum funkciók
    parser.add_argument('--archive-demo', action='store_true', help='SzerencseMix archívum demo')
    parser.add_argument('--download-archive', action='store_true', help='SzerencseMix PDF archívum letöltése')
    parser.add_argument('--process-archive', action='store_true', help='PDF archívum feldolgozása')
    parser.add_argument('--archive-extract-only', action='store_true', help='Csak PDF linkek kinyerése (letöltés nélkül)')
    parser.add_argument('--archive-workers', type=int, default=3, help='Párhuzamos munkák száma archívum feldolgozáshoz')
    parser.add_argument('--archive-delay', type=float, default=2.0, help='Késleltetés letöltések között (másodperc)')

    args = parser.parse_args()

    print("🚀 SPORT BETTING PREDICTION SYSTEM")
    print("🎯 Master Control Interface")
    print("=" * 50)

    project_root = os.path.dirname(__file__)
    venv_python = os.path.join(project_root, 'venv', 'bin', 'python')

    # 1. Napi javaslatok
    if args.daily:
        print(f"🌅 Napi javaslatok futtatása ({args.league})...")
        script = os.path.join(project_root, 'src', 'tools', 'daily_betting_assistant.py')
        os.system(f"{venv_python} {script} --league {args.league}")
        return

    # 2. Rendszer telepítések
    if args.setup:
        if args.setup == 'mls':
            print("🇺🇸 MLS rendszer telepítése...")
            script = os.path.join(project_root, 'setup_mls.py')
            os.system(f"{venv_python} {script}")

        elif args.setup == 'multi':
            print("🌍 Multi-liga rendszer telepítése...")
            script = os.path.join(project_root, 'src', 'api', 'multi_league_system.py')
            os.system(f"{venv_python} {script}")

        elif args.setup == 'automation':
            print("🤖 Fejlett automatizálás telepítése...")
            script = os.path.join(project_root, 'src', 'automation', 'enhanced_automation_system.py')
            os.system(f"{venv_python} {script} --setup")

        elif args.setup == 'tracking':
            print("📈 Teljesítmény tracking telepítése...")
            script = os.path.join(project_root, 'src', 'tracking', 'performance_tracker.py')
            os.system(f"{venv_python} {script}")

        elif args.setup == 'enhanced':
            print("🌍 Kibővített multi-liga rendszer telepítése...")
            script = os.path.join(project_root, 'src', 'analysis', 'expanded_league_system.py')
            os.system(f"{venv_python} {script}")
        return

    # 3. API adatok
    if args.api:
        print("🔄 Valós API adatok letöltése...")

        if args.league == 'all':
            leagues = ['premier_league', 'mls', 'brasileirao', 'j_league']
        else:
            leagues = [args.league]

        for league in leagues:
            print(f"\n📡 {league.upper()} adatok...")
            script = os.path.join(project_root, 'src', 'api', 'live_api_client.py')
            os.system(f"{venv_python} {script} --league {league} --download")
        return

    # 4. Live elemzés
    if args.live:
        print(f"🔴 Live betting elemzés ({args.league})...")
        script = os.path.join(project_root, 'src', 'tools', 'live_betting_analyzer.py')
        os.system(f"{venv_python} {script} --league {args.league} --save")
        return

    # 5. Teljesítmény tracking
    if args.track:
        print("📊 Teljesítmény jelentés...")
        script = os.path.join(project_root, 'src', 'tracking', 'performance_tracker.py')
        os.system(f"{venv_python} {script}")
        return

    # 6. Monitoring
    if args.monitor:
        print("🔍 Rendszer monitoring...")
        script = os.path.join(project_root, 'src', 'automation', 'system_monitor.py')
        os.system(f"{venv_python} {script}")
        return

    # 7. Bővített elemzés
    if args.enhanced:
        print("🧠 Bővített multi-liga elemzés...")
        script = os.path.join(project_root, 'src', 'analysis', 'enhanced_analysis_engine.py')
        os.system(f"{venv_python} {script}")
        return

    # 8. Valós idejű predikció
    if args.live_predict:
        print("⏰ Következő 4 óra meccsek predikciója...")
        script = os.path.join(project_root, 'src', 'tools', 'live_match_predictor.py')
        os.system(f"{venv_python} {script}")
        return

    # 9. Továbbfejlesztett valós idejű predikció
    if args.enhanced_live_predict:
        print("🚀 Továbbfejlesztett 4 órás meccs predikció...")
        script = os.path.join(project_root, 'src', 'tools', 'enhanced_live_predictor.py')
        os.system(f"{venv_python} {script}")
        return

    # 10. Demo továbbfejlesztett predikció
    if args.demo_enhanced_live:
        print("🎭 Továbbfejlesztett predikció demo...")
        script = os.path.join(project_root, 'src', 'tools', 'enhanced_live_predictor_demo.py')
        os.system(f"{venv_python} {script}")
        return

    # 11. PDF-alapú fogadási rendszer
    if args.pdf_betting:
        print("📄 PDF-alapú fogadási rendszer...")
        script = os.path.join(project_root, 'src', 'tools', 'hungarian_pdf_processor.py')
        os.system(f"{venv_python} {script}")
        return

    # 12. Továbbfejlesztett predikció
    if args.enhanced_prediction:
        print("🎯 Továbbfejlesztett predikció motor...")
        script = os.path.join(project_root, 'src', 'prediction', 'enhanced_prediction_engine.py')
        os.system(f"{venv_python} {script}")
        return

    # 13. PDF egyszerű demo
    if args.pdf_demo:
        print("📑 PDF workflow egyszerű demo...")
        script = os.path.join(project_root, 'simple_pdf_demo.py')
        os.system(f"{venv_python} {script}")
        return

    # 14. SzerencseMix archívum funkciók
    if args.archive_demo:
        print("🎪 SzerencseMix archívum demo futtatása...")
        script = os.path.join(project_root, 'szerencsemix_archive_demo.py')
        os.system(f"{venv_python} {script}")
        return

    if args.download_archive:
        print("📥 SzerencseMix PDF archívum letöltése...")
        script = os.path.join(project_root, 'src', 'data_collection', 'szerencsemix_downloader.py')
        cmd = f"{venv_python} {script} --workers {args.archive_workers} --delay {args.archive_delay}"
        os.system(cmd)
        return

    if args.process_archive:
        print("⚙️ PDF archívum feldolgozása...")
        script = os.path.join(project_root, 'src', 'data_collection', 'batch_pdf_processor.py')
        cmd = f"{venv_python} {script} --workers {args.archive_workers}"
        os.system(cmd)
        return

    if args.archive_extract_only:
        print("🔍 PDF linkek kinyerése (letöltés nélkül)...")
        script = os.path.join(project_root, 'src', 'data_collection', 'szerencsemix_downloader.py')
        cmd = f"{venv_python} {script} --extract-only"
        os.system(cmd)
        return

    # Default: help menü
    print_main_menu()

def print_main_menu():
    """Főmenü megjelenítése"""
    menu_text = """
🎯 ELÉRHETŐ FUNKCIÓK:

📅 NAPI HASZNÁLAT:
  python master.py --daily                    # Napi javaslatok (Premier League)
  python master.py --daily --league mls       # MLS napi javaslatok
  python master.py --daily --league brasileirao # Brasileirão javaslatok

🔧 TELEPÍTÉSEK:
  python master.py --setup mls               # MLS rendszer
  python master.py --setup multi             # Multi-liga rendszer
  python master.py --setup automation        # Automatizálás (cron, bot)
  python master.py --setup tracking          # Teljesítmény tracking
  python master.py --setup enhanced          # Kibővített multi-liga rendszer

📊 FEJLETT FUNKCIÓK:
  python master.py --api                     # Valós API adatok
  python master.py --live                    # Live betting elemzés
  python master.py --track                   # Teljesítmény jelentés
  python master.py --monitor                 # Rendszer monitoring
  python master.py --enhanced                # Bővített elemzés (21 bajnokság!)
  python master.py --live-predict            # Következő 4 óra meccsek predikciója
  python master.py --enhanced-live-predict   # Továbbfejlesztett 4 órás meccs predikció
  python master.py --demo-enhanced-live      # Továbbfejlesztett predikció demo (szimulált adatokkal)
  python master.py --pdf-betting             # PDF-alapú fogadási rendszer (magyar odds)
  python master.py --enhanced-prediction     # Továbbfejlesztett predikció (gólok, szögletek, lapok)
  python master.py --pdf-demo                # PDF workflow egyszerű demo

📂 ARCHÍVUM FUNKCIÓK:
  python master.py --archive-demo             # SzerencseMix archívum demo
  python master.py --download-archive         # SzerencseMix PDF archívum letöltése
  python master.py --process-archive          # PDF archívum feldolgozása
  python master.py --archive-extract-only     # Csak PDF linkek kinyerése (letöltés nélkül)

🌍 MULTI-LIGA TÁMOGATÁS:
  Elérhető ligák: premier_league, mls, brasileirao, j_league

💡 TIPPEK:
  - Kezdd a --daily funkcióval
  - API kulcs: export API_SPORTS_KEY='your_key'
  - Automatizálás: --setup automation
"""
    print(menu_text)

def show_advanced_info():
    """Részletes információk megjelenítése"""
    advanced_text = """
📁 KÖZVETLEN SCRIPTEK:
  🌅 Napi asszisztens:     src/tools/daily_betting_assistant.py
  🔮 Előrejelző motor:     src/tools/prediction_engine.py
  📊 Realisztikus szimuláció: src/tools/realistic_betting_system.py
  📅 Hétvégi példa:        src/tools/weekend_betting_example.py

🔗 API INTEGRÁLÁS:
  🇺🇸 MLS API:            src/api/mls_api_client.py
  🌍 Multi-liga:          src/api/multi_league_system.py
  🔴 Live API:            src/api/live_api_client.py

🤖 AUTOMATIZÁLÁS:
  ⏰ Cron jobs:           src/automation/enhanced_automation_system.py
  📱 Telegram bot:        src/automation/telegram_bot.py
  📧 Email értesítések:   src/automation/email_notifier.py

📈 TRACKING & MONITORING:
  📊 Teljesítmény:        src/tracking/performance_tracker.py
  🔍 Monitoring:          src/automation/system_monitor.py

💡 PÉLDA WORKFLOW:
  1. python master.py --setup multi          # Multi-liga telepítés
  2. python master.py --api                  # Valós adatok letöltése
  3. python master.py --daily --league mls   # MLS napi javaslatok
  4. python master.py --live --league mls    # Live API elemzés
  5. python master.py --track                # Teljesítmény követés

📚 Dokumentáció: docs/ mappa
"""
    print(advanced_text)

if __name__ == "__main__":
    main()
