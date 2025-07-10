#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
Comprehensive data pipeline validation and monitoring script.
Futtatja az összes fontosabb elemzést és generál egy átfogó jelentést.
"""

import os
import sys
import subprocess
import json
from datetime import datetime
from typing import Dict, Any

def run_script(script_path: str, description: str) -> Dict[str, Any]:
    """Run a validation script and capture its results"""
    print(f"\n🔄 {description}...")

    try:
        # Run the script
        result = subprocess.run(
            ['/home/bandi/Documents/code/2025/sp3/.venv/bin/python', script_path],
            capture_output=True,
            text=True,
            cwd='/home/bandi/Documents/code/2025/sp3'
        )

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'stdout': '',
            'stderr': '',
            'returncode': -1
        }

def load_report(file_path: str) -> Dict[str, Any]:
    """Load a JSON report file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        return {'error': str(e)}

def main():
    print("=== SP3 DATA PIPELINE COMPREHENSIVE VALIDATION ===")
    print(f"Időpont: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Scripts to run
    scripts = [
        {
            'path': 'scripts/quick_db_validation.py',
            'description': 'Database integritás ellenőrzés',
            'report_file': None
        },
        {
            'path': 'scripts/compare_json_vs_db.py',
            'description': 'JSON vs Database összehasonlítás',
            'report_file': 'reports/json_vs_db_comparison.json'
        },
        {
            'path': 'scripts/analyze_weekly_duplicates.py',
            'description': 'Heteken belüli duplikátumok elemzése',
            'report_file': 'reports/weekly_duplicates_analysis.json'
        }
    ]

    # Run all scripts
    results = {}
    for script in scripts:
        script_name = os.path.basename(script['path'])
        results[script_name] = run_script(script['path'], script['description'])

        if results[script_name]['success']:
            print(f"✅ {script['description']} - SIKERES")
        else:
            print(f"❌ {script['description']} - HIBA")
            print(f"   Error: {results[script_name].get('stderr', 'Unknown error')}")

    # Load and summarize reports
    print(f"\n=== JELENTÉSEK ÖSSZEGZÉSE ===")

    json_vs_db = {}
    weekly_dups = {}

    # JSON vs DB comparison
    try:
        json_vs_db = load_report('/home/bandi/Documents/code/2025/sp3/reports/json_vs_db_comparison.json')
        if 'summary' in json_vs_db:
            summary = json_vs_db['summary']
            print(f"\n📊 JSON vs Database:")
            print(f"   JSON meccsek: {summary.get('json_matches', 'N/A')}")
            print(f"   DB meccsek: {summary.get('db_matches', 'N/A')}")
            print(f"   Lefedettség: {summary.get('data_coverage_percent', 0):.1f}%")
            print(f"   Hiányzó (JSON-ban): {summary.get('only_in_json', 'N/A')}")
            print(f"   Extra (DB-ben): {summary.get('only_in_db', 'N/A')}")
    except Exception as e:
        print(f"   Hiba a JSON vs DB jelentés olvasásánál: {e}")

    # Weekly duplicates analysis
    try:
        weekly_dups = load_report('/home/bandi/Documents/code/2025/sp3/reports/weekly_duplicates_analysis.json')
        if 'summary' in weekly_dups:
            summary = weekly_dups['summary']
            print(f"\n🔄 Heteken belüli duplikátumok:")
            print(f"   Összes meccs: {summary.get('total_matches', 'N/A')}")
            print(f"   Egyedi ID-k: {summary.get('unique_match_ids', 'N/A')}")
            print(f"   Duplikátumok: {summary.get('duplicates_count', 'N/A')}")
            print(f"   Értékes duplikátumok: {summary.get('valuable_duplicates_count', 'N/A')}")
    except Exception as e:
        print(f"   Hiba a duplikátum jelentés olvasásánál: {e}")

    # Overall health assessment
    print(f"\n=== RENDSZER ÁLLAPOT ÉRTÉKELÉS ===")

    successful_scripts = sum(1 for result in results.values() if result['success'])
    total_scripts = len(results)

    health_score = (successful_scripts / total_scripts) * 100 if total_scripts > 0 else 0

    if health_score == 100:
        status = "🟢 EGÉSZSÉGES"
        message = "Minden ellenőrzés sikeres. A rendszer optimálisan működik."
    elif health_score >= 80:
        status = "🟡 FIGYELEM"
        message = "A legtöbb ellenőrzés sikeres, de vannak kisebb problémák."
    else:
        status = "🔴 KRITIKUS"
        message = "Több ellenőrzés sikertelen. Azonnali beavatkozás szükséges."

    print(f"Állapot: {status}")
    print(f"Sikerességi arány: {health_score:.0f}% ({successful_scripts}/{total_scripts})")
    print(f"Üzenet: {message}")

    # Recommendations
    print(f"\n=== AJÁNLÁSOK ===")

    if health_score == 100:
        print("✅ Rendszeres monitorozás folytatása")
        print("✅ Hetente futtatni ezt a comprehensive validation-t")
        print("✅ Opcionális: automatizálás cron job-bal")
    else:
        print("⚠️  Sikertelen ellenőrzések kivizsgálása")
        print("⚠️  Log fájlok áttekintése")
        print("⚠️  Backend és database kapcsolat ellenőrzése")

    # Save comprehensive report
    comprehensive_report = {
        'timestamp': datetime.now().isoformat(),
        'health_score': health_score,
        'status': status,
        'script_results': results,
        'successful_scripts': successful_scripts,
        'total_scripts': total_scripts,
        'reports_summary': {
            'json_vs_db': json_vs_db.get('summary', {}),
            'weekly_duplicates': weekly_dups.get('summary', {})
        }
    }

    report_path = '/home/bandi/Documents/code/2025/sp3/reports/comprehensive_validation_report.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(comprehensive_report, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n📋 Átfogó jelentés mentve: {report_path}")
    print(f"\n=== VALIDATION BEFEJEZVE ===")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Kritikus hiba: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
