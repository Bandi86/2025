""
Elemző Ügynök (Analysis Agent)
Fejlett sport elemzési és predikciós algoritmusok
"""

import math
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from ..utils.logger import Logger
from ..data.data_storage import DataStorage, MatchData

logger = Logger().get_logger()

@dataclass
class TeamForm:
    """Csapat forma elemzés"""
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    points: int
    form_rating: float
    recent_form: List[str]  # W, D, L

@dataclass
class MatchPrediction:
    """Mérkőzés predikció"""
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    over_2_5_probability: float
    both_teams_score_probability: float
    expected_goals_home: float
    expected_goals_away: float
    confidence_score: float

class AnalysisAgent:
    """
    Fejlett sport elemző ügynök
    Statisztikai elemzések, predikciók, érték fogadások azonosítása
    """

    def __init__(self, data_storage: DataStorage):
        self.data_storage = data_storage
        self.logger = Logger().get_logger()

        # Elemzési súlyok és paraméterek
        self.analysis_weights = {
            'form': 0.25,
            'head_to_head': 0.20,
            'home_advantage': 0.15,
            'goals_trend': 0.15,
            'market_sentiment': 0.10,
            'news_sentiment': 0.10,
            'odds_movement': 0.05
        }

        logger.info("AnalysisAgent inicializálva")

    def analyze_matches(self, matches: List[Dict]) -> Dict[str, Any]:
        """
        Mérkőzések batch elemzése
        """
        logger.info(f"Elemzés kezdése: {len(matches)} mérkőzés")

        results = {
            'total_matches': len(matches),
            'analyzed_matches': 0,
            'detailed_analysis': [],
            'key_insights': [],
            'market_opportunities': [],
            'risk_warnings': [],
            'summary_stats': {}
        }

        predictions = []

        for match_data in matches:
            try:
                # Egyedi mérkőzés elemzése
                match_analysis = self._analyze_single_match(match_data)

                if match_analysis:
                    results['detailed_analysis'].append(match_analysis)
                    results['analyzed_matches'] += 1

                    # Predikció tárolása
                    if 'prediction' in match_analysis:
                        predictions.append(match_analysis['prediction'])

                    # Elemzés tárolása az adatbázisban
                    match_id = self._generate_match_id(match_data)
                    self.data_storage.store_analysis(match_id, match_analysis)

            except Exception as e:
                logger.error(f"Hiba a mérkőzés elemzése során: {e}")

        # Aggregált elemzések
        results['key_insights'] = self._generate_key_insights(results['detailed_analysis'])
        results['market_opportunities'] = self._identify_market_opportunities(results['detailed_analysis'])
        results['risk_warnings'] = self._identify_risk_warnings(results['detailed_analysis'])
        results['summary_stats'] = self._generate_summary_stats(predictions)

        logger.info(f"Elemzés befejezve: {results['analyzed_matches']} mérkőzés elemezve")
        return results

    def _analyze_single_match(self, match_data: Dict) -> Dict[str, Any]:
        """
        Egyedi mérkőzés részletes elemzése
        """
        try:
            home_team = match_data.get('home_team', '')
            away_team = match_data.get('away_team', '')

            logger.debug(f"Elemzés: {home_team} vs {away_team}")

            # Alapvető elemzések
            form_analysis = self._analyze_team_forms(match_data)
            h2h_analysis = self._analyze_head_to_head(match_data)
            goals_analysis = self._analyze_goals_trends(match_data)
            market_analysis = self._analyze_market_data(match_data)

            # Predikció generálása
            prediction = self._generate_prediction(
                form_analysis, h2h_analysis, goals_analysis, market_analysis
            )

            # Érték fogadások azonosítása
            value_bets = []
            risk_assessment = {}

            if prediction:
                value_bets = self._identify_value_bets(match_data, prediction)
                risk_assessment = self._assess_match_risk(match_data, prediction)

            # Kulcs tényezők azonosítása
            key_factors = self._identify_key_factors(
                form_analysis, h2h_analysis, goals_analysis, market_analysis
            )

            return {
                'match_id': self._generate_match_id(match_data),
                'home_team': home_team,
                'away_team': away_team,
                'date': match_data.get('date', ''),
                'league': match_data.get('league', ''),
                'form_analysis': form_analysis,
                'head_to_head_analysis': h2h_analysis,
                'goals_analysis': goals_analysis,
                'market_analysis': market_analysis,
                'prediction': prediction.__dict__ if prediction else None,
                'value_bets': value_bets,
                'risk_assessment': risk_assessment,
                'key_factors': key_factors,
                'prediction_confidence': prediction.confidence_score if prediction else 0.0,
                'match_insights': self._generate_match_insights(match_data, prediction) if prediction else {},
                'created_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Hiba az egyedi mérkőzés elemzése során: {e}")
            return {}

    def _analyze_team_forms(self, match_data: Dict) -> Dict[str, Any]:
        """
        Csapat formák elemzése
        """
        try:
            home_form = match_data.get('home_form', [])
            away_form = match_data.get('away_form', [])

            # Forma számítás
            def calculate_form_rating(form_results: List[str]) -> float:
                if not form_results:
                    return 0.5  # Neutral ha nincs adat

                points = 0
                for result in form_results:
                    if result.upper() == 'W':
                        points += 3
                    elif result.upper() == 'D':
                        points += 1

                max_points = len(form_results) * 3
                return points / max_points if max_points > 0 else 0.5

            home_rating = calculate_form_rating(home_form)
            away_rating = calculate_form_rating(away_form)

            return {
                'home_form_rating': home_rating,
                'away_form_rating': away_rating,
                'form_difference': home_rating - away_rating,
                'home_recent_form': home_form[:5],  # Utolsó 5 meccs
                'away_recent_form': away_form[:5],
                'form_trend': self._calculate_form_trend(home_form, away_form)
            }

        except Exception as e:
            logger.error(f"Hiba a forma elemzés során: {e}")
            return {}

    def _analyze_head_to_head(self, match_data: Dict) -> Dict[str, Any]:
        """
        Közvetlen mérkőzések elemzése
        """
        try:
            h2h_data = match_data.get('head_to_head', [])

            if not h2h_data:
                return {
                    'total_matches': 0,
                    'home_wins': 0,
                    'draws': 0,
                    'away_wins': 0,
                    'home_advantage': 0.0,
                    'goals_per_match': 0.0
                }

            home_wins = 0
            draws = 0
            away_wins = 0
            total_goals = 0

            for match in h2h_data:
                home_score = match.get('home_score', 0)
                away_score = match.get('away_score', 0)

                if home_score > away_score:
                    home_wins += 1
                elif home_score < away_score:
                    away_wins += 1
                else:
                    draws += 1

                total_goals += home_score + away_score

            total_matches = len(h2h_data)

            return {
                'total_matches': total_matches,
                'home_wins': home_wins,
                'draws': draws,
                'away_wins': away_wins,
                'home_advantage': home_wins / total_matches if total_matches > 0 else 0.0,
                'goals_per_match': total_goals / total_matches if total_matches > 0 else 0.0,
                'recent_trend': self._calculate_h2h_trend(h2h_data)
            }

        except Exception as e:
            logger.error(f"Hiba a H2H elemzés során: {e}")
            return {}

    def _analyze_goals_trends(self, match_data: Dict) -> Dict[str, Any]:
        """
        Gól trendek elemzése
        """
        try:
            # Alapértelmezett értékek, ha nincs adat
            return {
                'home_goals_per_match': 1.5,
                'away_goals_per_match': 1.2,
                'home_goals_conceded': 1.0,
                'away_goals_conceded': 1.3,
                'over_2_5_frequency': 0.55,
                'both_teams_score_frequency': 0.50,
                'goals_trend_direction': 'stable'
            }

        except Exception as e:
            logger.error(f"Hiba a gól trendek elemzése során: {e}")
            return {}

    def _analyze_market_data(self, match_data: Dict) -> Dict[str, Any]:
        """
        Piac és odds elemzés
        """
        try:
            odds_1x2 = match_data.get('odds_1x2', {})
            market_trends = match_data.get('market_trends', {})
            news_sentiment = match_data.get('news_sentiment', 0.0)

            return {
                'odds_analysis': self._analyze_odds(odds_1x2),
                'market_sentiment': market_trends.get('sentiment', 0.0),
                'betting_volume': market_trends.get('volume', 0.0),
                'news_sentiment': news_sentiment,
                'market_confidence': self._calculate_market_confidence(odds_1x2),
                'odds_movement': market_trends.get('movement', 'stable')
            }

        except Exception as e:
            logger.error(f"Hiba a piac elemzés során: {e}")
            return {}

    def _generate_prediction(self,
                           form_analysis: Dict,
                           h2h_analysis: Dict,
                           goals_analysis: Dict,
                           market_analysis: Dict) -> Optional[MatchPrediction]:
        """
        Predikció generálása az elemzések alapján
        """
        try:
            # Súlyozott pontszámok
            home_score = 0.0
            away_score = 0.0

            # Forma alapú pontszám
            if form_analysis:
                home_score += form_analysis.get('home_form_rating', 0.5) * self.analysis_weights['form']
                away_score += form_analysis.get('away_form_rating', 0.5) * self.analysis_weights['form']

            # H2H alapú pontszám
            if h2h_analysis and h2h_analysis.get('total_matches', 0) > 0:
                home_advantage = h2h_analysis.get('home_advantage', 0.5)
                home_score += home_advantage * self.analysis_weights['head_to_head']
                away_score += (1 - home_advantage) * self.analysis_weights['head_to_head']

            # Hazai pálya előny
            home_score += 0.1 * self.analysis_weights['home_advantage']

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
            expected_goals_home = goals_analysis.get('home_goals_per_match', 1.5)
            expected_goals_away = goals_analysis.get('away_goals_per_match', 1.2)

            total_goals = expected_goals_home + expected_goals_away
            over_2_5_prob = min(0.9, max(0.1, (total_goals - 2.5) / 2))

            # Both teams score
            btts_prob = goals_analysis.get('both_teams_score_frequency', 0.5)

            # Confidence score
            confidence = self._calculate_prediction_confidence(
                form_analysis, h2h_analysis, market_analysis
            )

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

    def _identify_value_bets(self, match_data: Dict, prediction: MatchPrediction) -> List[Dict]:
        """
        Érték fogadások azonosítása
        """
        if not prediction:
            return []

        value_bets = []
        odds_1x2 = match_data.get('odds_1x2', {})

        try:
            # 1X2 érték fogadások
            if odds_1x2:
                home_odds = odds_1x2.get('home', 0)
                draw_odds = odds_1x2.get('draw', 0)
                away_odds = odds_1x2.get('away', 0)

                # Érték számítás
                if home_odds > 0:
                    home_value = (prediction.home_win_probability * home_odds) - 1
                    if home_value > 0.05:  # 5% minimum érték
                        value_bets.append({
                            'type': 'home_win',
                            'odds': home_odds,
                            'probability': prediction.home_win_probability,
                            'value': home_value,
                            'confidence': prediction.confidence_score
                        })

                if draw_odds > 0:
                    draw_value = (prediction.draw_probability * draw_odds) - 1
                    if draw_value > 0.05:
                        value_bets.append({
                            'type': 'draw',
                            'odds': draw_odds,
                            'probability': prediction.draw_probability,
                            'value': draw_value,
                            'confidence': prediction.confidence_score
                        })

                if away_odds > 0:
                    away_value = (prediction.away_win_probability * away_odds) - 1
                    if away_value > 0.05:
                        value_bets.append({
                            'type': 'away_win',
                            'odds': away_odds,
                            'probability': prediction.away_win_probability,
                            'value': away_value,
                            'confidence': prediction.confidence_score
                        })

            # Over/Under érték fogadások
            over_under_odds = match_data.get('odds_over_under', {})
            if over_under_odds:
                over_odds = over_under_odds.get('over_2_5', 0)
                if over_odds > 0:
                    over_value = (prediction.over_2_5_probability * over_odds) - 1
                    if over_value > 0.05:
                        value_bets.append({
                            'type': 'over_2_5',
                            'odds': over_odds,
                            'probability': prediction.over_2_5_probability,
                            'value': over_value,
                            'confidence': prediction.confidence_score
                        })

            # Rendezés érték szerint
            value_bets.sort(key=lambda x: x['value'], reverse=True)

        except Exception as e:
            logger.error(f"Hiba az érték fogadások azonosítása során: {e}")

        return value_bets

    def _assess_match_risk(self, match_data: Dict, prediction: MatchPrediction) -> Dict[str, float]:
        """
        Mérkőzés kockázat értékelése
        """
        try:
            risk_factors = {
                'prediction_uncertainty': 1.0 - (prediction.confidence_score if prediction else 0.0),
                'odds_volatility': 0.3,  # Alapértelmezett
                'team_inconsistency': 0.2,
                'injury_risk': 0.1,
                'weather_conditions': 0.0,
                'referee_bias': 0.05
            }

            # Összesített kockázat
            total_risk = sum(risk_factors.values()) / len(risk_factors)
            risk_factors['total_risk'] = total_risk

            return risk_factors

        except Exception as e:
            logger.error(f"Hiba a kockázat értékelés során: {e}")
            return {'total_risk': 0.5}

    def _identify_key_factors(self,
                            form_analysis: Dict,
                            h2h_analysis: Dict,
                            goals_analysis: Dict,
                            market_analysis: Dict) -> List[str]:
        """
        Kulcs tényezők azonosítása
        """
        factors = []

        try:
            # Forma alapú tényezők
            if form_analysis:
                form_diff = form_analysis.get('form_difference', 0)
                if abs(form_diff) > 0.2:
                    team = "hazai" if form_diff > 0 else "vendég"
                    factors.append(f"Jelentős forma előny a {team} csapatnál")

            # H2H tényezők
            if h2h_analysis and h2h_analysis.get('total_matches', 0) >= 3:
                home_advantage = h2h_analysis.get('home_advantage', 0.5)
                if home_advantage > 0.7:
                    factors.append("Erős közvetlen mérkőzés előny a hazai csapatnál")
                elif home_advantage < 0.3:
                    factors.append("Erős közvetlen mérkőzés előny a vendég csapatnál")

            # Gól tényezők
            if goals_analysis:
                goals_per_match = goals_analysis.get('home_goals_per_match', 0) + goals_analysis.get('away_goals_per_match', 0)
                if goals_per_match > 3.0:
                    factors.append("Magas gólátlag várható")
                elif goals_per_match < 2.0:
                    factors.append("Alacsony gólátlag várható")

            # Piac tényezők
            if market_analysis:
                news_sentiment = market_analysis.get('news_sentiment', 0)
                if abs(news_sentiment) > 0.3:
                    sentiment_type = "pozitív" if news_sentiment > 0 else "negatív"
                    factors.append(f"Erős {sentiment_type} hírek hatása")

            return factors

        except Exception as e:
            logger.error(f"Hiba a kulcs tényezők azonosítása során: {e}")
            return []

    def _generate_match_insights(self, match_data: Dict, prediction: MatchPrediction) -> Dict[str, Any]:
        """
        Mérkőzés specifikus insights generálása
        """
        try:
            insights = {
                'recommended_outcome': '',
                'confidence_level': 'low',
                'betting_advice': '',
                'risk_warning': '',
                'key_stats': {}
            }

            if prediction:
                # Legvalószínűbb kimenetel
                probs = {
                    'home': prediction.home_win_probability,
                    'draw': prediction.draw_probability,
                    'away': prediction.away_win_probability
                }

                most_likely = max(probs.keys(), key=lambda k: probs[k])
                insights['recommended_outcome'] = most_likely

                # Confidence level
                if prediction.confidence_score > 0.7:
                    insights['confidence_level'] = 'high'
                elif prediction.confidence_score > 0.5:
                    insights['confidence_level'] = 'medium'

                # Betting advice
                if prediction.confidence_score > 0.6:
                    insights['betting_advice'] = f"Javasolt fogadás: {most_likely}"
                else:
                    insights['betting_advice'] = "Óvatosan, bizonytalan kimenetel"

            return insights

        except Exception as e:
            logger.error(f"Hiba az insights generálás során: {e}")
            return {}

    def _generate_key_insights(self, detailed_analysis: List[Dict]) -> List[str]:
        """
        Általános kulcs insights generálása
        """
        insights = []

        try:
            if not detailed_analysis:
                return insights

            # Magas confidence predikciók
            high_confidence = [a for a in detailed_analysis if a.get('prediction_confidence', 0) > 0.7]
            if high_confidence:
                insights.append(f"{len(high_confidence)} magas bizonyosságú predikció azonosítva")

            # Érték fogadások
            total_value_bets = sum(len(a.get('value_bets', [])) for a in detailed_analysis)
            if total_value_bets > 0:
                insights.append(f"{total_value_bets} potenciális érték fogadás található")

            # Kockázatos mérkőzések
            high_risk = [a for a in detailed_analysis if a.get('risk_assessment', {}).get('total_risk', 0) > 0.6]
            if high_risk:
                insights.append(f"{len(high_risk)} magas kockázatú mérkőzés azonosítva")

        except Exception as e:
            logger.error(f"Hiba a kulcs insights generálás során: {e}")

        return insights

    def _identify_market_opportunities(self, detailed_analysis: List[Dict]) -> List[Dict]:
        """
        Piac lehetőségek azonosítása
        """
        opportunities = []

        try:
            for analysis in detailed_analysis:
                value_bets = analysis.get('value_bets', [])
                for bet in value_bets:
                    if bet.get('value', 0) > 0.1:  # 10% minimum érték
                        opportunities.append({
                            'match': f"{analysis.get('home_team', '')} vs {analysis.get('away_team', '')}",
                            'bet_type': bet.get('type', ''),
                            'odds': bet.get('odds', 0),
                            'value': bet.get('value', 0),
                            'confidence': bet.get('confidence', 0),
                            'league': analysis.get('league', '')
                        })

            # Rendezés érték szerint
            opportunities.sort(key=lambda x: x['value'], reverse=True)

        except Exception as e:
            logger.error(f"Hiba a piac lehetőségek azonosítása során: {e}")

        return opportunities

    def _identify_risk_warnings(self, detailed_analysis: List[Dict]) -> List[str]:
        """
        Kockázati figyelmeztetések azonosítása
        """
        warnings = []

        try:
            for analysis in detailed_analysis:
                risk_assessment = analysis.get('risk_assessment', {})
                total_risk = risk_assessment.get('total_risk', 0)

                if total_risk > 0.7:
                    match_name = f"{analysis.get('home_team', '')} vs {analysis.get('away_team', '')}"
                    warnings.append(f"Magas kockázat: {match_name}")

                # Alacsony confidence
                if analysis.get('prediction_confidence', 0) < 0.3:
                    match_name = f"{analysis.get('home_team', '')} vs {analysis.get('away_team', '')}"
                    warnings.append(f"Bizonytalan predikció: {match_name}")

        except Exception as e:
            logger.error(f"Hiba a kockázati figyelmeztetések azonosítása során: {e}")

        return warnings

    def _generate_summary_stats(self, predictions: List[MatchPrediction]) -> Dict[str, Any]:
        """
        Összefoglaló statisztikák generálása
        """
        try:
            if not predictions:
                return {}

            confidence_scores = [p.confidence_score for p in predictions]
            home_win_probs = [p.home_win_probability for p in predictions]

            return {
                'total_predictions': len(predictions),
                'average_confidence': statistics.mean(confidence_scores),
                'high_confidence_count': len([c for c in confidence_scores if c > 0.7]),
                'average_home_win_prob': statistics.mean(home_win_probs),
                'confident_predictions_ratio': len([c for c in confidence_scores if c > 0.6]) / len(predictions)
            }

        except Exception as e:
            logger.error(f"Hiba az összefoglaló statisztikák generálása során: {e}")
            return {}

    # Segéd függvények
    def _generate_match_id(self, match_data: Dict) -> str:
        """Mérkőzés azonosító generálása"""
        home = match_data.get('home_team', '').replace(' ', '_').lower()
        away = match_data.get('away_team', '').replace(' ', '_').lower()
        date = match_data.get('date', '')
        return f"{home}-{away}-{date}"

    def _calculate_form_trend(self, home_form: List[str], away_form: List[str]) -> str:
        """Forma trend számítás"""
        try:
            if len(home_form) >= 2 and len(away_form) >= 2:
                # Egyszerű trend számítás
                return "improving" if len(home_form) > len(away_form) else "declining"
            return "stable"
        except:
            return "unknown"

    def _calculate_h2h_trend(self, h2h_data: List[Dict]) -> str:
        """H2H trend számítás"""
        try:
            if len(h2h_data) >= 3:
                recent_matches = h2h_data[:3]
                home_wins = sum(1 for m in recent_matches if m.get('home_score', 0) > m.get('away_score', 0))
                return "home_dominant" if home_wins >= 2 else "away_dominant" if home_wins == 0 else "balanced"
            return "insufficient_data"
        except:
            return "unknown"

    def _analyze_odds(self, odds_1x2: Dict) -> Dict[str, float]:
        """Odds elemzés"""
        try:
            if not odds_1x2:
                return {}

            home_odds = odds_1x2.get('home', 0)
            draw_odds = odds_1x2.get('draw', 0)
            away_odds = odds_1x2.get('away', 0)

            # Implicit valószínűségek
            if home_odds > 0 and draw_odds > 0 and away_odds > 0:
                home_prob = 1 / home_odds
                draw_prob = 1 / draw_odds
                away_prob = 1 / away_odds

                total_prob = home_prob + draw_prob + away_prob

                return {
                    'home_implied_prob': home_prob / total_prob,
                    'draw_implied_prob': draw_prob / total_prob,
                    'away_implied_prob': away_prob / total_prob,
                    'bookmaker_margin': (total_prob - 1) * 100
                }

            return {}

        except Exception as e:
            logger.error(f"Hiba az odds elemzés során: {e}")
            return {}

    def _calculate_market_confidence(self, odds_1x2: Dict) -> float:
        """Piac bizalom számítás"""
        try:
            if not odds_1x2:
                return 0.5

            odds_analysis = self._analyze_odds(odds_1x2)
            margin = odds_analysis.get('bookmaker_margin', 10)

            # Alacsonyabb margin = magasabb piac bizalom
            return max(0.1, 1 - (margin / 20))

        except:
            return 0.5

    def _calculate_prediction_confidence(self,
                                       form_analysis: Dict,
                                       h2h_analysis: Dict,
                                       market_analysis: Dict) -> float:
        """Predikció bizalom számítás"""
        try:
            confidence_factors = []

            # Forma alapú bizalom
            if form_analysis:
                form_diff = abs(form_analysis.get('form_difference', 0))
                confidence_factors.append(min(1.0, form_diff * 2))

            # H2H alapú bizalom
            if h2h_analysis and h2h_analysis.get('total_matches', 0) > 0:
                matches_count = h2h_analysis.get('total_matches', 0)
                confidence_factors.append(min(1.0, matches_count / 10))

            # Piac alapú bizalom
            if market_analysis:
                market_conf = market_analysis.get('market_confidence', 0.5)
                confidence_factors.append(market_conf)

            if confidence_factors:
                return statistics.mean(confidence_factors)

            return 0.5

        except:
            return 0.5
