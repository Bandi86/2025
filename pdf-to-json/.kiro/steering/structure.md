# Project Structure

## Root Directory Layout

```
├── src/                    # Main source code
├── tests/                  # Test suite
├── config/                 # Configuration files
├── docs/                   # Documentation
├── examples/               # Usage examples
├── docker/                 # Docker configuration
├── scripts/                # Deployment scripts
├── alembic/                # Database migrations
├── source/                 # Input PDF files
├── jsons/                  # Output JSON files
├── logs/                   # Application logs
├── data/                   # Database and persistent data
└── temp/                   # Temporary processing files
```

## Source Code Organization (`src/`)

### Core Modules
- **`src/converter/`**: PDF to JSON conversion logic
  - `converter.py`: Main PDFToJSONConverter class
  - `football_converter.py`: Football-specific processing pipeline
  - `football_extractor.py`: Football data extraction from JSON
  - `pdf_parser.py`: PDF parsing utilities
  - `team_normalizer.py`: Team name normalization and alias mapping

- **`src/automation/`**: Background processing and automation
  - `automation_manager.py`: Central orchestration
  - `file_watcher.py`: File system monitoring
  - `processing_manager.py`: Job queue and processing
  - `web_downloader.py`: Automated web downloads
  - `monitoring.py`: Health checks and metrics

- **`src/api/`**: REST API endpoints
  - `main.py`: FastAPI application and routes
  - `enhanced_main.py`: Extended API with additional features

- **`src/database/`**: Database layer
  - `models.py`: SQLAlchemy models
  - `connection.py`: Database connection management
  - `repositories.py`: Data access layer

- **`src/ui/`**: User interfaces
  - `streamlit_app.py`: Streamlit dashboard
  - `react-dashboard/`: React-based web interface

## Configuration Structure (`config/`)

- **`automation/`**: Automation system configuration
  - Environment-specific configs (development, production, testing)
  - `security.json`: Security and authentication settings
- **`schemas/`**: JSON schema definitions
- **Market and team configuration files**: Keywords, priorities, aliases

## Testing Organization (`tests/`)

### Test Categories
- **Unit Tests**: `test_*.py` for individual components
- **Integration Tests**: `test_*_integration.py` for component interaction
- **End-to-End Tests**: `test_e2e_*.py` for complete workflows
- **Performance Tests**: `test_*_performance.py` for benchmarking

### Test Markers
- `@pytest.mark.unit`: Fast unit tests
- `@pytest.mark.integration`: Integration tests
- `@pytest.mark.e2e`: End-to-end tests
- `@pytest.mark.slow`: Long-running tests
- `@pytest.mark.security`: Security-focused tests

## Naming Conventions

### Files and Directories
- **Snake_case**: All Python files and directories
- **Kebab-case**: Docker and configuration files
- **PascalCase**: Class names in code

### Code Conventions
- **Classes**: PascalCase (e.g., `FootballExtractor`)
- **Functions/Methods**: snake_case (e.g., `extract_football_data`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CONCURRENT_JOBS`)
- **Private methods**: Leading underscore (e.g., `_process_internal`)

## Import Organization

```python
# Standard library imports
import asyncio
import logging
from pathlib import Path

# Third-party imports
from fastapi import FastAPI
from sqlalchemy import create_engine

# Local imports
from .config import AutomationConfig
from .exceptions import ProcessingError
```

## Configuration Patterns

- **Environment-based**: Different configs for dev/staging/production
- **JSON-based**: Structured configuration files
- **Environment variables**: Override config values
- **Hot-reload**: Configuration changes without restart (when enabled)

## Data Flow Patterns

1. **Input**: `source/` → PDF files
2. **Processing**: `src/converter/` → JSON conversion
3. **Output**: `jsons/` → Structured data files
4. **Reports**: `jsons/reports/` → Analysis and statistics
5. **Logs**: `logs/` → Application and processing logs