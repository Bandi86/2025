import os
import logging

# Base directory of the project (sofascore folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Define paths for data, jsons, reports, and archives
JSONS_DIR = os.path.join(BASE_DIR, "jsons")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
ARCHIVES_DIR = os.path.join(BASE_DIR, "archives")
DATA_DIR = os.path.join(BASE_DIR, "data")
LOGS_DIR = os.path.join(BASE_DIR, "logs") # New directory for logs

# Ensure directories exist
for _dir in [JSONS_DIR, REPORTS_DIR, ARCHIVES_DIR, DATA_DIR, LOGS_DIR]:
    os.makedirs(_dir, exist_ok=True)

# File names
SCHEDULED_EVENTS_FILE = os.path.join(JSONS_DIR, "scheduled-events.json")
EXTRACTED_EVENTS_FILE = os.path.join(JSONS_DIR, "extracted-events.json")
ANALYSIS_RESULTS_FILE = os.path.join(REPORTS_DIR, "analysis-results.json")
FILTERED_TODAY_FILE = os.path.join(REPORTS_DIR, "filtered-today.json")
FILTERED_TOMORROW_FILE = os.path.join(REPORTS_DIR, "filtered-tomorrow.json")
SCHEDULED_EVENTS_HASH_FILE = os.path.join(DATA_DIR, ".scheduled-events.hash")

# Logging configuration
LOG_FILE = os.path.join(LOGS_DIR, "sofascore_update.log")

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(LOG_FILE),
            logging.StreamHandler()
        ]
    )
    # Disable logging for requests library to avoid verbose output
    logging.getLogger("requests").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

# Call setup_logging when config is imported
setup_logging()
