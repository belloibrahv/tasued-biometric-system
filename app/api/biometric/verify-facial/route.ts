import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { decryptData } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

// Cosine similarity function for comparing face embeddings
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, facialImage } = body;

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

    // Generate embedding for the captured image
    const embedRes = await fetch(`${request.nextUrl.origin}/api/biometric/facial-embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: facialImage }),
    });

    if (!embedRes.ok) {
      return NextResponse.json({ error: 'Failed to process facial image' }, { status: 500 });
    }

    const { embedding: capturedEmbedding } = await embedRes.json();

    // Decrypt and parse stored embedding
    const decryptedTemplate = decryptData(biometricData.facialTemplate);
    const storedEmbedding = JSON.parse(decryptedTemplate);

    // Calculate similarity
    const similarity = cosineSimilarity(capturedEmbedding, storedEmbedding);
    const matchScore = similarity * 100;
    const threshold = 85; // 85% similarity threshold

    const verified = matchScore >= threshold;

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: payload.id,
        actorType: payload.type === 'admin' ? 'ADMIN' : 'STUDENT',
        actorId: payload.id,
        actionType: 'BIOMETRIC_VERIFICATION',
        resourceType: 'BIOMETRIC',
        resourceId: biometricData.id,
        status: verified ? 'SUCCESS' : 'FAILED',
        details: {
          method: 'FACIAL',
          matchScore: matchScore.toFixed(2),
          verified,
          targetUserId: userId,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      verified,
      matchScore: parseFloat(matchScore.toFixed(2)),
      method: 'FACIAL',
      message: verified ? 'Biometric verification successful' : 'Biometric verification failed',
    });

  } catch (error: any) {
    console.error('Biometric verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
