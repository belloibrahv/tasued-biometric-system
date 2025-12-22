import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import db, { connectDb } from '@/lib/db';
import UserService from '@/lib/services/user-service';

export const dynamic = 'force-dynamic';

/**
 * Sync all users from Supabase Auth to the database
 * This endpoint helps ensure data consistency between Auth and DB
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure database connection
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
        message: 'No users to sync',
        synced: 0,
        failed: 0,
      });
    }

    // Sync each user
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const authUser of authUsers) {
      try {
        await UserService.syncUserFromAuth(authUser);
        synced++;
      } catch (err: any) {
        failed++;
        errors.push({
          userId: authUser.id,
          email: authUser.email,
          error: err.message,
        });
        console.error(`Failed to sync user ${authUser.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} users, ${failed} failed`,
      synced,
      failed,
      errors: failed > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Sync users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check sync status
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

    // Get counts
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const dbUserCount = await db.user.count();

    return NextResponse.json({
      authUserCount: authUsers?.length || 0,
      dbUserCount,
      synced: dbUserCount === (authUsers?.length || 0),
    });

  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
