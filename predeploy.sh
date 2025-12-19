#!/bin/sh
# Run Prisma migrations
npx prisma migrate deploy
# Seed database with initial data
npx prisma db seed
