from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog

from core.database import fetch_query, fetch_one, execute_query
from core.monitoring import record_insight_generated

router = APIRouter()
logger = structlog.get_logger()

class InsightRequest(BaseModel):
    insight_type: str
    parameters: Optional[Dict[str, Any]] = None

class InsightResponse(BaseModel):
    insight_id: str
    agent_id: Optional[str] = None
    insight_type: str
    content: Dict[str, Any]
    confidence: Optional[float] = None
    created_at: str

@router.post("/generate", response_model=InsightResponse)
async def generate_insight(request: InsightRequest) -> Dict[str, Any]:
    """Generate a new insight"""
    try:
        # This would typically involve calling an agent to generate insights
        # For now, we'll create a mock insight
        
        import uuid
        from datetime import datetime
        
        insight_id = str(uuid.uuid4())
        insight_type = request.insight_type
        
        # Generate insight content based on type
        if insight_type == "trend_analysis":
            content = {
                "trend": "upward",
                "confidence": 0.85,
                "description": "Recent predictions show an upward trend in home team victories",
                "data_points": 150,
                "time_period": "last_30_days"
            }
        elif insight_type == "performance_analysis":
            content = {
                "accuracy": 0.72,
                "improvement": 0.05,
                "description": "Prediction accuracy has improved by 5% over the last week",
                "recommendations": ["Focus on recent form data", "Consider head-to-head statistics"]
            }
        elif insight_type == "risk_assessment":
            content = {
                "risk_level": "medium",
                "factors": ["injuries", "form_dip", "head_to_head"],
                "description": "Medium risk level due to recent team injuries and form fluctuations",
                "mitigation": "Consider lower stakes or alternative markets"
            }
        else:
            content = {
                "description": f"General insight for {insight_type}",
                "confidence": 0.7,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # Store insight in database
        await execute_query("""
            INSERT INTO agent_insights (id, insight_type, content, confidence)
            VALUES ($1, $2, $3, $4)
        """, insight_id, insight_type, content, content.get('confidence', 0.7))
        
        # Record metrics
        record_insight_generated("system", insight_type)
        
        logger.info("Insight generated", insight_id=insight_id, insight_type=insight_type)
        
        return {
            "insight_id": insight_id,
            "insight_type": insight_type,
            "content": content,
            "confidence": content.get('confidence', 0.7),
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to generate insight", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate insight: {str(e)}")

@router.get("/", response_model=List[InsightResponse])
async def list_insights(
    insight_type: Optional[str] = None,
    agent_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """List insights with optional filtering"""
    try:
        # Build query with filters
        query = "SELECT * FROM agent_insights WHERE 1=1"
        params = []
        param_count = 0
        
        if insight_type:
            param_count += 1
            query += f" AND insight_type = ${param_count}"
            params.append(insight_type)
            
        if agent_id:
            param_count += 1
            query += f" AND agent_id = ${param_count}"
            params.append(agent_id)
            
        query += " ORDER BY created_at DESC"
        query += f" LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])
        
        insights = await fetch_query(query, *params)
        
        return [
            {
                "insight_id": insight["id"],
                "agent_id": insight["agent_id"],
                "insight_type": insight["insight_type"],
                "content": insight["content"],
                "confidence": insight["confidence"],
                "created_at": insight["created_at"].isoformat()
            }
            for insight in insights
        ]
        
    except Exception as e:
        logger.error("Failed to list insights", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list insights: {str(e)}")

@router.get("/{insight_id}", response_model=InsightResponse)
async def get_insight(insight_id: str) -> Dict[str, Any]:
    """Get insight details"""
    try:
        insight = await fetch_one("SELECT * FROM agent_insights WHERE id = $1", insight_id)
        
        if not insight:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        return {
            "insight_id": insight["id"],
            "agent_id": insight["agent_id"],
            "insight_type": insight["insight_type"],
            "content": insight["content"],
            "confidence": insight["confidence"],
            "created_at": insight["created_at"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get insight", error=str(e), insight_id=insight_id)
        raise HTTPException(status_code=500, detail=f"Failed to get insight: {str(e)}")

@router.get("/types/available")
async def get_available_insight_types() -> Dict[str, Any]:
    """Get available insight types and their descriptions"""
    return {
        "insight_types": [
            {
                "type": "trend_analysis",
                "description": "Analyze trends in predictions and outcomes",
                "parameters": ["time_period", "prediction_type"]
            },
            {
                "type": "performance_analysis",
                "description": "Analyze prediction performance and accuracy",
                "parameters": ["time_period", "metrics"]
            },
            {
                "type": "risk_assessment",
                "description": "Assess risk levels for predictions",
                "parameters": ["risk_factors", "confidence_threshold"]
            },
            {
                "type": "pattern_recognition",
                "description": "Identify patterns in team performance",
                "parameters": ["pattern_type", "data_source"]
            },
            {
                "type": "market_analysis",
                "description": "Analyze betting market trends",
                "parameters": ["market_type", "time_period"]
            }
        ]
    }

@router.get("/stats/summary")
async def get_insight_stats() -> Dict[str, Any]:
    """Get insight statistics summary"""
    try:
        # Get total insights
        total_insights = await fetch_one("SELECT COUNT(*) as count FROM agent_insights")
        
        # Get insights by type
        type_stats = await fetch_query("""
            SELECT insight_type, COUNT(*) as count 
            FROM agent_insights 
            GROUP BY insight_type
        """)
        
        # Get recent insights (last 24 hours)
        recent_insights = await fetch_one("""
            SELECT COUNT(*) as count 
            FROM agent_insights 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        """)
        
        # Get average confidence
        avg_confidence = await fetch_one("""
            SELECT AVG(confidence) as avg_confidence 
            FROM agent_insights 
            WHERE confidence IS NOT NULL
        """)
        
        return {
            "total_insights": total_insights["count"],
            "recent_insights_24h": recent_insights["count"],
            "average_confidence": round(avg_confidence["avg_confidence"] or 0, 3),
            "type_distribution": {
                stat["insight_type"]: stat["count"] for stat in type_stats
            }
        }
        
    except Exception as e:
        logger.error("Failed to get insight stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get insight stats: {str(e)}")

@router.post("/batch/generate")
async def generate_batch_insights(requests: List[InsightRequest]) -> Dict[str, Any]:
    """Generate multiple insights in batch"""
    try:
        generated_insights = []
        
        for request in requests:
            # Generate individual insight
            insight = await generate_insight(request)
            generated_insights.append(insight)
        
        logger.info("Batch insights generated", count=len(generated_insights))
        
        return {
            "success": True,
            "generated_count": len(generated_insights),
            "insights": generated_insights
        }
        
    except Exception as e:
        logger.error("Failed to generate batch insights", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate batch insights: {str(e)}")

@router.delete("/{insight_id}")
async def delete_insight(insight_id: str) -> Dict[str, Any]:
    """Delete an insight"""
    try:
        # Check if insight exists
        insight = await fetch_one("SELECT id FROM agent_insights WHERE id = $1", insight_id)
        
        if not insight:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        # Delete the insight
        await execute_query("DELETE FROM agent_insights WHERE id = $1", insight_id)
        
        logger.info("Insight deleted", insight_id=insight_id)
        
        return {
            "insight_id": insight_id,
            "status": "deleted",
            "message": "Insight deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete insight", error=str(e), insight_id=insight_id)
        raise HTTPException(status_code=500, detail=f"Failed to delete insight: {str(e)}") 