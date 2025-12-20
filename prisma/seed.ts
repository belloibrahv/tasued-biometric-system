import { PrismaClient, AdminRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin Users
  const adminsSetup = [
    {
      email: 'admin@tasued.edu.ng',
      fullName: 'System Administrator',
      role: AdminRole.SUPER_ADMIN,
      permissions: ['all'],
    },
    {
      email: 'ogunsanwo@tasued.edu.ng',
      fullName: 'Dr. Ogunsanwo',
      role: AdminRole.ADMIN,
      permissions: ['users', 'reports', 'services'],
    },
    {
      email: 'operator@tasued.edu.ng',
      fullName: 'Verification Operator',
      role: AdminRole.OPERATOR,
      permissions: ['verify', 'search'],
    },
  ];

  for (const admin of adminsSetup) {
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
    console.log(`Upserted admin: ${admin.email} with role ${admin.role}`);
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
      where: { matricNumber: student.matricNumber },
      update: {
        email: student.email,
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

    console.log(`Upserted student: ${student.email}`);
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
    console.log(`Upserted service: ${service.name}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
