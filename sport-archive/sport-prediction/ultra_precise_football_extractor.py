#!/usr/bin/env python3
"""
Ultra-Precise Hungarian Football Extractor for SzerencseMix PDFs

This is a specialized tool that uses the patterns we discovered from the sample PDF
to extract ONLY real football matches with high precision.
"""

import re
import json
import pdfplumber
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class PreciseFootballMatch:
    """A precisely extracted football match"""
    match_id: str
    home_team: str
    away_team: str
    match_date: Optional[str] = None
    match_time: Optional[str] = None
    league_info: Optional[str] = None
    odds_1: Optional[float] = None  # Home win
    odds_x: Optional[float] = None  # Draw
    odds_2: Optional[float] = None  # Away win
    bet_type: str = "1X2"  # Type of bet (1X2, Handicap, Goals, etc.)
    market_id: Optional[str] = None
    source_page: int = 0
    raw_line: Optional[str] = None
    confidence: float = 0.0

class UltraPreciseFootballExtractor:
    """Ultra-precise extractor using discovered patterns"""

    def __init__(self):
        self.setup_patterns()
        self.setup_team_database()

    def setup_patterns(self):
        """Setup patterns based on discovered data structure"""

        # Pattern for match lines (what we found in the sample)
        # Example: "P 12:30 05336 Daejeon Citizen - Jeju 2,04 3,30 3,15"
        self.match_line_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+[-–—]\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

        # Pattern for handicap/special bets
        # Example: "P 15:30 11190 Lengyelország - Ukrajna Hendikep 0:1 1,41 4,20 5,00"
        self.special_bet_pattern = r'P\s+(\d{1,2}:\d{2})\s+(\d{5})\s+(.+?)\s+[-–—]\s+(.+?)\s+(Hendikep|Gólszám|Döntetlennél)\s+(.+?)\s+((?:\d+[.,]\d{2,3}\s*){2,})'

        # Country/team name mappings
        self.country_mappings = {
            'Lengyelország': 'Poland',
            'Ukrajna': 'Ukraine',
            'Szerbia': 'Serbia',
            'Izland': 'Iceland',
            'Spanyolország': 'Spain',
            'Japán': 'Japan'
        }

        # Known team patterns from K-League, European teams, etc.
        self.known_teams = set()

    def setup_team_database(self):
        """Setup database of known teams"""

        # Korean teams (K-League)
        korean_teams = [
            'Daejeon Citizen', 'Jeju', 'Gimcheon Sangmu', 'Jeonbuk',
            'FC Seoul', 'Suwon Samsung', 'Pohang Steelers', 'Ulsan Hyundai',
            'Gwangju FC', 'Incheon United', 'Gangwon FC', 'Seongnam FC'
        ]

        # European teams (common ones)
        european_teams = [
            'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Valencia',
            'Manchester United', 'Manchester City', 'Arsenal', 'Chelsea',
            'Liverpool', 'Tottenham', 'Bayern Munich', 'Borussia Dortmund',
            'Juventus', 'AC Milan', 'Inter Milan', 'PSG', 'Lyon'
        ]

        # Add country names
        countries = list(self.country_mappings.keys()) + list(self.country_mappings.values())

        self.known_teams.update(korean_teams)
        self.known_teams.update(european_teams)
        self.known_teams.update(countries)

    def clean_team_name(self, team_name: str) -> str:
        """Clean and normalize team name"""
        team_name = team_name.strip()

        # Remove common prefixes/suffixes that might be parsing artifacts
        prefixes_to_remove = ['P ', 'H ', 'V ']
        for prefix in prefixes_to_remove:
            if team_name.startswith(prefix):
                team_name = team_name[len(prefix):].strip()

        # Map Hungarian country names to English
        if team_name in self.country_mappings:
            team_name = self.country_mappings[team_name]

        return team_name

    def extract_odds(self, odds_text: str) -> List[float]:
        """Extract odds values from text"""
        odds = []
        # Find all decimal numbers with comma or dot
        pattern = r'\b\d+[.,]\d{2,3}\b'
        matches = re.findall(pattern, odds_text)

        for match in matches:
            try:
                value = float(match.replace(',', '.'))
                # Validate realistic odds
                if 1.01 <= value <= 50.0:
                    odds.append(value)
            except ValueError:
                continue

        return odds

    def is_valid_team_name(self, name: str) -> bool:
        """Check if this looks like a real team name"""
        name = name.strip()

        # Basic validation
        if len(name) < 3 or len(name) > 40:
            return False

        # Should contain letters
        if not re.search(r'[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ]', name):
            return False

        # Known teams get high priority
        if name in self.known_teams:
            return True

        # Check against common team patterns
        team_patterns = [
            r'^[A-Z][a-z]+(?: [A-Z][a-z]+)*$',  # "Real Madrid"
            r'^[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+(?: [A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)*$',  # Hungarian
            r'.*FC$|.*United$|.*City$|.*CF$',  # Common suffixes
        ]

        for pattern in team_patterns:
            if re.match(pattern, name):
                return True

        return False

    def extract_matches_from_page(self, page_text: str, page_num: int) -> List[PreciseFootballMatch]:
        """Extract matches from a page using precise patterns"""
        matches = []
        lines = page_text.split('\n')

        for line_num, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Try main match pattern first
            main_match = re.match(self.match_line_pattern, line)
            if main_match:
                time_str = main_match.group(1)
                market_id = main_match.group(2)
                home_team_raw = main_match.group(3)
                away_team_raw = main_match.group(4)
                odds_text = main_match.group(5)

                home_team = self.clean_team_name(home_team_raw)
                away_team = self.clean_team_name(away_team_raw)

                # Validate team names
                if (self.is_valid_team_name(home_team) and
                    self.is_valid_team_name(away_team)):

                    odds = self.extract_odds(odds_text)

                    match = PreciseFootballMatch(
                        match_id=f"{market_id}_{page_num}_{line_num}",
                        home_team=home_team,
                        away_team=away_team,
                        match_time=time_str,
                        market_id=market_id,
                        bet_type="1X2",
                        source_page=page_num,
                        raw_line=line
                    )

                    # Assign odds
                    if len(odds) >= 3:
                        match.odds_1 = odds[0]
                        match.odds_x = odds[1]
                        match.odds_2 = odds[2]
                        match.confidence = 0.95
                    elif len(odds) >= 2:
                        match.odds_1 = odds[0]
                        match.odds_2 = odds[1]
                        match.confidence = 0.85
                    else:
                        match.confidence = 0.7

                    matches.append(match)

            # Try special bet pattern
            special_match = re.match(self.special_bet_pattern, line)
            if special_match:
                time_str = special_match.group(1)
                market_id = special_match.group(2)
                home_team_raw = special_match.group(3)
                away_team_raw = special_match.group(4)
                bet_type = special_match.group(5)
                bet_detail = special_match.group(6)
                odds_text = special_match.group(7)

                home_team = self.clean_team_name(home_team_raw)
                away_team = self.clean_team_name(away_team_raw)

                # Validate team names
                if (self.is_valid_team_name(home_team) and
                    self.is_valid_team_name(away_team)):

                    odds = self.extract_odds(odds_text)

                    match = PreciseFootballMatch(
                        match_id=f"{market_id}_{bet_type}_{page_num}_{line_num}",
                        home_team=home_team,
                        away_team=away_team,
                        match_time=time_str,
                        market_id=market_id,
                        bet_type=f"{bet_type} {bet_detail}",
                        source_page=page_num,
                        raw_line=line
                    )

                    # Assign odds
                    if len(odds) >= 3:
                        match.odds_1 = odds[0]
                        match.odds_x = odds[1]
                        match.odds_2 = odds[2]
                        match.confidence = 0.90
                    elif len(odds) >= 2:
                        match.odds_1 = odds[0]
                        match.odds_2 = odds[1]
                        match.confidence = 0.80
                    else:
                        match.confidence = 0.7

                    matches.append(match)

        return matches

    def process_pdf(self, pdf_path: str) -> List[PreciseFootballMatch]:
        """Process PDF with ultra-precise extraction"""
        print(f"\n🎯 ULTRA-PRECISE HUNGARIAN FOOTBALL EXTRACTOR")
        print(f"📄 Processing: {Path(pdf_path).name}")
        print("-" * 70)

        all_matches = []
        total_pages = 0

        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"📊 Total pages: {total_pages}")

                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if not page_text:
                        continue

                    page_matches = self.extract_matches_from_page(page_text, page_num)

                    if page_matches:
                        print(f"⚽ Page {page_num}: Found {len(page_matches)} matches")
                        all_matches.extend(page_matches)

        except Exception as e:
            print(f"❌ Error processing PDF: {e}")
            return []

        # Group by unique matches (same teams, same time)
        unique_matches = {}
        for match in all_matches:
            key = f"{match.home_team}_{match.away_team}_{match.match_time}"
            if key not in unique_matches:
                unique_matches[key] = []
            unique_matches[key].append(match)

        print(f"\n📈 EXTRACTION SUMMARY:")
        print(f"📄 Pages processed: {total_pages}")
        print(f"🎯 Total match entries: {len(all_matches)}")
        print(f"⚽ Unique matches: {len(unique_matches)}")

        return all_matches

    def save_results(self, matches: List[PreciseFootballMatch], output_file: str):
        """Save results with detailed analysis"""

        # Group by unique matches
        unique_matches = {}
        for match in matches:
            key = f"{match.home_team}_{match.away_team}_{match.match_time}"
            if key not in unique_matches:
                unique_matches[key] = []
            unique_matches[key].append(match)

        # Analyze bet types
        bet_types = {}
        for match in matches:
            bet_type = match.bet_type
            if bet_type not in bet_types:
                bet_types[bet_type] = 0
            bet_types[bet_type] += 1

        result_data = {
            'extraction_metadata': {
                'timestamp': datetime.now().isoformat(),
                'extractor_version': 'UltraPreciseFootballExtractor_v1.0',
                'total_entries': len(matches),
                'unique_matches': len(unique_matches),
                'average_confidence': sum(m.confidence for m in matches) / len(matches) if matches else 0,
                'bet_types': bet_types
            },
            'matches': [asdict(match) for match in matches],
            'unique_matches_summary': {
                key: {
                    'home_team': matches[0].home_team,
                    'away_team': matches[0].away_team,
                    'match_time': matches[0].match_time,
                    'available_markets': len(matches),
                    'market_types': [m.bet_type for m in matches]
                }
                for key, matches in unique_matches.items()
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {output_file}")
        print(f"📊 Statistics:")
        print(f"   • Total entries: {len(matches)}")
        print(f"   • Unique matches: {len(unique_matches)}")
        print(f"   • Bet types: {list(bet_types.keys())}")
        print(f"   • Average confidence: {sum(m.confidence for m in matches) / len(matches):.2%}")

def demo_ultra_precise_extractor():
    """Demo the ultra-precise extractor"""
    print("\n🚀 ULTRA-PRECISE HUNGARIAN FOOTBALL EXTRACTOR DEMO")
    print("=" * 80)

    extractor = UltraPreciseFootballExtractor()

    # Use sample PDF
    sample_pdf = Path("data/demo_analysis/sample_szerencsemix.pdf")

    if not sample_pdf.exists():
        print("❌ Sample PDF not found. Please download first.")
        return

    # Process PDF
    matches = extractor.process_pdf(str(sample_pdf))

    if matches:
        print(f"\n🎯 EXTRACTED FOOTBALL MATCHES:")
        print("=" * 70)

        # Group by unique matches
        unique_matches = {}
        for match in matches:
            key = f"{match.home_team}_{match.away_team}_{match.match_time}"
            if key not in unique_matches:
                unique_matches[key] = []
            unique_matches[key].append(match)

        # Show unique matches with all their markets
        for i, (key, match_group) in enumerate(unique_matches.items(), 1):
            main_match = match_group[0]
            print(f"\n{i}. {main_match.home_team} vs {main_match.away_team}")
            print(f"   ⏰ Time: {main_match.match_time}")
            print(f"   📄 Page: {main_match.source_page}")
            print(f"   🎯 Available markets: {len(match_group)}")

            for market in match_group:
                if market.odds_1 and market.odds_x and market.odds_2:
                    print(f"      • {market.bet_type}: {market.odds_1} / {market.odds_x} / {market.odds_2}")
                elif market.odds_1 and market.odds_2:
                    print(f"      • {market.bet_type}: {market.odds_1} / {market.odds_2}")
                else:
                    print(f"      • {market.bet_type}: (odds not parsed)")

            if i >= 10:  # Show only first 10
                break

        # Save results
        output_file = "data/demo_analysis/ultra_precise_football.json"
        extractor.save_results(matches, output_file)

    else:
        print("❌ No football matches found")

if __name__ == "__main__":
    demo_ultra_precise_extractor()
