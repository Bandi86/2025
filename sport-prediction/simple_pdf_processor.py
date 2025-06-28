#!/usr/bin/env python3
"""
Minimális PDF feldolgozó, ha a fő dependency-k nem elérhetők
"""

import re
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class SimplePdfMatch:
    """Egyszerű meccs adatstruktúra"""
    home_team: str
    away_team: str
    match_date: Optional[str] = None
    match_time: Optional[str] = None
    league_info: Optional[str] = None
    odds_1: Optional[float] = None
    odds_x: Optional[float] = None
    odds_2: Optional[float] = None
    confidence: float = 0.5

class SimplePdfProcessor:
    """
    Minimális PDF feldolgozó, ha pdfplumber nem elérhető
    Csak a fájlnevekből próbál információt kinyerni
    """

    def __init__(self):
        self.filename_pattern = re.compile(r'(\d{4})\.(\d{2})\.(\d{2})')

    def process_pdf(self, pdf_path: str) -> List[SimplePdfMatch]:
        """
        Egyszerű feldolgozás fájlnév alapján
        Ez csak demo adatokat ad vissza
        """
        pdf_path = Path(pdf_path)

        # Dátum kinyerése a fájlnévből
        date_match = self.filename_pattern.search(pdf_path.name)

        if date_match:
            year, month, day = date_match.groups()
            date_str = f"{year}-{month}-{day}"
        else:
            date_str = "2023-01-01"  # Default

        # Demo meccs visszaadása, hogy lássuk a működést
        return [
            SimplePdfMatch(
                home_team="Demo Hazai",
                away_team="Demo Vendég",
                match_date=date_str,
                match_time="15:00",
                league_info="Demo Liga",
                odds_1=2.1,
                odds_x=3.2,
                odds_2=2.8,
                confidence=0.3
            )
        ]
