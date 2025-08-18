#!/usr/bin/env python3

print("Testing imports...")

try:
    import PyPDF2
    print(f"✅ PyPDF2 imported successfully, version: {PyPDF2.__version__}")
except ImportError as e:
    print(f"❌ PyPDF2 import failed: {e}")

try:
    import pdfplumber
    print(f"✅ pdfplumber imported successfully")
except ImportError as e:
    print(f"❌ pdfplumber import failed: {e}")

try:
    import fitz
    print(f"✅ PyMuPDF (fitz) imported successfully")
except ImportError as e:
    print(f"❌ PyMuPDF (fitz) import failed: {e}")

print("Import test completed.")