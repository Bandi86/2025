import os
import json
import subprocess
import logging
from typing import Dict, Any

import config

logger = logging.getLogger(__name__)

def fetch_and_process_match_stats(match_id: str, match_url: str) -> None:
    """
    Fetches match statistics using Node.js script and processes them.
    """
    output_dir = os.path.join(config.DATA_DIR, "match_stats")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, f"{match_id}.json")

    node_script_path = os.path.join(config.BASE_DIR, "scripts", "match_stats_fetcher", "fetch-match-stats.js")

    try:
        logger.info(f"Fetching match stats for match ID: {match_id} from {match_url}")
        result = subprocess.run(
            ["node", node_script_path, match_url],
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"Node.js script stdout: {result.stdout.strip()}")
        if result.stderr:
            logger.warning(f"Node.js script stderr: {result.stderr.strip()}")

        logger.info(f"Successfully fetched stats for {match_id}. Saved to {output_file}")

        # Process the downloaded JSON file
        if os.path.exists(output_file):
            with open(output_file, 'r', encoding='utf-8') as f:
                stats_data = json.load(f)
            
            # TODO: Add your logic here to process stats_data
            # For example, save to a database, perform further analysis, etc.
            logger.info(f"Processed stats data for {match_id}: {json.dumps(stats_data, indent=2)}")
        else:
            logger.error(f"Output file {output_file} not found after fetch attempt.")

    except subprocess.CalledProcessError as e:
        logger.error(f"Error fetching match stats for {match_id}: {e.stderr}")
    except FileNotFoundError:
        logger.error(f"Node.js or fetch-match-stats.js script not found. Make sure Node.js is installed and the script path is correct: {node_script_path}")
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON from {output_file} for {match_id}: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred for {match_id}: {e}")

if __name__ == "__main__":
    # Example usage (you would typically call this from daily_update.py)
    # You need a real match_id and match_url here
    # For testing, use a known match ID and URL
    example_match_id = "dsM" # This is from the example URL, not a real ID from the API
    example_match_url = "https://www.sofascore.com/west-ham-united-wolverhampton/dsM"
    fetch_and_process_match_stats(example_match_id, example_match_url)
