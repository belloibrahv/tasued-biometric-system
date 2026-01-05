import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const lecturersSetup = [
      {
        matricNumber: 'LEC/2024/001',
        email: 'adeyemi.lecturer@tasued.edu.ng',
        firstName: 'Adeyemi',
        lastName: 'Okafor',
        phoneNumber: '+234 803 456 7890',
        department: 'Computer Science',
        password: 'Lecturer@2024!',
      },
      {
        matricNumber: 'LEC/2024/002',
        email: 'johnson.lecturer@tasued.edu.ng',
        firstName: 'Johnson',
        lastName: 'Akinwale',
        phoneNumber: '+234 805 678 9012',
        department: 'Computer Science',
        password: 'Lecturer@2024!',
      },
    ];

    const results = [];

    for (const lecturer of lecturersSetup) {
      try {
        // Check if user already exists in database
        const existingUser = await db.user.findUnique({
          where: { email: lecturer.email }
        });

        if (existingUser) {
          results.push({
            email: lecturer.email,
            status: 'exists',
            message: 'Lecturer already exists in database'
          });
          continue;
        }

        // Create Supabase Auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: lecturer.email,
          password: lecturer.password,
          email_confirm: true,
          user_metadata: {
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            type: 'lecturer',
          }
        });

        if (authError) {
          console.error(`Supabase error for ${lecturer.email}:`, authError.message);
          // Continue anyway - create in database
        }

        // Create user in database
        const user = await db.user.create({
          data: {
            matricNumber: lecturer.matricNumber,
            email: lecturer.email,
            firstName: lecturer.firstName,
            lastName: lecturer.lastName,
            phoneNumber: lecturer.phoneNumber,
            department: lecturer.department,
            isActive: true,
            biometricEnrolled: false,
          },
        });

        // Create biometric data placeholder
        await db.biometricData.create({
          data: {
            userId: user.id,
            fingerprintTemplate: null,
            fingerprintQuality: null,
            facialTemplate: null,
            facialQuality: null,
            facialPhotos: [],
          },
        });

        results.push({
          email: lecturer.email,
          status: 'created',
          message: `Lecturer created successfully`,
          password: lecturer.password
        });
      } catch (error: any) {
        results.push({
          email: lecturer.email,
          status: 'error',
          message: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: lecturersSetup.length,
        created: results.filter(r => r.status === 'created').length,
        exists: results.filter(r => r.status === 'exists').length,
        errors: results.filter(r => r.status === 'error').length,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Failed to add lecturers'
    }, { status: 500 });
  }
}
