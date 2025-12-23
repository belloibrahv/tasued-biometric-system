import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
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

    // Get active access (people currently inside - no exit time)
    const activeAccess = await db.serviceAccess.findMany({
      where: {
        serviceId,
        exitTime: null,
        status: 'SUCCESS',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricNumber: true,
            department: true,
            level: true,
          },
        },
      },
      orderBy: { entryTime: 'desc' },
    });

    return NextResponse.json({ activeAccess });
  } catch (error) {
    console.error('Get active access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
