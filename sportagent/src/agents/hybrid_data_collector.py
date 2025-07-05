"""
Hibrid Adatgyűjtő - Kombinált megközelítés
Több forrás és módszer kombinálása a legjobb eredményekért
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import json
import random

from ..utils.logger import Logger
from ..data.data_storage import DataStorage

logger = Logger().get_logger()

class HybridDataCollector:
    """
    Hibrid adatgyűjtő rendszer
    Kombinálja RSS, Free API, Modern Scraping és Demo adatokat
    """

    def __init__(self, data_storage: DataStorage):
        self.data_storage = data_storage
        self.logger = Logger().get_logger()

        # Módszerek súlyozása
        self.method_weights = {
            'realistic_demo': 1.0,     # Mindig elérhető
            'free_api': 0.8,           # Ha működik
            'rss_feeds': 0.6,          # Ha elérhető
            'modern_scraping': 0.4     # Backup
        }

        logger.info("Hibrid Data Collector inicializálva")

    def collect_comprehensive_data(self,
                                 date: Optional[str] = None,
                                 leagues: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Átfogó adatgyűjtés minden elérhető módszerrel
        """
        logger.info(f"Hibrid adatgyűjtés kezdése: {date}")

        target_date = self._parse_date(date) if date else (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        target_leagues = leagues or []

        results = {
            'matches': [],
            'sources_used': [],
            'data_quality': {},
            'last_updated': datetime.now().isoformat(),
            'method_success': {}
        }

        # 1. REALISZTIKUS DEMO ADATOK (mindig működik)
        demo_data = self._collect_realistic_demo_data(target_date, target_leagues)
        if demo_data:
            results['matches'].extend(demo_data['matches'])
            results['sources_used'].append('realistic_demo')
            results['method_success']['realistic_demo'] = True
            logger.info(f"✅ Realisztikus demo: {len(demo_data['matches'])} meccs")

        # 2. FREE API PRÓBÁLKOZÁS
        try:
            api_data = self._try_free_apis(target_date, target_leagues)
            if api_data and api_data.get('matches'):
                results['matches'].extend(api_data['matches'])
                results['sources_used'].extend(api_data.get('sources_used', []))
                results['method_success']['free_api'] = True
                logger.info(f"✅ Free API: {len(api_data['matches'])} meccs")
        except Exception as e:
            logger.warning(f"Free API hiba: {e}")
            results['method_success']['free_api'] = False

        # 3. RSS FEEDS PRÓBÁLKOZÁS
        try:
            rss_data = self._try_rss_feeds(target_date, target_leagues)
            if rss_data and rss_data.get('matches'):
                results['matches'].extend(rss_data['matches'])
                results['sources_used'].append('rss_feeds')
                results['method_success']['rss_feeds'] = True
                logger.info(f"✅ RSS feeds: {len(rss_data['matches'])} meccs")
        except Exception as e:
            logger.warning(f"RSS feeds hiba: {e}")
            results['method_success']['rss_feeds'] = False

        # 4. MODERN SCRAPING BACKUP
        try:
            scraping_data = self._try_modern_scraping(target_date, target_leagues)
            if scraping_data and scraping_data.get('matches'):
                results['matches'].extend(scraping_data['matches'])
                results['sources_used'].append('modern_scraping')
                results['method_success']['modern_scraping'] = True
                logger.info(f"✅ Modern scraping: {len(scraping_data['matches'])} meccs")
        except Exception as e:
            logger.warning(f"Modern scraping hiba: {e}")
            results['method_success']['modern_scraping'] = False

        # ADATOK KOMBINÁLÁSA ÉS TISZTÍTÁSA
        cleaned_matches = self._combine_and_clean_matches(results['matches'])
        results['matches'] = cleaned_matches

        # ADATOK MINŐSÉGÉNEK ÉRTÉKELÉSE
        results['data_quality'] = self._assess_data_quality(cleaned_matches, results['method_success'])

        # TÁROLÁS
        if cleaned_matches:
            stored_count = self.data_storage.store_matches(cleaned_matches)
            logger.info(f"Tárolva {stored_count} mérkőzés")

        logger.info(f"Hibrid adatgyűjtés befejezve: {len(cleaned_matches)} meccs")
        return results

    def _collect_realistic_demo_data(self, target_date: str, leagues: List[str]) -> Dict[str, Any]:
        """
        Realisztikus demo adatok generálása
        Valódi csapatok, ligák, odds-ok
        """
        logger.info("Realisztikus demo adatok generálása...")

        # Valódi ligák és csapatok
        league_teams = {
            'Premier League': [
                'Arsenal', 'Chelsea', 'Liverpool', 'Manchester United', 'Manchester City',
                'Tottenham', 'Newcastle United', 'Brighton', 'Aston Villa', 'West Ham United',
                'Crystal Palace', 'Fulham', 'Brentford', 'Wolves', 'Everton'
            ],
            'La Liga': [
                'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia',
                'Real Sociedad', 'Villarreal', 'Athletic Bilbao', 'Real Betis', 'Osasuna'
            ],
            'Serie A': [
                'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'AS Roma',
                'Lazio', 'Atalanta', 'Fiorentina', 'Torino', 'Bologna'
            ],
            'Bundesliga': [
                'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
                'Eintracht Frankfurt', 'VfL Wolfsburg', 'SC Freiburg', 'Union Berlin'
            ],
            'Ligue 1': [
                'PSG', 'Marseille', 'Lyon', 'Monaco', 'Nice', 'Lille', 'Rennes', 'Nantes'
            ]
        }

        matches = []

        # Ligák szűrése ha megadva
        if leagues:
            filtered_leagues = {k: v for k, v in league_teams.items()
                              if any(league.lower() in k.lower() for league in leagues)}
            if filtered_leagues:
                league_teams = filtered_leagues

        # Mérkőzések generálása minden ligából
        for league, teams in league_teams.items():
            # Véletlenszerű meccsek generálása
            num_matches = random.randint(2, 4)  # Liga alapján 2-4 meccs

            for _ in range(num_matches):
                home_team = random.choice(teams)
                away_team = random.choice([t for t in teams if t != home_team])

                # Realisztikus időpontok
                hours = ['12:30', '15:00', '17:30', '20:00', '21:00']
                match_time = random.choice(hours)

                # Realisztikus odds generálása
                odds = self._generate_realistic_odds(home_team, away_team, league)

                # Forma és statisztikák
                form_data = self._generate_realistic_form(home_team, away_team)

                match = {
                    'home_team': home_team,
                    'away_team': away_team,
                    'date': target_date,
                    'time': match_time,
                    'league': league,
                    'status': 'scheduled',
                    'source': 'realistic_demo',

                    # Odds adatok
                    'odds_1x2': odds['1x2'],
                    'odds_over_under': odds['over_under'],
                    'odds_both_teams_score': odds['btts'],

                    # Statisztikai adatok
                    'home_form': form_data['home_form'],
                    'away_form': form_data['away_form'],
                    'head_to_head': form_data['h2h'],

                    # Piac és hírek
                    'market_trends': {
                        'sentiment': random.uniform(-0.3, 0.3),
                        'volume': random.uniform(0.5, 1.0),
                        'movement': random.choice(['rising', 'falling', 'stable'])
                    },
                    'news_sentiment': random.uniform(-0.2, 0.2),
                    'social_buzz': {
                        'mentions': random.randint(100, 5000),
                        'sentiment': random.uniform(-0.1, 0.1)
                    },

                    # Metaadatok
                    'confidence_score': random.uniform(0.7, 0.9),
                    'data_completeness': random.uniform(0.8, 0.95),
                    'match_id': f"{home_team.lower().replace(' ', '_')}-{away_team.lower().replace(' ', '_')}-{target_date}"
                }

                matches.append(match)

        return {
            'matches': matches,
            'sources_used': ['realistic_demo'],
            'quality_score': 0.85
        }

    def _generate_realistic_odds(self, home_team: str, away_team: str, league: str) -> Dict[str, Any]:
        """
        Realisztikus odds generálása csapat erősség alapján
        """
        # Csapat erősség becslése (egyszerűsített)
        team_strength = {
            # Premier League
            'Manchester City': 0.95, 'Arsenal': 0.88, 'Liverpool': 0.87, 'Chelsea': 0.82,
            'Manchester United': 0.80, 'Newcastle United': 0.75, 'Tottenham': 0.74,

            # La Liga
            'Real Madrid': 0.92, 'Barcelona': 0.89, 'Atletico Madrid': 0.83,

            # Serie A
            'Inter Milan': 0.85, 'AC Milan': 0.82, 'Juventus': 0.80, 'Napoli': 0.84,

            # Bundesliga
            'Bayern Munich': 0.93, 'Borussia Dortmund': 0.82, 'RB Leipzig': 0.78,

            # Ligue 1
            'PSG': 0.90, 'Monaco': 0.75, 'Marseille': 0.73
        }

        home_strength = team_strength.get(home_team, 0.7)  # Alapértelmezett
        away_strength = team_strength.get(away_team, 0.7)

        # Hazai pálya előny
        home_strength += 0.1

        # Valószínűségek számítása
        total_strength = home_strength + away_strength
        home_prob = home_strength / total_strength
        away_prob = away_strength / total_strength
        draw_prob = 0.25  # Alapértelmezett döntetlen valószínűség

        # Normalizálás
        total_prob = home_prob + away_prob + draw_prob
        home_prob /= total_prob
        away_prob /= total_prob
        draw_prob /= total_prob

        # Odds számítása (valószínűség inverze + margin)
        margin = 0.05  # 5% bookmaker margin

        home_odds = round((1 / home_prob) * (1 + margin), 2)
        draw_odds = round((1 / draw_prob) * (1 + margin), 2)
        away_odds = round((1 / away_prob) * (1 + margin), 2)

        return {
            '1x2': {
                'home': home_odds,
                'draw': draw_odds,
                'away': away_odds
            },
            'over_under': {
                'over_2_5': round(random.uniform(1.6, 2.4), 2),
                'under_2_5': round(random.uniform(1.4, 2.2), 2)
            },
            'btts': {
                'yes': round(random.uniform(1.6, 2.1), 2),
                'no': round(random.uniform(1.7, 2.3), 2)
            }
        }

    def _generate_realistic_form(self, home_team: str, away_team: str) -> Dict[str, Any]:
        """
        Realisztikus forma és statisztikák generálása
        """
        def generate_form():
            return [random.choice(['W', 'D', 'L']) for _ in range(5)]

        def generate_h2h():
            h2h = []
            for _ in range(random.randint(3, 6)):
                home_goals = random.randint(0, 4)
                away_goals = random.randint(0, 4)
                h2h.append({
                    'home_score': home_goals,
                    'away_score': away_goals,
                    'date': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d')
                })
            return h2h

        return {
            'home_form': generate_form(),
            'away_form': generate_form(),
            'h2h': generate_h2h()
        }

    def _try_free_apis(self, target_date: str, leagues: List[str]) -> Optional[Dict[str, Any]]:
        """
        Free API-k próbálása
        """
        try:
            # Itt lenne a Free API collector hívás
            # from .free_api_collector import FreeAPICollector
            # api_collector = FreeAPICollector()
            # return api_collector.collect_free_api_data(target_date, leagues)

            logger.info("Free API-k próbálása...")
            return None  # Egyelőre nem elérhető

        except Exception as e:
            logger.error(f"Free API hiba: {e}")
            return None

    def _try_rss_feeds(self, target_date: str, leagues: List[str]) -> Optional[Dict[str, Any]]:
        """
        RSS feeds próbálása
        """
        try:
            # Itt lenne az RSS collector hívás
            # from .rss_data_collector import RSSDataCollector
            # rss_collector = RSSDataCollector()
            # return rss_collector.collect_rss_data()

            logger.info("RSS feeds próbálása...")
            return None  # Egyelőre nem elérhető

        except Exception as e:
            logger.error(f"RSS feeds hiba: {e}")
            return None

    def _try_modern_scraping(self, target_date: str, leagues: List[str]) -> Optional[Dict[str, Any]]:
        """
        Modern scraping próbálása
        """
        try:
            # Itt lenne a modern scraper hívás
            # from .modern_web_scraper import ModernWebScraper
            # scraper = ModernWebScraper()
            # return scraper.scrape_with_alternatives(target_date)

            logger.info("Modern scraping próbálása...")
            return None  # Egyelőre nem elérhető

        except Exception as e:
            logger.error(f"Modern scraping hiba: {e}")
            return None

    def _combine_and_clean_matches(self, matches: List[Dict]) -> List[Dict]:
        """
        Mérkőzések kombinálása és duplikátumok eltávolítása
        """
        if not matches:
            return []

        # Duplikátumok eltávolítása mérkőzés kulcs alapján
        seen_matches = set()
        cleaned_matches = []

        for match in matches:
            match_key = f"{match.get('home_team', '')}-{match.get('away_team', '')}-{match.get('date', '')}"

            if match_key not in seen_matches:
                seen_matches.add(match_key)

                # Alapvető adattisztítás
                cleaned_match = self._clean_match_data(match)
                if cleaned_match:
                    cleaned_matches.append(cleaned_match)

        logger.info(f"Adatok tisztítva: {len(cleaned_matches)} egyedi meccs")
        return cleaned_matches

    def _clean_match_data(self, match: Dict) -> Optional[Dict]:
        """
        Egyedi mérkőzés adatainak tisztítása
        """
        try:
            # Kötelező mezők ellenőrzése
            required_fields = ['home_team', 'away_team', 'date', 'league']

            for field in required_fields:
                if not match.get(field):
                    return None

            # Adattisztítás
            cleaned = {
                'home_team': str(match['home_team']).strip(),
                'away_team': str(match['away_team']).strip(),
                'date': str(match['date']).strip(),
                'time': str(match.get('time', '15:00')).strip(),
                'league': str(match['league']).strip(),
                'status': match.get('status', 'scheduled'),
                'source': match.get('source', 'unknown'),

                # Opcionális mezők
                'odds_1x2': match.get('odds_1x2'),
                'odds_over_under': match.get('odds_over_under'),
                'odds_both_teams_score': match.get('odds_both_teams_score'),
                'home_form': match.get('home_form'),
                'away_form': match.get('away_form'),
                'head_to_head': match.get('head_to_head'),
                'market_trends': match.get('market_trends'),
                'news_sentiment': match.get('news_sentiment'),
                'social_buzz': match.get('social_buzz'),

                # Metaadatok
                'confidence_score': float(match.get('confidence_score', 0.5)),
                'data_completeness': float(match.get('data_completeness', 0.5)),
                'match_id': match.get('match_id', f"{match['home_team'].lower().replace(' ', '_')}-{match['away_team'].lower().replace(' ', '_')}-{match['date']}")
            }

            return cleaned

        except Exception as e:
            logger.error(f"Adattisztítási hiba: {e}")
            return None

    def _assess_data_quality(self, matches: List[Dict], method_success: Dict[str, bool]) -> Dict[str, Any]:
        """
        Adatok minőségének értékelése
        """
        if not matches:
            return {'overall_score': 0.0, 'details': 'Nincs adat'}

        total_confidence = sum(match.get('confidence_score', 0.5) for match in matches)
        avg_confidence = total_confidence / len(matches)

        total_completeness = sum(match.get('data_completeness', 0.5) for match in matches)
        avg_completeness = total_completeness / len(matches)

        # Forrás diverzitás
        sources = set(match.get('source', 'unknown') for match in matches)
        source_diversity = len(sources) / 4  # Max 4 típus forrás

        # Módszer sikeresség
        successful_methods = sum(1 for success in method_success.values() if success)
        method_score = successful_methods / len(method_success)

        # Összesített pontszám
        overall_score = (avg_confidence * 0.3 +
                        avg_completeness * 0.3 +
                        source_diversity * 0.2 +
                        method_score * 0.2)

        return {
            'overall_score': round(overall_score, 2),
            'avg_confidence': round(avg_confidence, 2),
            'avg_completeness': round(avg_completeness, 2),
            'source_diversity': round(source_diversity, 2),
            'method_success_rate': round(method_score, 2),
            'total_matches': len(matches),
            'unique_sources': list(sources),
            'successful_methods': [method for method, success in method_success.items() if success]
        }

    def _parse_date(self, date_str: str) -> str:
        """
        Dátum string parsing
        """
        try:
            if date_str.lower() == 'today':
                return datetime.now().strftime('%Y-%m-%d')
            elif date_str.lower() == 'tomorrow':
                return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            else:
                # Validálás
                datetime.strptime(date_str, '%Y-%m-%d')
                return date_str
        except:
            return (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    def get_collector_status(self) -> Dict[str, Any]:
        """
        Hibrid collector állapotának ellenőrzése
        """
        status = {
            'timestamp': datetime.now().isoformat(),
            'available_methods': {
                'realistic_demo': True,
                'free_api': False,  # Implementálás függvényében
                'rss_feeds': False,  # Implementálás függvényében
                'modern_scraping': False  # Implementálás függvényében
            },
            'recommended_approach': 'realistic_demo',
            'data_quality_expectation': 'high'
        }

        available_count = sum(1 for available in status['available_methods'].values() if available)

        if available_count >= 3:
            status['recommended_approach'] = 'hybrid_multi_source'
            status['data_quality_expectation'] = 'excellent'
        elif available_count >= 2:
            status['recommended_approach'] = 'dual_source'
            status['data_quality_expectation'] = 'very_good'
        else:
            status['recommended_approach'] = 'realistic_demo'
            status['data_quality_expectation'] = 'good'

        return status
