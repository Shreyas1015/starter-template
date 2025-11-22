# Docker Quick Reference

## Development

```bash
# Setup
cp .env.development.example .env.development
# Edit .env.development with your values

# Start
docker-compose -f docker-compose.dev.yml up --build

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Access:**

- API: <http://localhost:8080>
- Database: localhost:5432

## Production

```bash
# Setup
cp .env.production.example .env.production
# Edit .env.production with your AWS RDS credentials

# Generate session secret
openssl rand -base64 32

# Start
docker-compose -f docker-compose.prod.yml up --build -d

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:sync:alter

# Access PostgreSQL (dev only)
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d starter_template_dev

# Restart app
docker-compose -f docker-compose.dev.yml restart app

# Remove volumes (WARNING: Deletes data)
docker-compose -f docker-compose.dev.yml down -v
```

## Environment Files

- `.env.development.example` → Copy to `.env.development`
- `.env.production.example` → Copy to `.env.production`
- `.env` → Local development (non-Docker)

## Troubleshooting

**Port in use:**

```bash
# Change PORT in .env file
PORT=8081
```

**Database connection failed:**

```bash
# Check containers
docker-compose -f docker-compose.dev.yml ps

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres
```

**Hot reload not working:**

- Restart Docker Desktop
- Check file sharing settings (Windows/Mac)

## Full Documentation

See [DOCKER_SETUP.md](./DOCKER_SETUP.md) for complete documentation.
