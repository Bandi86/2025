"""
Comprehensive tests for WebSocket Manager functionality.

Tests cover:
- Connection handling and message delivery
- Authentication and authorization
- Event broadcasting system
- Heartbeat mechanism and connection cleanup
- Subscription management
- Error handling and edge cases
"""

import asyncio
import json
import pytest
import time
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.testclient import TestClient
import jwt

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from automation.websocket_manager import (
    WebSocketManager, WebSocketConnection, WebSocketMessage, 
    WebSocketEventType
)


class MockWebSocket:
    """Mock WebSocket for testing."""
    
    def __init__(self):
        self.messages_sent = []
        self.messages_received = []
        self.closed = False
        self.close_code = None
        self.close_reason = None
        self.headers = {"user-agent": "test-client", "origin": "http://localhost"}
    
    async def accept(self):
        """Mock accept method."""
        pass
    
    async def send_json(self, data: Dict[str, Any]):
        """Mock send_json method."""
        if self.closed:
            raise Exception("WebSocket is closed")
        self.messages_sent.append(data)
    
    async def receive_text(self) -> str:
        """Mock receive_text method."""
        if self.closed:
            raise WebSocketDisconnect()
        if self.messages_received:
            return self.messages_received.pop(0)
        # Simulate waiting for message
        await asyncio.sleep(0.1)
        raise WebSocketDisconnect()
    
    async def close(self, code: int = 1000, reason: str = ""):
        """Mock close method."""
        self.closed = True
        self.close_code = code
        self.close_reason = reason
    
    def add_received_message(self, message: str):
        """Add a message to be received."""
        self.messages_received.append(message)


@pytest.fixture
def websocket_manager():
    """Create a WebSocket manager for testing."""
    return WebSocketManager(
        heartbeat_interval=1,  # Short interval for testing
        heartbeat_timeout=2,
        max_connections=10,
        jwt_secret="test-secret",
        jwt_algorithm="HS256"
    )


@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket."""
    return MockWebSocket()


@pytest.fixture
def valid_jwt_token():
    """Create a valid JWT token for testing."""
    payload = {
        "sub": "test_user",
        "roles": ["user", "admin"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


@pytest.fixture
def expired_jwt_token():
    """Create an expired JWT token for testing."""
    payload = {
        "sub": "test_user",
        "roles": ["user"],
        "exp": datetime.utcnow() - timedelta(hours=1)
    }
    return jwt.encode(payload, "test-secret", algorithm="HS256")


class TestWebSocketManager:
    """Test WebSocket Manager functionality."""
    
    @pytest.mark.asyncio
    async def test_manager_start_stop(self, websocket_manager):
        """Test WebSocket manager start and stop."""
        assert not websocket_manager.running
        
        # Start manager
        await websocket_manager.start()
        assert websocket_manager.running
        assert websocket_manager.heartbeat_task is not None
        assert websocket_manager.cleanup_task is not None
        
        # Stop manager
        await websocket_manager.stop()
        assert not websocket_manager.running
        assert len(websocket_manager.connections) == 0
    
    @pytest.mark.asyncio
    async def test_connection_without_auth(self, websocket_manager, mock_websocket):
        """Test WebSocket connection without authentication."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(mock_websocket)
            
            # Check connection was created
            assert connection_id in websocket_manager.connections
            connection = websocket_manager.connections[connection_id]
            assert not connection.is_authenticated
            assert connection.user_id is None
            
            # Check connection established message was sent
            assert len(mock_websocket.messages_sent) == 1
            message = mock_websocket.messages_sent[0]
            assert message["type"] == "connection_established"
            assert message["data"]["connection_id"] == connection_id
            assert not message["data"]["authenticated"]
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_connection_with_valid_auth(self, websocket_manager, mock_websocket, valid_jwt_token):
        """Test WebSocket connection with valid authentication."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(
                mock_websocket, 
                token=valid_jwt_token
            )
            
            # Check connection was created and authenticated
            assert connection_id in websocket_manager.connections
            connection = websocket_manager.connections[connection_id]
            assert connection.is_authenticated
            assert connection.user_id == "test_user"
            assert "admin" in connection.user_roles
            
            # Check user connections mapping
            assert "test_user" in websocket_manager.user_connections
            assert connection_id in websocket_manager.user_connections["test_user"]
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_connection_with_invalid_auth(self, websocket_manager, mock_websocket):
        """Test WebSocket connection with invalid authentication."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(
                mock_websocket, 
                token="invalid-token"
            )
            
            # Connection should still be created but not authenticated
            assert connection_id in websocket_manager.connections
            connection = websocket_manager.connections[connection_id]
            assert not connection.is_authenticated
            assert connection.user_id is None
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_connection_limit(self, websocket_manager):
        """Test connection limit enforcement."""
        websocket_manager.max_connections = 2
        await websocket_manager.start()
        
        try:
            # Create connections up to limit
            mock_ws1 = MockWebSocket()
            mock_ws2 = MockWebSocket()
            mock_ws3 = MockWebSocket()
            
            conn1 = await websocket_manager.connect(mock_ws1)
            conn2 = await websocket_manager.connect(mock_ws2)
            
            assert len(websocket_manager.connections) == 2
            
            # Third connection should be rejected
            with pytest.raises(Exception):
                await websocket_manager.connect(mock_ws3)
            
            assert mock_ws3.closed
            assert mock_ws3.close_code == 1008
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_message_broadcasting(self, websocket_manager):
        """Test message broadcasting to all connections."""
        await websocket_manager.start()
        
        try:
            # Create multiple connections
            mock_ws1 = MockWebSocket()
            mock_ws2 = MockWebSocket()
            
            conn1 = await websocket_manager.connect(mock_ws1)
            conn2 = await websocket_manager.connect(mock_ws2)
            
            # Clear connection established messages
            mock_ws1.messages_sent.clear()
            mock_ws2.messages_sent.clear()
            
            # Broadcast a message
            test_data = {"test": "data", "timestamp": "2023-01-01T00:00:00Z"}
            sent_count = await websocket_manager.broadcast("test_event", test_data)
            
            assert sent_count == 2
            
            # Check both connections received the message
            assert len(mock_ws1.messages_sent) == 1
            assert len(mock_ws2.messages_sent) == 1
            
            message1 = mock_ws1.messages_sent[0]
            message2 = mock_ws2.messages_sent[0]
            
            assert message1["type"] == "test_event"
            assert message1["data"] == test_data
            assert message2["type"] == "test_event"
            assert message2["data"] == test_data
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_role_based_broadcasting(self, websocket_manager, valid_jwt_token):
        """Test role-based message broadcasting."""
        await websocket_manager.start()
        
        try:
            # Create authenticated and unauthenticated connections
            mock_ws_auth = MockWebSocket()
            mock_ws_unauth = MockWebSocket()
            
            conn_auth = await websocket_manager.connect(mock_ws_auth, token=valid_jwt_token)
            conn_unauth = await websocket_manager.connect(mock_ws_unauth)
            
            # Clear connection established messages
            mock_ws_auth.messages_sent.clear()
            mock_ws_unauth.messages_sent.clear()
            
            # Broadcast message requiring admin role
            test_data = {"admin": "data"}
            sent_count = await websocket_manager.broadcast(
                "admin_event", 
                test_data, 
                required_roles=["admin"]
            )
            
            # Only authenticated connection with admin role should receive message
            assert sent_count == 1
            assert len(mock_ws_auth.messages_sent) == 1
            assert len(mock_ws_unauth.messages_sent) == 0
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_user_specific_messaging(self, websocket_manager, valid_jwt_token):
        """Test sending messages to specific users."""
        await websocket_manager.start()
        
        try:
            # Create connections for different users
            mock_ws1 = MockWebSocket()
            mock_ws2 = MockWebSocket()
            
            # Create token for different user
            other_token = jwt.encode({
                "sub": "other_user",
                "roles": ["user"],
                "exp": datetime.utcnow() + timedelta(hours=1)
            }, "test-secret", algorithm="HS256")
            
            conn1 = await websocket_manager.connect(mock_ws1, token=valid_jwt_token)
            conn2 = await websocket_manager.connect(mock_ws2, token=other_token)
            
            # Clear connection established messages
            mock_ws1.messages_sent.clear()
            mock_ws2.messages_sent.clear()
            
            # Send message to specific user
            test_data = {"personal": "message"}
            sent_count = await websocket_manager.send_to_user(
                "test_user", 
                "personal_event", 
                test_data
            )
            
            # Only test_user connection should receive message
            assert sent_count == 1
            assert len(mock_ws1.messages_sent) == 1
            assert len(mock_ws2.messages_sent) == 0
            
            message = mock_ws1.messages_sent[0]
            assert message["type"] == "personal_event"
            assert message["data"] == test_data
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_subscription_management(self, websocket_manager, mock_websocket):
        """Test event subscription management."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(mock_websocket)
            
            # Subscribe to specific events
            success = await websocket_manager.subscribe(
                connection_id, 
                ["processing_progress", "system_error"]
            )
            assert success
            
            connection = websocket_manager.connections[connection_id]
            assert "processing_progress" in connection.subscriptions
            assert "system_error" in connection.subscriptions
            
            # Clear messages
            mock_websocket.messages_sent.clear()
            
            # Send subscribed event - should be received
            await websocket_manager.broadcast("processing_progress", {"test": "data"})
            assert len(mock_websocket.messages_sent) == 1
            
            # Clear messages
            mock_websocket.messages_sent.clear()
            
            # Send unsubscribed event - should not be received
            await websocket_manager.broadcast("file_detected", {"test": "data"})
            assert len(mock_websocket.messages_sent) == 0
            
            # Unsubscribe from event
            success = await websocket_manager.unsubscribe(
                connection_id, 
                ["processing_progress"]
            )
            assert success
            assert "processing_progress" not in connection.subscriptions
            assert "system_error" in connection.subscriptions
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_heartbeat_mechanism(self, websocket_manager, mock_websocket):
        """Test heartbeat mechanism and timeout detection."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(mock_websocket)
            
            # Wait for heartbeat
            await asyncio.sleep(1.5)  # Wait longer than heartbeat interval
            
            # Check heartbeat was sent
            heartbeat_messages = [
                msg for msg in mock_websocket.messages_sent 
                if msg.get("type") == "heartbeat"
            ]
            assert len(heartbeat_messages) >= 1
            
            # Simulate heartbeat timeout by not updating last_heartbeat
            connection = websocket_manager.connections[connection_id]
            connection.last_heartbeat = datetime.now(timezone.utc) - timedelta(seconds=10)
            
            # Wait for timeout detection
            await asyncio.sleep(1.5)
            
            # Connection should be closed due to timeout
            assert connection_id not in websocket_manager.connections
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_client_message_handling(self, websocket_manager, mock_websocket):
        """Test handling of client messages."""
        await websocket_manager.start()
        
        try:
            connection_id = await websocket_manager.connect(mock_websocket)
            connection = websocket_manager.connections[connection_id]
            
            # Test heartbeat response
            await websocket_manager.handle_client_message(connection_id, {
                "type": "heartbeat_response",
                "data": {}
            })
            
            # Last heartbeat should be updated
            assert connection.last_heartbeat > datetime.now(timezone.utc) - timedelta(seconds=1)
            
            # Clear messages
            mock_websocket.messages_sent.clear()
            
            # Test subscription request
            await websocket_manager.handle_client_message(connection_id, {
                "type": "subscribe",
                "data": {"event_types": ["processing_progress", "system_error"]}
            })
            
            # Should receive confirmation
            assert len(mock_websocket.messages_sent) == 1
            message = mock_websocket.messages_sent[0]
            assert message["type"] == "subscription_confirmed"
            assert set(message["data"]["event_types"]) == {"processing_progress", "system_error"}
            
            # Check subscription was applied
            assert "processing_progress" in connection.subscriptions
            assert "system_error" in connection.subscriptions
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_connection_cleanup(self, websocket_manager):
        """Test proper connection cleanup."""
        await websocket_manager.start()
        
        try:
            # Create authenticated connection
            mock_websocket = MockWebSocket()
            token = jwt.encode({
                "sub": "test_user",
                "roles": ["user"],
                "exp": datetime.utcnow() + timedelta(hours=1)
            }, "test-secret", algorithm="HS256")
            
            connection_id = await websocket_manager.connect(mock_websocket, token=token)
            
            # Verify connection and user mapping
            assert connection_id in websocket_manager.connections
            assert "test_user" in websocket_manager.user_connections
            assert connection_id in websocket_manager.user_connections["test_user"]
            
            # Disconnect
            await websocket_manager.disconnect(connection_id, "Test disconnect")
            
            # Verify cleanup
            assert connection_id not in websocket_manager.connections
            assert "test_user" not in websocket_manager.user_connections
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_connection_stats(self, websocket_manager, valid_jwt_token):
        """Test connection statistics."""
        await websocket_manager.start()
        
        try:
            # Initial stats
            stats = websocket_manager.get_connection_stats()
            assert stats["active_connections"] == 0
            assert stats["authenticated_connections"] == 0
            
            # Create connections
            mock_ws1 = MockWebSocket()
            mock_ws2 = MockWebSocket()
            
            conn1 = await websocket_manager.connect(mock_ws1)  # Unauthenticated
            conn2 = await websocket_manager.connect(mock_ws2, token=valid_jwt_token)  # Authenticated
            
            # Check updated stats
            stats = websocket_manager.get_connection_stats()
            assert stats["active_connections"] == 2
            assert stats["authenticated_connections"] == 1
            assert stats["unique_users"] == 1
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_error_handling(self, websocket_manager):
        """Test error handling in various scenarios."""
        await websocket_manager.start()
        
        try:
            # Test sending message to non-existent connection
            message = WebSocketMessage(type="test", data={})
            sent_count = await websocket_manager.send_message(message)
            assert sent_count == 0
            
            # Test operations on non-existent connection
            success = await websocket_manager.subscribe("non-existent", ["test"])
            assert not success
            
            success = await websocket_manager.unsubscribe("non-existent", ["test"])
            assert not success
            
            # Test sending to user with no connections
            sent_count = await websocket_manager.send_to_user("non-existent-user", "test", {})
            assert sent_count == 0
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_failed_message_sending(self, websocket_manager):
        """Test handling of failed message sending."""
        await websocket_manager.start()
        
        try:
            mock_websocket = MockWebSocket()
            connection_id = await websocket_manager.connect(mock_websocket)
            
            # Simulate WebSocket failure
            mock_websocket.closed = True
            
            # Try to send message - should fail and close connection
            await websocket_manager.broadcast("test_event", {"test": "data"})
            
            # Connection should be removed
            assert connection_id not in websocket_manager.connections
            
        finally:
            await websocket_manager.stop()
    
    def test_websocket_message_serialization(self):
        """Test WebSocket message serialization."""
        message = WebSocketMessage(
            type="test_event",
            data={"key": "value", "number": 42},
            target_connections=["conn1", "conn2"],
            required_roles=["admin"]
        )
        
        serialized = message.to_dict()
        
        assert serialized["type"] == "test_event"
        assert serialized["data"] == {"key": "value", "number": 42}
        assert "timestamp" in serialized
        assert "id" in serialized
    
    def test_websocket_connection_serialization(self):
        """Test WebSocket connection serialization."""
        mock_ws = MockWebSocket()
        connection = WebSocketConnection(
            websocket=mock_ws,
            connection_id="test-conn-id",
            user_id="test-user",
            user_roles=["user", "admin"],
            is_authenticated=True
        )
        connection.subscriptions.add("processing_progress")
        
        serialized = connection.to_dict()
        
        assert serialized["connection_id"] == "test-conn-id"
        assert serialized["user_id"] == "test-user"
        assert serialized["user_roles"] == ["user", "admin"]
        assert serialized["is_authenticated"] is True
        assert "processing_progress" in serialized["subscriptions"]
        assert "connected_at" in serialized
        assert "last_heartbeat" in serialized


class TestWebSocketIntegration:
    """Integration tests for WebSocket functionality."""
    
    @pytest.mark.asyncio
    async def test_event_handler_integration(self, websocket_manager, mock_websocket):
        """Test integration with event handlers."""
        await websocket_manager.start()
        
        try:
            # Add event handler
            events_received = []
            
            async def test_handler(data):
                events_received.append(data)
            
            websocket_manager.add_event_handler("connection_established", test_handler)
            
            # Connect - should trigger event
            connection_id = await websocket_manager.connect(mock_websocket)
            
            # Wait for event processing
            await asyncio.sleep(0.1)
            
            # Check event was received
            assert len(events_received) == 1
            event_data = events_received[0]
            assert event_data["connection_id"] == connection_id
            assert not event_data["authenticated"]
            
        finally:
            await websocket_manager.stop()
    
    @pytest.mark.asyncio
    async def test_multiple_user_connections(self, websocket_manager):
        """Test multiple connections for the same user."""
        await websocket_manager.start()
        
        try:
            # Create multiple connections for same user
            token = jwt.encode({
                "sub": "test_user",
                "roles": ["user"],
                "exp": datetime.utcnow() + timedelta(hours=1)
            }, "test-secret", algorithm="HS256")
            
            mock_ws1 = MockWebSocket()
            mock_ws2 = MockWebSocket()
            
            conn1 = await websocket_manager.connect(mock_ws1, token=token)
            conn2 = await websocket_manager.connect(mock_ws2, token=token)
            
            # Both connections should be tracked for the user
            assert len(websocket_manager.user_connections["test_user"]) == 2
            assert conn1 in websocket_manager.user_connections["test_user"]
            assert conn2 in websocket_manager.user_connections["test_user"]
            
            # Clear messages
            mock_ws1.messages_sent.clear()
            mock_ws2.messages_sent.clear()
            
            # Send message to user - both connections should receive it
            sent_count = await websocket_manager.send_to_user(
                "test_user", 
                "user_message", 
                {"test": "data"}
            )
            
            assert sent_count == 2
            assert len(mock_ws1.messages_sent) == 1
            assert len(mock_ws2.messages_sent) == 1
            
        finally:
            await websocket_manager.stop()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])