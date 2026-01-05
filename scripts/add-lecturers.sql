-- SQL Script to add lecturer accounts to TASUED BioVault
-- Run this directly in Supabase SQL Editor
-- This script adds 2 lecturer accounts to the User and BiometricData tables

-- Insert Lecturer 1: Adeyemi Okafor
INSERT INTO "User" (
  id,
  "matricNumber",
  email,
  "firstName",
  "lastName",
  "phoneNumber",
  department,
  "isActive",
  "biometricEnrolled",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'LEC/2024/001',
  'adeyemi.lecturer@tasued.edu.ng',
  'Adeyemi',
  'Okafor',
  '+234 803 456 7890',
  'Computer Science',
  true,
  false,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Insert Lecturer 2: Johnson Akinwale
INSERT INTO "User" (
  id,
  "matricNumber",
  email,
  "firstName",
  "lastName",
  "phoneNumber",
  department,
  "isActive",
  "biometricEnrolled",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'LEC/2024/002',
  'johnson.lecturer@tasued.edu.ng',
  'Johnson',
  'Akinwale',
  '+234 805 678 9012',
  'Computer Science',
  true,
  false,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create biometric data placeholders for both lecturers
INSERT INTO "BiometricData" (
  id,
  "userId",
  "fingerprintTemplate",
  "fingerprintQuality",
  "facialTemplate",
  "facialQuality",
  "facialPhotos",
  "enrolledAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  NULL,
  NULL,
  NULL,
  NULL,
  '[]'::jsonb,
  now(),
  now()
FROM "User" u
WHERE u.email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng')
AND NOT EXISTS (
  SELECT 1 FROM "BiometricData" bd WHERE bd."userId" = u.id
);

-- Verify the lecturers were added
SELECT 
  id,
  email,
  "firstName",
  "lastName",
  "matricNumber",
  department,
  "isActive"
FROM "User"
WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng')
ORDER BY "createdAt" DESC;
