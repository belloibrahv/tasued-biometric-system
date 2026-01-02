import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

/**
 * POST Request Handler for QR Verification
 * This endpoint handles POST requests to /api/verify-qr with QR code in the request body
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'QR code parameter is required' },
        { status: 400 }
      );
    }

    // Find the QR code by the code value from the request body
    const qrRecord = await db.qRCode.findFirst({
      where: {
        code: code,
        isActive: true,
        expiresAt: { gt: new Date() }, // Ensure it hasn't expired
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
        lastUsedAt: new Date(),
      },
    });

    // Create access log
    await db.accessLog.create({
      data: {
        userId: qrRecord.user.id,
        action: 'QR_VERIFICATION',
        status: 'SUCCESS',
        timestamp: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: qrRecord.user.id,
        actionType: 'PUBLIC_QR_VERIFICATION',
        details: 'Public QR code verification',
        timestamp: new Date(),
      },
    });

    // Return the user information in a formatted way
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