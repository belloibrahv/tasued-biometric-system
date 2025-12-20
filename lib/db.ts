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
const db = global.prisma || new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}

/**
 * Ensures the database is reachable and handles initial connection errors.
 * Useful for serverless environments and cold starts.
 */
export async function connectDb() {
  try {
    await db.$connect();
    return db;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    // In production, we might want to throw or handle this specifically
    throw error;
  }
}

export default db;