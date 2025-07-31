from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog
import uuid
import asyncio
from datetime import datetime

from core.database import create_workflow, get_workflow_by_id, update_workflow_status
from core.monitoring import record_workflow_executed, record_workflow_completed

router = APIRouter()
logger = structlog.get_logger()

# In-memory workflow registry
workflow_registry: Dict[str, Dict[str, Any]] = {}

class WorkflowRequest(BaseModel):
    workflow_type: str
    input_data: Optional[Dict[str, Any]] = None
    agent_id: Optional[str] = None
    priority: Optional[str] = "normal"

class WorkflowResponse(BaseModel):
    workflow_id: str
    workflow_type: str
    status: str
    result: Optional[Dict[str, Any]] = None
    created_at: str

class WorkflowStep(BaseModel):
    step_id: str
    step_type: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    status: str
    error: Optional[str] = None
    execution_time: Optional[float] = None

# Predefined workflow templates
WORKFLOW_TEMPLATES = {
    "standard_prediction": {
        "name": "Standard Prediction Workflow",
        "description": "Basic prediction workflow with team analysis and ML prediction",
        "steps": [
            {
                "id": "data_validation",
                "type": "validation",
                "name": "Validate Match Data",
                "timeout": 30
            },
            {
                "id": "team_analysis",
                "type": "analysis",
                "name": "Analyze Teams",
                "timeout": 60
            },
            {
                "id": "prediction_generation",
                "type": "prediction",
                "name": "Generate Prediction",
                "timeout": 45
            },
            {
                "id": "insight_generation",
                "type": "insight",
                "name": "Generate Insights",
                "timeout": 30
            }
        ]
    },
    "comprehensive_prediction": {
        "name": "Comprehensive Prediction Workflow",
        "description": "Advanced prediction workflow with full analysis pipeline",
        "steps": [
            {
                "id": "data_validation",
                "type": "validation",
                "name": "Validate Match Data",
                "timeout": 30
            },
            {
                "id": "team_analysis",
                "type": "analysis",
                "name": "Analyze Teams",
                "timeout": 60
            },
            {
                "id": "historical_analysis",
                "type": "analysis",
                "name": "Historical Analysis",
                "timeout": 45
            },
            {
                "id": "prediction_generation",
                "type": "prediction",
                "name": "Generate Prediction",
                "timeout": 45
            },
            {
                "id": "ai_insights",
                "type": "ai_insight",
                "name": "AI Insights",
                "timeout": 60
            },
            {
                "id": "trend_analysis",
                "type": "analysis",
                "name": "Trend Analysis",
                "timeout": 30
            },
            {
                "id": "confidence_calculation",
                "type": "calculation",
                "name": "Calculate Confidence",
                "timeout": 15
            },
            {
                "id": "risk_assessment",
                "type": "assessment",
                "name": "Risk Assessment",
                "timeout": 30
            },
            {
                "id": "recommendation_generation",
                "type": "recommendation",
                "name": "Generate Recommendations",
                "timeout": 30
            }
        ]
    },
    "real_time_prediction": {
        "name": "Real-time Prediction Workflow",
        "description": "Fast prediction workflow for real-time scenarios",
        "steps": [
            {
                "id": "quick_validation",
                "type": "validation",
                "name": "Quick Data Validation",
                "timeout": 10
            },
            {
                "id": "fast_prediction",
                "type": "prediction",
                "name": "Fast Prediction",
                "timeout": 20
            },
            {
                "id": "basic_insight",
                "type": "insight",
                "name": "Basic Insight",
                "timeout": 15
            }
        ]
    }
}

@router.post("/execute", response_model=WorkflowResponse)
async def execute_workflow(request: WorkflowRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Execute a prediction workflow"""
    try:
        workflow_id = str(uuid.uuid4())
        
        # Get workflow template
        template = WORKFLOW_TEMPLATES.get(request.workflow_type)
        if not template:
            raise HTTPException(status_code=400, detail=f"Unknown workflow type: {request.workflow_type}")
        
        # Create workflow in database
        db_workflow = await create_workflow(
            workflow_id, 
            request.workflow_type, 
            request.input_data or {},
            request.agent_id
        )
        
        # Initialize workflow
        workflow = {
            "id": workflow_id,
            "type": request.workflow_type,
            "template": template,
            "input_data": request.input_data or {},
            "agent_id": request.agent_id,
            "status": "running",
            "steps": [],
            "result": None,
            "created_at": datetime.utcnow(),
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "error": None
        }
        
        workflow_registry[workflow_id] = workflow
        
        # Execute workflow in background
        background_tasks.add_task(execute_workflow_steps, workflow_id)
        
        # Record metrics
        record_workflow_executed(request.workflow_type)
        
        logger.info("Workflow execution started", 
                   workflow_id=workflow_id, 
                   workflow_type=request.workflow_type)
        
        return {
            "workflow_id": workflow_id,
            "workflow_type": request.workflow_type,
            "status": "running",
            "result": None,
            "created_at": str(workflow["created_at"])
        }
        
    except Exception as e:
        logger.error("Failed to execute workflow", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str) -> Dict[str, Any]:
    """Get workflow status and results"""
    try:
        if workflow_id not in workflow_registry:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflow_registry[workflow_id]
        
        return {
            "workflow_id": workflow_id,
            "workflow_type": workflow["type"],
            "status": workflow["status"],
            "result": workflow["result"],
            "created_at": str(workflow["created_at"])
        }
        
    except Exception as e:
        logger.error("Failed to get workflow", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get workflow: {str(e)}")

@router.get("/{workflow_id}/steps")
async def get_workflow_steps(workflow_id: str) -> List[Dict[str, Any]]:
    """Get detailed workflow steps"""
    try:
        if workflow_id not in workflow_registry:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflow_registry[workflow_id]
        return workflow["steps"]
        
    except Exception as e:
        logger.error("Failed to get workflow steps", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get workflow steps: {str(e)}")

@router.get("/templates")
async def get_workflow_templates() -> Dict[str, Any]:
    """Get available workflow templates"""
    return {
        "templates": WORKFLOW_TEMPLATES,
        "count": len(WORKFLOW_TEMPLATES)
    }

@router.post("/{workflow_id}/cancel")
async def cancel_workflow(workflow_id: str) -> Dict[str, Any]:
    """Cancel a running workflow"""
    try:
        if workflow_id not in workflow_registry:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow = workflow_registry[workflow_id]
        
        if workflow["status"] not in ["running", "pending"]:
            raise HTTPException(status_code=400, detail="Workflow cannot be cancelled")
        
        workflow["status"] = "cancelled"
        workflow["completed_at"] = datetime.utcnow()
        
        # Update in database
        await update_workflow_status(workflow_id, "cancelled")
        
        logger.info("Workflow cancelled", workflow_id=workflow_id)
        
        return {
            "workflow_id": workflow_id,
            "status": "cancelled",
            "message": "Workflow cancelled successfully"
        }
        
    except Exception as e:
        logger.error("Failed to cancel workflow", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to cancel workflow: {str(e)}")

async def execute_workflow_steps(workflow_id: str):
    """Execute workflow steps asynchronously"""
    try:
        workflow = workflow_registry[workflow_id]
        template = workflow["template"]
        input_data = workflow["input_data"]
        
        logger.info("Starting workflow execution", 
                   workflow_id=workflow_id, 
                   steps_count=len(template["steps"]))
        
        # Execute each step
        for step_config in template["steps"]:
            if workflow["status"] == "cancelled":
                break
                
            step_result = await execute_workflow_step(step_config, input_data, workflow)
            workflow["steps"].append(step_result)
            
            # Update input data with step output for next steps
            if step_result["output_data"]:
                input_data.update(step_result["output_data"])
        
        # Compile final result
        if workflow["status"] != "cancelled":
            workflow["result"] = compile_workflow_result(workflow["steps"])
            workflow["status"] = "completed"
            workflow["completed_at"] = datetime.utcnow()
            
            # Update in database
            await update_workflow_status(workflow_id, "completed")
            
            # Record metrics
            record_workflow_completed(workflow["type"])
            
            logger.info("Workflow completed successfully", 
                       workflow_id=workflow_id, 
                       execution_time=(workflow["completed_at"] - workflow["started_at"]).total_seconds())
        else:
            logger.info("Workflow was cancelled", workflow_id=workflow_id)
            
    except Exception as e:
        workflow["status"] = "failed"
        workflow["error"] = str(e)
        workflow["completed_at"] = datetime.utcnow()
        
        # Update in database
        await update_workflow_status(workflow_id, "failed", str(e))
        
        logger.error("Workflow execution failed", 
                    workflow_id=workflow_id, 
                    error=str(e))

async def execute_workflow_step(step_config: Dict[str, Any], input_data: Dict[str, Any], workflow: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a single workflow step"""
    step_id = step_config["id"]
    step_type = step_config["type"]
    step_name = step_config["name"]
    timeout = step_config.get("timeout", 30)
    
    step_result = {
        "step_id": step_id,
        "step_type": step_type,
        "step_name": step_name,
        "input_data": input_data,
        "output_data": None,
        "status": "running",
        "error": None,
        "execution_time": None,
        "started_at": datetime.utcnow(),
        "completed_at": None
    }
    
    try:
        logger.info("Executing workflow step", 
                   workflow_id=workflow["id"], 
                   step_id=step_id, 
                   step_type=step_type)
        
        # Execute step based on type
        if step_type == "validation":
            output_data = await execute_validation_step(step_id, input_data)
        elif step_type == "analysis":
            output_data = await execute_analysis_step(step_id, input_data)
        elif step_type == "prediction":
            output_data = await execute_prediction_step(step_id, input_data)
        elif step_type == "insight":
            output_data = await execute_insight_step(step_id, input_data)
        elif step_type == "ai_insight":
            output_data = await execute_ai_insight_step(step_id, input_data)
        elif step_type == "calculation":
            output_data = await execute_calculation_step(step_id, input_data)
        elif step_type == "assessment":
            output_data = await execute_assessment_step(step_id, input_data)
        elif step_type == "recommendation":
            output_data = await execute_recommendation_step(step_id, input_data)
        else:
            raise ValueError(f"Unknown step type: {step_type}")
        
        step_result["output_data"] = output_data
        step_result["status"] = "completed"
        
        logger.info("Workflow step completed", 
                   workflow_id=workflow["id"], 
                   step_id=step_id)
        
    except Exception as e:
        step_result["status"] = "failed"
        step_result["error"] = str(e)
        
        logger.error("Workflow step failed", 
                    workflow_id=workflow["id"], 
                    step_id=step_id, 
                    error=str(e))
    
    finally:
        step_result["completed_at"] = datetime.utcnow()
        step_result["execution_time"] = (step_result["completed_at"] - step_result["started_at"]).total_seconds()
    
    return step_result

async def execute_validation_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute validation step"""
    if step_id == "data_validation":
        # Validate match data
        required_fields = ['home_team_id', 'away_team_id', 'match_date']
        missing_fields = [field for field in required_fields if not input_data.get(field)]
        
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
        
        return {"validation_passed": True, "validated_fields": required_fields}
    
    elif step_id == "quick_validation":
        # Quick validation for real-time workflows
        return {"validation_passed": True, "quick_check": True}
    
    return {"validation_passed": True}

async def execute_analysis_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute analysis step"""
    if step_id == "team_analysis":
        # This would call the agent system for team analysis
        return {
            "home_team_analysis": {"status": "analyzed"},
            "away_team_analysis": {"status": "analyzed"},
            "comparison": {"status": "completed"}
        }
    
    elif step_id == "historical_analysis":
        return {
            "head_to_head": "analyzed",
            "recent_form": "analyzed",
            "historical_trends": "analyzed"
        }
    
    elif step_id == "trend_analysis":
        return {
            "trends": ["trend1", "trend2"],
            "patterns": ["pattern1", "pattern2"]
        }
    
    return {"analysis_completed": True}

async def execute_prediction_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute prediction step"""
    if step_id in ["prediction_generation", "fast_prediction"]:
        # This would call the ML service for prediction
        return {
            "match_result": {"home_win": 0.4, "draw": 0.3, "away_win": 0.3},
            "over_under": {"over_2_5": 0.6, "under_2_5": 0.4},
            "both_teams_score": {"yes": 0.7, "no": 0.3}
        }
    
    return {"prediction_generated": True}

async def execute_insight_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute insight step"""
    if step_id in ["insight_generation", "basic_insight"]:
        return {
            "insights": ["Insight 1", "Insight 2"],
            "key_findings": ["Finding 1", "Finding 2"]
        }
    
    return {"insights_generated": True}

async def execute_ai_insight_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute AI insight step"""
    if step_id == "ai_insights":
        # This would call the ML service for AI insights
        return {
            "ai_insights": ["AI Insight 1", "AI Insight 2"],
            "confidence": 0.85,
            "explanation": "AI-generated explanation"
        }
    
    return {"ai_insights_generated": True}

async def execute_calculation_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute calculation step"""
    if step_id == "confidence_calculation":
        return {
            "confidence_score": 0.75,
            "confidence_interval": [0.65, 0.85]
        }
    
    return {"calculation_completed": True}

async def execute_assessment_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute assessment step"""
    if step_id == "risk_assessment":
        return {
            "risk_level": "medium",
            "risk_factors": ["Factor 1", "Factor 2"],
            "risk_score": 0.6
        }
    
    return {"assessment_completed": True}

async def execute_recommendation_step(step_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Execute recommendation step"""
    if step_id == "recommendation_generation":
        return {
            "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
            "priority": "high"
        }
    
    return {"recommendations_generated": True}

def compile_workflow_result(steps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compile final result from workflow steps"""
    result = {
        "summary": {},
        "detailed_results": {},
        "execution_summary": {
            "total_steps": len(steps),
            "completed_steps": len([s for s in steps if s["status"] == "completed"]),
            "failed_steps": len([s for s in steps if s["status"] == "failed"]),
            "total_execution_time": sum(s.get("execution_time", 0) for s in steps)
        }
    }
    
    # Compile results from each step
    for step in steps:
        if step["status"] == "completed" and step["output_data"]:
            result["detailed_results"][step["step_id"]] = step["output_data"]
    
    # Create summary
    if "prediction_generation" in result["detailed_results"]:
        result["summary"]["prediction"] = result["detailed_results"]["prediction_generation"]
    
    if "confidence_calculation" in result["detailed_results"]:
        result["summary"]["confidence"] = result["detailed_results"]["confidence_calculation"]
    
    if "recommendation_generation" in result["detailed_results"]:
        result["summary"]["recommendations"] = result["detailed_results"]["recommendation_generation"]
    
    return result 