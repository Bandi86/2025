"""
Adatgyűjtő Ügynök - Intelligens adatgyűjtés több forrásból
"""
from typing import Dict, List, Any, Optional
import time
from datetime import datetime

from .intelligent_data_coordinator import IntelligentDataCoordinator
from ..utils.logger import Logger
from ..config import Config

class DataCollectorAgent:
    """
    Adatgyűjtő ügynök intelligens koordinátorral
    """

    def __init__(self):
        self.logger = Logger('data_collector_agent')
        self.config = Config()
        self.coordinator = IntelligentDataCoordinator()

    def collect_data(self, mode: str = 'comprehensive', custom_requirements: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Adatok gyűjtése intelligens koordinátorral

        Args:
            mode: Gyűjtési mód ('comprehensive', 'quick', 'matches_only', 'news_only')
            custom_requirements: Egyedi követelmények

        Returns:
            Dict: Összegyűjtött adatok
        """
        try:
            start_time = time.time()
            self.logger.info(f"Adatgyűjtés indítása - Mód: {mode}")

            # Követelmények meghatározása
            if custom_requirements:
                requirements = custom_requirements
            else:
                requirements = self.coordinator.get_data_collection_requirements(mode)

            # Adatok gyűjtése
            collected_data = self.coordinator.collect_comprehensive_data(requirements)

            # Metaadat hozzáadása
            collected_data.update({
                'collection_mode': mode,
                'collection_duration': time.time() - start_time,
                'collection_status': 'success' if collected_data.get('total_items', 0) > 0 else 'partial',
                'agent': 'data_collector_agent'
            })

            self.logger.info(f"Adatgyűjtés befejezve - Időtartam: {collected_data['collection_duration']:.2f}s")

            return collected_data

        except Exception as e:
            self.logger.error(f"Hiba az adatgyűjtés során: {str(e)}")
            return self._get_fallback_data()

    def collect_matches_only(self) -> List[Dict[str, Any]]:
        """
        Csak mérkőzések gyűjtése

        Returns:
            List[Dict]: Mérkőzések listája
        """
        try:
            result = self.collect_data('matches_only')
            return result.get('matches', [])

        except Exception as e:
            self.logger.error(f"Hiba a mérkőzések gyűjtésében: {str(e)}")
            return []

    def collect_news_only(self) -> List[Dict[str, Any]]:
        """
        Csak hírek gyűjtése

        Returns:
            List[Dict]: Hírek listája
        """
        try:
            result = self.collect_data('news_only')
            return result.get('news', [])

        except Exception as e:
            self.logger.error(f"Hiba a hírek gyűjtésében: {str(e)}")
            return []

    def collect_team_data(self, team_names: List[str]) -> Dict[str, Any]:
        """
        Csapat adatok gyűjtése

        Args:
            team_names: Csapat nevek listája

        Returns:
            Dict: Csapat adatok
        """
        try:
            custom_requirements = self.coordinator.get_data_collection_requirements('comprehensive')
            custom_requirements['teams'] = team_names
            custom_requirements['collect_matches'] = False
            custom_requirements['collect_news'] = False
            custom_requirements['collect_rss_news'] = False
            custom_requirements['collect_api_data'] = False

            result = self.collect_data('comprehensive', custom_requirements)
            return result.get('team_data', {})

        except Exception as e:
            self.logger.error(f"Hiba a csapat adatok gyűjtésében: {str(e)}")
            return {}

    def collect_league_data(self, league_name: str = 'Premier League') -> Dict[str, Any]:
        """
        Liga adatok gyűjtése

        Args:
            league_name: Liga neve

        Returns:
            Dict: Liga adatok
        """
        try:
            custom_requirements = self.coordinator.get_data_collection_requirements('comprehensive')
            custom_requirements['league'] = league_name
            custom_requirements['collect_matches'] = False
            custom_requirements['collect_news'] = False
            custom_requirements['collect_rss_news'] = False
            custom_requirements['collect_api_data'] = False
            custom_requirements['collect_team_data'] = False

            result = self.collect_data('comprehensive', custom_requirements)
            return result.get('league_data', {})

        except Exception as e:
            self.logger.error(f"Hiba a liga adatok gyűjtésében: {str(e)}")
            return {}

    def get_data_quality_report(self, collected_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adatok minőségi jelentésének készítése

        Args:
            collected_data: Összegyűjtött adatok

        Returns:
            Dict: Minőségi jelentés
        """
        try:
            matches = collected_data.get('matches', [])
            news = collected_data.get('news', [])

            # Forrás analízis
            sources_used = collected_data.get('sources_used', [])
            source_coverage = {
                'google_search': any('google' in source for source in sources_used),
                'wikipedia': any('wikipedia' in source for source in sources_used),
                'rss_feeds': any('rss' in source for source in sources_used),
                'free_apis': any('api' in source for source in sources_used)
            }

            # Adatteljesség
            completeness = {
                'matches_count': len(matches),
                'news_count': len(news),
                'team_data_available': bool(collected_data.get('team_data')),
                'league_data_available': bool(collected_data.get('league_data'))
            }

            # Minőségi metrikák
            quality_metrics = {
                'overall_score': collected_data.get('quality_score', 0),
                'confidence_scores': {
                    'matches': [m.get('confidence', 0) for m in matches],
                    'news': [n.get('confidence', 0) for n in news]
                },
                'data_freshness': self._evaluate_data_freshness(collected_data),
                'source_diversity': len(sources_used)
            }

            return {
                'timestamp': datetime.now().isoformat(),
                'source_coverage': source_coverage,
                'completeness': completeness,
                'quality_metrics': quality_metrics,
                'recommendations': self._generate_recommendations(source_coverage, completeness, quality_metrics)
            }

        except Exception as e:
            self.logger.error(f"Hiba a minőségi jelentés készítésében: {str(e)}")
            return {}

    def _evaluate_data_freshness(self, collected_data: Dict[str, Any]) -> float:
        """
        Adatok frissességének értékelése

        Args:
            collected_data: Összegyűjtött adatok

        Returns:
            float: Frissesség pontszám (0-1)
        """
        try:
            collection_time = collected_data.get('collection_timestamp', time.time())
            current_time = time.time()
            age_hours = (current_time - collection_time) / 3600

            # Minél frissebb, annál jobb (exponenciális csökkenés)
            freshness_score = max(0, 1 - (age_hours / 24))  # 24 óra alatt 0-ra csökken

            return freshness_score

        except Exception as e:
            self.logger.warning(f"Hiba a frissesség értékelésében: {str(e)}")
            return 0.5

    def _generate_recommendations(self, source_coverage: Dict[str, bool],
                                 completeness: Dict[str, Any],
                                 quality_metrics: Dict[str, Any]) -> List[str]:
        """
        Javaslatok generálása az adatgyűjtés javításához

        Args:
            source_coverage: Forrás lefedettség
            completeness: Adatok teljesség
            quality_metrics: Minőségi metrikák

        Returns:
            List[str]: Javaslatok listája
        """
        recommendations = []

        # Forrás lefedettség ellenőrzése
        if not source_coverage.get('google_search'):
            recommendations.append("Google keresés aktiválása jobb adatfedéshez")

        if not source_coverage.get('wikipedia'):
            recommendations.append("Wikipedia adatok hozzáadása a megbízhatóság növeléséhez")

        if not source_coverage.get('rss_feeds'):
            recommendations.append("RSS feedek használata friss hírekhez")

        if not source_coverage.get('free_apis'):
            recommendations.append("Ingyenes API-k bevonása strukturált adatokhoz")

        # Adatok teljesség ellenőrzése
        if completeness.get('matches_count', 0) < 5:
            recommendations.append("Több mérkőzés adat szükséges a teljesebb képhez")

        if completeness.get('news_count', 0) < 3:
            recommendations.append("Több sport hír gyűjtése javasolt")

        # Minőségi metrikák ellenőrzése
        overall_score = quality_metrics.get('overall_score', 0)
        if overall_score < 0.5:
            recommendations.append("Adatok minőségének javítása szükséges")

        if quality_metrics.get('source_diversity', 0) < 2:
            recommendations.append("Több forrás bevonása a megbízhatóság érdekében")

        return recommendations

    def _get_fallback_data(self) -> Dict[str, Any]:
        """
        Fallback adatok, ha minden más sikertelen

        Returns:
            Dict: Alapértelmezett adatok
        """
        self.logger.warning("Fallback adatok használata")

        return {
            'matches': [],
            'news': [],
            'team_data': {},
            'league_data': {},
            'quality_score': 0.1,
            'sources_used': ['fallback'],
            'collection_timestamp': time.time(),
            'total_items': 0,
            'collection_mode': 'fallback',
            'collection_duration': 0,
            'collection_status': 'failed',
            'agent': 'data_collector_agent'
        }
