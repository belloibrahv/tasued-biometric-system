import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Get the QR code from the dynamic route parameter
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Extract the code from the URL parameters
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'QR code parameter is required' },
        { status: 400 }
      );
    }

    // Look up the QR code in the database
    const qrRecord = await db.qRCode.findFirst({
      where: {
        code: code,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
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
          }
        }
      }
    });

    if (!qrRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 404 }
      );
    }

    if (!qrRecord.user.isActive) {
      return NextResponse.json(
        { error: 'Student account is inactive' },
        { status: 403 }
      );
    }

    // Update QR code usage
    await db.qRCode.update({
      where: { id: qrRecord.id },
      data: {
        usageCount: { increment: 1 },
        usedAt: new Date(),
      },
    });

    // Create access log
    await db.accessLog.create({
      data: {
        userId: qrRecord.user.id,
        serviceId: null,
        action: 'QR_CODE_PUBLIC_SCAN',
        method: 'QR_CODE',
        status: 'SUCCESS',
        location: 'Public Verification',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        deviceInfo: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: qrRecord.user.id,
        actionType: 'PUBLIC_QR_VERIFICATION',
        resourceType: 'USER',
        resourceId: qrRecord.user.id,
        status: 'SUCCESS',
        details: {
          qrCodeId: qrRecord.id,
          verificationMethod: 'PUBLIC_SCAN',
          scannerInfo: request.headers.get('user-agent') || 'unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      },
    });

    // Return the user information
    return NextResponse.json({
      success: true,
      student: {
        id: qrRecord.user.id,
        matricNumber: qrRecord.user.matricNumber,
        firstName: qrRecord.user.firstName,
        lastName: qrRecord.user.lastName,
        otherNames: qrRecord.user.otherNames,
        phoneNumber: qrRecord.user.phoneNumber,
        department: qrRecord.user.department,
        level: qrRecord.user.level,
        profilePhoto: qrRecord.user.profilePhoto,
        isVerified: true,
        biometricEnrolled: qrRecord.user.biometricEnrolled,
        enrollmentDate: qrRecord.user.createdAt,
      },
      qrInfo: {
        id: qrRecord.id,
        code: qrRecord.code,
        expiresAt: qrRecord.expiresAt,
        active: qrRecord.isActive,
        usageCount: qrRecord.usageCount,
      },
      timestamp: new Date().toISOString(),
      verification: {
        method: 'PUBLIC_QR_SCAN',
        status: 'VERIFIED',
      },
      message: `QR code verified for ${qrRecord.user.firstName} ${qrRecord.user.lastName}`,
    });

  } catch (error: any) {
    console.error('Public QR verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'POST requests to this endpoint are not supported. Use /api/verify-qr instead.' },
    { status: 405 }
  );
}
