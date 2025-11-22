#!/bin/bash

# Production deployment script for Starter Template
# This script starts the application in production mode with AWS RDS PostgreSQL

echo "🚀 Starting Starter Template in Production Mode"
echo "==============================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "   Creating from template..."
    cp .env.production.example .env.production
    echo "✅ Created .env.production from template"
    echo ""
    echo "⚠️  Please update .env.production with your values:"
    echo "   - DB_HOST: Your AWS RDS endpoint"
    echo "   - DB_NAME: Your database name"
    echo "   - DB_USER: Your database user"
    echo "   - DB_PASSWORD: Your database password"
    echo "   - SESSION_SECRET: A strong random string (use: openssl rand -base64 32)"
    echo "   - FRONTEND_URL: Your production frontend URL"
    echo "   - ARCJET_KEY: Your Arcjet production key"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker and try again."
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

echo "📦 Building and starting production container..."
echo "   - Using AWS RDS PostgreSQL"
echo "   - Running in optimized production mode"
echo "   - SSL enabled for database connection"
echo ""

# Start production environment
echo "🐳 Starting Docker container..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for container to be healthy
echo "⏳ Waiting for application to be ready..."
sleep 10

# Check if container is running
if docker-compose -f docker-compose.prod.yml ps | grep -q "starter-template-app-prod"; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    echo "   View logs: docker-compose -f docker-compose.prod.yml logs app"
    exit 1
fi

echo ""
echo "🎉 Production environment started!"
echo "   API: http://localhost:8080"
echo "   Health Check: http://localhost:8080/health"
echo ""
echo "Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f app"
echo "   Check status: docker-compose -f docker-compose.prod.yml ps"
echo "   Stop app: docker-compose -f docker-compose.prod.yml down"
echo "   Restart app: docker-compose -f docker-compose.prod.yml restart app"
echo ""
echo "⚠️  Important:"
echo "   - Ensure AWS RDS security group allows inbound traffic on port 5432"
echo "   - Monitor logs for any connection issues"
echo "   - Keep .env.production secure and never commit to version control"
