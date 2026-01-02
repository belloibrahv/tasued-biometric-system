#!/usr/bin/env node

/**
 * Database Setup Script for BioVault
 * Runs all necessary database setup steps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️ ',
    success: '✓ ',
    error: '❌ ',
    warning: '⚠️ ',
    step: '🔧 ',
    rocket: '🚀 ',
    check: '🔍 ',
    seed: '🌱 ',
    done: '✅ '
  };
  console.log(`${icons[type] || ''} ${message}`);
}

function exec(command, description) {
  try {
    log(description, 'step');
    execSync(command, { stdio: 'inherit' });
    log(`${description} completed`, 'success');
    return true;
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error');
    return false;
  }
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n');
  log('BioVault Database Setup', 'step');
  console.log('==========================\n');

  // Check .env file
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log('Error: .env file not found', 'error');
    log('Please create .env file with DATABASE_URL and DIRECT_URL', 'info');
    process.exit(1);
  }
  log('.env file found', 'success');
  console.log('');

  // Check node_modules
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('Installing dependencies...', 'step');
    if (!exec('npm install', 'Installing dependencies')) {
      process.exit(1);
    }
    console.log('');
  } else {
    log('Dependencies already installed', 'success');
    console.log('');
  }

  // Generate Prisma Client
  if (!exec('npx prisma generate', 'Generating Prisma Client')) {
    process.exit(1);
  }
  console.log('');

  // Run migrations
  if (!exec('npx prisma migrate deploy', 'Running database migrations')) {
    log('Migration failed. Please check your database connection.', 'error');
    process.exit(1);
  }
  console.log('');

  // Verify database connection
  log('Verifying database connection...', 'check');
  try {
    execSync('npx prisma db execute --stdin <<< "SELECT 1 as health;"', {
      stdio: 'pipe'
    });
    log('Database connection verified', 'success');
  } catch (error) {
    log('Warning: Could not verify database connection', 'warning');
  }
  console.log('');

  // Ask about seeding
  const seedAnswer = await question('Do you want to seed the database with sample data? (y/n) ');
  if (seedAnswer.toLowerCase() === 'y') {
    console.log('');
    if (exec('npx prisma db seed', 'Seeding database')) {
      console.log('');
    }
  } else {
    log('Skipping database seed', 'info');
    console.log('');
  }

  // Success message
  log('Database setup complete!', 'done');
  console.log('\nNext steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open http://localhost:3000 in your browser');
  console.log('3. Register a new account to test\n');

  rl.close();
}

main().catch(error => {
  log(`Setup failed: ${error.message}`, 'error');
  process.exit(1);
});
