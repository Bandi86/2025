"""
Multi-Agent Sport Betting System
Fejlett sport elemző és fogadási stratégia rendszer
"""

from datetime import datetime
from typing import Dict, List, Optional
import logging
from rich.console import Console
from rich.panel import Panel
from rich.text import Text

from .agents.data_collector_agent import DataCollectorAgent
# from .agents.analysis_agent import AnalysisAgent
# from .agents.betting_strategy_agent import BettingStrategyAgent
from .utils.logger import Logger
from .data.data_storage import DataStorage

console = Console()
logger = Logger().get_logger()

class SportBettingOrchestrator:
    """
    Multi-agent rendszer koordinátora
    Kezeli az ügynökök közötti kommunikációt és munkamegosztást
    """

    def __init__(self):
        self.data_storage = DataStorage()

        # Ügynökök inicializálása
        self.data_collector = DataCollectorAgent(self.data_storage)

        # Importálás futás közben a circular import elkerülésére
        try:
            from .agents.analysis_agent import AnalysisAgent
            from .agents.betting_strategy_agent import BettingStrategyAgent
            self.analyzer = AnalysisAgent(self.data_storage)
            self.betting_strategist = BettingStrategyAgent(self.data_storage)
        except ImportError as e:
            logger.warning(f"Nem sikerült betölteni az ügynököket: {e}")
            self.analyzer = None
            self.betting_strategist = None

        logger.info("Sport Betting Orchestrator inicializálva")

    def run_full_analysis(self, date: Optional[str] = None, leagues: Optional[List[str]] = None) -> Dict:
        """
        Teljes elemzési folyamat futtatása
        1. Adatgyűjtés
        2. Részletes elemzés
        3. Fogadási stratégia generálás
        """
        console.print(Panel.fit("🤖 Multi-Agent Sport Betting System", style="bold blue"))

        results = {
            'timestamp': datetime.now().isoformat(),
            'date_analyzed': date,
            'leagues': leagues or [],
            'data_collection': {},
            'analysis': {},
            'betting_strategies': {}
        }

        try:
            # 1. ADATGYŰJTÉS FÁZIS
            console.print("\n📡 [bold cyan]FÁZIS 1: Adatgyűjtés[/bold cyan]")
            collection_results = self.data_collector.collect_comprehensive_data(
                date=date,
                leagues=leagues
            )
            results['data_collection'] = collection_results

            if not collection_results.get('matches'):
                console.print("❌ Nem található meccs adat", style="red")
                return results

            # 2. ELEMZÉSI FÁZIS
            console.print("\n🧠 [bold yellow]FÁZIS 2: Részletes Elemzés[/bold yellow]")
            if self.analyzer:
                analysis_results = self.analyzer.analyze_matches(
                    collection_results['matches']
                )
                results['analysis'] = analysis_results
            else:
                console.print("⚠️ Elemző ügynök nem elérhető", style="yellow")
                results['analysis'] = {}

            # 3. FOGADÁSI STRATÉGIA FÁZIS
            console.print("\n💰 [bold green]FÁZIS 3: Fogadási Stratégia[/bold green]")
            if self.betting_strategist and results['analysis']:
                strategy_results = self.betting_strategist.generate_betting_strategies(
                    matches=collection_results['matches'],
                    analysis=results['analysis']
                )
                results['betting_strategies'] = strategy_results
            else:
                console.print("⚠️ Stratégia ügynök nem elérhető", style="yellow")
                results['betting_strategies'] = {}

            # Eredmények megjelenítése
            self._display_final_results(results)

        except Exception as e:
            logger.error(f"Hiba a teljes elemzés során: {e}")
            console.print(f"❌ Hiba történt: {e}", style="red")

        return results

    def interactive_mode(self):
        """
        Interaktív mód - felhasználó választhatja a lépéseket
        """
        console.print(Panel.fit("🎯 Interaktív Multi-Agent Mód", style="bold magenta"))

        while True:
            console.print("\n🔧 [bold]Válassz műveletet:[/bold]")
            console.print("1. 📡 Adatgyűjtés futtatása")
            console.print("2. 🧠 Elemzés készítése")
            console.print("3. 💰 Fogadási stratégia generálás")
            console.print("4. 🚀 Teljes folyamat futtatása")
            console.print("5. 📊 Tárolt adatok megtekintése")
            console.print("0. ❌ Kilépés")

            choice = console.input("\n👉 Választás (0-5): ")

            if choice == "0":
                break
            elif choice == "1":
                self._run_data_collection()
            elif choice == "2":
                self._run_analysis()
            elif choice == "3":
                self._run_betting_strategy()
            elif choice == "4":
                date = console.input("📅 Dátum (YYYY-MM-DD vagy 'today'): ") or "today"
                self.run_full_analysis(date)
            elif choice == "5":
                self._display_stored_data()
            else:
                console.print("❌ Érvénytelen választás!", style="red")

    def _run_data_collection(self):
        """Adatgyűjtés indítása"""
        date = console.input("📅 Dátum (YYYY-MM-DD): ") or "today"
        leagues = console.input("🏆 Ligák (vessző elválasztva, üres=mind): ").split(",")
        leagues = [l.strip() for l in leagues if l.strip()]

        results = self.data_collector.collect_comprehensive_data(date, leagues)
        console.print(f"✅ Összegyűjtve: {len(results.get('matches', []))} meccs")

    def _run_analysis(self):
        """Elemzés futtatása"""
        matches = self.data_storage.get_matches()
        if not matches:
            console.print("❌ Nincs elérhető meccs adat. Először futtass adatgyűjtést!", style="red")
            return

        if not self.analyzer:
            console.print("❌ Elemző ügynök nem elérhető", style="red")
            return

        results = self.analyzer.analyze_matches([match.__dict__ for match in matches])
        console.print(f"✅ Elemzés kész: {len(results.get('detailed_analysis', []))} meccs elemezve")

    def _run_betting_strategy(self):
        """Fogadási stratégia generálás"""
        matches = self.data_storage.get_matches()
        analysis = self.data_storage.get_all_analysis()

        if not matches or not analysis:
            console.print("❌ Nincs elegendő adat. Futtass adatgyűjtést és elemzést!", style="red")
            return

        if not self.betting_strategist:
            console.print("❌ Stratégia ügynök nem elérhető", style="red")
            return

        results = self.betting_strategist.generate_betting_strategies(
            [match.__dict__ for match in matches],
            {'detailed_analysis': [analysis_result.__dict__ for analysis_result in analysis.values()]}
        )
        console.print(f"✅ Stratégia kész: {len(results.get('recommendations', []))} javaslat")

    def _display_stored_data(self):
        """Tárolt adatok megjelenítése"""
        stats = self.data_storage.get_storage_stats()

        console.print("\n📊 [bold]Tárolt Adatok Statisztikái:[/bold]")
        console.print(f"Meccsek: {stats.get('total_matches', 0)}")
        console.print(f"Elemzések: {stats.get('total_analysis', 0)}")
        console.print(f"Stratégiák: {stats.get('total_strategies', 0)}")
        console.print(f"Utolsó frissítés: {stats.get('last_update', 'N/A')}")

    def _display_final_results(self, results: Dict):
        """Végeredmények megjelenítése"""
        console.print("\n🎯 [bold green]VÉGEREDMÉNYEK[/bold green]")

        # Adatgyűjtés statisztikák
        data_stats = results.get('data_collection', {})
        console.print(f"📡 Meccsek: {len(data_stats.get('matches', []))}")
        console.print(f"📊 Források: {len(data_stats.get('sources_used', []))}")

        # Elemzés statisztikák
        analysis_stats = results.get('analysis', {})
        console.print(f"🧠 Elemzett meccsek: {len(analysis_stats.get('detailed_analysis', []))}")
        console.print(f"🎯 Kulcs tényezők: {len(analysis_stats.get('key_insights', []))}")

        # Fogadási stratégiak
        betting_stats = results.get('betting_strategies', {})
        console.print(f"💰 Javaslatok: {len(betting_stats.get('recommendations', []))}")
        console.print(f"🏆 Biztos tippek: {len(betting_stats.get('safe_bets', []))}")
        console.print(f"🎲 Kockázatos tippek: {len(betting_stats.get('risky_bets', []))}")

        # Mentés fájlba
        filename = f"complete_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        self.data_storage.save_complete_analysis(results, filename)
        console.print(f"💾 Eredmények mentve: output/{filename}")

def main():
    """
    Új multi-agent rendszer belépési pontja
    """
    orchestrator = SportBettingOrchestrator()
    orchestrator.interactive_mode()

if __name__ == "__main__":
    main()
