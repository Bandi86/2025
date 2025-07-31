from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import structlog

from core.database import fetch_query, fetch_one

router = APIRouter()
logger = structlog.get_logger()

class TaskResponse(BaseModel):
    task_id: str
    agent_id: str
    task_type: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    agent_id: Optional[str] = None,
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """List tasks with optional filtering"""
    try:
        # Build query with filters
        query = "SELECT * FROM agent_tasks WHERE 1=1"
        params = []
        param_count = 0
        
        if agent_id:
            param_count += 1
            query += f" AND agent_id = ${param_count}"
            params.append(agent_id)
            
        if status:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status)
            
        if task_type:
            param_count += 1
            query += f" AND task_type = ${param_count}"
            params.append(task_type)
            
        query += " ORDER BY created_at DESC"
        query += f" LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])
        
        tasks = await fetch_query(query, *params)
        
        return [
            {
                "task_id": task["id"],
                "agent_id": task["agent_id"],
                "task_type": task["task_type"],
                "status": task["status"],
                "input_data": task["input_data"],
                "output_data": task["output_data"],
                "error_message": task["error_message"],
                "created_at": task["created_at"].isoformat(),
                "started_at": task["started_at"].isoformat() if task["started_at"] else None,
                "completed_at": task["completed_at"].isoformat() if task["completed_at"] else None
            }
            for task in tasks
        ]
        
    except Exception as e:
        logger.error("Failed to list tasks", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list tasks: {str(e)}")

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str) -> Dict[str, Any]:
    """Get task details"""
    try:
        task = await fetch_one("SELECT * FROM agent_tasks WHERE id = $1", task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {
            "task_id": task["id"],
            "agent_id": task["agent_id"],
            "task_type": task["task_type"],
            "status": task["status"],
            "input_data": task["input_data"],
            "output_data": task["output_data"],
            "error_message": task["error_message"],
            "created_at": task["created_at"].isoformat(),
            "started_at": task["started_at"].isoformat() if task["started_at"] else None,
            "completed_at": task["completed_at"].isoformat() if task["completed_at"] else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get task", error=str(e), task_id=task_id)
        raise HTTPException(status_code=500, detail=f"Failed to get task: {str(e)}")

@router.get("/stats/summary")
async def get_task_stats() -> Dict[str, Any]:
    """Get task statistics summary"""
    try:
        # Get total tasks
        total_tasks = await fetch_one("SELECT COUNT(*) as count FROM agent_tasks")
        
        # Get tasks by status
        status_stats = await fetch_query("""
            SELECT status, COUNT(*) as count 
            FROM agent_tasks 
            GROUP BY status
        """)
        
        # Get tasks by type
        type_stats = await fetch_query("""
            SELECT task_type, COUNT(*) as count 
            FROM agent_tasks 
            GROUP BY task_type
        """)
        
        # Get recent activity (last 24 hours)
        recent_tasks = await fetch_one("""
            SELECT COUNT(*) as count 
            FROM agent_tasks 
            WHERE created_at > NOW() - INTERVAL '24 hours'
        """)
        
        return {
            "total_tasks": total_tasks["count"],
            "recent_tasks_24h": recent_tasks["count"],
            "status_distribution": {
                stat["status"]: stat["count"] for stat in status_stats
            },
            "type_distribution": {
                stat["task_type"]: stat["count"] for stat in type_stats
            }
        }
        
    except Exception as e:
        logger.error("Failed to get task stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get task stats: {str(e)}")

@router.get("/stats/agent/{agent_id}")
async def get_agent_task_stats(agent_id: str) -> Dict[str, Any]:
    """Get task statistics for a specific agent"""
    try:
        # Get total tasks for agent
        total_tasks = await fetch_one(
            "SELECT COUNT(*) as count FROM agent_tasks WHERE agent_id = $1",
            agent_id
        )
        
        # Get tasks by status for agent
        status_stats = await fetch_query("""
            SELECT status, COUNT(*) as count 
            FROM agent_tasks 
            WHERE agent_id = $1
            GROUP BY status
        """, agent_id)
        
        # Get tasks by type for agent
        type_stats = await fetch_query("""
            SELECT task_type, COUNT(*) as count 
            FROM agent_tasks 
            WHERE agent_id = $1
            GROUP BY task_type
        """, agent_id)
        
        # Get average completion time
        avg_completion_time = await fetch_one("""
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
            FROM agent_tasks 
            WHERE agent_id = $1 AND status = 'completed' AND started_at IS NOT NULL
        """, agent_id)
        
        return {
            "agent_id": agent_id,
            "total_tasks": total_tasks["count"],
            "status_distribution": {
                stat["status"]: stat["count"] for stat in status_stats
            },
            "type_distribution": {
                stat["task_type"]: stat["count"] for stat in type_stats
            },
            "avg_completion_time_seconds": avg_completion_time["avg_seconds"] or 0
        }
        
    except Exception as e:
        logger.error("Failed to get agent task stats", error=str(e), agent_id=agent_id)
        raise HTTPException(status_code=500, detail=f"Failed to get agent task stats: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(task_id: str) -> Dict[str, Any]:
    """Delete a task (only if it's not running)"""
    try:
        # Check if task exists and get its status
        task = await fetch_one("SELECT status FROM agent_tasks WHERE id = $1", task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        if task["status"] in ["running", "pending"]:
            raise HTTPException(status_code=400, detail="Cannot delete running or pending task")
        
        # Delete the task
        await fetch_one("DELETE FROM agent_tasks WHERE id = $1", task_id)
        
        logger.info("Task deleted", task_id=task_id)
        
        return {
            "task_id": task_id,
            "status": "deleted",
            "message": "Task deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete task", error=str(e), task_id=task_id)
        raise HTTPException(status_code=500, detail=f"Failed to delete task: {str(e)}")

@router.get("/queue/status")
async def get_queue_status() -> Dict[str, Any]:
    """Get current task queue status"""
    try:
        # Get pending tasks count
        pending_count = await fetch_one("""
            SELECT COUNT(*) as count 
            FROM agent_tasks 
            WHERE status = 'pending'
        """)
        
        # Get running tasks count
        running_count = await fetch_one("""
            SELECT COUNT(*) as count 
            FROM agent_tasks 
            WHERE status = 'running'
        """)
        
        # Get oldest pending task
        oldest_pending = await fetch_one("""
            SELECT created_at 
            FROM agent_tasks 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 1
        """)
        
        return {
            "pending_tasks": pending_count["count"],
            "running_tasks": running_count["count"],
            "oldest_pending_task": oldest_pending["created_at"].isoformat() if oldest_pending else None,
            "queue_health": "healthy" if pending_count["count"] < 100 else "congested"
        }
        
    except Exception as e:
        logger.error("Failed to get queue status", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get queue status: {str(e)}") 