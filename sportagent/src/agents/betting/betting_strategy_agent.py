"""
Fogadási Stratégia Ügynök (Betting Strategy Agent)
Intelligens fogadási stratégiák és bankroll menedzsment
"""

import math
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from ..utils.logger import Logger
from ..data.data_storage import DataStorage

logger = Logger().get_logger()

class RiskLevel(Enum):
    """Kockázati szintek"""
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class BetType(Enum):
    """Fogadás típusok"""
    SINGLE = "single"
    ACCUMULATOR = "accumulator"
    SYSTEM = "system"
    EACH_WAY = "each_way"

@dataclass
class BettingRecommendation:
    """Fogadási ajánlás"""
    match_id: str
    bet_type: str
    selection: str
    odds: float
    stake_percentage: float
    expected_value: float
    confidence: float
    risk_level: RiskLevel
    reasoning: str

@dataclass
class BankrollAllocation:
    """Bankroll elosztás"""
    total_bankroll: float
    safe_bets: float
    moderate_bets: float
    risky_bets: float
    reserve: float

class BettingStrategyAgent:
    """
    Fejlett fogadási stratégia ügynök
    Bankroll menedzsment, kockázat optimalizálás, profit maximalizálás
    """

    def __init__(self, data_storage: DataStorage):
        self.data_storage = data_storage
        self.logger = Logger().get_logger()

        # Stratégiai paraméterek
        self.kelly_fraction = 0.25  # Konzervatív Kelly stratégia
        self.max_stake_per_bet = 0.05  # Max 5% per fogadás
        self.min_odds = 1.5  # Minimum odds
        self.max_odds = 10.0  # Maximum odds
        self.min_confidence = 0.6  # Minimum confidence

        # Bankroll kategóriák
        self.bankroll_allocation = {
            'safe': 0.40,      # 40% biztos fogadások
            'moderate': 0.35,   # 35% közepes kockázat
            'risky': 0.15,     # 15% magas kockázat
            'reserve': 0.10    # 10% tartalék
        }

        logger.info("BettingStrategyAgent inicializálva")

    def generate_betting_strategies(self,
                                  matches: List[Dict],
                                  analysis: Dict) -> Dict[str, Any]:
        """
        Komplex fogadási stratégiák generálása
        """
        logger.info(f"Fogadási stratégiák generálása: {len(matches)} mérkőzés")

        results = {
            'total_matches': len(matches),
            'analyzed_matches': len(analysis.get('detailed_analysis', [])),
            'recommendations': [],
            'safe_bets': [],
            'moderate_bets': [],
            'risky_bets': [],
            'accumulator_suggestions': [],
            'bankroll_strategy': {},
            'risk_management': {},
            'expected_returns': {},
            'strategy_insights': []
        }

        try:
            detailed_analysis = analysis.get('detailed_analysis', [])

            # Egyedi mérkőzés stratégiák
            for match_analysis in detailed_analysis:
                recommendations = self._generate_match_strategies(match_analysis)
                results['recommendations'].extend(recommendations)

                # Kategorizálás kockázat szerint
                self._categorize_recommendations(recommendations, results)

                # Stratégia tárolása
                match_id = match_analysis.get('match_id', '')
                if match_id:
                    strategy_data = {
                        'strategy_type': 'comprehensive',
                        'recommended_bets': recommendations,
                        'bankroll_allocation': self._calculate_match_bankroll(recommendations),
                        'expected_roi': self._calculate_expected_roi(recommendations),
                        'risk_level': self._assess_overall_risk(recommendations),
                        'confidence': self._calculate_strategy_confidence(recommendations),
                        'reasoning': self._generate_strategy_reasoning(match_analysis, recommendations)
                    }
                    self.data_storage.store_strategy(match_id, strategy_data)

            # Komplex stratégiák
            results['accumulator_suggestions'] = self._generate_accumulator_strategies(results['recommendations'])
            results['bankroll_strategy'] = self._generate_bankroll_strategy(results['recommendations'])
            results['risk_management'] = self._generate_risk_management_plan(results['recommendations'])
            results['expected_returns'] = self._calculate_portfolio_returns(results['recommendations'])
            results['strategy_insights'] = self._generate_strategy_insights(results)

            logger.info(f"Stratégia generálás befejezve: {len(results['recommendations'])} ajánlás")

        except Exception as e:
            logger.error(f"Hiba a stratégia generálás során: {e}")

        return results

    def _generate_match_strategies(self, match_analysis: Dict) -> List[Dict]:
        """
        Egyedi mérkőzés stratégiák generálása
        """
        recommendations = []

        try:
            prediction = match_analysis.get('prediction', {})
            value_bets = match_analysis.get('value_bets', [])
            confidence = match_analysis.get('prediction_confidence', 0.0)

            if not prediction or confidence < self.min_confidence:
                return recommendations

            # Érték fogadások feldolgozása
            for value_bet in value_bets:
                if self._is_bet_viable(value_bet):
                    recommendation = self._create_recommendation(match_analysis, value_bet)
                    if recommendation:
                        recommendations.append(recommendation)

            # Alternatív stratégiák
            alt_strategies = self._generate_alternative_strategies(match_analysis)
            recommendations.extend(alt_strategies)

            # Kombináció stratégiák
            combo_strategies = self._generate_combination_strategies(match_analysis)
            recommendations.extend(combo_strategies)

        except Exception as e:
            logger.error(f"Hiba a mérkőzés stratégiák generálása során: {e}")

        return recommendations

    def _create_recommendation(self, match_analysis: Dict, value_bet: Dict) -> Optional[Dict]:
        """
        Fogadási ajánlás létrehozása
        """
        try:
            odds = value_bet.get('odds', 0)
            probability = value_bet.get('probability', 0)
            confidence = value_bet.get('confidence', 0)
            value = value_bet.get('value', 0)

            if odds < self.min_odds or odds > self.max_odds:
                return None

            # Kelly kritérium alapú tét
            kelly_stake = self._calculate_kelly_stake(probability, odds)

            # Kockázat alapú módosítás
            risk_adjusted_stake = self._adjust_stake_for_risk(kelly_stake, confidence, odds)

            # Kockázati szint meghatározása
            risk_level = self._determine_risk_level(confidence, odds, value)

            return {
                'match_id': match_analysis.get('match_id', ''),
                'home_team': match_analysis.get('home_team', ''),
                'away_team': match_analysis.get('away_team', ''),
                'bet_type': value_bet.get('type', ''),
                'selection': self._format_selection(value_bet.get('type', '')),
                'odds': odds,
                'probability': probability,
                'stake_percentage': risk_adjusted_stake,
                'expected_value': value,
                'confidence': confidence,
                'risk_level': risk_level.value,
                'reasoning': self._generate_bet_reasoning(match_analysis, value_bet),
                'kelly_stake': kelly_stake,
                'max_loss': risk_adjusted_stake,
                'potential_profit': risk_adjusted_stake * (odds - 1),
                'created_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Hiba az ajánlás létrehozása során: {e}")
            return None

    def _generate_alternative_strategies(self, match_analysis: Dict) -> List[Dict]:
        """
        Alternatív stratégiák generálása
        """
        alternatives = []

        try:
            prediction = match_analysis.get('prediction', {})
            if not prediction:
                return alternatives

            # Draw No Bet stratégia
            home_prob = prediction.get('home_win_probability', 0)
            away_prob = prediction.get('away_win_probability', 0)

            if home_prob > 0.6 or away_prob > 0.6:
                stronger_team = 'home' if home_prob > away_prob else 'away'
                alternatives.append({
                    'match_id': match_analysis.get('match_id', ''),
                    'home_team': match_analysis.get('home_team', ''),
                    'away_team': match_analysis.get('away_team', ''),
                    'bet_type': 'draw_no_bet',
                    'selection': f"{stronger_team}_draw_no_bet",
                    'odds': 1.8,  # Becsült odds
                    'probability': max(home_prob, away_prob),
                    'stake_percentage': 0.02,
                    'expected_value': 0.08,
                    'confidence': match_analysis.get('prediction_confidence', 0),
                    'risk_level': RiskLevel.MODERATE.value,
                    'reasoning': f"Draw No Bet a {stronger_team} csapatra a magas győzelmi valószínűség miatt",
                    'kelly_stake': 0.025,
                    'max_loss': 0.02,
                    'potential_profit': 0.016,
                    'created_at': datetime.now().isoformat()
                })

            # Double Chance stratégia
            if prediction.get('draw_probability', 0) > 0.3:
                alternatives.append({
                    'match_id': match_analysis.get('match_id', ''),
                    'home_team': match_analysis.get('home_team', ''),
                    'away_team': match_analysis.get('away_team', ''),
                    'bet_type': 'double_chance',
                    'selection': '1X' if home_prob > away_prob else 'X2',
                    'odds': 1.3,  # Becsült odds
                    'probability': (home_prob + prediction.get('draw_probability', 0)) if home_prob > away_prob else (away_prob + prediction.get('draw_probability', 0)),
                    'stake_percentage': 0.03,
                    'expected_value': 0.05,
                    'confidence': match_analysis.get('prediction_confidence', 0),
                    'risk_level': RiskLevel.CONSERVATIVE.value,
                    'reasoning': "Double Chance a magas döntetlen valószínűség miatt",
                    'kelly_stake': 0.035,
                    'max_loss': 0.03,
                    'potential_profit': 0.009,
                    'created_at': datetime.now().isoformat()
                })

        except Exception as e:
            logger.error(f"Hiba az alternatív stratégiák generálása során: {e}")

        return alternatives

    def _generate_combination_strategies(self, match_analysis: Dict) -> List[Dict]:
        """
        Kombináció stratégiák generálása
        """
        combinations = []

        try:
            prediction = match_analysis.get('prediction', {})
            if not prediction:
                return combinations

            # Goals + Result kombináció
            over_2_5_prob = prediction.get('over_2_5_probability', 0)
            home_win_prob = prediction.get('home_win_probability', 0)

            if over_2_5_prob > 0.6 and home_win_prob > 0.5:
                combinations.append({
                    'match_id': match_analysis.get('match_id', ''),
                    'home_team': match_analysis.get('home_team', ''),
                    'away_team': match_analysis.get('away_team', ''),
                    'bet_type': 'combo',
                    'selection': 'home_win_and_over_2_5',
                    'odds': 2.5,  # Becsült kombinált odds
                    'probability': home_win_prob * over_2_5_prob,
                    'stake_percentage': 0.015,
                    'expected_value': 0.12,
                    'confidence': match_analysis.get('prediction_confidence', 0) * 0.8,
                    'risk_level': RiskLevel.MODERATE.value,
                    'reasoning': "Kombinált fogadás: hazai győzelem + 2.5 gól felett",
                    'kelly_stake': 0.02,
                    'max_loss': 0.015,
                    'potential_profit': 0.0225,
                    'created_at': datetime.now().isoformat()
                })

            # BTTS + Result kombináció
            btts_prob = prediction.get('both_teams_score_probability', 0)
            if btts_prob > 0.6:
                combinations.append({
                    'match_id': match_analysis.get('match_id', ''),
                    'home_team': match_analysis.get('home_team', ''),
                    'away_team': match_analysis.get('away_team', ''),
                    'bet_type': 'btts',
                    'selection': 'both_teams_score',
                    'odds': 1.7,  # Becsült odds
                    'probability': btts_prob,
                    'stake_percentage': 0.025,
                    'expected_value': 0.08,
                    'confidence': match_analysis.get('prediction_confidence', 0),
                    'risk_level': RiskLevel.MODERATE.value,
                    'reasoning': "Both Teams To Score - magas gólszerzési valószínűség",
                    'kelly_stake': 0.03,
                    'max_loss': 0.025,
                    'potential_profit': 0.0175,
                    'created_at': datetime.now().isoformat()
                })

        except Exception as e:
            logger.error(f"Hiba a kombináció stratégiák generálása során: {e}")

        return combinations

    def _generate_accumulator_strategies(self, recommendations: List[Dict]) -> List[Dict]:
        """
        Accumulator stratégiák generálása
        """
        accumulators = []

        try:
            # Biztos fogadások accumulator-a
            safe_bets = [r for r in recommendations if r.get('risk_level') == RiskLevel.CONSERVATIVE.value and r.get('confidence', 0) > 0.7]

            if len(safe_bets) >= 3:
                selected_bets = safe_bets[:4]  # Max 4 meccs
                combined_odds = 1.0
                combined_prob = 1.0

                for bet in selected_bets:
                    combined_odds *= bet.get('odds', 1.0)
                    combined_prob *= bet.get('probability', 0.5)

                accumulators.append({
                    'type': 'safe_accumulator',
                    'selections': selected_bets,
                    'total_odds': combined_odds,
                    'probability': combined_prob,
                    'stake_percentage': 0.01,
                    'expected_value': (combined_prob * combined_odds) - 1,
                    'confidence': min([bet.get('confidence', 0) for bet in selected_bets]),
                    'risk_level': RiskLevel.MODERATE.value,
                    'reasoning': "Biztos fogadások accumulator-a",
                    'potential_profit': 0.01 * (combined_odds - 1),
                    'created_at': datetime.now().isoformat()
                })

            # Közepes kockázat accumulator
            moderate_bets = [r for r in recommendations if r.get('risk_level') == RiskLevel.MODERATE.value and r.get('confidence', 0) > 0.6]

            if len(moderate_bets) >= 2:
                selected_bets = moderate_bets[:3]  # Max 3 meccs
                combined_odds = 1.0
                combined_prob = 1.0

                for bet in selected_bets:
                    combined_odds *= bet.get('odds', 1.0)
                    combined_prob *= bet.get('probability', 0.5)

                accumulators.append({
                    'type': 'moderate_accumulator',
                    'selections': selected_bets,
                    'total_odds': combined_odds,
                    'probability': combined_prob,
                    'stake_percentage': 0.005,
                    'expected_value': (combined_prob * combined_odds) - 1,
                    'confidence': min([bet.get('confidence', 0) for bet in selected_bets]),
                    'risk_level': RiskLevel.MODERATE.value,
                    'reasoning': "Közepes kockázat accumulator",
                    'potential_profit': 0.005 * (combined_odds - 1),
                    'created_at': datetime.now().isoformat()
                })

        except Exception as e:
            logger.error(f"Hiba az accumulator stratégiák generálása során: {e}")

        return accumulators

    def _generate_bankroll_strategy(self, recommendations: List[Dict]) -> Dict[str, Any]:
        """
        Bankroll stratégia generálása
        """
        try:
            total_stake = sum(r.get('stake_percentage', 0) for r in recommendations)

            strategy = {
                'total_allocation': total_stake,
                'safe_allocation': 0.0,
                'moderate_allocation': 0.0,
                'risky_allocation': 0.0,
                'recommended_bankroll': 1000,  # Alap bankroll
                'daily_limit': 0.1,  # Napi max 10%
                'stop_loss': 0.2,   # Stop loss 20%
                'take_profit': 0.5,  # Take profit 50%
                'recommendations': []
            }

            for rec in recommendations:
                risk_level = rec.get('risk_level', RiskLevel.MODERATE.value)
                stake = rec.get('stake_percentage', 0)

                if risk_level == RiskLevel.CONSERVATIVE.value:
                    strategy['safe_allocation'] += stake
                elif risk_level == RiskLevel.MODERATE.value:
                    strategy['moderate_allocation'] += stake
                else:
                    strategy['risky_allocation'] += stake

                strategy['recommendations'].append({
                    'match': f"{rec.get('home_team', '')} vs {rec.get('away_team', '')}",
                    'stake': stake,
                    'risk_level': risk_level,
                    'expected_profit': rec.get('potential_profit', 0)
                })

            # Kockázat ellenőrzés
            if strategy['total_allocation'] > 0.15:  # Max 15%
                strategy['warning'] = "Magas összes allokáció - csökkentés javasolt"

            return strategy

        except Exception as e:
            logger.error(f"Hiba a bankroll stratégia generálása során: {e}")
            return {}

    def _generate_risk_management_plan(self, recommendations: List[Dict]) -> Dict[str, Any]:
        """
        Kockázatkezelési terv generálása
        """
        try:
            high_risk_bets = [r for r in recommendations if r.get('risk_level') == RiskLevel.AGGRESSIVE.value]
            moderate_risk_bets = [r for r in recommendations if r.get('risk_level') == RiskLevel.MODERATE.value]

            plan = {
                'overall_risk_level': 'moderate',
                'high_risk_count': len(high_risk_bets),
                'moderate_risk_count': len(moderate_risk_bets),
                'diversification_score': 0.0,
                'recommendations': [],
                'alerts': []
            }

            # Diverzifikáció pontszám
            unique_leagues = set()
            for rec in recommendations:
                match_id = rec.get('match_id', '')
                # Egyszerű league kinyerés a match_id-ból
                unique_leagues.add(match_id.split('-')[0] if '-' in match_id else 'unknown')

            plan['diversification_score'] = min(1.0, len(unique_leagues) / 5)

            # Kockázat alapú ajánlások
            if len(high_risk_bets) > 3:
                plan['alerts'].append("Túl sok magas kockázatú fogadás")

            if plan['diversification_score'] < 0.3:
                plan['alerts'].append("Alacsony diverzifikáció - több liga ajánlott")

            # Összesített kockázat
            total_risk = sum(self._calculate_bet_risk(rec) for rec in recommendations)
            if total_risk > 0.6:
                plan['overall_risk_level'] = 'high'
                plan['recommendations'].append("Csökkentsd a fogadások számát vagy téteket")

            return plan

        except Exception as e:
            logger.error(f"Hiba a kockázatkezelés generálása során: {e}")
            return {}

    def _calculate_portfolio_returns(self, recommendations: List[Dict]) -> Dict[str, float]:
        """
        Portfólió hozamok számítása
        """
        try:
            if not recommendations:
                return {}

            total_stake = sum(r.get('stake_percentage', 0) for r in recommendations)
            total_potential_profit = sum(r.get('potential_profit', 0) for r in recommendations)

            # Várható hozam
            expected_return = sum(
                r.get('stake_percentage', 0) * r.get('probability', 0) * (r.get('odds', 1) - 1)
                for r in recommendations
            )

            # Kockázat (szórás)
            variances = []
            for rec in recommendations:
                stake = rec.get('stake_percentage', 0)
                prob = rec.get('probability', 0)
                odds = rec.get('odds', 1)

                win_return = stake * (odds - 1)
                loss_return = -stake

                expected_rec_return = prob * win_return + (1 - prob) * loss_return
                variance = prob * (win_return - expected_rec_return) ** 2 + (1 - prob) * (loss_return - expected_rec_return) ** 2
                variances.append(variance)

            portfolio_variance = sum(variances)
            portfolio_risk = math.sqrt(portfolio_variance)

            # Sharpe ratio (egyszerűsített)
            sharpe_ratio = expected_return / portfolio_risk if portfolio_risk > 0 else 0

            return {
                'total_stake': total_stake,
                'total_potential_profit': total_potential_profit,
                'expected_return': expected_return,
                'portfolio_risk': portfolio_risk,
                'sharpe_ratio': sharpe_ratio,
                'roi_percentage': (expected_return / total_stake * 100) if total_stake > 0 else 0,
                'win_rate_needed': self._calculate_breakeven_rate(recommendations)
            }

        except Exception as e:
            logger.error(f"Hiba a portfólió hozamok számítása során: {e}")
            return {}

    def _generate_strategy_insights(self, results: Dict) -> List[str]:
        """
        Stratégiai insights generálása
        """
        insights = []

        try:
            total_recs = len(results.get('recommendations', []))
            safe_count = len(results.get('safe_bets', []))
            risky_count = len(results.get('risky_bets', []))

            if total_recs > 0:
                insights.append(f"Összesen {total_recs} fogadási ajánlás generálva")

                if safe_count > total_recs * 0.6:
                    insights.append("Konzervatív nap - sok biztos fogadás")
                elif risky_count > total_recs * 0.4:
                    insights.append("Kockázatos nap - óvatosság javasolt")
                else:
                    insights.append("Kiegyensúlyozott nap - jó diverzifikáció")

            expected_returns = results.get('expected_returns', {})
            roi = expected_returns.get('roi_percentage', 0)

            if roi > 15:
                insights.append("Magas ROI potenciál - kiváló lehetőségek")
            elif roi > 8:
                insights.append("Közepes ROI potenciál - mérsékelt lehetőségek")
            elif roi > 0:
                insights.append("Alacsony ROI potenciál - óvatos fogadás")
            else:
                insights.append("Negatív ROI - fogadás nem javasolt")

            accumulator_count = len(results.get('accumulator_suggestions', []))
            if accumulator_count > 0:
                insights.append(f"{accumulator_count} accumulator lehetőség azonosítva")

        except Exception as e:
            logger.error(f"Hiba a stratégiai insights generálása során: {e}")

        return insights

    # Segéd függvények
    def _is_bet_viable(self, value_bet: Dict) -> bool:
        """Fogadás életképesség ellenőrzése"""
        try:
            odds = value_bet.get('odds', 0)
            value = value_bet.get('value', 0)
            confidence = value_bet.get('confidence', 0)

            return (odds >= self.min_odds and
                   odds <= self.max_odds and
                   value > 0.05 and
                   confidence >= self.min_confidence)
        except:
            return False

    def _calculate_kelly_stake(self, probability: float, odds: float) -> float:
        """Kelly kritérium alapú tét számítás"""
        try:
            if odds <= 1 or probability <= 0:
                return 0

            kelly_percentage = ((probability * odds) - 1) / (odds - 1)

            # Konzervatív fractional Kelly
            return max(0, min(self.max_stake_per_bet, kelly_percentage * self.kelly_fraction))
        except:
            return 0.01

    def _adjust_stake_for_risk(self, kelly_stake: float, confidence: float, odds: float) -> float:
        """Kockázat alapú tét módosítás"""
        try:
            # Confidence alapú módosítás
            confidence_multiplier = confidence if confidence > 0 else 0.5

            # Odds alapú módosítás
            odds_multiplier = 1.0
            if odds > 3.0:
                odds_multiplier = 0.8  # Magasabb odds - alacsonyabb tét
            elif odds < 1.8:
                odds_multiplier = 1.2  # Alacsonyabb odds - magasabb tét

            adjusted_stake = kelly_stake * confidence_multiplier * odds_multiplier

            return max(0.005, min(self.max_stake_per_bet, adjusted_stake))
        except:
            return 0.01

    def _determine_risk_level(self, confidence: float, odds: float, value: float) -> RiskLevel:
        """Kockázati szint meghatározása"""
        try:
            if confidence > 0.8 and odds < 2.0 and value > 0.1:
                return RiskLevel.CONSERVATIVE
            elif confidence > 0.6 and odds < 4.0:
                return RiskLevel.MODERATE
            else:
                return RiskLevel.AGGRESSIVE
        except:
            return RiskLevel.MODERATE

    def _format_selection(self, bet_type: str) -> str:
        """Fogadás típus formázása"""
        format_map = {
            'home_win': 'Hazai győzelem',
            'away_win': 'Vendég győzelem',
            'draw': 'Döntetlen',
            'over_2_5': 'Felett 2.5 gól',
            'under_2_5': 'Alatt 2.5 gól',
            'both_teams_score': 'Mindkét csapat gólra jut'
        }
        return format_map.get(bet_type, bet_type)

    def _generate_bet_reasoning(self, match_analysis: Dict, value_bet: Dict) -> str:
        """Fogadás indoklás generálása"""
        try:
            bet_type = value_bet.get('type', '')
            confidence = value_bet.get('confidence', 0)
            value = value_bet.get('value', 0)

            reasoning = f"Érték fogadás ({value:.2%} érték, {confidence:.1%} bizalom). "

            key_factors = match_analysis.get('key_factors', [])
            if key_factors:
                reasoning += f"Kulcs tényezők: {', '.join(key_factors[:2])}"

            return reasoning
        except:
            return "Statisztikai elemzés alapján"

    def _categorize_recommendations(self, recommendations: List[Dict], results: Dict):
        """Ajánlások kategorizálása"""
        for rec in recommendations:
            risk_level = rec.get('risk_level', RiskLevel.MODERATE.value)

            if risk_level == RiskLevel.CONSERVATIVE.value:
                results['safe_bets'].append(rec)
            elif risk_level == RiskLevel.MODERATE.value:
                results['moderate_bets'].append(rec)
            else:
                results['risky_bets'].append(rec)

    def _calculate_match_bankroll(self, recommendations: List[Dict]) -> Dict[str, float]:
        """Mérkőzés bankroll számítás"""
        try:
            total_stake = sum(r.get('stake_percentage', 0) for r in recommendations)
            return {
                'total_allocation': total_stake,
                'max_loss': total_stake,
                'potential_profit': sum(r.get('potential_profit', 0) for r in recommendations)
            }
        except:
            return {'total_allocation': 0, 'max_loss': 0, 'potential_profit': 0}

    def _calculate_expected_roi(self, recommendations: List[Dict]) -> float:
        """Várható ROI számítás"""
        try:
            if not recommendations:
                return 0.0

            total_stake = sum(r.get('stake_percentage', 0) for r in recommendations)
            expected_return = sum(
                r.get('stake_percentage', 0) * r.get('probability', 0) * (r.get('odds', 1) - 1)
                for r in recommendations
            )

            return (expected_return / total_stake) if total_stake > 0 else 0.0
        except:
            return 0.0

    def _assess_overall_risk(self, recommendations: List[Dict]) -> str:
        """Összesített kockázat értékelés"""
        try:
            risk_scores = []
            for rec in recommendations:
                risk_level = rec.get('risk_level', RiskLevel.MODERATE.value)
                if risk_level == RiskLevel.CONSERVATIVE.value:
                    risk_scores.append(0.2)
                elif risk_level == RiskLevel.MODERATE.value:
                    risk_scores.append(0.5)
                else:
                    risk_scores.append(0.8)

            if not risk_scores:
                return 'medium'

            avg_risk = sum(risk_scores) / len(risk_scores)

            if avg_risk < 0.3:
                return 'low'
            elif avg_risk < 0.6:
                return 'medium'
            else:
                return 'high'
        except:
            return 'medium'

    def _calculate_strategy_confidence(self, recommendations: List[Dict]) -> float:
        """Stratégia bizalom számítás"""
        try:
            if not recommendations:
                return 0.0

            confidences = [r.get('confidence', 0) for r in recommendations]
            return sum(confidences) / len(confidences)
        except:
            return 0.0

    def _generate_strategy_reasoning(self, match_analysis: Dict, recommendations: List[Dict]) -> str:
        """Stratégia indoklás generálása"""
        try:
            reasoning = f"Komplex stratégia {len(recommendations)} fogadással. "

            if recommendations:
                avg_confidence = sum(r.get('confidence', 0) for r in recommendations) / len(recommendations)
                reasoning += f"Átlagos bizalom: {avg_confidence:.1%}. "

            key_factors = match_analysis.get('key_factors', [])
            if key_factors:
                reasoning += f"Kulcs tényezők: {', '.join(key_factors[:2])}"

            return reasoning
        except:
            return "Statisztikai elemzés alapján"

    def _calculate_bet_risk(self, recommendation: Dict) -> float:
        """Fogadás kockázat számítás"""
        try:
            stake = recommendation.get('stake_percentage', 0)
            odds = recommendation.get('odds', 1)
            confidence = recommendation.get('confidence', 0)

            # Kockázat = tét * (1 - siker valószínűség) * odds súly
            risk = stake * (1 - confidence) * min(1.0, odds / 5.0)

            return risk
        except:
            return 0.1

    def _calculate_breakeven_rate(self, recommendations: List[Dict]) -> float:
        """Nullszaldós nyerési arány számítás"""
        try:
            if not recommendations:
                return 0.0

            total_stake = sum(r.get('stake_percentage', 0) for r in recommendations)
            total_potential_loss = total_stake

            weighted_odds = sum(
                r.get('stake_percentage', 0) * r.get('odds', 1)
                for r in recommendations
            ) / total_stake if total_stake > 0 else 1

            breakeven_rate = 1 / weighted_odds

            return breakeven_rate
        except:
            return 0.5
