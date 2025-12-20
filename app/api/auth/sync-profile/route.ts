import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

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
      id, // Optional: Accept ID from Supabase Auth
    } = body;

    // Validation
    if (!firstName || !lastName || !matricNumber || !email || !phoneNumber || !dateOfBirth || !department || !level) {
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

    // Check for password length - NO LONGER NEEDED AS PASSWORDS ARE IN SUPABASE


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

    // Use a single transaction for all creation steps to ensure atomicity and speed
    const user = await db.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          id: id,
          firstName,
          lastName,
          otherNames: otherNames || null,
          matricNumber: matricNumber.toUpperCase(),
          email: email.toLowerCase(),
          phoneNumber,
          dateOfBirth: new Date(dateOfBirth),
          department,
          level,
          isActive: true,
        },
      });

      // 2. Create biometric data placeholder
      await tx.biometricData.create({
        data: {
          userId: newUser.id,
        },
      });

      // 3. Create initial QR code
      const qrCode = `BIOVAULT-${newUser.matricNumber}-${Date.now()}`;
      await tx.qRCode.create({
        data: {
          userId: newUser.id,
          code: qrCode,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // 4. Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          actorType: 'STUDENT',
          actorId: newUser.id,
          actionType: 'REGISTRATION',
          resourceType: 'USER',
          resourceId: newUser.id,
          status: 'SUCCESS',
          details: { department, level },
        },
      });

      return newUser;
    });

    return NextResponse.json({
      message: 'Profile synchronized successfully',
      user: {
        id: user.id,
        matricNumber: user.matricNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Sync profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
