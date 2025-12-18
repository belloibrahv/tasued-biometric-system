import { NextRequest, NextResponse } from 'next/server';
import { BiometricRecord } from '@prisma/client';
import BiometricService from '@/lib/services/biometric-service';
import { validateBiometricRecord } from '@/lib/security/validation';
import { biometricRateLimiter, withRateLimit } from '@/lib/security/rate-limit';

// GET /api/biometric/records
// Fetch biometric records for a user or all records (admin)
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, biometricRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Get user info from middleware headers
    const userIdFromToken = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userIdFromToken) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let requestedUserId = searchParams.get('userId');

    // Non-admin users can only access their own records
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      requestedUserId = userIdFromToken;
    }

    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : 0;

    let records: BiometricRecord[] = [];

    if (requestedUserId) {
      records = await BiometricService.getUserBiometricRecords(requestedUserId);
    } else if (type) {
      records = await BiometricService.searchByBiometricType(type);
    } else {
      // In a real implementation, this would require admin privileges
      records = [];
    }

    // Apply pagination
    const paginatedRecords = records.slice(offset, offset + limit);

    return NextResponse.json({
      records: paginatedRecords,
      total: records.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching biometric records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric records' },
      { status: 500 }
    );
  }
}

// POST /api/biometric/records
// Create a new biometric record
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, biometricRateLimiter);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    // Get user info from middleware headers
    const userIdFromToken = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userIdFromToken) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { userId, biometricType, biometricData, templateFormat, confidenceScore, metadata } = body;

    // Non-admin users can only create records for themselves
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      userId = userIdFromToken;
    }

    // Validate the input
    const validation = validateBiometricRecord({
      userId,
      biometricType,
      biometricData,
      confidenceScore
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const record = await BiometricService.createBiometricRecord({
      userId,
      biometricType,
      biometricData,
      templateFormat,
      confidenceScore,
      metadata
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating biometric record:', error);
    return NextResponse.json(
      { error: 'Failed to create biometric record' },
      { status: 500 }
    );
  }
}