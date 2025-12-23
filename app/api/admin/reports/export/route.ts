import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';
import { format } from 'date-fns';

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
    if (userType !== 'admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'verifications';
    const exportFormat = searchParams.get('format') || 'csv';

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to + 'T23:59:59') : new Date();

    let data: any[] = [];
    let headers: string[] = [];

    if (type === 'verifications') {
      const logs = await db.accessLog.findMany({
        where: { timestamp: { gte: fromDate, lte: toDate } },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true, department: true } },
          service: { select: { name: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 10000,
      });

      headers = ['Date', 'Time', 'Student Name', 'Matric Number', 'Department', 'Service', 'Method', 'Status', 'Location'];
      data = logs.map(log => [
        format(log.timestamp, 'yyyy-MM-dd'),
        format(log.timestamp, 'HH:mm:ss'),
        `${log.user.firstName} ${log.user.lastName}`,
        log.user.matricNumber,
        log.user.department || 'N/A',
        log.service?.name || 'N/A',
        log.method || 'N/A',
        log.status,
        log.location || 'N/A',
      ]);
    } else if (type === 'attendance') {
      const attendance = await db.lectureAttendance.findMany({
        where: { checkInTime: { gte: fromDate, lte: toDate } },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true, department: true } },
          lectureSession: { select: { courseCode: true, courseName: true, venue: true } },
        },
        orderBy: { checkInTime: 'desc' },
        take: 10000,
      });

      headers = ['Date', 'Check-in Time', 'Check-out Time', 'Student Name', 'Matric Number', 'Course Code', 'Course Name', 'Venue', 'Method'];
      data = attendance.map(a => [
        format(a.checkInTime, 'yyyy-MM-dd'),
        format(a.checkInTime, 'HH:mm:ss'),
        a.checkOutTime ? format(a.checkOutTime, 'HH:mm:ss') : 'N/A',
        `${a.user.firstName} ${a.user.lastName}`,
        a.user.matricNumber,
        a.lectureSession.courseCode,
        a.lectureSession.courseName,
        a.lectureSession.venue,
        a.method,
      ]);
    } else if (type === 'services') {
      const access = await db.serviceAccess.findMany({
        where: { entryTime: { gte: fromDate, lte: toDate } },
        include: {
          user: { select: { firstName: true, lastName: true, matricNumber: true } },
          service: { select: { name: true } },
        },
        orderBy: { entryTime: 'desc' },
        take: 10000,
      });

      headers = ['Date', 'Entry Time', 'Exit Time', 'Duration (min)', 'Student Name', 'Matric Number', 'Service', 'Method'];
      data = access.map(a => {
        const duration = a.exitTime 
          ? Math.round((a.exitTime.getTime() - a.entryTime.getTime()) / 60000)
          : 'Still Inside';
        return [
          format(a.entryTime, 'yyyy-MM-dd'),
          format(a.entryTime, 'HH:mm:ss'),
          a.exitTime ? format(a.exitTime, 'HH:mm:ss') : 'N/A',
          duration,
          `${a.user.firstName} ${a.user.lastName}`,
          a.user.matricNumber,
          a.service.name,
          a.method,
        ];
      });
    }

    if (exportFormat === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="biovault-${type}-report.csv"`,
        },
      });
    } else {
      // Simple HTML table for PDF (can be printed as PDF)
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>BioVault Report - ${type}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #1e40af; }
    .meta { color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #1e40af; color: white; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .footer { margin-top: 20px; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <h1>BioVault ${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
  <div class="meta">
    <p>Period: ${format(fromDate, 'MMM d, yyyy')} - ${format(toDate, 'MMM d, yyyy')}</p>
    <p>Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}</p>
    <p>Total Records: ${data.length}</p>
  </div>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${data.map(row => `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">
    <p>BioVault - Biometric Identity Management System</p>
    <p>Tai Solarin University of Education</p>
  </div>
</body>
</html>`;

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="biovault-${type}-report.html"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
