import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import itertools

class TeamFormAnalyzer:
    """Csapat forma elemzés és trend felismerés."""

    def __init__(self, df):
        self.df = df.copy()
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df = self.df.sort_values('Date').reset_index(drop=True)

    def calculate_team_form(self, team, date, games_back=5):
        """Számítja ki egy csapat formáját az adott dátum előtti meccsek alapján."""
        # Csapat mérkőzései a dátum előtt
        team_games = self.df[
            ((self.df['HomeTeam'] == team) | (self.df['AwayTeam'] == team)) &
            (self.df['Date'] < date)
        ].tail(games_back)

        if len(team_games) == 0:
            return {'points': 0, 'goals_for': 0, 'goals_against': 0, 'form_score': 0}

        points = 0
        goals_for = 0
        goals_against = 0

        for _, game in team_games.iterrows():
            if game['HomeTeam'] == team:  # Hazai meccs
                goals_for += game['FTHG']
                goals_against += game['FTAG']
                if game['FTR'] == 'H':
                    points += 3
                elif game['FTR'] == 'D':
                    points += 1
            else:  # Vendég meccs
                goals_for += game['FTAG']
                goals_against += game['FTHG']
                if game['FTR'] == 'A':
                    points += 3
                elif game['FTR'] == 'D':
                    points += 1

        # Forma pontszám (0-1 között normalizálva)
        max_points = games_back * 3
        form_score = points / max_points if max_points > 0 else 0

        return {
            'points': points,
            'goals_for': goals_for,
            'goals_against': goals_against,
            'goal_difference': goals_for - goals_against,
            'form_score': form_score,
            'games_played': len(team_games)
        }

    def detect_derby_matches(self):
        """Derby/rangadó mérkőzések felismerése városnevek és nagy csapatok alapján."""
        # Premier League nagy csapatok
        big_clubs = [
            'Manchester City', 'Manchester United', 'Liverpool', 'Chelsea',
            'Arsenal', 'Tottenham', 'Newcastle United'
        ]

        # Városi derbirek
        city_groups = {
            'Manchester': ['Manchester City', 'Manchester United'],
            'London': ['Chelsea', 'Arsenal', 'Tottenham', 'Crystal Palace',
                      'Fulham', 'Brentford', 'West Ham United'],
            'Liverpool': ['Liverpool', 'Everton'],
            'Birmingham': ['Aston Villa', 'Birmingham City'],
            'Sheffield': ['Sheffield United', 'Sheffield Wednesday']
        }

        derby_matches = []

        for idx, row in self.df.iterrows():
            home_team = row['HomeTeam']
            away_team = row['AwayTeam']

            # Városi derby ellenőrzés
            is_derby = False
            derby_type = ''

            for city, teams in city_groups.items():
                if home_team in teams and away_team in teams:
                    is_derby = True
                    derby_type = f'{city} Derby'
                    break

            # Big Six mérkőzés
            if home_team in big_clubs and away_team in big_clubs:
                if not is_derby:
                    derby_type = 'Big Six Clash'
                    is_derby = True

            if is_derby:
                derby_matches.append({
                    'index': idx,
                    'Date': row['Date'],
                    'HomeTeam': home_team,
                    'AwayTeam': away_team,
                    'derby_type': derby_type
                })

        return derby_matches

    def analyze_seasonal_patterns(self):
        """Szezonális mintázatok elemzése."""
        self.df['month'] = self.df['Date'].dt.month
        self.df['week_of_year'] = self.df['Date'].dt.isocalendar().week

        # Hónap szerinti statisztikák
        monthly_stats = self.df.groupby('month').agg({
            'FTR': lambda x: (x == 'H').mean(),  # Hazai győzelem arány
            'FTHG': 'mean',  # Átlag hazai gólok
            'FTAG': 'mean'   # Átlag vendég gólok
        }).round(3)

        return monthly_stats

class AdvancedRiskManagement:
    """Fejlett kockázatkezelési rendszer stop-loss mechanizmussal."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.current_bankroll = initial_bankroll

        # Kockázatkezelési paraméterek
        self.max_daily_loss_pct = 0.05      # Max 5% napi veszteség
        self.stop_loss_threshold = 0.80     # Stop ha 80%-ra csökken (20% veszteség)
        self.max_bet_size_pct = 0.02        # Max 2% egy fogadásra
        self.consecutive_loss_limit = 5      # Max 5 egymás utáni veszteség után szünet

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

        # 2. Napi veszteség limit
        if self.daily_pnl <= -(self.initial_bankroll * self.max_daily_loss_pct):
            self.is_stopped = True
            self.stop_reason = f"Napi veszteség limit: {self.daily_pnl:.2f} <= -{self.initial_bankroll * self.max_daily_loss_pct:.2f}"
            return True

        # 3. Egymás utáni veszteségek
        if self.consecutive_losses >= self.consecutive_loss_limit:
            self.is_stopped = True
            self.stop_reason = f"Túl sok egymás utáni veszteség: {self.consecutive_losses}"
            return True

        return False

    def calculate_position_size(self, kelly_fraction, confidence, odds):
        """Dinamikus pozícióméret számítás extra biztonsági rétegekkel."""
        if self.check_stop_conditions():
            return 0

        # Alap Kelly méret
        base_size = self.current_bankroll * kelly_fraction

        # Kockázati módosítók
        confidence_modifier = min(confidence / 0.75, 1.0)  # Penalizáld az alacsony konfidenciát

        # Volatilitás módosító (magas odds = nagyobb kockázat)
        volatility_modifier = 1.0
        if odds > 2.5:
            volatility_modifier = 0.8
        if odds > 4.0:
            volatility_modifier = 0.6

        # Consecutive loss modifier
        loss_modifier = 1.0
        if self.consecutive_losses > 2:
            loss_modifier = 0.5  # Felezd meg a téteket veszteségek után

        # Végső pozícióméret
        final_size = base_size * confidence_modifier * volatility_modifier * loss_modifier

        # Hard limit
        max_bet = self.current_bankroll * self.max_bet_size_pct
        final_size = min(final_size, max_bet)

        return max(final_size, 0)

    def record_bet_result(self, stake, profit):
        """Fogadás eredményének rögzítése."""
        self.current_bankroll += profit
        self.daily_pnl += profit
        self.total_bets += 1

        if profit > 0:
            self.winning_bets += 1
            self.consecutive_losses = 0  # Reset
        else:
            self.consecutive_losses += 1

    def get_stats(self):
        """Teljesítmény statisztikák."""
        win_rate = (self.winning_bets / self.total_bets * 100) if self.total_bets > 0 else 0
        total_return = ((self.current_bankroll - self.initial_bankroll) / self.initial_bankroll) * 100

        return {
            'initial_bankroll': self.initial_bankroll,
            'current_bankroll': self.current_bankroll,
            'total_return_pct': total_return,
            'daily_pnl': self.daily_pnl,
            'total_bets': self.total_bets,
            'winning_bets': self.winning_bets,
            'win_rate_pct': win_rate,
            'consecutive_losses': self.consecutive_losses,
            'is_stopped': self.is_stopped,
            'stop_reason': self.stop_reason
        }

class ImprovedBettingStrategies:
    """Javított fogadási stratégiák profitábilis eredményekhez."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll

    def safe_kelly_criterion(self, prob, odds, max_fraction=0.02):
        """Konzervatív Kelly Criterion implementáció - MAX 2% bankroll."""
        if odds <= 1 or prob <= 0:
            return 0

        # Kelly formula
        kelly_fraction = (prob * (odds - 1) - (1 - prob)) / (odds - 1)

        # KONZERVATÍV biztonsági korlátok
        kelly_fraction = max(0, kelly_fraction)  # Nem negatív
        kelly_fraction = min(kelly_fraction, max_fraction)  # Max 2% bankroll

        # Extra konzervatív módosítók
        if prob < 0.65:  # Ha nem elég magabiztos
            kelly_fraction *= 0.5  # Felezd meg a tétet

        if odds > 3.0:  # Magas odds = nagyobb kockázat
            kelly_fraction *= 0.7  # Csökkentsd 30%-kal

        # Minimum tét küszöb
        if kelly_fraction < 0.005:  # Ha 0.5% alá esne
            return 0  # Ne fogadj

        return kelly_fraction

    def strategy_value_opportunities(self, model, X_test, y_test, odds_df, min_value=1.05, min_confidence=0.6, le=None):
        """Értékes lehetőségek keresése piaci hatékonytalanságok alapján."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        results = []
        bankroll = self.initial_bankroll

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            # Model valószínűségek
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            draw_prob = probs[i, 1] if not le else probs[i, le.transform(['D'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Expected values
            ev_home = home_prob * row['HomeOdds']
            ev_draw = draw_prob * row['DrawOdds']
            ev_away = away_prob * row['AwayOdds']

            # Legjobb value
            best_ev = max(ev_home, ev_draw, ev_away)

            if best_ev > min_value:
                if ev_home == best_ev and home_prob > min_confidence:
                    outcome = 'H'
                    prob = home_prob
                    odds = row['HomeOdds']
                elif ev_draw == best_ev and draw_prob > min_confidence:
                    outcome = 'D'
                    prob = draw_prob
                    odds = row['DrawOdds']
                elif ev_away == best_ev and away_prob > min_confidence:
                    outcome = 'A'
                    prob = away_prob
                    odds = row['AwayOdds']
                else:
                    continue  # Nem elég magabiztos

                # Kelly tét számítás
                kelly_frac = self.safe_kelly_criterion(prob, odds)
                stake = bankroll * kelly_frac

                if stake >= 0.5:  # Minimum tét
                    # Eredmény
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    bankroll += profit

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'ExpectedValue': best_ev,
                        'Profit': profit,
                        'Bankroll': bankroll
                    })

        return pd.DataFrame(results)

    def strategy_momentum_betting(self, model, X_test, y_test, odds_df, df_full, test_indices, le=None):
        """Momentum alapú fogadási stratégia."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        results = []
        bankroll = self.initial_bankroll

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            # Momentum jellemzők (ha léteznek)
            if 'home_away_momentum_diff' in df_full.columns:
                momentum_diff = df_full.iloc[test_indices[i]]['home_away_momentum_diff']

                # Csak akkor fogadunk, ha van erős momentum
                if abs(momentum_diff) > 0.5:  # Paraméterezhető küszöb
                    if momentum_diff > 0:  # Hazai előny
                        outcome = 'H'
                        prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
                        odds = row['HomeOdds']
                    else:  # Vendég előny
                        outcome = 'A'
                        prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]
                        odds = row['AwayOdds']

                    # Kelly tét
                    kelly_frac = self.safe_kelly_criterion(prob, odds)
                    stake = bankroll * kelly_frac

                    if stake >= 0.5:
                        actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                        if outcome == actual_outcome:
                            profit = (odds - 1) * stake
                        else:
                            profit = -stake

                        bankroll += profit

                        results.append({
                            'Predicted': outcome,
                            'True': actual_outcome,
                            'Stake': stake,
                            'Odds': odds,
                            'Momentum': momentum_diff,
                            'Profit': profit,
                            'Bankroll': bankroll
                        })

        return pd.DataFrame(results)

    def strategy_arbitrage_hunting(self, odds_df, min_margin=0.02):
        """Arbitrázs lehetőségek keresése (ha több fogadóiroda lenne)."""
        # Ez csak demonstráció - valódi arbitrázshoz több fogadóiroda kellene
        results = []

        for idx, row in odds_df.iterrows():
            # Implicit valószínűségek
            prob_sum = 1/row['HomeOdds'] + 1/row['DrawOdds'] + 1/row['AwayOdds']
            margin = prob_sum - 1

            # Ha a margin nagyon kicsi, azt suspicious-nak tekintjük
            if margin < min_margin:
                results.append({
                    'Date': row.get('Date', idx),
                    'HomeOdds': row['HomeOdds'],
                    'DrawOdds': row['DrawOdds'],
                    'AwayOdds': row['AwayOdds'],
                    'Margin': margin,
                    'Type': 'Low Margin Opportunity'
                })

        return pd.DataFrame(results)

    def strategy_contrarian(self, model, X_test, y_test, odds_df, le=None):
        """Ellentétes stratégia - a piac ellen fogadás magas odds esetén."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        results = []
        bankroll = self.initial_bankroll

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            # Keressük a legmagasabb oddsot
            odds_dict = {'H': row['HomeOdds'], 'D': row['DrawOdds'], 'A': row['AwayOdds']}
            highest_odds_outcome = max(odds_dict, key=odds_dict.get)
            highest_odds = odds_dict[highest_odds_outcome]

            # Csak akkor fogadunk, ha az odds elég magas (underdog)
            if highest_odds > 4.0:  # Paraméterezhető
                # Model valószínűség erre a kimenetre
                if highest_odds_outcome == 'H':
                    prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
                elif highest_odds_outcome == 'D':
                    prob = probs[i, 1] if not le else probs[i, le.transform(['D'])[0]]
                else:  # A
                    prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

                # Ha a modell szerint van esély (min 15%)
                if prob > 0.15:
                    kelly_frac = self.safe_kelly_criterion(prob, highest_odds, max_fraction=0.02)  # Konzervatívabb
                    stake = bankroll * kelly_frac

                    if stake >= 0.5:
                        actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                        if highest_odds_outcome == actual_outcome:
                            profit = (highest_odds - 1) * stake
                        else:
                            profit = -stake

                        bankroll += profit

                        results.append({
                            'Predicted': highest_odds_outcome,
                            'True': actual_outcome,
                            'Stake': stake,
                            'Odds': highest_odds,
                            'ModelProb': prob,
                            'Profit': profit,
                            'Bankroll': bankroll
                        })

        return pd.DataFrame(results)

    def strategy_conservative_value(self, model, X_test, y_test, odds_df, le=None):
        """Ultra konzervatív value betting stratégia stop-loss mechanizmussal."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        # Risk management inicializálása
        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)

        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            # Ha stop-loss aktiválódott, állj meg
            if risk_mgr.check_stop_conditions():
                print(f"🛑 Stop-loss aktiválva: {risk_mgr.stop_reason}")
                break

            # Model valószínűségek
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            draw_prob = probs[i, 1] if not le else probs[i, le.transform(['D'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # SZIGORÚ kritériumok
            min_confidence = 0.75   # Min 75% konfidencia
            min_edge = 0.20        # Min 20% edge
            min_odds = 1.4         # Min 1.4 odds (nem túl kicsi)
            max_odds = 3.5         # Max 3.5 odds (nem túl nagy kockázat)

            # Expected values
            ev_home = home_prob * row['HomeOdds']
            ev_draw = draw_prob * row['DrawOdds']
            ev_away = away_prob * row['AwayOdds']

            # Legjobb lehetőség kiválasztása
            best_option = None
            if (ev_home > 1 + min_edge and home_prob > min_confidence and
                min_odds <= row['HomeOdds'] <= max_odds):
                best_option = ('H', home_prob, row['HomeOdds'], ev_home)

            elif (ev_away > 1 + min_edge and away_prob > min_confidence and
                  min_odds <= row['AwayOdds'] <= max_odds):
                best_option = ('A', away_prob, row['AwayOdds'], ev_away)

            # Döntetlenre NEM fogadunk (túl kiszámíthatatlan)

            if best_option:
                outcome, prob, odds, expected_value = best_option

                # Kelly + Risk Management
                kelly_frac = self.safe_kelly_criterion(prob, odds, max_fraction=0.015)  # Még konzervatívabb: 1.5%
                stake = risk_mgr.calculate_position_size(kelly_frac, prob, odds)

                if stake >= 0.5:  # Minimum tét
                    # Eredmény meghatározása
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    # Eredmény rögzítése
                    risk_mgr.record_bet_result(stake, profit)

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'ExpectedValue': expected_value,
                        'Confidence': prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll,
                        'ConsecutiveLosses': risk_mgr.consecutive_losses
                    })

        # Végső statisztikák
        stats = risk_mgr.get_stats()
        print(f"📊 Risk Management Stats:")
        print(f"   Végső bankroll: {stats['current_bankroll']:.2f}")
        print(f"   Össz hozam: {stats['total_return_pct']:.2f}%")
        print(f"   Fogadások: {stats['total_bets']}")
        print(f"   Győzési arány: {stats['win_rate_pct']:.1f}%")
        print(f"   Egymás utáni veszteségek: {stats['consecutive_losses']}")
        if stats['is_stopped']:
            print(f"   ⚠️ Megállítva: {stats['stop_reason']}")

        return pd.DataFrame(results)

    def strategy_conservative_value_v2(self, model, X_test, y_test, odds_df, le=None):
        """Finomhangolt konzervatív stratégia - lazább kritériumok."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        # Risk management inicializálása
        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)

        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            # Ha stop-loss aktiválódott, állj meg
            if risk_mgr.check_stop_conditions():
                print(f"🛑 Stop-loss aktiválva: {risk_mgr.stop_reason}")
                break

            # Model valószínűségek
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            draw_prob = probs[i, 1] if not le else probs[i, le.transform(['D'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # FINOMHANGOLT kritériumok - lazább de még mindig konzervatív
            min_confidence = 0.65   # Csökkentve 75% -> 65%
            min_edge = 0.15        # Csökkentve 20% -> 15%
            min_odds = 1.3         # Csökkentve 1.4 -> 1.3
            max_odds = 4.0         # Növelve 3.5 -> 4.0

            # Expected values
            ev_home = home_prob * row['HomeOdds']
            ev_draw = draw_prob * row['DrawOdds']
            ev_away = away_prob * row['AwayOdds']

            # Legjobb lehetőség kiválasztása
            best_option = None
            if (ev_home > 1 + min_edge and home_prob > min_confidence and
                min_odds <= row['HomeOdds'] <= max_odds):
                best_option = ('H', home_prob, row['HomeOdds'], ev_home)

            elif (ev_away > 1 + min_edge and away_prob > min_confidence and
                  min_odds <= row['AwayOdds'] <= max_odds):
                best_option = ('A', away_prob, row['AwayOdds'], ev_away)

            if best_option:
                outcome, prob, odds, expected_value = best_option

                # Kelly + Risk Management (még konzervatívabb)
                kelly_frac = self.safe_kelly_criterion(prob, odds, max_fraction=0.01)  # 1%
                stake = risk_mgr.calculate_position_size(kelly_frac, prob, odds)

                if stake >= 0.5:  # Minimum tét
                    # Eredmény meghatározása
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    # Eredmény rögzítése
                    risk_mgr.record_bet_result(stake, profit)

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'ExpectedValue': expected_value,
                        'Confidence': prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll,
                        'ConsecutiveLosses': risk_mgr.consecutive_losses
                    })

        return pd.DataFrame(results)

    def strategy_selective_home_bias(self, model, X_test, y_test, odds_df, le=None):
        """Hazai torzítás kihasználása - csak erős hazai esélyek."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)
        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            if risk_mgr.check_stop_conditions():
                print(f"🛑 Stop-loss aktiválva: {risk_mgr.stop_reason}")
                break

            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]

            # Csak hazai győzelemre fogadunk, ha:
            # 1. Magas konfidencia (70%+)
            # 2. Jó odds (1.5-2.5 között - nem túl favorit, nem túl underdog)
            # 3. Van value (expected value > 1.1)

            if (home_prob > 0.70 and
                1.5 <= row['HomeOdds'] <= 2.5 and
                home_prob * row['HomeOdds'] > 1.1):

                kelly_frac = self.safe_kelly_criterion(home_prob, row['HomeOdds'], max_fraction=0.015)
                stake = risk_mgr.calculate_position_size(kelly_frac, home_prob, row['HomeOdds'])

                if stake >= 0.5:
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if actual_outcome == 'H':
                        profit = (row['HomeOdds'] - 1) * stake
                    else:
                        profit = -stake

                    risk_mgr.record_bet_result(stake, profit)

                    results.append({
                        'Predicted': 'H',
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': row['HomeOdds'],
                        'Probability': home_prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll
                    })

        return pd.DataFrame(results)

    def strategy_odds_range_optimization(self, model, X_test, y_test, odds_df, le=None):
        """Optimalizált odds tartomány stratégia több szegmenssel."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)
        results = []

        # Több odds szegmens különböző paraméterekkel
        odds_segments = [
            {'min': 1.3, 'max': 1.8, 'min_conf': 0.75, 'max_bet': 0.02},  # Favorit
            {'min': 1.8, 'max': 2.5, 'min_conf': 0.65, 'max_bet': 0.015}, # Közepes
            {'min': 2.5, 'max': 3.5, 'min_conf': 0.60, 'max_bet': 0.01},  # Underdog
        ]

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            if risk_mgr.check_stop_conditions():
                break

            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Ellenőrizzük mindegyik szegmenst
            for segment in odds_segments:
                # Hazai
                if (segment['min'] <= row['HomeOdds'] <= segment['max'] and
                    home_prob > segment['min_conf'] and
                    home_prob * row['HomeOdds'] > 1.1):  # Min 10% edge

                    kelly_frac = self.safe_kelly_criterion(home_prob, row['HomeOdds'], segment['max_bet'])
                    stake = risk_mgr.calculate_position_size(kelly_frac, home_prob, row['HomeOdds'])

                    if stake >= 0.5:
                        actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                        if actual_outcome == 'H':
                            profit = (row['HomeOdds'] - 1) * stake
                        else:
                            profit = -stake

                        risk_mgr.record_bet_result(stake, profit)

                        results.append({
                            'Predicted': 'H',
                            'True': actual_outcome,
                            'Stake': stake,
                            'Odds': row['HomeOdds'],
                            'Probability': home_prob,
                            'Profit': profit,
                            'Bankroll': risk_mgr.current_bankroll,
                            'Segment': f"{segment['min']}-{segment['max']}"
                        })
                        break  # Csak egy fogadás per mérkőzés

                # Vendég
                elif (segment['min'] <= row['AwayOdds'] <= segment['max'] and
                      away_prob > segment['min_conf'] and
                      away_prob * row['AwayOdds'] > 1.1):

                    kelly_frac = self.safe_kelly_criterion(away_prob, row['AwayOdds'], segment['max_bet'])
                    stake = risk_mgr.calculate_position_size(kelly_frac, away_prob, row['AwayOdds'])

                    if stake >= 0.5:
                        actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                        if actual_outcome == 'A':
                            profit = (row['AwayOdds'] - 1) * stake
                        else:
                            profit = -stake

                        risk_mgr.record_bet_result(stake, profit)

                        results.append({
                            'Predicted': 'A',
                            'True': actual_outcome,
                            'Stake': stake,
                            'Odds': row['AwayOdds'],
                            'Probability': away_prob,
                            'Profit': profit,
                            'Bankroll': risk_mgr.current_bankroll,
                            'Segment': f"{segment['min']}-{segment['max']}"
                        })
                        break

        return pd.DataFrame(results)

    def parameter_optimization_test(model, X_test, y_test, odds_df, le=None):
        """Paraméter optimalizáció több beállítással."""
        print("\n🔬 PARAMÉTER OPTIMALIZÁCIÓ TESZTELÉSE")
        print("=" * 60)

        strategies = ImprovedBettingStrategies()

        # Különböző paraméter kombinációk tesztelése
        param_sets = [
            {'min_conf': 0.60, 'min_edge': 0.10, 'max_bet': 0.01, 'name': 'Agresszív'},
            {'min_conf': 0.65, 'min_edge': 0.15, 'max_bet': 0.015, 'name': 'Közepes'},
            {'min_conf': 0.70, 'min_edge': 0.18, 'max_bet': 0.02, 'name': 'Konzervatív'},
            {'min_conf': 0.75, 'min_edge': 0.20, 'max_bet': 0.015, 'name': 'Ultra konzervatív'},
            {'min_conf': 0.80, 'min_edge': 0.25, 'max_bet': 0.01, 'name': 'Szuper konzervatív'},
        ]

        results_summary = []

        for params in param_sets:
            print(f"\n🧪 Tesztelés: {params['name']}")
            print(f"   Konfidencia: {params['min_conf']:.0%}, Edge: {params['min_edge']:.0%}, Max tét: {params['max_bet']:.1%}")

            # Egyedi stratégia futtatása ezekkel a paraméterekkel
            test_results = test_custom_parameters(
                model, X_test, y_test, odds_df,
                params['min_conf'], params['min_edge'], params['max_bet'], le
            )

            if not test_results.empty:
                final_bankroll = test_results['Bankroll'].iloc[-1]
                roi = ((final_bankroll - 100) / 100) * 100
                win_rate = (test_results['Profit'] > 0).mean() * 100
                bet_count = len(test_results)
                avg_stake = test_results['Stake'].mean()

                print(f"   📊 Eredmények:")
                print(f"      Fogadások: {bet_count}")
                print(f"      ROI: {roi:.2f}%")
                print(f"      Találati arány: {win_rate:.1f}%")
                print(f"      Átlag tét: {avg_stake:.2f}")

                results_summary.append({
                    'Név': params['name'],
                    'MinKonfidencia': params['min_conf'],
                    'MinEdge': params['min_edge'],
                    'MaxTét': params['max_bet'],
                    'Fogadások': bet_count,
                    'ROI': roi,
                    'TálalatiArány': win_rate,
                    'VégBankroll': final_bankroll
                })
            else:
                print(f"   ❌ Nincs fogadás ezekkel a paraméterekkel")

        # Összesítő táblázat
        if results_summary:
            summary_df = pd.DataFrame(results_summary)
            print(f"\n📋 ÖSSZESÍTŐ TÁBLÁZAT:")
            print("=" * 80)
            print(summary_df.to_string(index=False, float_format='%.2f'))

            # Legjobb stratégia
            best_strategy = summary_df.loc[summary_df['ROI'].idxmax()]
            print(f"\n🏆 LEGJOBB STRATÉGIA: {best_strategy['Név']}")
            print(f"   ROI: {best_strategy['ROI']:.2f}%")
            print(f"   Paraméterek: Conf={best_strategy['MinKonfidencia']:.0%}, Edge={best_strategy['MinEdge']:.0%}, MaxTét={best_strategy['MaxTét']:.1%}")

        return results_summary

    def test_custom_parameters(model, X_test, y_test, odds_df, min_confidence, min_edge, max_bet_pct, le=None):
        """Egyedi paraméterekkel teszteli a stratégiát."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        risk_mgr = AdvancedRiskManagement(100)  # 100 kezdő bankroll
        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            if risk_mgr.check_stop_conditions():
                break

            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Expected values
            ev_home = home_prob * row['HomeOdds']
            ev_away = away_prob * row['AwayOdds']

            # Value betting logika
            best_option = None
            if (ev_home > 1 + min_edge and home_prob > min_confidence and
                1.3 <= row['HomeOdds'] <= 4.0):
                best_option = ('H', home_prob, row['HomeOdds'])

            elif (ev_away > 1 + min_edge and away_prob > min_confidence and
                  1.3 <= row['AwayOdds'] <= 4.0):
                best_option = ('A', away_prob, row['AwayOdds'])

            if best_option:
                outcome, prob, odds = best_option

                # Kelly tét számítás
                kelly_frac = (prob * (odds - 1) - (1 - prob)) / (odds - 1)
                kelly_frac = max(0, min(kelly_frac, max_bet_pct))

                stake = risk_mgr.current_bankroll * kelly_frac

                if stake >= 0.5:
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    risk_mgr.record_bet_result(stake, profit)

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll
                    })

        return pd.DataFrame(results)

def evaluate_improved_strategies(model, X_test, y_test, odds_df, df_full=None, test_indices=None, le=None):
    """Javított stratégiák értékelése."""
    strategies = ImprovedBettingStrategies()

    results = {}

    print("🎯 Értékes lehetőségek stratégia...")
    value_df = strategies.strategy_value_opportunities(model, X_test, y_test, odds_df, le=le)
    if not value_df.empty:
        roi = ((value_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (value_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(value_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        results['value_opportunities'] = value_df

    print("📈 Momentum stratégia...")
    if df_full is not None and test_indices is not None:
        momentum_df = strategies.strategy_momentum_betting(model, X_test, y_test, odds_df, df_full, test_indices, le=le)
        if not momentum_df.empty:
            roi = ((momentum_df['Bankroll'].iloc[-1] - 100) / 100) * 100
            win_rate = (momentum_df['Profit'] > 0).mean() * 100
            print(f"   Fogadások: {len(momentum_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
            results['momentum'] = momentum_df

    print("🏴‍☠️ Contrarian (underdog) stratégia...")
    contrarian_df = strategies.strategy_contrarian(model, X_test, y_test, odds_df, le=le)
    if not contrarian_df.empty:
        roi = ((contrarian_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (contrarian_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(contrarian_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        results['contrarian'] = contrarian_df

    print("🔍 Arbitrázs lehetőségek...")
    arbitrage_df = strategies.strategy_arbitrage_hunting(odds_df)
    if not arbitrage_df.empty:
        print(f"   Talált {len(arbitrage_df)} alacsony margin lehetőséget")
        results['arbitrage'] = arbitrage_df

    print("🛡️ Ultra konzervatív value betting (stop-loss-szal)...")
    conservative_df = strategies.strategy_conservative_value(model, X_test, y_test, odds_df, le=le)
    if not conservative_df.empty:
        roi = ((conservative_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (conservative_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(conservative_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        results['conservative_value'] = conservative_df
    else:
        print("   Nincs megfelelő fogadási lehetőség a szigorú kritériumokkal")

    print("🛡️ Finomhangolt konzervatív stratégia...")
    conservative_v2_df = strategies.strategy_conservative_value_v2(model, X_test, y_test, odds_df, le=le)
    if not conservative_v2_df.empty:
        roi = ((conservative_v2_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (conservative_v2_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(conservative_v2_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        results['conservative_value_v2'] = conservative_v2_df
    else:
        print("   Nincs megfelelő fogadási lehetőség a finomhangolt kritériumokkal")

    print("🏠 Szelektív hazai torzítás stratégia...")
    home_bias_df = strategies.strategy_selective_home_bias(model, X_test, y_test, odds_df, le=le)
    if not home_bias_df.empty:
        roi = ((home_bias_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (home_bias_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(home_bias_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        results['selective_home_bias'] = home_bias_df
    else:
        print("   Nincs megfelelő hazai fogadási lehetőség")

    print("📊 Odds tartomány optimalizálás...")
    odds_range_df = strategies.strategy_odds_range_optimization(model, X_test, y_test, odds_df, le=le)
    if not odds_range_df.empty:
        roi = ((odds_range_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (odds_range_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(odds_range_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")

        # Szegmens szerinti bontás
        if 'Segment' in odds_range_df.columns:
            print("   Szegmens teljesítmények:")
            for segment, group in odds_range_df.groupby('Segment'):
                seg_roi = ((group['Profit'].sum() / group['Stake'].sum()) * 100) if group['Stake'].sum() > 0 else 0
                seg_win_rate = (group['Profit'] > 0).mean() * 100
                print(f"     {segment}: {len(group)} fogadás, ROI: {seg_roi:.1f}%, Win: {seg_win_rate:.1f}%")

        results['odds_range_optimization'] = odds_range_df
    else:
        print("   Nincs megfelelő odds tartományban fogadási lehetőség")

    # ÚJ FEJLETT STRATÉGIÁK
    print("\n🎯 FEJLETT MINTÁZAT ALAPÚ STRATÉGIÁK")
    print("=" * 50)

    pattern_strategy = AdvancedPatternStrategy()

    print("📈 Csapat forma alapú stratégia...")
    form_df = pattern_strategy.form_based_strategy(model, X_test, y_test, odds_df, df_full, test_indices, le=le)
    if not form_df.empty:
        roi = ((form_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (form_df['Profit'] > 0).mean() * 100
        avg_form_diff = form_df['FormDiff'].abs().mean()
        print(f"   Fogadások: {len(form_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")
        print(f"   Átlag forma különbség: {avg_form_diff:.3f}")
        results['form_based'] = form_df
    else:
        print("   Nincs megfelelő forma alapú fogadási lehetőség")

    print("⚔️ Derby/rangadó stratégia...")
    derby_df = pattern_strategy.derby_strategy(model, X_test, y_test, odds_df, df_full, test_indices, le=le)
    if not derby_df.empty:
        roi = ((derby_df['Bankroll'].iloc[-1] - 100) / 100) * 100
        win_rate = (derby_df['Profit'] > 0).mean() * 100
        print(f"   Fogadások: {len(derby_df)}, ROI: {roi:.2f}%, Találati arány: {win_rate:.2f}%")

        # Derby típusok szerinti bontás
        if 'DerbyType' in derby_df.columns:
            print("   Derby típusok:")
            for derby_type, group in derby_df.groupby('DerbyType'):
                derby_roi = ((group['Profit'].sum() / group['Stake'].sum()) * 100) if group['Stake'].sum() > 0 else 0
                derby_win_rate = (group['Profit'] > 0).mean() * 100
                print(f"     {derby_type}: {len(group)} fogadás, ROI: {derby_roi:.1f}%, Win: {derby_win_rate:.1f}%")

        results['derby_strategy'] = derby_df
    else:
        print("   Nincs derby mérkőzés a test adatokban")

    # KOMBINÁLT FOGADÁSOK
    print("\n🎰 KOMBINÁLT FOGADÁSI LEHETŐSÉGEK")
    print("=" * 50)

    combo_engine = CombinationBettingEngine()
    combo_opportunities = combo_engine.find_combination_opportunities(
        model, X_test, y_test, odds_df, df_full, test_indices, le=le
    )

    if combo_opportunities:
        print(f"   Talált {len(combo_opportunities)} kombinációs lehetőséget")

        # Top 10 kombináció elemzése
        successful_combos = [combo for combo in combo_opportunities[:20] if combo['all_correct']]
        total_combos_tested = len(combo_opportunities[:20])

        if successful_combos:
            avg_odds = np.mean([combo['combined_odds'] for combo in successful_combos])
            avg_prob = np.mean([combo['combined_probability'] for combo in successful_combos])
            success_rate = len(successful_combos) / total_combos_tested * 100

            print(f"   🎯 Top 20 kombináció elemzése:")
            print(f"     Sikeres kombinációk: {len(successful_combos)}/{total_combos_tested} ({success_rate:.1f}%)")
            print(f"     Átlag kombináció odds: {avg_odds:.2f}")
            print(f"     Átlag kombináció valószínűség: {avg_prob:.3f}")

            # Kombináció típusok
            combo_sizes = {}
            for combo in successful_combos:
                size = combo['combo_size']
                if size not in combo_sizes:
                    combo_sizes[size] = {'count': 0, 'total_odds': 0}
                combo_sizes[size]['count'] += 1
                combo_sizes[size]['total_odds'] += combo['combined_odds']

            print("   📊 Kombináció méretek:")
            for size, data in combo_sizes.items():
                avg_odds = data['total_odds'] / data['count']
                print(f"     {size} meccs: {data['count']} sikeres, átlag odds: {avg_odds:.2f}")

        results['combinations'] = combo_opportunities
    else:
        print("   Nincs kombinációs lehetőség a kritériumokkal")

    return results

class CombinationBettingEngine:
    """Kombinált fogadási rendszer több mérkőzéssel."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.combination_types = ['double', 'treble', 'accumulator']

    def find_combination_opportunities(self, model, X_test, y_test, odds_df, df_full,
                                     test_indices, le=None, min_confidence=0.65):
        """Kombinációs lehetőségek keresése több mérkőzés között."""
        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        # Magas konfidenciájú predikciók kiválasztása
        high_confidence_bets = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Csak a legjobb predikciók
            if home_prob > min_confidence and home_prob * row['HomeOdds'] > 1.1:
                high_confidence_bets.append({
                    'index': i,
                    'game_idx': idx,
                    'outcome': 'H',
                    'probability': home_prob,
                    'odds': row['HomeOdds'],
                    'expected_value': home_prob * row['HomeOdds'],
                    'actual': le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]
                })

            elif away_prob > min_confidence and away_prob * row['AwayOdds'] > 1.1:
                high_confidence_bets.append({
                    'index': i,
                    'game_idx': idx,
                    'outcome': 'A',
                    'probability': away_prob,
                    'odds': row['AwayOdds'],
                    'expected_value': away_prob * row['AwayOdds'],
                    'actual': le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]
                })

        # Kombinációk generálása
        combinations = self.generate_combinations(high_confidence_bets)
        return combinations

    def generate_combinations(self, bets, max_combo_size=4):
        """Kombinációk generálása a kiválasztott fogadásokból."""
        combinations = []

        if len(bets) < 2:
            return combinations

        # 2-4 meccs kombinációk
        for combo_size in range(2, min(len(bets) + 1, max_combo_size + 1)):
            for combo in itertools.combinations(bets, combo_size):
                # Kombinált odds számítás
                combined_odds = 1
                combined_prob = 1
                all_correct = True

                for bet in combo:
                    combined_odds *= bet['odds']
                    combined_prob *= bet['probability']
                    if bet['outcome'] != bet['actual']:
                        all_correct = False

                # Minimum értékszűrő
                if combined_prob * combined_odds > 1.2:  # Min 20% edge a kombinációra
                    combinations.append({
                        'combo_size': combo_size,
                        'bets': combo,
                        'combined_odds': combined_odds,
                        'combined_probability': combined_prob,
                        'expected_value': combined_prob * combined_odds,
                        'all_correct': all_correct,
                        'min_confidence': min(bet['probability'] for bet in combo)
                    })

        # Rendezés expected value szerint
        combinations.sort(key=lambda x: x['expected_value'], reverse=True)
        return combinations

class AdvancedPatternStrategy:
    """Fejlett mintázat alapú stratégiák."""

    def __init__(self, initial_bankroll=100):
        self.initial_bankroll = initial_bankroll
        self.form_analyzer = None

    def setup_analyzers(self, df):
        """Elemzők inicializálása."""
        self.form_analyzer = TeamFormAnalyzer(df)

    def form_based_strategy(self, model, X_test, y_test, odds_df, df_full, test_indices, le=None):
        """Forma alapú fogadási stratégia."""
        if self.form_analyzer is None:
            self.setup_analyzers(df_full)

        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)
        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            if risk_mgr.check_stop_conditions():
                break

            # Adott mérkőzés adatai
            game_data = df_full.iloc[test_indices[i]]
            home_team = game_data['HomeTeam']
            away_team = game_data['AwayTeam']
            game_date = pd.to_datetime(game_data['Date'])

            # Csapat formák számítása
            home_form = self.form_analyzer.calculate_team_form(home_team, game_date, 5)
            away_form = self.form_analyzer.calculate_team_form(away_team, game_date, 5)

            # Forma alapú döntés
            form_difference = home_form['form_score'] - away_form['form_score']

            # Model valószínűségek
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Stratégia: Fogadj a jobb formában lévő csapatra, ha a model is egyetért
            best_option = None

            if (form_difference > 0.3 and home_prob > 0.6 and
                home_prob * row['HomeOdds'] > 1.15):  # Hazai előny formában és modellben
                best_option = ('H', home_prob, row['HomeOdds'])

            elif (form_difference < -0.3 and away_prob > 0.6 and
                  away_prob * row['AwayOdds'] > 1.15):  # Vendég előny formában és modellben
                best_option = ('A', away_prob, row['AwayOdds'])

            if best_option:
                outcome, prob, odds = best_option

                # Kelly tét (konzervatív)
                kelly_frac = ((prob * (odds - 1)) - (1 - prob)) / (odds - 1)
                kelly_frac = max(0, min(kelly_frac, 0.015))  # Max 1.5%

                stake = risk_mgr.calculate_position_size(kelly_frac, prob, odds)

                if stake >= 0.5:
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    risk_mgr.record_bet_result(stake, profit)

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll,
                        'HomeForm': home_form['form_score'],
                        'AwayForm': away_form['form_score'],
                        'FormDiff': form_difference,
                        'HomeTeam': home_team,
                        'AwayTeam': away_team
                    })

        return pd.DataFrame(results)

    def derby_strategy(self, model, X_test, y_test, odds_df, df_full, test_indices, le=None):
        """Derby/rangadó specifikus stratégia."""
        if self.form_analyzer is None:
            self.setup_analyzers(df_full)

        # Derby mérkőzések felismerése
        derby_matches = self.form_analyzer.detect_derby_matches()
        derby_indices = {match['index'] for match in derby_matches}

        probs = model.predict_proba(X_test)
        y_test_values = y_test.values if hasattr(y_test, 'values') else y_test

        risk_mgr = AdvancedRiskManagement(self.initial_bankroll)
        results = []

        for i, (idx, row) in enumerate(odds_df.iterrows()):
            if risk_mgr.check_stop_conditions():
                break

            # Csak derby mérkőzésekre
            original_index = test_indices[i]
            if original_index not in derby_indices:
                continue

            # Derby mérkőzésekben gyakran meglepetések vannak
            # Stratégia: Fogadj a magasabb oddsú csapatra, ha a model legalább 40% esélyt ad
            home_prob = probs[i, 0] if not le else probs[i, le.transform(['H'])[0]]
            away_prob = probs[i, 2] if not le else probs[i, le.transform(['A'])[0]]

            # Derby specifikus logika
            home_value = home_prob * row['HomeOdds']
            away_value = away_prob * row['AwayOdds']

            best_option = None

            # Magasabb value és legalább 40% esély
            if (home_value > away_value and home_value > 1.2 and
                home_prob > 0.4 and row['HomeOdds'] > 1.5):
                best_option = ('H', home_prob, row['HomeOdds'])

            elif (away_value > home_value and away_value > 1.2 and
                  away_prob > 0.4 and row['AwayOdds'] > 1.5):
                best_option = ('A', away_prob, row['AwayOdds'])

            if best_option:
                outcome, prob, odds = best_option

                # Derby mérkőzésekre kisebb tét (nagyobb kiszámíthatatlanság)
                kelly_frac = ((prob * (odds - 1)) - (1 - prob)) / (odds - 1)
                kelly_frac = max(0, min(kelly_frac, 0.01))  # Max 1%

                stake = risk_mgr.calculate_position_size(kelly_frac, prob, odds) * 0.7  # 30% csökkentés

                if stake >= 0.5:
                    actual_outcome = le.inverse_transform([y_test_values[i]])[0] if le else y_test_values[i]

                    if outcome == actual_outcome:
                        profit = (odds - 1) * stake
                    else:
                        profit = -stake

                    risk_mgr.record_bet_result(stake, profit)

                    # Derby típus meghatározása
                    derby_type = next((match['derby_type'] for match in derby_matches
                                     if match['index'] == original_index), 'Unknown Derby')

                    results.append({
                        'Predicted': outcome,
                        'True': actual_outcome,
                        'Stake': stake,
                        'Odds': odds,
                        'Probability': prob,
                        'Profit': profit,
                        'Bankroll': risk_mgr.current_bankroll,
                        'DerbyType': derby_type,
                        'HomeTeam': df_full.iloc[original_index]['HomeTeam'],
                        'AwayTeam': df_full.iloc[original_index]['AwayTeam']
                    })

        return pd.DataFrame(results)
