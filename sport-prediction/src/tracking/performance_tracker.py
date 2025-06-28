#!/usr/bin/env python3
"""
📈 TELJESÍTMÉNY TRACKING RENDSZER
ROI követés, profit/loss számítás, stratégia optimalizálás
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional

class PerformanceTracker:
    """Teljesítmény követő rendszer"""

    def __init__(self, tracking_file: str = None):
        self.project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.tracking_file = tracking_file or os.path.join(self.project_root, 'results', 'betting_performance.json')
        self.csv_file = self.tracking_file.replace('.json', '.csv')

        # Tracking adatok betöltése vagy létrehozása
        self.performance_data = self.load_or_create_tracking_data()

        # Eredmény könyvtár
        os.makedirs(os.path.dirname(self.tracking_file), exist_ok=True)

    def load_or_create_tracking_data(self) -> Dict:
        """Tracking adatok betöltése vagy alapértelmezett létrehozása"""
        if os.path.exists(self.tracking_file):
            with open(self.tracking_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return {
                'bets': [],
                'daily_summaries': [],
                'bankroll_history': [],
                'strategy_performance': {},
                'metadata': {
                    'created': datetime.now().isoformat(),
                    'initial_bankroll': 1000.0,
                    'current_bankroll': 1000.0,
                    'total_bets': 0,
                    'winning_bets': 0,
                    'total_staked': 0.0,
                    'total_profit': 0.0
                }
            }

    def save_tracking_data(self):
        """Tracking adatok mentése"""
        with open(self.tracking_file, 'w', encoding='utf-8') as f:
            json.dump(self.performance_data, f, indent=2, ensure_ascii=False)

        # CSV export is
        self.export_to_csv()

    def add_bet(self, bet_info: Dict):
        """Új fogadás hozzáadása"""
        bet = {
            'id': len(self.performance_data['bets']) + 1,
            'timestamp': datetime.now().isoformat(),
            'date': bet_info.get('date', datetime.now().strftime('%Y-%m-%d')),
            'league': bet_info.get('league', 'unknown'),
            'match': bet_info.get('match', ''),
            'bet_type': bet_info.get('bet_type', 'single'),  # single, combination
            'prediction': bet_info.get('prediction', ''),
            'odds': bet_info.get('odds', 0.0),
            'stake': bet_info.get('stake', 0.0),
            'potential_return': bet_info.get('odds', 0.0) * bet_info.get('stake', 0.0),
            'confidence': bet_info.get('confidence', 0.0),
            'edge': bet_info.get('edge', 0.0),
            'strategy': bet_info.get('strategy', 'unknown'),
            'status': 'pending',  # pending, won, lost, void
            'actual_result': None,
            'profit_loss': 0.0,
            'notes': bet_info.get('notes', '')
        }

        self.performance_data['bets'].append(bet)
        self.performance_data['metadata']['total_bets'] += 1
        self.performance_data['metadata']['total_staked'] += bet['stake']

        self.save_tracking_data()
        return bet['id']

    def update_bet_result(self, bet_id: int, result: str, actual_result: str = None):
        """Fogadás eredményének frissítése"""
        for bet in self.performance_data['bets']:
            if bet['id'] == bet_id:
                bet['status'] = result  # won, lost, void
                bet['actual_result'] = actual_result

                if result == 'won':
                    bet['profit_loss'] = bet['potential_return'] - bet['stake']
                    self.performance_data['metadata']['winning_bets'] += 1
                elif result == 'lost':
                    bet['profit_loss'] = -bet['stake']
                else:  # void
                    bet['profit_loss'] = 0.0

                # Bankroll frissítése
                self.performance_data['metadata']['current_bankroll'] += bet['profit_loss']
                self.performance_data['metadata']['total_profit'] += bet['profit_loss']

                # Bankroll history
                self.performance_data['bankroll_history'].append({
                    'timestamp': datetime.now().isoformat(),
                    'bet_id': bet_id,
                    'change': bet['profit_loss'],
                    'new_balance': self.performance_data['metadata']['current_bankroll']
                })

                break

        self.save_tracking_data()

    def add_daily_summary(self, date: str = None):
        """Napi összefoglaló hozzáadása"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        # Napi fogadások
        daily_bets = [bet for bet in self.performance_data['bets']
                     if bet['date'] == date]

        if not daily_bets:
            return

        # Napi statisztikák
        total_bets = len(daily_bets)
        total_staked = sum(bet['stake'] for bet in daily_bets)
        total_profit = sum(bet['profit_loss'] for bet in daily_bets if bet['status'] != 'pending')
        won_bets = len([bet for bet in daily_bets if bet['status'] == 'won'])

        summary = {
            'date': date,
            'total_bets': total_bets,
            'won_bets': won_bets,
            'win_rate': won_bets / total_bets if total_bets > 0 else 0,
            'total_staked': total_staked,
            'total_profit': total_profit,
            'roi': (total_profit / total_staked * 100) if total_staked > 0 else 0,
            'avg_odds': np.mean([bet['odds'] for bet in daily_bets]) if daily_bets else 0,
            'avg_confidence': np.mean([bet['confidence'] for bet in daily_bets]) if daily_bets else 0
        }

        # Meglévő napi összefoglaló frissítése vagy új hozzáadása
        existing_summary = None
        for i, daily_sum in enumerate(self.performance_data['daily_summaries']):
            if daily_sum['date'] == date:
                existing_summary = i
                break

        if existing_summary is not None:
            self.performance_data['daily_summaries'][existing_summary] = summary
        else:
            self.performance_data['daily_summaries'].append(summary)

        self.save_tracking_data()
        return summary

    def calculate_performance_metrics(self) -> Dict:
        """Teljesítmény mutatók számítása"""
        bets = self.performance_data['bets']
        finished_bets = [bet for bet in bets if bet['status'] in ['won', 'lost']]

        if not finished_bets:
            return {'error': 'Nincs befejezett fogadás'}

        # Alap mutatók
        total_bets = len(finished_bets)
        won_bets = len([bet for bet in finished_bets if bet['status'] == 'won'])
        win_rate = won_bets / total_bets

        total_staked = sum(bet['stake'] for bet in finished_bets)
        total_profit = sum(bet['profit_loss'] for bet in finished_bets)
        roi = (total_profit / total_staked * 100) if total_staked > 0 else 0

        # Átlag odds és konfidencia
        avg_odds = np.mean([bet['odds'] for bet in finished_bets])
        avg_confidence = np.mean([bet['confidence'] for bet in finished_bets])

        # Sorozatok
        current_streak = self._calculate_current_streak(finished_bets)
        longest_winning_streak = self._calculate_longest_streak(finished_bets, 'won')
        longest_losing_streak = self._calculate_longest_streak(finished_bets, 'lost')

        # Havi/heti teljesítmény
        monthly_performance = self._calculate_monthly_performance(finished_bets)

        return {
            'total_bets': total_bets,
            'won_bets': won_bets,
            'lost_bets': total_bets - won_bets,
            'win_rate': round(win_rate * 100, 2),
            'total_staked': round(total_staked, 2),
            'total_profit': round(total_profit, 2),
            'roi': round(roi, 2),
            'avg_odds': round(avg_odds, 2),
            'avg_confidence': round(avg_confidence, 2),
            'current_streak': current_streak,
            'longest_winning_streak': longest_winning_streak,
            'longest_losing_streak': longest_losing_streak,
            'monthly_performance': monthly_performance,
            'bankroll_growth': self._calculate_bankroll_growth()
        }

    def _calculate_current_streak(self, bets: List[Dict]) -> Dict:
        """Jelenlegi sorozat számítása"""
        if not bets:
            return {'type': 'none', 'length': 0}

        # Időrend szerint rendezés
        sorted_bets = sorted(bets, key=lambda x: x['timestamp'])

        if not sorted_bets:
            return {'type': 'none', 'length': 0}

        current_type = sorted_bets[-1]['status']
        length = 1

        for i in range(len(sorted_bets) - 2, -1, -1):
            if sorted_bets[i]['status'] == current_type:
                length += 1
            else:
                break

        return {'type': current_type, 'length': length}

    def _calculate_longest_streak(self, bets: List[Dict], streak_type: str) -> int:
        """Leghosszabb sorozat számítása"""
        if not bets:
            return 0

        sorted_bets = sorted(bets, key=lambda x: x['timestamp'])
        max_streak = 0
        current_streak = 0

        for bet in sorted_bets:
            if bet['status'] == streak_type:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0

        return max_streak

    def _calculate_monthly_performance(self, bets: List[Dict]) -> Dict:
        """Havi teljesítmény számítása"""
        monthly_data = {}

        for bet in bets:
            month = bet['date'][:7]  # YYYY-MM

            if month not in monthly_data:
                monthly_data[month] = {
                    'bets': 0,
                    'won': 0,
                    'staked': 0.0,
                    'profit': 0.0
                }

            monthly_data[month]['bets'] += 1
            if bet['status'] == 'won':
                monthly_data[month]['won'] += 1
            monthly_data[month]['staked'] += bet['stake']
            monthly_data[month]['profit'] += bet['profit_loss']

        # ROI számítása
        for month, data in monthly_data.items():
            data['win_rate'] = round(data['won'] / data['bets'] * 100, 2)
            data['roi'] = round(data['profit'] / data['staked'] * 100, 2) if data['staked'] > 0 else 0

        return monthly_data

    def _calculate_bankroll_growth(self) -> Dict:
        """Bankroll növekedés számítása"""
        initial = self.performance_data['metadata']['initial_bankroll']
        current = self.performance_data['metadata']['current_bankroll']

        growth_amount = current - initial
        growth_percentage = (growth_amount / initial * 100) if initial > 0 else 0

        return {
            'initial_bankroll': initial,
            'current_bankroll': round(current, 2),
            'growth_amount': round(growth_amount, 2),
            'growth_percentage': round(growth_percentage, 2)
        }

    def export_to_csv(self):
        """Adatok exportálása CSV-be"""
        # Fogadások export
        bets_df = pd.DataFrame(self.performance_data['bets'])
        if not bets_df.empty:
            bets_df.to_csv(self.csv_file, index=False)

        # Napi összefoglalók export
        daily_df = pd.DataFrame(self.performance_data['daily_summaries'])
        if not daily_df.empty:
            daily_csv = self.csv_file.replace('.csv', '_daily.csv')
            daily_df.to_csv(daily_csv, index=False)

    def generate_performance_report(self) -> str:
        """Teljesítmény jelentés generálása"""
        metrics = self.calculate_performance_metrics()

        if 'error' in metrics:
            return "❌ Nincs elegendő adat a jelentés generálásához."

        report = f"""
📈 TELJESÍTMÉNY JELENTÉS
====================================
📅 Generálva: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🎯 ÖSSZEFOGLALÓ:
  📊 Összes fogadás: {metrics['total_bets']}
  ✅ Nyerő fogadások: {metrics['won_bets']}
  ❌ Vesztő fogadások: {metrics['lost_bets']}
  🎯 Találati arány: {metrics['win_rate']}%

💰 PÉNZÜGYI TELJESÍTMÉNY:
  💵 Összes tét: ${metrics['total_staked']}
  📈 Összes profit: ${metrics['total_profit']}
  📊 ROI: {metrics['roi']}%

📊 BANKROLL KEZELÉS:
  🏦 Kezdő bankroll: ${metrics['bankroll_growth']['initial_bankroll']}
  💼 Jelenlegi bankroll: ${metrics['bankroll_growth']['current_bankroll']}
  📈 Növekedés: ${metrics['bankroll_growth']['growth_amount']} ({metrics['bankroll_growth']['growth_percentage']}%)

🎲 FOGADÁSI STATISZTIKÁK:
  🎯 Átlag odds: {metrics['avg_odds']}
  🔒 Átlag konfidencia: {metrics['avg_confidence']}%

🔥 SOROZATOK:
  ➡️ Jelenlegi: {metrics['current_streak']['length']} {metrics['current_streak']['type']}
  🏆 Leghosszabb nyerő: {metrics['longest_winning_streak']}
  💀 Leghosszabb vesztő: {metrics['longest_losing_streak']}

📅 HAVI TELJESÍTMÉNY:
"""

        for month, data in metrics['monthly_performance'].items():
            report += f"  {month}: {data['won']}/{data['bets']} ({data['win_rate']}%) | ROI: {data['roi']}%\n"

        return report

def create_sample_tracking_data():
    """Minta tracking adatok létrehozása teszteléshez"""
    tracker = PerformanceTracker()

    print("🔬 Minta tracking adatok létrehozása...")

    # Múltbeli fogadások szimulálása
    dates = pd.date_range(start='2025-06-01', end='2025-06-28', freq='D')

    for date in dates:
        date_str = date.strftime('%Y-%m-%d')

        # Napi 1-3 fogadás
        daily_bets = np.random.randint(0, 4)

        for i in range(daily_bets):
            # Szimulált fogadás
            bet_info = {
                'date': date_str,
                'league': np.random.choice(['premier_league', 'mls', 'brasileirao']),
                'match': f"Team A vs Team B {i+1}",
                'bet_type': np.random.choice(['single', 'combination'], p=[0.8, 0.2]),
                'prediction': np.random.choice(['H', 'D', 'A']),
                'odds': round(np.random.uniform(1.5, 4.0), 2),
                'stake': round(np.random.uniform(10, 50), 2),
                'confidence': round(np.random.uniform(0.3, 0.9), 2),
                'edge': round(np.random.uniform(0.05, 0.3), 2),
                'strategy': np.random.choice(['value_bet', 'form_based', 'momentum'])
            }

            bet_id = tracker.add_bet(bet_info)

            # Eredmény szimulálása (70% nyerési arány a jó edge miatt)
            if np.random.random() < 0.7:
                tracker.update_bet_result(bet_id, 'won')
            else:
                tracker.update_bet_result(bet_id, 'lost')

        # Napi összefoglaló
        if daily_bets > 0:
            tracker.add_daily_summary(date_str)

    print(f"✅ {len(tracker.performance_data['bets'])} minta fogadás létrehozva")
    return tracker

def main():
    """Főprogram"""
    print("📈 TELJESÍTMÉNY TRACKING RENDSZER")
    print("=" * 40)

    # Minta adatok létrehozása
    tracker = create_sample_tracking_data()

    # Teljesítmény jelentés
    report = tracker.generate_performance_report()
    print(report)

    # CSV export ellenőrzése
    print(f"\n📁 Adatok mentve:")
    print(f"  • JSON: {tracker.tracking_file}")
    print(f"  • CSV: {tracker.csv_file}")

    print("\n🎯 Használat:")
    print("1. Új fogadás hozzáadása:")
    print("   tracker.add_bet(bet_info)")
    print("2. Eredmény frissítése:")
    print("   tracker.update_bet_result(bet_id, 'won')")
    print("3. Teljesítmény jelentés:")
    print("   tracker.generate_performance_report()")

if __name__ == "__main__":
    main()
