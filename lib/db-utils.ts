import db, { connectDb } from './db';

/**
 * Wrapper for database operations with automatic retry and fallback
 * Handles connection failures gracefully
 */
export async function withDbConnection<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    timeout?: number;
    fallback?: T;
  } = {}
): Promise<T> {
  const { retries = 2, timeout = 5000, fallback } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Set a timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database operation timeout')), timeout)
      );

      const result = await Promise.race([operation(), timeoutPromise]);
      return result;
    } catch (error: any) {
      console.error(`Database operation attempt ${attempt + 1}/${retries + 1} failed:`, error.message);

      if (attempt < retries) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      } else if (fallback !== undefined) {
        console.warn('Database operation failed, using fallback value');
        return fallback;
      } else {
        throw error;
      }
    }
  }

  throw new Error('Database operation failed after all retries');
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await connectDb();
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database availability check failed:', error);
    return false;
  }
}

/**
 * Get database connection status
 */
export async function getDatabaseStatus(): Promise<{
  available: boolean;
  connected: boolean;
  error?: string;
}> {
  try {
    await connectDb();
    const result = await db.$queryRaw`SELECT 1 as health`;
    return {
      available: true,
      connected: true,
    };
  } catch (error: any) {
    return {
      available: false,
      connected: false,
      error: error.message,
    };
  }
}

/**
 * Retry a database query with exponential backoff
 */
export async function retryDbQuery<T>(
  query: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 100
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await query();
    } catch (error: any) {
      lastError = error;
      console.error(`Query attempt ${attempt + 1}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
