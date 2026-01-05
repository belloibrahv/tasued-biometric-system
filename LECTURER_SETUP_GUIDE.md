# Lecturer Account Setup Guide

This guide explains how to add lecturer accounts to the TASUED BioVault system.

## Quick Setup (Recommended)

### Option 1: Using Supabase SQL Editor (Fastest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the entire content from `scripts/add-lecturers.sql`
5. Click **Run** button
6. You should see the verification query results showing the 2 lecturers added

### Option 2: Manual SQL Entry

If you prefer to run the SQL manually, here's the script:

```sql
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

-- Create biometric data placeholders
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
  ARRAY[]::text[],
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
```

## Lecturer Credentials

After running the SQL script, the following lecturer accounts will be available:

### Lecturer 1
- **Email**: `adeyemi.lecturer@tasued.edu.ng`
- **Password**: `Lecturer@2024!`
- **Name**: Adeyemi Okafor
- **Department**: Computer Science
- **Matric Number**: LEC/2024/001

### Lecturer 2
- **Email**: `johnson.lecturer@tasued.edu.ng`
- **Password**: `Lecturer@2024!`
- **Name**: Johnson Akinwale
- **Department**: Computer Science
- **Matric Number**: LEC/2024/002

## Adding Supabase Auth Accounts

The SQL script above only adds the lecturers to the database. To enable login, you also need to create Supabase Auth accounts.

### Steps to Create Auth Accounts:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users** (left sidebar)
3. Click **Add user** button
4. For each lecturer, enter:
   - **Email**: `adeyemi.lecturer@tasued.edu.ng` (or the second email)
   - **Password**: `Lecturer@2024!`
   - Click **Create user**

Alternatively, you can use the Supabase CLI:

```bash
# Create Lecturer 1
supabase auth admin create-user \
  --email adeyemi.lecturer@tasued.edu.ng \
  --password "Lecturer@2024!" \
  --user-metadata '{"firstName":"Adeyemi","lastName":"Okafor","type":"lecturer"}'

# Create Lecturer 2
supabase auth admin create-user \
  --email johnson.lecturer@tasued.edu.ng \
  --password "Lecturer@2024!" \
  --user-metadata '{"firstName":"Johnson","lastName":"Akinwale","type":"lecturer"}'
```

## Verification

After adding the lecturers, verify they can login:

1. Go to `http://localhost:3000/login` (or your deployed URL)
2. Click on **Staff/Admin** tab
3. Enter lecturer email and password
4. You should be redirected to `/lecturer` dashboard

## Troubleshooting

### Lecturers can't login
- **Issue**: Email/password incorrect
- **Solution**: Verify credentials in Supabase Auth users list
- **Check**: Ensure both database and auth accounts exist

### Lecturers see "Unauthorized" error
- **Issue**: User type not set to 'lecturer'
- **Solution**: Check user_metadata in Supabase Auth has `"type":"lecturer"`

### Lecturers redirected to student dashboard
- **Issue**: User type not recognized
- **Solution**: Verify middleware.ts has lecturer route handling

### Can't see lecturer in database
- **Issue**: SQL script didn't run successfully
- **Solution**: Check for SQL errors in Supabase SQL Editor output

## Adding More Lecturers

To add additional lecturers, modify the SQL script:

```sql
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
  'LEC/2024/003',  -- Change matric number
  'new.lecturer@tasued.edu.ng',  -- Change email
  'First',  -- Change first name
  'Name',  -- Change last name
  '+234 800 000 0000',  -- Change phone
  'Computer Science',
  true,
  false,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;
```

Then create the corresponding Supabase Auth account.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md for general setup
3. Check Supabase logs for database errors
4. Verify environment variables are correctly set

---

**Last Updated**: January 2026
