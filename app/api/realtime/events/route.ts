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

    const userType = user.user_metadata?.type;
    const role = user.user_metadata?.role;
    const isOperator = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR';

    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get recent events based on user role
    const since = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes

    const events: any[] = [];

    if (isOperator) {
      // Get recent verifications
      const recentVerifications = await db.accessLog.findMany({
        where: {
          timestamp: { gte: since },
          ...(after ? { id: { gt: after } } : {}),
        },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true } },
          service: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      recentVerifications.forEach(log => {
        events.push({
          id: log.id,
          type: 'verification',
          data: {
            student: `${log.user.firstName} ${log.user.lastName}`,
            matricNumber: log.user.matricNumber,
            service: log.service?.name || 'General',
            method: log.method,
            status: log.status,
            action: log.action,
          },
          timestamp: log.timestamp.toISOString(),
        });
      });

      // Get recent attendance
      const recentAttendance = await db.lectureAttendance.findMany({
        where: {
          checkInTime: { gte: since },
        },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true } },
          lectureSession: { select: { courseCode: true, courseName: true } },
        },
        orderBy: { checkInTime: 'desc' },
        take: limit,
      });

      recentAttendance.forEach(att => {
        events.push({
          id: att.id,
          type: 'attendance',
          data: {
            student: `${att.user.firstName} ${att.user.lastName}`,
            matricNumber: att.user.matricNumber,
            course: `${att.lectureSession.courseCode} - ${att.lectureSession.courseName}`,
            method: att.method,
          },
          timestamp: att.checkInTime.toISOString(),
        });
      });

      // Get recent service access
      const recentServiceAccess = await db.serviceAccess.findMany({
        where: {
          entryTime: { gte: since },
        },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true } },
          service: { select: { name: true } },
        },
        orderBy: { entryTime: 'desc' },
        take: limit,
      });

      recentServiceAccess.forEach(access => {
        events.push({
          id: access.id,
          type: 'service_access',
          data: {
            student: `${access.user.firstName} ${access.user.lastName}`,
            matricNumber: access.user.matricNumber,
            service: access.service.name,
            action: access.exitTime ? 'exit' : 'entry',
          },
          timestamp: access.entryTime.toISOString(),
        });
      });
    } else {
      // For students, get their own recent activity
      const myActivity = await db.accessLog.findMany({
        where: {
          userId: user.id,
          timestamp: { gte: since },
        },
        include: {
          service: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      myActivity.forEach(log => {
        events.push({
          id: log.id,
          type: 'verification',
          data: {
            service: log.service?.name || 'General',
            method: log.method,
            status: log.status,
            action: log.action,
          },
          timestamp: log.timestamp.toISOString(),
        });
      });
    }

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      events: events.slice(0, limit),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Realtime events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
