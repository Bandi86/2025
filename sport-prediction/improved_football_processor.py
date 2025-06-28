#!/usr/bin/env python3
"""
Improved Football-Specific PDF Processor

Processes SzerencseMix PDFs with focus on football matches only.
Uses improved pattern recognition and Hungarian language understanding.
"""

import re
import json
import pdfplumber
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta

@dataclass
class FootballMatch:
    """Football match information extracted from PDF"""
    home_team: str
    away_team: str
    date: Optional[str] = None
    time: Optional[str] = None
    league: Optional[str] = None
    odds_1: Optional[float] = None  # Home win
    odds_x: Optional[float] = None  # Draw
    odds_2: Optional[float] = None  # Away win
    over_25: Optional[float] = None
    under_25: Optional[float] = None
    btts_yes: Optional[float] = None
    btts_no: Optional[float] = None
    source_page: Optional[int] = None
    confidence: Optional[float] = None

class ImprovedFootballPDFProcessor:
    """Improved processor focused on football matches"""

    def __init__(self):
        # Known football leagues in Hungarian
        self.football_leagues = [
            'labdarúgás', 'foci', 'football',
            'premier league', 'angol premier liga',
            'bundesliga', 'német bundesliga',
            'la liga', 'spanyol la liga',
            'serie a', 'olasz serie a',
            'ligue 1', 'francia ligue',
            'champions league', 'bajnokok ligája',
            'europa league', 'európa liga',
            'nb i', 'otp bank liga', 'magyar nb i',
            'portugál liga', 'holland liga',
            'belga liga', 'svájci liga'
        ]

        # Known team name patterns
        self.team_patterns = [
            r'[A-Z][a-z]+ [A-Z][a-z]+',  # "Manchester United"
            r'[A-Z][a-z]+',  # "Arsenal"
            r'[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+',  # Hungarian teams
        ]

        # Odds patterns
        self.odds_pattern = r'\d+[.,]\d{2,3}'

        # Match separators
        self.match_separators = ['-', 'vs', 'vs.', '–', '—']

    def is_football_content(self, text: str) -> bool:
        """Check if text contains football-related content"""
        text_lower = text.lower()
        return any(league in text_lower for league in self.football_leagues)

    def extract_football_pages(self, pdf_path: str) -> List[Tuple[int, str]]:
        """Extract only pages that contain football content"""
        football_pages = []

        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if text and self.is_football_content(text):
                        football_pages.append((page_num, text))
        except Exception as e:
            print(f"Error extracting pages: {e}")

        return football_pages

    def parse_team_match(self, line: str) -> Optional[Tuple[str, str]]:
        """Parse a line to extract team names"""
        line = line.strip()

        for separator in self.match_separators:
            if separator in line:
                parts = line.split(separator)
                if len(parts) == 2:
                    home = parts[0].strip()
                    away = parts[1].strip()

                    # Basic validation
                    if (len(home) > 2 and len(away) > 2 and
                        not home.isdigit() and not away.isdigit()):
                        return home, away

        return None

    def extract_odds_from_line(self, line: str) -> List[float]:
        """Extract odds values from a line"""
        odds_matches = re.findall(self.odds_pattern, line)
        odds = []

        for match in odds_matches:
            try:
                # Convert comma to dot for decimal
                value = float(match.replace(',', '.'))
                # Validate odds range (typically 1.01 to 50.00)
                if 1.0 <= value <= 50.0:
                    odds.append(value)
            except ValueError:
                continue

        return odds

    def find_matches_in_text(self, text: str, page_num: int) -> List[FootballMatch]:
        """Find football matches in text"""
        matches = []
        lines = text.split('\n')

        current_league = None
        current_date = None

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Check for league header
            line_lower = line.lower()
            for league in self.football_leagues:
                if league in line_lower and len(line) < 100:  # League headers are usually short
                    current_league = line
                    break

            # Check for date
            date_match = re.search(r'\d{1,2}[./]\d{1,2}|\d{4}[.-]\d{1,2}[.-]\d{1,2}', line)
            if date_match:
                current_date = date_match.group()

            # Check for team match
            team_match = self.parse_team_match(line)
            if team_match:
                home_team, away_team = team_match

                # Look for odds in the same line or nearby lines
                odds = self.extract_odds_from_line(line)

                # If no odds in current line, check next few lines
                if not odds:
                    for j in range(1, min(4, len(lines) - i)):
                        if i + j < len(lines):
                            next_line = lines[i + j]
                            odds.extend(self.extract_odds_from_line(next_line))

                # Create match object
                match = FootballMatch(
                    home_team=home_team,
                    away_team=away_team,
                    date=current_date,
                    league=current_league,
                    source_page=page_num
                )

                # Assign odds (assume first 3 are 1X2, then over/under, then BTTS)
                if len(odds) >= 3:
                    match.odds_1 = odds[0]
                    match.odds_x = odds[1]
                    match.odds_2 = odds[2]

                if len(odds) >= 5:
                    match.over_25 = odds[3]
                    match.under_25 = odds[4]

                if len(odds) >= 7:
                    match.btts_yes = odds[5]
                    match.btts_no = odds[6]

                # Calculate confidence based on available data
                confidence = 0.5  # Base confidence
                if match.odds_1 and match.odds_x and match.odds_2:
                    confidence += 0.3
                if match.league:
                    confidence += 0.1
                if match.date:
                    confidence += 0.1

                match.confidence = min(confidence, 1.0)

                matches.append(match)

        return matches

    def process_pdf(self, pdf_path: str) -> List[FootballMatch]:
        """Process PDF and extract football matches"""
        print(f"🔄 Processing PDF: {Path(pdf_path).name}")

        # Extract football pages
        football_pages = self.extract_football_pages(pdf_path)
        print(f"⚽ Found {len(football_pages)} football pages")

        if not football_pages:
            print("❌ No football content found")
            return []

        all_matches = []

        for page_num, text in football_pages:
            print(f"📄 Processing page {page_num}...")
            matches = self.find_matches_in_text(text, page_num)
            all_matches.extend(matches)
            print(f"   Found {len(matches)} matches")

        print(f"✅ Total matches found: {len(all_matches)}")
        return all_matches

    def save_matches(self, matches: List[FootballMatch], output_file: str):
        """Save matches to JSON file"""
        matches_data = {
            'extraction_time': datetime.now().isoformat(),
            'total_matches': len(matches),
            'matches': [asdict(match) for match in matches]
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(matches_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved {len(matches)} matches to {output_file}")

def demo_improved_processor():
    """Demo the improved processor"""
    print("🚀 IMPROVED FOOTBALL PDF PROCESSOR DEMO")
    print("="*60)

    processor = ImprovedFootballPDFProcessor()

    # Check if we have a sample PDF
    sample_pdf = Path("data/demo_analysis/sample_szerencsemix.pdf")

    if not sample_pdf.exists():
        print("⚠️  No sample PDF found. Please run the downloader first.")
        return

    # Process the PDF
    matches = processor.process_pdf(str(sample_pdf))

    if matches:
        print(f"\n🎯 EXTRACTED {len(matches)} FOOTBALL MATCHES:")
        print("-" * 40)

        for i, match in enumerate(matches, 1):
            print(f"\n{i}. {match.home_team} vs {match.away_team}")
            if match.date:
                print(f"   📅 Date: {match.date}")
            if match.league:
                print(f"   🏆 League: {match.league}")
            if match.odds_1:
                print(f"   💰 Odds: {match.odds_1} / {match.odds_x} / {match.odds_2}")
            print(f"   📄 Page: {match.source_page}")
            print(f"   🎯 Confidence: {match.confidence:.1%}")

        # Save results
        output_file = "data/demo_analysis/improved_football_matches.json"
        processor.save_matches(matches, output_file)
    else:
        print("❌ No football matches found")

if __name__ == "__main__":
    demo_improved_processor()
