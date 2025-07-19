#!/bin/bash

echo "🚀 Setting up database for BettingMentor..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check if Prisma is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️ Generating Prisma client..."
pnpm prisma generate

echo "🔄 Running database migrations..."
pnpm prisma migrate dev --name "add-unique-constraints-for-data-ingestion"

echo "📊 Checking database connection..."
pnpm prisma db push

echo "✅ Database setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the development server: pnpm start:dev"
echo "2. Test data ingestion: node scripts/test-ingestion.js"
echo "3. Access API at: http://localhost:3001"
echo ""
echo "📚 Available endpoints:"
echo "- GET  /api/matches - Get all matches"
echo "- GET  /api/matches/upcoming - Get upcoming matches"
echo "- GET  /api/matches/date/:date - Get matches by date"
echo "- POST /api/ingest - Trigger data ingestion"
echo "- GET  /api/stats - Get database statistics"