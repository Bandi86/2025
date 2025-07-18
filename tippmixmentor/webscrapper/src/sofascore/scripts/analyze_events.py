#!/usr/bin/env python3
"""
Analyze SofaScore events data and generate statistics.
This script provides insights about the events data, such as tournament distribution,
team performance, and more.
"""

import json
import os
import argparse
import logging
from collections import Counter
from datetime import datetime
from typing import Dict, List, Any, Tuple

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

def analyze_tournaments(events: List[Dict]) -> Dict[str, int]:
    """Analyze tournament distribution."""
    tournaments = [event.get("tournament", "Unknown") for event in events]
    return dict(Counter(tournaments).most_common())

def analyze_teams(events: List[Dict]) -> Tuple[Dict[str, Dict], Dict[str, Dict]]:
    """Analyze team performance."""
    team_stats = {}
    country_stats = {}
    
    for event in events:
        # Skip events without scores
        if event.get("status") != "Ended" or None in [event.get("home_score"), event.get("away_score")]:
            continue
            
        home_team = event.get("home_team", "Unknown")
        away_team = event.get("away_team", "Unknown")
        home_country = event.get("home_team_country", "Unknown")
        away_country = event.get("away_team_country", "Unknown")
        
        # Initialize team stats if not exists
        for team in [home_team, away_team]:
            if team not in team_stats:
                team_stats[team] = {"matches": 0, "wins": 0, "draws": 0, "losses": 0, "goals_for": 0, "goals_against": 0}
        
        # Initialize country stats if not exists
        for country in [home_country, away_country]:
            if country not in country_stats:
                country_stats[country] = {"matches": 0, "wins": 0, "draws": 0, "losses": 0, "goals_for": 0, "goals_against": 0}
        
        # Update team stats
        home_score = event.get("home_score", 0)
        away_score = event.get("away_score", 0)
        
        # Home team stats
        team_stats[home_team]["matches"] += 1
        team_stats[home_team]["goals_for"] += home_score
        team_stats[home_team]["goals_against"] += away_score
        
        # Away team stats
        team_stats[away_team]["matches"] += 1
        team_stats[away_team]["goals_for"] += away_score
        team_stats[away_team]["goals_against"] += home_score
        
        # Country stats
        country_stats[home_country]["matches"] += 1
        country_stats[home_country]["goals_for"] += home_score
        country_stats[home_country]["goals_against"] += away_score
        
        country_stats[away_country]["matches"] += 1
        country_stats[away_country]["goals_for"] += away_score
        country_stats[away_country]["goals_against"] += home_score
        
        # Determine match result
        if home_score > away_score:
            team_stats[home_team]["wins"] += 1
            team_stats[away_team]["losses"] += 1
            country_stats[home_country]["wins"] += 1
            country_stats[away_country]["losses"] += 1
        elif home_score < away_score:
            team_stats[home_team]["losses"] += 1
            team_stats[away_team]["wins"] += 1
            country_stats[home_country]["losses"] += 1
            country_stats[away_country]["wins"] += 1
        else:
            team_stats[home_team]["draws"] += 1
            team_stats[away_team]["draws"] += 1
            country_stats[home_country]["draws"] += 1
            country_stats[away_country]["draws"] += 1
    
    # Calculate win percentage and sort by it
    for team, stats in team_stats.items():
        if stats["matches"] > 0:
            stats["win_percentage"] = round(stats["wins"] / stats["matches"] * 100, 2)
        else:
            stats["win_percentage"] = 0
    
    for country, stats in country_stats.items():
        if stats["matches"] > 0:
            stats["win_percentage"] = round(stats["wins"] / stats["matches"] * 100, 2)
        else:
            stats["win_percentage"] = 0
    
    # Sort by matches played and win percentage
    team_stats = {k: v for k, v in sorted(team_stats.items(), 
                                          key=lambda item: (item[1]["matches"], item[1]["win_percentage"]),
                                          reverse=True)}
    
    country_stats = {k: v for k, v in sorted(country_stats.items(), 
                                            key=lambda item: (item[1]["matches"], item[1]["win_percentage"]),
                                            reverse=True)}
    
    return team_stats, country_stats

def analyze_time_distribution(events: List[Dict]) -> Dict[str, int]:
    """Analyze time distribution of events."""
    hours = []
    
    for event in events:
        if event.get("start_time"):
            event_time = datetime.fromtimestamp(event.get("start_time"))
            hours.append(event_time.hour)
    
    return dict(Counter(hours).most_common())

def main():
    parser = argparse.ArgumentParser(description="Analyze SofaScore events")
    parser.add_argument("--input", default=config.EXTRACTED_EVENTS_FILE, help="Input JSON file")
    parser.add_argument("--output", default=config.ANALYSIS_RESULTS_FILE, help="Output JSON file")
    
    args = parser.parse_args()
    
    # Load data
    input_file = args.input
    output_file = args.output
    
    data = load_json_file(input_file)
    
    if not data or "events" not in data:
        logger.warning("No events found in the input file")
        return
    
    events = data["events"]
    logger.info(f"Analyzing {len(events)} events...")
    
    # Perform analysis
    tournament_stats = analyze_tournaments(events)
    team_stats, country_stats = analyze_teams(events)
    time_distribution = analyze_time_distribution(events)
    
    # Prepare results
    analysis_results = {
        "total_events": len(events),
        "tournaments": tournament_stats,
        "teams": team_stats,
        "countries": country_stats,
        "time_distribution": time_distribution,
        "analysis_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Save analysis results
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump(analysis_results, file, indent=2, ensure_ascii=False)
        logger.info(f"Analysis complete. Results saved to {output_file}")
    except IOError as e:
        logger.error(f"Error saving analysis results to {output_file}: {e}")
    
    # Print some basic stats
    logger.info(f"\nBasic Statistics:")
    logger.info(f"Total events: {len(events)}")
    logger.info(f"Total tournaments: {len(tournament_stats)}")
    logger.info(f"Total teams: {len(team_stats)}")
    logger.info(f"Total countries: {len(country_stats)}")
    
    # Print top tournaments
    logger.info("\nTop 5 Tournaments:")
    for tournament, count in list(tournament_stats.items())[:5]:
        logger.info(f"- {tournament}: {count} events")

if __name__ == "__main__":
    main()