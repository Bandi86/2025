# Docker Deployment Guide

This guide covers the Docker containerization and deployment setup for the Football Automation System.

## Overview

The system uses a multi-container architecture with the following services:

- **app**: Main FastAPI application
- **automation**: Automation manager service
- **worker**: Processing worker (scalable)
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **dashboard**: Streamlit dashboard (optional)
- **nginx**: Reverse proxy (optional)
- **prometheus**: Metrics collection (optional)
- **grafana**: Monitoring dashboard (optional)

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Copy environment configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** with your configuration:
   ```bash
   nano .env
   ```

4. **Start the system**:
   ```bash
   ./deploy.sh up
   ```

5. **Access the services**:
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Dashboard: http://localhost:8501 (if enabled)

## Deployment Script

The `deploy.sh` script provides easy management of the Docker deployment:

### Basic Commands

```bash
# Start all services
./deploy.sh up

# Stop all services
./deploy.sh down

# Restart services
./deploy.sh restart

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Run tests
./deploy.sh test

# Create backup
./deploy.sh backup

# Clean up resources
./deploy.sh clean
```

### Advanced Options

```bash
# Start with specific environment
./deploy.sh up --env development

# Start with monitoring services
./deploy.sh up --profiles monitoring

# Restart only specific services
./deploy.sh restart --services app,redis

# Force rebuild images
./deploy.sh up --force-rebuild

# Skip tests during deployment
./deploy.sh up --skip-tests
```

## Environment Configuration

### Required Environment Variables

```bash
# Database
POSTGRES_DB=football_automation
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_secure_redis_password

# API
JWT_SECRET_KEY=your-very-secure-jwt-secret-key

# Web Downloader
SOURCE_URL=https://your-pdf-source.com
```

### Optional Environment Variables

```bash
# Processing
MAX_CONCURRENT_JOBS=2
PROCESSING_TIMEOUT=300
WORKER_REPLICAS=1

# Monitoring
ENABLE_METRICS=true
WEBHOOK_URLS=http://example.com/webhook

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Service Profiles

Use profiles to enable optional services:

### Monitoring Profile
```bash
./deploy.sh up --profiles monitoring
```
Includes:
- Prometheus (metrics collection)
- Grafana (monitoring dashboard)

### Dashboard Profile
```bash
./deploy.sh up --profiles dashboard
```
Includes:
- Streamlit dashboard

### Nginx Profile
```bash
./deploy.sh up --profiles nginx
```
Includes:
- Nginx reverse proxy with SSL support

## Volume Management

### Persistent Data Volumes

- `postgres_data`: Database data
- `redis_data`: Redis persistence
- `app_data`: Application data

### Bind Mounts

- `./source`: PDF source files
- `./jsons`: Processed JSON files
- `./logs`: Application logs
- `./config`: Configuration files

## Health Checks

All services include health checks:

### Manual Health Check
```bash
./docker/health-check.sh
```

### Container Health Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### API Health Endpoint
```bash
curl http://localhost:8000/health
```

## Scaling

### Scale Processing Workers
```bash
docker-compose up -d --scale worker=3
```

### Environment Variable Scaling
```bash
# In .env file
WORKER_REPLICAS=3
```

## Security

### Secrets Management

- Use strong passwords in `.env` file
- Never commit `.env` file to version control
- Use Docker secrets in production:

```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

### Network Security

- Services communicate on isolated Docker network
- Only necessary ports are exposed
- Nginx provides additional security headers

### SSL/TLS Configuration

1. **Generate SSL certificates**:
   ```bash
   mkdir -p docker/ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout docker/ssl/key.pem \
     -out docker/ssl/cert.pem
   ```

2. **Enable nginx profile**:
   ```bash
   ./deploy.sh up --profiles nginx
   ```

## Backup and Restore

### Create Backup
```bash
./deploy.sh backup
```

Creates:
- Data volume backup
- Configuration backup
- Stored in `./backups/` directory

### Restore from Backup
```bash
./deploy.sh restore
```

### Manual Database Backup
```bash
docker exec football-postgres pg_dump -U postgres football_automation > backup.sql
```

### Manual Database Restore
```bash
docker exec -i football-postgres psql -U postgres football_automation < backup.sql
```

## Monitoring

### Prometheus Metrics
- Available at: http://localhost:9090
- Metrics endpoint: http://localhost:8000/api/v1/metrics

### Grafana Dashboard
- Available at: http://localhost:3000
- Default credentials: admin/admin

### Log Aggregation
```bash
# View all logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs --services app

# Follow logs in real-time
docker-compose logs -f app
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :8000
   
   # Change ports in .env file
   API_PORT=8001
   ```

2. **Permission issues**:
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./source ./jsons ./logs
   ```

3. **Memory issues**:
   ```bash
   # Check Docker memory usage
   docker stats
   
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

4. **Database connection issues**:
   ```bash
   # Check database logs
   docker logs football-postgres
   
   # Test connection
   docker exec football-postgres psql -U postgres -c "SELECT 1"
   ```

### Debug Mode

1. **Enable debug logging**:
   ```bash
   # In .env file
   LOG_LEVEL=debug
   DEBUG=true
   ```

2. **Access container shell**:
   ```bash
   ./deploy.sh shell
   # or
   docker exec -it football-app /bin/bash
   ```

3. **Run services individually**:
   ```bash
   docker-compose up postgres redis
   docker-compose run --rm app shell
   ```

### Performance Tuning

1. **Database optimization**:
   ```bash
   # In docker-compose.yml, add to postgres service:
   command: postgres -c shared_preload_libraries=pg_stat_statements
   ```

2. **Redis optimization**:
   ```bash
   # Adjust Redis memory limit in docker/redis.conf
   maxmemory 512mb
   ```

3. **Application optimization**:
   ```bash
   # In .env file
   API_WORKERS=4
   MAX_CONCURRENT_JOBS=4
   ```

## Development vs Production

### Development Setup
```bash
# Use development environment
./deploy.sh up --env development

# Enable all services for testing
./deploy.sh up --profiles monitoring,dashboard,nginx
```

### Production Setup
```bash
# Use production environment
./deploy.sh up --env production

# Enable only necessary services
./deploy.sh up

# Use external database and Redis (recommended)
# Configure DATABASE_URL and REDIS_URL in .env
```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to production
        run: |
          ./deploy.sh test
          ./deploy.sh up --env production --skip-tests
```

## Maintenance

### Regular Tasks

1. **Update images**:
   ```bash
   ./deploy.sh down
   docker-compose pull
   ./deploy.sh up
   ```

2. **Clean up resources**:
   ```bash
   ./deploy.sh clean
   ```

3. **Backup data**:
   ```bash
   ./deploy.sh backup
   ```

4. **Monitor logs**:
   ```bash
   ./deploy.sh logs | grep ERROR
   ```

### Automated Maintenance

Set up cron jobs for regular maintenance:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/project/deploy.sh backup

# Weekly cleanup at 3 AM Sunday
0 3 * * 0 /path/to/project/deploy.sh clean

# Daily health check at 6 AM
0 6 * * * /path/to/project/docker/health-check.sh
```

## Support

For issues and questions:

1. Check the logs: `./deploy.sh logs`
2. Run health check: `./docker/health-check.sh --verbose`
3. Check service status: `./deploy.sh status`
4. Review this documentation
5. Check the main project README.md