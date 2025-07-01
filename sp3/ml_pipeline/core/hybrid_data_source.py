import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import json
import time
import re
from football_api import FootballDataAPI

class HybridFootballDataSource:
    """
    Hibrid adatforrás: kombinálja az API-t és a web scraping-et
    hogy valós, közelgő meccseket találjunk
    """

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

        # Próbáljuk az API-t is
        try:
            self.api = FootballDataAPI()
            self.api_available = True
        except:
            self.api = None
            self.api_available = False

    def get_upcoming_matches(self, days_ahead=7):
        """
        Jövőbeli meccsek gyűjtése több forrásból
        """
        all_matches = []

        # 1. Próbáljuk az API-t
        if self.api_available:
            print("🔌 Football Data API próbálkozás...")
            try:
                api_matches = self.api.get_upcoming_matches(days_ahead)
                if not api_matches.empty:
                    print(f"✅ API: {len(api_matches)} meccs")
                    all_matches.extend(self._format_api_matches(api_matches))
                else:
                    print("❌ API: Nincs meccs az ingyenes tervben")
            except Exception as e:
                print(f"❌ API hiba: {e}")

        # 2. ESPN scraping (megbízható fixtures oldal)
        espn_matches = self._scrape_espn_fixtures()
        if espn_matches:
            print(f"✅ ESPN: {len(espn_matches)} meccs")
            all_matches.extend(espn_matches)

        # 3. BBC Sport fixtures
        bbc_matches = self._scrape_bbc_sport()
        if bbc_matches:
            print(f"✅ BBC Sport: {len(bbc_matches)} meccs")
            all_matches.extend(bbc_matches)

        # 4. Goal.com fixtures
        goal_matches = self._scrape_goal_com()
        if goal_matches:
            print(f"✅ Goal.com: {len(goal_matches)} meccs")
            all_matches.extend(goal_matches)

        # Deduplikáció és tisztítás
        if all_matches:
            df = pd.DataFrame(all_matches)
            df = self._deduplicate_matches(df)
            df = self._clean_and_validate(df)
            print(f"🧹 Végleges lista: {len(df)} egyedi meccs")
            return df
        else:
            print("❌ Nem találtam meccseket egyik forrásból sem")
            return self._get_mock_matches()  # Fallback mock data

    def _scrape_espn_fixtures(self):
        """ESPN fixtures scraping - nagyon megbízható"""
        matches = []
        try:
            # ESPN soccer fixtures - különböző ligák
            leagues = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1']  # Premier, La Liga, Serie A, Bundesliga, Ligue 1

            for league in leagues:
                try:
                    url = f"https://www.espn.com/soccer/fixtures/_/league/{league}"
                    response = self.session.get(url, timeout=10)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.content, 'html.parser')

                        # ESPN Table structure keresése
                        tables = soup.find_all('table', class_='Table')

                        for table in tables:
                            rows = table.find_all('tr')
                            for row in rows:
                                try:
                                    # Csapat cellák keresése
                                    team_cells = row.find_all('td')
                                    if len(team_cells) >= 2:
                                        # Az első cella általában a csapatok
                                        teams_text = team_cells[0].get_text(strip=True)
                                        time_text = team_cells[1].get_text(strip=True) if len(team_cells) > 1 else ""

                                        # "Team1 vs Team2" vagy "Team1 @ Team2" format keresése
                                        if ' vs ' in teams_text or ' @ ' in teams_text:
                                            separator = ' vs ' if ' vs ' in teams_text else ' @ '
                                            teams = teams_text.split(separator)

                                            if len(teams) == 2:
                                                home_team = teams[0].strip()
                                                away_team = teams[1].strip()

                                                if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                                    matches.append({
                                                        'home_team': home_team,
                                                        'away_team': away_team,
                                                        'time': time_text,
                                                        'league': league,
                                                        'source': 'ESPN'
                                                    })
                                except:
                                    continue

                    time.sleep(1)  # Rate limiting
                except Exception as e:
                    print(f"ESPN {league} hiba: {e}")
                    continue

        except Exception as e:
            print(f"ESPN scraping hiba: {e}")

        return matches

    def _scrape_bbc_sport(self):
        """BBC Sport fixtures scraping"""
        matches = []
        try:
            url = "https://www.bbc.com/sport/football/fixtures"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # BBC Sport fixture elements
                fixture_elements = soup.find_all(['div', 'li'], class_=lambda x: x and any(
                    word in x.lower() for word in ['fixture', 'match', 'game']))

                for element in fixture_elements:
                    try:
                        text = element.get_text(strip=True)

                        # Keresi a "Team1 v Team2" formátumot
                        if ' v ' in text:
                            parts = text.split(' v ')
                            if len(parts) == 2:
                                home_team = parts[0].strip()
                                away_team = parts[1].strip()

                                if self._is_valid_team_name(home_team) and self._is_valid_team_name(away_team):
                                    matches.append({
                                        'home_team': home_team,
                                        'away_team': away_team,
                                        'time': 'TBD',
                                        'source': 'BBC Sport'
                                    })
                    except:
                        continue

        except Exception as e:
            print(f"BBC Sport scraping hiba: {e}")

        return matches

    def _scrape_goal_com(self):
        """Goal.com fixtures scraping"""
        matches = []
        try:
            url = "https://www.goal.com/en/fixtures"
            response = self.session.get(url, timeout=10)

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # Goal.com match elements
                match_elements = soup.find_all(['div', 'a'], class_=lambda x: x and any(
                    word in x.lower() for word in ['match', 'fixture', 'game']))

                for element in match_elements:
                    try:
                        # Csapat neveket keresni span vagy div elemekben
                        team_spans = element.find_all(['span', 'div'])
                        team_texts = [span.get_text(strip=True) for span in team_spans if span.get_text(strip=True)]

                        # Ha van legalább 2 csapat név
                        valid_teams = [text for text in team_texts if self._is_valid_team_name(text)]

                        if len(valid_teams) >= 2:
                            matches.append({
                                'home_team': valid_teams[0],
                                'away_team': valid_teams[1],
                                'time': 'TBD',
                                'source': 'Goal.com'
                            })
                    except:
                        continue

        except Exception as e:
            print(f"Goal.com scraping hiba: {e}")

        return matches

    def _is_valid_team_name(self, name):
        """Ellenőrzi, hogy valódi csapat név-e"""
        if not name or len(name) < 3:
            return False

        # Kizárt szavak (navigáció, időpontok, stb.)
        excluded = ['home', 'away', 'live', 'score', 'time', 'date', 'fixtures',
                   'results', 'table', 'news', 'more', 'view', 'all', 'today',
                   'tomorrow', 'yesterday', 'week', 'month', 'tv', 'watch']

        name_lower = name.lower()
        if any(word in name_lower for word in excluded):
            return False

        # Csak időformátum ellenőrzés
        if re.match(r'^\d{1,2}:\d{2}', name):
            return False

        # Csak számok
        if name.isdigit():
            return False

        return True

    def _format_api_matches(self, api_matches):
        """API matches formázása"""
        formatted = []
        for _, match in api_matches.iterrows():
            formatted.append({
                'home_team': match['home_team'],
                'away_team': match['away_team'],
                'time': match['date'],
                'league': match['competition'],
                'source': 'Football Data API'
            })
        return formatted

    def _deduplicate_matches(self, df):
        """Duplikált meccsek eltávolítása"""
        # Csapat nevek normalizálása összehasonlításhoz
        df['match_key'] = df.apply(lambda row: f"{row['home_team'].lower()} vs {row['away_team'].lower()}", axis=1)

        # Duplikátumok eltávolítása, API eredményeket preferálva
        df['priority'] = df['source'].map({
            'Football Data API': 1,
            'ESPN': 2,
            'BBC Sport': 3,
            'Goal.com': 4
        })

        df = df.sort_values('priority').drop_duplicates(subset=['match_key'], keep='first')
        return df.drop(['match_key', 'priority'], axis=1)

    def _clean_and_validate(self, df):
        """Adatok tisztítása és validálása"""
        # Üres sorok eltávolítása
        df = df.dropna(subset=['home_team', 'away_team'])

        # Túl rövid csapat nevek kiszűrése
        df = df[df['home_team'].str.len() >= 3]
        df = df[df['away_team'].str.len() >= 3]

        # Azonos csapat meccsek kiszűrése
        df = df[df['home_team'] != df['away_team']]

        return df.reset_index(drop=True)

    def _get_mock_matches(self):
        """Fallback mock meccsek, ha minden más sikertelen"""
        print("🎭 Fallback: Mock meccsek generálása...")

        teams = [
            'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham',
            'Barcelona', 'Real Madrid', 'Atletico Madrid', 'Sevilla',
            'Juventus', 'AC Milan', 'Inter', 'Roma',
            'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig',
            'PSG', 'Lyon', 'Marseille'
        ]

        matches = []
        for i in range(10):  # 10 mock meccs
            home = teams[i * 2 % len(teams)]
            away = teams[(i * 2 + 1) % len(teams)]

            matches.append({
                'home_team': home,
                'away_team': away,
                'time': f"20:00",
                'source': 'Mock Data'
            })

        return pd.DataFrame(matches)

if __name__ == "__main__":
    # Teszt
    data_source = HybridFootballDataSource()

    print("🔍 Jövőbeli meccsek keresése (hibrid módszer)...")
    matches = data_source.get_upcoming_matches(days_ahead=7)

    if not matches.empty:
        print(f"\n✅ {len(matches)} meccs találva:")
        print(matches[['home_team', 'away_team', 'source', 'time']].head(15))
    else:
        print("❌ Nem találtam meccseket")
