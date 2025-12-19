import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const body = await req.json();
    const { userId } = body || {};
    const byUserId = req.headers.get('x-user-id') || undefined;
    const targetUserId = userId || byUserId;

    if (!targetUserId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const exists = await db.lectureAttendance.findUnique({ where: { lectureSessionId_userId: { lectureSessionId: sessionId, userId: targetUserId } } });
    if (!exists) return NextResponse.json({ error: 'Attendance not found' }, { status: 404 });

    const updated = await db.lectureAttendance.update({
      where: { lectureSessionId_userId: { lectureSessionId: sessionId, userId: targetUserId } },
      data: { checkOutTime: new Date() },
    });

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
          actionType: 'LECTURE_CHECK_OUT',
          resourceType: 'LECTURE_SESSION',
          resourceId: sessionId,
          details: {},
          status: 'SUCCESS',
        },
      });
    } catch {}

    return NextResponse.json({ attendance: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to check out' }, { status: 500 });
  }
}
