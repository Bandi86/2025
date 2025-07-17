#!/usr/bin/env python3
"""
Eredmény frissítő rendszer - meccs eredmények hozzáadása/frissítése
Kompatibilis az új adatbázis sémával
"""

import sqlite3
import re
import json
from datetime import datetime, timedelta
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional

class ResultUpdater:
    def __init__(self, db_path: str = "data/football_database.db"):
        self.db_path = db_path
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('data/result_updates.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def find_matches_to_update(self, max_days_back: int = 7) -> List[Dict]:
        """Megtalálja azokat a meccseket, amelyeknek még nincs eredményük"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Múltbeli meccsek eredmény nélkül
        cutoff_date = datetime.now() - timedelta(days=max_days_back)

        cursor.execute("""
            SELECT h.match_id, h.date, h.home_team_id, h.away_team_id,
                   ht.team_name as home_team, at.team_name as away_team, h.league
            FROM historical_matches h
            LEFT JOIN teams ht ON h.home_team_id = ht.team_id
            LEFT JOIN teams at ON h.away_team_id = at.team_id
            WHERE (h.home_score IS NULL OR h.away_score IS NULL)
            AND h.date >= ?
            ORDER BY h.date DESC
        """, (cutoff_date.strftime('%Y-%m-%d'),))

        matches = []
        for row in cursor.fetchall():
            matches.append({
                'id': row[0],
                'date': row[1],
                'home_team_id': row[2],
                'away_team_id': row[3],
                'home_team': row[4],
                'away_team': row[5],
                'league': row[6]
            })

        conn.close()
        return matches

    def extract_results_from_pdf_text(self, text: str, target_date: str = None) -> List[Dict]:
        """Kinyeri az eredményeket a PDF szövegből"""
        results = []

        # Eredmény minták
        result_patterns = [
            # "Chelsea 2-1 Arsenal" formátum
            r'([A-Za-z\s\.\-]+?)\s+(\d+)-(\d+)\s+([A-Za-z\s\.\-]+)',
            # "Chelsea vs Arsenal 2:1" formátum
            r'([A-Za-z\s\.\-]+?)\s+vs\s+([A-Za-z\s\.\-]+?)\s+(\d+):(\d+)',
            # "Chelsea - Arsenal 2-1" formátum
            r'([A-Za-z\s\.\-]+?)\s+-\s+([A-Za-z\s\.\-]+?)\s+(\d+)-(\d+)',
        ]

        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            for pattern in result_patterns:
                match = re.search(pattern, line)
                if match:
                    if len(match.groups()) == 4:
                        if pattern == result_patterns[0]:  # Team1 Score-Score Team2
                            home_team = match.group(1).strip()
                            home_score = int(match.group(2))
                            away_score = int(match.group(3))
                            away_team = match.group(4).strip()
                        else:  # Team1 vs Team2 Score:Score vagy Team1 - Team2 Score-Score
                            home_team = match.group(1).strip()
                            away_team = match.group(2).strip()
                            home_score = int(match.group(3))
                            away_score = int(match.group(4))

                        results.append({
                            'home_team': home_team,
                            'away_team': away_team,
                            'home_score': home_score,
                            'away_score': away_score,
                            'result': f"{home_score}-{away_score}",
                            'source_line': line
                        })

        return results

    def normalize_team_name(self, team_name: str) -> str:
        """Csapatnév normalizálása az adatbázisban való kereséshez"""
        # Eltávolítjuk a felesleges szóközöket és speciális karaktereket
        normalized = re.sub(r'\s+', ' ', team_name.strip())

        # Gyakori rövidítések és alternatívák
        replacements = {
            'Manchester Utd': 'Manchester United',
            'Man City': 'Manchester City',
            'Man Utd': 'Manchester United',
            'Tottenham': 'Tottenham Hotspur',
            'Spurs': 'Tottenham Hotspur',
            'Chelsea FC': 'Chelsea',
            'Arsenal FC': 'Arsenal',
            'Liverpool FC': 'Liverpool',
        }

        return replacements.get(normalized, normalized)

    def find_team_id(self, team_name: str) -> Optional[int]:
        """Megtalálja a csapat ID-jét az adatbázisban"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        normalized_name = self.normalize_team_name(team_name)

        # Pontos egyezés keresése
        cursor.execute("SELECT team_id FROM teams WHERE team_name = ? OR normalized_name = ?",
                      (team_name, normalized_name))
        result = cursor.fetchone()

        if result:
            conn.close()
            return result[0]

        # Fuzzy keresés
        cursor.execute("SELECT team_id, team_name, normalized_name FROM teams")
        teams = cursor.fetchall()

        for team_id, name, norm_name in teams:
            if (normalized_name.lower() in name.lower() or
                name.lower() in normalized_name.lower() or
                (norm_name and normalized_name.lower() in norm_name.lower())):
                conn.close()
                return team_id

        conn.close()
        return None

    def update_match_result(self, match_id: int, home_score: int, away_score: int, confidence: float = 0.9):
        """Frissíti egy meccs eredményét"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE historical_matches
                SET home_score = ?, away_score = ?, extraction_confidence = ?, updated_at = ?
                WHERE match_id = ?
            """, (home_score, away_score, confidence, datetime.now().isoformat(), match_id))

            conn.commit()
            self.logger.info(f"Frissítve meccs ID {match_id}: {home_score}-{away_score}")
            return True

        except Exception as e:
            self.logger.error(f"Hiba a meccs frissítésénél ID {match_id}: {e}")
            return False
        finally:
            conn.close()

    def generate_update_report(self) -> Dict:
        """Jelentés generálása a frissítésekről"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Statisztikák
        cursor.execute("SELECT COUNT(*) FROM historical_matches WHERE home_score IS NOT NULL AND away_score IS NOT NULL")
        matches_with_results = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM historical_matches WHERE home_score IS NULL OR away_score IS NULL")
        matches_without_results = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM historical_matches")
        total_matches = cursor.fetchone()[0]

        # Legutóbbi frissítések
        cursor.execute("""
            SELECT h.match_id, h.date, ht.team_name, at.team_name, h.home_score, h.away_score, h.updated_at
            FROM historical_matches h
            LEFT JOIN teams ht ON h.home_team_id = ht.team_id
            LEFT JOIN teams at ON h.away_team_id = at.team_id
            WHERE h.updated_at IS NOT NULL
            ORDER BY h.updated_at DESC
            LIMIT 10
        """)
        recent_updates = cursor.fetchall()

        conn.close()

        report = {
            'timestamp': datetime.now().isoformat(),
            'total_matches': total_matches,
            'matches_with_results': matches_with_results,
            'matches_without_results': matches_without_results,
            'completion_rate': matches_with_results / total_matches if total_matches > 0 else 0,
            'recent_updates': [
                {
                    'id': row[0],
                    'date': row[1],
                    'match': f"{row[2]} vs {row[3]}",
                    'result': f"{row[4]}-{row[5]}" if row[4] is not None and row[5] is not None else "N/A",
                    'updated_at': row[6]
                }
                for row in recent_updates
            ]
        }

        return report

def main():
    updater = ResultUpdater()

    # Jelentés a jelenlegi állapotról
    report = updater.generate_update_report()
    print(f"\n🔄 EREDMÉNY FRISSÍTÉSI JELENTÉS")
    print(f"================================")
    print(f"📊 Összes meccs: {report['total_matches']}")
    print(f"✅ Eredménnyel: {report['matches_with_results']}")
    print(f"❌ Eredmény nélkül: {report['matches_without_results']}")
    print(f"📈 Befejezettség: {report['completion_rate']:.2%}")

    # Keresés frissítendő meccsekre
    matches_to_update = updater.find_matches_to_update()
    print(f"\n🔍 Frissítendő meccsek (utolsó 7 nap): {len(matches_to_update)}")

    for match in matches_to_update[:5]:  # Első 5 megjelenítése
        print(f"  - {match['date']} | {match['home_team']} vs {match['away_team']} | {match['league']}")

    if len(matches_to_update) > 5:
        print(f"  ... és még {len(matches_to_update) - 5} meccs")

if __name__ == "__main__":
    main()
