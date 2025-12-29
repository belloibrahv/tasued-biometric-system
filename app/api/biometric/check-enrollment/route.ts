import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Internal API to check biometric enrollment status from database
 * Used by middleware to verify enrollment when session metadata is stale
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow internal calls
    const internalCheck = request.headers.get('x-internal-check');
    if (internalCheck !== 'true') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check database for biometric enrollment
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        biometricEnrolled: true,
        biometricData: {
          select: {
            facialTemplate: true,
            fingerprintTemplate: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ enrolled: false, reason: 'user_not_found' });
    }

    // Check both the flag and actual biometric data
    const hasActualBiometricData = user.biometricData && (
      !!user.biometricData.facialTemplate || 
      !!user.biometricData.fingerprintTemplate
    );

    const enrolled = user.biometricEnrolled || hasActualBiometricData;

    return NextResponse.json({ 
      enrolled,
      biometricEnrolled: user.biometricEnrolled,
      hasData: hasActualBiometricData
    });

  } catch (error: any) {
    console.error('Check enrollment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
