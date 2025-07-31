from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog
import uuid

from core.database import create_agent, get_agent_by_id, update_agent_status
from agents.base_agent import BaseAgent
from agents.prediction_agent import PredictionAgent
from core.monitoring import record_agent_created, record_agent_active

router = APIRouter()
logger = structlog.get_logger()

# In-memory agent registry (in production, this would be in Redis or database)
agent_registry: Dict[str, BaseAgent] = {}

class CreateAgentRequest(BaseModel):
    name: str
    agent_type: str
    config: Optional[Dict[str, Any]] = None

class TaskRequest(BaseModel):
    task_type: str
    input_data: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    agent_id: str
    name: str
    agent_type: str
    status: str
    config: Optional[Dict[str, Any]] = None
    created_at: str

@router.post("/", response_model=AgentResponse)
async def create_new_agent(request: CreateAgentRequest) -> Dict[str, Any]:
    """Create a new agent"""
    try:
        # Generate agent ID
        agent_id = str(uuid.uuid4())
        
        # Create agent in database
        db_agent = await create_agent(request.name, request.agent_type, request.config)
        
        # Create agent instance based on type
        if request.agent_type == "prediction":
            agent = PredictionAgent(agent_id, request.name, request.config or {})
        else:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")
        
        # Register agent
        agent_registry[agent_id] = agent
        
        # Record metrics
        record_agent_created(request.agent_type)
        
        logger.info("Agent created", agent_id=agent_id, agent_type=request.agent_type)
        
        return {
            "agent_id": agent_id,
            "name": request.name,
            "agent_type": request.agent_type,
            "status": "created",
            "config": request.config,
            "created_at": str(db_agent['created_at'])
        }
        
    except Exception as e:
        logger.error("Failed to create agent", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@router.get("/", response_model=List[AgentResponse])
async def list_agents() -> List[Dict[str, Any]]:
    """List all agents"""
    try:
        agents = []
        for agent_id, agent in agent_registry.items():
            status = agent.get_status()
            agents.append({
                "agent_id": agent_id,
                "name": status["name"],
                "agent_type": status["type"],
                "status": status["status"],
                "config": agent.config,
                "created_at": "2024-01-15T12:00:00Z"  # Would come from database
            })
        
        return agents
        
    except Exception as e:
        logger.error("Failed to list agents", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list agents: {str(e)}")

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str) -> Dict[str, Any]:
    """Get agent details"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        status = agent.get_status()
        
        return {
            "agent_id": agent_id,
            "name": status["name"],
            "agent_type": status["type"],
            "status": status["status"],
            "config": agent.config,
            "created_at": "2024-01-15T12:00:00Z"  # Would come from database
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to get agent: {str(e)}")

@router.post("/{agent_id}/start")
async def start_agent(agent_id: str) -> Dict[str, Any]:
    """Start an agent"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        await agent.start()
        
        logger.info("Agent started", agent_id=agent_id)
        
        return {
            "agent_id": agent_id,
            "status": "started",
            "message": "Agent started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to start agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to start agent: {str(e)}")

@router.post("/{agent_id}/stop")
async def stop_agent(agent_id: str) -> Dict[str, Any]:
    """Stop an agent"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        await agent.stop()
        
        logger.info("Agent stopped", agent_id=agent_id)
        
        return {
            "agent_id": agent_id,
            "status": "stopped",
            "message": "Agent stopped successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to stop agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to stop agent: {str(e)}")

@router.post("/{agent_id}/pause")
async def pause_agent(agent_id: str) -> Dict[str, Any]:
    """Pause an agent"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        await agent.pause()
        
        logger.info("Agent paused", agent_id=agent_id)
        
        return {
            "agent_id": agent_id,
            "status": "paused",
            "message": "Agent paused successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to pause agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to pause agent: {str(e)}")

@router.post("/{agent_id}/resume")
async def resume_agent(agent_id: str) -> Dict[str, Any]:
    """Resume an agent"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        await agent.resume()
        
        logger.info("Agent resumed", agent_id=agent_id)
        
        return {
            "agent_id": agent_id,
            "status": "resumed",
            "message": "Agent resumed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to resume agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to resume agent: {str(e)}")

@router.post("/{agent_id}/tasks")
async def add_task(agent_id: str, request: TaskRequest) -> Dict[str, Any]:
    """Add a task to an agent"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        task_id = await agent.add_task(request.task_type, request.input_data)
        
        logger.info("Task added to agent", agent_id=agent_id, task_id=task_id, task_type=request.task_type)
        
        return {
            "agent_id": agent_id,
            "task_id": task_id,
            "task_type": request.task_type,
            "status": "queued",
            "message": "Task added to agent queue"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to add task to agent", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to add task: {str(e)}")

@router.get("/{agent_id}/status")
async def get_agent_status(agent_id: str) -> Dict[str, Any]:
    """Get detailed agent status"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        status = agent.get_status()
        
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get agent status", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to get agent status: {str(e)}")

@router.get("/{agent_id}/health")
async def get_agent_health(agent_id: str) -> Dict[str, Any]:
    """Get agent health status"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        health = await agent.health_check()
        
        return health
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get agent health", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to get agent health: {str(e)}")

@router.get("/{agent_id}/memory")
async def get_agent_memory(agent_id: str, limit: Optional[int] = None) -> Dict[str, Any]:
    """Get agent memory"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        memory = await agent.get_memory(limit)
        
        return {
            "agent_id": agent_id,
            "memory": memory,
            "memory_size": len(memory)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get agent memory", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to get agent memory: {str(e)}")

@router.delete("/{agent_id}/memory")
async def clear_agent_memory(agent_id: str) -> Dict[str, Any]:
    """Clear agent memory"""
    try:
        if agent_id not in agent_registry:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        agent = agent_registry[agent_id]
        await agent.clear_memory()
        
        logger.info("Agent memory cleared", agent_id=agent_id)
        
        return {
            "agent_id": agent_id,
            "status": "cleared",
            "message": "Agent memory cleared successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to clear agent memory", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to clear agent memory: {str(e)}") 