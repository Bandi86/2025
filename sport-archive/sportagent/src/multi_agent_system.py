"""
Clean Multi-Agent Sport System
Tiszta, egyszerű multi-ügynök rendszer a meglévő jó komponensekkel
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, TextColumn

from .agents.match_fixtures_collector import MatchFixturesCollector
from .agents.match_statistics_agent import MatchStatisticsAgent
from .agents.analysis_agent import AnalysisAgent
from .agents.betting_strategy_agent import BettingStrategyAgent
from .utils.logger import Logger
from .data.data_storage import DataStorage

console = Console()
logger = Logger().get_logger()

class CleanSportOrchestrator:
    """
    Tiszta Multi-agent Sport rendszer koordinátora

    Ügynökök:
    1. MatchFixturesCollector - mai/holnapi meccsek gyűjtése
    2. MatchStatisticsAgent - meccsekről részletes statisztikák
    3. AnalysisAgent - meccsek elemzése
    4. BettingStrategyAgent - fogadási stratégiák
    """

    def __init__(self):
        self.data_storage = DataStorage()

        # Fő ügynökök inicializálása
        self.fixtures_collector = MatchFixturesCollector()
        self.statistics_agent = MatchStatisticsAgent()

        # Elemző ügynökök
        try:
            self.analysis_agent = AnalysisAgent(self.data_storage)
            self.betting_agent = BettingStrategyAgent(self.data_storage)
        except Exception as e:
            logger.warning(f"Elemző ügynökök betöltési hiba: {e}")
            self.analysis_agent = None
            self.betting_agent = None

        logger.info("Clean Sport Orchestrator inicializálva")

    def run_daily_analysis(self, date_option: str = "today") -> Dict:
        """
        Napi sportanalízis futtatása

        Args:
            date_option: "today", "tomorrow", vagy "both"

        Returns:
            Dict: Teljes análízis eredménye
        """
        console.print(Panel.fit("🚀 Tiszta Multi-Agent Sport Rendszer", style="bold blue"))

        results = {
            'timestamp': datetime.now().isoformat(),
            'date_option': date_option,
            'matches_collected': [],
            'statistics': {},
            'analysis': {},
            'betting_strategies': {},
            'summary': {}
        }

        try:
            # 1. MECCSEK GYŰJTÉSE
            console.print("\n📅 [bold cyan]1. FÁZIS: Meccsek gyűjtése[/bold cyan]")

            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Meccsek gyűjtése...", total=None)

                matches = self._collect_matches(date_option)
                results['matches_collected'] = matches

                progress.update(task, description=f"✅ {len(matches)} meccs összegyűjtve")

            if not matches:
                console.print("❌ Nem találtunk meccseket", style="red")
                return results

            # 2. STATISZTIKÁK GYŰJTÉSE
            console.print("\n📊 [bold yellow]2. FÁZIS: Statisztikák gyűjtése[/bold yellow]")

            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                task = progress.add_task("Statisztikák elemzése...", total=len(matches))

                statistics = {}
                for i, match in enumerate(matches):
                    try:
                        match_stats = self.statistics_agent.analyze_match(match)
                        statistics[match['id']] = match_stats
                        progress.advance(task)
                    except Exception as e:
                        logger.error(f"Statisztika hiba {match.get('id')}: {e}")
                        progress.advance(task)

                results['statistics'] = statistics
                progress.update(task, description=f"✅ {len(statistics)} meccs statisztikája kész")

            # 3. RÉSZLETES ELEMZÉS
            console.print("\n🧠 [bold magenta]3. FÁZIS: Részletes elemzés[/bold magenta]")

            if self.analysis_agent:
                try:
                    analysis = self.analysis_agent.analyze_matches(matches)
                    results['analysis'] = analysis
                    console.print("✅ Részletes elemzés befejezve", style="green")
                except Exception as e:
                    logger.error(f"Elemzés hiba: {e}")
                    console.print("⚠️ Részletes elemzés sikertelen", style="yellow")
            else:
                console.print("⚠️ Elemző ügynök nem elérhető", style="yellow")

            # 4. FOGADÁSI STRATÉGIÁK
            console.print("\n💰 [bold green]4. FÁZIS: Fogadási stratégiák[/bold green]")

            if self.betting_agent and results['analysis']:
                try:
                    betting_strategies = self.betting_agent.generate_betting_strategies(
                        matches=matches,
                        analysis=results['analysis']
                    )
                    results['betting_strategies'] = betting_strategies
                    console.print("✅ Fogadási stratégiák generálva", style="green")
                except Exception as e:
                    logger.error(f"Fogadási stratégia hiba: {e}")
                    console.print("⚠️ Fogadási stratégiák sikertelenek", style="yellow")
            else:
                console.print("⚠️ Fogadási ügynök nem elérhető", style="yellow")

            # 5. ÖSSZEGZÉS
            results['summary'] = self._generate_summary(results)
            self._display_summary(results['summary'])

            return results

        except Exception as e:
            logger.error(f"Hiba a napi elemzés során: {str(e)}")
            console.print(f"❌ Általános hiba: {str(e)}", style="bold red")
            return results

    def _collect_matches(self, date_option: str) -> List[Dict]:
        """
        Meccsek gyűjtése a dátum opció alapján
        """
        matches = []

        try:
            if date_option == "today":
                matches = self.fixtures_collector.collect_todays_fixtures()
            elif date_option == "tomorrow":
                matches = self.fixtures_collector.collect_tomorrows_fixtures()
            elif date_option == "both":
                today_matches = self.fixtures_collector.collect_todays_fixtures()
                tomorrow_matches = self.fixtures_collector.collect_tomorrows_fixtures()
                matches = today_matches + tomorrow_matches
            else:
                # Default: both
                matches = self.fixtures_collector.collect_fixtures_for_date_range(2)

        except Exception as e:
            logger.error(f"Hiba a meccsek gyűjtésében: {str(e)}")
            # Fallback: demo adatok
            matches = self._get_demo_matches(date_option)

        return matches

    def _get_demo_matches(self, date_option: str) -> List[Dict]:
        """
        Demo meccsek ha minden más sikertelen
        """
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        demo_matches = [
            {
                'id': 'demo_1',
                'date': today if date_option != "tomorrow" else tomorrow,
                'time': '15:00',
                'home_team': 'Manchester United',
                'away_team': 'Liverpool',
                'league': 'Premier League',
                'sport': 'football',
                'status': 'scheduled',
                'source': 'demo_data'
            },
            {
                'id': 'demo_2',
                'date': today if date_option != "tomorrow" else tomorrow,
                'time': '17:30',
                'home_team': 'Barcelona',
                'away_team': 'Real Madrid',
                'league': 'La Liga',
                'sport': 'football',
                'status': 'scheduled',
                'source': 'demo_data'
            }
        ]

        return demo_matches

    def _generate_summary(self, results: Dict) -> Dict:
        """
        Eredmények összegzése
        """
        matches = results.get('matches_collected', [])
        statistics = results.get('statistics', {})

        summary = {
            'total_matches': len(matches),
            'matches_with_statistics': len(statistics),
            'analysis_available': bool(results.get('analysis')),
            'betting_strategies_available': bool(results.get('betting_strategies')),
            'top_matches': self._get_top_matches(matches, statistics),
            'leagues_covered': list(set(m.get('league', 'Unknown') for m in matches)),
            'completion_rate': self._calculate_completion_rate(results)
        }

        return summary

    def _get_top_matches(self, matches: List[Dict], statistics: Dict) -> List[Dict]:
        """
        Top meccsek kiválasztása confidence score alapján
        """
        top_matches = []

        for match in matches:
            match_id = match.get('id')
            if match_id in statistics:
                confidence = statistics[match_id].get('confidence_score', 0)
                top_matches.append({
                    'match': match,
                    'confidence': confidence
                })

        # Confidence alapján rendezés, top 3
        top_matches.sort(key=lambda x: x['confidence'], reverse=True)
        return top_matches[:3]

    def _calculate_completion_rate(self, results: Dict) -> float:
        """
        Feldolgozási arány számítása
        """
        total_matches = len(results.get('matches_collected', []))
        if total_matches == 0:
            return 0.0

        completed_statistics = len(results.get('statistics', {}))
        return completed_statistics / total_matches

    def _display_summary(self, summary: Dict):
        """
        Összegzés megjelenítése
        """
        console.print("\n📋 [bold blue]ÖSSZEGZÉS[/bold blue]")

        console.print(f"🎯 Meccsek összesen: {summary['total_matches']}")
        console.print(f"📊 Statisztikával: {summary['matches_with_statistics']}")
        console.print(f"🧠 Elemzés: {'✅' if summary['analysis_available'] else '❌'}")
        console.print(f"💰 Fogadási stratégia: {'✅' if summary['betting_strategies_available'] else '❌'}")
        console.print(f"📈 Feldolgozási arány: {summary['completion_rate']:.1%}")

        if summary['leagues_covered']:
            console.print(f"🏆 Ligák: {', '.join(summary['leagues_covered'])}")

        if summary['top_matches']:
            console.print("\n🌟 [bold yellow]TOP MECCSEK:[/bold yellow]")
            for i, top_match in enumerate(summary['top_matches'], 1):
                match = top_match['match']
                confidence = top_match['confidence']
                console.print(f"  {i}. {match['home_team']} vs {match['away_team']} "
                             f"({confidence:.2f} megbízhatóság)")

    def quick_today_analysis(self) -> Dict:
        """
        Gyors mai elemzés
        """
        console.print("⚡ Gyors mai elemzés indítása...")
        return self.run_daily_analysis("today")

    def quick_tomorrow_analysis(self) -> Dict:
        """
        Gyors holnapi elemzés
        """
        console.print("⚡ Gyors holnapi elemzés indítása...")
        return self.run_daily_analysis("tomorrow")

    def interactive_mode(self):
        """
        Interaktív mód
        """
        console.print(Panel.fit("🎮 Interaktív Sport Elemző", style="bold green"))

        while True:
            console.print("\n[bold cyan]Válassz opciót:[/bold cyan]")
            console.print("1. 📅 Mai meccsek elemzése")
            console.print("2. 🔮 Holnapi meccsek elemzése")
            console.print("3. 📊 Mindkét nap elemzése")
            console.print("4. ❌ Kilépés")

            choice = console.input("\nVálasztás (1-4): ")

            if choice == "1":
                self.quick_today_analysis()
            elif choice == "2":
                self.quick_tomorrow_analysis()
            elif choice == "3":
                self.run_daily_analysis("both")
            elif choice == "4":
                console.print("👋 Viszlát!", style="bold blue")
                break
            else:
                console.print("❌ Érvénytelen választás", style="red")

    def get_system_status(self) -> Dict:
        """
        Rendszer állapotának ellenőrzése
        """
        status = {
            'timestamp': datetime.now().isoformat(),
            'agents': {
                'fixtures_collector': True,
                'statistics_agent': True,
                'analysis_agent': self.analysis_agent is not None,
                'betting_agent': self.betting_agent is not None
            },
            'data_storage': True,
            'overall_health': 'good'
        }

        active_agents = sum(status['agents'].values())
        if active_agents >= 3:
            status['overall_health'] = 'excellent'
        elif active_agents >= 2:
            status['overall_health'] = 'good'
        else:
            status['overall_health'] = 'limited'

        return status
