#!/usr/bin/env python3
"""
🔮 PREDIKCIÓS MOTOR - Jövőbeli mérkőzések előrejelzése
Múltbeli adatok alapján új szezon mérkőzéseinek előrejelzése
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

class MatchPredictor:
    """Mérkőzés kimenetel előrejelző."""
    
    def __init__(self, historical_data):
        self.df = historical_data.copy()
        self.df['Date'] = pd.to_datetime(self.df['Date'])
        self.df = self.df.sort_values('Date').reset_index(drop=True)
        
        # Csapat statisztikák építése
        self.team_stats = self._build_team_statistics()
        self.form_analyzer = TeamFormAnalyzer(self.df)
    
    def _build_team_statistics(self):
        """Épít fel csapat statisztikákat a múltbeli adatokból."""
        team_stats = {}
        
        # Összes csapat listája
        all_teams = set(self.df['HomeTeam'].unique()) | set(self.df['AwayTeam'].unique())
        
        for team in all_teams:
            # Hazai statisztikák
            home_games = self.df[self.df['HomeTeam'] == team]
            away_games = self.df[self.df['AwayTeam'] == team]
            
            # Alapstatisztikák
            total_games = len(home_games) + len(away_games)
            if total_games == 0:
                continue
                
            # Hazai eredmények
            home_wins = len(home_games[home_games['FTR'] == 'H'])
            home_draws = len(home_games[home_games['FTR'] == 'D'])
            home_losses = len(home_games[home_games['FTR'] == 'A'])
            
            # Vendég eredmények  
            away_wins = len(away_games[away_games['FTR'] == 'A'])
            away_draws = len(away_games[away_games['FTR'] == 'D'])
            away_losses = len(away_games[away_games['FTR'] == 'H'])
            
            # Gólstatisztikák
            home_goals_for = home_games['FTHG'].sum()
            home_goals_against = home_games['FTAG'].sum()
            away_goals_for = away_games['FTAG'].sum()
            away_goals_against = away_games['FTHG'].sum()
            
            team_stats[team] = {
                'total_games': total_games,
                'home_games': len(home_games),
                'away_games': len(away_games),
                
                # Nyerési arányok
                'home_win_rate': home_wins / max(len(home_games), 1),
                'away_win_rate': away_wins / max(len(away_games), 1),
                'overall_win_rate': (home_wins + away_wins) / total_games,
                
                # Döntetlen arányok
                'home_draw_rate': home_draws / max(len(home_games), 1),
                'away_draw_rate': away_draws / max(len(away_games), 1),
                
                # Gól átlagok
                'home_goals_per_game': home_goals_for / max(len(home_games), 1),
                'away_goals_per_game': away_goals_for / max(len(away_games), 1),
                'home_conceded_per_game': home_goals_against / max(len(home_games), 1),
                'away_conceded_per_game': away_goals_against / max(len(away_games), 1),
                
                # Általános erősség
                'avg_goals_for': (home_goals_for + away_goals_for) / total_games,
                'avg_goals_against': (home_goals_against + away_goals_against) / total_games,
                'goal_difference': (home_goals_for + away_goals_for - home_goals_against - away_goals_against) / total_games
            }
        
        return team_stats
    
    def predict_match_outcome(self, home_team, away_team, date=None):
        """Előrejelzi egy mérkőzés kimenetelét."""
        if date is None:
            date = datetime.now()
        
        # Csapat statisztikák
        home_stats = self.team_stats.get(home_team, {})
        away_stats = self.team_stats.get(away_team, {})
        
        if not home_stats or not away_stats:
            return None
        
        # Forma elemzés (utolsó 5 meccs az adatok végéig)
        last_date = self.df['Date'].max()
        home_form = self.form_analyzer.calculate_team_form(home_team, last_date, games_back=5)
        away_form = self.form_analyzer.calculate_team_form(away_team, last_date, games_back=5)
        
        # Head-to-head
        h2h = self._analyze_head_to_head(home_team, away_team)
        
        # Alap valószínűségek számítása
        # Hazai előny
        home_advantage = 0.15
        
        # Forma különbség
        form_diff = home_form['form_score'] - away_form['form_score']
        
        # Gólképesség különbség
        attacking_diff = home_stats['home_goals_per_game'] - away_stats['away_conceded_per_game']
        defensive_diff = away_stats['away_goals_per_game'] - home_stats['home_conceded_per_game']
        
        # Általános erősség
        strength_diff = home_stats['goal_difference'] - away_stats['goal_difference']
        
        # Alapvalószínűség építése
        base_home_prob = 0.4 + home_advantage
        base_away_prob = 0.3
        base_draw_prob = 0.3
        
        # Módosítók alkalmazása
        form_impact = form_diff * 0.2
        attacking_impact = attacking_diff * 0.1
        defensive_impact = defensive_diff * 0.1
        strength_impact = strength_diff * 0.05
        
        # H2H módosítás
        h2h_impact = 0
        if h2h['total_games'] >= 3:
            h2h_home_rate = h2h['home_wins'] / h2h['total_games']
            h2h_impact = (h2h_home_rate - 0.33) * 0.1
        
        # Végső valószínűségek
        final_home_prob = base_home_prob + form_impact + attacking_impact - defensive_impact + strength_impact + h2h_impact
        final_away_prob = base_away_prob - form_impact - attacking_impact + defensive_impact - strength_impact - h2h_impact
        final_draw_prob = 1 - final_home_prob - final_away_prob
        
        # Normalizálás
        total = final_home_prob + final_draw_prob + final_away_prob
        final_home_prob /= total
        final_draw_prob /= total
        final_away_prob /= total
        
        # Gól előrejelzés
        # Forma hatás a gólokra (form_score * átlag gólok)
        home_form_bonus = home_form['form_score'] * 0.5
        away_form_bonus = away_form['form_score'] * 0.5
        
        expected_home_goals = max(0.1, home_stats['home_goals_per_game'] + home_form_bonus - away_stats['away_conceded_per_game']/2)
        expected_away_goals = max(0.1, away_stats['away_goals_per_game'] + away_form_bonus - home_stats['home_conceded_per_game']/2)
        expected_total_goals = expected_home_goals + expected_away_goals
        
        return {
            'home_team': home_team,
            'away_team': away_team,
            'predictions': {
                'home_win': final_home_prob,
                'draw': final_draw_prob,
                'away_win': final_away_prob
            },
            'goal_predictions': {
                'home_goals': expected_home_goals,
                'away_goals': expected_away_goals,
                'total_goals': expected_total_goals,
                'over_2_5': 1 / (1 + np.exp(-(expected_total_goals - 2.5) * 2)),
                'btts': min(expected_home_goals/2, 0.9) * min(expected_away_goals/2, 0.9)
            },
            'confidence_factors': {
                'form_difference': abs(form_diff),
                'h2h_games': h2h['total_games'],
                'data_quality': min(home_stats['total_games'], away_stats['total_games']) / 38
            }
        }
    
    def _analyze_head_to_head(self, home_team, away_team):
        """H2H elemzés."""
        h2h_games = self.df[
            (((self.df['HomeTeam'] == home_team) & (self.df['AwayTeam'] == away_team)) |
             ((self.df['HomeTeam'] == away_team) & (self.df['AwayTeam'] == home_team)))
        ]
        
        if len(h2h_games) == 0:
            return {'home_wins': 0, 'away_wins': 0, 'draws': 0, 'total_games': 0}
        
        home_wins = 0
        away_wins = 0
        draws = 0
        
        for _, game in h2h_games.iterrows():
            if game['HomeTeam'] == home_team:
                if game['FTR'] == 'H':
                    home_wins += 1
                elif game['FTR'] == 'A':
                    away_wins += 1
                else:
                    draws += 1
            else:
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
            'total_games': len(h2h_games)
        }

class BettingOpportunityFinder:
    """Fogadási lehetőségek keresése predikciók és odds alapján."""
    
    def __init__(self, predictor):
        self.predictor = predictor
        self.min_edge = 0.05
        self.min_confidence = 0.6
    
    def analyze_betting_opportunity(self, home_team, away_team, odds_h, odds_d, odds_a, date=None):
        """Elemez egy fogadási lehetőséget."""
        prediction = self.predictor.predict_match_outcome(home_team, away_team, date)
        
        if not prediction:
            return None
        
        # Bookmaker valószínűségek
        bookmaker_probs = {
            'H': 1 / odds_h,
            'D': 1 / odds_d,
            'A': 1 / odds_a
        }
        
        # Margin eltávolítás
        total_prob = sum(bookmaker_probs.values())
        fair_probs = {k: v/total_prob for k, v in bookmaker_probs.items()}
        
        # Saját predikciók
        our_probs = {
            'H': prediction['predictions']['home_win'],
            'D': prediction['predictions']['draw'],
            'A': prediction['predictions']['away_win']
        }
        
        # Edge számítás
        opportunities = []
        
        for outcome in ['H', 'D', 'A']:
            edge = our_probs[outcome] - fair_probs[outcome]
            
            if edge >= self.min_edge:
                odds_val = odds_h if outcome == 'H' else (odds_d if outcome == 'D' else odds_a)
                kelly = edge / (odds_val - 1) if odds_val > 1 else 0
                
                # Confidence számítás
                confidence = min(
                    prediction['confidence_factors']['data_quality'] * 
                    (1 + prediction['confidence_factors']['form_difference']) *
                    min(edge * 10, 1.0), 
                    1.0
                )
                
                if confidence >= self.min_confidence:
                    opportunities.append({
                        'market': '1X2',
                        'selection': outcome,
                        'odds': odds_val,
                        'edge': edge,
                        'our_prob': our_probs[outcome],
                        'fair_prob': fair_probs[outcome],
                        'kelly': kelly * 0.25,  # Konzervatív
                        'confidence': confidence
                    })
        
        # Over/Under elemzés
        over_25_prob = prediction['goal_predictions']['over_2_5']
        under_25_prob = 1 - over_25_prob
        
        # Becsült over/under odds (ha nincs adat)
        estimated_over_odds = 1 / over_25_prob if over_25_prob > 0.1 else 10
        estimated_under_odds = 1 / under_25_prob if under_25_prob > 0.1 else 10
        
        # Over 2.5 check
        if 1.3 <= estimated_over_odds <= 5.0:
            fair_over_prob = 1 / estimated_over_odds
            over_edge = over_25_prob - fair_over_prob
            
            if over_edge >= self.min_edge:
                confidence = min(prediction['confidence_factors']['data_quality'] * min(over_edge * 8, 1.0), 1.0)
                if confidence >= self.min_confidence:
                    opportunities.append({
                        'market': 'Over/Under',
                        'selection': 'Over 2.5',
                        'odds': estimated_over_odds,
                        'edge': over_edge,
                        'our_prob': over_25_prob,
                        'fair_prob': fair_over_prob,
                        'kelly': (over_edge / (estimated_over_odds - 1)) * 0.25,
                        'confidence': confidence
                    })
        
        return {
            'match': f"{home_team} vs {away_team}",
            'prediction': prediction,
            'opportunities': opportunities
        }

def create_sample_fixtures():
    """Létrehoz mintameccseket az új szezonra."""
    # Premier League csapatok (jelenlegi)
    teams = [
        'Arsenal', 'Aston Villa', 'Brighton', 'Burnley', 'Chelsea', 'Crystal Palace',
        'Everton', 'Fulham', 'Liverpool', 'Luton', 'Man City', 'Man United',
        'Newcastle', 'Nott\'m Forest', 'Sheffield United', 'Tottenham', 
        'West Ham', 'Wolves', 'Bournemouth', 'Brentford'
    ]
    
    # Példa mérkőzések a következő hétvégére
    sample_fixtures = [
        ('Arsenal', 'Chelsea', 2.1, 3.4, 3.8),
        ('Man City', 'Liverpool', 2.3, 3.2, 3.1),
        ('Tottenham', 'Man United', 2.0, 3.5, 4.0),
        ('Newcastle', 'Brighton', 1.8, 3.8, 4.5),
        ('Aston Villa', 'Wolves', 1.9, 3.6, 4.2),
        ('West Ham', 'Crystal Palace', 2.2, 3.3, 3.4),
        ('Fulham', 'Brentford', 2.1, 3.4, 3.6),
        ('Burnley', 'Luton', 1.7, 3.9, 5.0),
        ('Everton', 'Sheffield United', 1.6, 4.0, 6.0),
        ('Bournemouth', 'Nott\'m Forest', 2.0, 3.4, 4.0)
    ]
    
    return sample_fixtures

def main():
    """Főprogram - Valódi predikciós használat."""
    print("🔮 PREDIKCIÓS MOTOR - Következő hétvége előrejelzése")
    print("=" * 70)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    try:
        # Múltbeli adatok betöltése (edzés)
        print("📚 Múltbeli adatok betöltése (training)...")
        seasons = ['pl2223.csv', 'pl2324.csv', 'pl2425.csv']
        all_data = []
        
        for season in seasons:
            try:
                df_season = load_data(season)
                all_data.append(df_season)
                print(f"✅ {season}: {len(df_season)} mérkőzés")
            except FileNotFoundError:
                print(f"⚠️ Nem található: {season}")
        
        if not all_data:
            print("❌ Nincs training adat!")
            return
        
        training_data = pd.concat(all_data, ignore_index=True)
        print(f"✅ Training adatok: {len(training_data)} mérkőzés\n")
        
        # Predikciós motor inicializálása
        print("🤖 Predikciós motor építése...")
        predictor = MatchPredictor(training_data)
        opportunity_finder = BettingOpportunityFinder(predictor)
        
        # Következő hétvége mérkőzései (példa)
        print("⚽ Következő hétvége mérkőzései:")
        fixtures = create_sample_fixtures()
        
        all_opportunities = []
        
        for home_team, away_team, odds_h, odds_d, odds_a in fixtures:
            print(f"\n🔍 Elemzés: {home_team} vs {away_team}")
            
            analysis = opportunity_finder.analyze_betting_opportunity(
                home_team, away_team, odds_h, odds_d, odds_a
            )
            
            if analysis and analysis['opportunities']:
                print(f"✅ {len(analysis['opportunities'])} lehetőség találva")
                all_opportunities.extend([
                    {**opp, 'match': analysis['match']} 
                    for opp in analysis['opportunities']
                ])
                
                # Predikció részletek
                pred = analysis['prediction']['predictions']
                goals = analysis['prediction']['goal_predictions']
                print(f"   🏠 Hazai győzelem: {pred['home_win']*100:.1f}%")
                print(f"   🤝 Döntetlen: {pred['draw']*100:.1f}%") 
                print(f"   ✈️ Vendég győzelem: {pred['away_win']*100:.1f}%")
                print(f"   ⚽ Várható gólok: {goals['total_goals']:.1f}")
                print(f"   📈 Over 2.5: {goals['over_2_5']*100:.1f}%")
            else:
                print("❌ Nincs értékes lehetőség")
        
        # Összefoglaló
        if all_opportunities:
            print(f"\n🏆 ÖSSZEFOGLALÓ - {len(all_opportunities)} ÉRTÉKES LEHETŐSÉG")
            print("=" * 80)
            
            # Rendezés edge szerint
            all_opportunities.sort(key=lambda x: x['edge'], reverse=True)
            
            for idx, opp in enumerate(all_opportunities, 1):
                print(f"\n{idx}. 🎯 {opp['match']}")
                print(f"   🎲 Piac: {opp['market']} - {opp['selection']}")
                print(f"   💰 Odds: {opp['odds']:.2f}")
                print(f"   📈 Edge: {opp['edge']*100:.1f}%")
                print(f"   🎯 Confidence: {opp['confidence']*100:.1f}%")
                print(f"   💵 Javasolt tét: {1000 * opp['kelly']:.0f} (1000 bankroll)")
            
            # Kombinációs lehetőségek
            print(f"\n🎰 KOMBINÁCIÓS LEHETŐSÉGEK")
            print("=" * 40)
            
            high_conf_opps = [opp for opp in all_opportunities if opp['confidence'] >= 0.8]
            
            if len(high_conf_opps) >= 2:
                print("✅ Magas konfidenciájú lehetőségek kombinációhoz:")
                for opp in high_conf_opps[:3]:
                    print(f"   • {opp['match']} - {opp['selection']} @ {opp['odds']:.2f}")
                
                if len(high_conf_opps) >= 2:
                    combo_odds = high_conf_opps[0]['odds'] * high_conf_opps[1]['odds']
                    print(f"   🎲 2-es kombináció odds: {combo_odds:.2f}")
            else:
                print("❌ Nincs megfelelő kombinációs lehetőség")
            
            # CSV mentés
            opportunities_df = pd.DataFrame(all_opportunities)
            filename = f"next_weekend_predictions_{datetime.now().strftime('%Y%m%d')}.csv"
            opportunities_df.to_csv(filename, index=False)
            print(f"\n💾 Predikciók mentve: {filename}")
            
        else:
            print("\n❌ Nem található értékes fogadási lehetőség erre a hétvégére.")
            print("💡 Próbáld más odds-okkal vagy lazítsd a kritériumokat.")
    
    except Exception as e:
        print(f"❌ Hiba: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
