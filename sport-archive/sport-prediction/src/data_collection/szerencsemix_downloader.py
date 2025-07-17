#!/usr/bin/env python3
"""
SzerencseMix PDF Downloader and Processor

Automatically downloads all historical SzerencseMix PDFs from tippmix.hu
and organizes them by year/month for large-scale processing.
"""

import os
import re
import sys
import time
import json
import logging
import requests
from pathlib import Path
from urllib.parse import urljoin
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
import concurrent.futures
from threading import Lock

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

@dataclass
class PDFMetadata:
    """Metadata for a PDF file"""
    url: str
    filename: str
    date: str
    year: int
    month: int
    day: int
    type: str  # P (péntek), K (kedd), Sz (szombat), etc.
    issue_number: str
    local_path: Optional[str] = None
    downloaded: bool = False
    file_size: Optional[int] = None
    download_time: Optional[str] = None

class SzerencseMixDownloader:
    """Downloads and organizes all historical SzerencseMix PDFs"""

    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent.parent.parent / "data" / "szerencsemix_archive"
        self.base_dir.mkdir(parents=True, exist_ok=True)

        # Create organized structure
        self.organized_dir = self.base_dir / "organized"
        self.organized_dir.mkdir(exist_ok=True)

        # Statistics directory
        self.stats_dir = self.base_dir / "statistics"
        self.stats_dir.mkdir(exist_ok=True)

        # Setup logging
        self.setup_logging()

        # PDF tracking
        self.all_pdfs: List[PDFMetadata] = []
        self.downloaded_pdfs: List[PDFMetadata] = []
        self.failed_downloads: List[str] = []
        self.download_lock = Lock()

        # Progress tracking
        self.total_files = 0
        self.completed_files = 0

        # Load existing metadata if available
        self.metadata_file = self.base_dir / "metadata.json"
        self.load_existing_metadata()

    def setup_logging(self):
        """Setup logging configuration"""
        log_file = self.base_dir / "download.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def load_existing_metadata(self):
        """Load existing metadata to avoid re-downloading"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.all_pdfs = [PDFMetadata(**item) for item in data.get('all_pdfs', [])]
                    self.downloaded_pdfs = [PDFMetadata(**item) for item in data.get('downloaded_pdfs', [])]
                    self.failed_downloads = data.get('failed_downloads', [])
                self.logger.info(f"Loaded metadata for {len(self.all_pdfs)} PDFs ({len(self.downloaded_pdfs)} downloaded)")
            except Exception as e:
                self.logger.warning(f"Failed to load existing metadata: {e}")

    def save_metadata(self):
        """Save metadata to file"""
        try:
            data = {
                'all_pdfs': [asdict(pdf) for pdf in self.all_pdfs],
                'downloaded_pdfs': [asdict(pdf) for pdf in self.downloaded_pdfs],
                'failed_downloads': self.failed_downloads,
                'last_updated': datetime.now().isoformat(),
                'total_files': len(self.all_pdfs),
                'downloaded_files': len(self.downloaded_pdfs)
            }
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.error(f"Failed to save metadata: {e}")

    def extract_pdf_links_from_page(self) -> List[PDFMetadata]:
        """Extract all PDF links from the SzerencseMix page"""
        url = "https://www.tippmix.hu/szerencsemix"

        try:
            self.logger.info("Fetching SzerencseMix page...")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.text

            # Pattern to match PDF links
            pdf_pattern = r'<a[^>]+href="([^"]*\.pdf)"[^>]*>.*?(\d+)\.\s*\(([^)]+)\)</a>'

            # More comprehensive pattern for date extraction
            date_pattern = r'<a[^>]+href="([^"]*\.pdf)"[^>]*>\s*\[?(\d+)\.\s*\(([^)]+)\)\]?'

            pdfs = []
            matches = re.findall(pdf_pattern, content, re.IGNORECASE | re.DOTALL)

            # Also try the simpler pattern
            if not matches:
                matches = re.findall(r'href="([^"]*\.pdf)"', content)
                matches = [(match, '', '') for match in matches]

            self.logger.info(f"Found {len(matches)} PDF links")

            # Extract year/month context
            year_pattern = r'##\s*([A-záéíóöőúüű]+)\s*-\s*(\d{4})'
            year_matches = re.findall(year_pattern, content)

            current_year = 2025
            current_month = 1

            for url_path, day, day_type in matches:
                if not url_path.endswith('.pdf'):
                    continue

                # Make absolute URL
                full_url = urljoin("https://www.tippmix.hu/", url_path)

                # Extract filename
                filename = os.path.basename(url_path)

                # Try to extract date info from URL/filename
                date_info = self.extract_date_from_filename(filename)
                if date_info:
                    year, month, day_num, issue_type, issue_num = date_info
                else:
                    # Use context or default
                    year = current_year
                    month = current_month
                    day_num = int(day) if day.isdigit() else 1
                    issue_type = day_type[:1] if day_type else 'P'
                    issue_num = '001'

                pdf_meta = PDFMetadata(
                    url=full_url,
                    filename=filename,
                    date=f"{year}-{month:02d}-{day_num:02d}",
                    year=year,
                    month=month,
                    day=day_num,
                    type=issue_type,
                    issue_number=issue_num
                )

                pdfs.append(pdf_meta)

            # Sort by date (newest first)
            pdfs.sort(key=lambda x: (x.year, x.month, x.day), reverse=True)

            self.logger.info(f"Extracted {len(pdfs)} PDF metadata entries")
            return pdfs

        except Exception as e:
            self.logger.error(f"Failed to extract PDF links: {e}")
            return []

    def extract_date_from_filename(self, filename: str) -> Optional[Tuple[int, int, int, str, str]]:
        """Extract date information from filename"""
        # Patterns for different filename formats
        patterns = [
            r'Web__(\d+)sz__([PK])__(\d{2})-(\d{2})(?:-(\d+))?\.pdf',  # Web__51sz__P__06-27.pdf
            r'web_(\d+)sz__(\d{2})_(\d{2})_([^_]+)_szmix',  # web_51sz__06_27_penteki_szmix
            r'Szerencsemix_(\d{4})\.(\d{2})\.(\d{2})\.pdf',  # Szerencsemix_2019.05.31.pdf
        ]

        for pattern in patterns:
            match = re.search(pattern, filename, re.IGNORECASE)
            if match:
                groups = match.groups()

                if 'Szerencsemix_' in filename:
                    # Format: Szerencsemix_YYYY.MM.DD.pdf
                    year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                    return year, month, day, 'P', '001'

                elif 'Web__' in filename:
                    # Format: Web__51sz__P__06-27.pdf
                    issue_num, issue_type, month, day = groups[0], groups[1], int(groups[2]), int(groups[3])
                    # Try to infer year from issue number (this is approximate)
                    year = self.infer_year_from_issue(int(issue_num))
                    return year, month, day, issue_type, issue_num

                elif 'web_' in filename:
                    # Format: web_51sz__06_27_penteki_szmix
                    issue_num, month, day, day_type = groups[0], int(groups[1]), int(groups[2]), groups[3]
                    issue_type = 'P' if 'pent' in day_type else 'K' if 'kedd' in day_type else 'Sz'
                    year = self.infer_year_from_issue(int(issue_num))
                    return year, month, day, issue_type, issue_num

        return None

    def infer_year_from_issue(self, issue_num: int) -> int:
        """Infer year from issue number (approximate)"""
        # Rough estimate: ~100-105 issues per year
        current_year = 2025
        if issue_num <= 50:
            return current_year
        elif issue_num <= 100:
            return current_year - 1
        else:
            # Older issues
            return max(2019, current_year - (issue_num // 100) - 1)

    def create_directory_structure(self, pdf: PDFMetadata) -> Path:
        """Create logical directory structure for a PDF"""
        # Year/Month structure under organized directory
        year_dir = self.organized_dir / str(pdf.year)
        month_dir = year_dir / f"{pdf.month:02d}-{self.get_month_name(pdf.month)}"
        month_dir.mkdir(parents=True, exist_ok=True)

        # Create a README file for each month if it doesn't exist
        readme_path = month_dir / "README.md"
        if not readme_path.exists():
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(f"# SzerencseMix PDF Archive - {pdf.year}/{pdf.month:02d}\n\n")
                f.write(f"**Year:** {pdf.year}\n")
                f.write(f"**Month:** {self.get_month_name(pdf.month)} ({pdf.month:02d})\n")
                f.write(f"**Created:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                f.write("## Files in this directory:\n\n")

        return month_dir

    def get_month_name(self, month: int) -> str:
        """Get Hungarian month name"""
        months = {
            1: "Január", 2: "Február", 3: "Március", 4: "Április",
            5: "Május", 6: "Június", 7: "Július", 8: "Augusztus",
            9: "Szeptember", 10: "Október", 11: "November", 12: "December"
        }
        return months.get(month, f"Month-{month:02d}")

    def download_pdf(self, pdf: PDFMetadata) -> bool:
        """Download a single PDF file"""
        try:
            # Check if already downloaded
            if pdf.downloaded and pdf.local_path and Path(pdf.local_path).exists():
                return True

            # Create directory
            target_dir = self.create_directory_structure(pdf)
            target_path = target_dir / pdf.filename

            # Skip if file exists and is not empty
            if target_path.exists() and target_path.stat().st_size > 0:
                pdf.local_path = str(target_path)
                pdf.downloaded = True
                pdf.file_size = target_path.stat().st_size
                return True

            # Download the file
            self.logger.info(f"Downloading {pdf.filename}...")
            response = requests.get(pdf.url, timeout=60, stream=True)
            response.raise_for_status()

            # Save to file
            with open(target_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Update metadata
            pdf.local_path = str(target_path)
            pdf.downloaded = True
            pdf.file_size = target_path.stat().st_size
            pdf.download_time = datetime.now().isoformat()

            with self.download_lock:
                self.completed_files += 1
                if pdf not in self.downloaded_pdfs:
                    self.downloaded_pdfs.append(pdf)

            self.logger.info(f"Downloaded {pdf.filename} ({pdf.file_size:,} bytes) [{self.completed_files}/{self.total_files}]")
            return True

        except Exception as e:
            self.logger.error(f"Failed to download {pdf.filename}: {e}")
            with self.download_lock:
                if pdf.url not in self.failed_downloads:
                    self.failed_downloads.append(pdf.url)
            return False

    def download_all_pdfs(self, max_workers: int = 5, delay: float = 1.0):
        """Download all PDFs with parallel processing"""
        if not self.all_pdfs:
            self.logger.error("No PDFs found to download")
            return

        # Filter out already downloaded PDFs
        to_download = [pdf for pdf in self.all_pdfs if not pdf.downloaded]
        self.total_files = len(to_download)
        self.completed_files = 0

        if not to_download:
            self.logger.info("All PDFs already downloaded!")
            return

        self.logger.info(f"Starting download of {len(to_download)} PDFs with {max_workers} workers...")

        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []

            for pdf in to_download:
                future = executor.submit(self.download_pdf, pdf)
                futures.append((future, pdf))

                # Add delay between submissions to be respectful
                time.sleep(delay)

            # Wait for completion
            for future, pdf in futures:
                try:
                    future.result(timeout=120)  # 2 minute timeout per file
                except Exception as e:
                    self.logger.error(f"Download future failed for {pdf.filename}: {e}")

        # Save progress
        self.save_metadata()

        success_count = len(self.downloaded_pdfs)
        total_count = len(self.all_pdfs)
        self.logger.info(f"Download complete: {success_count}/{total_count} PDFs downloaded")

        if self.failed_downloads:
            self.logger.warning(f"Failed downloads: {len(self.failed_downloads)}")

    def generate_report(self) -> Dict:
        """Generate download report"""
        report = {
            'total_pdfs_found': len(self.all_pdfs),
            'total_downloaded': len(self.downloaded_pdfs),
            'failed_downloads': len(self.failed_downloads),
            'success_rate': len(self.downloaded_pdfs) / len(self.all_pdfs) * 100 if self.all_pdfs else 0,
            'date_range': {
                'earliest': min((pdf.date for pdf in self.all_pdfs), default='N/A'),
                'latest': max((pdf.date for pdf in self.all_pdfs), default='N/A')
            },
            'storage_info': {
                'base_directory': str(self.base_dir),
                'total_size_mb': sum(pdf.file_size or 0 for pdf in self.downloaded_pdfs) / (1024 * 1024)
            },
            'by_year': {}
        }

        # Group by year
        for pdf in self.downloaded_pdfs:
            year = str(pdf.year)
            if year not in report['by_year']:
                report['by_year'][year] = {'count': 0, 'size_mb': 0}
            report['by_year'][year]['count'] += 1
            report['by_year'][year]['size_mb'] += (pdf.file_size or 0) / (1024 * 1024)

        return report

    def run_full_process(self, max_workers: int = 3, delay: float = 2.0):
        """Run the complete download process"""
        self.logger.info("Starting SzerencseMix PDF download process...")

        # Step 1: Extract PDF links
        self.logger.info("Step 1: Extracting PDF links...")
        self.all_pdfs = self.extract_pdf_links_from_page()

        if not self.all_pdfs:
            self.logger.error("No PDFs found! Exiting.")
            return

        # Step 2: Download PDFs
        self.logger.info("Step 2: Downloading PDFs...")
        self.download_all_pdfs(max_workers=max_workers, delay=delay)

        # Step 3: Generate report
        self.logger.info("Step 3: Generating report...")
        report = self.generate_report()

        # Save report
        report_file = self.base_dir / "download_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        # Print summary
        print("\n" + "="*50)
        print("DOWNLOAD SUMMARY")
        print("="*50)
        print(f"Total PDFs found: {report['total_pdfs_found']}")
        print(f"Successfully downloaded: {report['total_downloaded']}")
        print(f"Failed downloads: {report['failed_downloads']}")
        print(f"Success rate: {report['success_rate']:.1f}%")
        print(f"Date range: {report['date_range']['earliest']} to {report['date_range']['latest']}")
        print(f"Total size: {report['storage_info']['total_size_mb']:.1f} MB")
        print(f"Storage location: {report['storage_info']['base_directory']}")
        print("\nBy year:")
        for year, info in sorted(report['by_year'].items()):
            print(f"  {year}: {info['count']} PDFs, {info['size_mb']:.1f} MB")
        print("="*50)

        return report

    def start_bulk_download(self):
        """Start the complete bulk download process with organized structure"""
        print("\n🚀 SZERENCSEMIX BULK DOWNLOAD STARTING")
        print("=" * 80)

        start_time = datetime.now()

        # Step 1: Extract all PDF links
        print("📥 Step 1: Extracting PDF links from website...")
        self.all_pdfs = self.extract_pdf_links_from_page()

        if not self.all_pdfs:
            print("❌ No PDFs found on website!")
            return

        print(f"✅ Found {len(self.all_pdfs)} PDFs")

        # Step 2: Analyze by year
        year_stats = {}
        for pdf in self.all_pdfs:
            year = pdf.year
            if year not in year_stats:
                year_stats[year] = 0
            year_stats[year] += 1

        print(f"\n📊 Distribution by year:")
        for year in sorted(year_stats.keys(), reverse=True):
            print(f"   {year}: {year_stats[year]} PDFs")

        # Step 3: Calculate storage requirements
        estimated_size_gb = len(self.all_pdfs) * 8.5 / 1024  # ~8.5MB per PDF average
        print(f"\n💾 Estimated total size: ~{estimated_size_gb:.1f} GB")
        print(f"📁 Download directory: {self.organized_dir}")

        # Step 4: Start download
        print(f"\n⬇️ Step 2: Starting parallel download...")
        print(f"   Max workers: 3 (respectful to server)")
        print(f"   Delay between requests: 2 seconds")
        print(f"   Timeout per file: 2 minutes")

        # Use conservative settings for bulk download
        self.download_all_pdfs(max_workers=3, delay=2.0)

        # Step 5: Final statistics
        end_time = datetime.now()
        duration = end_time - start_time

        print(f"\n📊 DOWNLOAD COMPLETED!")
        print("=" * 50)
        print(f"⏱️  Total time: {duration}")
        print(f"✅ Successfully downloaded: {len(self.downloaded_pdfs)}")
        print(f"❌ Failed downloads: {len(self.failed_downloads)}")
        print(f"📁 Files organized in: {self.organized_dir}")

        # Save final metadata
        self.save_metadata()
        self.create_download_summary()

    def create_download_summary(self):
        """Create a comprehensive download summary"""
        summary_file = self.base_dir / "download_summary.md"

        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write("# SzerencseMix PDF Archive Download Summary\n\n")
            f.write(f"**Download Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"**Total PDFs Found:** {len(self.all_pdfs)}\n")
            f.write(f"**Successfully Downloaded:** {len(self.downloaded_pdfs)}\n")
            f.write(f"**Failed Downloads:** {len(self.failed_downloads)}\n\n")

            # Year breakdown
            year_stats = {}
            year_downloaded = {}
            for pdf in self.all_pdfs:
                year = pdf.year
                if year not in year_stats:
                    year_stats[year] = 0
                    year_downloaded[year] = 0
                year_stats[year] += 1
                if pdf.downloaded:
                    year_downloaded[year] += 1

            f.write("## Distribution by Year\n\n")
            f.write("| Year | Total PDFs | Downloaded | Success Rate |\n")
            f.write("|------|------------|------------|-------------|\n")

            total_size = 0
            for year in sorted(year_stats.keys(), reverse=True):
                success_rate = (year_downloaded[year] / year_stats[year] * 100) if year_stats[year] > 0 else 0
                f.write(f"| {year} | {year_stats[year]} | {year_downloaded[year]} | {success_rate:.1f}% |\n")

            # Calculate total size
            for pdf in self.downloaded_pdfs:
                if pdf.file_size:
                    total_size += pdf.file_size

            f.write(f"\n**Total Download Size:** {total_size / (1024**3):.2f} GB\n")

            # Directory structure
            f.write("\n## Directory Structure\n\n")
            f.write("```\n")
            f.write("szerencsemix_archive/\n")
            f.write("├── organized/\n")
            for year in sorted(year_stats.keys(), reverse=True):
                f.write(f"│   ├── {year}/\n")
                # Show months for this year
                months = set()
                for pdf in self.all_pdfs:
                    if pdf.year == year and pdf.downloaded:
                        months.add(pdf.month)
                for month in sorted(months):
                    month_name = self.get_month_name(month)
                    f.write(f"│   │   ├── {month:02d}-{month_name}/\n")

            f.write("├── metadata.json\n")
            f.write("├── download.log\n")
            f.write("└── download_summary.md\n")
            f.write("```\n")

            if self.failed_downloads:
                f.write("\n## Failed Downloads\n\n")
                for url in self.failed_downloads:
                    f.write(f"- {url}\n")

        print(f"📄 Download summary saved to: {summary_file}")

def main():
    """Main function for command line usage"""
    import argparse

    parser = argparse.ArgumentParser(description="Download all SzerencseMix PDFs")
    parser.add_argument("--output-dir", "-o", help="Output directory for PDFs")
    parser.add_argument("--workers", "-w", type=int, default=3, help="Number of download workers")
    parser.add_argument("--delay", "-d", type=float, default=2.0, help="Delay between downloads (seconds)")
    parser.add_argument("--extract-only", action="store_true", help="Only extract links, don't download")

    args = parser.parse_args()

    # Create downloader
    downloader = SzerencseMixDownloader(base_dir=args.output_dir)

    if args.extract_only:
        # Only extract links
        pdfs = downloader.extract_pdf_links_from_page()
        print(f"Found {len(pdfs)} PDFs")
        for pdf in pdfs[:10]:  # Show first 10
            print(f"  {pdf.date} - {pdf.filename}")
        if len(pdfs) > 10:
            print(f"  ... and {len(pdfs) - 10} more")
    else:
        # Run full process
        report = downloader.run_full_process(
            max_workers=args.workers,
            delay=args.delay
        )

if __name__ == "__main__":
    main()
