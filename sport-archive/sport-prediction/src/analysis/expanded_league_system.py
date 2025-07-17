#!/usr/bin/env python3
"""
🌍 KIBŐVÍTETT MULTI-LIGA RENDSZER
Több bajnokság + kupa sorozatok integrálása a pontosabb elemzéshez.
"""

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests

class ExpandedLeagueSystem:
    """Kibővített több bajnokság és kupa rendszer"""

    def __init__(self):
        # Fő bajnokságok
        self.premier_leagues = {
            'premier_league': {
                'name': 'Premier League',
                'country': 'England',
                'api_id': 39,
                'level': 1,
                'quality_score': 95,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,  # Nyári szünet
                'timezone': 'Europe/London'
            },
            'bundesliga': {
                'name': 'Bundesliga',
                'country': 'Germany',
                'api_id': 78,
                'level': 1,
                'quality_score': 93,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/Berlin'
            },
            'serie_a': {
                'name': 'Serie A',
                'country': 'Italy',
                'api_id': 135,
                'level': 1,
                'quality_score': 91,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/Rome'
            },
            'la_liga': {
                'name': 'La Liga',
                'country': 'Spain',
                'api_id': 140,
                'level': 1,
                'quality_score': 94,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/Madrid'
            },
            'ligue_1': {
                'name': 'Ligue 1',
                'country': 'France',
                'api_id': 61,
                'level': 1,
                'quality_score': 87,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/Paris'
            }
        }

        # Másodlagos bajnokságok
        self.secondary_leagues = {
            'championship': {
                'name': 'Championship',
                'country': 'England',
                'api_id': 40,
                'level': 2,
                'quality_score': 75,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/London'
            },
            'bundesliga_2': {
                'name': '2. Bundesliga',
                'country': 'Germany',
                'api_id': 79,
                'level': 2,
                'quality_score': 73,
                'season_months': [8, 9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'timezone': 'Europe/Berlin'
            },
            'mls': {
                'name': 'Major League Soccer',
                'country': 'USA/Canada',
                'api_id': 253,
                'level': 2,
                'quality_score': 70,
                'season_months': [3, 4, 5, 6, 7, 8, 9, 10, 11],
                'active_now': True,
                'timezone': 'America/New_York'
            },
            'brasileirao': {
                'name': 'Brasileirão Serie A',
                'country': 'Brazil',
                'api_id': 71,
                'level': 1,
                'quality_score': 82,
                'season_months': [4, 5, 6, 7, 8, 9, 10, 11, 12],
                'active_now': True,
                'timezone': 'America/Sao_Paulo'
            },
            'j_league': {
                'name': 'J1 League',
                'country': 'Japan',
                'api_id': 98,
                'level': 2,
                'quality_score': 72,
                'season_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                'active_now': True,
                'timezone': 'Asia/Tokyo'
            }
        }

        # Kupa sorozatok
        self.cup_competitions = {
            'champions_league': {
                'name': 'UEFA Champions League',
                'type': 'continental',
                'api_id': 2,
                'quality_score': 98,
                'season_months': [9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'format': 'knockout',
                'timezone': 'Europe/Zurich'
            },
            'europa_league': {
                'name': 'UEFA Europa League',
                'type': 'continental',
                'api_id': 3,
                'quality_score': 88,
                'season_months': [9, 10, 11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'format': 'knockout',
                'timezone': 'Europe/Zurich'
            },
            'fa_cup': {
                'name': 'FA Cup',
                'type': 'domestic',
                'api_id': 45,
                'quality_score': 85,
                'season_months': [11, 12, 1, 2, 3, 4, 5],
                'active_now': False,
                'format': 'knockout',
                'timezone': 'Europe/London'
            },
            'copa_libertadores': {
                'name': 'Copa Libertadores',
                'type': 'continental',
                'api_id': 13,
                'quality_score': 92,
                'season_months': [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                'active_now': True,
                'format': 'group_knockout',
                'timezone': 'America/Sao_Paulo'
            },
            'copa_america': {
                'name': 'Copa América',
                'type': 'international',
                'api_id': 9,
                'quality_score': 96,
                'season_months': [6, 7],  # Kétévente
                'active_now': True,
                'format': 'tournament',
                'timezone': 'America/Sao_Paulo'
            },
            'world_cup_qualifiers': {
                'name': 'World Cup Qualifiers',
                'type': 'international',
                'api_id': 32,
                'quality_score': 90,
                'season_months': [3, 6, 9, 10, 11],
                'active_now': True,
                'format': 'league',
                'timezone': 'UTC'
            }
        }

        # Aktív nyári bajnokságok
        self.summer_leagues = {
            'mls': self.secondary_leagues['mls'],
            'brasileirao': self.secondary_leagues['brasileirao'],
            'j_league': self.secondary_leagues['j_league'],
            'a_league_women': {
                'name': 'A-League Women',
                'country': 'Australia',
                'api_id': 196,
                'level': 1,
                'quality_score': 75,
                'season_months': [11, 12, 1, 2, 3, 4],
                'active_now': False,
                'timezone': 'Australia/Sydney'
            },
            'chinese_super_league': {
                'name': 'Chinese Super League',
                'country': 'China',
                'api_id': 169,
                'level': 2,
                'quality_score': 68,
                'season_months': [3, 4, 5, 6, 7, 8, 9, 10, 11],
                'active_now': True,
                'timezone': 'Asia/Shanghai'
            }
        }

    def get_all_competitions(self) -> Dict:
        """Összes verseny egy helyen"""
        all_competitions = {}
        all_competitions.update({f"premier_{k}": v for k, v in self.premier_leagues.items()})
        all_competitions.update({f"secondary_{k}": v for k, v in self.secondary_leagues.items()})
        all_competitions.update({f"cup_{k}": v for k, v in self.cup_competitions.items()})
        all_competitions.update({f"summer_{k}": v for k, v in self.summer_leagues.items()})
        return all_competitions

    def get_active_competitions(self) -> Dict:
        """Jelenleg aktív versenyek"""
        current_month = datetime.now().month
        active = {}

        all_comps = self.get_all_competitions()
        for comp_id, info in all_comps.items():
            if current_month in info['season_months'] and info.get('active_now', False):
                active[comp_id] = info

        return active

    def get_data_priority_list(self) -> List[Dict]:
        """Adatok prioritási sorrendje (quality_score alapján)"""
        all_comps = self.get_all_competitions()
        sorted_comps = sorted(
            all_comps.items(),
            key=lambda x: x[1].get('quality_score', 0),
            reverse=True
        )

        priority_list = []
        for comp_id, info in sorted_comps:
            priority_list.append({
                'id': comp_id,
                'name': info['name'],
                'quality_score': info.get('quality_score', 0),
                'level': info.get('level', 'cup'),
                'active_now': info.get('active_now', False),
                'api_id': info.get('api_id', None)
            })

        return priority_list

    def create_enhanced_data_structure(self):
        """Bővített adatstruktúra létrehozása"""
        print("🏗️ BŐVÍTETT ADATSTRUKTÚRA LÉTREHOZÁSA")
        print("=" * 50)

        base_path = "data/enhanced_system"
        os.makedirs(base_path, exist_ok=True)

        # Kategóriánkénti mappák
        categories = ['premier_leagues', 'secondary_leagues', 'cup_competitions', 'summer_leagues']
        for category in categories:
            cat_path = os.path.join(base_path, category)
            os.makedirs(cat_path, exist_ok=True)
            os.makedirs(os.path.join(cat_path, 'raw'), exist_ok=True)
            os.makedirs(os.path.join(cat_path, 'processed'), exist_ok=True)
            os.makedirs(os.path.join(cat_path, 'analysis'), exist_ok=True)

        # Master konfiguráció
        master_config = {
            'system_name': 'Enhanced Multi-League System',
            'version': '2.0',
            'created': datetime.now().isoformat(),
            'total_competitions': len(self.get_all_competitions()),
            'active_competitions': len(self.get_active_competitions()),
            'data_categories': categories,
            'quality_levels': {
                'tier_1': '90-100 (Top European leagues, Champions League)',
                'tier_2': '80-89 (Strong domestic leagues, Europa League)',
                'tier_3': '70-79 (Developing leagues, domestic cups)',
                'tier_4': '60-69 (Lower quality leagues)'
            },
            'analysis_features': [
                'cross_league_comparison',
                'cup_vs_league_dynamics',
                'seasonal_form_tracking',
                'international_competition_impact',
                'player_fatigue_modeling'
            ]
        }

        with open(os.path.join(base_path, 'master_config.json'), 'w') as f:
            json.dump(master_config, f, indent=2)

        # Verseny specifikus konfigurációk
        self._create_competition_configs(base_path)

        print(f"✅ Bővített rendszer létrehozva: {base_path}")

    def _create_competition_configs(self, base_path: str):
        """Verseny specifikus konfigurációk létrehozása"""
        competitions = {
            'premier_leagues': self.premier_leagues,
            'secondary_leagues': self.secondary_leagues,
            'cup_competitions': self.cup_competitions,
            'summer_leagues': self.summer_leagues
        }

        for category, comps in competitions.items():
            for comp_id, info in comps.items():
                comp_path = os.path.join(base_path, category, comp_id)
                os.makedirs(comp_path, exist_ok=True)

                config = {
                    'competition_id': comp_id,
                    'category': category,
                    **info,
                    'data_sources': self._get_enhanced_sources(comp_id, category),
                    'analysis_weights': self._get_analysis_weights(info),
                    'last_updated': datetime.now().isoformat()
                }

                with open(os.path.join(comp_path, f'{comp_id}_config.json'), 'w') as f:
                    json.dump(config, f, indent=2)

    def _get_enhanced_sources(self, comp_id: str, category: str) -> Dict:
        """Bővített adatforrások"""
        base_sources = {
            'api_sports': 'Primary API source',
            'football_data': 'Secondary API source',
            'thesportsdb': 'Free API source'
        }

        # Kategória specifikus források
        if category == 'premier_leagues':
            base_sources.update({
                'official_website': 'League official data',
                'transfermarkt': 'Player/team valuations',
                'fbref': 'Advanced statistics'
            })
        elif category == 'cup_competitions':
            base_sources.update({
                'uefa_com': 'Official UEFA data',
                'fifa_com': 'FIFA tournament data'
            })
        elif category == 'summer_leagues':
            base_sources.update({
                'espn': 'ESPN sports data',
                'local_sources': 'Region specific sources'
            })

        return base_sources

    def _get_analysis_weights(self, competition_info: Dict) -> Dict:
        """Elemzési súlyok a verseny minősége alapján"""
        quality_score = competition_info.get('quality_score', 70)
        level = competition_info.get('level', 2)
        comp_type = competition_info.get('type', 'league')

        # Alap súlyok
        weights = {
            'prediction_weight': min(quality_score / 100, 1.0),
            'historical_importance': 0.8 if quality_score > 85 else 0.6,
            'cross_league_relevance': 0.9 if level == 1 else 0.7,
            'seasonal_impact': 1.0 if comp_type == 'league' else 0.8,
            'fatigue_factor': 0.9 if comp_type in ['continental', 'international'] else 0.5
        }

        return weights

    def generate_enhanced_analysis_report(self):
        """Bővített elemzési jelentés"""
        print("📊 BŐVÍTETT RENDSZER ELEMZÉS")
        print("=" * 40)

        active_comps = self.get_active_competitions()
        priority_list = self.get_data_priority_list()

        print(f"🎯 Aktív versenyek: {len(active_comps)}")
        print(f"📋 Összes verseny: {len(self.get_all_competitions())}")
        print()

        print("🏆 TOP 10 MINŐSÉGI VERSENY:")
        for i, comp in enumerate(priority_list[:10], 1):
            status = "🟢 AKTÍV" if comp['active_now'] else "🔴 SZÜNETEL"
            print(f"{i:2d}. {comp['name']:<25} ({comp['quality_score']:2d}) {status}")

        print(f"\n🌍 JELENLEG AKTÍV VERSENYEK:")
        for comp_id, info in active_comps.items():
            country = info.get('country', 'International')
            comp_type = info.get('type', 'League')
            print(f"   ⚽ {info['name']} ({country}) - {comp_type}")

        print(f"\n📈 ELEMZÉSI LEHETŐSÉGEK:")
        print("   🔄 Cross-league összehasonlítás")
        print("   🏆 Kupa vs bajnoki dinamika")
        print("   🌐 Nemzetközi verseny hatás")
        print("   😴 Játékos fáradtság modellezés")
        print("   📊 Kombinált predikciós modellek")

def main():
    """Fő futtatási függvény"""
    system = ExpandedLeagueSystem()

    print("🌍 KIBŐVÍTETT MULTI-LIGA RENDSZER")
    print("📅", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("=" * 60)

    # Adatstruktúra létrehozása
    system.create_enhanced_data_structure()

    # Elemzési jelentés
    system.generate_enhanced_analysis_report()

    print("\n💡 KÖVETKEZŐ LÉPÉSEK:")
    print("   1️⃣ API kulcsok beszerzése (API-Sports, Football-Data)")
    print("   2️⃣ Adatok letöltése prioritás szerint")
    print("   3️⃣ Cross-league elemzési algoritmusok fejlesztése")
    print("   4️⃣ Kombinált predikciós modellek építése")
    print("   5️⃣ Valós idejű adatfrissítés automatizálása")

if __name__ == "__main__":
    main()
