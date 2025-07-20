#!/bin/bash

# BettingMentor Cron Jobs Setup Script
echo "⏰ Setting up BettingMentor Cron Jobs"
echo "===================================="

# Get the absolute path of the project
PROJECT_PATH=$(pwd)
echo "📁 Project path: $PROJECT_PATH"

# Check if required files exist
if [ ! -f "merge_json_data/daily_data_pipeline.sh" ]; then
    echo "❌ daily_data_pipeline.sh not found. Please ensure all scripts are in place."
    exit 1
fi

if [ ! -f "merge_json_data/evening_results_pipeline.sh" ]; then
    echo "❌ evening_results_pipeline.sh not found. Please ensure all scripts are in place."
    exit 1
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x merge_json_data/daily_data_pipeline.sh
chmod +x merge_json_data/evening_results_pipeline.sh
chmod +x monitoring/monitor_data_pipeline.py

# Create logs directory
mkdir -p logs

# Create temporary cron file
TEMP_CRON_FILE="/tmp/bettingmentor_cron"

# Generate cron jobs with actual project path
cat > $TEMP_CRON_FILE << EOF
# BettingMentor Automated Data Pipeline
# Generated on $(date)

# Morning Data Collection (6:00 AM daily)
# Runs tippmixpro scrapper and initial merge
0 6 * * * cd $PROJECT_PATH && ./merge_json_data/daily_data_pipeline.sh >> logs/cron_morning.log 2>&1

# Evening Results Collection (10:00 PM daily)  
# Runs results scrapper and updates merged data with results
0 22 * * * cd $PROJECT_PATH && ./merge_json_data/evening_results_pipeline.sh >> logs/cron_evening.log 2>&1

# Monitoring Check (every 2 hours during business hours)
# Runs monitoring script to check system health
0 8,10,12,14,16,18,20 * * * cd $PROJECT_PATH && python3 monitoring/monitor_data_pipeline.py >> logs/cron_monitoring.log 2>&1

# Database Sync (every 4 hours)
# Ensures all merged data is synced to database
0 2,6,10,14,18,22 * * * cd $PROJECT_PATH && curl -s -X POST http://localhost:3001/data-ingestion/ingest-all -H "Content-Type: application/json" -d '{"directoryPath": "/usr/src/app/merge_json_data/merged_data"}' >> logs/cron_db_sync.log 2>&1

# Weekly Cleanup (Sunday 3:00 AM)
# Cleans up old log files and temporary data
0 3 * * 0 cd $PROJECT_PATH && find logs/ -name "*.log" -mtime +7 -delete && find monitoring/reports/ -name "*.md" -mtime +7 -delete
EOF

echo "📋 Generated cron jobs:"
echo "----------------------------------------"
cat $TEMP_CRON_FILE
echo "----------------------------------------"

# Ask user for confirmation
echo ""
read -p "❓ Do you want to install these cron jobs? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backup existing crontab
    echo "💾 Backing up existing crontab..."
    crontab -l > logs/crontab_backup_$(date +%Y%m%d_%H%M%S).txt 2>/dev/null || echo "No existing crontab found"
    
    # Install new cron jobs (append to existing)
    echo "⚙️  Installing cron jobs..."
    (crontab -l 2>/dev/null; echo ""; cat $TEMP_CRON_FILE) | crontab -
    
    if [ $? -eq 0 ]; then
        echo "✅ Cron jobs installed successfully!"
        echo ""
        echo "📅 Scheduled Tasks:"
        echo "   • 06:00 - Morning data collection (tippmixpro + merge)"
        echo "   • 22:00 - Evening results collection (results + merge)"
        echo "   • Every 2h (8-20) - System monitoring"
        echo "   • Every 4h - Database sync"
        echo "   • Sunday 03:00 - Weekly cleanup"
        echo ""
        echo "📋 To view installed cron jobs: crontab -l"
        echo "📋 To remove cron jobs: crontab -e (then delete the BettingMentor lines)"
    else
        echo "❌ Failed to install cron jobs"
        exit 1
    fi
else
    echo "❌ Cron jobs installation cancelled"
    echo "💡 You can manually install them later using: crontab -e"
    echo "💡 Then copy the contents from: $TEMP_CRON_FILE"
fi

# Cleanup
rm -f $TEMP_CRON_FILE

echo ""
echo "🎉 Cron setup completed!"
echo "💡 Logs will be available in the logs/ directory"
echo "💡 Monitor system status with: ./dev-setup.sh status"