#!/bin/bash

# TippMixMentor Test Runner Script
# Provides easy commands to run different types of tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker services are running
check_services() {
    print_status "Checking if Docker services are running..."
    
    if ! docker-compose ps | grep -q "Up"; then
        print_warning "Docker services are not running. Starting them..."
        docker-compose up -d
        
        print_status "Waiting for services to be ready..."
        sleep 30
    else
        print_success "Docker services are already running"
    fi
}

# Function to check Python environment
check_python_env() {
    print_status "Checking Python environment..."
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    if [ ! -d "test_env" ]; then
        print_warning "Virtual environment not found. Creating one..."
        python3 -m venv test_env
    fi
    
    # Activate virtual environment
    source test_env/bin/activate
    
    # Install dependencies if needed
    if [ ! -f "test_env/lib/python*/site-packages/httpx" ]; then
        print_status "Installing test dependencies..."
        pip install -r requirements.txt
    fi
    
    print_success "Python environment is ready"
}

# Function to run quick tests
run_quick_tests() {
    print_status "Running quick tests..."
    python3 quick_test.py
}

# Function to run all tests
run_all_tests() {
    print_status "Running all test suites..."
    python3 run_all_tests.py "$@"
}

# Function to run specific test suite
run_test_suite() {
    local suite=$1
    print_status "Running $suite test suite..."
    python3 run_all_tests.py "$suite"
}

# Function to run individual test file
run_test_file() {
    local file=$1
    print_status "Running $file..."
    python3 "$file"
}

# Function to show help
show_help() {
    echo "TippMixMentor Test Runner"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  quick                    Run quick health checks"
    echo "  all                      Run all test suites"
    echo "  integration              Run integration tests"
    echo "  user_workflow            Run user workflow tests"
    echo "  websocket                Run WebSocket tests"
    echo "  persistence              Run persistence tests"
    echo "  performance              Run performance tests"
    echo "  file <filename>          Run specific test file"
    echo "  help                     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 quick                 # Run quick health checks"
    echo "  $0 all                   # Run all test suites"
    echo "  $0 performance           # Run only performance tests"
    echo "  $0 file e2e_user_workflow_test.py  # Run specific file"
    echo ""
    echo "Options:"
    echo "  --no-check               Skip service and environment checks"
    echo "  --help                   Show this help message"
}

# Main script logic
main() {
    local command=""
    local skip_checks=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-check)
                skip_checks=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                if [ -z "$command" ]; then
                    command="$1"
                else
                    # Additional arguments for the command
                    break
                fi
                shift
                ;;
        esac
    done
    
    # Check if we're in the tests directory
    if [ ! -f "run_all_tests.py" ]; then
        print_error "This script must be run from the tests directory"
        exit 1
    fi
    
    # Perform checks unless skipped
    if [ "$skip_checks" = false ]; then
        check_services
        check_python_env
    fi
    
    # Execute command
    case $command in
        quick)
            run_quick_tests
            ;;
        all)
            run_all_tests "$@"
            ;;
        integration|user_workflow|websocket|persistence|performance)
            run_test_suite "$command"
            ;;
        file)
            if [ -z "$1" ]; then
                print_error "Please specify a test file"
                exit 1
            fi
            if [ ! -f "$1" ]; then
                print_error "Test file '$1' not found"
                exit 1
            fi
            run_test_file "$1"
            ;;
        help)
            show_help
            ;;
        "")
            print_error "No command specified"
            show_help
            exit 1
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
    
    print_success "Test execution completed"
}

# Run main function with all arguments
main "$@" 