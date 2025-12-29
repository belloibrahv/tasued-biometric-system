import { NextRequest, NextResponse } from 'next/server';
import { BiometricVerificationService } from '@/lib/services/biometric-service';

// Add caching for performance optimization
const embeddingCache = new Map<string, { embedding: number[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Create a hash of the image to use as cache key
    const encoder = new TextEncoder();
    const data = encoder.encode(image);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const imageHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check cache first
    const cached = embeddingCache.get(imageHash);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Using cached facial embedding');
      return NextResponse.json({
        embedding: cached.embedding,
        quality: 95,
        isValid: true,
        livenessCheck: true,
        metadata: {
          dimension: 128,
          algorithm: 'TensorFlow.js-based Face Recognition',
          normalized: true,
          timestamp: new Date().toISOString(),
          qualityScore: 95
        }
      });
    }
    
    // Process the image and extract facial features
    // Add timeout to prevent long processing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Facial embedding processing timeout')), 10000); // 10 second timeout
    });
    
    const processingPromise = biometricService.processFacialImageForEnrollment(image);
    
    const result = await Promise.race([processingPromise, timeoutPromise]) as any;
    
    // Cache the result if it's valid
    if (result.isValid && result.embedding && result.embedding.length > 0) {
      embeddingCache.set(imageHash, {
        embedding: result.embedding,
        timestamp: Date.now()
      });
    }

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
