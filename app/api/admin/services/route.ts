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
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const services = await db.service.findMany({
      orderBy: { name: 'asc' },
    });

    // Get connection counts
    const servicesWithCounts = await Promise.all(
      services.map(async (service) => {
        const connectionCount = await db.serviceConnection.count({
          where: { serviceId: service.id, isActive: true },
        });
        return { ...service, connectionCount };
      })
    );

    return NextResponse.json({ services: servicesWithCounts });

  } catch (error) {
    console.error('Admin services error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
