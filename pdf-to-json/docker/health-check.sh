#!/bin/bash
# Health check script for Football Automation System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
TIMEOUT="${TIMEOUT:-10}"
VERBOSE="${VERBOSE:-false}"

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
            echo -e "${NC}ℹ${NC} $message"
            ;;
    esac
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    if [ "$VERBOSE" = "true" ]; then
        print_status "INFO" "Checking $description at $url"
    fi
    
    local response
    local status_code
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "HTTPSTATUS:000")
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [ "$status_code" = "$expected_status" ]; then
        print_status "OK" "$description is healthy (HTTP $status_code)"
        return 0
    else
        print_status "ERROR" "$description is unhealthy (HTTP $status_code)"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    local db_url="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/football_automation}"
    
    if command -v psql >/dev/null 2>&1; then
        if psql "$db_url" -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "OK" "Database is accessible"
            return 0
        else
            print_status "ERROR" "Database is not accessible"
            return 1
        fi
    else
        print_status "WARN" "psql not available, skipping database check"
        return 0
    fi
}

# Function to check Redis connectivity
check_redis() {
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_password="${REDIS_PASSWORD:-redis123}"
    
    if command -v redis-cli >/dev/null 2>&1; then
        if redis-cli -h "$redis_host" -p "$redis_port" -a "$redis_password" ping >/dev/null 2>&1; then
            print_status "OK" "Redis is accessible"
            return 0
        else
            print_status "ERROR" "Redis is not accessible"
            return 1
        fi
    else
        print_status "WARN" "redis-cli not available, skipping Redis check"
        return 0
    fi
}

# Function to check Docker containers
check_containers() {
    if command -v docker >/dev/null 2>&1; then
        local containers=("football-app" "football-postgres" "football-redis")
        local all_healthy=true
        
        for container in "${containers[@]}"; do
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
                print_status "OK" "Container $container is running"
            else
                print_status "ERROR" "Container $container is not running"
                all_healthy=false
            fi
        done
        
        return $all_healthy
    else
        print_status "WARN" "Docker not available, skipping container check"
        return 0
    fi
}

# Function to check system resources
check_resources() {
    # Check disk space
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        print_status "OK" "Disk usage is $disk_usage%"
    elif [ "$disk_usage" -lt 95 ]; then
        print_status "WARN" "Disk usage is $disk_usage%"
    else
        print_status "ERROR" "Disk usage is critically high: $disk_usage%"
        return 1
    fi
    
    # Check memory usage if available
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        
        if [ "$memory_usage" -lt 90 ]; then
            print_status "OK" "Memory usage is $memory_usage%"
        elif [ "$memory_usage" -lt 95 ]; then
            print_status "WARN" "Memory usage is $memory_usage%"
        else
            print_status "ERROR" "Memory usage is critically high: $memory_usage%"
            return 1
        fi
    fi
    
    return 0
}

# Main health check function
main() {
    local exit_code=0
    
    print_status "INFO" "Starting health check for Football Automation System"
    print_status "INFO" "API URL: $API_URL"
    print_status "INFO" "Timeout: ${TIMEOUT}s"
    echo
    
    # Check API endpoints
    print_status "INFO" "Checking API endpoints..."
    check_endpoint "$API_URL/health" 200 "Health endpoint" || exit_code=1
    check_endpoint "$API_URL/" 200 "Root endpoint" || exit_code=1
    check_endpoint "$API_URL/docs" 200 "API documentation" || exit_code=1
    echo
    
    # Check dependencies
    print_status "INFO" "Checking dependencies..."
    check_database || exit_code=1
    check_redis || exit_code=1
    echo
    
    # Check containers
    print_status "INFO" "Checking containers..."
    check_containers || exit_code=1
    echo
    
    # Check system resources
    print_status "INFO" "Checking system resources..."
    check_resources || exit_code=1
    echo
    
    # Final status
    if [ $exit_code -eq 0 ]; then
        print_status "OK" "All health checks passed"
    else
        print_status "ERROR" "Some health checks failed"
    fi
    
    exit $exit_code
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --api-url URL     API base URL (default: http://localhost:8000)"
            echo "  --timeout SECONDS Request timeout (default: 10)"
            echo "  --verbose         Enable verbose output"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main