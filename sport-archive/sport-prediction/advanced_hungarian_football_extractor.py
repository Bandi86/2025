#!/usr/bin/env python3
"""
Advanced Hungarian Football Extractor for SzerencseMix PDFs

A specialized tool for extracting football matches from Hungarian SzerencseMix PDFs.
Uses advanced pattern recognition and Hungarian language processing.
"""

import re
import json
import pdfplumber
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class HungarianFootballMatch:
    """Hungarian football match extracted from SzerencseMix PDF"""
    match_id: str
    home_team: str
    away_team: str
    league_name: str
    match_date: Optional[str] = None
    match_time: Optional[str] = None
    odds_1: Optional[float] = None  # Home win
    odds_x: Optional[float] = None  # Draw
    odds_2: Optional[float] = None  # Away win
    goals_over_15: Optional[float] = None
    goals_under_15: Optional[float] = None
    goals_over_25: Optional[float] = None
    goals_under_25: Optional[float] = None
    goals_over_35: Optional[float] = None
    goals_under_35: Optional[float] = None
    btts_yes: Optional[float] = None
    btts_no: Optional[float] = None
    corners_over_9: Optional[float] = None
    corners_under_9: Optional[float] = None
    cards_over_3: Optional[float] = None
    cards_under_3: Optional[float] = None
    source_page: int = 0
    raw_text: Optional[str] = None
    confidence_score: float = 0.0

class AdvancedHungarianFootballExtractor:
    """Advanced extractor for Hungarian football matches from SzerencseMix PDFs"""

    def __init__(self):
        self.setup_patterns()
        self.setup_keywords()

    def setup_patterns(self):
        """Setup regex patterns for Hungarian text parsing"""

        # Hungarian football league patterns
        self.league_patterns = [
            r'(?i)labdar[úu]g[áa]s',
            r'(?i)foci',
            r'(?i)football',
            r'(?i)premier\s+league',
            r'(?i)angol\s+premier',
            r'(?i)bundesliga',
            r'(?i)n[ée]met\s+bundesliga',
            r'(?i)la\s+liga',
            r'(?i)spanyol\s+la\s+liga',
            r'(?i)serie\s+a',
            r'(?i)olasz\s+serie',
            r'(?i)ligue\s+1',
            r'(?i)francia\s+ligue',
            r'(?i)bajnokok\s+lig[áa]ja',
            r'(?i)champions\s+league',
            r'(?i)eur[óo]pa\s+liga',
            r'(?i)europa\s+league',
            r'(?i)nb\s*[i1]',
            r'(?i)otp\s+bank\s+liga',
            r'(?i)magyar\s+nb',
            r'(?i)fortuna\s+liga',
            r'(?i)cseh\s+liga',
            r'(?i)lengyel\s+liga',
            r'(?i)ek[št]raklasa',
            r'(?i)ukr[áa]n\s+liga',
            r'(?i)orosz\s+liga',
            r'(?i)skót\s+liga',
            r'(?i)ir\s+liga',
            r'(?i)belga\s+liga',
            r'(?i)sv[áa]jci\s+liga',
            r'(?i)osztr[áa]k\s+liga',
            r'(?i)dán\s+liga',
            r'(?i)norv[ée]g\s+liga',
            r'(?i)sv[ée]d\s+liga',
            r'(?i)finn\s+liga'
        ]

        # Team name patterns (Hungarian and international)
        self.team_patterns = [
            r'[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+(?:\s+[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+)*',  # Hungarian
            r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*',  # English
            r'(?:FC|AC|AS|SC|CF|SK|NK|FK)\s+[A-Za-záéíóöőúüű]+',  # Club prefixes
            r'[A-Za-záéíóöőúüű]+\s+(?:FC|AC|AS|SC|CF|SK|NK|FK)',  # Club suffixes
            r'Real\s+[A-Za-z]+',
            r'Atletico\s+[A-Za-z]+',
            r'[A-Za-z]+\s+United',
            r'[A-Za-z]+\s+City'
        ]

        # Match vs patterns
        self.vs_patterns = ['-', '–', '—', 'vs', 'vs.', 'v.', 'ellen']

        # Odds patterns
        self.odds_pattern = r'\b(?:[1-9]\d*[.,]\d{2,3}|\d{1,2}[.,]\d{2})\b'

        # Date and time patterns
        self.date_patterns = [
            r'\b\d{4}[.-]\d{1,2}[.-]\d{1,2}\b',  # 2025-06-28
            r'\b\d{1,2}[./]\d{1,2}[./]\d{4}\b',  # 28/06/2025
            r'\b\d{1,2}[./]\d{1,2}\b'  # 28/06
        ]

        self.time_patterns = [
            r'\b\d{1,2}[:]\d{2}\b'  # 15:30
        ]

    def setup_keywords(self):
        """Setup Hungarian keywords for different bet types"""

        self.bet_type_keywords = {
            'main_result': ['1', 'x', '2', 'döntetlen', 'győzelem'],
            'goals': ['gól', 'goal', 'alatt', 'felett', 'over', 'under'],
            'btts': ['ggt', 'mindkét', 'mindket', 'both', 'teams', 'score'],
            'corners': ['sarok', 'corner', 'szögletek'],
            'cards': ['lap', 'card', 'sárga', 'piros', 'yellow', 'red'],
            'exclude_keywords': ['kenó', 'keno', 'lottó', 'lotto', 'hatoslottó',
                               'joker', 'skandináv', 'eurojackpot', 'totó', 'toto']
        }

    def is_football_page(self, text: str) -> bool:
        """Check if page contains football content (not lottery/other games)"""
        text_lower = text.lower()

        # Exclude lottery/gambling pages
        for exclude in self.bet_type_keywords['exclude_keywords']:
            if exclude in text_lower:
                return False

        # Check for football indicators
        for pattern in self.league_patterns:
            if re.search(pattern, text_lower):
                return True

        return False

    def extract_league_name(self, text: str) -> Optional[str]:
        """Extract league name from text"""
        for pattern in self.league_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Try to extract a longer league name around the match
                start = max(0, match.start() - 20)
                end = min(len(text), match.end() + 20)
                context = text[start:end].strip()

                # Clean up and return
                lines = context.split('\n')
                for line in lines:
                    if match.group().lower() in line.lower():
                        return line.strip()

        return None

    def parse_team_match(self, line: str) -> Optional[Tuple[str, str]]:
        """Parse team names from a line"""
        line = line.strip()

        # Try different separators
        for separator in self.vs_patterns:
            if separator in line:
                parts = line.split(separator, 1)  # Split only on first occurrence
                if len(parts) == 2:
                    home = parts[0].strip()
                    away = parts[1].strip()

                    # Validate team names
                    if (self.is_valid_team_name(home) and
                        self.is_valid_team_name(away)):
                        return home, away

        return None

    def is_valid_team_name(self, name: str) -> bool:
        """Validate if string looks like a team name"""
        if not name or len(name) < 3 or len(name) > 50:
            return False

        # Exclude numeric-only or weird patterns
        if name.isdigit() or name.count('.') > 3:
            return False

        # Check for team name patterns
        for pattern in self.team_patterns:
            if re.match(pattern, name):
                return True

        # Basic validation: should have at least some letters
        return bool(re.search(r'[a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ]', name))

    def extract_odds(self, text: str) -> List[float]:
        """Extract odds values from text"""
        odds = []
        matches = re.findall(self.odds_pattern, text)

        for match in matches:
            try:
                value = float(match.replace(',', '.'))
                # Validate realistic odds range
                if 1.01 <= value <= 100.0:
                    odds.append(value)
            except ValueError:
                continue

        return odds

    def find_date_time(self, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Find date and time in text"""
        date_found = None
        time_found = None

        # Look for dates
        for pattern in self.date_patterns:
            match = re.search(pattern, text)
            if match:
                date_found = match.group()
                break

        # Look for times
        for pattern in self.time_patterns:
            match = re.search(pattern, text)
            if match:
                time_found = match.group()
                break

        return date_found, time_found

    def calculate_confidence(self, match: HungarianFootballMatch) -> float:
        """Calculate confidence score for extracted match"""
        score = 0.0

        # Basic team names (30%)
        if match.home_team and match.away_team:
            score += 0.3

        # League identified (20%)
        if match.league_name:
            score += 0.2

        # Has main odds (30%)
        if match.odds_1 and match.odds_x and match.odds_2:
            score += 0.3

        # Has date (10%)
        if match.match_date:
            score += 0.1

        # Has additional odds (10%)
        additional_odds = sum(1 for odds in [
            match.goals_over_25, match.goals_under_25,
            match.btts_yes, match.btts_no
        ] if odds is not None)

        if additional_odds > 0:
            score += 0.1

        return min(score, 1.0)

    def process_pdf_page(self, page_text: str, page_num: int) -> List[HungarianFootballMatch]:
        """Process a single PDF page for football matches"""
        matches = []

        if not self.is_football_page(page_text):
            return matches

        lines = page_text.split('\n')
        current_league = self.extract_league_name(page_text)

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Look for team matches
            team_match = self.parse_team_match(line)
            if team_match:
                home_team, away_team = team_match

                # Create match ID
                match_id = f"{home_team}_{away_team}_{page_num}_{i}"

                # Look for date/time in nearby lines
                context_text = '\n'.join(lines[max(0, i-3):i+4])
                match_date, match_time = self.find_date_time(context_text)

                # Extract odds from current and nearby lines
                odds_text = '\n'.join(lines[i:i+5])  # Current line + next 4
                odds = self.extract_odds(odds_text)

                # Create match object
                match = HungarianFootballMatch(
                    match_id=match_id,
                    home_team=home_team,
                    away_team=away_team,
                    league_name=current_league or "Unknown League",
                    match_date=match_date,
                    match_time=match_time,
                    source_page=page_num,
                    raw_text=line
                )

                # Assign odds (typical order: 1X2, then goals, then BTTS)
                if len(odds) >= 3:
                    match.odds_1 = odds[0]
                    match.odds_x = odds[1]
                    match.odds_2 = odds[2]

                if len(odds) >= 5:
                    match.goals_over_25 = odds[3]
                    match.goals_under_25 = odds[4]

                if len(odds) >= 7:
                    match.btts_yes = odds[5]
                    match.btts_no = odds[6]

                # Calculate confidence
                match.confidence_score = self.calculate_confidence(match)

                # Only keep matches with reasonable confidence
                if match.confidence_score >= 0.3:
                    matches.append(match)

        return matches

    def process_pdf(self, pdf_path: str) -> List[HungarianFootballMatch]:
        """Process entire PDF for football matches"""
        print(f"\n🇭🇺 ADVANCED HUNGARIAN FOOTBALL EXTRACTOR")
        print(f"📄 Processing: {Path(pdf_path).name}")
        print("-" * 60)

        all_matches = []
        football_pages = 0

        try:
            with pdfplumber.open(pdf_path) as pdf:
                total_pages = len(pdf.pages)
                print(f"📊 Total pages: {total_pages}")

                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if not page_text:
                        continue

                    if self.is_football_page(page_text):
                        football_pages += 1
                        print(f"⚽ Processing football page {page_num}...")

                        page_matches = self.process_pdf_page(page_text, page_num)
                        all_matches.extend(page_matches)

                        if page_matches:
                            print(f"   ✅ Found {len(page_matches)} matches")
                        else:
                            print(f"   ❌ No matches found")

        except Exception as e:
            print(f"❌ Error processing PDF: {e}")
            return []

        print(f"\n📈 SUMMARY:")
        print(f"⚽ Football pages: {football_pages}/{total_pages}")
        print(f"🎯 Total matches found: {len(all_matches)}")

        return all_matches

    def save_results(self, matches: List[HungarianFootballMatch], output_file: str):
        """Save results to JSON with detailed metadata"""

        # Calculate statistics
        high_conf_matches = [m for m in matches if m.confidence_score >= 0.7]
        medium_conf_matches = [m for m in matches if 0.5 <= m.confidence_score < 0.7]
        low_conf_matches = [m for m in matches if m.confidence_score < 0.5]

        matches_with_odds = [m for m in matches if m.odds_1 and m.odds_x and m.odds_2]

        # Organize by leagues
        leagues = {}
        for match in matches:
            league = match.league_name or "Unknown"
            if league not in leagues:
                leagues[league] = []
            leagues[league].append(match)

        result_data = {
            'extraction_metadata': {
                'timestamp': datetime.now().isoformat(),
                'extractor_version': 'AdvancedHungarianFootballExtractor_v1.0',
                'total_matches': len(matches),
                'high_confidence_matches': len(high_conf_matches),
                'medium_confidence_matches': len(medium_conf_matches),
                'low_confidence_matches': len(low_conf_matches),
                'matches_with_full_odds': len(matches_with_odds),
                'leagues_found': list(leagues.keys()),
                'average_confidence': sum(m.confidence_score for m in matches) / len(matches) if matches else 0
            },
            'matches': [asdict(match) for match in matches],
            'league_breakdown': {
                league: len(matches) for league, matches in leagues.items()
            }
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Results saved to: {output_file}")
        print(f"📊 Statistics:")
        print(f"   • High confidence (≥70%): {len(high_conf_matches)}")
        print(f"   • Medium confidence (50-70%): {len(medium_conf_matches)}")
        print(f"   • Low confidence (<50%): {len(low_conf_matches)}")
        print(f"   • With full odds: {len(matches_with_odds)}")

def demo_advanced_extractor():
    """Demo the advanced Hungarian football extractor"""
    print("\n🚀 ADVANCED HUNGARIAN FOOTBALL EXTRACTOR DEMO")
    print("=" * 80)

    extractor = AdvancedHungarianFootballExtractor()

    # Use sample PDF
    sample_pdf = Path("data/demo_analysis/sample_szerencsemix.pdf")

    if not sample_pdf.exists():
        print("❌ Sample PDF not found. Please download first.")
        return

    # Process PDF
    matches = extractor.process_pdf(str(sample_pdf))

    if matches:
        print(f"\n🎯 EXTRACTED FOOTBALL MATCHES:")
        print("=" * 60)

        # Show top 10 highest confidence matches
        sorted_matches = sorted(matches, key=lambda m: m.confidence_score, reverse=True)

        for i, match in enumerate(sorted_matches[:10], 1):
            print(f"\n{i}. {match.home_team} vs {match.away_team}")
            print(f"   🏆 League: {match.league_name}")

            if match.match_date:
                print(f"   📅 Date: {match.match_date}")
            if match.match_time:
                print(f"   ⏰ Time: {match.match_time}")

            if match.odds_1:
                print(f"   💰 Main odds: {match.odds_1} / {match.odds_x} / {match.odds_2}")

            if match.goals_over_25:
                print(f"   ⚽ Goals 2.5: Over {match.goals_over_25} / Under {match.goals_under_25}")

            if match.btts_yes:
                print(f"   🎯 BTTS: Yes {match.btts_yes} / No {match.btts_no}")

            print(f"   📄 Page: {match.source_page}")
            print(f"   🎯 Confidence: {match.confidence_score:.1%}")

        # Save results
        output_file = "data/demo_analysis/advanced_hungarian_football.json"
        extractor.save_results(matches, output_file)

    else:
        print("❌ No football matches found")

if __name__ == "__main__":
    demo_advanced_extractor()
