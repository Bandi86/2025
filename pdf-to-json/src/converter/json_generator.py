"""
JSON Generator Module

This module provides functionality to generate JSON output from PDF data
in various formats and structures.
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
from pathlib import Path
import re

logger = logging.getLogger(__name__)


class JSONGenerator:
    """Generate JSON output from PDF data in various formats."""
    
    def __init__(self):
        """Initialize the JSON generator."""
        pass
    
    def generate_basic_json(self, pdf_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate basic JSON structure from PDF data.
        
        Args:
            pdf_data: Dictionary containing PDF extraction results
            
        Returns:
            Basic JSON structure
        """
        return {
            'document_info': {
                'extraction_date': datetime.now().isoformat(),
                'parser_used': pdf_data.get('parser_used', 'unknown'),
                'total_pages': len(pdf_data.get('pages', [])),
                'metadata': pdf_data.get('metadata', {})
            },
            'content': {
                'full_text': pdf_data.get('text', ''),
                'pages': pdf_data.get('pages', [])
            }
        }
    
    def generate_structured_json(self, pdf_data: Dict[str, Any], 
                               structure_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured JSON based on configuration.
        
        Args:
            pdf_data: Dictionary containing PDF extraction results
            structure_config: Configuration for JSON structure
            
        Returns:
            Structured JSON output
        """
        result = {
            'document_info': {
                'extraction_date': datetime.now().isoformat(),
                'parser_used': pdf_data.get('parser_used', 'unknown'),
                'total_pages': len(pdf_data.get('pages', [])),
                'metadata': pdf_data.get('metadata', {})
            }
        }
        
        # Add configured sections
        for section_name, section_config in structure_config.items():
            if section_name == 'document_info':
                continue  # Skip, already handled
                
            if section_config.get('type') == 'text':
                result[section_name] = self._extract_text_section(
                    pdf_data, section_config
                )
            elif section_config.get('type') == 'tables':
                result[section_name] = self._extract_tables_section(
                    pdf_data, section_config
                )
            elif section_config.get('type') == 'headers':
                result[section_name] = self._extract_headers_section(
                    pdf_data, section_config
                )
            elif section_config.get('type') == 'custom':
                result[section_name] = self._extract_custom_section(
                    pdf_data, section_config
                )
        
        return result
    
    def _extract_text_section(self, pdf_data: Dict[str, Any], 
                             config: Dict[str, Any]) -> Dict[str, Any]:
        """Extract text section based on configuration."""
        text_data = {}
        
        if config.get('include_full_text', False):
            text_data['full_text'] = pdf_data.get('text', '')
        
        if config.get('include_pages', False):
            text_data['pages'] = pdf_data.get('pages', [])
        
        if config.get('include_page_summaries', False):
            text_data['page_summaries'] = self._generate_page_summaries(
                pdf_data.get('pages', [])
            )
        
        return text_data
    
    def _extract_tables_section(self, pdf_data: Dict[str, Any], 
                               config: Dict[str, Any]) -> Dict[str, Any]:
        """Extract tables section based on configuration."""
        tables_data = {}
        
        if 'tables' in pdf_data:
            tables_data['tables'] = pdf_data['tables']
        else:
            tables_data['tables'] = []
        
        if config.get('include_table_summaries', False):
            tables_data['table_summaries'] = self._generate_table_summaries(
                tables_data['tables']
            )
        
        return tables_data
    
    def _extract_headers_section(self, pdf_data: Dict[str, Any], 
                                config: Dict[str, Any]) -> Dict[str, Any]:
        """Extract headers section based on configuration."""
        headers_data = {}
        
        # Extract headers using regex patterns
        header_patterns = config.get('header_patterns', [])
        headers = []
        
        for page in pdf_data.get('pages', []):
            page_text = page.get('text', '')
            page_headers = self._extract_headers_from_text(
                page_text, header_patterns
            )
            
            for header in page_headers:
                headers.append({
                    'page_number': page.get('page_number'),
                    'header_text': header,
                    'position': 'unknown'  # Could be enhanced with position detection
                })
        
        headers_data['headers'] = headers
        return headers_data
    
    def _extract_custom_section(self, pdf_data: Dict[str, Any], 
                               config: Dict[str, Any]) -> Dict[str, Any]:
        """Extract custom section based on configuration."""
        custom_data = {}
        
        # Apply custom extraction rules
        extraction_rules = config.get('extraction_rules', [])
        
        for rule in extraction_rules:
            rule_name = rule.get('name', 'unnamed_rule')
            pattern = rule.get('pattern', '')
            target = rule.get('target', 'full_text')
            
            if target == 'full_text':
                text_to_search = pdf_data.get('text', '')
            elif target == 'pages':
                text_to_search = '\n'.join([
                    page.get('text', '') for page in pdf_data.get('pages', [])
                ])
            else:
                continue
            
            matches = re.findall(pattern, text_to_search, re.MULTILINE | re.IGNORECASE)
            custom_data[rule_name] = matches
        
        return custom_data
    
    def _generate_page_summaries(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate summaries for each page."""
        summaries = []
        
        for page in pages:
            text = page.get('text', '')
            
            # Simple summary: first 100 characters
            summary = text[:100] + "..." if len(text) > 100 else text
            
            # Count words
            word_count = len(text.split())
            
            # Count lines
            line_count = len(text.split('\n'))
            
            summaries.append({
                'page_number': page.get('page_number'),
                'summary': summary,
                'word_count': word_count,
                'line_count': line_count,
                'character_count': len(text)
            })
        
        return summaries
    
    def _generate_table_summaries(self, tables: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate summaries for each table."""
        summaries = []
        
        for table in tables:
            summary = {
                'page_number': table.get('page_number'),
                'table_number': table.get('table_number'),
                'rows': table.get('rows', 0),
                'columns': table.get('columns', 0),
                'data_preview': []
            }
            
            # Add preview of first few rows
            data = table.get('data', [])
            if data:
                summary['data_preview'] = data[:3]  # First 3 rows
            
            summaries.append(summary)
        
        return summaries
    
    def _extract_headers_from_text(self, text: str, 
                                  patterns: List[str]) -> List[str]:
        """Extract headers from text using regex patterns."""
        headers = []
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
            headers.extend(matches)
        
        return list(set(headers))  # Remove duplicates
    
    def generate_minimal_json(self, pdf_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate minimal JSON with essential information only.
        
        Args:
            pdf_data: Dictionary containing PDF extraction results
            
        Returns:
            Minimal JSON structure
        """
        return {
            'total_pages': len(pdf_data.get('pages', [])),
            'text': pdf_data.get('text', ''),
            'extraction_date': datetime.now().isoformat()
        }
    
    def generate_detailed_json(self, pdf_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate detailed JSON with comprehensive information.
        
        Args:
            pdf_data: Dictionary containing PDF extraction results
            
        Returns:
            Detailed JSON structure
        """
        pages = pdf_data.get('pages', [])
        
        # Analyze text statistics
        total_text = pdf_data.get('text', '')
        total_words = len(total_text.split())
        total_characters = len(total_text)
        
        # Extract common patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        phone_pattern = r'[\+]?[0-9\s\-\(\)]{7,}'
        url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?'
        
        emails = re.findall(email_pattern, total_text)
        phones = re.findall(phone_pattern, total_text)
        urls = re.findall(url_pattern, total_text)
        
        return {
            'document_info': {
                'extraction_date': datetime.now().isoformat(),
                'parser_used': pdf_data.get('parser_used', 'unknown'),
                'total_pages': len(pages),
                'metadata': pdf_data.get('metadata', {}),
                'statistics': {
                    'total_words': total_words,
                    'total_characters': total_characters,
                    'average_words_per_page': total_words / len(pages) if pages else 0,
                    'emails_found': len(emails),
                    'phones_found': len(phones),
                    'urls_found': len(urls)
                }
            },
            'content': {
                'full_text': total_text,
                'pages': pages,
                'extracted_data': {
                    'emails': list(set(emails)),
                    'phones': list(set(phones)),
                    'urls': list(set(urls))
                }
            },
            'tables': pdf_data.get('tables', [])
        }
    
    def save_json(self, data: Dict[str, Any], output_path: str, 
                  indent: int = 2, ensure_ascii: bool = False) -> None:
        """
        Save JSON data to file.
        
        Args:
            data: JSON data to save
            output_path: Path to output file
            indent: JSON indentation
            ensure_ascii: Whether to ensure ASCII encoding
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent, ensure_ascii=ensure_ascii)
        
        logger.info(f"JSON saved to: {output_path}")
    
    def load_structure_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load JSON structure configuration from file.
        
        Args:
            config_path: Path to configuration file
            
        Returns:
            Configuration dictionary
        """
        config_path = Path(config_path)
        
        if not config_path.exists():
            logger.warning(f"Config file not found: {config_path}")
            return self._get_default_config()
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        return config
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default JSON structure configuration."""
        return {
            'text': {
                'type': 'text',
                'include_full_text': True,
                'include_pages': True,
                'include_page_summaries': True
            },
            'tables': {
                'type': 'tables',
                'include_table_summaries': True
            },
            'headers': {
                'type': 'headers',
                'header_patterns': [
                    r'^[A-Z][A-Z\s]+$',  # ALL CAPS headers
                    r'^\d+\.\s+[A-Z][a-z]+',  # Numbered headers
                    r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$'  # Title case headers
                ]
            }
        } 