#!/usr/bin/env python3
"""
🚀 SPORTFOGADÁSI ODDS ELEMZŐ ÉS ML RENDSZER

Ez a rendszer:
1. Sportfogadási PDF-ekből odds adatokat nyer ki
2. Meccs előrejelzéseket készít a kinyert adatok alapján
3. Value bet-eket azonosít
4. Komplex statisztikai elemzést végez
5. Automatikusan frissülő adatbázist épít
"""

import os
import sys
import sqlite3
import pandas as pd
import numpy as np
import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

from advanced_football_extractor import AdvancedFootballExtractor
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score
import joblib

class BettingOddsAnalyzer:
    """
    Sportfogadási odds elemző és ML rendszer
    """

    def __init__(self, pdf_folder: str = "/home/bandi/Documents/code/2025/sp3/pdf"):
        self.pdf_folder = pdf_folder
        self.db_path = "betting_analysis.db"
        self.model = None
        self.encoders = {}
        self.scaler = StandardScaler()

        # Odds adatok
        self.odds_data = []
        self.upcoming_matches = []
        self.value_bets = []

        # Adatbázis inicializálása
        self.init_betting_database()

    def init_betting_database(self):
        """Sportfogadási adatbázis létrehozása"""
        print("🗃️ Sportfogadási adatbázis inicializálása...")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Odds adatok táblája
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS betting_odds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                league TEXT,
                match_date TEXT,
                match_time TEXT,
                odds_home REAL,
                odds_draw REAL,
                odds_away REAL,
                over_under_2_5 REAL,
                btts_yes REAL,
                btts_no REAL,
                handicap_odds TEXT,  -- JSON
                bookmaker TEXT DEFAULT 'Tippmix',
                extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(home_team, away_team, match_date, bookmaker)
            )
        ''')

        # ML előrejelzések táblája
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                predicted_result TEXT,
                confidence REAL,
                prob_home REAL,
                prob_draw REAL,
                prob_away REAL,
                odds_home REAL,
                odds_draw REAL,
                odds_away REAL,
                predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Value bet-ek táblája
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS value_bets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_info TEXT,
                bet_type TEXT,
                odds REAL,
                model_probability REAL,
                value_percentage REAL,
                confidence REAL,
                recommended_stake REAL,
                identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()
        print("✅ Sportfogadási adatbázis inicializálva")

    def run_betting_analysis(self):
        """Teljes sportfogadási elemzés"""
        print("🚀 SPORTFOGADÁSI ODDS ELEMZÉS INDÍTÁSA")
        print("=" * 60)

        # 1. PDF-ek feldolgozása és odds kinyerése
        print("\n1️⃣ ODDS ADATOK KINYERÉSE")
        self._extract_betting_odds()

        # 2. Adatok tisztítása és strukturálása
        print("\n2️⃣ ADATOK STRUKTURÁLÁSA")
        self._structure_odds_data()

        # 3. Statisztikai elemzés
        print("\n3️⃣ STATISZTIKAI ELEMZÉS")
        self._statistical_analysis()

        # 4. ML modell építése (ha van történelmi adat)
        print("\n4️⃣ ML MODELL")
        self._build_betting_model()

        # 5. Value bet-ek azonosítása
        print("\n5️⃣ VALUE BET KERESÉS")
        self._find_value_opportunities()

        # 6. Komplex jelentés
        print("\n6️⃣ KOMPLEX JELENTÉS")
        self._generate_betting_report()

        print("\n✅ SPORTFOGADÁSI ELEMZÉS BEFEJEZVE")

    def _extract_betting_odds(self):
        """Odds adatok kinyerése PDF-ekből"""
        pdf_files = [f for f in os.listdir(self.pdf_folder) if f.endswith('.pdf')]

        for pdf_file in pdf_files:
            pdf_path = os.path.join(self.pdf_folder, pdf_file)
            print(f"📄 Odds kinyerése: {pdf_file}")

            self._extract_odds_from_pdf(pdf_path)

        print(f"✅ {len(self.odds_data)} odds adat kinyerve")

    def _extract_odds_from_pdf(self, pdf_path: str):
        """Odds kinyerése egy PDF-ből"""
        extractor = AdvancedFootballExtractor()
        text = extractor._extract_with_pdfplumber(pdf_path)

        if not text:
            return

        # Odds pattern-ek keresése
        self._parse_tippmix_odds(text)

    def _parse_tippmix_odds(self, text: str):
        """Tippmix formátumú odds-ok parse-olása"""
        lines = text.split('\n')
        current_date = None
        current_time = None

        for i, line in enumerate(lines):
            # Dátum keresése
            date_match = re.search(r'(\d{4})\.?\s*(\w+)\s*(\d{1,2})\.?', line)
            if date_match:
                try:
                    year = date_match.group(1)
                    month_name = date_match.group(2)
                    day = date_match.group(3)

                    # Magyar hónapok konvertálása
                    month_map = {
                        'január': '01', 'február': '02', 'március': '03', 'április': '04',
                        'május': '05', 'június': '06', 'július': '07', 'augusztus': '08',
                        'szeptember': '09', 'október': '10', 'november': '11', 'december': '12'
                    }

                    month = month_map.get(month_name.lower(), '06')  # Default június
                    current_date = f"{year}-{month}-{day.zfill(2)}"
                except:
                    pass

            # Odds sorok keresése (Tippmix formátum)
            odds_pattern = r'P\s+(\d{1,2}:\d{2})\s+\d+\s+([^|]+?)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)\s+(\d+[,\.]\d+)'

            match = re.search(odds_pattern, line)
            if match:
                try:
                    time = match.group(1)
                    match_info = match.group(2).strip()
                    odds_home = float(match.group(3).replace(',', '.'))
                    odds_draw = float(match.group(4).replace(',', '.'))
                    odds_away = float(match.group(5).replace(',', '.'))

                    # Csapat nevek kinyerése
                    team_match = re.search(r'([^-]+)\s*-\s*([^-]+)', match_info)
                    if team_match:
                        home_team = team_match.group(1).strip()
                        away_team = team_match.group(2).strip()

                        # Liga becslése
                        league = self._estimate_league_from_teams(home_team, away_team)

                        odds_data = {
                            'home_team': home_team,
                            'away_team': away_team,
                            'league': league,
                            'match_date': current_date,
                            'match_time': time,
                            'odds_home': odds_home,
                            'odds_draw': odds_draw,
                            'odds_away': odds_away
                        }

                        self.odds_data.append(odds_data)
                        print(f"   📊 {home_team} vs {away_team}: {odds_home}-{odds_draw}-{odds_away}")

                except Exception as e:
                    continue

    def _estimate_league_from_teams(self, home_team: str, away_team: str) -> str:
        """Liga becslése csapat nevek alapján"""
        teams = f"{home_team} {away_team}".lower()

        # Nemzetközi meccsek
        countries = ['franciaország', 'spanyolország', 'németország', 'olaszország', 'anglia',
                    'hollandia', 'portugália', 'brazília', 'argentína', 'japán']

        if any(country in teams for country in countries):
            if 'u19' in teams:
                return 'U19 Nemzetközi'
            return 'Válogatott'

        # Ligák csapat nevek alapján
        if any(name in teams for name in ['barcelona', 'real madrid', 'atletico', 'valencia']):
            return 'La Liga'
        elif any(name in teams for name in ['bayern', 'dortmund', 'leipzig', 'frankfurt']):
            return 'Bundesliga'
        elif any(name in teams for name in ['arsenal', 'chelsea', 'liverpool', 'city', 'united']):
            return 'Premier League'
        elif any(name in teams for name in ['ajax', 'psv', 'feyenoord']):
            return 'Eredivisie'
        elif any(name in teams for name in ['ferencváros', 'újpest', 'mtk', 'honvéd']):
            return 'Magyar NB I'
        else:
            return 'Egyéb Liga'

    def _structure_odds_data(self):
        """Odds adatok strukturálása és adatbázisba mentése"""
        if not self.odds_data:
            print("❌ Nincs odds adat a strukturáláshoz")
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        saved_count = 0
        for odds in self.odds_data:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO betting_odds
                    (home_team, away_team, league, match_date, match_time,
                     odds_home, odds_draw, odds_away)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    odds['home_team'], odds['away_team'], odds['league'],
                    odds['match_date'], odds['match_time'],
                    odds['odds_home'], odds['odds_draw'], odds['odds_away']
                ))
                saved_count += 1
            except Exception as e:
                print(f"⚠️ Mentési hiba: {e}")
                continue

        conn.commit()
        conn.close()

        print(f"✅ {saved_count} odds adat mentve az adatbázisba")

    def _statistical_analysis(self):
        """Statisztikai elemzés az odds adatokon"""
        conn = sqlite3.connect(self.db_path)

        # Alapstatisztikák
        df = pd.read_sql_query("SELECT * FROM betting_odds", conn)

        if df.empty:
            print("❌ Nincs adat az elemzéshez")
            conn.close()
            return

        print("📊 Odds statisztikák:")
        print(f"   Összes meccs: {len(df)}")
        print(f"   Különböző ligák: {df['league'].nunique()}")
        print(f"   Átlagos hazai odds: {df['odds_home'].mean():.2f}")
        print(f"   Átlagos döntetlen odds: {df['odds_draw'].mean():.2f}")
        print(f"   Átlagos vendég odds: {df['odds_away'].mean():.2f}")

        # Liga eloszlás
        league_stats = df['league'].value_counts()
        print(f"\n🏟️ Liga eloszlás:")
        for league, count in league_stats.items():
            print(f"   {league}: {count} meccs")

        # Odds eloszlás elemzése
        print(f"\n📈 Odds elemzés:")

        # Kedvencek (alacsony odds)
        favorites = df[df['odds_home'] < 1.5]
        print(f"   Erős kedvencek (< 1.5): {len(favorites)} meccs")

        # Kiegyenlített meccsek
        balanced = df[(df['odds_home'] >= 1.8) & (df['odds_home'] <= 2.2) &
                     (df['odds_away'] >= 1.8) & (df['odds_away'] <= 2.2)]
        print(f"   Kiegyenlített meccsek: {len(balanced)} meccs")

        # Valószínűségek számítása
        df['prob_home'] = 1 / df['odds_home']
        df['prob_draw'] = 1 / df['odds_draw']
        df['prob_away'] = 1 / df['odds_away']
        df['total_prob'] = df['prob_home'] + df['prob_draw'] + df['prob_away']
        df['bookmaker_margin'] = ((df['total_prob'] - 1) * 100)

        print(f"   Átlagos bookmaker margin: {df['bookmaker_margin'].mean():.1f}%")

        conn.close()

    def _build_betting_model(self):
        """ML modell építése odds alapú előrejelzésekhez"""
        # Mivel nincs történelmi eredményünk, statisztikai modellt használunk
        print("📊 Statisztikai modell építése...")

        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT * FROM betting_odds", conn)
        conn.close()

        if df.empty:
            print("❌ Nincs adat a modellhez")
            return

        # Alapvető valószínűségek számítása odds-okból
        df['prob_home'] = 1 / df['odds_home']
        df['prob_draw'] = 1 / df['odds_draw']
        df['prob_away'] = 1 / df['odds_away']

        # Normalizáljuk (margin eltávolítása)
        df['total_prob'] = df['prob_home'] + df['prob_draw'] + df['prob_away']
        df['norm_prob_home'] = df['prob_home'] / df['total_prob']
        df['norm_prob_draw'] = df['prob_draw'] / df['total_prob']
        df['norm_prob_away'] = df['prob_away'] / df['total_prob']

        # Liga alapú korrekciók
        league_adjustments = {
            'Válogatott': {'home_boost': 0.05, 'draw_penalty': -0.02},
            'U19 Nemzetközi': {'home_boost': 0.03, 'draw_boost': 0.02},
            'Premier League': {'quality_boost': 0.02},
            'Magyar NB I': {'home_boost': 0.08}
        }

        # Modell adatok mentése
        model_data = {
            'type': 'statistical_odds_model',
            'average_probabilities': {
                'home': df['norm_prob_home'].mean(),
                'draw': df['norm_prob_draw'].mean(),
                'away': df['norm_prob_away'].mean()
            },
            'league_adjustments': league_adjustments,
            'created_at': datetime.now().isoformat()
        }

        with open('betting_model.json', 'w', encoding='utf-8') as f:
            json.dump(model_data, f, indent=2, ensure_ascii=False)

        print("✅ Statisztikai modell létrehozva")

    def _find_value_opportunities(self):
        """Value bet lehetőségek keresése"""
        print("💰 Value bet lehetőségek keresése...")

        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT * FROM betting_odds", conn)

        if df.empty:
            print("❌ Nincs adat a value bet kereséshez")
            conn.close()
            return

        value_bets = []

        for _, row in df.iterrows():
            # Egyszerű value számítás: összehasonlítjuk a ligák átlagos odds-aival
            expected_odds = self._calculate_expected_odds(row)

            # Value számítás minden kimenetelre
            home_value = (expected_odds['home'] / row['odds_home']) - 1
            draw_value = (expected_odds['draw'] / row['odds_draw']) - 1
            away_value = (expected_odds['away'] / row['odds_away']) - 1

            # Value threshold (3% felett)
            threshold = 0.03

            if home_value > threshold:
                value_bets.append({
                    'match': f"{row['home_team']} vs {row['away_team']}",
                    'bet_type': 'Hazai győzelem',
                    'odds': row['odds_home'],
                    'expected_odds': expected_odds['home'],
                    'value': home_value,
                    'league': row['league']
                })

            if draw_value > threshold:
                value_bets.append({
                    'match': f"{row['home_team']} vs {row['away_team']}",
                    'bet_type': 'Döntetlen',
                    'odds': row['odds_draw'],
                    'expected_odds': expected_odds['draw'],
                    'value': draw_value,
                    'league': row['league']
                })

            if away_value > threshold:
                value_bets.append({
                    'match': f"{row['home_team']} vs {row['away_team']}",
                    'bet_type': 'Vendég győzelem',
                    'odds': row['odds_away'],
                    'expected_odds': expected_odds['away'],
                    'value': away_value,
                    'league': row['league']
                })

        # Value bet-ek rendezése és mentése
        value_bets.sort(key=lambda x: x['value'], reverse=True)

        if value_bets:
            print(f"💎 {len(value_bets)} value bet találva:")

            cursor = conn.cursor()
            for bet in value_bets[:10]:  # Top 10
                print(f"   💰 {bet['match']}: {bet['bet_type']} ({bet['odds']:.2f}) - Value: {bet['value']:.1%}")

                # Adatbázisba mentés
                cursor.execute('''
                    INSERT INTO value_bets
                    (match_info, bet_type, odds, model_probability, value_percentage, confidence)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    bet['match'], bet['bet_type'], bet['odds'],
                    1/bet['expected_odds'], bet['value'] * 100, 0.7
                ))

            conn.commit()

            # JSON mentés
            with open('value_betting_opportunities.json', 'w', encoding='utf-8') as f:
                json.dump(value_bets, f, indent=2, ensure_ascii=False)
        else:
            print("📝 Nem találhatóak jelentős value bet-ek")

        conn.close()

    def _calculate_expected_odds(self, row) -> Dict[str, float]:
        """Várható odds számítása liga és csapat alapján"""
        # Alapértelmezett valószínűségek
        base_probs = {'home': 0.45, 'draw': 0.25, 'away': 0.30}

        # Liga alapú módosítások
        league_mods = {
            'Válogatott': {'home': 0.05, 'draw': -0.02, 'away': -0.03},
            'U19 Nemzetközi': {'home': 0.02, 'draw': 0.03, 'away': -0.05},
            'Premier League': {'home': 0.03, 'draw': 0.02, 'away': -0.05},
            'Magyar NB I': {'home': 0.08, 'draw': -0.03, 'away': -0.05}
        }

        league = row['league']
        mods = league_mods.get(league, {'home': 0, 'draw': 0, 'away': 0})

        # Módosított valószínűségek
        adj_probs = {
            'home': max(0.1, min(0.8, base_probs['home'] + mods['home'])),
            'draw': max(0.1, min(0.4, base_probs['draw'] + mods['draw'])),
            'away': max(0.1, min(0.8, base_probs['away'] + mods['away']))
        }

        # Normalizálás
        total = sum(adj_probs.values())
        adj_probs = {k: v/total for k, v in adj_probs.items()}

        # Odds számítása (kis margin hozzáadása)
        margin = 1.05
        expected_odds = {
            'home': margin / adj_probs['home'],
            'draw': margin / adj_probs['draw'],
            'away': margin / adj_probs['away']
        }

        return expected_odds

    def _generate_betting_report(self):
        """Komplex sportfogadási jelentés"""
        print("📊 Komplex sportfogadási jelentés készítése...")

        conn = sqlite3.connect(self.db_path)

        # Adatok összegyűjtése
        odds_df = pd.read_sql_query("SELECT * FROM betting_odds", conn)
        value_bets_df = pd.read_sql_query("SELECT * FROM value_bets ORDER BY value_percentage DESC", conn)

        conn.close()

        # Jelentés összeállítása
        report = f"""
🚀 SPORTFOGADÁSI ODDS ELEMZÉS JELENTÉS
=====================================
Készítve: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📊 ÖSSZEFOGLALÓ STATISZTIKÁK
----------------------------
• Elemzett meccsek száma: {len(odds_df)}
• Különböző ligák: {odds_df['league'].nunique() if not odds_df.empty else 0}
• Talált value bet-ek: {len(value_bets_df)}

🏟️ LIGA ELOSZLÁS
-----------------
"""

        if not odds_df.empty:
            league_stats = odds_df['league'].value_counts()
            for league, count in league_stats.items():
                report += f"• {league}: {count} meccs\n"

            report += f"""
📈 ODDS STATISZTIKÁK
--------------------
• Átlagos hazai odds: {odds_df['odds_home'].mean():.2f}
• Átlagos döntetlen odds: {odds_df['odds_draw'].mean():.2f}
• Átlagos vendég odds: {odds_df['odds_away'].mean():.2f}

💎 TOP VALUE BET-EK
-------------------
"""

            # Top 5 value bet
            for _, bet in value_bets_df.head(5).iterrows():
                report += f"• {bet['match_info']}: {bet['bet_type']} ({bet['odds']:.2f}) - Value: {bet['value_percentage']:.1f}%\n"

        report += f"""
📁 LÉTREHOZOTT FÁJLOK
---------------------
• betting_analysis.db - Teljes adatbázis
• betting_model.json - Statisztikai modell
• value_betting_opportunities.json - Value bet-ek
• betting_report.txt - Ez a jelentés

✅ SPORTFOGADÁSI ELEMZÉS SIKERESEN BEFEJEZVE
"""

        # Jelentés mentése
        with open('betting_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)

        print(report)

def main():
    """Sportfogadási elemzés futtatása"""
    analyzer = BettingOddsAnalyzer()
    analyzer.run_betting_analysis()

if __name__ == "__main__":
    main()
