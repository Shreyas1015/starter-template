# Production Environment Setup Guide

## Overview

This guide covers the production deployment configuration for the Starter Template application with AWS RDS PostgreSQL and Arcjet security.

## Production Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Production Environment                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Docker Container (starter-template-app-prod)    │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  Node.js Application (Port 8080)         │   │  │
│  │  │  - Arcjet Bot Detection (LIVE mode)      │   │  │
│  │  │  - Rate Limiting                         │   │  │
│  │  │  - Shield Protection                     │   │  │
│  │  │  - Health Check with User-Agent Header   │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │                      ↓                           │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  AWS RDS PostgreSQL (ap-south-1)         │   │  │
│  │  │  - SSL/TLS Encryption                    │   │  │
│  │  │  - Connection Pooling (min: 2, max: 10) │   │  │
│  │  │  - Automated Backups                     │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Resource Limits:                                       │
│  - Memory: 1GB limit, 512MB reservation                │
│  - CPU: 1.0 limit, 0.5 reservation                     │
│  - Restart: unless-stopped                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Configuration Files

### 1. `.env.production`

Production environment variables (DO NOT COMMIT TO VERSION CONTROL)

```bash
# Server Configuration
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# Frontend Configuration
FRONTEND_URL=https://your-frontend-domain.com

# Database Configuration (AWS RDS PostgreSQL)
DB_HOST=your-rds-endpoint.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=your_strong_password
DB_SSL=true
DB_POOL_MAX=10
DB_POOL_MIN=2

# Session Configuration
SESSION_SECRET=your_strong_random_string

# Arcjet Security
ARCJET_KEY=your_arcjet_production_key
ARCJET_ENV=production
```

### 2. `docker-compose.prod.yml`

Production Docker Compose configuration with:

- Single container (no database container)
- Health checks with User-Agent header
- Resource limits and reservations
- Logs volume mount
- Bridge network

### 3. `Dockerfile`

Multi-stage build with:

- Base stage: Production dependencies only
- Development stage: Full dependencies with dev tools
- Production stage: Optimized for production use

### 4. `scripts/prod.sh`

Automated production startup script that:

- Validates `.env.production` exists
- Checks Docker is running
- Creates logs directory
- Builds and starts the container
- Waits for health check
- Displays useful commands

## Deployment Steps

### 1. Prepare Environment

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your production values
# CRITICAL: Update these values:
# - DB_HOST: Your AWS RDS endpoint
# - DB_NAME: Your database name
# - DB_USER: Your database user
# - DB_PASSWORD: Your strong password
# - SESSION_SECRET: Generate with: openssl rand -base64 32
# - FRONTEND_URL: Your production frontend URL
# - ARCJET_KEY: Your Arcjet production API key
```

### 2. AWS RDS Prerequisites

Before starting the application:

1. **Create RDS Instance**
   - Engine: PostgreSQL 16
   - Instance class: db.t3.micro (or larger)
   - Storage: 20GB (or as needed)
   - Multi-AZ: Recommended for production
   - Backup retention: 7 days minimum

2. **Security Group Configuration**
   - Allow inbound traffic on port 5432
   - Source: Your application's security group or IP
   - Outbound: Allow all (or restrict as needed)

3. **Database Setup**
   - Create database: `CREATE DATABASE your_database_name;`
   - User already created during RDS setup
   - Tables auto-created by application on first run

### 3. Start Production Environment

```bash
# Using the provided script (recommended)
./scripts/prod.sh

# Or manually with Docker Compose
docker-compose -f docker-compose.prod.yml up --build -d
```

### 4. Verify Deployment

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Test health endpoint
curl -H "User-Agent: curl/7.0" http://localhost:8080/health

# Test API
curl -H "User-Agent: curl/7.0" http://localhost:8080/api
```

## Arcjet Security Configuration

### Bot Detection (LIVE Mode)

- **Allowed Bots**: Search engines, preview services
- **Blocked Bots**: All other detected bots
- **User-Agent Requirement**: Enforced (400 Bad Request if missing)
- **Error Handling**: Logged but fail-open (except missing User-Agent)

### Rate Limiting

- **Admin**: 20 requests/minute
- **User**: 10 requests/minute
- **Guest**: 5 requests/minute

### Shield Protection

- DDoS protection
- IP reputation filtering
- Malicious traffic detection

## Health Check Details

The health check is configured to:

- Run every 30 seconds
- Timeout after 10 seconds
- Retry 3 times before marking unhealthy
- Wait 40 seconds before first check
- Include User-Agent header: `Docker-HealthCheck/1.0`

This ensures Docker/Kubernetes can properly monitor the application while complying with Arcjet's bot detection requirements.

## Monitoring & Logging

### Log Locations

- Application logs: `./logs/` directory (mounted in container)
- Docker logs: `docker-compose -f docker-compose.prod.yml logs app`

### Key Metrics to Monitor

- Health check status
- Database connection pool usage
- Arcjet rule violations
- Rate limit hits
- Error rates

### Useful Commands

```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart application
docker-compose -f docker-compose.prod.yml restart app

# Stop application
docker-compose -f docker-compose.prod.yml down

# View resource usage
docker stats starter-template-app-prod

# Execute command in container
docker-compose -f docker-compose.prod.yml exec app npm run db:sync:alter
```

## Security Best Practices

### 1. Environment Variables

- ✅ Store `.env.production` securely (not in git)
- ✅ Use AWS Secrets Manager or similar for sensitive data
- ✅ Rotate passwords regularly
- ✅ Use strong SESSION_SECRET (minimum 32 characters)

### 2. Database Security

- ✅ Enable SSL/TLS for RDS connections (DB_SSL=true)
- ✅ Use strong database password
- ✅ Restrict security group to application only
- ✅ Enable automated backups
- ✅ Enable encryption at rest

### 3. Application Security

- ✅ Arcjet bot detection enabled (LIVE mode)
- ✅ Rate limiting enforced
- ✅ Shield protection active
- ✅ CORS configured for frontend domain
- ✅ Helmet security headers enabled

### 4. Container Security

- ✅ Non-root user (nodejs:nodejs)
- ✅ Read-only filesystem (where possible)
- ✅ Resource limits enforced
- ✅ Health checks enabled
- ✅ Restart policy: unless-stopped

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Common issues:
# 1. .env.production missing or invalid
# 2. Database connection failed
# 3. Port 8080 already in use
```

### Database Connection Failed

```bash
# Verify RDS security group allows inbound on 5432
# Verify DB_HOST, DB_USER, DB_PASSWORD are correct
# Check RDS is in "Available" state
# Test connection: psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>
```

### Health Check Failing

```bash
# Verify application is running
docker-compose -f docker-compose.prod.yml exec app curl -H "User-Agent: test" http://localhost:8080/health

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs app | grep -i error
```

### High Memory Usage

```bash
# Check current usage
docker stats starter-template-app-prod

# Increase memory limit in docker-compose.prod.yml
# Restart container: docker-compose -f docker-compose.prod.yml restart app
```

## Scaling Considerations

For production scaling:

1. **Horizontal Scaling**
   - Use Kubernetes or Docker Swarm
   - Load balance across multiple instances
   - Use managed database (RDS) for shared state

2. **Vertical Scaling**
   - Increase memory limit in docker-compose.prod.yml
   - Increase CPU allocation
   - Upgrade RDS instance class

3. **Database Optimization**
   - Increase connection pool size (DB_POOL_MAX)
   - Enable read replicas for read-heavy workloads
   - Add indexes for frequently queried columns

## References

- [AWS RDS PostgreSQL Documentation](https://docs.aws.amazon.com/rds/latest/userguide/USER_PostgreSQL.html)
- [Arcjet Bot Protection](https://docs.arcjet.com/bot-protection/concepts/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
