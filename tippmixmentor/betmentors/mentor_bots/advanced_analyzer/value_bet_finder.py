"""
Értékes fogadások azonosítása - az old/analysis_agent.py alapján
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValueBet:
    """Értékes fogadás adatstruktúra"""
    match_id: str
    home_team: str
    away_team: str
    bet_type: str
    odds: float
    predicted_probability: float
    value: float
    confidence: float
    expected_return: float

@dataclass
class MatchPrediction:
    """Meccs predikció - kompatibilis az old analysis_agent-tel"""
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    over_2_5_probability: float
    both_teams_score_probability: float
    expected_goals_home: float
    expected_goals_away: float
    confidence_score: float

class ValueBetFinder:
    """Értékes fogadások keresője"""
    
    def __init__(self, min_value_threshold: float = 0.05, min_confidence: float = 0.6):
        self.min_value_threshold = min_value_threshold  # 5% minimum érték
        self.min_confidence = min_confidence
        
        # Elemzési súlyok (az old analysis_agent-ből)
        self.analysis_weights = {
            'form': 0.25,
            'head_to_head': 0.20,
            'home_advantage': 0.15,
            'goals_trend': 0.15,
            'market_sentiment': 0.10,
            'odds_movement': 0.10,
            'league_strength': 0.05
        }
        
    def find_value_bets(self, matches_df: pd.DataFrame) -> List[ValueBet]:
        """Értékes fogadások keresése"""
        
        logger.info(f"Értékes fogadások keresése: {len(matches_df)} meccs")
        
        value_bets = []
        
        for _, match in matches_df.iterrows():
            try:
                # Predikció generálása
                prediction = self._generate_match_prediction(match)
                
                if prediction and prediction.confidence_score >= self.min_confidence:
                    # Értékes fogadások azonosítása
                    match_value_bets = self._identify_match_value_bets(match, prediction)
                    value_bets.extend(match_value_bets)
                    
            except Exception as e:
                logger.error(f"Hiba a meccs elemzése során: {e}")
                
        # Rendezés érték szerint
        value_bets.sort(key=lambda x: x.value, reverse=True)
        
        logger.info(f"Találat: {len(value_bets)} értékes fogadás")
        return value_bets
        
    def _generate_match_prediction(self, match: pd.Series) -> Optional[MatchPrediction]:
        """Meccs predikció generálása (az old analysis_agent logikája alapján)"""
        
        try:
            # Forma elemzés
            home_form_rating = self._calculate_form_rating(match, 'home')
            away_form_rating = self._calculate_form_rating(match, 'away')
            
            # Súlyozott pontszámok
            home_score = 0.0
            away_score = 0.0
            
            # Forma alapú pontszám
            home_score += home_form_rating * self.analysis_weights['form']
            away_score += away_form_rating * self.analysis_weights['form']
            
            # Hazai pálya előny
            home_score += 0.1 * self.analysis_weights['home_advantage']
            
            # Liga erősség (ha van adat)
            league_strength = self._get_league_strength(match.get('league', ''))
            home_score += league_strength * self.analysis_weights['league_strength']
            away_score += league_strength * self.analysis_weights['league_strength']
            
            # Normalizálás
            total_score = home_score + away_score
            if total_score > 0:
                home_prob = home_score / total_score
                away_prob = away_score / total_score
            else:
                home_prob = away_prob = 0.4
                
            # Döntetlen valószínűség
            draw_prob = 1 - home_prob - away_prob
            if draw_prob < 0.1:
                draw_prob = 0.25
                home_prob = away_prob = (1 - draw_prob) / 2
                
            # Gól predikciók
            expected_goals_home = self._predict_goals(match, 'home')
            expected_goals_away = self._predict_goals(match, 'away')
            
            total_goals = expected_goals_home + expected_goals_away
            over_2_5_prob = min(0.9, max(0.1, (total_goals - 2.5) / 2))
            
            # Both teams score
            btts_prob = min(0.8, max(0.2, (expected_goals_home * expected_goals_away) / 2))
            
            # Confidence score
            confidence = self._calculate_prediction_confidence(match, home_form_rating, away_form_rating)
            
            return MatchPrediction(
                home_win_probability=home_prob,
                draw_probability=draw_prob,
                away_win_probability=away_prob,
                over_2_5_probability=over_2_5_prob,
                both_teams_score_probability=btts_prob,
                expected_goals_home=expected_goals_home,
                expected_goals_away=expected_goals_away,
                confidence_score=confidence
            )
            
        except Exception as e:
            logger.error(f"Hiba a predikció generálás során: {e}")
            return None
            
    def _identify_match_value_bets(self, match: pd.Series, prediction: MatchPrediction) -> List[ValueBet]:
        """Egy meccs értékes fogadásainak azonosítása"""
        
        value_bets = []
        
        try:
            match_id = match.get('match_id', '')
            home_team = match.get('home_team', '')
            away_team = match.get('away_team', '')
            
            # 1X2 értékes fogadások
            odds_home = match.get('odds_home', 0)
            odds_draw = match.get('odds_draw', 0)
            odds_away = match.get('odds_away', 0)
            
            # Hazai győzelem
            if odds_home > 0:
                value = (prediction.home_win_probability * odds_home) - 1
                if value > self.min_value_threshold:
                    value_bets.append(ValueBet(
                        match_id=match_id,
                        home_team=home_team,
                        away_team=away_team,
                        bet_type='HOME_WIN',
                        odds=odds_home,
                        predicted_probability=prediction.home_win_probability,
                        value=value,
                        confidence=prediction.confidence_score,
                        expected_return=prediction.home_win_probability * odds_home
                    ))
                    
            # Döntetlen
            if odds_draw > 0:
                value = (prediction.draw_probability * odds_draw) - 1
                if value > self.min_value_threshold:
                    value_bets.append(ValueBet(
                        match_id=match_id,
                        home_team=home_team,
                        away_team=away_team,
                        bet_type='DRAW',
                        odds=odds_draw,
                        predicted_probability=prediction.draw_probability,
                        value=value,
                        confidence=prediction.confidence_score,
                        expected_return=prediction.draw_probability * odds_draw
                    ))
                    
            # Vendég győzelem
            if odds_away > 0:
                value = (prediction.away_win_probability * odds_away) - 1
                if value > self.min_value_threshold:
                    value_bets.append(ValueBet(
                        match_id=match_id,
                        home_team=home_team,
                        away_team=away_team,
                        bet_type='AWAY_WIN',
                        odds=odds_away,
                        predicted_probability=prediction.away_win_probability,
                        value=value,
                        confidence=prediction.confidence_score,
                        expected_return=prediction.away_win_probability * odds_away
                    ))
                    
            # Over 2.5 (ha van odds adat)
            odds_over_25 = match.get('odds_over_2_5', 0)
            if odds_over_25 > 0:
                value = (prediction.over_2_5_probability * odds_over_25) - 1
                if value > self.min_value_threshold:
                    value_bets.append(ValueBet(
                        match_id=match_id,
                        home_team=home_team,
                        away_team=away_team,
                        bet_type='OVER_2_5',
                        odds=odds_over_25,
                        predicted_probability=prediction.over_2_5_probability,
                        value=value,
                        confidence=prediction.confidence_score,
                        expected_return=prediction.over_2_5_probability * odds_over_25
                    ))
                    
        except Exception as e:
            logger.error(f"Hiba az értékes fogadások azonosítása során: {e}")
            
        return value_bets
        
    def _calculate_form_rating(self, match: pd.Series, team_type: str) -> float:
        """Csapat forma értékelés"""
        
        # Alapértelmezett forma rating
        base_rating = 0.5
        
        # Ha van statisztikai adat, használjuk
        if f'{team_type}_team_form' in match:
            return float(match[f'{team_type}_team_form'])
            
        # Ha van goals per game adat
        if f'{team_type}_goals_per_game' in match:
            goals_per_game = float(match[f'{team_type}_goals_per_game'])
            # Normalizálás 0-1 skálára
            return min(1.0, max(0.0, goals_per_game / 3.0))
            
        return base_rating
        
    def _predict_goals(self, match: pd.Series, team_type: str) -> float:
        """Gól predikció egy csapatra"""
        
        # Alapértelmezett
        default_goals = 1.3 if team_type == 'home' else 1.1
        
        # Ha van statisztikai adat
        if f'{team_type}_goals_per_game' in match:
            return float(match[f'{team_type}_goals_per_game'])
            
        # Liga alapú becslés
        league = match.get('league', '').lower()
        if any(top_league in league for top_league in ['premier', 'bundesliga', 'laliga', 'serie']):
            return default_goals * 1.2
            
        return default_goals
        
    def _get_league_strength(self, league: str) -> float:
        """Liga erősség értékelés"""
        
        league_lower = league.lower()
        
        # Top 5 liga
        top_leagues = ['premier league', 'bundesliga', 'la liga', 'serie a', 'ligue 1']
        if any(top in league_lower for top in top_leagues):
            return 0.9
            
        # Második szintű ligák
        second_tier = ['championship', 'segunda', 'serie b', 'ligue 2', '2. bundesliga']
        if any(second in league_lower for second in second_tier):
            return 0.7
            
        # Egyéb európai ligák
        if any(country in league_lower for country in ['netherlands', 'portugal', 'belgium', 'turkey']):
            return 0.6
            
        return 0.5  # Alapértelmezett
        
    def _calculate_prediction_confidence(self, match: pd.Series, home_form: float, away_form: float) -> float:
        """Predikció megbízhatóság számítása"""
        
        confidence_factors = []
        
        # Forma különbség alapú bizalom
        form_diff = abs(home_form - away_form)
        confidence_factors.append(min(1.0, form_diff * 2))
        
        # Odds alapú bizalom (ha vannak odds adatok)
        if all(col in match for col in ['odds_home', 'odds_draw', 'odds_away']):
            odds_home = match['odds_home']
            odds_draw = match['odds_draw'] 
            odds_away = match['odds_away']
            
            if all(odds > 0 for odds in [odds_home, odds_draw, odds_away]):
                # Bookmaker margin számítása
                implied_probs = [1/odds_home, 1/odds_draw, 1/odds_away]
                margin = sum(implied_probs) - 1
                
                # Alacsonyabb margin = magasabb bizalom
                confidence_factors.append(max(0.1, 1 - (margin * 5)))
                
        # Liga minőség alapú bizalom
        league_strength = self._get_league_strength(match.get('league', ''))
        confidence_factors.append(league_strength)
        
        if confidence_factors:
            return np.mean(confidence_factors)
            
        return 0.5
        
    def create_value_bets_report(self, value_bets: List[ValueBet]) -> str:
        """Értékes fogadások jelentés"""
        
        if not value_bets:
            return "Nem találhatók értékes fogadások"
            
        report = []
        report.append("💰 ÉRTÉKES FOGADÁSOK JELENTÉS")
        report.append("=" * 50)
        report.append("")
        
        # Top 10 legjobb érték
        top_bets = value_bets[:10]
        
        report.append("🏆 TOP 10 ÉRTÉKES FOGADÁS:")
        for i, bet in enumerate(top_bets, 1):
            report.append(f"{i}. {bet.home_team} vs {bet.away_team}")
            report.append(f"   Fogadás: {bet.bet_type}")
            report.append(f"   Odds: {bet.odds:.2f}")
            report.append(f"   Predikált valószínűség: {bet.predicted_probability:.1%}")
            report.append(f"   Érték: {bet.value:.1%}")
            report.append(f"   Bizalom: {bet.confidence:.1%}")
            report.append(f"   Várható hozam: {bet.expected_return:.2f}")
            report.append("")
            
        # Összefoglaló statisztikák
        report.append("📊 ÖSSZEFOGLALÓ:")
        report.append(f"Összes értékes fogadás: {len(value_bets)}")
        
        # Fogadás típusok eloszlása
        bet_types = {}
        for bet in value_bets:
            bet_types[bet.bet_type] = bet_types.get(bet.bet_type, 0) + 1
            
        report.append("Típusok eloszlása:")
        for bet_type, count in bet_types.items():
            report.append(f"  {bet_type}: {count}")
            
        # Átlagos érték
        avg_value = np.mean([bet.value for bet in value_bets])
        report.append(f"Átlagos érték: {avg_value:.1%}")
        
        # Átlagos bizalom
        avg_confidence = np.mean([bet.confidence for bet in value_bets])
        report.append(f"Átlagos bizalom: {avg_confidence:.1%}")
        
        return "\n".join(report)


if __name__ == "__main__":
    # Teszt
    logging.basicConfig(level=logging.INFO)
    
    # Demo adatok
    demo_matches = pd.DataFrame([
        {
            'match_id': 'test1',
            'home_team': 'Arsenal',
            'away_team': 'Chelsea',
            'league': 'Premier League',
            'odds_home': 2.1,
            'odds_draw': 3.4,
            'odds_away': 3.2,
            'home_goals_per_game': 2.1,
            'away_goals_per_game': 1.8
        },
        {
            'match_id': 'test2', 
            'home_team': 'Barcelona',
            'away_team': 'Real Madrid',
            'league': 'La Liga',
            'odds_home': 2.8,
            'odds_draw': 3.1,
            'odds_away': 2.6,
            'home_goals_per_game': 2.3,
            'away_goals_per_game': 2.0
        }
    ])
    
    finder = ValueBetFinder()
    value_bets = finder.find_value_bets(demo_matches)
    
    report = finder.create_value_bets_report(value_bets)
    print(report)