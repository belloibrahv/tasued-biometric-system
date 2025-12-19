#!/bin/sh
# Simple deployment script

# Only run database operations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL is set. Running database operations..."
  npx prisma generate
  npx prisma migrate deploy
  npx prisma db seed
else
  echo "DATABASE_URL is not set. Skipping database operations."
  npx prisma generate
fi
