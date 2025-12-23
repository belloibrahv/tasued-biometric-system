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
    const { qrCode, userId: directUserId } = body;

    // Get service
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ success: false, message: 'Service not found' }, { status: 404 });
    }

    if (!service.isActive) {
      return NextResponse.json({ success: false, message: 'Service is not active' }, { status: 400 });
    }

    // Check capacity
    if (service.maxCapacity && service.currentOccupancy >= service.maxCapacity) {
      return NextResponse.json({ 
        success: false, 
        message: 'Service is at maximum capacity' 
      }, { status: 400 });
    }

    let studentId = directUserId;
    let student: any = null;

    // If QR code provided, verify it
    if (qrCode) {
      // Extract code if it's a URL
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
              department: true,
              level: true,
              isActive: true,
            },
          },
        },
      });

      if (!qrRecord) {
        return NextResponse.json({ success: false, message: 'Invalid QR code' }, { status: 400 });
      }

      if (!qrRecord.isActive || new Date() > qrRecord.expiresAt) {
        return NextResponse.json({ success: false, message: 'QR code expired or inactive' }, { status: 400 });
      }

      if (!qrRecord.user.isActive) {
        return NextResponse.json({ success: false, message: 'Student account is inactive' }, { status: 400 });
      }

      studentId = qrRecord.user.id;
      student = qrRecord.user;

      // Update QR usage
      await db.qRCode.update({
        where: { id: qrRecord.id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      });
    }

    if (!studentId) {
      return NextResponse.json({ success: false, message: 'No student identified' }, { status: 400 });
    }

    // Check if student is already inside (no exit time)
    if (!service.allowMultipleEntry) {
      const existingAccess = await db.serviceAccess.findFirst({
        where: {
          userId: studentId,
          serviceId,
          exitTime: null,
        },
      });

      if (existingAccess) {
        return NextResponse.json({ 
          success: false, 
          message: 'Student is already inside. Please exit first.' 
        }, { status: 400 });
      }
    }

    // Get student info if not already fetched
    if (!student) {
      student = await db.user.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricNumber: true,
          department: true,
          level: true,
        },
      });
    }

    // Create access record
    const access = await db.serviceAccess.create({
      data: {
        userId: studentId,
        serviceId,
        method: 'QR_CODE',
        status: 'SUCCESS',
        operatorId: user.id,
      },
    });

    // Update service occupancy
    await db.service.update({
      where: { id: serviceId },
      data: { currentOccupancy: { increment: 1 } },
    });

    // Create access log
    await db.accessLog.create({
      data: {
        userId: studentId,
        serviceId,
        action: 'SERVICE_ENTRY',
        method: 'QR_CODE',
        status: 'SUCCESS',
        location: service.location || service.name,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        deviceInfo: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Entry recorded',
      student,
      access: {
        id: access.id,
        entryTime: access.entryTime,
      },
      service: {
        name: service.name,
        currentOccupancy: service.currentOccupancy + 1,
        maxCapacity: service.maxCapacity,
      },
    });
  } catch (error: any) {
    console.error('Service entry error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
