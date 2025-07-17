#!/usr/bin/env python3
"""
⏰ VALÓS IDEJŰ MECCS LEKÉRDEZŐ ÉS ELŐREJELZŐ
A következő órák meccseit lekérdezi és predikciót készít rájuk.
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

@dataclass
class TeamHistoricalData:
    """Csapat történeti adatok"""
    team_name: str
    last_50_matches: List[Dict]
    avg_goals_scored: float
    avg_goals_conceded: float
    recent_form: List[str]  # W/D/L
    home_performance: Dict
    away_performance: Dict

class LiveMatchPredictor:
    """Valós idejű meccs előrejelző"""

    def __init__(self):
        self.api_key = os.getenv('API_SPORTS_KEY')
        self.football_data_key = os.getenv('FOOTBALL_DATA_API_KEY')
        self.base_url = "https://api-football-v1.p.rapidapi.com/v3"
        self.football_data_url = "https://api.football-data.org/v4"

        # Támogatott ligák API ID-k
        self.supported_leagues = {
            'premier_league': 39,
            'la_liga': 140,
            'bundesliga': 78,
            'serie_a': 135,
            'ligue_1': 61,
            'champions_league': 2,
            'europa_league': 3,
            'mls': 253,
            'brasileirao': 71,
            'j_league': 98
        }

        self.cache_dir = "data/live_cache"
        os.makedirs(self.cache_dir, exist_ok=True)

    def get_next_4_hours_matches(self) -> List[UpcomingMatch]:
        """Következő 4 óra meccseit lekérdezi"""
        print("⏰ KÖVETKEZŐ 4 ÓRA MECCSEIT KERESEM...")
        print("=" * 50)

        now = datetime.now()
        end_time = now + timedelta(hours=4)

        all_matches = []

        # Próbálkozás különböző API-kkal
        if self.api_key:
            matches_api_sports = self._get_matches_from_api_sports(now, end_time)
            all_matches.extend(matches_api_sports)

        if self.football_data_key:
            matches_football_data = self._get_matches_from_football_data(now, end_time)
            all_matches.extend(matches_football_data)

        # Ingyenes API-k is
        matches_free = self._get_matches_from_free_apis(now, end_time)
        all_matches.extend(matches_free)

        # Duplikációk eltávolítása
        unique_matches = self._deduplicate_matches(all_matches)

        print(f"✅ {len(unique_matches)} meccs található a következő 4 órában")
        return unique_matches

    def _get_matches_from_api_sports(self, start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """API-Sports-ból lekérdezés"""
        matches = []

        if not self.api_key:
            return matches

        print("📡 API-Sports lekérdezés...")

        headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }

        # Mai nap meccseit kérdezzük le
        today = start_time.strftime('%Y-%m-%d')

        try:
            url = f"{self.base_url}/fixtures"
            params = {'date': today}

            response = requests.get(url, headers=headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                fixtures = data.get('response', [])

                for fixture in fixtures:
                    kickoff_str = fixture['fixture']['date']
                    kickoff_time = datetime.fromisoformat(kickoff_str.replace('Z', '+00:00'))

                    # Csak a következő 4 órás meccsek
                    if start_time <= kickoff_time <= end_time:
                        match = UpcomingMatch(
                            fixture_id=fixture['fixture']['id'],
                            home_team=fixture['teams']['home']['name'],
                            away_team=fixture['teams']['away']['name'],
                            competition=fixture['league']['name'],
                            kickoff_time=kickoff_time,
                            venue=fixture['fixture']['venue']['name'] or 'N/A',
                            api_data=fixture
                        )
                        matches.append(match)

                print(f"   ✅ {len(matches)} meccs API-Sports-ból")

            else:
                print(f"   ❌ API-Sports hiba: {response.status_code}")

        except Exception as e:
            print(f"   ❌ API-Sports hiba: {e}")

        return matches

    def _get_matches_from_football_data(self, start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """Football-Data.org-ból lekérdezés"""
        matches = []

        if not self.football_data_key:
            return matches

        print("📡 Football-Data.org lekérdezés...")

        headers = {'X-Auth-Token': self.football_data_key}

        try:
            # Premier League meccsek
            url = f"{self.football_data_url}/competitions/PL/matches"
            params = {
                'status': 'SCHEDULED',
                'dateFrom': start_time.strftime('%Y-%m-%d'),
                'dateTo': end_time.strftime('%Y-%m-%d')
            }

            response = requests.get(url, headers=headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
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

                print(f"   ✅ {len(matches)} meccs Football-Data-ból")

            else:
                print(f"   ❌ Football-Data hiba: {response.status_code}")

        except Exception as e:
            print(f"   ❌ Football-Data hiba: {e}")

        return matches

    def _get_matches_from_free_apis(self, start_time: datetime, end_time: datetime) -> List[UpcomingMatch]:
        """Ingyenes API-kból lekérdezés"""
        matches = []

        print("🆓 Ingyenes API-k lekérdezése...")

        # ESPN API próbálkozás
        try:
            # MLS meccsek
            url = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard"
            response = requests.get(url, timeout=5)

            if response.status_code == 200:
                data = response.json()
                events = data.get('events', [])

                for event in events:
                    if event.get('status', {}).get('type', {}).get('name') == 'STATUS_SCHEDULED':
                        kickoff_str = event['date']
                        # Timezone kezelés
                        if kickoff_str.endswith('Z'):
                            kickoff_time = datetime.fromisoformat(kickoff_str.replace('Z', '+00:00'))
                        else:
                            kickoff_time = datetime.fromisoformat(kickoff_str)
                            if kickoff_time.tzinfo is None:
                                kickoff_time = kickoff_time.replace(tzinfo=timezone.utc)

                        # UTC-ben dolgozunk
                        start_time_utc = start_time.replace(tzinfo=timezone.utc) if start_time.tzinfo is None else start_time
                        end_time_utc = end_time.replace(tzinfo=timezone.utc) if end_time.tzinfo is None else end_time

                        if start_time_utc <= kickoff_time <= end_time_utc:
                            match = UpcomingMatch(
                                fixture_id=int(event['id']),
                                home_team=event['competitions'][0]['competitors'][0]['team']['displayName'],
                                away_team=event['competitions'][0]['competitors'][1]['team']['displayName'],
                                competition='MLS',
                                kickoff_time=kickoff_time,
                                venue=event.get('competitions', [{}])[0].get('venue', {}).get('fullName', 'N/A'),
                                api_data=event
                            )
                            matches.append(match)

                print(f"   ✅ {len(matches)} meccs ESPN-ből")

        except Exception as e:
            print(f"   ⚠️ ESPN API hiba: {e}")

        return matches

    def _deduplicate_matches(self, matches: List[UpcomingMatch]) -> List[UpcomingMatch]:
        """Duplikált meccsek eltávolítása"""
        seen = set()
        unique_matches = []

        for match in matches:
            # Kulcs: csapatok + időpont
            key = f"{match.home_team}vs{match.away_team}_{match.kickoff_time.strftime('%Y%m%d_%H%M')}"

            if key not in seen:
                seen.add(key)
                unique_matches.append(match)

        return unique_matches

    def get_team_last_50_matches(self, team_name: str, league_context: Optional[str] = None) -> TeamHistoricalData:
        """Csapat utolsó 50 meccsének lekérdezése"""
        print(f"📚 {team_name} utolsó 50 meccsének elemzése...")

        # Cache ellenőrzése
        cache_file = os.path.join(self.cache_dir, f"{team_name.replace(' ', '_')}_last50.json")

        if os.path.exists(cache_file):
            # Cache frissesség ellenőrzése (1 órás cache)
            cache_age = time.time() - os.path.getmtime(cache_file)
            if cache_age < 3600:  # 1 óra
                print(f"   💾 Cache-ből betöltés")
                with open(cache_file, 'r') as f:
                    cached_data = json.load(f)
                return self._parse_team_data(cached_data)

        # API lekérdezés
        matches_data = self._fetch_team_matches_from_api(team_name, league_context)

        if matches_data:
            # Cache mentése
            with open(cache_file, 'w') as f:
                json.dump(matches_data, f, indent=2, default=str)

            return self._parse_team_data(matches_data)
        else:
            # Fallback: minta adatok
            print(f"   ⚠️ Nincs elérhető adat, minta adatok generálása")
            return self._generate_sample_team_data(team_name)

    def _fetch_team_matches_from_api(self, team_name: str, league_context: Optional[str]) -> Optional[List]:
        """Csapat meccseit API-ból lekérdezi"""
        if not self.api_key:
            return None

        headers = {
            'X-RapidAPI-Key': self.api_key,
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }

        try:
            # Csapat ID lekérdezése
            search_url = f"{self.base_url}/teams"
            search_params = {'search': team_name}

            response = requests.get(search_url, headers=headers, params=search_params, timeout=10)

            if response.status_code != 200:
                return None

            teams_data = response.json().get('response', [])
            if not teams_data:
                return None

            team_id = teams_data[0]['team']['id']

            # Meccsek lekérdezése
            fixtures_url = f"{self.base_url}/fixtures"
            current_year = datetime.now().year

            all_matches = []

            # Jelenlegi és előző év meccseit
            for year in [current_year, current_year - 1]:
                params = {
                    'team': team_id,
                    'season': year,
                    'last': 25  # Max 25 meccs évente
                }

                response = requests.get(fixtures_url, headers=headers, params=params, timeout=10)

                if response.status_code == 200:
                    fixtures_data = response.json().get('response', [])
                    all_matches.extend(fixtures_data)

                # Rate limiting
                time.sleep(0.5)

            # Utolsó 50 meccs kiválasztása
            all_matches.sort(key=lambda x: x['fixture']['date'], reverse=True)
            return all_matches[:50]

        except Exception as e:
            print(f"   ❌ API hiba {team_name}-nél: {e}")
            return None

    def _parse_team_data(self, matches_data: List) -> TeamHistoricalData:
        """API adatok elemzése"""
        if not matches_data:
            return self._generate_sample_team_data("Unknown Team")

        team_name = "Unknown Team"
        goals_scored = []
        goals_conceded = []
        recent_form = []
        home_matches = []
        away_matches = []

        for match in matches_data:
            if isinstance(match, dict) and 'teams' in match:
                # API-Sports formátum
                home_team = match['teams']['home']['name']
                away_team = match['teams']['away']['name']
                home_goals = match['goals']['home']
                away_goals = match['goals']['away']

                # Csapat név meghatározása
                if team_name == "Unknown Team":
                    team_name = home_team  # Feltételezzük hogy ez a keresett csapat

                # Csapat perspektívából
                if home_team == team_name:
                    goals_scored.append(home_goals if home_goals is not None else 0)
                    goals_conceded.append(away_goals if away_goals is not None else 0)
                    home_matches.append(match)

                    # Forma
                    if home_goals is not None and away_goals is not None:
                        if home_goals > away_goals:
                            recent_form.append('W')
                        elif home_goals < away_goals:
                            recent_form.append('L')
                        else:
                            recent_form.append('D')

                elif away_team == team_name:
                    goals_scored.append(away_goals if away_goals is not None else 0)
                    goals_conceded.append(home_goals if home_goals is not None else 0)
                    away_matches.append(match)

                    # Forma
                    if home_goals is not None and away_goals is not None:
                        if away_goals > home_goals:
                            recent_form.append('W')
                        elif away_goals < home_goals:
                            recent_form.append('L')
                        else:
                            recent_form.append('D')

        # Statisztikák számítása
        avg_goals_scored = np.mean(goals_scored) if goals_scored else 1.0
        avg_goals_conceded = np.mean(goals_conceded) if goals_conceded else 1.0

        # Hazai/vendég teljesítmény
        home_performance = self._calculate_home_away_stats(home_matches, team_name, True)
        away_performance = self._calculate_home_away_stats(away_matches, team_name, False)

        return TeamHistoricalData(
            team_name=team_name,
            last_50_matches=matches_data,
            avg_goals_scored=avg_goals_scored,
            avg_goals_conceded=avg_goals_conceded,
            recent_form=recent_form[-10:],  # Utolsó 10 meccs
            home_performance=home_performance,
            away_performance=away_performance
        )

    def _calculate_home_away_stats(self, matches: List, team_name: str, is_home: bool) -> Dict:
        """Hazai/vendég statisztikák"""
        if not matches:
            return {'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'win_rate': 0.0}

        wins = draws = losses = 0

        for match in matches:
            home_goals = match['goals']['home']
            away_goals = match['goals']['away']

            if home_goals is None or away_goals is None:
                continue

            if is_home:
                if home_goals > away_goals:
                    wins += 1
                elif home_goals == away_goals:
                    draws += 1
                else:
                    losses += 1
            else:
                if away_goals > home_goals:
                    wins += 1
                elif away_goals == home_goals:
                    draws += 1
                else:
                    losses += 1

        total = wins + draws + losses
        win_rate = wins / total if total > 0 else 0.0

        return {
            'matches': total,
            'wins': wins,
            'draws': draws,
            'losses': losses,
            'win_rate': win_rate
        }

    def _generate_sample_team_data(self, team_name: str) -> TeamHistoricalData:
        """Minta csapat adatok"""
        # Véletlenszerű de reális adatok
        np.random.seed(hash(team_name) % 2**32)

        recent_form = ['W', 'D', 'L']
        form = [np.random.choice(recent_form) for _ in range(10)]

        return TeamHistoricalData(
            team_name=team_name,
            last_50_matches=[],
            avg_goals_scored=np.random.uniform(1.0, 2.5),
            avg_goals_conceded=np.random.uniform(0.8, 2.0),
            recent_form=form,
            home_performance={'matches': 25, 'wins': 12, 'draws': 8, 'losses': 5, 'win_rate': 0.48},
            away_performance={'matches': 25, 'wins': 8, 'draws': 7, 'losses': 10, 'win_rate': 0.32}
        )

    def predict_upcoming_matches(self, matches: List[UpcomingMatch]) -> List[Dict]:
        """Közelgő meccsek predikciója"""
        print(f"\n🔮 {len(matches)} MECCS PREDIKCIÓJA")
        print("=" * 50)

        predictions = []

        for match in matches:
            print(f"\n⚽ {match.home_team} vs {match.away_team}")
            print(f"   🕐 {match.kickoff_time.strftime('%H:%M')} | 🏟️ {match.venue}")
            print(f"   🏆 {match.competition}")

            # Csapatok adatainak lekérdezése
            home_data = self.get_team_last_50_matches(match.home_team)
            away_data = self.get_team_last_50_matches(match.away_team)

            # Predikció számítása
            prediction = self._calculate_match_prediction(match, home_data, away_data)
            predictions.append(prediction)

            # Eredmény kiírása
            print(f"   📊 Predikció:")
            print(f"      🏠 {match.home_team}: {prediction['prob_home']:.1%}")
            print(f"      🤝 Döntetlen: {prediction['prob_draw']:.1%}")
            print(f"      ✈️ {match.away_team}: {prediction['prob_away']:.1%}")
            print(f"      🎯 Bizalom: {prediction['confidence']:.1%}")
            print(f"      ⚽ Várható gólok: {prediction['expected_goals']['home']:.1f} - {prediction['expected_goals']['away']:.1f}")

        return predictions

    def _calculate_match_prediction(self, match: UpcomingMatch,
                                  home_data: TeamHistoricalData,
                                  away_data: TeamHistoricalData) -> Dict:
        """Meccs predikció számítása"""
        # Alap erősségek
        home_strength = self._calculate_team_strength(home_data, is_home=True)
        away_strength = self._calculate_team_strength(away_data, is_home=False)

        # Forma módosítók
        home_form_modifier = self._calculate_form_modifier(home_data.recent_form)
        away_form_modifier = self._calculate_form_modifier(away_data.recent_form)

        # Végső erősségek
        home_final = home_strength * home_form_modifier
        away_final = away_strength * away_form_modifier

        # Valószínűségek
        total_strength = home_final + away_final

        # Hazai előny figyelembevétele
        home_advantage = 1.15
        home_final *= home_advantage

        prob_home = home_final / (home_final + away_final + 0.8)  # 0.8 = döntetlen bázis
        prob_away = away_final / (home_final + away_final + 0.8)
        prob_draw = 0.8 / (home_final + away_final + 0.8)

        # Normalizálás
        total_prob = prob_home + prob_draw + prob_away
        prob_home /= total_prob
        prob_draw /= total_prob
        prob_away /= total_prob

        # Várható gólok
        expected_home = home_data.avg_goals_scored * 1.1  # Hazai bónusz
        expected_away = away_data.avg_goals_scored * 0.9   # Vendég malusz

        # Bizalom
        confidence = min(len(home_data.last_50_matches) + len(away_data.last_50_matches), 100) / 100

        return {
            'match_id': match.fixture_id,
            'home_team': match.home_team,
            'away_team': match.away_team,
            'kickoff_time': match.kickoff_time,
            'competition': match.competition,
            'prob_home': prob_home,
            'prob_draw': prob_draw,
            'prob_away': prob_away,
            'expected_goals': {
                'home': expected_home,
                'away': expected_away
            },
            'confidence': confidence,
            'home_data_quality': len(home_data.last_50_matches),
            'away_data_quality': len(away_data.last_50_matches)
        }

    def _calculate_team_strength(self, team_data: TeamHistoricalData, is_home: bool) -> float:
        """Csapat erősség számítása"""
        base_strength = team_data.avg_goals_scored / max(team_data.avg_goals_conceded, 0.5)

        if is_home:
            performance = team_data.home_performance
        else:
            performance = team_data.away_performance

        performance_modifier = performance['win_rate'] + 0.5  # 0.5-1.5 közötti szorzó

        return base_strength * performance_modifier

    def _calculate_form_modifier(self, recent_form: List[str]) -> float:
        """Forma módosító számítása"""
        if not recent_form:
            return 1.0

        form_points = {'W': 3, 'D': 1, 'L': 0}
        total_points = sum(form_points.get(result, 0) for result in recent_form)
        max_points = len(recent_form) * 3

        form_ratio = total_points / max_points if max_points > 0 else 0.5

        # 0.8-1.2 közötti módosító
        return 0.8 + (form_ratio * 0.4)

def main():
    """Fő futtatási függvény"""
    predictor = LiveMatchPredictor()

    print("⏰ VALÓS IDEJŰ MECCS ELŐREJELZŐ")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    # API kulcsok ellenőrzése
    if not predictor.api_key and not predictor.football_data_key:
        print("⚠️ FIGYELEM: Nincs API kulcs beállítva!")
        print("💡 export API_SPORTS_KEY='your_key'")
        print("💡 export FOOTBALL_DATA_API_KEY='your_key'")
        print("🔄 Ingyenes API-kat próbálom...")

    # Következő 4 óra meccseit lekérdezi
    upcoming_matches = predictor.get_next_4_hours_matches()

    if upcoming_matches:
        # Predikciók készítése
        predictions = predictor.predict_upcoming_matches(upcoming_matches)

        # Összegzés
        print(f"\n📋 ÖSSZEGZÉS")
        print("=" * 30)
        print(f"🎯 Elemzett meccsek: {len(predictions)}")

        for pred in predictions:
            print(f"\n⚽ {pred['home_team']} vs {pred['away_team']}")
            print(f"   🕐 {pred['kickoff_time'].strftime('%H:%M')}")
            print(f"   🎲 Legnagyobb esély: ", end="")

            probs = [
                ('Hazai', pred['prob_home']),
                ('Döntetlen', pred['prob_draw']),
                ('Vendég', pred['prob_away'])
            ]

            best_outcome, best_prob = max(probs, key=lambda x: x[1])
            print(f"{best_outcome} ({best_prob:.1%})")

    else:
        print("❌ Nincs meccs a következő 4 órában")
        print("💡 Próbáld meg később vagy állítsd be az API kulcsokat!")

if __name__ == "__main__":
    main()
