#!/bin/bash

# SofaScore data processing pipeline
# This script runs the entire data processing workflow

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Starting SofaScore data processing pipeline..."

# Activate virtual environment if it exists
if [ -f "$SCRIPT_DIR/../../../.venv/bin/activate" ]; then
    echo "Activating virtual environment"
    source "$SCRIPT_DIR/../../../.venv/bin/activate"
fi

# 1. Extract essential data
python3 "$SCRIPT_DIR/extract_events.py"
if [ $? -ne 0 ]; then
    echo "Error extracting data. Exiting."
    exit 1
fi

# 2. Filter events for today and tomorrow
python3 "$SCRIPT_DIR/filter_events.py" --today --output ../reports/filtered-today.json
if [ $? -ne 0 ]; then
    echo "Error filtering today's events. Continuing..."
fi

python3 "$SCRIPT_DIR/filter_events.py" --tomorrow --output ../reports/filtered-tomorrow.json
if [ $? -ne 0 ]; then
    echo "Error filtering tomorrow's events. Continuing..."
fi

# 3. Analyze all events
python3 "$SCRIPT_DIR/analyze_events.py"
if [ $? -ne 0 ]; then
    echo "Error analyzing events. Continuing..."
fi

# Deactivate virtual environment if it was activated
if [ -n "$VIRTUAL_ENV" ]; then
    deactivate
fi

echo "Data processing complete!"
echo "Generated files:"
echo "- ../jsons/extracted-events.json: Clean dataset with essential data"
echo "- ../reports/filtered-today.json: Events scheduled for today"
echo "- ../reports/filtered-tomorrow.json: Events scheduled for tomorrow"
echo "- ../reports/analysis-results.json: Statistical analysis of all events"