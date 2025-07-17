#!/usr/bin/env python3
"""
Simple test script for PDF processing
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, '.')

from advanced_tippmix_processor import AdvancedTippmixProcessor

def test_pdf_processing():
    processor = AdvancedTipmmixProcessor()

    # Find a test PDF
    pdf_dir = Path('data/szerencsemix_archive/organized/2024/12-December')
    if not pdf_dir.exists():
        print("PDF directory not found")
        return

    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print("No PDF files found")
        return

    test_pdf = pdf_files[0]
    print(f"Testing with: {test_pdf.name}")

    try:
        result = processor.process_pdf(test_pdf)
        print(f"Success: {result.get('success', False)}")

        if 'stats' in result:
            stats = result['stats']
            print(f"Stats:")
            print(f"  - Text length: {stats.get('text_length', 0)}")
            print(f"  - League sections: {stats.get('league_sections', 0)}")
            print(f"  - Unique matches: {stats.get('unique_matches', 0)}")
            print(f"  - Total betting options: {stats.get('total_betting_options', 0)}")
            print(f"  - Avg confidence: {stats.get('avg_confidence', 0)}")

        if 'data' in result and 'matches' in result['data']:
            matches = result['data']['matches']
            print(f"\nFirst few matches:")
            for i, match in enumerate(matches[:3]):
                print(f"  {i+1}. {match.get('home_team', 'Unknown')} vs {match.get('away_team', 'Unknown')}")
                print(f"     League: {match.get('league', 'Unknown')}")
                print(f"     Date: {match.get('match_date', 'Unknown')}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_processing()
