# Football Automation System - API Reference

## Overview

The Football Automation System provides a comprehensive REST API for automated PDF processing, data extraction, and system management. This API enables integration with external systems and provides programmatic access to all system functionality.

## Base URL

```
http://localhost:8000  # Development
https://your-domain.com  # Production
```

## Authentication

The API uses JWT (JSON Web Token) based authentication with role-based access control.

### Authentication Flow

1. **Login**: POST `/auth/login` with credentials
2. **Receive Token**: Get JWT token in response
3. **Use Token**: Include token in `Authorization` header for subsequent requests
4. **Token Refresh**: Tokens expire after configured time (default: 24 hours)

### Example Authentication

```bash
# Login and get token
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'

# Response
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}

# Use token in subsequent requests
curl -X GET "http://localhost:8000/api/v1/status" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### GET /auth/me

Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["admin"],
  "is_active": true
}
```

### File Processing Endpoints

#### POST /api/v1/upload

Upload a PDF file for processing.

**Headers:** `Authorization: Bearer <token>`

**Request:** Multipart form data
- `file`: PDF file (required)
- `priority`: Processing priority 0-4 (optional, default: 2)
- `auto_process`: Auto-queue for processing (optional, default: true)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file_path": "source/uploaded_file.pdf",
  "job_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "priority=3" \
  -F "auto_process=true"
```

#### POST /api/v1/process/file

Queue a file for processing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "file_path": "source/document.pdf",
  "priority": 2,
  "job_type": "pdf_processing",
  "parameters": {
    "extract_football": true,
    "main_matches_only": false
  }
}
```

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "File queued for processing",
  "status": "queued"
}
```

#### GET /api/v1/process/status/{job_id}

Get status of a specific processing job.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:05:00Z",
  "progress_percent": 45.0,
  "current_stage": "team_normalization",
  "result": null,
  "error": null,
  "processing_time": 300.5
}
```

#### GET /api/v1/process/queue

Get current processing queue status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "total_jobs": 10,
  "pending_jobs": 3,
  "running_jobs": 2,
  "completed_jobs": 4,
  "failed_jobs": 1,
  "queue_length": 3,
  "active_workers": 2,
  "max_workers": 4
}
```

#### DELETE /api/v1/process/job/{job_id}

Cancel a processing job (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Job cancelled successfully"
}
```

### Data Access Endpoints

#### GET /api/v1/games

Get processed game data with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `date`: Filter by date (YYYY-MM-DD)
- `league`: Filter by league name
- `team`: Filter by team name
- `limit`: Number of results (default: 100, max: 1000)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "games": [
    {
      "league": "Premier League",
      "date": "2025-01-01",
      "time": "15:00",
      "home_team": "Arsenal",
      "away_team": "Chelsea",
      "main_market": {
        "market_type": "1X2",
        "odds": {
          "1": 2.50,
          "X": 3.20,
          "2": 2.80
        }
      },
      "additional_markets": []
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0,
  "filters": {
    "date": "2025-01-01",
    "league": "Premier League"
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/games?date=2025-01-01&league=Premier%20League&limit=50" \
  -H "Authorization: Bearer <token>"
```

#### GET /api/v1/reports/latest

Get the latest processing report.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "report_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2025-01-01T00:00:00Z",
  "summary": {
    "total_games": 150,
    "leagues_processed": 5,
    "teams_normalized": 30,
    "anomalies_detected": 3,
    "processing_time": 45.2
  },
  "data": {
    "league_breakdown": {},
    "anomalies": [],
    "quality_metrics": {}
  }
}
```

#### GET /api/v1/reports/trends

Get trend analysis report.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days`: Number of days for trend analysis (default: 30, max: 365)

**Response:**
```json
{
  "period_days": 30,
  "trends": {
    "games_per_day": [],
    "leagues_activity": {},
    "processing_performance": {},
    "anomaly_trends": []
  },
  "generated_at": "2025-01-01T00:00:00Z"
}
```

### System Monitoring Endpoints

#### GET /health

Health check endpoint for load balancers and monitoring systems.

**No authentication required**

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "2.0.0",
  "components": {
    "automation_manager": true,
    "database": true,
    "cache": true,
    "file_watcher": true,
    "web_downloader": true
  },
  "system_metrics": {
    "memory_usage_percent": 45.2,
    "cpu_usage_percent": 12.5,
    "disk_usage_percent": 67.8,
    "uptime_seconds": 86400
  }
}
```

#### GET /api/v1/status

Get comprehensive system status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "is_running": true,
  "start_time": "2025-01-01T00:00:00Z",
  "uptime_seconds": 3600,
  "components_status": {
    "automation_manager": "running",
    "file_watcher": "running",
    "web_downloader": "running",
    "processing_manager": "running"
  },
  "system_health": {
    "memory_usage": 45.2,
    "cpu_usage": 12.5,
    "disk_usage": 67.8,
    "active_connections": 5
  },
  "active_jobs": 2,
  "total_jobs_processed": 150,
  "last_download": "2025-01-01T00:00:00Z",
  "last_processing": "2025-01-01T00:05:00Z"
}
```

#### GET /api/v1/metrics

Get detailed system metrics (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "system": {
    "memory": {
      "total": 8589934592,
      "available": 4294967296,
      "percent": 50.0
    },
    "cpu": {
      "percent": 12.5,
      "count": 8
    },
    "disk": {
      "total": 1099511627776,
      "used": 549755813888,
      "free": 549755813888,
      "percent": 50.0
    }
  },
  "application": {
    "websocket_connections": 5,
    "webhook_urls": 2,
    "automation_running": true,
    "cache_hit_ratio": 0.85,
    "average_processing_time": 45.2
  }
}
```

### Configuration Management Endpoints

#### GET /api/v1/config

Get current system configuration (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "web_downloader": {
    "url": "https://example.com/football-data",
    "check_interval": 3600,
    "download_path": "source/",
    "max_retries": 3
  },
  "file_watcher": {
    "watch_path": "source/",
    "file_patterns": ["*.pdf"],
    "debounce_time": 5
  },
  "processing": {
    "max_concurrent": 2,
    "retry_attempts": 3,
    "timeout": 300
  }
}
```

#### PUT /api/v1/config

Update system configuration (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "config_section": "processing",
  "config_data": {
    "max_concurrent": 4,
    "timeout": 600
  }
}
```

**Response:**
```json
{
  "message": "Configuration updated successfully",
  "updated_section": "processing",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### POST /api/v1/config/reload

Reload system configuration (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Configuration reloaded successfully",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Webhook Management Endpoints

#### POST /api/v1/webhooks

Register a webhook URL for event notifications (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["processing_completed", "system_error"],
  "secret": "optional_secret_for_verification"
}
```

**Response:**
```json
{
  "message": "Webhook registered successfully",
  "url": "https://example.com/webhook",
  "events": ["processing_completed", "system_error"]
}
```

#### GET /api/v1/webhooks

List registered webhook URLs (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "webhooks": [
    {
      "url": "https://example.com/webhook",
      "events": ["processing_completed", "system_error"],
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### DELETE /api/v1/webhooks

Unregister a webhook URL (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `url`: Webhook URL to unregister

**Response:**
```json
{
  "message": "Webhook unregistered successfully"
}
```

## WebSocket API

### Connection

Connect to WebSocket endpoint for real-time updates:

```
ws://localhost:8000/ws  # Development
wss://your-domain.com/ws  # Production (HTTPS)
```

### Message Types

The WebSocket sends JSON messages with the following structure:

```json
{
  "type": "message_type",
  "data": {},
  "timestamp": "2025-01-01T00:00:00Z"
}
```

#### Message Types:

- `processing_started`: Job processing started
- `processing_progress`: Job progress update
- `processing_completed`: Job completed successfully
- `processing_failed`: Job failed
- `system_error`: System-level error
- `file_detected`: New file detected
- `download_completed`: Web download completed
- `echo`: Echo message for testing

#### Example Messages:

```json
{
  "type": "processing_progress",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "progress": 45.0,
    "stage": "team_normalization",
    "estimated_remaining": 120
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

```json
{
  "type": "processing_completed",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "result": {
      "games_processed": 150,
      "anomalies_detected": 3
    },
    "processing_time": 300.5
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### WebSocket Client Example

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = function(event) {
    console.log('WebSocket connected');
    ws.send('Hello Server!');
};

ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    console.log('Received:', message);
    
    switch(message.type) {
        case 'processing_progress':
            updateProgressBar(message.data.progress);
            break;
        case 'processing_completed':
            showNotification('Processing completed!');
            break;
        case 'system_error':
            showError(message.data.error);
            break;
    }
};

ws.onclose = function(event) {
    console.log('WebSocket disconnected');
};
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Response Format

```json
{
  "error": {
    "code": 400,
    "message": "Validation error",
    "details": "File size exceeds maximum allowed size",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

### Common Error Scenarios

#### Authentication Errors

```json
{
  "error": {
    "code": 401,
    "message": "Token expired",
    "details": "JWT token has expired. Please login again.",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

#### Validation Errors

```json
{
  "error": {
    "code": 422,
    "message": "Validation error",
    "details": {
      "file": ["File type not supported. Only PDF files are allowed."],
      "priority": ["Priority must be between 0 and 4."]
    },
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authenticated users**: 1000 requests per minute
- **Admin users**: 10000 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhook Notifications

### Webhook Events

The system can send webhook notifications for the following events:

- `processing_started`: When a processing job starts
- `processing_progress`: Progress updates during processing (configurable frequency)
- `processing_completed`: When a processing job completes successfully
- `processing_failed`: When a processing job fails
- `system_error`: System-level errors
- `file_detected`: New file detected by file watcher
- `download_completed`: Web download completed
- `config_changed`: System configuration changed

### Webhook Payload Format

```json
{
  "event": "processing_completed",
  "timestamp": "2025-01-01T00:00:00Z",
  "data": {
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "file_path": "source/document.pdf",
    "result": {
      "games_processed": 150,
      "anomalies_detected": 3,
      "processing_time": 300.5
    }
  },
  "signature": "sha256=abc123..."
}
```

### Webhook Security

Webhooks can be secured using HMAC signatures:

1. Register webhook with a secret
2. System generates HMAC-SHA256 signature using the secret
3. Signature is sent in `X-Signature-256` header
4. Verify signature on your end to ensure authenticity

```python
import hmac
import hashlib

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected_signature}", signature)
```

## SDK Examples

### Python SDK Example

```python
import httpx
import asyncio
from typing import Optional, Dict, Any

class FootballAutomationClient:
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token: Optional[str] = None
        self.client = httpx.AsyncClient()
    
    async def authenticate(self):
        """Authenticate and get JWT token"""
        response = await self.client.post(
            f"{self.base_url}/auth/login",
            json={"username": self.username, "password": self.password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        return self.token
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        if not self.token:
            raise ValueError("Not authenticated. Call authenticate() first.")
        return {"Authorization": f"Bearer {self.token}"}
    
    async def upload_file(self, file_path: str, priority: int = 2, auto_process: bool = True) -> Dict[str, Any]:
        """Upload a PDF file for processing"""
        with open(file_path, "rb") as f:
            files = {"file": (file_path, f, "application/pdf")}
            data = {"priority": priority, "auto_process": auto_process}
            response = await self.client.post(
                f"{self.base_url}/api/v1/upload",
                files=files,
                data=data,
                headers=self._get_headers()
            )
        response.raise_for_status()
        return response.json()
    
    async def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get status of a processing job"""
        response = await self.client.get(
            f"{self.base_url}/api/v1/process/status/{job_id}",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_games(self, date: Optional[str] = None, league: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
        """Get processed game data"""
        params = {"limit": limit}
        if date:
            params["date"] = date
        if league:
            params["league"] = league
        
        response = await self.client.get(
            f"{self.base_url}/api/v1/games",
            params=params,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Usage example
async def main():
    client = FootballAutomationClient(
        base_url="http://localhost:8000",
        username="admin",
        password="admin123"
    )
    
    try:
        # Authenticate
        await client.authenticate()
        
        # Upload file
        result = await client.upload_file("document.pdf", priority=3)
        job_id = result["job_id"]
        print(f"File uploaded, job ID: {job_id}")
        
        # Monitor job status
        while True:
            status = await client.get_job_status(job_id)
            print(f"Job status: {status['status']}, Progress: {status['progress_percent']}%")
            
            if status["status"] in ["completed", "failed"]:
                break
            
            await asyncio.sleep(5)
        
        # Get processed games
        games = await client.get_games(date="2025-01-01")
        print(f"Found {games['total']} games")
        
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

### JavaScript/Node.js SDK Example

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class FootballAutomationClient {
    constructor(baseUrl, username, password) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        this.token = null;
        this.client = axios.create({ baseURL: baseUrl });
    }
    
    async authenticate() {
        const response = await this.client.post('/auth/login', {
            username: this.username,
            password: this.password
        });
        
        this.token = response.data.access_token;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return this.token;
    }
    
    async uploadFile(filePath, priority = 2, autoProcess = true) {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('priority', priority.toString());
        form.append('auto_process', autoProcess.toString());
        
        const response = await this.client.post('/api/v1/upload', form, {
            headers: form.getHeaders()
        });
        
        return response.data;
    }
    
    async getJobStatus(jobId) {
        const response = await this.client.get(`/api/v1/process/status/${jobId}`);
        return response.data;
    }
    
    async getGames(options = {}) {
        const params = new URLSearchParams();
        if (options.date) params.append('date', options.date);
        if (options.league) params.append('league', options.league);
        if (options.limit) params.append('limit', options.limit.toString());
        
        const response = await this.client.get(`/api/v1/games?${params}`);
        return response.data;
    }
    
    async monitorJob(jobId, callback) {
        const checkStatus = async () => {
            const status = await this.getJobStatus(jobId);
            callback(status);
            
            if (!['completed', 'failed'].includes(status.status)) {
                setTimeout(checkStatus, 5000);
            }
        };
        
        await checkStatus();
    }
}

// Usage example
async function main() {
    const client = new FootballAutomationClient(
        'http://localhost:8000',
        'admin',
        'admin123'
    );
    
    try {
        // Authenticate
        await client.authenticate();
        console.log('Authenticated successfully');
        
        // Upload file
        const result = await client.uploadFile('document.pdf', 3);
        console.log(`File uploaded, job ID: ${result.job_id}`);
        
        // Monitor job
        await client.monitorJob(result.job_id, (status) => {
            console.log(`Job status: ${status.status}, Progress: ${status.progress_percent}%`);
        });
        
        // Get games
        const games = await client.getGames({ date: '2025-01-01' });
        console.log(`Found ${games.total} games`);
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

main();
```

## Testing

### API Testing with curl

```bash
# Test authentication
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Test file upload
curl -X POST "http://localhost:8000/api/v1/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf" \
  -F "priority=3"

# Test job status
curl -X GET "http://localhost:8000/api/v1/process/status/<job_id>" \
  -H "Authorization: Bearer <token>"

# Test health check
curl -X GET "http://localhost:8000/health"
```

### API Testing with Python

```python
import pytest
import httpx

@pytest.mark.asyncio
async def test_api_workflow():
    async with httpx.AsyncClient() as client:
        # Test authentication
        auth_response = await client.post(
            "http://localhost:8000/auth/login",
            json={"username": "admin", "password": "admin123"}
        )
        assert auth_response.status_code == 200
        token = auth_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test health check
        health_response = await client.get("http://localhost:8000/health")
        assert health_response.status_code == 200
        assert health_response.json()["status"] == "healthy"
        
        # Test status endpoint
        status_response = await client.get(
            "http://localhost:8000/api/v1/status",
            headers=headers
        )
        assert status_response.status_code == 200
```

## Production Deployment

### Environment Variables

```bash
# JWT Configuration
export JWT_SECRET_KEY="your-super-secret-key-change-in-production"
export JWT_EXPIRATION_HOURS=24

# Database Configuration
export DATABASE_URL="postgresql://user:password@localhost:5432/football_automation"

# Redis Configuration
export REDIS_URL="redis://localhost:6379/0"

# API Configuration
export API_HOST="0.0.0.0"
export API_PORT=8000
export API_WORKERS=4
export MAX_FILE_SIZE_MB=100

# CORS Configuration
export CORS_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"

# Rate Limiting
export RATE_LIMIT_PER_MINUTE=1000
export RATE_LIMIT_BURST=100

# Webhook Configuration
export WEBHOOK_TIMEOUT_SECONDS=30
export WEBHOOK_MAX_RETRIES=3
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.api.enhanced_main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Support and Troubleshooting

### Common Issues

1. **Authentication Failed**: Check username/password and ensure user exists
2. **File Upload Failed**: Verify file size limits and file type restrictions
3. **WebSocket Connection Failed**: Check CORS settings and proxy configuration
4. **Rate Limit Exceeded**: Implement exponential backoff in your client
5. **Job Stuck in Queue**: Check system resources and processing manager status

### Debug Mode

Enable debug mode for detailed error information:

```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
```

### Health Monitoring

Monitor the `/health` endpoint for system status:

```bash
# Simple health check
curl http://localhost:8000/health

# Detailed monitoring with jq
curl -s http://localhost:8000/health | jq '.components'
```

For more detailed troubleshooting, see the [Deployment Guide](DEPLOYMENT_GUIDE.md) and [User Manual](USER_MANUAL.md).