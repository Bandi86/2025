import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import json
import time
import re

class RealFootballScraper:
    """
    Valós meccsek scraping-e több megbízható forrásból
    """

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def scrape_livescore(self):
        """
        LiveScore.com scraping - nagyon megbízható source
        """
        matches = []
        print("🔍 LiveScore.com scraping...")

        try:
            url = "https://www.livescore.com/en/football"
            response = self.session.get(url, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # LiveScore match containers keresése
                match_containers = soup.find_all(['div', 'li'], class_=lambda x: x and any(
                    word in x.lower() for word in ['match', 'fixture', 'game', 'event']))

                for container in match_containers:
                    try:
                        # Csapat nevek keresése
                        team_elements = container.find_all(['span', 'div', 'a'],
                                                         string=lambda text: text and len(text.strip()) > 2)

                        # Idő keresése
                        time_elements = container.find_all(['span', 'div'],
                                                         string=lambda text: text and re.match(r'\d{1,2}:\d{2}', str(text)))

                        if len(team_elements) >= 2:
                            home_team = team_elements[0].get_text(strip=True)
                            away_team = team_elements[1].get_text(strip=True)
                            match_time = time_elements[0].get_text(strip=True) if time_elements else "TBD"

                            # Alapszűrés - csak futball csapatnevek
                            if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                matches.append({
                                    'home_team': home_team,
                                    'away_team': away_team,
                                    'time': match_time,
                                    'source': 'LiveScore'
                                })
                    except:
                        continue

        except Exception as e:
            print(f"LiveScore hiba: {e}")

        return matches

    def scrape_sofascore(self):
        """
        SofaScore scraping - jó fixtures source
        """
        matches = []
        print("🔍 SofaScore.com scraping...")

        try:
            # SofaScore football fixtures
            url = "https://www.sofascore.com/football/fixtures"
            response = self.session.get(url, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # SofaScore specifikus elemek
                match_elements = soup.find_all(['div', 'a'], class_=lambda x: x and 'event' in x.lower())

                for element in match_elements:
                    try:
                        text = element.get_text(strip=True)

                        # Csapat vs csapat pattern keresése
                        vs_pattern = r'(.+?)\s+(?:vs|v|VS|V|-)\s+(.+?)(?:\s+\d{1,2}:\d{2})?'
                        match = re.search(vs_pattern, text)

                        if match:
                            home_team = match.group(1).strip()
                            away_team = match.group(2).strip()

                            # Idő keresése
                            time_match = re.search(r'(\d{1,2}:\d{2})', text)
                            match_time = time_match.group(1) if time_match else "TBD"

                            if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                matches.append({
                                    'home_team': home_team,
                                    'away_team': away_team,
                                    'time': match_time,
                                    'source': 'SofaScore'
                                })
                    except:
                        continue

        except Exception as e:
            print(f"SofaScore hiba: {e}")

        return matches

    def scrape_transfermarkt(self):
        """
        Transfermarkt fixtures - nagyon pontos adatok
        """
        matches = []
        print("🔍 Transfermarkt.com scraping...")

        try:
            # Transfermarkt fixtures oldal
            url = "https://www.transfermarkt.com/aktuell/liveticker"
            response = self.session.get(url, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # Transfermarkt table rows
                rows = soup.find_all('tr')

                for row in rows:
                    try:
                        cells = row.find_all(['td', 'th'])
                        if len(cells) >= 3:
                            # Általában: idő | hazai | eredmény | vendég
                            for i, cell in enumerate(cells):
                                text = cell.get_text(strip=True)

                                # vs pattern keresése
                                if ' - ' in text:
                                    parts = text.split(' - ')
                                    if len(parts) == 2:
                                        home_team = parts[0].strip()
                                        away_team = parts[1].strip()

                                        if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                            matches.append({
                                                'home_team': home_team,
                                                'away_team': away_team,
                                                'time': "TBD",
                                                'source': 'Transfermarkt'
                                            })
                                            break
                    except:
                        continue

        except Exception as e:
            print(f"Transfermarkt hiba: {e}")

        return matches

    def scrape_goal_com(self):
        """
        Goal.com fixtures scraping
        """
        matches = []
        print("🔍 Goal.com scraping...")

        try:
            url = "https://www.goal.com/en/fixtures"
            response = self.session.get(url, timeout=15)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # Goal.com specifikus elemek
                match_elements = soup.find_all(['div', 'a'], string=re.compile(r'.+vs.+'))

                for element in match_elements:
                    try:
                        text = element.get_text(strip=True)

                        # vs pattern
                        if ' vs ' in text.lower():
                            parts = text.lower().split(' vs ')
                            if len(parts) == 2:
                                home_team = parts[0].strip().title()
                                away_team = parts[1].strip().title()

                                if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                    matches.append({
                                        'home_team': home_team,
                                        'away_team': away_team,
                                        'time': "TBD",
                                        'source': 'Goal.com'
                                    })
                    except:
                        continue

        except Exception as e:
            print(f"Goal.com hiba: {e}")

        return matches

    def _is_valid_team_name(self, name):
        """
        Érvényes csapatnév ellenőrzése
        """
        if not name or len(name) < 3 or len(name) > 30:
            return False

        # Kizáró szavak
        invalid_words = ['live', 'score', 'time', 'date', 'vs', 'match', 'game',
                        'fixture', 'result', 'goal', 'min', 'ft', 'ht']

        name_lower = name.lower()
        for word in invalid_words:
            if word in name_lower:
                return False

        # Csak számok kizárása
        if name.isdigit():
            return False

        return True

    def get_all_upcoming_matches(self):
        """
        Összes forrásból meccsek gyűjtése
        """
        all_matches = []

        print("🕷️ Valós meccsek scraping-e több forrásból...")

        # Minden scraper futtatása
        scrapers = [
            self.scrape_livescore,
            self.scrape_sofascore,
            self.scrape_transfermarkt,
            self.scrape_goal_com
        ]

        for scraper in scrapers:
            try:
                matches = scraper()
                all_matches.extend(matches)
                print(f"✅ {scraper.__name__}: {len(matches)} meccs")
                time.sleep(2)  # Rate limiting
            except Exception as e:
                print(f"❌ {scraper.__name__} hiba: {e}")

        return self._deduplicate_matches(all_matches)

    def _deduplicate_matches(self, matches):
        """
        Duplikált meccsek eltávolítása
        """
        seen = set()
        unique_matches = []

        for match in matches:
            # Normalizált kulcs létrehozása
            key = f"{match['home_team'].lower().strip()} vs {match['away_team'].lower().strip()}"

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def find_team_ids(self, matches, teams_df):
        """
        Csapatnevek → ID-k mapping az adatbázis alapján
        """
        print("🔍 Csapat ID-k keresése...")

        matched_fixtures = []

        for match in matches:
            home_id = self._find_team_id(match['home_team'], teams_df)
            away_id = self._find_team_id(match['away_team'], teams_df)

            if home_id and away_id and home_id != away_id:
                matched_fixtures.append({
                    'home_team_name': match['home_team'],
                    'away_team_name': match['away_team'],
                    'home_team_id': home_id,
                    'away_team_id': away_id,
                    'time': match['time'],
                    'source': match['source'],
                    'datetime': self._parse_match_time(match['time'])
                })
                print(f"✅ {match['home_team']} ({home_id}) vs {match['away_team']} ({away_id})")
            else:
                print(f"❌ Nem találom: {match['home_team']} vs {match['away_team']}")

        return pd.DataFrame(matched_fixtures)

    def _find_team_id(self, team_name, teams_df):
        """
        Csapat ID keresése többféle egyezéssel
        """
        team_name = team_name.strip()

        # 1. Pontos egyezés
        exact = teams_df[teams_df['displayName'].str.lower() == team_name.lower()]
        if not exact.empty:
            return exact.iloc[0]['teamId']

        # 2. Részleges egyezés
        partial = teams_df[teams_df['displayName'].str.lower().str.contains(team_name.lower(), na=False)]
        if not partial.empty:
            return partial.iloc[0]['teamId']

        # 3. Rövidítés
        abbrev = teams_df[teams_df['abbreviation'].str.lower() == team_name.lower()]
        if not abbrev.empty:
            return abbrev.iloc[0]['teamId']

        # 4. Fuzzy matching (egyszerű)
        for _, team in teams_df.iterrows():
            if team_name.lower() in team['displayName'].lower() or team['displayName'].lower() in team_name.lower():
                return team['teamId']

        return None

    def _parse_match_time(self, time_str):
        """
        Meccs idő parsing
        """
        try:
            if re.match(r'^\d{1,2}:\d{2}$', time_str):
                today = datetime.now().date()
                time_part = datetime.strptime(time_str, '%H:%M').time()
                return datetime.combine(today, time_part)
        except:
            pass

        return datetime.now() + timedelta(hours=1)

if __name__ == "__main__":
    scraper = RealFootballScraper()
    matches = scraper.get_all_upcoming_matches()
    print(f"\n📊 Összesen {len(matches)} egyedi meccs találva")
    for match in matches[:10]:
        print(f"  {match['home_team']} vs {match['away_team']} ({match['source']})")
