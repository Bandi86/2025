"""
Sport Agent - Fő osztály és alkalmazás belépési pont
"""
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress
from rich.panel import Panel

# Helyi importok
from .config import Config
from .scrapers.match_scraper import MatchScraper
from .apis.sports_api import SportsAPI
from .data.data_processor import DataProcessor
from .data.demo_data import DemoData
from .reports.report_generator import ReportGenerator
from .utils.date_utils import DateUtils
from .utils.logger import Logger

console = Console()
logger = Logger().get_logger()

class SportAgent:
    """
    Sport Agent főosztálya - koordinálja az adatgyűjtést, elemzést és riportgenerálást
    """

    def __init__(self):
        self.config = Config()
        self.match_scraper = MatchScraper()
        self.sports_api = SportsAPI()
        self.data_processor = DataProcessor()
        self.report_generator = ReportGenerator()
        self.date_utils = DateUtils()

    def collect_matches(self, date: str = None, demo_mode: bool = False) -> List[Dict]:
        """
        Meccsek gyűjtése a megadott dátumra
        """
        target_date = self.date_utils.parse_date(date) if date else datetime.now() + timedelta(days=1)

        console.print(f"🔍 Meccsek keresése erre a dátumra: {target_date.strftime('%Y-%m-%d')}", style="bold blue")

        # Demo mód esetén tesztadatokat használunk
        if demo_mode:
            console.print("🎭 Demo mód aktiválva - tesztadatok használata", style="yellow")
            demo_matches = DemoData.get_demo_matches(target_date)
            processed_matches = self.data_processor.process_matches(demo_matches)
            console.print(f"✅ Demo: {len(processed_matches)} meccs betöltve", style="bold green")
            return processed_matches

        matches = []

        with Progress() as progress:
            task = progress.add_task("Adatgyűjtés...", total=100)

            # Web scraping
            progress.update(task, advance=30)
            scraped_matches = self.match_scraper.scrape_matches(target_date)
            matches.extend(scraped_matches)

            # API hívások
            progress.update(task, advance=40)
            api_matches = self.sports_api.get_matches(target_date)
            matches.extend(api_matches)

            # Adatok feldolgozása
            progress.update(task, advance=30)
            processed_matches = self.data_processor.process_matches(matches)

        console.print(f"✅ Összesen {len(processed_matches)} meccs találva", style="bold green")
        return processed_matches

    def generate_report(self, matches: List[Dict], output_format: str = 'html') -> str:
        """
        Riport generálása a meccsekről
        """
        console.print("📝 Riport generálása...", style="bold yellow")

        report_path = self.report_generator.generate_report(
            matches=matches,
            format=output_format,
            template='matches_overview'
        )

        console.print(f"✅ Riport elkészült: {report_path}", style="bold green")
        return report_path

    def analyze_match(self, match_id: str, demo_mode: bool = False) -> Dict:
        """
        Egy konkrét meccs részletes elemzése
        """
        console.print(f"🎯 Részletes elemzés: {match_id}", style="bold magenta")

        # Demo mód esetén tesztadatokat használunk
        if demo_mode:
            console.print("🎭 Demo elemzés betöltése", style="yellow")
            return DemoData.get_demo_match_analysis(match_id)

        # Meccs adatok lekérése
        match_data = self.sports_api.get_match_details(match_id)

        # Statisztikák
        stats = self.sports_api.get_match_statistics(match_id)

        # Odds adatok
        odds = self.sports_api.get_match_odds(match_id)

        # Korábbi találkozók
        head_to_head = self.sports_api.get_head_to_head(match_data['home_team'], match_data['away_team'])

        analysis = {
            'match_data': match_data,
            'statistics': stats,
            'odds': odds,
            'head_to_head': head_to_head,
            'analysis': self.data_processor.analyze_match(match_data, stats, odds, head_to_head)
        }

        return analysis

    def interactive_mode(self, demo_mode: bool = False):
        """
        Interaktív mód - felhasználó választhat meccseket
        """
        console.print(Panel.fit("🏆 Sport Agent - Interaktív Mód", style="bold blue"))

        # Demo mód jelzése
        if demo_mode:
            console.print("🎭 Demo mód aktiválva", style="yellow")

        # Dátum bekérése
        date_input = click.prompt("Milyen dátumra keresel meccseket? (YYYY-MM-DD vagy 'tomorrow')", default="tomorrow")

        # Meccsek gyűjtése
        matches = self.collect_matches(date_input, demo_mode)

        if not matches:
            console.print("❌ Nem találtam meccseket erre a dátumra", style="bold red")
            return

        # Meccsek listázása
        self._display_matches_table(matches)

        # Riport generálás
        generate_report = click.confirm("Készítsek riportot ezekről a meccsekről?", default=True)
        if generate_report:
            format_choice = click.prompt("Milyen formátumban? (html/markdown/json)", default="html")
            report_path = self.generate_report(matches, format_choice)

            if click.confirm("Megnyitod a riportot?", default=True):
                os.system(f"xdg-open {report_path}")

        # Részletes elemzés
        if click.confirm("Szeretnél részletes elemzést egy meccsről?", default=False):
            match_choice = click.prompt("Melyik meccs? (add meg a sorszámot)", type=int)

            if 1 <= match_choice <= len(matches):
                selected_match = matches[match_choice - 1]
                analysis = self.analyze_match(selected_match['id'], demo_mode)

                detailed_report = self.report_generator.generate_detailed_report(analysis)
                console.print(f"📊 Részletes elemzés elkészült: {detailed_report}", style="bold green")

                if click.confirm("Megnyitod a részletes elemzést?", default=True):
                    os.system(f"xdg-open {detailed_report}")

    def _display_matches_table(self, matches: List[Dict]):
        """
        Meccsek táblázatos megjelenítése
        """
        table = Table(title="Találatok")
        table.add_column("#", style="cyan", no_wrap=True)
        table.add_column("Idő", style="magenta")
        table.add_column("Hazai", style="green")
        table.add_column("Vendég", style="red")
        table.add_column("Liga", style="blue")
        table.add_column("Odds", style="yellow")

        for i, match in enumerate(matches, 1):
            table.add_row(
                str(i),
                match.get('time', 'N/A'),
                match.get('home_team', 'N/A'),
                match.get('away_team', 'N/A'),
                match.get('league', 'N/A'),
                f"1:{match.get('odds_home', 'N/A')} X:{match.get('odds_draw', 'N/A')} 2:{match.get('odds_away', 'N/A')}"
            )

        console.print(table)

@click.command()
@click.option('--date', '-d', help='Dátum (YYYY-MM-DD formátumban vagy "tomorrow")')
@click.option('--interactive', '-i', is_flag=True, help='Interaktív mód')
@click.option('--format', '-f', default='html', help='Riport formátum (html/markdown/json)')
@click.option('--demo', is_flag=True, help='Demo mód tesztadatokkal')
def main(date, interactive, format, demo):
    """
    Sport Agent - Intelligens sportadatok gyűjtője és elemzője
    """
    agent = SportAgent()

    if interactive:
        agent.interactive_mode(demo_mode=demo)
    else:
        matches = agent.collect_matches(date, demo_mode=demo)
        if matches:
            report_path = agent.generate_report(matches, format)
            console.print(f"🎉 Kész! Riport: {report_path}", style="bold green")
        else:
            console.print("❌ Nem találtam meccseket", style="bold red")

if __name__ == "__main__":
    main()
