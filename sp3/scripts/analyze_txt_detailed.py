#!/home/bandi/Documents/code/2025/sp3/.venv/bin/python3

"""
TXT FILE DETAILED ANALYZER
==========================

Részletesen elemzi a TXT fájlokat, hogy megértsük:
- Milyen struktúrában vannak az adatok
- Hol vannak a meccs információk
- Milyen pattern-ek alapján lehet kinyerni az adatokat
- Hol lehet adatvesztés a parsing során
"""

import os
import re
import json
import sys
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = "/home/bandi/Documents/code/2025/sp3"
TXT_DIR = f"{PROJECT_ROOT}/ml_pipeline/betting_extractor/txts"
DEBUG_LOGS_DIR = f"{PROJECT_ROOT}/debug_logs"

class TxtAnalyzer:
    def __init__(self, debug_session_id: Optional[str] = None):
        self.debug_session_id = debug_session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.debug_dir = f"{DEBUG_LOGS_DIR}/txt_analysis_{self.debug_session_id}"
        os.makedirs(self.debug_dir, exist_ok=True)

        # Pattern definitions for match detection
        self.match_patterns = [
            r'(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s+([^-]+)\s*-\s*([^0-9]+)',  # Date Time Team1 - Team2
            r'([^-]+)\s*-\s*([^0-9]+)\s+(\d{1,2}:\d{2})',  # Team1 - Team2 Time
            r'([^-]+)\s+vs\s+([^0-9]+)',  # Team1 vs Team2
            r'(\d{1,2}:\d{2})\s+([^-]+)\s*-\s*([^0-9]+)',  # Time Team1 - Team2
        ]

        # Odds patterns
        self.odds_patterns = [
            r'(\d+\.?\d*)',  # Decimal odds
            r'(\d+/\d+)',    # Fractional odds
            r'([+-]\d+)',    # American odds
        ]

        # Competition/league patterns
        self.competition_patterns = [
            r'(Premier League|Championship|League|Liga|Bundesliga)',
            r'(\w+\s+bajnokság|\w+\s+liga)',
            r'(Division|Conference|Cup)',
        ]

    def analyze_all_txt_files(self):
        """Analyze all TXT files"""
        print("🔍 TXT FÁJLOK RÉSZLETES ELEMZÉSE")
        print("=" * 50)

        if not os.path.exists(TXT_DIR):
            print(f"❌ TXT directory nem található: {TXT_DIR}")
            return

        txt_files = [f for f in os.listdir(TXT_DIR) if f.endswith('.txt')]

        if not txt_files:
            print("❌ Nincsenek TXT fájlok")
            return

        total_analysis = {
            'files_analyzed': 0,
            'total_lines': 0,
            'potential_matches': 0,
            'potential_odds': 0,
            'structure_patterns': {},
            'issues_found': []
        }

        for txt_file in txt_files:
            print(f"\n📄 Elemzés: {txt_file}")
            analysis = self.analyze_single_txt_file(txt_file)

            # Aggregate statistics
            total_analysis['files_analyzed'] += 1
            total_analysis['total_lines'] += analysis['line_count']
            total_analysis['potential_matches'] += analysis['potential_matches']
            total_analysis['potential_odds'] += analysis['potential_odds']

            # Merge structure patterns
            for pattern, count in analysis['structure_patterns'].items():
                total_analysis['structure_patterns'][pattern] = total_analysis['structure_patterns'].get(pattern, 0) + count

            total_analysis['issues_found'].extend(analysis['issues'])

        # Save comprehensive analysis
        self.save_analysis_report(total_analysis)

        # Print summary
        self.print_summary(total_analysis)

    def analyze_single_txt_file(self, txt_file: str) -> Dict[str, Any]:
        """Analyze a single TXT file in detail"""
        txt_path = os.path.join(TXT_DIR, txt_file)

        analysis = {
            'file': txt_file,
            'line_count': 0,
            'potential_matches': 0,
            'potential_odds': 0,
            'structure_patterns': {},
            'issues': [],
            'sample_lines': {
                'match_lines': [],
                'odds_lines': [],
                'empty_lines': 0,
                'unrecognized_lines': []
            }
        }

        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            analysis['line_count'] = len(lines)

            for i, line in enumerate(lines, 1):
                line = line.strip()

                if not line:
                    analysis['sample_lines']['empty_lines'] += 1
                    continue

                # Check for match patterns
                match_found = False
                for pattern in self.match_patterns:
                    if re.search(pattern, line, re.IGNORECASE):
                        analysis['potential_matches'] += 1
                        if len(analysis['sample_lines']['match_lines']) < 10:
                            analysis['sample_lines']['match_lines'].append({
                                'line_number': i,
                                'content': line,
                                'pattern': pattern
                            })
                        match_found = True
                        break

                # Check for odds patterns
                odds_found = False
                for pattern in self.odds_patterns:
                    if re.search(pattern, line):
                        analysis['potential_odds'] += 1
                        if len(analysis['sample_lines']['odds_lines']) < 10:
                            analysis['sample_lines']['odds_lines'].append({
                                'line_number': i,
                                'content': line,
                                'pattern': pattern
                            })
                        odds_found = True
                        break

                # Analyze line structure
                structure = self.analyze_line_structure(line)
                analysis['structure_patterns'][structure] = analysis['structure_patterns'].get(structure, 0) + 1

                # Collect unrecognized lines for analysis
                if not match_found and not odds_found and len(analysis['sample_lines']['unrecognized_lines']) < 20:
                    analysis['sample_lines']['unrecognized_lines'].append({
                        'line_number': i,
                        'content': line[:100]  # First 100 chars
                    })

            # Identify potential issues
            self.identify_parsing_issues(analysis)

        except Exception as e:
            analysis['issues'].append({
                'type': 'file_read_error',
                'message': str(e)
            })

        # Save individual file analysis
        file_analysis_path = f"{self.debug_dir}/{txt_file}_analysis.json"
        with open(file_analysis_path, 'w', encoding='utf-8') as f:
            json.dump(analysis, f, indent=2, ensure_ascii=False)

        return analysis

    def analyze_line_structure(self, line: str) -> str:
        """Analyze the structure of a line"""
        # Simple structure classification
        if re.search(r'\d{4}-\d{2}-\d{2}', line):
            return 'contains_date'
        elif re.search(r'\d{1,2}:\d{2}', line):
            return 'contains_time'
        elif re.search(r'[+-]?\d+\.?\d*', line):
            return 'contains_numbers'
        elif ' vs ' in line.lower() or ' - ' in line:
            return 'contains_separator'
        elif len(line.split()) > 5:
            return 'long_text'
        elif len(line.split()) <= 3:
            return 'short_text'
        else:
            return 'other'

    def identify_parsing_issues(self, analysis: Dict[str, Any]):
        """Identify potential parsing issues"""
        issues = analysis['issues']

        # Check ratio of potential matches to total lines
        if analysis['line_count'] > 0:
            match_ratio = analysis['potential_matches'] / analysis['line_count']
            if match_ratio < 0.01:  # Less than 1% match lines
                issues.append({
                    'type': 'low_match_detection',
                    'message': f"Very low match detection ratio: {match_ratio:.2%}",
                    'severity': 'high'
                })
            elif match_ratio > 0.5:  # More than 50% match lines
                issues.append({
                    'type': 'high_match_detection',
                    'message': f"Suspiciously high match detection ratio: {match_ratio:.2%}",
                    'severity': 'medium'
                })

        # Check for empty or very short lines
        empty_ratio = analysis['sample_lines']['empty_lines'] / analysis['line_count'] if analysis['line_count'] > 0 else 0
        if empty_ratio > 0.3:
            issues.append({
                'type': 'high_empty_lines',
                'message': f"High ratio of empty lines: {empty_ratio:.2%}",
                'severity': 'medium'
            })

        # Check for consistency in structure patterns
        pattern_counts = analysis['structure_patterns']
        if len(pattern_counts) > 10:
            issues.append({
                'type': 'inconsistent_structure',
                'message': f"Too many different line structures: {len(pattern_counts)}",
                'severity': 'medium'
            })

    def save_analysis_report(self, total_analysis: Dict[str, Any]):
        """Save comprehensive analysis report"""
        report_path = f"{self.debug_dir}/TXT_ANALYSIS_REPORT.json"

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(total_analysis, f, indent=2, ensure_ascii=False)

        print(f"\n📊 Teljes elemzés mentve: {report_path}")

    def print_summary(self, total_analysis: Dict[str, Any]):
        """Print analysis summary"""
        print(f"\n📊 TXT ELEMZÉS ÖSSZEGZÉS")
        print("=" * 40)
        print(f"Fájlok: {total_analysis['files_analyzed']}")
        print(f"Összes sor: {total_analysis['total_lines']}")
        print(f"Potenciális meccsek: {total_analysis['potential_matches']}")
        print(f"Potenciális oddsok: {total_analysis['potential_odds']}")

        if total_analysis['total_lines'] > 0:
            match_ratio = total_analysis['potential_matches'] / total_analysis['total_lines']
            print(f"Meccs detection arány: {match_ratio:.2%}")

        print(f"\nStruktúra pattern-ek:")
        for pattern, count in sorted(total_analysis['structure_patterns'].items(), key=lambda x: x[1], reverse=True):
            percentage = count / total_analysis['total_lines'] * 100 if total_analysis['total_lines'] > 0 else 0
            print(f"  {pattern}: {count} ({percentage:.1f}%)")

        total_issues = len(total_analysis['issues_found'])
        if total_issues > 0:
            print(f"\n⚠️ Azonosított problémák: {total_issues}")
            for issue in total_analysis['issues_found'][:5]:  # Show first 5
                print(f"  - {issue.get('type', 'unknown')}: {issue.get('message', 'No message')}")

def main():
    """Main function"""
    if len(sys.argv) > 1:
        debug_session_id = sys.argv[1]
    else:
        debug_session_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    analyzer = TxtAnalyzer(debug_session_id)
    analyzer.analyze_all_txt_files()

if __name__ == "__main__":
    main()
