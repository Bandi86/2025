# PDF to JSON Converter - Project Structure

## Overview

This document describes the organized project structure and provides guidance for developers.

## Directory Structure

```
pdf-to-json/
├── 📁 config/                    # Configuration files
│   ├── app.json                 # Main application configuration
│   ├── logging.json             # Logging configuration
│   ├── extractor_patterns.json  # Football extraction patterns
│   ├── market_keywords.json     # Market classification keywords
│   ├── market_priorities.json   # Market processing priorities
│   ├── team_aliases.json        # Team name aliases
│   ├── automation/              # Environment-specific automation configs
│   │   ├── automation.development.json
│   │   ├── automation.production.json
│   │   ├── automation.staging.json
│   │   └── automation.testing.json
│   └── schemas/                 # JSON schema definitions
│       └── default_structure.json
│
├── 📁 data/                     # Data organization
│   ├── 📁 input/               # Input PDF files
│   ├── 📁 output/              # Generated JSON outputs
│   │   ├── 📁 jsons/          # JSON conversion results
│   │   ├── 📁 output/         # Additional outputs
│   │   └── 📁 reports/        # Generated reports
│   ├── 📁 processed/           # Processed data files
│   └── 📁 temp/               # Temporary files
│
├── 📁 docs/                    # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── API_REFERENCE.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── MIGRATION_GUIDE.md
│   └── USER_MANUAL.md
│
├── 📁 examples/                # Example files and demos
│   ├── custom_team_aliases.json
│   ├── enhanced_team_normalizer_example.py
│   ├── team_normalizer_demo.py
│   └── team_normalizer_example.py
│
├── 📁 logs/                    # Log files organized by category
│   ├── 📁 processing/         # PDF processing logs
│   ├── 📁 api/               # API request logs
│   └── 📁 debug/             # Debug and error logs
│
├── 📁 src/                    # Source code organized by domain
│   ├── 📁 core/              # Core functionality
│   │   ├── config_manager.py # Configuration management
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── error_handler.py # Error handling utilities
│   ├── 📁 processing/        # PDF processing modules
│   │   ├── converter.py     # Main PDF converter
│   │   ├── football_extractor.py # Football data extraction
│   │   ├── football_converter.py # Football processing pipeline
│   │   ├── pdf_parser.py    # PDF parsing logic
│   │   ├── json_generator.py # JSON generation
│   │   └── schema_validator.py # JSON validation
│   ├── 📁 web/               # Web interfaces
│   │   ├── api/             # FastAPI endpoints
│   │   └── ui/              # Web UI components
│   └── 📁 utils/            # Utility functions
│       ├── data_processor.py
│       ├── day_splitter.py
│       ├── market_processor.py
│       ├── report_generator.py
│       └── team_normalizer.py
│
├── 📁 tests/                  # Test suite organized by type
│   ├── 📁 unit/              # Unit tests
│   ├── 📁 integration/       # Integration tests
│   ├── 📁 e2e/              # End-to-end tests
│   └── 📁 fixtures/         # Test fixtures and data
│
├── 📁 docker/                # Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── entrypoint.sh
│   └── health-check.sh
│
├── 📁 scripts/               # Utility scripts
│   ├── rolling-deploy.sh
│   └── setup.sh
│
└── 📄 Root Level Files
    ├── main.py              # Command-line interface
    ├── Makefile             # Build and development tasks
    ├── pyproject.toml       # Python project configuration
    ├── requirements.txt     # Python dependencies
    ├── pytest.ini          # Test configuration
    ├── README.md           # Project documentation
    └── PROJECT_STRUCTURE.md # This file
```

## File Organization Principles

### 1. **Configuration Files (`config/`)**

- **Purpose**: Store all application configuration
- **Naming**: Use `.json` format for consistency
- **Organization**: Group related configurations together
- **Environment**: Use subdirectories for environment-specific configs

### 2. **Data Organization (`data/`)**

- **Input**: Raw input files (PDFs)
- **Output**: Generated results and processed data
- **Temp**: Temporary files that can be safely deleted
- **Processed**: Intermediate processing results

### 3. **Source Code (`src/`)**

- **Core**: Fundamental functionality (config, exceptions)
- **Processing**: PDF processing and data extraction logic
- **Web**: API and UI components
- **Utils**: Shared utility functions

### 4. **Testing (`tests/`)**

- **Unit**: Test individual functions and classes
- **Integration**: Test component interactions
- **E2E**: Full workflow testing
- **Fixtures**: Test data and fixtures

### 5. **Documentation (`docs/`)**

- **API Documentation**: API endpoint documentation
- **User Manual**: End-user documentation
- **Developer Guide**: Development and contribution guidelines
- **Deployment Guide**: Deployment and operations documentation

## Development Workflow

### 1. **Adding New Features**

1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement in appropriate module:
   - Core functionality → `src/core/`
   - Processing logic → `src/processing/`
   - Web features → `src/web/`
   - Utilities → `src/utils/`
3. Add tests in corresponding `tests/` directory
4. Update documentation in `docs/`
5. Update configuration if needed in `config/`

### 2. **Configuration Management**

- Use `src/core/config_manager.py` for configuration access
- Add new config files to `config/` directory
- Update `config/app.json` for new settings
- Environment-specific configs in `config/automation/`

### 3. **Error Handling**

- Use custom exceptions from `src/core/exceptions.py`
- Implement validation using `src/core/error_handler.py`
- Log errors using the structured logging system

### 4. **Testing Strategy**

- Unit tests for individual components
- Integration tests for component interactions
- End-to-end tests for complete workflows
- Use fixtures from `tests/fixtures/` for test data

## Common Development Tasks

### Using the Makefile

```bash
# Setup development environment
make setup

# Run tests
make test

# Format code
make format

# Run linting
make lint

# Start development server
make dev

# Convert a PDF file
make convert INPUT=data/input/file.pdf OUTPUT=data/output/result.json

# Extract football data
make extract INPUT=data/output/result.json OUTPUT=data/output/football.json

# Run complete pipeline
make pipeline INPUT=data/output/result.json
```

### Manual Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Run specific tests
pytest tests/unit/test_converter.py -v

# Start API server
uvicorn src.web.api.main:app --reload

# Clean up generated files
make clean
```

## Best Practices

### 1. **Code Organization**
- Keep related functionality together
- Use clear, descriptive names
- Follow Python naming conventions
- Add type hints for better IDE support

### 2. **Configuration**
- Never hardcode values - use configuration files
- Provide sensible defaults
- Document configuration options
- Use environment variables for sensitive data

### 3. **Error Handling**
- Use specific exception types
- Provide meaningful error messages
- Log errors with context
- Handle edge cases gracefully

### 4. **Testing**
- Write tests for new features
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies

### 5. **Documentation**
- Update README for user-facing changes
- Document API changes
- Add docstrings to new functions
- Update this structure document as needed

## Maintenance

### Regular Tasks
- Clean up old log files: `make clean`
- Update dependencies: `pip install -r requirements.txt --upgrade`
- Run full test suite: `make test`
- Check for security updates

### Backup Strategy
- Configuration files are version controlled
- Generated data can be recreated
- Logs should be rotated regularly
- Consider backing up important output data

This structure provides a solid foundation for maintaining and extending the PDF to JSON converter project while keeping it organized and maintainable.
