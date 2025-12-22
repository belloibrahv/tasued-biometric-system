import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import { createClient as createSupabaseClientJS } from '@supabase/supabase-js';
import { createClient as getSupabaseServerClient } from '@/utils/supabase/server';
import UserService from '@/lib/services/user-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('Enrollment: Received request');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Try to get user ID from either custom token or Supabase session
    let userId: string | null = null;
    let payload: any = null;
    let supabaseUser: any = null;

    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (token) {
      // Try custom token verification first
      const customPayload = await verifyToken(token);
      if (customPayload) {
        userId = customPayload.id;
        payload = customPayload;
      }
    }

    // If custom token didn't work, try Supabase session
    if (!userId) {
      try {
        const supabase = getSupabaseServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.warn('Supabase auth error:', error);
        } else if (user) {
          userId = user.id;
          supabaseUser = user;
          payload = { id: user.id, email: user.email, type: 'student' }; // Create a minimal payload
        }
      } catch (e) {
        console.warn('Failed to verify Supabase token:', e);
      }
    }

    if (!userId || !payload) {
      console.warn('Enrollment: No valid token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`Enrollment: Processing for user ${userId}`);

    // CRITICAL: Ensure user exists in our database before creating biometric data
    try {
      let dbUser = await UserService.getUserById(userId);

      if (!dbUser && supabaseUser) {
        console.log('Enrollment: User not found in DB, syncing from Supabase Auth...');
        dbUser = await UserService.syncUserFromAuth(supabaseUser);
        console.log(`Enrollment: User synced successfully: ${dbUser.email}`);
      } else if (!dbUser) {
        console.error('Enrollment: User not found and no Supabase user data available');
        return NextResponse.json({
          error: 'User not found in database. Please register first.'
        }, { status: 404 });
      }

      console.log(`Enrollment: User verified in database: ${dbUser.email}`);
    } catch (syncError: any) {
      console.error('Enrollment: User sync failed:', syncError);
      return NextResponse.json({
        error: `User synchronization failed: ${syncError.message}`
      }, { status: 500 });
    }

    const body = await request.json();
    const { facialTemplate, facialPhoto, fingerprintTemplate } = body;

    if (!facialTemplate && !fingerprintTemplate) {
      return NextResponse.json(
        { error: 'At least one biometric template is required' },
        { status: 400 }
      );
    }

    const BiometricService = (await import('@/lib/services/biometric-service')).default;
    const enrollment = await BiometricService.enroll({
      userId,
      facialTemplate,
      facialPhoto,
      fingerprintTemplate
    },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json({
      message: 'Biometric enrollment successful',
      biometricData: enrollment,
      biometricEnrolled: true
    });

  } catch (error: any) {
    console.error('Biometric enrollment error:', error);
    return NextResponse.json(
      { error: error.message || 'Biometric enrollment failed' },
      { status: 500 }
    );
  }
}
