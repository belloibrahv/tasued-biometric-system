import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import { createClient as createSupabaseClientJS } from '@supabase/supabase-js';
import { createClient as getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('Enrollment: Received request');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Try to get user ID from either custom token or Supabase session
    let userId: string | null = null;
    let payload: any = null;

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

    const body = await request.json();
    const { facialTemplate, facialPhoto, fingerprintTemplate } = body;

    if (!facialTemplate && !fingerprintTemplate) {
      return NextResponse.json(
        { error: 'At least one biometric template is required' },
        { status: 400 }
      );
    }

    // Check if encryption key is available before proceeding
    if (!process.env.ENCRYPTION_KEY) {
      console.error('Encryption error: ENCRYPTION_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Encryption key is not set' },
        { status: 500 }
      );
    }

    // Encrypt the biometric template
    // For facialTemplate, it's an array of numbers that needs to be stringified before encryption
    let encryptedFacialTemplate = null;
    let encryptedFingerprintTemplate = null;

    try {
      if (facialTemplate) {
        const facialData = typeof facialTemplate === 'string' ? facialTemplate : JSON.stringify(facialTemplate);
        encryptedFacialTemplate = encryptData(facialData);
      }

      if (fingerprintTemplate) {
        const fingerprintData = typeof fingerprintTemplate === 'string' ? fingerprintTemplate : JSON.stringify(fingerprintTemplate);
        encryptedFingerprintTemplate = encryptData(fingerprintData);
      }
    } catch (encryptError) {
      console.error('Encryption error:', encryptError);
      return NextResponse.json(
        { error: 'Encryption failed', details: encryptError instanceof Error ? encryptError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Initialize supabaseAdmin if possible
    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createSupabaseClientJS(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('Enrollment: SUPABASE_SERVICE_ROLE_KEY is missing. Auth metadata will not be updated.');
    }

    // Use a transaction for all database mutations
    let biometricData;
    try {
      biometricData = await db.$transaction(async (prisma) => {
        const updatedBiometricData = await prisma.biometricData.upsert({
          where: { userId: userId },
          update: {
            facialTemplate: encryptedFacialTemplate,
            facialQuality: facialTemplate ? 95 : undefined,
            facialPhotos: facialPhoto ? [facialPhoto] : undefined,
            fingerprintTemplate: encryptedFingerprintTemplate,
            fingerprintQuality: fingerprintTemplate ? 95 : undefined,
            lastUpdated: new Date(),
          },
          create: {
            userId: userId,
            facialTemplate: encryptedFacialTemplate,
            facialQuality: facialTemplate ? 95 : null,
            facialPhotos: facialPhoto ? [facialPhoto] : [],
            fingerprintTemplate: encryptedFingerprintTemplate,
            fingerprintQuality: fingerprintTemplate ? 95 : null,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            biometricEnrolled: true,
            updatedAt: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: userId,
            actorType: 'STUDENT',
            actorId: userId,
            actionType: 'BIOMETRIC_ENROLLMENT',
            resourceType: 'BIOMETRIC',
            resourceId: updatedBiometricData.id,
            status: 'SUCCESS',
            details: {
              facialEnrolled: !!facialTemplate,
              fingerprintEnrolled: !!fingerprintTemplate,
            },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });

        return updatedBiometricData;
      });
    } catch (transactionError) {
      console.error('Biometric enrollment transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Database transaction failed', details: transactionError instanceof Error ? transactionError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Update Supabase Auth metadata asynchronously to avoid blocking the main result
    if (supabaseAdmin) {
      supabaseAdmin.auth.admin.updateUserById(userId, {
        data: { biometricEnrolled: true }
      }).catch(err => console.warn('Enrollment: Async Auth metadata update failed', err));
    }

    return NextResponse.json({
      message: 'Biometric enrollment successful',
      biometricData: {
        id: biometricData.id,
        facialEnrolled: !!biometricData.facialTemplate,
        fingerprintEnrolled: !!biometricData.fingerprintTemplate,
        enrolledAt: biometricData.lastUpdated,
      },
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
