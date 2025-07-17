"""
Riportgeneráló modul
"""
import os
import json
from datetime import datetime
from typing import List, Dict, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
import logging

class ReportGenerator:
    """
    Sport riportok generálása különböző formátumokban
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.output_dir = 'output/reports'
        self.templates_dir = 'templates'

        # Könyvtárak létrehozása
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.templates_dir, exist_ok=True)

        # Jinja2 környezet beállítása
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )

    def generate_report(self, matches: List[Dict], format: str = 'html', template: str = 'matches_overview') -> str:
        """
        Riport generálása a megadott formátumban
        """
        try:
            if format.lower() == 'html':
                return self._generate_html_report(matches, template)
            elif format.lower() == 'markdown':
                return self._generate_markdown_report(matches, template)
            elif format.lower() == 'json':
                return self._generate_json_report(matches, template)
            elif format.lower() == 'pdf':
                return self._generate_pdf_report(matches, template)
            else:
                raise ValueError(f"Nem támogatott formátum: {format}")

        except Exception as e:
            self.logger.error(f"Riport generálási hiba: {e}")
            raise

    def _generate_html_report(self, matches: List[Dict], template: str) -> str:
        """
        HTML riport generálása
        """
        template_file = f"{template}.html"

        # Ha nincs template, alapértelmezettet hozunk létre
        if not os.path.exists(os.path.join(self.templates_dir, template_file)):
            self._create_default_html_template(template_file)

        template_obj = self.jinja_env.get_template(template_file)

        # Adatok előkészítése
        report_data = {
            'matches': matches,
            'total_matches': len(matches),
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'leagues': list(set(match.get('league', 'Unknown') for match in matches)),
            'summary': self._generate_summary(matches)
        }

        # HTML generálás
        html_content = template_obj.render(**report_data)

        # Fájl mentése
        filename = f"matches_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return filepath

    def _generate_markdown_report(self, matches: List[Dict], template: str) -> str:
        """
        Markdown riport generálása
        """
        content = []

        # Fejléc
        content.append("# Sport Meccsek Riport")
        content.append(f"**Generálva:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        content.append(f"**Meccsek száma:** {len(matches)}")
        content.append("")

        # Összefoglaló
        summary = self._generate_summary(matches)
        content.append("## Összefoglaló")
        for key, value in summary.items():
            content.append(f"- **{key}:** {value}")
        content.append("")

        # Meccsek listája
        content.append("## Meccsek")
        content.append("| Idő | Hazai | Vendég | Liga | Odds |")
        content.append("|-----|-------|--------|------|------|")

        for match in matches:
            time_str = match.get('time', 'TBD')
            home_team = match.get('home_team', 'N/A')
            away_team = match.get('away_team', 'N/A')
            league = match.get('league', 'N/A')
            odds = f"1:{match.get('odds_home', 'N/A')} X:{match.get('odds_draw', 'N/A')} 2:{match.get('odds_away', 'N/A')}"

            content.append(f"| {time_str} | {home_team} | {away_team} | {league} | {odds} |")

        # Fájl mentése
        filename = f"matches_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(content))

        return filepath

    def _generate_json_report(self, matches: List[Dict], template: str) -> str:
        """
        JSON riport generálása
        """
        report_data = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_matches': len(matches),
                'generator': 'SportAgent v1.0'
            },
            'summary': self._generate_summary(matches),
            'matches': matches
        }

        # Fájl mentése
        filename = f"matches_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

        return filepath

    def _generate_pdf_report(self, matches: List[Dict], template: str) -> str:
        """
        PDF riport generálása (HTML-ből)
        """
        # Először HTML generálás
        html_path = self._generate_html_report(matches, template)

        # PDF konverzió (külső könyvtár szükséges)
        try:
            import pdfkit

            pdf_filename = f"matches_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            pdf_filepath = os.path.join(self.output_dir, pdf_filename)

            pdfkit.from_file(html_path, pdf_filepath)

            return pdf_filepath

        except ImportError:
            self.logger.warning("pdfkit nem elérhető, HTML riport visszaadása")
            return html_path
        except Exception as e:
            self.logger.error(f"PDF generálási hiba: {e}")
            return html_path

    def generate_detailed_report(self, analysis: Dict) -> str:
        """
        Részletes meccs elemzés riport
        """
        template_file = "detailed_analysis.html"

        # Ha nincs template, alapértelmezettet hozunk létre
        if not os.path.exists(os.path.join(self.templates_dir, template_file)):
            self._create_detailed_analysis_template(template_file)

        template_obj = self.jinja_env.get_template(template_file)

        # HTML generálás
        html_content = template_obj.render(analysis=analysis, generated_at=datetime.now())

        # Fájl mentése
        filename = f"detailed_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        filepath = os.path.join(self.output_dir, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return filepath

    def _generate_summary(self, matches: List[Dict]) -> Dict:
        """
        Meccsek összefoglaló statisztikái
        """
        if not matches:
            return {}

        leagues = {}
        time_distribution = {}

        for match in matches:
            # Liga eloszlás
            league = match.get('league', 'Unknown')
            leagues[league] = leagues.get(league, 0) + 1

            # Időpont eloszlás
            time_cat = match.get('time_category', 'unknown')
            time_distribution[time_cat] = time_distribution.get(time_cat, 0) + 1

        return {
            'Leggyakoribb liga': max(leagues.items(), key=lambda x: x[1])[0] if leagues else 'N/A',
            'Ligák száma': len(leagues),
            'Leggyakoribb időszak': max(time_distribution.items(), key=lambda x: x[1])[0] if time_distribution else 'N/A',
            'Átlagos fontossági pontszám': round(sum(match.get('importance_score', 0) for match in matches) / len(matches), 2)
        }

    def _create_default_html_template(self, template_file: str):
        """
        Alapértelmezett HTML template létrehozása
        """
        template_content = """<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sport Meccsek Riport</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .match-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 20px;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .match-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .teams {
            font-size: 1.2em;
            font-weight: bold;
            color: #495057;
        }
        .league {
            color: #6c757d;
            font-size: 0.9em;
        }
        .odds {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        .odd {
            background: #007bff;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.9em;
        }
        .time {
            color: #28a745;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚽ Sport Meccsek Riport</h1>
            <p>Generálva: {{ generated_at }}</p>
        </div>

        <div class="content">
            <div class="summary">
                <h2>📊 Összefoglaló</h2>
                <p><strong>Meccsek száma:</strong> {{ total_matches }}</p>
                <p><strong>Ligák:</strong> {{ leagues|join(', ') }}</p>
                {% for key, value in summary.items() %}
                <p><strong>{{ key }}:</strong> {{ value }}</p>
                {% endfor %}
            </div>

            <h2>🏆 Meccsek</h2>
            {% for match in matches %}
            <div class="match-card">
                <div class="match-header">
                    <div class="teams">{{ match.home_team }} vs {{ match.away_team }}</div>
                    <div class="time">{{ match.time }}</div>
                </div>
                <div class="league">{{ match.league }}</div>
                {% if match.odds_home %}
                <div class="odds">
                    <span class="odd">1: {{ match.odds_home }}</span>
                    <span class="odd">X: {{ match.odds_draw }}</span>
                    <span class="odd">2: {{ match.odds_away }}</span>
                </div>
                {% endif %}
            </div>
            {% endfor %}
        </div>
    </div>
</body>
</html>"""

        with open(os.path.join(self.templates_dir, template_file), 'w', encoding='utf-8') as f:
            f.write(template_content)

    def _create_detailed_analysis_template(self, template_file: str):
        """
        Részletes elemzés template létrehozása
        """
        template_content = """<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Részletes Meccs Elemzés</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .prediction {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .factors {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Részletes Meccs Elemzés</h1>
            <p>Generálva: {{ generated_at.strftime('%Y-%m-%d %H:%M:%S') }}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>📋 Meccs Előnézet</h2>
                <p>{{ analysis.match_preview.summary }}</p>
            </div>

            <div class="section">
                <h2>📊 Statisztikai Elemzés</h2>
                <p>{{ analysis.statistical_analysis.attacking_strength }}</p>
            </div>

            <div class="section">
                <h2>💰 Odds Elemzés</h2>
                <p>{{ analysis.odds_analysis.market_sentiment }}</p>
            </div>

            <div class="section prediction">
                <h2>🎯 Előrejelzés</h2>
                <p><strong>Várható eredmény:</strong> {{ analysis.prediction.predicted_result }}</p>
                <p><strong>Bizalom:</strong> {{ analysis.prediction.confidence }}</p>
            </div>

            <div class="section factors">
                <h2>🔑 Kulcs Tényezők</h2>
                <ul>
                {% for factor in analysis.key_factors %}
                    <li>{{ factor }}</li>
                {% endfor %}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>"""

        with open(os.path.join(self.templates_dir, template_file), 'w', encoding='utf-8') as f:
            f.write(template_content)
