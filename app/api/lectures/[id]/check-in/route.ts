import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { VerificationMethod, VerificationStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

function isAllowed(req: NextRequest) {
  const type = req.headers.get('x-user-type');
  const role = req.headers.get('x-user-role');
  // Operators and admins can check in students; students can self check-in
  return type === 'admin' || type === 'student';
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAllowed(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const sessionId = params.id;
    const byUserId = req.headers.get('x-user-id') || undefined;
    const body = await req.json();
    const { userId, method, matchScore, location, deviceId } = body || {};

    const methodEnum = (method as VerificationMethod) || 'QR_CODE';
    if (!['FINGERPRINT','FACIAL','IRIS','QR_CODE','MANUAL'].includes(String(methodEnum))) {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
    }

    const targetUserId = userId || byUserId; // students can self check-in
    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    // ensure session exists and active
    const session = await db.lectureSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const now = new Date();
    const status: VerificationStatus = 'SUCCESS';

    const att = await db.lectureAttendance.upsert({
      where: { lectureSessionId_userId: { lectureSessionId: sessionId, userId: targetUserId } },
      create: {
        lectureSessionId: sessionId,
        userId: targetUserId,
        method: methodEnum,
        status,
        checkInTime: now,
        matchScore: typeof matchScore === 'number' ? matchScore : null,
        location: location || null,
        deviceId: deviceId || null,
      },
      update: {
        // idempotent: if already exists, keep original check-in but update method/score if provided
        method: methodEnum,
        matchScore: typeof matchScore === 'number' ? matchScore : undefined,
        location: location || undefined,
        deviceId: deviceId || undefined,
      },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    // Audit log
    try {
      const actorTypeHeader = req.headers.get('x-user-type');
      const actorRole = req.headers.get('x-user-role');
      const actorType = actorTypeHeader === 'student'
        ? 'STUDENT'
        : (actorRole === 'OPERATOR' ? 'OPERATOR' : 'ADMIN');
      await db.auditLog.create({
        data: {
          userId: targetUserId,
          actorType,
          actorId: byUserId || targetUserId,
          actionType: 'LECTURE_CHECK_IN',
          resourceType: 'LECTURE_SESSION',
          resourceId: sessionId,
          details: { method: methodEnum, matchScore },
          status: 'SUCCESS',
        },
      });
    } catch {}

    return NextResponse.json({ attendance: att }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to check in' }, { status: 500 });
  }
}
