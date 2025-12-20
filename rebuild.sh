#!/bin/bash
# Rebuild script for TASUED BioVault

echo "🔄 Cleaning build cache..."
rm -rf .next

echo "🔨 Generating Prisma Client..."
npx prisma generate

echo "🏗️ Building application..."
npm run build

echo "✅ Rebuild complete!"
