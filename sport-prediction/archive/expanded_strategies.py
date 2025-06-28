import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings('ignore')

class ExpandedBettingEngine:
    """Bővített fogadási motor több esélyre és több típusú fogadásra."""

    def __init__(self, df):
        self.df = df.copy()
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df = self.df.sort_values('Date').reset_index(drop=True)
        self.predictions = {}

    def enhanced_team_form(self, team, date, games_back=5, weight_recent=True):
        """Fejlett csapat forma elemzés súlyozott pontokkal."""
        team_games = self.df[
            ((self.df['HomeTeam'] == team) | (self.df['AwayTeam'] == team)) &
            (self.df['Date'] < date)
        ].tail(games_back)

        if len(team_games) == 0:
            return {'form_score': 0.5, 'attacking_form': 0, 'defensive_form': 0}

        points = []
        goals_for = []
        goals_against = []

        for idx, game in team_games.iterrows():
            if game['HomeTeam'] == team:
                gf = game['FTHG']
                ga = game['FTAG']
                if game['FTR'] == 'H':
                    pts = 3
                elif game['FTR'] == 'D':
                    pts = 1
                else:
                    pts = 0
            else:
                gf = game['FTAG']
                ga = game['FTHG']
                if game['FTR'] == 'A':
                    pts = 3
                elif game['FTR'] == 'D':
                    pts = 1
                else:
                    pts = 0

            points.append(pts)
            goals_for.append(gf)
            goals_against.append(ga)

        # Súlyozott forma (újabb meccsek nagyobb súlya)
        if weight_recent:
            weights = np.exp(np.linspace(-1, 0, len(points)))
            weights = weights / weights.sum()
        else:
            weights = np.ones(len(points)) / len(points)

        form_score = np.average(points, weights=weights) / 3
        attacking_form = np.average(goals_for, weights=weights)
        defensive_form = np.average(goals_against, weights=weights)

        return {
            'form_score': form_score,
            'attacking_form': attacking_form,
            'defensive_form': defensive_form,
            'recent_points': sum(points[-3:]) if len(points) >= 3 else sum(points)
        }

    def head_to_head_analysis(self, home_team, away_team, date, games_back=5):
        """Egymás elleni történelmi eredmények elemzése."""
        h2h_games = self.df[
            (((self.df['HomeTeam'] == home_team) & (self.df['AwayTeam'] == away_team)) |
             ((self.df['HomeTeam'] == away_team) & (self.df['AwayTeam'] == home_team))) &
            (self.df['Date'] < date)
        ].tail(games_back)

        if len(h2h_games) == 0:
            return {'home_wins': 0, 'away_wins': 0, 'draws': 0, 'total_games': 0, 'avg_goals': 2.5}

        home_wins = 0
        away_wins = 0
        draws = 0
        total_goals = []

        for _, game in h2h_games.iterrows():
            total_goals.append(game['FTHG'] + game['FTAG'])

            if game['HomeTeam'] == home_team:
                if game['FTR'] == 'H':
                    home_wins += 1
                elif game['FTR'] == 'A':
                    away_wins += 1
                else:
                    draws += 1
            else:  # away_team volt hazai
                if game['FTR'] == 'H':
                    away_wins += 1
                elif game['FTR'] == 'A':
                    home_wins += 1
                else:
                    draws += 1

        return {
            'home_wins': home_wins,
            'away_wins': away_wins,
            'draws': draws,
            'total_games': len(h2h_games),
            'avg_goals': np.mean(total_goals) if total_goals else 2.5
        }

    def calculate_motivation_factor(self, team, date, gameweek):
        """Motivációs faktor: szezon vége, kiesés elleni küzdelem, stb."""
        # Szezon pozíció becslése (egyszerűsített)
        season_games = self.df[
            ((self.df['HomeTeam'] == team) | (self.df['AwayTeam'] == team)) &
            (self.df['Date'] < date) &
            (self.df['Date'] >= date - pd.Timedelta(days=180))  # kb fél szezon
        ]

        if len(season_games) == 0:
            return 1.0

        points = 0
        for _, game in season_games.iterrows():
            if game['HomeTeam'] == team:
                if game['FTR'] == 'H':
                    points += 3
                elif game['FTR'] == 'D':
                    points += 1
            else:
                if game['FTR'] == 'A':
                    points += 3
                elif game['FTR'] == 'D':
                    points += 1

        # Becslés alapján motivációs faktor
        ppg = points / max(len(season_games), 1)

        # Magas motiváció ha:
        # - Kiesés elleni küzdelem (alacsony ppg)
        # - Európai kupaért harc (közepes-magas ppg)
        if ppg < 1.0:  # Kiesés elleni harc
            return 1.3
        elif ppg > 2.0:  # Bajnokságért/kupáért harc
            return 1.2
        else:
            return 1.0

    def multi_strategy_prediction(self, home_team, away_team, date, odds_h, odds_d, odds_a):
        """Többféle stratégia kombinálása egy fogadási döntésért."""

        # 1. Forma analízis
        home_form = self.enhanced_team_form(home_team, date)
        away_form = self.enhanced_team_form(away_team, date)

        # 2. Head-to-head
        h2h = self.head_to_head_analysis(home_team, away_team, date)

        # 3. Motivációs faktorok
        home_motivation = self.calculate_motivation_factor(home_team, date, 1)
        away_motivation = self.calculate_motivation_factor(away_team, date, 1)

        # 4. Odds-based value calculation
        implicit_probs = {
            'H': 1/odds_h,
            'D': 1/odds_d,
            'A': 1/odds_a
        }

        # Normalizálás (bookmaker margin eltávolítása)
        total_prob = sum(implicit_probs.values())
        fair_probs = {k: v/total_prob for k, v in implicit_probs.items()}

        # 5. Saját valószínűség becslése
        form_diff = home_form['form_score'] - away_form['form_score']
        attacking_advantage = home_form['attacking_form'] - away_form['defensive_form']
        defensive_advantage = away_form['attacking_form'] - home_form['defensive_form']

        # Hazai pálya előny
        home_advantage = 0.15

        # Alap valószínűségek forma alapján
        home_prob = 0.33 + form_diff * 0.3 + home_advantage
        away_prob = 0.33 - form_diff * 0.3
        draw_prob = 1 - home_prob - away_prob

        # H2H módosítás
        if h2h['total_games'] >= 3:
            h2h_weight = 0.1
            h2h_home_rate = h2h['home_wins'] / h2h['total_games']
            h2h_away_rate = h2h['away_wins'] / h2h['total_games']

            home_prob = home_prob * (1 - h2h_weight) + h2h_home_rate * h2h_weight
            away_prob = away_prob * (1 - h2h_weight) + h2h_away_rate * h2h_weight
            draw_prob = 1 - home_prob - away_prob

        # Motivációs módosítás
        if home_motivation > 1.1:
            home_prob *= 1.05
        if away_motivation > 1.1:
            away_prob *= 1.05

        # Normalizálás
        total = home_prob + draw_prob + away_prob
        our_probs = {
            'H': home_prob / total,
            'D': draw_prob / total,
            'A': away_prob / total
        }

        # 6. Value calculation
        values = {}
        kelly_fractions = {}

        for outcome in ['H', 'D', 'A']:
            edge = our_probs[outcome] - fair_probs[outcome]
            if edge > 0.05:  # Legalább 5% edge
                odds_val = odds_h if outcome == 'H' else (odds_d if outcome == 'D' else odds_a)
                kelly = edge / (odds_val - 1)
                kelly_conservative = kelly * 0.25  # Kelly 25%-a

                values[outcome] = {
                    'edge': edge,
                    'our_prob': our_probs[outcome],
                    'fair_prob': fair_probs[outcome],
                    'kelly': kelly_conservative,
                    'odds': odds_val,
                    'confidence': min(abs(edge) * 10, 1.0)
                }

        return values

    def goals_market_analysis(self, home_team, away_team, date, over_under_line=2.5):
        """Over/Under gólok piaci elemzése."""
        home_form = self.enhanced_team_form(home_team, date)
        away_form = self.enhanced_team_form(away_team, date)
        h2h = self.head_to_head_analysis(home_team, away_team, date)

        # Várható gólok számítása
        expected_home_goals = (home_form['attacking_form'] + away_form['defensive_form']) / 2
        expected_away_goals = (away_form['attacking_form'] + home_form['defensive_form']) / 2
        expected_total = expected_home_goals + expected_away_goals + 0.2  # Hazai pálya bónusz

        # H2H módosítás
        if h2h['total_games'] >= 3:
            expected_total = expected_total * 0.8 + h2h['avg_goals'] * 0.2

        # Over/Under döntés
        over_prob = 1 / (1 + np.exp(-(expected_total - over_under_line) * 2))
        under_prob = 1 - over_prob

        return {
            'expected_goals': expected_total,
            'over_prob': over_prob,
            'under_prob': under_prob,
            'line': over_under_line
        }

    def btts_analysis(self, home_team, away_team, date):
        """Both Teams To Score elemzése."""
        home_form = self.enhanced_team_form(home_team, date)
        away_form = self.enhanced_team_form(away_team, date)

        # Mindkét csapat gólszerzési valószínűsége
        home_scoring_prob = min(home_form['attacking_form'] / 2.0, 0.9)
        away_scoring_prob = min(away_form['attacking_form'] / 2.0, 0.9)

        # BTTS valószínűség
        btts_prob = home_scoring_prob * away_scoring_prob
        no_btts_prob = 1 - btts_prob

        return {
            'btts_prob': btts_prob,
            'no_btts_prob': no_btts_prob,
            'home_scoring_prob': home_scoring_prob,
            'away_scoring_prob': away_scoring_prob
        }

class MultiMarketStrategy:
    """Többpiacos stratégia több fogadási lehetőséggel."""

    def __init__(self, df):
        self.engine = ExpandedBettingEngine(df)
        self.min_edge = 0.03  # Minimum 3% edge
        self.min_confidence = 0.6

    def find_all_opportunities(self, match_data):
        """Minden elérhető lehetőség megkeresése egy mérkőzésre."""
        opportunities = []

        date = match_data['Date']
        home_team = match_data['HomeTeam']
        away_team = match_data['AwayTeam']

        # 1x2 piac
        if all(col in match_data for col in ['B365H', 'B365D', 'B365A']):
            odds_h = match_data['B365H']
            odds_d = match_data['B365D']
            odds_a = match_data['B365A']

            if all(odds > 1.1 for odds in [odds_h, odds_d, odds_a]):
                predictions = self.engine.multi_strategy_prediction(
                    home_team, away_team, date, odds_h, odds_d, odds_a
                )

                for outcome, pred in predictions.items():
                    if pred['edge'] >= self.min_edge and pred['confidence'] >= self.min_confidence:
                        opportunities.append({
                            'market': '1X2',
                            'selection': outcome,
                            'odds': pred['odds'],
                            'edge': pred['edge'],
                            'kelly': pred['kelly'],
                            'confidence': pred['confidence'],
                            'our_prob': pred['our_prob']
                        })

        # Over/Under piac
        if 'B365>2.5' in match_data and 'B365<2.5' in match_data:
            over_odds = match_data['B365>2.5']
            under_odds = match_data['B365<2.5']

            if over_odds > 1.1 and under_odds > 1.1:
                goals_analysis = self.engine.goals_market_analysis(home_team, away_team, date)

                # Over 2.5 check
                fair_over_prob = 1 / over_odds
                our_over_prob = goals_analysis['over_prob']
                over_edge = our_over_prob - fair_over_prob

                if over_edge >= self.min_edge:
                    kelly = over_edge / (over_odds - 1) * 0.25
                    opportunities.append({
                        'market': 'Over/Under',
                        'selection': 'Over 2.5',
                        'odds': over_odds,
                        'edge': over_edge,
                        'kelly': kelly,
                        'confidence': min(abs(over_edge) * 10, 1.0),
                        'our_prob': our_over_prob
                    })

                # Under 2.5 check
                fair_under_prob = 1 / under_odds
                our_under_prob = goals_analysis['under_prob']
                under_edge = our_under_prob - fair_under_prob

                if under_edge >= self.min_edge:
                    kelly = under_edge / (under_odds - 1) * 0.25
                    opportunities.append({
                        'market': 'Over/Under',
                        'selection': 'Under 2.5',
                        'odds': under_odds,
                        'edge': under_edge,
                        'kelly': kelly,
                        'confidence': min(abs(under_edge) * 10, 1.0),
                        'our_prob': our_under_prob
                    })

        # BTTS piac
        if 'BbAv>2.5' in match_data:  # Proxy BTTS odds
            # Becsüljük a BTTS odds-okat
            btts_analysis = self.engine.btts_analysis(home_team, away_team, date)
            estimated_btts_odds = 1 / btts_analysis['btts_prob'] if btts_analysis['btts_prob'] > 0.1 else 10

            if 1.3 <= estimated_btts_odds <= 3.0:  # Reális tartomány
                btts_edge = btts_analysis['btts_prob'] - (1 / estimated_btts_odds)

                if btts_edge >= self.min_edge:
                    kelly = btts_edge / (estimated_btts_odds - 1) * 0.25
                    opportunities.append({
                        'market': 'BTTS',
                        'selection': 'Yes',
                        'odds': estimated_btts_odds,
                        'edge': btts_edge,
                        'kelly': kelly,
                        'confidence': min(abs(btts_edge) * 8, 1.0),
                        'our_prob': btts_analysis['btts_prob']
                    })

        return opportunities

    def enhanced_filtering(self, opportunities):
        """Fejlett szűrés a legjobb lehetőségekért."""
        if not opportunities:
            return []

        # Prioritási sorrendezés
        scored_opportunities = []

        for opp in opportunities:
            score = 0

            # Edge súly (40%)
            score += opp['edge'] * 40

            # Confidence súly (30%)
            score += opp['confidence'] * 30

            # Kelly súly (20%)
            score += min(opp['kelly'] * 100, 10) * 2

            # Odds range bonus (10%) - közép odds preferált
            if 1.8 <= opp['odds'] <= 3.0:
                score += 10
            elif 1.5 <= opp['odds'] <= 4.0:
                score += 5

            # Piac diverzifikáció
            if opp['market'] == '1X2':
                score += 2  # Alapvető piac
            elif opp['market'] == 'Over/Under':
                score += 3  # Jó volatilitás
            elif opp['market'] == 'BTTS':
                score += 1  # Spec piac

            scored_opportunities.append({
                **opp,
                'total_score': score
            })

        # Rendezés pontszám alapján
        scored_opportunities.sort(key=lambda x: x['total_score'], reverse=True)

        return scored_opportunities

def run_expanded_strategy_analysis(df):
    """Bővített stratégia teljes elemzése."""
    strategy = MultiMarketStrategy(df)

    all_opportunities = []
    monthly_stats = {}

    print("🔍 Bővített elemzés futtatása...")

    for idx, row in df.iterrows():
        if idx < 100:  # Skip first 100 games for historical data
            continue

        opportunities = strategy.find_all_opportunities(row)
        filtered_opps = strategy.enhanced_filtering(opportunities)

        if filtered_opps:
            month_year = f"{row['Date'].year}-{row['Date'].month:02d}"
            if month_year not in monthly_stats:
                monthly_stats[month_year] = {'count': 0, 'total_edge': 0}

            monthly_stats[month_year]['count'] += len(filtered_opps)
            monthly_stats[month_year]['total_edge'] += sum(opp['edge'] for opp in filtered_opps)

            for opp in filtered_opps[:2]:  # Max 2 legjobb lehetőség mérkőzésenként
                all_opportunities.append({
                    **opp,
                    'Date': row['Date'],
                    'HomeTeam': row['HomeTeam'],
                    'AwayTeam': row['AwayTeam'],
                    'FTR': row['FTR']
                })

    # Statisztikák
    print(f"\n📊 Talált lehetőségek összesen: {len(all_opportunities)}")

    if all_opportunities:
        df_opps = pd.DataFrame(all_opportunities)

        print("\n🎯 Lehetőségek piacok szerint:")
        market_counts = df_opps['market'].value_counts()
        for market, count in market_counts.items():
            print(f"  {market}: {count} db")

        print(f"\n📈 Átlagos edge: {df_opps['edge'].mean():.3f}")
        print(f"📈 Átlagos confidence: {df_opps['confidence'].mean():.3f}")
        print(f"📈 Átlagos odds: {df_opps['odds'].mean():.2f}")

        print(f"\n📅 Havi bontás:")
        for month, stats in sorted(monthly_stats.items()):
            avg_edge = stats['total_edge'] / stats['count'] if stats['count'] > 0 else 0
            print(f"  {month}: {stats['count']} lehetőség, átlag edge: {avg_edge:.3f}")

    return all_opportunities, monthly_stats

if __name__ == "__main__":
    # Test with sample data
    import sys
    import os
    sys.path.append('/home/bandi/Documents/code/2025/sport-prediction')

    from data_loader import load_data

    # Load all available seasons
    seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
    all_data = []

    for season in seasons:
        try:
            df_season = load_data(season)
            all_data.append(df_season)
            print(f"✅ Betöltve: {season} ({len(df_season)} mérkőzés)")
        except FileNotFoundError:
            print(f"❌ Nem található: {season}")

    if all_data:
        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values('Date').reset_index(drop=True)
        print(f"\n📊 Összesen {len(df)} mérkőzés {len(all_data)} szezonból")

        opportunities, monthly_stats = run_expanded_strategy_analysis(df)
    else:
        print("❌ Nincs betölthető adat!")
