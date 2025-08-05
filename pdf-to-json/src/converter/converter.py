"""
Main PDF to JSON Converter

This module provides the main converter class that orchestrates the entire
PDF to JSON conversion process.
"""

import logging
import time
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from tqdm import tqdm

from .pdf_parser import PDFParser
from .json_generator import JSONGenerator
from .schema_validator import SchemaValidator

logger = logging.getLogger(__name__)


class PDFToJSONConverter:
    """Main converter class that orchestrates PDF to JSON conversion."""
    
    def __init__(self, prefer_pdfplumber: bool = True):
        """
        Initialize the converter.
        
        Args:
            prefer_pdfplumber: If True, use pdfplumber as primary parser
        """
        self.pdf_parser = PDFParser(prefer_pdfplumber=prefer_pdfplumber)
        self.json_generator = JSONGenerator()
        self.schema_validator = SchemaValidator()
        
        logger.info("PDF to JSON Converter initialized")
    
    def convert_file(self, pdf_path: str, output_path: str, 
                    json_type: str = 'basic', 
                    config_path: Optional[str] = None,
                    validate_output: bool = True,
                    extract_tables: bool = False) -> Dict[str, Any]:
        """
        Convert a single PDF file to JSON.
        
        Args:
            pdf_path: Path to input PDF file
            output_path: Path to output JSON file
            json_type: Type of JSON output ('basic', 'detailed', 'minimal', 'structured')
            config_path: Path to structure configuration file (for structured JSON)
            validate_output: Whether to validate the output JSON
            extract_tables: Whether to extract tables from the PDF
            
        Returns:
            Dictionary containing conversion results and metadata
        """
        start_time = time.time()
        result = {
            'success': False,
            'input_file': pdf_path,
            'output_file': output_path,
            'json_type': json_type,
            'processing_time': 0,
            'errors': [],
            'warnings': [],
            'page_count': 0,
            'file_size': 0
        }
        
        try:
            logger.info(f"Starting conversion: {pdf_path} -> {output_path}")
            
            # Step 1: Extract text from PDF
            logger.info("Step 1: Extracting text from PDF")
            pdf_data = self.pdf_parser.extract_text(pdf_path)
            
            # Step 2: Extract tables if requested
            if extract_tables:
                logger.info("Step 2: Extracting tables from PDF")
                try:
                    tables = self.pdf_parser.extract_tables(pdf_path)
                    pdf_data['tables'] = tables
                    logger.info(f"Extracted {len(tables)} tables")
                except Exception as e:
                    logger.warning(f"Table extraction failed: {e}")
                    result['warnings'].append(f"Table extraction failed: {e}")
                    pdf_data['tables'] = []
            
            # Step 3: Generate JSON
            logger.info(f"Step 3: Generating {json_type} JSON")
            if json_type == 'basic':
                json_data = self.json_generator.generate_basic_json(pdf_data)
            elif json_type == 'detailed':
                json_data = self.json_generator.generate_detailed_json(pdf_data)
            elif json_type == 'minimal':
                json_data = self.json_generator.generate_minimal_json(pdf_data)
            elif json_type == 'structured':
                if config_path:
                    config = self.json_generator.load_structure_config(config_path)
                else:
                    config = self.json_generator._get_default_config()
                json_data = self.json_generator.generate_structured_json(pdf_data, config)
            else:
                raise ValueError(f"Unknown JSON type: {json_type}")
            
            # Step 4: Validate output if requested
            if validate_output:
                logger.info("Step 4: Validating JSON output")
                is_valid, validation_errors = self.schema_validator.validate_json(
                    json_data, json_type
                )
                
                if not is_valid:
                    result['errors'].extend(validation_errors)
                    logger.error(f"JSON validation failed: {validation_errors}")
                else:
                    logger.info("JSON validation passed")
            
            # Step 5: Save JSON file
            logger.info("Step 5: Saving JSON file")
            self.json_generator.save_json(json_data, output_path)
            
            # Calculate processing time and file size
            processing_time = time.time() - start_time
            file_size = Path(output_path).stat().st_size if Path(output_path).exists() else 0
            
            # Update result
            result.update({
                'success': True,
                'processing_time': processing_time,
                'file_size': file_size,
                'page_count': len(pdf_data.get('pages', [])),
                'parser_used': pdf_data.get('parser_used', 'unknown'),
                'total_words': len(pdf_data.get('text', '').split()),
                'total_characters': len(pdf_data.get('text', ''))
            })
            
            logger.info(f"Conversion completed successfully in {processing_time:.2f} seconds")
            
        except Exception as e:
            processing_time = time.time() - start_time
            result.update({
                'success': False,
                'processing_time': processing_time,
                'errors': [str(e)]
            })
            logger.error(f"Conversion failed: {e}")
        
        return result
    
    def convert_batch(self, pdf_files: List[str], output_dir: str,
                     json_type: str = 'basic',
                     config_path: Optional[str] = None,
                     validate_output: bool = True,
                     extract_tables: bool = False) -> Dict[str, Any]:
        """
        Convert multiple PDF files to JSON.
        
        Args:
            pdf_files: List of PDF file paths
            output_dir: Output directory for JSON files
            json_type: Type of JSON output
            config_path: Path to structure configuration file
            validate_output: Whether to validate output JSON
            extract_tables: Whether to extract tables
            
        Returns:
            Dictionary containing batch conversion results
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        batch_result = {
            'total_files': len(pdf_files),
            'successful_conversions': 0,
            'failed_conversions': 0,
            'total_processing_time': 0,
            'results': [],
            'errors': [],
            'warnings': []
        }
        
        logger.info(f"Starting batch conversion of {len(pdf_files)} files")
        
        for pdf_file in tqdm(pdf_files, desc="Converting PDFs"):
            try:
                # Generate output filename
                pdf_name = Path(pdf_file).stem
                output_file = output_dir / f"{pdf_name}.json"
                
                # Convert single file
                result = self.convert_file(
                    pdf_file, str(output_file), json_type, config_path,
                    validate_output, extract_tables
                )
                
                batch_result['results'].append(result)
                
                if result['success']:
                    batch_result['successful_conversions'] += 1
                else:
                    batch_result['failed_conversions'] += 1
                    batch_result['errors'].extend(result['errors'])
                
                batch_result['warnings'].extend(result['warnings'])
                batch_result['total_processing_time'] += result['processing_time']
                
            except Exception as e:
                batch_result['failed_conversions'] += 1
                batch_result['errors'].append(f"Error processing {pdf_file}: {e}")
                logger.error(f"Error processing {pdf_file}: {e}")
        
        logger.info(f"Batch conversion completed: {batch_result['successful_conversions']} "
                   f"successful, {batch_result['failed_conversions']} failed")
        
        return batch_result
    
    def get_conversion_options(self) -> Dict[str, Any]:
        """Get available conversion options."""
        return {
            'json_types': ['basic', 'detailed', 'minimal', 'structured'],
            'available_schemas': self.schema_validator.get_available_schemas(),
            'available_parsers': self.pdf_parser.available_libraries
        }
    
    def preview_pdf(self, pdf_path: str, max_pages: int = 3) -> Dict[str, Any]:
        """
        Generate a preview of PDF content without full conversion.
        
        Args:
            pdf_path: Path to PDF file
            max_pages: Maximum number of pages to preview
            
        Returns:
            Preview information
        """
        try:
            # Get page count
            total_pages = self.pdf_parser.get_page_count(pdf_path)
            
            # Extract text from first few pages
            pdf_data = self.pdf_parser.extract_text(pdf_path)
            pages = pdf_data.get('pages', [])[:max_pages]
            
            preview = {
                'total_pages': total_pages,
                'preview_pages': len(pages),
                'file_size': Path(pdf_path).stat().st_size,
                'metadata': pdf_data.get('metadata', {}),
                'parser_used': pdf_data.get('parser_used', 'unknown'),
                'page_previews': []
            }
            
            for page in pages:
                page_preview = {
                    'page_number': page.get('page_number'),
                    'text_preview': page.get('text', '')[:500] + "..." if len(page.get('text', '')) > 500 else page.get('text', ''),
                    'word_count': len(page.get('text', '').split()),
                    'character_count': len(page.get('text', ''))
                }
                preview['page_previews'].append(page_preview)
            
            return preview
            
        except Exception as e:
            logger.error(f"Error generating preview: {e}")
            return {
                'error': str(e),
                'total_pages': 0,
                'preview_pages': 0
            }
    
    def validate_json_file(self, json_path: str, schema_name: str = 'basic') -> Dict[str, Any]:
        """
        Validate an existing JSON file against a schema.
        
        Args:
            json_path: Path to JSON file
            schema_name: Schema name to validate against
            
        Returns:
            Validation results
        """
        try:
            import json
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            is_valid, errors = self.schema_validator.validate_json(json_data, schema_name)
            
            return {
                'file_path': json_path,
                'schema_name': schema_name,
                'is_valid': is_valid,
                'errors': errors,
                'file_size': Path(json_path).stat().st_size
            }
            
        except Exception as e:
            return {
                'file_path': json_path,
                'schema_name': schema_name,
                'is_valid': False,
                'errors': [str(e)],
                'file_size': 0
            } 