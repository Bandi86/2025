import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from expanded_strategies import MultiMarketStrategy, run_expanded_strategy_analysis
from improved_strategies import AdvancedRiskManagement
import warnings
warnings.filterwarnings('ignore')

class RelaxedRiskManagement:
    """Lazább kockázatkezelés több fogadás engedélyezéséhez."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.current_bankroll = initial_bankroll

        # Lazított paraméterek
        self.max_daily_loss_pct = 0.15      # Max 15% napi veszteség
        self.stop_loss_threshold = 0.60     # Stop ha 60%-ra csökken (40% veszteség)
        self.max_bet_size_pct = 0.03        # Max 3% egy fogadásra
        self.consecutive_loss_limit = 10     # Max 10 egymás utáni veszteség

        # Tracking változók
        self.daily_pnl = 0
        self.consecutive_losses = 0
        self.total_bets = 0
        self.winning_bets = 0
        self.is_stopped = False
        self.stop_reason = None

    def check_stop_conditions(self):
        """Ellenőrzi a stop feltételeket."""
        # 1. Bankroll stop-loss
        if self.current_bankroll <= (self.initial_bankroll * self.stop_loss_threshold):
            self.is_stopped = True
            self.stop_reason = f"Bankroll stop-loss: {self.current_bankroll:.2f} <= {self.initial_bankroll * self.stop_loss_threshold:.2f}"
            return True

        # 2. Egymás utáni veszteségek (lazított)
        if self.consecutive_losses >= self.consecutive_loss_limit:
            self.is_stopped = True
            self.stop_reason = f"Túl sok egymás utáni veszteség: {self.consecutive_losses}"
            return True

        return False

    def calculate_position_size(self, kelly_fraction, confidence, odds):
        """Dinamikus pozícióméret számítás."""
        if self.check_stop_conditions():
            return 0

        # Alap Kelly méret
        base_size = self.current_bankroll * kelly_fraction

        # Kockázati módosítók
        confidence_modifier = min(confidence / 0.6, 1.2)  # Bonus magas konfidenciánál

        # Volatilitás módosító
        volatility_modifier = 1.0
        if odds > 3.0:
            volatility_modifier = 0.9
        if odds > 5.0:
            volatility_modifier = 0.8

        # Consecutive loss modifier (lazított)
        loss_modifier = 1.0
        if self.consecutive_losses > 5:
            loss_modifier = 0.8
        if self.consecutive_losses > 8:
            loss_modifier = 0.6

        # Végső pozícióméret
        final_size = base_size * confidence_modifier * volatility_modifier * loss_modifier

        # Hard limit
        max_bet = self.current_bankroll * self.max_bet_size_pct
        final_size = min(final_size, max_bet)

        return max(final_size, 0.1)  # Minimum tét 0.1

    def record_bet_result(self, stake, profit):
        """Fogadás eredményének rögzítése."""
        self.total_bets += 1
        self.current_bankroll += profit
        self.daily_pnl += profit

        if profit > 0:
            self.winning_bets += 1
            self.consecutive_losses = 0
        else:
            self.consecutive_losses += 1

class ImprovedBettingSimulator:
    """Javított fogadási szimulátor reálisabb kimenetelekkel."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.risk_manager = RelaxedRiskManagement(initial_bankroll)

    def improved_outcome_simulation(self, opportunity):
        """Javított kimenetel szimuláció több tényező alapján."""
        edge = opportunity['edge']
        confidence = opportunity['confidence']
        odds = opportunity['odds']
        our_prob = opportunity['our_prob']

        # Alap valószínűség kiigazítása
        # Ha nagy az edge-ünk, csökkentsük kissé a valószínűséget (konzervatív)
        adjusted_prob = our_prob

        if edge > 0.2:  # Nagyon nagy edge - gyanús
            adjusted_prob *= 0.9
        elif edge > 0.15:  # Nagy edge
            adjusted_prob *= 0.95

        # Odds alapú kiigazítás (magas odds = nagyobb bizonytalanság)
        if odds > 4.0:
            adjusted_prob *= 0.95
        elif odds > 6.0:
            adjusted_prob *= 0.9

        # Confidence alapú kiigazítás
        if confidence < 0.7:
            adjusted_prob *= 0.9

        # Random komponens hozzáadása
        noise = np.random.normal(0, 0.05)  # 5% zajt adunk hozzá
        final_prob = max(0.05, min(0.95, adjusted_prob + noise))

        return np.random.random() < final_prob

    def backtest_opportunities(self, opportunities_df):
        """Backteszteli az összes lehetőséget."""
        results = []
        bankroll_history = [self.initial_bankroll]
        monthly_summary = {}

        current_bankroll = self.initial_bankroll
        total_bets = 0
        winning_bets = 0
        total_staked = 0
        total_profit = 0

        # Shuffle opportunities for realistic timing
        opportunities_df = opportunities_df.sample(frac=1).reset_index(drop=True)

        for idx, opp in opportunities_df.iterrows():
            if self.risk_manager.is_stopped:
                break

            # Pozícióméret számítás
            stake = self.risk_manager.calculate_position_size(
                opp['kelly'], opp['confidence'], opp['odds']
            )

            if stake <= 0.01:  # Minimum tét threshold
                continue

            # Javított kimenetel szimuláció
            bet_wins = self.improved_outcome_simulation(opp)

            # Eredmény számítás
            if bet_wins:
                profit = stake * (opp['odds'] - 1)
                winning_bets += 1
            else:
                profit = -stake

            # Bankroll és statisztikák frissítése
            current_bankroll += profit
            total_staked += stake
            total_profit += profit
            total_bets += 1

            # Risk manager frissítése
            self.risk_manager.current_bankroll = current_bankroll
            self.risk_manager.record_bet_result(stake, profit)

            # Eredmény tárolása
            results.append({
                'Date': opp['Date'],
                'HomeTeam': opp['HomeTeam'],
                'AwayTeam': opp['AwayTeam'],
                'Market': opp['market'],
                'Selection': opp['selection'],
                'Odds': opp['odds'],
                'Edge': opp['edge'],
                'Stake': stake,
                'Won': bet_wins,
                'Profit': profit,
                'Bankroll': current_bankroll,
                'Confidence': opp['confidence']
            })

            # Havi összesítés
            month_key = f"{opp['Date'].year}-{opp['Date'].month:02d}"
            if month_key not in monthly_summary:
                monthly_summary[month_key] = {
                    'bets': 0, 'wins': 0, 'total_staked': 0, 'total_profit': 0
                }

            monthly_summary[month_key]['bets'] += 1
            monthly_summary[month_key]['wins'] += int(bet_wins)
            monthly_summary[month_key]['total_staked'] += stake
            monthly_summary[month_key]['total_profit'] += profit

            bankroll_history.append(current_bankroll)

        # Végső statisztikák
        win_rate = (winning_bets / total_bets) if total_bets > 0 else 0
        roi = (total_profit / total_staked) if total_staked > 0 else 0

        summary = {
            'total_bets': total_bets,
            'winning_bets': winning_bets,
            'win_rate': win_rate,
            'total_staked': total_staked,
            'total_profit': total_profit,
            'roi': roi,
            'final_bankroll': current_bankroll,
            'profit_percentage': (current_bankroll - self.initial_bankroll) / self.initial_bankroll,
            'max_bankroll': max(bankroll_history),
            'min_bankroll': min(bankroll_history),
            'max_drawdown': (max(bankroll_history) - min(bankroll_history)) / max(bankroll_history),
            'is_stopped': self.risk_manager.is_stopped,
            'stop_reason': self.risk_manager.stop_reason
        }

        return pd.DataFrame(results), summary, monthly_summary, bankroll_history

def run_comprehensive_analysis():
    """Futtatja a teljes átfogó elemzést."""
    print("🚀 Átfogó bővített stratégia elemzés...")

    # Adatok betöltése
    from data_loader import load_data
    seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
    all_data = []

    for season in seasons:
        try:
            df_season = load_data(season)
            all_data.append(df_season)
        except FileNotFoundError:
            continue

    if not all_data:
        print("❌ Nincs elérhető adat!")
        return

    df = pd.concat(all_data, ignore_index=True)
    df = df.sort_values('Date').reset_index(drop=True)
    print(f"✅ Betöltve: {len(df)} mérkőzés {len(all_data)} szezonból")

    # Lehetőségek keresése
    print("🔍 Fogadási lehetőségek keresése...")
    opportunities, monthly_stats = run_expanded_strategy_analysis(df)
    opportunities_df = pd.DataFrame(opportunities)

    print(f"📊 Összesen {len(opportunities_df)} fogadási lehetőség található")

    # Több szimuláció futtatása
    print("🎲 Több szimulációs futtatás...")

    simulation_results = []

    for run in range(5):  # 5 különböző szimuláció
        print(f"  Futtatás {run + 1}/5...")
        simulator = ImprovedBettingSimulator(initial_bankroll=100)
        results_df, summary, monthly_summary, bankroll_history = simulator.backtest_opportunities(opportunities_df.copy())

        simulation_results.append({
            'run': run + 1,
            'results_df': results_df,
            'summary': summary,
            'monthly_summary': monthly_summary,
            'bankroll_history': bankroll_history
        })

    # Eredmények aggregálása
    print("\n" + "="*80)
    print("📊 ÁTFOGÓ BŐVÍTETT STRATÉGIA EREDMÉNYEI (5 SZIMULÁCIÓ ÁTLAGA)")
    print("="*80)

    # Átlagos teljesítmény számítása
    avg_metrics = {}
    for metric in ['total_bets', 'winning_bets', 'win_rate', 'total_staked', 'total_profit', 'roi', 'final_bankroll', 'profit_percentage', 'max_drawdown']:
        values = [sim['summary'][metric] for sim in simulation_results]
        avg_metrics[metric] = {
            'mean': np.mean(values),
            'std': np.std(values),
            'min': np.min(values),
            'max': np.max(values)
        }

    print(f"💰 Kezdeti bankroll: 100")
    print(f"💰 Átlag végső bankroll: {avg_metrics['final_bankroll']['mean']:.2f} ± {avg_metrics['final_bankroll']['std']:.2f}")
    print(f"📈 Átlag profit: {avg_metrics['total_profit']['mean']:.2f} ± {avg_metrics['total_profit']['std']:.2f} ({avg_metrics['profit_percentage']['mean']*100:.1f}% ± {avg_metrics['profit_percentage']['std']*100:.1f}%)")
    print(f"🎯 Átlag fogadások: {avg_metrics['total_bets']['mean']:.0f} ± {avg_metrics['total_bets']['std']:.0f}")
    print(f"✅ Átlag győztes fogadások: {avg_metrics['winning_bets']['mean']:.0f} ± {avg_metrics['winning_bets']['std']:.0f} ({avg_metrics['win_rate']['mean']*100:.1f}% ± {avg_metrics['win_rate']['std']*100:.1f}%)")
    print(f"💵 Átlag összes tét: {avg_metrics['total_staked']['mean']:.2f} ± {avg_metrics['total_staked']['std']:.2f}")
    print(f"📊 Átlag ROI: {avg_metrics['roi']['mean']*100:.1f}% ± {avg_metrics['roi']['std']*100:.1f}%")
    print(f"📉 Átlag max drawdown: {avg_metrics['max_drawdown']['mean']*100:.1f}% ± {avg_metrics['max_drawdown']['std']*100:.1f}%")

    # Sikeres futtatások aránya
    profitable_runs = sum(1 for sim in simulation_results if sim['summary']['total_profit'] > 0)
    print(f"🎯 Profitábilis futtatások: {profitable_runs}/5 ({profitable_runs/5*100:.0f}%)")

    # Legjobb futtatás részletei
    best_run = max(simulation_results, key=lambda x: x['summary']['total_profit'])
    print(f"\n🏆 LEGJOBB FUTTATÁS RÉSZLETEI:")
    print(f"  💰 Profit: {best_run['summary']['total_profit']:.2f} ({best_run['summary']['profit_percentage']*100:.1f}%)")
    print(f"  🎯 Fogadások: {best_run['summary']['total_bets']}")
    print(f"  ✅ Győzelmek: {best_run['summary']['winning_bets']} ({best_run['summary']['win_rate']*100:.1f}%)")
    print(f"  📊 ROI: {best_run['summary']['roi']*100:.1f}%")
    print(f"  📉 Max drawdown: {best_run['summary']['max_drawdown']*100:.1f}%")

    # Piacok szerinti összesítés
    all_results = pd.concat([sim['results_df'] for sim in simulation_results], ignore_index=True)

    print(f"\n📈 ÖSSZESÍTETT PIACOK TELJESÍTMÉNYE:")
    for market in all_results['Market'].unique():
        market_data = all_results[all_results['Market'] == market]

        total_bets = len(market_data)
        wins = market_data['Won'].sum()
        total_profit = market_data['Profit'].sum()
        total_staked = market_data['Stake'].sum()

        print(f"\n{market}:")
        print(f"  📊 Összesen fogadások: {total_bets}")
        print(f"  ✅ Győzelmek: {wins} ({wins/total_bets*100:.1f}%)")
        print(f"  💰 Összprofit: {total_profit:.2f}")
        print(f"  📊 ROI: {total_profit/total_staked*100:.1f}% (ha van tét)")
        print(f"  🎲 Átlag odds: {market_data['Odds'].mean():.2f}")
        print(f"  📈 Átlag edge: {market_data['Edge'].mean()*100:.1f}%")

    # Havi bontás a legjobb futtatásból
    print(f"\n📅 HAVI TELJESÍTMÉNY (Legjobb futtatás):")
    best_monthly = best_run['monthly_summary']
    monthly_roi = {month: data['total_profit']/data['total_staked'] if data['total_staked'] > 0 else 0
                   for month, data in best_monthly.items()}

    for month, data in sorted(best_monthly.items()):
        roi = monthly_roi[month]
        print(f"  {month}: {data['bets']} fogadás, {data['wins']} győzelem, {data['total_profit']:.2f} profit, {roi*100:.1f}% ROI")

    # CSV mentés
    all_results.to_csv('comprehensive_expanded_results.csv', index=False)
    print(f"\n💾 Eredmények mentve: comprehensive_expanded_results.csv")

    return simulation_results, avg_metrics

if __name__ == "__main__":
    simulation_results, avg_metrics = run_comprehensive_analysis()
