#!/usr/bin/env python3
"""
Optimalizált Excel export modul - tiszta struktúrával
"""

import sqlite3
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class ExcelExporter:
    """Excel export osztály"""

    def __init__(self, db_path: str = "data/optimized_sport_data.db"):
        self.db_path = Path(db_path)
        if not self.db_path.exists():
            raise FileNotFoundError(f"Adatbázis nem található: {self.db_path}")

    def _fetch_match_data(self) -> pd.DataFrame:
        """Meccs adatok lekérdezése az adatbázisból"""
        query = '''
            SELECT
                match_id as "Meccs ID",
                teams as "Csapatok",
                time_info as "Időpont",
                day_info as "Nap",
                odds_1 as "1. Esély",
                odds_2 as "X Esély",
                odds_3 as "2. Esély",
                match_type as "Típus",
                source_pdf as "Forrás PDF",
                line_number as "Sor szám",
                extracted_at as "Kinyerve"
            FROM matches
            ORDER BY source_pdf, line_number
        '''

        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(query, conn)
        conn.close()

        return df

    def _create_statistics_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Statisztikai adatok generálása"""
        stats_data = {
            'Statisztika': [
                'Összes meccs',
                'Egyedi PDF források',
                'P formátum meccsek',
                'K formátum meccsek',
                'Nap formátum meccsek',
                'Átlagos 1. esély',
                'Átlagos X esély',
                'Átlagos 2. esély',
                'Legmagasabb 1. esély',
                'Legalacsonyabb 1. esély'
            ],
            'Érték': [
                len(df),
                df['Forrás PDF'].nunique(),
                len(df[df['Típus'] == 'P_format']),
                len(df[df['Típus'] == 'K_format']),
                len(df[df['Típus'] == 'day_format']),
                f"{df['1. Esély'].mean():.2f}" if not df.empty else "N/A",
                f"{df['X Esély'].mean():.2f}" if not df.empty else "N/A",
                f"{df['2. Esély'].mean():.2f}" if not df.empty else "N/A",
                f"{df['1. Esély'].max():.2f}" if not df.empty else "N/A",
                f"{df['1. Esély'].min():.2f}" if not df.empty else "N/A"
            ]
        }

        return pd.DataFrame(stats_data)

    def _create_summary_by_pdf(self, df: pd.DataFrame) -> pd.DataFrame:
        """PDF forrás szerinti összesítő"""
        if df.empty:
            return pd.DataFrame()

        summary = df.groupby('Forrás PDF').agg({
            'Meccs ID': 'count',
            '1. Esély': ['mean', 'min', 'max'],
            'X Esély': 'mean',
            '2. Esély': 'mean',
            'Típus': lambda x: x.value_counts().to_dict()
        }).round(2)

        # Oszlop nevek egyszerűsítése
        summary.columns = [
            'Meccsek száma', 'Átlag 1. esély', 'Min 1. esély', 'Max 1. esély',
            'Átlag X esély', 'Átlag 2. esély', 'Formátum eloszlás'
        ]

        return summary.reset_index()

    def _format_worksheet(self, worksheet, df: pd.DataFrame):
        """Munkafüzet formázása"""
        # Oszlop szélességek beállítása
        column_widths = {
            'A': 12,  # Meccs ID
            'B': 45,  # Csapatok
            'C': 12,  # Időpont
            'D': 8,   # Nap
            'E': 12,  # 1. Esély
            'F': 12,  # X Esély
            'G': 12,  # 2. Esély
            'H': 15,  # Típus
            'I': 35,  # Forrás PDF
            'J': 10,  # Sor szám
            'K': 20   # Kinyerve
        }

        for col, width in column_widths.items():
            worksheet.column_dimensions[col].width = width

        # Header formázása
        from openpyxl.styles import Font, PatternFill

        header_font = Font(bold=True)
        header_fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")

        for cell in worksheet[1]:
            cell.font = header_font
            cell.fill = header_fill

    def export_to_excel(self, output_path: Optional[Path] = None) -> Path:
        """Fő export funkció"""
        # Adatok lekérdezése
        df = self._fetch_match_data()

        if df.empty:
            raise ValueError("Nincsenek exportálható adatok az adatbázisban!")

        # Output fájl név generálása
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = Path(f"data/szerencsmix_meccsek_{timestamp}.xlsx")

        output_path.parent.mkdir(exist_ok=True)

        logger.info(f"Excel export kezdése: {len(df)} meccs")

        # Excel fájl létrehozása
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Fő adatlap
            df.to_excel(writer, sheet_name='Meccsek', index=False)

            # Statisztikák lap
            stats_df = self._create_statistics_data(df)
            stats_df.to_excel(writer, sheet_name='Statisztikák', index=False)

            # PDF forrás szerinti összesítő
            summary_df = self._create_summary_by_pdf(df)
            if not summary_df.empty:
                summary_df.to_excel(writer, sheet_name='PDF Összesítő', index=False)

            # Formázás alkalmazása
            self._format_worksheet(writer.sheets['Meccsek'], df)

        logger.info(f"Excel export kész: {output_path}")
        return output_path

    def get_export_info(self) -> Dict[str, Any]:
        """Export információk lekérdezése"""
        df = self._fetch_match_data()

        return {
            'total_matches': len(df),
            'unique_pdfs': df['Forrás PDF'].nunique() if not df.empty else 0,
            'date_range': {
                'first': df['Kinyerve'].min() if not df.empty else None,
                'last': df['Kinyerve'].max() if not df.empty else None
            },
            'format_distribution': df['Típus'].value_counts().to_dict() if not df.empty else {}
        }

def main():
    """Fő futási logika"""
    print("📊 OPTIMALIZÁLT EXCEL EXPORT")
    print("="*40)

    try:
        exporter = ExcelExporter()

        # Export információk
        info = exporter.get_export_info()
        print(f"📋 Exportálandó meccsek: {info['total_matches']}")
        print(f"📄 PDF források: {info['unique_pdfs']}")

        if info['total_matches'] == 0:
            print("❌ Nincsenek exportálható adatok!")
            return

        # Export végrehajtása
        excel_file = exporter.export_to_excel()

        print(f"\n✅ SIKERES EXPORT!")
        print(f"📄 Fájl: {excel_file}")
        print(f"📊 {info['total_matches']} meccs exportálva")

        # Rövid előnézet
        print(f"\n👀 FORMÁTUM ELOSZLÁS:")
        for format_type, count in info['format_distribution'].items():
            print(f"   {format_type}: {count}")

    except Exception as e:
        logger.error(f"Export hiba: {e}")
        print(f"❌ Export hiba: {e}")

if __name__ == "__main__":
    main()
