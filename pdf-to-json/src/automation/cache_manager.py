"""
Cache Manager with Redis integration for football data processing automation.

This module provides comprehensive caching functionality with Redis backend,
including cache strategies for team normalization and market classification,
TTL management, invalidation patterns, and statistics monitoring.
"""

import json
import time
import asyncio
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union, Pattern, Callable
from dataclasses import dataclass, field
from enum import Enum
import re

import redis.asyncio as redis
from redis.asyncio import ConnectionPool
from redis.exceptions import RedisError, ConnectionError as RedisConnectionError

from .exceptions import AutomationError
from .config import CacheConfig


logger = logging.getLogger(__name__)


class CacheStrategy(Enum):
    """Cache strategy types."""
    TEAM_NORMALIZATION = "team_normalization"
    MARKET_CLASSIFICATION = "market_classification"
    PROCESSING_RESULTS = "processing_results"
    CONFIGURATION = "configuration"
    CUSTOM = "custom"


@dataclass
class CacheStats:
    """Cache statistics for monitoring."""
    total_requests: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    total_keys: int = 0
    memory_usage_bytes: int = 0
    hit_ratio: float = 0.0
    average_ttl: float = 0.0
    expired_keys_last_hour: int = 0
    evicted_keys_last_hour: int = 0
    last_updated: datetime = field(default_factory=datetime.now)
    
    def calculate_hit_ratio(self) -> float:
        """Calculate cache hit ratio."""
        if self.total_requests == 0:
            return 0.0
        self.hit_ratio = (self.cache_hits / self.total_requests) * 100
        return self.hit_ratio
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert stats to dictionary."""
        return {
            'total_requests': self.total_requests,
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'total_keys': self.total_keys,
            'memory_usage_bytes': self.memory_usage_bytes,
            'hit_ratio': self.hit_ratio,
            'average_ttl': self.average_ttl,
            'expired_keys_last_hour': self.expired_keys_last_hour,
            'evicted_keys_last_hour': self.evicted_keys_last_hour,
            'last_updated': self.last_updated.isoformat()
        }


@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    key: str
    value: Any
    ttl: int
    created_at: datetime
    accessed_at: datetime
    access_count: int = 0
    strategy: CacheStrategy = CacheStrategy.CUSTOM
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        if self.ttl <= 0:
            return False
        return datetime.now() > self.created_at + timedelta(seconds=self.ttl)
    
    def touch(self) -> None:
        """Update access information."""
        self.accessed_at = datetime.now()
        self.access_count += 1


class CacheManager:
    """
    Redis-based cache manager with advanced features.
    
    Provides caching functionality with connection pooling, cache strategies,
    TTL management, invalidation patterns, and comprehensive statistics.
    """
    
    def __init__(self, config: CacheConfig):
        """
        Initialize cache manager.
        
        Args:
            config: Cache configuration
        """
        self.config = config
        self.redis_client: Optional[redis.Redis] = None
        self.connection_pool: Optional[ConnectionPool] = None
        self.stats = CacheStats()
        self.local_cache: Dict[str, CacheEntry] = {}
        self.max_local_cache_size = config.max_memory_cache_size
        self.compression_enabled = config.enable_compression
        
        # Cache key prefixes for different strategies
        self.key_prefixes = {
            CacheStrategy.TEAM_NORMALIZATION: "team_norm:",
            CacheStrategy.MARKET_CLASSIFICATION: "market_class:",
            CacheStrategy.PROCESSING_RESULTS: "proc_result:",
            CacheStrategy.CONFIGURATION: "config:",
            CacheStrategy.CUSTOM: "custom:"
        }
        
        # Invalidation patterns
        self.invalidation_patterns: Dict[str, List[Pattern]] = {}
        
        # Statistics tracking
        self._stats_lock = asyncio.Lock()
        self._last_stats_update = datetime.now()
        
        logger.info(f"CacheManager initialized with Redis URL: {config.redis_url}")
    
    async def connect(self) -> None:
        """Establish Redis connection with connection pooling."""
        try:
            # Create connection pool
            self.connection_pool = ConnectionPool.from_url(
                self.config.redis_url,
                max_connections=self.config.connection_pool_size,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
            # Create Redis client
            self.redis_client = redis.Redis(
                connection_pool=self.connection_pool,
                decode_responses=True
            )
            
            # Test connection
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis")
            
            # Initialize cache statistics
            await self._initialize_stats()
            
        except RedisConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            if not self.config.enabled:
                logger.warning("Cache disabled, falling back to local cache only")
            else:
                raise AutomationError(f"Redis connection failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error connecting to Redis: {e}")
            raise AutomationError(f"Cache initialization failed: {e}")
    
    async def disconnect(self) -> None:
        """Close Redis connection and cleanup resources."""
        try:
            if self.redis_client:
                await self.redis_client.close()
            if self.connection_pool:
                await self.connection_pool.disconnect()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
    
    async def get(self, key: str, strategy: CacheStrategy = CacheStrategy.CUSTOM) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
            strategy: Cache strategy to use
            
        Returns:
            Cached value or None if not found
        """
        full_key = self._build_key(key, strategy)
        
        try:
            # Update statistics
            async with self._stats_lock:
                self.stats.total_requests += 1
            
            # Try local cache first
            if full_key in self.local_cache:
                entry = self.local_cache[full_key]
                if not entry.is_expired():
                    entry.touch()
                    async with self._stats_lock:
                        self.stats.cache_hits += 1
                    logger.debug(f"Cache hit (local): {full_key}")
                    return entry.value
                else:
                    # Remove expired entry
                    del self.local_cache[full_key]
            
            # Try Redis cache
            if self.redis_client and self.config.enabled:
                value = await self.redis_client.get(full_key)
                if value is not None:
                    # Deserialize value
                    deserialized_value = self._deserialize_value(value)
                    
                    # Store in local cache
                    await self._store_local_cache(full_key, deserialized_value, strategy)
                    
                    async with self._stats_lock:
                        self.stats.cache_hits += 1
                    logger.debug(f"Cache hit (Redis): {full_key}")
                    return deserialized_value
            
            # Cache miss
            async with self._stats_lock:
                self.stats.cache_misses += 1
            logger.debug(f"Cache miss: {full_key}")
            return None
            
        except RedisError as e:
            logger.error(f"Redis error getting key {full_key}: {e}")
            async with self._stats_lock:
                self.stats.cache_misses += 1
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting key {full_key}: {e}")
            async with self._stats_lock:
                self.stats.cache_misses += 1
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        strategy: CacheStrategy = CacheStrategy.CUSTOM
    ) -> bool:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (uses strategy default if None)
            strategy: Cache strategy to use
            
        Returns:
            True if successful, False otherwise
        """
        full_key = self._build_key(key, strategy)
        effective_ttl = ttl or self._get_strategy_ttl(strategy)
        
        try:
            # Serialize value
            serialized_value = self._serialize_value(value)
            
            # Store in Redis
            if self.redis_client and self.config.enabled:
                if effective_ttl > 0:
                    await self.redis_client.setex(full_key, effective_ttl, serialized_value)
                else:
                    await self.redis_client.set(full_key, serialized_value)
            
            # Store in local cache
            await self._store_local_cache(full_key, value, strategy, effective_ttl)
            
            logger.debug(f"Cache set: {full_key} (TTL: {effective_ttl}s)")
            return True
            
        except RedisError as e:
            logger.error(f"Redis error setting key {full_key}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error setting key {full_key}: {e}")
            return False
    
    async def delete(self, key: str, strategy: CacheStrategy = CacheStrategy.CUSTOM) -> bool:
        """
        Delete key from cache.
        
        Args:
            key: Cache key
            strategy: Cache strategy to use
            
        Returns:
            True if successful, False otherwise
        """
        full_key = self._build_key(key, strategy)
        
        try:
            # Remove from local cache
            if full_key in self.local_cache:
                del self.local_cache[full_key]
            
            # Remove from Redis
            if self.redis_client and self.config.enabled:
                result = await self.redis_client.delete(full_key)
                logger.debug(f"Cache delete: {full_key} (existed: {result > 0})")
                return result > 0
            
            return True
            
        except RedisError as e:
            logger.error(f"Redis error deleting key {full_key}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting key {full_key}: {e}")
            return False
    
    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate cache keys matching a pattern.
        
        Args:
            pattern: Pattern to match (supports Redis SCAN patterns)
            
        Returns:
            Number of keys invalidated
        """
        try:
            invalidated_count = 0
            
            # Invalidate from local cache
            keys_to_remove = []
            pattern_regex = re.compile(pattern.replace('*', '.*').replace('?', '.'))
            
            for key in self.local_cache.keys():
                if pattern_regex.match(key):
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self.local_cache[key]
                invalidated_count += 1
            
            # Invalidate from Redis
            if self.redis_client and self.config.enabled:
                cursor = 0
                while True:
                    cursor, keys = await self.redis_client.scan(cursor, match=pattern, count=100)
                    if keys:
                        deleted = await self.redis_client.delete(*keys)
                        invalidated_count += deleted
                    if cursor == 0:
                        break
            
            logger.info(f"Invalidated {invalidated_count} keys matching pattern: {pattern}")
            return invalidated_count
            
        except RedisError as e:
            logger.error(f"Redis error invalidating pattern {pattern}: {e}")
            return 0
        except Exception as e:
            logger.error(f"Unexpected error invalidating pattern {pattern}: {e}")
            return 0
    
    async def clear_strategy(self, strategy: CacheStrategy) -> int:
        """
        Clear all cache entries for a specific strategy.
        
        Args:
            strategy: Cache strategy to clear
            
        Returns:
            Number of keys cleared
        """
        prefix = self.key_prefixes[strategy]
        pattern = f"{prefix}*"
        return await self.invalidate_pattern(pattern)
    
    async def clear_all(self) -> bool:
        """
        Clear all cache entries.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Clear local cache
            self.local_cache.clear()
            
            # Clear Redis cache
            if self.redis_client and self.config.enabled:
                await self.redis_client.flushdb()
            
            logger.info("All cache entries cleared")
            return True
            
        except RedisError as e:
            logger.error(f"Redis error clearing cache: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error clearing cache: {e}")
            return False
    
    async def get_stats(self) -> CacheStats:
        """
        Get comprehensive cache statistics.
        
        Returns:
            Cache statistics
        """
        try:
            # Update Redis statistics
            if self.redis_client and self.config.enabled:
                info = await self.redis_client.info('memory')
                keyspace_info = await self.redis_client.info('keyspace')
                
                # Update memory usage
                self.stats.memory_usage_bytes = info.get('used_memory', 0)
                
                # Update key count
                db_info = keyspace_info.get('db0', {})
                if isinstance(db_info, dict):
                    self.stats.total_keys = db_info.get('keys', 0)
                elif isinstance(db_info, str):
                    # Parse "keys=X,expires=Y,avg_ttl=Z" format
                    parts = db_info.split(',')
                    for part in parts:
                        if part.startswith('keys='):
                            self.stats.total_keys = int(part.split('=')[1])
                        elif part.startswith('avg_ttl='):
                            self.stats.average_ttl = float(part.split('=')[1]) / 1000  # Convert to seconds
            
            # Add local cache keys
            self.stats.total_keys += len(self.local_cache)
            
            # Calculate hit ratio
            self.stats.calculate_hit_ratio()
            self.stats.last_updated = datetime.now()
            
            return self.stats
            
        except Exception as e:
            logger.error(f"Error getting cache statistics: {e}")
            return self.stats
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform cache health check.
        
        Returns:
            Health check results
        """
        health_status = {
            'redis_connected': False,
            'local_cache_size': len(self.local_cache),
            'config_enabled': self.config.enabled,
            'last_error': None,
            'response_time_ms': None
        }
        
        try:
            if self.redis_client and self.config.enabled:
                start_time = time.time()
                await self.redis_client.ping()
                response_time = (time.time() - start_time) * 1000
                
                health_status['redis_connected'] = True
                health_status['response_time_ms'] = round(response_time, 2)
            
        except Exception as e:
            health_status['last_error'] = str(e)
            logger.error(f"Cache health check failed: {e}")
        
        return health_status
    
    def register_invalidation_pattern(self, event_type: str, patterns: List[str]) -> None:
        """
        Register invalidation patterns for specific events.
        
        Args:
            event_type: Type of event that triggers invalidation
            patterns: List of cache key patterns to invalidate
        """
        compiled_patterns = [re.compile(pattern.replace('*', '.*').replace('?', '.')) for pattern in patterns]
        self.invalidation_patterns[event_type] = compiled_patterns
        logger.info(f"Registered {len(patterns)} invalidation patterns for event: {event_type}")
    
    async def trigger_invalidation(self, event_type: str, context: Dict[str, Any] = None) -> int:
        """
        Trigger cache invalidation based on event type.
        
        Args:
            event_type: Type of event
            context: Additional context for pattern matching
            
        Returns:
            Number of keys invalidated
        """
        if event_type not in self.invalidation_patterns:
            logger.debug(f"No invalidation patterns registered for event: {event_type}")
            return 0
        
        total_invalidated = 0
        patterns = self.invalidation_patterns[event_type]
        
        for pattern in patterns:
            # Apply context substitution if provided
            pattern_str = pattern.pattern
            if context:
                for key, value in context.items():
                    pattern_str = pattern_str.replace(f"{{{key}}}", str(value))
            
            invalidated = await self.invalidate_pattern(pattern_str)
            total_invalidated += invalidated
        
        logger.info(f"Event '{event_type}' triggered invalidation of {total_invalidated} keys")
        return total_invalidated
    
    def _build_key(self, key: str, strategy: CacheStrategy) -> str:
        """Build full cache key with strategy prefix."""
        prefix = self.key_prefixes[strategy]
        return f"{prefix}{key}"
    
    def _get_strategy_ttl(self, strategy: CacheStrategy) -> int:
        """Get TTL for cache strategy."""
        if strategy.value in self.config.cache_strategies:
            return self.config.cache_strategies[strategy.value]
        return self.config.default_ttl
    
    def _serialize_value(self, value: Any) -> str:
        """Serialize value for storage."""
        try:
            serialized = json.dumps(value, default=str, ensure_ascii=False)
            
            # Apply compression if enabled
            if self.compression_enabled and len(serialized) > 1024:  # Only compress larger values
                import gzip
                import base64
                compressed = gzip.compress(serialized.encode('utf-8'))
                return f"GZIP:{base64.b64encode(compressed).decode('ascii')}"
            
            return serialized
        except Exception as e:
            logger.error(f"Error serializing value: {e}")
            raise
    
    def _deserialize_value(self, serialized: str) -> Any:
        """Deserialize value from storage."""
        try:
            # Handle compressed values
            if serialized.startswith("GZIP:"):
                import gzip
                import base64
                compressed_data = base64.b64decode(serialized[5:])
                decompressed = gzip.decompress(compressed_data).decode('utf-8')
                return json.loads(decompressed)
            
            return json.loads(serialized)
        except Exception as e:
            logger.error(f"Error deserializing value: {e}")
            raise
    
    async def _store_local_cache(
        self,
        key: str,
        value: Any,
        strategy: CacheStrategy,
        ttl: int = None
    ) -> None:
        """Store entry in local cache with size management."""
        if len(self.local_cache) >= self.max_local_cache_size:
            # Remove oldest entries (simple LRU)
            oldest_key = min(
                self.local_cache.keys(),
                key=lambda k: self.local_cache[k].accessed_at
            )
            del self.local_cache[oldest_key]
        
        effective_ttl = ttl or self._get_strategy_ttl(strategy)
        entry = CacheEntry(
            key=key,
            value=value,
            ttl=effective_ttl,
            created_at=datetime.now(),
            accessed_at=datetime.now(),
            strategy=strategy
        )
        
        self.local_cache[key] = entry
    
    async def _initialize_stats(self) -> None:
        """Initialize cache statistics."""
        try:
            # Reset statistics
            self.stats = CacheStats()
            self.stats.last_updated = datetime.now()
            
            # Get initial Redis stats if available
            if self.redis_client and self.config.enabled:
                await self.get_stats()
            
            logger.info("Cache statistics initialized")
        except Exception as e:
            logger.error(f"Error initializing cache statistics: {e}")


# Convenience functions for common cache operations

async def cache_team_normalization(
    cache_manager: CacheManager,
    team_name: str,
    normalized_name: str,
    confidence_score: float = 1.0
) -> bool:
    """
    Cache team normalization result.
    
    Args:
        cache_manager: Cache manager instance
        team_name: Original team name
        normalized_name: Normalized team name
        confidence_score: Confidence score for normalization
        
    Returns:
        True if cached successfully
    """
    cache_key = f"team:{hashlib.md5(team_name.encode()).hexdigest()}"
    cache_value = {
        'original': team_name,
        'normalized': normalized_name,
        'confidence': confidence_score,
        'cached_at': datetime.now().isoformat()
    }
    
    return await cache_manager.set(
        cache_key,
        cache_value,
        strategy=CacheStrategy.TEAM_NORMALIZATION
    )


async def get_cached_team_normalization(
    cache_manager: CacheManager,
    team_name: str
) -> Optional[Dict[str, Any]]:
    """
    Get cached team normalization result.
    
    Args:
        cache_manager: Cache manager instance
        team_name: Original team name
        
    Returns:
        Cached normalization data or None
    """
    cache_key = f"team:{hashlib.md5(team_name.encode()).hexdigest()}"
    return await cache_manager.get(cache_key, strategy=CacheStrategy.TEAM_NORMALIZATION)


async def cache_market_classification(
    cache_manager: CacheManager,
    market_text: str,
    classification: Dict[str, Any]
) -> bool:
    """
    Cache market classification result.
    
    Args:
        cache_manager: Cache manager instance
        market_text: Original market text
        classification: Market classification data
        
    Returns:
        True if cached successfully
    """
    cache_key = f"market:{hashlib.md5(market_text.encode()).hexdigest()}"
    cache_value = {
        'original': market_text,
        'classification': classification,
        'cached_at': datetime.now().isoformat()
    }
    
    return await cache_manager.set(
        cache_key,
        cache_value,
        strategy=CacheStrategy.MARKET_CLASSIFICATION
    )


async def get_cached_market_classification(
    cache_manager: CacheManager,
    market_text: str
) -> Optional[Dict[str, Any]]:
    """
    Get cached market classification result.
    
    Args:
        cache_manager: Cache manager instance
        market_text: Original market text
        
    Returns:
        Cached classification data or None
    """
    cache_key = f"market:{hashlib.md5(market_text.encode()).hexdigest()}"
    return await cache_manager.get(cache_key, strategy=CacheStrategy.MARKET_CLASSIFICATION)