import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user based on type
    if (payload.type === 'admin') {
      const admin = await db.admin.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
        },
      });

      if (!admin || !admin.isActive) {
        return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
      }

      return NextResponse.json({
        user: { ...admin, type: 'admin' },
      });
    }

    // Student user
    const user = await db.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        phoneNumber: true,
        dateOfBirth: true,
        department: true,
        level: true,
        profilePhoto: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    // Get biometric status
    const biometric = await db.biometricData.findUnique({
      where: { userId: user.id },
      select: {
        fingerprintTemplate: true,
        facialTemplate: true,
        enrolledAt: true,
      },
    });

    // Get connected services count
    const servicesCount = await db.serviceConnection.count({
      where: { userId: user.id, isActive: true },
    });

    // Get unread notifications count
    const unreadNotifications = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      user: {
        ...user,
        type: 'student',
        biometricEnrolled: !!(biometric?.fingerprintTemplate || biometric?.facialTemplate),
        biometricEnrolledAt: biometric?.enrolledAt,
        connectedServicesCount: servicesCount,
        unreadNotificationsCount: unreadNotifications,
      },
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
