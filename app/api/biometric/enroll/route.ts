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
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      console.warn('Enrollment: SUPABASE_SERVICE_ROLE_KEY is missing. Auth metadata will not be updated.');
    }

    // Use a transaction for all database mutations
    let biometricData;
    try {
      biometricData = await db.$transaction(async (tx) => {
        const updatedBiometricData = await tx.biometricData.upsert({
          where: { userId: payload.id },
          update: {
            facialTemplate: encryptedFacialTemplate,
            facialQuality: facialTemplate ? 95 : undefined,
            facialPhotos: facialPhoto ? [facialPhoto] : undefined,
            fingerprintTemplate: encryptedFingerprintTemplate,
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
        });

        await tx.user.update({
          where: { id: payload.id },
          data: {
            biometricEnrolled: true,
            updatedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId: payload.id,
            actorType: 'STUDENT',
            actorId: payload.id,
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
      supabaseAdmin.auth.admin.updateUserById(payload.id, {
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
