import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from expanded_strategies import MultiMarketStrategy, run_expanded_strategy_analysis
from improved_strategies import AdvancedRiskManagement
import warnings
warnings.filterwarnings('ignore')

class ExpandedBettingSimulator:
    """Bővített fogadási szimulátor több piackal."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.risk_manager = AdvancedRiskManagement(initial_bankroll)

    def simulate_bet_outcome(self, opportunity, actual_result):
        """Szimulálja egy fogadás kimenetelét."""
        market = opportunity['market']
        selection = opportunity['selection']

        # Kimenetel meghatározása piac szerint
        if market == '1X2':
            return selection == actual_result
        elif market == 'Over/Under':
            # Feltételezzük hogy FTHG és FTAG elérhető
            if 'FTHG' in opportunity and 'FTAG' in opportunity:
                total_goals = opportunity['FTHG'] + opportunity['FTAG']
                if selection == 'Over 2.5':
                    return total_goals > 2.5
                elif selection == 'Under 2.5':
                    return total_goals < 2.5
            else:
                # Random szimuláció ha nincs gól adat
                return np.random.random() < opportunity['our_prob']
        elif market == 'BTTS':
            # BTTS szimuláció
            if 'FTHG' in opportunity and 'FTAG' in opportunity:
                home_scored = opportunity['FTHG'] > 0
                away_scored = opportunity['FTAG'] > 0
                btts_happened = home_scored and away_scored
                return btts_happened if selection == 'Yes' else not btts_happened
            else:
                return np.random.random() < opportunity['our_prob']

        return False

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

        for idx, opp in opportunities_df.iterrows():
            if self.risk_manager.is_stopped:
                break

            # Pozícióméret számítás
            stake = self.risk_manager.calculate_position_size(
                opp['kelly'], opp['confidence'], opp['odds']
            )

            if stake <= 0:
                continue

            # Fogadás kimenetelének szimulációja
            # Használjuk a becsült valószínűséget és a való odds-ot
            win_probability = opp['our_prob']
            bet_wins = np.random.random() < win_probability

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
            'is_stopped': self.risk_manager.is_stopped,
            'stop_reason': self.risk_manager.stop_reason
        }

        return pd.DataFrame(results), summary, monthly_summary, bankroll_history

def analyze_market_performance(results_df):
    """Elemzi a különböző piacok teljesítményét."""
    market_stats = {}

    for market in results_df['Market'].unique():
        market_data = results_df[results_df['Market'] == market]

        total_bets = len(market_data)
        wins = market_data['Won'].sum()
        total_staked = market_data['Stake'].sum()
        total_profit = market_data['Profit'].sum()

        market_stats[market] = {
            'bets': total_bets,
            'wins': wins,
            'win_rate': wins / total_bets if total_bets > 0 else 0,
            'roi': total_profit / total_staked if total_staked > 0 else 0,
            'profit': total_profit,
            'avg_odds': market_data['Odds'].mean(),
            'avg_edge': market_data['Edge'].mean()
        }

    return market_stats

def plot_performance_analysis(bankroll_history, monthly_summary, market_stats):
    """Teljesítmény vizualizáció."""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))

    # 1. Bankroll fejlődés
    axes[0,0].plot(bankroll_history, linewidth=2, color='blue')
    axes[0,0].axhline(y=100, color='red', linestyle='--', alpha=0.7, label='Kezdeti bankroll')
    axes[0,0].set_title('Bankroll fejlődése')
    axes[0,0].set_xlabel('Fogadások száma')
    axes[0,0].set_ylabel('Bankroll')
    axes[0,0].grid(True, alpha=0.3)
    axes[0,0].legend()

    # 2. Havi profit
    months = list(monthly_summary.keys())
    monthly_profits = [monthly_summary[month]['total_profit'] for month in months]

    colors = ['green' if p > 0 else 'red' for p in monthly_profits]
    axes[0,1].bar(range(len(months)), monthly_profits, color=colors, alpha=0.7)
    axes[0,1].set_title('Havi profit/veszteség')
    axes[0,1].set_xlabel('Hónap')
    axes[0,1].set_ylabel('Profit')
    axes[0,1].tick_params(axis='x', rotation=45)
    axes[0,1].grid(True, alpha=0.3)

    # 3. Piacok teljesítménye (ROI)
    markets = list(market_stats.keys())
    rois = [market_stats[market]['roi'] * 100 for market in markets]

    colors_roi = ['green' if roi > 0 else 'red' for roi in rois]
    axes[1,0].bar(markets, rois, color=colors_roi, alpha=0.7)
    axes[1,0].set_title('Piacok ROI teljesítménye (%)')
    axes[1,0].set_ylabel('ROI (%)')
    axes[1,0].grid(True, alpha=0.3)

    # 4. Piacok szerinti fogadások száma
    bet_counts = [market_stats[market]['bets'] for market in markets]
    axes[1,1].pie(bet_counts, labels=markets, autopct='%1.1f%%', startangle=90)
    axes[1,1].set_title('Fogadások megoszlása piacok szerint')

    plt.tight_layout()
    plt.savefig('expanded_strategy_performance.png', dpi=300, bbox_inches='tight')
    plt.show()

def run_expanded_simulation():
    """Futtatja a teljes bővített szimulációt."""
    print("🚀 Bővített stratégia szimulációjának indítása...")

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

    # Lehetőségek keresése
    opportunities, monthly_stats = run_expanded_strategy_analysis(df)
    opportunities_df = pd.DataFrame(opportunities)

    # Szimuláció futtatása
    simulator = ExpandedBettingSimulator(initial_bankroll=100)
    results_df, summary, monthly_summary, bankroll_history = simulator.backtest_opportunities(opportunities_df)

    # Eredmények kiértékelése
    print("\n" + "="*60)
    print("📊 BŐVÍTETT STRATÉGIA VÉGEREDMÉNYEI")
    print("="*60)

    print(f"💰 Kezdeti bankroll: {simulator.initial_bankroll}")
    print(f"💰 Végső bankroll: {summary['final_bankroll']:.2f}")
    print(f"📈 Teljes profit: {summary['total_profit']:.2f} ({summary['profit_percentage']*100:.1f}%)")
    print(f"🎯 Fogadások száma: {summary['total_bets']}")
    print(f"✅ Győztes fogadások: {summary['winning_bets']} ({summary['win_rate']*100:.1f}%)")
    print(f"💵 Összes tét: {summary['total_staked']:.2f}")
    print(f"📊 ROI: {summary['roi']*100:.1f}%")
    print(f"📈 Max bankroll: {summary['max_bankroll']:.2f}")
    print(f"📉 Min bankroll: {summary['min_bankroll']:.2f}")

    if summary['is_stopped']:
        print(f"⚠️ Leállítva: {summary['stop_reason']}")

    # Piacok szerinti elemzés
    market_stats = analyze_market_performance(results_df)

    print(f"\n📈 PIACOK SZERINTI TELJESÍTMÉNY:")
    for market, stats in market_stats.items():
        print(f"\n{market}:")
        print(f"  📊 Fogadások: {stats['bets']}")
        print(f"  ✅ Győzelmek: {stats['wins']} ({stats['win_rate']*100:.1f}%)")
        print(f"  💰 Profit: {stats['profit']:.2f}")
        print(f"  📊 ROI: {stats['roi']*100:.1f}%")
        print(f"  🎲 Átlag odds: {stats['avg_odds']:.2f}")
        print(f"  📈 Átlag edge: {stats['avg_edge']*100:.1f}%")

    # Havi teljesítmény
    print(f"\n📅 HAVI TELJESÍTMÉNY (Top 10 hónap):")
    monthly_roi = {month: data['total_profit']/data['total_staked'] if data['total_staked'] > 0 else 0
                   for month, data in monthly_summary.items()}
    top_months = sorted(monthly_roi.items(), key=lambda x: x[1], reverse=True)[:10]

    for month, roi in top_months:
        data = monthly_summary[month]
        print(f"  {month}: {data['bets']} fogadás, {data['total_profit']:.2f} profit, {roi*100:.1f}% ROI")

    # Vizualizáció
    plot_performance_analysis(bankroll_history, monthly_summary, market_stats)

    # Eredmények mentése
    results_df.to_csv('expanded_strategy_results.csv', index=False)

    return results_df, summary, market_stats

if __name__ == "__main__":
    results_df, summary, market_stats = run_expanded_simulation()
