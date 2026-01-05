import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

function isAdminOrOperator(req: NextRequest) {
  const type = req.headers.get('x-user-type');
  const role = req.headers.get('x-user-role');
  return type === 'admin' && (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAdminOrOperator(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessionId = params.id;
    const format = req.nextUrl.searchParams.get('format') || 'json'; // 'json' or 'csv'

    // Get session details
    const session = await db.lectureSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get attendance records
    const attendance = await db.lectureAttendance.findMany({
      where: { lectureSessionId: sessionId },
      include: {
        user: {
          select: {
            id: true,
            matricNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            level: true,
          },
        },
      },
      orderBy: { checkInTime: 'asc' },
    });

    // Calculate statistics
    const totalStudents = attendance.length;
    const successfulCheckins = attendance.filter(a => a.status === 'SUCCESS').length;
    const failedCheckins = attendance.filter(a => a.status === 'FAILED').length;
    const qrCodeCheckins = attendance.filter(a => a.method === 'QR_CODE').length;
    const facialCheckins = attendance.filter(a => a.method === 'FACIAL').length;
    const manualCheckins = attendance.filter(a => a.method === 'MANUAL').length;

    const stats = {
      totalStudents,
      successfulCheckins,
      failedCheckins,
      successRate: totalStudents > 0 ? ((successfulCheckins / totalStudents) * 100).toFixed(2) : '0',
      verificationMethods: {
        qrCode: qrCodeCheckins,
        facial: facialCheckins,
        manual: manualCheckins,
      },
    };

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Matric Number', 'Name', 'Email', 'Department', 'Level', 'Check-in Time', 'Method', 'Status'];
      const rows = attendance.map(a => [
        a.user.matricNumber,
        `${a.user.firstName} ${a.user.lastName}`,
        a.user.email,
        a.user.department,
        a.user.level,
        new Date(a.checkInTime).toISOString(),
        a.method,
        a.status,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="attendance-${sessionId}.csv"`,
        },
      });
    }

    // Return JSON
    return NextResponse.json({
      session: {
        id: session.id,
        courseCode: session.courseCode,
        courseName: session.courseName,
        lecturer: session.lecturer,
        venue: session.venue,
        startTime: session.startTime,
        endTime: session.endTime,
        department: session.department,
        level: session.level,
      },
      stats,
      attendance: attendance.map(a => ({
        id: a.id,
        matricNumber: a.user.matricNumber,
        name: `${a.user.firstName} ${a.user.lastName}`,
        email: a.user.email,
        department: a.user.department,
        level: a.user.level,
        checkInTime: a.checkInTime,
        checkOutTime: a.checkOutTime,
        method: a.method,
        status: a.status,
        matchScore: a.matchScore,
      })),
    });
  } catch (error: any) {
    console.error('Attendance report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate attendance report' },
      { status: 500 }
    );
  }
}
