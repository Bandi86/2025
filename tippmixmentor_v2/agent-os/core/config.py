from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Agent OS - TippMixMentor"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_HOSTS: List[str] = ["*"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@postgres:5432/tippmixmentor"
    REDIS_URL: str = "redis://redis:6379"
    
    # External Services
    BACKEND_URL: str = "http://backend:3001"
    ML_SERVICE_URL: str = "http://ml-service:8000"
    FRONTEND_URL: str = "http://frontend:3000"
    
    # AI Providers
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    OLLAMA_URL: str = "http://172.17.0.1:11434"
    
    # Agent Configuration
    MAX_CONCURRENT_AGENTS: int = 10
    AGENT_TIMEOUT: int = 300  # seconds
    AGENT_MEMORY_SIZE: int = 1000
    
    # Task Queue
    TASK_QUEUE_NAME: str = "agent_tasks"
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 60  # seconds
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9091
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Vector Database
    VECTOR_DB_PATH: str = "/app/data/vector_db"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    
    # File Storage
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Prediction Settings
    PREDICTION_CONFIDENCE_THRESHOLD: float = 0.7
    MAX_PREDICTIONS_PER_REQUEST: int = 50
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Validate required settings
def validate_settings():
    """Validate critical settings"""
    if not settings.DATABASE_URL:
        raise ValueError("DATABASE_URL is required")
    
    if not settings.REDIS_URL:
        raise ValueError("REDIS_URL is required")
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)

# Validate on import
validate_settings() 