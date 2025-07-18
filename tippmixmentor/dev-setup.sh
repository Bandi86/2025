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
        echo "Usage: $0 {start|setup-db|logs|stop|cleanup|restart}"
        echo ""
        echo "Commands:"
        echo "  start     - Build and start all services"
        echo "  setup-db  - Initialize database with Prisma"
        echo "  logs      - Show service logs"
        echo "  stop      - Stop all services"
        echo "  cleanup   - Stop services and clean up volumes"
        echo "  restart   - Restart all services"
        echo ""
        echo "Example: ./dev-setup.sh start"
        exit 1
        ;;
esac