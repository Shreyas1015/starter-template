# Docker Setup Guide

This guide explains how to run the application using Docker for both development and production environments.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git (optional, for version control)

## Architecture

### Development Setup

```
┌─────────────────────┐         ┌──────────────────────┐
│   PostgreSQL        │◄────────│   Node.js App        │
│   (Docker)          │         │   (Docker)           │
│   Port: 5432        │         │   Port: 8080         │
└─────────────────────┘         └──────────────────────┘
```

### Production Setup

```
┌─────────────────────┐         ┌──────────────────────┐
│   AWS RDS           │◄────────│   Node.js App        │
│   PostgreSQL        │         │   (Docker)           │
│   (External)        │         │   Port: 8080         │
└─────────────────────┘         └──────────────────────┘
```

## Quick Start

### Development

1. **Create development environment file**

   ```bash
   cp .env.development.example .env.development
   ```

2. **Update `.env.development` with your values**

   ```env
   ARCJET_KEY=your_arcjet_key_here
   SESSION_SECRET=your-dev-session-secret
   ```

3. **Start development environment**

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application**
   - API: <http://localhost:8080>
   - Health Check: <http://localhost:8080/health>
   - PostgreSQL: localhost:5432

5. **Stop the environment**

   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

### Production

1. **Create production environment file**

   ```bash
   cp .env.production.example .env.production
   ```

2. **Update `.env.production` with your AWS RDS credentials**

   ```env
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_secure_password
   SESSION_SECRET=your-production-session-secret
   ARCJET_KEY=your_production_arcjet_key
   FRONTEND_URL=https://your-frontend-domain.com
   ```

3. **Generate a strong session secret**

   ```bash
   openssl rand -base64 32
   ```

4. **Start production environment**

   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

5. **Check logs**

   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

6. **Stop the environment**

   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Application port | `8080` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `DB_HOST` | Database host | `postgres` (dev) or RDS endpoint (prod) |
| `DB_NAME` | Database name | `starter_template_dev` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `SESSION_SECRET` | Session encryption key | Generated random string |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PORT` | Database port | `5432` |
| `DB_SSL` | Enable SSL for database | `false` (dev), `true` (prod) |
| `DB_POOL_MAX` | Max database connections | `5` (dev), `10` (prod) |
| `DB_POOL_MIN` | Min database connections | `0` (dev), `2` (prod) |
| `LOG_LEVEL` | Logging level | `debug` (dev), `info` (prod) |
| `ARCJET_KEY` | Arcjet security key | - |
| `ARCJET_ENV` | Arcjet environment | `development` or `production` |

## Docker Commands

### Development

```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build

# Start in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (WARNING: Deletes database data)
docker-compose -f docker-compose.dev.yml down -v

# Restart app only
docker-compose -f docker-compose.dev.yml restart app

# Execute commands in app container
docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter

# Access PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev
```

### Production

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up --build -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# Execute commands in app container
docker-compose -f docker-compose.prod.yml exec app npm run db:sync
```

## Database Management

### Development Database

The development setup includes a PostgreSQL container with persistent storage.

**Access PostgreSQL CLI:**

```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev
```

**Run migrations:**

```bash
docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter
```

**Reset database (WARNING: Deletes all data):**

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build
```

### Production Database (AWS RDS)

Production uses AWS RDS PostgreSQL. Ensure your RDS instance is:

- ✅ Accessible from your Docker host
- ✅ Security group allows inbound traffic on port 5432
- ✅ SSL enabled
- ✅ Proper backup strategy configured

## Troubleshooting

### Issue: Port already in use

**Solution:**

```bash
# Check what's using the port
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux

# Change port in .env file
PORT=8081
```

### Issue: Database connection failed

**Solution:**

1. Check if PostgreSQL container is running:

   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

2. Check PostgreSQL logs:

   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

3. Verify database credentials in `.env.development`

### Issue: Session store connection failed

**Solution:**

1. Ensure PostgreSQL is running and accessible
2. Check `SESSION_SECRET` is set in environment file
3. Verify database user has proper permissions

### Issue: Hot reload not working in development

**Solution:**

1. Ensure volumes are properly mounted in `docker-compose.dev.yml`
2. On Windows, check Docker Desktop file sharing settings
3. Restart Docker Desktop

### Issue: Container keeps restarting

**Solution:**

1. Check application logs:

   ```bash
   docker-compose -f docker-compose.dev.yml logs app
   ```

2. Verify all required environment variables are set
3. Check database connection

## Performance Optimization

### Development

- **Volume mounting:** Source code is mounted for hot reload
- **No build optimization:** Faster startup, larger image
- **Debug logging:** Verbose logs for development

### Production

- **Multi-stage build:** Smaller image size (~150MB)
- **Production dependencies only:** Faster startup
- **Resource limits:** Prevents resource exhaustion
- **Health checks:** Automatic container restart on failure
- **Non-root user:** Enhanced security

## Security Best Practices

### Development

- ✅ Use weak credentials (they're local only)
- ✅ Enable debug logging
- ✅ Disable SSL for local database

### Production

- ✅ Use strong, randomly generated `SESSION_SECRET`
- ✅ Enable SSL for database connections
- ✅ Use AWS RDS with proper security groups
- ✅ Set `NODE_ENV=production`
- ✅ Use HTTPS for `FRONTEND_URL`
- ✅ Rotate secrets regularly
- ✅ Enable Arcjet security features
- ✅ Monitor logs for suspicious activity

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t starter-template:latest --target production .
      
      - name: Push to registry
        run: |
          docker tag starter-template:latest your-registry/starter-template:latest
          docker push your-registry/starter-template:latest
      
      - name: Deploy to server
        run: |
          ssh user@your-server "cd /app && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
```

## Monitoring

### Health Checks

The application includes built-in health checks:

```bash
# Check application health
curl http://localhost:8080/health

# Response:
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Container Health

```bash
# Check container health status
docker-compose -f docker-compose.prod.yml ps

# View health check logs
docker inspect starter-template-app-prod | grep -A 10 Health
```

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs

# View app logs only
docker-compose -f docker-compose.prod.yml logs app

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f

# View last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

## Backup and Recovery

### Development Database Backup

```bash
# Backup
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres starter_template_dev > backup.sql

# Restore
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres starter_template_dev < backup.sql
```

### Production Database Backup

Use AWS RDS automated backups and snapshots:

- Enable automated backups (retention period: 7-35 days)
- Create manual snapshots before major changes
- Test restore procedures regularly

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
services:
  app:
    deploy:
      replicas: 3  # Run 3 instances
```

### Load Balancing

Use a reverse proxy (Nginx, Traefik) or AWS ALB to distribute traffic across multiple containers.

## Next Steps

1. ✅ Set up environment files
2. ✅ Test development environment
3. ✅ Configure AWS RDS for production
4. ✅ Set up CI/CD pipeline
5. ✅ Configure monitoring and alerts
6. ✅ Implement backup strategy
7. ✅ Document deployment procedures

## Support

For issues or questions:

- Check application logs
- Review Docker Compose configuration
- Verify environment variables
- Check database connectivity
- Review security group settings (production)
