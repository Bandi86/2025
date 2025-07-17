#!/usr/bin/env python3
"""
Test the enhanced league table extractor with PDF processing
"""

import sys
from pathlib import Path
from league_table_extractor_fixed import LeagueTableExtractor

def test_pdf_table_extraction():
    """Test extracting league tables from a PDF"""
    extractor = LeagueTableExtractor()

    # Find test PDFs
    pdf_dir = Path('data/szerencsemix_archive/organized/2024/12-December')
    if not pdf_dir.exists():
        print("❌ PDF directory not found")
        return

    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print("❌ No PDF files found")
        return

    # Test with one PDF
    test_pdf = pdf_files[0]
    print(f"🔄 Testing league table extraction with: {test_pdf.name}")

    try:
        tables = extractor.process_pdf_for_tables(test_pdf)

        print(f"✅ Found {len(tables)} league tables")

        for i, table in enumerate(tables):
            print(f"\n📊 Table {i+1}: {table['league']}")
            print(f"   Teams: {len(table['teams'])}")

            # Show first few teams
            for j, team in enumerate(table['teams'][:3]):
                print(f"   {team['position']}. {team['team_name']} - {team['points']} pts")

        # Test batch processing
        print(f"\n🔄 Testing batch processing...")
        result = extractor.process_pdf_directory(str(pdf_dir))

        print(f"📁 Processed {result['processed_files']}/{result['total_files']} files")
        print(f"📊 Extracted {result['total_tables_extracted']} tables total")
        print(f"✅ Success rate: {result['success_rate']:.1%}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_table_extraction()
