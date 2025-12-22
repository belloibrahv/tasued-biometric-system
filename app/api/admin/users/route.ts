import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('Admin users API - User:', user?.id, 'Error:', error?.message);
    console.log('Admin users API - Metadata:', user?.user_metadata);

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: error?.message }, { status: 401 });
    }

    // Check if user is admin
    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isAdmin = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR';

    console.log('Admin users API - userType:', userType, 'role:', role, 'isAdmin:', isAdmin);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden', userType, role }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matricNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === 'enrolled') {
      where.biometricEnrolled = true;
    } else if (filter === 'pending') {
      where.biometricEnrolled = false;
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          matricNumber: true,
          email: true,
          firstName: true,
          lastName: true,
          department: true,
          level: true,
          isActive: true,
          biometricEnrolled: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
