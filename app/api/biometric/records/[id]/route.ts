import { NextRequest, NextResponse } from 'next/server';
import BiometricService from '@/lib/services/biometric-service';
import { validateBiometricRecord } from '@/lib/security/validation';
import { biometricRateLimiter, withRateLimit } from '@/lib/security/rate-limit';
import db from '@/lib/db';

// GET /api/biometric/records/[id]
// Fetch a specific biometric record by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordId = params.id;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const record = await BiometricService.getBiometricRecord(recordId);

    if (!record) {
      return NextResponse.json(
        { error: 'Biometric record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to access this record (owners or admins)
    if (record.userId !== userIdFromToken && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to access this record' },
        { status: 403 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching biometric record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch biometric record' },
      { status: 500 }
    );
  }
}

// PUT /api/biometric/records/[id]
// Update a specific biometric record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordId = params.id;
    const body = await request.json();

    const { biometricData, confidenceScore, metadata } = body;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Get the existing record to check ownership
    const existingRecord = await db.biometricRecord.findUnique({
      where: { id: recordId }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Biometric record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this record (owners or admins)
    if (existingRecord.userId !== userIdFromToken && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update this record' },
        { status: 403 }
      );
    }

    // Validate the input
    const validation = validateBiometricRecord({
      userId: existingRecord.userId,
      biometricType: existingRecord.biometricType,
      biometricData: biometricData || '',
      confidenceScore
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const updatedRecord = await BiometricService.updateBiometricRecord({
      recordId,
      biometricData,
      confidenceScore,
      metadata
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating biometric record:', error);
    return NextResponse.json(
      { error: 'Failed to update biometric record' },
      { status: 500 }
    );
  }
}

// DELETE /api/biometric/records/[id]
// Delete a specific biometric record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordId = params.id;

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Get the existing record to check ownership
    const existingRecord = await db.biometricRecord.findUnique({
      where: { id: recordId }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Biometric record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this record (owners or admins)
    if (existingRecord.userId !== userIdFromToken && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this record' },
        { status: 403 }
      );
    }

    const success = await BiometricService.deleteBiometricRecord(recordId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete biometric record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Biometric record deleted successfully' });
  } catch (error) {
    console.error('Error deleting biometric record:', error);
    return NextResponse.json(
      { error: 'Failed to delete biometric record' },
      { status: 500 }
    );
  }
}