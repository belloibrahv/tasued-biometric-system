import { NextRequest, NextResponse } from 'next/server';
import UserService from '@/lib/services/user-service';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, firstName, and lastName are required' },
        { status: 400 }
      );
    }

    // Validation checks
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.userExists(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await UserService.createUser({
      email,
      password,
      firstName,
      lastName,
      role: 'USER', // Default role
    });

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    const token = generateToken(tokenPayload);

    // Don't return password hash
    const { password: _, ...userWithoutPassword } = user;

    // Return token and user data
    return NextResponse.json({ 
      message: 'Registration successful',
      token,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        role: userWithoutPassword.role,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}