import { NextResponse } from 'next/server';
import db, { connectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to connect to database
    await connectDb();

    // Try a simple query
    const result = await db.$queryRaw`SELECT 1 as health`;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      query: 'SELECT 1 as health',
      result: result
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 503 });
  }
}
