#!/usr/bin/env python3
"""
Daily update script for SofaScore data.
This script:
1. Runs once a day to process the latest SofaScore data
2. Archives old data to a date-based folder structure
3. Generates enhanced statistics
4. Can be scheduled via cron
"""

import os
import sys
import json
import shutil
import logging
from datetime import datetime
import argparse
from typing import Dict, List, Any
import subprocess

# Import configuration
import config

# Import our extraction module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from extract_events import process_events_file, load_json_file
from process_match_stats import fetch_and_process_match_stats

# Setup logging
logger = logging.getLogger(__name__)

def create_directory_if_not_exists(directory: str) -> None:
    """Create directory if it doesn't exist."""
    try:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")
    except OSError as e:
        logger.error(f"Error creating directory {directory}: {e}")

def _generate_match_url_slug(name: str) -> str:
    """Generates a URL-friendly slug from a team name."""
    return name.lower().replace(" ", "-").replace(".", "").replace("(", "").replace(")", "").replace("'", "")

def archive_previous_data() -> None:
    """Archive previous data files to a date-based folder structure."""
    # Create archives directory if it doesn't exist
    create_directory_if_not_exists(config.ARCHIVES_DIR)
    
    # Get current date for archive folder name
    current_date = datetime.now().strftime("%Y-%m-%d")
    archive_date_dir = os.path.join(config.ARCHIVES_DIR, current_date)
    create_directory_if_not_exists(archive_date_dir)
    
    # Files to archive
    files_to_archive = [
        config.EXTRACTED_EVENTS_FILE,
        config.ANALYSIS_RESULTS_FILE
    ]
    
    # Archive each file if it exists
    for source_file in files_to_archive:
        if os.path.exists(source_file):
            try:
                file_name = os.path.basename(source_file)
                dest_file = os.path.join(archive_date_dir, file_name)
                shutil.copy2(source_file, dest_file)
                logger.info(f"Archived {file_name} to {dest_file}")
            except IOError as e:
                logger.error(f"Error archiving {source_file}: {e}")
        else:
            logger.info(f"File not found for archiving: {source_file}")

def generate_tournament_reports(data: Dict) -> None:
    """Generate individual reports for top tournaments."""
    if "summary" not in data or "top_tournaments" not in data["summary"]:
        logger.warning("No tournament data found in the summary for report generation.")
        return
    
    # Create tournaments directory if it doesn't exist
    tournaments_dir = os.path.join(config.REPORTS_DIR, "tournaments")
    create_directory_if_not_exists(tournaments_dir)
    
    # Get events
    events = data.get("events", [])
    if not events:
        logger.warning("No events found in data for tournament report generation.")
        return
    
    # Process each top tournament
    for tournament_name in data["summary"]["top_tournaments"].keys():
        # Filter events for this tournament
        tournament_events = [event for event in events if event.get("tournament") == tournament_name]
        
        if not tournament_events:
            continue
        
        # Create tournament-specific data
        tournament_data = {
            "tournament": tournament_name,
            "total_events": len(tournament_events),
            "events": sorted(tournament_events, key=lambda x: x.get("start_time", 0))
        }
        
        # Create a safe filename from tournament name
        safe_name = tournament_name.replace(" ", "_").replace(",", "").replace("/", "-").lower()
        output_file = os.path.join(tournaments_dir, f"{safe_name}.json")
        
        # Save tournament data
        try:
            with open(output_file, 'w', encoding='utf-8') as file:
                json.dump(tournament_data, file, indent=2, ensure_ascii=False)
            logger.info(f"Generated tournament report for {tournament_name} to {output_file}")
        except IOError as e:
            logger.error(f"Error saving tournament report for {tournament_name} to {output_file}: {e}")

def generate_team_reports(data: Dict) -> None:
    """Generate reports for teams with multiple matches."""
    # Create teams directory if it doesn't exist
    teams_dir = os.path.join(config.REPORTS_DIR, "teams")
    create_directory_if_not_exists(teams_dir)
    
    # Get events
    events = data.get("events", [])
    if not events:
        logger.warning("No events found in data for team report generation.")
        return
    
    # Count matches per team
    team_matches = {}
    for event in events:
        home_team = event.get("home_team")
        away_team = event.get("away_team")
        
        if home_team:
            team_matches[home_team] = team_matches.get(home_team, []) + [event]
        if away_team:
            team_matches[away_team] = team_matches.get(away_team, []) + [event]
    
    # Generate reports for teams with at least 2 matches
    for team_name, team_events in team_matches.items():
        if len(team_events) < 2:
            continue
        
        # Create team-specific data
        team_data = {
            "team": team_name,
            "total_matches": len(team_events),
            "matches": sorted(team_events, key=lambda x: x.get("start_time", 0))
        }
        
        # Create a safe filename from team name
        safe_name = team_name.replace(" ", "_").replace(",", "").replace("/", "-").lower()
        output_file = os.path.join(teams_dir, f"{safe_name}.json")
        
        # Save team data
        try:
            with open(output_file, 'w', encoding='utf-8') as file:
                json.dump(team_data, file, indent=2, ensure_ascii=False)
            logger.info(f"Generated team report for {team_name} ({len(team_events)} matches) to {output_file}")
        except IOError as e:
            logger.error(f"Error saving team report for {team_name} to {output_file}: {e}")

def run_analysis_script() -> None:
    """Run the analysis script to generate statistics."""
    analysis_script = os.path.join(config.BASE_DIR, "scripts", "analyze_events.py")
    
    try:
        subprocess.run([sys.executable, analysis_script], check=True)
        logger.info("Analysis completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running analysis script: {e}")
    except FileNotFoundError:
        logger.error(f"Analysis script not found at {analysis_script}")

def calculate_file_hash(file_path):
    """Calculate MD5 hash of a file to detect changes."""
    import hashlib
    
    if not os.path.exists(file_path):
        return None
        
    md5_hash = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files
            for chunk in iter(lambda: f.read(4096), b""):
                md5_hash.update(chunk)
        return md5_hash.hexdigest()
    except IOError as e:
        logger.error(f"Error calculating hash for {file_path}: {e}")
        return None

def has_file_changed(file_path, hash_file_path):
    """Check if file has changed since last run."""
    current_hash = calculate_file_hash(file_path)
    
    if current_hash is None:
        logger.warning(f"Could not calculate current hash for {file_path}. Assuming no change or error.")
        return False
        
    # Check if hash file exists
    if not os.path.exists(hash_file_path):
        # First run, save hash and return True
        try:
            with open(hash_file_path, "w") as f:
                f.write(current_hash)
            logger.info(f"Created new hash file for {file_path}")
            return True
        except IOError as e:
            logger.error(f"Error writing hash file {hash_file_path}: {e}")
            return False
        
    # Read previous hash
    try:
        with open(hash_file_path, "r") as f:
            previous_hash = f.read().strip()
    except IOError as e:
        logger.error(f"Error reading hash file {hash_file_path}: {e}")
        return True # Assume changed if hash file cannot be read
        
    # Compare hashes
    if current_hash != previous_hash:
        # File has changed, update hash
        try:
            with open(hash_file_path, "w") as f:
                f.write(current_hash)
            logger.info(f"Updated hash for {file_path}")
            return True
        except IOError as e:
            logger.error(f"Error updating hash file {hash_file_path}: {e}")
            return False
    
    return False

def main():
    parser = argparse.ArgumentParser(description="Daily update for SofaScore data")
    parser.add_argument("--skip-archive", action="store_true", help="Skip archiving previous data")
    parser.add_argument("--skip-analysis", action="store_true", help="Skip running analysis script")
    parser.add_argument("--force", action="store_true", help="Force processing even if no changes detected")
    
    args = parser.parse_args()
    
    # Input file and hash file paths
    input_file = config.SCHEDULED_EVENTS_FILE
    hash_file = config.SCHEDULED_EVENTS_HASH_FILE
    output_file = config.EXTRACTED_EVENTS_FILE
    
    # Check if source file has changed
    if not args.force and not has_file_changed(input_file, hash_file):
        logger.info("No changes detected in source file. Skipping processing. Use --force to process anyway.")
        return
    
    logger.info("Changes detected in source file or --force flag used. Processing...")
    
    # Archive previous data if not skipped
    if not args.skip_archive:
        archive_previous_data()
    
    # Process the events file
    try:
        process_events_file(input_file, output_file)
    except Exception as e:
        logger.error(f"Error processing events file: {e}")
        sys.exit(1)
    
    # Load the processed data
    data = load_json_file(output_file)
    if not data or "events" not in data:
        logger.error("Failed to load processed data or no events found. Exiting.")
        sys.exit(1)
    
    # Fetch and process match statistics for each event
    logger.info("Fetching and processing match statistics...")
    for event in data["events"]:
        event_id = event.get("id")
        home_team_name = event.get("home_team")
        away_team_name = event.get("away_team")

        if event_id and home_team_name and away_team_name:
            home_slug = _generate_match_url_slug(home_team_name)
            away_slug = _generate_match_url_slug(away_team_name)
            match_url = f"https://www.sofascore.com/{home_slug}-{away_slug}/{event_id}"
            fetch_and_process_match_stats(str(event_id), match_url)
        else:
            logger.warning(f"Skipping match stats fetch for event due to missing data: {event}")

    # Generate tournament reports
    generate_tournament_reports(data)
    
    # Generate team reports
    generate_team_reports(data)
    
    # Run analysis script if not skipped
    if not args.skip_analysis:
        run_analysis_script()
    
    logger.info("Daily update completed successfully")

if __name__ == "__main__":
    main()