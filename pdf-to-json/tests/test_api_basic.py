"""
Basic API tests for the Enhanced FastAPI application.

Tests core API functionality without complex dependencies.
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import tempfile
import os

from fastapi.testclient import TestClient
from fastapi import status
import jwt

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.enhanced_main import app, SECRET_KEY, ALGORITHM


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Create authentication headers."""
    token_data = {
        "sub": "testuser",
        "roles": ["user", "admin"],
        "active": True,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return {"Authorization": f"Bearer {token}"}


class TestBasicEndpoints:
    """Test basic API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API information."""
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "2.0.0"
    
    def test_health_check(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "components" in data
        assert "system_metrics" in data
    
    def test_docs_endpoint(self, client):
        """Test API documentation endpoint."""
        response = client.get("/docs")
        assert response.status_code == status.HTTP_200_OK
    
    def test_openapi_schema(self, client):
        """Test OpenAPI schema endpoint."""
        response = client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK
        
        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert schema["info"]["title"] == "Football Automation API"
        assert schema["info"]["version"] == "2.0.0"


class TestAuthentication:
    """Test authentication endpoints."""
    
    def test_login_success(self, client):
        """Test successful login."""
        response = client.post("/auth/login", json={
            "username": "testuser",
            "password": "testpass"
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post("/auth/login", json={
            "username": "",
            "password": ""
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, client, auth_headers):
        """Test getting current user information."""
        response = client.get("/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "username" in data
        assert "roles" in data
        assert "is_active" in data
        assert data["username"] == "testuser"
    
    def test_unauthorized_access(self, client):
        """Test accessing protected endpoint without token."""
        response = client.get("/api/v1/status")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_invalid_token(self, client):
        """Test accessing endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/status", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestAPIEndpoints:
    """Test API endpoints that don't require automation manager."""
    
    def test_get_games(self, client, auth_headers):
        """Test getting games data."""
        response = client.get("/api/v1/games", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "games" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
    
    def test_get_games_with_filters(self, client, auth_headers):
        """Test getting games with filters."""
        response = client.get("/api/v1/games", headers=auth_headers, params={
            "date": "2025-01-01",
            "league": "Premier League",
            "limit": 50
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["filters"]["date"] == "2025-01-01"
        assert data["filters"]["league"] == "Premier League"
        assert data["limit"] == 50
    
    def test_get_latest_report(self, client, auth_headers):
        """Test getting latest report."""
        response = client.get("/api/v1/reports/latest", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "report_id" in data
        assert "generated_at" in data
        assert "summary" in data
    
    def test_get_trend_report(self, client, auth_headers):
        """Test getting trend report."""
        response = client.get("/api/v1/reports/trends", headers=auth_headers, params={"days": 7})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["period_days"] == 7
        assert "trends" in data
        assert "generated_at" in data


class TestFileUpload:
    """Test file upload functionality."""
    
    def test_upload_pdf_file(self, client, auth_headers):
        """Test uploading a PDF file."""
        # Create a temporary PDF file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(b"%PDF-1.4\n%Test PDF content\n")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test.pdf", f, "application/pdf")}
                response = client.post(
                    "/api/v1/upload",
                    files=files,
                    headers=auth_headers,
                    data={"auto_process": "false"}
                )
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert data["success"] is True
            assert "file_path" in data
            
            # Cleanup uploaded file
            if data.get("file_path") and os.path.exists(data["file_path"]):
                os.unlink(data["file_path"])
                
        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_upload_invalid_file_type(self, client, auth_headers):
        """Test uploading non-PDF file."""
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"Not a PDF file")
            temp_path = f.name
        
        try:
            with open(temp_path, "rb") as f:
                files = {"file": ("test.txt", f, "text/plain")}
                response = client.post(
                    "/api/v1/upload",
                    files=files,
                    headers=auth_headers
                )
            
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestWebhookEndpoints:
    """Test webhook management endpoints."""
    
    def test_register_webhook_requires_admin(self, client, auth_headers):
        """Test webhook registration requires admin role."""
        # Create user token (without admin role)
        token_data = {
            "sub": "user",
            "roles": ["user"],
            "active": True,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        user_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        response = client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["processing_completed"]
        }, headers=user_headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_register_webhook_admin(self, client, auth_headers):
        """Test registering webhook as admin."""
        response = client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["processing_completed"]
        }, headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["url"] == "https://example.com/webhook"
    
    def test_list_webhooks_admin(self, client, auth_headers):
        """Test listing webhooks as admin."""
        # First register a webhook
        client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["all"]
        }, headers=auth_headers)
        
        response = client.get("/api/v1/webhooks", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "webhooks" in data
        assert "total" in data


class TestErrorHandling:
    """Test error handling."""
    
    def test_404_endpoint(self, client):
        """Test 404 for non-existent endpoint."""
        response = client.get("/nonexistent-endpoint")
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_validation_error(self, client, auth_headers):
        """Test request validation error."""
        response = client.post("/api/v1/process/file", json={
            "file_path": "",  # Invalid empty path
            "priority": 10    # Invalid priority (should be 0-4)
        }, headers=auth_headers)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestWebSocket:
    """Test WebSocket functionality."""
    
    def test_websocket_connection(self, client):
        """Test WebSocket connection."""
        with client.websocket_connect("/ws") as websocket:
            # Send test message
            websocket.send_text("Hello WebSocket")
            
            # Receive echo response
            data = websocket.receive_json()
            assert data["type"] == "echo"
            assert "Hello WebSocket" in data["message"]
            assert "timestamp" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])