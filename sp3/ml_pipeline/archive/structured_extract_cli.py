#!/usr/bin/env python3
"""
CLI wrapper for the STRUCTURED BETTING EXTRACTOR
Extracts structured football matches and grouped betting markets from PDF.
"""
import argparse
import sys
import os
import json
from structured_betting_extractor import StructuredBettingExtractor

def main():
    parser = argparse.ArgumentParser(description='Structured Betting Extractor CLI')
    parser.add_argument('--pdf-path', required=True, help='Path to the PDF file to extract data from')
    parser.add_argument('--output-json', required=True, help='Output JSON file path')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    args = parser.parse_args()

    if not os.path.exists(args.pdf_path):
        print(f"Error: PDF file not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    extractor = StructuredBettingExtractor()
    matches = extractor.extract_from_pdf(args.pdf_path)

    with open(args.output_json, 'w', encoding='utf-8') as f:
        json.dump(matches, f, ensure_ascii=False, indent=2)

    if args.verbose:
        print(f"✅ {len(matches)} matches extracted and saved to {args.output_json}")
        if matches:
            print(json.dumps(matches[0], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
