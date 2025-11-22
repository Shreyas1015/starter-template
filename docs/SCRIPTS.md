# Deployment Scripts Guide

This guide explains how to use the provided bash scripts for development and production deployment.

## Overview

The `scripts/` directory contains automated deployment scripts for both development and production environments:

- **`dev.sh`** - Development environment with local PostgreSQL
- **`prod.sh`** - Production environment with AWS RDS PostgreSQL

## Prerequisites

- Bash shell (Linux, macOS, or WSL on Windows)
- Docker and Docker Compose installed
- `.env.development.example` and `.env.production.example` files in project root

## Development Script (`dev.sh`)

### Purpose

Automates the setup and startup of the development environment with:

- Local PostgreSQL container
- Hot reload enabled
- Debug logging
- Automatic environment file creation

### Usage

```bash
# Make script executable (first time only)
chmod +x scripts/dev.sh

# Run the script
./scripts/dev.sh
```

### What It Does

1. **Checks for `.env.development`**
   - If missing, creates it from `.env.development.example`
   - Prompts you to update required values

2. **Verifies Docker is running**
   - Exits with error if Docker is not available

3. **Creates logs directory**
   - Ensures logs directory exists for application logs

4. **Starts Docker containers**
   - Builds and starts PostgreSQL and Node.js containers
   - Enables hot reload for development

### Output Example

```
🚀 Starting Starter Template in Development Mode
==================================================

📦 Building and starting development containers...
   - PostgreSQL container will be created
   - Application will run with hot reload enabled
   - Session store will be configured

🐳 Starting Docker containers...
[Docker build and startup output...]

🎉 Development environment started!
   API: http://localhost:8080
   Health Check: http://localhost:8080/health
   Database: localhost:5432
   Database Name: starter_template_dev

Useful commands:
   View logs: docker-compose -f docker-compose.dev.yml logs -f app
   Run migrations: docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter
   Access PostgreSQL: docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev
   Stop environment: docker-compose -f docker-compose.dev.yml down

To stop the environment, press Ctrl+C or run: docker-compose -f docker-compose.dev.yml down
```

### Configuration

Before running, update `.env.development` with:

```env
# Required
ARCJET_KEY=your_arcjet_key_here
SESSION_SECRET=your-dev-session-secret

# Optional (defaults provided)
PORT=8080
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Stopping Development

```bash
# Press Ctrl+C in the terminal, or run:
docker-compose -f docker-compose.dev.yml down

# To also remove database volume (WARNING: Deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

## Production Script (`prod.sh`)

### Purpose

Automates the setup and startup of the production environment with:

- AWS RDS PostgreSQL connection
- SSL enabled
- Resource limits
- Health checks
- Detached mode (runs in background)

### Usage

```bash
# Make script executable (first time only)
chmod +x scripts/prod.sh

# Run the script
./scripts/prod.sh
```

### What It Does

1. **Checks for `.env.production`**
   - If missing, creates it from `.env.production.example`
   - Prompts you to update AWS RDS credentials

2. **Verifies Docker is running**
   - Exits with error if Docker is not available

3. **Creates logs directory**
   - Ensures logs directory exists for application logs

4. **Starts Docker container**
   - Builds and starts Node.js container in detached mode
   - Connects to AWS RDS PostgreSQL
   - Enables SSL for database connection

5. **Verifies container is running**
   - Checks if container started successfully
   - Shows error if startup failed

### Output Example

```
🚀 Starting Starter Template in Production Mode
===============================================

📦 Building and starting production container...
   - Using AWS RDS PostgreSQL
   - Running in optimized production mode
   - SSL enabled for database connection

🐳 Starting Docker container...
[Docker build output...]

⏳ Waiting for application to be ready...
✅ Container is running

🎉 Production environment started!
   API: http://localhost:8080
   Health Check: http://localhost:8080/health

Useful commands:
   View logs: docker-compose -f docker-compose.prod.yml logs -f app
   Check status: docker-compose -f docker-compose.prod.yml ps
   Stop app: docker-compose -f docker-compose.prod.yml down
   Restart app: docker-compose -f docker-compose.prod.yml restart app

⚠️  Important:
   - Ensure AWS RDS security group allows inbound traffic on port 5432
   - Monitor logs for any connection issues
   - Keep .env.production secure and never commit to version control
```

### Configuration

Before running, update `.env.production` with your AWS RDS credentials:

```env
# Required - AWS RDS
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_secure_password

# Required - Session & Security
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
ARCJET_KEY=your_production_arcjet_key

# Required - Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Optional (defaults provided)
PORT=8080
LOG_LEVEL=info
DB_SSL=true
```

### Generate Session Secret

```bash
# Generate a strong random string for production
openssl rand -base64 32

# Copy the output and paste into .env.production
SESSION_SECRET=<generated-string>
```

### Stopping Production

```bash
# Stop the container
docker-compose -f docker-compose.prod.yml down

# View logs before stopping
docker-compose -f docker-compose.prod.yml logs -f app
```

## Common Commands

### Development

```bash
# View application logs
docker-compose -f docker-compose.dev.yml logs -f app

# View database logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter

# Access PostgreSQL CLI
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev

# Restart application
docker-compose -f docker-compose.dev.yml restart app

# Rebuild containers
docker-compose -f docker-compose.dev.yml up --build
```

### Production

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Execute command in container
docker-compose -f docker-compose.prod.yml exec app npm run db:sync

# Stop container
docker-compose -f docker-compose.prod.yml down
```

## Troubleshooting

### Script Not Found

```bash
# Make sure you're in the project root directory
cd /path/to/starter-template

# Make script executable
chmod +x scripts/dev.sh
chmod +x scripts/prod.sh
```

### Docker Not Running

```bash
# Start Docker Desktop (macOS/Windows) or Docker daemon (Linux)
# Then try running the script again
```

### Environment File Issues

```bash
# If .env.development or .env.production is missing:
# The script will create it from the example file
# You'll need to update it with your values

# Manual creation:
cp .env.development.example .env.development
nano .env.development  # Edit with your values
```

### Container Fails to Start

```bash
# Check logs for errors
docker-compose -f docker-compose.dev.yml logs app

# Verify environment variables
cat .env.development

# Check if port 8080 is already in use
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows
```

### Database Connection Failed

```bash
# Development: Check PostgreSQL container
docker-compose -f docker-compose.dev.yml logs postgres

# Production: Verify AWS RDS credentials
# - Check DB_HOST, DB_USER, DB_PASSWORD in .env.production
# - Ensure RDS security group allows inbound on port 5432
# - Test connection manually if needed
```

## Best Practices

### Development

1. ✅ Run `./scripts/dev.sh` to start development
2. ✅ Use `docker-compose logs -f` to monitor
3. ✅ Keep `.env.development` updated
4. ✅ Don't commit `.env.development` to version control
5. ✅ Use `docker-compose down -v` to reset database if needed

### Production

1. ✅ Generate strong `SESSION_SECRET` with `openssl rand -base64 32`
2. ✅ Use AWS RDS with proper security groups
3. ✅ Enable SSL for database connection
4. ✅ Keep `.env.production` secure (never commit)
5. ✅ Monitor logs regularly
6. ✅ Set up automated backups for RDS
7. ✅ Use environment variables for sensitive data
8. ✅ Test deployment in staging first

## Integration with npm Scripts

The scripts can also be run via npm:

```bash
# In package.json
"dev:docker": "sh ./scripts/dev.sh"
"prod:docker": "sh ./scripts/prod.sh"

# Run via npm
npm run dev:docker
npm run prod:docker
```

## Next Steps

1. ✅ Make scripts executable: `chmod +x scripts/*.sh`
2. ✅ Copy environment examples: `cp .env.*.example .env.*`
3. ✅ Update with your values
4. ✅ Run `./scripts/dev.sh` for development
5. ✅ Run `./scripts/prod.sh` for production

## Support

For issues:

- Check script output for error messages
- Review Docker logs
- Verify environment variables
- Check Docker Desktop/daemon status
- Consult [DOCKER_SETUP.md](./DOCKER_SETUP.md) for detailed Docker guide
