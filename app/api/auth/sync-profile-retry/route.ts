import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

/**
 * Manual Profile Sync Retry Endpoint
 * Allows users to manually trigger profile synchronization if it failed during registration
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists in database
    const existingUser = await db.user.findUnique({
      where: { id: authUser.id }
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Profile already exists',
        user: existingUser 
      });
    }

    // Extract user metadata from Supabase Auth
    const metadata = authUser.user_metadata;
    
    if (!metadata.matric_number || !metadata.full_name) {
      return NextResponse.json({ 
        error: 'Incomplete user metadata. Please contact support.',
        details: 'Your account is missing required information.' 
      }, { status: 400 });
    }

    // Parse full name
    const nameParts = metadata.full_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const otherNames = nameParts.slice(1, -1).join(' ') || null;

    // Create user profile in database with transaction
    const user = await db.$transaction(async (tx) => {
      // 1. Create user
      const newUser = await tx.user.create({
        data: {
          id: authUser.id,
          firstName,
          lastName,
          otherNames,
          matricNumber: metadata.matric_number.toUpperCase(),
          email: authUser.email!.toLowerCase(),
          phoneNumber: metadata.phone_number || '',
          dateOfBirth: metadata.date_of_birth ? new Date(metadata.date_of_birth) : new Date('2000-01-01'),
          department: metadata.department || 'Not Specified',
          level: metadata.level || '100',
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
          actionType: 'PROFILE_SYNC',
          resourceType: 'USER',
          resourceId: newUser.id,
          status: 'SUCCESS',
          details: { method: 'manual_retry', department: newUser.department, level: newUser.level },
        },
      });

      return newUser;
    });

    return NextResponse.json({
      success: true,
      message: 'Profile synchronized successfully',
      user: {
        id: user.id,
        matricNumber: user.matricNumber,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

  } catch (error: any) {
    console.error('Profile sync retry error:', error);
    
    // Handle specific errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Profile already exists with this email or matric number',
        details: error.message 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Failed to sync profile',
      details: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
