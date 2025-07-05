"""
Demo adatok a Sport Agent teszteléshez
"""
from datetime import datetime, timedelta
from typing import List, Dict

class DemoData:
    """
    Demo adatok generálása teszteléshez
    """

    @staticmethod
    def get_demo_matches(date: datetime) -> List[Dict]:
        """
        Demo meccs adatok generálása
        """
        matches = [
            {
                'id': 'demo_1',
                'source': 'Demo Data',
                'home_team': 'Arsenal',
                'away_team': 'Chelsea',
                'date': date.strftime('%Y-%m-%d'),
                'time': '15:00',
                'league': 'Premier League',
                'status': 'scheduled',
                'odds_home': 2.10,
                'odds_draw': 3.40,
                'odds_away': 3.50,
                'importance_score': 95,
                'league_tier': 'tier_1',
                'time_category': 'afternoon',
                'odds_analysis': {
                    'favorite': 'home',
                    'underdog': 'away',
                    'close_match': True,
                    'high_scoring_expected': False
                }
            },
            {
                'id': 'demo_2',
                'source': 'Demo Data',
                'home_team': 'Manchester United',
                'away_team': 'Liverpool',
                'date': date.strftime('%Y-%m-%d'),
                'time': '17:30',
                'league': 'Premier League',
                'status': 'scheduled',
                'odds_home': 2.90,
                'odds_draw': 3.20,
                'odds_away': 2.30,
                'importance_score': 98,
                'league_tier': 'tier_1',
                'time_category': 'evening',
                'odds_analysis': {
                    'favorite': 'away',
                    'underdog': 'home',
                    'close_match': True,
                    'high_scoring_expected': True
                }
            },
            {
                'id': 'demo_3',
                'source': 'Demo Data',
                'home_team': 'Real Madrid',
                'away_team': 'Barcelona',
                'date': date.strftime('%Y-%m-%d'),
                'time': '20:00',
                'league': 'La Liga',
                'status': 'scheduled',
                'odds_home': 2.20,
                'odds_draw': 3.60,
                'odds_away': 2.80,
                'importance_score': 100,
                'league_tier': 'tier_1',
                'time_category': 'evening',
                'odds_analysis': {
                    'favorite': 'home',
                    'underdog': 'away',
                    'close_match': False,
                    'high_scoring_expected': True
                }
            },
            {
                'id': 'demo_4',
                'source': 'Demo Data',
                'home_team': 'Los Angeles Lakers',
                'away_team': 'Golden State Warriors',
                'date': date.strftime('%Y-%m-%d'),
                'time': '22:00',
                'league': 'NBA',
                'status': 'scheduled',
                'odds_home': 1.90,
                'odds_draw': 0.0,
                'odds_away': 1.95,
                'importance_score': 90,
                'league_tier': 'tier_1',
                'time_category': 'night',
                'odds_analysis': {
                    'favorite': 'home',
                    'underdog': 'away',
                    'close_match': True,
                    'high_scoring_expected': True
                }
            },
            {
                'id': 'demo_5',
                'source': 'Demo Data',
                'home_team': 'AC Milan',
                'away_team': 'Juventus',
                'date': date.strftime('%Y-%m-%d'),
                'time': '18:45',
                'league': 'Serie A',
                'status': 'scheduled',
                'odds_home': 2.40,
                'odds_draw': 3.10,
                'odds_away': 2.90,
                'importance_score': 88,
                'league_tier': 'tier_1',
                'time_category': 'evening',
                'odds_analysis': {
                    'favorite': 'home',
                    'underdog': 'away',
                    'close_match': True,
                    'high_scoring_expected': False
                }
            }
        ]

        return matches

    @staticmethod
    def get_demo_match_analysis(match_id: str) -> Dict:
        """
        Demo meccs részletes elemzés
        """
        if match_id == 'demo_1':
            return {
                'match_data': {
                    'home_team': 'Arsenal',
                    'away_team': 'Chelsea',
                    'league': 'Premier League',
                    'date': '2025-07-06',
                    'time': '15:00'
                },
                'statistics': {
                    'possession': {'home': 55, 'away': 45},
                    'shots': {'home': 12, 'away': 8},
                    'shots_on_target': {'home': 5, 'away': 3},
                    'corners': {'home': 6, 'away': 4},
                    'fouls': {'home': 8, 'away': 12},
                    'cards': {'home': {'yellow': 2, 'red': 0}, 'away': {'yellow': 3, 'red': 1}}
                },
                'odds': {
                    'home_win': 2.10,
                    'draw': 3.40,
                    'away_win': 3.50,
                    'over_2_5': 1.85,
                    'under_2_5': 1.95,
                    'both_teams_score': 1.75
                },
                'head_to_head': {
                    'total_matches': 20,
                    'home_wins': 8,
                    'draws': 6,
                    'away_wins': 6,
                    'last_5_matches': ['W', 'D', 'L', 'W', 'D'],
                    'average_goals': {'home': 1.8, 'away': 1.4}
                },
                'analysis': {
                    'match_preview': {
                        'summary': 'Arsenal vs Chelsea - London Derby',
                        'historical_record': 'Kiegyensúlyozott múlt',
                        'recent_form': 'Arsenal jobb formában',
                        'key_players': ['Saka', 'Sterling', 'Ødegaard']
                    },
                    'statistical_analysis': {
                        'possession_advantage': 'Arsenal',
                        'attacking_strength': 'Arsenal előnyben',
                        'defensive_solidity': 'Kiegyensúlyozott',
                        'key_stats': 'Arsenal több lövéssel'
                    },
                    'odds_analysis': {
                        'market_sentiment': 'Arsenal kedvenc',
                        'value_bets': ['Arsenal győzelem', 'Mindkét csapat szerez gólt'],
                        'risk_assessment': 'Közepes',
                        'recommended_markets': ['1X2', 'Gólok száma']
                    },
                    'prediction': {
                        'predicted_result': 'Arsenal győzelem',
                        'confidence': 'Közepes',
                        'predicted_score': '2-1',
                        'probability': {'home': 48, 'draw': 29, 'away': 23}
                    },
                    'key_factors': [
                        'Hazai pálya előny',
                        'Jobb forma Arsenal részéről',
                        'London Derby rivalizálás',
                        'Fontos 3 pont a tabellán'
                    ]
                }
            }
        else:
            return {
                'match_data': {'home_team': 'N/A', 'away_team': 'N/A'},
                'statistics': {},
                'odds': {},
                'head_to_head': {},
                'analysis': {
                    'match_preview': {'summary': 'Demo elemzés'},
                    'statistical_analysis': {'attacking_strength': 'Átlagos'},
                    'odds_analysis': {'market_sentiment': 'Neutrális'},
                    'prediction': {'predicted_result': 'Döntetlen', 'confidence': 'Alacsony'},
                    'key_factors': ['Demo elemzés']
                }
            }
