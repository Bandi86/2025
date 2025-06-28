#!/usr/bin/env python3
"""
Advanced Historical Football Data System

This system extracts and organizes historical football data from SzerencseMix PDFs,
including match results, league tables, and team statistics.
It creates a comprehensive database for algorithm enhancement.
"""

import re
import json
import sqlite3
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class FootballResult:
    """Historical football match result"""
    match_id: str
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    match_date: Optional[str] = None
    league: Optional[str] = None
    season: Optional[str] = None
    round_number: Optional[int] = None
    source_pdf: Optional[str] = None
    source_page: int = 0
    extraction_date: str = ""
    confidence: float = 0.0

@dataclass
class TeamStats:
    """Team statistics from league table"""
    team_name: str
    league: str
    season: Optional[str]
    position: int
    matches_played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    recent_form: Optional[str] = None  # W-W-L-D-W
    home_record: Optional[str] = None
    away_record: Optional[str] = None
    source_page: int = 0
    confidence: float = 0.0

class AdvancedHistoricalSystem:
    """Advanced system for historical football data extraction and management"""

    def __init__(self, db_path: str = "data/historical_football.db"):
        self.db_path = db_path
        self.setup_database()
        self.setup_patterns()

    def setup_database(self):
        """Setup SQLite database for historical data"""
        Path(self.db_path).parent.mkdir(exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS football_results (
                match_id TEXT PRIMARY KEY,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                home_score INTEGER NOT NULL,
                away_score INTEGER NOT NULL,
                match_date TEXT,
                league TEXT,
                season TEXT,
                round_number INTEGER,
                source_pdf TEXT,
                source_page INTEGER,
                extraction_date TEXT,
                confidence REAL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS team_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_name TEXT NOT NULL,
                league TEXT NOT NULL,
                season TEXT,
                position INTEGER,
                matches_played INTEGER,
                wins INTEGER,
                draws INTEGER,
                losses INTEGER,
                goals_for INTEGER,
                goals_against INTEGER,
                goal_difference INTEGER,
                points INTEGER,
                recent_form TEXT,
                home_record TEXT,
                away_record TEXT,
                source_page INTEGER,
                confidence REAL,
                extraction_date TEXT,
                UNIQUE(team_name, league, season)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processing_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pdf_file TEXT NOT NULL,
                processing_date TEXT,
                matches_extracted INTEGER,
                tables_extracted INTEGER,
                status TEXT,
                notes TEXT
            )
        ''')

        conn.commit()
        conn.close()

    def setup_patterns(self):
        """Setup improved patterns for football-specific extraction"""

        # Football-specific result patterns (exclude high scores that suggest other sports)
        self.football_result_patterns = [
            # Standard format: Team1 - Team2 1:2
            r'([A-Za-záéíóöőúüű\s]{3,30})\s*[-–—]\s*([A-Za-záéíóöőúüű\s]{3,30})\s+([0-9])[:.-]([0-9])',
            # Reverse format: Team1 2-1 Team2
            r'([A-Za-záéíóöőúüű\s]{3,30})\s+([0-9])[:.-]([0-9])\s+([A-Za-záéíóöőúüű\s]{3,30})',
        ]

        # Football league table patterns
        self.football_table_patterns = [
            # Standard: 1. Team 38 25 8 5 75:28 +47 83
            r'(\d{1,2})\.\s+([A-Za-záéíóöőúüű\s]{3,25})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3}):(\d{1,3})\s+[+\-]?(\d{1,3})\s+(\d{1,3})',
            # Alternative: 1 Team 38 25 8 5 75 28 47 83
            r'(\d{1,2})\s+([A-Za-záéíóöőúüű\s]{3,25})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3})\s+(\d{1,3})\s+[+\-]?(\d{1,3})\s+(\d{1,3})',
        ]

        # Football-specific leagues (extended list)
        self.football_leagues = [
            'premier league', 'championship', 'league one', 'league two',
            'bundesliga', '2. bundesliga', '3. liga',
            'la liga', 'segunda división',
            'serie a', 'serie b', 'serie c',
            'ligue 1', 'ligue 2',
            'eredivisie', 'eerste divisie',
            'primeira liga', 'segunda liga',
            'süper lig', 'tff 1. lig',
            'premier liga', 'first league',
            'nb i', 'nb ii', 'otp bank liga',
            'fortuna liga', 'czech liga',
            'ekstraklasa', 'i liga',
            'allsvenskan', 'superettan',
            'eliteserien', 'obos-ligaen',
            'ligat ha\'al', 'liga leumit',
            'mls', 'usl championship',
            'brasileiro série a', 'série b',
            'j-league', 'j1 league', 'j2 league',
            'k league 1', 'k league 2',
            'a-league', 'npl',
            'champions league', 'europa league',
            'conference league', 'uefa cup',
            'fa cup', 'efl cup', 'carabao cup',
            'copa del rey', 'copa italia',
            'dfb pokal', 'coupe de france',
            'knvb beker', 'taça de portugal'
        ]

        # Exclude non-football sports patterns
        self.exclude_patterns = [
            r'\b(?:kosárlabda|basketball|kézilabda|handball|jégkorong|hockey)\b',
            r'\b(?:tenisz|tennis|golf|baseball|volleyball)\b',
            r'\b(?:úszás|swimming|atlétika|athletics)\b',
            r'\b[5-9]\d+\s*[:.-]\s*[5-9]\d+\b',  # Very high scores (50+)
        ]

    def is_football_content(self, text: str) -> bool:
        """Enhanced check for football content"""
        text_lower = text.lower()

        # Exclude non-football sports
        for pattern in self.exclude_patterns:
            if re.search(pattern, text_lower):
                return False

        # Check for football indicators
        football_indicators = [
            'labdarúgás', 'football', 'foci', 'gól', 'goal',
            'bajnokság', 'liga', 'league', 'cup', 'kupa'
        ]

        football_count = sum(1 for indicator in football_indicators if indicator in text_lower)

        # Check for football leagues
        league_count = sum(1 for league in self.football_leagues if league in text_lower)

        # Check for realistic football scores
        realistic_scores = len(re.findall(r'\b[0-9][:.-][0-9]\b', text))

        return football_count >= 1 or league_count >= 1 or realistic_scores >= 3

    def extract_football_results(self, text: str, source_info: Dict) -> List[FootballResult]:
        """Extract football results with improved validation"""
        results = []
        lines = text.split('\n')

        current_league = None
        current_season = None
        current_round = None

        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Detect league/competition
            line_lower = line.lower()
            for league in self.football_leagues:
                if league in line_lower and len(line) < 100:
                    current_league = line.strip()
                    break

            # Detect season
            season_match = re.search(r'(20\d{2}[/-]20?\d{2}|20\d{2})', line)
            if season_match:
                current_season = season_match.group(1)

            # Detect round
            round_match = re.search(r'(\d+)\.\s*forduló|round\s*(\d+)|játéknap\s*(\d+)', line_lower)
            if round_match:
                round_num = int(round_match.group(1) or round_match.group(2) or round_match.group(3))
                current_round = round_num

            # Extract match results
            for pattern in self.football_result_patterns:
                match = re.search(pattern, line)
                if match:
                    groups = match.groups()

                    if len(groups) == 4:
                        if pattern.startswith(r'([A-Za-záéíóöőúüű\s]{3,30})\s*[-–—]'):
                            # Team1 - Team2 Score1:Score2
                            home_team, away_team, home_score, away_score = groups
                        else:
                            # Team1 Score1:Score2 Team2
                            home_team, home_score, away_score, away_team = groups

                        home_team = home_team.strip()
                        away_team = away_team.strip()

                        try:
                            home_score = int(home_score)
                            away_score = int(away_score)
                        except ValueError:
                            continue

                        # Validate as football (scores typically 0-9)
                        if (home_score > 9 or away_score > 9 or
                            len(home_team) < 3 or len(away_team) < 3 or
                            home_team.isdigit() or away_team.isdigit()):
                            continue

                        # Create match ID
                        match_id = f"{source_info['pdf_name']}_{source_info['page']}_{line_num}_{home_team}_{away_team}"

                        result = FootballResult(
                            match_id=match_id,
                            home_team=home_team,
                            away_team=away_team,
                            home_score=home_score,
                            away_score=away_score,
                            league=current_league,
                            season=current_season,
                            round_number=current_round,
                            source_pdf=source_info['pdf_name'],
                            source_page=source_info['page'],
                            extraction_date=datetime.now().isoformat(),
                            confidence=0.85
                        )

                        results.append(result)
                        break

        return results

    def extract_team_stats(self, text: str, source_info: Dict) -> List[TeamStats]:
        """Extract team statistics from league tables"""
        stats = []
        lines = text.split('\n')

        current_league = None
        current_season = None

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Detect league
            line_lower = line.lower()
            for league in self.football_leagues:
                if league in line_lower and len(line) < 100:
                    current_league = line.strip()
                    break

            # Detect season
            season_match = re.search(r'(20\d{2}[/-]20?\d{2}|20\d{2})', line)
            if season_match:
                current_season = season_match.group(1)

            # Extract table rows
            for pattern in self.football_table_patterns:
                match = re.search(pattern, line)
                if match and len(match.groups()) >= 10:
                    try:
                        groups = match.groups()
                        position = int(groups[0])
                        team_name = groups[1].strip()
                        matches_played = int(groups[2])
                        wins = int(groups[3])
                        draws = int(groups[4])
                        losses = int(groups[5])
                        goals_for = int(groups[6])
                        goals_against = int(groups[7])
                        goal_difference = int(groups[8])
                        points = int(groups[9])

                        # Validate data consistency
                        if (wins + draws + losses == matches_played and
                            position > 0 and position <= 30 and
                            wins * 3 + draws == points and
                            goals_for - goals_against == goal_difference):

                            stat = TeamStats(
                                team_name=team_name,
                                league=current_league or "Unknown League",
                                season=current_season,
                                position=position,
                                matches_played=matches_played,
                                wins=wins,
                                draws=draws,
                                losses=losses,
                                goals_for=goals_for,
                                goals_against=goals_against,
                                goal_difference=goal_difference,
                                points=points,
                                source_page=source_info['page'],
                                confidence=0.9
                            )

                            stats.append(stat)
                            break

                    except (ValueError, IndexError):
                        continue

        return stats

    def process_pdf_historical_data(self, pdf_path: str) -> Dict:
        """Process entire PDF for historical football data"""
        from pathlib import Path
        import pdfplumber

        pdf_name = Path(pdf_path).name
        print(f"🕰️ PROCESSING HISTORICAL DATA: {pdf_name}")
        print("=" * 70)

        results = {
            'football_results': [],
            'team_stats': [],
            'processing_summary': {}
        }

        total_pages = 0
        football_pages = 0

        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)

                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if not text:
                        continue

                    if self.is_football_content(text):
                        football_pages += 1
                        print(f"📄 Processing page {page_num} (football content detected)")

                        source_info = {
                            'pdf_name': pdf_name,
                            'page': page_num
                        }

                        # Extract results
                        page_results = self.extract_football_results(text, source_info)
                        if page_results:
                            print(f"   ⚽ Found {len(page_results)} match results")
                            results['football_results'].extend(page_results)

                        # Extract team stats
                        page_stats = self.extract_team_stats(text, source_info)
                        if page_stats:
                            print(f"   📊 Found {len(page_stats)} team statistics")
                            results['team_stats'].extend(page_stats)

        except Exception as e:
            print(f"❌ Error processing PDF: {e}")

        # Summary
        results['processing_summary'] = {
            'pdf_file': pdf_name,
            'total_pages': total_pages,
            'football_pages': football_pages,
            'total_results': len(results['football_results']),
            'total_stats': len(results['team_stats']),
            'processing_date': datetime.now().isoformat()
        }

        print(f"\n📊 PROCESSING SUMMARY:")
        print(f"   📄 Total pages: {total_pages}")
        print(f"   ⚽ Football pages: {football_pages}")
        print(f"   🏆 Match results: {len(results['football_results'])}")
        print(f"   📈 Team statistics: {len(results['team_stats'])}")

        return results

    def save_to_database(self, results: Dict):
        """Save results to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Save football results
        for result in results['football_results']:
            cursor.execute('''
                INSERT OR REPLACE INTO football_results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                result.match_id, result.home_team, result.away_team,
                result.home_score, result.away_score, result.match_date,
                result.league, result.season, result.round_number,
                result.source_pdf, result.source_page,
                result.extraction_date, result.confidence
            ))

        # Save team stats
        for stat in results['team_stats']:
            cursor.execute('''
                INSERT OR REPLACE INTO team_stats
                (team_name, league, season, position, matches_played, wins, draws, losses,
                 goals_for, goals_against, goal_difference, points, recent_form,
                 home_record, away_record, source_page, confidence, extraction_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                stat.team_name, stat.league, stat.season, stat.position,
                stat.matches_played, stat.wins, stat.draws, stat.losses,
                stat.goals_for, stat.goals_against, stat.goal_difference,
                stat.points, stat.recent_form, stat.home_record, stat.away_record,
                stat.source_page, stat.confidence, datetime.now().isoformat()
            ))

        # Log processing
        summary = results['processing_summary']
        cursor.execute('''
            INSERT INTO processing_log
            (pdf_file, processing_date, matches_extracted, tables_extracted, status, notes)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            summary['pdf_file'], summary['processing_date'],
            summary['total_results'], summary['total_stats'],
            'SUCCESS', f"Football pages: {summary['football_pages']}/{summary['total_pages']}"
        ))

        conn.commit()
        conn.close()

        print(f"💾 Data saved to database: {self.db_path}")

    def get_database_summary(self) -> Dict:
        """Get summary of historical data in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Count total records
        cursor.execute("SELECT COUNT(*) FROM football_results")
        total_results = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM team_stats")
        total_stats = cursor.fetchone()[0]

        # Get unique leagues
        cursor.execute("SELECT DISTINCT league FROM football_results WHERE league IS NOT NULL")
        leagues = [row[0] for row in cursor.fetchall()]

        # Get unique teams
        cursor.execute("""
            SELECT DISTINCT home_team FROM football_results
            UNION
            SELECT DISTINCT away_team FROM football_results
        """)
        teams = [row[0] for row in cursor.fetchall()]

        # Get date range
        cursor.execute("SELECT MIN(extraction_date), MAX(extraction_date) FROM football_results")
        date_range = cursor.fetchone()

        conn.close()

        return {
            'total_results': total_results,
            'total_team_stats': total_stats,
            'unique_leagues': len(leagues),
            'unique_teams': len(teams),
            'leagues': leagues[:10],  # First 10
            'teams': teams[:20],      # First 20
            'date_range': date_range
        }

def demo_advanced_historical_system():
    """Demo the advanced historical data system"""
    print("\n🏆 ADVANCED HISTORICAL FOOTBALL DATA SYSTEM DEMO")
    print("=" * 80)

    system = AdvancedHistoricalSystem()

    # Use sample PDF
    sample_pdf = Path("data/demo_analysis/sample_szerencsemix.pdf")

    if not sample_pdf.exists():
        print("❌ Sample PDF not found.")
        return

    # Process PDF for historical data
    results = system.process_pdf_historical_data(str(sample_pdf))

    if results['football_results'] or results['team_stats']:
        print(f"\n🎯 EXTRACTED HISTORICAL FOOTBALL DATA!")
        print("=" * 60)

        # Show sample results
        if results['football_results']:
            print(f"\n⚽ SAMPLE MATCH RESULTS:")
            for i, result in enumerate(results['football_results'][:5], 1):
                print(f"{i}. {result.home_team} {result.home_score}-{result.away_score} {result.away_team}")
                if result.league:
                    print(f"   🏆 {result.league}")
                if result.season:
                    print(f"   📅 Season: {result.season}")
                print(f"   📄 Page: {result.source_page}")

        # Show sample team stats
        if results['team_stats']:
            print(f"\n📊 SAMPLE TEAM STATISTICS:")
            for i, stat in enumerate(results['team_stats'][:3], 1):
                print(f"{i}. {stat.position}. {stat.team_name}")
                print(f"   📈 {stat.matches_played} games, {stat.wins}W-{stat.draws}D-{stat.losses}L, {stat.points} pts")
                print(f"   ⚽ Goals: {stat.goals_for}:{stat.goals_against} ({stat.goal_difference:+d})")

        # Save to database
        system.save_to_database(results)

        # Show database summary
        summary = system.get_database_summary()
        print(f"\n📊 DATABASE SUMMARY:")
        print(f"   ⚽ Total match results: {summary['total_results']}")
        print(f"   📈 Total team statistics: {summary['total_team_stats']}")
        print(f"   🏆 Unique leagues: {summary['unique_leagues']}")
        print(f"   👥 Unique teams: {summary['unique_teams']}")

    else:
        print("❌ No historical football data found")

if __name__ == "__main__":
    demo_advanced_historical_system()
