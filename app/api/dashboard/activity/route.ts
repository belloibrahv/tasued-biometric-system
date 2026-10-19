import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Get recent access logs with service info
    const accessLogs = await db.accessLog.findMany({
      where: { userId: userId },
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
      where: { userId: userId },
    });

    // Format the response
    const activities = accessLogs.map(log => ({
      id: log.id,
      service: log.service?.name || 'Unknown Service',
      serviceSlug: log.service?.slug || 'unknown',
      serviceIcon: log.service?.icon || null,
      action: log.method === 'QR_CODE' ? 'QR Scan' :
              log.method === 'FINGERPRINT' ? 'Fingerprint' :
              log.method === 'FACIAL' ? 'Face ID' :
              log.action || 'Manual',
      status: log.status,
      location: log.location || 'Unknown',
      timestamp: log.timestamp,
      confidenceScore: log.confidenceScore,
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
