#!/usr/bin/env python3
"""
SzerencseMix Archive Demo

Demonstrates downloading and processing historical SzerencseMix PDFs
for large-scale sports betting data analysis.
"""

import os
import sys
import json
from pathlib import Path

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def demo_extract_links():
    """Demo: Extract all PDF links without downloading"""
    print("🔍 DEMO: Extracting PDF links from SzerencseMix page...")
    print("="*60)

    try:
        from src.data_collection.szerencsemix_downloader import SzerencseMixDownloader

        # Create downloader
        downloader = SzerencseMixDownloader()

        # Extract links only
        pdfs = downloader.extract_pdf_links_from_page()

        if pdfs:
            print(f"✅ Found {len(pdfs)} PDF files!")
            print(f"📅 Date range: {min(pdf.date for pdf in pdfs)} to {max(pdf.date for pdf in pdfs)}")

            # Group by year
            by_year = {}
            for pdf in pdfs:
                year = pdf.year
                by_year[year] = by_year.get(year, 0) + 1

            print("\n📊 Distribution by year:")
            for year in sorted(by_year.keys(), reverse=True):
                print(f"   {year}: {by_year[year]} PDFs")

            print("\n📝 Sample PDFs:")
            for i, pdf in enumerate(pdfs[:5]):
                print(f"   {i+1}. {pdf.date} - {pdf.filename} ({pdf.type})")

            if len(pdfs) > 5:
                print(f"   ... and {len(pdfs) - 5} more")

            print(f"\n💾 Estimated total size: ~{len(pdfs) * 2:.0f} MB")
            print(f"⏱️  Estimated download time: ~{len(pdfs) * 3 / 60:.0f} minutes")

        else:
            print("❌ No PDFs found")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("="*60)

def demo_download_sample():
    """Demo: Download a small sample of PDFs"""
    print("\n📥 DEMO: Downloading sample PDFs...")
    print("="*60)

    try:
        from src.data_collection.szerencsemix_downloader import SzerencseMixDownloader

        # Create downloader
        demo_dir = Path(__file__).parent.parent.parent / "data" / "demo_szerencsemix"
        downloader = SzerencseMixDownloader(base_dir=demo_dir)

        # Extract links
        all_pdfs = downloader.extract_pdf_links_from_page()

        if all_pdfs:
            # Download only the 3 most recent PDFs for demo
            sample_pdfs = all_pdfs[:3]
            downloader.all_pdfs = sample_pdfs

            print(f"📥 Downloading {len(sample_pdfs)} sample PDFs...")
            for pdf in sample_pdfs:
                print(f"   - {pdf.filename}")

            # Download with single worker and minimal delay for demo
            downloader.download_all_pdfs(max_workers=1, delay=0.5)

            # Show results
            success_count = len([pdf for pdf in sample_pdfs if pdf.downloaded])
            print(f"\n✅ Downloaded: {success_count}/{len(sample_pdfs)}")

            if success_count > 0:
                print(f"📁 Location: {demo_dir}")

                # Show file sizes
                total_size = 0
                for pdf in sample_pdfs:
                    if pdf.downloaded and pdf.file_size:
                        total_size += pdf.file_size
                        print(f"   📄 {pdf.filename}: {pdf.file_size:,} bytes")

                print(f"💾 Total size: {total_size:,} bytes ({total_size/1024/1024:.1f} MB)")
        else:
            print("❌ No PDFs found to download")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("="*60)

def demo_process_sample():
    """Demo: Process sample PDFs and extract match data"""
    print("\n⚙️  DEMO: Processing sample PDFs...")
    print("="*60)

    try:
        from src.tools.hungarian_pdf_processor import HungarianBettingPDFProcessor

        # Find sample PDFs
        demo_dir = Path(__file__).parent.parent.parent / "data" / "demo_szerencsemix"
        pdf_files = list(demo_dir.rglob("*.pdf"))

        if not pdf_files:
            print("⚠️  No sample PDFs found. Run demo_download_sample() first.")
            return

        processor = HungarianBettingPDFProcessor()
        total_matches = 0

        print(f"📄 Processing {len(pdf_files)} PDFs...")

        for pdf_file in pdf_files:
            print(f"\n🔄 Processing: {pdf_file.name}")

            try:
                text_pages = processor.extract_text_from_pdf(str(pdf_file))
                matches = processor.parse_matches_from_text(text_pages)

                if matches:
                    print(f"   ✅ Extracted {len(matches)} matches")
                    total_matches += len(matches)

                    # Show sample matches
                    for i, match in enumerate(matches[:2]):
                        print(f"   📊 Match {i+1}: {match.home_team} vs {match.away_team}")
                        if hasattr(match, 'date') and match.date:
                            print(f"      📅 Date: {match.date}")
                        if hasattr(match, 'time') and match.time:
                            print(f"      ⏰ Time: {match.time}")
                        if hasattr(match, 'competition') and match.competition:
                            print(f"      🏆 League: {match.competition}")

                        # Show available odds
                        odds_info = []
                        if hasattr(match, 'home_win_odds') and match.home_win_odds:
                            odds_info.append(f"1X2 ({match.home_win_odds})")
                        if hasattr(match, 'over_25_odds') and match.over_25_odds:
                            odds_info.append(f"Over2.5 ({match.over_25_odds})")
                        if hasattr(match, 'btts_yes_odds') and match.btts_yes_odds:
                            odds_info.append(f"BTTS ({match.btts_yes_odds})")

                        if odds_info:
                            print(f"      💰 Odds: {', '.join(odds_info)}")

                    if len(matches) > 2:
                        print(f"   ... and {len(matches) - 2} more matches")
                else:
                    print("   ⚠️  No matches found")

            except Exception as e:
                print(f"   ❌ Error: {e}")

        print(f"\n🎯 TOTAL EXTRACTED: {total_matches} matches from {len(pdf_files)} PDFs")

        if total_matches > 0:
            print(f"📈 Average: {total_matches / len(pdf_files):.1f} matches per PDF")
            print(f"🚀 Scaled to full archive (~800 PDFs): ~{total_matches / len(pdf_files) * 800:.0f} matches")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("="*60)

def demo_batch_processing():
    """Demo: Show how batch processing would work"""
    print("\n🔄 DEMO: Batch processing overview...")
    print("="*60)

    print("🏭 BATCH PROCESSING WORKFLOW:")
    print("1. 📂 Scan archive directory for all PDFs")
    print("2. 🔄 Process PDFs in parallel batches")
    print("3. 💾 Save extracted matches to JSON files")
    print("4. 📊 Consolidate all data into unified dataset")
    print("5. 📈 Generate statistics and analysis reports")

    print("\n⚡ ESTIMATED PERFORMANCE:")
    print("- ~800 historical PDFs available")
    print("- ~50 matches per PDF average")
    print("- ~40,000 total matches in archive")
    print("- Processing time: ~2-4 hours with 4 workers")
    print("- Output: JSON + CSV datasets ready for ML")

    print("\n🎯 WHAT THIS ENABLES:")
    print("✅ Historical trend analysis (2019-2025)")
    print("✅ Odds pattern recognition")
    print("✅ Market movement tracking")
    print("✅ League-specific modeling")
    print("✅ Large-scale ML training data")
    print("✅ Real-time prediction improvements")

    print("\n🚀 TO RUN FULL BATCH PROCESSING:")
    print("python src/data_collection/szerencsemix_downloader.py")
    print("python src/data_collection/batch_pdf_processor.py")

    print("="*60)

def demo_analysis_potential():
    """Demo: Show potential analysis capabilities"""
    print("\n📊 DEMO: Analysis potential with full dataset...")
    print("="*60)

    print("🎯 POSSIBLE ANALYSES WITH FULL ARCHIVE:")
    print()

    print("📈 MARKET TRENDS:")
    print("- Odds evolution over time")
    print("- Market efficiency changes")
    print("- Bookmaker margin analysis")
    print("- Value bet identification patterns")

    print("\n🏆 LEAGUE INSIGHTS:")
    print("- League-specific betting patterns")
    print("- Home advantage trends")
    print("- Seasonal variations")
    print("- Cross-league comparisons")

    print("\n⏰ TEMPORAL PATTERNS:")
    print("- Day-of-week effects")
    print("- Holiday impact on odds")
    print("- Last-minute line movements")
    print("- Long-term trend cycles")

    print("\n🤖 MACHINE LEARNING:")
    print("- Training data for prediction models")
    print("- Feature importance analysis")
    print("- Ensemble model validation")
    print("- Backtesting strategy performance")

    print("\n💡 REAL-WORLD APPLICATIONS:")
    print("- Automated betting strategies")
    print("- Risk management optimization")
    print("- Portfolio diversification")
    print("- Real-time prediction enhancement")

    print("="*60)

def run_complete_demo():
    """Run the complete demonstration"""
    print("🎪 SZERENCSEMIX ARCHIVE PROCESSING DEMO")
    print("="*80)
    print("Demonstrating large-scale historical PDF processing for sports betting analysis")
    print("="*80)

    # Step 1: Extract links
    demo_extract_links()

    # Step 2: Download sample
    demo_download_sample()

    # Step 3: Process sample
    demo_process_sample()

    # Step 4: Batch processing overview
    demo_batch_processing()

    # Step 5: Analysis potential
    demo_analysis_potential()

    print("\n🎉 DEMO COMPLETE!")
    print("="*80)
    print("💡 Next steps:")
    print("1. Run full downloader to get all historical PDFs")
    print("2. Run batch processor to extract all match data")
    print("3. Use the dataset for advanced ML model training")
    print("4. Integrate historical insights into live predictions")
    print("="*80)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SzerencseMix Archive Demo")
    parser.add_argument("--step", choices=[
        "extract", "download", "process", "batch", "analysis", "complete"
    ], default="complete", help="Which demo step to run")

    args = parser.parse_args()

    if args.step == "extract":
        demo_extract_links()
    elif args.step == "download":
        demo_download_sample()
    elif args.step == "process":
        demo_process_sample()
    elif args.step == "batch":
        demo_batch_processing()
    elif args.step == "analysis":
        demo_analysis_potential()
    else:
        run_complete_demo()
