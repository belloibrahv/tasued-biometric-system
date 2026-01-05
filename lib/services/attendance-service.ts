import db from '@/lib/db';
import { VerificationMethod, VerificationStatus } from '@prisma/client';

export class AttendanceService {
  /**
   * Record attendance for a student in a lecture session
   */
  static async recordAttendance(
    lectureSessionId: string,
    userId: string,
    method: VerificationMethod = 'QR_CODE',
    matchScore?: number,
    location?: string,
    deviceId?: string
  ) {
    try {
      // Verify session exists and is active
      const session = await db.lectureSession.findUnique({
        where: { id: lectureSessionId },
      });

      if (!session) {
        throw new Error('Lecture session not found');
      }

      const now = new Date();
      if (now < new Date(session.startTime) || now > new Date(session.endTime)) {
        throw new Error('Lecture session is not currently active');
      }

      // Check if already attended
      const existing = await db.lectureAttendance.findUnique({
        where: {
          lectureSessionId_userId: {
            lectureSessionId,
            userId,
          },
        },
      });

      if (existing) {
        throw new Error('Student already checked in to this session');
      }

      // Record attendance
      const attendance = await db.lectureAttendance.create({
        data: {
          lectureSessionId,
          userId,
          method,
          status: 'SUCCESS',
          checkInTime: now,
          matchScore: matchScore || null,
          location: location || null,
          deviceId: deviceId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              matricNumber: true,
            },
          },
          lectureSession: true,
        },
      });

      return {
        success: true,
        attendance,
        message: 'Attendance recorded successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: error.message,
      };
    }
  }

  /**
   * Get attendance statistics for a user
   */
  static async getUserStats(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const attendance = await db.lectureAttendance.findMany({
        where: {
          userId,
          checkInTime: { gte: startDate },
        },
        include: {
          lectureSession: true,
        },
      });

      const totalLectures = await db.lectureSession.count({
        where: {
          startTime: { gte: startDate },
          endTime: { lte: new Date() },
        },
      });

      const attendanceRate = totalLectures > 0
        ? ((attendance.length / totalLectures) * 100).toFixed(2)
        : '0';

      const methodBreakdown = {
        qrCode: attendance.filter(a => a.method === 'QR_CODE').length,
        facial: attendance.filter(a => a.method === 'FACIAL').length,
        manual: attendance.filter(a => a.method === 'MANUAL').length,
        fingerprint: attendance.filter(a => a.method === 'FINGERPRINT').length,
      };

      return {
        success: true,
        stats: {
          totalLectures,
          attendedLectures: attendance.length,
          missedLectures: totalLectures - attendance.length,
          attendanceRate: `${attendanceRate}%`,
          methodBreakdown,
          period: `Last ${days} days`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get session attendance report
   */
  static async getSessionReport(sessionId: string) {
    try {
      const session = await db.lectureSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Session not found');
      }

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

      const stats = {
        totalStudents: attendance.length,
        successfulCheckins: attendance.filter(a => a.status === 'SUCCESS').length,
        failedCheckins: attendance.filter(a => a.status === 'FAILED').length,
        successRate: attendance.length > 0
          ? ((attendance.filter(a => a.status === 'SUCCESS').length / attendance.length) * 100).toFixed(2)
          : '0',
        verificationMethods: {
          qrCode: attendance.filter(a => a.method === 'QR_CODE').length,
          facial: attendance.filter(a => a.method === 'FACIAL').length,
          manual: attendance.filter(a => a.method === 'MANUAL').length,
        },
      };

      return {
        success: true,
        session,
        stats,
        attendance: attendance.map(a => ({
          id: a.id,
          matricNumber: a.user.matricNumber,
          name: `${a.user.firstName} ${a.user.lastName}`,
          email: a.user.email,
          department: a.user.department,
          level: a.user.level,
          checkInTime: a.checkInTime,
          method: a.method,
          status: a.status,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if student is late
   */
  static async checkIfLate(lectureSessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await db.lectureSession.findUnique({
        where: { id: lectureSessionId },
      });

      if (!session) return false;

      const attendance = await db.lectureAttendance.findUnique({
        where: {
          lectureSessionId_userId: {
            lectureSessionId,
            userId,
          },
        },
      });

      if (!attendance) return false;

      // Consider late if checked in more than 15 minutes after session start
      const lateThreshold = new Date(session.startTime);
      lateThreshold.setMinutes(lateThreshold.getMinutes() + 15);

      return attendance.checkInTime > lateThreshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get attendance trends for a user
   */
  static async getAttendanceTrends(userId: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const attendance = await db.lectureAttendance.findMany({
        where: {
          userId,
          checkInTime: { gte: startDate },
        },
      });

      // Group by date
      const trends: { [key: string]: number } = {};
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        trends[dateStr] = 0;
      }

      attendance.forEach(a => {
        const dateStr = new Date(a.checkInTime).toISOString().split('T')[0];
        if (dateStr in trends) {
          trends[dateStr]++;
        }
      });

      return {
        success: true,
        trends: Object.entries(trends).map(([date, count]) => ({
          date,
          count,
        })),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Export attendance to CSV
   */
  static async exportToCSV(sessionId: string): Promise<string> {
    try {
      const report = await this.getSessionReport(sessionId);

      if (!report.success || !report.attendance) {
        throw new Error('Failed to generate report');
      }

      const headers = ['Matric Number', 'Name', 'Email', 'Department', 'Level', 'Check-in Time', 'Method', 'Status'];
      const rows = report.attendance.map((a: any) => [
        a.matricNumber,
        a.name,
        a.email,
        a.department,
        a.level,
        new Date(a.checkInTime).toISOString(),
        a.method,
        'SUCCESS',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    } catch (error: any) {
      throw new Error(`Failed to export to CSV: ${error.message}`);
    }
  }

  /**
   * Get department attendance statistics
   */
  static async getDepartmentStats(department: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sessions = await db.lectureSession.findMany({
        where: {
          department,
          startTime: { gte: startDate },
        },
      });

      const sessionIds = sessions.map(s => s.id);

      const attendance = await db.lectureAttendance.findMany({
        where: {
          lectureSessionId: { in: sessionIds },
        },
        include: {
          user: true,
        },
      });

      const uniqueStudents = new Set(attendance.map(a => a.userId)).size;
      const totalAttendanceRecords = attendance.length;

      return {
        success: true,
        stats: {
          department,
          totalSessions: sessions.length,
          totalStudents: uniqueStudents,
          totalAttendanceRecords,
          averageAttendancePerSession: sessions.length > 0
            ? (totalAttendanceRecords / sessions.length).toFixed(2)
            : '0',
          period: `Last ${days} days`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Bulk check-in students
   */
  static async bulkCheckIn(
    lectureSessionId: string,
    userIds: string[],
    method: VerificationMethod = 'MANUAL'
  ) {
    try {
      const results: Array<{ userId: string; success: boolean; message: string }> = [];

      for (const userId of userIds) {
        const result = await this.recordAttendance(
          lectureSessionId,
          userId,
          method
        );
        results.push({
          userId,
          success: result.success,
          message: result.message,
        });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: true,
        summary: {
          total: results.length,
          successful,
          failed,
        },
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
