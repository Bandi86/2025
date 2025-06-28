#!/usr/bin/env python3
"""
Simple test for league table text patterns
"""

import subprocess
from pathlib import Path
import re

def test_table_patterns():
    """Test if we can find table patterns in PDF text"""

    # Extract text from a small PDF sample
    pdf_file = Path('data/szerencsemix_archive/organized/2024/12-December/Web__103sz__K__12-24_2024.12.24_01.pdf')

    try:
        # Get first part of PDF text
        result = subprocess.run(
            ['pdftotext', '-layout', str(pdf_file), '-'],
            capture_output=True,
            text=True,
            timeout=10  # 10 second timeout
        )

        if result.returncode != 0:
            print("❌ pdftotext failed")
            return

        text = result.stdout
        lines = text.split('\n')

        print(f"📄 PDF text extracted: {len(text)} characters, {len(lines)} lines")

        # Look for potential table patterns
        table_keywords = [
            'tabella', 'állás', 'bajnokság', 'liga', 'helyezés',
            'Premier League', 'Serie A', 'Bundesliga', 'La Liga'
        ]

        found_patterns = []
        for i, line in enumerate(lines):
            line_lower = line.lower()
            for keyword in table_keywords:
                if keyword.lower() in line_lower:
                    found_patterns.append((i, keyword, line.strip()))
                    break

        print(f"\n🔍 Found {len(found_patterns)} potential table-related lines:")
        for line_num, keyword, line_text in found_patterns[:10]:  # Show first 10
            print(f"   Line {line_num}: [{keyword}] {line_text[:60]}...")

        # Look for table-like patterns (position number + team name + numbers)
        table_pattern = r'^\s*(\d+)\.?\s+([A-Za-z\s\.\-]+?)\s+(\d+)'
        table_matches = []

        for i, line in enumerate(lines):
            match = re.match(table_pattern, line)
            if match:
                table_matches.append((i, line.strip()))

        print(f"\n📊 Found {len(table_matches)} potential table rows:")
        for line_num, line_text in table_matches[:5]:  # Show first 5
            print(f"   Line {line_num}: {line_text}")

        # Check if it looks like a football PDF
        football_keywords = ['labdarúgás', 'football', 'foci', 'meccs', 'fogadás']
        football_lines = 0
        for line in lines[:50]:  # Check first 50 lines
            for keyword in football_keywords:
                if keyword.lower() in line.lower():
                    football_lines += 1
                    break

        print(f"\n⚽ Football content indicators: {football_lines} lines")

        if football_lines > 0:
            print("✅ This appears to be a football-related PDF")
        else:
            print("❓ This may not contain football content")

    except subprocess.TimeoutExpired:
        print("❌ PDF processing timed out")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_table_patterns()
