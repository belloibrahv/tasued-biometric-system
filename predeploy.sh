#!/bin/sh
# Generate Prisma client with fallback DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
  echo "Using temporary DATABASE_URL for Prisma generation"
  npx prisma generate
  # Run migrations and seeding with temporary DATABASE_URL
  npx prisma migrate deploy
  DATABASE_URL="$DATABASE_URL" npx prisma db seed
  unset DATABASE_URL
else
  echo "Using provided DATABASE_URL for Prisma generation"
  npx prisma generate
  # Run migrations and seeding with provided DATABASE_URL
  npx prisma migrate deploy
  npx prisma db seed
fi
