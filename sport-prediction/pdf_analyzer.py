#!/usr/bin/env python3
"""
SzerencseMix PDF Analyzer

Analyzes the structure and content of SzerencseMix PDFs to understand
the format and help improve data extraction.
"""

import os
import sys
import requests
import pdfplumber
from pathlib import Path
import re
from typing import List, Dict, Tuple

def download_sample_pdf() -> str:
    """Download a sample PDF for analysis"""
    pdf_url = 'https://www.tippmix.hu/cmsfiles/1f/0d/Web__51sz__P__06-27.pdf'
    demo_dir = Path(__file__).parent / "data" / "demo_analysis"
    demo_dir.mkdir(parents=True, exist_ok=True)

    pdf_path = demo_dir / 'sample_szerencsemix.pdf'

    if pdf_path.exists():
        print(f"📄 Using existing PDF: {pdf_path}")
        return str(pdf_path)

    print("📥 Downloading sample PDF for analysis...")
    try:
        response = requests.get(pdf_url, timeout=30)
        response.raise_for_status()

        with open(pdf_path, 'wb') as f:
            f.write(response.content)

        print(f"✅ Downloaded: {pdf_path} ({len(response.content):,} bytes)")
        return str(pdf_path)
    except Exception as e:
        print(f"❌ Failed to download PDF: {e}")
        return None

def analyze_pdf_structure(pdf_path: str):
    """Analyze the structure of the PDF"""
    print(f"\n🔍 ANALYZING PDF STRUCTURE: {Path(pdf_path).name}")
    print("="*60)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"📊 Total pages: {len(pdf.pages)}")

            for page_num, page in enumerate(pdf.pages[:5], 1):  # Analyze first 5 pages
                print(f"\n📄 PAGE {page_num}:")
                print("-" * 30)

                # Extract text
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    print(f"   📝 Lines: {len(lines)}")

                    # Show first 10 lines
                    print("   🔤 Sample content:")
                    for i, line in enumerate(lines[:10]):
                        line = line.strip()
                        if line:
                            print(f"      {i+1:2d}: {line[:80]}{'...' if len(line) > 80 else ''}")

                    if len(lines) > 10:
                        print(f"      ... and {len(lines) - 10} more lines")
                else:
                    print("   ⚠️  No text found")

                # Try to find football-related content
                football_keywords = [
                    'labdarúgás', 'foci', 'fútbol', 'football', 'soccer',
                    'premier league', 'bundesliga', 'la liga', 'serie a',
                    'champions league', 'europa league', 'nb i', 'otp bank liga',
                    'bajnokok ligája', 'európa liga'
                ]

                if text:
                    text_lower = text.lower()
                    found_keywords = [kw for kw in football_keywords if kw in text_lower]
                    if found_keywords:
                        print(f"   ⚽ Football keywords found: {', '.join(found_keywords)}")
                    else:
                        print("   ❌ No football keywords found")

    except Exception as e:
        print(f"❌ Error analyzing PDF: {e}")

def find_football_sections(pdf_path: str):
    """Try to find football-specific sections in the PDF"""
    print(f"\n⚽ SEARCHING FOR FOOTBALL CONTENT")
    print("="*60)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            football_pages = []

            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if not text:
                    continue

                text_lower = text.lower()

                # Look for football indicators
                football_indicators = [
                    'labdarúgás', 'foci', 'football',
                    'premier league', 'bundesliga', 'la liga', 'serie a',
                    'champions league', 'europa league',
                    'nb i', 'otp bank liga', 'bajnokok ligája',
                    'manchester', 'barcelona', 'real madrid', 'juventus',
                    'liverpool', 'chelsea', 'arsenal', 'tottenham'
                ]

                matches = sum(1 for indicator in football_indicators if indicator in text_lower)

                if matches > 0:
                    football_pages.append((page_num, matches, text))

            if football_pages:
                print(f"🎯 Found football content on {len(football_pages)} pages:")

                # Sort by relevance (number of matches)
                football_pages.sort(key=lambda x: x[1], reverse=True)

                for page_num, match_count, text in football_pages[:3]:  # Show top 3
                    print(f"\n📄 Page {page_num} (relevance: {match_count}):")
                    lines = text.split('\n')

                    # Find lines with team names or odds
                    relevant_lines = []
                    for line in lines:
                        line = line.strip()
                        if not line:
                            continue

                        line_lower = line.lower()
                        if any(indicator in line_lower for indicator in football_indicators):
                            relevant_lines.append(line)
                        # Look for patterns that might be matches/odds
                        elif re.search(r'\d+[.,]\d+', line) and len(line.split()) >= 2:
                            relevant_lines.append(line)

                    for i, line in enumerate(relevant_lines[:10]):
                        print(f"   {i+1:2d}: {line[:100]}{'...' if len(line) > 100 else ''}")

                    if len(relevant_lines) > 10:
                        print(f"   ... and {len(relevant_lines) - 10} more relevant lines")
            else:
                print("❌ No football content found in any pages")

    except Exception as e:
        print(f"❌ Error searching for football content: {e}")

def analyze_text_patterns(pdf_path: str):
    """Analyze text patterns that might indicate match data"""
    print(f"\n🔍 ANALYZING TEXT PATTERNS")
    print("="*60)

    try:
        with pdfplumber.open(pdf_path) as pdf:
            all_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n"

            lines = all_text.split('\n')
            lines = [line.strip() for line in lines if line.strip()]

            print(f"📊 Total non-empty lines: {len(lines)}")

            # Look for patterns
            patterns = {
                'decimal_numbers': r'\d+[.,]\d+',
                'team_vs_team': r'[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+ ?- ?[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű]+',
                'dates': r'\d{1,2}[./]\d{1,2}|\d{4}[.-]\d{1,2}[.-]\d{1,2}',
                'times': r'\d{1,2}:\d{2}',
                'odds_like': r'\d+[.,]\d{2,3}',
                'percentages': r'\d+%'
            }

            print("\n🔍 Pattern analysis:")
            for pattern_name, pattern in patterns.items():
                matches = re.findall(pattern, all_text)
                print(f"   {pattern_name}: {len(matches)} matches")
                if matches:
                    sample = matches[:5]
                    print(f"      Sample: {', '.join(sample)}")

            # Look for structured data (tables)
            print("\n📊 Looking for structured data:")
            table_like_lines = []
            for line in lines:
                # Lines with multiple numbers might be table rows
                numbers = re.findall(r'\d+[.,]\d+', line)
                if len(numbers) >= 3:  # At least 3 numbers (could be odds)
                    table_like_lines.append(line)

            print(f"   Table-like lines: {len(table_like_lines)}")
            if table_like_lines:
                print("   Sample table-like lines:")
                for i, line in enumerate(table_like_lines[:5]):
                    print(f"      {i+1}: {line[:100]}{'...' if len(line) > 100 else ''}")

    except Exception as e:
        print(f"❌ Error analyzing patterns: {e}")

def suggest_improvements():
    """Suggest improvements for PDF processing"""
    print(f"\n💡 SUGGESTIONS FOR IMPROVEMENT")
    print("="*60)

    suggestions = [
        "🎯 FOKUSZÁLÁS LABDARÚGÁSRA:",
        "   - Keresés 'labdarúgás', 'foci', 'football' kulcsszavakra",
        "   - Ismert liga nevek felismerése (Premier League, Bundesliga, stb.)",
        "   - Csapatnevek azonosítása (Manchester, Barcelona, stb.)",
        "",
        "📊 FEJLETT SZÖVEG ELEMZÉS:",
        "   - OCR használata képek esetén",
        "   - Táblázat struktúra felismerése",
        "   - Oszlopok és sorok automatikus azonosítása",
        "",
        "🔍 MINTA FELISMERÉS:",
        "   - Odds formátum: X.XX (pl. 2.50, 1.85)",
        "   - Meccs formátum: 'Csapat1 - Csapat2' vagy 'Csapat1 vs Csapat2'",
        "   - Dátum/idő formátumok",
        "",
        "⚡ OPTIMALIZÁCIÓ:",
        "   - Csak releváns oldalak feldolgozása",
        "   - Kulcsszó alapú szűrés",
        "   - Regex minták finomítása",
        "",
        "🎛️ KONFIGURÁLHATÓ FELDOLGOZÁS:",
        "   - Sport típus kiválasztása",
        "   - Liga szűrés",
        "   - Csak jövőbeli meccsek",
        "",
        "🚀 KÖVETKEZŐ LÉPÉSEK:",
        "   1. Kézi elemzés néhány PDF-en",
        "   2. Mintázatok dokumentálása",
        "   3. Specifikus regex minták készítése",
        "   4. Labdarúgás-specifikus feldolgozó írása",
        "   5. Tesztelés és finomhangolás"
    ]

    for suggestion in suggestions:
        print(suggestion)

def main():
    """Main analysis function"""
    print("🔍 SZERENCSEMIX PDF ANALYZER")
    print("="*80)
    print("Analyzing SzerencseMix PDF structure to improve data extraction")
    print("="*80)

    # Download sample PDF
    pdf_path = download_sample_pdf()
    if not pdf_path:
        print("❌ Cannot proceed without PDF file")
        return

    # Run analysis
    analyze_pdf_structure(pdf_path)
    find_football_sections(pdf_path)
    analyze_text_patterns(pdf_path)
    suggest_improvements()

    print("\n" + "="*80)
    print("🎯 ANALYSIS COMPLETE")
    print("Next step: Manually review the PDF content and create football-specific patterns")
    print("="*80)

if __name__ == "__main__":
    main()
