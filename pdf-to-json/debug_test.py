#!/usr/bin/env python3
import sys
import os

print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("Current working directory:", os.getcwd())
print("Python path:", sys.path[:3])  # First 3 entries

try:
    import PyPDF2
    print("✅ PyPDF2 imported successfully")
    print("PyPDF2 version:", getattr(PyPDF2, '__version__', 'unknown'))
except ImportError as e:
    print("❌ PyPDF2 import failed:", str(e))

try:
    import pdfplumber
    print("✅ pdfplumber imported successfully")
except ImportError as e:
    print("❌ pdfplumber import failed:", str(e))

# Test the converter
try:
    sys.path.insert(0, 'src')
    from converter.pdf_parser import PDFParser
    print("✅ PDFParser imported successfully")
    parser = PDFParser()
    print("✅ PDFParser initialized successfully")
except Exception as e:
    print("❌ PDFParser failed:", str(e))