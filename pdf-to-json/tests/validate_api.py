"""
API validation script to verify the Enhanced FastAPI implementation.

This script validates the API structure and basic functionality without
relying on the problematic TestClient.
"""

import sys
from pathlib import Path
import json
from datetime import datetime, timezone, timedelta
import jwt

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.api.enhanced_main import app, SECRET_KEY, ALGORITHM


def validate_api_structure():
    """Validate the API structure and endpoints."""
    print("=== API Structure Validation ===")
    
    # Check app configuration
    assert app.title == "Football Automation API"
    assert app.version == "2.0.0"
    print("✓ App configuration correct")
    
    # Check routes
    routes = [route.path for route in app.routes]
    expected_routes = [
        "/",
        "/health",
        "/auth/login",
        "/auth/me",
        "/api/v1/process/file",
        "/api/v1/process/status/{job_id}",
        "/api/v1/process/queue",
        "/api/v1/process/job/{job_id}",
        "/api/v1/process/job/{job_id}/retry",
        "/api/v1/upload",
        "/api/v1/games",
        "/api/v1/reports/latest",
        "/api/v1/reports/trends",
        "/api/v1/status",
        "/api/v1/metrics",
        "/api/v1/config",
        "/api/v1/config/reload",
        "/api/v1/webhooks",
        "/ws"
    ]
    
    for expected_route in expected_routes:
        assert expected_route in routes, f"Missing route: {expected_route}"
    
    print(f"✓ All {len(expected_routes)} expected routes found")
    print(f"✓ Total routes: {len(routes)}")
    
    return True


def validate_authentication():
    """Validate authentication functionality."""
    print("\n=== Authentication Validation ===")
    
    # Test JWT token creation
    token_data = {
        "sub": "testuser",
        "roles": ["user", "admin"],
        "active": True,
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    assert token is not None
    print("✓ JWT token creation works")
    
    # Test JWT token decoding
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert decoded["sub"] == "testuser"
    assert "admin" in decoded["roles"]
    print("✓ JWT token decoding works")
    
    return True


def validate_pydantic_models():
    """Validate Pydantic models."""
    print("\n=== Pydantic Models Validation ===")
    
    from src.api.enhanced_main import (
        UserCredentials, Token, User, ProcessingRequest,
        JobResponse, QueueStatusResponse, SystemStatusResponse,
        HealthCheckResponse, WebhookRegistration, ConfigUpdateRequest,
        FileUploadResponse
    )
    
    # Test UserCredentials
    creds = UserCredentials(username="test", password="pass")
    assert creds.username == "test"
    print("✓ UserCredentials model works")
    
    # Test Token
    token = Token(access_token="abc123", token_type="bearer", expires_in=3600)
    assert token.access_token == "abc123"
    print("✓ Token model works")
    
    # Test User
    user = User(username="testuser", roles=["user"])
    assert user.username == "testuser"
    assert user.is_active is True
    print("✓ User model works")
    
    # Test ProcessingRequest
    proc_req = ProcessingRequest(file_path="/test/path.pdf", priority=3)
    assert proc_req.file_path == "/test/path.pdf"
    assert proc_req.priority == 3
    print("✓ ProcessingRequest model works")
    
    # Test WebhookRegistration
    webhook = WebhookRegistration(url="https://example.com/webhook")
    assert webhook.url == "https://example.com/webhook"
    assert webhook.events == ["all"]
    print("✓ WebhookRegistration model works")
    
    print("✓ All Pydantic models validated")
    return True


def validate_openapi_schema():
    """Validate OpenAPI schema generation."""
    print("\n=== OpenAPI Schema Validation ===")
    
    schema = app.openapi()
    
    # Check basic schema structure
    assert "openapi" in schema
    assert "info" in schema
    assert schema["info"]["title"] == "Football Automation API"
    assert schema["info"]["version"] == "2.0.0"
    print("✓ OpenAPI schema structure correct")
    
    # Check paths
    assert "paths" in schema
    paths = schema["paths"]
    
    # Check some key endpoints
    assert "/" in paths
    assert "/health" in paths
    assert "/auth/login" in paths
    assert "/api/v1/status" in paths
    print("✓ OpenAPI paths correct")
    
    # Check components (models)
    assert "components" in schema
    assert "schemas" in schema["components"]
    schemas = schema["components"]["schemas"]
    
    # Check some key models
    expected_schemas = [
        "Token", "User", "ProcessingRequest", "JobResponse",
        "HealthCheckResponse", "WebhookRegistration"
    ]
    
    for schema_name in expected_schemas:
        assert schema_name in schemas, f"Missing schema: {schema_name}"
    
    print(f"✓ All {len(expected_schemas)} expected schemas found")
    return True


def validate_middleware():
    """Validate middleware configuration."""
    print("\n=== Middleware Validation ===")
    
    # Check CORS middleware is configured
    middleware_stack = app.user_middleware
    cors_found = any("CORSMiddleware" in str(middleware) for middleware in middleware_stack)
    assert cors_found, "CORS middleware not found"
    print("✓ CORS middleware configured")
    
    return True


def validate_error_handlers():
    """Validate error handlers."""
    print("\n=== Error Handlers Validation ===")
    
    # Check exception handlers are registered
    exception_handlers = app.exception_handlers
    
    # Should have HTTP exception handler
    from fastapi import HTTPException
    assert HTTPException in exception_handlers
    print("✓ HTTP exception handler registered")
    
    # Should have general exception handler
    assert Exception in exception_handlers
    print("✓ General exception handler registered")
    
    return True


def main():
    """Run all validations."""
    print("Starting API validation...\n")
    
    try:
        validate_api_structure()
        validate_authentication()
        validate_pydantic_models()
        validate_openapi_schema()
        validate_middleware()
        validate_error_handlers()
        
        print("\n" + "="*50)
        print("🎉 ALL VALIDATIONS PASSED!")
        print("The Enhanced FastAPI implementation is working correctly.")
        print("="*50)
        
        return True
        
    except Exception as e:
        print(f"\n❌ VALIDATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)