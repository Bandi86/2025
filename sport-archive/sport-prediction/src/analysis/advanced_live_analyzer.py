#!/usr/bin/env python3
"""
📊 FEJLETT VALÓS IDEJŰ ELEMZŐ
Következő órák meccseit elemzi részletesen és fogadási javaslatokat ad.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Saját modulok importálása
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'tools'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core'))

try:
    from live_match_predictor import LiveMatchPredictor, UpcomingMatch
    from realistic_betting_system import RealisticBettingSystem
except ImportError as e:
    print(f"❌ Import hiba: {e}")
    print("💡 Ellenőrizd hogy minden modul elérhető-e")
    exit(1)

class AdvancedLiveAnalyzer:
    """Fejlett valós idejű elemző"""

    def __init__(self):
        self.predictor = LiveMatchPredictor()
        self.betting_system = RealisticBettingSystem()
        self.bankroll = 1000.0
        self.max_single_bet = 50.0
        self.min_edge = 0.05
        self.min_confidence = 0.3

    def analyze_next_hours(self, hours: int = 4) -> Dict:
        """Következő órák teljes elemzése"""
        print(f"📊 KÖVETKEZŐ {hours} ÓRA TELJES ELEMZÉSE")
        print("=" * 60)

        # Meccsek lekérdezése
        upcoming_matches = self.predictor.get_next_4_hours_matches()

        if not upcoming_matches:
            return {
                'status': 'no_matches',
                'message': f'Nincs meccs a következő {hours} órában',
                'matches': [],
                'betting_opportunities': []
            }

        # Predikciók készítése
        predictions = self.predictor.predict_upcoming_matches(upcoming_matches)

        # Fogadási lehetőségek elemzése
        betting_opportunities = self._analyze_betting_opportunities(predictions)

        # Részletes jelentés
        detailed_report = self._generate_detailed_report(predictions, betting_opportunities)

        return {
            'status': 'success',
            'analyzed_at': datetime.now().isoformat(),
            'total_matches': len(predictions),
            'betting_opportunities': len(betting_opportunities),
            'predictions': predictions,
            'betting_suggestions': betting_opportunities,
            'detailed_report': detailed_report,
            'summary': self._generate_summary(predictions, betting_opportunities)
        }

    def _analyze_betting_opportunities(self, predictions: List[Dict]) -> List[Dict]:
        """Fogadási lehetőségek elemzése"""
        print(f"\n💰 FOGADÁSI LEHETŐSÉGEK ELEMZÉSE")
        print("=" * 40)

        opportunities = []

        for pred in predictions:
            # Szimulált odds (valódi bookmaker odds helyett)
            simulated_odds = self._generate_simulated_odds(pred)

            # Value bet keresés
            value_bets = self._find_value_bets(pred, simulated_odds)

            if value_bets:
                for bet in value_bets:
                    opportunities.append({
                        'match': f"{pred['home_team']} vs {pred['away_team']}",
                        'kickoff_time': pred['kickoff_time'],
                        'competition': pred['competition'],
                        'bet_type': bet['type'],
                        'prediction_prob': bet['our_prob'],
                        'bookmaker_odds': bet['bookmaker_odds'],
                        'implied_prob': 1 / bet['bookmaker_odds'],
                        'edge': bet['edge'],
                        'suggested_stake': bet['stake'],
                        'potential_profit': bet['potential_profit'],
                        'confidence': pred['confidence'],
                        'recommendation': bet['recommendation']
                    })

        # Rendezés edge szerint
        opportunities.sort(key=lambda x: x['edge'], reverse=True)

        print(f"✅ {len(opportunities)} értékes fogadási lehetőség találva")
        return opportunities

    def _generate_simulated_odds(self, prediction: Dict) -> Dict:
        """Szimulált bookmaker odds generálása"""
        # Bookmaker margin hozzáadása (5-8%)
        margin = 0.06

        # Tiszta valószínűségek
        clean_probs = {
            'home': prediction['prob_home'],
            'draw': prediction['prob_draw'],
            'away': prediction['prob_away']
        }

        # Margin hozzáadása
        total_implied = sum(1/prob for prob in clean_probs.values())
        margin_multiplier = 1 + margin

        odds = {}
        for outcome, prob in clean_probs.items():
            fair_odd = 1 / prob
            bookmaker_odd = fair_odd / margin_multiplier
            odds[outcome] = round(bookmaker_odd, 2)

        return odds

    def _find_value_bets(self, prediction: Dict, bookmaker_odds: Dict) -> List[Dict]:
        """Value bet-ek keresése"""
        value_bets = []

        outcomes = {
            'home': prediction['prob_home'],
            'draw': prediction['prob_draw'],
            'away': prediction['prob_away']
        }

        for outcome, our_prob in outcomes.items():
            bookmaker_odd = bookmaker_odds[outcome]
            our_fair_odd = 1 / our_prob

            # Edge számítása
            edge = (our_fair_odd / bookmaker_odd) - 1

            if edge >= self.min_edge and prediction['confidence'] >= self.min_confidence:
                # Kelly stake számítása
                win_prob = our_prob
                kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                kelly_stake = max(5, min(self.max_single_bet, kelly_fraction * self.bankroll * 0.5))

                # Ajánlás kategóriája
                if edge > 0.15:
                    recommendation = "ERŐS AJÁNLÁS"
                elif edge > 0.10:
                    recommendation = "KÖZEPES AJÁNLÁS"
                else:
                    recommendation = "GYENGE AJÁNLÁS"

                value_bets.append({
                    'type': outcome,
                    'our_prob': our_prob,
                    'bookmaker_odds': bookmaker_odd,
                    'edge': edge,
                    'stake': kelly_stake,
                    'potential_profit': kelly_stake * (bookmaker_odd - 1),
                    'recommendation': recommendation
                })

        return value_bets

    def _generate_detailed_report(self, predictions: List[Dict], opportunities: List[Dict]) -> Dict:
        """Részletes jelentés generálása"""
        report = {
            'match_analysis': [],
            'competition_breakdown': {},
            'time_distribution': {},
            'confidence_levels': {},
            'betting_summary': {
                'total_opportunities': len(opportunities),
                'total_potential_stake': sum(opp['suggested_stake'] for opp in opportunities),
                'total_potential_profit': sum(opp['potential_profit'] for opp in opportunities),
                'avg_edge': sum(opp['edge'] for opp in opportunities) / len(opportunities) if opportunities else 0
            }
        }

        # Meccs elemzések
        for pred in predictions:
            match_analysis = {
                'match': f"{pred['home_team']} vs {pred['away_team']}",
                'kickoff': pred['kickoff_time'].strftime('%H:%M'),
                'competition': pred['competition'],
                'most_likely_outcome': self._get_most_likely_outcome(pred),
                'expected_goals': f"{pred['expected_goals']['home']:.1f} - {pred['expected_goals']['away']:.1f}",
                'confidence': f"{pred['confidence']:.1%}",
                'data_quality': f"Hazai: {pred['home_data_quality']}, Vendég: {pred['away_data_quality']}"
            }
            report['match_analysis'].append(match_analysis)

        # Bajnokság szerinti bontás
        for pred in predictions:
            comp = pred['competition']
            if comp not in report['competition_breakdown']:
                report['competition_breakdown'][comp] = {'count': 0, 'matches': []}
            report['competition_breakdown'][comp]['count'] += 1
            report['competition_breakdown'][comp]['matches'].append(
                f"{pred['home_team']} vs {pred['away_team']}"
            )

        return report

    def _get_most_likely_outcome(self, prediction: Dict) -> str:
        """Legvalószínűbb kimenetel"""
        probs = {
            'Hazai győzelem': prediction['prob_home'],
            'Döntetlen': prediction['prob_draw'],
            'Vendég győzelem': prediction['prob_away']
        }

        outcome, prob = max(probs.items(), key=lambda x: x[1])
        return f"{outcome} ({prob:.1%})"

    def _generate_summary(self, predictions: List[Dict], opportunities: List[Dict]) -> Dict:
        """Összefoglaló generálása"""
        if not predictions:
            return {'message': 'Nincs elemzendő meccs'}

        # Statisztikák
        avg_confidence = sum(p['confidence'] for p in predictions) / len(predictions)
        high_confidence_matches = len([p for p in predictions if p['confidence'] > 0.7])

        # Legjobb lehetőségek
        top_opportunities = sorted(opportunities, key=lambda x: x['edge'], reverse=True)[:3]

        return {
            'total_matches': len(predictions),
            'avg_confidence': f"{avg_confidence:.1%}",
            'high_confidence_matches': high_confidence_matches,
            'betting_opportunities': len(opportunities),
            'total_potential_stake': sum(opp['suggested_stake'] for opp in opportunities),
            'top_opportunities': [
                {
                    'match': opp['match'],
                    'bet_type': opp['bet_type'],
                    'edge': f"{opp['edge']:.1%}",
                    'stake': f"${opp['suggested_stake']:.0f}"
                }
                for opp in top_opportunities
            ],
            'competitions': list(set(p['competition'] for p in predictions))
        }

    def save_analysis_report(self, analysis_result: Dict, filename: Optional[str] = None) -> str:
        """Elemzés mentése fájlba"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"live_analysis_{timestamp}.json"

        output_dir = "data/live_analysis"
        os.makedirs(output_dir, exist_ok=True)

        filepath = os.path.join(output_dir, filename)

        # JSON serializable formátumra konvertálás
        serializable_result = self._make_json_serializable(analysis_result)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(serializable_result, f, indent=2, ensure_ascii=False)

        print(f"💾 Elemzés mentve: {filepath}")
        return filepath

    def _make_json_serializable(self, obj):
        """JSON serializable formátumra konvertálás"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {key: self._make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_json_serializable(item) for item in obj]
        else:
            return obj

    def print_betting_recommendations(self, opportunities: List[Dict]):
        """Fogadási javaslatok kiírása"""
        if not opportunities:
            print("❌ Nincs értékes fogadási lehetőség")
            return

        print(f"\n💎 TOP FOGADÁSI JAVASLATOK")
        print("=" * 50)

        total_stake = 0

        for i, opp in enumerate(opportunities[:5], 1):  # Top 5
            print(f"\n{i}. {opp['match']}")
            print(f"   🕐 {opp['kickoff_time'].strftime('%H:%M')} | 🏆 {opp['competition']}")
            print(f"   🎯 Tipp: {opp['bet_type'].upper()}")
            print(f"   📊 Saját esély: {opp['prediction_prob']:.1%}")
            print(f"   🎲 Bookmaker odds: {opp['bookmaker_odds']:.2f}")
            print(f"   📈 Edge: {opp['edge']:.1%}")
            print(f"   💰 Javasolt tét: ${opp['suggested_stake']:.0f}")
            print(f"   💵 Várható profit: ${opp['potential_profit']:.0f}")
            print(f"   ⭐ {opp['recommendation']}")

            total_stake += opp['suggested_stake']

        print(f"\n📋 ÖSSZEGZÉS:")
        print(f"   💰 Összes javasolt tét: ${total_stake:.0f}")
        print(f"   📊 Bankroll arány: {(total_stake/self.bankroll)*100:.1f}%")

        if total_stake > self.bankroll * 0.1:
            print(f"   ⚠️ FIGYELEM: Magas kockázat!")
        else:
            print(f"   ✅ Alacsony kockázat")

def main():
    """Fő függvény"""
    analyzer = AdvancedLiveAnalyzer()

    print("📊 FEJLETT VALÓS IDEJŰ ELEMZŐ")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    # Elemzés futtatása
    result = analyzer.analyze_next_hours(4)

    if result['status'] == 'no_matches':
        print(f"❌ {result['message']}")
        return

    # Eredmények megjelenítése
    print(f"\n🎯 ELEMZÉS EREDMÉNYEK")
    print("=" * 30)
    print(f"📊 Összes meccs: {result['total_matches']}")
    print(f"💰 Fogadási lehetőségek: {result['betting_opportunities']}")
    print(f"📈 Átlagos bizalom: {result['summary']['avg_confidence']}")

    # Fogadási javaslatok
    if result['betting_suggestions']:
        analyzer.print_betting_recommendations(result['betting_suggestions'])

    # Mentés
    saved_file = analyzer.save_analysis_report(result)

    print(f"\n💡 TOVÁBBI LÉPÉSEK:")
    print(f"   1️⃣ Ellenőrizd a bookmaker odds-okat")
    print(f"   2️⃣ Csak kicsi tétekkel kezdj")
    print(f"   3️⃣ Kövesd nyomon az eredményeket")
    print(f"   4️⃣ Frissítsd az elemzést 1 óránként")

if __name__ == "__main__":
    main()
