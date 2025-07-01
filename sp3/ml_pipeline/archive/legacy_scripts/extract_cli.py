#!/usr/bin/env python3
"""
🚀 FOOTBALL EXTRACTOR CLI WRAPPER

Command line wrapper for the advanced football extractor.
Supports various output formats and command line arguments.
"""

import argparse
import sys
import os
import json
from pathlib import Path

# Add the current directory to the Python path to import the extractor
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from advanced_football_extractor import AdvancedFootballExtractor, MatchResult, TeamStats, UpcomingMatch
from dataclasses import asdict

def export_to_json(extractor: AdvancedFootballExtractor, output_path: str, extract_mode: str = 'all'):
    """Export extracted data to JSON format"""
    data = {}

    if extract_mode in ['all', 'matches'] and extractor.match_results:
        data['matches'] = [asdict(match) for match in extractor.match_results]

    if extract_mode in ['all', 'stats'] and extractor.team_stats:
        data['team_stats'] = [asdict(stat) for stat in extractor.team_stats]

    if extract_mode in ['all', 'upcoming'] and extractor.upcoming_matches:
        data['upcoming_matches'] = [asdict(match) for match in extractor.upcoming_matches]

    # If only matches are requested, return the matches array directly
    if extract_mode == 'matches' and 'matches' in data:
        output_data = data['matches']
    else:
        output_data = data

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    return output_data

def main():
    parser = argparse.ArgumentParser(
        description='Advanced Football Extractor CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        '--pdf-path',
        required=True,
        help='Path to the PDF file to extract data from'
    )

    parser.add_argument(
        '--output-json',
        help='Output JSON file path'
    )

    parser.add_argument(
        '--extract-mode',
        choices=['all', 'matches', 'stats', 'upcoming'],
        default='matches',
        help='What type of data to extract (default: matches)'
    )

    parser.add_argument(
        '--confidence-threshold',
        type=float,
        default=0.7,
        help='Confidence threshold for extraction (default: 0.7)'
    )

    parser.add_argument(
        '--season',
        default='2024/25',
        help='Season to assign to extracted data (default: 2024/25)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    # Validate PDF file exists
    if not os.path.exists(args.pdf_path):
        print(f"Error: PDF file not found: {args.pdf_path}", file=sys.stderr)
        sys.exit(1)

    if args.verbose:
        print(f"🚀 Processing PDF: {args.pdf_path}")
        print(f"📊 Extract mode: {args.extract_mode}")
        print(f"🎯 Confidence threshold: {args.confidence_threshold}")
        print(f"📅 Season: {args.season}")

    try:
        # Initialize extractor
        extractor = AdvancedFootballExtractor()

        # Update season for extracted data
        extractor.current_season = args.season

        # Extract data from PDF
        success = extractor.extract_comprehensive_data(args.pdf_path)

        if not success:
            print(f"Error: Failed to extract data from PDF: {args.pdf_path}", file=sys.stderr)
            sys.exit(1)

        if args.verbose:
            print(f"✅ Extraction successful!")
            print(f"📈 Found {len(extractor.match_results)} matches")
            print(f"📊 Found {len(extractor.team_stats)} team stats")
            print(f"🔮 Found {len(extractor.upcoming_matches)} upcoming matches")

        # Export to JSON if requested
        if args.output_json:
            output_data = export_to_json(extractor, args.output_json, args.extract_mode)
            if args.verbose:
                print(f"💾 Data exported to: {args.output_json}")
        else:
            # Print to stdout if no output file specified
            if args.extract_mode == 'matches':
                output_data = [asdict(match) for match in extractor.match_results]
            elif args.extract_mode == 'stats':
                output_data = [asdict(stat) for stat in extractor.team_stats]
            elif args.extract_mode == 'upcoming':
                output_data = [asdict(match) for match in extractor.upcoming_matches]
            else:  # all
                output_data = {
                    'matches': [asdict(match) for match in extractor.match_results],
                    'team_stats': [asdict(stat) for stat in extractor.team_stats],
                    'upcoming_matches': [asdict(match) for match in extractor.upcoming_matches]
                }

            print(json.dumps(output_data, ensure_ascii=False, indent=2))

        if args.verbose:
            print("✅ Processing completed successfully!")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
