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
    if (!payload || (payload.type !== 'admin' && payload.type !== 'operator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId, method, serviceSlug = 'library' } = await request.json();

    if (!studentId || !method) {
      return NextResponse.json({ error: 'Student ID and method are required' }, { status: 400 });
    }

    // Fetch student and service in parallel for better performance
    const [student, service] = await Promise.all([
      db.user.findUnique({ where: { id: studentId } }),
      db.service.findUnique({ where: { slug: serviceSlug } })
    ]);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.isActive) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 });
    }

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Perform biometric verification for biometric methods
    let matchScore: number | null = null;

    if (method === 'FINGERPRINT' || method === 'FACIAL') {
      const biometric = await db.biometricData.findUnique({
        where: { userId: studentId },
      });

      if (!biometric || (!biometric.fingerprintTemplate && !biometric.facialTemplate)) {
        return NextResponse.json({ error: 'Student has not enrolled biometrics' }, { status: 400 });
      }

      // Simulate biometric verification (in production, use actual biometric matching)
      const hasTemplate = method === 'FINGERPRINT'
        ? !!biometric.fingerprintTemplate
        : !!biometric.facialTemplate;

      if (!hasTemplate) {
        return NextResponse.json({ error: `${method} template not found` }, { status: 400 });
      }

      matchScore = 92 + Math.random() * 6; // 92-98% match score
    }

    // Use a single transaction for all mutations to minimize db round-trips
    const [accessLog] = await db.$transaction([
      db.accessLog.create({
        data: {
          userId: studentId,
          serviceId: service.id,
          verificationMethod: method,
          status: 'SUCCESS',
          biometricMatchScore: matchScore,
          operatorId: payload.id,
          location: 'Main Campus',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      }),
      db.serviceConnection.updateMany({
        where: {
          userId: studentId,
          serviceId: service.id,
        },
        data: {
          accessCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      }),
      db.notification.create({
        data: {
          userId: studentId,
          type: 'VERIFICATION',
          title: 'Identity Verified',
          message: `Your identity was verified at ${service.name} using ${method.toLowerCase().replace('_', ' ')}.`,
        },
      })
    ]);

    // Async Audit Log (Non-blocking)
    db.auditLog.create({
      data: {
        userId: studentId,
        actorType: 'OPERATOR',
        actorId: payload.id,
        actionType: 'VERIFICATION',
        resourceType: 'ACCESS_LOG',
        resourceId: accessLog.id,
        status: 'SUCCESS',
        details: { method, service: service.name, matchScore },
      },
    }).catch(err => console.error('Failed to create async audit log:', err));

    return NextResponse.json({
      message: 'Verification successful',
      verification: {
        id: accessLog.id,
        student: {
          name: `${student.firstName} ${student.lastName}`,
          matricNumber: student.matricNumber,
        },
        service: service.name,
        method,
        matchScore,
        timestamp: accessLog.timestamp,
      },
    });

    return NextResponse.json({
      message: 'Verification successful',
      verification: {
        id: accessLog.id,
        student: {
          name: `${student.firstName} ${student.lastName}`,
          matricNumber: student.matricNumber,
        },
        service: service.name,
        method,
        matchScore,
        timestamp: accessLog.timestamp,
      },
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
