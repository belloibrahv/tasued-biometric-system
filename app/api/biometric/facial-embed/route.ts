import { NextRequest, NextResponse } from 'next/server';
import { BiometricVerificationService } from '@/lib/services/biometric-service';

export const dynamic = 'force-dynamic';

/**
 * Professional Facial Embedding Generation API
 * Generates high-quality 128-dimensional facial embeddings using TensorFlow.js for biometric authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body || {};

    if (!image) {
      return NextResponse.json({ error: 'image is required' }, { status: 400 });
    }

    // Validate base64 image
    if (!image.includes('data:image') && !image.startsWith('/9j/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    // Initialize biometric service
    const biometricService = BiometricVerificationService.getInstance();

    // Process the image and extract facial features
    const result = await biometricService.processFacialImageForEnrollment(image);

    if (!result.isValid || !result.livenessCheck) {
      return NextResponse.json({
        error: result.livenessCheck ? 'Invalid image format or quality' : 'Liveness check failed - image appears to be a photo',
        details: result.livenessCheck ? 'Image quality too low' : 'Spoofing attempt detected',
        isValid: result.isValid,
        livenessCheck: result.livenessCheck
      }, { status: 400 });
    }

    return NextResponse.json({
      embedding: result.embedding,
      quality: result.qualityScore,
      isValid: result.isValid,
      livenessCheck: result.livenessCheck,
      metadata: {
        dimension: 128,
        algorithm: 'TensorFlow.js-based Face Recognition',
        normalized: true,
        timestamp: new Date().toISOString(),
        qualityScore: result.qualityScore
      }
    });
  } catch (e: any) {
    console.error('Facial embedding error:', e);
    return NextResponse.json({
      error: e.message || 'Failed to compute facial embedding'
    }, { status: 500 });
  }
}
