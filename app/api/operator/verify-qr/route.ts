import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { decryptData } from '@/lib/encryption';

export async function POST(request: NextRequest) {
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

    const { code, serviceSlug = 'library' } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 });
    }

    // Find QR code
    const qrCode = await db.qRCode.findUnique({
      where: { code },
      include: {
        user: {
          select: {
            id: true,
            matricNumber: true,
            firstName: true,
            lastName: true,
            otherNames: true,
            phoneNumber: true,
            department: true,
            level: true,
            profilePhoto: true,
            isActive: true,
            biometricEnrolled: true,
            createdAt: true,
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code',
        message: 'The QR code you scanned is not valid or does not exist in our system.'
      }, { status: 404 });
    }

    if (!qrCode.isActive) {
      return NextResponse.json({
        success: false,
        error: 'QR code is no longer active',
        message: 'This QR code has been deactivated.'
      }, { status: 400 });
    }

    if (new Date() > qrCode.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'QR code has expired',
        message: 'This QR code has expired. Please ask the student to refresh their QR code.'
      }, { status: 400 });
    }

    const student = qrCode.user;

    if (!student.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Student account is inactive',
        message: 'This student account has been deactivated.'
      }, { status: 403 });
    }

    // Get service
    const service = await db.service.findUnique({
      where: { slug: serviceSlug },
    });

    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Service not found',
        message: `The service "${serviceSlug}" is not available in our system.`
      }, { status: 404 });
    }

    // Get biometric data for verification status
    const biometricData = await db.biometricData.findUnique({
      where: { userId: student.id },
      select: {
        facialTemplate: true,
        fingerprintTemplate: true,
        facialQuality: true,
        fingerprintQuality: true,
      }
    });

    // Update QR code usage
    await db.qRCode.update({
      where: { id: qrCode.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Create access log
    const accessLog = await db.accessLog.create({
      data: {
        userId: student.id,
        serviceId: service.id,
        verificationMethod: 'QR_CODE',
        status: 'SUCCESS',
        operatorId: payload.id,
        location: service.name,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: student.id,
        actorType: 'OPERATOR',
        actorId: payload.id,
        actionType: 'QR_VERIFICATION',
        resourceType: 'ACCESS_LOG',
        resourceId: accessLog.id,
        status: 'SUCCESS',
        details: {
          qrCodeId: qrCode.id,
          service: service.name,
          verificationMethod: 'QR_CODE',
          biometricEnrolled: student.biometricEnrolled,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
        timestamp: new Date(),
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: student.id,
        type: 'VERIFICATION',
        title: `Access Granted: ${service.name}`,
        message: `Your QR code was successfully scanned at ${service.name} on ${new Date().toLocaleString()}.`,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        otherNames: student.otherNames,
        phoneNumber: student.phoneNumber,
        department: student.department,
        level: student.level,
        profilePhoto: student.profilePhoto,
        biometricEnrolled: student.biometricEnrolled,
        enrollmentDate: student.createdAt,
      },
      biometricStatus: {
        facialEnrolled: !!biometricData?.facialTemplate,
        fingerprintEnrolled: !!biometricData?.fingerprintTemplate,
        facialQuality: biometricData?.facialQuality,
        fingerprintQuality: biometricData?.fingerprintQuality,
      },
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      verification: {
        method: 'QR_CODE',
        timestamp: accessLog.timestamp,
        location: service.name,
        verifiedBy: payload.id,
      },
    });

  } catch (error: any) {
    console.error('QR verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'An error occurred during verification. Please try again.'
    }, { status: 500 });
  }
}
