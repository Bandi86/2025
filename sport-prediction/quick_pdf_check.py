#!/usr/bin/env python3
"""
Quick PDF Sample Extractor

Quickly extracts sample text from SzerencseMix PDF to understand the format.
"""

import os
import sys
import requests
import pdfplumber
from pathlib import Path

def quick_pdf_analysis():
    """Quick analysis of PDF content"""
    pdf_url = 'https://www.tippmix.hu/cmsfiles/1f/0d/Web__51sz__P__06-27.pdf'

    print("🔍 QUICK PDF ANALYSIS")
    print("="*50)

    try:
        print("📥 Downloading sample PDF...")
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()

        # Save temporarily
        temp_pdf = '/tmp/sample_szerencsemix.pdf'
        with open(temp_pdf, 'wb') as f:
            f.write(response.content)

        print(f"✅ Downloaded {len(response.content):,} bytes")

        # Quick analysis
        with pdfplumber.open(temp_pdf) as pdf:
            print(f"📄 Total pages: {len(pdf.pages)}")

            # Check first few pages for content
            for page_num in [1, 2, 3, 10, 15]:  # Sample different pages
                if page_num <= len(pdf.pages):
                    page = pdf.pages[page_num - 1]
                    text = page.extract_text()

                    print(f"\n📄 PAGE {page_num} SAMPLE:")
                    print("-" * 30)

                    if text:
                        lines = [line.strip() for line in text.split('\n') if line.strip()]
                        print(f"Lines: {len(lines)}")

                        # Show first 10 lines
                        for i, line in enumerate(lines[:10]):
                            print(f"{i+1:2d}: {line[:60]}{'...' if len(line) > 60 else ''}")

                        # Look for football keywords
                        text_lower = text.lower()
                        football_keywords = ['labdarúgás', 'foci', 'premier league', 'bundesliga', 'champions league']
                        found = [kw for kw in football_keywords if kw in text_lower]
                        if found:
                            print(f"⚽ Football keywords: {found}")
                    else:
                        print("No text found")

        # Clean up
        os.unlink(temp_pdf)

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    quick_pdf_analysis()
