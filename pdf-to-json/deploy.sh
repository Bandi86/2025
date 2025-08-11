#!/bin/bash
# Football Automation System Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
BACKUP_DIR="${SCRIPT_DIR}/backups"

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BACKUP=false
FORCE_REBUILD=false
SERVICES=""
PROFILES=""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "OK")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}✗${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
    esac
}

# Function to show usage
show_usage() {
    cat << EOF
Football Automation System Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    up          Start all services
    down        Stop all services
    restart     Restart all services
    build       Build Docker images
    logs        Show service logs
    status      Show service status
    test        Run deployment tests
    backup      Create system backup
    restore     Restore from backup
    clean       Clean up unused resources
    shell       Open shell in app container

Options:
    --env ENV           Environment (development|staging|production) [default: production]
    --services SERVICES Comma-separated list of services to operate on
    --profiles PROFILES Comma-separated list of profiles to enable
    --skip-tests        Skip deployment tests
    --skip-backup       Skip backup creation
    --force-rebuild     Force rebuild of images
    --help              Show this help message

Examples:
    $0 up                           # Start all services
    $0 up --env development         # Start in development mode
    $0 up --profiles monitoring    # Start with monitoring services
    $0 restart --services app      # Restart only the app service
    $0 logs --services app,redis   # Show logs for app and redis
    $0 test                         # Run deployment tests
    $0 backup                       # Create system backup

EOF
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check required tools
    for tool in docker docker-compose curl; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_status "ERROR" "Missing required tools: ${missing_tools[*]}"
        print_status "INFO" "Please install the missing tools and try again"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_status "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    print_status "OK" "Prerequisites check passed"
}

# Function to setup environment
setup_environment() {
    print_status "INFO" "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        print_status "INFO" "Creating .env file from template..."
        cp "${SCRIPT_DIR}/.env.example" "$ENV_FILE"
        print_status "WARN" "Please edit .env file with your configuration"
    fi
    
    # Create necessary directories
    local dirs=("source" "jsons" "logs" "data" "temp" "$BACKUP_DIR")
    for dir in "${dirs[@]}"; do
        mkdir -p "${SCRIPT_DIR}/$dir"
    done
    
    # Set permissions
    chmod +x "${SCRIPT_DIR}/docker/entrypoint.sh"
    chmod +x "${SCRIPT_DIR}/docker/health-check.sh"
    
    print_status "OK" "Environment setup completed"
}

# Function to build images
build_images() {
    print_status "INFO" "Building Docker images..."
    
    local build_args=""
    if [ "$FORCE_REBUILD" = true ]; then
        build_args="--no-cache"
    fi
    
    if [ -n "$SERVICES" ]; then
        docker-compose -f "$COMPOSE_FILE" build $build_args $SERVICES
    else
        docker-compose -f "$COMPOSE_FILE" build $build_args
    fi
    
    print_status "OK" "Docker images built successfully"
}

# Function to start services
start_services() {
    print_status "INFO" "Starting services..."
    
    local compose_args=""
    if [ -n "$PROFILES" ]; then
        IFS=',' read -ra PROFILE_ARRAY <<< "$PROFILES"
        for profile in "${PROFILE_ARRAY[@]}"; do
            compose_args="$compose_args --profile $profile"
        done
    fi
    
    if [ -n "$SERVICES" ]; then
        docker-compose -f "$COMPOSE_FILE" $compose_args up -d $SERVICES
    else
        docker-compose -f "$COMPOSE_FILE" $compose_args up -d
    fi
    
    print_status "OK" "Services started successfully"
    
    # Wait for services to be ready
    print_status "INFO" "Waiting for services to be ready..."
    sleep 10
    
    # Run health check
    if "${SCRIPT_DIR}/docker/health-check.sh" --timeout 30; then
        print_status "OK" "All services are healthy"
    else
        print_status "WARN" "Some services may not be fully ready"
    fi
}

# Function to stop services
stop_services() {
    print_status "INFO" "Stopping services..."
    
    if [ -n "$SERVICES" ]; then
        docker-compose -f "$COMPOSE_FILE" stop $SERVICES
    else
        docker-compose -f "$COMPOSE_FILE" down
    fi
    
    print_status "OK" "Services stopped successfully"
}

# Function to restart services
restart_services() {
    print_status "INFO" "Restarting services..."
    
    if [ -n "$SERVICES" ]; then
        docker-compose -f "$COMPOSE_FILE" restart $SERVICES
    else
        stop_services
        start_services
    fi
    
    print_status "OK" "Services restarted successfully"
}

# Function to show logs
show_logs() {
    print_status "INFO" "Showing service logs..."
    
    if [ -n "$SERVICES" ]; then
        docker-compose -f "$COMPOSE_FILE" logs -f $SERVICES
    else
        docker-compose -f "$COMPOSE_FILE" logs -f
    fi
}

# Function to show status
show_status() {
    print_status "INFO" "Service status:"
    echo
    
    docker-compose -f "$COMPOSE_FILE" ps
    echo
    
    print_status "INFO" "System resources:"
    docker system df
    echo
    
    print_status "INFO" "Running health check..."
    "${SCRIPT_DIR}/docker/health-check.sh" --verbose || true
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_status "INFO" "Skipping deployment tests"
        return
    fi
    
    print_status "INFO" "Running deployment tests..."
    
    if command -v python3 >/dev/null 2>&1; then
        cd "$SCRIPT_DIR"
        python3 -m pytest tests/test_deployment.py -v
        print_status "OK" "Deployment tests passed"
    else
        print_status "WARN" "Python3 not available, skipping tests"
    fi
}

# Function to create backup
create_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_status "INFO" "Skipping backup creation"
        return
    fi
    
    print_status "INFO" "Creating system backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${BACKUP_DIR}/backup_${timestamp}.tar.gz"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup data volumes
    docker run --rm \
        -v football-automation_postgres_data:/data/postgres:ro \
        -v football-automation_redis_data:/data/redis:ro \
        -v football-automation_app_data:/data/app:ro \
        -v "${BACKUP_DIR}:/backup" \
        alpine:latest \
        tar czf "/backup/backup_${timestamp}.tar.gz" -C /data .
    
    # Backup configuration files
    tar czf "${BACKUP_DIR}/config_${timestamp}.tar.gz" \
        -C "$SCRIPT_DIR" \
        .env config/ docker-compose.yml
    
    print_status "OK" "Backup created: $backup_file"
}

# Function to restore from backup
restore_backup() {
    print_status "INFO" "Available backups:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || {
        print_status "ERROR" "No backups found in $BACKUP_DIR"
        exit 1
    }
    
    echo
    read -p "Enter backup filename to restore: " backup_file
    
    if [ ! -f "${BACKUP_DIR}/$backup_file" ]; then
        print_status "ERROR" "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_status "WARN" "This will overwrite current data. Are you sure? (y/N)"
    read -r confirmation
    if [[ ! $confirmation =~ ^[Yy]$ ]]; then
        print_status "INFO" "Restore cancelled"
        exit 0
    fi
    
    print_status "INFO" "Restoring from backup: $backup_file"
    
    # Stop services
    stop_services
    
    # Restore data volumes
    docker run --rm \
        -v football-automation_postgres_data:/data/postgres \
        -v football-automation_redis_data:/data/redis \
        -v football-automation_app_data:/data/app \
        -v "${BACKUP_DIR}:/backup" \
        alpine:latest \
        tar xzf "/backup/$backup_file" -C /data
    
    # Start services
    start_services
    
    print_status "OK" "Restore completed successfully"
}

# Function to clean up resources
clean_resources() {
    print_status "INFO" "Cleaning up unused resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    print_status "WARN" "Remove unused volumes? This may delete data! (y/N)"
    read -r confirmation
    if [[ $confirmation =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    # Remove unused networks
    docker network prune -f
    
    print_status "OK" "Cleanup completed"
}

# Function to open shell
open_shell() {
    print_status "INFO" "Opening shell in app container..."
    
    if docker ps --format "{{.Names}}" | grep -q "football-app"; then
        docker exec -it football-app /bin/bash
    else
        print_status "ERROR" "App container is not running"
        exit 1
    fi
}

# Parse command line arguments
COMMAND=""
while [[ $# -gt 0 ]]; do
    case $1 in
        up|down|restart|build|logs|status|test|backup|restore|clean|shell)
            COMMAND="$1"
            shift
            ;;
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --services)
            SERVICES="$2"
            shift 2
            ;;
        --profiles)
            PROFILES="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_status "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Check if command is provided
if [ -z "$COMMAND" ]; then
    print_status "ERROR" "No command specified"
    show_usage
    exit 1
fi

# Set environment variables
export ENVIRONMENT
export COMPOSE_PROJECT_NAME="football-automation"

# Main execution
print_status "INFO" "Football Automation System Deployment"
print_status "INFO" "Command: $COMMAND"
print_status "INFO" "Environment: $ENVIRONMENT"
echo

# Check prerequisites
check_prerequisites

# Setup environment
setup_environment

# Execute command
case $COMMAND in
    "up")
        if [ "$FORCE_REBUILD" = true ]; then
            build_images
        fi
        start_services
        run_tests
        ;;
    "down")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "build")
        build_images
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "test")
        run_tests
        ;;
    "backup")
        create_backup
        ;;
    "restore")
        restore_backup
        ;;
    "clean")
        clean_resources
        ;;
    "shell")
        open_shell
        ;;
esac

print_status "OK" "Command '$COMMAND' completed successfully"