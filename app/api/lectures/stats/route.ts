import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const userType = req.headers.get('x-user-type');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user's attendance stats
    const userAttendance = await db.lectureAttendance.findMany({
      where: {
        userId,
        checkInTime: { gte: thirtyDaysAgo },
      },
      include: {
        lectureSession: true,
      },
    });

    // Calculate attendance rate
    const totalLectures = await db.lectureSession.count({
      where: {
        startTime: { gte: thirtyDaysAgo },
        endTime: { lte: now },
      },
    });

    const attendedLectures = userAttendance.length;
    const attendanceRate = totalLectures > 0 ? ((attendedLectures / totalLectures) * 100).toFixed(2) : '0';

    // Get verification method breakdown
    const verificationMethods = {
      qrCode: userAttendance.filter(a => a.method === 'QR_CODE').length,
      facial: userAttendance.filter(a => a.method === 'FACIAL').length,
      manual: userAttendance.filter(a => a.method === 'MANUAL').length,
      fingerprint: userAttendance.filter(a => a.method === 'FINGERPRINT').length,
    };

    // Get attendance by department
    const departmentStats = await db.lectureAttendance.groupBy({
      by: ['lectureSessionId'],
      where: {
        userId,
        checkInTime: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    // Get recent attendance
    const recentAttendance = userAttendance
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        course: `${a.lectureSession.courseCode} - ${a.lectureSession.courseName}`,
        checkInTime: a.checkInTime,
        method: a.method,
        status: a.status,
      }));

    // Get attendance trends (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyAttendance: { [key: string]: number } = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyAttendance[dateStr] = 0;
    }

    userAttendance.forEach(a => {
      const dateStr = new Date(a.checkInTime).toISOString().split('T')[0];
      if (dateStr in dailyAttendance) {
        dailyAttendance[dateStr]++;
      }
    });

    return NextResponse.json({
      summary: {
        totalLectures,
        attendedLectures,
        attendanceRate: `${attendanceRate}%`,
        missedLectures: totalLectures - attendedLectures,
      },
      verificationMethods,
      recentAttendance,
      trends: {
        period: 'Last 7 days',
        data: Object.entries(dailyAttendance).map(([date, count]) => ({
          date,
          count,
        })),
      },
    });
  } catch (error: any) {
    console.error('Attendance stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance statistics' },
      { status: 500 }
    );
  }
}
