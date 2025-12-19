import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { encryptData } from '@/lib/encryption';

// POST /api/import - Import biometric data from external sources
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceSystem = formData.get('sourceSystem') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Read the file contents
    const fileBuffer = await file.arrayBuffer();
    const fileText = new TextDecoder().decode(fileBuffer);

    // Parse the import data based on file extension
    let importData: any = null;
    let format: string = '';

    if (file.name.endsWith('.json')) {
      format = 'JSON';
      importData = JSON.parse(fileText);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Supported formats: JSON' },
        { status: 400 }
      );
    }

    // Validate the import data
    if (!importData || !importData.biometricData) {
      return NextResponse.json(
        { error: 'Invalid import data format' },
        { status: 400 }
      );
    }

    // Update biometric data
    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (importData.biometricData.fingerprint) {
      updateData.fingerprintTemplate = encryptData(importData.biometricData.fingerprint);
      updateData.fingerprintQuality = importData.biometricData.fingerprintQuality || 100;
    }

    if (importData.biometricData.facial) {
      updateData.facialTemplate = encryptData(importData.biometricData.facial);
      updateData.facialQuality = importData.biometricData.facialQuality || 100;
    }

    await db.biometricData.upsert({
      where: { userId: payload.id },
      update: updateData,
      create: {
        userId: payload.id,
        ...updateData,
      },
    });

    // Log the import
    await db.auditLog.create({
      data: {
        userId: payload.id,
        actorType: 'STUDENT',
        actorId: payload.id,
        actionType: 'BIOMETRIC_IMPORT',
        resourceType: 'BIOMETRIC_DATA',
        resourceId: payload.id,
        details: {
          source: sourceSystem || 'unknown',
          format,
          importDate: new Date().toISOString(),
        },
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Biometric data imported successfully',
      format,
      source: sourceSystem,
    });
  } catch (error: any) {
    console.error('Error importing biometric data:', error);
    return NextResponse.json(
      { error: 'Failed to import biometric data', details: error.message },
      { status: 500 }
    );
  }
}
