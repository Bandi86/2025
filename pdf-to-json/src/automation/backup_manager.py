"""
Backup and Disaster Recovery Manager.

This module provides:
- Automated backup creation and scheduling
- Database backup and restore
- File system backup and restore
- Configuration backup and versioning
- Disaster recovery procedures
- Backup verification and integrity checks
"""

import asyncio
import logging
import shutil
import tarfile
import gzip
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Set, Callable, Awaitable
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import subprocess
import tempfile

from .exceptions import BackupManagerError


class BackupType(Enum):
    """Types of backups."""
    FULL = "full"
    INCREMENTAL = "incremental"
    DIFFERENTIAL = "differential"
    CONFIGURATION = "configuration"
    DATABASE = "database"
    FILES = "files"


class BackupStatus(Enum):
    """Status of backup operations."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    VERIFYING = "verifying"
    VERIFIED = "verified"


@dataclass
class BackupConfig:
    """Configuration for backup operations."""
    # Backup storage
    backup_root_path: str = "backups"
    max_backup_age_days: int = 30
    max_backup_count: int = 50
    
    # Backup scheduling
    enable_scheduled_backups: bool = True
    full_backup_interval_hours: int = 24
    incremental_backup_interval_hours: int = 6
    
    # Compression and encryption
    enable_compression: bool = True
    compression_level: int = 6
    enable_encryption: bool = False
    encryption_key_path: str = ""
    
    # Database backup
    database_backup_enabled: bool = True
    database_backup_format: str = "custom"  # custom, plain, tar
    
    # File backup
    file_backup_paths: List[str] = field(default_factory=lambda: [
        "source", "jsons", "config", "logs"
    ])
    file_backup_exclude_patterns: List[str] = field(default_factory=lambda: [
        "*.tmp", "*.log", "__pycache__", "*.pyc"
    ])
    
    # Verification
    enable_backup_verification: bool = True
    verify_checksums: bool = True
    
    # Retention policy
    keep_daily_backups: int = 7
    keep_weekly_backups: int = 4
    keep_monthly_backups: int = 12


@dataclass
class BackupMetadata:
    """Metadata for a backup."""
    backup_id: str
    backup_type: BackupType
    status: BackupStatus
    created_at: datetime
    completed_at: Optional[datetime]
    file_path: str
    file_size: int
    checksum: str
    compression_ratio: float
    includes: List[str]
    excludes: List[str]
    error_message: Optional[str] = None
    verification_status: Optional[bool] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'backup_id': self.backup_id,
            'backup_type': self.backup_type.value,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'checksum': self.checksum,
            'compression_ratio': self.compression_ratio,
            'includes': self.includes,
            'excludes': self.excludes,
            'error_message': self.error_message,
            'verification_status': self.verification_status
        }


class BackupManager:
    """
    Manages backup and disaster recovery operations.
    
    Features:
    - Automated backup scheduling
    - Multiple backup types (full, incremental, differential)
    - Database and file system backups
    - Backup verification and integrity checks
    - Disaster recovery procedures
    - Retention policy management
    """
    
    def __init__(self, config: BackupConfig):
        """
        Initialize the backup manager.
        
        Args:
            config: Backup configuration
        """
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Backup storage
        self.backup_root = Path(config.backup_root_path)
        self.backup_root.mkdir(parents=True, exist_ok=True)
        
        # Backup registry
        self.backups: Dict[str, BackupMetadata] = {}
        self.active_backups: Set[str] = set()
        
        # State
        self.is_running = False
        self.last_full_backup: Optional[datetime] = None
        self.last_incremental_backup: Optional[datetime] = None
        
        # Tasks
        self.scheduler_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Component references
        self.database_manager = None
        self.automation_manager = None
        
        # Load existing backup metadata
        self._load_backup_registry()
    
    async def start(self) -> None:
        """Start the backup manager."""
        if self.is_running:
            self.logger.warning("Backup manager is already running")
            return
        
        self.logger.info("Starting backup manager")
        self.is_running = True
        
        # Start scheduled backup task
        if self.config.enable_scheduled_backups:
            self.scheduler_task = asyncio.create_task(self._backup_scheduler_loop())
        
        # Start cleanup task
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        self.logger.info("Backup manager started successfully")
    
    async def stop(self) -> None:
        """Stop the backup manager."""
        if not self.is_running:
            return
        
        self.logger.info("Stopping backup manager")
        self.is_running = False
        
        # Cancel tasks
        for task in [self.scheduler_task, self.cleanup_task]:
            if task:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        # Wait for active backups to complete
        if self.active_backups:
            self.logger.info(f"Waiting for {len(self.active_backups)} active backups to complete")
            while self.active_backups:
                await asyncio.sleep(1)
        
        self.logger.info("Backup manager stopped")
    
    def set_component_references(self, **components):
        """Set references to system components."""
        for name, component in components.items():
            setattr(self, name, component)
    
    async def create_backup(self, backup_type: BackupType = BackupType.FULL,
                          includes: List[str] = None,
                          excludes: List[str] = None) -> str:
        """
        Create a backup.
        
        Args:
            backup_type: Type of backup to create
            includes: Specific paths to include
            excludes: Specific paths to exclude
            
        Returns:
            Backup ID
        """
        backup_id = self._generate_backup_id(backup_type)
        
        if includes is None:
            includes = self.config.file_backup_paths.copy()
        if excludes is None:
            excludes = self.config.file_backup_exclude_patterns.copy()
        
        # Create backup metadata
        backup_metadata = BackupMetadata(
            backup_id=backup_id,
            backup_type=backup_type,
            status=BackupStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            completed_at=None,
            file_path="",
            file_size=0,
            checksum="",
            compression_ratio=0.0,
            includes=includes,
            excludes=excludes
        )
        
        self.backups[backup_id] = backup_metadata
        self.active_backups.add(backup_id)
        
        self.logger.info(f"Starting {backup_type.value} backup: {backup_id}")
        
        try:
            # Create backup based on type
            if backup_type == BackupType.FULL:
                await self._create_full_backup(backup_metadata)
            elif backup_type == BackupType.INCREMENTAL:
                await self._create_incremental_backup(backup_metadata)
            elif backup_type == BackupType.DIFFERENTIAL:
                await self._create_differential_backup(backup_metadata)
            elif backup_type == BackupType.CONFIGURATION:
                await self._create_configuration_backup(backup_metadata)
            elif backup_type == BackupType.DATABASE:
                await self._create_database_backup(backup_metadata)
            elif backup_type == BackupType.FILES:
                await self._create_files_backup(backup_metadata)
            
            # Verify backup if enabled
            if self.config.enable_backup_verification:
                await self._verify_backup(backup_metadata)
            
            backup_metadata.status = BackupStatus.COMPLETED
            backup_metadata.completed_at = datetime.now(timezone.utc)
            
            self.logger.info(f"Backup completed successfully: {backup_id}")
            
        except Exception as e:
            backup_metadata.status = BackupStatus.FAILED
            backup_metadata.error_message = str(e)
            self.logger.error(f"Backup failed: {backup_id} - {e}")
            raise BackupManagerError(f"Backup failed: {e}")
        
        finally:
            self.active_backups.discard(backup_id)
            self._save_backup_registry()
        
        return backup_id
    
    async def restore_backup(self, backup_id: str, 
                           restore_path: str = None,
                           restore_database: bool = True,
                           restore_files: bool = True,
                           restore_config: bool = True) -> None:
        """
        Restore from a backup.
        
        Args:
            backup_id: Backup to restore from
            restore_path: Path to restore to (default: original locations)
            restore_database: Whether to restore database
            restore_files: Whether to restore files
            restore_config: Whether to restore configuration
        """
        if backup_id not in self.backups:
            raise BackupManagerError(f"Backup not found: {backup_id}")
        
        backup_metadata = self.backups[backup_id]
        
        if backup_metadata.status != BackupStatus.COMPLETED:
            raise BackupManagerError(f"Cannot restore from incomplete backup: {backup_id}")
        
        self.logger.info(f"Starting restore from backup: {backup_id}")
        
        try:
            # Verify backup before restore
            if self.config.enable_backup_verification:
                await self._verify_backup(backup_metadata)
                if not backup_metadata.verification_status:
                    raise BackupManagerError(f"Backup verification failed: {backup_id}")
            
            # Extract backup
            backup_file = Path(backup_metadata.file_path)
            if not backup_file.exists():
                raise BackupManagerError(f"Backup file not found: {backup_file}")
            
            # Create temporary extraction directory
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)
                
                # Extract backup
                await self._extract_backup(backup_file, temp_path)
                
                # Restore components
                if restore_database and (temp_path / "database").exists():
                    await self._restore_database(temp_path / "database")
                
                if restore_files:
                    await self._restore_files(temp_path, restore_path)
                
                if restore_config and (temp_path / "config").exists():
                    await self._restore_configuration(temp_path / "config")
            
            self.logger.info(f"Restore completed successfully: {backup_id}")
            
        except Exception as e:
            self.logger.error(f"Restore failed: {backup_id} - {e}")
            raise BackupManagerError(f"Restore failed: {e}")
    
    async def list_backups(self, backup_type: BackupType = None,
                          status: BackupStatus = None,
                          limit: int = None) -> List[BackupMetadata]:
        """
        List available backups.
        
        Args:
            backup_type: Filter by backup type
            status: Filter by status
            limit: Maximum number of backups to return
            
        Returns:
            List of backup metadata
        """
        backups = list(self.backups.values())
        
        # Apply filters
        if backup_type:
            backups = [b for b in backups if b.backup_type == backup_type]
        
        if status:
            backups = [b for b in backups if b.status == status]
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda b: b.created_at, reverse=True)
        
        # Apply limit
        if limit:
            backups = backups[:limit]
        
        return backups
    
    async def delete_backup(self, backup_id: str) -> None:
        """
        Delete a backup.
        
        Args:
            backup_id: Backup to delete
        """
        if backup_id not in self.backups:
            raise BackupManagerError(f"Backup not found: {backup_id}")
        
        backup_metadata = self.backups[backup_id]
        
        # Don't delete active backups
        if backup_id in self.active_backups:
            raise BackupManagerError(f"Cannot delete active backup: {backup_id}")
        
        try:
            # Delete backup file
            backup_file = Path(backup_metadata.file_path)
            if backup_file.exists():
                backup_file.unlink()
            
            # Remove from registry
            del self.backups[backup_id]
            self._save_backup_registry()
            
            self.logger.info(f"Deleted backup: {backup_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to delete backup {backup_id}: {e}")
            raise BackupManagerError(f"Failed to delete backup: {e}")
    
    async def _create_full_backup(self, metadata: BackupMetadata) -> None:
        """Create a full backup."""
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        # Create temporary directory for backup staging
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup database
            if self.config.database_backup_enabled:
                await self._backup_database(temp_path / "database")
            
            # Backup files
            await self._backup_files(temp_path / "files", metadata.includes, metadata.excludes)
            
            # Backup configuration
            await self._backup_configuration(temp_path / "config")
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
        
        self.last_full_backup = datetime.now(timezone.utc)
    
    async def _create_incremental_backup(self, metadata: BackupMetadata) -> None:
        """Create an incremental backup."""
        if not self.last_full_backup:
            # No full backup exists, create full backup instead
            await self._create_full_backup(metadata)
            return
        
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        # Find files modified since last backup
        since_time = self.last_incremental_backup or self.last_full_backup
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup only changed files
            await self._backup_changed_files(temp_path / "files", metadata.includes, metadata.excludes, since_time)
            
            # Always backup current configuration
            await self._backup_configuration(temp_path / "config")
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
        
        self.last_incremental_backup = datetime.now(timezone.utc)
    
    async def _create_differential_backup(self, metadata: BackupMetadata) -> None:
        """Create a differential backup."""
        if not self.last_full_backup:
            # No full backup exists, create full backup instead
            await self._create_full_backup(metadata)
            return
        
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        # Find files modified since last full backup
        since_time = self.last_full_backup
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup files changed since last full backup
            await self._backup_changed_files(temp_path / "files", metadata.includes, metadata.excludes, since_time)
            
            # Always backup current configuration
            await self._backup_configuration(temp_path / "config")
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
    
    async def _create_configuration_backup(self, metadata: BackupMetadata) -> None:
        """Create a configuration-only backup."""
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup configuration
            await self._backup_configuration(temp_path / "config")
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
    
    async def _create_database_backup(self, metadata: BackupMetadata) -> None:
        """Create a database-only backup."""
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup database
            await self._backup_database(temp_path / "database")
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
    
    async def _create_files_backup(self, metadata: BackupMetadata) -> None:
        """Create a files-only backup."""
        metadata.status = BackupStatus.RUNNING
        
        backup_file = self.backup_root / f"{metadata.backup_id}.tar.gz"
        metadata.file_path = str(backup_file)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Backup files
            await self._backup_files(temp_path / "files", metadata.includes, metadata.excludes)
            
            # Create compressed archive
            original_size = self._get_directory_size(temp_path)
            
            with tarfile.open(backup_file, 'w:gz', compresslevel=self.config.compression_level) as tar:
                tar.add(temp_path, arcname=".")
            
            # Calculate metadata
            metadata.file_size = backup_file.stat().st_size
            metadata.checksum = self._calculate_file_checksum(backup_file)
            metadata.compression_ratio = metadata.file_size / original_size if original_size > 0 else 0.0
    
    async def _backup_database(self, backup_path: Path) -> None:
        """Backup database to specified path."""
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # This is a simplified implementation
        # In a real implementation, you would use pg_dump or similar
        if self.database_manager:
            try:
                # Example for PostgreSQL
                database_url = getattr(self.database_manager, 'database_url', '')
                if database_url:
                    dump_file = backup_path / "database_dump.sql"
                    
                    # Use pg_dump command
                    cmd = [
                        'pg_dump',
                        '--no-password',
                        '--format=custom',
                        '--file', str(dump_file),
                        database_url
                    ]
                    
                    process = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode != 0:
                        raise BackupManagerError(f"Database backup failed: {stderr.decode()}")
                    
                    self.logger.info(f"Database backup created: {dump_file}")
            except Exception as e:
                self.logger.error(f"Database backup failed: {e}")
                # Create a placeholder file to indicate database backup was attempted
                (backup_path / "database_backup_failed.txt").write_text(str(e))
    
    async def _backup_files(self, backup_path: Path, includes: List[str], excludes: List[str]) -> None:
        """Backup files to specified path."""
        backup_path.mkdir(parents=True, exist_ok=True)
        
        for include_path in includes:
            source_path = Path(include_path)
            if not source_path.exists():
                continue
            
            dest_path = backup_path / source_path.name
            
            if source_path.is_file():
                shutil.copy2(source_path, dest_path)
            elif source_path.is_dir():
                shutil.copytree(
                    source_path, 
                    dest_path,
                    ignore=shutil.ignore_patterns(*excludes)
                )
    
    async def _backup_changed_files(self, backup_path: Path, includes: List[str], 
                                  excludes: List[str], since_time: datetime) -> None:
        """Backup only files changed since specified time."""
        backup_path.mkdir(parents=True, exist_ok=True)
        
        for include_path in includes:
            source_path = Path(include_path)
            if not source_path.exists():
                continue
            
            await self._copy_changed_files(source_path, backup_path / source_path.name, since_time, excludes)
    
    async def _copy_changed_files(self, source: Path, dest: Path, since_time: datetime, excludes: List[str]) -> None:
        """Recursively copy files changed since specified time."""
        if source.is_file():
            # Check if file was modified since the specified time
            mtime = datetime.fromtimestamp(source.stat().st_mtime, tz=timezone.utc)
            if mtime > since_time:
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, dest)
        elif source.is_dir():
            for item in source.iterdir():
                # Check exclude patterns
                if any(item.match(pattern) for pattern in excludes):
                    continue
                
                await self._copy_changed_files(item, dest / item.name, since_time, excludes)
    
    async def _backup_configuration(self, backup_path: Path) -> None:
        """Backup configuration files."""
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # Backup configuration files
        config_paths = ["config", ".env", "docker-compose.yml", "requirements.txt"]
        
        for config_path in config_paths:
            source_path = Path(config_path)
            if source_path.exists():
                dest_path = backup_path / source_path.name
                if source_path.is_file():
                    shutil.copy2(source_path, dest_path)
                elif source_path.is_dir():
                    shutil.copytree(source_path, dest_path)
        
        # Create system info file
        system_info = {
            'backup_created_at': datetime.now(timezone.utc).isoformat(),
            'system_version': getattr(self.automation_manager, 'version', 'unknown'),
            'python_version': f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}",
        }
        
        with open(backup_path / "system_info.json", 'w') as f:
            json.dump(system_info, f, indent=2)
    
    async def _verify_backup(self, metadata: BackupMetadata) -> None:
        """Verify backup integrity."""
        metadata.status = BackupStatus.VERIFYING
        
        backup_file = Path(metadata.file_path)
        
        if not backup_file.exists():
            metadata.verification_status = False
            raise BackupManagerError(f"Backup file not found: {backup_file}")
        
        # Verify checksum
        if self.config.verify_checksums:
            current_checksum = self._calculate_file_checksum(backup_file)
            if current_checksum != metadata.checksum:
                metadata.verification_status = False
                raise BackupManagerError(f"Backup checksum mismatch: {metadata.backup_id}")
        
        # Verify archive can be opened
        try:
            with tarfile.open(backup_file, 'r:gz') as tar:
                # Try to list contents
                tar.getnames()
            
            metadata.verification_status = True
            metadata.status = BackupStatus.VERIFIED
            
        except Exception as e:
            metadata.verification_status = False
            raise BackupManagerError(f"Backup archive verification failed: {e}")
    
    async def _extract_backup(self, backup_file: Path, extract_path: Path) -> None:
        """Extract backup archive."""
        with tarfile.open(backup_file, 'r:gz') as tar:
            tar.extractall(extract_path)
    
    async def _restore_database(self, database_path: Path) -> None:
        """Restore database from backup."""
        dump_file = database_path / "database_dump.sql"
        
        if not dump_file.exists():
            self.logger.warning("No database dump found in backup")
            return
        
        # This is a simplified implementation
        # In a real implementation, you would use pg_restore or similar
        if self.database_manager:
            try:
                database_url = getattr(self.database_manager, 'database_url', '')
                if database_url:
                    cmd = [
                        'pg_restore',
                        '--no-password',
                        '--clean',
                        '--if-exists',
                        '--dbname', database_url,
                        str(dump_file)
                    ]
                    
                    process = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await process.communicate()
                    
                    if process.returncode != 0:
                        raise BackupManagerError(f"Database restore failed: {stderr.decode()}")
                    
                    self.logger.info("Database restored successfully")
            except Exception as e:
                self.logger.error(f"Database restore failed: {e}")
                raise
    
    async def _restore_files(self, backup_path: Path, restore_path: str = None) -> None:
        """Restore files from backup."""
        files_path = backup_path / "files"
        
        if not files_path.exists():
            self.logger.warning("No files found in backup")
            return
        
        # Determine restore destination
        if restore_path:
            dest_path = Path(restore_path)
        else:
            dest_path = Path(".")  # Current directory
        
        # Restore files
        for item in files_path.iterdir():
            dest_item = dest_path / item.name
            
            if item.is_file():
                dest_item.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest_item)
            elif item.is_dir():
                if dest_item.exists():
                    shutil.rmtree(dest_item)
                shutil.copytree(item, dest_item)
        
        self.logger.info(f"Files restored to: {dest_path}")
    
    async def _restore_configuration(self, config_path: Path) -> None:
        """Restore configuration from backup."""
        if not config_path.exists():
            self.logger.warning("No configuration found in backup")
            return
        
        # Restore configuration files
        for item in config_path.iterdir():
            if item.name == "system_info.json":
                continue  # Skip system info file
            
            dest_item = Path(item.name)
            
            if item.is_file():
                shutil.copy2(item, dest_item)
            elif item.is_dir():
                if dest_item.exists():
                    shutil.rmtree(dest_item)
                shutil.copytree(item, dest_item)
        
        self.logger.info("Configuration restored successfully")
    
    async def _backup_scheduler_loop(self) -> None:
        """Background task for scheduled backups."""
        while self.is_running:
            try:
                now = datetime.now(timezone.utc)
                
                # Check if full backup is needed
                if (not self.last_full_backup or 
                    (now - self.last_full_backup).total_seconds() >= self.config.full_backup_interval_hours * 3600):
                    await self.create_backup(BackupType.FULL)
                
                # Check if incremental backup is needed
                elif (not self.last_incremental_backup or 
                      (now - self.last_incremental_backup).total_seconds() >= self.config.incremental_backup_interval_hours * 3600):
                    await self.create_backup(BackupType.INCREMENTAL)
                
                # Wait before next check
                await asyncio.sleep(3600)  # Check every hour
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in backup scheduler: {e}")
                await asyncio.sleep(3600)
    
    async def _cleanup_loop(self) -> None:
        """Background task for cleaning up old backups."""
        while self.is_running:
            try:
                await self._cleanup_old_backups()
                await asyncio.sleep(24 * 3600)  # Run daily
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(24 * 3600)
    
    async def _cleanup_old_backups(self) -> None:
        """Clean up old backups based on retention policy."""
        now = datetime.now(timezone.utc)
        backups_to_delete = []
        
        # Group backups by type
        backups_by_type = {}
        for backup in self.backups.values():
            if backup.backup_type not in backups_by_type:
                backups_by_type[backup.backup_type] = []
            backups_by_type[backup.backup_type].append(backup)
        
        # Apply retention policy
        for backup_type, type_backups in backups_by_type.items():
            # Sort by creation time (newest first)
            type_backups.sort(key=lambda b: b.created_at, reverse=True)
            
            # Keep based on count limit
            if len(type_backups) > self.config.max_backup_count:
                backups_to_delete.extend(type_backups[self.config.max_backup_count:])
                type_backups = type_backups[:self.config.max_backup_count]
            
            # Keep based on age limit
            cutoff_date = now - timedelta(days=self.config.max_backup_age_days)
            for backup in type_backups:
                if backup.created_at < cutoff_date:
                    backups_to_delete.append(backup)
        
        # Delete old backups
        for backup in backups_to_delete:
            try:
                await self.delete_backup(backup.backup_id)
                self.logger.info(f"Cleaned up old backup: {backup.backup_id}")
            except Exception as e:
                self.logger.error(f"Failed to clean up backup {backup.backup_id}: {e}")
    
    def _generate_backup_id(self, backup_type: BackupType) -> str:
        """Generate a unique backup ID."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        return f"{backup_type.value}_{timestamp}"
    
    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum of a file."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    def _get_directory_size(self, path: Path) -> int:
        """Get total size of directory in bytes."""
        total_size = 0
        for item in path.rglob('*'):
            if item.is_file():
                total_size += item.stat().st_size
        return total_size
    
    def _load_backup_registry(self) -> None:
        """Load backup registry from disk."""
        registry_file = self.backup_root / "backup_registry.json"
        
        if not registry_file.exists():
            return
        
        try:
            with open(registry_file, 'r') as f:
                registry_data = json.load(f)
            
            for backup_id, backup_data in registry_data.items():
                metadata = BackupMetadata(
                    backup_id=backup_data['backup_id'],
                    backup_type=BackupType(backup_data['backup_type']),
                    status=BackupStatus(backup_data['status']),
                    created_at=datetime.fromisoformat(backup_data['created_at']),
                    completed_at=datetime.fromisoformat(backup_data['completed_at']) if backup_data['completed_at'] else None,
                    file_path=backup_data['file_path'],
                    file_size=backup_data['file_size'],
                    checksum=backup_data['checksum'],
                    compression_ratio=backup_data['compression_ratio'],
                    includes=backup_data['includes'],
                    excludes=backup_data['excludes'],
                    error_message=backup_data.get('error_message'),
                    verification_status=backup_data.get('verification_status')
                )
                self.backups[backup_id] = metadata
            
            self.logger.info(f"Loaded {len(self.backups)} backups from registry")
            
        except Exception as e:
            self.logger.error(f"Failed to load backup registry: {e}")
    
    def _save_backup_registry(self) -> None:
        """Save backup registry to disk."""
        registry_file = self.backup_root / "backup_registry.json"
        
        try:
            registry_data = {
                backup_id: metadata.to_dict()
                for backup_id, metadata in self.backups.items()
            }
            
            with open(registry_file, 'w') as f:
                json.dump(registry_data, f, indent=2)
            
        except Exception as e:
            self.logger.error(f"Failed to save backup registry: {e}")
    
    def get_backup_status(self) -> Dict[str, Any]:
        """Get current backup status."""
        return {
            'is_running': self.is_running,
            'total_backups': len(self.backups),
            'active_backups': len(self.active_backups),
            'last_full_backup': self.last_full_backup.isoformat() if self.last_full_backup else None,
            'last_incremental_backup': self.last_incremental_backup.isoformat() if self.last_incremental_backup else None,
            'backup_storage_path': str(self.backup_root),
            'config': {
                'scheduled_backups_enabled': self.config.enable_scheduled_backups,
                'full_backup_interval_hours': self.config.full_backup_interval_hours,
                'incremental_backup_interval_hours': self.config.incremental_backup_interval_hours,
                'max_backup_age_days': self.config.max_backup_age_days,
                'max_backup_count': self.config.max_backup_count
            }
        }