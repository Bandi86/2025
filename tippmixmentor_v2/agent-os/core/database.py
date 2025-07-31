import asyncpg
import redis.asyncio as aioredis
import structlog
import json
from typing import Optional
from contextlib import asynccontextmanager
import uuid

from core.config import settings

logger = structlog.get_logger()

# Global database connections
_pg_pool: Optional[asyncpg.Pool] = None
_redis_client: Optional[aioredis.Redis] = None

async def init_database():
    """Initialize database connections"""
    global _pg_pool, _redis_client
    
    try:
        # Initialize PostgreSQL connection pool
        _pg_pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60,
            server_settings={
                'application_name': 'agent_os'
            }
        )
        logger.info("PostgreSQL connection pool initialized")
        
        # Initialize Redis connection
        _redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20
        )
        logger.info("Redis connection initialized")
        
        # Test connections
        await test_connections()
        
    except Exception as e:
        logger.error("Failed to initialize database connections", error=str(e))
        raise

async def close_database():
    """Close database connections"""
    global _pg_pool, _redis_client
    
    if _pg_pool:
        await _pg_pool.close()
        logger.info("PostgreSQL connection pool closed")
    
    if _redis_client:
        await _redis_client.close()
        logger.info("Redis connection closed")

async def test_connections():
    """Test database connections"""
    try:
        # Test PostgreSQL
        async with _pg_pool.acquire() as conn:
            await conn.execute("SELECT 1")
        logger.info("PostgreSQL connection test successful")
        
        # Test Redis
        await _redis_client.ping()
        logger.info("Redis connection test successful")
        
    except Exception as e:
        logger.error("Database connection test failed", error=str(e))
        raise

@asynccontextmanager
async def get_db_connection():
    """Get a database connection from the pool"""
    if not _pg_pool:
        raise RuntimeError("Database not initialized")
    
    async with _pg_pool.acquire() as conn:
        yield conn

async def get_redis_client() -> aioredis.Redis:
    """Get Redis client"""
    if not _redis_client:
        raise RuntimeError("Redis not initialized")
    return _redis_client

async def execute_query(query: str, *args):
    """Execute a database query"""
    async with get_db_connection() as conn:
        return await conn.execute(query, *args)

async def fetch_query(query: str, *args):
    """Fetch data from database"""
    async with get_db_connection() as conn:
        return await conn.fetch(query, *args)

async def fetch_one(query: str, *args):
    """Fetch single row from database"""
    async with get_db_connection() as conn:
        return await conn.fetchrow(query, *args)

async def health_check() -> dict:
    """Database health check"""
    try:
        # Test PostgreSQL
        async with get_db_connection() as conn:
            await conn.execute("SELECT 1")
        
        # Test Redis
        redis_client = await get_redis_client()
        await redis_client.ping()
        
        return {
            "status": "healthy",
            "postgresql": "connected",
            "redis": "connected"
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Database utilities for Agent OS specific operations
async def create_agent_tables():
    """Create agent-related tables if they don't exist"""
    try:
        # Create agents table
        await execute_query("""
            CREATE TABLE IF NOT EXISTS agents (
                agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                agent_type VARCHAR(100) NOT NULL,
                config JSONB,
                status VARCHAR(50) DEFAULT 'inactive',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Create agent tasks table
        await execute_query("""
            CREATE TABLE IF NOT EXISTS agent_tasks (
                task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agent_id UUID REFERENCES agents(agent_id),
                task_type VARCHAR(100) NOT NULL,
                input_data JSONB,
                output_data JSONB,
                status VARCHAR(50) DEFAULT 'pending',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        # Create agent workflows table
        await execute_query("""
            CREATE TABLE IF NOT EXISTS agent_workflows (
                workflow_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workflow_type VARCHAR(100) NOT NULL,
                input_data JSONB,
                agent_id UUID REFERENCES agents(agent_id),
                priority VARCHAR(50) DEFAULT 'normal',
                status VARCHAR(50) DEFAULT 'pending',
                result JSONB,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        """)
        
        logger.info("Agent tables created successfully")
    except Exception as e:
        logger.error("Failed to create agent tables", error=str(e))
        raise

async def get_agent_by_id(agent_id: str):
    """Get agent by ID"""
    return await fetch_one(
        "SELECT * FROM agents WHERE id = $1",
        agent_id
    )

async def create_agent(name: str, agent_type: str, config: dict = None):
    """Create a new agent"""
    config_json = json.dumps(config) if config else None
    return await fetch_one(
        """
        INSERT INTO agents (name, agent_type, config)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        name, agent_type, config_json
    )

async def update_agent_status(agent_id: str, status: str):
    """Update agent status"""
    await execute_query(
        "UPDATE agents SET status = $1, updated_at = NOW() WHERE id = $2",
        status, agent_id
    )

async def create_task(agent_id: str, task_type: str, input_data: dict = None):
    """Create a new task"""
    input_data_json = json.dumps(input_data) if input_data else None
    return await fetch_one(
        """
        INSERT INTO agent_tasks (agent_id, task_type, input_data)
        VALUES ($1, $2, $3)
        RETURNING *
        """,
        agent_id, task_type, input_data_json
    )

async def update_task_status(task_id: str, status: str, output_data: dict = None, error_message: str = None):
    """Update task status and output data"""
    try:
        query = """
            UPDATE agent_tasks 
            SET status = $1, output_data = $2, error_message = $3, updated_at = NOW()
            WHERE task_id = $4
        """
        await execute_query(query, status, json.dumps(output_data) if output_data else None, error_message, task_id)
        logger.info("Task status updated", task_id=task_id, status=status)
    except Exception as e:
        logger.error("Failed to update task status", task_id=task_id, error=str(e))
        raise

# Workflow functions
async def create_workflow(workflow_type: str, input_data: dict = None, agent_id: str = None, priority: str = "normal"):
    """Create a new workflow"""
    try:
        workflow_id = str(uuid.uuid4())
        query = """
            INSERT INTO agent_workflows (workflow_id, workflow_type, input_data, agent_id, priority, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        """
        await execute_query(query, workflow_id, workflow_type, json.dumps(input_data) if input_data else None, agent_id, priority, "pending")
        logger.info("Workflow created", workflow_id=workflow_id, workflow_type=workflow_type)
        return workflow_id
    except Exception as e:
        logger.error("Failed to create workflow", workflow_type=workflow_type, error=str(e))
        raise

async def get_workflow_by_id(workflow_id: str):
    """Get workflow by ID"""
    try:
        query = "SELECT * FROM agent_workflows WHERE workflow_id = $1"
        result = await fetch_one(query, workflow_id)
        if result:
            result['input_data'] = json.loads(result['input_data']) if result['input_data'] else None
        return result
    except Exception as e:
        logger.error("Failed to get workflow", workflow_id=workflow_id, error=str(e))
        raise

async def update_workflow_status(workflow_id: str, status: str, result: dict = None, error_message: str = None):
    """Update workflow status and result"""
    try:
        query = """
            UPDATE agent_workflows 
            SET status = $1, result = $2, error_message = $3, updated_at = NOW()
            WHERE workflow_id = $4
        """
        await execute_query(query, status, json.dumps(result) if result else None, error_message, workflow_id)
        logger.info("Workflow status updated", workflow_id=workflow_id, status=status)
    except Exception as e:
        logger.error("Failed to update workflow status", workflow_id=workflow_id, error=str(e))
        raise 