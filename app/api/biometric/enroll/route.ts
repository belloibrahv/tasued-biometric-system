import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateToken } from '@/lib/auth';
import db from '@/lib/db';
import { encryptData } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

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

    // Update or create biometric data
    const biometricData = await db.biometricData.upsert({
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
    });

    // Update user to mark biometric as enrolled
    await db.user.update({
      where: { id: payload.id },
      data: { 
        biometricEnrolled: true,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.id,
        actorType: 'STUDENT',
        actorId: payload.id,
        actionType: 'BIOMETRIC_ENROLLMENT',
        resourceType: 'BIOMETRIC',
        resourceId: biometricData.id,
        status: 'SUCCESS',
        details: {
          facialEnrolled: !!facialTemplate,
          fingerprintEnrolled: !!fingerprintTemplate,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Biometric enrollment successful',
      biometricData: {
        id: biometricData.id,
        facialEnrolled: !!biometricData.facialTemplate,
        fingerprintEnrolled: !!biometricData.fingerprintTemplate,
        enrolledAt: biometricData.enrolledAt,
      },
      // Generate new token with biometricEnrolled = true
      token: await generateToken({
        id: payload.id,
        email: payload.email,
        role: payload.role,
        matricNumber: payload.matricNumber,
        type: payload.type,
        biometricEnrolled: true,
      }),
    });

  } catch (error: any) {
    console.error('Biometric enrollment error:', error);
    return NextResponse.json(
      { error: error.message || 'Biometric enrollment failed' },
      { status: 500 }
    );
  }
}
