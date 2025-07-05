"""
Központi adattárolás és adatmenedzsment
Kezeli a különböző ügynökök közötti adatcserét
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path

from ..utils.logger import Logger

logger = Logger().get_logger()

@dataclass
class MatchData:
    """Mérkőzés adatstruktúra"""
    id: str
    home_team: str
    away_team: str
    date: str
    time: str
    league: str
    status: str = "scheduled"

    # Alapvető adatok
    home_score: Optional[int] = None
    away_score: Optional[int] = None

    # Odds adatok
    odds_1x2: Optional[Dict] = None
    odds_over_under: Optional[Dict] = None
    odds_both_teams_score: Optional[Dict] = None

    # Statisztikák
    home_form: Optional[List[str]] = None
    away_form: Optional[List[str]] = None
    head_to_head: Optional[List[Dict]] = None

    # Piac adatok
    market_trends: Optional[Dict] = None
    betting_volume: Optional[Dict] = None

    # Hírek és social
    news_sentiment: Optional[float] = None
    social_buzz: Optional[Dict] = None

    # Metaadatok
    confidence_score: float = 0.0
    data_completeness: float = 0.0
    last_updated: str = ""

@dataclass
class AnalysisResult:
    """Elemzés eredmény struktúra"""
    match_id: str
    prediction_confidence: float
    key_factors: List[str]
    risk_assessment: Dict[str, float]
    value_bets: List[Dict]
    match_insights: Dict[str, Any]
    created_at: str

@dataclass
class BettingStrategy:
    """Fogadási stratégia struktúra"""
    match_id: str
    strategy_type: str  # 'safe', 'moderate', 'risky'
    recommended_bets: List[Dict]
    bankroll_allocation: Dict[str, float]
    expected_roi: float
    risk_level: str
    confidence: float
    reasoning: str
    created_at: str

class DataStorage:
    """
    Központi adattárolás és menedzsment osztály
    """

    def __init__(self):
        self.base_path = Path("data")
        self.base_path.mkdir(exist_ok=True)

        # Adatbázis fájlok
        self.matches_file = self.base_path / "matches.json"
        self.analysis_file = self.base_path / "analysis.json"
        self.strategies_file = self.base_path / "strategies.json"
        self.historical_file = self.base_path / "historical.json"

        # Memóriában tárolt adatok
        self.matches: Dict[str, MatchData] = {}
        self.analysis: Dict[str, AnalysisResult] = {}
        self.strategies: Dict[str, BettingStrategy] = {}

        # Betöltés
        self._load_data()

        logger.info("DataStorage inicializálva")

    def _load_data(self):
        """Adatok betöltése fájlokból"""
        try:
            # Mérkőzések betöltése
            if self.matches_file.exists():
                with open(self.matches_file, 'r', encoding='utf-8') as f:
                    matches_data = json.load(f)
                    self.matches = {
                        k: MatchData(**v) for k, v in matches_data.items()
                    }

            # Elemzések betöltése
            if self.analysis_file.exists():
                with open(self.analysis_file, 'r', encoding='utf-8') as f:
                    analysis_data = json.load(f)
                    self.analysis = {
                        k: AnalysisResult(**v) for k, v in analysis_data.items()
                    }

            # Stratégiák betöltése
            if self.strategies_file.exists():
                with open(self.strategies_file, 'r', encoding='utf-8') as f:
                    strategies_data = json.load(f)
                    self.strategies = {
                        k: BettingStrategy(**v) for k, v in strategies_data.items()
                    }

            logger.info(f"Betöltve: {len(self.matches)} meccs, {len(self.analysis)} elemzés, {len(self.strategies)} stratégia")

        except Exception as e:
            logger.error(f"Hiba az adatok betöltése során: {e}")

    def _save_data(self):
        """Adatok mentése fájlokba"""
        try:
            # Mérkőzések mentése
            matches_data = {k: asdict(v) for k, v in self.matches.items()}
            with open(self.matches_file, 'w', encoding='utf-8') as f:
                json.dump(matches_data, f, ensure_ascii=False, indent=2)

            # Elemzések mentése
            analysis_data = {k: asdict(v) for k, v in self.analysis.items()}
            with open(self.analysis_file, 'w', encoding='utf-8') as f:
                json.dump(analysis_data, f, ensure_ascii=False, indent=2)

            # Stratégiák mentése
            strategies_data = {k: asdict(v) for k, v in self.strategies.items()}
            with open(self.strategies_file, 'w', encoding='utf-8') as f:
                json.dump(strategies_data, f, ensure_ascii=False, indent=2)

            logger.info("Adatok sikeresen mentve")

        except Exception as e:
            logger.error(f"Hiba az adatok mentése során: {e}")

    def store_matches(self, matches: List[Dict]) -> int:
        """
        Mérkőzések tárolása
        """
        stored_count = 0

        for match_data in matches:
            try:
                # Egyedi azonosító generálása
                match_id = f"{match_data.get('home_team', '')}-{match_data.get('away_team', '')}-{match_data.get('date', '')}"
                match_id = match_id.replace(' ', '_').lower()

                # MatchData objektum létrehozása
                match = MatchData(
                    id=match_id,
                    home_team=match_data.get('home_team', ''),
                    away_team=match_data.get('away_team', ''),
                    date=match_data.get('date', ''),
                    time=match_data.get('time', ''),
                    league=match_data.get('league', ''),
                    status=match_data.get('status', 'scheduled'),
                    home_score=match_data.get('home_score'),
                    away_score=match_data.get('away_score'),
                    odds_1x2=match_data.get('odds_1x2'),
                    odds_over_under=match_data.get('odds_over_under'),
                    odds_both_teams_score=match_data.get('odds_both_teams_score'),
                    home_form=match_data.get('home_form'),
                    away_form=match_data.get('away_form'),
                    head_to_head=match_data.get('head_to_head'),
                    market_trends=match_data.get('market_trends'),
                    betting_volume=match_data.get('betting_volume'),
                    news_sentiment=match_data.get('news_sentiment'),
                    social_buzz=match_data.get('social_buzz'),
                    confidence_score=match_data.get('confidence_score', 0.0),
                    data_completeness=match_data.get('data_completeness', 0.0),
                    last_updated=datetime.now().isoformat()
                )

                self.matches[match_id] = match
                stored_count += 1

            except Exception as e:
                logger.error(f"Hiba a mérkőzés tárolása során: {e}")

        self._save_data()
        logger.info(f"{stored_count} mérkőzés tárolva")
        return stored_count

    def get_matches(self,
                   date: Optional[str] = None,
                   league: Optional[str] = None,
                   team: Optional[str] = None) -> List[MatchData]:
        """
        Mérkőzések lekérése szűrési feltételekkel
        """
        matches = list(self.matches.values())

        if date:
            matches = [m for m in matches if m.date == date]

        if league:
            matches = [m for m in matches if league.lower() in m.league.lower()]

        if team:
            matches = [m for m in matches if
                      team.lower() in m.home_team.lower() or
                      team.lower() in m.away_team.lower()]

        return matches

    def store_analysis(self, match_id: str, analysis: Dict) -> bool:
        """
        Elemzés tárolása
        """
        try:
            analysis_result = AnalysisResult(
                match_id=match_id,
                prediction_confidence=analysis.get('prediction_confidence', 0.0),
                key_factors=analysis.get('key_factors', []),
                risk_assessment=analysis.get('risk_assessment', {}),
                value_bets=analysis.get('value_bets', []),
                match_insights=analysis.get('match_insights', {}),
                created_at=datetime.now().isoformat()
            )

            self.analysis[match_id] = analysis_result
            self._save_data()

            logger.info(f"Elemzés tárolva: {match_id}")
            return True

        except Exception as e:
            logger.error(f"Hiba az elemzés tárolása során: {e}")
            return False

    def get_analysis(self, match_id: str) -> Optional[AnalysisResult]:
        """
        Elemzés lekérése
        """
        return self.analysis.get(match_id)

    def get_all_analysis(self) -> Dict[str, AnalysisResult]:
        """
        Összes elemzés lekérése
        """
        return self.analysis

    def store_strategy(self, match_id: str, strategy: Dict) -> bool:
        """
        Fogadási stratégia tárolása
        """
        try:
            betting_strategy = BettingStrategy(
                match_id=match_id,
                strategy_type=strategy.get('strategy_type', 'moderate'),
                recommended_bets=strategy.get('recommended_bets', []),
                bankroll_allocation=strategy.get('bankroll_allocation', {}),
                expected_roi=strategy.get('expected_roi', 0.0),
                risk_level=strategy.get('risk_level', 'medium'),
                confidence=strategy.get('confidence', 0.0),
                reasoning=strategy.get('reasoning', ''),
                created_at=datetime.now().isoformat()
            )

            self.strategies[match_id] = betting_strategy
            self._save_data()

            logger.info(f"Stratégia tárolva: {match_id}")
            return True

        except Exception as e:
            logger.error(f"Hiba a stratégia tárolása során: {e}")
            return False

    def get_strategy(self, match_id: str) -> Optional[BettingStrategy]:
        """
        Fogadási stratégia lekérése
        """
        return self.strategies.get(match_id)

    def get_all_strategies(self) -> Dict[str, BettingStrategy]:
        """
        Összes stratégia lekérése
        """
        return self.strategies

    def get_storage_stats(self) -> Dict[str, Any]:
        """
        Tárolási statisztikák
        """
        return {
            'total_matches': len(self.matches),
            'total_analysis': len(self.analysis),
            'total_strategies': len(self.strategies),
            'last_update': datetime.now().isoformat(),
            'data_size': {
                'matches': len(str(self.matches)),
                'analysis': len(str(self.analysis)),
                'strategies': len(str(self.strategies))
            }
        }

    def cleanup_old_data(self, days: int = 7):
        """
        Régi adatok törlése
        """
        cutoff_date = datetime.now() - timedelta(days=days)

        # Régi mérkőzések törlése
        old_matches = [
            mid for mid, match in self.matches.items()
            if datetime.fromisoformat(match.last_updated) < cutoff_date
        ]

        for match_id in old_matches:
            del self.matches[match_id]
            # Kapcsolódó elemzés és stratégia is törlődik
            if match_id in self.analysis:
                del self.analysis[match_id]
            if match_id in self.strategies:
                del self.strategies[match_id]

        self._save_data()
        logger.info(f"Törölt régi adatok: {len(old_matches)} mérkőzés")

    def save_complete_analysis(self, results: Dict, filename: str):
        """
        Teljes elemzés mentése JSON fájlba
        """
        try:
            output_dir = Path("output")
            output_dir.mkdir(exist_ok=True)

            filepath = output_dir / filename
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

            logger.info(f"Teljes elemzés mentve: {filepath}")

        except Exception as e:
            logger.error(f"Hiba a teljes elemzés mentése során: {e}")

    def export_to_csv(self, data_type: str = 'matches') -> str:
        """
        Adatok exportálása CSV formátumba
        """
        try:
            output_dir = Path("output")
            output_dir.mkdir(exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

            # Egyszerű CSV export pandas nélkül
            if data_type == 'matches':
                data = [asdict(match) for match in self.matches.values()]
                filename = f"matches_{timestamp}.csv"
            elif data_type == 'analysis':
                data = [asdict(analysis) for analysis in self.analysis.values()]
                filename = f"analysis_{timestamp}.csv"
            elif data_type == 'strategies':
                data = [asdict(strategy) for strategy in self.strategies.values()]
                filename = f"strategies_{timestamp}.csv"
            else:
                raise ValueError(f"Ismeretlen adattípus: {data_type}")

            filepath = output_dir / filename

            # Egyszerű CSV írás
            if data:
                import csv
                with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                    if data:
                        fieldnames = data[0].keys()
                        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(data)

            logger.info(f"CSV export kész: {filepath}")
            return str(filepath)

        except Exception as e:
            logger.error(f"Hiba a CSV export során: {e}")
            return ""

    def store_collected_data(self, scraped_data: Dict[str, Any]) -> bool:
        """
        Összegyűjtött adatok tárolása
        """
        try:
            # Meccsek tárolása
            matches = scraped_data.get('matches', [])
            if matches:
                stored_count = self.store_matches(matches)
                logger.info(f"Tárolva {stored_count} mérkőzés")

            # Odds adatok frissítése
            odds_data = scraped_data.get('odds', {})
            self._update_odds_data(odds_data)

            # Statisztikák frissítése
            statistics_data = scraped_data.get('statistics', {})
            self._update_statistics_data(statistics_data)

            # Hírek frissítése
            news_data = scraped_data.get('news', {})
            self._update_news_data(news_data)

            # Social adatok frissítése
            social_data = scraped_data.get('social', {})
            self._update_social_data(social_data)

            return True

        except Exception as e:
            logger.error(f"Hiba az összegyűjtött adatok tárolása során: {e}")
            return False

    def _update_odds_data(self, odds_data: Dict[str, Any]):
        """Odds adatok frissítése a meglévő meccsekben"""
        try:
            for match_id, odds in odds_data.items():
                if match_id in self.matches:
                    match = self.matches[match_id]
                    match.odds_1x2 = odds.get('1x2')
                    match.odds_over_under = odds.get('over_under')
                    match.odds_both_teams_score = odds.get('both_teams_score')
                    match.last_updated = datetime.now().isoformat()
        except Exception as e:
            logger.error(f"Hiba az odds adatok frissítése során: {e}")

    def _update_statistics_data(self, statistics_data: Dict[str, Any]):
        """Statisztikai adatok frissítése"""
        try:
            for match_id, stats in statistics_data.items():
                if match_id in self.matches:
                    match = self.matches[match_id]
                    match.home_form = stats.get('home_form')
                    match.away_form = stats.get('away_form')
                    match.head_to_head = stats.get('head_to_head')
                    match.last_updated = datetime.now().isoformat()
        except Exception as e:
            logger.error(f"Hiba a statisztikai adatok frissítése során: {e}")

    def _update_news_data(self, news_data: Dict[str, Any]):
        """Hírek adatok frissítése"""
        try:
            for match_id, news in news_data.items():
                if match_id in self.matches:
                    match = self.matches[match_id]
                    match.news_sentiment = news.get('sentiment')
                    match.last_updated = datetime.now().isoformat()
        except Exception as e:
            logger.error(f"Hiba a hírek adatok frissítése során: {e}")

    def _update_social_data(self, social_data: Dict[str, Any]):
        """Social adatok frissítése"""
        try:
            for match_id, social in social_data.items():
                if match_id in self.matches:
                    match = self.matches[match_id]
                    match.social_buzz = social.get('buzz')
                    match.last_updated = datetime.now().isoformat()
        except Exception as e:
            logger.error(f"Hiba a social adatok frissítése során: {e}")
