"""
FastAPI Web API for PDF to JSON Converter

Provides REST API endpoints for PDF to JSON conversion.
"""

import os
import tempfile
import logging
from typing import List, Optional, Dict, Any
from pathlib import Path
import shutil

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from converter.converter import PDFToJSONConverter

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PDF to JSON Converter API",
    description="API for converting PDF files to JSON format",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize converter
converter = PDFToJSONConverter()

# Temporary directory for file processing
TEMP_DIR = Path(tempfile.gettempdir()) / "pdf_to_json"
TEMP_DIR.mkdir(exist_ok=True)


# Pydantic models for request/response
class ConversionRequest(BaseModel):
    json_type: str = "basic"
    extract_tables: bool = False
    validate_output: bool = True
    config_path: Optional[str] = None


class ConversionResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None
    processing_time: Optional[float] = None
    page_count: Optional[int] = None
    file_size: Optional[int] = None
    errors: List[str] = []
    warnings: List[str] = []


class PreviewResponse(BaseModel):
    total_pages: int
    file_size: int
    parser_used: str
    metadata: Dict[str, Any]
    page_previews: List[Dict[str, Any]]


class ValidationResponse(BaseModel):
    is_valid: bool
    schema_name: str
    file_size: int
    errors: List[str] = []


class HealthResponse(BaseModel):
    status: str
    version: str
    available_parsers: List[str]
    available_schemas: List[str]


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "PDF to JSON Converter API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    options = converter.get_conversion_options()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        available_parsers=options['available_parsers'],
        available_schemas=options['available_schemas']
    )


@app.post("/convert", response_model=ConversionResponse)
async def convert_pdf(
    file: UploadFile = File(...),
    json_type: str = "basic",
    extract_tables: bool = False,
    validate_output: bool = True
):
    """
    Convert uploaded PDF file to JSON.
    
    Args:
        file: PDF file to convert
        json_type: Type of JSON output (basic, detailed, minimal, structured)
        extract_tables: Whether to extract tables
        validate_output: Whether to validate the output JSON
    
    Returns:
        Conversion result with file download link
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create temporary file
    temp_pdf = TEMP_DIR / f"upload_{file.filename}"
    temp_json = TEMP_DIR / f"{Path(file.filename).stem}.json"
    
    try:
        # Save uploaded file
        with open(temp_pdf, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Convert PDF to JSON
        result = converter.convert_file(
            str(temp_pdf),
            str(temp_json),
            json_type,
            None,  # config_path
            validate_output,
            extract_tables
        )
        
        if result['success']:
            return ConversionResponse(
                success=True,
                message="Conversion completed successfully",
                file_path=str(temp_json),
                processing_time=result['processing_time'],
                page_count=result['page_count'],
                file_size=result['file_size'],
                errors=result['errors'],
                warnings=result['warnings']
            )
        else:
            return ConversionResponse(
                success=False,
                message="Conversion failed",
                errors=result['errors'],
                warnings=result['warnings']
            )
    
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    finally:
        # Clean up temporary PDF file
        if temp_pdf.exists():
            temp_pdf.unlink()


@app.get("/download/{filename}")
async def download_file(filename: str):
    """
    Download converted JSON file.
    
    Args:
        filename: Name of the JSON file to download
    
    Returns:
        File download response
    """
    file_path = TEMP_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    if not filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/json'
    )


@app.post("/preview", response_model=PreviewResponse)
async def preview_pdf(
    file: UploadFile = File(...),
    max_pages: int = 3
):
    """
    Preview PDF content without full conversion.
    
    Args:
        file: PDF file to preview
        max_pages: Maximum number of pages to preview
    
    Returns:
        PDF preview information
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    # Create temporary file
    temp_pdf = TEMP_DIR / f"preview_{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_pdf, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate preview
        preview = converter.preview_pdf(str(temp_pdf), max_pages)
        
        if 'error' in preview:
            raise HTTPException(status_code=500, detail=preview['error'])
        
        return PreviewResponse(
            total_pages=preview['total_pages'],
            file_size=preview['file_size'],
            parser_used=preview['parser_used'],
            metadata=preview['metadata'],
            page_previews=preview['page_previews']
        )
    
    except Exception as e:
        logger.error(f"Preview error: {e}")
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_pdf.exists():
            temp_pdf.unlink()


@app.post("/validate", response_model=ValidationResponse)
async def validate_json(
    file: UploadFile = File(...),
    schema_name: str = "basic"
):
    """
    Validate uploaded JSON file against a schema.
    
    Args:
        file: JSON file to validate
        schema_name: Schema name to validate against
    
    Returns:
        Validation result
    """
    # Validate file type
    if not file.filename.lower().endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    # Create temporary file
    temp_json = TEMP_DIR / f"validate_{file.filename}"
    
    try:
        # Save uploaded file
        with open(temp_json, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Validate JSON
        validation_result = converter.validate_json_file(str(temp_json), schema_name)
        
        return ValidationResponse(
            is_valid=validation_result['is_valid'],
            schema_name=schema_name,
            file_size=validation_result['file_size'],
            errors=validation_result['errors']
        )
    
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if temp_json.exists():
            temp_json.unlink()


@app.get("/options")
async def get_options():
    """Get available conversion options."""
    return converter.get_conversion_options()


@app.delete("/cleanup")
async def cleanup_temp_files():
    """Clean up temporary files."""
    try:
        # Remove all temporary files
        for file_path in TEMP_DIR.glob("*"):
            if file_path.is_file():
                file_path.unlink()
        
        return {"message": "Temporary files cleaned up successfully"}
    
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


# Background task to clean up old files periodically
def cleanup_old_files():
    """Clean up files older than 1 hour."""
    import time
    current_time = time.time()
    
    for file_path in TEMP_DIR.glob("*"):
        if file_path.is_file():
            file_age = current_time - file_path.stat().st_mtime
            if file_age > 3600:  # 1 hour
                try:
                    file_path.unlink()
                    logger.info(f"Cleaned up old file: {file_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean up {file_path}: {e}")


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("PDF to JSON Converter API starting up")
    TEMP_DIR.mkdir(exist_ok=True)


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    logger.info("PDF to JSON Converter API shutting down")
    # Clean up temporary files
    cleanup_old_files()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 