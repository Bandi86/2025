#!/usr/bin/env python3
"""
SZERENCSEMIX ADATTISZTÍTÓ
========================

Célja: Az adatbázisban lévő hibás csapat nevek és liga információk javítása.

Főbb funkciók:
1. Csapat nevek tisztítása (fogadási piacok eltávolítása)
2. Liga felismerés és besorolás
3. Duplikátumok egyesítése
4. Adatminőségi metrikák frissítése

Használat:
    python data_cleaner.py --action clean_teams
    python data_cleaner.py --action classify_leagues
    python data_cleaner.py --action all

Verzió: 1.0
Dátum: 2025-06-28
"""

import sqlite3
import re
import json
import argparse
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class TeamMapping:
    """Csapat tisztítási szabály"""
    original: str
    cleaned: str
    confidence: float
    reason: str

@dataclass
class LeagueMapping:
    """Liga besorolási szabály"""
    team_name: str
    league: str
    confidence: float
    country: str

class SzerencseMixDataCleaner:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row

        # Fogadási piacok amelyeket el kell távolítani a csapat nevekből
        self.betting_patterns = [
            r'\s+Kétesély\s*\([^)]+\)',
            r'\s+Hendikep\s+\d+:\d+',
            r'\s+Az első \d+ perc eredménye\s*\([^)]+\)',
            r'\s+\d+\.\s*félidő\s*-\s*1X2',
            r'\s+Szögletek száma\s*\([^)]+\)',
            r'\s+Melyik csapat végez el több szögletet\?\s*\([^)]+\)',
            r'\s+\d+\.\s*félidő\s*-\s*1X2',
            r'\s+\(Helyszín:\s*[^)]+\)',
            r'\s+U\d+',  # U21, U19 stb.
        ]

        # Ismert ligák és országok
        self.league_mappings = {
            # Angol ligák
            'premier league': {'names': ['arsenal', 'chelsea', 'liverpool', 'manchester', 'tottenham', 'brighton'], 'country': 'England'},
            'championship': {'names': ['huddersfield', 'leeds', 'sheffield'], 'country': 'England'},

            # Német ligák
            'bundesliga': {'names': ['bayern', 'dortmund', 'leipzig', 'frankfurt', 'köln'], 'country': 'Germany'},
            '2. bundesliga': {'names': ['hamburg', 'nürnberg', 'karlsruhe'], 'country': 'Germany'},

            # Spanyol ligák
            'la liga': {'names': ['barcelona', 'real madrid', 'atletico', 'valencia', 'sevilla'], 'country': 'Spain'},
            'segunda division': {'names': ['oviedo', 'mirandes', 'huesca'], 'country': 'Spain'},

            # Olasz ligák
            'serie a': {'names': ['juventus', 'milan', 'inter', 'roma', 'napoli', 'internazionale'], 'country': 'Italy'},
            'serie b': {'names': ['brescia', 'chievo', 'pescara'], 'country': 'Italy'},

            # Francia ligák
            'ligue 1': {'names': ['psg', 'marseille', 'lyon', 'toulouse', 'bordeaux'], 'country': 'France'},
            'ligue 2': {'names': ['lorient', 'grenoble'], 'country': 'France'},

            # Brazil ligák
            'serie a (brazil)': {'names': ['flamengo', 'palmeiras', 'santos', 'corinthians', 'botafogo'], 'country': 'Brazil'},
            'serie b (brazil)': {'names': ['criciuma', 'avai', 'chapecoense'], 'country': 'Brazil'},

            # Japán ligák
            'j1 league': {'names': ['kashima', 'urawa', 'yokohama', 'kawasaki', 'gamba osaka'], 'country': 'Japan'},
            'j2 league': {'names': ['machida', 'shimizu', 'okayama'], 'country': 'Japan'},

            # Dél-koreai ligák
            'k league 1': {'names': ['ulsan', 'jeonbuk', 'fc seoul', 'pohang'], 'country': 'South Korea'},
            'k league 2': {'names': ['anyang', 'suwon city', 'bucheon'], 'country': 'South Korea'},

            # Norvég ligák
            'eliteserien': {'names': ['rosenborg', 'bodö/glimt', 'brann bergen'], 'country': 'Norway'},
            '1. divisjon': {'names': ['aalesund', 'stabæk', 'sandnes ulf'], 'country': 'Norway'},

            # Svéd ligák
            'allsvenskan': {'names': ['hammarby', 'malmö', 'göteborg'], 'country': 'Sweden'},
            'superettan': {'names': ['halmstad', 'västerås', 'helsingborg'], 'country': 'Sweden'},

            # Argentín ligák
            'primera division (argentina)': {'names': ['boca juniors', 'river plate', 'independiente'], 'country': 'Argentina'},
            'primera b': {'names': ['arsenal sarandí', 'quilmes', 'belgrano'], 'country': 'Argentina'},

            # MLS
            'mls': {'names': ['los angeles fc', 'chicago', 'atlanta'], 'country': 'USA'},
            'usl championship': {'names': ['louisville city', 'colorado springs'], 'country': 'USA'},

            # Magyar ligák
            'nb i': {'names': ['ferencváros', 'újpest', 'honvéd'], 'country': 'Hungary'},
            'nb ii': {'names': ['debrecen', 'szombathely'], 'country': 'Hungary'},
        }

    def clean_team_names(self) -> List[TeamMapping]:
        """Csapat nevek tisztítása"""
        print("🧹 Csapat nevek tisztítása...")

        mappings = []
        cursor = self.conn.cursor()

        # Összes csapat lekérdezése
        cursor.execute("SELECT team_id, team_name, normalized_name FROM teams ORDER BY team_id")
        teams = cursor.fetchall()

        cleaned_names = {}  # normalized_name -> team_id mapping

        for team in teams:
            original_name = team['team_name']
            cleaned_name = self._clean_team_name(original_name)
            normalized = cleaned_name.lower()

            if cleaned_name != original_name:
                mapping = TeamMapping(
                    original=original_name,
                    cleaned=cleaned_name,
                    confidence=0.9 if len(cleaned_name) > 3 else 0.6,
                    reason="Fogadási piacok eltávolítása"
                )
                mappings.append(mapping)

                # Egyedi normalized név biztosítása
                if normalized in cleaned_names:
                    # Ha már létezik, akkor egyesítjük a csapatokat
                    existing_id = cleaned_names[normalized]
                    self._merge_teams(team['team_id'], existing_id, cursor)
                else:
                    # Frissítés az adatbázisban
                    try:
                        cursor.execute("""
                            UPDATE teams
                            SET team_name = ?, normalized_name = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE team_id = ?
                        """, (cleaned_name, normalized, team['team_id']))
                        cleaned_names[normalized] = team['team_id']
                    except sqlite3.IntegrityError:
                        # Ha mégis ütközés van, egyesítjük
                        cursor.execute("SELECT team_id FROM teams WHERE normalized_name = ?", (normalized,))
                        existing = cursor.fetchone()
                        if existing:
                            self._merge_teams(team['team_id'], existing['team_id'], cursor)

        self.conn.commit()
        print(f"✅ {len(mappings)} csapat név javítva")
        return mappings

    def _clean_team_name(self, name: str) -> str:
        """Egyetlen csapat név tisztítása"""
        cleaned = name.strip()

        # Fogadási piacok eltávolítása
        for pattern in self.betting_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

        # Felesleges szóközök eltávolítása
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        # Üres név kezelése
        if not cleaned or len(cleaned) < 2:
            cleaned = "Unknown Team"

        return cleaned

    def _merge_teams(self, remove_id: int, keep_id: int, cursor) -> None:
        """Két csapat egyesítése"""
        # Meccsek frissítése
        cursor.execute("""
            UPDATE historical_matches
            SET home_team_id = ?
            WHERE home_team_id = ?
        """, (keep_id, remove_id))

        cursor.execute("""
            UPDATE historical_matches
            SET away_team_id = ?
            WHERE away_team_id = ?
        """, (keep_id, remove_id))

        cursor.execute("""
            UPDATE future_matches
            SET home_team_id = ?
            WHERE home_team_id = ?
        """, (keep_id, remove_id))

        cursor.execute("""
            UPDATE future_matches
            SET away_team_id = ?
            WHERE away_team_id = ?
        """, (keep_id, remove_id))

        # Csapat törlése
        cursor.execute("DELETE FROM teams WHERE team_id = ?", (remove_id,))

    def classify_leagues(self) -> List[LeagueMapping]:
        """Liga besorolás csapat nevek alapján"""
        print("🏆 Liga besorolás...")

        mappings = []
        cursor = self.conn.cursor()

        # Meccsek lekérdezése amelyek ismeretlen ligában vannak
        cursor.execute("""
            SELECT match_id, home_team, away_team, league
            FROM historical_matches
            WHERE league IN ('Ismeretlen Liga', 'Unknown League', 'N/A', '')
            OR league IS NULL
        """)
        matches = cursor.fetchall()

        for match in matches:
            home_team = match['home_team'].lower()
            away_team = match['away_team'].lower()

            # Liga felismerés
            detected_league = self._detect_league(home_team, away_team)

            if detected_league:
                mapping = LeagueMapping(
                    team_name=f"{match['home_team']} vs {match['away_team']}",
                    league=detected_league['league'],
                    confidence=detected_league['confidence'],
                    country=detected_league['country']
                )
                mappings.append(mapping)

                # Frissítés az adatbázisban
                cursor.execute("""
                    UPDATE historical_matches
                    SET league = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE match_id = ?
                """, (detected_league['league'], match['match_id']))

        # Jövőbeli meccsek is
        cursor.execute("""
            SELECT match_id, home_team, away_team, league
            FROM future_matches
            WHERE league IN ('Ismeretlen Liga', 'Unknown League', 'N/A', '')
            OR league IS NULL
        """)
        future_matches = cursor.fetchall()

        for match in future_matches:
            home_team = match['home_team'].lower()
            away_team = match['away_team'].lower()

            detected_league = self._detect_league(home_team, away_team)

            if detected_league:
                cursor.execute("""
                    UPDATE future_matches
                    SET league = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE match_id = ?
                """, (detected_league['league'], match['match_id']))

        self.conn.commit()
        print(f"✅ {len(mappings)} liga besorolás elvégezve")
        return mappings

    def _detect_league(self, home_team: str, away_team: str) -> Optional[Dict]:
        """Liga felismerés csapat nevek alapján"""
        teams = [home_team, away_team]

        for league_name, league_info in self.league_mappings.items():
            matches = 0
            for team in teams:
                for known_team in league_info['names']:
                    if known_team.lower() in team:
                        matches += 1
                        break

            if matches >= 1:  # Legalább egy csapat match
                confidence = 0.8 if matches == 2 else 0.6
                return {
                    'league': league_name.title(),
                    'confidence': confidence,
                    'country': league_info['country']
                }

        # Speciális esetek
        if any('u21' in team for team in teams):
            return {
                'league': 'U21 International',
                'confidence': 0.9,
                'country': 'International'
            }

        return None

    def remove_duplicates(self) -> int:
        """Duplikált csapatok egyesítése"""
        print("🔗 Duplikátumok egyesítése...")

        cursor = self.conn.cursor()

        # Hasonló nevek keresése
        cursor.execute("""
            SELECT t1.team_id as id1, t1.team_name as name1,
                   t2.team_id as id2, t2.team_name as name2
            FROM teams t1
            JOIN teams t2 ON t1.team_id < t2.team_id
            WHERE LOWER(t1.normalized_name) = LOWER(t2.normalized_name)
            OR (LENGTH(t1.team_name) > 3 AND LENGTH(t2.team_name) > 3
                AND t1.team_name LIKE '%' || t2.team_name || '%')
        """)

        duplicates = cursor.fetchall()
        merged_count = 0

        for dup in duplicates:
            # A rövidebb ID-t tartjuk meg (általában ez a régebbi)
            keep_id = min(dup['id1'], dup['id2'])
            remove_id = max(dup['id1'], dup['id2'])

            # Meccsek frissítése
            cursor.execute("""
                UPDATE historical_matches
                SET home_team_id = ?
                WHERE home_team_id = ?
            """, (keep_id, remove_id))

            cursor.execute("""
                UPDATE historical_matches
                SET away_team_id = ?
                WHERE away_team_id = ?
            """, (keep_id, remove_id))

            cursor.execute("""
                UPDATE future_matches
                SET home_team_id = ?
                WHERE home_team_id = ?
            """, (keep_id, remove_id))

            cursor.execute("""
                UPDATE future_matches
                SET away_team_id = ?
                WHERE away_team_id = ?
            """, (keep_id, remove_id))

            # Duplikált csapat törlése
            cursor.execute("DELETE FROM teams WHERE team_id = ?", (remove_id,))
            merged_count += 1

        self.conn.commit()
        print(f"✅ {merged_count} duplikátum egyesítve")
        return merged_count

    def update_quality_metrics(self) -> Dict[str, float]:
        """Adatminőségi metrikák frissítése"""
        print("📊 Adatminőségi metrikák számítása...")

        cursor = self.conn.cursor()

        # 1. Extraction success rate
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN status = 'completed' THEN 1 END) * 1.0 / COUNT(*) as success_rate
            FROM extraction_logs
        """)
        success_rate = cursor.fetchone()[0] or 0.0

        # 2. Team name match rate (csapat nevekben nincs fogadási adat)
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN team_name NOT LIKE '%Kétesély%'
                          AND team_name NOT LIKE '%Hendikep%'
                          AND team_name NOT LIKE '%félidő%' THEN 1 END) * 1.0 / COUNT(*) as clean_rate
            FROM teams
        """)
        clean_rate = cursor.fetchone()[0] or 0.0

        # 3. Average confidence
        cursor.execute("""
            SELECT AVG(extraction_confidence) as avg_confidence
            FROM historical_matches
            WHERE extraction_confidence > 0
        """)
        avg_confidence = cursor.fetchone()[0] or 0.0

        # 4. Manual review rate
        cursor.execute("""
            SELECT
                COUNT(CASE WHEN manual_review_needed = 1 THEN 1 END) * 1.0 / COUNT(*) as review_rate
            FROM extraction_logs
        """)
        review_rate = cursor.fetchone()[0] or 0.0

        # 5. Duplicate rate
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT normalized_name, COUNT(*) as cnt
                FROM teams
                GROUP BY normalized_name
                HAVING cnt > 1
            )
        """)
        duplicate_count = cursor.fetchone()[0] or 0
        cursor.execute("SELECT COUNT(*) FROM teams")
        total_teams = cursor.fetchone()[0] or 1
        duplicate_rate = duplicate_count / total_teams

        # Metrikák frissítése
        metrics = {
            'extraction_success_rate': success_rate,
            'team_name_match_rate': clean_rate,
            'confidence_avg': avg_confidence,
            'manual_review_rate': review_rate,
            'duplicate_rate': duplicate_rate
        }

        for metric_name, value in metrics.items():
            cursor.execute("""
                UPDATE data_quality_metrics
                SET metric_value = ?, measurement_date = date('now')
                WHERE metric_name = ?
            """, (value, metric_name))

        self.conn.commit()
        print(f"✅ {len(metrics)} metrika frissítve")
        return metrics

    def generate_cleaning_report(self) -> str:
        """Tisztítási jelentés generálása"""
        cursor = self.conn.cursor()

        report = []
        report.append("=" * 60)
        report.append("SZERENCSEMIX ADATTISZTÍTÁSI JELENTÉS")
        report.append("=" * 60)

        # Csapatok állapota
        cursor.execute("SELECT COUNT(*) FROM teams")
        total_teams = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM teams
            WHERE team_name LIKE '%Kétesély%' OR team_name LIKE '%Hendikep%'
        """)
        dirty_teams = cursor.fetchone()[0]

        report.append(f"\n📊 CSAPATOK:")
        report.append(f"   Összes csapat: {total_teams}")
        report.append(f"   Tisztítandó: {dirty_teams}")
        report.append(f"   Tisztaság: {((total_teams-dirty_teams)/total_teams*100):.1f}%")

        # Ligák állapota
        cursor.execute("""
            SELECT league, COUNT(*) as count
            FROM historical_matches
            GROUP BY league
            ORDER BY count DESC
            LIMIT 10
        """)
        leagues = cursor.fetchall()

        report.append(f"\n🏆 TOP LIGÁK:")
        for league in leagues:
            report.append(f"   {league['league']}: {league['count']} meccs")

        # Adatminőség
        cursor.execute("SELECT metric_name, metric_value, metric_target FROM data_quality_metrics")
        metrics = cursor.fetchall()

        report.append(f"\n📈 ADATMINŐSÉG:")
        for metric in metrics:
            status = "✅" if metric['metric_value'] >= metric['metric_target'] else "❌"
            report.append(f"   {status} {metric['metric_name']}: {metric['metric_value']:.3f} / {metric['metric_target']:.3f}")

        return "\n".join(report)

    def close(self):
        """Adatbázis kapcsolat lezárása"""
        if self.conn:
            self.conn.close()

def main():
    parser = argparse.ArgumentParser(description='SzerencseMix adattisztító')
    parser.add_argument('--action', choices=['clean_teams', 'classify_leagues', 'remove_duplicates', 'metrics', 'all'],
                        default='all', help='Végrehajtandó művelet')
    parser.add_argument('--db', default='data/football_database.db', help='Adatbázis fájl útvonala')

    args = parser.parse_args()

    # Adatbázis elérési útvonal ellenőrzése
    db_path = Path(args.db)
    if not db_path.exists():
        print(f"❌ Adatbázis nem található: {db_path}")
        return

    cleaner = SzerencseMixDataCleaner(str(db_path))

    try:
        if args.action in ['clean_teams', 'all']:
            team_mappings = cleaner.clean_team_names()
            print(f"🧹 {len(team_mappings)} csapat név tisztítva")

        if args.action in ['classify_leagues', 'all']:
            league_mappings = cleaner.classify_leagues()
            print(f"🏆 {len(league_mappings)} liga besorolás")

        if args.action in ['remove_duplicates', 'all']:
            merged = cleaner.remove_duplicates()
            print(f"🔗 {merged} duplikátum egyesítve")

        if args.action in ['metrics', 'all']:
            metrics = cleaner.update_quality_metrics()
            print(f"📊 {len(metrics)} metrika frissítve")

        # Jelentés generálása
        report = cleaner.generate_cleaning_report()
        print("\n" + report)

        # Jelentés mentése
        with open('data_cleaning_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"\n💾 Jelentés mentve: data_cleaning_report.txt")

    except Exception as e:
        print(f"❌ Hiba történt: {e}")
        raise
    finally:
        cleaner.close()

if __name__ == "__main__":
    main()
