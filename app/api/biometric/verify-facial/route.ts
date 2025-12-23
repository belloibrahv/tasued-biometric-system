import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { decryptData } from '@/lib/encryption';
import { BiometricVerificationService } from '@/lib/services/biometric-service';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    let operatorId: string | null = null;

    // Try custom token verification first
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        operatorId = payload.id;
      }
    }

    // Fallback to Supabase auth
    if (!operatorId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        operatorId = user.id;
      }
    }

    if (!operatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, facialImage, strictMode = false } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!facialImage) {
      return NextResponse.json({ error: 'Facial image is required' }, { status: 400 });
    }

    // Get stored biometric data
    const biometricData = await db.biometricData.findUnique({
      where: { userId },
    });

    if (!biometricData) {
      return NextResponse.json({ error: 'No biometric data found for user' }, { status: 404 });
    }

    if (!biometricData.facialTemplate) {
      return NextResponse.json({ error: 'User has not enrolled facial biometric' }, { status: 400 });
    }

    // Get the stored template and verify it's a valid JSON string
    const decryptedTemplate = decryptData(biometricData.facialTemplate);
    let storedEmbedding: number[];

    try {
      storedEmbedding = JSON.parse(decryptedTemplate);
    } catch (parseError) {
      console.error('Error parsing stored embedding:', parseError);
      return NextResponse.json({ error: 'Invalid stored biometric template' }, { status: 500 });
    }

    // Initialize biometric service
    const biometricService = BiometricVerificationService.getInstance();

    // Perform enhanced verification with multiple checks
    const verificationResult = await biometricService.enhancedVerifyFacialImage(
      facialImage,
      storedEmbedding,
      { strictMode }
    );

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: operatorId,
        actionType: 'BIOMETRIC_VERIFICATION',
        resourceType: 'BIOMETRIC',
        resourceId: biometricData.id,
        status: verificationResult.verified ? 'SUCCESS' : 'FAILED',
        details: {
          method: 'FACIAL',
          matchScore: verificationResult.matchScore,
          confidence: verificationResult.confidence,
          qualityScore: verificationResult.qualityScore,
          livenessCheck: verificationResult.livenessCheck,
          verified: verificationResult.verified,
          targetUserId: userId,
          strictMode
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      verified: verificationResult.verified,
      matchScore: verificationResult.matchScore,
      confidence: verificationResult.confidence,
      qualityScore: verificationResult.qualityScore,
      livenessCheck: verificationResult.livenessCheck,
      method: 'FACIAL',
      message: verificationResult.verified ? 'Biometric verification successful' : 'Biometric verification failed',
      details: verificationResult.details
    });

  } catch (error: any) {
    console.error('Biometric verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
