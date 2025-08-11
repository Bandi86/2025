"""
Database migration management utilities.

This module provides functions for running migrations, creating new migrations,
and managing database schema changes using Alembic.
"""

import os
import logging
from typing import Optional, List
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine

logger = logging.getLogger(__name__)


def get_alembic_config(database_url: Optional[str] = None) -> Config:
    """
    Get Alembic configuration.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
    
    Returns:
        Config: Alembic configuration object
    """
    # Get the project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    alembic_cfg_path = os.path.join(project_root, "alembic.ini")
    
    if not os.path.exists(alembic_cfg_path):
        raise FileNotFoundError(f"Alembic configuration file not found: {alembic_cfg_path}")
    
    alembic_cfg = Config(alembic_cfg_path)
    
    # Set database URL
    if database_url is None:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
    
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)
    
    return alembic_cfg


def run_migrations(database_url: Optional[str] = None, revision: str = "head") -> None:
    """
    Run database migrations to the specified revision.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
        revision: Target revision (defaults to "head")
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        command.upgrade(alembic_cfg, revision)
        logger.info(f"Successfully ran migrations to revision: {revision}")
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")
        raise


def create_migration(
    message: str,
    database_url: Optional[str] = None,
    autogenerate: bool = True
) -> str:
    """
    Create a new migration.
    
    Args:
        message: Migration message/description
        database_url: Database URL (defaults to DATABASE_URL env var)
        autogenerate: Whether to auto-generate migration from model changes
    
    Returns:
        str: Generated migration revision ID
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        
        # Create the migration
        if autogenerate:
            revision = command.revision(alembic_cfg, message=message, autogenerate=True)
        else:
            revision = command.revision(alembic_cfg, message=message)
        
        logger.info(f"Created migration: {message}")
        return revision.revision
    except Exception as e:
        logger.error(f"Failed to create migration: {e}")
        raise


def get_current_revision(database_url: Optional[str] = None) -> Optional[str]:
    """
    Get the current database revision.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
    
    Returns:
        str: Current revision ID, or None if no migrations have been run
    """
    try:
        if database_url is None:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                raise ValueError("DATABASE_URL environment variable not set")
        
        engine = create_engine(database_url)
        with engine.connect() as connection:
            context = MigrationContext.configure(connection)
            return context.get_current_revision()
    except Exception as e:
        logger.error(f"Failed to get current revision: {e}")
        return None


def get_migration_history(database_url: Optional[str] = None) -> List[dict]:
    """
    Get migration history.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
    
    Returns:
        List[dict]: List of migration information
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        script_dir = ScriptDirectory.from_config(alembic_cfg)
        
        history = []
        for revision in script_dir.walk_revisions():
            history.append({
                'revision': revision.revision,
                'down_revision': revision.down_revision,
                'branch_labels': revision.branch_labels,
                'depends_on': revision.depends_on,
                'doc': revision.doc,
                'create_date': revision.create_date,
            })
        
        return history
    except Exception as e:
        logger.error(f"Failed to get migration history: {e}")
        return []


def rollback_migration(
    database_url: Optional[str] = None,
    revision: str = "-1"
) -> None:
    """
    Rollback database to a previous revision.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
        revision: Target revision (defaults to "-1" for previous revision)
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        command.downgrade(alembic_cfg, revision)
        logger.info(f"Successfully rolled back to revision: {revision}")
    except Exception as e:
        logger.error(f"Failed to rollback migration: {e}")
        raise


def stamp_database(
    database_url: Optional[str] = None,
    revision: str = "head"
) -> None:
    """
    Stamp the database with a specific revision without running migrations.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
        revision: Revision to stamp (defaults to "head")
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        command.stamp(alembic_cfg, revision)
        logger.info(f"Successfully stamped database with revision: {revision}")
    except Exception as e:
        logger.error(f"Failed to stamp database: {e}")
        raise


def check_migration_status(database_url: Optional[str] = None) -> dict:
    """
    Check the current migration status.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
    
    Returns:
        dict: Migration status information
    """
    try:
        alembic_cfg = get_alembic_config(database_url)
        script_dir = ScriptDirectory.from_config(alembic_cfg)
        
        # Get current revision
        current_revision = get_current_revision(database_url)
        
        # Get head revision
        head_revision = script_dir.get_current_head()
        
        # Check if migrations are pending
        pending_migrations = []
        if current_revision != head_revision:
            # Get all revisions between current and head
            for revision in script_dir.walk_revisions(head_revision, current_revision):
                if revision.revision != current_revision:
                    pending_migrations.append({
                        'revision': revision.revision,
                        'doc': revision.doc,
                        'create_date': revision.create_date,
                    })
        
        return {
            'current_revision': current_revision,
            'head_revision': head_revision,
            'is_up_to_date': current_revision == head_revision,
            'pending_migrations': pending_migrations,
            'pending_count': len(pending_migrations)
        }
    except Exception as e:
        logger.error(f"Failed to check migration status: {e}")
        return {
            'current_revision': None,
            'head_revision': None,
            'is_up_to_date': False,
            'pending_migrations': [],
            'pending_count': 0,
            'error': str(e)
        }


def initialize_database(database_url: Optional[str] = None) -> None:
    """
    Initialize database with initial migration.
    
    Args:
        database_url: Database URL (defaults to DATABASE_URL env var)
    """
    try:
        # Create initial migration if none exists
        alembic_cfg = get_alembic_config(database_url)
        script_dir = ScriptDirectory.from_config(alembic_cfg)
        
        # Check if any migrations exist
        revisions = list(script_dir.walk_revisions())
        if not revisions:
            # Create initial migration
            logger.info("No migrations found, creating initial migration")
            create_migration("Initial migration", database_url, autogenerate=True)
        
        # Run migrations
        run_migrations(database_url)
        
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise