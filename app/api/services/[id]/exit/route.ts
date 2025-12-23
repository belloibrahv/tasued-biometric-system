import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceId = params.id;
    const body = await request.json();
    const { qrCode, accessId, userId: directUserId } = body;

    // Get service
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    let studentId = directUserId;
    let student = null;
    let accessRecord = null;

    // If accessId provided, use it directly
    if (accessId) {
      accessRecord = await db.serviceAccess.findUnique({
        where: { id: accessId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricNumber: true,
            },
          },
        },
      });

      if (!accessRecord) {
        return NextResponse.json({ success: false, message: 'Access record not found' }, { status: 404 });
      }

      if (accessRecord.exitTime) {
        return NextResponse.json({ success: false, message: 'Already exited' }, { status: 400 });
      }

      studentId = accessRecord.userId;
      student = accessRecord.user;
    }
    // If QR code provided, find the active access
    else if (qrCode) {
      let extractedCode = qrCode;
      if (qrCode.includes('/')) {
        try {
          const url = new URL(qrCode);
          const pathParts = url.pathname.split('/');
          extractedCode = pathParts[pathParts.length - 1] || qrCode;
          extractedCode = decodeURIComponent(extractedCode);
        } catch {
          extractedCode = qrCode;
        }
      }

      const qrRecord = await db.qRCode.findUnique({
        where: { code: extractedCode },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              matricNumber: true,
            },
          },
        },
      });

      if (!qrRecord) {
        return NextResponse.json({ success: false, message: 'Invalid QR code' }, { status: 400 });
      }

      studentId = qrRecord.user.id;
      student = qrRecord.user;

      // Find active access for this user
      accessRecord = await db.serviceAccess.findFirst({
        where: {
          userId: studentId,
          serviceId,
          exitTime: null,
        },
        orderBy: { entryTime: 'desc' },
      });

      if (!accessRecord) {
        return NextResponse.json({ 
          success: false, 
          message: 'No active entry found for this student' 
        }, { status: 400 });
      }

      // Update QR usage
      await db.qRCode.update({
        where: { id: qrRecord.id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    }

    if (!accessRecord) {
      return NextResponse.json({ success: false, message: 'No access record found' }, { status: 400 });
    }

    // Update access record with exit time
    await db.serviceAccess.update({
      where: { id: accessRecord.id },
      data: { exitTime: new Date() },
    });

    // Decrement service occupancy (ensure it doesn't go below 0)
    await db.service.update({
      where: { id: serviceId },
      data: { 
        currentOccupancy: { 
          decrement: service.currentOccupancy > 0 ? 1 : 0 
        } 
      },
    });

    // Create access log
    await db.accessLog.create({
      data: {
        userId: studentId,
        serviceId,
        action: 'SERVICE_EXIT',
        method: 'QR_CODE',
        status: 'SUCCESS',
        location: service.location || service.name,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        deviceInfo: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Calculate duration
    const entryTime = new Date(accessRecord.entryTime);
    const exitTime = new Date();
    const durationMinutes = Math.round((exitTime.getTime() - entryTime.getTime()) / 60000);

    return NextResponse.json({
      success: true,
      message: 'Exit recorded',
      student,
      duration: {
        minutes: durationMinutes,
        formatted: durationMinutes >= 60 
          ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
          : `${durationMinutes}m`,
      },
      service: {
        name: service.name,
        currentOccupancy: Math.max(0, service.currentOccupancy - 1),
      },
    });
  } catch (error: any) {
    console.error('Service exit error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
