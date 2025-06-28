#!/usr/bin/env python3
"""
🌅 NAP        self.league_configs = {
            'premier_league': {
                'name': 'Premier League',
                'data_files': ['data/premier_league/pl2223.csv', 'data/premier_league/pl2324.csv', 'data/premier_league/pl2425.csv'],
                'teams': ['Arsenal', 'Chelsea', 'Man City', 'Liverpool', 'Man United', 'Tottenham',
                         'Newcastle', 'Brighton', 'Everton', 'Fulham', 'West Ham', 'Crystal Palace',
                         'Wolves', 'Brentford', 'Aston Villa', 'Bournemouth', 'Leicester', 'Southampton',
                         'Nott\'m Forest', 'Sheffield Utd', 'Burnley', 'Luton']
            },I ASSZISZTENS
Minden reggel automatikusan elemzi az aznapi meccseket és ad javaslatokat.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core'))

try:
    from realistic_betting_system import RealisticBettingSystem
    from data_loader import load_data
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

class DailyBettingAssistant:
    """Napi fogadási asszisztens."""

    def __init__(self, league='premier_league'):
        self.system = RealisticBettingSystem()
        self.bankroll = 1000.0
        self.max_daily_risk = 0.08  # Max 8% naponta

        # Liga beállítás
        self.league = league
        self.league_configs = {
            'premier_league': {
                'name': 'Premier League',
                'data_files': ['pl2223.csv', 'pl2324.csv', 'pl2425.csv'],
                'teams': ['Arsenal', 'Chelsea', 'Man City', 'Liverpool', 'Man United', 'Tottenham',
                         'Newcastle', 'Brighton', 'Everton', 'Fulham', 'West Ham', 'Crystal Palace',
                         'Wolves', 'Brentford', 'Aston Villa', 'Bournemouth', 'Leicester', 'Southampton',
                         'Nott\'m Forest', 'Sheffield Utd', 'Burnley', 'Luton']
            },
            'mls': {
                'name': 'Major League Soccer',
                'data_files': ['data/mls/mls_2024_sample.csv'],
                'teams': ['LA Galaxy', 'LAFC', 'Seattle Sounders', 'Portland Timbers', 'Inter Miami',
                         'Atlanta United', 'New York City FC', 'New York Red Bulls', 'Chicago Fire',
                         'Columbus Crew', 'Nashville SC', 'Orlando City', 'Philadelphia Union']
            },
            'brasileirao': {
                'name': 'Brasileirão Serie A',
                'data_files': ['data/brasileirao/brasileirao_2024_sample.csv'],
                'teams': ['Flamengo', 'Palmeiras', 'São Paulo', 'Corinthians', 'Santos', 'Grêmio',
                         'Internacional', 'Atletico MG', 'Botafogo', 'Vasco da Gama', 'Fluminense',
                         'Cruzeiro', 'Bahia', 'Fortaleza', 'Red Bull Bragantino', 'Athletico PR']
            },
            'j_league': {
                'name': 'J1 League',
                'data_files': ['data/j_league/j_league_2024_sample.csv'],
                'teams': ['Vissel Kobe', 'Sanfrecce Hiroshima', 'Machida Zelvia', 'Gamba Osaka',
                         'Yokohama F. Marinos', 'FC Tokyo', 'Urawa Red Diamonds', 'Kashima Antlers',
                         'Cerezo Osaka', 'Avispa Fukuoka', 'Nagoya Grampus', 'Kawasaki Frontale']
            }
        }

        # Minőségi szűrők
        self.min_edge = 0.05
        self.min_confidence = 0.4

    def load_data_and_models(self):
        """Adatok betöltése és modellek építése."""
        league_config = self.league_configs.get(self.league)
        if not league_config:
            print(f"❌ Ismeretlen liga: {self.league}")
            return False

        print(f"📚 {league_config['name']} múltbeli adatok elemzése...")

        # Adatok betöltése a liga konfigurációja alapján
        try:
            self.historical_df = load_data(league_config['data_files'])
        except Exception as e:
            print(f"❌ Adatok betöltése sikertelen: {e}")
            return False

        self.team_stats = self.system.build_team_models(self.historical_df)
        print(f"✅ {league_config['name']} modellek készen állnak!\n")
        return True

    def get_todays_matches(self):
        """Mai meccsek lekérése (CSAK valódi API adatok!)."""
        today = datetime.now()
        weekday = today.weekday()  # 0=Hétfő, 6=Vasárnap

        league_config = self.league_configs.get(self.league)
        if not league_config:
            print(f"❌ Ismeretlen liga: {self.league}")
            return [], weekday

        # Először próbáljunk valódi API adatokat lekérni
        real_matches = self._try_get_real_matches()
        if real_matches:
            print(f"✅ {len(real_matches)} valódi mérkőzés találva!")
            return real_matches, weekday

        # Ha nincs API vagy nincs mérkőzés, ellenőrizzük a szezon státuszát
        season_status = self._check_season_status()
        if not season_status['active']:
            print(f"⚠️ {league_config['name']} szezon jelenleg INAKTÍV!")
            print(f"📅 Következő szezon: {season_status['next_season']}")
            return [], weekday

        # Nincs valódi adat - NEM generálunk fake meccseket!
        print(f"⚠️ {league_config['name']}: Nincs valódi mérkőzés ma!")
        print(f"💡 Valódi adatokhoz állítsd be: export API_SPORTS_KEY='your_key'")
        print(f"🔗 Alternatíva: Látogasd meg az ESPN vagy más sport oldalt")

        # Visszaadunk üres listát - nincs fake adat!
        return [], weekday

    def _try_get_real_matches(self):
        """Valódi API adatok lekérése."""
        try:
            # Importáljuk a live API client-et
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))
            from live_api_client import LiveAPIClient

            # API kulcs ellenőrzése
            api_key = os.getenv('API_SPORTS_KEY')
            if not api_key:
                return None

            # API kliens létrehozása és tesztelése
            client = LiveAPIClient(api_key)
            if not client.test_connection():
                return None

            # Mai mérkőzések lekérése
            fixtures = client.get_todays_fixtures(self.league)
            if not fixtures:
                return None

            # Konvertálás a belső formátumra
            converted_matches = []
            for fixture in fixtures[:6]:  # Max 6 mérkőzés
                home_team = fixture['teams']['home']['name']
                away_team = fixture['teams']['away']['name']

                # Odds lekérése (ha elérhető)
                odds = client.get_odds(fixture['fixture']['id'])
                if odds:
                    home_odd = odds.get('home', 2.0)
                    draw_odd = odds.get('draw', 3.0)
                    away_odd = odds.get('away', 3.0)
                else:
                    # Alapértelmezett odds ha nincs
                    home_odd, draw_odd, away_odd = 2.0, 3.0, 3.0

                converted_matches.append((home_team, away_team, home_odd, draw_odd, away_odd))

            return converted_matches

        except Exception as e:
            print(f"⚠️ API hiba: {e}")
            return None

    def _check_season_status(self):
        """Szezon státusz ellenőrzése."""
        current_date = datetime.now()
        current_month = current_date.month

        season_info = {
            'premier_league': {
                'active_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],  # Augusztus-Május
                'break_months': [6, 7],  # Nyári szünet
                'next_season': '2025 Augusztus'
            },
            'mls': {
                'active_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],  # Február-November
                'break_months': [12, 1],  # Téli szünet
                'next_season': '2026 Február'
            },
            'brasileirao': {
                'active_months': [4, 5, 6, 7, 8, 9, 10, 11, 12],  # Április-December
                'break_months': [1, 2, 3],  # Nyári szünet (déli félteke)
                'next_season': '2026 Április'
            },
            'j_league': {
                'active_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],  # Február-December
                'break_months': [1],  # Téli szünet
                'next_season': '2026 Február'
            }
        }

        league_season = season_info.get(self.league, {})
        active_months = league_season.get('active_months', [])

        return {
            'active': current_month in active_months,
            'next_season': league_season.get('next_season', 'Ismeretlen'),
            'current_month': current_month,
            'active_months': active_months
        }

    def analyze_todays_opportunities(self):
        """Mai fogadási lehetőségek elemzése."""
        matches, weekday = self.get_todays_matches()

        league_config = self.league_configs.get(self.league, {})
        league_name = league_config.get('name', self.league.upper())

        day_names = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"]
        today_name = day_names[weekday]

        print(f"📅 {today_name.upper()} - {league_name.upper()} MECCSEK ELEMZÉSE")
        print("=" * 60)

        if not matches:
            print(f"❌ Ma nincsenek {league_name} meccsek.")
            print("✅ Pihenőnap - készülj fel a következő fordulóra! 💪")
            print("🔗 Ellenőrizd: ESPN, BBC Sport, vagy a liga hivatalos oldalát")
            return

        print(f"⚽ {len(matches)} {league_name} mérkőzés ma:")
        for home, away, h_odd, d_odd, a_odd in matches:
            print(f"   {home} vs {away} ({h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f})")
        print()

        # Elemzés minden meccsre
        opportunities = []

        for home, away, h_odd, d_odd, a_odd in matches:
            print(f"🔍 {home} vs {away}")

            # Saját predikció
            prediction = self.system.predict_match_probabilities(home, away, self.team_stats)
            if not prediction:
                print("   ❌ Nincs elég adat az elemzéshez")
                continue

            # Odds elemzés
            our_odds = {
                'home': 1 / prediction['prob_home'],
                'draw': 1 / prediction['prob_draw'],
                'away': 1 / prediction['prob_away']
            }

            bookmaker_odds = {'home': h_odd, 'draw': d_odd, 'away': a_odd}

            print(f"   📊 Saját becslés: {our_odds['home']:.2f} - {our_odds['draw']:.2f} - {our_odds['away']:.2f}")
            print(f"   🏪 Fogadóiroda:   {h_odd:.2f} - {d_odd:.2f} - {a_odd:.2f}")

            # Value bet keresés
            match_opportunities = []
            for outcome, our_odd in our_odds.items():
                bookmaker_odd = bookmaker_odds[outcome]
                edge = (our_odd / bookmaker_odd) - 1
                confidence = prediction['confidence']

                if edge >= self.min_edge and confidence >= self.min_confidence:
                    # Kelly stake
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                    kelly_stake = max(0.005, min(0.04, kelly_fraction * 0.5))

                    opportunity = {
                        'match': f"{home} vs {away}",
                        'outcome': outcome,
                        'bookmaker_odds': bookmaker_odd,
                        'edge': edge,
                        'confidence': confidence,
                        'kelly_stake': kelly_stake,
                        'expected_profit': kelly_stake * self.bankroll * edge
                    }

                    match_opportunities.append(opportunity)
                    opportunities.append(opportunity)

                    outcome_hu = {'home': 'HAZAI', 'draw': 'DÖNTETLEN', 'away': 'VENDÉG'}[outcome]
                    print(f"   ✅ {outcome_hu}: Edge {edge:.1%}, Bizalom {confidence:.1%}")

            if not match_opportunities:
                print("   ❌ Nincs value bet")

            print()

        # Javaslatok összegzése
        self.summarize_daily_recommendations(opportunities, today_name)

    def summarize_daily_recommendations(self, opportunities, day_name):
        """Napi javaslatok összegzése."""
        if not opportunities:
            print("🎯 MAI ÖSSZEGZÉS")
            print("=" * 30)
            print("❌ Ma nincs megfelelő fogadási lehetőség")
            print("💡 Javaslatom: Várj holnapra vagy a hétvégére!")
            print("💰 Bankroll biztonságban: $1000.00")
            return

        # Rendezés edge szerint
        opportunities.sort(key=lambda x: x['edge'], reverse=True)

        print("🎯 MAI FOGADÁSI JAVASLATOK")
        print("=" * 40)

        # Top lehetőségek
        total_stake = 0
        recommended_bets = []

        print("📊 EGYEDI FOGADÁSOK (Top 3):")
        for i, opp in enumerate(opportunities[:3], 1):
            stake_amount = opp['kelly_stake'] * self.bankroll
            total_stake += stake_amount
            recommended_bets.append(opp)

            outcome_hu = {'home': 'HAZAI győzelem', 'draw': 'DÖNTETLEN', 'away': 'VENDÉG győzelem'}[opp['outcome']]
            print(f"{i}. {opp['match']}")
            print(f"   🎯 Tipp: {outcome_hu}")
            print(f"   💰 Javasolt tét: ${stake_amount:.2f}")
            print(f"   🎲 Odds: {opp['bookmaker_odds']:.2f}")
            print(f"   📈 Edge: {opp['edge']:.1%} | Bizalom: {opp['confidence']:.1%}")
            print(f"   💵 Várható profit: ${opp['expected_profit']:.2f}")
            print()

        # Kombináció ha van elég jó lehetőség
        if len(opportunities) >= 2:
            print("🎰 KOMBINÁCIÓS JAVASLAT:")
            best_combo = opportunities[:2]  # Top 2

            combo_odds = 1.0
            combo_stake_pct = 0
            combo_matches = []

            for opp in best_combo:
                combo_odds *= opp['bookmaker_odds']
                combo_stake_pct += opp['kelly_stake']
                outcome_hu = {'home': 'H', 'draw': 'D', 'away': 'V'}[opp['outcome']]
                combo_matches.append(f"{opp['match']} ({outcome_hu})")

            combo_stake_pct = min(0.025, combo_stake_pct / 3)  # Konzervatív
            combo_stake_amount = combo_stake_pct * self.bankroll
            potential_win = combo_stake_amount * combo_odds

            print(f"   🎯 Kombinált tippek:")
            for match in combo_matches:
                print(f"      • {match}")
            print(f"   💰 Javasolt tét: ${combo_stake_amount:.2f}")
            print(f"   🎲 Össz odds: {combo_odds:.2f}")
            print(f"   💵 Potenciális nyeremény: ${potential_win:.2f}")
            print()

            total_stake += combo_stake_amount

        # Napi összegzés
        risk_pct = (total_stake / self.bankroll) * 100

        print("💼 NAPI ÖSSZESÍTÉS:")
        print(f"   💰 Összes javasolt tét: ${total_stake:.2f}")
        print(f"   📊 Bankroll kockázat: {risk_pct:.1f}% (max {self.max_daily_risk*100:.0f}%)")

        if risk_pct <= self.max_daily_risk * 100:
            print("   ✅ Alacsony kockázat - MEHET!")
        elif risk_pct <= 12:
            print("   ⚠️ Közepes kockázat - Megfontolva!")
        else:
            print("   ❌ Magas kockázat - Csökkentsd a téteket!")

        print(f"   🏦 Bankroll utána: ${self.bankroll - total_stake:.2f}")

        # Napi tanácsok
        print("\n💡 MAI TANÁCSOK:")
        if day_name in ["Szombat", "Vasárnap"]:
            print("   🏟️ Hétvégi nagy forduló - több lehetőség!")
            print("   📺 Nézd meg a mérkőzéseket élőben")
            print("   🔄 Figyelj a live odds változásokra")
        elif day_name in ["Kedd", "Szerda"]:
            print("   ⚽ Hét közepi meccsek - kevesebb lehetőség")
            print("   🎯 Koncentrálj a legjobb value betekre")
            print("   💰 Konzervatívabb bankroll management")
        else:
            print("   📅 Átlagos nap - standard stratégia")

        print("   🚫 Soha ne fogadj érzelmekből!")
        print("   📱 Használj odds összehasonlító oldalakat")
        print("   📊 Kövessed a profitod hosszú távon")

    def run_daily_analysis(self):
        """Napi elemzés futtatása."""
        now = datetime.now()
        print(f"🌅 NAPI FOGADÁSI ASSZISZTENS")
        print(f"📅 {now.strftime('%Y.%m.%d')} - {now.strftime('%A')}")
        print(f"⏰ {now.strftime('%H:%M')}")
        print("=" * 60)

        try:
            # Adatok betöltése
            self.load_data_and_models()

            # Mai elemzés
            self.analyze_todays_opportunities()

            print("\n" + "=" * 60)
            print("✅ Elemzés befejezve! Sikeres fogadást! 🍀")
            print("📞 Probléma esetén: ellenőrizd a team_stats adatokat")

        except Exception as e:
            print(f"❌ Hiba történt: {e}")
            print("🔧 Ellenőrizd az adatfájlokat és próbáld újra!")

def main():
    """Fő futtatási függvény."""
    import argparse

    parser = argparse.ArgumentParser(description='Napi fogadási asszisztens')
    parser.add_argument('--league', default='premier_league',
                       choices=['premier_league', 'mls', 'brasileirao', 'j_league'],
                       help='Liga választás')
    args = parser.parse_args()

    assistant = DailyBettingAssistant(league=args.league)

    # Adatok betöltése
    if not assistant.load_data_and_models():
        print("❌ Nem sikerült az adatok betöltése!")
        return

    assistant.run_daily_analysis()

if __name__ == "__main__":
    main()
