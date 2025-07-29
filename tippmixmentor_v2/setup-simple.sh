#!/bin/bash

# TippMixMentor v2 Simple Development Setup Script
echo "🚀 Setting up TippMixMentor v2 development environment (Simple Mode)..."

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please review and update the configuration."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p prediction_model/models
mkdir -p prediction_model/logs

# Set up backend
echo "🔧 Setting up backend..."
cd backend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

cd ..

# Set up frontend
echo "🎨 Setting up frontend..."
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

cd ..

# Set up ML service
echo "🤖 Setting up ML service..."
cd prediction_model

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing ML service dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cd ..

echo "✅ Simple development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and update the .env file with your configuration"
echo "2. Start PostgreSQL and Redis (you can use Docker for these):"
echo "   docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tippmixmentor -p 5432:5432 postgres:15"
echo "   docker run -d --name redis -p 6379:6379 redis:7-alpine"
echo "3. Run database migrations:"
echo "   cd backend && npx prisma db push"
echo "4. Start the services:"
echo "   - Backend: cd backend && npm run start:dev"
echo "   - Frontend: cd frontend && npm run dev"
echo "   - ML Service: cd prediction_model && source venv/bin/activate && uvicorn api.main:app --reload"
echo ""
echo "🌐 Access the applications:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo "   - ML Service: http://localhost:8000"
echo "   - API Documentation: http://localhost:3001/api/docs"
echo "   - ML Service Docs: http://localhost:8000/docs"
echo ""
echo "🎉 Happy coding!" 