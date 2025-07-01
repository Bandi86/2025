import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import re
import time
import json

class FootballScraper:
    """
    Web scraping különböző futball oldakról jövőbeli meccsekhez
    """

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def get_upcoming_matches(self, days_ahead=7):
        """
        Jövőbeli meccsek gyűjtése különböző forrásokból
        """
        all_matches = []

        print("🔍 Jövőbeli meccsek keresése web scraping-gel...")

        try:
            # ESPN meccsek
            espn_matches = self._scrape_espn()
            all_matches.extend(espn_matches)
            print(f"✅ ESPN: {len(espn_matches)} meccs")
        except Exception as e:
            print(f"❌ ESPN hiba: {e}")

        try:
            # FlashScore meccsek
            flashscore_matches = self._scrape_flashscore()
            all_matches.extend(flashscore_matches)
            print(f"✅ FlashScore: {len(flashscore_matches)} meccs")
        except Exception as e:
            print(f"❌ FlashScore hiba: {e}")

        try:
            # BBC Sport meccsek
            bbc_matches = self._scrape_bbc_sport()
            all_matches.extend(bbc_matches)
            print(f"✅ BBC Sport: {len(bbc_matches)} meccs")
        except Exception as e:
            print(f"❌ BBC Sport hiba: {e}")

        return self._normalize_matches(all_matches)

    def _scrape_espn(self):
        """ESPN Football fixtures scraping"""
        matches = []

        # ESPN Soccer fixtures URL
        url = "https://www.espn.com/soccer/fixtures"

        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')

            # ESPN meccs elemek keresése
            match_elements = soup.find_all('div', class_='Table__TR')

            for element in match_elements[:20]:  # Első 20 meccs
                try:
                    # Csapat nevek
                    teams = element.find_all('span', class_='Table__Team')
                    if len(teams) >= 2:
                        home_team = teams[0].get_text(strip=True)
                        away_team = teams[1].get_text(strip=True)

                        # Idő/dátum
                        time_elem = element.find('span', class_='game-time')
                        match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

                        matches.append({
                            'home_team': home_team,
                            'away_team': away_team,
                            'datetime': match_time,
                            'source': 'ESPN',
                            'competition': 'Various'
                        })
                except Exception as e:
                    continue

        except Exception as e:
            print(f"ESPN scraping hiba: {e}")

        return matches

    def _scrape_flashscore(self):
        """FlashScore fixtures scraping"""
        matches = []

        # FlashScore soccer URL
        url = "https://www.flashscore.com/football/"

        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')

            # FlashScore meccs elemek (egyszerűsített)
            match_elements = soup.find_all('div', class_=['event__match', 'event'])

            for element in match_elements[:15]:
                try:
                    # Csapat nevek keresése
                    home_elem = element.find('div', class_=['event__homeParticipant', 'participant__participantName'])
                    away_elem = element.find('div', class_=['event__awayParticipant', 'participant__participantName'])

                    if home_elem and away_elem:
                        home_team = home_elem.get_text(strip=True)
                        away_team = away_elem.get_text(strip=True)

                        # Idő
                        time_elem = element.find('div', class_=['event__time', 'event__stage'])
                        match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

                        matches.append({
                            'home_team': home_team,
                            'away_team': away_team,
                            'datetime': match_time,
                            'source': 'FlashScore',
                            'competition': 'Various'
                        })
                except Exception as e:
                    continue

        except Exception as e:
            print(f"FlashScore scraping hiba: {e}")

        return matches

    def _scrape_bbc_sport(self):
        """BBC Sport fixtures scraping"""
        matches = []

        # BBC Sport football URL
        url = "https://www.bbc.com/sport/football/fixtures"

        try:
            response = self.session.get(url, timeout=10)
            soup = BeautifulSoup(response.content, 'html.parser')

            # BBC meccs elemek
            match_elements = soup.find_all('li', class_=['fixture', 'sp-c-fixture'])

            for element in match_elements[:15]:
                try:
                    # Csapat nevek
                    teams = element.find_all('span', class_=['sp-c-fixture__team-name', 'team-name'])

                    if len(teams) >= 2:
                        home_team = teams[0].get_text(strip=True)
                        away_team = teams[1].get_text(strip=True)

                        # Idő
                        time_elem = element.find('span', class_=['sp-c-fixture__time', 'fixture-time'])
                        match_time = time_elem.get_text(strip=True) if time_elem else "TBD"

                        matches.append({
                            'home_team': home_team,
                            'away_team': away_team,
                            'datetime': match_time,
                            'source': 'BBC Sport',
                            'competition': 'Various'
                        })
                except Exception as e:
                    continue

        except Exception as e:
            print(f"BBC Sport scraping hiba: {e}")

        return matches

    def _normalize_matches(self, matches):
        """Meccsek normalizálása egységes formátumra"""
        normalized = []

        for match in matches:
            try:
                # Dátum/idő parsing
                match_datetime = self._parse_datetime(match['datetime'])

                normalized.append({
                    'home_team_name': match['home_team'],
                    'away_team_name': match['away_team'],
                    'datetime': match_datetime,
                    'competition': match.get('competition', 'Unknown'),
                    'source': match['source']
                })
            except Exception as e:
                continue

        return pd.DataFrame(normalized)

    def _parse_datetime(self, time_str):
        """Idő string parsing datetime objektummá"""
        try:
            # Ma + idő (pl. "15:30")
            if re.match(r'^\d{1,2}:\d{2}$', time_str):
                today = datetime.now().date()
                time_part = datetime.strptime(time_str, '%H:%M').time()
                return datetime.combine(today, time_part)

            # Holnap (pl. "Tomorrow 16:00")
            if 'tomorrow' in time_str.lower():
                tomorrow = datetime.now().date() + timedelta(days=1)
                time_match = re.search(r'(\d{1,2}:\d{2})', time_str)
                if time_match:
                    time_part = datetime.strptime(time_match.group(1), '%H:%M').time()
                    return datetime.combine(tomorrow, time_part)

            # Egyéb formátumok...
            return datetime.now() + timedelta(hours=1)  # Default: 1 óra múlva

        except Exception:
            return datetime.now() + timedelta(hours=1)

    def find_team_in_database(self, team_name, teams_df):
        """
        Csapat név alapján ID keresése az adatbázisban
        """
        # Egyszerű név egyezés
        exact_match = teams_df[teams_df['displayName'].str.lower() == team_name.lower()]
        if not exact_match.empty:
            return exact_match.iloc[0]['teamId']

        # Részleges egyezés
        partial_match = teams_df[teams_df['displayName'].str.lower().str.contains(team_name.lower(), na=False)]
        if not partial_match.empty:
            return partial_match.iloc[0]['teamId']

        # Rövidített név egyezés
        abbrev_match = teams_df[teams_df['abbreviation'].str.lower() == team_name.lower()]
        if not abbrev_match.empty:
            return abbrev_match.iloc[0]['teamId']

        return None

    def get_predictions_for_scraped_matches(self, predictor):
        """
        Scraped meccsekre predikciók készítése
        """
        matches_df = self.get_upcoming_matches()

        if matches_df.empty:
            print("❌ Nem találtam jövőbeli meccseket")
            return []

        predictions = []
        teams_df = predictor.teams_df

        print(f"\n🔮 Predikciók készítése {len(matches_df)} meccsre...")

        for _, match in matches_df.iterrows():
            # Csapat ID-k keresése
            home_id = self.find_team_in_database(match['home_team_name'], teams_df)
            away_id = self.find_team_in_database(match['away_team_name'], teams_df)

            if home_id and away_id:
                try:
                    prediction = predictor.predict_match(home_id, away_id)
                    prediction['match_info'] = {
                        'home_team_name': match['home_team_name'],
                        'away_team_name': match['away_team_name'],
                        'datetime': match['datetime'],
                        'competition': match['competition'],
                        'source': match['source']
                    }
                    predictions.append(prediction)
                    print(f"✅ {match['home_team_name']} vs {match['away_team_name']}")
                except Exception as e:
                    print(f"❌ Hiba: {match['home_team_name']} vs {match['away_team_name']} - {e}")
            else:
                print(f"⚠️  Csapat nem található: {match['home_team_name']} vs {match['away_team_name']}")

        return predictions

if __name__ == "__main__":
    # Teszt
    scraper = FootballScraper()
    matches = scraper.get_upcoming_matches()
    print(f"\n📊 Összesen {len(matches)} jövőbeli meccs találva")
    if not matches.empty:
        print(matches.head())
