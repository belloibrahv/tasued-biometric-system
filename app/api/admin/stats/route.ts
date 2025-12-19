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
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users
    const totalUsers = await db.user.count();

    // Get active users
    const activeUsers = await db.user.count({
      where: { isActive: true, isSuspended: false },
    });

    // Get total verifications
    const totalVerifications = await db.accessLog.count();

    // Get active services
    const activeServices = await db.service.count({
      where: { isActive: true },
    });

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await db.user.count({
      where: { createdAt: { gte: today } },
    });

    // Get verifications trend (compare this week to last week)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

    const thisWeekVerifications = await db.accessLog.count({
      where: { timestamp: { gte: weekStart } },
    });

    const lastWeekVerifications = await db.accessLog.count({
      where: { timestamp: { gte: lastWeekStart, lt: weekStart } },
    });

    const verificationsTrend = lastWeekVerifications > 0
      ? Math.round(((thisWeekVerifications - lastWeekVerifications) / lastWeekVerifications) * 100)
      : thisWeekVerifications > 0 ? 100 : 0;

    // Get chart data (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await db.accessLog.count({
        where: { timestamp: { gte: date, lt: nextDate } },
      });

      chartData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }

    // Get service usage data
    const services = await db.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

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
      },
      chartData,
      serviceData: serviceData.filter(s => s.value > 0),
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
