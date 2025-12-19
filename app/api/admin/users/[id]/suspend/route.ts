import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { suspend, reason } = await request.json();
    const userId = params.id;

    // Update user
    await db.user.update({
      where: { id: userId },
      data: {
        isSuspended: suspend,
        suspensionReason: suspend ? reason : null,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId,
        actorType: 'ADMIN',
        actorId: payload.id,
        actionType: suspend ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
        resourceType: 'USER',
        resourceId: userId,
        status: 'SUCCESS',
        details: { reason },
      },
    });

    // Create notification for user
    await db.notification.create({
      data: {
        userId,
        type: 'SECURITY',
        title: suspend ? 'Account Suspended' : 'Account Restored',
        message: suspend
          ? `Your account has been suspended. Reason: ${reason || 'Contact support for details.'}`
          : 'Your account has been restored. You can now access all services.',
      },
    });

    return NextResponse.json({
      message: suspend ? 'User suspended' : 'User unsuspended',
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
