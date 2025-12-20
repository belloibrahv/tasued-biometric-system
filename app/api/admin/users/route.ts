import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === 'active') {
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    } else if (filter === 'enrolled') {
      where.biometricEnrolled = true;
    } else if (filter === 'pending') {
      where.biometricEnrolled = false;
    }

    // Get users and stats in parallel
    const [users, total, enrolledCount, totalStudents] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          matricNumber: true,
          email: true,
          firstName: true,
          lastName: true,
          department: true,
          level: true,
          isActive: true,
          biometricEnrolled: true,
          createdAt: true,
          lastLoginAt: true,
          profilePhoto: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
      db.user.count({ where: { biometricEnrolled: true } }),
      db.user.count(),
    ]);

    return NextResponse.json({
      users,
      stats: {
        total: totalStudents,
        enrolled: enrolledCount,
        pending: totalStudents - enrolledCount,
        enrollmentRate: totalStudents > 0 ? Math.round((enrolledCount / totalStudents) * 100) : 0,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
