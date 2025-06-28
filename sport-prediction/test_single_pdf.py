#!/usr/bin/env python3
"""
Simple PDF processing test using the working advanced processor
"""

import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, '.')

# Use the working processor from the test
from test_mock_processor import create_advanced_processor

def test_single_pdf():
    """Test processing a single PDF file"""
    processor = create_advanced_processor()

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
    print(f"🔄 Testing with: {test_pdf.name}")

    try:
        result = processor.process_pdf(test_pdf)

        if result.get('success'):
            stats = result.get('stats', {})
            print(f"✅ Success!")
            print(f"   📄 Text length: {stats.get('text_length', 0)}")
            print(f"   🏆 League sections: {stats.get('league_sections', 0)}")
            print(f"   ⚽ Unique matches: {stats.get('unique_matches', 0)}")
            print(f"   💰 Betting options: {stats.get('total_betting_options', 0)}")

            if 'data' in result and 'matches' in result['data']:
                matches = result['data']['matches'][:3]  # First 3
                print(f"\n📋 Sample matches:")
                for i, match in enumerate(matches):
                    print(f"   {i+1}. {match.get('home_team')} vs {match.get('away_team')}")
                    print(f"      Liga: {match.get('league')}")
        else:
            print(f"❌ Failed: {result.get('error')}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_single_pdf()
