#!/usr/bin/env python3
"""
Extract essential data from SofaScore scheduled-events.json file.
This script processes the large JSON file and extracts only the key information
needed for analysis. It also sorts events by date and provides a summary.
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Any
from collections import Counter

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

def extract_event_data(event: Dict) -> Dict:
    """Extract essential data from an event object."""
    try:
        # Extract basic event info
        start_timestamp = event.get("startTimestamp", 0)
        start_time_formatted = datetime.fromtimestamp(start_timestamp).strftime('%Y-%m-%d %H:%M:%S') if start_timestamp else None
        
        # Extract date part for grouping
        event_date = start_time_formatted.split()[0] if start_time_formatted else None
        
        event_data = {
            "id": event.get("id"),
            "start_time": start_timestamp,
            "start_time_formatted": start_time_formatted,
            "event_date": event_date,  # Add date for grouping
            "status": event.get("status", {}).get("description"),
            "tournament": event.get("tournament", {}).get("name"),
            "season": event.get("season", {}).get("name"),
            "round": event.get("roundInfo", {}).get("name"),
            
            # Teams
            "home_team": event.get("homeTeam", {}).get("name"),
            "home_team_country": event.get("homeTeam", {}).get("country", {}).get("name"),
            "away_team": event.get("awayTeam", {}).get("name"),
            "away_team_country": event.get("awayTeam", {}).get("country", {}).get("name"),
            
            # Scores
            "home_score": event.get("homeScore", {}).get("current"),
            "away_score": event.get("awayScore", {}).get("current"),
            "home_score_ht": event.get("homeScore", {}).get("period1"),
            "away_score_ht": event.get("awayScore", {}).get("period1"),
            
            # Winner info
            "winner_code": event.get("winnerCode"),  # 1=home, 2=away, 0=draw
        }
        return event_data
    except Exception as e:
        logger.error(f"Error extracting data from event: {e}")
        return {}

def generate_summary(events: List[Dict]) -> Dict:
    """Generate summary statistics about the events."""
    # Count events by date
    dates = [event.get("event_date") for event in events if event.get("event_date")]
    date_counts = Counter(dates)
    
    # Count events by status
    statuses = [event.get("status") for event in events if event.get("status")]
    status_counts = Counter(statuses)
    
    # Count events by tournament
    tournaments = [event.get("tournament") for event in events if event.get("tournament")]
    tournament_counts = Counter(tournaments)
    
    # Get date range
    if dates:
        min_date = min(dates)
        max_date = max(dates)
    else:
        min_date = None
        max_date = None
    
    return {
        "total_events": len(events),
        "date_range": {
            "from": min_date,
            "to": max_date
        },
        "events_by_date": dict(sorted(date_counts.items())),
        "events_by_status": dict(status_counts),
        "top_tournaments": dict(tournament_counts.most_common(5))
    }

def process_events_file(input_file: str, output_file: str) -> None:
    """Process the events file and extract essential data."""
    data = load_json_file(input_file)
    
    if not data or "events" not in data:
        logger.warning("No events found in the input file")
        return
    
    # Extract data from each event
    extracted_events = []
    for event in data["events"]:
        event_data = extract_event_data(event)
        if event_data:
            extracted_events.append(event_data)
    
    # Sort events by start time
    extracted_events.sort(key=lambda x: x.get("start_time", 0))
    
    # Generate summary
    summary = generate_summary(extracted_events)
    
    # Create output with summary and sorted events
    output_data = {
        "summary": summary,
        "events": extracted_events
    }
    
    # Save extracted data to output file
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump(output_data, file, indent=2, ensure_ascii=False)
        logger.info(f"Processed {summary['total_events']} events")
        logger.info(f"Saved extracted data to {output_file}")
    except IOError as e:
        logger.error(f"Error saving extracted data to {output_file}: {e}")
    
    # Print summary to console (for immediate feedback)
    logger.info(f"\n===== SofaScore Events Summary =====")
    logger.info(f"Total events: {summary['total_events']}")
    logger.info(f"Date range: {summary['date_range']['from']} to {summary['date_range']['to']}")
    
    logger.info("\nEvents by date:")
    for date, count in summary['events_by_date'].items():
        logger.info(f"  {date}: {count} events")
    
    logger.info("\nEvents by status:")
    for status, count in summary['events_by_status'].items():
        logger.info(f"  {status}: {count} events")
    
    logger.info("\nTop tournaments:")
    for tournament, count in summary['top_tournaments'].items():
        logger.info(f"  {tournament}: {count} events")
    

if __name__ == "__main__":
    process_events_file(config.SCHEDULED_EVENTS_FILE, config.EXTRACTED_EVENTS_FILE)