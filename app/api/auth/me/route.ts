import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db, { connectDb } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import UserService from '@/lib/services/user-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Ensure DB connection is active (important for pooling/cold starts)
    await connectDb();

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
    let authUser: any = null;

    if (token) {
      payload = await verifyToken(token);
    }

    if (!payload) {
      // Direct SSR check
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      authUser = user;
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
          biometricData: {
            select: {
              id: true,
              userId: true,
              enrolledAt: true,
              updatedAt: true,
              // Note: facialPhoto and facialTemplate are excluded here to save memory (130kiB+)
              // They should be fetched separately when verifying biometrics
            }
          }
        }
      });

      // If missing and not admin, try to sync from Supabase
      if (!user && !isAdmin) {
        if (!authUser) {
          const supabase = createClient();
          const { data: { user: foundUser } } = await supabase.auth.getUser();
          authUser = foundUser;
        }

        if (authUser) {
          console.log(`Syncing profile for user ${authUser.id} on /api/auth/me`);
          user = await UserService.syncUserFromAuth(authUser);
          // Re-fetch with includes if synchronized
          user = await db.user.findUnique({
            where: { id: user.id },
            include: { biometricData: true }
          });
        }
      }
    }

    if (!user) {
      return NextResponse.json({
        error: 'User profile not found',
        details: 'Your account exists but your profile could not be synchronized.'
      }, { status: 404 });
    }

    if (isAdmin) {
      return NextResponse.json({
        user: {
          ...user,
          type: 'admin',
          role: payload.role || (user as any).role,
          biometricEnrolled: true
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
    console.error('Auth Me Route Error:', error);

    return NextResponse.json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred during profile verification',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
