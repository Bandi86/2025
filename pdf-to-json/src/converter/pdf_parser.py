"""
PDF Parser Module

This module provides functionality to extract text and metadata from PDF files.
It uses multiple PDF libraries to ensure maximum compatibility and extraction quality.
"""

import os
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

logger = logging.getLogger(__name__)


class PDFParser:
    """PDF parser that can extract text and metadata using multiple libraries."""
    
    def __init__(self, prefer_pdfplumber: bool = True):
        """
        Initialize the PDF parser.
        
        Args:
            prefer_pdfplumber: If True, use pdfplumber as primary parser
        """
        self.prefer_pdfplumber = prefer_pdfplumber
        self._check_dependencies()
    
    def _check_dependencies(self):
        """Check which PDF libraries are available."""
        self.available_libraries = []
        
        if pdfplumber:
            self.available_libraries.append('pdfplumber')
        if fitz:
            self.available_libraries.append('pymupdf')
        if PyPDF2:
            self.available_libraries.append('pypdf2')
        
        if not self.available_libraries:
            raise ImportError("No PDF parsing libraries found. Please install pdfplumber, PyMuPDF, or PyPDF2.")
        
        logger.info(f"Available PDF libraries: {self.available_libraries}")
    
    def extract_text(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract text and metadata from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Dictionary containing extracted text, metadata, and page information
        """
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        logger.info(f"Extracting text from: {pdf_path}")
        
        # Try different parsers in order of preference
        parsers = []
        
        if self.prefer_pdfplumber and pdfplumber:
            parsers.append(self._extract_with_pdfplumber)
        
        if fitz:
            parsers.append(self._extract_with_pymupdf)
        
        if PyPDF2:
            parsers.append(self._extract_with_pypdf2)
        
        if not self.prefer_pdfplumber and pdfplumber:
            parsers.append(self._extract_with_pdfplumber)
        
        # Try each parser until one succeeds
        for parser in parsers:
            try:
                result = parser(pdf_path)
                if result and result.get('text'):
                    logger.info(f"Successfully extracted text using {parser.__name__}")
                    return result
            except Exception as e:
                logger.warning(f"Parser {parser.__name__} failed: {e}")
                continue
        
        raise Exception("All PDF parsers failed to extract text")
    
    def _extract_with_pdfplumber(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract text using pdfplumber."""
        result = {
            'text': '',
            'pages': [],
            'metadata': {},
            'parser_used': 'pdfplumber'
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            # Extract metadata
            result['metadata'] = pdf.metadata or {}
            
            # Extract text from each page
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text() or ""
                
                page_info = {
                    'page_number': page_num,
                    'text': page_text,
                    'width': page.width,
                    'height': page.height
                }
                
                result['pages'].append(page_info)
                result['text'] += f"\n--- Page {page_num} ---\n{page_text}"
        
        return result
    
    def _extract_with_pymupdf(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract text using PyMuPDF (fitz)."""
        result = {
            'text': '',
            'pages': [],
            'metadata': {},
            'parser_used': 'pymupdf'
        }
        
        doc = fitz.open(pdf_path)
        
        # Extract metadata
        result['metadata'] = doc.metadata
        
        # Extract text from each page
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()
            
            page_info = {
                'page_number': page_num + 1,
                'text': page_text,
                'width': page.rect.width,
                'height': page.rect.height
            }
            
            result['pages'].append(page_info)
            result['text'] += f"\n--- Page {page_num + 1} ---\n{page_text}"
        
        doc.close()
        return result
    
    def _extract_with_pypdf2(self, pdf_path: Path) -> Dict[str, Any]:
        """Extract text using PyPDF2."""
        result = {
            'text': '',
            'pages': [],
            'metadata': {},
            'parser_used': 'pypdf2'
        }
        
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            
            # Extract metadata
            if reader.metadata:
                result['metadata'] = {
                    k: v for k, v in reader.metadata.items() 
                    if v is not None
                }
            
            # Extract text from each page
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text() or ""
                
                page_info = {
                    'page_number': page_num,
                    'text': page_text,
                    'width': page.mediabox.width if page.mediabox else None,
                    'height': page.mediabox.height if page.mediabox else None
                }
                
                result['pages'].append(page_info)
                result['text'] += f"\n--- Page {page_num} ---\n{page_text}"
        
        return result
    
    def get_page_count(self, pdf_path: str) -> int:
        """Get the number of pages in a PDF file."""
        pdf_path = Path(pdf_path)
        
        if fitz:
            try:
                doc = fitz.open(pdf_path)
                count = len(doc)
                doc.close()
                return count
            except Exception:
                pass
        
        if pdfplumber:
            try:
                with pdfplumber.open(pdf_path) as pdf:
                    return len(pdf.pages)
            except Exception:
                pass
        
        if PyPDF2:
            try:
                with open(pdf_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    return len(reader.pages)
            except Exception:
                pass
        
        raise Exception("Could not determine page count with any available parser")
    
    def extract_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract tables from PDF using pdfplumber.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of extracted tables
        """
        if not pdfplumber:
            raise ImportError("pdfplumber is required for table extraction")
        
        tables = []
        pdf_path = Path(pdf_path)
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                page_tables = page.extract_tables()
                
                for table_num, table in enumerate(page_tables, 1):
                    table_info = {
                        'page_number': page_num,
                        'table_number': table_num,
                        'data': table,
                        'rows': len(table),
                        'columns': len(table[0]) if table else 0
                    }
                    tables.append(table_info)
        
        return tables 