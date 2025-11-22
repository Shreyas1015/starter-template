#!/bin/bash

# Development startup script for Starter Template
# This script starts the application in development mode with local PostgreSQL

echo "🚀 Starting Starter Template in Development Mode"
echo "=================================================="

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    echo "   Creating from template..."
    cp .env.development.example .env.development
    echo "✅ Created .env.development from template"
    echo ""
    echo "⚠️  Please update .env.development with your values:"
    echo "   - ARCJET_KEY: Your Arcjet security key"
    echo "   - SESSION_SECRET: A strong random string"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo "📦 Building and starting development containers..."
echo "   - PostgreSQL container will be created"
echo "   - Application will run with hot reload enabled"
echo "   - Session store will be configured"
echo ""

# Start development environment
echo "🐳 Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "🎉 Development environment started!"
echo "   API: http://localhost:8080"
echo "   Health Check: http://localhost:8080/health"
echo "   Database: localhost:5432"
echo "   Database Name: starter_template_dev"
echo ""
echo "Useful commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f app"
echo "   Run migrations: docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter"
echo "   Access PostgreSQL: docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev"
echo "   Stop environment: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "To stop the environment, press Ctrl+C or run: docker-compose -f docker-compose.dev.yml down"
