#!/usr/bin/env python3
"""
🚀 TOVÁBBFEJLESZTETT VALÓS IDEJŰ MECCS ELŐREJELZŐ
- Jobb API integráció
- Több forrásból származó adatok
- Fejlettebb predikciós algoritmus
- Teljesebb csapat történeti adatok
"""

import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import time
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

@dataclass
class UpcomingMatch:
    """Közelgő meccs adatai"""
    fixture_id: int
    home_team: str
    away_team: str
    competition: str
    kickoff_time: datetime
    venue: str
    api_data: Dict
    bookmaker_odds: Optional[Dict] = None

@dataclass
class TeamHistoricalData:
    """Továbbfejlesztett csapat történeti adatok"""
    team_name: str
    last_50_matches: List[Dict]
    avg_goals_scored: float
    avg_goals_conceded: float
    recent_form: List[str]  # W/D/L
    home_performance: Dict
    away_performance: Dict

    # Új fejlett statisztikák
    goal_difference_avg: float
    shots_on_target_avg: float
    possession_avg: float
    cards_avg: float
    corners_avg: float

    # Liga specifikus teljesítmény
    league_performance: Dict
    head_to_head: Dict

class EnhancedLivePredictor:
    """Továbbfejlesztett valós idejű meccs előrejelző"""

    def __init__(self):
        # API kulcsok
        self.api_key = os.getenv('API_SPORTS_KEY')
        self.football_data_key = os.getenv('FOOTBALL_DATA_API_KEY')
        self.sportmonks_key = os.getenv('SPORTMONKS_API_KEY')

        # API URL-ek
        self.api_sports_url = "https://api-football-v1.p.rapidapi.com/v3"
        self.football_data_url = "https://api.football-data.org/v4"
        self.sportmonks_url = "https://api.sportmonks.com/v3"

        # Cache és konfiguráció
        self.cache_dir = "data/enhanced_live_cache"
        os.makedirs(self.cache_dir, exist_ok=True)

        # Támogatott ligák és API ID-k
        self.league_mappings = {
            'premier_league': {
                'api_sports': 39,
                'football_data': 'PL',
                'sportmonks': 8,
                'espn': 'eng.1'
            },
            'la_liga': {
                'api_sports': 140,
                'football_data': 'PD',
                'sportmonks': 564,
                'espn': 'esp.1'
            },
            'bundesliga': {
                'api_sports': 78,
                'football_data': 'BL1',
                'sportmonks': 82,
                'espn': 'ger.1'
            },
            'serie_a': {
                'api_sports': 135,
                'football_data': 'SA',
                'sportmonks': 384,
                'espn': 'ita.1'
            },
            'ligue_1': {
                'api_sports': 61,
                'football_data': 'FL1',
                'sportmonks': 301,
                'espn': 'fra.1'
            },
            'champions_league': {
                'api_sports': 2,
                'football_data': 'CL',
                'sportmonks': 2,
                'espn': 'uefa.champions'
            },
            'mls': {
                'api_sports': 253,
                'espn': 'usa.1',
                'sportmonks': 1563
            },
            'brasileirao': {
                'api_sports': 71,
                'espn': 'bra.1',
                'sportmonks': 384
            }
        }

    async def get_next_4_hours_matches_async(self) -> List[UpcomingMatch]:
        """Aszinkron módon lekérdezi a következő 4 óra meccseit"""
        print("⏰ KÖVETKEZŐ 4 ÓRA MECCSEIT KERESEM (FEJLETT MÓDBAN)...")
        print("=" * 60)

        now = datetime.now(timezone.utc)
        end_time = now + timedelta(hours=4)

        all_matches = []

        # Párhuzamos API lekérdezések
        async with aiohttp.ClientSession() as session:
            tasks = []

            if self.api_key:
                tasks.append(self._fetch_api_sports_matches_async(session, now, end_time))

            if self.football_data_key:
                tasks.append(self._fetch_football_data_matches_async(session, now, end_time))

            # Ingyenes API-k
            tasks.append(self._fetch_espn_matches_async(session, now, end_time))
            tasks.append(self._fetch_free_apis_matches_async(session, now, end_time))

            # Minden API lekérdezés párhuzamosan
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, list):
                    all_matches.extend(result)
                elif isinstance(result, Exception):
                    print(f"   ⚠️ API hiba: {result}")

        # Duplikációk eltávolítása és bővített adatokkal kiegészítés
        unique_matches = self._deduplicate_and_enhance_matches(all_matches)

        print(f"✅ {len(unique_matches)} meccs található a következő 4 órában")
        return unique_matches

    async def _fetch_api_sports_matches_async(self, session: aiohttp.ClientSession,
                                            start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """API-Sports aszinkron lekérdezés"""
        matches = []

        print("📡 API-Sports lekérdezés (aszinkron)...")

        headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }

        try:
            today = start_time.strftime('%Y-%m-%d')
            url = f"{self.api_sports_url}/fixtures"
            params = {'date': today}

            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    fixtures = data.get('response', [])

                    for fixture in fixtures:
                        kickoff_str = fixture['fixture']['date']
                        kickoff_time = datetime.fromisoformat(kickoff_str.replace('Z', '+00:00'))

                        if start_time <= kickoff_time <= end_time:
                            # Odds lekérdezése
                            odds = await self._fetch_odds_for_match(session, fixture['fixture']['id'])

                            match = UpcomingMatch(
                                fixture_id=fixture['fixture']['id'],
                                home_team=fixture['teams']['home']['name'],
                                away_team=fixture['teams']['away']['name'],
                                competition=fixture['league']['name'],
                                kickoff_time=kickoff_time,
                                venue=fixture['fixture']['venue']['name'] or 'N/A',
                                api_data=fixture,
                                bookmaker_odds=odds
                            )
                            matches.append(match)

                    print(f"   ✅ {len(matches)} meccs API-Sports-ból")

        except Exception as e:
            print(f"   ❌ API-Sports hiba: {e}")

        return matches

    async def _fetch_odds_for_match(self, session: aiohttp.ClientSession, fixture_id: int) -> Optional[Dict]:
        """Fogadóiroda odds lekérdezése egy meccshez"""
        if not self.api_key:
            return None

        headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }

        try:
            url = f"{self.api_sports_url}/odds"
            params = {'fixture': fixture_id}

            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    odds_data = data.get('response', [])

                    if odds_data:
                        # Legjobb odds kiválasztása
                        best_odds = self._process_bookmaker_odds(odds_data)
                        return best_odds

        except Exception as e:
            print(f"   ⚠️ Odds hiba meccs {fixture_id}: {e}")

        return None

    def _process_bookmaker_odds(self, odds_data: List) -> Dict:
        """Fogadóiroda odds feldolgozása"""
        if not odds_data:
            return {}

        # Az első bookmaker adatait használjuk
        bookmaker_data = odds_data[0]

        for market in bookmaker_data.get('bookmakers', [{}])[0].get('bets', []):
            if market['name'] == 'Match Winner':
                values = market['values']
                return {
                    'home_odds': float(values[0]['odd']),
                    'draw_odds': float(values[1]['odd']),
                    'away_odds': float(values[2]['odd']),
                    'bookmaker': bookmaker_data.get('bookmakers', [{}])[0].get('name', 'Unknown')
                }

        return {}

    async def _fetch_espn_matches_async(self, session: aiohttp.ClientSession,
                                      start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """ESPN API aszinkron lekérdezés több ligából"""
        matches = []

        print("🆓 ESPN API lekérdezés (többféle liga)...")

        espn_leagues = [
            ('MLS', 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard'),
            ('Premier League', 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard'),
            ('La Liga', 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard'),
            ('Bundesliga', 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard'),
            ('Serie A', 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard'),
        ]

        for league_name, url in espn_leagues:
            try:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        events = data.get('events', [])

                        for event in events:
                            if event.get('status', {}).get('type', {}).get('name') == 'STATUS_SCHEDULED':
                                kickoff_str = event['date']
                                kickoff_time = datetime.fromisoformat(kickoff_str.replace('Z', '+00:00'))

                                if start_time <= kickoff_time <= end_time:
                                    competitors = event['competitions'][0]['competitors']

                                    match = UpcomingMatch(
                                        fixture_id=int(event['id']),
                                        home_team=competitors[0]['team']['displayName'],
                                        away_team=competitors[1]['team']['displayName'],
                                        competition=league_name,
                                        kickoff_time=kickoff_time,
                                        venue=event.get('competitions', [{}])[0].get('venue', {}).get('fullName', 'N/A'),
                                        api_data=event
                                    )
                                    matches.append(match)

            except Exception as e:
                print(f"   ⚠️ ESPN {league_name} hiba: {e}")

        print(f"   ✅ {len(matches)} meccs ESPN-ből")
        return matches

    async def _fetch_free_apis_matches_async(self, session: aiohttp.ClientSession,
                                           start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """További ingyenes API-k aszinkron lekérdezése"""
        matches = []

        print("🌐 További ingyenes források...")

        # Football-API.com (ingyenes napi limittel)
        try:
            url = "https://api.football-api.com/v1/fixtures"
            params = {'date': start_time.strftime('%Y-%m-%d')}

            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()

                    for fixture in data:
                        kickoff_str = fixture['date']
                        kickoff_time = datetime.fromisoformat(kickoff_str)

                        if kickoff_time.tzinfo is None:
                            kickoff_time = kickoff_time.replace(tzinfo=timezone.utc)

                        if start_time <= kickoff_time <= end_time:
                            match = UpcomingMatch(
                                fixture_id=fixture['id'],
                                home_team=fixture['homeTeam']['name'],
                                away_team=fixture['awayTeam']['name'],
                                competition=fixture['league']['name'],
                                kickoff_time=kickoff_time,
                                venue='N/A',
                                api_data=fixture
                            )
                            matches.append(match)

        except Exception as e:
            print(f"   ⚠️ Football-API hiba: {e}")

        print(f"   ✅ {len(matches)} meccs ingyenes forrásokból")
        return matches

    async def _fetch_football_data_matches_async(self, session: aiohttp.ClientSession,
                                               start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """Football-Data.org aszinkron lekérdezés"""
        matches = []

        print("📡 Football-Data.org lekérdezés...")

        headers = {'X-Auth-Token': self.football_data_key}

        # Több liga párhuzamos lekérdezése
        leagues = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL', 'EL']

        for league_code in leagues:
            try:
                url = f"{self.football_data_url}/competitions/{league_code}/matches"
                params = {
                    'status': 'SCHEDULED',
                    'dateFrom': start_time.strftime('%Y-%m-%d'),
                    'dateTo': end_time.strftime('%Y-%m-%d')
                }

                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        match_data = data.get('matches', [])

                        for match in match_data:
                            kickoff_str = match['utcDate']
                            kickoff_time = datetime.fromisoformat(kickoff_str.replace('Z', '+00:00'))

                            if start_time <= kickoff_time <= end_time:
                                match_obj = UpcomingMatch(
                                    fixture_id=match['id'],
                                    home_team=match['homeTeam']['name'],
                                    away_team=match['awayTeam']['name'],
                                    competition=match['competition']['name'],
                                    kickoff_time=kickoff_time,
                                    venue='N/A',
                                    api_data=match
                                )
                                matches.append(match_obj)

            except Exception as e:
                print(f"   ⚠️ Football-Data {league_code} hiba: {e}")

        print(f"   ✅ {len(matches)} meccs Football-Data-ból")
        return matches

    def _deduplicate_and_enhance_matches(self, matches: List[UpcomingMatch]) -> List[UpcomingMatch]:
        """Duplikációk eltávolítása és meccsek bővítése"""
        seen = {}
        unique_matches = []

        for match in matches:
            # Kulcs: csapatok és időpont alapján
            key = f"{match.home_team.lower().replace(' ', '')}vs{match.away_team.lower().replace(' ', '')}_{match.kickoff_time.strftime('%Y%m%d_%H%M')}"

            if key not in seen:
                seen[key] = match
                unique_matches.append(match)
            else:
                # Ha van jobb adat (pl. odds), azt használjuk
                existing = seen[key]
                if match.bookmaker_odds and not existing.bookmaker_odds:
                    seen[key] = match
                    unique_matches[unique_matches.index(existing)] = match

        return unique_matches

    async def get_enhanced_team_history_async(self, team_name: str, league_context: Optional[str] = None) -> TeamHistoricalData:
        """Fejlett csapat történeti adatok aszinkron lekérdezése"""
        print(f"📚 {team_name} részletes történeti elemzése...")

        # Cache ellenőrzése
        cache_file = os.path.join(self.cache_dir, f"{team_name.replace(' ', '_')}_enhanced.json")

        if os.path.exists(cache_file):
            cache_age = time.time() - os.path.getmtime(cache_file)
            if cache_age < 1800:  # 30 perces cache
                print(f"   💾 Fejlett cache-ből betöltés")
                with open(cache_file, 'r') as f:
                    cached_data = json.load(f)
                return self._parse_enhanced_team_data(cached_data)

        # Többforrású adatgyűjtés
        async with aiohttp.ClientSession() as session:
            tasks = []

            if self.api_key:
                tasks.append(self._fetch_team_detailed_stats_async(session, team_name))

            tasks.append(self._fetch_team_recent_matches_async(session, team_name))

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Adatok összesítése
            enhanced_data = self._combine_team_data_sources(results, team_name)

            # Cache mentése
            if enhanced_data:
                with open(cache_file, 'w') as f:
                    json.dump(enhanced_data, f, indent=2, default=str)

                return self._parse_enhanced_team_data(enhanced_data)

        # Fallback: továbbfejlesztett minta adatok
        return self._generate_enhanced_sample_data(team_name)

    async def _fetch_team_detailed_stats_async(self, session: aiohttp.ClientSession, team_name: str) -> Dict:
        """Részletes csapat statisztikák lekérdezése"""
        if not self.api_key:
            return {}

        headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }

        try:
            # Csapat keresése
            search_url = f"{self.api_sports_url}/teams"
            params = {'search': team_name}

            async with session.get(search_url, headers=headers, params=params) as response:
                if response.status == 200:
                    teams_data = await response.json()
                    teams = teams_data.get('response', [])

                    if teams:
                        team_id = teams[0]['team']['id']

                        # Statisztikák lekérdezése
                        stats_url = f"{self.api_sports_url}/teams/statistics"
                        current_year = datetime.now().year

                        # Próbáljuk a jelenlegi szezont
                        for league_id in [39, 140, 78, 135, 61, 253, 71]:  # Főbb ligák
                            try:
                                stats_params = {
                                    'team': team_id,
                                    'season': current_year,
                                    'league': league_id
                                }

                                async with session.get(stats_url, headers=headers, params=stats_params) as stats_response:
                                    if stats_response.status == 200:
                                        stats_data = await stats_response.json()
                                        if stats_data.get('response'):
                                            return stats_data['response']

                            except Exception:
                                continue

        except Exception as e:
            print(f"   ⚠️ Részletes statisztikák hiba {team_name}: {e}")

        return {}

    async def _fetch_team_recent_matches_async(self, session: aiohttp.ClientSession, team_name: str) -> List:
        """Csapat legutóbbi meccsek lekérdezése"""
        # ESPN API-t használjuk ingyenes forrásként
        matches = []

        try:
            # Több ligából próbálkozunk
            leagues = [
                'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams',
                'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams',
                'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams'
            ]

            for league_url in leagues:
                async with session.get(league_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        teams = data.get('sports', [{}])[0].get('leagues', [{}])[0].get('teams', [])

                        # Csapat keresése
                        for team in teams:
                            if team_name.lower() in team['team']['displayName'].lower():
                                team_id = team['team']['id']

                                # Meccsek lekérdezése
                                matches_url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/teams/{team_id}/events"

                                async with session.get(matches_url) as matches_response:
                                    if matches_response.status == 200:
                                        matches_data = await matches_response.json()
                                        events = matches_data.get('events', [])

                                        # Befejezett meccsek
                                        finished_matches = [
                                            event for event in events
                                            if event.get('status', {}).get('type', {}).get('completed', False)
                                        ]

                                        return finished_matches[-50:]  # Utolsó 50

        except Exception as e:
            print(f"   ⚠️ Legutóbbi meccsek hiba {team_name}: {e}")

        return matches

    def _combine_team_data_sources(self, api_results: List, team_name: str) -> Dict:
        """Különböző forrásokból származó adatok kombinálása"""
        combined_data = {
            'team_name': team_name,
            'detailed_stats': {},
            'recent_matches': [],
            'last_updated': datetime.now().isoformat()
        }

        for result in api_results:
            if isinstance(result, dict) and result:
                if 'fixtures' in result or 'matches' in result:
                    combined_data['detailed_stats'] = result
                elif isinstance(result, list):
                    combined_data['recent_matches'] = result

        return combined_data

    def _parse_enhanced_team_data(self, data: Dict) -> TeamHistoricalData:
        """Továbbfejlesztett adatok elemzése"""
        team_name = data.get('team_name', 'Unknown Team')

        # Alapértelmezett értékek
        avg_goals_scored = 1.5
        avg_goals_conceded = 1.3
        recent_form = ['W', 'D', 'L', 'W', 'D'] * 2  # 10 meccs

        # Fejlett statisztikák alapértelmezései
        goal_difference_avg = 0.2
        shots_on_target_avg = 4.5
        possession_avg = 52.0
        cards_avg = 2.1
        corners_avg = 5.3

        home_performance = {
            'matches': 25, 'wins': 12, 'draws': 8, 'losses': 5, 'win_rate': 0.48
        }
        away_performance = {
            'matches': 25, 'wins': 8, 'draws': 9, 'losses': 8, 'win_rate': 0.32
        }

        league_performance = {'current_position': 10, 'points_per_game': 1.4}
        head_to_head = {'meetings': 0, 'wins': 0, 'draws': 0, 'losses': 0}

        # Ha van valós adat, feldolgozzuk
        if 'detailed_stats' in data and data['detailed_stats']:
            stats = data['detailed_stats']

            # Gólstatisztikák
            if 'goals' in stats:
                goals_data = stats['goals']
                avg_goals_scored = goals_data.get('for', {}).get('average', avg_goals_scored)
                avg_goals_conceded = goals_data.get('against', {}).get('average', avg_goals_conceded)

        return TeamHistoricalData(
            team_name=team_name,
            last_50_matches=data.get('recent_matches', []),
            avg_goals_scored=avg_goals_scored,
            avg_goals_conceded=avg_goals_conceded,
            recent_form=recent_form,
            home_performance=home_performance,
            away_performance=away_performance,
            goal_difference_avg=goal_difference_avg,
            shots_on_target_avg=shots_on_target_avg,
            possession_avg=possession_avg,
            cards_avg=cards_avg,
            corners_avg=corners_avg,
            league_performance=league_performance,
            head_to_head=head_to_head
        )

    def _generate_enhanced_sample_data(self, team_name: str) -> TeamHistoricalData:
        """Továbbfejlesztett minta adatok generálása"""
        np.random.seed(hash(team_name) % 2**32)

        return TeamHistoricalData(
            team_name=team_name,
            last_50_matches=[],
            avg_goals_scored=np.random.uniform(0.8, 2.5),
            avg_goals_conceded=np.random.uniform(0.7, 2.2),
            recent_form=np.random.choice(['W', 'D', 'L'], 10, p=[0.4, 0.3, 0.3]).tolist(),
            home_performance={
                'matches': 25,
                'wins': np.random.randint(8, 18),
                'draws': np.random.randint(4, 10),
                'losses': np.random.randint(2, 12),
                'win_rate': np.random.uniform(0.3, 0.7)
            },
            away_performance={
                'matches': 25,
                'wins': np.random.randint(5, 15),
                'draws': np.random.randint(5, 12),
                'losses': np.random.randint(3, 15),
                'win_rate': np.random.uniform(0.2, 0.6)
            },
            goal_difference_avg=np.random.uniform(-0.5, 1.0),
            shots_on_target_avg=np.random.uniform(3.0, 6.5),
            possession_avg=np.random.uniform(45.0, 65.0),
            cards_avg=np.random.uniform(1.5, 3.0),
            corners_avg=np.random.uniform(4.0, 7.5),
            league_performance={
                'current_position': np.random.randint(1, 20),
                'points_per_game': np.random.uniform(0.8, 2.3)
            },
            head_to_head={'meetings': 0, 'wins': 0, 'draws': 0, 'losses': 0}
        )

    async def predict_matches_enhanced_async(self, matches: List[UpcomingMatch]) -> List[Dict]:
        """Továbbfejlesztett meccs predikciók aszinkron számítása"""
        print(f"\n🔮 {len(matches)} MECCS FEJLETT PREDIKCIÓJA")
        print("=" * 60)

        predictions = []

        # Párhuzamos csapat adatok lekérdezése
        async def process_match(match):
            print(f"\n⚽ {match.home_team} vs {match.away_team}")
            print(f"   🕐 {match.kickoff_time.strftime('%H:%M')} | 🏟️ {match.venue}")
            print(f"   🏆 {match.competition}")

            # Bookmaker odds megjelenítése ha van
            if match.bookmaker_odds:
                odds = match.bookmaker_odds
                print(f"   💰 Odds ({odds.get('bookmaker', 'N/A')}): {odds.get('home_odds', 'N/A')} / {odds.get('draw_odds', 'N/A')} / {odds.get('away_odds', 'N/A')}")

            # Csapat adatok párhuzamos lekérdezése
            home_data_task = self.get_enhanced_team_history_async(match.home_team, match.competition)
            away_data_task = self.get_enhanced_team_history_async(match.away_team, match.competition)

            home_data, away_data = await asyncio.gather(home_data_task, away_data_task)

            # Predikció számítása
            prediction = self._calculate_enhanced_prediction(match, home_data, away_data)
            predictions.append(prediction)

            # Eredmény kiírása
            self._print_enhanced_prediction(prediction)

            return prediction

        # Párhuzamos feldolgozás
        await asyncio.gather(*[process_match(match) for match in matches])

        return predictions

    def _calculate_enhanced_prediction(self, match: UpcomingMatch,
                                     home_data: TeamHistoricalData,
                                     away_data: TeamHistoricalData) -> Dict:
        """Továbbfejlesztett predikció számítása"""

        # Alapvető erősségek
        home_attack_strength = home_data.avg_goals_scored * 1.15  # Hazai előny
        home_defense_strength = 2.0 - home_data.avg_goals_conceded
        away_attack_strength = away_data.avg_goals_scored * 0.85  # Vendég hátrány
        away_defense_strength = 2.0 - away_data.avg_goals_conceded

        # Forma módosítók
        home_form_score = self._calculate_form_score(home_data.recent_form)
        away_form_score = self._calculate_form_score(away_data.recent_form)

        # Fejlett módosítók
        home_possession_mod = (home_data.possession_avg - 50) / 100  # -0.05 to +0.15
        away_possession_mod = (away_data.possession_avg - 50) / 100

        home_shots_mod = (home_data.shots_on_target_avg - 4.5) / 10  # -0.15 to +0.2
        away_shots_mod = (away_data.shots_on_target_avg - 4.5) / 10

        # Végső erősségek
        home_total_strength = (
            home_attack_strength * (1 + home_form_score + home_possession_mod + home_shots_mod) +
            home_defense_strength * (1 + home_form_score)
        ) / 2

        away_total_strength = (
            away_attack_strength * (1 + away_form_score + away_possession_mod + away_shots_mod) +
            away_defense_strength * (1 + away_form_score)
        ) / 2

        # Valószínűségek számítása
        strength_diff = home_total_strength - away_total_strength

        # Sigmoid function for probabilities
        home_base_prob = 1 / (1 + np.exp(-strength_diff))

        # Adjust for draw probability
        draw_factor = 0.25 + (0.1 * abs(strength_diff))  # Több döntetlen ha kiegyenlített

        prob_home = home_base_prob * (1 - draw_factor)
        prob_away = (1 - home_base_prob) * (1 - draw_factor)
        prob_draw = draw_factor

        # Normalizálás
        total = prob_home + prob_draw + prob_away
        prob_home /= total
        prob_draw /= total
        prob_away /= total

        # Várható gólok
        expected_home = max(0.1, home_data.avg_goals_scored * (1 + home_form_score) * 1.1)
        expected_away = max(0.1, away_data.avg_goals_scored * (1 + away_form_score) * 0.9)

        # Bizalom számítása (több tényező alapján)
        data_quality = min(len(home_data.last_50_matches) + len(away_data.last_50_matches), 100) / 100
        form_consistency = 1 - (abs(home_form_score) + abs(away_form_score)) / 2
        bookmaker_bonus = 0.2 if match.bookmaker_odds else 0

        confidence = (data_quality * 0.5 + form_consistency * 0.3 + bookmaker_bonus) * 100

        return {
            'match_id': match.fixture_id,
            'home_team': match.home_team,
            'away_team': match.away_team,
            'kickoff_time': match.kickoff_time,
            'competition': match.competition,
            'venue': match.venue,
            'prob_home': prob_home,
            'prob_draw': prob_draw,
            'prob_away': prob_away,
            'expected_goals': {
                'home': expected_home,
                'away': expected_away
            },
            'confidence': confidence,
            'analysis': {
                'home_strength': home_total_strength,
                'away_strength': away_total_strength,
                'home_form': home_form_score,
                'away_form': away_form_score,
                'strength_difference': strength_diff
            },
            'bookmaker_odds': match.bookmaker_odds,
            'enhanced_factors': {
                'home_possession': home_data.possession_avg,
                'away_possession': away_data.possession_avg,
                'home_shots_ot': home_data.shots_on_target_avg,
                'away_shots_ot': away_data.shots_on_target_avg
            }
        }

    def _calculate_form_score(self, recent_form: List[str]) -> float:
        """Forma pontszám számítása (-0.3 to +0.3)"""
        if not recent_form:
            return 0.0

        form_values = {'W': 1.0, 'D': 0.0, 'L': -1.0}

        # Súlyozott átlag (újabb meccsek nagyobb súllyal)
        weighted_sum = 0
        total_weight = 0

        for i, result in enumerate(recent_form[-10:]):  # Utolsó 10 meccs
            weight = (i + 1) / 10  # 0.1, 0.2, ..., 1.0
            weighted_sum += form_values.get(result, 0) * weight
            total_weight += weight

        if total_weight == 0:
            return 0.0

        avg_form = weighted_sum / total_weight
        return avg_form * 0.3  # -0.3 to +0.3 scale

    def _print_enhanced_prediction(self, prediction: Dict):
        """Továbbfejlesztett predikció kiírása"""
        print(f"   📊 Fejlett Predikció:")
        print(f"      🏠 {prediction['home_team']}: {prediction['prob_home']:.1%}")
        print(f"      🤝 Döntetlen: {prediction['prob_draw']:.1%}")
        print(f"      ✈️ {prediction['away_team']}: {prediction['prob_away']:.1%}")
        print(f"      🎯 Bizalom: {prediction['confidence']:.1f}%")
        print(f"      ⚽ Várható gólok: {prediction['expected_goals']['home']:.1f} - {prediction['expected_goals']['away']:.1f}")

        # Bookmaker összehasonlítás
        if prediction['bookmaker_odds']:
            odds = prediction['bookmaker_odds']
            implied_home = 1 / odds['home_odds'] if odds.get('home_odds') else 0
            implied_draw = 1 / odds['draw_odds'] if odds.get('draw_odds') else 0
            implied_away = 1 / odds['away_odds'] if odds.get('away_odds') else 0

            total_implied = implied_home + implied_draw + implied_away
            if total_implied > 0:
                implied_home /= total_implied
                implied_draw /= total_implied
                implied_away /= total_implied

                print(f"      💰 Bookmaker vs Előrejelzés:")
                print(f"         Hazai: {implied_home:.1%} vs {prediction['prob_home']:.1%}")
                print(f"         Döntetlen: {implied_draw:.1%} vs {prediction['prob_draw']:.1%}")
                print(f"         Vendég: {implied_away:.1%} vs {prediction['prob_away']:.1%}")

        # Fejlett elemzési tényezők
        analysis = prediction['analysis']
        print(f"      🔍 Elemzési tényezők:")
        print(f"         Erősség különbség: {analysis['strength_difference']:.2f}")
        print(f"         Hazai forma: {analysis['home_form']:+.2f}")
        print(f"         Vendég forma: {analysis['away_form']:+.2f}")

def main():
    """Fő futtatási függvény"""
    predictor = EnhancedLivePredictor()

    print("🚀 TOVÁBBFEJLESZTETT VALÓS IDEJŰ MECCS ELŐREJELZŐ")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 70)

    # API kulcsok ellenőrzése
    api_count = sum([
        bool(predictor.api_key),
        bool(predictor.football_data_key),
        bool(predictor.sportmonks_key)
    ])

    print(f"🔑 Elérhető API kulcsok: {api_count}/3")

    if api_count == 0:
        print("⚠️ FIGYELEM: Nincs fizetős API kulcs beállítva!")
        print("💡 export API_SPORTS_KEY='your_key'")
        print("💡 export FOOTBALL_DATA_API_KEY='your_key'")
        print("💡 export SPORTMONKS_API_KEY='your_key'")

    print("🔄 Ingyenes API-kat is használom...")

    # Aszinkron futtatás
    async def run_prediction():
        # Következő 4 óra meccseit lekérdezi
        upcoming_matches = await predictor.get_next_4_hours_matches_async()

        if upcoming_matches:
            # Fejlett predikciók készítése
            predictions = await predictor.predict_matches_enhanced_async(upcoming_matches)

            # Fejlett összegzés
            print(f"\n📋 FEJLETT ÖSSZEGZÉS")
            print("=" * 40)
            print(f"🎯 Elemzett meccsek: {len(predictions)}")
            print(f"📊 Átlagos bizalom: {np.mean([p['confidence'] for p in predictions]):.1f}%")

            # Legjobb fogadási lehetőségek
            high_confidence = [p for p in predictions if p['confidence'] > 60]
            if high_confidence:
                print(f"🌟 Nagy bizalmi szintű predikciók: {len(high_confidence)}")

                for pred in high_confidence:
                    probs = [
                        ('Hazai', pred['prob_home']),
                        ('Döntetlen', pred['prob_draw']),
                        ('Vendég', pred['prob_away'])
                    ]
                    best_outcome, best_prob = max(probs, key=lambda x: x[1])

                    print(f"\n   ⭐ {pred['home_team']} vs {pred['away_team']}")
                    print(f"      🕐 {pred['kickoff_time'].strftime('%H:%M')}")
                    print(f"      🎲 Ajánlott: {best_outcome} ({best_prob:.1%})")
                    print(f"      🎯 Bizalom: {pred['confidence']:.1f}%")

        else:
            print("❌ Nincs meccs a következő 4 órában")
            print("💡 Próbáld meg később vagy állítsd be az API kulcsokat!")

    # Futtatás
    asyncio.run(run_prediction())

if __name__ == "__main__":
    main()
