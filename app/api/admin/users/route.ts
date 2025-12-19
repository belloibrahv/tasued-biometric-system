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
      where.isSuspended = false;
    } else if (filter === 'suspended') {
      where.isSuspended = true;
    } else if (filter === 'unverified') {
      where.isEmailVerified = false;
    }

    // Get users
    const users = await db.user.findMany({
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
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get biometric status for each user
    const usersWithBiometric = await Promise.all(
      users.map(async (user) => {
        const biometric = await db.biometricData.findUnique({
          where: { userId: user.id },
          select: { fingerprintTemplate: true, facialTemplate: true },
        });
        return {
          ...user,
          biometricEnrolled: !!(biometric?.fingerprintTemplate || biometric?.facialTemplate),
        };
      })
    );

    // Get total count
    const total = await db.user.count({ where });

    return NextResponse.json({
      users: usersWithBiometric,
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
