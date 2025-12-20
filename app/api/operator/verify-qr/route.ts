import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

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
            department: true,
            level: true,
            profilePhoto: true,
            isActive: true,
          },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    if (!qrCode.isActive) {
      return NextResponse.json({ error: 'QR code is no longer active' }, { status: 400 });
    }

    if (new Date() > qrCode.expiresAt) {
      return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
    }

    const student = qrCode.user;

    if (!student.isActive) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 });
    }

    // Get service
    const service = await db.service.findUnique({
      where: { slug: serviceSlug },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

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
        location: 'Main Campus',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
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
        },
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: student.id,
        type: 'VERIFICATION',
        title: 'QR Code Scanned',
        message: `Your QR code was scanned at ${service.name}.`,
      },
    });

    return NextResponse.json({
      message: 'Verification successful',
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department,
        level: student.level,
        profilePhoto: student.profilePhoto,
      },
      service: service.name,
      timestamp: accessLog.timestamp,
    });

  } catch (error) {
    console.error('QR verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
