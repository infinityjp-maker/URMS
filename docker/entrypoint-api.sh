#!/bin/sh
set -e

cd /app
echo "Running database migrations..."
pnpm --filter @urms/db db:migrate
echo "Starting API..."
exec "$@"
