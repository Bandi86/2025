"""
Adatfeldolgozó modul
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging

class DataProcessor:
    """
    Sportadatok feldolgozása és elemzése
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def process_matches(self, raw_matches: List[Dict]) -> List[Dict]:
        """
        Nyers meccs adatok feldolgozása és tisztítása
        """
        if not raw_matches:
            return []

        # DataFrame-é konvertálás
        try:
            df = pd.DataFrame(raw_matches)

            # Duplikációk eltávolítása
            df = self._remove_duplicates(df)

            # Adatok tisztítása
            df = self._clean_data(df)

            # Kiegészítő adatok hozzáadása
            df = self._enrich_data(df)

            # Prioritás alapján rendezés
            df = self._sort_by_priority(df)

            return df.to_dict('records')

        except Exception as e:
            self.logger.error(f"Adatfeldolgozási hiba: {e}")
            return raw_matches

    def _remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Duplikált meccsek eltávolítása
        """
        # Egyedi kulcs létrehozása
        df['unique_key'] = (
            df['home_team'].str.lower().str.replace(' ', '_') + '_' +
            df['away_team'].str.lower().str.replace(' ', '_') + '_' +
            df['date'].astype(str)
        )

        # Duplikációk eltávolítása, de az API forrásokat előnyben részesítjük
        df['priority'] = df['source'].map({
            'Football-Data.org': 1,
            'The Odds API': 2,
            'Sports Data API': 3,
            'ESPN': 4,
            'BBC Sport': 5,
            'Sky Sports': 6
        }).fillna(10)

        # Legkisebb priority érték megtartása
        df = df.sort_values('priority').drop_duplicates('unique_key', keep='first')

        return df.drop(['unique_key', 'priority'], axis=1)

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Adatok tisztítása és normalizálása
        """
        # Csapatnevek normalizálása
        df['home_team'] = df['home_team'].str.strip().str.title()
        df['away_team'] = df['away_team'].str.strip().str.title()

        # Liga nevek tisztítása
        df['league'] = df['league'].str.strip().str.title()

        # Időpontok normalizálása
        df['time'] = df['time'].fillna('TBD')

        # Hiányzó értékek kezelése
        df = df.fillna({
            'status': 'scheduled',
            'odds_home': 0.0,
            'odds_away': 0.0,
            'odds_draw': 0.0
        })

        return df

    def _enrich_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Adatok kiegészítése számított mezőkkel
        """
        # Meccs fontossági pontszám
        df['importance_score'] = self._calculate_importance_score(df)

        # Liga kategorizálás
        df['league_tier'] = df['league'].map(self._get_league_tier)

        # Időpont kategorizálás
        df['time_category'] = df['time'].apply(self._categorize_time)

        # Odds elemzés
        df['odds_analysis'] = df.apply(self._analyze_odds, axis=1)

        return df

    def _calculate_importance_score(self, df: pd.DataFrame) -> pd.Series:
        """
        Meccs fontossági pontszám számítása
        """
        score = pd.Series(0, index=df.index)

        # Liga alapú pontszám
        league_scores = {
            'Premier League': 100,
            'Champions League': 95,
            'La Liga': 90,
            'Serie A': 85,
            'Bundesliga': 85,
            'Ligue 1': 80,
            'Europa League': 75,
            'NBA': 90,
            'NFL': 95,
            'NHL': 70,
            'MLB': 70
        }

        for league, points in league_scores.items():
            score[df['league'].str.contains(league, case=False, na=False)] += points

        # Alapértelmezett pontszám
        score[score == 0] = 50

        return score

    def _get_league_tier(self, league: str) -> str:
        """
        Liga szintjének meghatározása
        """
        if not league:
            return 'unknown'

        tier_1 = ['Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'NBA', 'NFL']
        tier_2 = ['Ligue 1', 'Europa League', 'Championship', 'NHL', 'MLB']

        league_lower = league.lower()

        for t1_league in tier_1:
            if t1_league.lower() in league_lower:
                return 'tier_1'

        for t2_league in tier_2:
            if t2_league.lower() in league_lower:
                return 'tier_2'

        return 'tier_3'

    def _categorize_time(self, time_str: str) -> str:
        """
        Időpont kategorizálás
        """
        if not time_str or time_str == 'TBD':
            return 'unknown'

        try:
            # Egyszerű időpont parsing
            if ':' in time_str:
                hour = int(time_str.split(':')[0])

                if 6 <= hour < 12:
                    return 'morning'
                elif 12 <= hour < 18:
                    return 'afternoon'
                elif 18 <= hour < 22:
                    return 'evening'
                else:
                    return 'night'

        except Exception:
            pass

        return 'unknown'

    def _analyze_odds(self, row: pd.Series) -> Dict:
        """
        Odds elemzés
        """
        analysis = {
            'favorite': 'unknown',
            'underdog': 'unknown',
            'close_match': False,
            'high_scoring_expected': False
        }

        try:
            home_odds = float(row.get('odds_home', 0))
            away_odds = float(row.get('odds_away', 0))
            draw_odds = float(row.get('odds_draw', 0))

            if home_odds > 0 and away_odds > 0:
                if home_odds < away_odds:
                    analysis['favorite'] = 'home'
                    analysis['underdog'] = 'away'
                elif away_odds < home_odds:
                    analysis['favorite'] = 'away'
                    analysis['underdog'] = 'home'

                # Szoros meccs (odds különbség < 0.5)
                if abs(home_odds - away_odds) < 0.5:
                    analysis['close_match'] = True

                # Gólgazdag meccs várható (alacsony odds)
                if (home_odds + away_odds) / 2 < 2.5:
                    analysis['high_scoring_expected'] = True

        except Exception as e:
            self.logger.warning(f"Odds elemzési hiba: {e}")

        return analysis

    def _sort_by_priority(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Meccsek prioritás szerinti rendezése
        """
        # Rendezési szempontok: fontossági pontszám, liga szint, időpont
        df = df.sort_values([
            'importance_score',
            'league_tier',
            'time'
        ], ascending=[False, True, True])

        return df.reset_index(drop=True)

    def analyze_match(self, match_data: Dict, stats: Dict, odds: Dict, head_to_head: Dict) -> Dict:
        """
        Egy meccs részletes elemzése
        """
        analysis = {
            'match_preview': self._generate_match_preview(match_data, head_to_head),
            'statistical_analysis': self._analyze_statistics(stats),
            'odds_analysis': self._detailed_odds_analysis(odds),
            'prediction': self._generate_prediction(match_data, stats, odds, head_to_head),
            'key_factors': self._identify_key_factors(match_data, stats, odds, head_to_head)
        }

        return analysis

    def _generate_match_preview(self, match_data: Dict, head_to_head: Dict) -> Dict:
        """
        Meccs előnézet generálása
        """
        return {
            'summary': f"{match_data.get('home_team', 'N/A')} vs {match_data.get('away_team', 'N/A')}",
            'historical_record': head_to_head,
            'recent_form': 'Nincs adat',
            'key_players': []
        }

    def _analyze_statistics(self, stats: Dict) -> Dict:
        """
        Statisztikák elemzése
        """
        return {
            'possession_advantage': 'balanced',
            'attacking_strength': 'average',
            'defensive_solidity': 'average',
            'key_stats': stats
        }

    def _detailed_odds_analysis(self, odds: Dict) -> Dict:
        """
        Részletes odds elemzés
        """
        return {
            'market_sentiment': 'neutral',
            'value_bets': [],
            'risk_assessment': 'medium',
            'recommended_markets': []
        }

    def _generate_prediction(self, match_data: Dict, stats: Dict, odds: Dict, head_to_head: Dict) -> Dict:
        """
        Meccs eredmény előrejelzés
        """
        return {
            'predicted_result': 'draw',
            'confidence': 'low',
            'predicted_score': '1-1',
            'probability': {'home': 33, 'draw': 34, 'away': 33}
        }

    def _identify_key_factors(self, match_data: Dict, stats: Dict, odds: Dict, head_to_head: Dict) -> List[str]:
        """
        Kulcs tényezők azonosítása
        """
        factors = []

        # Liga fontossága
        if match_data.get('league') in ['Premier League', 'Champions League', 'La Liga']:
            factors.append('Magas szintű liga')

        # Korábbi találkozók
        if head_to_head.get('total_matches', 0) > 0:
            factors.append('Korábbi találkozók alapján')

        # Odds alapján
        if odds.get('home_win', 0) < 2.0:
            factors.append('Hazai favorit')
        elif odds.get('away_win', 0) < 2.0:
            factors.append('Vendég favorit')

        return factors if factors else ['Általános elemzés']
