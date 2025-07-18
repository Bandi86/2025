#!/bin/bash

# Daily update script for SofaScore data
# This script can be scheduled via cron to run multiple times a day

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Start logging (Python scripts handle logging now)

# Activate virtual environment if it exists
if [ -f "$SCRIPT_DIR/../../../.venv/bin/activate" ]; then
    echo "Activating virtual environment"
    source "$SCRIPT_DIR/../../../.venv/bin/activate"
fi

# Step 1: Download latest events from API
echo "Downloading latest events from SofaScore API"
python3 "$SCRIPT_DIR/download_events.py" --days-past 3 --days-future 7

# Check if download was successful
if [ $? -ne 0 ]; then
    echo "Warning: Failed to download events from API. Will try to use existing file."
fi

# Step 2: Run the daily update script
echo "Processing events data"
python3 "$SCRIPT_DIR/daily_update.py"

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "Data processing completed successfully"
else
    echo "Error: Data processing failed"
    exit 1
fi

# Deactivate virtual environment if it was activated
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi

echo "Update process finished"

# Example cron job (add this to crontab -e):
# 0 6,12,18,22 * * * /path/to/webscrapper/src/sofascore/run_daily_update.sh