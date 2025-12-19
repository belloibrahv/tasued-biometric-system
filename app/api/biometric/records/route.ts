import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/biometric/records - Get user's biometric data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const biometricData = await db.biometricData.findUnique({
      where: { userId: payload.id },
    });

    if (!biometricData) {
      return NextResponse.json({ error: 'No biometric data found' }, { status: 404 });
    }

    // Don't return actual templates, just metadata
    return NextResponse.json({
      id: biometricData.id,
      hasFingerprint: !!biometricData.fingerprintTemplate,
      fingerprintQuality: biometricData.fingerprintQuality,
      hasFacial: !!biometricData.facialTemplate,
      facialQuality: biometricData.facialQuality,
      enrolledAt: biometricData.enrolledAt,
      lastUpdated: biometricData.lastUpdated,
    });
  } catch (error) {
    console.error('Error fetching biometric data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/biometric/records - Update biometric data
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, template, quality } = body;

    if (!type || !['fingerprint', 'facial'].includes(type)) {
      return NextResponse.json({ error: 'Invalid biometric type' }, { status: 400 });
    }

    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (type === 'fingerprint') {
      updateData.fingerprintTemplate = template;
      updateData.fingerprintQuality = quality || 100;
    } else if (type === 'facial') {
      updateData.facialTemplate = template;
      updateData.facialQuality = quality || 100;
    }

    const biometricData = await db.biometricData.upsert({
      where: { userId: payload.id },
      update: updateData,
      create: {
        userId: payload.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      message: 'Biometric data updated successfully',
      type,
      quality: type === 'fingerprint' ? biometricData.fingerprintQuality : biometricData.facialQuality,
    });
  } catch (error) {
    console.error('Error updating biometric data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
