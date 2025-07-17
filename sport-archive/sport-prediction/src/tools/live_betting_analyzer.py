#!/usr/bin/env python3
"""
🔴 LIVE BETTING ANALYZER
Valós API adatok + prediction engine integráció
"""

import os
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, List

# Módulok hozzáadása
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))

try:
    from live_api_client import LiveAPIClient
    from realistic_betting_system import RealisticBettingSystem
    from data_loader import load_data
except ImportError as e:
    print(f"❌ Hiányzó modulok: {e}")
    exit(1)

class LiveBettingAnalyzer:
    """Valós adatok elemzése és fogadási javaslatok"""

    def __init__(self, league: str = 'premier_league'):
        self.league = league
        self.api_client = LiveAPIClient()
        self.betting_system = RealisticBettingSystem()

        # Liga specifikus beállítások
        self.league_configs = {
            'premier_league': {
                'name': 'Premier League',
                'data_files': ['pl2223.csv', 'pl2324.csv', 'pl2425.csv'],
                'min_confidence': 0.45,
                'max_daily_risk': 0.08
            },
            'mls': {
                'name': 'Major League Soccer',
                'data_files': ['data/mls/mls_2024_sample.csv'],
                'min_confidence': 0.40,
                'max_daily_risk': 0.10
            },
            'brasileirao': {
                'name': 'Brasileirão Serie A',
                'data_files': ['data/brasileirao/brasileirao_2024_sample.csv'],
                'min_confidence': 0.42,
                'max_daily_risk': 0.09
            },
            'j_league': {
                'name': 'J1 League',
                'data_files': ['data/j_league/j_league_2024_sample.csv'],
                'min_confidence': 0.41,
                'max_daily_risk': 0.09
            }
        }

        self.historical_data = None
        self.team_stats = None

    def initialize(self) -> bool:
        """Rendszer inicializálása"""
        print(f"🚀 Live Betting Analyzer inicializálása ({self.league})...")

        # 1. API kapcsolat ellenőrzése
        if not self.api_client.test_connection():
            print("⚠️ API nem elérhető, szimuláció módban folytatjuk...")
            return True

        # 2. Múltbeli adatok betöltése
        league_config = self.league_configs.get(self.league)
        if not league_config:
            print(f"❌ Ismeretlen liga: {self.league}")
            return False

        try:
            print(f"📚 {league_config['name']} múltbeli adatok betöltése...")
            self.historical_data = load_data(league_config['data_files'])
            self.team_stats = self.betting_system.build_team_models(self.historical_data)
            print(f"✅ {len(self.historical_data)} múltbeli mérkőzés betöltve")
        except Exception as e:
            print(f"❌ Adatok betöltése sikertelen: {e}")
            return False

        return True

    def analyze_live_fixtures(self) -> List[Dict]:
        """Mai valós mérkőzések elemzése"""
        print(f"🔴 {self.league_configs[self.league]['name']} LIVE ELEMZÉS")
        print("=" * 60)

        # Valós adatok lekérése
        todays_fixtures = self.api_client.get_todays_fixtures(self.league)

        if not todays_fixtures:
            print("❌ Nincsenek mai mérkőzések vagy API hiba.")
            return []

        recommendations = []

        for fixture in todays_fixtures:
            try:
                recommendation = self._analyze_single_fixture(fixture)
                if recommendation:
                    recommendations.append(recommendation)
            except Exception as e:
                print(f"⚠️ Hiba a mérkőzés elemzésénél: {e}")
                continue

        return recommendations

    def _analyze_single_fixture(self, fixture: Dict) -> Dict:
        """Egy mérkőzés részletes elemzése"""
        # Csapat nevek kinyerése
        home_team = fixture['teams']['home']['name']
        away_team = fixture['teams']['away']['name']
        fixture_id = fixture['fixture']['id']
        kick_off = fixture['fixture']['date']

        print(f"\n⚽ {home_team} vs {away_team}")
        print(f"🕐 Kezdés: {kick_off}")

        # Odds lekérése
        odds = self.api_client.get_odds(fixture_id)
        if not odds:
            print("   ❌ Nincsenek odds adatok")
            return None

        print(f"   🏪 Piaci odds: {odds.get('home', 'N/A'):.2f} - {odds.get('draw', 'N/A'):.2f} - {odds.get('away', 'N/A'):.2f}")

        # Saját predikció
        if self.team_stats and home_team in self.team_stats and away_team in self.team_stats:
            prediction = self._predict_match(home_team, away_team)
            print(f"   🧠 Saját becslés: {prediction['home_odds']:.2f} - {prediction['draw_odds']:.2f} - {prediction['away_odds']:.2f}")
            print(f"   📊 Bizalom: {prediction['confidence']:.1%}")

            # Value bet keresés
            value_bets = self._find_value_bets(odds, prediction)

            if value_bets:
                return {
                    'fixture_id': fixture_id,
                    'match': f"{home_team} vs {away_team}",
                    'kick_off': kick_off,
                    'market_odds': odds,
                    'our_prediction': prediction,
                    'value_bets': value_bets,
                    'league': self.league
                }
        else:
            print("   ⚠️ Hiányzó csapat statisztikák")

        return None

    def _predict_match(self, home_team: str, away_team: str) -> Dict:
        """Meccs predikció a múltbeli adatok alapján"""
        home_stats = self.team_stats.get(home_team, {})
        away_stats = self.team_stats.get(away_team, {})

        # Alapértelmezett értékek ha nincs adat
        home_strength = home_stats.get('home_strength', 1.0)
        away_strength = away_stats.get('away_strength', 1.0)

        # Egyszerű Poisson modell
        home_goals_expected = home_strength * 1.5  # Liga átlag
        away_goals_expected = away_strength * 1.2  # Vendég hátrány

        # Eredmény valószínűségek (egyszerűsített)
        total_goals = home_goals_expected + away_goals_expected

        if home_goals_expected > away_goals_expected * 1.2:
            home_prob = 0.50
            draw_prob = 0.28
            away_prob = 0.22
        elif away_goals_expected > home_goals_expected * 1.1:
            home_prob = 0.25
            draw_prob = 0.30
            away_prob = 0.45
        else:
            home_prob = 0.35
            draw_prob = 0.32
            away_prob = 0.33

        # Odds számítás
        home_odds = 1 / home_prob if home_prob > 0 else 999
        draw_odds = 1 / draw_prob if draw_prob > 0 else 999
        away_odds = 1 / away_prob if away_prob > 0 else 999

        # Bizalom számítás
        confidence = min(0.8, max(0.3, abs(home_goals_expected - away_goals_expected) / 2))

        return {
            'home_odds': home_odds,
            'draw_odds': draw_odds,
            'away_odds': away_odds,
            'confidence': confidence,
            'expected_goals': {
                'home': home_goals_expected,
                'away': away_goals_expected
            }
        }

    def _find_value_bets(self, market_odds: Dict, prediction: Dict) -> List[Dict]:
        """Value bet keresés"""
        value_bets = []
        league_config = self.league_configs[self.league]
        min_edge = 0.05
        min_confidence = league_config['min_confidence']

        outcomes = {
            'home': (market_odds.get('home'), prediction['home_odds']),
            'draw': (market_odds.get('draw'), prediction['draw_odds']),
            'away': (market_odds.get('away'), prediction['away_odds'])
        }

        for outcome, (market_odd, our_odd) in outcomes.items():
            if market_odd and our_odd:
                edge = (our_odd / market_odd) - 1

                if edge >= min_edge and prediction['confidence'] >= min_confidence:
                    # Kelly kritérium számítás
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (market_odd - 1) - (1 - win_prob)) / (market_odd - 1)

                    # Konzervatív stake
                    recommended_stake = max(0.005, min(0.03, kelly_fraction * 0.25))

                    value_bet = {
                        'outcome': outcome,
                        'market_odds': market_odd,
                        'fair_odds': our_odd,
                        'edge': edge,
                        'confidence': prediction['confidence'],
                        'recommended_stake': recommended_stake,
                        'expected_value': edge * recommended_stake
                    }

                    value_bets.append(value_bet)
                    print(f"   💰 VALUE BET: {outcome.upper()} @ {market_odd:.2f} (edge: {edge:.1%})")

        return value_bets

    def generate_daily_report(self) -> str:
        """Napi jelentés generálása"""
        recommendations = self.analyze_live_fixtures()

        if not recommendations:
            return "❌ Nincsenek mai ajánlások."

        report = f"\n🎯 {self.league_configs[self.league]['name'].upper()} NAPI JELENTÉS\n"
        report += f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        report += "=" * 60 + "\n\n"

        total_stake = 0
        total_ev = 0

        for i, rec in enumerate(recommendations, 1):
            report += f"{i}. {rec['match']}\n"
            report += f"   🕐 {rec['kick_off']}\n"

            for bet in rec['value_bets']:
                report += f"   💰 {bet['outcome'].upper()}: {bet['market_odds']:.2f} "
                report += f"(tét: {bet['recommended_stake']:.1%}, edge: {bet['edge']:.1%})\n"
                total_stake += bet['recommended_stake']
                total_ev += bet['expected_value']

            report += "\n"

        report += f"📊 Összes ajánlott tét: {total_stake:.1%}\n"
        report += f"🎯 Várható érték: {total_ev:.3f}\n"

        return report

    def save_analysis(self, output_dir: str = "results"):
        """Elemzés mentése"""
        os.makedirs(output_dir, exist_ok=True)

        recommendations = self.analyze_live_fixtures()
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')

        # JSON mentés
        output_file = os.path.join(output_dir, f"live_analysis_{self.league}_{timestamp}.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(recommendations, f, indent=2, ensure_ascii=False, default=str)

        # Text jelentés
        report = self.generate_daily_report()
        report_file = os.path.join(output_dir, f"daily_report_{self.league}_{timestamp}.txt")
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)

        print(f"💾 Elemzés mentve:")
        print(f"   📄 {output_file}")
        print(f"   📊 {report_file}")

def main():
    """Fő futtatási függvény"""
    import argparse

    parser = argparse.ArgumentParser(description='Live Betting Analyzer')
    parser.add_argument('--league', default='premier_league',
                       choices=['premier_league', 'mls', 'brasileirao', 'j_league'],
                       help='Liga választás')
    parser.add_argument('--save', action='store_true', help='Eredmények mentése')
    parser.add_argument('--report', action='store_true', help='Csak jelentés')

    args = parser.parse_args()

    analyzer = LiveBettingAnalyzer(league=args.league)

    if not analyzer.initialize():
        print("❌ Inicializálás sikertelen!")
        return

    if args.report:
        report = analyzer.generate_daily_report()
        print(report)
    else:
        recommendations = analyzer.analyze_live_fixtures()

        if recommendations:
            print(f"\n🎉 {len(recommendations)} ajánlás találva!")

            if args.save:
                analyzer.save_analysis()
        else:
            print("\n😴 Ma nincs értékes fogadási lehetőség.")

if __name__ == "__main__":
    main()
