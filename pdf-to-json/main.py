#!/usr/bin/env python3
"""
PDF to JSON Converter - Command Line Interface

Main entry point for the PDF to JSON converter application.
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import List

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from converter.converter import PDFToJSONConverter
from converter.football_extractor import FootballExtractor


def setup_logging(verbose: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def main():
    """Main function for command line interface."""
    parser = argparse.ArgumentParser(
        description="Convert PDF files to JSON format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Convert a single PDF file
  python main.py --input document.pdf --output output.json

  # Convert with detailed JSON output
  python main.py --input document.pdf --output output.json --type detailed

  # Convert multiple files in batch
  python main.py --batch source/ --output jsons/ --type basic

  # Preview PDF content
  python main.py --preview document.pdf

  # Validate existing JSON file
  python main.py --validate output.json --schema basic

  # Extract football data from JSON
  python main.py --extract-football output.json --football-output football.json

  # Extract only main football matches
  python main.py --extract-football output.json --football-output main_matches.json --main-matches-only

  # Extract and merge games with additional markets
  python main.py --extract-football output.json --football-output merged_games.json --merge-games
        """
    )
    
    # Input/Output arguments
    parser.add_argument(
        '--input', '-i',
        type=str,
        help='Input PDF file path'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output JSON file path'
    )
    parser.add_argument(
        '--batch',
        type=str,
        help='Input directory for batch processing (processes all PDF files)'
    )
    
    # Conversion options
    parser.add_argument(
        '--type', '-t',
        type=str,
        choices=['basic', 'detailed', 'minimal', 'structured'],
        default='basic',
        help='JSON output type (default: basic)'
    )
    parser.add_argument(
        '--config',
        type=str,
        help='Path to structure configuration file (for structured JSON)'
    )
    parser.add_argument(
        '--extract-tables',
        action='store_true',
        help='Extract tables from PDF'
    )
    parser.add_argument(
        '--no-validate',
        action='store_true',
        help='Skip JSON validation'
    )
    
    # Utility options
    parser.add_argument(
        '--preview',
        type=str,
        help='Preview PDF content without conversion'
    )
    parser.add_argument(
        '--validate',
        type=str,
        help='Validate existing JSON file'
    )
    parser.add_argument(
        '--schema',
        type=str,
        default='basic',
        help='Schema to use for validation (default: basic)'
    )
    parser.add_argument(
        '--max-pages',
        type=int,
        default=3,
        help='Maximum pages for preview (default: 3)'
    )
    
    # General options
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose logging'
    )
    parser.add_argument(
        '--list-options',
        action='store_true',
        help='List available conversion options'
    )
    parser.add_argument(
        '--extract-football',
        type=str,
        help='Extract football data from existing JSON file'
    )
    parser.add_argument(
        '--football-output',
        type=str,
        help='Output file for extracted football data'
    )
    parser.add_argument(
        '--main-matches-only',
        action='store_true',
        help='Filter to show only main 1X2 matches (exclude special bet types)'
    )
    parser.add_argument(
        '--merge-games',
        action='store_true',
        help='Merge matches that belong to the same game and create additional_markets structure'
    )
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger(__name__)
    
    # Initialize converter
    try:
        converter = PDFToJSONConverter()
    except Exception as e:
        logger.error(f"Failed to initialize converter: {e}")
        sys.exit(1)
    
    # List options
    if args.list_options:
        options = converter.get_conversion_options()
        print("Available conversion options:")
        print(f"  JSON types: {', '.join(options['json_types'])}")
        print(f"  Available schemas: {', '.join(options['available_schemas'])}")
        print(f"  Available parsers: {', '.join(options['available_parsers'])}")
        return
    
    # Football extraction mode
    if args.extract_football:
        logger.info(f"Extracting football data from: {args.extract_football}")
        
        # Load JSON file
        try:
            with open(args.extract_football, 'r', encoding='utf-8') as f:
                json_content = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load JSON file: {e}")
            sys.exit(1)
        
        # Extract football data
        extractor = FootballExtractor()
        matches = extractor.extract_football_data(json_content)
        
        if not matches:
            print("❌ No football matches found in the JSON file")
            sys.exit(1)
        
        # Filter to main matches only if requested
        if args.main_matches_only:
            matches = extractor.filter_main_matches(matches)
            if not matches:
                print("❌ No main matches found after filtering")
                sys.exit(1)
        
        # Merge games if requested
        if args.merge_games:
            matches = extractor.merge_matches_by_game(matches)
            if not matches:
                print("❌ No games found after merging")
                sys.exit(1)
        
        # Print matches
        extractor.print_matches(matches)
        
        # Save to file if output specified
        if args.football_output:
            extractor.save_football_data(matches, args.football_output)
            print(f"\n✅ Football data saved to: {args.football_output}")
        
        return
    
    # Preview mode
    if args.preview:
        logger.info(f"Previewing PDF: {args.preview}")
        preview = converter.preview_pdf(args.preview, args.max_pages)
        
        if 'error' in preview:
            logger.error(f"Preview failed: {preview['error']}")
            sys.exit(1)
        
        print(f"\nPDF Preview: {args.preview}")
        print(f"Total pages: {preview['total_pages']}")
        print(f"File size: {preview['file_size']:,} bytes")
        print(f"Parser used: {preview['parser_used']}")
        
        if preview['metadata']:
            print(f"Metadata: {preview['metadata']}")
        
        print(f"\nPage previews (showing {preview['preview_pages']} pages):")
        for page in preview['page_previews']:
            print(f"\nPage {page['page_number']}:")
            print(f"  Words: {page['word_count']}")
            print(f"  Characters: {page['character_count']}")
            print(f"  Preview: {page['text_preview'][:200]}...")
        return
    
    # Validation mode
    if args.validate:
        logger.info(f"Validating JSON file: {args.validate}")
        validation_result = converter.validate_json_file(args.validate, args.schema)
        
        if validation_result['is_valid']:
            print(f"✅ JSON file is valid (schema: {args.schema})")
            print(f"File size: {validation_result['file_size']:,} bytes")
        else:
            print(f"❌ JSON file is invalid (schema: {args.schema})")
            print("Errors:")
            for error in validation_result['errors']:
                print(f"  - {error}")
            sys.exit(1)
        return
    
    # Batch processing
    if args.batch:
        if not args.output:
            logger.error("Output directory required for batch processing")
            sys.exit(1)
        
        batch_dir = Path(args.batch)
        if not batch_dir.exists():
            logger.error(f"Batch directory does not exist: {args.batch}")
            sys.exit(1)
        
        # Find all PDF files
        pdf_files = list(batch_dir.glob("*.pdf"))
        if not pdf_files:
            logger.error(f"No PDF files found in directory: {args.batch}")
            sys.exit(1)
        
        logger.info(f"Found {len(pdf_files)} PDF files for batch processing")
        
        # Convert batch
        batch_result = converter.convert_batch(
            [str(f) for f in pdf_files],
            args.output,
            args.type,
            args.config,
            not args.no_validate,
            args.extract_tables
        )
        
        # Display results
        print(f"\nBatch conversion completed:")
        print(f"  Total files: {batch_result['total_files']}")
        print(f"  Successful: {batch_result['successful_conversions']}")
        print(f"  Failed: {batch_result['failed_conversions']}")
        print(f"  Total time: {batch_result['total_processing_time']:.2f} seconds")
        
        if batch_result['errors']:
            print(f"\nErrors:")
            for error in batch_result['errors'][:5]:  # Show first 5 errors
                print(f"  - {error}")
            if len(batch_result['errors']) > 5:
                print(f"  ... and {len(batch_result['errors']) - 5} more errors")
        
        if batch_result['warnings']:
            print(f"\nWarnings:")
            for warning in batch_result['warnings'][:3]:  # Show first 3 warnings
                print(f"  - {warning}")
            if len(batch_result['warnings']) > 3:
                print(f"  ... and {len(batch_result['warnings']) - 3} more warnings")
        
        if batch_result['failed_conversions'] > 0:
            sys.exit(1)
        return
    
    # Single file conversion
    if not args.input or not args.output:
        logger.error("Both --input and --output are required for single file conversion")
        parser.print_help()
        sys.exit(1)
    
    # Convert single file
    logger.info(f"Converting: {args.input} -> {args.output}")
    result = converter.convert_file(
        args.input,
        args.output,
        args.type,
        args.config,
        not args.no_validate,
        args.extract_tables
    )
    
    # Display results
    if result['success']:
        print(f"\n✅ Conversion completed successfully!")
        print(f"  Input: {result['input_file']}")
        print(f"  Output: {result['output_file']}")
        print(f"  Type: {result['json_type']}")
        print(f"  Pages: {result['page_count']}")
        print(f"  Words: {result['total_words']:,}")
        print(f"  Characters: {result['total_characters']:,}")
        print(f"  File size: {result['file_size']:,} bytes")
        print(f"  Processing time: {result['processing_time']:.2f} seconds")
        print(f"  Parser used: {result['parser_used']}")
    else:
        print(f"\n❌ Conversion failed!")
        print(f"  Input: {result['input_file']}")
        print(f"  Processing time: {result['processing_time']:.2f} seconds")
        print(f"  Errors:")
        for error in result['errors']:
            print(f"    - {error}")
        sys.exit(1)
    
    if result['warnings']:
        print(f"\n⚠️  Warnings:")
        for warning in result['warnings']:
            print(f"  - {warning}")


if __name__ == "__main__":
    main() 