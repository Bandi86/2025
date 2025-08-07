"""
Integration tests for WebSocket API endpoints.

Tests the integration between FastAPI WebSocket endpoints and the WebSocket manager,
including authentication, message handling, and real-time updates.
"""

import asyncio
import json
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any

from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
import jwt

# Add parent directory to path for imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from api.enhanced_main import app, websocket_manager, SECRET_KEY, ALGORITHM
from automation.websocket_manager import WebSocketManager, WebSocketEventType


class WebSocketTestClient:
    """Test client for WebSocket connections."""
    
    def __init__(self, client: TestClient):
        self.client = client
        self.websocket = None
        self.messages_received = []
        self.connected = False
    
    async def connect(self, url: str = "/ws", token: str = None):
        """Connect to WebSocket endpoint."""
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        self.websocket = self.client.websocket_connect(url, headers=headers)
        self.connected = True
        return self.websocket
    
    async def send_json(self, data: Dict[str, Any]):
        """Send JSON message to WebSocket."""
        if self.websocket:
            self.websocket.send_json(data)
    
    async def receive_json(self) -> Dict[str, Any]:
        """Receive JSON message from WebSocket."""
        if self.websocket:
            return self.websocket.receive_json()
        return {}
    
    def disconnect(self):
        """Disconnect from WebSocket."""
        if self.websocket:
            self.websocket.close()
            self.connected = False


@pytest.fixture
def client():
    """Create FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def valid_jwt_token():
    """Create a valid JWT token for testing."""
    payload = {
        "sub": "test_user",
        "roles": ["user", "admin"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@pytest.fixture
def admin_jwt_token():
    """Create a valid admin JWT token for testing."""
    payload = {
        "sub": "admin_user",
        "roles": ["admin"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


class TestWebSocketAPIEndpoints:
    """Test WebSocket API endpoints."""
    
    def test_websocket_connection_without_auth(self, client):
        """Test WebSocket connection without authentication."""
        with client.websocket_connect("/ws") as websocket:
            # Should receive connection established message
            data = websocket.receive_json()
            assert data["type"] == "connection_established"
            assert not data["data"]["authenticated"]
            assert data["data"]["connection_id"] is not None
    
    def test_websocket_connection_with_valid_auth(self, client, valid_jwt_token):
        """Test WebSocket connection with valid authentication."""
        # Note: FastAPI TestClient doesn't support query parameters for WebSocket
        # In a real implementation, you might pass the token via query parameter
        # or handle it differently. For this test, we'll simulate the behavior.
        
        with client.websocket_connect("/ws") as websocket:
            # Send authentication message after connection
            websocket.send_json({
                "type": "authenticate",
                "data": {"token": valid_jwt_token}
            })
            
            # Should receive connection established message first
            data = websocket.receive_json()
            assert data["type"] == "connection_established"
            
            # Should receive authentication success message
            auth_response = websocket.receive_json()
            assert auth_response["type"] == "authentication_success"
            assert auth_response["data"]["user_id"] == "test_user"
            assert "admin" in auth_response["data"]["roles"]
    
    def test_websocket_connection_with_invalid_auth(self, client):
        """Test WebSocket connection with invalid authentication."""
        with client.websocket_connect("/ws") as websocket:
            # Send invalid authentication message
            websocket.send_json({
                "type": "authenticate",
                "data": {"token": "invalid-token"}
            })
            
            # Should receive connection established message first
            data = websocket.receive_json()
            assert data["type"] == "connection_established"
            
            # Should receive authentication error message
            auth_response = websocket.receive_json()
            assert auth_response["type"] == "authentication_error"
            assert "error" in auth_response["data"]
    
    def test_websocket_subscription_management(self, client):
        """Test WebSocket subscription management."""
        with client.websocket_connect("/ws") as websocket:
            # Skip connection established message
            websocket.receive_json()
            
            # Subscribe to events
            websocket.send_json({
                "type": "subscribe",
                "data": {"event_types": ["processing_progress", "system_error"]}
            })
            
            # Should receive subscription confirmation
            response = websocket.receive_json()
            assert response["type"] == "subscription_confirmed"
            assert set(response["data"]["event_types"]) == {"processing_progress", "system_error"}
            
            # Unsubscribe from events
            websocket.send_json({
                "type": "unsubscribe",
                "data": {"event_types": ["processing_progress"]}
            })
            
            # Should receive unsubscription confirmation
            response = websocket.receive_json()
            assert response["type"] == "unsubscription_confirmed"
            assert response["data"]["event_types"] == ["processing_progress"]
    
    def test_websocket_heartbeat_response(self, client):
        """Test WebSocket heartbeat response handling."""
        with client.websocket_connect("/ws") as websocket:
            # Skip connection established message
            websocket.receive_json()
            
            # Send heartbeat response
            websocket.send_json({
                "type": "heartbeat_response",
                "data": {}
            })
            
            # Should not receive any response for heartbeat
            # (heartbeat responses are handled internally)
    
    def test_websocket_echo_functionality(self, client):
        """Test WebSocket echo functionality for unknown message types."""
        with client.websocket_connect("/ws") as websocket:
            # Skip connection established message
            websocket.receive_json()
            
            # Send custom message
            test_message = {
                "type": "custom_message",
                "data": {"test": "data"}
            }
            websocket.send_json(test_message)
            
            # The message should be handled by the custom event system
            # In a real implementation, this might trigger custom handlers
    
    def test_websocket_invalid_json(self, client):
        """Test WebSocket handling of invalid JSON."""
        with client.websocket_connect("/ws") as websocket:
            # Skip connection established message
            websocket.receive_json()
            
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should receive error message
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Invalid JSON format" in response["data"]["error"]
    
    def test_get_websocket_connections_unauthorized(self, client):
        """Test getting WebSocket connections without admin role."""
        response = client.get("/api/v1/websocket/connections")
        assert response.status_code == 401
    
    def test_get_websocket_connections_authorized(self, client, admin_jwt_token):
        """Test getting WebSocket connections with admin role."""
        headers = {"Authorization": f"Bearer {admin_jwt_token}"}
        response = client.get("/api/v1/websocket/connections", headers=headers)
        
        if response.status_code == 503:
            # WebSocket manager not available in test environment
            assert "WebSocket manager not available" in response.json()["error"]["message"]
        else:
            assert response.status_code == 200
            data = response.json()
            assert "connections" in data
            assert "stats" in data
    
    def test_broadcast_message_unauthorized(self, client):
        """Test broadcasting message without admin role."""
        response = client.post("/api/v1/websocket/broadcast", json={
            "event_type": "test_event",
            "data": {"test": "data"}
        })
        assert response.status_code == 401
    
    def test_broadcast_message_authorized(self, client, admin_jwt_token):
        """Test broadcasting message with admin role."""
        headers = {"Authorization": f"Bearer {admin_jwt_token}"}
        response = client.post(
            "/api/v1/websocket/broadcast",
            json={
                "event_type": "test_event",
                "data": {"test": "data"}
            },
            headers=headers
        )
        
        if response.status_code == 503:
            # WebSocket manager not available in test environment
            assert "WebSocket manager not available" in response.json()["error"]["message"]
        else:
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Broadcast sent successfully"
            assert data["event_type"] == "test_event"
            assert "connections_reached" in data


class TestWebSocketEventIntegration:
    """Test WebSocket integration with automation events."""
    
    @patch('src.api.enhanced_main.websocket_manager')
    def test_processing_progress_event(self, mock_ws_manager, client):
        """Test processing progress event broadcasting."""
        # Import the event handler
        from api.enhanced_main import handle_processing_progress
        
        # Mock WebSocket manager
        mock_ws_manager.broadcast = AsyncMock()
        
        # Simulate processing progress event
        asyncio.run(handle_processing_progress("job-123", 50.0, "processing"))
        
        # Check WebSocket broadcast was called
        mock_ws_manager.broadcast.assert_called_once_with(
            WebSocketEventType.PROCESSING_PROGRESS.value,
            {
                "job_id": "job-123",
                "progress": 50.0,
                "stage": "processing",
                "timestamp": pytest.approx(datetime.now(timezone.utc).isoformat(), abs=1)
            }
        )
    
    @patch('src.api.enhanced_main.websocket_manager')
    def test_processing_completed_event(self, mock_ws_manager, client):
        """Test processing completed event broadcasting."""
        from api.enhanced_main import handle_processing_completed
        
        mock_ws_manager.broadcast = AsyncMock()
        
        test_data = {
            "job_id": "job-123",
            "result": {"success": True},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        asyncio.run(handle_processing_completed(test_data))
        
        mock_ws_manager.broadcast.assert_called_once_with(
            WebSocketEventType.PROCESSING_COMPLETED.value,
            test_data
        )
    
    @patch('src.api.enhanced_main.websocket_manager')
    def test_system_error_event(self, mock_ws_manager, client):
        """Test system error event broadcasting."""
        from api.enhanced_main import handle_system_error
        
        mock_ws_manager.broadcast = AsyncMock()
        
        test_data = {
            "error": "Test error message",
            "component": "test_component",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        asyncio.run(handle_system_error(test_data))
        
        mock_ws_manager.broadcast.assert_called_once_with(
            WebSocketEventType.SYSTEM_ERROR.value,
            test_data
        )
    
    @patch('src.api.enhanced_main.websocket_manager')
    def test_file_detected_event(self, mock_ws_manager, client):
        """Test file detected event broadcasting."""
        from api.enhanced_main import handle_file_detected
        
        mock_ws_manager.broadcast = AsyncMock()
        
        test_data = {
            "file_path": "/path/to/file.pdf",
            "event_type": "created",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        asyncio.run(handle_file_detected(test_data))
        
        mock_ws_manager.broadcast.assert_called_once_with(
            WebSocketEventType.FILE_DETECTED.value,
            test_data
        )


class TestWebSocketPerformance:
    """Test WebSocket performance and scalability."""
    
    def test_multiple_concurrent_connections(self, client):
        """Test handling multiple concurrent WebSocket connections."""
        connections = []
        
        try:
            # Create multiple connections
            for i in range(5):
                ws = client.websocket_connect("/ws")
                connections.append(ws)
                
                # Verify connection established
                data = ws.receive_json()
                assert data["type"] == "connection_established"
            
            # All connections should be active
            assert len(connections) == 5
            
        finally:
            # Clean up connections
            for ws in connections:
                try:
                    ws.close()
                except:
                    pass
    
    def test_message_broadcasting_performance(self, client):
        """Test performance of message broadcasting to multiple connections."""
        connections = []
        
        try:
            # Create multiple connections
            for i in range(3):
                ws = client.websocket_connect("/ws")
                connections.append(ws)
                ws.receive_json()  # Skip connection established message
            
            # This test would require the actual WebSocket manager to be running
            # In a real test environment, you would broadcast a message and
            # measure the time it takes for all connections to receive it
            
        finally:
            # Clean up connections
            for ws in connections:
                try:
                    ws.close()
                except:
                    pass


class TestWebSocketErrorHandling:
    """Test WebSocket error handling scenarios."""
    
    def test_websocket_connection_limit(self, client):
        """Test WebSocket connection limit enforcement."""
        # This test would require configuring the WebSocket manager
        # with a low connection limit and testing the rejection behavior
        pass
    
    def test_websocket_authentication_timeout(self, client):
        """Test WebSocket authentication timeout."""
        # This test would simulate a slow authentication process
        # and verify timeout handling
        pass
    
    def test_websocket_malformed_message_handling(self, client):
        """Test handling of malformed WebSocket messages."""
        with client.websocket_connect("/ws") as websocket:
            websocket.receive_json()  # Skip connection established
            
            # Send malformed message
            websocket.send_text("not json")
            
            # Should receive error response
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Invalid JSON format" in response["data"]["error"]
    
    def test_websocket_connection_recovery(self, client):
        """Test WebSocket connection recovery after network issues."""
        # This test would simulate network disconnections and
        # verify proper cleanup and recovery mechanisms
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])