#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const prisma = new PrismaClient();

const lecturers = [
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

async function main() {
  console.log('Adding lecturers to system...\n');

  for (const lecturer of lecturers) {
    try {
      // Check if exists in database
      const existing = await prisma.user.findUnique({
        where: { email: lecturer.email }
      });

      if (existing) {
        console.log(`✓ ${lecturer.email} - Already in database`);
        continue;
      }

      // Create in Supabase Auth
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

      if (authError && !authError.message.includes('already exists')) {
        console.warn(`⚠ Supabase auth error for ${lecturer.email}: ${authError.message}`);
      }

      // Create in database
      const user = await prisma.user.create({
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

      // Create biometric placeholder
      await prisma.biometricData.create({
        data: {
          userId: user.id,
          fingerprintTemplate: null,
          fingerprintQuality: null,
          facialTemplate: null,
          facialQuality: null,
          facialPhotos: [],
        },
      });

      console.log(`✓ ${lecturer.email} - Added successfully`);
      console.log(`  Password: ${lecturer.password}`);
    } catch (error) {
      console.error(`✗ ${lecturer.email} - Error: ${error.message}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
