#!/usr/bin/env python3
"""
Direct PDF Processing Test - bypassing import issues
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime
import sqlite3

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Direct PDF text extraction"""
    try:
        result = subprocess.run(
            ['pdftotext', '-layout', str(pdf_path), '-'],
            capture_output=True,
            text=True,
            timeout=15,
            check=True
        )
        return result.stdout
    except Exception as e:
        print(f"❌ PDF extraction failed: {e}")
        return ""

def simple_match_extraction(text: str) -> list:
    """Simple match extraction from PDF text"""
    import re

    matches = []
    lines = text.split('\n')

    # Simple pattern for matches: time, teams, odds
    match_pattern = r'([KVP])\s+(\d{1,2}:\d{2})\s+(\d+)\s+([^0-9]+?)\s*-\s*([^0-9]+?)\s+([\d,\.]+)\s+([\d,\.]+)\s+([\d,\.]+)'

    for i, line in enumerate(lines):
        match = re.search(match_pattern, line)
        if match:
            day_type, time, match_id, home_team, away_team, odds1, odds_x, odds2 = match.groups()

            # Clean team names
            home_team = home_team.strip()
            away_team = away_team.strip()

            # Skip if team names are too short or contain too many numbers
            if len(home_team) < 3 or len(away_team) < 3:
                continue

            matches.append({
                'day_type': day_type,
                'time': time,
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'odds_1': odds1,
                'odds_x': odds_x,
                'odds_2': odds2,
                'source_line': i,
                'raw_line': line.strip()
            })

    return matches

def test_direct_pdf_processing():
    """Test direct PDF processing without complex imports"""

    # Find a test PDF
    pdf_dir = Path('data/szerencsemix_archive/organized/2024/12-December')
    if not pdf_dir.exists():
        print("❌ PDF directory not found")
        return

    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found")
        return

    test_pdf = pdf_files[0]
    print(f"🔄 Direct processing: {test_pdf.name}")

    # Extract text
    text = extract_text_from_pdf(test_pdf)
    if not text:
        print("❌ No text extracted")
        return

    print(f"📄 Text extracted: {len(text)} characters")

    # Extract matches
    matches = simple_match_extraction(text)
    print(f"⚽ Found {len(matches)} potential matches")

    # Show sample matches
    for i, match in enumerate(matches[:5]):
        print(f"   {i+1}. {match['home_team']} vs {match['away_team']}")
        print(f"      Time: {match['time']}, Odds: {match['odds_1']}-{match['odds_x']}-{match['odds_2']}")

    # Check database connection
    try:
        conn = sqlite3.connect('data/football_database.db')
        cursor = conn.cursor()

        # Count existing matches
        cursor.execute("SELECT COUNT(*) FROM matches")
        existing_count = cursor.fetchone()[0]

        print(f"\n📊 Database status:")
        print(f"   Existing matches: {existing_count}")
        print(f"   New matches found: {len(matches)}")

        conn.close()

        if len(matches) > 0:
            print("✅ Direct PDF processing successful!")
            return True
        else:
            print("⚠️  No matches found - pattern may need adjustment")
            return False

    except Exception as e:
        print(f"❌ Database error: {e}")
        return False

if __name__ == "__main__":
    test_direct_pdf_processing()
