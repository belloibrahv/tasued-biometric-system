#!/bin/sh
# Generate Prisma client with fallback DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
  echo "Using temporary DATABASE_URL for Prisma generation"
  npx prisma generate
  unset DATABASE_URL
else
  echo "Using provided DATABASE_URL for Prisma generation"
  npx prisma generate
fi

# Run Prisma migrations
npx prisma migrate deploy

# Seed database with initial data
npx prisma db seed
