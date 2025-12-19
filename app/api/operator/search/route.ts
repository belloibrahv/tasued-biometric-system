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

    const query = request.nextUrl.searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Search by matric number or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { matricNumber: { contains: query.toUpperCase(), mode: 'insensitive' } },
          { email: { contains: query.toLowerCase(), mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        level: true,
        profilePhoto: true,
        isActive: true,
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check biometric enrollment
    const biometric = await db.biometricData.findUnique({
      where: { userId: user.id },
      select: {
        fingerprintTemplate: true,
        facialTemplate: true,
        enrolledAt: true,
      },
    });

    // Get recent access logs
    const recentAccess = await db.accessLog.findMany({
      where: { userId: user.id },
      include: {
        service: { select: { name: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      student: {
        ...user,
        biometricEnrolled: !!(biometric?.fingerprintTemplate || biometric?.facialTemplate),
        biometricEnrolledAt: biometric?.enrolledAt,
        recentAccess: recentAccess.map(log => ({
          service: log.service.name,
          status: log.status,
          method: log.verificationMethod,
          timestamp: log.timestamp,
        })),
      },
    });

  } catch (error) {
    console.error('Student search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
