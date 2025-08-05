"""
Streamlit Web Application for PDF to JSON Converter

Provides a user-friendly web interface for PDF to JSON conversion.
"""

import streamlit as st
import pandas as pd
import json
import time
from pathlib import Path
import tempfile
import os
from typing import Dict, Any, List

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from converter.converter import PDFToJSONConverter

# Page configuration
st.set_page_config(
    page_title="PDF to JSON Converter",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .success-box {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .error-box {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .info-box {
        background-color: #d1ecf1;
        border: 1px solid #bee5eb;
        border-radius: 5px;
        padding: 1rem;
        margin: 1rem 0;
    }
    .metric-card {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 1rem;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)


def initialize_converter():
    """Initialize the PDF converter."""
    if 'converter' not in st.session_state:
        try:
            st.session_state.converter = PDFToJSONConverter()
        except Exception as e:
            st.error(f"Failed to initialize converter: {e}")
            return None
    return st.session_state.converter


def main():
    """Main application function."""
    # Header
    st.markdown('<h1 class="main-header">📄 PDF to JSON Converter</h1>', unsafe_allow_html=True)
    
    # Initialize converter
    converter = initialize_converter()
    if converter is None:
        st.stop()
    
    # Sidebar
    st.sidebar.title("🛠️ Settings")
    
    # Navigation
    page = st.sidebar.selectbox(
        "Choose a page:",
        ["Convert PDF", "Preview PDF", "Validate JSON", "Batch Processing", "About"]
    )
    
    if page == "Convert PDF":
        convert_page(converter)
    elif page == "Preview PDF":
        preview_page(converter)
    elif page == "Validate JSON":
        validate_page(converter)
    elif page == "Batch Processing":
        batch_page(converter)
    elif page == "About":
        about_page()


def convert_page(converter):
    """PDF conversion page."""
    st.header("🔄 Convert PDF to JSON")
    
    # File upload
    uploaded_file = st.file_uploader(
        "Choose a PDF file",
        type=['pdf'],
        help="Upload a PDF file to convert to JSON"
    )
    
    if uploaded_file is not None:
        # Display file info
        file_details = {
            "Filename": uploaded_file.name,
            "File size": f"{uploaded_file.size / 1024:.1f} KB",
            "File type": uploaded_file.type
        }
        
        st.subheader("📋 File Information")
        for key, value in file_details.items():
            st.write(f"**{key}:** {value}")
        
        # Conversion options
        st.subheader("⚙️ Conversion Options")
        
        col1, col2 = st.columns(2)
        
        with col1:
            json_type = st.selectbox(
                "JSON Output Type",
                ["basic", "detailed", "minimal", "structured"],
                help="Choose the type of JSON output"
            )
            
            extract_tables = st.checkbox(
                "Extract Tables",
                help="Extract tables from the PDF"
            )
        
        with col2:
            validate_output = st.checkbox(
                "Validate Output",
                value=True,
                help="Validate the generated JSON"
            )
            
            config_path = st.text_input(
                "Config Path (for structured JSON)",
                help="Path to structure configuration file (optional)"
            )
        
        # Convert button
        if st.button("🚀 Convert to JSON", type="primary"):
            with st.spinner("Converting PDF to JSON..."):
                try:
                    # Save uploaded file temporarily
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_pdf_path = tmp_file.name
                    
                    # Generate output path
                    output_filename = f"{Path(uploaded_file.name).stem}.json"
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp_output:
                        tmp_json_path = tmp_output.name
                    
                    # Convert PDF
                    result = converter.convert_file(
                        tmp_pdf_path,
                        tmp_json_path,
                        json_type,
                        config_path if config_path else None,
                        validate_output,
                        extract_tables
                    )
                    
                    # Clean up temporary PDF
                    os.unlink(tmp_pdf_path)
                    
                    if result['success']:
                        # Success message
                        st.markdown('<div class="success-box">', unsafe_allow_html=True)
                        st.success("✅ Conversion completed successfully!")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                        # Display metrics
                        col1, col2, col3, col4 = st.columns(4)
                        
                        with col1:
                            st.metric("Pages", result['page_count'])
                        
                        with col2:
                            st.metric("Words", f"{result['total_words']:,}")
                        
                        with col3:
                            st.metric("Processing Time", f"{result['processing_time']:.2f}s")
                        
                        with col4:
                            st.metric("File Size", f"{result['file_size'] / 1024:.1f} KB")
                        
                        # Download button
                        with open(tmp_json_path, 'r', encoding='utf-8') as f:
                            json_content = f.read()
                        
                        st.download_button(
                            label="📥 Download JSON",
                            data=json_content,
                            file_name=output_filename,
                            mime="application/json"
                        )
                        
                        # Show JSON preview
                        st.subheader("📄 JSON Preview")
                        json_data = json.loads(json_content)
                        st.json(json_data)
                        
                        # Clean up temporary JSON
                        os.unlink(tmp_json_path)
                        
                    else:
                        # Error message
                        st.markdown('<div class="error-box">', unsafe_allow_html=True)
                        st.error("❌ Conversion failed!")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                        for error in result['errors']:
                            st.error(f"Error: {error}")
                        
                        # Clean up temporary JSON
                        if os.path.exists(tmp_json_path):
                            os.unlink(tmp_json_path)
                    
                    # Show warnings if any
                    if result.get('warnings'):
                        st.markdown('<div class="info-box">', unsafe_allow_html=True)
                        st.warning("⚠️ Warnings:")
                        for warning in result['warnings']:
                            st.write(f"- {warning}")
                        st.markdown('</div>', unsafe_allow_html=True)
                
                except Exception as e:
                    st.error(f"An error occurred: {e}")


def preview_page(converter):
    """PDF preview page."""
    st.header("👁️ Preview PDF")
    
    uploaded_file = st.file_uploader(
        "Choose a PDF file to preview",
        type=['pdf'],
        key="preview_uploader"
    )
    
    if uploaded_file is not None:
        max_pages = st.slider(
            "Maximum pages to preview",
            min_value=1,
            max_value=10,
            value=3
        )
        
        if st.button("🔍 Generate Preview", type="primary"):
            with st.spinner("Generating preview..."):
                try:
                    # Save uploaded file temporarily
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_pdf_path = tmp_file.name
                    
                    # Generate preview
                    preview = converter.preview_pdf(tmp_pdf_path, max_pages)
                    
                    # Clean up
                    os.unlink(tmp_pdf_path)
                    
                    if 'error' in preview:
                        st.error(f"Preview failed: {preview['error']}")
                    else:
                        # Display preview information
                        col1, col2, col3 = st.columns(3)
                        
                        with col1:
                            st.metric("Total Pages", preview['total_pages'])
                        
                        with col2:
                            st.metric("File Size", f"{preview['file_size'] / 1024:.1f} KB")
                        
                        with col3:
                            st.metric("Parser Used", preview['parser_used'])
                        
                        # Show metadata
                        if preview['metadata']:
                            st.subheader("📋 Metadata")
                            st.json(preview['metadata'])
                        
                        # Show page previews
                        st.subheader("📄 Page Previews")
                        
                        for page in preview['page_previews']:
                            with st.expander(f"Page {page['page_number']}"):
                                col1, col2, col3 = st.columns(3)
                                
                                with col1:
                                    st.metric("Words", page['word_count'])
                                
                                with col2:
                                    st.metric("Characters", page['character_count'])
                                
                                with col3:
                                    st.metric("Preview Length", len(page['text_preview']))
                                
                                st.text_area(
                                    "Text Preview",
                                    page['text_preview'],
                                    height=200,
                                    key=f"preview_{page['page_number']}"
                                )
                
                except Exception as e:
                    st.error(f"An error occurred: {e}")


def validate_page(converter):
    """JSON validation page."""
    st.header("✅ Validate JSON")
    
    uploaded_file = st.file_uploader(
        "Choose a JSON file to validate",
        type=['json'],
        key="validate_uploader"
    )
    
    if uploaded_file is not None:
        # Get available schemas
        options = converter.get_conversion_options()
        schema_name = st.selectbox(
            "Select Schema",
            options['available_schemas'],
            help="Choose the schema to validate against"
        )
        
        if st.button("🔍 Validate JSON", type="primary"):
            with st.spinner("Validating JSON..."):
                try:
                    # Save uploaded file temporarily
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp_file:
                        tmp_file.write(uploaded_file.getvalue())
                        tmp_json_path = tmp_file.name
                    
                    # Validate JSON
                    validation_result = converter.validate_json_file(tmp_json_path, schema_name)
                    
                    # Clean up
                    os.unlink(tmp_json_path)
                    
                    if validation_result['is_valid']:
                        st.markdown('<div class="success-box">', unsafe_allow_html=True)
                        st.success(f"✅ JSON is valid according to '{schema_name}' schema!")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                        st.metric("File Size", f"{validation_result['file_size'] / 1024:.1f} KB")
                    else:
                        st.markdown('<div class="error-box">', unsafe_allow_html=True)
                        st.error(f"❌ JSON is invalid according to '{schema_name}' schema!")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                        st.error("Validation errors:")
                        for error in validation_result['errors']:
                            st.write(f"- {error}")
                
                except Exception as e:
                    st.error(f"An error occurred: {e}")


def batch_page(converter):
    """Batch processing page."""
    st.header("📦 Batch Processing")
    
    st.info("Upload multiple PDF files for batch conversion.")
    
    uploaded_files = st.file_uploader(
        "Choose PDF files",
        type=['pdf'],
        accept_multiple_files=True,
        key="batch_uploader"
    )
    
    if uploaded_files:
        st.write(f"Selected {len(uploaded_files)} files:")
        
        # Display file list
        file_info = []
        for file in uploaded_files:
            file_info.append({
                "Filename": file.name,
                "Size (KB)": f"{file.size / 1024:.1f}",
                "Type": file.type
            })
        
        st.dataframe(pd.DataFrame(file_info))
        
        # Conversion options
        st.subheader("⚙️ Batch Conversion Options")
        
        col1, col2 = st.columns(2)
        
        with col1:
            json_type = st.selectbox(
                "JSON Output Type",
                ["basic", "detailed", "minimal", "structured"],
                key="batch_json_type"
            )
            
            extract_tables = st.checkbox(
                "Extract Tables",
                key="batch_extract_tables"
            )
        
        with col2:
            validate_output = st.checkbox(
                "Validate Output",
                value=True,
                key="batch_validate"
            )
        
        if st.button("🚀 Start Batch Conversion", type="primary"):
            with st.spinner("Processing batch conversion..."):
                try:
                    # Create temporary directory
                    with tempfile.TemporaryDirectory() as temp_dir:
                        temp_dir_path = Path(temp_dir)
                        
                        # Save uploaded files
                        pdf_files = []
                        for file in uploaded_files:
                            file_path = temp_dir_path / file.name
                            with open(file_path, 'wb') as f:
                                f.write(file.getvalue())
                            pdf_files.append(str(file_path))
                        
                        # Convert batch
                        batch_result = converter.convert_batch(
                            pdf_files,
                            str(temp_dir_path / "output"),
                            json_type,
                            None,  # config_path
                            validate_output,
                            extract_tables
                        )
                        
                        # Display results
                        st.subheader("📊 Batch Conversion Results")
                        
                        col1, col2, col3, col4 = st.columns(4)
                        
                        with col1:
                            st.metric("Total Files", batch_result['total_files'])
                        
                        with col2:
                            st.metric("Successful", batch_result['successful_conversions'])
                        
                        with col3:
                            st.metric("Failed", batch_result['failed_conversions'])
                        
                        with col4:
                            st.metric("Total Time", f"{batch_result['total_processing_time']:.2f}s")
                        
                        # Show errors if any
                        if batch_result['errors']:
                            st.error("Errors occurred:")
                            for error in batch_result['errors'][:5]:  # Show first 5
                                st.write(f"- {error}")
                            if len(batch_result['errors']) > 5:
                                st.write(f"... and {len(batch_result['errors']) - 5} more errors")
                        
                        # Show warnings if any
                        if batch_result['warnings']:
                            st.warning("Warnings:")
                            for warning in batch_result['warnings'][:3]:  # Show first 3
                                st.write(f"- {warning}")
                            if len(batch_result['warnings']) > 3:
                                st.write(f"... and {len(batch_result['warnings']) - 3} more warnings")
                        
                        # Create zip file for download
                        if batch_result['successful_conversions'] > 0:
                            import zipfile
                            
                            zip_path = temp_dir_path / "converted_files.zip"
                            with zipfile.ZipFile(zip_path, 'w') as zipf:
                                for file_path in (temp_dir_path / "output").glob("*.json"):
                                    zipf.write(file_path, file_path.name)
                            
                            # Download button
                            with open(zip_path, 'rb') as f:
                                st.download_button(
                                    label="📥 Download All JSON Files",
                                    data=f.read(),
                                    file_name="converted_files.zip",
                                    mime="application/zip"
                                )
                
                except Exception as e:
                    st.error(f"An error occurred: {e}")


def about_page():
    """About page."""
    st.header("ℹ️ About")
    
    st.markdown("""
    ## PDF to JSON Converter
    
    A powerful tool for converting PDF documents to JSON format with various output options.
    
    ### Features
    
    - **Multiple PDF Parsers**: Uses pdfplumber, PyMuPDF, and PyPDF2 for maximum compatibility
    - **Flexible JSON Output**: Basic, detailed, minimal, and structured JSON formats
    - **Table Extraction**: Extract tables from PDF documents
    - **JSON Validation**: Validate output against predefined schemas
    - **Batch Processing**: Convert multiple PDF files at once
    - **Web Interface**: User-friendly Streamlit web application
    - **REST API**: FastAPI-based web API for programmatic access
    
    ### JSON Output Types
    
    - **Basic**: Standard JSON with document info and content
    - **Detailed**: Comprehensive JSON with statistics and extracted data
    - **Minimal**: Compact JSON with essential information only
    - **Structured**: Customizable JSON structure based on configuration
    
    ### Supported Formats
    
    - **Input**: PDF files
    - **Output**: JSON files
    - **Validation**: JSON Schema validation
    
    ### Technology Stack
    
    - **Python**: Core application logic
    - **Streamlit**: Web interface
    - **FastAPI**: REST API
    - **pdfplumber/PyMuPDF/PyPDF2**: PDF parsing
    - **Pydantic**: Data validation
    - **jsonschema**: JSON schema validation
    
    ### Usage
    
    1. **Web Interface**: Use the Streamlit app for interactive conversion
    2. **Command Line**: Use `python main.py` for command-line conversion
    3. **API**: Use the FastAPI endpoints for programmatic access
    
    ### License
    
    MIT License
    """)


if __name__ == "__main__":
    main() 