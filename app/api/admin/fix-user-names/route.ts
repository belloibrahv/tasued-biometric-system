import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db, { connectDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Fix user names by syncing from Supabase Auth metadata
 * This endpoint updates all users who have "Unknown" firstName or "User" lastName
 */
export async function POST(request: NextRequest) {
  try {
    await connectDb();

    // Verify admin access
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isAdmin = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all users from Supabase Auth
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json({ 
        error: 'Failed to fetch users from Supabase Auth',
        details: authError.message 
      }, { status: 500 });
    }

    if (!authUsers || authUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to fix',
        fixed: 0,
      });
    }

    // Find users with Unknown names and fix them
    let fixed = 0;
    let skipped = 0;
    const results: any[] = [];

    for (const authUser of authUsers) {
      const metadata = authUser.user_metadata || {};
      
      // Handle both firstName/lastName and full_name formats
      let firstName = metadata.firstName || metadata.first_name;
      let lastName = metadata.lastName || metadata.last_name;
      
      // Parse full_name if firstName/lastName not available
      const fullNameValue = metadata.full_name || metadata.fullName;
      if (!firstName && !lastName && fullNameValue) {
        const nameParts = fullNameValue.trim().split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || null;
      }

      // Skip if no name in metadata
      if (!firstName && !lastName) {
        skipped++;
        continue;
      }

      // Check if user exists in DB with Unknown name
      const dbUser = await db.user.findUnique({
        where: { id: authUser.id },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!dbUser) {
        skipped++;
        continue;
      }

      // Only update if current name is Unknown/User
      if (dbUser.firstName === 'Unknown' || dbUser.lastName === 'User') {
        try {
          await db.user.update({
            where: { id: authUser.id },
            data: {
              firstName: firstName || dbUser.firstName,
              lastName: lastName || dbUser.lastName,
            }
          });
          fixed++;
          results.push({
            email: dbUser.email,
            oldName: `${dbUser.firstName} ${dbUser.lastName}`,
            newName: `${firstName || dbUser.firstName} ${lastName || dbUser.lastName}`,
          });
        } catch (err) {
          console.error(`Failed to fix user ${authUser.id}:`, err);
        }
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed} users, skipped ${skipped}`,
      fixed,
      skipped,
      results,
    });

  } catch (error) {
    console.error('Fix user names error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check how many users need fixing
 */
export async function GET(request: NextRequest) {
  try {
    await connectDb();

    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isAdmin = userType === 'admin' || role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Count users with Unknown names
    const unknownCount = await db.user.count({
      where: {
        OR: [
          { firstName: 'Unknown' },
          { lastName: 'User' },
        ]
      }
    });

    const totalCount = await db.user.count();

    return NextResponse.json({
      totalUsers: totalCount,
      usersNeedingFix: unknownCount,
      percentageNeedingFix: totalCount > 0 ? ((unknownCount / totalCount) * 100).toFixed(1) : 0,
    });

  } catch (error) {
    console.error('Check user names error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
