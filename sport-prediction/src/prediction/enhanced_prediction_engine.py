#!/usr/bin/env python3
"""
🎯 TOVÁBBFEJLESZTETT PREDIKCIÓS MOTOR
PDF-ből nyert meccs adatok alapján részletes predikciók
- Meccs eredmény
- Gólok száma
- Szögletek
- Sárga lapok
- Both Teams to Score
"""

import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import requests
import os

@dataclass
class TeamStats:
    """Csapat statisztikák"""
    team_name: str

    # Alap statisztikák
    goals_scored_avg: float
    goals_conceded_avg: float

    # Fejlett statisztikák
    corners_per_game: float
    corners_conceded_per_game: float
    cards_per_game: float
    cards_opponent_avg: float

    # Forma és teljesítmény
    recent_form: List[str]  # W/D/L
    home_performance: Dict
    away_performance: Dict

    # Liga pozíció
    league_position: int
    points_per_game: float

@dataclass
class DetailedPrediction:
    """Részletes predikció eredmény"""
    match_id: str
    home_team: str
    away_team: str

    # Alap predikciók
    match_result: Dict[str, float]  # home/draw/away valószínűségek
    expected_goals: Dict[str, float]  # home/away várható gólok

    # Fejlett predikciók
    total_goals_prediction: Dict[str, float]  # over/under 2.5
    btts_prediction: Dict[str, float]  # both teams to score
    corners_prediction: Dict[str, float]  # szögletek predikció
    cards_prediction: Dict[str, float]  # lapok predikció

    # Bizalom és értékelés
    confidence_level: float
    value_bets: List[Dict]  # értékes fogadások

    # Bookmaker összehasonlítás
    bookmaker_odds: Dict
    predicted_vs_odds: Dict

class EnhancedPredictionEngine:
    """Továbbfejlesztett predikciós motor"""

    def __init__(self):
        self.data_dir = "data"
        self.cache_dir = "data/team_stats_cache"
        os.makedirs(self.cache_dir, exist_ok=True)

        # Liga specifikus átlagok és módosítók
        self.league_stats = {
            'Premier League': {
                'avg_goals_per_game': 2.65,
                'avg_corners_per_game': 10.8,
                'avg_cards_per_game': 4.2,
                'home_advantage': 1.15
            },
            'La Liga': {
                'avg_goals_per_game': 2.45,
                'avg_corners_per_game': 9.8,
                'avg_cards_per_game': 5.1,
                'home_advantage': 1.12
            },
            'Bundesliga': {
                'avg_goals_per_game': 2.85,
                'avg_corners_per_game': 11.2,
                'avg_cards_per_game': 3.8,
                'home_advantage': 1.18
            },
            'Serie A': {
                'avg_goals_per_game': 2.35,
                'avg_corners_per_game': 9.4,
                'avg_cards_per_game': 4.6,
                'home_advantage': 1.10
            },
            'Ligue 1': {
                'avg_goals_per_game': 2.55,
                'avg_corners_per_game': 10.1,
                'avg_cards_per_game': 4.0,
                'home_advantage': 1.14
            }
        }

    def load_daily_matches(self, json_file: str = None) -> List[Dict]:
        """Napi meccsek betöltése JSON-ból"""
        if not json_file:
            today = datetime.now().strftime('%Y%m%d')
            json_file = f"{self.data_dir}/daily_matches_{today}.json"

        if not os.path.exists(json_file):
            print(f"❌ Nem található meccs fájl: {json_file}")
            return []

        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return data.get('matches', [])

    async def get_team_stats(self, team_name: str, league: str) -> TeamStats:
        """Csapat statisztikák lekérdezése és cache-elése"""
        cache_file = os.path.join(self.cache_dir, f"{team_name.replace(' ', '_')}.json")

        # Cache ellenőrzése (2 órás érvényesség)
        if os.path.exists(cache_file):
            cache_age = datetime.now().timestamp() - os.path.getmtime(cache_file)
            if cache_age < 7200:  # 2 óra
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                return self._parse_team_stats(cached_data)

        # Új adatok lekérdezése
        stats_data = await self._fetch_team_stats_from_multiple_sources(team_name, league)

        # Cache mentése
        if stats_data:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(stats_data, f, indent=2, ensure_ascii=False)

        return self._parse_team_stats(stats_data)

    async def _fetch_team_stats_from_multiple_sources(self, team_name: str, league: str) -> Dict:
        """Csapat statisztikák gyűjtése több forrásból"""
        print(f"📊 {team_name} statisztikák gyűjtése...")

        # Alap értékek liga alapján
        league_data = self.league_stats.get(league, self.league_stats['Premier League'])

        # Szimuláljunk realisztikus adatokat (valós implementációban API-k)
        np.random.seed(hash(team_name) % 2**32)

        # Erősség alapú módosítók
        team_strength = self._estimate_team_strength(team_name)

        stats_data = {
            'team_name': team_name,
            'league': league,
            'goals_scored_avg': max(0.5, np.random.normal(1.4 + team_strength * 0.8, 0.3)),
            'goals_conceded_avg': max(0.3, np.random.normal(1.3 - team_strength * 0.5, 0.25)),
            'corners_per_game': max(3.0, np.random.normal(league_data['avg_corners_per_game']/2 + team_strength * 2, 1.0)),
            'corners_conceded_per_game': max(2.0, np.random.normal(league_data['avg_corners_per_game']/2 - team_strength * 1.5, 1.0)),
            'cards_per_game': max(1.0, np.random.normal(league_data['avg_cards_per_game']/2 - team_strength * 0.3, 0.5)),
            'cards_opponent_avg': max(1.0, np.random.normal(league_data['avg_cards_per_game']/2 + team_strength * 0.2, 0.4)),
            'recent_form': self._generate_form(team_strength),
            'home_performance': self._generate_home_performance(team_strength),
            'away_performance': self._generate_away_performance(team_strength),
            'league_position': max(1, min(20, int(np.random.normal(10 - team_strength * 8, 4)))),
            'points_per_game': max(0.5, min(2.5, np.random.normal(1.2 + team_strength * 0.8, 0.3))),
            'last_updated': datetime.now().isoformat()
        }

        return stats_data

    def _estimate_team_strength(self, team_name: str) -> float:
        """Csapat erősség becslése név alapján (-1 to +1)"""
        elite_teams = [
            'Manchester City', 'Liverpool FC', 'Real Madrid', 'FC Barcelona',
            'Bayern Munich', 'Paris Saint-Germain', 'Juventus'
        ]

        strong_teams = [
            'Arsenal', 'Chelsea', 'Tottenham', 'Manchester United',
            'Atletico Madrid', 'Borussia Dortmund', 'AC Milan', 'Inter Milan'
        ]

        if team_name in elite_teams:
            return np.random.uniform(0.6, 1.0)
        elif team_name in strong_teams:
            return np.random.uniform(0.2, 0.6)
        else:
            return np.random.uniform(-0.4, 0.3)

    def _generate_form(self, team_strength: float) -> List[str]:
        """Forma generálása erősség alapján"""
        win_prob = 0.4 + team_strength * 0.3
        draw_prob = 0.25
        loss_prob = 1 - win_prob - draw_prob

        form = []
        for _ in range(10):
            rand = np.random.random()
            if rand < win_prob:
                form.append('W')
            elif rand < win_prob + draw_prob:
                form.append('D')
            else:
                form.append('L')

        return form

    def _generate_home_performance(self, team_strength: float) -> Dict:
        """Hazai teljesítmény generálása"""
        base_win_rate = 0.5 + team_strength * 0.25

        return {
            'matches_played': 19,
            'wins': int(19 * base_win_rate),
            'draws': int(19 * 0.25),
            'losses': int(19 * (1 - base_win_rate - 0.25)),
            'win_rate': base_win_rate,
            'goals_per_game': 1.6 + team_strength * 0.7,
            'goals_conceded_per_game': 1.0 - team_strength * 0.4
        }

    def _generate_away_performance(self, team_strength: float) -> Dict:
        """Vendég teljesítmény generálása"""
        base_win_rate = 0.35 + team_strength * 0.2

        return {
            'matches_played': 19,
            'wins': int(19 * base_win_rate),
            'draws': int(19 * 0.3),
            'losses': int(19 * (1 - base_win_rate - 0.3)),
            'win_rate': base_win_rate,
            'goals_per_game': 1.3 + team_strength * 0.6,
            'goals_conceded_per_game': 1.2 - team_strength * 0.3
        }

    def _parse_team_stats(self, stats_data: Dict) -> TeamStats:
        """Statisztikai adatok elemzése TeamStats objektummá"""
        if not stats_data:
            # Alapértelmezett értékek
            return TeamStats(
                team_name="Unknown",
                goals_scored_avg=1.2,
                goals_conceded_avg=1.2,
                corners_per_game=5.0,
                corners_conceded_per_game=5.0,
                cards_per_game=2.1,
                cards_opponent_avg=2.1,
                recent_form=['W', 'D', 'L'] * 3 + ['W'],
                home_performance={'win_rate': 0.45},
                away_performance={'win_rate': 0.3},
                league_position=10,
                points_per_game=1.2
            )

        return TeamStats(
            team_name=stats_data.get('team_name', 'Unknown'),
            goals_scored_avg=stats_data.get('goals_scored_avg', 1.2),
            goals_conceded_avg=stats_data.get('goals_conceded_avg', 1.2),
            corners_per_game=stats_data.get('corners_per_game', 5.0),
            corners_conceded_per_game=stats_data.get('corners_conceded_per_game', 5.0),
            cards_per_game=stats_data.get('cards_per_game', 2.1),
            cards_opponent_avg=stats_data.get('cards_opponent_avg', 2.1),
            recent_form=stats_data.get('recent_form', ['W', 'D', 'L'] * 3 + ['W']),
            home_performance=stats_data.get('home_performance', {'win_rate': 0.45}),
            away_performance=stats_data.get('away_performance', {'win_rate': 0.3}),
            league_position=stats_data.get('league_position', 10),
            points_per_game=stats_data.get('points_per_game', 1.2)
        )

    async def create_detailed_prediction(self, match_data: Dict) -> DetailedPrediction:
        """Részletes predikció készítése egy meccshez"""
        home_team = match_data['home_team']
        away_team = match_data['away_team']
        competition = match_data['competition']

        print(f"\n🔮 Részletes predikció: {home_team} vs {away_team}")

        # Csapat statisztikák lekérdezése
        home_stats = await self.get_team_stats(home_team, competition)
        away_stats = await self.get_team_stats(away_team, competition)

        # Liga specifikus adatok
        league_data = self.league_stats.get(competition, self.league_stats['Premier League'])

        # 1. Meccs eredmény predikció
        match_result = self._predict_match_result(home_stats, away_stats, league_data)

        # 2. Gólok predikció
        expected_goals = self._predict_goals(home_stats, away_stats, league_data)

        # 3. Total Goals (Over/Under 2.5)
        total_goals_pred = self._predict_total_goals(expected_goals, league_data)

        # 4. Both Teams to Score
        btts_pred = self._predict_btts(home_stats, away_stats)

        # 5. Szögletek predikció
        corners_pred = self._predict_corners(home_stats, away_stats, league_data)

        # 6. Lapok predikció
        cards_pred = self._predict_cards(home_stats, away_stats, league_data)

        # 7. Bizalom és értékelés
        confidence = self._calculate_confidence(home_stats, away_stats)

        # 8. Value bets keresése
        value_bets = self._find_value_bets(match_data.get('odds', {}), {
            'match_result': match_result,
            'total_goals': total_goals_pred,
            'btts': btts_pred,
            'corners': corners_pred,
            'cards': cards_pred
        })

        return DetailedPrediction(
            match_id=match_data['match_id'],
            home_team=home_team,
            away_team=away_team,
            match_result=match_result,
            expected_goals=expected_goals,
            total_goals_prediction=total_goals_pred,
            btts_prediction=btts_pred,
            corners_prediction=corners_pred,
            cards_prediction=cards_pred,
            confidence_level=confidence,
            value_bets=value_bets,
            bookmaker_odds=match_data.get('odds', {}),
            predicted_vs_odds=self._compare_with_odds(match_data.get('odds', {}), match_result)
        )

    def _predict_match_result(self, home_stats: TeamStats, away_stats: TeamStats, league_data: Dict) -> Dict[str, float]:
        """Meccs eredmény predikció"""
        # Alap erősségek
        home_attack = home_stats.goals_scored_avg * league_data['home_advantage']
        home_defense = 2.0 - home_stats.goals_conceded_avg
        away_attack = away_stats.goals_scored_avg * 0.9  # vendég hátrány
        away_defense = 2.0 - away_stats.goals_conceded_avg

        # Forma módosítók
        home_form = self._calculate_form_strength(home_stats.recent_form)
        away_form = self._calculate_form_strength(away_stats.recent_form)

        # Hazai/vendég teljesítmény
        home_advantage = home_stats.home_performance.get('win_rate', 0.45)
        away_performance = away_stats.away_performance.get('win_rate', 0.3)

        # Összesített erősségek
        home_strength = (home_attack + home_defense) * (1 + home_form * 0.2) * (1 + home_advantage * 0.3)
        away_strength = (away_attack + away_defense) * (1 + away_form * 0.2) * (1 + away_performance * 0.3)

        # Valószínűségek számítása
        total_strength = home_strength + away_strength
        draw_factor = 0.25  # alap döntetlen valószínűség

        prob_home = (home_strength / total_strength) * (1 - draw_factor)
        prob_away = (away_strength / total_strength) * (1 - draw_factor)
        prob_draw = draw_factor

        # Normalizálás
        total = prob_home + prob_draw + prob_away

        return {
            'home_win': prob_home / total,
            'draw': prob_draw / total,
            'away_win': prob_away / total
        }

    def _predict_goals(self, home_stats: TeamStats, away_stats: TeamStats, league_data: Dict) -> Dict[str, float]:
        """Gólok predikció"""
        # Hazai csapat várható góljai
        home_goals = (
            home_stats.goals_scored_avg * league_data['home_advantage'] +
            (2.0 - away_stats.goals_conceded_avg) * 0.5
        ) / 1.5

        # Vendég csapat várható góljai
        away_goals = (
            away_stats.goals_scored_avg * 0.9 +
            (2.0 - home_stats.goals_conceded_avg) * 0.5
        ) / 1.5

        return {
            'home': max(0.1, home_goals),
            'away': max(0.1, away_goals)
        }

    def _predict_total_goals(self, expected_goals: Dict, league_data: Dict) -> Dict[str, float]:
        """Total goals (Over/Under 2.5) predikció"""
        total_expected = expected_goals['home'] + expected_goals['away']
        league_avg = league_data['avg_goals_per_game']

        # Poisson eloszlás alapján
        # Over 2.5 valószínűség
        prob_over_25 = 1 - (
            np.exp(-total_expected) * (
                1 + total_expected +
                (total_expected**2)/2 +
                (total_expected**3)/6
            )
        )

        return {
            'over_25': max(0.1, min(0.9, prob_over_25)),
            'under_25': max(0.1, min(0.9, 1 - prob_over_25))
        }

    def _predict_btts(self, home_stats: TeamStats, away_stats: TeamStats) -> Dict[str, float]:
        """Both Teams to Score predikció"""
        # Hazai csapat gólszerzési valószínűsége
        home_scores_prob = 1 - np.exp(-home_stats.goals_scored_avg * 1.1)

        # Vendég csapat gólszerzési valószínűsége
        away_scores_prob = 1 - np.exp(-away_stats.goals_scored_avg * 0.9)

        # Mindkét csapat góloz valószínűsége
        btts_yes = home_scores_prob * away_scores_prob

        return {
            'yes': max(0.1, min(0.9, btts_yes)),
            'no': max(0.1, min(0.9, 1 - btts_yes))
        }

    def _predict_corners(self, home_stats: TeamStats, away_stats: TeamStats, league_data: Dict) -> Dict[str, float]:
        """Szögletek predikció"""
        # Várható szögletek száma
        expected_corners = (
            home_stats.corners_per_game * 1.1 +  # hazai előny
            away_stats.corners_per_game * 0.9 +
            home_stats.corners_conceded_per_game * 0.7 +
            away_stats.corners_conceded_per_game * 0.7
        ) / 2.5

        # Over 9.5 szögletek valószínűsége (Poisson)
        import math
        prob_over_9 = 1 - sum([
            (np.exp(-expected_corners) * (expected_corners**k)) / math.factorial(k)
            for k in range(10)
        ])

        return {
            'expected_total': expected_corners,
            'over_9': max(0.1, min(0.9, prob_over_9)),
            'under_9': max(0.1, min(0.9, 1 - prob_over_9))
        }

    def _predict_cards(self, home_stats: TeamStats, away_stats: TeamStats, league_data: Dict) -> Dict[str, float]:
        """Sárga lapok predikció"""
        # Várható lapok száma
        expected_cards = (
            home_stats.cards_per_game +
            away_stats.cards_per_game +
            home_stats.cards_opponent_avg * 0.3 +
            away_stats.cards_opponent_avg * 0.3
        ) / 1.8

        # Over 3.5 lapok valószínűsége
        import math
        prob_over_3 = 1 - sum([
            (np.exp(-expected_cards) * (expected_cards**k)) / math.factorial(k)
            for k in range(4)
        ])

        return {
            'expected_total': expected_cards,
            'over_3': max(0.1, min(0.9, prob_over_3)),
            'under_3': max(0.1, min(0.9, 1 - prob_over_3))
        }

    def _calculate_form_strength(self, recent_form: List[str]) -> float:
        """Forma erősség számítása (-0.3 to +0.3)"""
        if not recent_form:
            return 0.0

        points = {'W': 3, 'D': 1, 'L': 0}
        total_points = sum(points.get(result, 0) for result in recent_form[-5:])  # utolsó 5 meccs
        max_points = len(recent_form[-5:]) * 3

        if max_points == 0:
            return 0.0

        form_ratio = total_points / max_points
        return (form_ratio - 0.5) * 0.6  # -0.3 to +0.3

    def _calculate_confidence(self, home_stats: TeamStats, away_stats: TeamStats) -> float:
        """Predikció bizalom számítása"""
        # Adatok minősége (pozíció alapján)
        position_quality = (40 - abs(home_stats.league_position - 10) - abs(away_stats.league_position - 10)) / 40

        # Forma konzisztencia
        home_form_consistency = len([r for r in home_stats.recent_form if r == home_stats.recent_form[0]]) / len(home_stats.recent_form)
        away_form_consistency = len([r for r in away_stats.recent_form if r == away_stats.recent_form[0]]) / len(away_stats.recent_form)
        form_factor = (home_form_consistency + away_form_consistency) / 2

        # Átlagos bizalom
        confidence = (position_quality * 0.6 + form_factor * 0.4) * 100

        return max(30, min(95, confidence))

    def _find_value_bets(self, bookmaker_odds: Dict, predictions: Dict) -> List[Dict]:
        """Value betting lehetőségek keresése"""
        value_bets = []

        if not bookmaker_odds:
            return value_bets

        # Meccs eredmény value check
        match_odds = bookmaker_odds.get('match_result', {})
        match_pred = predictions.get('match_result', {})

        for outcome in ['home_win', 'draw', 'away_win']:
            if outcome in match_odds and outcome in match_pred:
                odds_value = match_odds[outcome]
                predicted_prob = match_pred[outcome]

                if odds_value and predicted_prob > 0:
                    implied_prob = 1 / odds_value
                    if predicted_prob > implied_prob * 1.05:  # 5% margin
                        value = (odds_value * predicted_prob - 1) * 100
                        value_bets.append({
                            'market': 'Match Result',
                            'outcome': outcome.replace('_', ' ').title(),
                            'odds': odds_value,
                            'predicted_prob': predicted_prob,
                            'implied_prob': implied_prob,
                            'value_percentage': value
                        })

        # Total Goals value check
        total_odds = bookmaker_odds.get('total_goals', {})
        total_pred = predictions.get('total_goals', {})

        for outcome in ['over_25', 'under_25']:
            if outcome in total_odds and outcome in total_pred:
                odds_value = total_odds[outcome]
                predicted_prob = total_pred[outcome]

                if odds_value and predicted_prob > 0:
                    implied_prob = 1 / odds_value
                    if predicted_prob > implied_prob * 1.05:
                        value = (odds_value * predicted_prob - 1) * 100
                        value_bets.append({
                            'market': 'Total Goals',
                            'outcome': outcome.replace('_', ' ').title().replace('25', '2.5'),
                            'odds': odds_value,
                            'predicted_prob': predicted_prob,
                            'implied_prob': implied_prob,
                            'value_percentage': value
                        })

        return value_bets

    def _compare_with_odds(self, bookmaker_odds: Dict, match_prediction: Dict) -> Dict:
        """Predikció vs bookmaker odds összehasonlítása"""
        comparison = {}

        match_odds = bookmaker_odds.get('match_result', {})

        for outcome in ['home_win', 'draw', 'away_win']:
            if outcome in match_odds and outcome in match_prediction:
                odds_value = match_odds[outcome]
                predicted_prob = match_prediction[outcome]

                if odds_value:
                    implied_prob = 1 / odds_value
                    difference = predicted_prob - implied_prob

                    comparison[outcome] = {
                        'predicted': predicted_prob,
                        'implied': implied_prob,
                        'difference': difference,
                        'prediction_higher': difference > 0
                    }

        return comparison

def main():
    """Demo futtatás"""
    engine = EnhancedPredictionEngine()

    print("🎯 TOVÁBBFEJLESZTETT PREDIKCIÓS MOTOR")
    print("=" * 50)

    # Napi meccsek betöltése
    matches = engine.load_daily_matches()

    if not matches:
        print("❌ Nincs elérhető meccs adat")
        print("💡 Futtasd előbb: python src/tools/hungarian_pdf_processor.py")
        return

    print(f"📋 {len(matches)} meccs található")

    # Aszinkron predikciók készítése
    import asyncio

    async def run_predictions():
        predictions = []

        for match in matches[:3]:  # Első 3 meccs demo
            prediction = await engine.create_detailed_prediction(match)
            predictions.append(prediction)

            # Eredmény kiírása
            print(f"\n" + "="*60)
            print(f"🏟️ {prediction.home_team} vs {prediction.away_team}")
            print(f"🎯 Bizalom: {prediction.confidence_level:.1f}%")

            # Meccs eredmény
            print(f"\n📊 MECCS EREDMÉNY:")
            result = prediction.match_result
            print(f"   🏠 Hazai győzelem: {result['home_win']:.1%}")
            print(f"   🤝 Döntetlen: {result['draw']:.1%}")
            print(f"   ✈️ Vendég győzelem: {result['away_win']:.1%}")

            # Gólok
            goals = prediction.expected_goals
            print(f"\n⚽ VÁRHATÓ GÓLOK:")
            print(f"   {prediction.home_team}: {goals['home']:.1f}")
            print(f"   {prediction.away_team}: {goals['away']:.1f}")
            print(f"   Összesen: {goals['home'] + goals['away']:.1f}")

            # Total Goals
            total = prediction.total_goals_prediction
            print(f"\n🎯 TOTAL GOALS (2.5):")
            print(f"   Over 2.5: {total['over_25']:.1%}")
            print(f"   Under 2.5: {total['under_25']:.1%}")

            # BTTS
            btts = prediction.btts_prediction
            print(f"\n🥅 BOTH TEAMS TO SCORE:")
            print(f"   Igen: {btts['yes']:.1%}")
            print(f"   Nem: {btts['no']:.1%}")

            # Szögletek
            corners = prediction.corners_prediction
            print(f"\n📐 SZÖGLETEK:")
            print(f"   Várható összesen: {corners['expected_total']:.1f}")
            print(f"   Over 9: {corners['over_9']:.1%}")
            print(f"   Under 9: {corners['under_9']:.1%}")

            # Lapok
            cards = prediction.cards_prediction
            print(f"\n🟨 SÁRGA LAPOK:")
            print(f"   Várható összesen: {cards['expected_total']:.1f}")
            print(f"   Over 3: {cards['over_3']:.1%}")
            print(f"   Under 3: {cards['under_3']:.1%}")

            # Value bets
            if prediction.value_bets:
                print(f"\n💎 VALUE BETTING LEHETŐSÉGEK:")
                for vb in prediction.value_bets:
                    print(f"   📈 {vb['market']} - {vb['outcome']}")
                    print(f"      Odds: {vb['odds']:.2f} | Predikció: {vb['predicted_prob']:.1%}")
                    print(f"      Várható nyereség: +{vb['value_percentage']:.1f}%")
            else:
                print(f"\n💡 Nincs value betting lehetőség észlelve")

        return predictions

    # Futtatás
    predictions = asyncio.run(run_predictions())

    print(f"\n🎯 ÖSSZEFOGLALÁS")
    print("=" * 30)
    print(f"Elemzett meccsek: {len(predictions)}")

    high_confidence = [p for p in predictions if p.confidence_level > 70]
    print(f"Magas bizalmi szint (>70%): {len(high_confidence)}")

    total_value_bets = sum(len(p.value_bets) for p in predictions)
    print(f"Value betting lehetőségek: {total_value_bets}")

if __name__ == "__main__":
    main()
