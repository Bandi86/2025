#!/usr/bin/env python3
"""
Download events data directly from SofaScore API.
This script fetches the latest football events data from SofaScore API
and saves it to the scheduled-events.json file.
"""

import os
import sys
import json
import time
import argparse
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Import configuration
import config

# Constants
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
BASE_URL = "https://api.sofascore.com/api/v1"

# Setup logging
logger = logging.getLogger(__name__)

def get_api_headers() -> Dict[str, str]:
    """Get headers for API requests."""
    return {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.sofascore.com/",
        "Origin": "https://www.sofascore.com"
    }

def download_events_for_date(date_str: str) -> List[Dict]:
    """Download football events for a specific date."""
    url = f"{BASE_URL}/sport/football/scheduled-events/{date_str}"
    
    try:
        response = requests.get(url, headers=get_api_headers())
        response.raise_for_status()  # Raise exception for HTTP errors
        
        data = response.json()
        if "events" in data:
            logger.info(f"Downloaded {len(data['events'])} events for {date_str}")
            return data["events"]
        else:
            logger.info(f"No events found for {date_str}")
            return []
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading events for {date_str}: {e}")
        return []

def download_events_for_date_range(start_date: datetime, end_date: datetime) -> List[Dict]:
    """Download football events for a date range."""
    all_events = []
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        events = download_events_for_date(date_str)
        all_events.extend(events)
        
        # Add delay to avoid rate limiting
        time.sleep(1)
        
        # Move to next day
        current_date += timedelta(days=1)
    
    return all_events

def save_events_to_file(events: List[Dict], output_file: str) -> None:
    """Save events data to JSON file."""
    data = {"events": events}
    
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(events)} events to {output_file}")
    except IOError as e:
        logger.error(f"Error saving events to file {output_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Download events from SofaScore API")
    parser.add_argument("--days-past", type=int, default=3, help="Number of past days to include")
    parser.add_argument("--days-future", type=int, default=7, help="Number of future days to include")
    parser.add_argument("--output", default=config.SCHEDULED_EVENTS_FILE, help="Output JSON file")
    
    args = parser.parse_args()
    
    # Calculate date range
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=args.days_past)
    end_date = today + timedelta(days=args.days_future)
    
    logger.info(f"Downloading events from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    # Download events
    events = download_events_for_date_range(start_date, end_date)
    
    if events:
        # Save events to file
        save_events_to_file(events, args.output)
        logger.info(f"Successfully downloaded {len(events)} events")
    else:
        logger.warning("No events downloaded")

if __name__ == "__main__":
    main()