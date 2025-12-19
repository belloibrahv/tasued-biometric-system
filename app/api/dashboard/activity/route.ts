import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get recent access logs with service info
    const accessLogs = await db.accessLog.findMany({
      where: { userId: payload.id },
      include: {
        service: {
          select: { name: true, slug: true, icon: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
    });

    // Get total count for pagination
    const total = await db.accessLog.count({
      where: { userId: payload.id },
    });

    // Format the response
    const activities = accessLogs.map(log => ({
      id: log.id,
      service: log.service.name,
      serviceSlug: log.service.slug,
      serviceIcon: log.service.icon,
      action: log.verificationMethod === 'QR_CODE' ? 'QR Scan' :
              log.verificationMethod === 'FINGERPRINT' ? 'Fingerprint' :
              log.verificationMethod === 'FACIAL' ? 'Face ID' : 'Manual',
      status: log.status,
      location: log.location || 'Unknown',
      timestamp: log.timestamp,
      biometricScore: log.biometricMatchScore,
    }));

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
