import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST /api/biometric/verify - Verify a student's identity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrCode, matricNumber, method } = body;

    if (!qrCode && !matricNumber) {
      return NextResponse.json(
        { error: 'QR code or matric number is required' },
        { status: 400 }
      );
    }

    let user = null;

    // Find user by QR code
    if (qrCode) {
      const qrRecord = await db.qRCode.findFirst({
        where: {
          code: qrCode,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (qrRecord) {
        user = qrRecord.user;
        // Update QR usage
        await db.qRCode.update({
          where: { id: qrRecord.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });
      }
    }

    // Find user by matric number
    if (!user && matricNumber) {
      user = await db.user.findUnique({
        where: { matricNumber: matricNumber.toUpperCase() },
      });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Student not found or QR code expired',
      }, { status: 404 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Account inactive',
      }, { status: 403 });
    }

    // Return verification result
    return NextResponse.json({
      success: true,
      student: {
        id: user.id,
        matricNumber: user.matricNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        level: user.level,
        profilePhoto: user.profilePhoto,
        isVerified: true,
      },
      verifiedAt: new Date().toISOString(),
      method: method || 'QR_CODE',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
