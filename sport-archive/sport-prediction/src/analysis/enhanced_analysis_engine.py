#!/usr/bin/env python3
"""
🧠 KIBŐVÍTETT ELEMZŐ MOTOR
Multi-bajnokság adatok kombinálása pontosabb predikciókhoz.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class CompetitionData:
    """Verseny adat osztály"""
    competition_id: str
    name: str
    quality_score: int
    level: int
    matches: pd.DataFrame
    weight: float

class EnhancedAnalysisEngine:
    """Kibővített elemző motor"""

    def __init__(self):
        self.competitions_data = {}
        self.team_profiles = {}
        self.cross_league_mappings = {}

        # Elemzési súlyok
        self.analysis_weights = {
            'recent_form': 0.35,      # Jelenlegi forma
            'head_to_head': 0.25,     # Egymás elleni mérleg
            'quality_opposition': 0.20, # Ellenfél minősége
            'competition_context': 0.15, # Verseny kontextus
            'fatigue_factor': 0.05    # Fáradtság
        }

    def load_multi_competition_data(self, data_path: str = "data/enhanced_system"):
        """Több verseny adatainak betöltése"""
        print("📚 MULTI-BAJNOKSÁG ADATOK BETÖLTÉSE")
        print("=" * 50)

        if not os.path.exists(data_path):
            print(f"❌ Adatkönyvtár nem található: {data_path}")
            return False

        categories = ['premier_leagues', 'secondary_leagues', 'cup_competitions', 'summer_leagues']
        total_loaded = 0

        for category in categories:
            cat_path = os.path.join(data_path, category)
            if os.path.exists(cat_path):
                loaded = self._load_category_data(cat_path, category)
                total_loaded += loaded
                print(f"✅ {category}: {loaded} verseny")

        print(f"\n📊 Összesen betöltve: {total_loaded} verseny")
        return total_loaded > 0

    def _load_category_data(self, category_path: str, category: str) -> int:
        """Kategória adatok betöltése"""
        loaded_count = 0

        for item in os.listdir(category_path):
            item_path = os.path.join(category_path, item)
            if os.path.isdir(item_path):
                config_file = os.path.join(item_path, f"{item}_config.json")
                if os.path.exists(config_file):
                    try:
                        with open(config_file, 'r') as f:
                            config = json.load(f)

                        # Minta adatok generálása (valódi API helyett)
                        matches_df = self._generate_sample_matches(item, config)

                        competition_data = CompetitionData(
                            competition_id=item,
                            name=config['name'],
                            quality_score=config.get('quality_score', 70),
                            level=config.get('level', 2),
                            matches=matches_df,
                            weight=config.get('analysis_weights', {}).get('prediction_weight', 0.7)
                        )

                        self.competitions_data[item] = competition_data
                        loaded_count += 1

                    except Exception as e:
                        print(f"⚠️ Hiba {item} betöltésénél: {e}")

        return loaded_count

    def _generate_sample_matches(self, competition_id: str, config: Dict) -> pd.DataFrame:
        """Minta meccsek generálása versenyhez"""
        quality_score = config.get('quality_score', 70)

        # Csapatok száma és névkonvenciója
        team_count = self._get_team_count_by_competition(competition_id)
        teams = [f"{competition_id.upper()}_Team_{i+1}" for i in range(team_count)]

        # Meccsek generálása
        matches = []
        for i in range(min(200, team_count * 10)):  # Max 200 meccs
            home_team = np.random.choice(teams)
            away_team = np.random.choice([t for t in teams if t != home_team])

            # Minőség alapú gól generálás
            home_goals = np.random.poisson(self._get_goal_average(quality_score, True))
            away_goals = np.random.poisson(self._get_goal_average(quality_score, False))

            # Eredmény
            if home_goals > away_goals:
                result = 'H'
            elif away_goals > home_goals:
                result = 'A'
            else:
                result = 'D'

            # Dátum (utolsó 2 év)
            days_ago = np.random.randint(1, 730)
            match_date = datetime.now() - timedelta(days=days_ago)

            matches.append({
                'Date': match_date.strftime('%Y-%m-%d'),
                'HomeTeam': home_team,
                'AwayTeam': away_team,
                'FTHG': home_goals,
                'FTAG': away_goals,
                'FTR': result,
                'Competition': competition_id,
                'Quality_Score': quality_score
            })

        return pd.DataFrame(matches)

    def _get_team_count_by_competition(self, competition_id: str) -> int:
        """Csapatok száma versenyenként"""
        team_counts = {
            'premier_league': 20, 'bundesliga': 18, 'serie_a': 20, 'la_liga': 20, 'ligue_1': 20,
            'championship': 24, 'bundesliga_2': 18,
            'mls': 29, 'brasileirao': 20, 'j_league': 18,
            'chinese_super_league': 16, 'a_league_women': 12,
            'champions_league': 32, 'europa_league': 32, 'copa_libertadores': 32,
            'fa_cup': 64, 'copa_america': 16, 'world_cup_qualifiers': 32
        }
        return team_counts.get(competition_id, 20)

    def _get_goal_average(self, quality_score: int, is_home: bool) -> float:
        """Gól átlag minőség alapján"""
        base_avg = 1.3 + (quality_score - 70) * 0.01  # Magasabb minőség = több gól
        if is_home:
            base_avg += 0.3  # Hazai előny
        return max(0.8, base_avg)

    def build_enhanced_team_profiles(self):
        """Bővített csapat profilok építése"""
        print("\n🧠 BŐVÍTETT CSAPAT PROFILOK")
        print("=" * 40)

        all_teams = set()
        for comp_data in self.competitions_data.values():
            all_teams.update(comp_data.matches['HomeTeam'].unique())
            all_teams.update(comp_data.matches['AwayTeam'].unique())

        for team in all_teams:
            profile = self._build_team_profile(team)
            self.team_profiles[team] = profile

        print(f"✅ {len(self.team_profiles)} csapat profil létrehozva")

    def _build_team_profile(self, team: str) -> Dict:
        """Egyedi csapat profil építése"""
        profile = {
            'team_name': team,
            'competitions': [],
            'total_matches': 0,
            'avg_goals_scored': 0,
            'avg_goals_conceded': 0,
            'home_win_rate': 0,
            'away_win_rate': 0,
            'quality_weighted_performance': 0,
            'recent_form': [],
            'competition_weights': {}
        }

        all_matches = []
        competition_weights = {}

        # Összes meccs gyűjtése a csapatnak
        for comp_data in self.competitions_data.values():
            team_matches = comp_data.matches[
                (comp_data.matches['HomeTeam'] == team) |
                (comp_data.matches['AwayTeam'] == team)
            ].copy()

            if len(team_matches) > 0:
                profile['competitions'].append(comp_data.competition_id)
                all_matches.append(team_matches)
                competition_weights[comp_data.competition_id] = comp_data.weight

        if not all_matches:
            return profile

        # Összes meccs kombinálása
        combined_matches = pd.concat(all_matches, ignore_index=True)
        profile['total_matches'] = len(combined_matches)

        # Statisztikák számítása
        home_matches = combined_matches[combined_matches['HomeTeam'] == team]
        away_matches = combined_matches[combined_matches['AwayTeam'] == team]

        # Gólok
        goals_scored = (home_matches['FTHG'].sum() + away_matches['FTAG'].sum())
        goals_conceded = (home_matches['FTAG'].sum() + away_matches['FTHG'].sum())

        profile['avg_goals_scored'] = goals_scored / len(combined_matches) if len(combined_matches) > 0 else 0
        profile['avg_goals_conceded'] = goals_conceded / len(combined_matches) if len(combined_matches) > 0 else 0

        # Győzelmi arány
        home_wins = len(home_matches[home_matches['FTR'] == 'H'])
        away_wins = len(away_matches[away_matches['FTR'] == 'A'])

        profile['home_win_rate'] = home_wins / len(home_matches) if len(home_matches) > 0 else 0
        profile['away_win_rate'] = away_wins / len(away_matches) if len(away_matches) > 0 else 0

        # Minőség-súlyozott teljesítmény
        weighted_performance = 0
        total_weight = 0
        for _, match in combined_matches.iterrows():
            quality = match['Quality_Score']
            weight = quality / 100

            if match['HomeTeam'] == team:
                if match['FTR'] == 'H':
                    points = 3
                elif match['FTR'] == 'D':
                    points = 1
                else:
                    points = 0
            else:  # Away team
                if match['FTR'] == 'A':
                    points = 3
                elif match['FTR'] == 'D':
                    points = 1
                else:
                    points = 0

            weighted_performance += points * weight
            total_weight += weight

        profile['quality_weighted_performance'] = weighted_performance / total_weight if total_weight > 0 else 0
        profile['competition_weights'] = competition_weights

        # Jelenlegi forma (utolsó 10 meccs)
        recent_matches = combined_matches.sort_values('Date').tail(10)
        recent_form = []
        for _, match in recent_matches.iterrows():
            if match['HomeTeam'] == team:
                result = match['FTR'] if match['FTR'] in ['H', 'D'] else 'L'
                if result == 'H':
                    result = 'W'
            else:
                result = 'W' if match['FTR'] == 'A' else ('D' if match['FTR'] == 'D' else 'L')
            recent_form.append(result)

        profile['recent_form'] = recent_form

        return profile

    def predict_enhanced_match(self, home_team: str, away_team: str,
                             competition_context: Optional[str] = None) -> Dict:
        """Bővített meccs predikció"""
        if home_team not in self.team_profiles or away_team not in self.team_profiles:
            return {
                'error': 'Nincs elég adat a csapatokról',
                'confidence': 0
            }

        home_profile = self.team_profiles[home_team]
        away_profile = self.team_profiles[away_team]

        # Alap erősségi mutatók
        home_strength = self._calculate_team_strength(home_profile, is_home=True)
        away_strength = self._calculate_team_strength(away_profile, is_home=False)

        # Forma faktor
        home_form = self._calculate_form_factor(home_profile['recent_form'])
        away_form = self._calculate_form_factor(away_profile['recent_form'])

        # Verseny kontextus súlyozás
        context_modifier = self._get_competition_context_modifier(competition_context)

        # Végső erősség
        home_final = home_strength * home_form * context_modifier['home']
        away_final = away_strength * away_form * context_modifier['away']

        # Valószínűségek számítása
        total_strength = home_final + away_final
        draw_factor = 0.28  # Döntetlen valószínűség bázis

        prob_home = (home_final / total_strength) * (1 - draw_factor)
        prob_away = (away_final / total_strength) * (1 - draw_factor)
        prob_draw = draw_factor

        # Normalizálás
        total_prob = prob_home + prob_draw + prob_away
        prob_home /= total_prob
        prob_draw /= total_prob
        prob_away /= total_prob

        # Bizalom számítása
        confidence = self._calculate_prediction_confidence(home_profile, away_profile, competition_context)

        # Várható gólok
        expected_home_goals = home_profile['avg_goals_scored'] * (home_final / away_final) * 1.1  # Hazai bónusz
        expected_away_goals = away_profile['avg_goals_scored'] * (away_final / home_final)

        return {
            'home_team': home_team,
            'away_team': away_team,
            'prob_home': prob_home,
            'prob_draw': prob_draw,
            'prob_away': prob_away,
            'confidence': confidence,
            'expected_home_goals': expected_home_goals,
            'expected_away_goals': expected_away_goals,
            'analysis_details': {
                'home_strength': home_strength,
                'away_strength': away_strength,
                'home_form': home_form,
                'away_form': away_form,
                'context_modifier': context_modifier,
                'competitions_considered': len(set(home_profile['competitions'] + away_profile['competitions']))
            }
        }

    def _calculate_team_strength(self, profile: Dict, is_home: bool) -> float:
        """Csapat erősség számítása"""
        base_strength = profile['quality_weighted_performance']

        if is_home:
            win_rate = profile['home_win_rate']
        else:
            win_rate = profile['away_win_rate']

        # Gól arány hatás
        goal_ratio = profile['avg_goals_scored'] / max(profile['avg_goals_conceded'], 0.5)

        # Kombináció
        strength = (base_strength * 0.5 + win_rate * 0.3 + min(goal_ratio, 3) * 0.2)

        return max(0.1, min(strength, 3.0))  # Korlátok

    def _calculate_form_factor(self, recent_form: List[str]) -> float:
        """Forma faktor számítása"""
        if not recent_form:
            return 1.0

        form_points = {'W': 3, 'D': 1, 'L': 0}
        total_points = sum(form_points.get(result, 0) for result in recent_form)
        max_points = len(recent_form) * 3

        form_factor = 0.8 + (total_points / max_points) * 0.4  # 0.8-1.2 között
        return form_factor

    def _get_competition_context_modifier(self, competition_context: Optional[str]) -> Dict:
        """Verseny kontextus módosító"""
        if not competition_context or competition_context not in self.competitions_data:
            return {'home': 1.0, 'away': 1.0}

        comp_data = self.competitions_data[competition_context]
        quality_score = comp_data.quality_score

        # Magasabb minőségű versenyben kisebb hazai előny
        home_modifier = 1.0 + (0.15 - (quality_score - 70) * 0.001)
        away_modifier = 1.0

        return {'home': home_modifier, 'away': away_modifier}

    def _calculate_prediction_confidence(self, home_profile: Dict, away_profile: Dict,
                                       competition_context: Optional[str]) -> float:
        """Predikció bizalom számítása"""
        # Adatmennyiség alapú bizalom
        total_matches = home_profile['total_matches'] + away_profile['total_matches']
        data_confidence = min(total_matches / 100, 1.0)  # Max 100 meccs után 100%

        # Verseny minőség alapú bizalom
        quality_confidence = 0.7
        if competition_context and competition_context in self.competitions_data:
            quality_score = self.competitions_data[competition_context].quality_score
            quality_confidence = min(quality_score / 100, 1.0)

        # Forma stabilitás
        form_stability = self._calculate_form_stability(home_profile, away_profile)

        # Kombinált bizalom
        confidence = (data_confidence * 0.4 + quality_confidence * 0.3 + form_stability * 0.3)

        return round(confidence, 3)

    def _calculate_form_stability(self, home_profile: Dict, away_profile: Dict) -> float:
        """Forma stabilitás számítása"""
        def form_variance(form_list):
            if len(form_list) < 3:
                return 0.5
            points = [3 if r == 'W' else (1 if r == 'D' else 0) for r in form_list]
            return 1.0 - (np.std(points) / 3.0)  # Inverted variance

        home_stability = form_variance(home_profile['recent_form'])
        away_stability = form_variance(away_profile['recent_form'])

        return (home_stability + away_stability) / 2

def main():
    """Tesztelés"""
    engine = EnhancedAnalysisEngine()

    print("🧠 KIBŐVÍTETT ELEMZŐ MOTOR")
    print("=" * 50)

    # Adatok betöltése
    if engine.load_multi_competition_data():
        # Csapat profilok építése
        engine.build_enhanced_team_profiles()

        # Teszt predikció
        print("\n🔮 TESZT PREDIKCIÓ")
        print("=" * 30)

        # Példa csapatok keresése
        if engine.team_profiles:
            teams = list(engine.team_profiles.keys())[:2]
            if len(teams) >= 2:
                home_team, away_team = teams[0], teams[1]

                prediction = engine.predict_enhanced_match(
                    home_team, away_team,
                    competition_context='mls'
                )

                print(f"Meccs: {home_team} vs {away_team}")
                print(f"Hazai győzelem: {prediction['prob_home']:.1%}")
                print(f"Döntetlen: {prediction['prob_draw']:.1%}")
                print(f"Vendég győzelem: {prediction['prob_away']:.1%}")
                print(f"Bizalom: {prediction['confidence']:.1%}")
                print(f"Figyelembe vett versenyek: {prediction['analysis_details']['competitions_considered']}")

if __name__ == "__main__":
    main()
