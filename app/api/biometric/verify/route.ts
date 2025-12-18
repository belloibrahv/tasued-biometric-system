import { NextRequest, NextResponse } from 'next/server';
import BiometricService from '@/lib/services/biometric-service';

// POST /api/biometric/verify
// Verify a biometric sample against stored templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, biometricType, biometricData, threshold } = body;

    if (!userId || !biometricType || !biometricData) {
      return NextResponse.json(
        { error: 'userId, biometricType, and biometricData are required' },
        { status: 400 }
      );
    }

    const result = await BiometricService.verifyBiometric(
      userId,
      biometricType,
      biometricData,
      threshold
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying biometric:', error);
    return NextResponse.json(
      { error: 'Failed to verify biometric' },
      { status: 500 }
    );
  }
}