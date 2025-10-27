# Job Board API - Deployment Guide

This guide covers deploying the Job Board API using Docker in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Migrations](#database-migrations)
- [Health Checks & Monitoring](#health-checks--monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- (Optional) Node.js 20+ for local development
- MySQL 8.0+ (or use Docker Compose)
- Redis 7+ (or use Docker Compose)

## Quick Start with Docker Compose

### 1. Clone and Setup

```bash
git clone https://github.com/esl365/jobboard-spec-suite.git
cd jobboard-spec-suite
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your configuration
nano .env
```

**Required Environment Variables:**
```env
JWT_SECRET=your_super_secret_jwt_key_change_in_production
TOSS_SECRET_KEY=your_toss_payments_secret_key
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check service status
docker-compose ps
```

### 4. Initialize Database

The database schema is automatically initialized from `db/schema.sql` on first run.

Optional: Run seed data for development
```bash
npm run prisma:seed
```

### 5. Access API

- API: http://localhost:3000
- Health Check: http://localhost:3000/health
- API Docs: http://localhost:3000/api

## Production Deployment

### Option 1: Docker Compose (Recommended for Small-Medium Scale)

```bash
# Set production environment
export NODE_ENV=production

# Build production images
docker-compose build

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec api npx prisma migrate deploy
```

### Option 2: Standalone Docker Container

```bash
# Build production image
docker build -t jobboard-api:latest .

# Run container
docker run -d \
  --name jobboard-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e REDIS_HOST=redis-host \
  -e REDIS_PORT=6379 \
  -e JWT_SECRET="your-secret" \
  -e TOSS_SECRET_KEY="your-toss-key" \
  jobboard-api:latest
```

### Option 3: Kubernetes Deployment

For Kubernetes deployment, refer to the `k8s/` directory (Week 9-12 infrastructure setup).

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | API port | `3000` |
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host:3306/db` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | `your_redis_password` |
| `JWT_SECRET` | JWT signing secret | `random_secure_string` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |
| `TOSS_SECRET_KEY` | Toss Payments secret | `test_sk_...` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://yourfrontend.com` |

### Security Considerations

**CRITICAL:** Before deploying to production:

1. **Change JWT_SECRET**: Generate a strong random string
   ```bash
   openssl rand -base64 32
   ```

2. **Change Database Passwords**: Use strong, unique passwords

3. **Enable Redis Authentication**: Set a strong `REDIS_PASSWORD`

4. **Use HTTPS**: Deploy behind a reverse proxy (nginx, Caddy, Traefik)

5. **Firewall Rules**: Only expose necessary ports (443, 80)

## Database Migrations

### Applying Migrations

```bash
# Using Docker Compose
docker-compose exec api npx prisma migrate deploy

# Using standalone container
docker exec jobboard-api npx prisma migrate deploy
```

### Creating New Migrations

```bash
# During development
npx prisma migrate dev --name migration_name

# Generate Prisma Client after schema changes
npx prisma generate
```

### Database Backup

```bash
# Backup MySQL database
docker-compose exec mysql mysqldump -u root -p jobboard_db > backup.sql

# Restore from backup
docker-compose exec -T mysql mysql -u root -p jobboard_db < backup.sql
```

## Health Checks & Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

### Service Status

```bash
# Check all services
docker-compose ps

# View API logs
docker-compose logs -f api

# View database logs
docker-compose logs -f mysql

# View Redis logs
docker-compose logs -f redis
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats jobboard-api
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptom:** API fails to start with database connection error

**Solution:**
```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Verify connection string
echo $DATABASE_URL

# Test connection manually
docker-compose exec mysql mysql -u jobboard_user -p jobboard_db
```

#### 2. Redis Connection Failed

**Symptom:** Session management not working

**Solution:**
```bash
# Check Redis status
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### 3. Port Already in Use

**Symptom:** "port is already allocated"

**Solution:**
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
echo "API_PORT=3001" >> .env
```

#### 4. Prisma Client Not Generated

**Symptom:** "Cannot find module '@prisma/client'"

**Solution:**
```bash
# Rebuild the container
docker-compose build api

# Or generate manually
docker-compose exec api npx prisma generate
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# Since specific time
docker-compose logs --since=1h api
```

### Debugging

```bash
# Access API container shell
docker-compose exec api sh

# Run commands inside container
docker-compose exec api node -v
docker-compose exec api npm test

# Inspect container
docker inspect jobboard-api
```

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop but keep containers
docker-compose stop

# Restart services
docker-compose restart
```

## Performance Tuning

### Database Optimization

Edit `docker-compose.yml` to add MySQL configuration:

```yaml
mysql:
  command:
    - --max_connections=200
    - --innodb_buffer_pool_size=1G
    - --query_cache_size=64M
```

### Redis Optimization

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Application Scaling

Run multiple API instances:

```bash
docker-compose up -d --scale api=3
```

**Note:** Requires a load balancer (nginx, HAProxy) for production use.

## Security Hardening

1. **Run as non-root**: Already configured in Dockerfile
2. **Use Docker secrets**: For sensitive data in Swarm/Kubernetes
3. **Network isolation**: Use Docker networks (already configured)
4. **Regular updates**: Keep base images updated
5. **Scan for vulnerabilities**:
   ```bash
   docker scan jobboard-api:latest
   ```

## Next Steps

- Set up CI/CD pipeline (Week 8)
- Configure monitoring and alerts
- Set up automated backups
- Implement log aggregation
- Configure CDN for static assets

## Support

For issues and questions:
- GitHub Issues: https://github.com/esl365/jobboard-spec-suite/issues
- Documentation: See README.md

---

**Generated with Claude Code**
