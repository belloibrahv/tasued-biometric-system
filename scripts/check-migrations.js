#!/usr/bin/env node

/**
 * Check Migration Status
 * Verifies if all migrations have been applied
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✓ ',
    error: '❌ ',
    warning: '⚠️ ',
    pending: '⏳ ',
    done: '✅ '
  };
  console.log(`${icons[type] || ''} ${message}`);
}

async function main() {
  console.log('\n');
  log('Checking Migration Status', 'info');
  console.log('==========================\n');

  try {
    // Check if .env exists
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      log('Error: .env file not found', 'error');
      process.exit(1);
    }

    // Get migration status
    const output = execSync('npx prisma migrate status', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log(output);

    // Check if schema is up to date
    if (output.includes('Database schema is up to date')) {
      log('All migrations applied successfully!', 'success');
      console.log('\nYou can now:');
      console.log('1. Start the dev server: npm run dev');
      console.log('2. Open Prisma Studio: npm run db:studio');
      console.log('3. Register a new user\n');
      process.exit(0);
    } else if (output.includes('Migrations to apply')) {
      log('Pending migrations found!', 'warning');
      console.log('\nRun: npm run db:migrate:deploy\n');
      process.exit(1);
    } else {
      log('Unknown migration status', 'warning');
      console.log(output);
      process.exit(1);
    }
  } catch (error) {
    log(`Error checking migrations: ${error.message}`, 'error');
    console.log('\nTroubleshooting:');
    console.log('1. Verify DATABASE_URL in .env');
    console.log('2. Check database connection');
    console.log('3. Run: npm run db:setup\n');
    process.exit(1);
  }
}

main();
