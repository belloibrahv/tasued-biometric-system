import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.type;
    const role = user.user_metadata?.role;
    if (userType !== 'admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'OPERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceId = params.id;
    const body = await request.json();

    // Build update data
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.maxCapacity !== undefined) updateData.maxCapacity = body.maxCapacity;
    if (body.currentOccupancy !== undefined) updateData.currentOccupancy = body.currentOccupancy;
    if (body.requiresBiometric !== undefined) updateData.requiresBiometric = body.requiresBiometric;
    if (body.allowMultipleEntry !== undefined) updateData.allowMultipleEntry = body.allowMultipleEntry;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const service = await db.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error('Update service error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.type;
    const role = user.user_metadata?.role;
    if (userType !== 'admin' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceId = params.id;

    await db.service.delete({
      where: { id: serviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete service error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
