#!/bin/bash
# Rolling deployment script for zero-downtime updates
# This script performs rolling updates with health checks and rollback capability

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
ENV_FILE="${PROJECT_DIR}/.env"
BACKUP_DIR="${PROJECT_DIR}/backups"

# Default values
SERVICE_NAME=""
NEW_IMAGE_TAG=""
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5
MAX_PARALLEL_UPDATES=1
ROLLBACK_ON_FAILURE=true
SKIP_BACKUP=false
DRY_RUN=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $status in
        "OK")
            echo -e "${GREEN}[${timestamp}] ✓${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[${timestamp}] ⚠${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[${timestamp}] ✗${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}[${timestamp}] ℹ${NC} $message"
            ;;
    esac
}

# Function to show usage
show_usage() {
    cat << EOF
Rolling Deployment Script for Zero-Downtime Updates

Usage: $0 [OPTIONS]

Options:
    --service SERVICE       Service name to update (required)
    --image-tag TAG         New image tag to deploy (required)
    --timeout SECONDS       Health check timeout (default: 60)
    --interval SECONDS      Health check interval (default: 5)
    --parallel COUNT        Max parallel updates (default: 1)
    --no-rollback          Disable automatic rollback on failure
    --skip-backup          Skip backup creation before deployment
    --dry-run              Show what would be done without executing
    --help                 Show this help message

Examples:
    $0 --service app --image-tag v1.2.3
    $0 --service worker --image-tag latest --parallel 2
    $0 --service app --image-tag v1.2.3 --dry-run

EOF
}

# Function to validate prerequisites
validate_prerequisites() {
    print_status "INFO" "Validating prerequisites..."
    
    # Check required tools
    local missing_tools=()
    for tool in docker docker-compose jq; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_status "ERROR" "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        print_status "ERROR" "Docker daemon is not running"
        exit 1
    fi
    
    # Check compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_status "ERROR" "Docker compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    # Validate service exists
    if ! docker-compose -f "$COMPOSE_FILE" config --services | grep -q "^${SERVICE_NAME}$"; then
        print_status "ERROR" "Service '$SERVICE_NAME' not found in compose file"
        exit 1
    fi
    
    print_status "OK" "Prerequisites validated"
}

# Function to get current service instances
get_service_instances() {
    local service=$1
    docker-compose -f "$COMPOSE_FILE" ps -q "$service" 2>/dev/null || echo ""
}

# Function to get service scale count
get_service_scale() {
    local service=$1
    local instances
    instances=$(get_service_instances "$service")
    echo "$instances" | wc -w
}

# Function to check service health
check_service_health() {
    local container_id=$1
    local timeout=${2:-$HEALTH_CHECK_TIMEOUT}
    local interval=${3:-$HEALTH_CHECK_INTERVAL}
    
    print_status "INFO" "Checking health of container $container_id"
    
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "unknown")
        
        case $health_status in
            "healthy")
                print_status "OK" "Container $container_id is healthy"
                return 0
                ;;
            "unhealthy")
                print_status "ERROR" "Container $container_id is unhealthy"
                return 1
                ;;
            "starting"|"unknown")
                print_status "INFO" "Container $container_id health status: $health_status (waiting...)"
                ;;
        esac
        
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_status "ERROR" "Health check timeout for container $container_id"
    return 1
}

# Function to wait for service to be ready
wait_for_service_ready() {
    local service=$1
    local timeout=${2:-$HEALTH_CHECK_TIMEOUT}
    
    print_status "INFO" "Waiting for service '$service' to be ready..."
    
    local instances
    instances=$(get_service_instances "$service")
    
    if [ -z "$instances" ]; then
        print_status "ERROR" "No instances found for service '$service'"
        return 1
    fi
    
    local all_healthy=true
    for container_id in $instances; do
        if ! check_service_health "$container_id" "$timeout"; then
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        print_status "OK" "All instances of service '$service' are healthy"
        return 0
    else
        print_status "ERROR" "Some instances of service '$service' are not healthy"
        return 1
    fi
}

# Function to create deployment backup
create_deployment_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_status "INFO" "Skipping backup creation"
        return 0
    fi
    
    print_status "INFO" "Creating deployment backup..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_dir="${BACKUP_DIR}/deployment_${timestamp}"
    
    mkdir -p "$backup_dir"
    
    # Backup current compose file and environment
    cp "$COMPOSE_FILE" "${backup_dir}/"
    cp "$ENV_FILE" "${backup_dir}/" 2>/dev/null || true
    
    # Backup current service configuration
    docker-compose -f "$COMPOSE_FILE" config > "${backup_dir}/resolved-compose.yml"
    
    # Get current image information
    docker-compose -f "$COMPOSE_FILE" images --format json > "${backup_dir}/current-images.json"
    
    # Store rollback information
    cat > "${backup_dir}/rollback-info.json" << EOF
{
    "service": "$SERVICE_NAME",
    "timestamp": "$timestamp",
    "previous_image": "$(docker-compose -f "$COMPOSE_FILE" images -q "$SERVICE_NAME" | head -1)",
    "scale": $(get_service_scale "$SERVICE_NAME")
}
EOF
    
    print_status "OK" "Backup created at: $backup_dir"
    echo "$backup_dir" > "${BACKUP_DIR}/.last-deployment-backup"
}

# Function to perform rolling update
perform_rolling_update() {
    local service=$1
    local new_image=$2
    
    print_status "INFO" "Starting rolling update for service '$service' to image '$new_image'"
    
    if [ "$DRY_RUN" = true ]; then
        print_status "INFO" "[DRY RUN] Would update service '$service' to image '$new_image'"
        return 0
    fi
    
    # Get current scale
    local current_scale
    current_scale=$(get_service_scale "$service")
    print_status "INFO" "Current scale for service '$service': $current_scale"
    
    if [ "$current_scale" -eq 0 ]; then
        print_status "ERROR" "Service '$service' has no running instances"
        return 1
    fi
    
    # Update the image in compose file (temporary)
    local temp_compose="${COMPOSE_FILE}.rolling-update"
    cp "$COMPOSE_FILE" "$temp_compose"
    
    # For simplicity, we'll use docker-compose up with --scale
    # In production, you might want to use more sophisticated orchestration
    
    # Scale up with new image
    print_status "INFO" "Scaling up service '$service' with new image..."
    
    # Set new image tag in environment
    export "${SERVICE_NAME^^}_IMAGE_TAG=$new_image"
    
    # Scale up by one instance first
    local new_scale=$((current_scale + 1))
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$new_scale" --no-recreate "$service"
    
    # Wait for new instance to be healthy
    sleep 10  # Give it a moment to start
    if ! wait_for_service_ready "$service" "$HEALTH_CHECK_TIMEOUT"; then
        print_status "ERROR" "New instance failed health check, rolling back..."
        docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$current_scale" "$service"
        return 1
    fi
    
    # Gradually replace old instances
    local instances_to_replace=$current_scale
    local batch_size=$MAX_PARALLEL_UPDATES
    
    while [ $instances_to_replace -gt 0 ]; do
        local current_batch_size
        if [ $instances_to_replace -lt $batch_size ]; then
            current_batch_size=$instances_to_replace
        else
            current_batch_size=$batch_size
        fi
        
        print_status "INFO" "Replacing $current_batch_size old instances..."
        
        # Scale down old instances
        local target_scale=$((new_scale - current_batch_size))
        docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$target_scale" "$service"
        
        # Wait for stability
        sleep 5
        
        # Scale back up with new instances
        docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$new_scale" "$service"
        
        # Health check
        if ! wait_for_service_ready "$service" "$HEALTH_CHECK_TIMEOUT"; then
            print_status "ERROR" "Health check failed during rolling update"
            return 1
        fi
        
        instances_to_replace=$((instances_to_replace - current_batch_size))
        print_status "OK" "Batch update completed, $instances_to_replace instances remaining"
    done
    
    # Final scale to original count
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$service=$current_scale" "$service"
    
    print_status "OK" "Rolling update completed successfully"
    return 0
}

# Function to rollback deployment
rollback_deployment() {
    local backup_file="${BACKUP_DIR}/.last-deployment-backup"
    
    if [ ! -f "$backup_file" ]; then
        print_status "ERROR" "No backup information found for rollback"
        return 1
    fi
    
    local backup_dir
    backup_dir=$(cat "$backup_file")
    
    if [ ! -d "$backup_dir" ]; then
        print_status "ERROR" "Backup directory not found: $backup_dir"
        return 1
    fi
    
    print_status "WARN" "Rolling back deployment using backup: $backup_dir"
    
    # Read rollback information
    local rollback_info="${backup_dir}/rollback-info.json"
    if [ ! -f "$rollback_info" ]; then
        print_status "ERROR" "Rollback information not found"
        return 1
    fi
    
    local previous_image
    local original_scale
    previous_image=$(jq -r '.previous_image' "$rollback_info")
    original_scale=$(jq -r '.scale' "$rollback_info")
    
    print_status "INFO" "Rolling back to image: $previous_image"
    print_status "INFO" "Rolling back to scale: $original_scale"
    
    # Restore compose file
    cp "${backup_dir}/docker-compose.yml" "$COMPOSE_FILE"
    
    # Restart service with original configuration
    docker-compose -f "$COMPOSE_FILE" up -d --scale "$SERVICE_NAME=$original_scale" "$SERVICE_NAME"
    
    # Wait for rollback to complete
    if wait_for_service_ready "$SERVICE_NAME" "$HEALTH_CHECK_TIMEOUT"; then
        print_status "OK" "Rollback completed successfully"
        return 0
    else
        print_status "ERROR" "Rollback failed"
        return 1
    fi
}

# Function to cleanup after deployment
cleanup_deployment() {
    print_status "INFO" "Cleaning up deployment artifacts..."
    
    # Remove old images (keep last 3 versions)
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}" | \
        grep "$SERVICE_NAME" | \
        tail -n +4 | \
        awk '{print $3}' | \
        xargs -r docker rmi 2>/dev/null || true
    
    # Clean up temporary files
    rm -f "${COMPOSE_FILE}.rolling-update"
    
    print_status "OK" "Cleanup completed"
}

# Main deployment function
main() {
    print_status "INFO" "Starting rolling deployment"
    print_status "INFO" "Service: $SERVICE_NAME"
    print_status "INFO" "New image tag: $NEW_IMAGE_TAG"
    print_status "INFO" "Health check timeout: ${HEALTH_CHECK_TIMEOUT}s"
    print_status "INFO" "Max parallel updates: $MAX_PARALLEL_UPDATES"
    echo
    
    # Validate prerequisites
    validate_prerequisites
    
    # Create backup
    create_deployment_backup
    
    # Perform rolling update
    if perform_rolling_update "$SERVICE_NAME" "$NEW_IMAGE_TAG"; then
        print_status "OK" "Deployment completed successfully"
        cleanup_deployment
        exit 0
    else
        print_status "ERROR" "Deployment failed"
        
        if [ "$ROLLBACK_ON_FAILURE" = true ] && [ "$DRY_RUN" = false ]; then
            print_status "WARN" "Attempting automatic rollback..."
            if rollback_deployment; then
                print_status "OK" "Automatic rollback completed"
                exit 1
            else
                print_status "ERROR" "Automatic rollback failed - manual intervention required"
                exit 2
            fi
        else
            print_status "INFO" "Automatic rollback disabled"
            exit 1
        fi
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --image-tag)
            NEW_IMAGE_TAG="$2"
            shift 2
            ;;
        --timeout)
            HEALTH_CHECK_TIMEOUT="$2"
            shift 2
            ;;
        --interval)
            HEALTH_CHECK_INTERVAL="$2"
            shift 2
            ;;
        --parallel)
            MAX_PARALLEL_UPDATES="$2"
            shift 2
            ;;
        --no-rollback)
            ROLLBACK_ON_FAILURE=false
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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

# Validate required arguments
if [ -z "$SERVICE_NAME" ]; then
    print_status "ERROR" "Service name is required (--service)"
    show_usage
    exit 1
fi

if [ -z "$NEW_IMAGE_TAG" ]; then
    print_status "ERROR" "Image tag is required (--image-tag)"
    show_usage
    exit 1
fi

# Run main function
main