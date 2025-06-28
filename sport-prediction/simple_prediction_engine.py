#!/usr/bin/env python3
"""
Egyszerű predikciós motor - numpy és pandas nélkül
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

class SimplePredictionEngine:
    def __init__(self, db_path: str = "data/football_database.db"):
        self.db_path = db_path
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)

    def get_team_form(self, team_id: int, days_back: int = 30) -> Dict:
        """Csapat formája az utolsó N napban"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cutoff_date = datetime.now() - timedelta(days=days_back)

        # Hazai meccsek
        cursor.execute("""
            SELECT date, home_score, away_score
            FROM historical_matches
            WHERE home_team_id = ? AND date >= ?
            AND home_score IS NOT NULL AND away_score IS NOT NULL
            ORDER BY date DESC
        """, (team_id, cutoff_date.strftime('%Y-%m-%d')))

        home_matches = cursor.fetchall()

        # Vendég meccsek
        cursor.execute("""
            SELECT date, home_score, away_score
            FROM historical_matches
            WHERE away_team_id = ? AND date >= ?
            AND home_score IS NOT NULL AND away_score IS NOT NULL
            ORDER BY date DESC
        """, (team_id, cutoff_date.strftime('%Y-%m-%d')))

        away_matches = cursor.fetchall()
        conn.close()

        # Statisztikák számítása
        total_points = 0
        total_games = 0
        wins = 0
        draws = 0
        losses = 0
        goals_for = 0
        goals_against = 0

        # Hazai meccsek feldolgozása
        for match in home_matches:
            home_score, away_score = match[1], match[2]
            goals_for += home_score
            goals_against += away_score

            if home_score > away_score:
                total_points += 3
                wins += 1
            elif home_score == away_score:
                total_points += 1
                draws += 1
            else:
                losses += 1

            total_games += 1

        # Vendég meccsek feldolgozása
        for match in away_matches:
            home_score, away_score = match[1], match[2]
            goals_for += away_score
            goals_against += home_score

            if away_score > home_score:
                total_points += 3
                wins += 1
            elif away_score == home_score:
                total_points += 1
                draws += 1
            else:
                losses += 1

            total_games += 1

        form_score = (total_points / (total_games * 3)) if total_games > 0 else 0.0

        return {
            'matches_played': total_games,
            'points': total_points,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'goals_for': goals_for,
            'goals_against': goals_against,
            'form_score': form_score
        }

    def get_team_league_position(self, team_id: int, league_name: str) -> Optional[Dict]:
        """Csapat liga pozíciója"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT position, points, matches_played, wins, draws, losses,
                   goals_for, goals_against
            FROM league_tables
            WHERE team_id = ? AND league = ?
            AND snapshot_date = (
                SELECT MAX(snapshot_date) FROM league_tables
                WHERE league = ?
            )
        """, (team_id, league_name, league_name))

        result = cursor.fetchone()
        conn.close()

        if result:
            return {
                'position': result[0],
                'points': result[1],
                'matches_played': result[2],
                'wins': result[3],
                'draws': result[4],
                'losses': result[5],
                'goals_for': result[6],
                'goals_against': result[7]
            }
        return None

    def get_head_to_head(self, team1_id: int, team2_id: int, games_limit: int = 10) -> Dict:
        """Egymás elleni mérleg"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT date, home_team_id, away_team_id, home_score, away_score
            FROM historical_matches
            WHERE ((home_team_id = ? AND away_team_id = ?) OR
                   (home_team_id = ? AND away_team_id = ?))
            AND home_score IS NOT NULL AND away_score IS NOT NULL
            ORDER BY date DESC
            LIMIT ?
        """, (team1_id, team2_id, team2_id, team1_id, games_limit))

        matches = cursor.fetchall()
        conn.close()

        if not matches:
            return {
                'matches_played': 0,
                'team1_wins': 0,
                'team2_wins': 0,
                'draws': 0,
                'team1_goals': 0,
                'team2_goals': 0
            }

        team1_wins = 0
        team2_wins = 0
        draws = 0
        team1_goals = 0
        team2_goals = 0

        for match in matches:
            home_team_id, away_team_id = match[1], match[2]
            home_score, away_score = match[3], match[4]

            if home_team_id == team1_id:
                team1_goals += home_score
                team2_goals += away_score
                if home_score > away_score:
                    team1_wins += 1
                elif home_score < away_score:
                    team2_wins += 1
                else:
                    draws += 1
            else:
                team1_goals += away_score
                team2_goals += home_score
                if away_score > home_score:
                    team1_wins += 1
                elif away_score < home_score:
                    team2_wins += 1
                else:
                    draws += 1

        return {
            'matches_played': len(matches),
            'team1_wins': team1_wins,
            'team2_wins': team2_wins,
            'draws': draws,
            'team1_goals': team1_goals,
            'team2_goals': team2_goals
        }

    def calculate_match_probability(self, home_team_id: int, away_team_id: int,
                                  league_name: str = None) -> Dict:
        """Meccs kimenetel valószínűségek számítása"""

        # Csapat formák
        home_form = self.get_team_form(home_team_id)
        away_form = self.get_team_form(away_team_id)

        # Liga pozíciók
        home_position = None
        away_position = None
        if league_name:
            home_position = self.get_team_league_position(home_team_id, league_name)
            away_position = self.get_team_league_position(away_team_id, league_name)

        # Egymás elleni mérleg
        h2h = self.get_head_to_head(home_team_id, away_team_id)

        # Alap valószínűségek (hazai előny)
        home_base = 0.45
        draw_base = 0.28
        away_base = 0.27

        # Forma korrekció
        form_diff = home_form['form_score'] - away_form['form_score']
        form_adjustment = form_diff * 0.2  # Max 20% módosítás

        # Liga pozíció korrekció
        position_adjustment = 0.0
        if home_position and away_position:
            # Alacsonyabb pozíció = jobb csapat
            position_diff = (away_position['position'] - home_position['position']) / 20.0
            position_adjustment = position_diff * 0.15  # Max 15% módosítás

        # H2H korrekció
        h2h_adjustment = 0.0
        if h2h['matches_played'] >= 3:
            h2h_ratio = (h2h['team1_wins'] - h2h['team2_wins']) / h2h['matches_played']
            h2h_adjustment = h2h_ratio * 0.1  # Max 10% módosítás

        # Összesített korrekció
        total_home_adj = form_adjustment + position_adjustment + h2h_adjustment

        # Valószínűségek újraszámítása
        home_prob = max(0.1, min(0.8, home_base + total_home_adj))
        away_prob = max(0.1, min(0.8, away_base - total_home_adj))
        draw_prob = max(0.1, 1.0 - home_prob - away_prob)

        # Normalizálás
        total = home_prob + draw_prob + away_prob
        home_prob /= total
        draw_prob /= total
        away_prob /= total

        return {
            'home_win_prob': home_prob,
            'draw_prob': draw_prob,
            'away_win_prob': away_prob,
            'confidence': min(1.0, (home_form['matches_played'] + away_form['matches_played']) / 20.0),
            'factors': {
                'home_form': home_form,
                'away_form': away_form,
                'home_position': home_position,
                'away_position': away_position,
                'head_to_head': h2h,
                'adjustments': {
                    'form': form_adjustment,
                    'position': position_adjustment,
                    'h2h': h2h_adjustment
                }
            }
        }

    def recommend_bets(self, match_predictions: Dict) -> List[Dict]:
        """Fogadási ajánlások"""
        recommendations = []

        home_prob = match_predictions['home_win_prob']
        draw_prob = match_predictions['draw_prob']
        away_prob = match_predictions['away_win_prob']
        confidence = match_predictions['confidence']

        # Biztonságos fogadások (magas valószínűség)
        if home_prob > 0.6 and confidence > 0.7:
            recommendations.append({
                'bet_type': '1',
                'description': 'Hazai győzelem',
                'probability': home_prob,
                'confidence': confidence,
                'risk_level': 'Alacsony',
                'recommended_stake': 'Magas'
            })

        if away_prob > 0.6 and confidence > 0.7:
            recommendations.append({
                'bet_type': '2',
                'description': 'Vendég győzelem',
                'probability': away_prob,
                'confidence': confidence,
                'risk_level': 'Alacsony',
                'recommended_stake': 'Magas'
            })

        # Döntetlen fogadások
        if draw_prob > 0.35 and confidence > 0.6:
            recommendations.append({
                'bet_type': 'X',
                'description': 'Döntetlen',
                'probability': draw_prob,
                'confidence': confidence,
                'risk_level': 'Közepes',
                'recommended_stake': 'Közepes'
            })

        # Dupla esély fogadások
        if home_prob + draw_prob > 0.75:
            recommendations.append({
                'bet_type': '1X',
                'description': 'Hazai győzelem vagy döntetlen',
                'probability': home_prob + draw_prob,
                'confidence': confidence,
                'risk_level': 'Alacsony',
                'recommended_stake': 'Magas'
            })

        if away_prob + draw_prob > 0.75:
            recommendations.append({
                'bet_type': 'X2',
                'description': 'Vendég győzelem vagy döntetlen',
                'probability': away_prob + draw_prob,
                'confidence': confidence,
                'risk_level': 'Alacsony',
                'recommended_stake': 'Magas'
            })

        # Gól fogadások a formák alapján
        home_form = match_predictions['factors']['home_form']
        away_form = match_predictions['factors']['away_form']

        if home_form['matches_played'] > 0 and away_form['matches_played'] > 0:
            avg_goals_home = home_form['goals_for'] / max(1, home_form['matches_played'])
            avg_goals_away = away_form['goals_for'] / max(1, away_form['matches_played'])

            expected_goals = avg_goals_home + avg_goals_away

            if expected_goals > 2.5:
                recommendations.append({
                    'bet_type': 'Over 2.5',
                    'description': 'Több mint 2.5 gól',
                    'probability': min(0.8, expected_goals / 4.0),
                    'confidence': confidence * 0.8,
                    'risk_level': 'Közepes',
                    'recommended_stake': 'Közepes'
                })

            if expected_goals < 2.0:
                recommendations.append({
                    'bet_type': 'Under 2.5',
                    'description': 'Kevesebb mint 2.5 gól',
                    'probability': min(0.8, (4.0 - expected_goals) / 4.0),
                    'confidence': confidence * 0.8,
                    'risk_level': 'Közepes',
                    'recommended_stake': 'Közepes'
                })

        # Rendezés valószínűség szerint
        recommendations.sort(key=lambda x: x['probability'] * x['confidence'], reverse=True)

        return recommendations

    def get_todays_matches(self) -> List[Dict]:
        """Mai meccsek lekérése"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        today = datetime.now().strftime('%Y-%m-%d')

        cursor.execute("""
            SELECT fm.match_id, fm.date, fm.home_team_id, fm.away_team_id,
                   ht.team_name as home_team, at.team_name as away_team,
                   fm.league, fm.time
            FROM future_matches fm
            LEFT JOIN teams ht ON fm.home_team_id = ht.team_id
            LEFT JOIN teams at ON fm.away_team_id = at.team_id
            WHERE DATE(fm.date) = ?
            ORDER BY fm.time
        """, (today,))

        matches = []
        for row in cursor.fetchall():
            matches.append({
                'id': row[0],
                'date': row[1],
                'home_team_id': row[2],
                'away_team_id': row[3],
                'home_team': row[4],
                'away_team': row[5],
                'league': row[6],
                'time': row[7]
            })

        conn.close()
        return matches

    def generate_daily_predictions(self, target_date: str = None) -> Dict:
        """Napi predikciók generálása"""
        if not target_date:
            target_date = datetime.now().strftime('%Y-%m-%d')

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT fm.match_id, fm.date, fm.home_team_id, fm.away_team_id,
                   ht.team_name as home_team, at.team_name as away_team,
                   fm.league, fm.time
            FROM future_matches fm
            LEFT JOIN teams ht ON fm.home_team_id = ht.team_id
            LEFT JOIN teams at ON fm.away_team_id = at.team_id
            WHERE DATE(fm.date) = ?
            ORDER BY fm.time
        """, (target_date,))

        matches = cursor.fetchall()
        conn.close()

        predictions = {
            'date': target_date,
            'generated_at': datetime.now().isoformat(),
            'matches': [],
            'summary': {
                'total_matches': len(matches),
                'high_confidence_bets': 0,
                'recommended_combinations': []
            }
        }

        high_confidence_bets = []

        for match in matches:
            match_id, date, home_team_id, away_team_id, home_team, away_team, league, time = match

            # Predikció számítás
            prediction = self.calculate_match_probability(home_team_id, away_team_id, league)

            # Fogadási ajánlások
            recommendations = self.recommend_bets(prediction)

            match_prediction = {
                'match_id': match_id,
                'home_team': home_team,
                'away_team': away_team,
                'league': league,
                'match_time': time,
                'predictions': prediction,
                'recommendations': recommendations
            }

            predictions['matches'].append(match_prediction)

            # Magas bizonyosságú fogadások gyűjtése
            for rec in recommendations:
                if rec['confidence'] > 0.75 and rec['probability'] > 0.7:
                    high_confidence_bets.append({
                        'match': f"{home_team} vs {away_team}",
                        'bet': rec,
                        'match_time': time
                    })
                    predictions['summary']['high_confidence_bets'] += 1

        # Ajánlott kombinációk generálása
        if len(high_confidence_bets) >= 2:
            combinations = []
            for i in range(len(high_confidence_bets)):
                for j in range(i + 1, len(high_confidence_bets)):
                    bet1 = high_confidence_bets[i]
                    bet2 = high_confidence_bets[j]

                    combined_prob = bet1['bet']['probability'] * bet2['bet']['probability']
                    combined_confidence = min(bet1['bet']['confidence'], bet2['bet']['confidence'])

                    if combined_prob > 0.4 and combined_confidence > 0.7:
                        combinations.append({
                            'type': 'Dupla',
                            'matches': [bet1['match'], bet2['match']],
                            'bets': [bet1['bet']['description'], bet2['bet']['description']],
                            'probability': combined_prob,
                            'confidence': combined_confidence
                        })

            predictions['summary']['recommended_combinations'] = sorted(
                combinations,
                key=lambda x: x['probability'] * x['confidence'],
                reverse=True
            )[:5]  # Top 5

        return predictions

def main():
    engine = SimplePredictionEngine()

    # Mai meccsek
    todays_matches = engine.get_todays_matches()
    print(f"\n⚽ MAI MECCSEK: {len(todays_matches)}")

    if todays_matches:
        # Napi predikciók generálása
        predictions = engine.generate_daily_predictions()

        print(f"\n🔮 PREDIKCIÓK ({predictions['date']})")
        print(f"=" * 50)
        print(f"📊 Összes meccs: {predictions['summary']['total_matches']}")
        print(f"🎯 Magas bizonyosságú fogadások: {predictions['summary']['high_confidence_bets']}")

        for match_pred in predictions['matches']:
            print(f"\n🏟️  {match_pred['home_team']} vs {match_pred['away_team']}")
            print(f"   ⏰ {match_pred['match_time']} | 🏆 {match_pred['league']}")

            pred = match_pred['predictions']
            print(f"   📈 Hazai: {pred['home_win_prob']:.2%} | "
                  f"❌ Döntetlen: {pred['draw_prob']:.2%} | "
                  f"📉 Vendég: {pred['away_win_prob']:.2%}")
            print(f"   🎯 Bizonyosság: {pred['confidence']:.2%}")

            if match_pred['recommendations']:
                print(f"   💡 TOP ajánlás: {match_pred['recommendations'][0]['description']} "
                      f"({match_pred['recommendations'][0]['probability']:.2%})")

        # Kombinációk
        if predictions['summary']['recommended_combinations']:
            print(f"\n🎲 AJÁNLOTT KOMBINÁCIÓK:")
            for i, combo in enumerate(predictions['summary']['recommended_combinations'], 1):
                print(f"   {i}. {combo['type']}: {combo['probability']:.2%} esély")
                for j, match in enumerate(combo['matches']):
                    print(f"      - {match}: {combo['bets'][j]}")

    else:
        print("Nincsenek mai meccsek az adatbázisban.")

        # Adunk hozzá néhány teszt meccset a jövőre
        print("\n📝 Teszt meccsek hozzáadása...")
        conn = sqlite3.connect(engine.db_path)
        cursor = conn.cursor()

        # Holnapi meccsek hozzáadása tesztként
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

        test_matches = [
            (tomorrow, '15:00', 693, 694, 'Premier League'),  # Arsenal vs Crystal Palace
            (tomorrow, '17:30', 695, 696, 'Serie A'),          # Milan vs Bologna
        ]

        for match in test_matches:
            try:
                cursor.execute("""
                    INSERT OR IGNORE INTO future_matches
                    (date, time, home_team_id, away_team_id, league)
                    VALUES (?, ?, ?, ?, ?)
                """, match)
            except:
                pass

        conn.commit()
        conn.close()

        print(f"✅ Teszt meccsek hozzáadva {tomorrow}-re")
        print("Futtasd újra a scriptet holnap a predikciókért!")

if __name__ == "__main__":
    main()
