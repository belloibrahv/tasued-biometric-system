import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check auth using Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/operator
    const userType = user.user_metadata?.type;
    const role = user.user_metadata?.role;
    const isAuthorized = userType === 'admin' || 
                         role === 'ADMIN' || 
                         role === 'SUPER_ADMIN' || 
                         role === 'OPERATOR';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
    }

    const searchTerm = query.trim();

    // Search by matric number, email, first name, or last name
    const users = await db.user.findMany({
      where: {
        OR: [
          { matricNumber: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        matricNumber: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        level: true,
        profilePhoto: true,
        biometricEnrolled: true,
        isActive: true,
        createdAt: true,
      },
      take: 10,
      orderBy: { lastName: 'asc' },
    });

    if (users.length === 0) {
      return NextResponse.json({ 
        students: [],
        message: 'No students found matching your search' 
      });
    }

    return NextResponse.json({
      students: users,
      total: users.length,
    });

  } catch (error) {
    console.error('Student search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
