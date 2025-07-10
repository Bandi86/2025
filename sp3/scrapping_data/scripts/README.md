# FlashScore Scraper Scripts

This directory contains the production-ready scripts for FlashScore scraping.

## Main Scripts

### `simple_production_scraper.py`

**Primary production script** for daily FlashScore scraping.

```bash
# Development mode (using saved HTML)
python scripts/simple_production_scraper.py --dev

# Production mode (live scraping)
python scripts/simple_production_scraper.py --live --date 2025-07-10
```

**Features:**

- Fast development mode using saved HTML
- Status-based filtering (scheduled/finished/live)
- Proper directory structure for output
- Complete workflow from scraping to data organization

### `test_fast_flashscore_parser.py`

**Fast parser** for development and testing using saved FlashScore HTML.

```bash
python scripts/test_fast_flashscore_parser.py
```

**Output:** Parses 98+ matches in <1 second from saved HTML dump.

### `demo_flashscore_optimization.py`

**Demo script** showing the complete optimization workflow.

```bash
python scripts/demo_flashscore_optimization.py
```

## Core Components

### `sources/flashscore.py`

Main FlashScore scraper class with Selenium support.

### `detailed_match_scraper.py`

Handles detailed scraping of individual matches.

### `utils/`

- `json_handler.py` - JSON data handling utilities
- Other utility functions

## Usage

### Quick Start

```bash
# Run the optimized production workflow
cd /path/to/scrapping_data
python scripts/simple_production_scraper.py --dev
```

### Output Structure

```
data/
└── YYYY/
    └── MM/
        └── DD/
            ├── daily_matches.json      # All matches
            ├── finished_matches.json   # Finished matches only
            └── matches/
                └── detailed_*.json     # Detailed match data
```

## Performance

- **Development mode**: 98 matches parsed in <1 second
- **Production mode**: Full live scraping with Selenium
- **Match coverage**: 98+ matches vs previous ~71 (38% improvement)
- **Status distribution**:
  - 69 scheduled matches
  - 23 finished matches (with scores)
  - 1 live match
  - 5 other status

## Configuration

All scripts are self-contained with minimal configuration required.
For production deployment, ensure proper paths and scheduling.
