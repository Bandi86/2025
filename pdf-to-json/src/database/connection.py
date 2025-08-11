"""
Database connection management with async support and connection pooling.

This module provides database connection management, session factories,
and connection pooling for both sync and async operations.
"""

import os
import logging
from contextlib import contextmanager, asynccontextmanager
from typing import Generator, AsyncGenerator, Optional
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DisconnectionError, OperationalError

from .models import Base

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Database connection manager with support for both sync and async operations.
    
    Provides connection pooling, health checks, and automatic reconnection.
    """
    
    def __init__(
        self,
        database_url: str,
        async_database_url: Optional[str] = None,
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        echo: bool = False
    ):
        """
        Initialize database manager.
        
        Args:
            database_url: Synchronous database URL
            async_database_url: Asynchronous database URL (optional)
            pool_size: Number of connections to maintain in pool
            max_overflow: Maximum overflow connections
            pool_timeout: Timeout for getting connection from pool
            pool_recycle: Time to recycle connections (seconds)
            echo: Whether to echo SQL statements
        """
        self.database_url = database_url
        self.async_database_url = async_database_url or database_url.replace('postgresql://', 'postgresql+asyncpg://')
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_timeout = pool_timeout
        self.pool_recycle = pool_recycle
        self.echo = echo
        
        # Initialize engines and session factories
        self._sync_engine: Optional[Engine] = None
        self._async_engine = None
        self._sync_session_factory: Optional[sessionmaker] = None
        self._async_session_factory = None
        
        self._initialize_connections()
    
    def _initialize_connections(self):
        """Initialize database connections and session factories."""
        try:
            # Create synchronous engine
            self._sync_engine = create_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout,
                pool_recycle=self.pool_recycle,
                pool_pre_ping=True,  # Validate connections before use
                echo=self.echo,
                connect_args={
                    "application_name": "football_automation",
                    "options": "-c timezone=utc"
                }
            )
            
            # Create asynchronous engine
            self._async_engine = create_async_engine(
                self.async_database_url,
                poolclass=QueuePool,
                pool_size=self.pool_size,
                max_overflow=self.max_overflow,
                pool_timeout=self.pool_timeout,
                pool_recycle=self.pool_recycle,
                pool_pre_ping=True,
                echo=self.echo,
                connect_args={
                    "application_name": "football_automation_async",
                    "server_settings": {"timezone": "utc"}
                }
            )
            
            # Create session factories
            self._sync_session_factory = sessionmaker(
                bind=self._sync_engine,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False
            )
            
            self._async_session_factory = async_sessionmaker(
                bind=self._async_engine,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False,
                class_=AsyncSession
            )
            
            # Add event listeners for connection management
            self._setup_event_listeners()
            
            logger.info("Database connections initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database connections: {e}")
            raise
    
    def _setup_event_listeners(self):
        """Setup event listeners for connection management."""
        
        @event.listens_for(self._sync_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            """Set connection-specific settings."""
            if 'postgresql' in self.database_url:
                # Set timezone for PostgreSQL connections
                with dbapi_connection.cursor() as cursor:
                    cursor.execute("SET timezone TO 'UTC'")
        
        @event.listens_for(self._sync_engine, "engine_connect")
        def receive_engine_connect(conn, branch):
            """Log successful connections."""
            logger.debug("Database connection established")
        
        @event.listens_for(self._sync_engine, "handle_error")
        def receive_handle_error(exception_context):
            """Handle database errors."""
            if isinstance(exception_context.original_exception, DisconnectionError):
                logger.warning("Database disconnection detected, will retry")
            else:
                logger.error(f"Database error: {exception_context.original_exception}")
    
    @property
    def sync_engine(self) -> Engine:
        """Get synchronous database engine."""
        if self._sync_engine is None:
            raise RuntimeError("Database manager not initialized")
        return self._sync_engine
    
    @property
    def async_engine(self):
        """Get asynchronous database engine."""
        if self._async_engine is None:
            raise RuntimeError("Database manager not initialized")
        return self._async_engine
    
    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get a synchronous database session with automatic cleanup.
        
        Yields:
            Session: SQLAlchemy session
        """
        if self._sync_session_factory is None:
            raise RuntimeError("Database manager not initialized")
        
        session = self._sync_session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    @asynccontextmanager
    async def get_async_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Get an asynchronous database session with automatic cleanup.
        
        Yields:
            AsyncSession: SQLAlchemy async session
        """
        if self._async_session_factory is None:
            raise RuntimeError("Database manager not initialized")
        
        session = self._async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Async database session error: {e}")
            raise
        finally:
            await session.close()
    
    def create_tables(self):
        """Create all database tables."""
        try:
            Base.metadata.create_all(self.sync_engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise
    
    async def create_tables_async(self):
        """Create all database tables asynchronously."""
        try:
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully (async)")
        except Exception as e:
            logger.error(f"Failed to create database tables (async): {e}")
            raise
    
    def drop_tables(self):
        """Drop all database tables."""
        try:
            Base.metadata.drop_all(self.sync_engine)
            logger.info("Database tables dropped successfully")
        except Exception as e:
            logger.error(f"Failed to drop database tables: {e}")
            raise
    
    async def drop_tables_async(self):
        """Drop all database tables asynchronously."""
        try:
            async with self.async_engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            logger.info("Database tables dropped successfully (async)")
        except Exception as e:
            logger.error(f"Failed to drop database tables (async): {e}")
            raise
    
    def health_check(self) -> bool:
        """
        Perform a health check on the database connection.
        
        Returns:
            bool: True if database is healthy, False otherwise
        """
        try:
            with self.get_session() as session:
                session.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def health_check_async(self) -> bool:
        """
        Perform an asynchronous health check on the database connection.
        
        Returns:
            bool: True if database is healthy, False otherwise
        """
        try:
            async with self.get_async_session() as session:
                await session.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Async database health check failed: {e}")
            return False
    
    def get_connection_info(self) -> dict:
        """
        Get information about database connections.
        
        Returns:
            dict: Connection pool information
        """
        if self._sync_engine is None:
            return {"status": "not_initialized"}
        
        pool = self._sync_engine.pool
        return {
            "status": "initialized",
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid(),
        }
    
    def close_connections(self):
        """Close all database connections."""
        try:
            if self._sync_engine:
                self._sync_engine.dispose()
            if self._async_engine:
                # Note: async engine disposal should be awaited, but we can't do that here
                # This is mainly for cleanup in synchronous contexts
                pass
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")
    
    async def close_connections_async(self):
        """Close all database connections asynchronously."""
        try:
            if self._async_engine:
                await self._async_engine.dispose()
            if self._sync_engine:
                self._sync_engine.dispose()
            logger.info("Database connections closed (async)")
        except Exception as e:
            logger.error(f"Error closing database connections (async): {e}")


# Global database manager instance
_db_manager: Optional[DatabaseManager] = None


def initialize_database(
    database_url: Optional[str] = None,
    **kwargs
) -> DatabaseManager:
    """
    Initialize the global database manager.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
        **kwargs: Additional arguments for DatabaseManager
    
    Returns:
        DatabaseManager: Initialized database manager
    """
    global _db_manager
    
    if database_url is None:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
    
    _db_manager = DatabaseManager(database_url, **kwargs)
    return _db_manager


def get_database_manager() -> DatabaseManager:
    """
    Get the global database manager instance.
    
    Returns:
        DatabaseManager: Database manager instance
    
    Raises:
        RuntimeError: If database manager is not initialized
    """
    if _db_manager is None:
        raise RuntimeError("Database manager not initialized. Call initialize_database() first.")
    return _db_manager


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Get a database session using the global database manager.
    
    Yields:
        Session: SQLAlchemy session
    """
    db_manager = get_database_manager()
    with db_manager.get_session() as session:
        yield session


@asynccontextmanager
async def get_async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get an async database session using the global database manager.
    
    Yields:
        AsyncSession: SQLAlchemy async session
    """
    db_manager = get_database_manager()
    async with db_manager.get_async_session() as session:
        yield session


def create_test_database_manager(database_url: str = "sqlite:///test.db") -> DatabaseManager:
    """
    Create a database manager for testing purposes.
    
    Args:
        database_url: Test database URL
    
    Returns:
        DatabaseManager: Test database manager
    """
    # For SQLite, don't create async engine
    manager = DatabaseManager.__new__(DatabaseManager)
    manager.database_url = database_url
    manager.async_database_url = None  # Disable async for SQLite tests
    manager.pool_size = 1
    manager.max_overflow = 0
    manager.pool_timeout = 30
    manager.pool_recycle = 3600
    manager.echo = False
    
    # Initialize only sync engine for SQLite tests
    manager._sync_engine = create_engine(
        database_url,
        poolclass=NullPool,  # Use NullPool for in-memory SQLite
        echo=False,
        connect_args={"check_same_thread": False}
    )
    
    manager._async_engine = None  # No async engine for tests
    
    # Create only sync session factory
    manager._sync_session_factory = sessionmaker(
        bind=manager._sync_engine,
        expire_on_commit=False,
        autoflush=True,
        autocommit=False
    )
    
    manager._async_session_factory = None  # No async session factory for tests
    
    return manager


def create_test_tables(engine):
    """Create test tables using test models."""
    from tests.test_models import Base
    Base.metadata.create_all(engine)