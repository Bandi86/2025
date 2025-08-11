# Football Automation System - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation Methods](#installation-methods)
4. [Docker Deployment](#docker-deployment)
5. [Manual Installation](#manual-installation)
6. [Configuration](#configuration)
7. [Production Setup](#production-setup)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Scaling and Performance](#scaling-and-performance)

## Overview

This guide provides comprehensive instructions for deploying the Football Automation System in various environments, from development to production. The system supports multiple deployment methods including Docker containers, manual installation, and cloud deployment.

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Server    │    │   Application   │
│    (Nginx)      │────│    (Nginx)      │────│   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Database    │    │      Cache      │    │   File Storage  │
│  (PostgreSQL)   │    │    (Redis)      │    │   (Local/NFS)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **Memory**: 4 GB RAM
- **Storage**: 20 GB available space
- **Network**: Stable internet connection
- **OS**: Linux (Ubuntu 20.04+), macOS (10.15+), Windows 10+

### Recommended Requirements

- **CPU**: 4+ cores, 2.5+ GHz
- **Memory**: 8+ GB RAM
- **Storage**: 100+ GB SSD
- **Network**: High-speed internet connection
- **OS**: Linux (Ubuntu 22.04 LTS)

### Software Dependencies

- **Python**: 3.11 or higher
- **Docker**: 20.10+ (for containerized deployment)
- **Docker Compose**: 2.0+ (for multi-container setup)
- **PostgreSQL**: 13+ (for production database)
- **Redis**: 6.0+ (for caching)
- **Nginx**: 1.18+ (for reverse proxy)

## Installation Methods

### Quick Start (Docker)

The fastest way to get started:

```bash
# Clone the repository
git clone <repository-url>
cd football-automation-system

# Start with Docker Compose
docker-compose up -d

# Access the application
open http://localhost:8000
```

### Development Setup

For development and testing:

```bash
# Clone and setup virtual environment
git clone <repository-url>
cd football-automation-system
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn src.api.enhanced_main:app --reload
```

### Production Deployment

For production environments, see the [Production Setup](#production-setup) section.

## Docker Deployment

### Single Container Deployment

#### 1. Build the Docker Image

```bash
# Build the application image
docker build -t football-automation:latest .

# Verify the image
docker images | grep football-automation
```

#### 2. Run the Container

```bash
# Run with basic configuration
docker run -d \
  --name football-automation \
  -p 8000:8000 \
  -v $(pwd)/source:/app/source \
  -v $(pwd)/jsons:/app/jsons \
  -v $(pwd)/config:/app/config \
  -e JWT_SECRET_KEY="your-secret-key" \
  football-automation:latest

# Check container status
docker ps
docker logs football-automation
```

### Multi-Container Deployment with Docker Compose

#### 1. Docker Compose Configuration

Create or use the provided `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/football_automation
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=your-super-secret-key-change-in-production
    volumes:
      - ./source:/app/source
      - ./jsons:/app/jsons
      - ./config:/app/config
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=football_automation
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### 2. Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app

# Scale the application
docker-compose up -d --scale app=3
```

#### 3. Environment Configuration

Create a `.env` file for environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@db:5432/football_automation
REDIS_URL=redis://redis:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-in-production
JWT_EXPIRATION_HOURS=24

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
MAX_FILE_SIZE_MB=100

# Processing Configuration
MAX_CONCURRENT_JOBS=2
PROCESSING_TIMEOUT=300

# Monitoring Configuration
LOG_LEVEL=INFO
ENABLE_METRICS=true

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Docker Production Configuration

#### 1. Multi-stage Dockerfile

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python dependencies
COPY --from=builder /root/.local /home/appuser/.local
ENV PATH=/home/appuser/.local/bin:$PATH

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p source jsons logs config && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "src.api.enhanced_main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### 2. Production Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/football_automation
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    volumes:
      - app_data:/app/data
      - app_logs:/app/logs
    networks:
      - app_network
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=football_automation
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - nginx_logs:/var/log/nginx
    networks:
      - app_network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  app_data:
  app_logs:
  nginx_logs:

networks:
  app_network:
    driver: bridge
```

## Manual Installation

### 1. System Preparation

#### Ubuntu/Debian

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install system dependencies
sudo apt install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    postgresql-client \
    redis-tools \
    nginx \
    curl \
    git \
    build-essential

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### CentOS/RHEL

```bash
# Update system packages
sudo yum update -y

# Install EPEL repository
sudo yum install -y epel-release

# Install system dependencies
sudo yum install -y \
    python3.11 \
    python3-pip \
    postgresql-server \
    postgresql-contrib \
    redis \
    nginx \
    curl \
    git \
    gcc \
    gcc-c++

# Initialize PostgreSQL
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Database Setup

#### PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE football_automation;
CREATE USER football_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE football_automation TO football_user;
\q

# Configure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
# Uncomment and modify:
# listen_addresses = 'localhost'
# port = 5432

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Add line:
# local   football_automation    football_user                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Redis Configuration

```bash
# Configure Redis
sudo nano /etc/redis/redis.conf

# Modify these settings:
# bind 127.0.0.1
# port 6379
# requirepass your_redis_password
# maxmemory 256mb
# maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis-server
```

### 3. Application Installation

```bash
# Create application user
sudo useradd -m -s /bin/bash football
sudo usermod -aG sudo football

# Switch to application user
sudo su - football

# Clone repository
git clone <repository-url> football-automation
cd football-automation

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
mkdir -p source jsons logs config/backups

# Set permissions
chmod 755 source jsons logs
chmod 700 config
```

### 4. Configuration Setup

```bash
# Copy configuration templates
cp config/automation/automation.json.example config/automation/automation.json
cp .env.example .env

# Edit configuration files
nano .env
nano config/automation/automation.json
```

### 5. Database Migration

```bash
# Run database migrations
alembic upgrade head

# Verify database setup
python -c "from src.database.connection import get_database_connection; print('Database connection successful')"
```

### 6. Service Configuration

#### Systemd Service

Create `/etc/systemd/system/football-automation.service`:

```ini
[Unit]
Description=Football Automation System
After=network.target postgresql.service redis.service
Requires=postgresql.service redis.service

[Service]
Type=exec
User=football
Group=football
WorkingDirectory=/home/football/football-automation
Environment=PATH=/home/football/football-automation/venv/bin
ExecStart=/home/football/football-automation/venv/bin/uvicorn src.api.enhanced_main:app --host 0.0.0.0 --port 8000 --workers 4
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable football-automation
sudo systemctl start football-automation
sudo systemctl status football-automation
```

## Configuration

### Environment Variables

Create and configure the `.env` file:

```bash
# Database Configuration
DATABASE_URL=postgresql://football_user:secure_password@localhost:5432/football_automation

# Redis Configuration
REDIS_URL=redis://:your_redis_password@localhost:6379/0

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRATION_HOURS=24

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
MAX_FILE_SIZE_MB=100

# Processing Configuration
MAX_CONCURRENT_JOBS=2
PROCESSING_TIMEOUT=300
RETRY_ATTEMPTS=3

# File Paths
SOURCE_PATH=source/
OUTPUT_PATH=jsons/
LOG_PATH=logs/
CONFIG_PATH=config/

# Web Downloader Configuration
WEB_DOWNLOAD_URL=https://example.com/football-data
WEB_DOWNLOAD_INTERVAL=3600
WEB_DOWNLOAD_ENABLED=true

# Monitoring Configuration
LOG_LEVEL=INFO
ENABLE_METRICS=true
HEALTH_CHECK_INTERVAL=30

# Security Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_PER_MINUTE=1000
ENABLE_RATE_LIMITING=true

# Notification Configuration
EMAIL_ENABLED=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

WEBHOOK_ENABLED=false
WEBHOOK_URLS=https://hooks.slack.com/services/...
```

### Application Configuration

Edit `config/automation/automation.json`:

```json
{
  "web_downloader": {
    "url": "https://example.com/football-data",
    "check_interval": 3600,
    "download_path": "source/",
    "max_retries": 3,
    "headers": {
      "User-Agent": "Football Automation System v2.0"
    },
    "timeout": 30,
    "verify_ssl": true
  },
  "file_watcher": {
    "watch_path": "source/",
    "file_patterns": ["*.pdf"],
    "debounce_time": 5,
    "recursive": true,
    "ignore_patterns": ["*.tmp", "*.lock", ".*"]
  },
  "processing": {
    "max_concurrent": 2,
    "retry_attempts": 3,
    "timeout": 300,
    "priority_levels": 5,
    "auto_cleanup": true,
    "cleanup_age_days": 30
  },
  "caching": {
    "enabled": true,
    "default_ttl": 3600,
    "team_normalization_ttl": 86400,
    "market_classification_ttl": 43200
  },
  "notifications": {
    "email": {
      "enabled": false,
      "recipients": ["admin@example.com"]
    },
    "webhook": {
      "enabled": false,
      "events": ["processing_failed", "system_error"]
    }
  },
  "monitoring": {
    "enabled": true,
    "metrics_interval": 60,
    "health_check_interval": 30,
    "log_retention_days": 30
  }
}
```

## Production Setup

### 1. Reverse Proxy Configuration

#### Nginx Configuration

Create `/etc/nginx/sites-available/football-automation`:

```nginx
upstream football_app {
    server 127.0.0.1:8000;
    # Add more servers for load balancing
    # server 127.0.0.1:8001;
    # server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # File Upload Size
    client_max_body_size 100M;
    
    # Proxy Configuration
    location / {
        proxy_pass http://football_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket Configuration
    location /ws {
        proxy_pass http://football_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static Files (if serving directly)
    location /static/ {
        alias /home/football/football-automation/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health Check
    location /health {
        proxy_pass http://football_app;
        access_log off;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/football-automation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL Certificate Setup

#### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Custom SSL Certificate

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Copy your certificate files
sudo cp yourdomain.com.crt /etc/nginx/ssl/
sudo cp yourdomain.com.key /etc/nginx/ssl/

# Set proper permissions
sudo chmod 600 /etc/nginx/ssl/yourdomain.com.key
sudo chmod 644 /etc/nginx/ssl/yourdomain.com.crt
```

### 3. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow internal services (if needed)
sudo ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis

# Check firewall status
sudo ufw status verbose
```

### 4. Monitoring Setup

#### Log Rotation

Create `/etc/logrotate.d/football-automation`:

```
/home/football/football-automation/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 football football
    postrotate
        systemctl reload football-automation
    endscript
}
```

#### System Monitoring

Install and configure monitoring tools:

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install Prometheus Node Exporter (optional)
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter

# Create systemd service for node_exporter
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

### 5. Backup Strategy

#### Database Backup

Create backup script `/home/football/backup_db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/football/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="football_automation"
DB_USER="football_user"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

Make executable and schedule:

```bash
chmod +x /home/football/backup_db.sh

# Add to crontab
crontab -e
# Add line:
# 0 2 * * * /home/football/backup_db.sh
```

#### Application Backup

Create backup script `/home/football/backup_app.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/football/backups"
APP_DIR="/home/football/football-automation"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration and data
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    -C $APP_DIR \
    config/ \
    source/ \
    jsons/ \
    logs/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

## Monitoring and Maintenance

### 1. Health Monitoring

#### System Health Checks

Create monitoring script `/home/football/health_check.sh`:

```bash
#!/bin/bash

# Check application health
APP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)
if [ "$APP_HEALTH" != "200" ]; then
    echo "Application health check failed: $APP_HEALTH"
    systemctl restart football-automation
fi

# Check database connection
DB_CHECK=$(sudo -u postgres psql -d football_automation -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
if [ "$DB_CHECK" != "1" ]; then
    echo "Database health check failed"
    systemctl restart postgresql
fi

# Check Redis connection
REDIS_CHECK=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_CHECK" != "PONG" ]; then
    echo "Redis health check failed"
    systemctl restart redis-server
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "Disk usage is high: ${DISK_USAGE}%"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEM_USAGE" -gt 80 ]; then
    echo "Memory usage is high: ${MEM_USAGE}%"
fi
```

Schedule health checks:

```bash
chmod +x /home/football/health_check.sh

# Add to crontab
crontab -e
# Add line:
# */5 * * * * /home/football/health_check.sh
```

### 2. Log Management

#### Centralized Logging

Configure rsyslog for centralized logging:

```bash
# Edit rsyslog configuration
sudo nano /etc/rsyslog.d/50-football-automation.conf

# Add configuration:
# $ModLoad imfile
# $InputFileName /home/football/football-automation/logs/football_processing.log
# $InputFileTag football-automation:
# $InputFileStateFile stat-football-automation
# $InputFileSeverity info
# $InputFileFacility local7
# $InputRunFileMonitor
# 
# local7.*    /var/log/football-automation.log
# local7.*    @@logserver.example.com:514

sudo systemctl restart rsyslog
```

### 3. Performance Monitoring

#### Application Metrics

Monitor key performance indicators:

```bash
# Create metrics collection script
cat > /home/football/collect_metrics.sh << 'EOF'
#!/bin/bash

METRICS_FILE="/home/football/metrics.log"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Get application metrics
APP_METRICS=$(curl -s http://localhost:8000/api/v1/metrics)
echo "$TIMESTAMP $APP_METRICS" >> $METRICS_FILE

# Get system metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
MEM_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

echo "$TIMESTAMP SYSTEM cpu=$CPU_USAGE mem=$MEM_USAGE disk=$DISK_USAGE" >> $METRICS_FILE
EOF

chmod +x /home/football/collect_metrics.sh

# Schedule metrics collection
crontab -e
# Add line:
# */1 * * * * /home/football/collect_metrics.sh
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

**Symptoms:**
- Service fails to start
- Port binding errors
- Import errors

**Diagnosis:**
```bash
# Check service status
sudo systemctl status football-automation

# Check logs
sudo journalctl -u football-automation -f

# Check port usage
sudo netstat -tlnp | grep :8000

# Test Python imports
cd /home/football/football-automation
source venv/bin/activate
python -c "import src.api.enhanced_main"
```

**Solutions:**
```bash
# Fix port conflicts
sudo lsof -i :8000
sudo kill -9 <PID>

# Fix Python path issues
export PYTHONPATH=/home/football/football-automation:$PYTHONPATH

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check file permissions
sudo chown -R football:football /home/football/football-automation
```

#### 2. Database Connection Issues

**Symptoms:**
- Database connection errors
- Authentication failures
- Timeout errors

**Diagnosis:**
```bash
# Test database connection
sudo -u postgres psql -d football_automation

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection settings
sudo nano /etc/postgresql/13/main/postgresql.conf
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

**Solutions:**
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Fix authentication
sudo -u postgres psql
ALTER USER football_user PASSWORD 'new_password';

# Update connection string
nano /home/football/football-automation/.env
# DATABASE_URL=postgresql://football_user:new_password@localhost:5432/football_automation

# Test connection
python -c "from src.database.connection import get_database_connection; print('OK')"
```

#### 3. Redis Connection Issues

**Symptoms:**
- Cache errors
- Redis connection timeouts
- Performance degradation

**Diagnosis:**
```bash
# Test Redis connection
redis-cli ping

# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Check Redis configuration
sudo nano /etc/redis/redis.conf
```

**Solutions:**
```bash
# Restart Redis
sudo systemctl restart redis-server

# Clear Redis cache
redis-cli FLUSHALL

# Update Redis configuration
sudo nano /etc/redis/redis.conf
# maxmemory 512mb
# maxmemory-policy allkeys-lru

# Test connection
python -c "import redis; r=redis.Redis(); print(r.ping())"
```

#### 4. File Processing Issues

**Symptoms:**
- Files not being processed
- Processing stuck in queue
- File permission errors

**Diagnosis:**
```bash
# Check file permissions
ls -la /home/football/football-automation/source/

# Check processing logs
tail -f /home/football/football-automation/logs/football_processing.log

# Check queue status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/process/queue

# Check disk space
df -h
```

**Solutions:**
```bash
# Fix file permissions
sudo chown -R football:football /home/football/football-automation/source/
sudo chmod -R 755 /home/football/football-automation/source/

# Clear stuck jobs
# Use web interface or API to cancel stuck jobs

# Increase processing timeout
nano /home/football/football-automation/.env
# PROCESSING_TIMEOUT=600

# Restart processing manager
sudo systemctl restart football-automation
```

#### 5. Web Interface Issues

**Symptoms:**
- 502 Bad Gateway errors
- WebSocket connection failures
- Static files not loading

**Diagnosis:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Test upstream connection
curl -I http://localhost:8000/health

# Check Nginx configuration
sudo nginx -t
```

**Solutions:**
```bash
# Restart Nginx
sudo systemctl restart nginx

# Fix Nginx configuration
sudo nano /etc/nginx/sites-available/football-automation

# Check upstream servers
# Ensure application is running on configured ports

# Fix SSL issues
sudo certbot renew
sudo systemctl reload nginx
```

#### 6. Performance Issues

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Processing timeouts

**Diagnosis:**
```bash
# Check system resources
htop
iotop
free -h
df -h

# Check application metrics
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/metrics

# Profile application
python -m cProfile -o profile.stats src/api/enhanced_main.py
```

**Solutions:**
```bash
# Increase system resources
# Add more RAM, CPU cores, or disk space

# Optimize configuration
nano /home/football/football-automation/.env
# MAX_CONCURRENT_JOBS=1  # Reduce if memory limited
# PROCESSING_TIMEOUT=900  # Increase for large files

# Enable caching
# Ensure Redis is running and configured

# Scale horizontally
# Add more application instances behind load balancer
```

### Diagnostic Commands

#### System Information

```bash
# System overview
uname -a
lsb_release -a
free -h
df -h
lscpu

# Network information
ip addr show
netstat -tlnp
ss -tlnp

# Process information
ps aux | grep python
ps aux | grep nginx
ps aux | grep postgres
ps aux | grep redis
```

#### Application Diagnostics

```bash
# Check application status
curl -s http://localhost:8000/health | jq .

# Check API endpoints
curl -s -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/status | jq .

# Check WebSocket connection
wscat -c ws://localhost:8000/ws

# Check database
sudo -u postgres psql -d football_automation -c "\dt"

# Check Redis
redis-cli info
redis-cli monitor
```

#### Log Analysis

```bash
# Application logs
tail -f /home/football/football-automation/logs/football_processing.log

# System logs
sudo journalctl -u football-automation -f
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
sudo journalctl -u redis-server -f

# Error analysis
grep -i error /home/football/football-automation/logs/football_processing.log
grep -i error /var/log/nginx/error.log
```

## Scaling and Performance

### Horizontal Scaling

#### Load Balancer Configuration

```nginx
upstream football_backend {
    least_conn;
    server 10.0.1.10:8000 weight=3;
    server 10.0.1.11:8000 weight=3;
    server 10.0.1.12:8000 weight=2;
    
    # Health checks
    keepalive 32;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://football_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Load balancing
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

#### Database Scaling

```bash
# Master-slave replication setup
# On master server:
sudo nano /etc/postgresql/13/main/postgresql.conf
# wal_level = replica
# max_wal_senders = 3
# wal_keep_segments = 64

sudo nano /etc/postgresql/13/main/pg_hba.conf
# host replication replicator 10.0.1.0/24 md5

# Create replication user
sudo -u postgres psql
CREATE USER replicator REPLICATION LOGIN CONNECTION LIMIT 1 ENCRYPTED PASSWORD 'password';

# On slave server:
pg_basebackup -h master_ip -D /var/lib/postgresql/13/main -U replicator -v -P -W
```

### Performance Optimization

#### Application Tuning

```bash
# Optimize Python settings
export PYTHONOPTIMIZE=1
export PYTHONDONTWRITEBYTECODE=1

# Increase worker processes
uvicorn src.api.enhanced_main:app --workers 8 --worker-class uvicorn.workers.UvicornWorker

# Configure memory limits
ulimit -m 2097152  # 2GB memory limit
```

#### Database Optimization

```sql
-- PostgreSQL optimization
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_games_date ON games(date);
CREATE INDEX CONCURRENTLY idx_games_league ON games(league);
CREATE INDEX CONCURRENTLY idx_jobs_status ON jobs(status);
```

#### Redis Optimization

```bash
# Redis configuration optimization
sudo nano /etc/redis/redis.conf

# Memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru
maxmemory-samples 5

# Persistence optimization
save 900 1
save 300 10
save 60 10000

# Network optimization
tcp-keepalive 300
timeout 0
```

This deployment guide provides comprehensive instructions for setting up the Football Automation System in various environments. For additional support, refer to the [User Manual](USER_MANUAL.md) and [API Reference](API_REFERENCE.md).