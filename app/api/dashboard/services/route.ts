import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

// GET - Fetch user's connected services
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

    // Get all services
    const allServices = await db.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get user's connections
    const userConnections = await db.serviceConnection.findMany({
      where: { userId: payload.id },
      include: { service: true },
    });

    const connectionMap = new Map(
      userConnections.map(conn => [conn.serviceId, conn])
    );

    // Combine data
    const services = allServices.map(service => {
      const connection = connectionMap.get(service.id);
      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        icon: service.icon,
        isConnected: connection?.isActive || false,
        connectedAt: connection?.connectedAt,
        lastAccessedAt: connection?.lastAccessedAt,
        accessCount: connection?.accessCount || 0,
        permissions: connection?.permissions || [],
      };
    });

    return NextResponse.json({ services });

  } catch (error) {
    console.error('Services fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Connect to a service
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

    const { serviceId, permissions = ['verify'] } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Check if service exists
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Create or update connection
    const connection = await db.serviceConnection.upsert({
      where: {
        userId_serviceId: {
          userId: payload.id,
          serviceId,
        },
      },
      update: {
        isActive: true,
        permissions,
        connectedAt: new Date(),
      },
      create: {
        userId: payload.id,
        serviceId,
        isActive: true,
        permissions,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: payload.id,
        actorType: 'STUDENT',
        actorId: payload.id,
        actionType: 'SERVICE_CONNECT',
        resourceType: 'SERVICE',
        resourceId: serviceId,
        status: 'SUCCESS',
        details: { serviceName: service.name },
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: payload.id,
        type: 'SERVICE',
        title: 'Service Connected',
        message: `You have successfully connected to ${service.name}.`,
      },
    });

    return NextResponse.json({
      message: 'Service connected successfully',
      connection,
    });

  } catch (error) {
    console.error('Service connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Disconnect from a service
export async function DELETE(request: NextRequest) {
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

    const serviceId = request.nextUrl.searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Update connection to inactive
    await db.serviceConnection.updateMany({
      where: {
        userId: payload.id,
        serviceId,
      },
      data: { isActive: false },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: payload.id,
        actorType: 'STUDENT',
        actorId: payload.id,
        actionType: 'SERVICE_DISCONNECT',
        resourceType: 'SERVICE',
        resourceId: serviceId,
        status: 'SUCCESS',
      },
    });

    return NextResponse.json({ message: 'Service disconnected successfully' });

  } catch (error) {
    console.error('Service disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
