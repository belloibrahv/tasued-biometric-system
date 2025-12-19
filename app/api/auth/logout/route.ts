import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        // Log the logout
        await db.auditLog.create({
          data: {
            userId: payload.type === 'student' ? payload.id : null,
            actorType: payload.type === 'admin' ? 'ADMIN' : 'STUDENT',
            actorId: payload.id,
            actionType: 'LOGOUT',
            resourceType: 'SESSION',
            resourceId: payload.id,
            status: 'SUCCESS',
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear the auth cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear the cookie even if there's an error
    const response = NextResponse.json({ message: 'Logged out' });
    response.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return response;
  }
}
