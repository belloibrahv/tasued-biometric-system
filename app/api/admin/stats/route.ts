import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    let isAuthorized = false;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && (payload.type === 'admin' || payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN' || payload.role === 'OPERATOR')) {
        isAuthorized = true;
      }
    }

    // Fallback to Supabase session check
    if (!isAuthorized) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userType = user.user_metadata?.type;
        const userRole = user.user_metadata?.role;
        if (userType === 'admin' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'OPERATOR') {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get date ranges for trends
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    // Execute independent counts in parallel using correct model names
    const [
      totalUsers,
      activeUsers,
      totalVerifications,
      activeServices,
      newUsersToday,
      thisWeekVerifications,
      lastWeekVerifications,
      totalEnrollment,
      totalLogs,
      successfulLogs,
      services
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.accessLog.count(),
      db.service.count({ where: { isActive: true } }),
      db.user.count({ where: { createdAt: { gte: today } } }),
      db.accessLog.count({ where: { timestamp: { gte: weekStart } } }),
      db.accessLog.count({ where: { timestamp: { gte: lastWeekStart, lt: weekStart } } }),
      db.biometricData.count(),
      db.accessLog.count(),
      db.accessLog.count({ where: { status: 'SUCCESS' } }),
      db.service.findMany({ where: { isActive: true }, select: { id: true, name: true } })
    ]);

    const verificationsTrend = lastWeekVerifications > 0
      ? Math.round(((thisWeekVerifications - lastWeekVerifications) / lastWeekVerifications) * 100)
      : thisWeekVerifications > 0 ? 100 : 0;

    const successRate = totalLogs > 0
      ? Math.round((successfulLogs / totalLogs) * 100)
      : 0;

    // Get chart data in parallel
    const chartPromises = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      chartPromises.push(
        db.accessLog.count({
          where: { timestamp: { gte: date, lt: nextDate } }
        }).then(count => ({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          count
        }))
      );
    }
    const chartData = await Promise.all(chartPromises);

    // Get service usage in parallel
    const serviceData = await Promise.all(
      services.map(async (service) => {
        const count = await db.accessLog.count({
          where: { serviceId: service.id },
        });
        return { name: service.name, value: count };
      })
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalVerifications,
        activeServices,
        newUsersToday,
        verificationsTrend,
        totalEnrollment,
        successRate,
      },
      chartData,
      serviceData: serviceData.filter(s => s.value > 0),
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
