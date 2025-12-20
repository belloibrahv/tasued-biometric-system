import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.id;

    // Get total verifications
    const totalVerifications = await db.accessLog.count({
      where: { userId },
    });

    // Get successful verifications
    const successfulVerifications = await db.accessLog.count({
      where: { userId, status: 'SUCCESS' },
    });

    // Get failed verifications
    const failedVerifications = await db.accessLog.count({
      where: { userId, status: 'FAILED' },
    });

    // Get connected services
    const connectedServices = await db.serviceConnection.count({
      where: { userId, isActive: true },
    });

    // Get this week's verifications
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const thisWeekVerifications = await db.accessLog.count({
      where: {
        userId,
        timestamp: { gte: weekStart },
      },
    });

    // Get last week's verifications for comparison
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);
    const lastWeekVerifications = await db.accessLog.count({
      where: {
        userId,
        timestamp: { gte: lastWeekStart, lt: weekStart },
      },
    });

    // Calculate percentage change
    const weeklyChange = lastWeekVerifications > 0
      ? Math.round(((thisWeekVerifications - lastWeekVerifications) / lastWeekVerifications) * 100)
      : thisWeekVerifications > 0 ? 100 : 0;

    // Get daily access data for chart (last 7 days)
    const dailyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await db.accessLog.count({
        where: {
          userId,
          timestamp: { gte: date, lt: nextDate },
        },
      });

      dailyData.push({
        day: days[date.getDay()],
        count,
        date: date.toISOString().split('T')[0],
      });
    }

    return NextResponse.json({
      stats: {
        totalVerifications,
        successfulVerifications,
        failedVerifications,
        connectedServices,
        thisWeekVerifications,
        weeklyChange,
      },
      chartData: dailyData,
    });

  } catch (error: any) {
    console.error('Dashboard Stats Route Error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
