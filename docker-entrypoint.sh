#!/bin/sh
set -e

echo "Starting Job Board API..."

# Wait for database to be ready
echo "Waiting for database..."
until node -e "
const mysql = require('mysql2/promise');
const url = process.env.DATABASE_URL;
(async () => {
  try {
    const connection = await mysql.createConnection(url);
    await connection.ping();
    await connection.end();
    console.log('Database is ready!');
  } catch (err) {
    console.log('Database not ready:', err.message);
    process.exit(1);
  }
})();
" 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - continuing..."

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
