import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/operator
    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isOperator = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR';

    if (!isOperator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Calculate success rate
    const successRate = todayVerifications > 0
      ? Math.round((successfulToday / todayVerifications) * 100)
      : 100;

    // Today's attendance check-ins
    const todayAttendance = await db.lectureAttendance.count({
      where: {
        checkInTime: { gte: today, lt: tomorrow },
      },
    });

    // Active lecture sessions (currently running)
    const now = new Date();
    const activeSessions = await db.lectureSession.count({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        isActive: true,
      },
    });

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
      user: {
        firstName: log.user.firstName,
        lastName: log.user.lastName,
        matricNumber: log.user.matricNumber,
      },
      status: log.status,
      timestamp: log.timestamp,
    }));

    return NextResponse.json({
      stats: {
        todayVerifications,
        successRate,
        pendingVerifications: 0,
        todayAttendance,
        activeSessions,
      },
      recentVerifications,
    });

  } catch (error) {
    console.error('Operator stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
