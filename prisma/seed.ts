import { PrismaClient, AdminRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('Seeding database...');

  // Create Admin Users
  const adminsSetup = [
    {
      email: 'admin@tasued.edu.ng',
      fullName: 'System Administrator',
      role: AdminRole.SUPER_ADMIN,
      permissions: ['all'],
      password: 'adminPassword123!',
    },
    {
      email: 'ogunsanwo@tasued.edu.ng',
      fullName: 'Dr. Ogunsanwo',
      role: AdminRole.ADMIN,
      permissions: ['users', 'reports', 'services'],
      password: 'adminPassword123!',
    },
    {
      email: 'operator@tasued.edu.ng',
      fullName: 'Verification Operator',
      role: AdminRole.OPERATOR,
      permissions: ['verify', 'search'],
      password: 'operatorPassword123!',
    },
  ];

  for (const admin of adminsSetup) {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: admin.email }
    });

    if (!existingAdmin) {
      // Create Supabase Auth user first
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          fullName: admin.fullName,
          type: 'admin',
          role: admin.role,
        }
      });

      if (authError) {
        console.error(`Failed to create Supabase user for ${admin.email}:`, authError.message);
      } else {
        console.log(`Created Supabase auth user: ${admin.email}`);
      }
    }

    // Create database record
    await prisma.admin.upsert({
      where: { email: admin.email },
      update: {
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
      },
      create: {
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
    console.log(`✓ Admin: ${admin.email} with role ${admin.role}`);
  }

  // Create Lecturer Accounts
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
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: lecturer.email }
    });

    if (!existingUser) {
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
        console.error(`Failed to create Supabase user for ${lecturer.email}:`, authError.message);
      } else {
        console.log(`Created Supabase auth user: ${lecturer.email}`);
      }
    }

    // Create lecturer user in database
    const user = await prisma.user.upsert({
      where: { email: lecturer.email },
      update: {
        firstName: lecturer.firstName,
        lastName: lecturer.lastName,
        phoneNumber: lecturer.phoneNumber,
      },
      create: {
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
    await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fingerprintTemplate: null,
        fingerprintQuality: null,
        facialTemplate: null,
        facialQuality: null,
        facialPhotos: [],
      },
    });

    console.log(`✓ Lecturer: ${lecturer.email} | Password: ${lecturer.password}`);
  }

  // Create Sample Students - CSC 415 Class
  const studentsSetup: any[] = [
    {
      matricNumber: 'CSC/2024/001',
      email: 'test.student@tasued.edu.ng',
      firstName: 'Test',
      lastName: 'Student',
      phoneNumber: '+234 800 123 4567',
      dateOfBirth: new Date('2002-01-15'),
      department: 'Computer Science',
      level: '400',
    },
    {
      matricNumber: 'CSC/2024/002',
      email: 'demo.user@tasued.edu.ng',
      firstName: 'Demo',
      lastName: 'User',
      phoneNumber: '+234 800 234 5678',
      dateOfBirth: new Date('2001-05-20'),
      department: 'Computer Science',
      level: '300',
    },
  ];

  for (const student of studentsSetup) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      update: {
        firstName: student.firstName,
        lastName: student.lastName,
      },
      create: {
        matricNumber: student.matricNumber,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        phoneNumber: student.phoneNumber,
        dateOfBirth: student.dateOfBirth,
        department: student.department,
        level: student.level,
        isActive: true,
        biometricEnrolled: false,
      },
    });

    // Create empty biometric data placeholder
    await prisma.biometricData.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fingerprintTemplate: null,
        fingerprintQuality: null,
        facialTemplate: null,
        facialQuality: null,
        facialPhotos: [],
      },
    });

    // Create QR code
    const qrExpiry = new Date();
    qrExpiry.setDate(qrExpiry.getDate() + 30);

    await prisma.qRCode.upsert({
      where: { code: `BIOVAULT-${student.matricNumber}-SEED` },
      update: {},
      create: {
        userId: user.id,
        code: `BIOVAULT-${student.matricNumber}-SEED`,
        isActive: true,
        expiresAt: qrExpiry,
      },
    });

    console.log(`✓ Student: ${student.email}`);
  }

  // Create Services
  const servicesSetup = [
    { name: 'Library', slug: 'library', description: 'Library access and book borrowing', icon: 'BookOpen' },
    { name: 'Exam Hall', slug: 'exam-hall', description: 'Examination verification', icon: 'GraduationCap' },
    { name: 'Hostel', slug: 'hostel', description: 'Hostel access and room entry', icon: 'Building2' },
    { name: 'Cafeteria', slug: 'cafeteria', description: 'Meal payments and access', icon: 'Utensils' },
    { name: 'Health Center', slug: 'health-center', description: 'Medical services', icon: 'Heart' },
    { name: 'Transport', slug: 'transport', description: 'Campus shuttle services', icon: 'Bus' },
  ];

  for (const service of servicesSetup) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        description: service.description,
        icon: service.icon,
      },
      create: {
        name: service.name,
        slug: service.slug,
        description: service.description,
        icon: service.icon,
        isActive: true,
        requiredPermissions: ['verify'],
        optionalPermissions: ['history'],
      },
    });
    console.log(`✓ Service: ${service.name}`);
  }

  // Create Sample Lecture Sessions
  const now = new Date();
  const lectureSessionsSetup = [
    {
      courseCode: 'CSC 415',
      courseName: 'Advanced Database Systems',
      lecturer: 'Adeyemi Okafor',
      venue: 'Computer Lab 1',
      startTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(now.getTime() + 120 * 60 * 1000), // 2 hours from now
      department: 'Computer Science',
      level: '400',
    },
    {
      courseCode: 'CSC 410',
      courseName: 'Software Engineering',
      lecturer: 'Johnson Akinwale',
      venue: 'Lecture Hall A',
      startTime: new Date(now.getTime() + 180 * 60 * 1000), // 3 hours from now
      endTime: new Date(now.getTime() + 240 * 60 * 1000), // 4 hours from now
      department: 'Computer Science',
      level: '400',
    },
    {
      courseCode: 'CSC 301',
      courseName: 'Data Structures',
      lecturer: 'Adeyemi Okafor',
      venue: 'Computer Lab 2',
      startTime: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago (ongoing)
      endTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
      department: 'Computer Science',
      level: '300',
    },
  ];

  for (const lecture of lectureSessionsSetup) {
    await prisma.lectureSession.upsert({
      where: { id: `${lecture.courseCode}-${lecture.startTime.getTime()}` },
      update: {},
      create: {
        courseCode: lecture.courseCode,
        courseName: lecture.courseName,
        lecturer: lecture.lecturer,
        venue: lecture.venue,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        department: lecture.department,
        level: lecture.level,
        createdBy: 'system',
      },
    });
    console.log(`✓ Lecture: ${lecture.courseCode} - ${lecture.courseName}`);
  }

  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📋 LECTURER CREDENTIALS:');
  console.log('─────────────────────────────────────────');
  lecturersSetup.forEach(lecturer => {
    console.log(`Email: ${lecturer.email}`);
    console.log(`Password: ${lecturer.password}`);
    console.log('─────────────────────────────────────────');
  });
}

main()
  .catch((e: Error) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
