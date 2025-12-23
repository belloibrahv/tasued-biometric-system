import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db, { connectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDb();

    // Use Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: error?.message }, { status: 401 });
    }

    const profile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        phoneNumber: true,
        department: true,
        level: true,
        dateOfBirth: true,
        profilePhoto: true,
        biometricEnrolled: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDb();

    // Use Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: error?.message }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, otherNames, phoneNumber, department, level } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        otherNames: otherNames?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
        department: department?.trim() || null,
        level: level || null,
      },
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        otherNames: true,
        phoneNumber: true,
        department: true,
        level: true,
        dateOfBirth: true,
        profilePhoto: true,
        biometricEnrolled: true,
        createdAt: true,
      },
    });

    // Log the profile update
    await db.auditLog.create({
      data: {
        userId: user.id,
        actionType: 'PROFILE_UPDATE',
        resourceType: 'User',
        resourceId: user.id,
        newValues: { firstName, lastName, otherNames, phoneNumber, department, level },
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({ profile: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
