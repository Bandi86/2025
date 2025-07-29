#!/bin/bash

# TippMixMentor v2 Development Setup Script
# Enhanced with comprehensive error handling and logging

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker container health
check_container_health() {
    local container_name=$1
    local max_attempts=30
    local attempt=1
    
    log "Checking health of container: $container_name"
    
    while [ $attempt -le $max_attempts ]; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*healthy"; then
            success "Container $container_name is healthy!"
            return 0
        elif docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*unhealthy"; then
            error "Container $container_name is unhealthy!"
            return 1
        elif ! docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
            error "Container $container_name is not running!"
            return 1
        fi
        
        log "Waiting for $container_name to be healthy... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    error "Container $container_name failed to become healthy within $((max_attempts * 10)) seconds"
    return 1
}

# Function to check service endpoint
check_service_endpoint() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    log "Checking endpoint: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" >/dev/null 2>&1; then
            success "Service $service_name is responding at $url"
            return 0
        fi
        
        log "Waiting for $service_name to respond... (attempt $attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    error "Service $service_name failed to respond at $url within $((max_attempts * 5)) seconds"
    return 1
}

# Main setup function
main() {
    log "🚀 Setting up TippMixMentor v2 development environment..."
    
    # Check prerequisites
    log "🔍 Checking prerequisites..."
    
    if ! command_exists docker; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi
    
    success "Prerequisites check passed"
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        log "📝 Creating .env file from template..."
        if [ -f env.example ]; then
            cp env.example .env
            success ".env file created from template"
            warning "Please review and update the .env file with your configuration"
        else
            error "env.example file not found. Please create a .env file manually."
            exit 1
        fi
    else
        log "✅ .env file already exists"
    fi
    
    # Create necessary directories
    log "📁 Creating necessary directories..."
    mkdir -p logs
    mkdir -p uploads
    mkdir -p prediction_model/models
    mkdir -p prediction_model/logs
    mkdir -p prediction_model/data
    success "Directories created"
    
    # Set up backend
    log "🔧 Setting up backend..."
    cd backend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        log "📦 Installing backend dependencies..."
        if npm install; then
            success "Backend dependencies installed"
        else
            error "Failed to install backend dependencies"
            exit 1
        fi
    else
        log "✅ Backend dependencies already installed"
    fi
    
    # Generate Prisma client
    log "🗄️ Generating Prisma client..."
    if npx prisma generate; then
        success "Prisma client generated"
    else
        error "Failed to generate Prisma client"
        exit 1
    fi
    
    cd ..
    
    # Set up frontend
    log "🎨 Setting up frontend..."
    cd frontend
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        log "📦 Installing frontend dependencies..."
        if npm install; then
            success "Frontend dependencies installed"
        else
            error "Failed to install frontend dependencies"
            exit 1
        fi
    else
        log "✅ Frontend dependencies already installed"
    fi
    
    cd ..
    
    # Set up ML service
    log "🤖 Setting up ML service..."
    cd prediction_model
    
    # Check if requirements.txt exists
    if [ ! -f "requirements.txt" ]; then
        error "requirements.txt not found in prediction_model directory"
        exit 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        log "🐍 Creating Python virtual environment..."
        if python3 -m venv venv; then
            success "Python virtual environment created"
        else
            error "Failed to create Python virtual environment"
            exit 1
        fi
    else
        log "✅ Python virtual environment already exists"
    fi
    
    # Activate virtual environment and install dependencies
    log "📦 Installing ML service dependencies..."
    if source venv/bin/activate && pip install -r requirements.txt; then
        success "ML service dependencies installed"
    else
        error "Failed to install ML service dependencies"
        exit 1
    fi
    
    cd ..
    
    # Stop any existing containers
    log "🛑 Stopping any existing containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    
    # Build Docker images
    log "🐳 Building Docker images..."
    if docker compose build --no-cache; then
        success "Docker images built successfully"
    else
        error "Failed to build Docker images"
        exit 1
    fi
    
    # Start containers
    log "🚀 Starting containers..."
    if docker compose up -d; then
        success "Containers started successfully"
    else
        error "Failed to start containers"
        exit 1
    fi
    
    # Wait for containers to be healthy
    log "⏳ Waiting for containers to be healthy..."
    
    # Check database
    if check_container_health "tippmixmentor_postgres"; then
        success "PostgreSQL is healthy"
    else
        error "PostgreSQL failed to become healthy"
        docker compose logs postgres
        exit 1
    fi
    
    # Check Redis
    if check_container_health "tippmixmentor_redis"; then
        success "Redis is healthy"
    else
        error "Redis failed to become healthy"
        docker compose logs redis
        exit 1
    fi
    
    # Check backend
    if check_container_health "tippmixmentor_backend"; then
        success "Backend is healthy"
    else
        error "Backend failed to become healthy"
        docker compose logs backend
        exit 1
    fi
    
    # Check ML service
    if check_container_health "tippmixmentor_ml_service"; then
        success "ML service is healthy"
    else
        error "ML service failed to become healthy"
        docker compose logs ml-service
        exit 1
    fi
    
    # Check frontend
    if check_container_health "tippmixmentor_frontend"; then
        success "Frontend is healthy"
    else
        error "Frontend failed to become healthy"
        docker compose logs frontend
        exit 1
    fi
    
    # Test service endpoints
    log "🔍 Testing service endpoints..."
    
    if check_service_endpoint "Backend API" "http://localhost:3001/api/v1/health"; then
        success "Backend API is responding"
    else
        warning "Backend API health check failed"
    fi
    
    if check_service_endpoint "ML Service" "http://localhost:8000/health"; then
        success "ML Service is responding"
    else
        warning "ML Service health check failed"
    fi
    
    if check_service_endpoint "Frontend" "http://localhost:3000"; then
        success "Frontend is responding"
    else
        warning "Frontend health check failed"
    fi
    
    # Show container status
    log "📊 Container status:"
    docker compose ps
    
    # Show logs summary
    log "📋 Recent logs summary:"
    echo "--- Backend logs ---"
    docker compose logs --tail=5 backend
    echo "--- ML Service logs ---"
    docker compose logs --tail=5 ml-service
    echo "--- Frontend logs ---"
    docker compose logs --tail=5 frontend
    
    success "✅ Development environment setup complete!"
    echo ""
    echo "🎉 All services are running successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:3001"
    echo "   - ML Service: http://localhost:8000"
    echo "   - API Documentation: http://localhost:3001/api/docs"
    echo "   - ML Service Docs: http://localhost:8000/docs"
    echo ""
    echo "🔧 Useful commands:"
    echo "  - View all logs: docker compose logs -f"
    echo "  - View specific service logs: docker compose logs -f [service_name]"
    echo "  - Stop services: docker compose down"
    echo "  - Restart services: docker compose restart"
    echo "  - Rebuild and restart: docker compose up -d --build"
    echo ""
    echo "🐛 Debugging:"
    echo "  - Check container status: docker compose ps"
    echo "  - Check container health: docker compose ps --format 'table {{.Name}}\t{{.Status}}'"
    echo "  - Access container shell: docker compose exec [service_name] sh"
    echo ""
    echo "🎯 Ready to start coding! Happy development! 🚀"
}

# Error handling
trap 'error "Setup failed. Check the logs above for details."; exit 1' ERR

# Run main function
main "$@" 