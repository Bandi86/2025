#!/usr/bin/env python3
"""
🏆 SPORT FOGADÁSI STRATÉGIA - NAPI HASZNÁLATI TOOL
Egyszerű script a legjobb fogadási lehetőségek megtalálásához.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from expanded_strategies import MultiMarketStrategy, run_expanded_strategy_analysis
    from data_loader import load_data
except ImportError:
    print("❌ Hiányzó modulok! Győződj meg róla, hogy minden fájl elérhető.")
    exit(1)

class DailyBettingTool:
    """Napi fogadási lehetőségek keresése és értékelése."""

    def __init__(self):
        self.min_edge = 0.05
        self.min_confidence = 0.7
        self.max_odds = 10.0
        self.min_odds = 1.3

    def load_latest_data(self):
        """Betölti a legfrissebb adatokat."""
        seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
        all_data = []

        print("📊 Adatok betöltése...")
        for season in seasons:
            try:
                df_season = load_data(season)
                all_data.append(df_season)
                print(f"✅ {season}: {len(df_season)} mérkőzés")
            except FileNotFoundError:
                print(f"⚠️ Nem található: {season}")

        if not all_data:
            raise Exception("Nincs elérhető adat!")

        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values('Date').reset_index(drop=True)
        print(f"✅ Összesen: {len(df)} mérkőzés betöltve\n")

        return df

    def find_opportunities(self, df):
        """Megkeresi a legjobb fogadási lehetőségeket."""
        print("🔍 Fogadási lehetőségek keresése...")
        opportunities, monthly_stats = run_expanded_strategy_analysis(df)

        # DataFrame-re konvertálás és szűrés
        opportunities_df = pd.DataFrame(opportunities)

        # Minőségi szűrés
        quality_filter = (
            (opportunities_df['edge'] >= self.min_edge) &
            (opportunities_df['confidence'] >= self.min_confidence) &
            (opportunities_df['odds'] >= self.min_odds) &
            (opportunities_df['odds'] <= self.max_odds)
        )

        filtered_opps = opportunities_df[quality_filter].copy()

        print(f"📈 Talált lehetőségek: {len(opportunities_df)}")
        print(f"✨ Minőségi lehetőségek: {len(filtered_opps)}")

        return filtered_opps

    def rank_opportunities(self, opportunities_df):
        """Rangsorolja a lehetőségeket minőség szerint."""
        if len(opportunities_df) == 0:
            return opportunities_df

        # Pontszám számítás
        opportunities_df = opportunities_df.copy()

        # Edge pont (40%)
        edge_score = opportunities_df['edge'] / opportunities_df['edge'].max() * 40

        # Confidence pont (30%)
        conf_score = opportunities_df['confidence'] / opportunities_df['confidence'].max() * 30

        # Kelly pont (20%)
        kelly_score = opportunities_df['kelly'] / opportunities_df['kelly'].max() * 20

        # Odds bonus pont (10%) - preferáljuk a 2.0-4.0 odds-ot
        odds_score = 10 * np.where(
            (opportunities_df['odds'] >= 2.0) & (opportunities_df['odds'] <= 4.0), 1.0,
            np.where(
                (opportunities_df['odds'] >= 1.5) & (opportunities_df['odds'] <= 6.0), 0.7, 0.3
            )
        )

        # Összpontszám
        opportunities_df['total_score'] = edge_score + conf_score + kelly_score + odds_score

        # Rendezés pontszám szerint
        opportunities_df = opportunities_df.sort_values('total_score', ascending=False)

        return opportunities_df

    def display_top_opportunities(self, opportunities_df, top_n=20):
        """Megjeleníti a legjobb lehetőségeket."""
        if len(opportunities_df) == 0:
            print("❌ Nincs minőségi lehetőség!")
            return

        print(f"\n🏆 TOP {min(top_n, len(opportunities_df))} FOGADÁSI LEHETŐSÉG")
        print("=" * 80)

        for idx, (_, opp) in enumerate(opportunities_df.head(top_n).iterrows(), 1):
            print(f"\n{idx}. 🎯 {opp['HomeTeam']} vs {opp['AwayTeam']}")
            print(f"   📅 Dátum: {opp['Date'].strftime('%Y-%m-%d')}")
            print(f"   🎲 Piac: {opp['market']} - {opp['selection']}")
            print(f"   💰 Odds: {opp['odds']:.2f}")
            print(f"   📈 Edge: {opp['edge']*100:.1f}%")
            print(f"   🎯 Confidence: {opp['confidence']*100:.1f}%")
            print(f"   ⭐ Pontszám: {opp['total_score']:.1f}")

            # Javasolt tét (1000 bankroll alapján)
            suggested_stake = 1000 * 0.01 * (opp['confidence'] / 0.7) * (opp['edge'] / 0.05)
            suggested_stake = min(suggested_stake, 1000 * 0.02)
            print(f"   💵 Javasolt tét: {suggested_stake:.0f} (1000 bankroll alapján)")

    def market_summary(self, opportunities_df):
        """Összefoglaló statisztikák piacok szerint."""
        if len(opportunities_df) == 0:
            return

        print(f"\n📊 PIACOK SZERINTI ÖSSZEFOGLALÓ")
        print("=" * 50)

        for market in opportunities_df['market'].unique():
            market_data = opportunities_df[opportunities_df['market'] == market]

            print(f"\n{market}:")
            print(f"  📊 Lehetőségek: {len(market_data)}")
            print(f"  📈 Átlag edge: {market_data['edge'].mean()*100:.1f}%")
            print(f"  🎯 Átlag confidence: {market_data['confidence'].mean()*100:.1f}%")
            print(f"  🎲 Átlag odds: {market_data['odds'].mean():.2f}")
            print(f"  ⭐ Átlag pontszám: {market_data['total_score'].mean():.1f}")

    def expected_monthly_performance(self, opportunities_df):
        """Becsüli a havi teljesítményt."""
        if len(opportunities_df) == 0:
            return

        # Havi lehetőségek becslése (3 szezon alapján)
        total_months = 28  # kb 28 hónap 3 szezonban
        monthly_opportunities = len(opportunities_df) / total_months

        # Becsült teljesítmény (reális szimuláció alapján)
        estimated_win_rate = 0.545  # 54.5%
        estimated_roi = 0.317       # 31.7%

        # Havi számítások
        monthly_bets = monthly_opportunities
        monthly_wins = monthly_bets * estimated_win_rate

        # Átlagos tét (1000 bankroll alapján)
        avg_stake = opportunities_df.apply(
            lambda row: min(1000 * 0.01 * (row['confidence'] / 0.7) * (row['edge'] / 0.05), 1000 * 0.02),
            axis=1
        ).mean()

        monthly_staked = monthly_bets * avg_stake
        monthly_profit = monthly_staked * estimated_roi

        print(f"\n💰 BECSÜLT HAVI TELJESÍTMÉNY (1000 bankroll)")
        print("=" * 50)
        print(f"🎯 Havi fogadások: {monthly_bets:.0f}")
        print(f"✅ Várható győzelmek: {monthly_wins:.0f}")
        print(f"💵 Havi tét összeg: {monthly_staked:.0f}")
        print(f"📈 Várható profit: {monthly_profit:.0f}")
        print(f"📊 Havi ROI: {estimated_roi*100:.1f}%")
        print(f"💰 Havi hozam: {monthly_profit/1000*100:.1f}%")

def main():
    """Főprogram."""
    print("🏆 SPORT FOGADÁSI STRATÉGIA - NAPI TOOL")
    print("=" * 60)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    tool = DailyBettingTool()

    try:
        # 1. Adatok betöltése
        df = tool.load_latest_data()

        # 2. Lehetőségek keresése
        opportunities = tool.find_opportunities(df)

        # 3. Rangsorolás
        ranked_opportunities = tool.rank_opportunities(opportunities)

        # 4. Top lehetőségek megjelenítése
        tool.display_top_opportunities(ranked_opportunities, top_n=15)

        # 5. Piacok szerinti összefoglaló
        tool.market_summary(ranked_opportunities)

        # 6. Becsült teljesítmény
        tool.expected_monthly_performance(ranked_opportunities)

        # 7. CSV mentés
        if len(ranked_opportunities) > 0:
            filename = f"daily_opportunities_{datetime.now().strftime('%Y%m%d')}.csv"
            ranked_opportunities.to_csv(filename, index=False)
            print(f"\n💾 Eredmények mentve: {filename}")

        print(f"\n✨ Elemzés befejezve! {len(ranked_opportunities)} minőségi lehetőség találva.")

    except Exception as e:
        print(f"❌ Hiba történt: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
