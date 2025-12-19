#!/bin/sh
# Simple deployment script
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
