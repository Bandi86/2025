"""
Schema Validator Module

This module provides functionality to validate JSON output against predefined schemas.
"""

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from jsonschema import validate, ValidationError, SchemaError

logger = logging.getLogger(__name__)


class SchemaValidator:
    """Validate JSON output against predefined schemas."""
    
    def __init__(self):
        """Initialize the schema validator."""
        self.schemas = {}
        self._load_default_schemas()
    
    def _load_default_schemas(self):
        """Load default schemas."""
        self.schemas = {
            'basic': self._get_basic_schema(),
            'detailed': self._get_detailed_schema(),
            'minimal': self._get_minimal_schema(),
            'structured': self._get_structured_schema()
        }
    
    def validate_json(self, data: Dict[str, Any], schema_name: str = 'basic') -> Tuple[bool, List[str]]:
        """
        Validate JSON data against a schema.
        
        Args:
            data: JSON data to validate
            schema_name: Name of the schema to use
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        if schema_name not in self.schemas:
            return False, [f"Schema '{schema_name}' not found"]
        
        schema = self.schemas[schema_name]
        errors = []
        
        try:
            validate(instance=data, schema=schema)
            return True, []
        except ValidationError as e:
            errors.append(f"Validation error: {e.message}")
        except SchemaError as e:
            errors.append(f"Schema error: {e.message}")
        except Exception as e:
            errors.append(f"Unexpected error: {str(e)}")
        
        return False, errors
    
    def load_custom_schema(self, schema_path: str, schema_name: str) -> bool:
        """
        Load a custom schema from file.
        
        Args:
            schema_path: Path to schema file
            schema_name: Name to assign to the schema
            
        Returns:
            True if successful, False otherwise
        """
        schema_path = Path(schema_path)
        
        if not schema_path.exists():
            logger.error(f"Schema file not found: {schema_path}")
            return False
        
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema = json.load(f)
            
            # Validate the schema itself
            self._validate_schema_structure(schema)
            
            self.schemas[schema_name] = schema
            logger.info(f"Custom schema '{schema_name}' loaded from {schema_path}")
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in schema file: {e}")
            return False
        except Exception as e:
            logger.error(f"Error loading schema: {e}")
            return False
    
    def _validate_schema_structure(self, schema: Dict[str, Any]) -> bool:
        """
        Validate that a schema has the correct structure.
        
        Args:
            schema: Schema to validate
            
        Returns:
            True if valid, raises exception otherwise
        """
        required_keys = ['type', 'properties']
        
        if not isinstance(schema, dict):
            raise ValueError("Schema must be a dictionary")
        
        if 'type' not in schema:
            raise ValueError("Schema must have a 'type' field")
        
        if schema['type'] != 'object':
            raise ValueError("Schema type must be 'object'")
        
        if 'properties' not in schema:
            raise ValueError("Schema must have a 'properties' field")
        
        return True
    
    def get_available_schemas(self) -> List[str]:
        """Get list of available schema names."""
        return list(self.schemas.keys())
    
    def get_schema(self, schema_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific schema by name."""
        return self.schemas.get(schema_name)
    
    def _get_basic_schema(self) -> Dict[str, Any]:
        """Get basic JSON schema."""
        return {
            "type": "object",
            "properties": {
                "document_info": {
                    "type": "object",
                    "properties": {
                        "extraction_date": {"type": "string"},
                        "parser_used": {"type": "string"},
                        "total_pages": {"type": "integer", "minimum": 0},
                        "metadata": {"type": "object"}
                    },
                    "required": ["extraction_date", "parser_used", "total_pages", "metadata"]
                },
                "content": {
                    "type": "object",
                    "properties": {
                        "full_text": {"type": "string"},
                        "pages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "page_number": {"type": "integer"},
                                    "text": {"type": "string"},
                                    "width": {"type": ["number", "null"]},
                                    "height": {"type": ["number", "null"]}
                                },
                                "required": ["page_number", "text"]
                            }
                        }
                    },
                    "required": ["full_text", "pages"]
                }
            },
            "required": ["document_info", "content"]
        }
    
    def _get_detailed_schema(self) -> Dict[str, Any]:
        """Get detailed JSON schema."""
        return {
            "type": "object",
            "properties": {
                "document_info": {
                    "type": "object",
                    "properties": {
                        "extraction_date": {"type": "string"},
                        "parser_used": {"type": "string"},
                        "total_pages": {"type": "integer", "minimum": 0},
                        "metadata": {"type": "object"},
                        "statistics": {
                            "type": "object",
                            "properties": {
                                "total_words": {"type": "integer", "minimum": 0},
                                "total_characters": {"type": "integer", "minimum": 0},
                                "average_words_per_page": {"type": "number", "minimum": 0},
                                "emails_found": {"type": "integer", "minimum": 0},
                                "phones_found": {"type": "integer", "minimum": 0},
                                "urls_found": {"type": "integer", "minimum": 0}
                            },
                            "required": ["total_words", "total_characters", "average_words_per_page"]
                        }
                    },
                    "required": ["extraction_date", "parser_used", "total_pages", "metadata", "statistics"]
                },
                "content": {
                    "type": "object",
                    "properties": {
                        "full_text": {"type": "string"},
                        "pages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "page_number": {"type": "integer"},
                                    "text": {"type": "string"},
                                    "width": {"type": ["number", "null"]},
                                    "height": {"type": ["number", "null"]}
                                },
                                "required": ["page_number", "text"]
                            }
                        },
                        "extracted_data": {
                            "type": "object",
                            "properties": {
                                "emails": {"type": "array", "items": {"type": "string"}},
                                "phones": {"type": "array", "items": {"type": "string"}},
                                "urls": {"type": "array", "items": {"type": "string"}}
                            }
                        }
                    },
                    "required": ["full_text", "pages", "extracted_data"]
                },
                "tables": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "page_number": {"type": "integer"},
                            "table_number": {"type": "integer"},
                            "data": {"type": "array"},
                            "rows": {"type": "integer"},
                            "columns": {"type": "integer"}
                        },
                        "required": ["page_number", "table_number", "data", "rows", "columns"]
                    }
                }
            },
            "required": ["document_info", "content", "tables"]
        }
    
    def _get_minimal_schema(self) -> Dict[str, Any]:
        """Get minimal JSON schema."""
        return {
            "type": "object",
            "properties": {
                "total_pages": {"type": "integer", "minimum": 0},
                "text": {"type": "string"},
                "extraction_date": {"type": "string"}
            },
            "required": ["total_pages", "text", "extraction_date"]
        }
    
    def _get_structured_schema(self) -> Dict[str, Any]:
        """Get structured JSON schema."""
        return {
            "type": "object",
            "properties": {
                "document_info": {
                    "type": "object",
                    "properties": {
                        "extraction_date": {"type": "string"},
                        "parser_used": {"type": "string"},
                        "total_pages": {"type": "integer", "minimum": 0},
                        "metadata": {"type": "object"}
                    },
                    "required": ["extraction_date", "parser_used", "total_pages", "metadata"]
                },
                "text": {
                    "type": "object",
                    "properties": {
                        "full_text": {"type": "string"},
                        "pages": {"type": "array"},
                        "page_summaries": {"type": "array"}
                    }
                },
                "tables": {
                    "type": "object",
                    "properties": {
                        "tables": {"type": "array"},
                        "table_summaries": {"type": "array"}
                    }
                },
                "headers": {
                    "type": "object",
                    "properties": {
                        "headers": {"type": "array"}
                    }
                }
            },
            "required": ["document_info"]
        }
    
    def create_custom_schema(self, schema_definition: Dict[str, Any], schema_name: str) -> bool:
        """
        Create a custom schema from definition.
        
        Args:
            schema_definition: Schema definition dictionary
            schema_name: Name to assign to the schema
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self._validate_schema_structure(schema_definition)
            self.schemas[schema_name] = schema_definition
            logger.info(f"Custom schema '{schema_name}' created")
            return True
        except Exception as e:
            logger.error(f"Error creating custom schema: {e}")
            return False
    
    def save_schema(self, schema_name: str, output_path: str) -> bool:
        """
        Save a schema to file.
        
        Args:
            schema_name: Name of the schema to save
            output_path: Path to output file
            
        Returns:
            True if successful, False otherwise
        """
        if schema_name not in self.schemas:
            logger.error(f"Schema '{schema_name}' not found")
            return False
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(self.schemas[schema_name], f, indent=2)
            
            logger.info(f"Schema '{schema_name}' saved to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving schema: {e}")
            return False 