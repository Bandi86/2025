# Football Automation System - Developer Guide

## Table of Contents

- [Football Automation System - Developer Guide](#football-automation-system---developer-guide)
  - [Table of Contents](#table-of-contents)
  - [Architecture Overview](#architecture-overview)
    - [System Architecture](#system-architecture)
    - [Design Principles](#design-principles)
  - [Development Environment Setup](#development-environment-setup)
    - [Prerequisites](#prerequisites)
    - [Local Development Setup](#local-development-setup)

## Architecture Overview

The Football Automation System follows a modular, event-driven architecture designed for scalability and maintainability.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web Dashboard │   REST API      │   WebSocket API             │
│   (React)       │   (FastAPI)     │   (Real-time updates)       │
└─────────────────┴─────────────────┴─────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        Business Logic Layer                     │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ AutomationMgr   │ ProcessingMgr   │   AdvancedReporter          │
│ WebDownloader   │ FileWatcher     │   CacheManager              │
└─────────────────┴─────────────────┴─────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        Data Processing Layer                    │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ FootballConv    │ TeamNormalizer  │   MarketProcessor           │
│ PDFParser       │ DataProcessor   │   ReportGenerator           │
└─────────────────┴─────────────────┴─────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        Data Access Layer                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Database      │     Cache       │   File System               │
│ (PostgreSQL)    │   (Redis)       │   (Local/NFS)               │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns**: Each component has a single responsibility
2. **Dependency Injection**: Components are loosely coupled through interfaces
3. **Event-Driven**: Components communicate through events and callbacks
4. **Async/Await**: Non-blocking I/O operations throughout the system
5. **Configuration-Driven**: Behavior controlled through configuration files
6. **Testability**: All components are unit testable with mocking support

## Development Environment Setup

### Prerequisites

- Python 3.11+
- Git
- Docker (optional, for containerized development)
- PostgreSQL 13+ (for database development)
- Redis 6.0+ (for caching development)

### Local Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd football-automation-system

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install development dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Setup environment variables
cp .env.example .env
# Edit .env with your local settings

# Initialize database
alembic upgrade head

# Run tests to verify setup
pytest tests/ -v
```
### Development Tools

#### Code Quality Tools

```bash
# Code formatting
black src/ tests/
isort src/ tests/

# Linting
flake8 src/ tests/
pylint src/

# Type checking
mypy src/

# Security scanning
bandit -r src/
```

#### Testing Tools

```bash
# Unit tests
pytest tests/unit/ -v

# Integration tests
pytest tests/integration/ -v

# Coverage report
pytest --cov=src tests/ --cov-report=html

# Performance tests
pytest tests/performance/ -v --benchmark-only
```

## Code Structure

### Directory Layout

```
football-automation-system/
├── src/                          # Source code
│   ├── api/                      # REST API implementation
│   │   ├── __init__.py
│   │   ├── main.py              # Basic API
│   │   └── enhanced_main.py     # Enhanced API with auth
│   ├── automation/              # Automation components
│   │   ├── __init__.py
│   │   ├── automation_manager.py
│   │   ├── file_watcher.py
│   │   ├── web_downloader.py
│   │   ├── processing_manager.py
│   │   ├── cache_manager.py
│   │   └── models.py
│   ├── converter/               # Data conversion logic
│   │   ├── __init__.py
│   │   ├── football_converter.py
│   │   ├── team_normalizer.py
│   │   ├── market_processor.py
│   │   └── advanced_reporter.py
│   ├── database/                # Database layer
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── connection.py
│   │   └── repositories.py
│   └── ui/                      # User interfaces
│       ├── streamlit_app.py
│       └── react-dashboard/
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── performance/             # Performance tests
│   └── fixtures/                # Test data
├── config/                      # Configuration files
├── docs/                        # Documentation
├── alembic/                     # Database migrations
└── docker/                      # Docker configurations
```

### Import Structure

```python
# Standard library imports
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any

# Third-party imports
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine
import redis

# Local imports
from src.automation.automation_manager import AutomationManager
from src.converter.football_converter import FootballConverter
from src.database.models import Game, Job
```

## Core Components

### AutomationManager

The central coordinator for all automation processes.

```python
from src.automation.automation_manager import AutomationManager
from src.automation.config import AutomationConfig

class AutomationManager:
    """Central coordinator for automation processes."""
    
    def __init__(self, config: AutomationConfig):
        self.config = config
        self.web_downloader = None
        self.file_watcher = None
        self.processing_manager = None
        self._running = False
    
    async def start(self) -> None:
        """Start all automation components."""
        await self._initialize_components()
        await self._start_components()
        self._running = True
    
    async def stop(self) -> None:
        """Stop all automation components gracefully."""
        await self._stop_components()
        self._running = False
    
    def get_status(self) -> AutomationStatus:
        """Get current automation status."""
        return AutomationStatus(
            is_running=self._running,
            components_status=self._get_components_status(),
            system_health=self._get_system_health()
        )
```

### ProcessingManager

Manages job queue and processing coordination.

```python
from src.automation.processing_manager import ProcessingManager
from src.automation.models import Job, JobPriority

class ProcessingManager:
    """Manages processing job queue and coordination."""
    
    def __init__(self, config: ProcessingConfig):
        self.config = config
        self.job_queue = asyncio.PriorityQueue()
        self.active_jobs: Dict[str, Job] = {}
        self.workers: List[asyncio.Task] = []
    
    async def queue_file(self, file_path: str, priority: JobPriority = JobPriority.NORMAL) -> str:
        """Queue a file for processing."""
        job = Job(
            id=str(uuid.uuid4()),
            file_path=file_path,
            priority=priority,
            status=JobStatus.QUEUED,
            created_at=datetime.utcnow()
        )
        
        await self.job_queue.put((priority.value, job))
        return job.id
    
    async def get_job_status(self, job_id: str) -> Optional[Job]:
        """Get status of a specific job."""
        return self.active_jobs.get(job_id)
```

### FootballConverter

Enhanced converter with optimization features.

```python
from src.converter.football_converter import FootballConverter
from src.converter.optimized_converter import OptimizedConverter

class OptimizedConverter(FootballConverter):
    """Performance-optimized version of FootballConverter."""
    
    def __init__(self, config: OptimizationConfig):
        super().__init__()
        self.config = config
        self.cache_manager = None
        self.performance_metrics = PerformanceMetrics()
    
    async def convert_football_async(self, json_file_path: str) -> ProcessingResult:
        """Async version of football conversion with optimizations."""
        start_time = time.time()
        
        try:
            # Use streaming for large files
            if self._is_large_file(json_file_path):
                result = await self._stream_process_file(json_file_path)
            else:
                result = await self._standard_process_file(json_file_path)
            
            processing_time = time.time() - start_time
            self.performance_metrics.record_processing_time(processing_time)
            
            return result
            
        except Exception as e:
            self.performance_metrics.record_error()
            raise ProcessingError(f"Conversion failed: {str(e)}")
```

## Extending the System

### Adding New Data Sources

#### 1. Create a New Downloader

```python
from src.automation.web_downloader import BaseDownloader

class CustomDataDownloader(BaseDownloader):
    """Custom downloader for specific data source."""
    
    def __init__(self, config: CustomDownloaderConfig):
        super().__init__(config)
        self.api_key = config.api_key
        self.base_url = config.base_url
    
    async def check_for_new_files(self) -> List[FileInfo]:
        """Check for new files from custom API."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/files", headers=headers) as response:
                data = await response.json()
                return [FileInfo.from_dict(item) for item in data["files"]]
    
    async def download_file(self, file_info: FileInfo) -> DownloadResult:
        """Download file from custom API."""
        # Implementation specific to your data source
        pass
```

#### 2. Register the New Downloader

```python
# In src/automation/automation_manager.py
from src.automation.custom_downloader import CustomDataDownloader

class AutomationManager:
    def _initialize_downloaders(self):
        """Initialize all configured downloaders."""
        downloaders = []
        
        # Standard web downloader
        if self.config.web_downloader.enabled:
            downloaders.append(WebDownloader(self.config.web_downloader))
        
        # Custom downloader
        if self.config.custom_downloader.enabled:
            downloaders.append(CustomDataDownloader(self.config.custom_downloader))
        
        return downloaders
```

### Adding New Processing Stages

#### 1. Create a Processing Stage

```python
from src.converter.base_processor import BaseProcessor

class CustomDataProcessor(BaseProcessor):
    """Custom processor for specific data format."""
    
    def __init__(self, config: CustomProcessorConfig):
        super().__init__(config)
        self.custom_patterns = config.patterns
    
    async def process(self, data: Dict[str, Any]) -> ProcessingResult:
        """Process custom data format."""
        processed_games = []
        
        for item in data.get("items", []):
            if self._matches_pattern(item):
                game = self._extract_game_data(item)
                processed_games.append(game)
        
        return ProcessingResult(
            games=processed_games,
            metadata=self._create_metadata(data)
        )
    
    def _matches_pattern(self, item: Dict) -> bool:
        """Check if item matches processing patterns."""
        for pattern in self.custom_patterns:
            if re.match(pattern, item.get("description", "")):
                return True
        return False
```

#### 2. Integrate into Processing Pipeline

```python
# In src/automation/processing_manager.py
from src.converter.custom_processor import CustomDataProcessor

class ProcessingManager:
    def _create_processing_pipeline(self) -> List[BaseProcessor]:
        """Create the processing pipeline."""
        pipeline = []
        
        # Standard processors
        pipeline.append(PDFParser(self.config.pdf_parser))
        pipeline.append(FootballExtractor(self.config.extractor))
        pipeline.append(TeamNormalizer(self.config.normalizer))
        
        # Custom processor
        if self.config.custom_processor.enabled:
            pipeline.append(CustomDataProcessor(self.config.custom_processor))
        
        pipeline.append(ReportGenerator(self.config.reporter))
        
        return pipeline
```

### Adding New API Endpoints

#### 1. Create Endpoint Handler

```python
# In src/api/custom_endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from src.api.auth import get_current_user
from src.automation.custom_service import CustomService

router = APIRouter(prefix="/api/v1/custom", tags=["custom"])

@router.get("/data")
async def get_custom_data(
    filter_param: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get custom data with optional filtering."""
    try:
        service = CustomService()
        data = await service.get_data(filter_param)
        return {"data": data, "total": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process")
async def trigger_custom_processing(
    request: CustomProcessingRequest,
    current_user: User = Depends(get_current_user)
):
    """Trigger custom processing job."""
    if not current_user.has_permission("process"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        service = CustomService()
        job_id = await service.start_processing(request)
        return {"job_id": job_id, "message": "Processing started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### 2. Register Endpoints

```python
# In src/api/enhanced_main.py
from src.api.custom_endpoints import router as custom_router

app = FastAPI(title="Football Automation System")

# Include custom endpoints
app.include_router(custom_router)
```

### Adding New Database Models

#### 1. Create Model

```python
# In src/database/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from src.database.base import Base

class CustomDataModel(Base):
    """Model for custom data storage."""
    
    __tablename__ = "custom_data"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    data_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    processing_jobs = relationship("Job", back_populates="custom_data")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "data_type": self.data_type,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
```

#### 2. Create Migration

```bash
# Generate migration
alembic revision --autogenerate -m "Add custom data model"

# Review and edit the generated migration file
# alembic/versions/xxx_add_custom_data_model.py

# Apply migration
alembic upgrade head
```

#### 3. Create Repository

```python
# In src/database/repositories.py
from src.database.models import CustomDataModel

class CustomDataRepository:
    """Repository for custom data operations."""
    
    def __init__(self, db_session):
        self.db = db_session
    
    async def create(self, data: Dict[str, Any]) -> CustomDataModel:
        """Create new custom data record."""
        model = CustomDataModel(**data)
        self.db.add(model)
        await self.db.commit()
        await self.db.refresh(model)
        return model
    
    async def get_by_id(self, id: int) -> Optional[CustomDataModel]:
        """Get custom data by ID."""
        return await self.db.get(CustomDataModel, id)
    
    async def get_by_type(self, data_type: str) -> List[CustomDataModel]:
        """Get custom data by type."""
        result = await self.db.execute(
            select(CustomDataModel).where(CustomDataModel.data_type == data_type)
        )
        return result.scalars().all()
```

## API Development

### Authentication and Authorization

#### Custom Authentication Provider

```python
# In src/api/auth_providers.py
from src.api.auth import BaseAuthProvider

class CustomAuthProvider(BaseAuthProvider):
    """Custom authentication provider."""
    
    def __init__(self, config: CustomAuthConfig):
        self.config = config
        self.external_api = ExternalAuthAPI(config.api_url, config.api_key)
    
    async def authenticate(self, credentials: Dict[str, str]) -> Optional[User]:
        """Authenticate user against external system."""
        try:
            user_data = await self.external_api.verify_credentials(
                credentials["username"],
                credentials["password"]
            )
            
            if user_data:
                return User(
                    username=user_data["username"],
                    email=user_data["email"],
                    roles=user_data["roles"],
                    is_active=user_data["active"]
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return None
    
    async def get_user_permissions(self, user: User) -> List[str]:
        """Get user permissions from external system."""
        try:
            permissions = await self.external_api.get_permissions(user.username)
            return permissions
        except Exception as e:
            logger.error(f"Failed to get permissions: {e}")
            return []
```

#### Custom Middleware

```python
# In src/api/middleware.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class CustomLoggingMiddleware(BaseHTTPMiddleware):
    """Custom logging middleware."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url}")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} ({process_time:.3f}s)")
        
        # Add custom headers
        response.headers["X-Process-Time"] = str(process_time)
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware."""
    
    def __init__(self, app, calls_per_minute: int = 60):
        super().__init__(app)
        self.calls_per_minute = calls_per_minute
        self.client_calls = {}
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean old entries
        self._cleanup_old_entries(current_time)
        
        # Check rate limit
        if self._is_rate_limited(client_ip, current_time):
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": "60"}
            )
        
        # Record call
        self._record_call(client_ip, current_time)
        
        return await call_next(request)
```

### WebSocket Extensions

#### Custom WebSocket Handler

```python
# In src/api/websocket_handlers.py
from fastapi import WebSocket
from src.api.websocket_manager import WebSocketManager

class CustomWebSocketHandler:
    """Custom WebSocket handler for specific events."""
    
    def __init__(self, websocket_manager: WebSocketManager):
        self.manager = websocket_manager
        self.custom_subscribers = set()
    
    async def handle_connection(self, websocket: WebSocket):
        """Handle new WebSocket connection."""
        await self.manager.connect(websocket)
        self.custom_subscribers.add(websocket)
        
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message["type"] == "subscribe_custom":
                    await self._handle_custom_subscription(websocket, message)
                elif message["type"] == "custom_command":
                    await self._handle_custom_command(websocket, message)
                
        except WebSocketDisconnect:
            self.custom_subscribers.discard(websocket)
            self.manager.disconnect(websocket)
    
    async def broadcast_custom_event(self, event_data: Dict[str, Any]):
        """Broadcast custom event to subscribers."""
        message = {
            "type": "custom_event",
            "data": event_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for websocket in self.custom_subscribers.copy():
            try:
                await websocket.send_text(json.dumps(message))
            except:
                self.custom_subscribers.discard(websocket)
```

## Database Schema

### Schema Design Principles

1. **Normalization**: Avoid data duplication
2. **Indexing**: Index frequently queried columns
3. **Constraints**: Use foreign keys and check constraints
4. **Audit Trail**: Track creation and modification times
5. **Soft Deletes**: Use flags instead of hard deletes

### Core Tables

```sql
-- Jobs table for processing queue
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path VARCHAR(500) NOT NULL,
    job_type VARCHAR(50) NOT NULL DEFAULT 'pdf_processing',
    priority INTEGER NOT NULL DEFAULT 2,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    progress_percent DECIMAL(5,2) DEFAULT 0.0,
    current_stage VARCHAR(100),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time DECIMAL(10,3)
);

-- Games table for processed football data
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    league VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    iso_date DATE NOT NULL,
    time TIME,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    original_home_team VARCHAR(100),
    original_away_team VARCHAR(100),
    main_market JSONB,
    additional_markets JSONB DEFAULT '[]',
    processing_metadata JSONB,
    quality_score DECIMAL(3,2),
    confidence_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- System configuration table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_priority_status ON jobs(priority, status);

CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_league ON games(league);
CREATE INDEX idx_games_teams ON games(home_team, away_team);
CREATE INDEX idx_games_job_id ON games(job_id);

-- Full-text search indexes
CREATE INDEX idx_games_teams_fts ON games USING gin(
    to_tsvector('english', home_team || ' ' || away_team)
);
```

### Database Migrations

#### Creating Migrations

```python
# In alembic/versions/xxx_add_custom_feature.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    """Add custom feature tables."""
    # Create new table
    op.create_table(
        'custom_feature',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('config', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add index
    op.create_index('idx_custom_feature_name', 'custom_feature', ['name'])
    
    # Add column to existing table
    op.add_column('jobs', sa.Column('custom_data', postgresql.JSONB(), nullable=True))

def downgrade():
    """Remove custom feature tables."""
    op.drop_column('jobs', 'custom_data')
    op.drop_index('idx_custom_feature_name')
    op.drop_table('custom_feature')
```

## Testing Framework

### Unit Testing

#### Test Structure

```python
# In tests/unit/test_automation_manager.py
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.automation.automation_manager import AutomationManager
from src.automation.config import AutomationConfig

class TestAutomationManager:
    """Test suite for AutomationManager."""
    
    @pytest.fixture
    def mock_config(self):
        """Mock configuration for testing."""
        config = Mock(spec=AutomationConfig)
        config.web_downloader.enabled = True
        config.file_watcher.enabled = True
        config.processing.max_concurrent = 2
        return config
    
    @pytest.fixture
    def automation_manager(self, mock_config):
        """Create AutomationManager instance for testing."""
        return AutomationManager(mock_config)
    
    @pytest.mark.asyncio
    async def test_start_automation(self, automation_manager):
        """Test starting automation components."""
        with patch.object(automation_manager, '_initialize_components') as mock_init, \
             patch.object(automation_manager, '_start_components') as mock_start:
            
            await automation_manager.start()
            
            mock_init.assert_called_once()
            mock_start.assert_called_once()
            assert automation_manager._running is True
    
    @pytest.mark.asyncio
    async def test_stop_automation(self, automation_manager):
        """Test stopping automation components."""
        automation_manager._running = True
        
        with patch.object(automation_manager, '_stop_components') as mock_stop:
            await automation_manager.stop()
            
            mock_stop.assert_called_once()
            assert automation_manager._running is False
    
    def test_get_status(self, automation_manager):
        """Test getting automation status."""
        automation_manager._running = True
        
        with patch.object(automation_manager, '_get_components_status') as mock_components, \
             patch.object(automation_manager, '_get_system_health') as mock_health:
            
            mock_components.return_value = {"web_downloader": True}
            mock_health.return_value = {"cpu_usage": 25.0}
            
            status = automation_manager.get_status()
            
            assert status.is_running is True
            assert status.components_status == {"web_downloader": True}
            assert status.system_health == {"cpu_usage": 25.0}
```

#### Mocking External Dependencies

```python
# In tests/conftest.py
import pytest
from unittest.mock import Mock, AsyncMock
import redis
import psycopg2

@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock_client = Mock(spec=redis.Redis)
    mock_client.ping.return_value = True
    mock_client.get.return_value = None
    mock_client.set.return_value = True
    mock_client.delete.return_value = 1
    return mock_client

@pytest.fixture
def mock_database():
    """Mock database connection."""
    mock_conn = Mock(spec=psycopg2.connection)
    mock_cursor = Mock()
    mock_conn.cursor.return_value = mock_cursor
    mock_cursor.fetchone.return_value = None
    mock_cursor.fetchall.return_value = []
    return mock_conn

@pytest.fixture
def mock_file_system(tmp_path):
    """Mock file system using temporary directory."""
    source_dir = tmp_path / "source"
    output_dir = tmp_path / "jsons"
    source_dir.mkdir()
    output_dir.mkdir()
    
    return {
        "source_path": str(source_dir),
        "output_path": str(output_dir),
        "tmp_path": tmp_path
    }
```

### Integration Testing

#### API Integration Tests

```python
# In tests/integration/test_api_integration.py
import pytest
from fastapi.testclient import TestClient
from src.api.enhanced_main import app
from src.database.connection import get_database_connection

class TestAPIIntegration:
    """Integration tests for API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        return TestClient(app)
    
    @pytest.fixture
    def auth_headers(self, client):
        """Get authentication headers."""
        response = client.post("/auth/login", json={
            "username": "test_user",
            "password": "test_password"
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_upload_and_process_file(self, client, auth_headers, tmp_path):
        """Test complete file upload and processing workflow."""
        # Create test PDF file
        test_file = tmp_path / "test.pdf"
        test_file.write_bytes(b"PDF content")
        
        # Upload file
        with open(test_file, "rb") as f:
            response = client.post(
                "/api/v1/upload",
                files={"file": ("test.pdf", f, "application/pdf")},
                data={"priority": "3", "auto_process": "true"},
                headers=auth_headers
            )
        
        assert response.status_code == 200
        job_id = response.json()["job_id"]
        
        # Check job status
        status_response = client.get(
            f"/api/v1/process/status/{job_id}",
            headers=auth_headers
        )
        
        assert status_response.status_code == 200
        assert status_response.json()["job_id"] == job_id
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection and messaging."""
        with client.websocket_connect("/ws") as websocket:
            # Send test message
            websocket.send_text("Hello Server!")
            
            # Receive echo response
            data = websocket.receive_text()
            message = json.loads(data)
            
            assert message["type"] == "echo"
            assert "Hello Server!" in message["data"]
```

### Performance Testing

#### Load Testing

```python
# In tests/performance/test_load.py
import pytest
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

class TestLoadPerformance:
    """Load testing for API endpoints."""
    
    @pytest.mark.asyncio
    async def test_concurrent_uploads(self):
        """Test concurrent file uploads."""
        async def upload_file(session, file_data):
            async with session.post(
                "http://localhost:8000/api/v1/upload",
                data={"file": file_data},
                headers={"Authorization": "Bearer test_token"}
            ) as response:
                return await response.json()
        
        # Create test data
        file_data = b"PDF content" * 1000  # 1KB file
        
        # Perform concurrent uploads
        async with aiohttp.ClientSession() as session:
            tasks = [upload_file(session, file_data) for _ in range(50)]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Analyze results
        successful_uploads = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_uploads) >= 45  # Allow for some failures
    
    @pytest.mark.benchmark
    def test_processing_performance(self, benchmark):
        """Benchmark processing performance."""
        from src.converter.football_converter import FootballConverter
        
        converter = FootballConverter()
        test_data = self._create_test_data()
        
        # Benchmark the processing
        result = benchmark(converter.convert_football, test_data)
        
        assert result is not None
        assert len(result.games) > 0
```

## Contributing Guidelines

### Code Style

#### Python Style Guide

```python
# Follow PEP 8 with these specific guidelines:

# 1. Line length: 88 characters (Black formatter default)
# 2. Use type hints for all function parameters and return values
def process_data(input_data: Dict[str, Any]) -> ProcessingResult:
    """Process input data and return result."""
    pass

# 3. Use dataclasses for data structures
from dataclasses import dataclass
from typing import Optional

@dataclass
class GameData:
    """Represents a football game."""
    home_team: str
    away_team: str
    date: str
    odds: Optional[Dict[str, float]] = None

# 4. Use async/await for I/O operations
async def fetch_data(url: str) -> Dict[str, Any]:
    """Fetch data from URL asynchronously."""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# 5. Use context managers for resource management
async def process_file(file_path: str) -> None:
    """Process file with proper resource management."""
    async with aiofiles.open(file_path, 'r') as f:
        content = await f.read()
        # Process content
```

#### Documentation Standards

```python
def complex_function(
    param1: str,
    param2: Optional[int] = None,
    param3: Dict[str, Any] = None
) -> Tuple[bool, str]:
    """
    Brief description of what the function does.
    
    Longer description if needed, explaining the purpose,
    algorithm, or important implementation details.
    
    Args:
        param1: Description of first parameter
        param2: Description of second parameter (optional)
        param3: Description of third parameter with default
    
    Returns:
        Tuple containing:
            - bool: Success status
            - str: Result message or error description
    
    Raises:
        ValueError: When param1 is empty
        ProcessingError: When processing fails
    
    Example:
        >>> success, message = complex_function("test", 42)
        >>> print(f"Success: {success}, Message: {message}")
        Success: True, Message: Processing completed
    """
    if not param1:
        raise ValueError("param1 cannot be empty")
    
    try:
        # Implementation here
        return True, "Processing completed"
    except Exception as e:
        raise ProcessingError(f"Processing failed: {e}")
```

### Git Workflow

#### Branch Naming

```bash
# Feature branches
feature/add-custom-processor
feature/improve-performance
feature/websocket-authentication

# Bug fix branches
bugfix/fix-memory-leak
bugfix/correct-team-normalization
bugfix/handle-empty-files

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-crash-fix

# Release branches
release/v2.1.0
release/v2.2.0-beta
```

#### Commit Messages

```bash
# Format: <type>(<scope>): <description>
# 
# <body>
# 
# <footer>

# Examples:
feat(api): add custom data endpoint

Add new endpoint for retrieving custom data with filtering
and pagination support.

Closes #123

fix(converter): handle empty PDF files gracefully

Previously, empty PDF files would cause the converter to crash.
Now they are handled gracefully with appropriate error messages.

Fixes #456

docs(readme): update installation instructions

Add Docker installation steps and troubleshooting section.

refactor(database): optimize query performance

Restructure database queries to use indexes more effectively,
reducing average query time by 40%.

Performance improvement for issue #789
```

### Pull Request Process

#### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Performance testing completed (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.
```

## Advanced Topics

### Performance Optimization

#### Profiling and Monitoring

```python
# In src/monitoring/profiler.py
import cProfile
import pstats
import io
from functools import wraps

def profile_function(func):
    """Decorator to profile function performance."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        pr = cProfile.Profile()
        pr.enable()
        
        result = func(*args, **kwargs)
        
        pr.disable()
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
        ps.print_stats()
        
        # Log or store profiling results
        logger.debug(f"Profile for {func.__name__}:\n{s.getvalue()}")
        
        return result
    return wrapper

# Usage
@profile_function
def expensive_operation(data):
    """Expensive operation that needs profiling."""
    # Implementation here
    pass
```

#### Memory Optimization

```python
# In src/optimization/memory.py
import gc
import psutil
from typing import Generator

class MemoryOptimizer:
    """Utilities for memory optimization."""
    
    @staticmethod
    def get_memory_usage() -> float:
        """Get current memory usage in MB."""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    @staticmethod
    def force_garbage_collection():
        """Force garbage collection."""
        gc.collect()
    
    @staticmethod
    def stream_large_file(file_path: str, chunk_size: int = 1024) -> Generator[str, None, None]:
        """Stream large file in chunks to avoid memory issues."""
        with open(file_path, 'r') as f:
            while True:
                chunk = f.read(chunk_size)
                if not chunk:
                    break
                yield chunk
```

### Security Considerations

#### Input Validation

```python
# In src/security/validation.py
import re
from pathlib import Path
from typing import Any, Dict, List

class InputValidator:
    """Comprehensive input validation."""
    
    @staticmethod
    def validate_file_path(file_path: str) -> bool:
        """Validate file path for security."""
        path = Path(file_path)
        
        # Check for path traversal
        if '..' in path.parts:
            return False
        
        # Check for absolute paths
        if path.is_absolute():
            return False
        
        # Check file extension
        allowed_extensions = {'.pdf', '.json', '.csv'}
        if path.suffix.lower() not in allowed_extensions:
            return False
        
        return True
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename for safe storage."""
        # Remove dangerous characters
        sanitized = re.sub(r'[^\w\-_\.]', '_', filename)
        
        # Limit length
        if len(sanitized) > 255:
            name, ext = sanitized.rsplit('.', 1)
            sanitized = name[:250] + '.' + ext
        
        return sanitized
    
    @staticmethod
    def validate_json_data(data: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
        """Validate JSON data against schema."""
        errors = []
        
        for key, expected_type in schema.items():
            if key not in data:
                errors.append(f"Missing required field: {key}")
                continue
            
            if not isinstance(data[key], expected_type):
                errors.append(f"Invalid type for {key}: expected {expected_type.__name__}")
        
        return errors
```

#### Rate Limiting

```python
# In src/security/rate_limiting.py
import time
from collections import defaultdict
from typing import Dict, Tuple

class RateLimiter:
    """Token bucket rate limiter."""
    
    def __init__(self, max_tokens: int, refill_rate: float):
        self.max_tokens = max_tokens
        self.refill_rate = refill_rate
        self.buckets: Dict[str, Tuple[float, float]] = defaultdict(
            lambda: (max_tokens, time.time())
        )
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for identifier."""
        current_time = time.time()
        tokens, last_refill = self.buckets[identifier]
        
        # Refill tokens
        time_passed = current_time - last_refill
        tokens = min(self.max_tokens, tokens + time_passed * self.refill_rate)
        
        if tokens >= 1:
            tokens -= 1
            self.buckets[identifier] = (tokens, current_time)
            return True
        else:
            self.buckets[identifier] = (tokens, current_time)
            return False
    
    def get_wait_time(self, identifier: str) -> float:
        """Get wait time until next request is allowed."""
        tokens, _ = self.buckets[identifier]
        if tokens >= 1:
            return 0.0
        return (1 - tokens) / self.refill_rate
```

This developer guide provides comprehensive information for extending and maintaining the Football Automation System. For additional support, refer to the [API Reference](API_REFERENCE.md), [User Manual](USER_MANUAL.md), and [Deployment Guide](DEPLOYMENT_GUIDE.md).