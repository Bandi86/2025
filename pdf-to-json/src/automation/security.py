"""
Security Module for Football Automation System

This module provides comprehensive security features including:
- Input validation and sanitization
- File type verification and malware scanning
- Rate limiting and IP whitelisting
- Secure file upload with path traversal protection
- Security middleware and utilities
"""

import os
import re
import hashlib
import mimetypes
import tempfile
import subprocess
import logging
from typing import Dict, List, Optional, Set, Any, Union, Tuple
from pathlib import Path
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict
import asyncio
import aiofiles
import magic
from fastapi import Request, HTTPException, status, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import ipaddress
import jwt
from passlib.context import CryptContext

logger = logging.getLogger(__name__)

# Security constants
MAX_FILENAME_LENGTH = 255
ALLOWED_FILENAME_CHARS = re.compile(r'^[a-zA-Z0-9._-]+$')
DANGEROUS_EXTENSIONS = {'.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.sh'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/json',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

@dataclass
class SecurityConfig:
    """Security configuration settings."""
    enable_input_validation: bool = True
    enable_file_scanning: bool = True
    enable_rate_limiting: bool = True
    enable_ip_whitelisting: bool = False
    max_file_size_mb: int = 100
    allowed_file_types: List[str] = field(default_factory=lambda: ['.pdf', '.json', '.csv', '.txt'])
    rate_limit_requests_per_minute: int = 100
    rate_limit_burst_size: int = 20
    allowed_ips: List[str] = field(default_factory=list)
    blocked_ips: List[str] = field(default_factory=list)
    jwt_secret_key: str = "change-this-in-production"
    jwt_expiration_hours: int = 24
    password_min_length: int = 8
    password_require_special: bool = True
    enable_malware_scanning: bool = False
    clamav_socket_path: str = "/var/run/clamav/clamd.ctl"
    upload_quarantine_dir: str = "quarantine"


@dataclass
class ValidationResult:
    """Result of input validation."""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    sanitized_value: Optional[Any] = None


@dataclass
class FileValidationResult:
    """Result of file validation."""
    is_valid: bool
    file_type: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: int = 0
    checksum: Optional[str] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    quarantined: bool = False
    scan_results: Optional[Dict[str, Any]] = None


class RateLimiter:
    """Rate limiting implementation with sliding window."""
    
    def __init__(self, requests_per_minute: int = 100, burst_size: int = 20):
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.requests: Dict[str, List[datetime]] = defaultdict(list)
        self.burst_tokens: Dict[str, int] = defaultdict(lambda: burst_size)
        self.last_refill: Dict[str, datetime] = defaultdict(datetime.now)
    
    def is_allowed(self, identifier: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if request is allowed for the given identifier."""
        now = datetime.now()
        
        # Refill burst tokens
        time_since_refill = (now - self.last_refill[identifier]).total_seconds()
        if time_since_refill >= 60:  # Refill every minute
            self.burst_tokens[identifier] = min(
                self.burst_size,
                self.burst_tokens[identifier] + int(time_since_refill / 60)
            )
            self.last_refill[identifier] = now
        
        # Clean old requests (older than 1 minute)
        cutoff = now - timedelta(minutes=1)
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier] 
            if req_time > cutoff
        ]
        
        # Check rate limits
        current_requests = len(self.requests[identifier])
        
        # Check burst limit first
        if self.burst_tokens[identifier] > 0:
            self.burst_tokens[identifier] -= 1
            self.requests[identifier].append(now)
            return True, {
                "allowed": True,
                "requests_in_window": current_requests + 1,
                "burst_tokens_remaining": self.burst_tokens[identifier],
                "reset_time": (now + timedelta(minutes=1)).isoformat()
            }
        
        # Check sustained rate limit
        if current_requests < self.requests_per_minute:
            self.requests[identifier].append(now)
            return True, {
                "allowed": True,
                "requests_in_window": current_requests + 1,
                "burst_tokens_remaining": 0,
                "reset_time": (now + timedelta(minutes=1)).isoformat()
            }
        
        return False, {
            "allowed": False,
            "requests_in_window": current_requests,
            "limit": self.requests_per_minute,
            "reset_time": (now + timedelta(minutes=1)).isoformat(),
            "retry_after": 60
        }


class InputValidator:
    """Comprehensive input validation and sanitization."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        
        # Common validation patterns
        self.patterns = {
            'filename': re.compile(r'^[a-zA-Z0-9._-]+$'),
            'path': re.compile(r'^[a-zA-Z0-9._/-]+$'),
            'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
            'alphanumeric': re.compile(r'^[a-zA-Z0-9]+$'),
            'safe_string': re.compile(r'^[a-zA-Z0-9\s._-]+$'),
        }
        
        # SQL injection patterns
        self.sql_injection_patterns = [
            re.compile(r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)", re.IGNORECASE),
            re.compile(r"(\b(OR|AND)\s+\d+\s*=\s*\d+)", re.IGNORECASE),
            re.compile(r"['\";]", re.IGNORECASE),
            re.compile(r"--", re.IGNORECASE),
            re.compile(r"/\*.*\*/", re.IGNORECASE),
        ]
        
        # XSS patterns
        self.xss_patterns = [
            re.compile(r"<script[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL),
            re.compile(r"javascript:", re.IGNORECASE),
            re.compile(r"on\w+\s*=", re.IGNORECASE),
            re.compile(r"<iframe[^>]*>", re.IGNORECASE),
            re.compile(r"<object[^>]*>", re.IGNORECASE),
            re.compile(r"<embed[^>]*>", re.IGNORECASE),
        ]
    
    def validate_string(self, value: str, pattern_name: str = 'safe_string', 
                       max_length: int = 1000) -> ValidationResult:
        """Validate and sanitize string input."""
        errors = []
        warnings = []
        
        if not isinstance(value, str):
            errors.append("Value must be a string")
            return ValidationResult(False, errors)
        
        # Length check
        if len(value) > max_length:
            errors.append(f"String too long (max {max_length} characters)")
        
        # Pattern check
        if pattern_name in self.patterns:
            if not self.patterns[pattern_name].match(value):
                errors.append(f"String does not match required pattern: {pattern_name}")
        
        # SQL injection check
        for pattern in self.sql_injection_patterns:
            if pattern.search(value):
                errors.append("Potential SQL injection detected")
                break
        
        # XSS check
        for pattern in self.xss_patterns:
            if pattern.search(value):
                errors.append("Potential XSS attack detected")
                break
        
        # Sanitize
        sanitized = self._sanitize_string(value)
        if sanitized != value:
            warnings.append("String was sanitized")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_value=sanitized
        )
    
    def validate_filename(self, filename: str) -> ValidationResult:
        """Validate filename for security."""
        errors = []
        warnings = []
        
        if not filename:
            errors.append("Filename cannot be empty")
            return ValidationResult(False, errors)
        
        # Length check
        if len(filename) > MAX_FILENAME_LENGTH:
            errors.append(f"Filename too long (max {MAX_FILENAME_LENGTH} characters)")
        
        # Character check
        if not ALLOWED_FILENAME_CHARS.match(filename):
            errors.append("Filename contains invalid characters")
        
        # Path traversal check
        if '..' in filename or filename.startswith('/') or '\\' in filename:
            errors.append("Path traversal attempt detected")
        
        # Extension check
        file_ext = Path(filename).suffix.lower()
        if file_ext in DANGEROUS_EXTENSIONS:
            errors.append(f"Dangerous file extension: {file_ext}")
        
        if self.config.allowed_file_types and file_ext not in self.config.allowed_file_types:
            errors.append(f"File type not allowed: {file_ext}")
        
        # Sanitize filename
        sanitized = self._sanitize_filename(filename)
        if sanitized != filename:
            warnings.append("Filename was sanitized")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_value=sanitized
        )
    
    def validate_path(self, path: str, base_path: Optional[str] = None) -> ValidationResult:
        """Validate file path for security."""
        errors = []
        warnings = []
        
        if not path:
            errors.append("Path cannot be empty")
            return ValidationResult(False, errors)
        
        # Normalize path
        normalized_path = os.path.normpath(path)
        
        # Path traversal check
        if '..' in normalized_path or normalized_path.startswith('/'):
            errors.append("Path traversal attempt detected")
        
        # Base path check
        if base_path:
            try:
                full_path = os.path.join(base_path, normalized_path)
                if not os.path.commonpath([base_path, full_path]) == base_path:
                    errors.append("Path escapes base directory")
            except ValueError:
                errors.append("Invalid path")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            sanitized_value=normalized_path
        )
    
    def _sanitize_string(self, value: str) -> str:
        """Sanitize string by removing dangerous characters."""
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Remove control characters except newline and tab
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\n\t')
        
        # Escape HTML entities
        value = value.replace('&', '&amp;')
        value = value.replace('<', '&lt;')
        value = value.replace('>', '&gt;')
        value = value.replace('"', '&quot;')
        value = value.replace("'", '&#x27;')
        
        return value.strip()
    
    def _sanitize_filename(self, filename: str) -> str:
        """Sanitize filename by removing dangerous characters."""
        # Remove path separators
        filename = filename.replace('/', '_').replace('\\', '_')
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"|?*]', '_', filename)
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Ensure not empty
        if not filename:
            filename = 'unnamed_file'
        
        return filename


class FileScanner:
    """File scanning and validation."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.quarantine_dir = Path(config.upload_quarantine_dir)
        self.quarantine_dir.mkdir(exist_ok=True)
    
    async def scan_file(self, file_path: Union[str, Path]) -> FileValidationResult:
        """Comprehensive file scanning and validation."""
        file_path = Path(file_path)
        
        if not file_path.exists():
            return FileValidationResult(
                is_valid=False,
                errors=["File does not exist"]
            )
        
        errors = []
        warnings = []
        
        # Get file info
        file_size = file_path.stat().st_size
        file_type = file_path.suffix.lower()
        
        # Size check
        max_size = self.config.max_file_size_mb * 1024 * 1024
        if file_size > max_size:
            errors.append(f"File too large: {file_size} bytes (max {max_size})")
        
        # MIME type detection
        mime_type = None
        try:
            mime_type = magic.from_file(str(file_path), mime=True)
            if mime_type not in ALLOWED_MIME_TYPES:
                warnings.append(f"Unusual MIME type: {mime_type}")
        except Exception as e:
            warnings.append(f"Could not detect MIME type: {e}")
        
        # File type validation
        if self.config.allowed_file_types and file_type not in self.config.allowed_file_types:
            errors.append(f"File type not allowed: {file_type}")
        
        # Calculate checksum
        checksum = await self._calculate_checksum(file_path)
        
        # Malware scanning
        scan_results = None
        quarantined = False
        
        if self.config.enable_malware_scanning:
            scan_results = await self._scan_malware(file_path)
            if scan_results and not scan_results.get('clean', True):
                errors.append("Malware detected")
                quarantined = await self._quarantine_file(file_path)
        
        # Content validation
        content_errors = await self._validate_file_content(file_path, file_type)
        errors.extend(content_errors)
        
        return FileValidationResult(
            is_valid=len(errors) == 0,
            file_type=file_type,
            mime_type=mime_type,
            file_size=file_size,
            checksum=checksum,
            errors=errors,
            warnings=warnings,
            quarantined=quarantined,
            scan_results=scan_results
        )
    
    async def scan_upload(self, upload_file: UploadFile) -> FileValidationResult:
        """Scan uploaded file."""
        errors = []
        warnings = []
        
        # Validate filename
        validator = InputValidator(self.config)
        filename_result = validator.validate_filename(upload_file.filename or "")
        
        if not filename_result.is_valid:
            errors.extend(filename_result.errors)
        
        # Create temporary file for scanning
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            try:
                # Read file content
                content = await upload_file.read()
                temp_file.write(content)
                temp_file.flush()
                
                # Reset file position
                await upload_file.seek(0)
                
                # Scan temporary file
                scan_result = await self.scan_file(temp_file.name)
                
                # Add filename validation errors
                scan_result.errors.extend(errors)
                scan_result.warnings.extend(warnings)
                
                return scan_result
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file.name)
                except OSError:
                    pass
    
    async def _calculate_checksum(self, file_path: Path) -> str:
        """Calculate SHA-256 checksum of file."""
        hash_sha256 = hashlib.sha256()
        
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()
    
    async def _scan_malware(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Scan file for malware using ClamAV."""
        if not os.path.exists(self.config.clamav_socket_path):
            logger.warning("ClamAV socket not found, skipping malware scan")
            return None
        
        try:
            # Use clamdscan command
            result = subprocess.run([
                'clamdscan', '--no-summary', str(file_path)
            ], capture_output=True, text=True, timeout=30)
            
            clean = result.returncode == 0
            
            return {
                'clean': clean,
                'output': result.stdout,
                'error': result.stderr if result.stderr else None,
                'scanner': 'clamav'
            }
            
        except subprocess.TimeoutExpired:
            logger.error("Malware scan timed out")
            return {'clean': False, 'error': 'Scan timeout', 'scanner': 'clamav'}
        except Exception as e:
            logger.error(f"Malware scan failed: {e}")
            return {'clean': False, 'error': str(e), 'scanner': 'clamav'}
    
    async def _quarantine_file(self, file_path: Path) -> bool:
        """Move file to quarantine directory."""
        try:
            quarantine_path = self.quarantine_dir / f"{datetime.now().isoformat()}_{file_path.name}"
            file_path.rename(quarantine_path)
            logger.warning(f"File quarantined: {file_path} -> {quarantine_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to quarantine file: {e}")
            return False
    
    async def _validate_file_content(self, file_path: Path, file_type: str) -> List[str]:
        """Validate file content based on type."""
        errors = []
        
        try:
            if file_type == '.pdf':
                # Basic PDF validation
                async with aiofiles.open(file_path, 'rb') as f:
                    header = await f.read(4)
                    if header != b'%PDF':
                        errors.append("Invalid PDF file header")
            
            elif file_type == '.json':
                # JSON validation
                import json
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    content = await f.read()
                    try:
                        json.loads(content)
                    except json.JSONDecodeError as e:
                        errors.append(f"Invalid JSON: {e}")
            
            elif file_type in ['.csv', '.txt']:
                # Text file validation
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        await f.read(1024)  # Try to read first 1KB
                    except UnicodeDecodeError:
                        errors.append("File contains invalid UTF-8 characters")
        
        except Exception as e:
            errors.append(f"Content validation failed: {e}")
        
        return errors


class IPWhitelist:
    """IP address whitelisting and blacklisting."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.allowed_networks = []
        self.blocked_networks = []
        
        # Parse allowed IPs
        for ip_str in config.allowed_ips:
            try:
                self.allowed_networks.append(ipaddress.ip_network(ip_str, strict=False))
            except ValueError as e:
                logger.error(f"Invalid allowed IP: {ip_str} - {e}")
        
        # Parse blocked IPs
        for ip_str in config.blocked_ips:
            try:
                self.blocked_networks.append(ipaddress.ip_network(ip_str, strict=False))
            except ValueError as e:
                logger.error(f"Invalid blocked IP: {ip_str} - {e}")
    
    def is_allowed(self, client_ip: str) -> Tuple[bool, str]:
        """Check if IP address is allowed."""
        try:
            ip = ipaddress.ip_address(client_ip)
            
            # Check blocked list first
            for network in self.blocked_networks:
                if ip in network:
                    return False, f"IP {client_ip} is blocked"
            
            # If no allowed IPs configured, allow all (except blocked)
            if not self.allowed_networks:
                return True, "No IP restrictions"
            
            # Check allowed list
            for network in self.allowed_networks:
                if ip in network:
                    return True, f"IP {client_ip} is whitelisted"
            
            return False, f"IP {client_ip} is not whitelisted"
            
        except ValueError:
            return False, f"Invalid IP address: {client_ip}"


class SecurityManager:
    """Main security manager coordinating all security features."""
    
    def __init__(self, config: SecurityConfig):
        self.config = config
        self.rate_limiter = RateLimiter(
            config.rate_limit_requests_per_minute,
            config.rate_limit_burst_size
        )
        self.input_validator = InputValidator(config)
        self.file_scanner = FileScanner(config)
        self.ip_whitelist = IPWhitelist(config)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        logger.info("Security manager initialized")
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (when behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"
    
    async def check_rate_limit(self, request: Request) -> Dict[str, Any]:
        """Check rate limiting for request."""
        if not self.config.enable_rate_limiting:
            return {"allowed": True, "reason": "Rate limiting disabled"}
        
        client_ip = self.get_client_ip(request)
        allowed, info = self.rate_limiter.is_allowed(client_ip)
        
        if not allowed:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        
        return info
    
    def check_ip_whitelist(self, request: Request) -> Tuple[bool, str]:
        """Check IP whitelisting for request."""
        if not self.config.enable_ip_whitelisting:
            return True, "IP whitelisting disabled"
        
        client_ip = self.get_client_ip(request)
        return self.ip_whitelist.is_allowed(client_ip)
    
    async def validate_file_upload(self, upload_file: UploadFile) -> FileValidationResult:
        """Validate uploaded file."""
        return await self.file_scanner.scan_upload(upload_file)
    
    def hash_password(self, password: str) -> str:
        """Hash password securely."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def validate_password_strength(self, password: str) -> ValidationResult:
        """Validate password strength."""
        errors = []
        warnings = []
        
        if len(password) < self.config.password_min_length:
            errors.append(f"Password must be at least {self.config.password_min_length} characters")
        
        if self.config.password_require_special:
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                errors.append("Password must contain at least one special character")
            
            if not re.search(r'[A-Z]', password):
                warnings.append("Password should contain uppercase letters")
            
            if not re.search(r'[a-z]', password):
                warnings.append("Password should contain lowercase letters")
            
            if not re.search(r'\d', password):
                warnings.append("Password should contain numbers")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings
        )
    
    def create_jwt_token(self, payload: Dict[str, Any], 
                        expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT token."""
        to_encode = payload.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=self.config.jwt_expiration_hours)
        
        to_encode.update({"exp": expire})
        
        return jwt.encode(to_encode, self.config.jwt_secret_key, algorithm="HS256")
    
    def verify_jwt_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token and return payload."""
        try:
            payload = jwt.decode(token, self.config.jwt_secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    async def log_security_event(self, event_type: str, details: Dict[str, Any], 
                                request: Optional[Request] = None):
        """Log security events for monitoring."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "details": details
        }
        
        if request:
            log_data.update({
                "client_ip": self.get_client_ip(request),
                "user_agent": request.headers.get("User-Agent"),
                "method": request.method,
                "url": str(request.url)
            })
        
        logger.warning(f"Security event: {event_type}", extra=log_data)