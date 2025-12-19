import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

function getUserId(req: NextRequest) {
  return req.headers.get('x-user-id') || undefined;
}

function isAdminOrOperator(req: NextRequest) {
  const type = req.headers.get('x-user-type');
  const role = req.headers.get('x-user-role');
  return type === 'admin' && (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const course = searchParams.get('course');
    const dept = searchParams.get('department');
    const level = searchParams.get('level');
    const take = Number(searchParams.get('take') || 50);
    const skip = Number(searchParams.get('skip') || 0);

    const where: any = {};
    if (from || to) {
      where.startTime = {};
      if (from) where.startTime.gte = new Date(from);
      if (to) where.startTime.lte = new Date(to);
    }
    if (course) where.courseCode = course;
    if (dept) where.department = dept;
    if (level) where.level = level;

    const [items, total] = await Promise.all([
      db.lectureSession.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip,
        take,
      }),
      db.lectureSession.count({ where }),
    ]);

    return NextResponse.json({ items, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to list lecture sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdminOrOperator(req)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      courseCode,
      courseName,
      lecturer,
      venue,
      startTime,
      endTime,
      department,
      level,
    } = body || {};

    if (!courseCode || !courseName || !venue || !startTime || !endTime || !department || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: 'Invalid start/end time' }, { status: 400 });
    }

    const created = await db.lectureSession.create({
      data: {
        courseCode,
        courseName,
        lecturer: lecturer || null,
        venue,
        startTime: start,
        endTime: end,
        department,
        level,
        createdBy: getUserId(req) || 'system',
      },
    });

    return NextResponse.json({ session: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create lecture session' }, { status: 500 });
  }
}
