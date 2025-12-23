import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const userType = user.user_metadata?.type;
    const role = user.user_metadata?.role;
    if (userType !== 'admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'verifications';

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to + 'T23:59:59') : new Date();

    // Total verifications
    const totalVerifications = await db.accessLog.count({
      where: { timestamp: { gte: fromDate, lte: toDate } },
    });

    // Successful verifications
    const successfulVerifications = await db.accessLog.count({
      where: { timestamp: { gte: fromDate, lte: toDate }, status: 'SUCCESS' },
    });

    const successRate = totalVerifications > 0
      ? Math.round((successfulVerifications / totalVerifications) * 100)
      : 100;

    // Total attendance
    const totalAttendance = await db.lectureAttendance.count({
      where: { checkInTime: { gte: fromDate, lte: toDate } },
    });

    // Active users (users with activity in period)
    const activeUsers = await db.accessLog.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: fromDate, lte: toDate } },
    });

    // Verifications by day
    const verificationsByDay = await db.accessLog.groupBy({
      by: ['timestamp'],
      where: { timestamp: { gte: fromDate, lte: toDate } },
      _count: { id: true },
    });

    // Process daily data
    const dailyMap = new Map<string, { count: number; success: number }>();
    const allLogs = await db.accessLog.findMany({
      where: { timestamp: { gte: fromDate, lte: toDate } },
      select: { timestamp: true, status: true },
    });

    allLogs.forEach(log => {
      const dateKey = log.timestamp.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || { count: 0, success: 0 };
      existing.count++;
      if (log.status === 'SUCCESS') existing.success++;
      dailyMap.set(dateKey, existing);
    });

    const verificationsByDayFormatted = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Verifications by service
    const serviceStats = await db.accessLog.groupBy({
      by: ['serviceId'],
      where: { timestamp: { gte: fromDate, lte: toDate }, serviceId: { not: null } },
      _count: { id: true },
    });

    const services = await db.service.findMany({
      where: { id: { in: serviceStats.map(s => s.serviceId!).filter(Boolean) } },
      select: { id: true, name: true },
    });

    const serviceMap = new Map(services.map(s => [s.id, s.name]));
    const verificationsByService = serviceStats
      .filter(s => s.serviceId)
      .map(s => ({
        service: serviceMap.get(s.serviceId!) || 'Unknown',
        count: s._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    // Verifications by method
    const methodStats = await db.accessLog.groupBy({
      by: ['method'],
      where: { timestamp: { gte: fromDate, lte: toDate }, method: { not: null } },
      _count: { id: true },
    });

    const verificationsByMethod = methodStats
      .filter(m => m.method)
      .map(m => ({
        method: m.method!.replace('_', ' '),
        count: m._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    // Top users
    const userStats = await db.accessLog.groupBy({
      by: ['userId'],
      where: { timestamp: { gte: fromDate, lte: toDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const topUserIds = userStats.map(u => u.userId);
    const topUsersData = await db.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, firstName: true, lastName: true, matricNumber: true },
    });

    const userMap = new Map(topUsersData.map(u => [u.id, u]));
    const topUsers = userStats.map(u => {
      const userData = userMap.get(u.userId);
      return {
        name: userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown',
        matricNumber: userData?.matricNumber || 'N/A',
        count: u._count.id,
      };
    });

    return NextResponse.json({
      totalVerifications,
      successRate,
      totalAttendance,
      activeUsers: activeUsers.length,
      verificationsByDay: verificationsByDayFormatted,
      verificationsByService,
      verificationsByMethod,
      topUsers,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
