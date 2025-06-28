#!/usr/bin/env python3
"""
SzerencseMix Batch PDF Processor

Processes all downloaded SzerencseMix PDFs and extracts match/odds data
for large-scale analysis and model training.
"""

import os
import sys
import json
import logging
import multiprocessing
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import concurrent.futures
from threading import Lock
import pandas as pd

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.tools.hungarian_pdf_processor import HungarianBettingPDFProcessor

@dataclass
class ProcessingResult:
    """Result of processing a single PDF"""
    pdf_path: str
    success: bool
    match_count: int
    error_message: Optional[str] = None
    processing_time: Optional[float] = None
    output_file: Optional[str] = None

class SzerencseMixBatchProcessor:
    """Batch processor for all SzerencseMix PDFs"""

    def __init__(self, archive_dir: str = None, output_dir: str = None):
        # Set default directories
        if archive_dir is None:
            archive_dir = Path(__file__).parent.parent.parent / "data" / "szerencsemix_archive"
        if output_dir is None:
            output_dir = Path(__file__).parent.parent.parent / "data" / "processed_matches"

        self.archive_dir = Path(archive_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Setup logging
        self.setup_logging()

        # Processing tracking
        self.processing_results: List[ProcessingResult] = []
        self.results_lock = Lock()

        # PDF processor
        self.pdf_processor = HungarianBettingPDFProcessor()

        # Load existing results
        self.results_file = self.output_dir / "processing_results.json"
        self.load_existing_results()

    def setup_logging(self):
        """Setup logging configuration"""
        log_file = self.output_dir / "batch_processing.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def load_existing_results(self):
        """Load existing processing results"""
        if self.results_file.exists():
            try:
                with open(self.results_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.processing_results = [ProcessingResult(**item) for item in data.get('results', [])]
                self.logger.info(f"Loaded {len(self.processing_results)} existing processing results")
            except Exception as e:
                self.logger.warning(f"Failed to load existing results: {e}")

    def save_results(self):
        """Save processing results"""
        try:
            data = {
                'results': [asdict(result) for result in self.processing_results],
                'last_updated': datetime.now().isoformat(),
                'total_processed': len(self.processing_results),
                'successful': len([r for r in self.processing_results if r.success]),
                'failed': len([r for r in self.processing_results if not r.success])
            }
            with open(self.results_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to save results: {e}")

    def find_all_pdfs(self) -> List[Path]:
        """Find all PDF files in the archive directory"""
        pdfs = []
        if not self.archive_dir.exists():
            self.logger.error(f"Archive directory does not exist: {self.archive_dir}")
            return pdfs

        # Recursively find all PDF files
        for pdf_file in self.archive_dir.rglob("*.pdf"):
            pdfs.append(pdf_file)

        self.logger.info(f"Found {len(pdfs)} PDF files in archive")
        return sorted(pdfs)

    def process_single_pdf(self, pdf_path: Path) -> ProcessingResult:
        """Process a single PDF file"""
        start_time = datetime.now()

        try:
            # Check if already processed
            existing_result = next(
                (r for r in self.processing_results if r.pdf_path == str(pdf_path)),
                None
            )
            if existing_result and existing_result.success:
                self.logger.debug(f"Skipping already processed: {pdf_path.name}")
                return existing_result

            # Create output filename
            output_filename = f"{pdf_path.stem}_matches.json"
            output_path = self.output_dir / "by_pdf" / output_filename
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Skip if output already exists and is not empty
            if output_path.exists() and output_path.stat().st_size > 0:
                try:
                    with open(output_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if data.get('matches'):
                            match_count = len(data['matches'])
                            processing_time = (datetime.now() - start_time).total_seconds()
                            return ProcessingResult(
                                pdf_path=str(pdf_path),
                                success=True,
                                match_count=match_count,
                                processing_time=processing_time,
                                output_file=str(output_path)
                            )
                except:
                    pass

            # Process the PDF
            self.logger.info(f"Processing {pdf_path.name}...")

            # Extract text and parse matches
            text_pages = self.pdf_processor.extract_text_from_pdf(str(pdf_path))
            match_objects = self.pdf_processor.parse_matches_from_text(text_pages)

            if match_objects:
                # Convert to dict format
                matches = []
                for match in match_objects:
                    match_dict = {
                        'home_team': match.home_team,
                        'away_team': match.away_team,
                        'match_date': match.date,
                        'match_time': match.time,
                        'competition': match.competition,
                        'venue': match.venue,
                        'odds': {
                            'winner': {
                                'home': match.home_win_odds,
                                'draw': match.draw_odds,
                                'away': match.away_win_odds
                            },
                            'total_goals': {
                                'over_25': match.over_25_odds,
                                'under_25': match.under_25_odds
                            },
                            'btts': {
                                'yes': match.btts_yes_odds,
                                'no': match.btts_no_odds
                            },
                            'corners': {
                                'over_85': getattr(match, 'corners_over_85_odds', None),
                                'under_85': getattr(match, 'corners_under_85_odds', None)
                            },
                            'cards': {
                                'over_35': getattr(match, 'cards_over_35_odds', None),
                                'under_35': getattr(match, 'cards_under_35_odds', None)
                            }
                        }
                    }
                    matches.append(match_dict)

            if matches:
                # Save to JSON
                output_data = {
                    'source_pdf': str(pdf_path),
                    'processing_date': datetime.now().isoformat(),
                    'match_count': len(matches),
                    'matches': matches
                }

                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(output_data, f, indent=2, ensure_ascii=False)

                processing_time = (datetime.now() - start_time).total_seconds()
                result = ProcessingResult(
                    pdf_path=str(pdf_path),
                    success=True,
                    match_count=len(matches),
                    processing_time=processing_time,
                    output_file=str(output_path)
                )

                self.logger.info(f"Successfully processed {pdf_path.name}: {len(matches)} matches in {processing_time:.1f}s")
                return result
            else:
                processing_time = (datetime.now() - start_time).total_seconds()
                result = ProcessingResult(
                    pdf_path=str(pdf_path),
                    success=False,
                    match_count=0,
                    error_message="No matches found",
                    processing_time=processing_time
                )

                self.logger.warning(f"No matches found in {pdf_path.name}")
                return result

        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            result = ProcessingResult(
                pdf_path=str(pdf_path),
                success=False,
                match_count=0,
                error_message=str(e),
                processing_time=processing_time
            )

            self.logger.error(f"Failed to process {pdf_path.name}: {e}")
            return result

    def process_all_pdfs(self, max_workers: int = None, batch_size: int = 100):
        """Process all PDFs with parallel processing"""
        if max_workers is None:
            max_workers = min(4, multiprocessing.cpu_count())

        # Find all PDFs
        all_pdfs = self.find_all_pdfs()
        if not all_pdfs:
            self.logger.error("No PDFs found to process")
            return

        # Filter out already successfully processed
        processed_paths = {r.pdf_path for r in self.processing_results if r.success}
        to_process = [pdf for pdf in all_pdfs if str(pdf) not in processed_paths]

        if not to_process:
            self.logger.info("All PDFs already processed!")
            return

        self.logger.info(f"Processing {len(to_process)} PDFs with {max_workers} workers...")

        # Process in batches
        for i in range(0, len(to_process), batch_size):
            batch = to_process[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(to_process) + batch_size - 1) // batch_size

            self.logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} PDFs)...")

            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(self.process_single_pdf, pdf) for pdf in batch]

                for future in concurrent.futures.as_completed(futures):
                    try:
                        result = future.result(timeout=300)  # 5 minute timeout
                        with self.results_lock:
                            # Update or add result
                            existing_idx = next(
                                (i for i, r in enumerate(self.processing_results) if r.pdf_path == result.pdf_path),
                                None
                            )
                            if existing_idx is not None:
                                self.processing_results[existing_idx] = result
                            else:
                                self.processing_results.append(result)
                    except Exception as e:
                        self.logger.error(f"Processing future failed: {e}")

            # Save progress after each batch
            self.save_results()
            self.logger.info(f"Batch {batch_num} completed")

        self.logger.info("All batches completed")

    def consolidate_matches(self) -> Dict:
        """Consolidate all extracted matches into unified datasets"""
        self.logger.info("Consolidating all extracted matches...")

        all_matches = []
        match_stats = {
            'total_matches': 0,
            'by_year': {},
            'by_league': {},
            'by_market': {},
            'date_range': {'earliest': None, 'latest': None}
        }

        # Load all match data
        by_pdf_dir = self.output_dir / "by_pdf"
        if by_pdf_dir.exists():
            for json_file in by_pdf_dir.glob("*.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        matches = data.get('matches', [])

                        for match in matches:
                            # Add source information
                            match['source_pdf'] = data.get('source_pdf', str(json_file))
                            match['processing_date'] = data.get('processing_date')
                            all_matches.append(match)

                            # Update statistics
                            match_stats['total_matches'] += 1

                            # By year
                            match_date = match.get('match_date', '')
                            if match_date:
                                year = match_date[:4]
                                match_stats['by_year'][year] = match_stats['by_year'].get(year, 0) + 1

                                # Date range
                                if not match_stats['date_range']['earliest'] or match_date < match_stats['date_range']['earliest']:
                                    match_stats['date_range']['earliest'] = match_date
                                if not match_stats['date_range']['latest'] or match_date > match_stats['date_range']['latest']:
                                    match_stats['date_range']['latest'] = match_date

                            # By league
                            league = match.get('league', 'Unknown')
                            match_stats['by_league'][league] = match_stats['by_league'].get(league, 0) + 1

                            # By market type
                            odds = match.get('odds', {})
                            for market in odds.keys():
                                match_stats['by_market'][market] = match_stats['by_market'].get(market, 0) + 1

                except Exception as e:
                    self.logger.error(f"Failed to load {json_file}: {e}")

        # Save consolidated data
        consolidated_file = self.output_dir / "all_matches.json"
        with open(consolidated_file, 'w', encoding='utf-8') as f:
            json.dump({
                'metadata': {
                    'total_matches': len(all_matches),
                    'consolidation_date': datetime.now().isoformat(),
                    'source_pdfs': len(list((self.output_dir / "by_pdf").glob("*.json")))
                },
                'statistics': match_stats,
                'matches': all_matches
            }, f, indent=2, ensure_ascii=False)

        # Create CSV for analysis
        if all_matches:
            df = pd.json_normalize(all_matches)
            csv_file = self.output_dir / "all_matches.csv"
            df.to_csv(csv_file, index=False, encoding='utf-8')
            self.logger.info(f"Saved {len(all_matches)} matches to CSV: {csv_file}")

        # Save statistics
        stats_file = self.output_dir / "match_statistics.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(match_stats, f, indent=2, ensure_ascii=False)

        self.logger.info(f"Consolidation complete: {len(all_matches)} total matches")
        return match_stats

    def generate_report(self) -> Dict:
        """Generate comprehensive processing report"""
        report = {
            'processing_summary': {
                'total_pdfs_found': len(self.find_all_pdfs()),
                'total_processed': len(self.processing_results),
                'successful': len([r for r in self.processing_results if r.success]),
                'failed': len([r for r in self.processing_results if not r.success]),
                'total_matches_extracted': sum(r.match_count for r in self.processing_results if r.success)
            },
            'performance': {
                'avg_processing_time': sum(r.processing_time or 0 for r in self.processing_results) / len(self.processing_results) if self.processing_results else 0,
                'total_processing_time': sum(r.processing_time or 0 for r in self.processing_results)
            },
            'errors': {
                'failed_pdfs': [r.pdf_path for r in self.processing_results if not r.success],
                'common_errors': {}
            },
            'output_files': {
                'consolidated_matches': str(self.output_dir / "all_matches.json"),
                'matches_csv': str(self.output_dir / "all_matches.csv"),
                'statistics': str(self.output_dir / "match_statistics.json"),
                'processing_results': str(self.results_file)
            }
        }

        # Count common errors
        error_counts = {}
        for result in self.processing_results:
            if not result.success and result.error_message:
                error_type = result.error_message.split(':')[0] if ':' in result.error_message else result.error_message
                error_counts[error_type] = error_counts.get(error_type, 0) + 1

        report['errors']['common_errors'] = dict(sorted(error_counts.items(), key=lambda x: x[1], reverse=True))

        return report

    def run_complete_process(self, max_workers: int = None, batch_size: int = 50):
        """Run the complete batch processing workflow"""
        self.logger.info("Starting complete SzerencseMix batch processing...")

        # Step 1: Process all PDFs
        self.logger.info("Step 1: Processing all PDFs...")
        self.process_all_pdfs(max_workers=max_workers, batch_size=batch_size)

        # Step 2: Consolidate matches
        self.logger.info("Step 2: Consolidating matches...")
        match_stats = self.consolidate_matches()

        # Step 3: Generate report
        self.logger.info("Step 3: Generating report...")
        report = self.generate_report()

        # Save final report
        report_file = self.output_dir / "batch_processing_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        # Print summary
        print("\n" + "="*60)
        print("BATCH PROCESSING SUMMARY")
        print("="*60)
        print(f"Total PDFs found: {report['processing_summary']['total_pdfs_found']}")
        print(f"Successfully processed: {report['processing_summary']['successful']}")
        print(f"Failed: {report['processing_summary']['failed']}")
        print(f"Total matches extracted: {report['processing_summary']['total_matches_extracted']:,}")
        print(f"Average processing time: {report['performance']['avg_processing_time']:.1f}s per PDF")
        print(f"Total processing time: {report['performance']['total_processing_time']/3600:.1f} hours")

        if match_stats:
            print("\nMatch Statistics:")
            print(f"  Date range: {match_stats['date_range']['earliest']} to {match_stats['date_range']['latest']}")
            print(f"  Years covered: {len(match_stats['by_year'])}")
            print(f"  Leagues: {len(match_stats['by_league'])}")
            print(f"  Market types: {len(match_stats['by_market'])}")

            print("\nTop leagues:")
            sorted_leagues = sorted(match_stats['by_league'].items(), key=lambda x: x[1], reverse=True)
            for league, count in sorted_leagues[:5]:
                print(f"    {league}: {count:,} matches")

        if report['errors']['common_errors']:
            print("\nCommon errors:")
            for error, count in list(report['errors']['common_errors'].items())[:3]:
                print(f"    {error}: {count} PDFs")

        print(f"\nOutput directory: {self.output_dir}")
        print("="*60)

        return report

def main():
    """Main function for command line usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Batch process SzerencseMix PDFs")
    parser.add_argument("--archive-dir", "-a", help="Directory containing downloaded PDFs")
    parser.add_argument("--output-dir", "-o", help="Output directory for processed data")
    parser.add_argument("--workers", "-w", type=int, help="Number of processing workers")
    parser.add_argument("--batch-size", "-b", type=int, default=50, help="Batch size for processing")
    parser.add_argument("--consolidate-only", action="store_true", help="Only consolidate existing results")

    args = parser.parse_args()

    # Create processor
    processor = SzerencseMixBatchProcessor(
        archive_dir=args.archive_dir,
        output_dir=args.output_dir
    )

    if args.consolidate_only:
        # Only consolidate existing data
        match_stats = processor.consolidate_matches()
        report = processor.generate_report()
        print(f"Consolidation complete: {report['processing_summary']['total_matches_extracted']:,} matches")
    else:
        # Run complete process
        report = processor.run_complete_process(
            max_workers=args.workers,
            batch_size=args.batch_size
        )

if __name__ == "__main__":
    main()
