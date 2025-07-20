#!/bin/bash

# BettingMentor Development Setup Script
echo "🎯 BettingMentor Development Setup"
echo "=================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to build and start services
start_services() {
    echo "🚀 Starting BettingMentor services..."
    docker-compose up --build -d
    
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Services are running!"
        echo ""
        echo "📊 Service URLs:"
        echo "   Frontend: http://localhost:3000"
        echo "   Backend API: http://localhost:3001"
        echo "   pgAdmin: http://localhost:5050"
        echo "   PostgreSQL: localhost:55432"
        echo "   Redis: localhost:6379"
        echo ""
        echo "🔑 pgAdmin Login:"
        echo "   Email: admin@bettingmentor.com"
        echo "   Password: admin123"
    else
        echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    fi
}

# Function to setup database
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Wait for postgres to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Run Prisma migrations
    echo "🔄 Running Prisma migrations..."
    docker-compose exec backend pnpm prisma migrate dev --name init
    
    # Generate Prisma client
    echo "⚙️  Generating Prisma client..."
    docker-compose exec backend pnpm prisma generate
    
    echo "✅ Database setup complete!"
}

# Function to show logs
show_logs() {
    echo "📋 Showing service logs..."
    docker-compose logs -f
}

# Function to run all scrapers and sync data
run_full_data_sync() {
    echo "🔄 Running full data synchronization..."
    
    # Ensure virtual environment is activated
    if [ ! -d ".venv" ]; then
        echo "❌ Virtual environment not found. Please run setup first."
        return 1
    fi
    
    source .venv/bin/activate
    
    # Create logs directory
    mkdir -p logs
    
    echo "📊 Step 1: Running TippmixPro scraper..."
    python3 webscrapper/src/tippmixpro/tippmixpro.py
    if [ $? -eq 0 ]; then
        echo "✅ TippmixPro scraper completed"
    else
        echo "❌ TippmixPro scraper failed"
        return 1
    fi
    
    echo "📊 Step 2: Running Results scraper..."
    python3 webscrapper/src/results_scrapper/tippmix_results_scraper.py
    if [ $? -eq 0 ]; then
        echo "✅ Results scraper completed"
    else
        echo "❌ Results scraper failed"
        return 1
    fi
    
    echo "📊 Step 3: Running data merge..."
    python3 merge_json_data/merge_json.py
    if [ $? -eq 0 ]; then
        echo "✅ Data merge completed"
    else
        echo "❌ Data merge failed"
        return 1
    fi
    
    echo "📊 Step 4: Syncing to database..."
    sleep 5  # Wait for services to be ready
    SYNC_RESPONSE=$(curl -s -X POST "http://localhost:3001/data-ingestion/ingest-all" \
        -H "Content-Type: application/json" \
        -d '{"directoryPath": "/usr/src/app/merge_json_data/merged_data"}')
    
    if [[ $SYNC_RESPONSE == *"success\":true"* ]]; then
        echo "✅ Database sync completed"
    else
        echo "❌ Database sync failed: $SYNC_RESPONSE"
        return 1
    fi
    
    echo "📊 Step 5: Running monitoring check..."
    python3 monitoring/monitor_data_pipeline.py
    
    echo "📊 Step 6: Getting database stats..."
    DB_STATS=$(curl -s "http://localhost:3001/data-ingestion/stats")
    echo "📈 Database Statistics:"
    echo "$DB_STATS" | python3 -m json.tool 2>/dev/null || echo "$DB_STATS"
    
    echo ""
    echo "🎉 Full data synchronization completed!"
    echo "📋 Check monitoring/reports/latest_report.md for detailed status"
}

# Function to show development status
show_dev_status() {
    echo "📊 BettingMentor Development Status"
    echo "=================================="
    
    # Check if services are running
    echo "🐳 Docker Services:"
    if docker-compose ps | grep -q "Up"; then
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    else
        echo "❌ No services running"
    fi
    
    echo ""
    echo "📁 Data Files Status:"
    
    # Check tippmixpro data
    TIPPMIXPRO_COUNT=$(find webscrapper/src/tippmixpro/data -name "*.json" 2>/dev/null | wc -l)
    TIPPMIXPRO_PROCESSED=$(find merge_json_data/processed/tippmixpro -name "*.json" 2>/dev/null | wc -l)
    echo "   TippmixPro: $TIPPMIXPRO_COUNT new, $TIPPMIXPRO_PROCESSED processed"
    
    # Check results data
    RESULTS_COUNT=$(find webscrapper/src/results_scrapper/data -name "*.json" 2>/dev/null | wc -l)
    RESULTS_PROCESSED=$(find merge_json_data/processed/results -name "*.json" 2>/dev/null | wc -l)
    echo "   Results: $RESULTS_COUNT new, $RESULTS_PROCESSED processed"
    
    # Check merged data
    MERGED_COUNT=$(find merge_json_data/merged_data -name "*.json" ! -name "*.backup" 2>/dev/null | wc -l)
    echo "   Merged: $MERGED_COUNT files"
    
    echo ""
    echo "🔗 Service URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   pgAdmin: http://localhost:5050"
    echo "   API Stats: http://localhost:3001/data-ingestion/stats"
    
    echo ""
    echo "📋 Latest Monitoring Report:"
    if [ -f "monitoring/reports/latest_report.md" ]; then
        echo "   Available at: monitoring/reports/latest_report.md"
        echo "   Last updated: $(stat -c %y monitoring/reports/latest_report.md 2>/dev/null || echo 'Unknown')"
    else
        echo "   No monitoring report available"
    fi
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    docker-compose down
    echo "✅ Services stopped"
}

# Function to clean up everything
cleanup() {
    echo "🧹 Cleaning up..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    echo "✅ Cleanup complete"
}

# Main menu
case "$1" in
    "start")
        check_docker
        start_services
        ;;
    "dev")
        check_docker
        start_services
        echo ""
        echo "⏳ Waiting for services to initialize..."
        sleep 15
        run_full_data_sync
        show_dev_status
        ;;
    "sync")
        run_full_data_sync
        ;;
    "status")
        show_dev_status
        ;;
    "setup-db")
        setup_database
        ;;
    "logs")
        show_logs
        ;;
    "stop")
        stop_services
        ;;
    "cleanup")
        cleanup
        ;;
    "restart")
        stop_services
        sleep 2
        start_services
        ;;
    *)
        echo "Usage: $0 {dev|start|sync|status|setup-db|logs|stop|cleanup|restart}"
        echo ""
        echo "🚀 Development Commands:"
        echo "  dev       - Full development setup: start services + sync data + show status"
        echo "  sync      - Run all scrapers and sync data to database"
        echo "  status    - Show current development status and statistics"
        echo ""
        echo "🐳 Service Commands:"
        echo "  start     - Build and start all services"
        echo "  setup-db  - Initialize database with Prisma"
        echo "  logs      - Show service logs"
        echo "  stop      - Stop all services"
        echo "  cleanup   - Stop services and clean up volumes"
        echo "  restart   - Restart all services"
        echo ""
        echo "💡 Quick Start for Development:"
        echo "  ./dev-setup.sh dev    # Complete development environment setup"
        echo ""
        echo "💡 Daily Development Workflow:"
        echo "  ./dev-setup.sh sync   # Refresh data from all sources"
        echo "  ./dev-setup.sh status # Check current system status"
        exit 1
        ;;
esac