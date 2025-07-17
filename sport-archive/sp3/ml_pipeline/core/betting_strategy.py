import pandas as pd
import numpy as np
from datetime import datetime
import json

class BettingStrategy:
    """
    Fogadási stratégia és ROI számítás osztály
    """

    def __init__(self, starting_bankroll=1000.0):
        self.bankroll = starting_bankroll
        self.initial_bankroll = starting_bankroll
        self.bet_history = []
        self.roi_history = []

        # Fogadási beállítások
        self.max_bet_percentage = 0.05  # Max 5% bankroll egy tippre
        self.min_confidence = 55.0      # Min 55% confidence
        self.min_odds = 1.5             # Min 1.5 odds érték
        self.max_odds = 4.0             # Max 4.0 odds érték

        # Kelly Criterion beállítások
        self.use_kelly = True
        self.kelly_fraction = 0.25      # Conservative Kelly (1/4 Kelly)

    def calculate_implied_probability(self, odds):
        """Odds-ból implicit valószínűség számítása"""
        return 1.0 / odds

    def calculate_value_bet(self, prediction_prob, odds):
        """Value bet számítása"""
        implied_prob = self.calculate_implied_probability(odds)
        expected_value = (prediction_prob * (odds - 1)) - ((1 - prediction_prob) * 1)
        value = prediction_prob - implied_prob

        return {
            'expected_value': expected_value,
            'value': value,
            'is_value_bet': value > 0,
            'edge_percentage': value * 100
        }

    def kelly_criterion(self, prediction_prob, odds):
        """Kelly Criterion tét számítása"""
        b = odds - 1  # Net odds
        p = prediction_prob
        q = 1 - p

        kelly_fraction = (b * p - q) / b
        return max(0, kelly_fraction)  # Negatív Kelly = nincs tét

    def calculate_bet_size(self, prediction, odds, bet_type='result'):
        """Optimális tét méret számítása"""
        confidence = prediction['confidence'] / 100.0

        # Confidence alapú alap tét
        base_bet_percentage = min(confidence * 0.1, self.max_bet_percentage)

        if self.use_kelly and bet_type == 'result':
            # Kelly Criterion használata eredmény tétekre
            result_probs = prediction['result_probabilities']

            if prediction['predicted_result'] == 'H':
                prob = result_probs['home_win'] / 100.0
            elif prediction['predicted_result'] == 'D':
                prob = result_probs['draw'] / 100.0
            else:
                prob = result_probs['away_win'] / 100.0

            kelly_fraction = self.kelly_criterion(prob, odds)
            kelly_bet_percentage = kelly_fraction * self.kelly_fraction

            # Vegyük a kisebbiket
            bet_percentage = min(base_bet_percentage, kelly_bet_percentage)
        else:
            bet_percentage = base_bet_percentage

        return self.bankroll * bet_percentage

    def evaluate_betting_opportunity(self, prediction, mock_odds=None):
        """Fogadási lehetőség értékelése"""
        if mock_odds is None:
            # Mock odds generálása predikció alapján
            mock_odds = self._generate_mock_odds(prediction)

        opportunities = []

        # 1. Eredmény tét értékelése
        result_odds = mock_odds['result_odds']
        result_probs = prediction['result_probabilities']

        best_result_bet = None
        best_value = -1

        for result, odds in result_odds.items():
            if result == 'home_win':
                prob = result_probs['home_win'] / 100.0
                bet_type = 'H'
            elif result == 'draw':
                prob = result_probs['draw'] / 100.0
                bet_type = 'D'
            else:
                prob = result_probs['away_win'] / 100.0
                bet_type = 'A'

            value_analysis = self.calculate_value_bet(prob, odds)

            if (value_analysis['is_value_bet'] and
                odds >= self.min_odds and odds <= self.max_odds and
                prediction['confidence'] >= self.min_confidence):

                bet_size = self.calculate_bet_size(prediction, odds, 'result')

                opportunity = {
                    'bet_type': 'result',
                    'selection': bet_type,
                    'selection_name': result.replace('_', ' ').title(),
                    'odds': odds,
                    'probability': prob,
                    'confidence': prediction['confidence'],
                    'expected_value': value_analysis['expected_value'],
                    'edge_percentage': value_analysis['edge_percentage'],
                    'recommended_bet': bet_size,
                    'potential_profit': bet_size * (odds - 1),
                    'risk_rating': self._calculate_risk_rating(prediction['confidence'], odds)
                }

                if value_analysis['value'] > best_value:
                    best_value = value_analysis['value']
                    best_result_bet = opportunity

        if best_result_bet:
            opportunities.append(best_result_bet)

        # 2. Over/Under tét értékelése
        total_goals = prediction['expected_total_goals']
        over_under_odds = mock_odds['over_under_odds']

        # Over 2.5 értékelése
        over_prob = self._calculate_over_probability(total_goals, 2.5)
        over_odds = over_under_odds['over_2_5']
        over_value = self.calculate_value_bet(over_prob, over_odds)

        if (over_value['is_value_bet'] and
            over_odds >= self.min_odds and over_odds <= self.max_odds and
            prediction['confidence'] >= self.min_confidence * 0.8):  # Alacsonyabb threshold Over/Under-re

            bet_size = self.calculate_bet_size(prediction, over_odds, 'over_under')

            opportunities.append({
                'bet_type': 'over_under',
                'selection': 'over_2_5',
                'selection_name': 'Over 2.5 Goals',
                'odds': over_odds,
                'probability': over_prob,
                'confidence': prediction['confidence'] * 0.9,  # Kissé konzervatívabb
                'expected_value': over_value['expected_value'],
                'edge_percentage': over_value['edge_percentage'],
                'recommended_bet': bet_size,
                'potential_profit': bet_size * (over_odds - 1),
                'risk_rating': self._calculate_risk_rating(prediction['confidence'] * 0.9, over_odds)
            })

        # Under 2.5 értékelése
        under_prob = 1 - over_prob
        under_odds = over_under_odds['under_2_5']
        under_value = self.calculate_value_bet(under_prob, under_odds)

        if (under_value['is_value_bet'] and
            under_odds >= self.min_odds and under_odds <= self.max_odds and
            prediction['confidence'] >= self.min_confidence * 0.8):

            bet_size = self.calculate_bet_size(prediction, under_odds, 'over_under')

            opportunities.append({
                'bet_type': 'over_under',
                'selection': 'under_2_5',
                'selection_name': 'Under 2.5 Goals',
                'odds': under_odds,
                'probability': under_prob,
                'confidence': prediction['confidence'] * 0.9,
                'expected_value': under_value['expected_value'],
                'edge_percentage': under_value['edge_percentage'],
                'recommended_bet': bet_size,
                'potential_profit': bet_size * (under_odds - 1),
                'risk_rating': self._calculate_risk_rating(prediction['confidence'] * 0.9, under_odds)
            })

        # Legjobb opportunity-k rendezése edge szerint
        opportunities = sorted(opportunities, key=lambda x: x['edge_percentage'], reverse=True)

        return opportunities

    def _generate_mock_odds(self, prediction):
        """Mock odds generálása predikció alapján (valós bookmakerek átlaga)"""
        result_probs = prediction['result_probabilities']
        total_goals = prediction['expected_total_goals']

        # Bookmaker margin (kb 5-10%)
        margin = 0.07

        # Eredmény odds-ok (margin-nal)
        home_prob = (result_probs['home_win'] / 100.0) * (1 + margin)
        draw_prob = (result_probs['draw'] / 100.0) * (1 + margin)
        away_prob = (result_probs['away_win'] / 100.0) * (1 + margin)

        # Normalizálás
        total_prob = home_prob + draw_prob + away_prob
        home_prob /= total_prob
        draw_prob /= total_prob
        away_prob /= total_prob

        result_odds = {
            'home_win': round(1.0 / home_prob, 2),
            'draw': round(1.0 / draw_prob, 2),
            'away_win': round(1.0 / away_prob, 2)
        }

        # Over/Under odds-ok
        over_prob = self._calculate_over_probability(total_goals, 2.5) * (1 + margin/2)
        under_prob = (1 - over_prob + margin/2)

        # Normalizálás
        total_ou_prob = over_prob + under_prob
        over_prob /= total_ou_prob
        under_prob /= total_ou_prob

        over_under_odds = {
            'over_2_5': round(1.0 / over_prob, 2),
            'under_2_5': round(1.0 / under_prob, 2)
        }

        return {
            'result_odds': result_odds,
            'over_under_odds': over_under_odds
        }

    def _calculate_over_probability(self, expected_goals, threshold):
        """Poisson eloszlás alapján Over valószínűség számítása"""
        # Egyszerűsített: normál eloszlás közelítés
        import math

        # Standard deviation becslés (gólok varianciája)
        std_dev = math.sqrt(expected_goals)

        # Z-score számítás
        z = (threshold - expected_goals) / std_dev if std_dev > 0 else 0

        # Normál eloszlás CDF közelítés
        prob_under = 0.5 * (1 + math.erf(z / math.sqrt(2)))
        prob_over = 1 - prob_under

        return max(0.05, min(0.95, prob_over))  # 5-95% korlát

    def _calculate_risk_rating(self, confidence, odds):
        """Kockázati besorolás számítása"""
        if confidence >= 70 and odds <= 2.5:
            return "LOW"
        elif confidence >= 60 and odds <= 3.5:
            return "MEDIUM"
        elif confidence >= 55 and odds <= 4.0:
            return "HIGH"
        else:
            return "VERY_HIGH"

    def simulate_bet_outcome(self, opportunity, actual_result=None):
        """Tét kimenetelének szimulálása (backtesting-hez)"""
        if actual_result is None:
            # Random kimenetel a valószínűségek alapján
            if np.random.random() < opportunity['probability']:
                won = True
            else:
                won = False
        else:
            # Valós eredmény alapján
            won = self._check_bet_won(opportunity, actual_result)

        bet_amount = opportunity['recommended_bet']

        if won:
            profit = bet_amount * (opportunity['odds'] - 1)
            net_result = profit
        else:
            profit = 0
            net_result = -bet_amount

        # Bankroll frissítése
        self.bankroll += net_result

        # História mentése
        bet_record = {
            'timestamp': datetime.now().isoformat(),
            'bet_type': opportunity['bet_type'],
            'selection': opportunity['selection_name'],
            'odds': opportunity['odds'],
            'bet_amount': bet_amount,
            'won': won,
            'profit': profit,
            'net_result': net_result,
            'bankroll_after': self.bankroll,
            'edge_percentage': opportunity['edge_percentage'],
            'confidence': opportunity['confidence']
        }

        self.bet_history.append(bet_record)

        # ROI frissítése
        current_roi = ((self.bankroll - self.initial_bankroll) / self.initial_bankroll) * 100
        self.roi_history.append(current_roi)

        return bet_record

    def _check_bet_won(self, opportunity, actual_result):
        """Ellenőrzi, hogy a tét nyert-e"""
        if opportunity['bet_type'] == 'result':
            return opportunity['selection'] == actual_result['result']
        elif opportunity['bet_type'] == 'over_under':
            total_goals = actual_result['home_goals'] + actual_result['away_goals']
            if opportunity['selection'] == 'over_2_5':
                return total_goals > 2.5
            else:
                return total_goals <= 2.5
        return False

    def get_performance_stats(self):
        """Teljesítmény statisztikák"""
        if not self.bet_history:
            return None

        df = pd.DataFrame(self.bet_history)

        total_bets = len(df)
        winning_bets = len(df[df['won'] == True])
        win_rate = (winning_bets / total_bets) * 100

        total_staked = df['bet_amount'].sum()
        total_profit = df['profit'].sum()
        net_result = df['net_result'].sum()

        roi = (net_result / total_staked) * 100 if total_staked > 0 else 0
        current_roi = ((self.bankroll - self.initial_bankroll) / self.initial_bankroll) * 100

        avg_odds = df['odds'].mean()
        avg_bet_size = df['bet_amount'].mean()

        return {
            'total_bets': total_bets,
            'winning_bets': winning_bets,
            'win_rate': round(win_rate, 2),
            'total_staked': round(total_staked, 2),
            'total_profit': round(total_profit, 2),
            'net_result': round(net_result, 2),
            'roi_percentage': round(roi, 2),
            'current_bankroll': round(self.bankroll, 2),
            'current_roi': round(current_roi, 2),
            'average_odds': round(avg_odds, 2),
            'average_bet_size': round(avg_bet_size, 2),
            'profit_factor': round(total_profit / abs(df[df['won'] == False]['bet_amount'].sum()), 2) if len(df[df['won'] == False]) > 0 else float('inf')
        }

    def print_betting_opportunities(self, opportunities, match_info):
        """Fogadási lehetőségek kiírása"""
        if not opportunities:
            print("❌ Nincs értékes fogadási lehetőség ehhez a meccshez")
            return

        print(f"\n💰 FOGADÁSI LEHETŐSÉGEK ({match_info['home_team']} vs {match_info['away_team']}):")
        print("=" * 70)

        for i, opp in enumerate(opportunities, 1):
            print(f"{i}. {opp['selection_name']}")
            print(f"   📊 Odds: {opp['odds']} | Edge: {opp['edge_percentage']:+.1f}%")
            print(f"   💰 Javasolt tét: ${opp['recommended_bet']:.2f}")
            print(f"   🎯 Potenciális profit: ${opp['potential_profit']:.2f}")
            print(f"   ⚠️  Kockázat: {opp['risk_rating']}")
            print(f"   📈 Expected Value: {opp['expected_value']:+.3f}")
            print()

if __name__ == "__main__":
    # Teszt
    strategy = BettingStrategy(starting_bankroll=1000)

    # Mock predikció
    mock_prediction = {
        'predicted_result': 'H',
        'result_probabilities': {
            'home_win': 55.0,
            'draw': 25.0,
            'away_win': 20.0
        },
        'expected_total_goals': 2.8,
        'confidence': 62.5
    }

    print("🎯 Teszt fogadási lehetőségek:")
    opportunities = strategy.evaluate_betting_opportunity(mock_prediction)

    match_info = {'home_team': 'Arsenal', 'away_team': 'Chelsea'}
    strategy.print_betting_opportunities(opportunities, match_info)
