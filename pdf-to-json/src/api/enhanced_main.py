"""
Enhanced FastAPI Web API for Football Automation System

Provides comprehensive REST API endpoints for:
- Processing management and job control
- Data access and retrieval
- Authentication and authorization
- Real-time updates via WebSocket
- System monitoring and health checks
- Webhook notifications
"""

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import uuid
import jwt
from passlib.context import CryptContext

from fastapi import (
    FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks,
    status, Request, WebSocket, WebSocketDisconnect
)
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import uvicorn

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from automation.automation_manager import AutomationManager, AutomationStatus
from automation.processing_manager import ProcessingManager, ProcessingResult, QueueStatus
from automation.config import AutomationConfig, load_config
from automation.models import Job, JobStatus, JobPriority
from automation.exceptions import AutomationManagerError, ProcessingManagerError

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI app
app = FastAPI(
    title="Football Automation API",
    description="Comprehensive API for football data processing automation",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for components
automation_manager: Optional[AutomationManager] = None
config: Optional[AutomationConfig] = None
websocket_connections: List[WebSocket] = []
webhook_urls: List[str] = []

# Pydantic models for request/response

class UserCredentials(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class User(BaseModel):
    username: str
    email: Optional[str] = None
    roles: List[str] = Field(default_factory=list)
    is_active: bool = True

class ProcessingRequest(BaseModel):
    file_path: str
    priority: int = Field(default=2, ge=0, le=4)
    job_type: str = "pdf_processing"
    parameters: Optional[Dict[str, Any]] = None

class JobResponse(BaseModel):
    job_id: str
    status: str
    created_at: str
    progress_percent: float
    current_stage: Optional[str]
    result: Optional[Dict[str, Any]]
    error: Optional[str]

class QueueStatusResponse(BaseModel):
    total_jobs: int
    pending_jobs: int
    running_jobs: int
    completed_jobs: int
    failed_jobs: int
    queue_length: int
    active_workers: int

class SystemStatusResponse(BaseModel):
    is_running: bool
    start_time: Optional[str]
    uptime_seconds: Optional[float]
    components_status: Dict[str, Any]
    system_health: Dict[str, Any]
    active_jobs: int
    total_jobs_processed: int

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    components: Dict[str, bool]
    system_metrics: Dict[str, float]

class WebhookRegistration(BaseModel):
    url: str
    events: List[str] = Field(default_factory=lambda: ["all"])
    secret: Optional[str] = None

class ConfigUpdateRequest(BaseModel):
    config_section: str
    config_data: Dict[str, Any]

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None
    job_id: Optional[str] = None

# Authentication and Authorization

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Verify JWT token and return user."""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # In a real implementation, you would fetch user from database
        user = User(
            username=username,
            roles=payload.get("roles", ["user"]),
            is_active=payload.get("active", True)
        )
        return user
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def require_role(required_role: str):
    """Dependency to require specific role."""
    def role_checker(user: User = Depends(verify_token)) -> User:
        if required_role not in user.roles and "admin" not in user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        return user
    return role_checker

# Import WebSocket manager
from automation.websocket_manager import WebSocketManager, WebSocketEventType
import json

# WebSocket manager instance
websocket_manager: Optional[WebSocketManager] = None

# Webhook notification system

async def send_webhook_notification(event_type: str, data: Dict[str, Any]):
    """Send webhook notifications to registered URLs."""
    import aiohttp
    
    if not webhook_urls:
        return
    
    payload = {
        "event": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data
    }
    
    async with aiohttp.ClientSession() as session:
        for url in webhook_urls:
            try:
                async with session.post(url, json=payload, timeout=10) as response:
                    if response.status == 200:
                        logger.debug(f"Webhook sent successfully to {url}")
                    else:
                        logger.warning(f"Webhook failed to {url}: {response.status}")
            except Exception as e:
                logger.error(f"Webhook error to {url}: {e}")

# Event handlers for automation manager

async def handle_processing_progress(job_id: str, progress: float, stage: str):
    """Handle processing progress updates."""
    data = {
        "job_id": job_id,
        "progress": progress,
        "stage": stage,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Broadcast to WebSocket connections
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.PROCESSING_PROGRESS.value,
            data
        )
    
    # Send webhook notification
    await send_webhook_notification("processing_progress", data)

async def handle_processing_completed(data: Dict[str, Any]):
    """Handle processing completion events."""
    # Broadcast to WebSocket connections
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.PROCESSING_COMPLETED.value,
            data
        )
    
    # Send webhook notification
    await send_webhook_notification("processing_completed", data)

async def handle_system_error(data: Dict[str, Any]):
    """Handle system error events."""
    # Broadcast to WebSocket connections
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.SYSTEM_ERROR.value,
            data
        )
    
    # Send webhook notification
    await send_webhook_notification("system_error", data)

async def handle_file_detected(data: Dict[str, Any]):
    """Handle file detection events."""
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.FILE_DETECTED.value,
            data
        )

async def handle_download_completed(data: Dict[str, Any]):
    """Handle download completion events."""
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.DOWNLOAD_COMPLETED.value,
            data
        )

async def handle_job_queued(data: Dict[str, Any]):
    """Handle job queued events."""
    if websocket_manager:
        await websocket_manager.broadcast(
            WebSocketEventType.JOB_QUEUED.value,
            data
        )

# API Endpoints

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Football Automation API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "/api/v1/status"
    }

# Authentication endpoints

@app.post("/auth/login", response_model=Token)
async def login(credentials: UserCredentials):
    """Authenticate user and return JWT token."""
    # In a real implementation, verify credentials against database
    # For demo purposes, accept any username/password
    if not credentials.username or not credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": credentials.username,
            "roles": ["user", "admin"],  # In real app, get from database
            "active": True
        },
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@app.get("/auth/me", response_model=User)
async def get_current_user(user: User = Depends(verify_token)):
    """Get current authenticated user information."""
    return user

# Processing endpoints

@app.post("/api/v1/process/file", response_model=Dict[str, str])
async def process_file(
    request: ProcessingRequest,
    user: User = Depends(verify_token)
):
    """Queue a file for processing."""
    if not automation_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Automation manager not initialized"
        )
    
    try:
        job_id = await automation_manager.process_file(
            request.file_path,
            request.priority
        )
        
        return {
            "job_id": job_id,
            "message": "File queued for processing",
            "status": "queued"
        }
        
    except Exception as e:
        logger.error(f"Failed to process file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue file for processing: {str(e)}"
        )

@app.get("/api/v1/process/status/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: str,
    user: User = Depends(verify_token)
):
    """Get status of a specific job."""
    if not automation_manager or not automation_manager.processing_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Processing manager not available"
        )
    
    try:
        job_data = await automation_manager.processing_manager.get_job_status(job_id)
        if not job_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )
        
        return JobResponse(
            job_id=job_data["id"],
            status=job_data["status"],
            created_at=job_data["created_at"],
            progress_percent=job_data["progress_percent"],
            current_stage=job_data["current_stage"],
            result=job_data["result"],
            error=job_data["last_error"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job status: {str(e)}"
        )

@app.get("/api/v1/process/queue", response_model=QueueStatusResponse)
async def get_queue_status(user: User = Depends(verify_token)):
    """Get current processing queue status."""
    if not automation_manager or not automation_manager.processing_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Processing manager not available"
        )
    
    try:
        queue_status = await automation_manager.processing_manager.get_queue_status()
        return QueueStatusResponse(**queue_status.to_dict())
        
    except Exception as e:
        logger.error(f"Failed to get queue status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get queue status: {str(e)}"
        )

@app.delete("/api/v1/process/job/{job_id}")
async def cancel_job(
    job_id: str,
    user: User = Depends(require_role("admin"))
):
    """Cancel a job."""
    if not automation_manager or not automation_manager.processing_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Processing manager not available"
        )
    
    try:
        success = await automation_manager.processing_manager.cancel_job(job_id)
        if success:
            return {"message": f"Job {job_id} cancelled successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found or cannot be cancelled"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel job: {str(e)}"
        )

@app.post("/api/v1/process/job/{job_id}/retry")
async def retry_job(
    job_id: str,
    user: User = Depends(require_role("admin"))
):
    """Retry a failed job."""
    if not automation_manager or not automation_manager.processing_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Processing manager not available"
        )
    
    try:
        success = await automation_manager.processing_manager.retry_failed_job(job_id)
        if success:
            return {"message": f"Job {job_id} queued for retry"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Job {job_id} cannot be retried"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retry job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry job: {str(e)}"
        )

# File upload endpoint

@app.post("/api/v1/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    priority: int = 2,
    auto_process: bool = True,
    user: User = Depends(verify_token)
):
    """Upload a file and optionally queue it for processing."""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    try:
        # Save uploaded file
        upload_dir = Path("source")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        job_id = None
        if auto_process and automation_manager:
            # Queue for processing
            job_id = await automation_manager.process_file(str(file_path), priority)
        
        return FileUploadResponse(
            success=True,
            message="File uploaded successfully",
            file_path=str(file_path),
            job_id=job_id
        )
        
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

# Data access endpoints

@app.get("/api/v1/games")
async def get_games(
    date: Optional[str] = None,
    league: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    user: User = Depends(verify_token)
):
    """Get processed game data."""
    # In a real implementation, this would query the database
    # For now, return mock data
    return {
        "games": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
        "filters": {
            "date": date,
            "league": league
        }
    }

@app.get("/api/v1/reports/latest")
async def get_latest_report(user: User = Depends(verify_token)):
    """Get the latest processing report."""
    # In a real implementation, this would fetch from database
    return {
        "report_id": str(uuid.uuid4()),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_games": 0,
            "leagues_processed": 0,
            "anomalies_detected": 0
        },
        "data": {}
    }

@app.get("/api/v1/reports/trends")
async def get_trend_report(
    days: int = 30,
    user: User = Depends(verify_token)
):
    """Get trend analysis report."""
    return {
        "period_days": days,
        "trends": [],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# System monitoring endpoints

@app.get("/api/v1/status", response_model=SystemStatusResponse)
async def get_system_status(user: User = Depends(verify_token)):
    """Get comprehensive system status."""
    if not automation_manager:
        return SystemStatusResponse(
            is_running=False,
            start_time=None,
            uptime_seconds=None,
            components_status={},
            system_health={},
            active_jobs=0,
            total_jobs_processed=0
        )
    
    try:
        status = automation_manager.get_status()
        return SystemStatusResponse(
            is_running=status.is_running,
            start_time=status.start_time.isoformat() if status.start_time else None,
            uptime_seconds=(datetime.now(timezone.utc) - status.start_time).total_seconds() if status.start_time else None,
            components_status=status.components_status,
            system_health=status.system_health,
            active_jobs=status.active_jobs,
            total_jobs_processed=status.total_jobs_processed
        )
        
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system status: {str(e)}"
        )

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    import psutil
    
    components = {
        "automation_manager": automation_manager is not None and automation_manager.is_running,
        "database": True,  # Would check database connection in real implementation
        "cache": True,     # Would check cache connection in real implementation
    }
    
    system_metrics = {
        "memory_usage_percent": psutil.virtual_memory().percent,
        "cpu_usage_percent": psutil.cpu_percent(),
        "disk_usage_percent": psutil.disk_usage('/').percent,
    }
    
    # Determine overall health
    all_healthy = all(components.values())
    health_status = "healthy" if all_healthy else "unhealthy"
    
    return HealthCheckResponse(
        status=health_status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="2.0.0",
        components=components,
        system_metrics=system_metrics
    )

@app.get("/api/v1/metrics")
async def get_metrics(user: User = Depends(require_role("admin"))):
    """Get detailed system metrics."""
    import psutil
    
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "system": {
            "memory": dict(psutil.virtual_memory()._asdict()),
            "cpu": {
                "percent": psutil.cpu_percent(),
                "count": psutil.cpu_count()
            },
            "disk": dict(psutil.disk_usage('/')._asdict())
        },
        "application": {
            "websocket_connections": len(websocket_manager.connections) if websocket_manager else 0,
            "webhook_urls": len(webhook_urls),
            "automation_running": automation_manager.is_running if automation_manager else False
        }
    }

# Configuration endpoints

@app.get("/api/v1/config")
async def get_config(user: User = Depends(require_role("admin"))):
    """Get current system configuration."""
    if not config:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuration not loaded"
        )
    
    return config.to_dict()

@app.put("/api/v1/config")
async def update_config(
    request: ConfigUpdateRequest,
    user: User = Depends(require_role("admin"))
):
    """Update system configuration."""
    if not automation_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Automation manager not available"
        )
    
    try:
        # In a real implementation, this would update the configuration
        # and reload the automation manager
        return {
            "message": "Configuration updated successfully",
            "section": request.config_section,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to update configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}"
        )

@app.post("/api/v1/config/reload")
async def reload_config(user: User = Depends(require_role("admin"))):
    """Reload system configuration."""
    try:
        # In a real implementation, this would reload the configuration
        return {
            "message": "Configuration reloaded successfully",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to reload configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reload configuration: {str(e)}"
        )

# Webhook management endpoints

@app.post("/api/v1/webhooks")
async def register_webhook(
    webhook: WebhookRegistration,
    user: User = Depends(require_role("admin"))
):
    """Register a webhook URL for event notifications."""
    if webhook.url not in webhook_urls:
        webhook_urls.append(webhook.url)
    
    return {
        "message": "Webhook registered successfully",
        "url": webhook.url,
        "events": webhook.events
    }

@app.get("/api/v1/webhooks")
async def list_webhooks(user: User = Depends(require_role("admin"))):
    """List registered webhook URLs."""
    return {
        "webhooks": [{"url": url, "events": ["all"]} for url in webhook_urls],
        "total": len(webhook_urls)
    }

@app.delete("/api/v1/webhooks")
async def unregister_webhook(
    url: str,
    user: User = Depends(require_role("admin"))
):
    """Unregister a webhook URL."""
    if url in webhook_urls:
        webhook_urls.remove(url)
        return {"message": "Webhook unregistered successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Webhook URL not found"
        )

# WebSocket endpoints for real-time updates

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = None):
    """
    Enhanced WebSocket endpoint for real-time updates.
    
    Supports:
    - Authentication via JWT token
    - Event subscription management
    - Heartbeat mechanism
    - Connection management with proper cleanup
    """
    if not websocket_manager:
        await websocket.close(code=1011, reason="WebSocket service unavailable")
        return
    
    connection_id = None
    try:
        # Connect to WebSocket manager
        connection_id = await websocket_manager.connect(
            websocket, 
            token=token,
            client_info={
                "user_agent": websocket.headers.get("user-agent", ""),
                "origin": websocket.headers.get("origin", ""),
            }
        )
        
        # Handle incoming messages
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle the message through WebSocket manager
                await websocket_manager.handle_client_message(connection_id, message)
                
            except json.JSONDecodeError:
                # Send error for invalid JSON
                await websocket.send_json({
                    "type": "error",
                    "data": {"error": "Invalid JSON format"},
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        if connection_id and websocket_manager:
            await websocket_manager.disconnect(connection_id, "Connection closed")

@app.get("/api/v1/websocket/connections")
async def get_websocket_connections(user: User = Depends(require_role("admin"))):
    """Get list of active WebSocket connections."""
    if not websocket_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="WebSocket manager not available"
        )
    
    return {
        "connections": websocket_manager.get_connections(),
        "stats": websocket_manager.get_connection_stats()
    }

@app.post("/api/v1/websocket/broadcast")
async def broadcast_message(
    event_type: str,
    data: Dict[str, Any],
    required_roles: Optional[List[str]] = None,
    user: User = Depends(require_role("admin"))
):
    """Broadcast a message to all WebSocket connections."""
    if not websocket_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="WebSocket manager not available"
        )
    
    sent_count = await websocket_manager.broadcast(event_type, data, required_roles)
    
    return {
        "message": "Broadcast sent successfully",
        "event_type": event_type,
        "connections_reached": sent_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Application lifecycle events

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global automation_manager, config, websocket_manager
    
    logger.info("Football Automation API starting up")
    
    try:
        # Load configuration
        config = load_config()
        logger.info("Configuration loaded successfully")
        
        # Initialize WebSocket manager
        websocket_manager = WebSocketManager(
            heartbeat_interval=30,
            heartbeat_timeout=60,
            max_connections=1000,
            jwt_secret=SECRET_KEY,
            jwt_algorithm=ALGORITHM
        )
        await websocket_manager.start()
        logger.info("WebSocket manager started successfully")
        
        # Initialize automation manager
        automation_manager = AutomationManager(config)
        
        # Add event handlers
        automation_manager.add_event_handler("processing_progress", handle_processing_progress)
        automation_manager.add_event_handler("processing_completed", handle_processing_completed)
        automation_manager.add_event_handler("system_error", handle_system_error)
        automation_manager.add_event_handler("file_detected", handle_file_detected)
        automation_manager.add_event_handler("download_completed", handle_download_completed)
        automation_manager.add_event_handler("file_queued", handle_job_queued)
        
        # Start automation manager
        await automation_manager.start()
        logger.info("Automation manager started successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        # Don't fail startup, but log the error

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    global automation_manager, websocket_manager
    
    logger.info("Football Automation API shutting down")
    
    if automation_manager:
        try:
            await automation_manager.stop()
            logger.info("Automation manager stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping automation manager: {e}")
    
    if websocket_manager:
        try:
            await websocket_manager.stop()
            logger.info("WebSocket manager stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping WebSocket manager: {e}")

# Error handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with proper JSON responses."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "enhanced_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )