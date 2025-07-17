# Football Match Scraping System

A comprehensive Python-based system for scraping daily football match data from multiple sources, including FlashScore and Eredmenyek.com. The system creates structured JSON files with match information, odds, statistics, and other detailed data.

## Features

- **Multi-Source Scraping**: Supports FlashScore and Eredmenyek.com with extensible architecture
- **Daily Match Lists**: Automatically generates daily match schedules
- **Detailed Match Information**: Scrapes comprehensive match data including odds, statistics, lineups
- **Data Validation**: Built-in validation and quality assurance
- **Duplicate Detection**: Intelligent deduplication across sources
- **Structured Storage**: Organized JSON file storage by date
- **Concurrent Processing**: Parallel scraping for improved performance
- **Error Handling**: Robust error handling and logging
- **CLI Interface**: Command-line interface for easy automation

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Create the base data directory:

```bash
mkdir -p /path/to/your/data/directory
```

## Quick Start

### Basic Usage

```python
from scripts.scrapping import ScrapingCoordinator

# Initialize the coordinator
coordinator = ScrapingCoordinator("/path/to/data")

# Run daily scraping for today
results = coordinator.run_daily_scraping()

print(f"Scraped {results['summary']['total_matches']} matches")
print(f"Coverage: {results['summary']['coverage_percentage']:.1f}%")
```

### Command Line Usage

```bash
# Run daily scraping for today
python -m scripts.scrapping --base-path /path/to/data --mode daily

# Run scraping for a specific date
python -m scripts.scrapping --base-path /path/to/data --date 2025-01-10 --mode daily

# Only generate daily list (no detailed scraping)
python -m scripts.scrapping --base-path /path/to/data --mode daily --no-details

# Update missing detailed information
python -m scripts.scrapping --base-path /path/to/data --mode update

# Check system status
python -m scripts.scrapping --base-path /path/to/data --mode status

# Use specific sources only
python -m scripts.scrapping --base-path /path/to/data --sources flashscore --mode daily
```

## Data Structure

### Directory Layout

```
data/
├── YYYY/
│   ├── MM/
│   │   ├── DD/
│   │   │   └── matches/
│   │   │       ├── daily_matches_YYYY-MM-DD.json
│   │   │       ├── match_team1_vs_team2_time_source.json
│   │   │       └── ...
logs/
├── scraping_YYYYMMDD.log
├── session_YYYY-MM-DD_HHMMSS.json
└── ...
```

## System Components

### 1. ScrapingCoordinator

Main orchestrator that manages the entire scraping workflow

### 2. DailyMatchListGenerator

Generates daily match lists from multiple sources

### 3. DetailedMatchScraper

Scrapes comprehensive match information

### 4. Source Scrapers

- **FlashScoreScraper**: FlashScore.com data
- **EredmenyekScraper**: Eredmenyek.com (Hungarian) data

### 5. Utility Modules

- **JSONHandler**: JSON file operations
- **MatchValidator**: Data validation and cleaning
- **DateUtils**: Date handling and formatting

## Testing

Run the test suite to verify system functionality:

```bash
python test_system.py
```

## Best Practices

1. **Respectful Scraping**: Includes delays between requests
2. **Data Quality**: Always validate scraped data before storage
3. **Error Recovery**: Handle network issues gracefully
4. **Resource Management**: Use appropriate concurrency limits
5. **Monitoring**: Regularly check logs and system status

## Contributing

1. Follow existing code structure and naming conventions
2. Add comprehensive tests for new functionality
3. Update documentation for any new features
4. Ensure all scrapers follow the `BaseScraper` interface
5. Maintain data validation standards
