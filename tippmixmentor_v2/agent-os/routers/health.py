from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import structlog

from core.database import health_check as db_health_check
from core.monitoring import metrics_collector

router = APIRouter()
logger = structlog.get_logger()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "agent-os",
        "timestamp": "2024-01-15T12:00:00Z"
    }

@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with all components"""
    try:
        # Check database health
        db_status = await db_health_check()
        
        # Collect system metrics
        await metrics_collector.collect_system_metrics()
        
        # Overall health status
        overall_status = "healthy"
        if db_status.get("status") != "healthy":
            overall_status = "unhealthy"
            
        return {
            "status": overall_status,
            "service": "agent-os",
            "timestamp": "2024-01-15T12:00:00Z",
            "components": {
                "database": db_status,
                "system": "healthy"
            },
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check for Kubernetes"""
    try:
        # Check if all required services are ready
        db_status = await db_health_check()
        
        if db_status.get("status") == "healthy":
            return {
                "status": "ready",
                "service": "agent-os"
            }
        else:
            raise HTTPException(status_code=503, detail="Service not ready")
            
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service not ready")

@router.get("/live")
async def liveness_check() -> Dict[str, Any]:
    """Liveness check for Kubernetes"""
    return {
        "status": "alive",
        "service": "agent-os"
    } 