# Technology Stack

## Core Technologies

- **Python 3.11+**: Primary language with modern async/await patterns
- **FastAPI**: REST API framework with automatic OpenAPI documentation
- **SQLAlchemy 2.0+**: Database ORM with async support
- **Alembic**: Database migrations
- **PostgreSQL**: Primary database for persistence
- **Redis**: Caching and session storage
- **Streamlit**: Web dashboard interface
- **Docker**: Containerization and deployment

## Key Libraries

- **PDF Processing**: PyPDF2, pdfplumber for PDF parsing
- **Data Processing**: pandas, numpy for data manipulation
- **Async Framework**: asyncio, aiofiles, aiohttp
- **Task Scheduling**: APScheduler for background jobs
- **Monitoring**: prometheus-client, structlog for metrics and logging
- **Security**: cryptography, PyJWT, bcrypt for authentication
- **Testing**: pytest with asyncio, coverage, and performance testing

## Build System

- **Package Manager**: pip with requirements.txt and pyproject.toml
- **Build Tool**: setuptools with modern pyproject.toml configuration
- **Dependency Management**: Both requirements.txt (pinned) and pyproject.toml (ranges)

## Common Commands

### Development
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest tests/
pytest --cov=src --cov-report=html  # With coverage

# Code formatting
black src/
isort src/

# Type checking
mypy src/
```

### Application
```bash
# CLI usage
python main.py --input file.pdf --output output.json
python main.py --convert-football output.json --output jsons/

# API server
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Streamlit dashboard
streamlit run src/ui/streamlit_app.py
```

### Docker
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.production.yml up -d

# Scale workers
docker-compose up -d --scale worker=3
```

## Architecture Patterns

- **Async/Await**: All I/O operations use async patterns
- **Dependency Injection**: Components receive dependencies via constructor
- **Event-Driven**: File watching and processing use event handlers
- **Microservices**: Separate containers for API, automation, workers, dashboard
- **Configuration-Driven**: JSON/environment-based configuration
- **Error Handling**: Custom exception hierarchy with graceful degradation