#!/usr/bin/env python3
"""
📋 HOLNAPI MECCSEK ÉS TÖRTÉNELMI ADATOK ÖSSZESÍTŐ
=================================================

Készítette: Sport Prediction System
Dátum: 2025-06-28
"""

import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

class MatchSummaryReport:
    def __init__(self):
        self.base_dir = Path('/home/bandi/Documents/code/2025/sport-prediction')
        self.db_path = self.base_dir / 'data' / 'football_database.db'

    def get_tomorrows_matches(self):
        """Holnapi meccsek lekérdezése"""
        tomorrow = (datetime.now() + timedelta(days=1)).date().isoformat()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT date, time, home_team, away_team, league, source_pdf, extraction_confidence
            FROM future_matches
            WHERE date = ?
            ORDER BY time
        """, (tomorrow,))

        matches = cursor.fetchall()
        conn.close()

        return matches

    def get_upcoming_matches(self, days=7):
        """Közeli jövőbeli meccsek"""
        today = datetime.now().date().isoformat()
        end_date = (datetime.now().date() + timedelta(days=days)).isoformat()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT date, time, home_team, away_team, league, source_pdf
            FROM future_matches
            WHERE date BETWEEN ? AND ?
            ORDER BY date, time
        """, (today, end_date))

        matches = cursor.fetchall()
        conn.close()

        return matches

    def get_recent_historical_matches(self, days=30):
        """Legfrissebb történelmi meccsek"""
        start_date = (datetime.now().date() - timedelta(days=days)).isoformat()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT date, home_team, away_team, home_score, away_score, league, source_pdf
            FROM historical_matches
            WHERE date >= ?
            ORDER BY date DESC
            LIMIT 50
        """, (start_date,))

        matches = cursor.fetchall()
        conn.close()

        return matches

    def get_database_statistics(self):
        """Adatbázis statisztikák"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Alapstatisztikák
        cursor.execute("SELECT COUNT(*) FROM historical_matches")
        historical_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM future_matches")
        future_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM teams")
        teams_count = cursor.fetchone()[0]

        # Dátum tartományok
        cursor.execute("SELECT MIN(date), MAX(date) FROM historical_matches")
        hist_dates = cursor.fetchone()

        cursor.execute("SELECT MIN(date), MAX(date) FROM future_matches")
        future_dates = cursor.fetchone()

        # Liga eloszlás
        cursor.execute("""
            SELECT league, COUNT(*) as count
            FROM historical_matches
            GROUP BY league
            ORDER BY count DESC
            LIMIT 10
        """)
        league_stats = cursor.fetchall()

        conn.close()

        return {
            'historical_count': historical_count,
            'future_count': future_count,
            'teams_count': teams_count,
            'historical_date_range': hist_dates,
            'future_date_range': future_dates,
            'top_leagues': league_stats
        }

    def create_comprehensive_report(self):
        """Teljes jelentés létrehozása"""
        print("📋 HOLNAPI MECCSEK ÉS TÖRTÉNELMI ADATOK ÖSSZESÍTŐ")
        print("="*65)
        print(f"🕐 Jelentés időpontja: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # 1. Holnapi meccsek
        tomorrow_date = (datetime.now() + timedelta(days=1)).date()
        tomorrows_matches = self.get_tomorrows_matches()

        print(f"🔮 HOLNAPI MECCSEK ({tomorrow_date})")
        print("-" * 50)

        if tomorrows_matches:
            print(f"⚽ Összesen {len(tomorrows_matches)} meccs")
            print()
            for i, match in enumerate(tomorrows_matches, 1):
                date, time, home, away, league, source, confidence = match
                print(f"{i:2d}. {time or 'N/A':>5} | {home:<25} vs {away:<25}")
                print(f"     Liga: {league} | Bizonyosság: {confidence:.2f}")
                print(f"     Forrás: {source}")
                print()
        else:
            print("❌ Nincs holnapi meccs az adatbázisban")

        print()

        # 2. Közeli jövőbeli meccsek
        upcoming_matches = self.get_upcoming_matches(7)

        print("📅 KÖZELI JÖVŐBELI MECCSEK (7 nap)")
        print("-" * 50)
        print(f"⚽ Összesen {len(upcoming_matches)} meccs")
        print()

        current_date = None
        for match in upcoming_matches[:15]:  # Első 15 meccs
            date, time, home, away, league, source = match

            if date != current_date:
                if current_date is not None:
                    print()
                print(f"📅 {date}:")
                current_date = date

            print(f"  {time or 'N/A':>5} | {home:<20} vs {away:<20} | {league}")

        if len(upcoming_matches) > 15:
            print(f"\n... és még {len(upcoming_matches) - 15} meccs")

        print()

        # 3. Legfrissebb történelmi meccsek
        recent_historical = self.get_recent_historical_matches(30)

        print("📚 LEGFRISSEBB TÖRTÉNELMI MECCSEK (30 nap)")
        print("-" * 50)
        print(f"⚽ Összesen {len(recent_historical)} meccs")
        print()

        current_date = None
        for match in recent_historical[:20]:  # Első 20 meccs
            date, home, away, home_score, away_score, league, source = match

            if date != current_date:
                if current_date is not None:
                    print()
                print(f"📅 {date}:")
                current_date = date

            score_str = ""
            if home_score is not None and away_score is not None:
                score_str = f" ({home_score}-{away_score})"

            print(f"  {home:<20} vs {away:<20}{score_str} | {league}")

        if len(recent_historical) > 20:
            print(f"\n... és még {len(recent_historical) - 20} meccs")

        print()

        # 4. Adatbázis statisztikák
        stats = self.get_database_statistics()

        print("📊 ADATBÁZIS STATISZTIKÁK")
        print("-" * 50)
        print(f"📚 Történelmi meccsek: {stats['historical_count']:,}")
        print(f"🔮 Jövőbeli meccsek: {stats['future_count']:,}")
        print(f"👥 Csapatok száma: {stats['teams_count']:,}")
        print()

        if stats['historical_date_range'][0]:
            print(f"📅 Történelmi adatok: {stats['historical_date_range'][0]} → {stats['historical_date_range'][1]}")

        if stats['future_date_range'][0]:
            print(f"🔮 Jövőbeli adatok: {stats['future_date_range'][0]} → {stats['future_date_range'][1]}")

        print()
        print("🏆 TOP LIGÁK (történelmi meccsek alapján):")
        for i, (league, count) in enumerate(stats['top_leagues'], 1):
            print(f"  {i:2d}. {league:<25} : {count:4d} meccs")

        print()

        # 5. JSON export holnapi meccsekről
        if tomorrows_matches:
            tomorrow_data = {
                'date': tomorrow_date.isoformat(),
                'extraction_time': datetime.now().isoformat(),
                'matches_count': len(tomorrows_matches),
                'matches': []
            }

            for match in tomorrows_matches:
                date, time, home, away, league, source, confidence = match
                tomorrow_data['matches'].append({
                    'date': date,
                    'time': time,
                    'home_team': home,
                    'away_team': away,
                    'league': league,
                    'source_pdf': source,
                    'confidence': confidence
                })

            output_file = self.base_dir / 'data' / 'tomorrows_matches_summary.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(tomorrow_data, f, indent=2, ensure_ascii=False)

            print(f"💾 Holnapi meccsek JSON-ben mentve: {output_file.name}")

        print()
        print("🏁 JELENTÉS BEFEJEZVE!")

def main():
    report = MatchSummaryReport()
    report.create_comprehensive_report()

if __name__ == "__main__":
    main()
