#!/usr/bin/env python3
"""
Historical Results & League Table Extractor

Specialized tool to extract historical match results, league tables,
and championship standings from SzerencseMix PDFs.
"""

import re
import json
import pdfplumber
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class HistoricalMatch:
    """Historical match result"""
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    match_date: Optional[str] = None
    league: Optional[str] = None
    round_info: Optional[str] = None
    source_page: int = 0
    confidence: float = 0.0

@dataclass
class LeagueTableEntry:
    """League table entry"""
    position: int
    team_name: str
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    league: Optional[str] = None
    source_page: int = 0
    confidence: float = 0.0

class HistoricalDataExtractor:
    """Extract historical results and league tables from PDFs"""

    def __init__(self):
        self.setup_patterns()

    def setup_patterns(self):
        """Setup patterns for historical data extraction"""

        # Pattern for completed match results
        # Example: "Arsenal - Chelsea 2:1" or "Real Madrid 3-0 Barcelona"
        self.result_patterns = [
            r'([A-Za-záéíóöőúüű\s]+)\s*[-–—]\s*([A-Za-záéíóöőúüű\s]+)\s+(\d+)[:-](\d+)',
            r'([A-Za-záéíóöőúüű\s]+)\s+(\d+)\s*[-–—]\s*(\d+)\s+([A-Za-záéíóöőúüű\s]+)',
        ]

        # Pattern for league table rows
        # Example: "1. Manchester City 38 28 5 5 99:26 +73 89"
        self.table_patterns = [
            r'(\d+)\.\s+([A-Za-záéíóöőúüű\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+):(\d+)\s+[+\-]?(\d+)\s+(\d+)',
            r'(\d+)\s+([A-Za-záéíóöőúüű\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+[+\-]?(\d+)\s+(\d+)',
        ]

        # League/competition indicators
        self.league_indicators = [
            'bajnokság', 'liga', 'cup', 'kupa', 'championship', 'premier',
            'bundesliga', 'serie a', 'la liga', 'ligue 1', 'eredmények',
            'tabella', 'állás', 'pontszám', 'forduló'
        ]

        # Date patterns for results
        self.date_patterns = [
            r'\d{1,2}[./]\d{1,2}[./]\d{2,4}',
            r'\d{4}[.-]\d{1,2}[.-]\d{1,2}',
            r'\d{1,2}\.\s*forduló',
            r'játéknap\s*\d+'
        ]

    def is_results_page(self, text: str) -> bool:
        """Check if page contains historical results or tables"""
        text_lower = text.lower()

        # Check for result indicators
        result_indicators = [
            'eredmények', 'tabella', 'állás', 'bajnokság',
            'forduló', 'pontszám', 'gól', 'meccs'
        ]

        indicator_count = sum(1 for indicator in result_indicators if indicator in text_lower)

        # Also check for score patterns
        score_patterns = [r'\d+:\d+', r'\d+\s*[-–—]\s*\d+']
        score_matches = sum(len(re.findall(pattern, text)) for pattern in score_patterns)

        return indicator_count >= 2 or score_matches >= 3

    def extract_historical_matches(self, text: str, page_num: int) -> List[HistoricalMatch]:
        """Extract historical match results from text"""
        matches = []
        lines = text.split('\n')

        current_league = None
        current_round = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for league/competition header
            line_lower = line.lower()
            for indicator in self.league_indicators:
                if indicator in line_lower and len(line) < 100:
                    current_league = line
                    break

            # Check for round info
            round_match = re.search(r'(\d+)\.\s*forduló|játéknap\s*(\d+)', line_lower)
            if round_match:
                current_round = line

            # Try to extract match results
            for pattern in self.result_patterns:
                match = re.search(pattern, line)
                if match:
                    if len(match.groups()) == 4:
                        # Pattern: Team1 - Team2 Score1:Score2
                        home_team = match.group(1).strip()
                        away_team = match.group(2).strip()
                        home_score = int(match.group(3))
                        away_score = int(match.group(4))
                    else:
                        continue

                    # Validate team names
                    if (len(home_team) > 2 and len(away_team) > 2 and
                        not home_team.isdigit() and not away_team.isdigit()):

                        historical_match = HistoricalMatch(
                            home_team=home_team,
                            away_team=away_team,
                            home_score=home_score,
                            away_score=away_score,
                            league=current_league,
                            round_info=current_round,
                            source_page=page_num,
                            confidence=0.8
                        )

                        matches.append(historical_match)
                        break

        return matches

    def extract_league_table(self, text: str, page_num: int) -> List[LeagueTableEntry]:
        """Extract league table from text"""
        entries = []
        lines = text.split('\n')

        current_league = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for league header
            line_lower = line.lower()
            for indicator in self.league_indicators:
                if indicator in line_lower and len(line) < 100:
                    current_league = line
                    break

            # Try to extract table row
            for pattern in self.table_patterns:
                match = re.search(pattern, line)
                if match and len(match.groups()) >= 10:
                    try:
                        position = int(match.group(1))
                        team_name = match.group(2).strip()
                        matches_played = int(match.group(3))
                        wins = int(match.group(4))
                        draws = int(match.group(5))
                        losses = int(match.group(6))
                        goals_for = int(match.group(7))
                        goals_against = int(match.group(8))
                        goal_difference = int(match.group(9))
                        points = int(match.group(10))

                        # Validate data consistency
                        if (wins + draws + losses == matches_played and
                            position > 0 and position <= 30):

                            entry = LeagueTableEntry(
                                position=position,
                                team_name=team_name,
                                matches_played=matches_played,
                                wins=wins,
                                draws=draws,
                                losses=losses,
                                goals_for=goals_for,
                                goals_against=goals_against,
                                goal_difference=goal_difference,
                                points=points,
                                league=current_league,
                                source_page=page_num,
                                confidence=0.9
                            )

                            entries.append(entry)
                            break

                    except (ValueError, IndexError):
                        continue

        return entries

    def analyze_specific_pages(self, pdf_path: str, start_page: int = 23, end_page: int = 29) -> Dict:
        """Analyze specific pages for historical data"""
        print(f"🔍 ANALYZING PAGES {start_page}-{end_page} FOR HISTORICAL DATA")
        print("=" * 70)

        results = {
            'historical_matches': [],
            'league_tables': [],
            'analysis_summary': {}
        }

        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num in range(start_page - 1, min(end_page, len(pdf.pages))):
                    page = pdf.pages[page_num]
                    text = page.extract_text()

                    if not text:
                        continue

                    actual_page = page_num + 1
                    print(f"\n📄 ANALYZING PAGE {actual_page}")
                    print("-" * 40)

                    if self.is_results_page(text):
                        print(f"✅ Page {actual_page}: Contains historical data")

                        # Extract matches
                        matches = self.extract_historical_matches(text, actual_page)
                        if matches:
                            print(f"   📊 Found {len(matches)} historical matches")
                            results['historical_matches'].extend(matches)

                        # Extract tables
                        tables = self.extract_league_table(text, actual_page)
                        if tables:
                            print(f"   📈 Found {len(tables)} table entries")
                            results['league_tables'].extend(tables)

                        # Show sample content
                        lines = text.split('\n')[:10]
                        print(f"   📝 Sample content:")
                        for line in lines:
                            if line.strip():
                                print(f"      {line.strip()[:80]}")

                    else:
                        print(f"❌ Page {actual_page}: No historical data detected")

        except Exception as e:
            print(f"❌ Error analyzing pages: {e}")

        # Summary
        results['analysis_summary'] = {
            'pages_analyzed': end_page - start_page + 1,
            'total_historical_matches': len(results['historical_matches']),
            'total_table_entries': len(results['league_tables']),
            'unique_leagues': len(set(m.league for m in results['historical_matches'] if m.league)),
        }

        print(f"\n📊 ANALYSIS SUMMARY:")
        print(f"   📄 Pages analyzed: {results['analysis_summary']['pages_analyzed']}")
        print(f"   ⚽ Historical matches: {results['analysis_summary']['total_historical_matches']}")
        print(f"   📈 Table entries: {results['analysis_summary']['total_table_entries']}")
        print(f"   🏆 Unique leagues: {results['analysis_summary']['unique_leagues']}")

        return results

    def save_historical_data(self, results: Dict, output_file: str):
        """Save historical data to JSON"""
        output_data = {
            'extraction_metadata': {
                'timestamp': datetime.now().isoformat(),
                'extractor_version': 'HistoricalDataExtractor_v1.0',
                **results['analysis_summary']
            },
            'historical_matches': [asdict(match) for match in results['historical_matches']],
            'league_tables': [asdict(entry) for entry in results['league_tables']]
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Historical data saved to: {output_file}")

def demo_historical_extractor():
    """Demo the historical data extractor"""
    print("\n🕰️ HISTORICAL DATA EXTRACTOR DEMO")
    print("=" * 80)

    extractor = HistoricalDataExtractor()

    # Use sample PDF
    sample_pdf = Path("data/demo_analysis/sample_szerencsemix.pdf")

    if not sample_pdf.exists():
        print("❌ Sample PDF not found. Please download first.")
        return

    # Analyze pages 23-29 for historical data
    results = extractor.analyze_specific_pages(str(sample_pdf), 23, 29)

    if results['historical_matches'] or results['league_tables']:
        print(f"\n🎯 FOUND HISTORICAL DATA!")
        print("=" * 50)

        # Show sample historical matches
        if results['historical_matches']:
            print(f"\n⚽ SAMPLE HISTORICAL MATCHES:")
            for i, match in enumerate(results['historical_matches'][:5], 1):
                print(f"{i}. {match.home_team} {match.home_score}-{match.away_score} {match.away_team}")
                if match.league:
                    print(f"   🏆 League: {match.league}")
                print(f"   📄 Page: {match.source_page}")

        # Show sample league table entries
        if results['league_tables']:
            print(f"\n📈 SAMPLE LEAGUE TABLE ENTRIES:")
            for i, entry in enumerate(results['league_tables'][:5], 1):
                print(f"{i}. {entry.position}. {entry.team_name}")
                print(f"   📊 {entry.matches_played} games, {entry.points} points")
                print(f"   ⚽ {entry.goals_for}:{entry.goals_against} ({entry.goal_difference:+d})")
                if entry.league:
                    print(f"   🏆 League: {entry.league}")

        # Save results
        output_file = "data/demo_analysis/historical_data.json"
        extractor.save_historical_data(results, output_file)

    else:
        print("❌ No historical data found in specified pages")

if __name__ == "__main__":
    demo_historical_extractor()
