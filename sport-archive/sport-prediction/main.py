#!/usr/bin/# Import helyi modulclass SportPredictionSystem:
    def __init__(self):
        self.pdf_processor = SmartTipmmixProcessor()  # Use working processor
        self.result_updater = ResultUpdater()
        self.table_extractor = LeagueTableExtractor()
        self.prediction_engine = SimplePredictionEngine():
    from result_updater_fixed import ResultUpdater
    from league_table_extractor_fixed import LeagueTableExtractor
    from simple_prediction_engine import SimplePredictionEngine
    from smart_tippmix_processor import SmartTippmixProcessor  # Use working processor
except ImportError as e:
    print(f"❌ Hiányzó modul: {e}")
    print("Győződj meg róla, hogy minden fájl létezik!")
    sys.exit(1)3
"""
🚀 SPORT PREDICTION RENDSZER FŐMODUL
Integrált futtatás: PDF feldolgozás -> Eredmény frissítés -> Predikció generálás
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# Import helyi modulok
try:
    from result_updater_fixed import ResultUpdater
    from league_table_extractor_fixed import LeagueTableExtractor
    from simple_prediction_engine import SimplePredictionEngine
    from advanced_tippmix_processor import AdvancedTippmixProcessor
except ImportError as e:
    print(f"❌ Hiányzó modul: {e}")
    print("Győződj meg róla, hogy minden fájl létezik!")
    sys.exit(1)

class SportPredictionSystem:
    def __init__(self):
        self.pdf_processor = AdvancedTippmixProcessor()
        self.result_updater = ResultUpdater()
        self.table_extractor = LeagueTableExtractor()
        self.prediction_engine = SimplePredictionEngine()

    def process_new_pdfs(self, pdf_directory: str):
        """Új PDF fájlok feldolgozása"""
        print(f"📁 PDF feldolgozás: {pdf_directory}")

        pdf_dir = Path(pdf_directory)
        if not pdf_dir.exists():
            print(f"❌ Nem létezik: {pdf_directory}")
            return False

        pdf_files = list(pdf_dir.glob("*.pdf"))
        print(f"📄 Találtunk {len(pdf_files)} PDF fájlt")

        processed_count = 0
        for pdf_file in pdf_files:
            try:
                print(f"   ⚙️  Feldolgozás: {pdf_file.name}")
                self.pdf_processor.process_pdf(pdf_file)  # Pass Path object, not string
                processed_count += 1
            except Exception as e:
                print(f"   ❌ Hiba: {pdf_file.name} - {e}")

        print(f"✅ Feldolgozva: {processed_count}/{len(pdf_files)} PDF")
        return processed_count > 0

    def update_results(self, pdf_directory: str = None):
        """Eredmények frissítése"""
        print(f"\n🔄 Eredmények frissítése...")

        # Jelentés a jelenlegi állapotról
        report = self.result_updater.generate_update_report()
        print(f"   📊 Összes meccs: {report['total_matches']}")
        print(f"   ✅ Eredménnyel: {report['matches_with_results']}")
        print(f"   ❌ Eredmény nélkül: {report['matches_without_results']}")
        print(f"   📈 Befejezettség: {report['completion_rate']:.2%}")

        # Ha van PDF könyvtár, feldolgozzuk az eredményeket
        if pdf_directory:
            pdf_dir = Path(pdf_directory)
            if pdf_dir.exists():
                print(f"   🔍 Eredmények keresése PDF-ekben...")
                # Itt lehetne eredményeket keresni a PDF-ekben

        return report

    def extract_league_tables(self, pdf_directory: str = None):
        """Liga tabellák kinyerése"""
        print(f"\n📊 Liga tabellák kinyerése...")

        # Jelentés a jelenlegi állapotról
        report = self.table_extractor.generate_table_report()
        print(f"   📈 Összes bejegyzés: {report['total_entries']}")
        print(f"   🏆 Ligák száma: {report['league_count']}")

        for league in report['leagues'][:5]:  # Top 5
            print(f"   📋 {league['league']}: {league['team_count']} csapat")

        # Ha van PDF könyvtár, feldolgozzuk a tabellákat
        if pdf_directory:
            pdf_dir = Path(pdf_directory)
            if pdf_dir.exists():
                print(f"   🔍 Tabellák keresése PDF-ekben...")
                # Itt lehetne tabellákat keresni a PDF-ekben

        return report

    def generate_predictions(self, target_date: str = None):
        """Predikciók generálása"""
        print(f"\n🔮 Predikciók generálása...")

        if not target_date:
            target_date = datetime.now().strftime('%Y-%m-%d')

        # Mai meccsek
        todays_matches = self.prediction_engine.get_todays_matches()
        print(f"   ⚽ Mai meccsek: {len(todays_matches)}")

        if not todays_matches:
            print(f"   ℹ️  Nincsenek meccsek {target_date}-re")
            return None

        # Predikciók generálása
        predictions = self.prediction_engine.generate_daily_predictions(target_date)

        print(f"   📊 Összes meccs: {predictions['summary']['total_matches']}")
        print(f"   🎯 Magas bizonyosságú fogadások: {predictions['summary']['high_confidence_bets']}")

        # TOP meccsek megjelenítése
        for match_pred in predictions['matches'][:3]:  # Első 3
            print(f"   🏟️  {match_pred['home_team']} vs {match_pred['away_team']}")
            pred = match_pred['predictions']
            print(f"      📈 {pred['home_win_prob']:.1%} | ❌ {pred['draw_prob']:.1%} | 📉 {pred['away_win_prob']:.1%}")

            if match_pred['recommendations']:
                rec = match_pred['recommendations'][0]
                print(f"      💡 {rec['description']}: {rec['probability']:.1%}")

        # Kombinációk
        if predictions['summary']['recommended_combinations']:
            print(f"   🎲 Ajánlott kombinációk: {len(predictions['summary']['recommended_combinations'])}")
            for combo in predictions['summary']['recommended_combinations'][:2]:  # Top 2
                print(f"      {combo['type']}: {combo['probability']:.1%}")

        return predictions

    def save_daily_report(self, predictions: dict = None):
        """Napi jelentés mentése"""
        today = datetime.now()
        report_file = f"data/daily_reports/report_{today.strftime('%Y_%m_%d')}.json"

        # Könyvtár létrehozása
        Path("data/daily_reports").mkdir(exist_ok=True)

        # Adatok gyűjtése
        result_report = self.result_updater.generate_update_report()
        table_report = self.table_extractor.generate_table_report()

        full_report = {
            'date': today.strftime('%Y-%m-%d'),
            'generated_at': today.isoformat(),
            'results': result_report,
            'tables': table_report,
            'predictions': predictions,
            'summary': {
                'total_matches': result_report['total_matches'],
                'completion_rate': result_report['completion_rate'],
                'active_leagues': table_report['league_count'],
                'daily_matches': len(predictions['matches']) if predictions else 0,
                'recommended_bets': predictions['summary']['high_confidence_bets'] if predictions else 0
            }
        }

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(full_report, f, indent=2, ensure_ascii=False)

        print(f"   💾 Jelentés mentve: {report_file}")
        return report_file

    def run_full_pipeline(self, pdf_directory: str = None):
        """Teljes pipeline futtatása"""
        print(f"🚀 SPORT PREDICTION RENDSZER INDÍTÁSA")
        print(f"=" * 60)
        print(f"🕒 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 1. PDF feldolgozás (ha van új)
        if pdf_directory:
            self.process_new_pdfs(pdf_directory)

        # 2. Eredmények frissítése
        result_report = self.update_results(pdf_directory)

        # 3. Liga tabellák kinyerése
        table_report = self.extract_league_tables(pdf_directory)

        # 4. Predikciók generálása
        predictions = self.generate_predictions()

        # 5. Napi jelentés mentése
        if predictions:
            report_file = self.save_daily_report(predictions)

        print(f"\n✅ PIPELINE BEFEJEZVE")
        print(f"=" * 60)

        return {
            'success': True,
            'results': result_report,
            'tables': table_report,
            'predictions': predictions,
            'report_file': report_file if predictions else None
        }

def main():
    system = SportPredictionSystem()

    # Argumentumok
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "process" and len(sys.argv) > 2:
            # PDF feldolgozás
            pdf_dir = sys.argv[2]
            system.process_new_pdfs(pdf_dir)

        elif command == "predict":
            # Csak predikció
            predictions = system.generate_predictions()
            if predictions:
                print(json.dumps(predictions, indent=2, ensure_ascii=False))

        elif command == "report":
            # Teljes pipeline jelentés nélkül
            result = system.run_full_pipeline()

        elif command == "full":
            # Teljes pipeline PDF könyvtárral
            pdf_dir = sys.argv[2] if len(sys.argv) > 2 else None
            result = system.run_full_pipeline(pdf_dir)

        else:
            print("Használat:")
            print("  python3 main.py process <pdf_könyvtár>  # PDF feldolgozás")
            print("  python3 main.py predict                # Predikciók")
            print("  python3 main.py report                 # Teljes jelentés")
            print("  python3 main.py full <pdf_könyvtár>    # Teljes pipeline")
    else:
        # Alapértelmezett: teljes pipeline
        result = system.run_full_pipeline()

if __name__ == "__main__":
    main()
