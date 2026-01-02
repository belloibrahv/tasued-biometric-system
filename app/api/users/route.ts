import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/users - Get current user or search users (admin)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    // If specific user ID requested
    if (userId) {
      const user = await db.user.findUnique({
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
          profilePhoto: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    // Return current user
    const user = await db.user.findUnique({
      where: { id: payload.id },
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
        profilePhoto: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users - Update current user
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
      request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phoneNumber, profilePhoto } = body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (profilePhoto) updateData.profilePhoto = profilePhoto;

    const user = await db.user.update({
      where: { id: payload.id },
      data: updateData,
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
