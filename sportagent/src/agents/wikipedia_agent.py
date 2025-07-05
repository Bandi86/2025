"""
Wikipedia Sports Agent - Sport adatok gyűjtése Wikipedia-ról
"""
import requests
from bs4 import BeautifulSoup
import re
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import time

from ..utils.logger import Logger
from ..config import Config

class WikipediaAgent:
    """
    Wikipedia sport adatok gyűjtése
    """

    def __init__(self):
        self.logger = Logger('wikipedia_agent')
        self.config = Config()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'SportAgent/1.0 (https://github.com/sportagent; educational purpose)'
        })

        # Wikipedia API endpoint
        self.wiki_api = "https://en.wikipedia.org/api/rest_v1/page/summary/"
        self.wiki_search_api = "https://en.wikipedia.org/w/api.php"

    def get_current_season_data(self, league: str = "Premier League") -> Dict[str, Any]:
        """
        Aktuális szezon adatok lekérése

        Args:
            league: Liga neve

        Returns:
            Dict: Szezon adatok
        """
        try:
            current_year = datetime.now().year
            season_year = f"{current_year-1}-{str(current_year)[2:]}" if datetime.now().month < 8 else f"{current_year}-{str(current_year+1)[2:]}"

            # Keresési kifejezések
            search_terms = [
                f"{league} {season_year}",
                f"{league} {current_year}-{current_year+1}",
                f"{league} {current_year} season"
            ]

            season_data = {}

            for term in search_terms:
                self.logger.info(f"Wikipedia keresés: {term}")

                # Keresés a Wikipedia API-val
                pages = self._search_wikipedia(term)

                if pages:
                    # Legjobb találat feldolgozása
                    page_data = self._get_page_data(pages[0]['title'])
                    if page_data:
                        season_data = page_data
                        break

                time.sleep(1)  # Rate limiting

            return season_data

        except Exception as e:
            self.logger.error(f"Hiba a szezon adatok lekérésében: {str(e)}")
            return {}

    def _search_wikipedia(self, query: str) -> List[Dict[str, Any]]:
        """
        Wikipedia keresés

        Args:
            query: Keresési kifejezés

        Returns:
            List[Dict]: Találatok listája
        """
        try:
            params = {
                'action': 'query',
                'format': 'json',
                'list': 'search',
                'srsearch': query,
                'srlimit': 5
            }

            response = self.session.get(self.wiki_search_api, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if 'query' in data and 'search' in data['query']:
                return data['query']['search']

            return []

        except Exception as e:
            self.logger.error(f"Hiba a Wikipedia keresésben: {str(e)}")
            return []

    def _get_page_data(self, title: str) -> Optional[Dict[str, Any]]:
        """
        Wikipedia oldal adatainak lekérése

        Args:
            title: Oldal címe

        Returns:
            Optional[Dict]: Oldal adatai
        """
        try:
            # Oldal tartalmának lekérése
            content_url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"

            response = self.session.get(content_url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Infobox keresése
            infobox = soup.find('table', class_='infobox')

            page_data = {
                'title': title,
                'url': content_url,
                'source': 'wikipedia',
                'confidence': 0.9,  # Wikipedia magas megbízhatóság
                'data': {}
            }

            if infobox:
                page_data['data'] = self._parse_infobox(infobox)

            # Táblázatok keresése (eredmények, tabella)
            tables = soup.find_all('table', class_='wikitable')
            if tables:
                page_data['tables'] = self._parse_tables(tables)

            return page_data

        except Exception as e:
            self.logger.error(f"Hiba a Wikipedia oldal feldolgozásában: {str(e)}")
            return None

    def _parse_infobox(self, infobox) -> Dict[str, Any]:
        """
        Infobox adatok feldolgozása

        Args:
            infobox: BeautifulSoup infobox elem

        Returns:
            Dict: Strukturált adatok
        """
        data = {}

        try:
            rows = infobox.find_all('tr')

            for row in rows:
                # Kulcs-érték párok keresése
                header = row.find('th')
                cell = row.find('td')

                if header and cell:
                    key = header.get_text(strip=True)
                    value = cell.get_text(strip=True)

                    # Tisztítás és strukturálás
                    if key and value:
                        data[key.lower().replace(' ', '_')] = value

            return data

        except Exception as e:
            self.logger.warning(f"Hiba az infobox feldolgozásában: {str(e)}")
            return {}

    def _parse_tables(self, tables) -> List[Dict[str, Any]]:
        """
        Táblázatok feldolgozása

        Args:
            tables: BeautifulSoup táblázat elemek

        Returns:
            List[Dict]: Táblázat adatok
        """
        table_data = []

        try:
            for table in tables:
                # Fejléc keresése
                headers = []
                header_row = table.find('tr')
                if header_row:
                    header_cells = header_row.find_all(['th', 'td'])
                    headers = [cell.get_text(strip=True) for cell in header_cells]

                if not headers:
                    continue

                # Adatok kinyerése
                rows = table.find_all('tr')[1:]  # Első sor a fejléc
                table_rows = []

                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) >= len(headers):
                        row_data = {}
                        for i, cell in enumerate(cells[:len(headers)]):
                            if i < len(headers):
                                row_data[headers[i].lower().replace(' ', '_')] = cell.get_text(strip=True)
                        table_rows.append(row_data)

                if table_rows:
                    table_data.append({
                        'headers': headers,
                        'rows': table_rows,
                        'type': self._identify_table_type(headers)
                    })

            return table_data

        except Exception as e:
            self.logger.warning(f"Hiba a táblázatok feldolgozásában: {str(e)}")
            return []

    def _identify_table_type(self, headers: List[str]) -> str:
        """
        Táblázat típusának meghatározása

        Args:
            headers: Fejlécek listája

        Returns:
            str: Táblázat típusa
        """
        header_text = ' '.join(headers).lower()

        if any(term in header_text for term in ['position', 'points', 'played', 'wins', 'losses']):
            return 'league_table'
        elif any(term in header_text for term in ['date', 'home', 'away', 'score', 'result']):
            return 'matches'
        elif any(term in header_text for term in ['player', 'goals', 'assists', 'appearances']):
            return 'player_stats'
        else:
            return 'general'

    def get_team_data(self, team_name: str) -> Dict[str, Any]:
        """
        Csapat adatok lekérése

        Args:
            team_name: Csapat neve

        Returns:
            Dict: Csapat adatok
        """
        try:
            # Keresési kifejezések
            search_terms = [
                f"{team_name} FC",
                f"{team_name} Football Club",
                team_name
            ]

            team_data = {}

            for term in search_terms:
                self.logger.info(f"Csapat keresése: {term}")

                pages = self._search_wikipedia(term)

                if pages:
                    # Legjobb találat feldolgozása
                    page_data = self._get_page_data(pages[0]['title'])
                    if page_data:
                        team_data = page_data
                        break

                time.sleep(1)

            return team_data

        except Exception as e:
            self.logger.error(f"Hiba a csapat adatok lekérésében: {str(e)}")
            return {}

    def get_recent_matches(self, team_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Legutóbbi mérkőzések lekérése

        Args:
            team_name: Csapat neve (opcionális)

        Returns:
            List[Dict]: Mérkőzések listája
        """
        try:
            matches = []

            # Általános keresési kifejezések
            search_terms = [
                "Premier League fixtures results",
                "Champions League recent matches",
                "Football results today",
                "English football results"
            ]

            if team_name:
                search_terms.insert(0, f"{team_name} recent matches")
                search_terms.insert(1, f"{team_name} fixtures results")

            for term in search_terms:
                self.logger.info(f"Mérkőzések keresése: {term}")

                pages = self._search_wikipedia(term)

                for page in pages[:2]:  # Maximum 2 oldal per keresés
                    page_data = self._get_page_data(page['title'])
                    if page_data and 'tables' in page_data:
                        for table in page_data['tables']:
                            if table['type'] == 'matches':
                                match_data = self._parse_match_table(table)
                                matches.extend(match_data)

                time.sleep(1)

                if len(matches) >= 10:
                    break

            return matches[:10]  # Maximum 10 mérkőzés

        except Exception as e:
            self.logger.error(f"Hiba a mérkőzések lekérésében: {str(e)}")
            return []

    def _parse_match_table(self, table: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Mérkőzés táblázat feldolgozása

        Args:
            table: Táblázat adatok

        Returns:
            List[Dict]: Mérkőzések listája
        """
        matches = []

        try:
            for row in table['rows']:
                match = {
                    'source': 'wikipedia',
                    'confidence': 0.9
                }

                # Mezők mapping
                for key, value in row.items():
                    if 'date' in key:
                        match['date'] = self._parse_date(value)
                    elif 'home' in key:
                        match['home_team'] = value
                    elif 'away' in key:
                        match['away_team'] = value
                    elif 'score' in key or 'result' in key:
                        scores = self._parse_score(value)
                        if scores:
                            match['home_score'] = scores[0]
                            match['away_score'] = scores[1]
                            match['status'] = 'finished'
                        else:
                            match['status'] = 'scheduled'

                # Csak válid mérkőzések
                if match.get('home_team') and match.get('away_team'):
                    matches.append(match)

            return matches

        except Exception as e:
            self.logger.warning(f"Hiba a mérkőzés táblázat feldolgozásában: {str(e)}")
            return []

    def _parse_date(self, date_str: str) -> Optional[str]:
        """
        Dátum feldolgozása

        Args:
            date_str: Dátum szöveg

        Returns:
            Optional[str]: ISO formátumú dátum
        """
        try:
            # Különböző dátum formátumok
            date_patterns = [
                r'(\d{1,2})\s+(\w+)\s+(\d{4})',  # "15 January 2024"
                r'(\d{1,2})/(\d{1,2})/(\d{4})',  # "15/01/2024"
                r'(\d{4})-(\d{1,2})-(\d{1,2})',  # "2024-01-15"
            ]

            for pattern in date_patterns:
                match = re.search(pattern, date_str)
                if match:
                    if pattern == date_patterns[0]:  # "15 January 2024"
                        day, month_name, year = match.groups()
                        month_names = {
                            'january': '01', 'february': '02', 'march': '03', 'april': '04',
                            'may': '05', 'june': '06', 'july': '07', 'august': '08',
                            'september': '09', 'october': '10', 'november': '11', 'december': '12'
                        }
                        month = month_names.get(month_name.lower(), '01')
                        return f"{year}-{month}-{day.zfill(2)}"
                    elif pattern == date_patterns[1]:  # "15/01/2024"
                        day, month, year = match.groups()
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    elif pattern == date_patterns[2]:  # "2024-01-15"
                        return match.group(0)

            return None

        except Exception as e:
            self.logger.warning(f"Hiba a dátum feldolgozásában: {str(e)}")
            return None

    def _parse_score(self, score_str: str) -> Optional[List[int]]:
        """
        Eredmény feldolgozása

        Args:
            score_str: Eredmény szöveg

        Returns:
            Optional[List[int]]: [hazai, vendég] eredmény
        """
        try:
            # Eredmény minták
            score_patterns = [
                r'(\d+)\s*[-–:]\s*(\d+)',  # "2-1" vagy "2:1"
                r'(\d+)\s*-\s*(\d+)',      # "2 - 1"
            ]

            for pattern in score_patterns:
                match = re.search(pattern, score_str)
                if match:
                    return [int(match.group(1)), int(match.group(2))]

            return None

        except Exception as e:
            self.logger.warning(f"Hiba az eredmény feldolgozásában: {str(e)}")
            return None
