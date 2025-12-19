import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/export - Get user's export history
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const exports = await db.dataExport.findMany({
      where: { userId: payload.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error('Error fetching exports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/export - Create a new data export
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { format, categories, isEncrypted } = body;

    if (!format || !categories || categories.length === 0) {
      return NextResponse.json(
        { error: 'Format and categories are required' },
        { status: 400 }
      );
    }

    // Create export record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours expiry

    const exportRecord = await db.dataExport.create({
      data: {
        userId: payload.id,
        format: format.toUpperCase(),
        categories,
        isEncrypted: isEncrypted || false,
        status: 'PROCESSING',
        expiresAt,
      },
    });

    // In a real implementation, this would trigger a background job
    // For now, we'll simulate completion
    setTimeout(async () => {
      await db.dataExport.update({
        where: { id: exportRecord.id },
        data: {
          status: 'READY',
          fileSize: BigInt(Math.floor(Math.random() * 5000000) + 500000), // Random size
          filePath: `/exports/${exportRecord.id}.${format.toLowerCase()}`,
        },
      });
    }, 3000);

    return NextResponse.json({
      message: 'Export started',
      exportId: exportRecord.id,
      status: 'PROCESSING',
      expiresAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
