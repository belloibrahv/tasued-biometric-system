import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { VerificationStatus, VerificationMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const body = await req.json();
    const items: Array<{ userId?: string; qr?: string; method?: VerificationMethod }> = body?.items || [];
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'items is required' }, { status: 400 });

    const results: any[] = [];
    for (const it of items) {
      const targetUserId = it.userId; // QR parsing can map to userId if needed
      if (!targetUserId) { results.push({ ok: false, error: 'Missing userId' }); continue; }
      try {
        const now = new Date();
        const rec = await db.lectureAttendance.upsert({
          where: { lectureSessionId_userId: { lectureSessionId: sessionId, userId: targetUserId } },
          create: { lectureSessionId: sessionId, userId: targetUserId, method: it.method || 'QR_CODE', status: 'SUCCESS', checkInTime: now },
          update: { method: it.method || 'QR_CODE' },
        });
        results.push({ ok: true, id: rec.id, userId: targetUserId });
      } catch (err: any) {
        results.push({ ok: false, error: err.message, userId: targetUserId });
      }
    }

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Bulk check-in failed' }, { status: 500 });
  }
}
