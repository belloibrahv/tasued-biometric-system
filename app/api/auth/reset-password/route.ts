import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import crypto from 'crypto';

// Simple in-memory token store (use Redis/DB in production)
const resetTokens = new Map<string, { email: string; expires: Date }>();

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (new Date() > tokenData.expires) {
      resetTokens.delete(token);
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: tokenData.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete used token
    resetTokens.delete(token);

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'SECURITY',
        title: 'Password Changed',
        message: 'Your password has been successfully changed. If this was not you, contact support immediately.',
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorType: 'STUDENT',
        actorId: user.id,
        actionType: 'PASSWORD_RESET',
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


