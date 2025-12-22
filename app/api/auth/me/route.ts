import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db, { connectDb } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import UserService from '@/lib/services/user-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Ensure DB connection is active
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
      };
    }

    // Fetch user details from DB
    let user = await db.user.findUnique({
      where: { id: payload.id },
      include: {
        biometricData: {
          select: {
            id: true,
            facialTemplate: true,
            fingerprintTemplate: true,
            facialQuality: true,
            fingerprintQuality: true,
            enrolledAt: true,
          }
        }
      }
    });

    // If missing, try to sync from Supabase (but with timeout protection)
    if (!user) {
      if (!authUser) {
        const supabase = createClient();
        const { data: { user: foundUser } } = await supabase.auth.getUser();
        authUser = foundUser;
      }

      if (authUser) {
        console.log(`Syncing profile for user ${authUser.id} on /api/auth/me`);
        try {
          const syncedUser = await UserService.syncUserFromAuth(authUser);
          
          // Fetch again with biometric data
          user = await db.user.findUnique({
            where: { id: syncedUser.id },
            include: {
              biometricData: {
                select: {
                  id: true,
                  facialTemplate: true,
                  fingerprintTemplate: true,
                  facialQuality: true,
                  fingerprintQuality: true,
                  enrolledAt: true,
                }
              }
            }
          });
        } catch (syncError: any) {
          console.error('User sync failed:', syncError);
          // Return a minimal user object to prevent infinite loops
          return NextResponse.json({
            error: 'User sync failed',
            details: syncError.message,
            user: {
              id: authUser.id,
              email: authUser.email,
              firstName: authUser.user_metadata?.firstName || 'Unknown',
              lastName: authUser.user_metadata?.lastName || 'User',
              type: authUser.user_metadata?.type || 'student',
              biometricEnrolled: false,
            }
          }, { status: 200 });
        }
      }
    }

    if (!user) {
      return NextResponse.json({
        error: 'User profile not found',
        details: 'Your account exists but your profile could not be synchronized.'
      }, { status: 404 });
    }

    // Determine if user is admin/staff
    const isAdmin = authUser?.user_metadata?.type === 'admin' || 
                    authUser?.user_metadata?.role === 'ADMIN' ||
                    authUser?.user_metadata?.role === 'SUPER_ADMIN' ||
                    authUser?.user_metadata?.role === 'OPERATOR';

    // Check biometric enrollment status
    const hasBiometric = user.biometricData && (
      !!user.biometricData.facialTemplate || 
      !!user.biometricData.fingerprintTemplate
    );

    // Return unified response structure with all user fields
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        otherNames: user.otherNames,
        matricNumber: user.matricNumber,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        department: user.department,
        level: user.level, // Return level exactly as stored
        profilePhoto: user.profilePhoto,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // Computed fields
        type: isAdmin ? 'admin' : 'student',
        biometricEnrolled: hasBiometric || user.biometricEnrolled,
        biometricEnrolledAt: user.biometricData?.enrolledAt || null,
        // Legacy compat fields
        connectedServicesCount: 0,
        unreadNotificationsCount: 0,
      }
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
