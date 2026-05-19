#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:migrate

echo "Starting server..."
exec node .output/server/index.mjs
