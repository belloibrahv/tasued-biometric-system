import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/export/[id]/download - Download an export
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const exportRecord = await db.dataExport.findUnique({
      where: { id: params.id },
    });

    if (!exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    // Check ownership
    if (exportRecord.userId !== payload.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if expired
    if (new Date() > exportRecord.expiresAt) {
      await db.dataExport.update({
        where: { id: params.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json({ error: 'Export has expired' }, { status: 410 });
    }

    // Check if ready
    if (exportRecord.status !== 'READY') {
      return NextResponse.json({
        error: 'Export is not ready yet',
        status: exportRecord.status,
      }, { status: 400 });
    }

    // Update download status
    await db.dataExport.update({
      where: { id: params.id },
      data: {
        status: 'DOWNLOADED',
        downloadedAt: new Date(),
      },
    });

    // In a real implementation, this would return the actual file
    // For now, return a mock response
    return NextResponse.json({
      message: 'Download started',
      exportId: params.id,
      format: exportRecord.format,
      categories: exportRecord.categories,
    });
  } catch (error) {
    console.error('Error downloading export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
