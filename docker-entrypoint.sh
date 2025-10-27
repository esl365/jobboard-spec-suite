#!/bin/sh
set -e

echo "Starting Job Board API..."

# Simple wait for database (rely on docker-compose healthcheck)
echo "Waiting for database to be ready..."
sleep 10
echo "Database should be ready - continuing..."

# Run Prisma migrations (if needed)
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy || echo "Migrations failed or not needed"
fi

# Generate Prisma Client (ensure it's available)
echo "Generating Prisma Client..."
npx prisma generate || echo "Prisma generate skipped"

# Start the application
echo "Starting NestJS application..."
exec node dist/main
