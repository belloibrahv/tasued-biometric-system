import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const items = await db.lectureAttendance.findMany({
      where: { lectureSessionId: sessionId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { checkInTime: 'asc' },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to list attendance' }, { status: 500 });
  }
}
