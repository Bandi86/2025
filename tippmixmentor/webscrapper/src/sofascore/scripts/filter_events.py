#!/usr/bin/env python3
"""
Filter and analyze SofaScore events data.
This script allows filtering events by various criteria and can be used
to find specific matches or tournaments.
"""

import json
import os
import argparse
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Import configuration
import config

# Setup logging
logger = logging.getLogger(__name__)

def load_json_file(file_path: str) -> Dict:
    """Load JSON data from file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        logger.error(f"JSON file not found: {file_path}")
        return {"events": []}
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON from {file_path}: {e}")
        return {"events": []}
    except Exception as e:
        logger.error(f"Error loading JSON file {file_path}: {e}")
        return {"events": []}

def filter_events(events: List[Dict], 
                  tournament: Optional[str] = None,
                  team: Optional[str] = None,
                  country: Optional[str] = None,
                  status: Optional[str] = None,
                  date_from: Optional[datetime] = None,
                  date_to: Optional[datetime] = None) -> List[Dict]:
    """Filter events based on criteria."""
    filtered_events = []
    
    for event in events:
        # Apply filters
        if tournament and tournament.lower() not in event.get("tournament", "").lower():
            continue
            
        if team:
            team_lower = team.lower()
            home_team = event.get("home_team", "").lower()
            away_team = event.get("away_team", "").lower()
            if team_lower not in home_team and team_lower not in away_team:
                continue
                
        if country:
            country_lower = country.lower()
            home_country = event.get("home_team_country", "").lower()
            away_country = event.get("away_team_country", "").lower()
            if country_lower not in home_country and country_lower not in away_country:
                continue
                
        if status and status.lower() != event.get("status", "").lower():
            continue
            
        # Date filtering
        if date_from or date_to:
            event_time = datetime.fromtimestamp(event.get("start_time", 0))
            
            if date_from and event_time < date_from:
                continue
                
            if date_to and event_time > date_to:
                continue
        
        filtered_events.append(event)
    
    return filtered_events

def parse_date(date_str: str) -> datetime:
    """Parse date string in YYYY-MM-DD format."""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        logger.error(f"Invalid date format: {date_str}. Using current date.")
        return datetime.now()

def main():
    parser = argparse.ArgumentParser(description="Filter SofaScore events")
    parser.add_argument("--input", default=config.EXTRACTED_EVENTS_FILE, help="Input JSON file")
    parser.add_argument("--output", default=os.path.join(config.REPORTS_DIR, "filtered-events.json"), help="Output JSON file")
    parser.add_argument("--tournament", help="Filter by tournament name")
    parser.add_argument("--team", help="Filter by team name")
    parser.add_argument("--country", help="Filter by country name")
    parser.add_argument("--status", help="Filter by status (e.g., 'Ended', 'Scheduled')")
    parser.add_argument("--date-from", help="Filter events from this date (YYYY-MM-DD)")
    parser.add_argument("--date-to", help="Filter events to this date (YYYY-MM-DD)")
    parser.add_argument("--today", action="store_true", help="Filter events for today")
    parser.add_argument("--tomorrow", action="store_true", help="Filter events for tomorrow")
    parser.add_argument("--yesterday", action="store_true", help="Filter events for yesterday")
    
    args = parser.parse_args()
    
    # Set up date filters
    date_from = None
    date_to = None
    
    if args.today:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        date_from = today
        date_to = today + timedelta(days=1)
    elif args.tomorrow:
        tomorrow = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        date_from = tomorrow
        date_to = tomorrow + timedelta(days=1)
    elif args.yesterday:
        yesterday = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        date_from = yesterday
        date_to = yesterday + timedelta(days=1)
    else:
        if args.date_from:
            date_from = parse_date(args.date_from)
        if args.date_to:
            date_to = parse_date(args.date_to) + timedelta(days=1)  # Include the entire day
    
    # Load data
    input_file = args.input
    output_file = args.output
    
    data = load_json_file(input_file)
    
    if not data or "events" not in data:
        logger.warning("No events found in the input file")
        return
    
    # Filter events
    filtered_events = filter_events(
        data["events"],
        tournament=args.tournament,
        team=args.team,
        country=args.country,
        status=args.status,
        date_from=date_from,
        date_to=date_to
    )
    
    # Save filtered data
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump({"events": filtered_events}, file, indent=2, ensure_ascii=False)
        logger.info(f"Filtered {len(filtered_events)} events out of {len(data['events'])}")
        logger.info(f"Saved filtered data to {output_file}")
    except IOError as e:
        logger.error(f"Error saving filtered data to {output_file}: {e}")

if __name__ == "__main__":
    main()