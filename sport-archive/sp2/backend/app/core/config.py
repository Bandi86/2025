#!/usr/bin/env python3
"""
Konfigurációs beállítások a SzerencseMix processzohoz
"""

from pathlib import Path
from dataclasses import dataclass
from typing import List

@dataclass
class ProcessorConfig:
    """Processzor konfigurációs osztály"""

    # Adatbázis beállítások
    database_path: str = "data/optimized_sport_data.db"

    # PDF feldolgozás beállítások
    pdf_timeout: int = 30
    max_pdfs_per_run: int = 1

    # Keresési útvonalak
    pdf_search_paths: List[str] = None

    # Export beállítások
    excel_output_dir: str = "data"
    json_output_dir: str = "data"

    # Logging beállítások
    log_level: str = "INFO"
    log_file: str = "logs/processor.log"

    def __post_init__(self):
        if self.pdf_search_paths is None:
            self.pdf_search_paths = [
                "../pdf_processed",
                "../pdf_input",
                "../temp",
                "..",
                "pdf_processed",
                "pdf_input",
                "temp",
                "."
            ]

        # Könyvtárak létrehozása
        Path(self.database_path).parent.mkdir(exist_ok=True)
        Path(self.excel_output_dir).mkdir(exist_ok=True)
        Path(self.json_output_dir).mkdir(exist_ok=True)
        Path(self.log_file).parent.mkdir(exist_ok=True)

# Globális konfiguráció példány
config = ProcessorConfig()
