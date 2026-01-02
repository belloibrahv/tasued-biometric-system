import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
  datasourceUrl: process.env.DATABASE_URL,
};

// Singleton pattern for Prisma Client
let db: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient(prismaOptions);
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient(prismaOptions);
  }
  db = global.prisma;
}

/**
 * Ensures the database is reachable and handles initial connection errors.
 * Useful for serverless environments and cold starts.
 * Includes retry logic and timeout handling.
 */
export async function connectDb(retries = 3, delay = 1000) {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      await db.$connect();
      console.log('Database connected successfully');
      return db;
    } catch (error: any) {
      lastError = error;
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, error.message);
      
      if (i < retries - 1) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  console.error('Failed to connect to database after retries:', lastError);
  throw lastError;
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDb() {
  try {
    await db.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

export default db;