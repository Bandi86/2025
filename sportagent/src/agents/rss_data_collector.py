"""
RSS Feed alapú adatgyűjtő
Sport RSS feed-ek olvasása és feldolgozása
"""

import feedparser
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import re
from urllib.parse import urljoin

from ..utils.logger import Logger

logger = Logger().get_logger()

class RSSDataCollector:
    """
    RSS feed-ek alapú sport adatgyűjtő
    """

    def __init__(self):
        self.logger = Logger().get_logger()

        # RSS feed források
        self.rss_sources = {
            'bbc_sport': 'http://feeds.bbci.co.uk/sport/rss.xml',
            'sky_sports': 'https://www.skysports.com/rss/12040',
            'espn': 'https://www.espn.com/espn/rss/news',
            'goal': 'https://www.goal.com/feeds/news',
            'marca': 'https://www.marca.com/rss/futbol.xml',
            'sport1': 'https://www.sport1.de/rss.xml',
            'eurosport': 'https://www.eurosport.com/rss.xml'
        }

        logger.info("RSS Data Collector inicializálva")

    def collect_rss_data(self, max_entries: int = 50) -> Dict[str, Any]:
        """
        RSS feed-ek olvasása és feldolgozása
        """
        logger.info("RSS adatgyűjtés kezdése...")

        results = {
            'matches': [],
            'news': [],
            'teams': set(),
            'leagues': set(),
            'sources_used': [],
            'last_updated': datetime.now().isoformat()
        }

        for source_name, rss_url in self.rss_sources.items():
            try:
                logger.info(f"RSS olvasás: {source_name}")

                # RSS feed olvasása
                feed = feedparser.parse(rss_url)

                if feed.bozo:
                    logger.warning(f"RSS feed hiba: {source_name}")
                    continue

                # Bejegyzések feldolgozása
                entries = feed.entries[:max_entries]

                for entry in entries:
                    processed_entry = self._process_rss_entry(entry, source_name)

                    if processed_entry:
                        if processed_entry.get('type') == 'match':
                            results['matches'].append(processed_entry)
                        else:
                            results['news'].append(processed_entry)

                        # Csapatok és ligák gyűjtése
                        if 'teams' in processed_entry:
                            results['teams'].update(processed_entry['teams'])
                        if 'league' in processed_entry:
                            results['leagues'].add(processed_entry['league'])

                results['sources_used'].append(source_name)
                logger.info(f"✅ RSS feldolgozva: {source_name} ({len(entries)} bejegyzés)")

            except Exception as e:
                logger.error(f"RSS hiba {source_name}: {e}")

        # Eredmények tisztítása
        results['teams'] = list(results['teams'])
        results['leagues'] = list(results['leagues'])

        logger.info(f"RSS adatgyűjtés befejezve: {len(results['matches'])} meccs, {len(results['news'])} hír")
        return results

    def _process_rss_entry(self, entry: Any, source: str) -> Optional[Dict]:
        """
        RSS bejegyzés feldolgozása
        """
        try:
            title = entry.get('title', '')
            description = entry.get('description', '')
            link = entry.get('link', '')
            published = entry.get('published_parsed')

            # Dátum konvertálás
            if published:
                pub_date = datetime(*published[:6])
            else:
                pub_date = datetime.now()

            # Meccs detektálás kulcsszavak alapján
            match_indicators = ['vs', 'v ', ' - ', 'against', 'fixtures', 'results']
            is_match = any(indicator in title.lower() for indicator in match_indicators)

            if is_match:
                match_data = self._extract_match_info(title, description, link, pub_date, source)
                if match_data:
                    return match_data

            # Hírek feldolgozása
            return {
                'type': 'news',
                'title': title,
                'description': description,
                'link': link,
                'published': pub_date.isoformat(),
                'source': source,
                'teams': self._extract_teams_from_text(title + ' ' + description),
                'league': self._extract_league_from_text(title + ' ' + description)
            }

        except Exception as e:
            logger.error(f"RSS bejegyzés feldolgozási hiba: {e}")
            return None

    def _extract_match_info(self, title: str, description: str, link: str,
                           pub_date: datetime, source: str) -> Optional[Dict]:
        """
        Meccs információk kinyerése
        """
        try:
            # Csapatok kinyerése
            teams = self._extract_teams_from_match_title(title)

            if len(teams) >= 2:
                # Időpont becslés
                match_date = self._estimate_match_date(title, description, pub_date)

                # Liga kinyerése
                league = self._extract_league_from_text(title + ' ' + description)

                return {
                    'type': 'match',
                    'home_team': teams[0],
                    'away_team': teams[1],
                    'date': match_date.strftime('%Y-%m-%d'),
                    'time': match_date.strftime('%H:%M'),
                    'league': league or 'Unknown',
                    'status': 'scheduled',
                    'source': source,
                    'link': link,
                    'teams': teams,
                    'confidence_score': 0.6,  # RSS alapú becslés
                    'data_completeness': 0.4
                }

            return None

        except Exception as e:
            logger.error(f"Meccs info kinyerési hiba: {e}")
            return None

    def _extract_teams_from_match_title(self, title: str) -> List[str]:
        """
        Csapatok kinyerése a meccs címből
        """
        teams = []

        # Különböző separátorok próbálása
        separators = [' vs ', ' v ', ' - ', ' against ', ' x ']

        for sep in separators:
            if sep in title.lower():
                parts = title.split(sep)
                if len(parts) >= 2:
                    home_team = parts[0].strip()
                    away_team = parts[1].strip()

                    # Tisztítás
                    home_team = re.sub(r'[^\w\s]', '', home_team).strip()
                    away_team = re.sub(r'[^\w\s]', '', away_team).strip()

                    if home_team and away_team:
                        teams = [home_team, away_team]
                        break

        return teams

    def _extract_teams_from_text(self, text: str) -> List[str]:
        """
        Csapatok kinyerése tetszőleges szövegből
        """
        # Ismert csapatnevek (bővíthető)
        known_teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester United', 'Manchester City',
            'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
            'Barcelona', 'Real Madrid', 'Atletico Madrid', 'Valencia', 'Sevilla',
            'Bayern Munich', 'Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
            'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma',
            'PSG', 'Marseille', 'Lyon', 'Monaco'
        ]

        found_teams = []

        for team in known_teams:
            if team.lower() in text.lower():
                found_teams.append(team)

        return found_teams

    def _extract_league_from_text(self, text: str) -> Optional[str]:
        """
        Liga kinyerése szövegből
        """
        leagues = {
            'premier league': 'Premier League',
            'la liga': 'La Liga',
            'serie a': 'Serie A',
            'bundesliga': 'Bundesliga',
            'ligue 1': 'Ligue 1',
            'champions league': 'Champions League',
            'europa league': 'Europa League',
            'championship': 'Championship',
            'primera division': 'La Liga'
        }

        text_lower = text.lower()

        for key, value in leagues.items():
            if key in text_lower:
                return value

        return None

    def _estimate_match_date(self, title: str, description: str, pub_date: datetime) -> datetime:
        """
        Meccs dátum becslése
        """
        # Időpontok keresése a szövegben
        text = title + ' ' + description

        # "Today", "Tomorrow", "Sunday" típusú kifejezések
        today = datetime.now().date()

        if 'today' in text.lower():
            return datetime.combine(today, datetime.min.time().replace(hour=15))
        elif 'tomorrow' in text.lower():
            return datetime.combine(today + timedelta(days=1), datetime.min.time().replace(hour=15))
        elif 'weekend' in text.lower():
            days_until_weekend = (5 - today.weekday()) % 7
            if days_until_weekend == 0:
                days_until_weekend = 7
            return datetime.combine(today + timedelta(days=days_until_weekend), datetime.min.time().replace(hour=15))

        # Dátum regex keresése
        date_patterns = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',  # DD/MM/YYYY
            r'(\d{1,2})-(\d{1,2})-(\d{4})',  # DD-MM-YYYY
            r'(\d{4})-(\d{1,2})-(\d{1,2})'   # YYYY-MM-DD
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    if pattern.startswith(r'(\d{4}'):  # YYYY-MM-DD
                        year, month, day = map(int, match.groups())
                    else:  # DD/MM/YYYY vagy DD-MM-YYYY
                        day, month, year = map(int, match.groups())

                    return datetime(year, month, day, 15, 0)  # 15:00 alapértelmezett
                except ValueError:
                    continue

        # Ha nincs konkrét dátum, akkor a publikálás dátuma + 1-7 nap
        return pub_date + timedelta(days=1)

    def get_available_sources(self) -> List[str]:
        """
        Elérhető RSS források listája
        """
        return list(self.rss_sources.keys())

    def test_rss_source(self, source_name: str) -> bool:
        """
        RSS forrás tesztelése
        """
        if source_name not in self.rss_sources:
            return False

        try:
            feed = feedparser.parse(self.rss_sources[source_name])
            return not feed.bozo and len(feed.entries) > 0
        except:
            return False

    def add_custom_rss_source(self, name: str, url: str) -> bool:
        """
        Egyéni RSS forrás hozzáadása
        """
        try:
            # Tesztelés
            feed = feedparser.parse(url)
            if not feed.bozo:
                self.rss_sources[name] = url
                logger.info(f"RSS forrás hozzáadva: {name}")
                return True
            return False
        except:
            return False
