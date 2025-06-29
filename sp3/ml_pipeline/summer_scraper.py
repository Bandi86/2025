import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import json
import time

class SimpleFootballScraper:
    """
    Egyszerűbb, megbízhatóbb scraper nyári meccsekhez
    """

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def get_mock_summer_matches(self):
        """
        Mock nyári meccsek generálása teszteléshez
        (valós scraping helyett, amíg a oldalak változnak)
        """

        # Népszerű csapatok és ligák
        teams = [
            # Premier League
            {'name': 'Arsenal', 'id': 359},
            {'name': 'Chelsea', 'id': 363},
            {'name': 'Liverpool', 'id': 364},
            {'name': 'Manchester City', 'id': 365},
            {'name': 'Manchester United', 'id': 360},
            {'name': 'Tottenham', 'id': 367},

            # La Liga
            {'name': 'Barcelona', 'id': 83},
            {'name': 'Real Madrid', 'id': 86},
            {'name': 'Atletico Madrid', 'id': 179},
            {'name': 'Sevilla', 'id': 559},

            # Serie A
            {'name': 'Juventus', 'id': 111},
            {'name': 'AC Milan', 'id': 104},
            {'name': 'Inter', 'id': 110},
            {'name': 'Roma', 'id': 112},

            # Bundesliga
            {'name': 'Bayern Munich', 'id': 157},
            {'name': 'Borussia Dortmund', 'id': 124},
        ]

        matches = []
        base_date = datetime.now() + timedelta(days=1)

        # Generálok random meccseket
        import random

        for i in range(15):  # 15 mock meccs
            # Random csapatok
            home_team = random.choice(teams)
            away_team = random.choice([t for t in teams if t['id'] != home_team['id']])

            # Random dátum (következő 2 héten belül)
            match_date = base_date + timedelta(days=random.randint(0, 14))
            match_time = match_date.replace(
                hour=random.choice([15, 17, 19, 20, 21]),
                minute=random.choice([0, 30])
            )

            # Random bajnokság
            competition = random.choice([
                'Premier League', 'La Liga', 'Serie A', 'Bundesliga',
                'Champions League', 'Europa League', 'Friendly'
            ])

            matches.append({
                'home_team_name': home_team['name'],
                'away_team_name': away_team['name'],
                'home_team_id': home_team['id'],
                'away_team_id': away_team['id'],
                'datetime': match_time,
                'competition': competition,
                'source': 'Mock Data'
            })

        return pd.DataFrame(matches)

    def try_simple_espn_scrape(self):
        """
        Egyszerű ESPN scraping próba
        """
        matches = []

        try:
            # ESPN scores page
            url = "https://www.espn.com/soccer/schedule"

            response = requests.get(url, headers=self.headers, timeout=15)
            print(f"ESPN válasz státusz: {response.status_code}")

            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')

                # Keresünk meccs elemeket
                # ESPN gyakran dinamikusan tölti be a tartalmat JavaScript-tel
                match_containers = soup.find_all(['div', 'tr', 'li'], class_=lambda x: x and ('match' in x.lower() or 'game' in x.lower() or 'fixture' in x.lower()))

                print(f"Talált potenciális meccs elemek: {len(match_containers)}")

                for container in match_containers[:10]:
                    text = container.get_text(strip=True)
                    if 'vs' in text.lower() or ' - ' in text:
                        matches.append({
                            'raw_text': text,
                            'source': 'ESPN'
                        })

        except Exception as e:
            print(f"ESPN scraping hiba: {e}")

        return matches

    def get_summer_matches_with_fallback(self):
        """
        Nyári meccsek szerzése fallback logikával
        """
        print("🔍 Nyári meccsek keresése...")

        # Először próbáljuk a valós scraping-et
        scraped_matches = self.try_simple_espn_scrape()

        if scraped_matches:
            print(f"✅ Valós scraping: {len(scraped_matches)} nyersadat")
            for match in scraped_matches:
                print(f"   📄 {match['raw_text'][:100]}...")

        # Ha nincs elég adat, használjunk mock adatokat
        print("\n📊 Mock adatok generálása demonstrációhoz...")
        mock_matches = self.get_mock_summer_matches()

        return mock_matches

    def predict_summer_matches(self, predictor):
        """
        Nyári meccsekre predikciók készítése
        """
        matches_df = self.get_summer_matches_with_fallback()

        if matches_df.empty:
            print("❌ Nem találtam nyári meccseket")
            return []

        predictions = []

        print(f"\n🔮 Predikciók készítése {len(matches_df)} nyári meccsre...")
        print("=" * 70)

        for _, match in matches_df.iterrows():
            try:
                home_id = match.get('home_team_id')
                away_id = match.get('away_team_id')

                if home_id and away_id:
                    prediction = predictor.predict_match(home_id, away_id)
                    prediction['match_info'] = match.to_dict()
                    predictions.append(prediction)

                    # Szép kiírás
                    probs = prediction['result_probabilities']
                    print(f"\n🏆 {match['home_team_name']} vs {match['away_team_name']}")
                    print(f"📅 {match['datetime'].strftime('%Y-%m-%d %H:%M')} | {match['competition']}")
                    print(f"📊 🏠 {probs['home_win']}% | 🤝 {probs['draw']}% | ✈️ {probs['away_win']}%")
                    print(f"⚽ Várható gólok: {prediction['expected_total_goals']}")

                    # Tipp
                    if prediction['predicted_result'] == 'H':
                        print(f"🎯 Tipp: 🏠 Hazai győzelem ({prediction['confidence']}% biztos)")
                    elif prediction['predicted_result'] == 'D':
                        print(f"🎯 Tipp: 🤝 Döntetlen ({prediction['confidence']}% biztos)")
                    else:
                        print(f"🎯 Tipp: ✈️ Vendég győzelem ({prediction['confidence']}% biztos)")

                    # Fogadási tipp
                    if prediction['expected_total_goals'] > 2.5:
                        print(f"💰 Over 2.5 gól: Valószínű")
                    else:
                        print(f"🛡️  Under 2.5 gól: Valószínű")

                    print("-" * 70)

            except Exception as e:
                print(f"❌ Hiba: {match.get('home_team_name', 'Unknown')} vs {match.get('away_team_name', 'Unknown')} - {e}")

        return predictions

if __name__ == "__main__":
    # Teszt
    scraper = SimpleFootballScraper()
    matches = scraper.get_summer_matches_with_fallback()
    print(f"\n📊 Összesen {len(matches)} nyári meccs")
    print(matches.head())
