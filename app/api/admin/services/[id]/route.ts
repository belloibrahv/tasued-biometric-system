import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { isActive, name, description } = await request.json();
    const serviceId = params.id;

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    const service = await db.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        actorType: 'ADMIN',
        actorId: payload.id,
        actionType: 'SERVICE_UPDATE',
        resourceType: 'SERVICE',
        resourceId: serviceId,
        status: 'SUCCESS',
        details: updateData,
      },
    });

    return NextResponse.json({ service });

  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
