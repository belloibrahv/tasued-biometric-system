import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Adding lecturer accounts...\n');

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

  for (const lecturer of lecturersSetup) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: lecturer.email }
      });

      if (existingUser) {
        console.log(`✓ Lecturer already exists: ${lecturer.email}`);
        continue;
      }

      // Create Supabase Auth user for lecturer
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
        console.error(`✗ Failed to create Supabase user for ${lecturer.email}:`, authError.message);
      } else {
        console.log(`✓ Created Supabase auth user: ${lecturer.email}`);
      }

      // Create lecturer user in database
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

      // Create empty biometric data placeholder
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

      console.log(`✓ Lecturer added: ${lecturer.email} | Password: ${lecturer.password}`);
    } catch (error: any) {
      console.error(`✗ Error adding lecturer ${lecturer.email}:`, error.message);
    }
  }

  console.log('\n✅ Lecturer setup complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
