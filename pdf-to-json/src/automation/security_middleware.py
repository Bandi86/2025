"""
Security Middleware for FastAPI

This module provides security middleware for the FastAPI application including:
- Rate limiting
- IP whitelisting/blacklisting
- Request validation
- Security headers
- CORS protection
"""

import logging
from typing import Callable, Dict, Any, Optional
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import time

from .security import SecurityManager, SecurityConfig

logger = logging.getLogger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Main security middleware."""
    
    def __init__(self, app, security_manager: SecurityManager):
        super().__init__(app)
        self.security_manager = security_manager
        self.start_time = time.time()
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request through security checks."""
        start_time = time.time()
        
        try:
            # Skip security checks for health endpoints
            if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
                response = await call_next(request)
                return self._add_security_headers(response)
            
            # IP whitelisting check
            ip_allowed, ip_reason = self.security_manager.check_ip_whitelist(request)
            if not ip_allowed:
                await self.security_manager.log_security_event(
                    "ip_blocked",
                    {"reason": ip_reason},
                    request
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "Access denied", "reason": ip_reason}
                )
            
            # Rate limiting check
            rate_limit_info = await self.security_manager.check_rate_limit(request)
            if not rate_limit_info.get("allowed", True):
                await self.security_manager.log_security_event(
                    "rate_limit_exceeded",
                    rate_limit_info,
                    request
                )
                
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "details": rate_limit_info
                    }
                )
                
                # Add rate limit headers
                response.headers["X-RateLimit-Limit"] = str(
                    self.security_manager.config.rate_limit_requests_per_minute
                )
                response.headers["X-RateLimit-Remaining"] = "0"
                response.headers["X-RateLimit-Reset"] = rate_limit_info.get("reset_time", "")
                response.headers["Retry-After"] = str(rate_limit_info.get("retry_after", 60))
                
                return response
            
            # Process request
            response = await call_next(request)
            
            # Add security headers
            response = self._add_security_headers(response)
            
            # Add rate limit headers to successful responses
            if rate_limit_info.get("requests_in_window") is not None:
                response.headers["X-RateLimit-Limit"] = str(
                    self.security_manager.config.rate_limit_requests_per_minute
                )
                response.headers["X-RateLimit-Remaining"] = str(
                    max(0, self.security_manager.config.rate_limit_requests_per_minute - 
                        rate_limit_info["requests_in_window"])
                )
                response.headers["X-RateLimit-Reset"] = rate_limit_info.get("reset_time", "")
            
            # Log successful request
            processing_time = time.time() - start_time
            if processing_time > 1.0:  # Log slow requests
                logger.info(f"Slow request: {request.method} {request.url.path} took {processing_time:.2f}s")
            
            return response
            
        except Exception as e:
            # Log security middleware errors
            await self.security_manager.log_security_event(
                "middleware_error",
                {"error": str(e)},
                request
            )
            
            logger.error(f"Security middleware error: {e}")
            
            # Return generic error to avoid information disclosure
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"}
            )
    
    def _add_security_headers(self, response: Response) -> Response:
        """Add security headers to response."""
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none';"
        )
        
        # HSTS (only for HTTPS)
        if hasattr(response, 'headers') and response.headers.get('X-Forwarded-Proto') == 'https':
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Server information hiding
        response.headers["Server"] = "Football-Automation-API"
        
        return response


class FileUploadSecurityMiddleware(BaseHTTPMiddleware):
    """Specialized middleware for file upload security."""
    
    def __init__(self, app, security_manager: SecurityManager):
        super().__init__(app)
        self.security_manager = security_manager
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process file upload requests with additional security."""
        
        # Only apply to file upload endpoints
        if not (request.method == "POST" and 
                any(path in request.url.path for path in ["/upload", "/api/v1/upload", "/convert"])):
            return await call_next(request)
        
        try:
            # Check content type
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("multipart/form-data"):
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"error": "Invalid content type for file upload"}
                )
            
            # Check content length
            content_length = request.headers.get("content-length")
            if content_length:
                max_size = self.security_manager.config.max_file_size_mb * 1024 * 1024
                if int(content_length) > max_size:
                    await self.security_manager.log_security_event(
                        "file_too_large",
                        {"content_length": content_length, "max_size": max_size},
                        request
                    )
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={"error": f"File too large (max {self.security_manager.config.max_file_size_mb}MB)"}
                    )
            
            # Process request
            response = await call_next(request)
            
            return response
            
        except Exception as e:
            await self.security_manager.log_security_event(
                "file_upload_error",
                {"error": str(e)},
                request
            )
            
            logger.error(f"File upload security error: {e}")
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "File upload failed"}
            )


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for request validation and sanitization."""
    
    def __init__(self, app, security_manager: SecurityManager):
        super().__init__(app)
        self.security_manager = security_manager
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate and sanitize request data."""
        
        if not self.security_manager.config.enable_input_validation:
            return await call_next(request)
        
        try:
            # Validate query parameters
            for key, value in request.query_params.items():
                validation_result = self.security_manager.input_validator.validate_string(
                    value, max_length=1000
                )
                
                if not validation_result.is_valid:
                    await self.security_manager.log_security_event(
                        "invalid_query_param",
                        {"param": key, "errors": validation_result.errors},
                        request
                    )
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={
                            "error": "Invalid query parameter",
                            "param": key,
                            "details": validation_result.errors
                        }
                    )
            
            # Validate path parameters
            path_params = getattr(request, "path_params", {})
            for key, value in path_params.items():
                if isinstance(value, str):
                    validation_result = self.security_manager.input_validator.validate_string(
                        value, pattern_name='alphanumeric', max_length=100
                    )
                    
                    if not validation_result.is_valid:
                        await self.security_manager.log_security_event(
                            "invalid_path_param",
                            {"param": key, "errors": validation_result.errors},
                            request
                        )
                        return JSONResponse(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            content={
                                "error": "Invalid path parameter",
                                "param": key,
                                "details": validation_result.errors
                            }
                        )
            
            # Process request
            response = await call_next(request)
            
            return response
            
        except Exception as e:
            await self.security_manager.log_security_event(
                "request_validation_error",
                {"error": str(e)},
                request
            )
            
            logger.error(f"Request validation error: {e}")
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Request validation failed"}
            )


def create_security_middleware_stack(app, security_config: SecurityConfig):
    """Create and configure all security middleware."""
    security_manager = SecurityManager(security_config)
    
    # Add middleware in reverse order (last added is executed first)
    app.add_middleware(RequestValidationMiddleware, security_manager=security_manager)
    app.add_middleware(FileUploadSecurityMiddleware, security_manager=security_manager)
    app.add_middleware(SecurityMiddleware, security_manager=security_manager)
    
    return security_manager