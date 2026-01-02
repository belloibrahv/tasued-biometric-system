#!/bin/bash

# Database Setup Script for BioVault
# This script sets up the database and runs all migrations

set -e

echo "🔧 BioVault Database Setup"
echo "=========================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with DATABASE_URL and DIRECT_URL"
    exit 1
fi

echo "✓ .env file found"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Generate Prisma Client
echo "🔨 Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

# Run migrations
echo "🚀 Running database migrations..."
npx prisma migrate deploy
echo "✓ Migrations completed"
echo ""

# Verify database connection
echo "🔍 Verifying database connection..."
npx prisma db execute --stdin <<< "SELECT 1 as health;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Database connection verified"
else
    echo "⚠️  Warning: Could not verify database connection"
fi
echo ""

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npx prisma db seed
    echo "✓ Database seeded"
else
    echo "⏭️  Skipping database seed"
fi
echo ""

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Register a new account to test"
echo ""
