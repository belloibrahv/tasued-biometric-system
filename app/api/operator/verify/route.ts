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

    const { studentId, method, serviceSlug = 'library' } = await request.json();

    if (!studentId || !method) {
      return NextResponse.json({ error: 'Student ID and method are required' }, { status: 400 });
    }

    // Get student
    const student = await db.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.isActive) {
      return NextResponse.json({ error: 'Student account is inactive' }, { status: 403 });
    }

    if (student.isSuspended) {
      return NextResponse.json({ error: 'Student account is suspended' }, { status: 403 });
    }

    // Get service
    const service = await db.service.findUnique({
      where: { slug: serviceSlug },
    });

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
      // For now, check if template exists and return high confidence
      const hasTemplate = method === 'FINGERPRINT' 
        ? !!biometric.fingerprintTemplate 
        : !!biometric.facialTemplate;
      
      if (!hasTemplate) {
        return NextResponse.json({ error: `${method} template not found` }, { status: 400 });
      }

      // Simulate match score (in real implementation, compare captured biometric with stored template)
      matchScore = 92 + Math.random() * 6; // 92-98% match score
    }

    // Create access log
    const accessLog = await db.accessLog.create({
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
    });

    // Update service connection access count
    await db.serviceConnection.updateMany({
      where: {
        userId: studentId,
        serviceId: service.id,
      },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: studentId,
        actorType: 'OPERATOR',
        actorId: payload.id,
        actionType: 'VERIFICATION',
        resourceType: 'ACCESS_LOG',
        resourceId: accessLog.id,
        status: 'SUCCESS',
        details: {
          method,
          service: service.name,
          matchScore,
        },
      },
    });

    // Create notification for student
    await db.notification.create({
      data: {
        userId: studentId,
        type: 'VERIFICATION',
        title: 'Identity Verified',
        message: `Your identity was verified at ${service.name} using ${method.toLowerCase().replace('_', ' ')}.`,
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
