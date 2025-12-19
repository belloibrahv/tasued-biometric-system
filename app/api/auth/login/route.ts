import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, loginType = 'student' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email/Matric number and password are required' },
        { status: 400 }
      );
    }

    // Handle admin/operator login
    if (loginType === 'admin' || loginType === 'operator') {
      const admin = await db.admin.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!admin) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (!admin.isActive) {
        return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Update last login
      await db.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });

      const token = await generateToken({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin',
        biometricEnrolled: true, // Admins don't need biometric enrollment
      });

      const isProduction = process.env.NODE_ENV === 'production';
      const response = NextResponse.json({
        message: 'Authentication successful',
        token,
        user: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          type: 'admin',
        },
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    }

    // Student login - find by email or matric number
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { matricNumber: email.toUpperCase() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: `Your account has been suspended. Reason: ${user.suspensionReason || 'Contact support.'}` },
        { status: 403 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorType: 'STUDENT',
        actorId: user.id,
        actionType: 'LOGIN',
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: 'STUDENT',
      matricNumber: user.matricNumber,
      type: 'student',
      biometricEnrolled: user.biometricEnrolled || false,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        matricNumber: user.matricNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        otherNames: user.otherNames,
        department: user.department,
        level: user.level,
        profilePhoto: user.profilePhoto,
        isEmailVerified: user.isEmailVerified,
        type: 'student',
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
