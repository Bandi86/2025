#!/usr/bin/env python3
"""
FlashScore Database Query Tool
============================

Simple tool to query and display data from the FlashScore database.
Useful for checking current state and generating quick reports.

Usage:
    python database_query.py summary         # Show database summary
    python database_query.py matches         # Show all matches
    python database_query.py events <match_id>  # Show events for a match
    python database_query.py latest          # Show latest matches with events
"""

import sqlite3
import json
import sys
from datetime import datetime
from pathlib import Path

DB_PATH = "/home/bandi/Documents/code/2025/sp3/scrapping_data/flashscore_matches.db"

def get_database_summary():
    """Get database summary"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Basic counts
        cursor.execute("SELECT COUNT(*) FROM matches")
        total_matches = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM match_events")
        total_events = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM match_statistics")
        total_stats = cursor.fetchone()[0]

        # Latest data
        cursor.execute("SELECT home_team, away_team, score_home, score_away, updated_at FROM matches ORDER BY updated_at DESC LIMIT 1")
        latest_match = cursor.fetchone()

        # Event types breakdown
        cursor.execute("""
        SELECT event_type, COUNT(*)
        FROM match_events
        GROUP BY event_type
        ORDER BY COUNT(*) DESC
        """)
        event_breakdown = cursor.fetchall()

        conn.close()

        return {
            'total_matches': total_matches,
            'total_events': total_events,
            'total_statistics': total_stats,
            'latest_match': latest_match,
            'event_breakdown': event_breakdown
        }

    except Exception as e:
        print(f"Error: {e}")
        return None

def show_all_matches():
    """Show all matches in database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT match_id, home_team, away_team, score_home, score_away,
               match_date, status, updated_at
        FROM matches
        ORDER BY updated_at DESC
        """)

        matches = cursor.fetchall()
        conn.close()

        print(f"\n📊 All Matches in Database ({len(matches)} total)")
        print("=" * 80)

        for match in matches:
            match_id, home, away, score_h, score_a, date, status, updated = match
            print(f"🆔 {match_id}")
            print(f"   {home} {score_h}-{score_a} {away}")
            print(f"   📅 {date} | 📊 {status} | 🔄 {updated}")
            print()

    except Exception as e:
        print(f"Error: {e}")

def show_match_events(match_id):
    """Show events for a specific match"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Get match info
        cursor.execute("""
        SELECT home_team, away_team, score_home, score_away
        FROM matches
        WHERE match_id = ?
        """, (match_id,))

        match_info = cursor.fetchone()
        if not match_info:
            print(f"Match {match_id} not found")
            return

        # Get events
        cursor.execute("""
        SELECT minute, event_type, player, team, description
        FROM match_events
        WHERE match_id = ?
        ORDER BY CAST(minute AS INTEGER)
        """, (match_id,))

        events = cursor.fetchall()
        conn.close()

        home, away, score_h, score_a = match_info

        print(f"\n⚽ Match Details: {home} {score_h}-{score_a} {away}")
        print(f"🆔 Match ID: {match_id}")
        print("=" * 60)
        print(f"📝 Events ({len(events)} total):")
        print()

        for event in events:
            minute, event_type, player, team, description = event

            # Format the event display
            event_icon = {
                'Goal': '⚽',
                'Yellow Card': '🟨',
                'Red Card': '🟥',
                'Substitution': '🔄',
                'Event': '📋'
            }.get(event_type, '📋')

            player_info = f" ({player})" if player else ""
            team_info = f" [{team}]" if team else ""

            print(f"  {minute}' {event_icon} {event_type}{player_info}{team_info}")
            if description and len(description) > 20:
                # Show first line of description
                desc_line = description.split('\n')[0][:50]
                print(f"        💬 {desc_line}...")
            print()

    except Exception as e:
        print(f"Error: {e}")

def show_latest_matches():
    """Show latest matches with basic events"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
        SELECT match_id, home_team, away_team, score_home, score_away, updated_at
        FROM matches
        ORDER BY updated_at DESC
        LIMIT 3
        """)

        matches = cursor.fetchall()

        print(f"\n🕐 Latest Matches ({len(matches)} most recent)")
        print("=" * 70)

        for match in matches:
            match_id, home, away, score_h, score_a, updated = match

            # Get event count for this match
            cursor.execute("SELECT COUNT(*) FROM match_events WHERE match_id = ?", (match_id,))
            event_count = cursor.fetchone()[0]

            # Get key events (goals, cards)
            cursor.execute("""
            SELECT minute, event_type, player
            FROM match_events
            WHERE match_id = ? AND event_type IN ('Goal', 'Yellow Card', 'Red Card')
            ORDER BY CAST(minute AS INTEGER)
            """, (match_id,))

            key_events = cursor.fetchall()

            print(f"⚽ {home} {score_h}-{score_a} {away}")
            print(f"   🆔 {match_id} | 📝 {event_count} events | 🔄 {updated}")

            if key_events:
                print("   🎯 Key Events:")
                for minute, event_type, player in key_events[:5]:  # Show first 5
                    icon = {'Goal': '⚽', 'Yellow Card': '🟨', 'Red Card': '🟥'}[event_type]
                    player_info = f" ({player})" if player else ""
                    print(f"      {minute}' {icon} {event_type}{player_info}")
                if len(key_events) > 5:
                    print(f"      ... and {len(key_events) - 5} more")

            print()

        conn.close()

    except Exception as e:
        print(f"Error: {e}")

def main():
    if not Path(DB_PATH).exists():
        print(f"❌ Database not found: {DB_PATH}")
        print("Run the scraper first to create the database.")
        return

    if len(sys.argv) < 2:
        command = "summary"
    else:
        command = sys.argv[1]

    print("🗄️  FlashScore Database Query Tool")
    print(f"📁 Database: {DB_PATH}")
    print()

    if command == "summary":
        summary = get_database_summary()
        if summary:
            print("📊 Database Summary")
            print("=" * 50)
            print(f"Total matches: {summary['total_matches']}")
            print(f"Total events: {summary['total_events']}")
            print(f"Total statistics: {summary['total_statistics']}")

            if summary['latest_match']:
                latest = summary['latest_match']
                print(f"\nLatest match: {latest[0]} {latest[2]}-{latest[3]} {latest[1]}")
                print(f"Last updated: {latest[4]}")

            if summary['event_breakdown']:
                print(f"\n📝 Event Types:")
                for event_type, count in summary['event_breakdown']:
                    print(f"  {event_type}: {count}")

    elif command == "matches":
        show_all_matches()

    elif command == "events":
        if len(sys.argv) >= 3:
            match_id = sys.argv[2]
            show_match_events(match_id)
        else:
            print("Usage: python database_query.py events <match_id>")

    elif command == "latest":
        show_latest_matches()

    else:
        print("Available commands:")
        print("  summary  - Show database summary")
        print("  matches  - Show all matches")
        print("  events <match_id> - Show events for a match")
        print("  latest   - Show latest matches with events")

if __name__ == "__main__":
    main()
