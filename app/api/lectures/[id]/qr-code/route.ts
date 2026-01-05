import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

function isAdminOrOperator(req: NextRequest) {
  const type = req.headers.get('x-user-type');
  const role = req.headers.get('x-user-role');
  return type === 'admin' && (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR');
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const format = req.nextUrl.searchParams.get('format') || 'data-url'; // 'data-url' or 'svg'

    // Verify session exists
    const session = await db.lectureSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate QR code data - use the session ID as the code
    const qrData = sessionId;

    let qrCode: string;

    if (format === 'svg') {
      qrCode = await QRCode.toString(qrData, {
        type: 'image/svg+xml',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return new NextResponse(qrCode, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } else {
      // Default: data-url (PNG)
      qrCode = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return NextResponse.json({
        sessionId,
        courseCode: session.courseCode,
        courseName: session.courseName,
        venue: session.venue,
        startTime: session.startTime,
        endTime: session.endTime,
        qrCode,
        format: 'data-url',
      });
    }
  } catch (error: any) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
