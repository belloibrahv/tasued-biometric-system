import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db, { connectDb } from '@/lib/db';
import UserService from '@/lib/services/user-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDb();

    // Use Supabase auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: error?.message }, { status: 401 });
    }

    // Check if user is admin
    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isAdmin = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'OPERATOR';

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
    let [users, total] = await Promise.all([
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

    // If no users found in database, try to sync from Supabase Auth
    if (total === 0) {
      console.log('No users found in database, attempting to sync from Supabase Auth...');
      
      try {
        // Get all users from Supabase Auth
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        
        if (!authError && authUsers && authUsers.length > 0) {
          console.log(`Found ${authUsers.length} users in Supabase Auth, syncing to database...`);
          
          // Sync each user to the database
          for (const authUser of authUsers) {
            try {
              await UserService.syncUserFromAuth(authUser);
            } catch (syncErr) {
              console.error(`Failed to sync user ${authUser.id}:`, syncErr);
            }
          }
          
          // Re-fetch users from database after sync
          [users, total] = await Promise.all([
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
        }
      } catch (syncError) {
        console.error('Error syncing users from Supabase Auth:', syncError);
        // Continue anyway - return empty list if sync fails
      }
    }

    // Ensure all users have valid names
    const sanitizedUsers = users.map(u => ({
      ...u,
      firstName: u.firstName || 'Unknown',
      lastName: u.lastName || 'User',
    }));

    return NextResponse.json({
      users: sanitizedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
