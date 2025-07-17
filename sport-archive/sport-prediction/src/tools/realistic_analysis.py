import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from expanded_strategies import MultiMarketStrategy, run_expanded_strategy_analysis
import warnings
warnings.filterwarnings('ignore')

class RealisticBettingSimulator:
    """Reális fogadási szimulátor fix tétekkel és konzervatív megközelítéssel."""

    def __init__(self, initial_bankroll=1000, fixed_stake_pct=0.01):
        self.initial_bankroll = initial_bankroll
        self.current_bankroll = initial_bankroll
        self.fixed_stake_pct = fixed_stake_pct  # Fix 1% tét az alapbankroll-ból
        self.min_confidence = 0.7
        self.min_edge = 0.05

    def should_bet(self, opportunity):
        """Eldönti, hogy fogadunk-e erre a lehetőségre."""
        # Csak magas konfidenciájú és jó edge-ű fogadások
        if opportunity['confidence'] < self.min_confidence:
            return False
        if opportunity['edge'] < self.min_edge:
            return False
        if opportunity['odds'] > 10.0:  # Túl magas odds kizárása
            return False
        if opportunity['odds'] < 1.3:   # Túl alacsony odds kizárása
            return False
        return True

    def calculate_stake(self, opportunity):
        """Fix százalékos tét számítás."""
        base_stake = self.initial_bankroll * self.fixed_stake_pct

        # Módosítók
        confidence_modifier = min(opportunity['confidence'] / 0.7, 1.5)
        edge_modifier = min(opportunity['edge'] / 0.05, 2.0)

        # Odds alapú módosító
        odds_modifier = 1.0
        if opportunity['odds'] > 3.0:
            odds_modifier = 0.8
        elif opportunity['odds'] < 2.0:
            odds_modifier = 1.2

        stake = base_stake * confidence_modifier * edge_modifier * odds_modifier

        # Maximum 2% az aktuális bankrollból
        max_stake = self.current_bankroll * 0.02
        return min(stake, max_stake)

    def simulate_realistic_outcome(self, opportunity):
        """Reális kimenetel szimuláció."""
        # Alapvalószínűség konzervatív kiigazítással
        base_prob = opportunity['our_prob']

        # Bookmaker előnyt figyelembe vesszük
        bookmaker_margin = 0.05  # 5% bookmaker előny
        adjusted_prob = base_prob * (1 - bookmaker_margin)

        # Nagy edge gyanús - csökkentjük
        if opportunity['edge'] > 0.15:
            adjusted_prob *= 0.9
        elif opportunity['edge'] > 0.20:
            adjusted_prob *= 0.8

        # Magas odds bizonytalanabb
        if opportunity['odds'] > 4.0:
            adjusted_prob *= 0.95
        elif opportunity['odds'] > 6.0:
            adjusted_prob *= 0.9

        # Kis zaj hozzáadása
        noise = np.random.normal(0, 0.03)
        final_prob = max(0.1, min(0.9, adjusted_prob + noise))

        return np.random.random() < final_prob

    def backtest_realistic(self, opportunities_df):
        """Reális backtest fix tétekkel."""
        results = []
        bankroll_history = [self.current_bankroll]

        # Szűrés és rendezés
        filtered_opportunities = []
        for _, opp in opportunities_df.iterrows():
            if self.should_bet(opp):
                filtered_opportunities.append(opp)

        print(f"📊 Szűrés után: {len(filtered_opportunities)} / {len(opportunities_df)} lehetőség")

        total_bets = 0
        winning_bets = 0
        total_staked = 0
        total_profit = 0

        for opp in filtered_opportunities:
            stake = self.calculate_stake(opp)

            if stake < 1:  # Minimum 1 egység tét
                continue

            # Kimenetel szimuláció
            bet_wins = self.simulate_realistic_outcome(opp)

            # Eredmény számítás
            if bet_wins:
                profit = stake * (opp['odds'] - 1)
                winning_bets += 1
            else:
                profit = -stake

            # Bankroll frissítés
            self.current_bankroll += profit
            total_staked += stake
            total_profit += profit
            total_bets += 1

            # Eredmény tárolás
            results.append({
                'Date': opp['Date'],
                'HomeTeam': opp['HomeTeam'],
                'AwayTeam': opp['AwayTeam'],
                'Market': opp['market'],
                'Selection': opp['selection'],
                'Odds': opp['odds'],
                'Edge': opp['edge'],
                'Confidence': opp['confidence'],
                'Stake': stake,
                'Won': bet_wins,
                'Profit': profit,
                'Bankroll': self.current_bankroll
            })

            bankroll_history.append(self.current_bankroll)

            # Stop ha túl nagy veszteség
            if self.current_bankroll < self.initial_bankroll * 0.5:
                print(f"⚠️ Leállítva túl nagy veszteség miatt: {self.current_bankroll:.2f}")
                break

        # Statisztikák
        win_rate = winning_bets / total_bets if total_bets > 0 else 0
        roi = total_profit / total_staked if total_staked > 0 else 0

        summary = {
            'total_bets': total_bets,
            'winning_bets': winning_bets,
            'win_rate': win_rate,
            'total_staked': total_staked,
            'total_profit': total_profit,
            'roi': roi,
            'final_bankroll': self.current_bankroll,
            'profit_percentage': (self.current_bankroll - self.initial_bankroll) / self.initial_bankroll,
            'max_bankroll': max(bankroll_history),
            'min_bankroll': min(bankroll_history)
        }

        return pd.DataFrame(results), summary, bankroll_history

def run_multiple_realistic_simulations(num_runs=10):
    """Több reális szimulációt futtat."""
    print("🚀 Reális szimuláció indítása...")

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

    df = pd.concat(all_data, ignore_index=True)
    df = df.sort_values('Date').reset_index(drop=True)

    # Lehetőségek keresése
    print("🔍 Fogadási lehetőségek keresése...")
    opportunities, _ = run_expanded_strategy_analysis(df)
    opportunities_df = pd.DataFrame(opportunities)

    print(f"📊 Összesen {len(opportunities_df)} lehetőség")

    # Több szimuláció
    simulation_results = []

    for run in range(num_runs):
        print(f"  🎲 Futtatás {run + 1}/{num_runs}...")

        simulator = RealisticBettingSimulator(initial_bankroll=1000, fixed_stake_pct=0.01)
        results_df, summary, bankroll_history = simulator.backtest_realistic(opportunities_df.copy())

        simulation_results.append({
            'run': run + 1,
            'summary': summary,
            'results_df': results_df,
            'bankroll_history': bankroll_history
        })

    # Eredmények elemzése
    print("\n" + "="*70)
    print("📊 REÁLIS SZIMULÁCIÓK EREDMÉNYEI")
    print("="*70)

    # Átlagos teljesítmény
    metrics = ['total_bets', 'winning_bets', 'win_rate', 'total_profit', 'roi', 'final_bankroll', 'profit_percentage']

    for metric in metrics:
        values = [sim['summary'][metric] for sim in simulation_results]
        avg = np.mean(values)
        std = np.std(values)

        if metric == 'win_rate' or metric == 'roi' or metric == 'profit_percentage':
            print(f"{metric}: {avg*100:.1f}% ± {std*100:.1f}%")
        else:
            print(f"{metric}: {avg:.1f} ± {std:.1f}")

    # Profitábilis futtatások
    profitable_runs = sum(1 for sim in simulation_results if sim['summary']['total_profit'] > 0)
    print(f"\n🎯 Profitábilis futtatások: {profitable_runs}/{num_runs} ({profitable_runs/num_runs*100:.0f}%)")

    # Legjobb és legrosszabb futtatás
    best_run = max(simulation_results, key=lambda x: x['summary']['total_profit'])
    worst_run = min(simulation_results, key=lambda x: x['summary']['total_profit'])

    print(f"\n🏆 Legjobb futtatás:")
    print(f"  💰 Profit: {best_run['summary']['total_profit']:.2f} ({best_run['summary']['profit_percentage']*100:.1f}%)")
    print(f"  🎯 Fogadások: {best_run['summary']['total_bets']}")
    print(f"  ✅ Nyerési arány: {best_run['summary']['win_rate']*100:.1f}%")
    print(f"  📊 ROI: {best_run['summary']['roi']*100:.1f}%")

    print(f"\n📉 Legrosszabb futtatás:")
    print(f"  💰 Profit: {worst_run['summary']['total_profit']:.2f} ({worst_run['summary']['profit_percentage']*100:.1f}%)")
    print(f"  🎯 Fogadások: {worst_run['summary']['total_bets']}")
    print(f"  ✅ Nyerési arány: {worst_run['summary']['win_rate']*100:.1f}%")
    print(f"  📊 ROI: {worst_run['summary']['roi']*100:.1f}%")

    # Piacok elemzése (legjobb futtatásból)
    if len(best_run['results_df']) > 0:
        print(f"\n📈 PIACOK TELJESÍTMÉNYE (Legjobb futtatás):")

        for market in best_run['results_df']['Market'].unique():
            market_data = best_run['results_df'][best_run['results_df']['Market'] == market]

            market_bets = len(market_data)
            market_wins = market_data['Won'].sum()
            market_profit = market_data['Profit'].sum()
            market_staked = market_data['Stake'].sum()

            print(f"\n{market}:")
            print(f"  📊 Fogadások: {market_bets}")
            print(f"  ✅ Győzelmek: {market_wins} ({market_wins/market_bets*100:.1f}%)")
            print(f"  💰 Profit: {market_profit:.2f}")
            print(f"  📊 ROI: {market_profit/market_staked*100:.1f}%")
            print(f"  🎲 Átlag odds: {market_data['Odds'].mean():.2f}")

    # Havi teljesítmény (legjobb futtatás)
    if len(best_run['results_df']) > 0:
        print(f"\n📅 HAVI TELJESÍTMÉNY (Legjobb futtatás, első 12 hónap):")

        best_results = best_run['results_df'].copy()
        best_results['Month'] = best_results['Date'].dt.to_period('M')
        monthly_stats = best_results.groupby('Month').agg({
            'Stake': 'sum',
            'Profit': 'sum',
            'Won': 'sum'
        }).reset_index()
        monthly_stats['Bets'] = best_results.groupby('Month').size().values
        monthly_stats['ROI'] = monthly_stats['Profit'] / monthly_stats['Stake'] * 100

        for _, row in monthly_stats.head(12).iterrows():
            print(f"  {row['Month']}: {row['Bets']} fogadás, {row['Won']} győzelem, {row['Profit']:.2f} profit, {row['ROI']:.1f}% ROI")

    return simulation_results

def analyze_opportunity_quality(opportunities_df):
    """Elemzi a lehetőségek minőségét."""
    print("\n📊 LEHETŐSÉGEK MINŐSÉGI ELEMZÉSE:")

    # Edge szerinti bontás
    edge_bins = [0, 0.05, 0.10, 0.15, 0.20, 1.0]
    edge_labels = ['0-5%', '5-10%', '10-15%', '15-20%', '20%+']
    opportunities_df['edge_category'] = pd.cut(opportunities_df['edge'], bins=edge_bins, labels=edge_labels, include_lowest=True)

    print("\n📈 Edge szerinti megoszlás:")
    edge_counts = opportunities_df['edge_category'].value_counts()
    for category, count in edge_counts.items():
        pct = count / len(opportunities_df) * 100
        print(f"  {category}: {count} db ({pct:.1f}%)")

    # Confidence szerinti bontás
    conf_bins = [0, 0.6, 0.7, 0.8, 0.9, 1.0]
    conf_labels = ['<60%', '60-70%', '70-80%', '80-90%', '90%+']
    opportunities_df['conf_category'] = pd.cut(opportunities_df['confidence'], bins=conf_bins, labels=conf_labels, include_lowest=True)

    print("\n🎯 Confidence szerinti megoszlás:")
    conf_counts = opportunities_df['conf_category'].value_counts()
    for category, count in conf_counts.items():
        pct = count / len(opportunities_df) * 100
        print(f"  {category}: {count} db ({pct:.1f}%)")

    # Odds szerinti bontás
    odds_bins = [0, 1.5, 2.0, 3.0, 5.0, 100]
    odds_labels = ['<1.5', '1.5-2.0', '2.0-3.0', '3.0-5.0', '5.0+']
    opportunities_df['odds_category'] = pd.cut(opportunities_df['odds'], bins=odds_bins, labels=odds_labels, include_lowest=True)

    print("\n🎲 Odds szerinti megoszlás:")
    odds_counts = opportunities_df['odds_category'].value_counts()
    for category, count in odds_counts.items():
        pct = count / len(opportunities_df) * 100
        print(f"  {category}: {count} db ({pct:.1f}%)")

    # Minőségi kritériumok alapján szűrés
    high_quality = opportunities_df[
        (opportunities_df['edge'] >= 0.05) &
        (opportunities_df['confidence'] >= 0.7) &
        (opportunities_df['odds'] >= 1.3) &
        (opportunities_df['odds'] <= 10.0)
    ]

    print(f"\n✨ Minőségi lehetőségek (edge>=5%, confidence>=70%, 1.3<=odds<=10.0):")
    print(f"  📊 Összesen: {len(high_quality)} / {len(opportunities_df)} ({len(high_quality)/len(opportunities_df)*100:.1f}%)")
    print(f"  📈 Átlag edge: {high_quality['edge'].mean()*100:.1f}%")
    print(f"  🎯 Átlag confidence: {high_quality['confidence'].mean()*100:.1f}%")
    print(f"  🎲 Átlag odds: {high_quality['odds'].mean():.2f}")

    return high_quality

if __name__ == "__main__":
    # Lehetőségek minőségi elemzése
    from data_loader import load_data
    seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
    all_data = []

    for season in seasons:
        try:
            df_season = load_data(season)
            all_data.append(df_season)
        except FileNotFoundError:
            continue

    df = pd.concat(all_data, ignore_index=True)
    opportunities, _ = run_expanded_strategy_analysis(df)
    opportunities_df = pd.DataFrame(opportunities)

    high_quality_opps = analyze_opportunity_quality(opportunities_df)

    # Reális szimulációk futtatása
    simulation_results = run_multiple_realistic_simulations(num_runs=10)
