"""
Intelligens Adatgyűjtő Coordinator - Több forrás koordinálása
"""
from typing import Dict, List, Optional, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from .google_search_agent import GoogleSearchAgent
from .enhanced_google_search_agent import EnhancedGoogleSearchAgent
from .playwright_google_search_agent import PlaywrightGoogleSearchAgent
from .wikipedia_agent import WikipediaAgent
from .rss_data_collector import RSSDataCollector
from .free_api_collector import FreeAPICollector
from ..utils.logger import Logger
from ..config import Config

class IntelligentDataCoordinator:
    """
    Intelligens adatgyűjtő coordinator, ami több forrást kombinál
    """

    def __init__(self):
        self.logger = Logger('intelligent_data_coordinator')
        self.config = Config()

        # Adatgyűjtő ügynökök inicializálása
        self.google_agent = GoogleSearchAgent()
        self.enhanced_google_agent = EnhancedGoogleSearchAgent()
        self.playwright_agent = PlaywrightGoogleSearchAgent()
        self.wikipedia_agent = WikipediaAgent()
        self.rss_collector = RSSDataCollector()
        self.api_collector = FreeAPICollector()

        # Forrás prioritások és megbízhatóság
        self.source_priorities = {
            'playwright_google': 0.95,
            'enhanced_google': 0.85,
            'wikipedia': 0.9,
            'google_search': 0.7,
            'rss_feeds': 0.6,
            'free_apis': 0.8
        }

        self.max_workers = 4  # Párhuzamos munkák száma

    def collect_comprehensive_data(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Átfogó adatgyűjtés több forrásból

        Args:
            requirements: Adatgyűjtési követelmények

        Returns:
            Dict: Összegyűjtött adatok
        """
        try:
            self.logger.info("Intelligens adatgyűjtés indítása...")

            # Párhuzamos adatgyűjtés
            all_data = self._parallel_data_collection(requirements)

            # Adatok kombinálása és tisztítása
            combined_data = self._combine_and_clean_data(all_data)

            # Minőségértékelés
            quality_score = self._evaluate_data_quality(combined_data)

            # Eredmény összeállítása
            result = {
                'matches': combined_data.get('matches', []),
                'news': combined_data.get('news', []),
                'team_data': combined_data.get('team_data', {}),
                'league_data': combined_data.get('league_data', {}),
                'quality_score': quality_score,
                'sources_used': combined_data.get('sources_used', []),
                'collection_timestamp': time.time(),
                'total_items': len(combined_data.get('matches', [])) + len(combined_data.get('news', []))
            }

            self.logger.info(f"Adatgyűjtés befejezve. Minőség: {quality_score:.2f}, Elemek: {result['total_items']}")

            return result

        except Exception as e:
            self.logger.error(f"Hiba az intelligens adatgyűjtés során: {str(e)}")
            return self._fallback_data()

    def _parallel_data_collection(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Párhuzamos adatgyűjtés több forrásból

        Args:
            requirements: Követelmények

        Returns:
            Dict: Összegyűjtött adatok
        """
        all_data = {'matches': [], 'news': [], 'team_data': {}, 'league_data': {}, 'sources_used': []}

        # Feladatok definiálása
        tasks = []

        # Google Search feladatok
        if requirements.get('collect_matches', True):
            tasks.append(('google_matches', self._collect_google_matches, requirements))

        if requirements.get('collect_news', True):
            tasks.append(('google_news', self._collect_google_news, requirements))

        # Wikipedia feladatok
        if requirements.get('collect_league_data', True):
            tasks.append(('wikipedia_league', self._collect_wikipedia_league, requirements))

        if requirements.get('collect_team_data', True):
            tasks.append(('wikipedia_teams', self._collect_wikipedia_teams, requirements))

        # RSS feladatok
        if requirements.get('collect_rss_news', True):
            tasks.append(('rss_news', self._collect_rss_news, requirements))

        # Free API feladatok
        if requirements.get('collect_api_data', True):
            tasks.append(('free_api', self._collect_free_api_data, requirements))

        # Párhuzamos végrehajtás
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Feladatok beküldése
            future_to_task = {
                executor.submit(task_func, task_requirements): task_name
                for task_name, task_func, task_requirements in tasks
            }

            # Eredmények összegyűjtése
            for future in as_completed(future_to_task):
                task_name = future_to_task[future]
                try:
                    result = future.result(timeout=30)  # 30s timeout
                    if result:
                        self._merge_task_result(all_data, task_name, result)
                        all_data['sources_used'].append(task_name)
                        self.logger.info(f"Feladat '{task_name}' sikeresen befejezve")
                    else:
                        self.logger.warning(f"Feladat '{task_name}' nem adott vissza adatokat")

                except Exception as e:
                    self.logger.error(f"Hiba a '{task_name}' feladat végrehajtásában: {str(e)}")

        return all_data

    def _collect_google_matches(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Google keresés mérkőzésekhez"""
        try:
            query = requirements.get('search_query', 'football matches today')
            matches = self.google_agent.search_football_matches(query)
            self.logger.info(f"Google: {len(matches)} mérkőzés találva")
            return matches
        except Exception as e:
            self.logger.error(f"Hiba a Google mérkőzés keresésben: {str(e)}")
            return []

    def _collect_google_news(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Google keresés hírekhez"""
        try:
            query = requirements.get('news_query', 'football news today')
            news = self.google_agent.search_sports_news(query)
            self.logger.info(f"Google: {len(news)} hír találva")
            return news
        except Exception as e:
            self.logger.error(f"Hiba a Google hírek keresésben: {str(e)}")
            return []

    def _collect_wikipedia_league(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Wikipedia liga adatok"""
        try:
            league = requirements.get('league', 'Premier League')
            data = self.wikipedia_agent.get_current_season_data(league)
            self.logger.info(f"Wikipedia: Liga adatok - {league}")
            return data
        except Exception as e:
            self.logger.error(f"Hiba a Wikipedia liga adatok gyűjtésében: {str(e)}")
            return {}

    def _collect_wikipedia_teams(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Wikipedia csapat adatok"""
        try:
            teams = requirements.get('teams', ['Manchester United', 'Arsenal', 'Chelsea'])
            team_data = {}

            for team in teams[:3]:  # Maximum 3 csapat
                data = self.wikipedia_agent.get_team_data(team)
                if data:
                    team_data[team] = data

            self.logger.info(f"Wikipedia: {len(team_data)} csapat adata")
            return team_data
        except Exception as e:
            self.logger.error(f"Hiba a Wikipedia csapat adatok gyűjtésében: {str(e)}")
            return {}

    def _collect_rss_news(self, requirements: Dict[str, Any]) -> List[Dict[str, Any]]:
        """RSS hírek gyűjtése"""
        try:
            news = self.rss_collector.collect_all_feeds()
            self.logger.info(f"RSS: {len(news)} hír találva")
            return news
        except Exception as e:
            self.logger.error(f"Hiba az RSS hírek gyűjtésében: {str(e)}")
            return []

    def _collect_free_api_data(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Free API adatok gyűjtése"""
        try:
            matches = self.api_collector.collect_matches()
            news = self.api_collector.collect_news()

            self.logger.info(f"Free API: {len(matches)} mérkőzés, {len(news)} hír")
            return {
                'matches': matches,
                'news': news
            }
        except Exception as e:
            self.logger.error(f"Hiba a Free API adatok gyűjtésében: {str(e)}")
            return {'matches': [], 'news': []}

    def _merge_task_result(self, all_data: Dict[str, Any], task_name: str, result: Any):
        """
        Feladat eredményének beillesztése a fő adatstruktúrába

        Args:
            all_data: Fő adatstruktúra
            task_name: Feladat neve
            result: Feladat eredménye
        """
        try:
            if task_name in ['google_matches']:
                all_data['matches'].extend(result)
            elif task_name in ['google_news', 'rss_news']:
                all_data['news'].extend(result)
            elif task_name == 'wikipedia_league':
                all_data['league_data'] = result
            elif task_name == 'wikipedia_teams':
                all_data['team_data'] = result
            elif task_name == 'free_api':
                all_data['matches'].extend(result.get('matches', []))
                all_data['news'].extend(result.get('news', []))

        except Exception as e:
            self.logger.error(f"Hiba a '{task_name}' eredmény beillesztésében: {str(e)}")

    def _combine_and_clean_data(self, all_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adatok kombinálása és tisztítása

        Args:
            all_data: Nyers adatok

        Returns:
            Dict: Tisztított adatok
        """
        try:
            # Duplikátumok eltávolítása
            unique_matches = self._remove_duplicate_matches(all_data['matches'])
            unique_news = self._remove_duplicate_news(all_data['news'])

            # Adatok rendezése
            sorted_matches = sorted(unique_matches, key=lambda x: x.get('confidence', 0), reverse=True)
            sorted_news = sorted(unique_news, key=lambda x: x.get('confidence', 0), reverse=True)

            # Minőségi szűrés
            quality_matches = [m for m in sorted_matches if m.get('confidence', 0) > 0.3]
            quality_news = [n for n in sorted_news if n.get('confidence', 0) > 0.3]

            return {
                'matches': quality_matches[:20],  # Top 20 mérkőzés
                'news': quality_news[:15],        # Top 15 hír
                'team_data': all_data['team_data'],
                'league_data': all_data['league_data'],
                'sources_used': all_data['sources_used']
            }

        except Exception as e:
            self.logger.error(f"Hiba az adatok kombinálásában: {str(e)}")
            return all_data

    def _remove_duplicate_matches(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Duplikált mérkőzések eltávolítása"""
        seen = set()
        unique_matches = []

        for match in matches:
            key = f"{match.get('home_team', '')}-{match.get('away_team', '')}-{match.get('date', '')}"
            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def _remove_duplicate_news(self, news: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Duplikált hírek eltávolítása"""
        seen = set()
        unique_news = []

        for article in news:
            key = article.get('title', '')[:50]  # Első 50 karakter alapján
            if key not in seen:
                seen.add(key)
                unique_news.append(article)

        return unique_news

    def _evaluate_data_quality(self, data: Dict[str, Any]) -> float:
        """
        Adatok minőségének értékelése

        Args:
            data: Adatok

        Returns:
            float: Minőségi pontszám (0-1)
        """
        try:
            total_score = 0
            weight_sum = 0

            # Mérkőzések minősége
            if data.get('matches'):
                match_scores = [m.get('confidence', 0) for m in data['matches']]
                avg_match_score = sum(match_scores) / len(match_scores) if match_scores else 0
                total_score += avg_match_score * 0.4  # 40% súly
                weight_sum += 0.4

            # Hírek minősége
            if data.get('news'):
                news_scores = [n.get('confidence', 0) for n in data['news']]
                avg_news_score = sum(news_scores) / len(news_scores) if news_scores else 0
                total_score += avg_news_score * 0.3  # 30% súly
                weight_sum += 0.3

            # Csapat adatok minősége
            if data.get('team_data'):
                team_score = min(1.0, len(data['team_data']) / 3)  # Max 3 csapat
                total_score += team_score * 0.2  # 20% súly
                weight_sum += 0.2

            # Liga adatok minősége
            if data.get('league_data'):
                league_score = 1.0 if data['league_data'] else 0
                total_score += league_score * 0.1  # 10% súly
                weight_sum += 0.1

            return total_score / weight_sum if weight_sum > 0 else 0

        except Exception as e:
            self.logger.error(f"Hiba a minőségértékelésben: {str(e)}")
            return 0.5

    def _fallback_data(self) -> Dict[str, Any]:
        """
        Fallback adatok, ha minden más sikertelen

        Returns:
            Dict: Alapértelmezett adatok
        """
        self.logger.warning("Fallback adatok használata")

        from ..data.demo_data import DemoData
        demo = DemoData()

        return {
            'matches': demo.get_demo_matches(),
            'news': demo.get_demo_news(),
            'team_data': {},
            'league_data': {},
            'quality_score': 0.3,
            'sources_used': ['demo_data'],
            'collection_timestamp': time.time(),
            'total_items': 10
        }

    def get_data_collection_requirements(self, mode: str = 'comprehensive') -> Dict[str, Any]:
        """
        Adatgyűjtési követelmények generálása

        Args:
            mode: Gyűjtési mód ('comprehensive', 'quick', 'matches_only', 'news_only')

        Returns:
            Dict: Követelmények
        """
        base_requirements = {
            'collect_matches': True,
            'collect_news': True,
            'collect_league_data': True,
            'collect_team_data': True,
            'collect_rss_news': True,
            'collect_api_data': True,
            'search_query': 'football matches today results',
            'news_query': 'football news today',
            'league': 'Premier League',
            'teams': ['Manchester United', 'Arsenal', 'Chelsea', 'Liverpool', 'Manchester City']
        }

        if mode == 'quick':
            base_requirements.update({
                'collect_team_data': False,
                'collect_league_data': False,
                'teams': ['Manchester United', 'Arsenal']
            })
        elif mode == 'matches_only':
            base_requirements.update({
                'collect_news': False,
                'collect_rss_news': False,
                'collect_team_data': False,
                'collect_league_data': False
            })
        elif mode == 'news_only':
            base_requirements.update({
                'collect_matches': False,
                'collect_api_data': False,
                'collect_team_data': False,
                'collect_league_data': False
            })

        return base_requirements
