"""
Meccs Statisztika Ügynök - Specializált meccsek részletes elemzésére
"""
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import time
import requests
from bs4 import BeautifulSoup
import re

from ..utils.logger import Logger
from ..config import Config
from ..utils.date_utils import DateUtils

class MatchStatisticsAgent:
    """
    Specializált ügynök meccsekről részletes információgyűjtésre
    Korábbi statisztikák, head-to-head, formaguide, játékosok
    """

    def __init__(self):
        self.logger = Logger('match_statistics_agent')
        self.config = Config()
        self.date_utils = DateUtils()
        self.session = requests.Session()

        # User agent beállítás
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

        # Statisztika kategóriák
        self.stat_categories = [
            'head_to_head',
            'recent_form',
            'league_position',
            'goal_statistics',
            'injury_suspensions',
            'betting_odds',
            'expert_predictions'
        ]

    def analyze_match(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Egy meccs teljes elemzése

        Args:
            match_data: Meccs alapadatai

        Returns:
            Dict: Részletes elemzés
        """
        match_id = match_data.get('id')
        home_team = match_data.get('home_team', 'Unknown')
        away_team = match_data.get('away_team', 'Unknown')

        self.logger.info(f"Meccs elemzése: {home_team} vs {away_team}")

        analysis = {
            'match_info': match_data,
            'analysis_timestamp': datetime.now().isoformat(),
            'head_to_head': self._get_head_to_head(home_team, away_team),
            'team_form': self._get_team_form(home_team, away_team),
            'league_stats': self._get_league_statistics(match_data),
            'goal_analysis': self._get_goal_analysis(home_team, away_team),
            'injury_report': self._get_injury_report(home_team, away_team),
            'betting_analysis': self._get_betting_analysis(match_data),
            'prediction': self._generate_prediction(match_data),
            'risk_factors': self._identify_risk_factors(match_data),
            'confidence_score': 0.0
        }

        # Megbízhatósági pontszám számítása
        analysis['confidence_score'] = self._calculate_confidence_score(analysis)

        self.logger.info(f"Elemzés befejezve. Megbízhatóság: {analysis['confidence_score']:.2f}")

        return analysis

    def analyze_multiple_matches(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Több meccs elemzése

        Args:
            matches: Meccsek listája

        Returns:
            List[Dict]: Elemzések listája
        """
        analyses = []

        for match in matches:
            try:
                analysis = self.analyze_match(match)
                analyses.append(analysis)

                # Kis szünet a rate limiting elkerülésére
                time.sleep(1)

            except Exception as e:
                self.logger.error(f"Hiba a meccs elemzésében: {str(e)}")
                # Alapértelmezett elemzés hiba esetén
                analyses.append(self._get_fallback_analysis(match))

        return analyses

    def _get_head_to_head(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """
        Korábbi találkozók elemzése

        Args:
            home_team: Hazai csapat
            away_team: Vendég csapat

        Returns:
            Dict: Head-to-head statisztikák
        """
        try:
            # Valós implementációban itt API hívásokat vagy web scrapinget használnánk
            # Most demo adatokat generálunk

            demo_h2h = self._generate_demo_h2h(home_team, away_team)

            return {
                'total_meetings': demo_h2h['total'],
                'home_wins': demo_h2h['home_wins'],
                'away_wins': demo_h2h['away_wins'],
                'draws': demo_h2h['draws'],
                'last_5_meetings': demo_h2h['last_5'],
                'average_goals': demo_h2h['avg_goals'],
                'home_advantage': demo_h2h['home_advantage'],
                'data_source': 'demo_data'
            }

        except Exception as e:
            self.logger.error(f"Head-to-head hiba: {str(e)}")
            return self._get_empty_h2h()

    def _get_team_form(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """
        Csapatok aktuális formája

        Args:
            home_team: Hazai csapat
            away_team: Vendég csapat

        Returns:
            Dict: Forma statisztikák
        """
        try:
            return {
                'home_team': {
                    'name': home_team,
                    'last_5_results': self._get_last_5_results(home_team),
                    'wins': self._get_recent_wins(home_team),
                    'goals_scored': self._get_recent_goals_scored(home_team),
                    'goals_conceded': self._get_recent_goals_conceded(home_team),
                    'form_rating': self._calculate_form_rating(home_team)
                },
                'away_team': {
                    'name': away_team,
                    'last_5_results': self._get_last_5_results(away_team),
                    'wins': self._get_recent_wins(away_team),
                    'goals_scored': self._get_recent_goals_scored(away_team),
                    'goals_conceded': self._get_recent_goals_conceded(away_team),
                    'form_rating': self._calculate_form_rating(away_team)
                }
            }

        except Exception as e:
            self.logger.error(f"Forma elemzés hiba: {str(e)}")
            return self._get_empty_form()

    def _get_league_statistics(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Bajnoksági statisztikák

        Args:
            match_data: Meccs adatok

        Returns:
            Dict: Bajnoksági statisztikák
        """
        try:
            league = match_data.get('league', 'Unknown')

            return {
                'league_name': league,
                'home_team_position': self._get_league_position(match_data.get('home_team', 'Unknown')),
                'away_team_position': self._get_league_position(match_data.get('away_team', 'Unknown')),
                'home_team_points': self._get_team_points(match_data.get('home_team', 'Unknown')),
                'away_team_points': self._get_team_points(match_data.get('away_team', 'Unknown')),
                'league_avg_goals': self._get_league_avg_goals(league),
                'data_source': 'demo_data'
            }

        except Exception as e:
            self.logger.error(f"Bajnoksági statisztikák hiba: {str(e)}")
            return self._get_empty_league_stats()

    def _get_goal_analysis(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """
        Gól statisztikák elemzése

        Args:
            home_team: Hazai csapat
            away_team: Vendég csapat

        Returns:
            Dict: Gól elemzés
        """
        try:
            return {
                'home_team_scoring': {
                    'avg_goals_per_game': self._get_avg_goals_scored(home_team),
                    'goals_at_home': self._get_home_goals(home_team),
                    'scoring_consistency': self._get_scoring_consistency(home_team)
                },
                'away_team_scoring': {
                    'avg_goals_per_game': self._get_avg_goals_scored(away_team),
                    'goals_away': self._get_away_goals(away_team),
                    'scoring_consistency': self._get_scoring_consistency(away_team)
                },
                'defensive_stats': {
                    'home_team_clean_sheets': self._get_clean_sheets(home_team),
                    'away_team_clean_sheets': self._get_clean_sheets(away_team),
                    'home_team_goals_conceded': self._get_goals_conceded(home_team),
                    'away_team_goals_conceded': self._get_goals_conceded(away_team)
                },
                'over_under_analysis': self._get_over_under_analysis(home_team, away_team)
            }

        except Exception as e:
            self.logger.error(f"Gól elemzés hiba: {str(e)}")
            return self._get_empty_goal_analysis()

    def _get_injury_report(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """
        Sérülés és eltiltás jelentés

        Args:
            home_team: Hazai csapat
            away_team: Vendég csapat

        Returns:
            Dict: Sérülés jelentés
        """
        try:
            return {
                'home_team_injuries': self._get_team_injuries(home_team),
                'away_team_injuries': self._get_team_injuries(away_team),
                'home_team_suspensions': self._get_team_suspensions(home_team),
                'away_team_suspensions': self._get_team_suspensions(away_team),
                'impact_assessment': self._assess_injury_impact(home_team, away_team),
                'data_freshness': datetime.now().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Sérülés jelentés hiba: {str(e)}")
            return self._get_empty_injury_report()

    def _get_betting_analysis(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fogadási elemzés

        Args:
            match_data: Meccs adatok

        Returns:
            Dict: Fogadási elemzés
        """
        try:
            return {
                'odds_available': True,
                'home_win_odds': self._get_demo_odds('home'),
                'draw_odds': self._get_demo_odds('draw'),
                'away_win_odds': self._get_demo_odds('away'),
                'over_under_odds': self._get_over_under_odds(),
                'both_teams_to_score': self._get_btts_odds(),
                'value_bets': self._identify_value_bets(match_data),
                'market_sentiment': self._analyze_market_sentiment(match_data)
            }

        except Exception as e:
            self.logger.error(f"Fogadási elemzés hiba: {str(e)}")
            return self._get_empty_betting_analysis()

    def _generate_prediction(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Meccs előrejelzés generálása

        Args:
            match_data: Meccs adatok

        Returns:
            Dict: Előrejelzés
        """
        try:
            home_team = match_data.get('home_team')
            away_team = match_data.get('away_team')

            # Egyszerű algoritmus a demo céljából
            prediction = {
                'predicted_result': self._predict_result(home_team, away_team),
                'confidence': self._calculate_prediction_confidence(match_data),
                'predicted_score': self._predict_score(home_team, away_team),
                'goal_predictions': {
                    'over_2_5': self._predict_over_25(home_team, away_team),
                    'both_teams_score': self._predict_btts(home_team, away_team)
                },
                'key_factors': self._identify_key_factors(match_data),
                'algorithm_version': '1.0'
            }

            return prediction

        except Exception as e:
            self.logger.error(f"Előrejelzés hiba: {str(e)}")
            return self._get_empty_prediction()

    def _identify_risk_factors(self, match_data: Dict[str, Any]) -> List[str]:
        """
        Kockázati tényezők azonosítása

        Args:
            match_data: Meccs adatok

        Returns:
            List[str]: Kockázati tényezők
        """
        risks = []

        # Demo kockázati tényezők
        if match_data.get('league') == 'Demo Liga':
            risks.append("Demo adatok - korlátozott megbízhatóság")

        # További kockázati tényezők...
        risks.extend([
            "Időjárási körülmények",
            "Kulcsjátékosok sérülése",
            "Motivációs különbségek",
            "Korábbi találkozók eredményei"
        ])

        return risks

    def _calculate_confidence_score(self, analysis: Dict[str, Any]) -> float:
        """
        Megbízhatósági pontszám számítása

        Args:
            analysis: Elemzés adatok

        Returns:
            float: Megbízhatósági pontszám (0-1)
        """
        # Egyszerű számítás demo céljából
        base_score = 0.6

        # Módosítások az adatok minősége alapján
        if analysis.get('head_to_head', {}).get('total_meetings', 0) > 5:
            base_score += 0.1

        if analysis.get('team_form', {}).get('home_team', {}).get('form_rating', 0) > 0.7:
            base_score += 0.1

        if analysis.get('injury_report', {}).get('impact_assessment', '') == 'low':
            base_score += 0.1

        return min(base_score, 1.0)

    # Demo adatok generálása
    def _generate_demo_h2h(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """Demo head-to-head adatok"""
        import random

        total = random.randint(5, 20)
        home_wins = random.randint(1, total//2)
        away_wins = random.randint(1, total//2)
        draws = total - home_wins - away_wins

        return {
            'total': total,
            'home_wins': home_wins,
            'away_wins': away_wins,
            'draws': draws,
            'last_5': ['W', 'L', 'D', 'W', 'L'],
            'avg_goals': round(random.uniform(1.5, 3.5), 1),
            'home_advantage': random.choice([True, False])
        }

    def _get_last_5_results(self, team: str) -> List[str]:
        """Demo utolsó 5 eredmény"""
        import random
        return [random.choice(['W', 'L', 'D']) for _ in range(5)]

    def _get_recent_wins(self, team: str) -> int:
        """Demo legutóbbi győzelmek"""
        import random
        return random.randint(1, 5)

    def _get_recent_goals_scored(self, team: str) -> int:
        """Demo legutóbbi gólok"""
        import random
        return random.randint(3, 12)

    def _get_recent_goals_conceded(self, team: str) -> int:
        """Demo legutóbbi kapott gólok"""
        import random
        return random.randint(1, 8)

    def _calculate_form_rating(self, team: str) -> float:
        """Demo forma értékelés"""
        import random
        return round(random.uniform(0.3, 0.9), 2)

    def _get_league_position(self, team: str) -> int:
        """Demo bajnoki pozíció"""
        import random
        return random.randint(1, 20)

    def _get_team_points(self, team: str) -> int:
        """Demo pontszám"""
        import random
        return random.randint(10, 60)

    def _get_league_avg_goals(self, league: str) -> float:
        """Demo liga átlag gólok"""
        import random
        return round(random.uniform(2.2, 3.2), 1)

    def _get_avg_goals_scored(self, team: str) -> float:
        """Demo átlag gólok"""
        import random
        return round(random.uniform(1.0, 2.5), 1)

    def _get_home_goals(self, team: str) -> float:
        """Demo hazai gólok"""
        import random
        return round(random.uniform(1.2, 2.8), 1)

    def _get_away_goals(self, team: str) -> float:
        """Demo vendég gólok"""
        import random
        return round(random.uniform(0.8, 2.2), 1)

    def _get_scoring_consistency(self, team: str) -> float:
        """Demo gólszerzés konzisztencia"""
        import random
        return round(random.uniform(0.5, 0.9), 2)

    def _get_clean_sheets(self, team: str) -> int:
        """Demo kapott gól nélküli meccsek"""
        import random
        return random.randint(2, 8)

    def _get_goals_conceded(self, team: str) -> int:
        """Demo kapott gólok"""
        import random
        return random.randint(5, 20)

    def _get_over_under_analysis(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """Demo over/under elemzés"""
        import random
        return {
            'over_1_5_probability': round(random.uniform(0.6, 0.9), 2),
            'over_2_5_probability': round(random.uniform(0.4, 0.7), 2),
            'over_3_5_probability': round(random.uniform(0.2, 0.5), 2)
        }

    def _get_team_injuries(self, team: str) -> List[str]:
        """Demo sérülések"""
        import random
        injuries = ['Játékos A - combizom', 'Játékos B - boka', 'Játékos C - térd']
        return random.sample(injuries, random.randint(0, 2))

    def _get_team_suspensions(self, team: str) -> List[str]:
        """Demo eltiltások"""
        import random
        suspensions = ['Játékos X - sárga lap', 'Játékos Y - piros lap']
        return random.sample(suspensions, random.randint(0, 1))

    def _assess_injury_impact(self, home_team: str, away_team: str) -> str:
        """Demo sérülés hatás értékelés"""
        import random
        return random.choice(['low', 'medium', 'high'])

    def _get_demo_odds(self, outcome: str) -> float:
        """Demo fogadási odds"""
        import random
        odds_ranges = {
            'home': (1.5, 3.5),
            'draw': (2.8, 4.2),
            'away': (1.8, 4.0)
        }
        return round(random.uniform(*odds_ranges[outcome]), 2)

    def _get_over_under_odds(self) -> Dict[str, float]:
        """Demo over/under odds"""
        import random
        return {
            'over_2_5': round(random.uniform(1.6, 2.4), 2),
            'under_2_5': round(random.uniform(1.4, 2.2), 2)
        }

    def _get_btts_odds(self) -> Dict[str, float]:
        """Demo mindkét csapat gólt szerez odds"""
        import random
        return {
            'yes': round(random.uniform(1.7, 2.3), 2),
            'no': round(random.uniform(1.5, 2.1), 2)
        }

    def _identify_value_bets(self, match_data: Dict[str, Any]) -> List[str]:
        """Demo értékes fogadások"""
        import random
        value_bets = ['Over 2.5 gól', 'Mindkét csapat gólt szerez', 'Hazai győzelem']
        return random.sample(value_bets, random.randint(1, 2))

    def _analyze_market_sentiment(self, match_data: Dict[str, Any]) -> str:
        """Demo piaci hangulat"""
        import random
        return random.choice(['bullish', 'bearish', 'neutral'])

    def _predict_result(self, home_team: str, away_team: str) -> str:
        """Demo eredmény előrejelzés"""
        import random
        return random.choice(['home_win', 'draw', 'away_win'])

    def _calculate_prediction_confidence(self, match_data: Dict[str, Any]) -> float:
        """Demo előrejelzés megbízhatóság"""
        import random
        return round(random.uniform(0.6, 0.9), 2)

    def _predict_score(self, home_team: str, away_team: str) -> str:
        """Demo pontszám előrejelzés"""
        import random
        home_goals = random.randint(0, 3)
        away_goals = random.randint(0, 3)
        return f"{home_goals}-{away_goals}"

    def _predict_over_25(self, home_team: str, away_team: str) -> float:
        """Demo over 2.5 valószínűség"""
        import random
        return round(random.uniform(0.4, 0.8), 2)

    def _predict_btts(self, home_team: str, away_team: str) -> float:
        """Demo mindkét csapat gólt szerez valószínűség"""
        import random
        return round(random.uniform(0.5, 0.8), 2)

    def _identify_key_factors(self, match_data: Dict[str, Any]) -> List[str]:
        """Demo kulcstényezők"""
        factors = [
            'Hazai pálya előny',
            'Aktuális forma',
            'Korábbi találkozók',
            'Motivációs tényezők'
        ]
        import random
        return random.sample(factors, random.randint(2, 4))

    # Üres adatok fallback esetekben
    def _get_empty_h2h(self) -> Dict[str, Any]:
        """Üres head-to-head adatok"""
        return {
            'total_meetings': 0,
            'home_wins': 0,
            'away_wins': 0,
            'draws': 0,
            'last_5_meetings': [],
            'average_goals': 0.0,
            'home_advantage': False,
            'data_source': 'unavailable'
        }

    def _get_empty_form(self) -> Dict[str, Any]:
        """Üres forma adatok"""
        return {
            'home_team': {'name': 'Unknown', 'form_rating': 0.0},
            'away_team': {'name': 'Unknown', 'form_rating': 0.0}
        }

    def _get_empty_league_stats(self) -> Dict[str, Any]:
        """Üres bajnoksági statisztikák"""
        return {
            'league_name': 'Unknown',
            'home_team_position': 0,
            'away_team_position': 0,
            'data_source': 'unavailable'
        }

    def _get_empty_goal_analysis(self) -> Dict[str, Any]:
        """Üres gól elemzés"""
        return {
            'home_team_scoring': {},
            'away_team_scoring': {},
            'defensive_stats': {},
            'over_under_analysis': {}
        }

    def _get_empty_injury_report(self) -> Dict[str, Any]:
        """Üres sérülés jelentés"""
        return {
            'home_team_injuries': [],
            'away_team_injuries': [],
            'home_team_suspensions': [],
            'away_team_suspensions': [],
            'impact_assessment': 'unknown'
        }

    def _get_empty_betting_analysis(self) -> Dict[str, Any]:
        """Üres fogadási elemzés"""
        return {
            'odds_available': False,
            'value_bets': [],
            'market_sentiment': 'unknown'
        }

    def _get_empty_prediction(self) -> Dict[str, Any]:
        """Üres előrejelzés"""
        return {
            'predicted_result': 'unknown',
            'confidence': 0.0,
            'predicted_score': '0-0',
            'goal_predictions': {},
            'key_factors': []
        }

    def _get_fallback_analysis(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Alapértelmezett elemzés hiba esetén"""
        return {
            'match_info': match_data,
            'analysis_timestamp': datetime.now().isoformat(),
            'head_to_head': self._get_empty_h2h(),
            'team_form': self._get_empty_form(),
            'league_stats': self._get_empty_league_stats(),
            'goal_analysis': self._get_empty_goal_analysis(),
            'injury_report': self._get_empty_injury_report(),
            'betting_analysis': self._get_empty_betting_analysis(),
            'prediction': self._get_empty_prediction(),
            'risk_factors': ['Adatok nem elérhetők'],
            'confidence_score': 0.0,
            'error': 'Elemzés nem sikerült'
        }
