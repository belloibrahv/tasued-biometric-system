import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/lib/services/user-service';

// GET /api/users
// Fetch all users (admin) or search users
export async function GET(request: NextRequest) {
  try {
    // Get user info from middleware headers
    const userIdFromToken = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userIdFromToken) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can fetch all users
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to fetch users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      // Search for a specific user by email
      const user = await UserService.getUserByEmail(email);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Don't return password hash
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json(userWithoutPassword);
    }

    // In a real implementation, this would return a list of users
    // For now, return an empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
// Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await UserService.userExists(email);
    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const user = await UserService.createUser({
      email,
      password,
      firstName,
      lastName,
      role
    });

    // Don't return password hash
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}