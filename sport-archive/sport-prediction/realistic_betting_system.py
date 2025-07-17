#!/usr/bin/env python3
"""
🎯 VALÓS FOGADÁSI RENDSZER
A legvalósághűbb fogadási szituációk szimulálása:
1. Szezon elején: Csak múltbeli adatok alapján jósolunk új szezonra
2. Napi fogadás: Egy nap mérkőzéseiből kombinációk készítése
3. Valós odds és kockázatkezelés
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from data_loader import load_data
    from improved_strategies import TeamFormAnalyzer
except ImportError:
    print("❌ Hiányzó modulok!")
    exit(1)

class RealisticBettingSystem:
    """Valóságos fogadási rendszer."""

    def __init__(self):
        self.historical_seasons = ['pl2223.csv', 'pl2324.csv']  # Múltbeli szezonok
        self.current_season = 'pl2425.csv'  # "Jövőbeli" szezon amit jósolni akarunk

        # Stratégia paraméterek (enyhébb szűrők a jobb láthatóságért)
        self.min_confidence = 0.4
        self.min_edge = 0.03
        self.max_single_odds = 6.0
        self.min_combo_odds = 2.0
        self.max_combo_odds = 25.0
        self.bankroll = 1000.0
        self.max_daily_risk = 0.15  # Napi max 15% kockázat

    def load_training_data(self):
        """Betölti a múltbeli adatokat (amin tanulunk)."""
        print("📚 Múltbeli szezonok betöltése (tanítási adatok)...")

        all_historical = []
        for season in self.historical_seasons:
            try:
                df = load_data(season)
                df['season'] = season.replace('.csv', '')
                all_historical.append(df)
                print(f"✅ {season}: {len(df)} mérkőzés")
            except FileNotFoundError:
                print(f"⚠️ Hiányzó fájl: {season}")

        if not all_historical:
            raise Exception("Nincs múltbeli adat!")

        historical_df = pd.concat(all_historical, ignore_index=True)
        historical_df['Date'] = pd.to_datetime(historical_df['Date'])
        historical_df = historical_df.sort_values('Date').reset_index(drop=True)

        print(f"✅ Összesen {len(historical_df)} múltbeli mérkőzés betöltve\n")
        return historical_df

    def load_future_fixtures(self):
        """Betölti a 'jövőbeli' mérkőzéseket (amiket jósolni akarunk)."""
        print("🔮 'Jövőbeli' szezon betöltése (amit jósolni akarunk)...")

        try:
            future_df = load_data(self.current_season)
            future_df['Date'] = pd.to_datetime(future_df['Date'])
            future_df = future_df.sort_values('Date').reset_index(drop=True)

            print(f"✅ {self.current_season}: {len(future_df)} mérkőzés")
            print(f"📅 Időszak: {future_df['Date'].min()} - {future_df['Date'].max()}\n")

            return future_df

        except FileNotFoundError:
            print(f"❌ Hiányzó fájl: {self.current_season}")
            return None

    def build_team_models(self, historical_df):
        """Épít fel csapat modelleket a múltbeli adatok alapján."""
        print("🧠 Csapat modellek építése...")

        # Minden csapat statisztikái
        team_stats = {}
        form_analyzer = TeamFormAnalyzer(historical_df)

        all_teams = set(historical_df['HomeTeam'].unique()) | set(historical_df['AwayTeam'].unique())

        for team in all_teams:
            # Hazai statisztikák
            home_games = historical_df[historical_df['HomeTeam'] == team]
            away_games = historical_df[historical_df['AwayTeam'] == team]

            total_games = len(home_games) + len(away_games)
            if total_games < 10:  # Túl kevés adat
                continue

            # Hazai teljesítmény
            home_wins = len(home_games[home_games['FTR'] == 'H'])
            home_draws = len(home_games[home_games['FTR'] == 'D'])
            home_losses = len(home_games[home_games['FTR'] == 'A'])

            # Idegenben teljesítmény
            away_wins = len(away_games[away_games['FTR'] == 'A'])
            away_draws = len(away_games[away_games['FTR'] == 'D'])
            away_losses = len(away_games[away_games['FTR'] == 'H'])

            # Gólstatisztikák
            home_goals_for = home_games['FTHG'].sum()
            home_goals_against = home_games['FTAG'].sum()
            away_goals_for = away_games['FTAG'].sum()
            away_goals_against = away_games['FTHG'].sum()

            # Forma elemzés (utolsó 10 meccs)
            try:
                recent_form = form_analyzer.get_team_form(team, historical_df.iloc[-1]['Date'])
                form_score = recent_form.get('recent_form_points', 0) / 30.0  # 0-1 skála
            except:
                form_score = 0.5  # Alapértelmezett

            team_stats[team] = {
                'total_games': total_games,
                'home_win_rate': home_wins / len(home_games) if len(home_games) > 0 else 0,
                'away_win_rate': away_wins / len(away_games) if len(away_games) > 0 else 0,
                'home_goals_per_game': home_goals_for / len(home_games) if len(home_games) > 0 else 0,
                'away_goals_per_game': away_goals_for / len(away_games) if len(away_games) > 0 else 0,
                'home_conceded_per_game': home_goals_against / len(home_games) if len(home_games) > 0 else 0,
                'away_conceded_per_game': away_goals_against / len(away_games) if len(away_games) > 0 else 0,
                'form_score': form_score,
                'strength': (home_wins + away_wins) / total_games  # Általános erősség
            }

        print(f"✅ {len(team_stats)} csapat modellje kész\n")
        return team_stats

    def predict_match_probabilities(self, home_team, away_team, team_stats):
        """Előrejelzi egy mérkőzés valószínűségeit."""
        if home_team not in team_stats or away_team not in team_stats:
            return None

        home_stats = team_stats[home_team]
        away_stats = team_stats[away_team]

        # Hazai előny
        home_advantage = 0.15

        # Erősség különbség
        strength_diff = home_stats['strength'] - away_stats['strength']

        # Forma különbség
        form_diff = home_stats['form_score'] - away_stats['form_score']

        # Hazai vs idegenben teljesítmény
        home_performance = home_stats['home_win_rate']
        away_performance = away_stats['away_win_rate']

        # Kombinált erősség számítás
        home_factor = home_performance + strength_diff + form_diff * 0.3 + home_advantage
        away_factor = away_performance - strength_diff - form_diff * 0.3

        # Valószínűségek normalizálása
        total_factor = home_factor + away_factor + 1.0  # +1 a döntetlenre

        prob_home = max(0.1, min(0.8, home_factor / total_factor))
        prob_away = max(0.1, min(0.8, away_factor / total_factor))
        prob_draw = max(0.1, 1.0 - prob_home - prob_away)

        # Újra normalizálás
        total = prob_home + prob_draw + prob_away
        prob_home /= total
        prob_draw /= total
        prob_away /= total

        # Over/Under 2.5 valószínűség
        home_attack = home_stats['home_goals_per_game']
        away_attack = away_stats['away_goals_per_game']
        home_defense = away_stats['away_conceded_per_game']
        away_defense = home_stats['home_conceded_per_game']

        expected_goals = (home_attack + away_defense + away_attack + home_defense) / 2
        prob_over25 = min(0.9, max(0.1, (expected_goals - 2.5) / 3.0 + 0.5))

        return {
            'prob_home': prob_home,
            'prob_draw': prob_draw,
            'prob_away': prob_away,
            'prob_over25': prob_over25,
            'prob_under25': 1 - prob_over25,
            'expected_goals': expected_goals,
            'confidence': max(0.1, min(0.9, abs(strength_diff) + abs(form_diff) + 0.3))  # Javított confidence
        }

    def find_daily_opportunities(self, matches_on_date, team_stats):
        """Megkeresi egy nap fogadási lehetőségeit."""
        opportunities = []

        print(f"🎯 {len(matches_on_date)} mérkőzés elemzése erre a napra...")

        for _, match in matches_on_date.iterrows():
            home_team = match['HomeTeam']
            away_team = match['AwayTeam']

            # Múltbeli odds (amit most 'jósoljuk')
            bookmaker_odds = {
                'home': match.get('B365H', match.get('BWH', 2.0)),
                'draw': match.get('B365D', match.get('BWD', 3.0)),
                'away': match.get('B365A', match.get('BWA', 3.5))
            }

            # Saját valószínűség becslés
            prediction = self.predict_match_probabilities(home_team, away_team, team_stats)
            if not prediction:
                print(f"   ❌ Nincs adat: {home_team} vs {away_team}")
                continue

            # Implicit odds-ok a valószínűségekből
            our_odds = {
                'home': 1 / prediction['prob_home'],
                'draw': 1 / prediction['prob_draw'],
                'away': 1 / prediction['prob_away']
            }

            print(f"   🔍 {home_team} vs {away_team}")
            print(f"      📊 Saját odds: H:{our_odds['home']:.2f} D:{our_odds['draw']:.2f} A:{our_odds['away']:.2f}")
            print(f"      🏪 Bookmaker: H:{bookmaker_odds['home']:.2f} D:{bookmaker_odds['draw']:.2f} A:{bookmaker_odds['away']:.2f}")

            # Edge és confidence számítás minden kimenetre
            found_opportunity = False
            for outcome, our_odd in our_odds.items():
                bookmaker_odd = bookmaker_odds[outcome]

                edge = (our_odd / bookmaker_odd) - 1
                confidence = prediction['confidence']

                print(f"      🎲 {outcome}: edge={edge:.3f}, confidence={confidence:.3f}")

                if (edge >= self.min_edge and
                    confidence >= self.min_confidence and
                    bookmaker_odd <= self.max_single_odds):

                    found_opportunity = True

                    # Kelly stake számítás (konzervatív)
                    win_prob = 1 / our_odd
                    kelly_fraction = (win_prob * (bookmaker_odd - 1) - (1 - win_prob)) / (bookmaker_odd - 1)
                    kelly_stake = max(0.001, min(0.05, kelly_fraction * 0.5))  # Min 0.1%, konzervatív szorzó

                    opportunities.append({
                        'match': f"{home_team} vs {away_team}",
                        'outcome': outcome,
                        'bookmaker_odds': bookmaker_odd,
                        'our_odds': our_odd,
                        'edge': edge,
                        'confidence': confidence,
                        'kelly_stake': kelly_stake,
                        'potential_profit': kelly_stake * self.bankroll * (bookmaker_odd - 1),
                        'actual_result': match['FTR'],  # Valós eredmény (backtesthez)
                        'home_team': home_team,
                        'away_team': away_team,
                        'date': match['Date']
                    })

                    print(f"         ✅ LEHETŐSÉG! Edge: {edge:.3f}, Stake: {kelly_stake:.3f}")

            if not found_opportunity:
                print(f"         ❌ Nincs megfelelő lehetőség")

        # Rendezés edge szerint
        opportunities.sort(key=lambda x: x['edge'], reverse=True)
        print(f"   💡 {len(opportunities)} lehetőség találva")
        return opportunities

    def create_daily_combinations(self, opportunities):
        """Napi kombinációk készítése ugyanazon nap lehetőségeiből."""
        if len(opportunities) < 2:
            return []

        combinations = []

        # 2-es kombinációk
        for i in range(len(opportunities)):
            for j in range(i + 1, len(opportunities)):
                combo = self._analyze_combination([opportunities[i], opportunities[j]])
                if combo:
                    combinations.append(combo)

        # 3-as kombinációk (csak a legjobb lehetőségekből)
        top_opportunities = opportunities[:6]  # Top 6
        if len(top_opportunities) >= 3:
            for i in range(len(top_opportunities)):
                for j in range(i + 1, len(top_opportunities)):
                    for k in range(j + 1, len(top_opportunities)):
                        combo = self._analyze_combination([
                            top_opportunities[i],
                            top_opportunities[j],
                            top_opportunities[k]
                        ])
                        if combo:
                            combinations.append(combo)

        # Rendezés minőség szerint
        combinations.sort(key=lambda x: x['quality_score'], reverse=True)
        return combinations[:10]  # Top 10 kombináció

    def _analyze_combination(self, opportunities):
        """Egy kombináció elemzése."""
        if len(set(opp['match'] for opp in opportunities)) != len(opportunities):
            return None  # Nem lehet ugyanaz a meccs kétszer

        total_odds = 1.0
        total_stake = 0
        min_confidence = 1.0
        avg_edge = 0

        for opp in opportunities:
            total_odds *= opp['bookmaker_odds']
            total_stake += opp['kelly_stake']
            min_confidence = min(min_confidence, opp['confidence'])
            avg_edge += opp['edge']

        avg_edge /= len(opportunities)

        # Szűrők
        if (total_odds < self.min_combo_odds or
            total_odds > self.max_combo_odds or
            total_stake > self.max_daily_risk):
            return None

        # Minőségi pontszám
        quality_score = (avg_edge * 0.4 + min_confidence * 0.3 +
                        min(total_odds / 10, 1.0) * 0.3)

        return {
            'opportunities': opportunities,
            'combo_size': len(opportunities),
            'total_odds': total_odds,
            'total_stake': total_stake,
            'avg_edge': avg_edge,
            'min_confidence': min_confidence,
            'quality_score': quality_score,
            'potential_profit': total_stake * self.bankroll * (total_odds - 1)
        }

    def simulate_season_betting(self, future_df, team_stats):
        """Szimulál egy teljes szezon fogadását."""
        print("🎲 Szezon fogadási szimuláció...")

        # Napok csoportosítása
        future_df['date_only'] = future_df['Date'].dt.date
        daily_matches = future_df.groupby('date_only')

        all_bets = []
        all_combinations = []
        total_profit = 0
        successful_days = 0
        total_days = 0

        for date, matches in daily_matches:
            if len(matches) < 2:  # Legalább 2 meccs kell
                continue

            total_days += 1
            print(f"\n📅 {date} - {len(matches)} mérkőzés")

            # Napi lehetőségek keresése
            daily_opps = self.find_daily_opportunities(matches, team_stats)

            if daily_opps:
                print(f"   💡 {len(daily_opps)} fogadási lehetőség")
                all_bets.extend(daily_opps)

                # Kombinációk készítése
                daily_combos = self.create_daily_combinations(daily_opps)
                if daily_combos:
                    print(f"   🎰 {len(daily_combos)} kombináció")
                    all_combinations.extend(daily_combos)
                    successful_days += 1

        print(f"\n📊 Szimuláció összefoglaló:")
        print(f"   📅 Elemzett napok: {total_days}")
        print(f"   ✅ Sikeres napok: {successful_days}")
        print(f"   🎯 Egyedi fogadások: {len(all_bets)}")
        print(f"   🎰 Kombinációk: {len(all_combinations)}")

        return {
            'single_bets': all_bets,
            'combinations': all_combinations,
            'total_days': total_days,
            'successful_days': successful_days
        }

    def evaluate_results(self, simulation_results):
        """Eredmények kiértékelése."""
        print("\n📈 EREDMÉNYEK KIÉRTÉKELÉSE")
        print("=" * 50)

        single_bets = simulation_results['single_bets']
        combinations = simulation_results['combinations']

        # Egyedi fogadások elemzése
        if single_bets:
            print(f"\n🎯 EGYEDI FOGADÁSOK ({len(single_bets)} db):")

            successful_singles = []
            for bet in single_bets:
                # Ellenőrizzük a valós eredményt
                actual_result = bet['actual_result']
                bet_outcome = bet['outcome']

                won = False
                if bet_outcome == 'home' and actual_result == 'H':
                    won = True
                elif bet_outcome == 'draw' and actual_result == 'D':
                    won = True
                elif bet_outcome == 'away' and actual_result == 'A':
                    won = True

                bet['won'] = won
                if won:
                    successful_singles.append(bet)

            win_rate = len(successful_singles) / len(single_bets)
            total_staked = sum(bet['kelly_stake'] * self.bankroll for bet in single_bets)
            total_returns = sum(bet['kelly_stake'] * self.bankroll * bet['bookmaker_odds']
                              for bet in successful_singles)
            profit = total_returns - total_staked
            roi = (profit / total_staked * 100) if total_staked > 0 else 0

            print(f"   ✅ Nyerési arány: {win_rate:.1%}")
            print(f"   💰 Teljes tét: ${total_staked:.2f}")
            print(f"   💵 Teljes vissza: ${total_returns:.2f}")
            print(f"   📊 Profit: ${profit:.2f}")
            print(f"   📈 ROI: {roi:.1f}%")

        # Kombinációk elemzése
        if combinations:
            print(f"\n🎰 KOMBINÁCIÓK ({len(combinations)} db):")

            successful_combos = []
            for combo in combinations:
                # Ellenőrizzük minden fogadást a kombinációban
                all_won = True
                for opp in combo['opportunities']:
                    actual_result = opp['actual_result']
                    bet_outcome = opp['outcome']

                    won = False
                    if bet_outcome == 'home' and actual_result == 'H':
                        won = True
                    elif bet_outcome == 'draw' and actual_result == 'D':
                        won = True
                    elif bet_outcome == 'away' and actual_result == 'A':
                        won = True

                    if not won:
                        all_won = False
                        break

                combo['won'] = all_won
                if all_won:
                    successful_combos.append(combo)

            combo_win_rate = len(successful_combos) / len(combinations)
            combo_total_staked = sum(combo['total_stake'] * self.bankroll for combo in combinations)
            combo_total_returns = sum(combo['total_stake'] * self.bankroll * combo['total_odds']
                                    for combo in successful_combos)
            combo_profit = combo_total_returns - combo_total_staked
            combo_roi = (combo_profit / combo_total_staked * 100) if combo_total_staked > 0 else 0

            print(f"   ✅ Nyerési arány: {combo_win_rate:.1%}")
            print(f"   💰 Teljes tét: ${combo_total_staked:.2f}")
            print(f"   💵 Teljes vissza: ${combo_total_returns:.2f}")
            print(f"   📊 Profit: ${combo_profit:.2f}")
            print(f"   📈 ROI: {combo_roi:.1f}%")

        # Összesített eredmény
        total_profit = (profit if single_bets else 0) + (combo_profit if combinations else 0)
        total_staked_all = (total_staked if single_bets else 0) + (combo_total_staked if combinations else 0)
        total_roi = (total_profit / total_staked_all * 100) if total_staked_all > 0 else 0

        print(f"\n🏆 ÖSSZESÍTETT EREDMÉNY:")
        print(f"   💰 Összes tét: ${total_staked_all:.2f}")
        print(f"   📊 Összes profit: ${total_profit:.2f}")
        print(f"   📈 Összes ROI: {total_roi:.1f}%")

        return {
            'single_bets_roi': roi if single_bets else 0,
            'combinations_roi': combo_roi if combinations else 0,
            'total_roi': total_roi,
            'single_win_rate': win_rate if single_bets else 0,
            'combo_win_rate': combo_win_rate if combinations else 0
        }

    def run_realistic_simulation(self):
        """Futtatja a valóságos szimulációt."""
        print("🎯 VALÓS FOGADÁSI RENDSZER SZIMULÁCIÓ")
        print("=" * 60)

        # 1. Múltbeli adatok betöltése (tanítás)
        historical_df = self.load_training_data()

        # 2. Jövőbeli mérkőzések betöltése (jóslás)
        future_df = self.load_future_fixtures()
        if future_df is None:
            return

        # 3. Modellek építése múltbeli adatokból
        team_stats = self.build_team_models(historical_df)

        # 4. Szezon fogadási szimuláció
        simulation_results = self.simulate_season_betting(future_df, team_stats)

        # 5. Eredmények kiértékelése
        final_results = self.evaluate_results(simulation_results)

        return final_results

def main():
    """Fő futtatási függvény."""
    system = RealisticBettingSystem()

    try:
        results = system.run_realistic_simulation()
        print("\n✅ Szimuláció befejezve!")

    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
