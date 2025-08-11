# Football Automation System - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Web Interface Guide](#web-interface-guide)
4. [Configuration Management](#configuration-management)
5. [File Processing](#file-processing)
6. [Monitoring and Reports](#monitoring-and-reports)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Introduction

The Football Automation System is a comprehensive solution for automatically processing football data from PDF documents. The system provides:

- **Automatic PDF Download**: Fetches latest PDF files from configured web sources
- **File Monitoring**: Watches for new files and processes them automatically
- **Data Extraction**: Converts PDF content to structured JSON data
- **Team Normalization**: Standardizes team names across different sources
- **Market Processing**: Extracts and categorizes betting market data
- **Real-time Monitoring**: Web dashboard for system status and progress tracking
- **Advanced Reporting**: Detailed analytics and trend analysis

## Getting Started

### System Requirements

- **Operating System**: Linux, macOS, or Windows
- **Python**: Version 3.11 or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: At least 10GB free space
- **Network**: Internet connection for web downloads

### First Time Setup

1. **Access the Web Interface**
   - Open your web browser
   - Navigate to `http://localhost:8000` (or your configured URL)
   - You should see the login page

2. **Login**
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`
   - **Important**: Change the default password immediately after first login

3. **Initial Configuration**
   - Go to Settings → Configuration
   - Review and update the default settings
   - Configure web download URL if using automatic downloads
   - Set up notification preferences

## Web Interface Guide

### Dashboard Overview

The main dashboard provides a comprehensive view of your system:

#### Status Panel
- **System Status**: Shows if automation is running
- **Active Jobs**: Number of currently processing files
- **Queue Length**: Files waiting to be processed
- **Last Activity**: Timestamp of most recent activity

#### Quick Actions
- **Upload File**: Drag and drop or browse for PDF files
- **Start/Stop Automation**: Control automatic processing
- **View Reports**: Access latest processing reports
- **System Settings**: Configure system parameters

#### Real-time Updates
- **Processing Progress**: Live progress bars for active jobs
- **System Metrics**: CPU, memory, and disk usage
- **Recent Activity**: Timeline of recent events
- **Alerts**: Important notifications and warnings

### Navigation Menu

#### 📊 Dashboard
- System overview and status
- Quick actions and controls
- Real-time monitoring widgets

#### 📁 Files
- File browser for source and output directories
- Upload interface with drag-and-drop support
- Processing history and job status
- Download processed files

#### 📈 Reports
- Latest processing reports
- Trend analysis and charts
- Data quality metrics
- Export options (CSV, Excel, PDF)

#### ⚙️ Settings
- System configuration
- User management
- Notification settings
- Advanced options

#### 🔍 Monitoring
- System health metrics
- Performance monitoring
- Log viewer
- Alert management

### File Upload Interface

#### Drag and Drop Upload

1. **Navigate to Files Section**
   - Click on "Files" in the main navigation
   - Select "Upload" tab

2. **Upload Files**
   - Drag PDF files directly onto the upload area
   - Or click "Browse" to select files
   - Multiple files can be uploaded simultaneously

3. **Configure Processing Options**
   - **Priority**: Set processing priority (0-4, higher is more urgent)
   - **Auto-process**: Enable to automatically start processing
   - **Extract Football Data**: Enable football-specific data extraction
   - **Main Matches Only**: Process only main betting markets (1X2)

4. **Monitor Upload Progress**
   - Progress bar shows upload status
   - File validation results displayed
   - Processing automatically starts if enabled

#### Supported File Types

- **PDF Files**: Primary input format
- **Maximum Size**: 100MB per file (configurable)
- **Encoding**: UTF-8 text content required
- **Language**: Multi-language support with Hungarian optimization

### Processing Management

#### Job Queue Management

1. **View Active Jobs**
   - Go to Dashboard or Files → Processing
   - See list of all jobs with status
   - Real-time progress updates

2. **Job Status Types**
   - **Queued**: Waiting to be processed
   - **Running**: Currently being processed
   - **Completed**: Successfully finished
   - **Failed**: Processing failed
   - **Cancelled**: Manually cancelled

3. **Job Actions**
   - **View Details**: Click on job to see detailed information
   - **Cancel Job**: Stop processing (admin only)
   - **Retry Failed**: Restart failed jobs
   - **Download Results**: Get processed JSON files

#### Processing Stages

Each job goes through several stages:

1. **File Validation**: Check file format and accessibility
2. **PDF Parsing**: Extract text content from PDF
3. **Data Extraction**: Identify football matches and markets
4. **Team Normalization**: Standardize team names
5. **Market Processing**: Categorize and validate betting markets
6. **Report Generation**: Create summary reports and analytics
7. **File Output**: Save processed JSON files

### Real-time Monitoring

#### WebSocket Connection

The interface uses WebSocket for real-time updates:

- **Connection Status**: Shown in top-right corner
- **Auto-reconnect**: Automatically reconnects if connection lost
- **Live Updates**: Progress, status changes, and notifications

#### Monitoring Widgets

1. **System Health**
   - CPU usage graph
   - Memory consumption
   - Disk space availability
   - Network activity

2. **Processing Metrics**
   - Jobs per hour
   - Average processing time
   - Success/failure rates
   - Queue length trends

3. **Data Quality**
   - Team normalization accuracy
   - Market coverage statistics
   - Anomaly detection results
   - Data completeness metrics

## Configuration Management

### Accessing Configuration

1. **Navigate to Settings**
   - Click "Settings" in main navigation
   - Select "Configuration" tab
   - Admin privileges required

2. **Configuration Sections**
   - **Web Downloader**: Automatic PDF download settings
   - **File Watcher**: File monitoring configuration
   - **Processing**: Job processing parameters
   - **Caching**: Performance optimization settings
   - **Notifications**: Alert and notification setup
   - **Monitoring**: System monitoring configuration

### Web Downloader Configuration

Configure automatic PDF downloads:

```json
{
  "url": "https://example.com/football-data",
  "check_interval": 3600,
  "download_path": "source/",
  "max_retries": 3,
  "headers": {
    "User-Agent": "Football Automation System"
  },
  "timeout": 30,
  "verify_ssl": true
}
```

#### Settings Explanation:
- **URL**: Source website for PDF downloads
- **Check Interval**: How often to check for new files (seconds)
- **Download Path**: Local directory for downloaded files
- **Max Retries**: Number of retry attempts for failed downloads
- **Headers**: Custom HTTP headers for requests
- **Timeout**: Request timeout in seconds
- **Verify SSL**: Enable SSL certificate verification

### File Watcher Configuration

Configure file system monitoring:

```json
{
  "watch_path": "source/",
  "file_patterns": ["*.pdf"],
  "debounce_time": 5,
  "recursive": true,
  "ignore_patterns": ["*.tmp", "*.lock"]
}
```

#### Settings Explanation:
- **Watch Path**: Directory to monitor for new files
- **File Patterns**: File types to process (glob patterns)
- **Debounce Time**: Wait time before processing new files (seconds)
- **Recursive**: Monitor subdirectories
- **Ignore Patterns**: Files to ignore

### Processing Configuration

Configure job processing behavior:

```json
{
  "max_concurrent": 2,
  "retry_attempts": 3,
  "timeout": 300,
  "priority_levels": 5,
  "auto_cleanup": true,
  "cleanup_age_days": 30
}
```

#### Settings Explanation:
- **Max Concurrent**: Maximum simultaneous processing jobs
- **Retry Attempts**: Number of retries for failed jobs
- **Timeout**: Maximum processing time per job (seconds)
- **Priority Levels**: Number of priority levels (0-4)
- **Auto Cleanup**: Automatically clean old files
- **Cleanup Age**: Age threshold for cleanup (days)

### Caching Configuration

Configure performance caching:

```json
{
  "enabled": true,
  "redis_url": "redis://localhost:6379/0",
  "default_ttl": 3600,
  "team_normalization_ttl": 86400,
  "market_classification_ttl": 43200
}
```

#### Settings Explanation:
- **Enabled**: Enable/disable caching
- **Redis URL**: Redis server connection string
- **Default TTL**: Default cache expiration (seconds)
- **Team Normalization TTL**: Cache time for team mappings
- **Market Classification TTL**: Cache time for market data

### Notification Configuration

Configure alerts and notifications:

```json
{
  "email": {
    "enabled": true,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "recipients": ["admin@example.com"]
  },
  "webhook": {
    "enabled": true,
    "urls": ["https://hooks.slack.com/services/..."],
    "events": ["processing_failed", "system_error"]
  }
}
```

#### Settings Explanation:
- **Email Settings**: SMTP configuration for email notifications
- **Webhook Settings**: HTTP endpoints for webhook notifications
- **Events**: Which events trigger notifications

### Configuration Management

#### Saving Changes

1. **Edit Configuration**
   - Modify settings in the web interface
   - Use JSON editor with syntax highlighting
   - Validation occurs in real-time

2. **Preview Changes**
   - Click "Preview" to see configuration diff
   - Review changes before applying
   - Validation errors shown if any

3. **Apply Configuration**
   - Click "Save" to apply changes
   - System automatically reloads configuration
   - No restart required for most settings

#### Configuration Backup

1. **Automatic Backups**
   - System creates backups before changes
   - Stored in `config/backups/` directory
   - Timestamped for easy identification

2. **Manual Backup**
   - Click "Backup Current Config"
   - Download configuration as JSON file
   - Store safely for disaster recovery

3. **Restore Configuration**
   - Click "Restore from Backup"
   - Select backup file to restore
   - Confirm restoration action

## File Processing

### Automatic Processing

#### Web Download Process

1. **Scheduled Checks**
   - System checks configured URL at regular intervals
   - Compares remote file timestamps with local files
   - Downloads only newer files

2. **Download Process**
   - Files downloaded to configured directory
   - Checksum verification for integrity
   - Automatic processing starts if enabled

3. **Error Handling**
   - Retry logic for failed downloads
   - Notification alerts for persistent failures
   - Detailed logging for troubleshooting

#### File Watcher Process

1. **File Detection**
   - Monitors source directory for new files
   - Debouncing prevents processing incomplete files
   - Pattern matching filters relevant files

2. **Automatic Processing**
   - New files automatically queued for processing
   - Priority assigned based on configuration
   - Progress tracked in real-time

### Manual Processing

#### Upload and Process

1. **File Upload**
   - Use web interface to upload PDF files
   - Set processing priority and options
   - Multiple files can be uploaded simultaneously

2. **Processing Options**
   - **Extract Football Data**: Enable football-specific extraction
   - **Main Matches Only**: Process only 1X2 betting markets
   - **Priority Level**: Set job priority (0-4)
   - **Custom Parameters**: Advanced processing options

3. **Monitor Progress**
   - Real-time progress updates via WebSocket
   - Detailed stage information
   - Estimated completion time

#### Batch Processing

1. **Multiple File Upload**
   - Select multiple PDF files
   - Configure batch processing options
   - All files queued with same settings

2. **Queue Management**
   - View all queued jobs
   - Modify priorities if needed
   - Cancel or retry jobs as required

### Processing Results

#### Output Files

Processed files are saved in structured format:

```
jsons/
├── converted_output.json          # Raw converted data
├── football_data.json            # Extracted football data
├── reports/
│   ├── football_report_TIMESTAMP.json
│   ├── summary_TIMESTAMP.csv
│   ├── anomalies_TIMESTAMP.csv
│   └── daily_breakdown_TIMESTAMP.csv
└── days/
    ├── 2025-01-01_games.json
    ├── 2025-01-02_games.json
    └── ...
```

#### Data Structure

Processed football data follows this structure:

```json
{
  "games": [
    {
      "league": "Premier League",
      "date": "2025-01-01",
      "iso_date": "2025-01-01",
      "time": "15:00",
      "home_team": "Arsenal",
      "away_team": "Chelsea",
      "original_home_team": "Arsenal FC",
      "original_away_team": "Chelsea FC",
      "main_market": {
        "market_type": "1X2",
        "odds": {
          "1": 2.50,
          "X": 3.20,
          "2": 2.80
        }
      },
      "additional_markets": []
    }
  ],
  "metadata": {
    "processed_at": "2025-01-01T10:00:00Z",
    "total_games": 150,
    "processing_time": 45.2
  }
}
```

## Monitoring and Reports

### System Monitoring

#### Health Dashboard

1. **System Status**
   - Overall system health indicator
   - Component status (green/yellow/red)
   - Uptime and performance metrics

2. **Resource Usage**
   - CPU utilization graphs
   - Memory consumption trends
   - Disk space availability
   - Network activity monitoring

3. **Performance Metrics**
   - Processing throughput
   - Average job completion time
   - Queue length trends
   - Error rates and patterns

#### Alert System

1. **Alert Types**
   - **System Alerts**: High resource usage, component failures
   - **Processing Alerts**: Job failures, queue backlog
   - **Data Quality Alerts**: Anomalies, validation failures
   - **Security Alerts**: Authentication failures, suspicious activity

2. **Alert Channels**
   - **Web Interface**: Real-time notifications
   - **Email**: Detailed alert messages
   - **Webhook**: Integration with external systems
   - **Log Files**: Persistent alert records

### Processing Reports

#### Summary Reports

1. **Daily Summary**
   - Total games processed
   - League breakdown
   - Processing performance
   - Data quality metrics

2. **Weekly/Monthly Trends**
   - Processing volume trends
   - Performance improvements
   - Error rate analysis
   - System utilization patterns

#### Detailed Analytics

1. **Data Quality Reports**
   - Team normalization accuracy
   - Market coverage analysis
   - Anomaly detection results
   - Data completeness metrics

2. **Performance Reports**
   - Processing time analysis
   - Resource utilization trends
   - Bottleneck identification
   - Optimization recommendations

#### Export Options

1. **Report Formats**
   - **JSON**: Machine-readable format
   - **CSV**: Spreadsheet compatible
   - **Excel**: Formatted spreadsheets
   - **PDF**: Printable reports

2. **Automated Reports**
   - Scheduled report generation
   - Email delivery options
   - Webhook notifications
   - Archive management

### Log Management

#### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General information messages
- **WARNING**: Warning messages for attention
- **ERROR**: Error messages requiring action
- **CRITICAL**: Critical system failures

#### Log Viewing

1. **Web Interface**
   - Real-time log streaming
   - Filter by level and component
   - Search functionality
   - Export log segments

2. **Log Files**
   - Structured JSON logging
   - Automatic log rotation
   - Configurable retention periods
   - Centralized log aggregation

## Troubleshooting

### Common Issues

#### File Processing Problems

**Problem**: Files not being processed automatically

**Solutions**:
1. Check file watcher configuration
2. Verify file permissions in source directory
3. Ensure file patterns match uploaded files
4. Check system logs for error messages

**Problem**: Processing jobs stuck in queue

**Solutions**:
1. Check system resource usage
2. Verify processing manager is running
3. Increase max concurrent jobs if resources allow
4. Restart processing manager if needed

**Problem**: Poor data extraction quality

**Solutions**:
1. Verify PDF file quality and text content
2. Check team normalization configuration
3. Review market classification patterns
4. Update extraction patterns if needed

#### Web Interface Issues

**Problem**: Cannot access web interface

**Solutions**:
1. Verify server is running on correct port
2. Check firewall settings
3. Ensure correct URL and port
4. Review server logs for errors

**Problem**: Real-time updates not working

**Solutions**:
1. Check WebSocket connection status
2. Verify browser WebSocket support
3. Check proxy/firewall WebSocket settings
4. Refresh browser connection

**Problem**: File upload failures

**Solutions**:
1. Check file size limits
2. Verify file type restrictions
3. Ensure sufficient disk space
4. Check upload directory permissions

#### Configuration Issues

**Problem**: Configuration changes not taking effect

**Solutions**:
1. Verify configuration syntax is valid JSON
2. Check for validation errors
3. Ensure proper permissions for config files
4. Restart system if required

**Problem**: Notification alerts not working

**Solutions**:
1. Verify email/webhook configuration
2. Check network connectivity
3. Test notification endpoints
4. Review notification logs

### Diagnostic Tools

#### Health Check

Use the health check endpoint to verify system status:

```bash
curl http://localhost:8000/health
```

Expected response for healthy system:
```json
{
  "status": "healthy",
  "components": {
    "automation_manager": true,
    "database": true,
    "cache": true
  }
}
```

#### Log Analysis

1. **Web Interface Logs**
   - Go to Monitoring → Logs
   - Filter by time range and severity
   - Search for specific error messages

2. **Command Line Logs**
   ```bash
   tail -f logs/football_processing.log
   ```

3. **System Metrics**
   - Monitor CPU, memory, and disk usage
   - Check for resource bottlenecks
   - Identify performance issues

### Getting Help

#### Documentation Resources

- **API Reference**: Detailed API documentation
- **Deployment Guide**: Installation and deployment instructions
- **Developer Documentation**: Technical implementation details

#### Support Channels

1. **System Logs**: Check application logs for detailed error information
2. **Health Monitoring**: Use built-in monitoring tools
3. **Configuration Validation**: Verify all settings are correct
4. **Community Resources**: Check documentation and examples

## Best Practices

### File Management

1. **Organize Source Files**
   - Use consistent naming conventions
   - Separate files by date or source
   - Remove processed files regularly
   - Maintain backup copies

2. **Monitor Disk Space**
   - Set up disk space alerts
   - Configure automatic cleanup
   - Archive old processed files
   - Monitor growth trends

### Performance Optimization

1. **Resource Management**
   - Monitor system resources regularly
   - Adjust concurrent job limits based on capacity
   - Use caching for frequently accessed data
   - Optimize database queries

2. **Processing Efficiency**
   - Process files during off-peak hours
   - Use appropriate priority levels
   - Batch similar files together
   - Monitor processing times

### Security Best Practices

1. **Authentication**
   - Change default passwords immediately
   - Use strong passwords
   - Enable two-factor authentication if available
   - Regularly review user access

2. **File Security**
   - Validate uploaded files
   - Scan for malware if possible
   - Restrict file types and sizes
   - Monitor file access patterns

### Maintenance

1. **Regular Tasks**
   - Review system logs weekly
   - Update configuration as needed
   - Clean up old files and logs
   - Monitor performance trends

2. **Backup Strategy**
   - Backup configuration files regularly
   - Archive important processed data
   - Test backup restoration procedures
   - Document backup procedures

3. **System Updates**
   - Keep system software updated
   - Review and apply security patches
   - Test updates in staging environment
   - Plan maintenance windows

### Monitoring Strategy

1. **Proactive Monitoring**
   - Set up appropriate alerts
   - Monitor key performance indicators
   - Track data quality metrics
   - Review trends regularly

2. **Incident Response**
   - Document common issues and solutions
   - Establish escalation procedures
   - Maintain emergency contacts
   - Practice incident response procedures

This user manual provides comprehensive guidance for using the Football Automation System effectively. For technical implementation details, refer to the [Developer Documentation](DEVELOPER_GUIDE.md) and [API Reference](API_REFERENCE.md).