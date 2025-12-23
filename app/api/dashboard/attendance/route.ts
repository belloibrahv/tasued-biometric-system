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

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, department: true, level: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's attendance records
    const attendance = await db.lectureAttendance.findMany({
      where: { userId: user.id },
      include: {
        lectureSession: {
          select: {
            id: true,
            courseCode: true,
            courseName: true,
            lecturer: true,
            venue: true,
            startTime: true,
            endTime: true,
            department: true,
            level: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
      take: 50,
    });

    // Get attendance stats
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyAttendance = await db.lectureAttendance.count({
      where: {
        userId: user.id,
        checkInTime: { gte: thisMonth },
      },
    });

    const totalAttendance = await db.lectureAttendance.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      attendance,
      stats: {
        thisMonth: monthlyAttendance,
        total: totalAttendance,
      },
    });
  } catch (error) {
    console.error('Dashboard attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
