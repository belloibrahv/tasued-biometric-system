import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

// Store reset tokens (in production, use database or Redis)
const resetTokens = new Map<string, { email: string; expires: Date }>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    resetTokens.set(resetToken, { email: user.email, expires });

    // In production, send email here
    // For demo, we'll log the token
    console.log(`Password reset token for ${email}: ${resetToken}`);

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'SECURITY',
        title: 'Password Reset Requested',
        message: 'A password reset was requested for your account. If this was not you, please secure your account.',
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorType: 'STUDENT',
        actorId: user.id,
        actionType: 'PASSWORD_RESET_REQUEST',
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // For demo purposes only - remove in production
      demoToken: resetToken,
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify reset token
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const tokenData = resetTokens.get(token);

  if (!tokenData) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  if (new Date() > tokenData.expires) {
    resetTokens.delete(token);
    return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, email: tokenData.email });
}


