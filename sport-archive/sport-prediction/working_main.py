#!/usr/bin/env python3
"""
Working PDF Processing Pipeline using tested components
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# Import working components with error handling
pdf_processor_class = None
try:
    from advanced_tippmix_processor import AdvancedTipmmixProcessor
    pdf_processor_class = AdvancedTipmmixProcessor
    print("✅ AdvancedTipmmixProcessor loaded")
except ImportError:
    try:
        from smart_tippmix_processor import SmartTipmmixProcessor
        pdf_processor_class = SmartTipmmixProcessor
        print("✅ SmartTipmmixProcessor loaded")
    except ImportError:
        print("❌ No PDF processor available")

# Import other components
try:
    from result_updater_fixed import ResultUpdater
    result_updater_class = ResultUpdater
    print("✅ ResultUpdater loaded")
except ImportError:
    print("❌ ResultUpdater not available")
    result_updater_class = None

try:
    from league_table_extractor_fixed import LeagueTableExtractor
    table_extractor_class = LeagueTableExtractor
    print("✅ LeagueTableExtractor loaded")
except ImportError:
    print("❌ LeagueTableExtractor not available")
    table_extractor_class = None

try:
    from simple_prediction_engine import SimplePredictionEngine
    prediction_engine_class = SimplePredictionEngine
    print("✅ SimplePredictionEngine loaded")
except ImportError:
    print("❌ SimplePredictionEngine not available")
    prediction_engine_class = None

class WorkingSportPredictionSystem:
    def __init__(self):
        # Initialize components with error handling
        if pdf_processor_class:
            self.pdf_processor = pdf_processor_class()
        else:
            self.pdf_processor = None

        if result_updater_class:
            self.result_updater = result_updater_class()
        else:
            self.result_updater = None

        if table_extractor_class:
            self.table_extractor = table_extractor_class()
        else:
            self.table_extractor = None

        if prediction_engine_class:
            self.prediction_engine = prediction_engine_class()
        else:
            self.prediction_engine = None

    def process_new_pdfs(self, pdf_directory: str):
        """PDF fájlok feldolgozása"""
        if not self.pdf_processor:
            print("❌ PDF processor nem elérhető")
            return False

        print(f"📁 PDF feldolgozás: {pdf_directory}")

        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            print(f"❌ Nem létezik: {pdf_directory}")
            return False

        pdf_files = list(pdf_dir.glob("*.pdf"))
        print(f"📄 Találtunk {len(pdf_files)} PDF fájlt")

        processed_count = 0
        for pdf_file in pdf_files[:2]:  # Limit to 2 for testing
            try:
                print(f"   ⚙️  Feldolgozás: {pdf_file.name}")
                result = self.pdf_processor.process_pdf(pdf_file)

                if result.get('success'):
                    stats = result.get('stats', {})
                    print(f"      ✅ Egyedi meccsek: {stats.get('unique_matches', 0)}")
                    print(f"      📊 Fogadási opciók: {stats.get('total_betting_options', 0)}")
                    processed_count += 1
                else:
                    print(f"      ❌ Feldolgozási hiba: {result.get('error', 'Unknown error')}")

            except Exception as e:
                print(f"   ❌ Hiba: {pdf_file.name} - {e}")

        print(f"✅ Feldolgozva: {processed_count}/{min(len(pdf_files), 2)} PDF")
        return processed_count > 0

    def update_results(self):
        """Eredmények frissítése"""
        if not self.result_updater:
            print(f"\n❌ ResultUpdater nem elérhető")
            return {'error': 'ResultUpdater not available'}

        print(f"\n🔄 Eredmények frissítése...")

        report = self.result_updater.generate_update_report()
        print(f"   📊 Összes meccs: {report['total_matches']}")
        print(f"   ✅ Eredménnyel: {report['matches_with_results']}")
        print(f"   ❌ Eredmény nélkül: {report['matches_without_results']}")
        print(f"   📈 Befejezettség: {report['completion_rate']:.2%}")

        return report

    def extract_league_tables(self):
        """Liga tabellák kinyerése"""
        if not self.table_extractor:
            print(f"\n❌ LeagueTableExtractor nem elérhető")
            return {'error': 'LeagueTableExtractor not available'}

        print(f"\n📊 Liga tabellák...")

        report = self.table_extractor.generate_table_report()
        print(f"   📈 Összes bejegyzés: {report['total_entries']}")
        print(f"   🏆 Ligák száma: {report['league_count']}")

        for league in report['leagues'][:3]:  # Top 3
            print(f"   📋 {league['league']}: {league['team_count']} csapat")

        return report

    def generate_predictions(self):
        """Predikciók generálása"""
        if not self.prediction_engine:
            print(f"\n❌ SimplePredictionEngine nem elérhető")
            return None

        print(f"\n🔮 Predikciók generálása...")

        today = datetime.now().strftime('%Y-%m-%d')
        todays_matches = self.prediction_engine.get_todays_matches()
        print(f"   ⚽ Mai meccsek: {len(todays_matches)}")

        if not todays_matches:
            print(f"   ℹ️  Nincsenek meccsek ma")
            return None

        predictions = self.prediction_engine.generate_daily_predictions(today)

        print(f"   📊 Összes meccs: {predictions['summary']['total_matches']}")
        print(f"   🎯 Magas bizonyosságú fogadások: {predictions['summary']['high_confidence_bets']}")

        # Sample predictions
        for match_pred in predictions['matches'][:2]:  # Top 2
            print(f"   🏟️  {match_pred['home_team']} vs {match_pred['away_team']}")
            pred = match_pred['predictions']
            print(f"      📈 Valószínűségek: {pred['home_win_prob']:.1%} | {pred['draw_prob']:.1%} | {pred['away_win_prob']:.1%}")

        return predictions

    def run_test_pipeline(self, pdf_directory: str = None):
        """Test pipeline futtatása"""
        print(f"🚀 TESZT PIPELINE INDÍTÁSA")
        print(f"=" * 50)
        print(f"🕒 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 1. PDF feldolgozás (ha van könyvtár)
        if pdf_directory and self.pdf_processor:
            pdf_success = self.process_new_pdfs(pdf_directory)
        else:
            print(f"📁 PDF feldolgozás kihagyva")
            pdf_success = False

        # 2. Eredmények
        result_report = self.update_results()

        # 3. Liga tabellák
        table_report = self.extract_league_tables()

        # 4. Predikciók
        predictions = self.generate_predictions()

        print(f"\n✅ TESZT PIPELINE BEFEJEZVE")
        print(f"=" * 50)

        return {
            'pdf_processed': pdf_success,
            'results': result_report,
            'tables': table_report,
            'predictions': predictions
        }

def main():
    system = WorkingSportPredictionSystem()

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "test" and len(sys.argv) > 2:
            # Test pipeline with PDF directory
            pdf_dir = sys.argv[2]
            result = system.run_test_pipeline(pdf_dir)

        elif command == "predict":
            # Just predictions
            predictions = system.generate_predictions()
            if predictions:
                print(json.dumps(predictions, indent=2, ensure_ascii=False))

        elif command == "status":
            # Just status
            result = system.run_test_pipeline()

        else:
            print("Használat:")
            print("  python3 working_main.py test <pdf_könyvtár>  # Test with PDFs")
            print("  python3 working_main.py predict             # Just predictions")
            print("  python3 working_main.py status              # Just status")
    else:
        # Default: status only
        result = system.run_test_pipeline()

if __name__ == "__main__":
    main()
