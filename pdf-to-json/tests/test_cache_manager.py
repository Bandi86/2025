"""
Unit tests for CacheManager with Redis integration.

Tests cache operations, invalidation scenarios, statistics monitoring,
and various cache strategies.
"""

import pytest
import asyncio
import json
import time
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any

from src.automation.cache_manager import (
    CacheManager, CacheStrategy, CacheStats, CacheEntry,
    cache_team_normalization, get_cached_team_normalization,
    cache_market_classification, get_cached_market_classification
)
from src.automation.config import CacheConfig
from src.automation.exceptions import AutomationError


@pytest.fixture
def cache_config():
    """Create test cache configuration."""
    return CacheConfig(
        enabled=True,
        redis_url="redis://localhost:6379/1",  # Use test database
        default_ttl=3600,
        max_memory_cache_size=100,
        cache_strategies={
            "team_normalization": 86400,
            "market_classification": 43200,
            "processing_results": 3600,
            "configuration": 1800
        },
        enable_compression=True,
        connection_pool_size=5
    )


@pytest.fixture
def disabled_cache_config():
    """Create disabled cache configuration for fallback testing."""
    config = CacheConfig()
    config.enabled = False
    return config


@pytest.fixture
def cache_manager(cache_config):
    """Create cache manager instance for testing."""
    manager = CacheManager(cache_config)
    
    # Mock Redis client for testing
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.setex = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=1)
    mock_redis.scan = AsyncMock(return_value=(0, []))
    mock_redis.flushdb = AsyncMock(return_value=True)
    mock_redis.info = AsyncMock(return_value={})
    mock_redis.close = AsyncMock()
    
    manager.redis_client = mock_redis
    manager.connection_pool = Mock()
    manager.connection_pool.disconnect = AsyncMock()
    
    return manager


@pytest.fixture
def cache_manager_no_redis(disabled_cache_config):
    """Create cache manager without Redis for local cache testing."""
    manager = CacheManager(disabled_cache_config)
    return manager


class TestCacheManagerInitialization:
    """Test cache manager initialization and connection."""
    
    def test_cache_manager_init(self, cache_config):
        """Test cache manager initialization."""
        manager = CacheManager(cache_config)
        
        assert manager.config == cache_config
        assert manager.redis_client is None
        assert manager.connection_pool is None
        assert isinstance(manager.stats, CacheStats)
        assert manager.local_cache == {}
        assert manager.max_local_cache_size == cache_config.max_memory_cache_size
        assert manager.compression_enabled == cache_config.enable_compression
    
    @patch('redis.asyncio.ConnectionPool.from_url')
    @patch('redis.asyncio.Redis')
    @pytest.mark.asyncio
    async def test_connect_success(self, mock_redis_class, mock_pool_class, cache_config):
        """Test successful Redis connection."""
        # Setup mocks
        mock_pool = Mock()
        mock_pool_class.return_value = mock_pool
        
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.info = AsyncMock(return_value={})
        mock_redis_class.return_value = mock_redis
        
        manager = CacheManager(cache_config)
        await manager.connect()
        
        assert manager.redis_client == mock_redis
        assert manager.connection_pool == mock_pool
        mock_redis.ping.assert_called_once()
    
    @patch('redis.asyncio.ConnectionPool.from_url')
    @pytest.mark.asyncio
    async def test_connect_failure(self, mock_pool_class, cache_config):
        """Test Redis connection failure."""
        mock_pool_class.side_effect = Exception("Connection failed")
        
        manager = CacheManager(cache_config)
        
        with pytest.raises(AutomationError, match="Cache initialization failed"):
            await manager.connect()
    
    @pytest.mark.asyncio
    async def test_disconnect(self, cache_manager):
        """Test Redis disconnection."""
        await cache_manager.disconnect()
        
        cache_manager.redis_client.close.assert_called_once()
        cache_manager.connection_pool.disconnect.assert_called_once()


class TestCacheOperations:
    """Test basic cache operations."""
    
    @pytest.mark.asyncio
    async def test_set_and_get_success(self, cache_manager):
        """Test successful cache set and get operations."""
        key = "test_key"
        value = {"data": "test_value", "number": 42}
        
        # Mock Redis responses
        cache_manager.redis_client.setex = AsyncMock(return_value=True)
        cache_manager.redis_client.get = AsyncMock(return_value=json.dumps(value))
        
        # Test set
        result = await cache_manager.set(key, value, ttl=3600)
        assert result is True
        
        # Clear local cache to force Redis lookup
        cache_manager.local_cache.clear()
        
        # Test get
        retrieved_value = await cache_manager.get(key)
        assert retrieved_value == value
        
        # Verify Redis calls
        cache_manager.redis_client.setex.assert_called_once()
        cache_manager.redis_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_cache_miss(self, cache_manager):
        """Test cache miss scenario."""
        key = "nonexistent_key"
        
        # Mock Redis response for cache miss
        cache_manager.redis_client.get = AsyncMock(return_value=None)
        
        result = await cache_manager.get(key)
        assert result is None
        
        # Check statistics
        assert cache_manager.stats.cache_misses > 0
        assert cache_manager.stats.total_requests > 0
    
    @pytest.mark.asyncio
    async def test_delete_success(self, cache_manager):
        """Test successful cache deletion."""
        key = "test_key"
        
        # Mock Redis response
        cache_manager.redis_client.delete = AsyncMock(return_value=1)
        
        result = await cache_manager.delete(key)
        assert result is True
        
        cache_manager.redis_client.delete.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_cache_strategies(self, cache_manager):
        """Test different cache strategies."""
        strategies = [
            CacheStrategy.TEAM_NORMALIZATION,
            CacheStrategy.MARKET_CLASSIFICATION,
            CacheStrategy.PROCESSING_RESULTS,
            CacheStrategy.CONFIGURATION
        ]
        
        for strategy in strategies:
            key = f"test_key_{strategy.value}"
            value = f"test_value_{strategy.value}"
            
            # Mock Redis response
            cache_manager.redis_client.setex = AsyncMock(return_value=True)
            
            result = await cache_manager.set(key, value, strategy=strategy)
            assert result is True
            
            # Verify the key was built with correct prefix
            expected_prefix = cache_manager.key_prefixes[strategy]
            expected_key = f"{expected_prefix}{key}"
            
            # Check that setex was called with the prefixed key
            call_args = cache_manager.redis_client.setex.call_args
            assert call_args[0][0] == expected_key


class TestLocalCache:
    """Test local cache functionality."""
    
    @pytest.mark.asyncio
    async def test_local_cache_hit(self, cache_manager_no_redis):
        """Test local cache hit without Redis."""
        key = "test_key"
        value = {"local": "cache_test"}
        
        # Set in cache
        await cache_manager_no_redis.set(key, value)
        
        # Get from cache (should hit local cache)
        result = await cache_manager_no_redis.get(key)
        assert result == value
        
        # Check statistics
        assert cache_manager_no_redis.stats.cache_hits > 0
    
    @pytest.mark.asyncio
    async def test_local_cache_expiration(self, cache_manager_no_redis):
        """Test local cache entry expiration."""
        key = "expiring_key"
        value = "expiring_value"
        
        # Set with very short TTL
        await cache_manager_no_redis.set(key, value, ttl=1)
        
        # Should be available immediately
        result = await cache_manager_no_redis.get(key)
        assert result == value
        
        # Wait for expiration
        await asyncio.sleep(1.1)
        
        # Should be expired now
        result = await cache_manager_no_redis.get(key)
        assert result is None
    
    @pytest.mark.asyncio
    async def test_local_cache_size_limit(self, cache_manager_no_redis):
        """Test local cache size management."""
        # Set cache size limit to 3 for testing
        cache_manager_no_redis.max_local_cache_size = 3
        
        # Add entries up to limit
        for i in range(5):
            await cache_manager_no_redis.set(f"key_{i}", f"value_{i}")
        
        # Should only have 3 entries (LRU eviction)
        assert len(cache_manager_no_redis.local_cache) == 3
        
        # Oldest entries should be evicted
        result = await cache_manager_no_redis.get("key_0")
        assert result is None
        
        # Newest entries should still be there
        result = await cache_manager_no_redis.get("key_4")
        assert result == "value_4"


class TestCacheInvalidation:
    """Test cache invalidation patterns."""
    
    @pytest.mark.asyncio
    async def test_invalidate_pattern(self, cache_manager):
        """Test pattern-based cache invalidation."""
        # Setup test data in local cache
        test_keys = ["user:123", "user:456", "product:789", "user:999"]
        for key in test_keys:
            cache_manager.local_cache[key] = CacheEntry(
                key=key,
                value=f"value_{key}",
                ttl=3600,
                created_at=datetime.now(),
                accessed_at=datetime.now(),
                strategy=CacheStrategy.CUSTOM
            )
        
        # Mock Redis scan response
        cache_manager.redis_client.scan = AsyncMock(return_value=(0, ["user:111", "user:222"]))
        cache_manager.redis_client.delete = AsyncMock(return_value=2)
        
        # Invalidate user pattern
        result = await cache_manager.invalidate_pattern("user:*")
        
        # Should invalidate local cache entries matching pattern
        assert "user:123" not in cache_manager.local_cache
        assert "user:456" not in cache_manager.local_cache
        assert "user:999" not in cache_manager.local_cache
        assert "product:789" in cache_manager.local_cache  # Should remain
        
        # Should call Redis scan and delete
        cache_manager.redis_client.scan.assert_called()
        cache_manager.redis_client.delete.assert_called()
        
        assert result > 0  # Should return count of invalidated keys
    
    @pytest.mark.asyncio
    async def test_clear_strategy(self, cache_manager):
        """Test clearing cache by strategy."""
        strategy = CacheStrategy.TEAM_NORMALIZATION
        
        # Mock invalidate_pattern
        with patch.object(cache_manager, 'invalidate_pattern', return_value=5) as mock_invalidate:
            result = await cache_manager.clear_strategy(strategy)
            
            expected_pattern = f"{cache_manager.key_prefixes[strategy]}*"
            mock_invalidate.assert_called_once_with(expected_pattern)
            assert result == 5
    
    @pytest.mark.asyncio
    async def test_clear_all(self, cache_manager):
        """Test clearing all cache entries."""
        # Add some local cache entries
        cache_manager.local_cache["test1"] = Mock()
        cache_manager.local_cache["test2"] = Mock()
        
        result = await cache_manager.clear_all()
        
        assert result is True
        assert len(cache_manager.local_cache) == 0
        cache_manager.redis_client.flushdb.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_invalidation_patterns(self, cache_manager):
        """Test event-based invalidation patterns."""
        # Register invalidation patterns
        patterns = ["team_norm:*", "config:teams:*"]
        cache_manager.register_invalidation_pattern("team_update", patterns)
        
        assert "team_update" in cache_manager.invalidation_patterns
        assert len(cache_manager.invalidation_patterns["team_update"]) == 2
        
        # Mock invalidate_pattern
        with patch.object(cache_manager, 'invalidate_pattern', return_value=3) as mock_invalidate:
            result = await cache_manager.trigger_invalidation("team_update")
            
            assert result == 6  # 3 * 2 patterns
            assert mock_invalidate.call_count == 2


class TestCacheStatistics:
    """Test cache statistics and monitoring."""
    
    @pytest.mark.asyncio
    async def test_stats_initialization(self, cache_manager):
        """Test cache statistics initialization."""
        stats = cache_manager.stats
        
        assert stats.total_requests == 0
        assert stats.cache_hits == 0
        assert stats.cache_misses == 0
        assert stats.hit_ratio == 0.0
        assert isinstance(stats.last_updated, datetime)
    
    @pytest.mark.asyncio
    async def test_stats_tracking(self, cache_manager):
        """Test statistics tracking during operations."""
        # Mock Redis responses
        cache_manager.redis_client.get = AsyncMock(return_value=None)  # Cache miss
        cache_manager.redis_client.setex = AsyncMock(return_value=True)
        
        # Perform operations
        await cache_manager.get("key1")  # Miss
        await cache_manager.set("key1", "value1")
        
        # Add to local cache and test hit
        cache_manager.local_cache["custom:key2"] = CacheEntry(
            key="key2",
            value="value2",
            ttl=3600,
            created_at=datetime.now(),
            accessed_at=datetime.now(),
            strategy=CacheStrategy.CUSTOM
        )
        await cache_manager.get("key2")  # Hit
        
        stats = cache_manager.stats
        stats.calculate_hit_ratio()  # Manually calculate hit ratio
        assert stats.total_requests == 2
        assert stats.cache_hits == 1
        assert stats.cache_misses == 1
        assert stats.hit_ratio == 50.0
    
    @pytest.mark.asyncio
    async def test_get_stats_with_redis_info(self, cache_manager):
        """Test getting comprehensive statistics with Redis info."""
        # Mock Redis info responses
        memory_info = {'used_memory': 1024000}
        keyspace_info = {'db0': 'keys=150,expires=100,avg_ttl=3600000'}
        
        cache_manager.redis_client.info = AsyncMock(side_effect=[memory_info, keyspace_info])
        
        stats = await cache_manager.get_stats()
        
        assert stats.memory_usage_bytes == 1024000
        assert stats.total_keys >= 150  # Includes local cache
        assert isinstance(stats.last_updated, datetime)
    
    def test_cache_stats_to_dict(self):
        """Test cache statistics dictionary conversion."""
        stats = CacheStats(
            total_requests=100,
            cache_hits=75,
            cache_misses=25,
            total_keys=50,
            memory_usage_bytes=2048000
        )
        stats.calculate_hit_ratio()
        
        stats_dict = stats.to_dict()
        
        assert stats_dict['total_requests'] == 100
        assert stats_dict['cache_hits'] == 75
        assert stats_dict['cache_misses'] == 25
        assert stats_dict['hit_ratio'] == 75.0
        assert stats_dict['total_keys'] == 50
        assert stats_dict['memory_usage_bytes'] == 2048000
        assert 'last_updated' in stats_dict


class TestCacheHealthCheck:
    """Test cache health check functionality."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, cache_manager):
        """Test successful health check."""
        # Mock successful ping
        cache_manager.redis_client.ping = AsyncMock(return_value=True)
        
        health = await cache_manager.health_check()
        
        assert health['redis_connected'] is True
        assert health['config_enabled'] is True
        assert health['local_cache_size'] == 0
        assert health['last_error'] is None
        assert health['response_time_ms'] is not None
        assert health['response_time_ms'] >= 0
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, cache_manager):
        """Test health check with Redis failure."""
        # Mock Redis failure
        cache_manager.redis_client.ping = AsyncMock(side_effect=Exception("Connection failed"))
        
        health = await cache_manager.health_check()
        
        assert health['redis_connected'] is False
        assert health['last_error'] == "Connection failed"
        assert health['response_time_ms'] is None
    
    @pytest.mark.asyncio
    async def test_health_check_disabled_cache(self, cache_manager_no_redis):
        """Test health check with disabled cache."""
        health = await cache_manager_no_redis.health_check()
        
        assert health['redis_connected'] is False
        assert health['config_enabled'] is False
        assert health['local_cache_size'] == 0


class TestCacheCompression:
    """Test cache compression functionality."""
    
    @pytest.mark.asyncio
    async def test_compression_large_value(self, cache_manager):
        """Test compression for large values."""
        # Create large value that should trigger compression
        large_value = {"data": "x" * 2000, "numbers": list(range(1000))}
        
        # Test serialization with compression
        serialized = cache_manager._serialize_value(large_value)
        assert serialized.startswith("GZIP:")
        
        # Test deserialization
        deserialized = cache_manager._deserialize_value(serialized)
        assert deserialized == large_value
    
    @pytest.mark.asyncio
    async def test_no_compression_small_value(self, cache_manager):
        """Test no compression for small values."""
        small_value = {"data": "small"}
        
        serialized = cache_manager._serialize_value(small_value)
        assert not serialized.startswith("GZIP:")
        
        deserialized = cache_manager._deserialize_value(serialized)
        assert deserialized == small_value


class TestConvenienceFunctions:
    """Test convenience functions for common cache operations."""
    
    @pytest.mark.asyncio
    async def test_cache_team_normalization(self, cache_manager):
        """Test team normalization caching convenience function."""
        team_name = "Real Madrid CF"
        normalized_name = "Real Madrid"
        confidence_score = 0.95
        
        # Mock Redis response
        cache_manager.redis_client.setex = AsyncMock(return_value=True)
        
        result = await cache_team_normalization(
            cache_manager, team_name, normalized_name, confidence_score
        )
        
        assert result is True
        cache_manager.redis_client.setex.assert_called_once()
        
        # Verify the call was made with team normalization strategy
        call_args = cache_manager.redis_client.setex.call_args
        assert "team_norm:" in call_args[0][0]  # Key should have team normalization prefix
    
    @pytest.mark.asyncio
    async def test_get_cached_team_normalization(self, cache_manager):
        """Test getting cached team normalization."""
        team_name = "Barcelona FC"
        cached_data = {
            'original': team_name,
            'normalized': 'Barcelona',
            'confidence': 0.98,
            'cached_at': datetime.now().isoformat()
        }
        
        # Mock Redis response
        cache_manager.redis_client.get = AsyncMock(return_value=json.dumps(cached_data))
        
        # Clear local cache to force Redis lookup
        cache_manager.local_cache.clear()
        
        result = await get_cached_team_normalization(cache_manager, team_name)
        
        assert result == cached_data
        assert result['original'] == team_name
        assert result['normalized'] == 'Barcelona'
        assert result['confidence'] == 0.98
    
    @pytest.mark.asyncio
    async def test_cache_market_classification(self, cache_manager):
        """Test market classification caching convenience function."""
        market_text = "1X2 Full Time"
        classification = {
            'type': 'match_result',
            'category': 'main',
            'subcategory': 'full_time'
        }
        
        # Mock Redis response
        cache_manager.redis_client.setex = AsyncMock(return_value=True)
        
        result = await cache_market_classification(
            cache_manager, market_text, classification
        )
        
        assert result is True
        cache_manager.redis_client.setex.assert_called_once()
        
        # Verify the call was made with market classification strategy
        call_args = cache_manager.redis_client.setex.call_args
        assert "market_class:" in call_args[0][0]  # Key should have market classification prefix
    
    @pytest.mark.asyncio
    async def test_get_cached_market_classification(self, cache_manager):
        """Test getting cached market classification."""
        market_text = "Over/Under 2.5 Goals"
        cached_data = {
            'original': market_text,
            'classification': {
                'type': 'goals',
                'category': 'totals',
                'threshold': 2.5
            },
            'cached_at': datetime.now().isoformat()
        }
        
        # Mock Redis response
        cache_manager.redis_client.get = AsyncMock(return_value=json.dumps(cached_data))
        
        # Clear local cache to force Redis lookup
        cache_manager.local_cache.clear()
        
        result = await get_cached_market_classification(cache_manager, market_text)
        
        assert result == cached_data
        assert result['original'] == market_text
        assert result['classification']['type'] == 'goals'


class TestErrorHandling:
    """Test error handling in cache operations."""
    
    @pytest.mark.asyncio
    async def test_redis_error_handling(self, cache_manager):
        """Test handling of Redis errors."""
        from redis.exceptions import RedisError
        
        # Mock Redis error
        cache_manager.redis_client.get = AsyncMock(side_effect=RedisError("Redis error"))
        
        # Should handle error gracefully and return None
        result = await cache_manager.get("test_key")
        assert result is None
        
        # Statistics should reflect the miss
        assert cache_manager.stats.cache_misses > 0
    
    @pytest.mark.asyncio
    async def test_serialization_error_handling(self, cache_manager):
        """Test handling of serialization errors."""
        # Create object that can't be serialized even with default=str
        class UnserializableObject:
            def __str__(self):
                raise ValueError("Cannot convert to string")
            def __repr__(self):
                raise ValueError("Cannot convert to string")
        
        unserializable = UnserializableObject()
        
        # Should raise exception during serialization
        with pytest.raises(Exception):
            cache_manager._serialize_value(unserializable)
    
    @pytest.mark.asyncio
    async def test_connection_failure_fallback(self, cache_config):
        """Test fallback to local cache when Redis connection fails."""
        manager = CacheManager(cache_config)
        
        # Don't connect to Redis, should fall back to local cache only
        key = "test_key"
        value = "test_value"
        
        # Set should work with local cache only
        result = await manager.set(key, value)
        assert result is True
        
        # Get should work with local cache only
        result = await manager.get(key)
        assert result == value


@pytest.mark.integration
class TestCacheIntegration:
    """Integration tests for cache manager (requires Redis)."""
    
    @pytest.mark.skipif(
        not pytest.importorskip("redis", minversion="5.0.0"),
        reason="Redis not available for integration tests"
    )
    @pytest.mark.asyncio
    async def test_real_redis_integration(self):
        """Test with real Redis instance (if available)."""
        config = CacheConfig(
            enabled=True,
            redis_url="redis://localhost:6379/15",  # Use test database
            default_ttl=60
        )
        
        manager = CacheManager(config)
        
        try:
            await manager.connect()
            
            # Test basic operations
            key = "integration_test_key"
            value = {"test": "integration", "timestamp": time.time()}
            
            # Set and get
            set_result = await manager.set(key, value)
            assert set_result is True
            
            get_result = await manager.get(key)
            assert get_result == value
            
            # Delete
            delete_result = await manager.delete(key)
            assert delete_result is True
            
            # Verify deletion
            get_result = await manager.get(key)
            assert get_result is None
            
            # Test statistics
            stats = await manager.get_stats()
            assert stats.total_requests > 0
            
            # Test health check
            health = await manager.health_check()
            assert health['redis_connected'] is True
            
        except Exception as e:
            pytest.skip(f"Redis not available for integration test: {e}")
        finally:
            await manager.disconnect()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])