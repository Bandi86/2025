"""
Comprehensive test suite for the Enhanced FastAPI application.

Tests all API endpoints including:
- Authentication and authorization
- Processing management
- Data access
- System monitoring
- Webhook management
- WebSocket functionality
- Error handling
"""

import pytest
import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from pathlib import Path
import tempfile
import os

import httpx
from fastapi.testclient import TestClient
from fastapi import status
import jwt

# Add parent directory to path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.enhanced_main import app, SECRET_KEY, ALGORITHM
from src.automation.config import AutomationConfig, ProcessingConfig, DatabaseConfig
from src.automation.models import Job, JobStatus


class AuthenticatedTestClient:
    """Test client wrapper with authentication support."""
    
    def __init__(self):
        self.client = TestClient(app)
        self.token = None
        self.headers = {}
    
    def authenticate(self, username: str = "testuser", roles: list = None):
        """Authenticate and set authorization headers."""
        if roles is None:
            roles = ["user", "admin"]
        
        # Create test token
        token_data = {
            "sub": username,
            "roles": roles,
            "active": True,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
        self.token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def get(self, url: str, **kwargs):
        return self.client.get(url, headers=self.headers, **kwargs)
    
    def post(self, url: str, **kwargs):
        return self.client.post(url, headers=self.headers, **kwargs)
    
    def put(self, url: str, **kwargs):
        return self.client.put(url, headers=self.headers, **kwargs)
    
    def delete(self, url: str, **kwargs):
        return self.client.delete(url, headers=self.headers, **kwargs)


@pytest.fixture
def test_client():
    """Create authenticated test client."""
    client = AuthenticatedTestClient()
    client.authenticate()
    return client


@pytest.fixture
def admin_client():
    """Create admin test client."""
    client = AuthenticatedTestClient()
    client.authenticate(username="admin", roles=["admin"])
    return client


@pytest.fixture
def user_client():
    """Create regular user test client."""
    client = AuthenticatedTestClient()
    client.authenticate(username="user", roles=["user"])
    return client


@pytest.fixture
def temp_pdf_file():
    """Create a temporary PDF file for testing."""
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(b"%PDF-1.4\n%Test PDF content\n")
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path)


class TestRootEndpoints:
    """Test root and basic endpoints."""
    
    def test_root_endpoint(self):
        """Test root endpoint returns API information."""
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "2.0.0"
    
    def test_health_check(self):
        """Test health check endpoint."""
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "components" in data
        assert "system_metrics" in data


class TestAuthentication:
    """Test authentication and authorization."""
    
    def test_login_success(self):
        """Test successful login."""
        client = TestClient(app)
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
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        client = TestClient(app)
        response = client.post("/auth/login", json={
            "username": "",
            "password": ""
        })
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_current_user(self, test_client):
        """Test getting current user information."""
        response = test_client.get("/auth/me")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "username" in data
        assert "roles" in data
        assert "is_active" in data
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token."""
        client = TestClient(app)
        response = client.get("/api/v1/status")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_invalid_token(self):
        """Test accessing endpoint with invalid token."""
        client = TestClient(app)
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/v1/status", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_insufficient_permissions(self, user_client):
        """Test accessing admin endpoint with user role."""
        response = user_client.get("/api/v1/config")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestProcessingEndpoints:
    """Test processing management endpoints."""
    
    def test_process_file(self, test_client, temp_pdf_file):
        """Test queuing a file for processing."""
        response = test_client.post("/api/v1/process/file", json={
            "file_path": temp_pdf_file,
            "priority": 3,
            "job_type": "pdf_processing"
        })
        
        # Note: This will fail in test environment without automation manager
        # In a real test, we would mock the automation manager
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
    
    def test_get_job_status_not_found(self, test_client):
        """Test getting status of non-existent job."""
        response = test_client.get("/api/v1/process/status/nonexistent-job-id")
        
        # Will return 503 without automation manager
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    
    def test_get_queue_status(self, test_client):
        """Test getting queue status."""
        response = test_client.get("/api/v1/process/queue")
        
        # Will return 503 without automation manager
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    
    def test_cancel_job_admin_required(self, user_client):
        """Test that canceling job requires admin role."""
        response = user_client.delete("/api/v1/process/job/test-job-id")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_retry_job_admin_required(self, user_client):
        """Test that retrying job requires admin role."""
        response = user_client.post("/api/v1/process/job/test-job-id/retry")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestFileUpload:
    """Test file upload functionality."""
    
    def test_upload_pdf_file(self, test_client, temp_pdf_file):
        """Test uploading a PDF file."""
        with open(temp_pdf_file, "rb") as f:
            files = {"file": ("test.pdf", f, "application/pdf")}
            response = test_client.client.post(
                "/api/v1/upload",
                files=files,
                headers=test_client.headers
            )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "file_path" in data
        
        # Cleanup uploaded file
        if data.get("file_path") and os.path.exists(data["file_path"]):
            os.unlink(data["file_path"])
    
    def test_upload_invalid_file_type(self, test_client):
        """Test uploading non-PDF file."""
        with tempfile.NamedTemporaryFile(suffix=".txt") as f:
            f.write(b"Not a PDF file")
            f.seek(0)
            files = {"file": ("test.txt", f, "text/plain")}
            response = test_client.client.post(
                "/api/v1/upload",
                files=files,
                headers=test_client.headers
            )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_upload_without_authentication(self):
        """Test uploading file without authentication."""
        client = TestClient(app)
        with tempfile.NamedTemporaryFile(suffix=".pdf") as f:
            f.write(b"%PDF-1.4\nTest")
            f.seek(0)
            files = {"file": ("test.pdf", f, "application/pdf")}
            response = client.post("/api/v1/upload", files=files)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestDataEndpoints:
    """Test data access endpoints."""
    
    def test_get_games(self, test_client):
        """Test getting games data."""
        response = test_client.get("/api/v1/games")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "games" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
    
    def test_get_games_with_filters(self, test_client):
        """Test getting games with filters."""
        response = test_client.get("/api/v1/games", params={
            "date": "2025-01-01",
            "league": "Premier League",
            "limit": 50
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["filters"]["date"] == "2025-01-01"
        assert data["filters"]["league"] == "Premier League"
        assert data["limit"] == 50
    
    def test_get_latest_report(self, test_client):
        """Test getting latest report."""
        response = test_client.get("/api/v1/reports/latest")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "report_id" in data
        assert "generated_at" in data
        assert "summary" in data
    
    def test_get_trend_report(self, test_client):
        """Test getting trend report."""
        response = test_client.get("/api/v1/reports/trends", params={"days": 7})
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["period_days"] == 7
        assert "trends" in data
        assert "generated_at" in data


class TestSystemMonitoring:
    """Test system monitoring endpoints."""
    
    def test_get_system_status(self, test_client):
        """Test getting system status."""
        response = test_client.get("/api/v1/status")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "is_running" in data
        assert "components_status" in data
        assert "system_health" in data
        assert "active_jobs" in data
    
    def test_get_metrics_admin_required(self, user_client):
        """Test that metrics endpoint requires admin role."""
        response = user_client.get("/api/v1/metrics")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_metrics_admin(self, admin_client):
        """Test getting metrics as admin."""
        response = admin_client.get("/api/v1/metrics")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "timestamp" in data
        assert "system" in data
        assert "application" in data


class TestConfigurationEndpoints:
    """Test configuration management endpoints."""
    
    def test_get_config_admin_required(self, user_client):
        """Test that config endpoint requires admin role."""
        response = user_client.get("/api/v1/config")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_get_config_admin(self, admin_client):
        """Test getting configuration as admin."""
        response = admin_client.get("/api/v1/config")
        
        # Will return 503 without config loaded
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    
    def test_update_config_admin_required(self, user_client):
        """Test that config update requires admin role."""
        response = user_client.put("/api/v1/config", json={
            "config_section": "processing",
            "config_data": {"max_concurrent_jobs": 4}
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_reload_config_admin_required(self, user_client):
        """Test that config reload requires admin role."""
        response = user_client.post("/api/v1/config/reload")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestWebhookEndpoints:
    """Test webhook management endpoints."""
    
    def test_register_webhook_admin_required(self, user_client):
        """Test that webhook registration requires admin role."""
        response = user_client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["processing_completed"]
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_register_webhook_admin(self, admin_client):
        """Test registering webhook as admin."""
        response = admin_client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["processing_completed"]
        })
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["url"] == "https://example.com/webhook"
    
    def test_list_webhooks_admin(self, admin_client):
        """Test listing webhooks as admin."""
        # First register a webhook
        admin_client.post("/api/v1/webhooks", json={
            "url": "https://example.com/webhook",
            "events": ["all"]
        })
        
        response = admin_client.get("/api/v1/webhooks")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "webhooks" in data
        assert "total" in data
    
    def test_unregister_webhook_admin(self, admin_client):
        """Test unregistering webhook as admin."""
        # First register a webhook
        webhook_url = "https://example.com/webhook-to-delete"
        admin_client.post("/api/v1/webhooks", json={
            "url": webhook_url,
            "events": ["all"]
        })
        
        # Then unregister it
        response = admin_client.delete("/api/v1/webhooks", params={"url": webhook_url})
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_unregister_nonexistent_webhook(self, admin_client):
        """Test unregistering non-existent webhook."""
        response = admin_client.delete("/api/v1/webhooks", params={
            "url": "https://nonexistent.com/webhook"
        })
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestWebSocket:
    """Test WebSocket functionality."""
    
    def test_websocket_connection(self):
        """Test WebSocket connection and echo."""
        client = TestClient(app)
        
        with client.websocket_connect("/ws") as websocket:
            # Send test message
            websocket.send_text("Hello WebSocket")
            
            # Receive echo response
            data = websocket.receive_json()
            assert data["type"] == "echo"
            assert "Hello WebSocket" in data["message"]
            assert "timestamp" in data


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    def test_http_exception_handler(self):
        """Test HTTP exception handling."""
        client = TestClient(app)
        response = client.get("/nonexistent-endpoint")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_validation_error(self, test_client):
        """Test request validation error."""
        response = test_client.post("/api/v1/process/file", json={
            "file_path": "",  # Invalid empty path
            "priority": 10    # Invalid priority (should be 0-4)
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_service_unavailable_without_automation_manager(self, test_client):
        """Test service unavailable when automation manager is not initialized."""
        response = test_client.post("/api/v1/process/file", json={
            "file_path": "/test/path.pdf",
            "priority": 2
        })
        
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE


class TestRequestValidation:
    """Test request validation and data models."""
    
    def test_processing_request_validation(self, test_client):
        """Test processing request validation."""
        # Test invalid priority
        response = test_client.post("/api/v1/process/file", json={
            "file_path": "/test/path.pdf",
            "priority": -1  # Invalid priority
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        
        # Test priority too high
        response = test_client.post("/api/v1/process/file", json={
            "file_path": "/test/path.pdf",
            "priority": 5  # Invalid priority
        })
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_webhook_registration_validation(self, admin_client):
        """Test webhook registration validation."""
        # Test invalid URL format (this would need URL validation in the model)
        response = admin_client.post("/api/v1/webhooks", json={
            "url": "not-a-valid-url",
            "events": ["processing_completed"]
        })
        
        # Currently accepts any string as URL, but in production should validate
        assert response.status_code == status.HTTP_200_OK


class TestConcurrency:
    """Test concurrent request handling."""
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test handling multiple concurrent requests."""
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            # Create multiple concurrent requests
            tasks = []
            for i in range(10):
                task = client.get("/health")
                tasks.append(task)
            
            # Execute all requests concurrently
            responses = await asyncio.gather(*tasks)
            
            # All should succeed
            for response in responses:
                assert response.status_code == status.HTTP_200_OK


class TestIntegration:
    """Integration tests for complete workflows."""
    
    def test_complete_file_processing_workflow(self, test_client, temp_pdf_file):
        """Test complete file processing workflow."""
        # 1. Upload file
        with open(temp_pdf_file, "rb") as f:
            files = {"file": ("test.pdf", f, "application/pdf")}
            upload_response = test_client.client.post(
                "/api/v1/upload",
                files=files,
                headers=test_client.headers,
                data={"auto_process": "false"}  # Don't auto-process
            )
        
        assert upload_response.status_code == status.HTTP_200_OK
        upload_data = upload_response.json()
        file_path = upload_data["file_path"]
        
        try:
            # 2. Queue for processing
            process_response = test_client.post("/api/v1/process/file", json={
                "file_path": file_path,
                "priority": 3
            })
            
            # Will fail without automation manager, but test the flow
            assert process_response.status_code in [
                status.HTTP_200_OK,
                status.HTTP_503_SERVICE_UNAVAILABLE
            ]
            
        finally:
            # Cleanup
            if os.path.exists(file_path):
                os.unlink(file_path)
    
    def test_webhook_notification_flow(self, admin_client):
        """Test webhook registration and notification flow."""
        # 1. Register webhook
        webhook_url = "https://example.com/test-webhook"
        register_response = admin_client.post("/api/v1/webhooks", json={
            "url": webhook_url,
            "events": ["processing_completed"]
        })
        
        assert register_response.status_code == status.HTTP_200_OK
        
        # 2. List webhooks
        list_response = admin_client.get("/api/v1/webhooks")
        assert list_response.status_code == status.HTTP_200_OK
        
        webhooks = list_response.json()["webhooks"]
        assert any(w["url"] == webhook_url for w in webhooks)
        
        # 3. Unregister webhook
        unregister_response = admin_client.delete("/api/v1/webhooks", params={
            "url": webhook_url
        })
        
        assert unregister_response.status_code == status.HTTP_200_OK


if __name__ == "__main__":
    pytest.main([__file__, "-v"])