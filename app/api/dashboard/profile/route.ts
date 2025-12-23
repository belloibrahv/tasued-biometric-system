import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, otherNames, phoneNumber, department, level } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
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
    await prisma.auditLog.create({
      data: {
        userId,
        actionType: 'PROFILE_UPDATE',
        resourceType: 'User',
        resourceId: userId,
        newValues: { firstName, lastName, otherNames, phoneNumber, department, level },
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({ profile: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
