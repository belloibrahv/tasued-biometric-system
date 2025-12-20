import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('Enrollment: Received request');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const token = request.cookies.get('auth-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.warn('Enrollment: No token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      console.warn('Enrollment: Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    console.log(`Enrollment: Processing for user ${payload.id}`);

    const body = await request.json();
    const { facialTemplate, facialPhoto, fingerprintTemplate } = body;

    if (!facialTemplate && !fingerprintTemplate) {
      return NextResponse.json(
        { error: 'At least one biometric template is required' },
        { status: 400 }
      );
    }

    // Encrypt the biometric template
    const encryptedFacialTemplate = facialTemplate ? encryptData(facialTemplate) : null;
    const encryptedFingerprintTemplate = fingerprintTemplate ? encryptData(fingerprintTemplate) : null;

    // Initialize supabaseAdmin if possible
    let supabaseAdmin: any = null;
    if (supabaseUrl && supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('Enrollment: SUPABASE_SERVICE_ROLE_KEY is missing. Auth metadata will not be updated.');
    }

    // Use a transaction for all database mutations
    const [biometricData] = await db.$transaction([
      db.biometricData.upsert({
        where: { userId: payload.id },
        update: {
          facialTemplate: encryptedFacialTemplate || undefined,
          facialQuality: facialTemplate ? 95 : undefined,
          facialPhotos: facialPhoto ? [facialPhoto] : undefined,
          fingerprintTemplate: encryptedFingerprintTemplate || undefined,
          fingerprintQuality: fingerprintTemplate ? 95 : undefined,
          lastUpdated: new Date(),
        },
        create: {
          userId: payload.id,
          facialTemplate: encryptedFacialTemplate,
          facialQuality: facialTemplate ? 95 : null,
          facialPhotos: facialPhoto ? [facialPhoto] : [],
          fingerprintTemplate: encryptedFingerprintTemplate,
          fingerprintQuality: fingerprintTemplate ? 95 : null,
        },
      }),
      db.user.update({
        where: { id: payload.id },
        data: {
          biometricEnrolled: true,
          updatedAt: new Date(),
        },
      }),
      db.auditLog.create({
        data: {
          userId: payload.id,
          actorType: 'STUDENT',
          actorId: payload.id,
          actionType: 'BIOMETRIC_ENROLLMENT',
          resourceType: 'BIOMETRIC',
          resourceId: "PENDING", // Temporary ID, updated below if needed
          status: 'SUCCESS',
          details: {
            facialEnrolled: !!facialTemplate,
            fingerprintEnrolled: !!fingerprintTemplate,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })
    ]);

    // Update Supabase Auth metadata asynchronously to avoid blocking the main result
    if (supabaseAdmin) {
      supabaseAdmin.auth.admin.updateUserById(
        payload.id,
        { user_metadata: { biometricEnrolled: true } }
      ).catch(err => console.warn('Enrollment: Async Auth metadata update failed', err));
    }

    return NextResponse.json({
      message: 'Biometric enrollment successful',
      biometricData: {
        id: biometricData.id,
        facialEnrolled: !!biometricData.facialTemplate,
        fingerprintEnrolled: !!biometricData.fingerprintTemplate,
        enrolledAt: biometricData.enrolledAt,
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
