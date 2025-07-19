#!/usr/bin/env python3
"""
Sofascore letöltött adatok elemzése
Megvizsgálja, hogy a letöltött JSON fájlokban van-e használható információ
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')

class SofascoreDataAnalyzer:
    """Sofascore adatok elemzője"""
    
    def __init__(self, data_dir: str = "data/match_stats"):
        self.data_dir = Path(data_dir)
        self.analysis_results = {
            'total_files': 0,
            'error_files': 0,
            'valid_files': 0,
            'file_types': {},
            'useful_data_found': [],
            'errors_found': [],
            'sample_data': {}
        }
        
    def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Egy fájl elemzése"""
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            file_analysis = {
                'file_name': file_path.name,
                'file_size': file_path.stat().st_size,
                'has_error': False,
                'error_code': None,
                'useful_data': [],
                'data_structure': {}
            }
            
            # Hiba ellenőrzése
            if 'props' in data and 'pageProps' in data['props']:
                page_props = data['props']['pageProps']
                if 'error' in page_props:
                    file_analysis['has_error'] = True
                    file_analysis['error_code'] = page_props['error'].get('code')
                    return file_analysis
                    
            # Hasznos adatok keresése
            useful_data = self._extract_useful_data(data)
            file_analysis['useful_data'] = useful_data
            file_analysis['data_structure'] = self._analyze_structure(data)
            
            return file_analysis
            
        except Exception as e:
            logging.error(f"Hiba {file_path.name} elemzésekor: {e}")
            return {
                'file_name': file_path.name,
                'error': str(e),
                'has_error': True
            }
            
    def _extract_useful_data(self, data: Dict) -> List[str]:
        """Hasznos adatok keresése a JSON-ban"""
        
        useful_data = []
        
        # Rekurzív keresés hasznos kulcsokra
        def search_keys(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    
                    # Hasznos kulcsok azonosítása
                    if key.lower() in ['statistics', 'stats', 'match', 'score', 'goals', 
                                     'possession', 'shots', 'corners', 'cards', 'fouls',
                                     'home', 'away', 'teams', 'players', 'events']:
                        useful_data.append(current_path)
                        
                    # Tovább keresés
                    if isinstance(value, (dict, list)):
                        search_keys(value, current_path)
                        
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if isinstance(item, (dict, list)):
                        search_keys(item, f"{path}[{i}]")
                        
        search_keys(data)
        return useful_data
        
    def _analyze_structure(self, data: Dict) -> Dict:
        """Adatstruktúra elemzése"""
        
        def get_structure(obj, max_depth=3, current_depth=0):
            if current_depth >= max_depth:
                return "..."
                
            if isinstance(obj, dict):
                if len(obj) > 10:  # Túl sok kulcs esetén csak a számot mutatjuk
                    return f"dict({len(obj)} keys)"
                return {k: get_structure(v, max_depth, current_depth + 1) for k, v in obj.items()}
            elif isinstance(obj, list):
                if len(obj) == 0:
                    return []
                elif len(obj) > 5:  # Túl sok elem esetén csak a számot mutatjuk
                    return f"list({len(obj)} items)"
                else:
                    return [get_structure(obj[0], max_depth, current_depth + 1)]
            else:
                return type(obj).__name__
                
        return get_structure(data)
        
    def analyze_all_files(self) -> Dict:
        """Összes fájl elemzése"""
        
        logging.info(f"Sofascore adatok elemzése: {self.data_dir}")
        
        if not self.data_dir.exists():
            logging.error(f"Adatkönyvtár nem található: {self.data_dir}")
            return self.analysis_results
            
        json_files = list(self.data_dir.glob("*.json"))
        self.analysis_results['total_files'] = len(json_files)
        
        if not json_files:
            logging.warning("Nem találhatók JSON fájlok")
            return self.analysis_results
            
        logging.info(f"Elemzendő fájlok: {len(json_files)}")
        
        # Minden fájl elemzése
        for json_file in json_files:
            file_analysis = self.analyze_file(json_file)
            
            if file_analysis.get('has_error'):
                self.analysis_results['error_files'] += 1
                error_code = file_analysis.get('error_code', 'unknown')
                if error_code not in self.analysis_results['errors_found']:
                    self.analysis_results['errors_found'].append(error_code)
            else:
                self.analysis_results['valid_files'] += 1
                
                # Hasznos adatok gyűjtése
                useful_data = file_analysis.get('useful_data', [])
                if useful_data:
                    self.analysis_results['useful_data_found'].extend(useful_data)
                    
                    # Minta adat mentése
                    if len(self.analysis_results['sample_data']) < 3:
                        self.analysis_results['sample_data'][json_file.name] = {
                            'useful_data': useful_data,
                            'structure': file_analysis.get('data_structure', {})
                        }
                        
        # Hasznos adatok deduplikálása
        self.analysis_results['useful_data_found'] = list(set(self.analysis_results['useful_data_found']))
        
        return self.analysis_results
        
    def create_report(self) -> str:
        """Elemzési jelentés készítése"""
        
        results = self.analysis_results
        
        report = []
        report.append("# 🔍 SOFASCORE ADATOK ELEMZÉSI JELENTÉS")
        report.append(f"**Elemzett könyvtár:** {self.data_dir}")
        report.append("")
        
        # Összefoglaló
        report.append("## 📊 ÖSSZEFOGLALÓ:")
        report.append(f"- **Összes fájl:** {results['total_files']}")
        report.append(f"- **Hibás fájlok:** {results['error_files']}")
        report.append(f"- **Érvényes fájlok:** {results['valid_files']}")
        report.append("")
        
        # Hibák
        if results['errors_found']:
            report.append("## ❌ TALÁLT HIBÁK:")
            for error in results['errors_found']:
                report.append(f"- HTTP {error}")
            report.append("")
            
        # Hasznos adatok
        if results['useful_data_found']:
            report.append("## ✅ HASZNOS ADATOK TALÁLVA:")
            for data_path in sorted(results['useful_data_found']):
                report.append(f"- {data_path}")
            report.append("")
        else:
            report.append("## ❌ NINCS HASZNOS ADAT")
            report.append("A letöltött fájlokban nem találhatók használható focis statisztikák.")
            report.append("")
            
        # Minta adatok
        if results['sample_data']:
            report.append("## 📋 MINTA ADATOK:")
            for file_name, sample in results['sample_data'].items():
                report.append(f"### {file_name}")
                if sample['useful_data']:
                    report.append("**Hasznos adatok:**")
                    for data in sample['useful_data']:
                        report.append(f"- {data}")
                report.append("")
                
        # Javaslatok
        report.append("## 💡 JAVASLATOK:")
        
        if results['error_files'] > results['valid_files']:
            report.append("1. **URL probléma:** A legtöbb fájl 404 hibát tartalmaz")
            report.append("   - Ellenőrizd a meccs URL generálási logikát")
            report.append("   - Lehet, hogy a meccs ID-k nem megfelelőek")
            
        if not results['useful_data_found']:
            report.append("2. **Scraping probléma:** Nincs hasznos adat a fájlokban")
            report.append("   - A scraper nem a megfelelő adatokat tölti le")
            report.append("   - Át kell írni a Node.js scriptet")
            
        report.append("3. **Megoldási javaslatok:**")
        report.append("   - Használj Sofascore API-t közvetlenül")
        report.append("   - Javítsd a scraper logikát")
        report.append("   - Koncentrálj a Flashscore adatokra")
        
        return "\n".join(report)


def main():
    """Fő függvény"""
    
    print("🔍 SOFASCORE ADATOK ELEMZÉSE")
    print("=" * 50)
    
    analyzer = SofascoreDataAnalyzer()
    results = analyzer.analyze_all_files()
    
    # Jelentés készítése
    report = analyzer.create_report()
    
    # Jelentés mentése
    report_file = Path("sofascore_analysis_report.md")
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
        
    # Konzol kimenet
    print(f"\n📊 EREDMÉNYEK:")
    print(f"- Összes fájl: {results['total_files']}")
    print(f"- Hibás fájlok: {results['error_files']}")
    print(f"- Érvényes fájlok: {results['valid_files']}")
    
    if results['errors_found']:
        print(f"\n❌ HIBÁK:")
        for error in results['errors_found']:
            print(f"  - HTTP {error}")
            
    if results['useful_data_found']:
        print(f"\n✅ HASZNOS ADATOK: {len(results['useful_data_found'])} típus")
        for data in results['useful_data_found'][:5]:  # Első 5
            print(f"  - {data}")
        if len(results['useful_data_found']) > 5:
            print(f"  ... és még {len(results['useful_data_found']) - 5}")
    else:
        print(f"\n❌ NINCS HASZNOS ADAT")
        
    print(f"\n📄 Részletes jelentés: {report_file}")
    
    return results['useful_data_found'] or results['valid_files'] > 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)