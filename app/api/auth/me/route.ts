import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie
      const cookieStore = request.headers.get('cookie');
      token = cookieStore?.split(';')?.find(c => c.trim().startsWith('auth-token='))?.split('=')[1] || '';
    }

    let payload: any = null;

    if (token) {
      payload = await verifyToken(token);
    }

    if (!payload) {
      // Direct SSR check
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      payload = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'STUDENT',
        biometricEnrolled: user.user_metadata?.biometricEnrolled === true
      };
    }

    // Fetch user details from DB
    const isAdmin = payload.role === 'ADMIN' || payload.role === 'OPERATOR';

    let user: any = null;
    if (isAdmin) {
      user = await db.admin.findUnique({
        where: { id: payload.id }
      });
    } else {
      user = await db.user.findUnique({
        where: { id: payload.id },
        include: {
          biometricData: true
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (isAdmin) {
      return NextResponse.json({
        user: {
          ...user,
          type: 'admin',
          role: payload.role || (user as any).role,
          biometricEnrolled: true // Admins don't need biometric
        }
      });
    }

    // Student logic
    const biometric = (user as any).biometricData;

    // Get stats
    const servicesCount = await db.serviceConnection.count({
      where: { userId: user.id, isActive: true },
    });

    const unreadNotifications = await db.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return NextResponse.json({
      user: {
        ...user,
        type: 'student',
        biometricEnrolled: payload.biometricEnrolled || !!biometric,
        biometricEnrolledAt: biometric?.enrolledAt,
        connectedServicesCount: servicesCount,
        unreadNotificationsCount: unreadNotifications,
      },
    });

  } catch (error: any) {
    console.error('Auth Me Route Error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return NextResponse.json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during profile verification',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
