import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

// GET - Get current QR code
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      // Try custom token verification first
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    // If custom token didn't work, try Supabase auth
    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        matricNumber: true,
        firstName: true,
        lastName: true,
        department: true,
        level: true,
        profilePhoto: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create active QR code
    let qrCode = await db.qRCode.findFirst({
      where: {
        userId: userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no valid QR code, create a new one
    if (!qrCode) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

      // Generate a unique ID for this QR code session
      const sessionId = crypto.randomBytes(8).toString('hex');
      const code = `BIOVAULT-${user.matricNumber}-${Date.now()}-${sessionId}`;

      qrCode = await db.qRCode.create({
        data: {
          userId: userId,
          code,
          isActive: true,
          expiresAt,
        },
      });
    }

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(qrCode.expiresAt);
    const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        url: `${request.nextUrl.origin}/api/verify-qr/${encodeURIComponent(qrCode.code)}`, // Public verification URL
        expiresAt: qrCode.expiresAt,
        secondsRemaining,
        usageCount: qrCode.usageCount,
      },
      user: {
        matricNumber: user.matricNumber,
        fullName: `${user.firstName} ${user.lastName}`,
        department: user.department,
        level: user.level,
        profilePhoto: user.profilePhoto,
      },
    });

  } catch (error) {
    console.error('QR code fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Refresh QR code
export async function POST(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      // Try custom token verification first
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    // If custom token didn't work, try Supabase auth
    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { matricNumber: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deactivate old QR codes
    await db.qRCode.updateMany({
      where: { userId: userId, isActive: true },
      data: { isActive: false },
    });

    // Create new QR code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const sessionId = crypto.randomBytes(8).toString('hex');
    const code = `BIOVAULT-${user.matricNumber}-${Date.now()}-${sessionId}`;

    const qrCode = await db.qRCode.create({
      data: {
        userId: userId,
        code,
        isActive: true,
        expiresAt,
      },
    });

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        url: `${request.nextUrl.origin}/api/verify-qr/${encodeURIComponent(qrCode.code)}`,
        expiresAt: qrCode.expiresAt,
        secondsRemaining: 300, // 5 minutes
      },
    });

  } catch (error) {
    console.error('QR code refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
