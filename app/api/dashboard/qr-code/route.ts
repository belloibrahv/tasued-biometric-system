import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';
import QRCode from 'qrcode';
import UserService from '@/lib/services/user-service';

// GET - Get current QR code
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    let authUser: any = null;

    if (token) {
      // Try custom token verification first
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    // If custom token didn't work, try Supabase auth
    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
      authUser = user;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Always get the Supabase auth user for metadata access (needed to fix Unknown User issue)
    if (!authUser) {
      const supabase = createClient();
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      authUser = supaUser;
    }

    // Get user info
    let user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        matricNumber: true,
        firstName: true,
        lastName: true,
        department: true,
        level: true,
        profilePhoto: true,
      },
    });

    // If user not found in DB, try to sync from Supabase Auth
    if (!user && authUser) {
      console.log(`QR Code: Syncing user ${userId} from Supabase Auth`);
      try {
        const syncedUser = await UserService.syncUserFromAuth(authUser);
        user = {
          id: syncedUser.id,
          matricNumber: syncedUser.matricNumber,
          firstName: syncedUser.firstName,
          lastName: syncedUser.lastName,
          department: syncedUser.department,
          level: syncedUser.level,
          profilePhoto: syncedUser.profilePhoto,
        };
      } catch (syncError) {
        console.error('QR Code: User sync failed:', syncError);
      }
    }
    
    // If user exists but has "Unknown User" name, try to update from Supabase metadata
    if (user && authUser && (user.firstName === 'Unknown' || user.lastName === 'User')) {
      console.log(`QR Code: User has Unknown name, attempting to update from Supabase metadata`);
      const metadata = authUser.user_metadata || {};
      console.log('Supabase metadata:', JSON.stringify(metadata, null, 2));
      
      // Handle both firstName/lastName and full_name formats
      let newFirstName = metadata.firstName || metadata.first_name;
      let newLastName = metadata.lastName || metadata.last_name;
      
      // Parse full_name if firstName/lastName not available
      const fullNameValue = metadata.full_name || metadata.fullName;
      if (!newFirstName && !newLastName && fullNameValue) {
        const nameParts = fullNameValue.trim().split(' ');
        newFirstName = nameParts[0];
        newLastName = nameParts.slice(1).join(' ') || null;
      }
      
      if (newFirstName || newLastName) {
        try {
          const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
              firstName: newFirstName || user.firstName,
              lastName: newLastName || user.lastName,
            },
            select: {
              id: true,
              matricNumber: true,
              firstName: true,
              lastName: true,
              department: true,
              level: true,
              profilePhoto: true,
            },
          });
          user = updatedUser;
          console.log('Updated user name to:', updatedUser.firstName, updatedUser.lastName);
        } catch (updateError) {
          console.error('Failed to update user name:', updateError);
        }
      }
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: 'Your profile could not be found. Please try logging out and back in.' 
      }, { status: 404 });
    }

    // Get or create active QR code
    let qrCode = await db.qRCode.findFirst({
      where: {
        userId: userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no valid QR code, create a new one
    if (!qrCode) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry

      // Generate a unique ID for this QR code session
      const sessionId = crypto.randomBytes(8).toString('hex');
      const code = `BIOVAULT-${user.matricNumber}-${Date.now()}-${sessionId}`;

      qrCode = await db.qRCode.create({
        data: {
          userId: userId,
          code,
          isActive: true,
          expiresAt,
        },
      });
    }

    // Generate QR code image with correct options
    const qrCodeUrl = `${request.nextUrl.origin}/api/verify-qr/${encodeURIComponent(qrCode.code)}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Calculate time remaining
    const now = new Date();
    const expiresAt = new Date(qrCode.expiresAt);
    const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        qrCodeImage: qrCodeImage,
        url: qrCodeUrl,
        expiresAt: qrCode.expiresAt,
        secondsRemaining,
        usageCount: qrCode.usageCount,
      },
      user: {
        matricNumber: user.matricNumber,
        fullName: `${user.firstName} ${user.lastName}`,
        department: user.department,
        level: user.level,
        profilePhoto: user.profilePhoto,
      },
    });

  } catch (error) {
    console.error('QR code fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Refresh QR code
export async function POST(request: NextRequest) {
  try {
    let token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');
    let userId: string | null = null;
    let authUser: any = null;

    if (token) {
      // Try custom token verification first
      const payload = await verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    // If custom token didn't work, try Supabase auth
    if (!userId) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;
      authUser = user;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    let user = await db.user.findUnique({
      where: { id: userId },
      select: { matricNumber: true },
    });

    // If user not found in DB, try to sync from Supabase Auth
    if (!user && authUser) {
      console.log(`QR Code POST: Syncing user ${userId} from Supabase Auth`);
      try {
        const syncedUser = await UserService.syncUserFromAuth(authUser);
        user = { matricNumber: syncedUser.matricNumber };
      } catch (syncError) {
        console.error('QR Code POST: User sync failed:', syncError);
      }
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        details: 'Your profile could not be found. Please try logging out and back in.'
      }, { status: 404 });
    }

    // Deactivate old QR codes
    await db.qRCode.updateMany({
      where: { userId: userId, isActive: true },
      data: { isActive: false },
    });

    // Create new QR code
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const sessionId = crypto.randomBytes(8).toString('hex');
    const code = `BIOVAULT-${user.matricNumber}-${Date.now()}-${sessionId}`;

    const qrCode = await db.qRCode.create({
      data: {
        userId: userId,
        code,
        isActive: true,
        expiresAt,
      },
    });

    // Generate QR code image with correct options
    const qrCodeUrl = `${request.nextUrl.origin}/api/verify-qr/${encodeURIComponent(code)}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        qrCodeImage: qrCodeImage,
        url: qrCodeUrl,
        expiresAt: qrCode.expiresAt,
        secondsRemaining: 300, // 5 minutes
      },
    });

  } catch (error) {
    console.error('QR code refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
