#!/bin/bash
set -e

# Global variables for graceful shutdown
PID=""
SHUTDOWN_INITIATED=false

# Function to handle shutdown signals
shutdown_handler() {
    local signal=$1
    echo "Received signal $signal, initiating graceful shutdown..."
    
    if [ "$SHUTDOWN_INITIATED" = true ]; then
        echo "Shutdown already in progress, ignoring signal"
        return
    fi
    
    SHUTDOWN_INITIATED=true
    
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        echo "Sending graceful shutdown signal to process $PID"
        kill -TERM "$PID"
        
        # Wait for graceful shutdown with timeout
        local timeout=30
        local count=0
        
        while kill -0 "$PID" 2>/dev/null && [ $count -lt $timeout ]; do
            echo "Waiting for graceful shutdown... ($count/$timeout)"
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if kill -0 "$PID" 2>/dev/null; then
            echo "Graceful shutdown timeout, forcing termination"
            kill -KILL "$PID"
        fi
    fi
    
    echo "Graceful shutdown completed"
    exit 0
}

# Setup signal handlers
trap 'shutdown_handler SIGTERM' TERM
trap 'shutdown_handler SIGINT' INT

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo "Waiting for $service_name to be ready at $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            echo "$service_name is ready!"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "ERROR: $service_name failed to become ready after $max_attempts attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    cd /app
    python -c "
import sys
sys.path.insert(0, '/app/src')
try:
    from automation.models import init_database
    init_database()
    print('Database initialized successfully')
except Exception as e:
    print(f'Database initialization failed: {e}')
    sys.exit(1)
"
}

# Function to validate configuration
validate_config() {
    echo "Validating configuration..."
    cd /app
    python -c "
import sys
sys.path.insert(0, '/app/src')
try:
    from automation.config import load_config
    config = load_config()
    print('Configuration validated successfully')
except Exception as e:
    print(f'Configuration validation failed: {e}')
    sys.exit(1)
"
}

# Wait for dependent services if they are configured
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis"
fi

if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PORT" ]; then
    wait_for_service "$DATABASE_HOST" "$DATABASE_PORT" "Database"
fi

# Validate configuration
validate_config

# Run database migrations if database is configured
if [ -n "$DATABASE_URL" ]; then
    run_migrations
fi

# Change to app directory
cd /app

# Execute the command based on the first argument
case "$1" in
    "api")
        echo "Starting FastAPI server..."
        python -m uvicorn src.api.enhanced_main:app \
            --host 0.0.0.0 \
            --port 8000 \
            --workers ${API_WORKERS:-1} \
            --log-level ${LOG_LEVEL:-info} &
        PID=$!
        echo "FastAPI server started with PID: $PID"
        wait $PID
        ;;
    "automation")
        echo "Starting automation manager..."
        python -c "
import sys
import asyncio
import signal
sys.path.insert(0, '/app/src')
from automation.automation_manager import AutomationManager
from automation.graceful_shutdown import GracefulShutdownManager, ShutdownConfig
from automation.config import load_config

async def main():
    config = load_config()
    
    # Initialize graceful shutdown manager
    shutdown_config = ShutdownConfig()
    shutdown_manager = GracefulShutdownManager(shutdown_config)
    
    # Initialize automation manager
    manager = AutomationManager(config)
    
    # Set component references for graceful shutdown
    shutdown_manager.set_component_references(
        automation_manager=manager,
        processing_manager=getattr(manager, 'processing_manager', None),
        file_watcher=getattr(manager, 'file_watcher', None),
        web_downloader=getattr(manager, 'web_downloader', None),
        cache_manager=getattr(manager, 'cache_manager', None),
        monitoring_manager=getattr(manager, 'monitoring_manager', None)
    )
    
    await manager.start()
    
    try:
        # Wait for shutdown signal
        await shutdown_manager.shutdown_event.wait()
    except KeyboardInterrupt:
        pass
    finally:
        await manager.stop()

if __name__ == '__main__':
    asyncio.run(main())
" &
        PID=$!
        echo "Automation manager started with PID: $PID"
        wait $PID
        ;;
    "worker")
        echo "Starting processing worker..."
        python -c "
import sys
import asyncio
sys.path.insert(0, '/app/src')
from automation.processing_manager import ProcessingManager
from automation.graceful_shutdown import GracefulShutdownManager, ShutdownConfig
from automation.config import load_config

async def main():
    config = load_config()
    
    # Initialize graceful shutdown manager
    shutdown_config = ShutdownConfig()
    shutdown_manager = GracefulShutdownManager(shutdown_config)
    
    # Initialize processing manager
    manager = ProcessingManager(config.processing)
    
    # Set component references for graceful shutdown
    shutdown_manager.set_component_references(processing_manager=manager)
    
    await manager.start()
    
    try:
        # Wait for shutdown signal
        await shutdown_manager.shutdown_event.wait()
    except KeyboardInterrupt:
        pass
    finally:
        await manager.stop()

if __name__ == '__main__':
    asyncio.run(main())
" &
        PID=$!
        echo "Processing worker started with PID: $PID"
        wait $PID
        ;;
    "cli")
        echo "Starting CLI mode..."
        shift
        python main.py "$@" &
        PID=$!
        wait $PID
        ;;
    "streamlit")
        echo "Starting Streamlit dashboard..."
        streamlit run src/ui/streamlit_app.py \
            --server.port 8501 \
            --server.address 0.0.0.0 \
            --server.headless true &
        PID=$!
        echo "Streamlit dashboard started with PID: $PID"
        wait $PID
        ;;
    "shell")
        echo "Starting interactive shell..."
        exec /bin/bash
        ;;
    *)
        echo "Usage: $0 {api|automation|worker|cli|streamlit|shell}"
        echo "  api        - Start FastAPI server"
        echo "  automation - Start automation manager"
        echo "  worker     - Start processing worker"
        echo "  cli        - Run CLI commands"
        echo "  streamlit  - Start Streamlit dashboard"
        echo "  shell      - Start interactive shell"
        exit 1
        ;;
esac