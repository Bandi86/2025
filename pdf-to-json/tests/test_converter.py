"""
Unit tests for PDF to JSON Converter

Tests the main converter components and functionality.
"""

import unittest
import tempfile
import json
import os
from pathlib import Path
from unittest.mock import Mock, patch

# Add src to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from converter.converter import PDFToJSONConverter
from converter.pdf_parser import PDFParser
from converter.json_generator import JSONGenerator
from converter.schema_validator import SchemaValidator


class TestPDFParser(unittest.TestCase):
    """Test PDF parser functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.parser = PDFParser()
    
    def test_initialization(self):
        """Test parser initialization."""
        self.assertIsNotNone(self.parser)
        self.assertIsInstance(self.parser.available_libraries, list)
        self.assertGreater(len(self.parser.available_libraries), 0)
    
    def test_get_page_count_nonexistent_file(self):
        """Test page count for non-existent file."""
        with self.assertRaises(Exception):
            self.parser.get_page_count("nonexistent.pdf")
    
    @patch('converter.pdf_parser.pdfplumber')
    def test_extract_text_with_pdfplumber(self, mock_pdfplumber):
        """Test text extraction with pdfplumber."""
        # Mock pdfplumber response
        mock_page = Mock()
        mock_page.extract_text.return_value = "Test content"
        mock_page.width = 595
        mock_page.height = 842
        
        mock_pdf = Mock()
        mock_pdf.pages = [mock_page]
        mock_pdf.metadata = {"Title": "Test Document"}
        
        mock_pdfplumber.open.return_value.__enter__.return_value = mock_pdf
        
        # Create temporary PDF file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
            tmp_file.write(b'%PDF-1.4\nTest PDF content')
            tmp_pdf_path = tmp_file.name
        
        try:
            result = self.parser._extract_with_pdfplumber(Path(tmp_pdf_path))
            
            self.assertEqual(result['parser_used'], 'pdfplumber')
            self.assertIn('text', result)
            self.assertIn('pages', result)
            self.assertIn('metadata', result)
            self.assertEqual(len(result['pages']), 1)
            self.assertEqual(result['pages'][0]['text'], "Test content")
        
        finally:
            os.unlink(tmp_pdf_path)


class TestJSONGenerator(unittest.TestCase):
    """Test JSON generator functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.generator = JSONGenerator()
    
    def test_generate_basic_json(self):
        """Test basic JSON generation."""
        pdf_data = {
            'text': 'Test content',
            'pages': [{'page_number': 1, 'text': 'Test content'}],
            'metadata': {'Title': 'Test'},
            'parser_used': 'test'
        }
        
        result = self.generator.generate_basic_json(pdf_data)
        
        self.assertIn('document_info', result)
        self.assertIn('content', result)
        self.assertEqual(result['content']['full_text'], 'Test content')
        self.assertEqual(len(result['content']['pages']), 1)
    
    def test_generate_minimal_json(self):
        """Test minimal JSON generation."""
        pdf_data = {
            'text': 'Test content',
            'pages': [{'page_number': 1, 'text': 'Test content'}]
        }
        
        result = self.generator.generate_minimal_json(pdf_data)
        
        self.assertIn('total_pages', result)
        self.assertIn('text', result)
        self.assertIn('extraction_date', result)
        self.assertEqual(result['total_pages'], 1)
        self.assertEqual(result['text'], 'Test content')
    
    def test_save_json(self):
        """Test JSON file saving."""
        data = {'test': 'data'}
        
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        try:
            self.generator.save_json(data, output_path)
            
            # Verify file was created and contains correct data
            self.assertTrue(os.path.exists(output_path))
            
            with open(output_path, 'r') as f:
                saved_data = json.load(f)
            
            self.assertEqual(saved_data, data)
        
        finally:
            if os.path.exists(output_path):
                os.unlink(output_path)


class TestSchemaValidator(unittest.TestCase):
    """Test schema validator functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.validator = SchemaValidator()
    
    def test_initialization(self):
        """Test validator initialization."""
        self.assertIsNotNone(self.validator)
        self.assertIsInstance(self.validator.schemas, dict)
        self.assertGreater(len(self.validator.schemas), 0)
    
    def test_validate_json_basic_schema(self):
        """Test JSON validation with basic schema."""
        valid_data = {
            'document_info': {
                'extraction_date': '2023-01-01T00:00:00',
                'parser_used': 'test',
                'total_pages': 1,
                'metadata': {}
            },
            'content': {
                'full_text': 'Test content',
                'pages': [{'page_number': 1, 'text': 'Test content'}]
            }
        }
        
        is_valid, errors = self.validator.validate_json(valid_data, 'basic')
        self.assertTrue(is_valid)
        self.assertEqual(len(errors), 0)
    
    def test_validate_json_invalid_data(self):
        """Test JSON validation with invalid data."""
        invalid_data = {
            'document_info': {
                'extraction_date': '2023-01-01T00:00:00',
                'parser_used': 'test',
                'total_pages': -1,  # Invalid: negative page count
                'metadata': {}
            },
            'content': {
                'full_text': 'Test content',
                'pages': []
            }
        }
        
        is_valid, errors = self.validator.validate_json(invalid_data, 'basic')
        self.assertFalse(is_valid)
        self.assertGreater(len(errors), 0)
    
    def test_get_available_schemas(self):
        """Test getting available schemas."""
        schemas = self.validator.get_available_schemas()
        self.assertIsInstance(schemas, list)
        self.assertIn('basic', schemas)
        self.assertIn('detailed', schemas)
        self.assertIn('minimal', schemas)


class TestPDFToJSONConverter(unittest.TestCase):
    """Test main converter functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.converter = PDFToJSONConverter()
    
    def test_initialization(self):
        """Test converter initialization."""
        self.assertIsNotNone(self.converter)
        self.assertIsNotNone(self.converter.pdf_parser)
        self.assertIsNotNone(self.converter.json_generator)
        self.assertIsNotNone(self.converter.schema_validator)
    
    def test_get_conversion_options(self):
        """Test getting conversion options."""
        options = self.converter.get_conversion_options()
        
        self.assertIn('json_types', options)
        self.assertIn('available_schemas', options)
        self.assertIn('available_parsers', options)
        
        self.assertIsInstance(options['json_types'], list)
        self.assertIsInstance(options['available_schemas'], list)
        self.assertIsInstance(options['available_parsers'], list)
    
    @patch('converter.converter.PDFParser')
    def test_convert_file_success(self, mock_pdf_parser_class):
        """Test successful file conversion."""
        # Mock PDF parser
        mock_parser = Mock()
        mock_parser.extract_text.return_value = {
            'text': 'Test content',
            'pages': [{'page_number': 1, 'text': 'Test content'}],
            'metadata': {'Title': 'Test'},
            'parser_used': 'test'
        }
        mock_pdf_parser_class.return_value = mock_parser
        
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_pdf:
            tmp_pdf.write(b'%PDF-1.4\nTest PDF content')
            pdf_path = tmp_pdf.name
        
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_json:
            json_path = tmp_json.name
        
        try:
            # Test conversion
            result = self.converter.convert_file(pdf_path, json_path, 'basic')
            
            self.assertTrue(result['success'])
            self.assertEqual(result['json_type'], 'basic')
            self.assertGreater(result['processing_time'], 0)
            self.assertEqual(result['page_count'], 1)
            
            # Verify JSON file was created
            self.assertTrue(os.path.exists(json_path))
        
        finally:
            # Clean up
            if os.path.exists(pdf_path):
                os.unlink(pdf_path)
            if os.path.exists(json_path):
                os.unlink(json_path)
    
    def test_convert_file_nonexistent_input(self):
        """Test conversion with non-existent input file."""
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_json:
            json_path = tmp_json.name
        
        try:
            result = self.converter.convert_file('nonexistent.pdf', json_path, 'basic')
            
            self.assertFalse(result['success'])
            self.assertGreater(len(result['errors']), 0)
        
        finally:
            if os.path.exists(json_path):
                os.unlink(json_path)


if __name__ == '__main__':
    unittest.main() 