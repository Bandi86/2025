from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import asyncio
import json
import time
from datetime import datetime
import structlog

from core.database import get_agent_by_id, update_agent_status, create_task, update_task_status
from core.logging import AgentLogger
from core.monitoring import record_task_completed, record_task_failed, record_agent_memory_usage
from core.config import settings

class BaseAgent(ABC):
    """Base class for all agents in the Agent OS"""
    
    def __init__(self, agent_id: str, name: str, agent_type: str, config: Dict[str, Any] = None):
        self.agent_id = agent_id
        self.name = name
        self.agent_type = agent_type
        self.config = config or {}
        self.status = "idle"
        self.memory = []
        self.logger = AgentLogger(agent_id=agent_id, agent_name=name)
        self.struct_logger = structlog.get_logger(f"agent.{agent_type}")
        
        # Task management
        self.current_task = None
        self.task_queue = asyncio.Queue()
        self.is_running = False
        
        # Performance tracking
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.total_processing_time = 0.0
        
    async def start(self):
        """Start the agent"""
        if self.is_running:
            self.logger.warning("Agent is already running")
            return
        
        self.is_running = True
        self.status = "running"
        await update_agent_status(self.agent_id, self.status)
        self.logger.info("Agent started")
        
        # Start task processing loop
        asyncio.create_task(self._task_processing_loop())
        
    async def stop(self):
        """Stop the agent"""
        self.is_running = False
        self.status = "stopped"
        await update_agent_status(self.agent_id, self.status)
        self.logger.info("Agent stopped")
        
    async def pause(self):
        """Pause the agent"""
        self.status = "paused"
        await update_agent_status(self.agent_id, self.status)
        self.logger.info("Agent paused")
        
    async def resume(self):
        """Resume the agent"""
        self.status = "running"
        await update_agent_status(self.agent_id, self.status)
        self.logger.info("Agent resumed")
        
    async def add_task(self, task_type: str, input_data: Dict[str, Any] = None) -> str:
        """Add a task to the agent's queue"""
        task = await create_task(self.agent_id, task_type, input_data)
        await self.task_queue.put(task)
        self.logger.info("Task added to queue", task_id=task['id'], task_type=task_type)
        return task['id']
        
    async def _task_processing_loop(self):
        """Main task processing loop"""
        while self.is_running:
            try:
                if self.status == "paused":
                    await asyncio.sleep(1)
                    continue
                    
                # Get task from queue with timeout
                try:
                    task = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                await self._process_task(task)
                
            except Exception as e:
                self.logger.error("Error in task processing loop", error=str(e))
                await asyncio.sleep(1)
                
    async def _process_task(self, task: Dict[str, Any]):
        """Process a single task"""
        task_id = task['id']
        task_type = task['task_type']
        input_data = task.get('input_data', {})
        
        start_time = time.time()
        
        try:
            # Update task status to running
            await update_task_status(task_id, "running")
            self.logger.task_started(task_id, task_type)
            
            # Execute the task
            result = await self.execute_task(task_type, input_data)
            
            # Update task status to completed
            await update_task_status(task_id, "completed", output_data=result)
            
            # Record metrics
            duration = time.time() - start_time
            record_task_completed(self.agent_type, task_type, duration)
            self.tasks_completed += 1
            self.total_processing_time += duration
            
            self.logger.task_completed(task_id, task_type, duration)
            
        except Exception as e:
            # Update task status to failed
            await update_task_status(task_id, "failed", error_message=str(e))
            
            # Record metrics
            record_task_failed(self.agent_type, task_type)
            self.tasks_failed += 1
            
            self.logger.task_failed(task_id, task_type, str(e))
            
    @abstractmethod
    async def execute_task(self, task_type: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific task - must be implemented by subclasses"""
        pass
        
    async def add_to_memory(self, data: Dict[str, Any]):
        """Add data to agent's memory"""
        memory_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
        self.memory.append(memory_entry)
        
        # Limit memory size
        if len(self.memory) > settings.AGENT_MEMORY_SIZE:
            self.memory.pop(0)
            
        # Update memory in database
        await self._update_memory_in_db()
        
    async def get_memory(self, limit: int = None) -> List[Dict[str, Any]]:
        """Get agent's memory"""
        if limit:
            return self.memory[-limit:]
        return self.memory
        
    async def clear_memory(self):
        """Clear agent's memory"""
        self.memory = []
        await self._update_memory_in_db()
        self.logger.info("Memory cleared")
        
    async def _update_memory_in_db(self):
        """Update memory in database"""
        try:
            from core.database import execute_query
            await execute_query(
                "UPDATE agents SET memory = $1 WHERE id = $2",
                json.dumps(self.memory), self.agent_id
            )
        except Exception as e:
            self.logger.error("Failed to update memory in database", error=str(e))
            
    def get_status(self) -> Dict[str, Any]:
        """Get agent status information"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "type": self.agent_type,
            "status": self.status,
            "is_running": self.is_running,
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "total_processing_time": self.total_processing_time,
            "memory_size": len(self.memory),
            "queue_size": self.task_queue.qsize()
        }
        
    async def health_check(self) -> Dict[str, Any]:
        """Perform agent health check"""
        try:
            # Check if agent can process tasks
            if self.status == "running" and self.is_running:
                health_status = "healthy"
            elif self.status == "paused":
                health_status = "paused"
            else:
                health_status = "unhealthy"
                
            return {
                "agent_id": self.agent_id,
                "status": health_status,
                "uptime": self.total_processing_time,
                "memory_usage": len(self.memory),
                "queue_size": self.task_queue.qsize()
            }
            
        except Exception as e:
            return {
                "agent_id": self.agent_id,
                "status": "error",
                "error": str(e)
            }
            
    def __str__(self):
        return f"{self.__class__.__name__}(id={self.agent_id}, name={self.name}, type={self.agent_type})"
        
    def __repr__(self):
        return self.__str__() 