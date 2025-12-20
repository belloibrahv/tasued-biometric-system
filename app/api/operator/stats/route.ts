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
    if (!payload || (payload.type !== 'admin' && payload.type !== 'operator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's verifications
    const todayVerifications = await db.accessLog.count({
      where: {
        timestamp: { gte: today, lt: tomorrow },
      },
    });

    // Successful verifications today
    const successfulToday = await db.accessLog.count({
      where: {
        timestamp: { gte: today, lt: tomorrow },
        status: 'SUCCESS',
      },
    });

    // Failed attempts today
    const failedToday = await db.accessLog.count({
      where: {
        timestamp: { gte: today, lt: tomorrow },
        status: 'FAILED',
      },
    });

    // Pending verifications (if any)
    const pendingVerifications = await db.accessLog.count({
      where: {
        timestamp: { gte: today, lt: tomorrow },
        status: 'PENDING',
      },
    });

    // Calculate success rate
    const successRate = todayVerifications > 0
      ? Math.round((successfulToday / todayVerifications) * 100)
      : 100;

    // Get recent verifications
    const recentLogs = await db.accessLog.findMany({
      where: {
        timestamp: { gte: today },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            matricNumber: true,
          },
        },
        service: {
          select: { name: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    const recentVerifications = recentLogs.map(log => ({
      studentName: `${log.user.firstName} ${log.user.lastName}`,
      matricNumber: log.user.matricNumber,
      service: log.service.name,
      status: log.status,
      method: log.verificationMethod,
      time: formatTimeAgo(log.timestamp),
    }));

    return NextResponse.json({
      stats: {
        todayVerifications,
        successRate,
        pendingVerifications,
        failedAttempts: failedToday,
      },
      recentVerifications,
    });

  } catch (error) {
    console.error('Operator stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
