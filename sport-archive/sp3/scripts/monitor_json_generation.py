#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
JSON GENERATION STEP-BY-STEP MONITOR
=====================================

Monitorozza a JSON generálás minden lépését:
1. TXT file beolvasás
2. Line-by-line parsing
3. Match extraction
4. Market parsing
5. JSON writing
"""

import os
import sys
import json
import re
import subprocess
from typing import Dict, List, Any, Optional
from datetime import datetime
from pathlib import Path

# Add the ML pipeline to path
sys.path.append('/home/bandi/Documents/code/2025/sp3/ml_pipeline')

PROJECT_ROOT = "/home/bandi/Documents/code/2025/sp3"
ML_PIPELINE_ROOT = f"{PROJECT_ROOT}/ml_pipeline"
DEBUG_LOGS_DIR = f"{PROJECT_ROOT}/debug_logs"

class JsonGenerationMonitor:
    def __init__(self, debug_session_id: Optional[str] = None):
        self.debug_session_id = debug_session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.debug_dir = f"{DEBUG_LOGS_DIR}/json_generation_{self.debug_session_id}"
        os.makedirs(self.debug_dir, exist_ok=True)

        self.monitoring_data = {
            'session_id': self.debug_session_id,
            'files_processed': {},
            'total_stats': {
                'txt_lines_read': 0,
                'matches_extracted': 0,
                'markets_parsed': 0,
                'json_files_written': 0
            },
            'issues': [],
            'step_by_step_logs': []
        }

        print(f"🔍 JSON Generation Monitor started: {self.debug_session_id}")
        print(f"📁 Debug dir: {self.debug_dir}")

    def log_step(self, step: str, details: Any, file_context: Optional[str] = None):
        """Log a step in the JSON generation process"""
        timestamp = datetime.now().isoformat()

        step_log = {
            'timestamp': timestamp,
            'step': step,
            'file_context': file_context,
            'details': details
        }

        self.monitoring_data['step_by_step_logs'].append(step_log)

        print(f"📝 [{step}] {file_context or 'Global'}: {details}")

    def log_issue(self, issue_type: str, details: Dict, severity: str = "medium", file_context: Optional[str] = None):
        """Log an issue during JSON generation"""
        issue = {
            'timestamp': datetime.now().isoformat(),
            'type': issue_type,
            'severity': severity,
            'file_context': file_context,
            'details': details
        }

        self.monitoring_data['issues'].append(issue)

        severity_emoji = {"low": "🟡", "medium": "🟠", "high": "🔴"}
        print(f"{severity_emoji.get(severity, '⚠️')} ISSUE [{severity.upper()}]: {issue_type}")
        if file_context:
            print(f"   File: {file_context}")
        print(f"   Details: {details}")

    def monitor_txt_to_json_conversion(self):
        """Monitor the TXT to JSON conversion with detailed logging"""
        print("\n🔄 MONITORED TXT → JSON CONVERSION")
        print("=" * 50)

        # Get list of TXT files to process
        txt_dir = f"{ML_PIPELINE_ROOT}/betting_extractor/txts"
        txt_files = [f for f in os.listdir(txt_dir) if f.endswith('.txt')]

        self.log_step("conversion_started", {
            "txt_files_found": txt_files,
            "total_files": len(txt_files)
        })

        for txt_file in txt_files:
            self.monitor_single_file_conversion(txt_file)

        # Generate summary
        self.generate_conversion_summary()

    def monitor_single_file_conversion(self, txt_file: str):
        """Monitor conversion of a single TXT file"""
        print(f"\n📄 Processing: {txt_file}")

        txt_path = f"{ML_PIPELINE_ROOT}/betting_extractor/txts/{txt_file}"

        file_stats = {
            'txt_file': txt_file,
            'lines_read': 0,
            'lines_processed': 0,
            'matches_found': 0,
            'markets_extracted': 0,
            'parsing_issues': []
        }

        try:
            # Read TXT file
            with open(txt_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            file_stats['lines_read'] = len(lines)
            self.log_step("txt_file_read", {
                "file": txt_file,
                "lines_count": len(lines)
            }, txt_file)

            # Simulate the parsing process (we'll need to integrate with actual parser)
            self.simulate_parsing_process(lines, file_stats, txt_file)

            # Check if JSON was actually created
            json_file = txt_file.replace('.txt', '.json')
            json_path = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons/processed/{json_file}"

            if os.path.exists(json_path):
                self.analyze_generated_json(json_file, file_stats)
            else:
                self.log_issue("json_not_generated", {
                    "txt_file": txt_file,
                    "expected_json": json_file
                }, "high", txt_file)

        except Exception as e:
            self.log_issue("file_processing_error", {
                "txt_file": txt_file,
                "error": str(e)
            }, "high", txt_file)

        self.monitoring_data['files_processed'][txt_file] = file_stats

    def simulate_parsing_process(self, lines: List[str], file_stats: Dict, txt_file: str):
        """Simulate the parsing process to understand what happens to each line"""

        match_patterns = [
            r'(\d{4}-\d{2}-\d{2})',  # Date
            r'(\d{1,2}:\d{2})',      # Time
            r'([^-]+)\s*-\s*([^0-9]+)',  # Team1 - Team2
            r'([^-]+)\s+vs\s+([^0-9]+)',  # Team1 vs Team2
        ]

        odds_patterns = [
            r'(\d+\.?\d*)',  # Decimal odds
            r'(\d+/\d+)',    # Fractional odds
        ]

        current_match = None
        potential_matches = []

        for i, line in enumerate(lines, 1):
            line = line.strip()
            file_stats['lines_processed'] += 1

            if not line:
                continue

            # Check if line contains match information
            match_found = False
            for pattern in match_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    match_found = True
                    break

            if match_found:
                if current_match:
                    potential_matches.append(current_match)

                current_match = {
                    'line_number': i,
                    'line_content': line,
                    'markets': []
                }
                file_stats['matches_found'] += 1

                self.log_step("match_detected", {
                    "line_number": i,
                    "content": line[:100]  # First 100 chars
                }, txt_file)

            # Check for odds/market information
            odds_found = False
            for pattern in odds_patterns:
                if re.search(pattern, line):
                    odds_found = True
                    if current_match:
                        current_match['markets'].append({
                            'line_number': i,
                            'line_content': line,
                            'pattern_matched': pattern
                        })
                        file_stats['markets_extracted'] += 1
                    break

            # Log unrecognized lines that might contain data
            if not match_found and not odds_found and len(line.split()) > 3:
                # This might be lost data
                if len(file_stats['parsing_issues']) < 20:  # Limit logging
                    file_stats['parsing_issues'].append({
                        'line_number': i,
                        'content': line[:100],
                        'issue': 'unrecognized_potential_data'
                    })

        # Add last match
        if current_match:
            potential_matches.append(current_match)

        # Log potential data loss
        total_potential_data_lines = len([line for line in lines if line.strip() and len(line.strip().split()) > 3])
        recognized_lines = file_stats['matches_found'] + file_stats['markets_extracted']

        if total_potential_data_lines > 0:
            recognition_ratio = recognized_lines / total_potential_data_lines
            if recognition_ratio < 0.5:  # Less than 50% recognized
                self.log_issue("low_recognition_ratio", {
                    "total_potential_lines": total_potential_data_lines,
                    "recognized_lines": recognized_lines,
                    "recognition_ratio": recognition_ratio
                }, "medium", txt_file)

        self.log_step("parsing_simulation_complete", {
            "potential_matches": len(potential_matches),
            "total_markets": file_stats['markets_extracted'],
            "parsing_issues": len(file_stats['parsing_issues'])
        }, txt_file)

    def analyze_generated_json(self, json_file: str, file_stats: Dict):
        """Analyze the actually generated JSON file"""
        json_path = f"{ML_PIPELINE_ROOT}/betting_extractor/jsons/processed/{json_file}"

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            matches = json_data.get('matches', [])
            actual_match_count = len(matches)

            # Calculate total markets in JSON
            total_markets = sum(len(match.get('markets', [])) for match in matches)

            self.log_step("json_analysis", {
                "json_file": json_file,
                "actual_matches": actual_match_count,
                "actual_markets": total_markets,
                "simulated_matches": file_stats['matches_found'],
                "simulated_markets": file_stats['markets_extracted']
            }, json_file)

            # Compare with simulation
            if actual_match_count != file_stats['matches_found']:
                self.log_issue("match_count_discrepancy", {
                    "simulated": file_stats['matches_found'],
                    "actual": actual_match_count,
                    "difference": abs(actual_match_count - file_stats['matches_found'])
                }, "medium", json_file)

            if total_markets != file_stats['markets_extracted']:
                self.log_issue("market_count_discrepancy", {
                    "simulated": file_stats['markets_extracted'],
                    "actual": total_markets,
                    "difference": abs(total_markets - file_stats['markets_extracted'])
                }, "medium", json_file)

            # Check for data quality issues in JSON
            self.check_json_data_quality(matches, json_file)

        except Exception as e:
            self.log_issue("json_analysis_error", {
                "json_file": json_file,
                "error": str(e)
            }, "high", json_file)

    def check_json_data_quality(self, matches: List[Dict], json_file: str):
        """Check data quality in generated JSON"""

        quality_issues = {
            'missing_dates': 0,
            'missing_teams': 0,
            'missing_competitions': 0,
            'missing_markets': 0,
            'invalid_odds': 0
        }

        for match in matches:
            if not match.get('date'):
                quality_issues['missing_dates'] += 1

            if not match.get('team1') or not match.get('team2'):
                quality_issues['missing_teams'] += 1

            if not match.get('competition'):
                quality_issues['missing_competitions'] += 1

            markets = match.get('markets', [])
            if not markets:
                quality_issues['missing_markets'] += 1

            for market in markets:
                odds = market.get('odds')
                if odds is not None:
                    try:
                        odds_val = float(odds)
                        if odds_val <= 0 or odds_val > 100:
                            quality_issues['invalid_odds'] += 1
                    except:
                        quality_issues['invalid_odds'] += 1

        # Log significant quality issues
        total_matches = len(matches)
        for issue_type, count in quality_issues.items():
            if count > 0:
                percentage = count / total_matches * 100 if total_matches > 0 else 0
                severity = "high" if percentage > 20 else "medium" if percentage > 5 else "low"

                self.log_issue(f"quality_{issue_type}", {
                    "count": count,
                    "total_matches": total_matches,
                    "percentage": percentage
                }, severity, json_file)

    def generate_conversion_summary(self):
        """Generate summary of the conversion process"""
        print(f"\n📊 CONVERSION SUMMARY")
        print("=" * 30)

        total_files = len(self.monitoring_data['files_processed'])
        total_issues = len(self.monitoring_data['issues'])

        # Aggregate statistics
        total_matches = sum(stats['matches_found'] for stats in self.monitoring_data['files_processed'].values())
        total_markets = sum(stats['markets_extracted'] for stats in self.monitoring_data['files_processed'].values())
        total_lines = sum(stats['lines_read'] for stats in self.monitoring_data['files_processed'].values())

        print(f"Files processed: {total_files}")
        print(f"Total lines read: {total_lines}")
        print(f"Total matches found: {total_matches}")
        print(f"Total markets extracted: {total_markets}")
        print(f"Issues detected: {total_issues}")

        # Save detailed report
        report_path = f"{self.debug_dir}/JSON_GENERATION_REPORT.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.monitoring_data, f, indent=2, ensure_ascii=False, default=str)

        print(f"\n📁 Detailed report: {report_path}")

        # Highlight critical issues
        high_severity_issues = [issue for issue in self.monitoring_data['issues'] if issue['severity'] == 'high']
        if high_severity_issues:
            print(f"\n🔴 CRITICAL ISSUES: {len(high_severity_issues)}")
            for issue in high_severity_issues[:3]:  # Show first 3
                print(f"  - {issue['type']}: {issue['details']}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        debug_session_id = sys.argv[1]
    else:
        debug_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    monitor = JsonGenerationMonitor(debug_session_id)
    monitor.monitor_txt_to_json_conversion()

if __name__ == "__main__":
    main()
