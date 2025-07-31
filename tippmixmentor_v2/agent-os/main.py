from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import structlog
import uvicorn
from prometheus_client import Counter, Histogram
import time

from core.config import settings
from core.database import init_database, close_database, create_agent_tables
from core.monitoring import setup_monitoring
from routers import agents, tasks, insights, workflows, health
from core.logging import setup_logging

# Prometheus metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

# Setup logging
setup_logging()
logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Agent OS service...")
    await init_database()
    await create_agent_tables()
    setup_monitoring()
    logger.info("Agent OS service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Agent OS service...")
    await close_database()
    logger.info("Agent OS service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Agent OS - TippMixMentor",
    description="Intelligent Agent Operating System for Football Predictions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    # Record metrics
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    REQUEST_LATENCY.observe(process_time)
    
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Agent OS - TippMixMentor",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from prometheus_client import generate_latest
    return generate_latest()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info"
    ) 