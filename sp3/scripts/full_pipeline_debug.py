#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
FULL PIPELINE RESET AND DEBUG SYSTEM
=====================================

Ez a szkript:
1. Clean slate - minden JSON és DB adat törlése
2. Comprehensive logging rendszer beállítása
3. Step-by-step pipeline futtatás teljes monitoringgal
4. Minden lépésben anomália detektálás és dokumentálás
"""

import os
import sys
import json
import shutil
import psycopg2
import subprocess
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Paths
PROJECT_ROOT = "/home/bandi/Documents/code/2025/sp3"
ML_PIPELINE_ROOT = f"{PROJECT_ROOT}/ml_pipeline"
JSON_PROCESSED_DIR = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons/processed"
TXT_DIR = f"{ML_PIPELINE_ROOT}/betting_extractor/txts"
PDF_DIR = f"{ML_PIPELINE_ROOT}/betting_extractor/pdfs"
DEBUG_LOGS_DIR = f"{PROJECT_ROOT}/debug_logs"
REPORTS_DIR = f"{PROJECT_ROOT}/reports"

# Database config
DB_CONFIG = {
    'host': 'localhost',
    'database': 'sp3_db',
    'user': 'sp3_user',
    'password': 'sp3_password',
    'port': 55432
}

class PipelineDebugger:
    def __init__(self):
        self.debug_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.debug_dir = f"{DEBUG_LOGS_DIR}/session_{self.debug_session_id}"
        self.setup_logging()

        # Statistics tracking
        self.stats = {
            'pdf_files': 0,
            'txt_lines': {},
            'txt_matches': {},
            'json_matches': {},
            'json_duplicates': {},
            'db_imported': 0,
            'anomalies': [],
            'data_loss_points': []
        }

    def setup_logging(self):
        """Setup comprehensive logging directory structure"""
        os.makedirs(self.debug_dir, exist_ok=True)
        os.makedirs(f"{self.debug_dir}/step_by_step", exist_ok=True)
        os.makedirs(f"{self.debug_dir}/comparisons", exist_ok=True)
        os.makedirs(f"{self.debug_dir}/anomalies", exist_ok=True)

        print(f"🔧 Debug session started: {self.debug_session_id}")
        print(f"📁 Debug logs: {self.debug_dir}")

    def log_step(self, step_name: str, data: Any, description: str = ""):
        """Log a pipeline step with full data"""
        timestamp = datetime.now().isoformat()

        log_entry = {
            'timestamp': timestamp,
            'step': step_name,
            'description': description,
            'data': data,
            'session_id': self.debug_session_id
        }

        # Save step log
        step_file = f"{self.debug_dir}/step_by_step/{step_name}_{timestamp.replace(':', '_')}.json"
        with open(step_file, 'w', encoding='utf-8') as f:
            json.dump(log_entry, f, indent=2, ensure_ascii=False, default=str)

        print(f"📝 {step_name}: {description}")

    def log_anomaly(self, anomaly_type: str, details: Dict, severity: str = "medium"):
        """Log detected anomaly"""
        anomaly = {
            'timestamp': datetime.now().isoformat(),
            'type': anomaly_type,
            'severity': severity,
            'details': details,
            'session_id': self.debug_session_id
        }

        self.stats['anomalies'].append(anomaly)

        # Save anomaly
        anomaly_file = f"{self.debug_dir}/anomalies/{anomaly_type}_{len(self.stats['anomalies'])}.json"
        with open(anomaly_file, 'w', encoding='utf-8') as f:
            json.dump(anomaly, f, indent=2, ensure_ascii=False, default=str)

        severity_emoji = {"low": "🟡", "medium": "🟠", "high": "🔴"}
        print(f"{severity_emoji.get(severity, '⚠️')} ANOMÁLIA [{severity.upper()}]: {anomaly_type}")
        print(f"   Details: {details}")

    def clean_slate(self):
        """Complete clean slate - remove all processed data"""
        print("\n🧹 CLEAN SLATE - Minden feldolgozott adat törlése...")

        # 1. Remove JSON files from both locations
        jsons_dir = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons"
        removed_files = []

        # Remove from main jsons directory
        if os.path.exists(jsons_dir):
            json_files = [f for f in os.listdir(jsons_dir) if f.endswith('.json')]
            for json_file in json_files:
                os.remove(os.path.join(jsons_dir, json_file))
                removed_files.append(f"jsons/{json_file}")

        # Remove from processed directory
        if os.path.exists(JSON_PROCESSED_DIR):
            json_files = [f for f in os.listdir(JSON_PROCESSED_DIR) if f.endswith('.json')]
            for json_file in json_files:
                os.remove(os.path.join(JSON_PROCESSED_DIR, json_file))
                removed_files.append(f"processed/{json_file}")

        print(f"   ✅ {len(removed_files)} JSON fájl törölve")
        self.log_step("clean_slate_json", {"removed_files": removed_files}, f"Removed {len(removed_files)} JSON files")

        # 2. Reset database
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            # Get counts before deletion
            cur.execute("SELECT COUNT(*) FROM matches")
            matches_before = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM odds")
            odds_before = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM markets")
            markets_before = cur.fetchone()[0]

            # Delete in correct order (respect foreign keys)
            cur.execute("DELETE FROM odds")
            cur.execute("DELETE FROM markets")
            cur.execute("DELETE FROM matches")
            # Keep teams and competitions for reference

            conn.commit()
            cur.close()
            conn.close()

            print(f"   ✅ Database reset: {matches_before} matches, {markets_before} markets, {odds_before} odds törölve")
            self.log_step("clean_slate_db", {
                "matches_removed": matches_before,
                "markets_removed": markets_before,
                "odds_removed": odds_before
            }, "Database tables cleared")

        except Exception as e:
            print(f"   ❌ Database reset hiba: {e}")
            self.log_anomaly("database_reset_failed", {"error": str(e)}, "high")

        # 3. Clear old debug logs (keep last 5 sessions)
        if os.path.exists(DEBUG_LOGS_DIR):
            sessions = [d for d in os.listdir(DEBUG_LOGS_DIR) if d.startswith('session_')]
            sessions.sort()
            if len(sessions) > 5:
                for old_session in sessions[:-5]:
                    shutil.rmtree(os.path.join(DEBUG_LOGS_DIR, old_session))
                print(f"   ✅ {len(sessions) - 5} régi debug session törölve")

    def analyze_source_files(self):
        """Analyze PDF and TXT source files"""
        print("\n📁 FORRÁS FÁJLOK ELEMZÉSE...")

        # Count PDFs
        pdf_files = []
        if os.path.exists(PDF_DIR):
            pdf_files = [f for f in os.listdir(PDF_DIR) if f.endswith('.pdf')]

        self.stats['pdf_files'] = len(pdf_files)
        print(f"   📄 PDF fájlok: {len(pdf_files)}")

        # Analyze TXT files
        txt_files = []
        if os.path.exists(TXT_DIR):
            txt_files = [f for f in os.listdir(TXT_DIR) if f.endswith('.txt')]

        for txt_file in txt_files:
            txt_path = os.path.join(TXT_DIR, txt_file)
            try:
                with open(txt_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    self.stats['txt_lines'][txt_file] = len(lines)

                # Quick match count estimate (lines containing "vs" or team patterns)
                match_lines = [line for line in lines if ' vs ' in line.lower() or ' - ' in line]
                self.stats['txt_matches'][txt_file] = len(match_lines)

            except Exception as e:
                self.log_anomaly("txt_read_error", {"file": txt_file, "error": str(e)}, "medium")

        print(f"   📝 TXT fájlok: {len(txt_files)}")
        for txt_file, line_count in self.stats['txt_lines'].items():
            match_estimate = self.stats['txt_matches'].get(txt_file, 0)
            print(f"      {txt_file}: {line_count} sor, ~{match_estimate} meccs")

        self.log_step("analyze_sources", {
            "pdf_files": pdf_files,
            "txt_files": list(self.stats['txt_lines'].keys()),
            "txt_stats": self.stats['txt_lines'],
            "txt_match_estimates": self.stats['txt_matches']
        }, "Source files analyzed")

        # Check for missing correspondences
        pdf_names = [f.replace('.pdf', '') for f in pdf_files]
        txt_names = [f.replace('.txt', '') for f in txt_files]

        missing_txt = set(pdf_names) - set(txt_names)
        missing_pdf = set(txt_names) - set(pdf_names)

        if missing_txt:
            self.log_anomaly("missing_txt_files", {"pdf_without_txt": list(missing_txt)}, "medium")
        if missing_pdf:
            self.log_anomaly("orphaned_txt_files", {"txt_without_pdf": list(missing_pdf)}, "low")

    def run_txt_to_json_with_monitoring(self):
        """Run TXT to JSON conversion with detailed monitoring"""
        print("\n🔄 TXT → JSON KONVERZIÓ MONITOROZÁSSAL...")

        # Run the conversion process
        try:
            result = subprocess.run([
                f"{PROJECT_ROOT}/.venv/bin/python",
                f"{ML_PIPELINE_ROOT}/betting_extractor/scripts/process_all_pdfs.py"
            ], capture_output=True, text=True, cwd=PROJECT_ROOT)

            self.log_step("txt_to_json_process", {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }, "TXT to JSON conversion executed")

            if result.returncode != 0:
                self.log_anomaly("txt_to_json_failed", {
                    "returncode": result.returncode,
                    "stderr": result.stderr
                }, "high")
                return False

            print("   ✅ TXT → JSON konverzió sikeres")

        except Exception as e:
            self.log_anomaly("txt_to_json_exception", {"error": str(e)}, "high")
            return False

        # Analyze generated JSON files
        self.analyze_generated_jsons()
        return True

    def analyze_generated_jsons(self):
        """Analyze generated JSON files for anomalies"""
        print("\n📊 GENERÁLT JSON FÁJLOK ELEMZÉSE...")

        # First check main jsons directory
        jsons_dir = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons"
        json_files = []

        if os.path.exists(jsons_dir):
            json_files = [f for f in os.listdir(jsons_dir) if f.endswith('.json')]

        print(f"   📁 JSON fájlok a /jsons/ mappában: {len(json_files)}")

        total_matches = 0
        all_match_ids = []

        for json_file in json_files:
            json_path = os.path.join(jsons_dir, json_file)
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    matches = data.get('matches', [])

                    self.stats['json_matches'][json_file] = len(matches)
                    total_matches += len(matches)

                    # Collect match IDs for duplicate analysis
                    for match in matches:
                        match_id = f"{match.get('date', '')}_{match.get('team1', '')}_{match.get('team2', '')}_{match.get('competition', '')}"
                        all_match_ids.append((match_id, json_file))

                    print(f"   📄 {json_file}: {len(matches)} meccs")

                    # Check for anomalies in this file
                    self.check_json_anomalies(json_file, matches)

            except Exception as e:
                self.log_anomaly("json_read_error", {"file": json_file, "error": str(e)}, "high")

        print(f"   📊 Összes JSON meccs: {total_matches}")

        # Analyze duplicates across files
        self.analyze_cross_file_duplicates(all_match_ids)

        # Compare with TXT estimates
        self.compare_txt_vs_json()

        self.log_step("analyze_json_output", {
            "json_files": json_files,
            "json_match_counts": self.stats['json_matches'],
            "total_matches": total_matches
        }, "JSON files analyzed")

    def check_json_anomalies(self, json_file: str, matches: List[Dict]):
        """Check for anomalies within a single JSON file"""

        # Check for empty/null critical fields
        issues = {
            'missing_date': 0,
            'missing_teams': 0,
            'missing_competition': 0,
            'missing_markets': 0,
            'invalid_odds': 0
        }

        for match in matches:
            if not match.get('date'):
                issues['missing_date'] += 1
            if not match.get('team1') or not match.get('team2'):
                issues['missing_teams'] += 1
            if not match.get('competition'):
                issues['missing_competition'] += 1

            markets = match.get('markets', [])
            if not markets:
                issues['missing_markets'] += 1

            for market in markets:
                odds = market.get('odds')
                if odds is not None:
                    try:
                        odds_val = float(odds)
                        if odds_val <= 0 or odds_val > 100:
                            issues['invalid_odds'] += 1
                    except:
                        issues['invalid_odds'] += 1

        # Log significant issues
        for issue_type, count in issues.items():
            if count > 0:
                severity = "high" if count > len(matches) * 0.1 else "medium"
                self.log_anomaly(f"json_{issue_type}", {
                    "file": json_file,
                    "count": count,
                    "total_matches": len(matches),
                    "percentage": round(count / len(matches) * 100, 2)
                }, severity)

    def analyze_cross_file_duplicates(self, all_match_ids: List[tuple]):
        """Analyze duplicates across JSON files"""
        from collections import defaultdict

        match_id_to_files = defaultdict(list)
        for match_id, json_file in all_match_ids:
            match_id_to_files[match_id].append(json_file)

        duplicates = {match_id: files for match_id, files in match_id_to_files.items() if len(files) > 1}

        if duplicates:
            print(f"   🔄 Cross-file duplikátumok: {len(duplicates)}")

            self.stats['json_duplicates'] = duplicates

            # Log sample duplicates
            sample_duplicates = dict(list(duplicates.items())[:5])
            self.log_step("cross_file_duplicates", {
                "total_duplicates": len(duplicates),
                "sample_duplicates": sample_duplicates,
                "all_duplicates": duplicates
            }, f"Found {len(duplicates)} cross-file duplicates")

            # Check if duplicates are identical or different
            self.compare_duplicate_content(duplicates)
        else:
            print("   ✅ Nincsenek cross-file duplikátumok")

    def compare_duplicate_content(self, duplicates: Dict[str, List[str]]):
        """Compare content of duplicate matches across files"""
        print("   🔍 Duplikátum tartalom összehasonlítás...")

        jsons_dir = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons"
        identical_count = 0
        different_count = 0

        for match_id, files in list(duplicates.items())[:5]:  # Check first 5
            if len(files) < 2:
                continue

            # Load matches from different files
            matches = []
            for file in files:
                json_path = os.path.join(jsons_dir, file)
                with open(json_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for match in data.get('matches', []):
                        current_id = f"{match.get('date', '')}_{match.get('team1', '')}_{match.get('team2', '')}_{match.get('competition', '')}"
                        if current_id == match_id:
                            matches.append((match, file))
                            break

            if len(matches) >= 2:
                match1, file1 = matches[0]
                match2, file2 = matches[1]

                # Compare market content
                markets1 = match1.get('markets', [])
                markets2 = match2.get('markets', [])

                if json.dumps(markets1, sort_keys=True) == json.dumps(markets2, sort_keys=True):
                    identical_count += 1
                else:
                    different_count += 1

                    # Log significant difference
                    self.log_anomaly("duplicate_content_differs", {
                        "match_id": match_id,
                        "file1": file1,
                        "file2": file2,
                        "markets1_count": len(markets1),
                        "markets2_count": len(markets2)
                    }, "medium")

        print(f"      Azonos tartalom: {identical_count}")
        print(f"      Eltérő tartalom: {different_count}")

    def compare_txt_vs_json(self):
        """Compare TXT estimates vs actual JSON counts"""
        print("\n📈 TXT vs JSON ÖSSZEHASONLÍTÁS...")

        significant_differences = []

        for txt_file, txt_estimate in self.stats['txt_matches'].items():
            json_file = txt_file.replace('.txt', '.json')
            json_actual = self.stats['json_matches'].get(json_file, 0)

            if txt_estimate > 0:
                difference_ratio = abs(txt_estimate - json_actual) / txt_estimate

                print(f"   {txt_file}: {txt_estimate} → {json_actual} ({difference_ratio:.1%})")

                if difference_ratio > 0.2:  # >20% difference
                    significant_differences.append({
                        "file": txt_file,
                        "txt_estimate": txt_estimate,
                        "json_actual": json_actual,
                        "difference_ratio": difference_ratio
                    })

        if significant_differences:
            self.log_anomaly("significant_txt_json_difference", {
                "differences": significant_differences
            }, "medium")
            print(f"   ⚠️ {len(significant_differences)} fájlban jelentős eltérés")

    def move_jsons_to_processed(self):
        """Move JSON files from /jsons/ to /jsons/processed/ for backend import"""
        print("\n📁 JSON FÁJLOK ÁTHELYEZÉSE A PROCESSED MAPPÁBA...")

        jsons_dir = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons"

        # Ensure processed directory exists
        os.makedirs(JSON_PROCESSED_DIR, exist_ok=True)

        moved_files = []
        if os.path.exists(jsons_dir):
            for filename in os.listdir(jsons_dir):
                if filename.endswith('.json'):
                    source_path = os.path.join(jsons_dir, filename)
                    dest_path = os.path.join(JSON_PROCESSED_DIR, filename)

                    # Move file
                    shutil.move(source_path, dest_path)
                    moved_files.append(filename)
                    print(f"   📄 {filename} → processed/")

        print(f"   ✅ {len(moved_files)} JSON fájl áthelyezve")

        self.log_step("move_jsons_to_processed", {
            "moved_files": moved_files,
            "destination": JSON_PROCESSED_DIR
        }, f"Moved {len(moved_files)} JSON files to processed directory")

        return len(moved_files)

    def trigger_backend_import(self):
        """Trigger backend import manually"""
        print("\n🔄 BACKEND IMPORT TRIGGERING...")

        try:
            # Use docker to run the import command
            result = subprocess.run([
                "docker", "exec", "sp3_backend",
                "npm", "run", "trigger-import"
            ], capture_output=True, text=True, cwd=PROJECT_ROOT)

            self.log_step("trigger_backend_import", {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr
            }, "Backend import triggered manually")

            if result.returncode == 0:
                print("   ✅ Backend import trigger sikeres")
                return True
            else:
                print(f"   ❌ Backend import trigger hiba: {result.stderr}")
                self.log_anomaly("backend_import_trigger_failed", {
                    "returncode": result.returncode,
                    "stderr": result.stderr
                }, "high")
                return False

        except Exception as e:
            print(f"   ❌ Backend import trigger exception: {e}")
            self.log_anomaly("backend_import_trigger_exception", {"error": str(e)}, "high")
            return False

    def run_backend_import_with_monitoring(self):
        """Run backend import with monitoring"""
        print("\n🔄 BACKEND IMPORT MONITOROZÁSSAL...")

        # Get initial DB state (should be empty after reset)
        initial_counts = self.get_db_counts()
        print(f"   📊 Initial DB state: {initial_counts}")

        # Move JSON files to processed directory
        moved_files_count = self.move_jsons_to_processed()

        if moved_files_count == 0:
            print("   ⚠️ Nincsenek JSON fájlok az importáláshoz!")
            return

        # Trigger backend import
        if not self.trigger_backend_import():
            print("   ❌ Backend import nem sikerült triggerelni")
            return

        # Wait for import to complete
        print("   ⏳ Várakozás az import befejezésére...")
        import time
        time.sleep(15)  # Wait longer for import to complete

        # Get final DB state
        final_counts = self.get_db_counts()
        print(f"   📊 Final DB state: {final_counts}")

        import_results = {
            "initial": initial_counts,
            "final": final_counts,
            "imported": {
                "matches": final_counts["matches"] - initial_counts["matches"],
                "markets": final_counts["markets"] - initial_counts["markets"],
                "odds": final_counts["odds"] - initial_counts["odds"]
            }
        }

        print(f"   📊 Import eredmény:")
        print(f"      Meccsek: {import_results['imported']['matches']}")
        print(f"      Piacok: {import_results['imported']['markets']}")
        print(f"      Oddsok: {import_results['imported']['odds']}")

        self.log_step("backend_import", import_results, "Backend import completed")

        # Check for data loss
        total_json_matches = sum(self.stats['json_matches'].values())
        imported_matches = import_results['imported']['matches']

        if imported_matches < total_json_matches:
            data_loss = total_json_matches - imported_matches
            self.log_anomaly("data_loss_in_import", {
                "json_matches": total_json_matches,
                "imported_matches": imported_matches,
                "lost_matches": data_loss,
                "loss_percentage": round(data_loss / total_json_matches * 100, 2)
            }, "high" if data_loss > total_json_matches * 0.1 else "medium")
        elif imported_matches == total_json_matches:
            print("   ✅ Nincs adatvesztés - minden JSON meccs importálva!")
        else:
            print(f"   ⚠️ Több meccs importálva ({imported_matches}) mint JSON-ban ({total_json_matches}) - duplikáció!")
            self.log_anomaly("more_imported_than_json", {
                "json_matches": total_json_matches,
                "imported_matches": imported_matches,
                "extra_matches": imported_matches - total_json_matches
            }, "medium")

    def verify_no_duplicates_in_db(self):
        """Verify there are no duplicates in the database"""
        print("\n🔍 DATABASE DUPLIKÁTUM ELLENŐRZÉS...")

        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            # Check for duplicate matches (same date, teams, competition)
            cur.execute("""
                SELECT
                    m.date::date,
                    ht.name as home_team,
                    at.name as away_team,
                    c.name as competition,
                    COUNT(*) as count
                FROM matches m
                LEFT JOIN teams ht ON ht.id = m."homeTeamId"
                LEFT JOIN teams at ON at.id = m."awayTeamId"
                LEFT JOIN competitions c ON c.id = m."competitionId"
                GROUP BY m.date::date, ht.name, at.name, c.name
                HAVING COUNT(*) > 1
                ORDER BY count DESC
                LIMIT 10
            """)

            duplicates = cur.fetchall()

            if duplicates:
                print(f"   ❌ {len(duplicates)} duplikátum találva a database-ben!")
                for dup in duplicates:
                    print(f"      {dup[0]} {dup[1]} vs {dup[2]} ({dup[3]}): {dup[4]} példány")

                self.log_anomaly("database_duplicates_found", {
                    "duplicate_count": len(duplicates),
                    "duplicates": [{"date": str(d[0]), "home": d[1], "away": d[2], "competition": d[3], "count": d[4]} for d in duplicates]
                }, "high")
            else:
                print("   ✅ Nincsenek duplikátumok a database-ben!")

            cur.close()
            conn.close()

        except Exception as e:
            print(f"   ❌ Database duplikátum ellenőrzés hiba: {e}")
            self.log_anomaly("db_duplicate_check_failed", {"error": str(e)}, "medium")

    def get_db_counts(self) -> Dict[str, int]:
        """Get current database counts"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            counts = {}
            for table in ['matches', 'markets', 'odds', 'teams', 'competitions']:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                counts[table] = cur.fetchone()[0]

            cur.close()
            conn.close()
            return counts

        except Exception as e:
            self.log_anomaly("db_count_error", {"error": str(e)}, "medium")
            return {}

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n📋 VÉGSŐ JELENTÉS GENERÁLÁSA...")

        # Calculate summary statistics
        total_anomalies = len(self.stats['anomalies'])
        high_severity = len([a for a in self.stats['anomalies'] if a['severity'] == 'high'])

        # Overall pipeline health
        if high_severity > 0:
            health_status = "🔴 KRITIKUS"
        elif total_anomalies > 10:
            health_status = "🟡 FIGYELEM"
        else:
            health_status = "🟢 EGÉSZSÉGES"

        final_report = {
            "session_id": self.debug_session_id,
            "timestamp": datetime.now().isoformat(),
            "health_status": health_status,
            "statistics": self.stats,
            "summary": {
                "pdf_files": self.stats['pdf_files'],
                "txt_files": len(self.stats['txt_lines']),
                "json_files": len(self.stats['json_matches']),
                "total_txt_matches": sum(self.stats['txt_matches'].values()),
                "total_json_matches": sum(self.stats['json_matches'].values()),
                "cross_file_duplicates": len(self.stats['json_duplicates']),
                "total_anomalies": total_anomalies,
                "high_severity_anomalies": high_severity
            }
        }

        # Save comprehensive report
        report_path = f"{self.debug_dir}/COMPREHENSIVE_PIPELINE_REPORT.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False, default=str)

        # Also save to main reports directory
        main_report_path = f"{REPORTS_DIR}/pipeline_debug_session_{self.debug_session_id}.json"
        with open(main_report_path, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False, default=str)

        print(f"   📊 {health_status}")
        print(f"   📄 PDF → TXT → JSON: {self.stats['pdf_files']} → {len(self.stats['txt_lines'])} → {len(self.stats['json_matches'])}")
        print(f"   🔢 Meccsek: TXT ~{sum(self.stats['txt_matches'].values())} → JSON {sum(self.stats['json_matches'].values())}")
        print(f"   🔄 Cross-file duplikátumok: {len(self.stats['json_duplicates'])}")
        print(f"   ⚠️ Anomáliák: {total_anomalies} (ebből {high_severity} kritikus)")

        print(f"\n📁 Teljes debug session: {self.debug_dir}")
        print(f"📁 Fő jelentés: {main_report_path}")

def main():
    print("=" * 60)
    print("SP3 FULL PIPELINE RESET AND DEBUG SYSTEM")
    print("=" * 60)

    debugger = PipelineDebugger()

    try:
        # Step 1: Clean slate
        debugger.clean_slate()

        # Step 2: Analyze source files
        debugger.analyze_source_files()

        # Step 3: Run TXT → JSON with monitoring
        if debugger.run_txt_to_json_with_monitoring():

            # Step 4: Run backend import with monitoring
            debugger.run_backend_import_with_monitoring()

            # Step 5: Verify no duplicates in database
            debugger.verify_no_duplicates_in_db()

        # Step 6: Generate final report
        debugger.generate_final_report()

        print("\n✅ PIPELINE DEBUG BEFEJEZVE")

    except Exception as e:
        debugger.log_anomaly("pipeline_debug_failed", {"error": str(e)}, "high")
        print(f"\n❌ Pipeline debug hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
