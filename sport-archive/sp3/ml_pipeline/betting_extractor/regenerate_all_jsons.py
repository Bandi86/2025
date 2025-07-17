#!/usr/bin/env python3
"""
Regenerate all JSON files from TXT sources using the current, correct extractor.
This should fix the July 7-10 date issue by replacing old JSON files with new ones.
"""

import os
import sys
import glob
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, '.')

from extract_matches import extract_matches_from_txt

def regenerate_all_jsons():
    """Regenerate all JSON files from TXT sources."""
    txt_dir = Path("txts")
    json_dir = Path("jsons/processed")

    # Find all TXT files
    txt_files = glob.glob(str(txt_dir / "*.txt"))

    print(f"Found {len(txt_files)} TXT files to process")

    processed_count = 0
    failed_count = 0

    for txt_file in txt_files:
        try:
            print(f"\nProcessing: {txt_file}")

            # Generate corresponding JSON filename
            txt_name = Path(txt_file).stem
            json_file = json_dir / f"{txt_name}.json"

            print(f"  -> Output: {json_file}")

            # Extract matches
            matches = extract_matches_from_txt(txt_file)

            if matches:
                print(f"  -> Extracted {len(matches)} matches")

                # Get date range from matches
                dates = [match.get('date') for match in matches if match.get('date')]
                if dates:
                    min_date = min(dates)
                    max_date = max(dates)
                    print(f"  -> Date range: {min_date} to {max_date}")

                processed_count += 1
            else:
                print(f"  -> No matches extracted")
                failed_count += 1

        except Exception as e:
            print(f"  -> ERROR: {e}")
            failed_count += 1

    print(f"\n=== SUMMARY ===")
    print(f"Processed successfully: {processed_count}")
    print(f"Failed: {failed_count}")
    print(f"Total: {len(txt_files)}")

    return processed_count, failed_count

if __name__ == "__main__":
    print("Regenerating all JSON files from TXT sources...")
    print("This will fix the July 7-10 date issue by replacing old JSON files.")
    print("=" * 60)

    processed, failed = regenerate_all_jsons()

    if failed == 0:
        print("\n✅ All JSON files regenerated successfully!")
    else:
        print(f"\n⚠️  {failed} files failed to process")
