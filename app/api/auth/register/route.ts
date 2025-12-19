import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';
import { generateToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      otherNames,
      matricNumber,
      email,
      phoneNumber,
      dateOfBirth,
      department,
      level,
      password,
    } = body;

    // Validation
    if (!firstName || !lastName || !matricNumber || !email || !phoneNumber || !dateOfBirth || !department || !level || !password) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate matric number format (e.g., CSC/2020/001)
    const matricRegex = /^[A-Z]{2,4}\/\d{4}\/\d{3,4}$/i;
    if (!matricRegex.test(matricNumber)) {
      return NextResponse.json(
        { error: 'Invalid matric number format. Use format: DEP/YEAR/NUMBER (e.g., CSC/2020/001)' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { matricNumber: matricNumber.toUpperCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'A user with this matric number already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await db.user.create({
      data: {
        firstName,
        lastName,
        otherNames: otherNames || null,
        matricNumber: matricNumber.toUpperCase(),
        email: email.toLowerCase(),
        phoneNumber,
        dateOfBirth: new Date(dateOfBirth),
        department,
        level,
        password: hashedPassword,
        isEmailVerified: false,
        isActive: true,
        isSuspended: false,
      },
    });

    // Create biometric data placeholder
    await db.biometricData.create({
      data: {
        userId: user.id,
        fingerprintTemplate: null,
        fingerprintQuality: null,
        facialTemplate: null,
        facialQuality: null,
        facialPhotos: [],
      },
    });

    // Generate initial QR code
    const qrExpiry = new Date();
    qrExpiry.setDate(qrExpiry.getDate() + 30);
    const qrCode = `BIOVAULT-${user.matricNumber}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    await db.qRCode.create({
      data: {
        userId: user.id,
        code: qrCode,
        isActive: true,
        expiresAt: qrExpiry,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        actorType: 'STUDENT',
        actorId: user.id,
        actionType: 'REGISTRATION',
        resourceType: 'USER',
        resourceId: user.id,
        status: 'SUCCESS',
        details: { department, level },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Welcome to TASUED BioVault!',
        message: 'Your account has been created successfully. Please complete your biometric enrollment to access all services.',
      },
    });

    // Generate JWT token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: 'STUDENT',
      matricNumber: user.matricNumber,
      type: 'student',
      biometricEnrolled: false, // New users haven't enrolled yet
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        matricNumber: user.matricNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        level: user.level,
        type: 'student',
      },
    }, { status: 201 });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
