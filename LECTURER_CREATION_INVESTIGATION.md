# Lecturer Account Creation - Root Cause Investigation

## Problem Summary
Difficulty creating lecturer accounts in the database despite multiple attempts through:
1. Database seed script
2. Direct SQL scripts
3. API endpoints
4. TypeScript scripts

## Root Causes Identified

### 1. **Unique Constraint on matricNumber**
**Issue**: The `matricNumber` field has a `@unique` constraint in the Prisma schema.
```prisma
model User {
  matricNumber      String        @unique
  email             String        @unique
  // ...
}
```

**Impact**:
- If a lecturer with matric number `LEC/2024/001` already exists, creating another with the same matric number will fail
- The error is silently caught by `ON CONFLICT (email) DO NOTHING` in SQL, but the biometric data insert may still fail

### 2. **Unique Constraint on Email**
**Issue**: The `email` field also has a `@unique` constraint.

**Impact**:
- If lecturer email already exists, the insert is skipped
- But the biometric data insert tries to create a record for a user that may not have been inserted

### 3. **Foreign Key Constraint on BiometricData**
**Issue**: BiometricData has a foreign key to User:
```prisma
model BiometricData {
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Impact**:
- If the User insert is skipped due to `ON CONFLICT`, the biometric data insert fails because the user doesn't exist
- The `ON CONFLICT` clause only applies to the User insert, not the BiometricData insert

### 4. **Database Connection Issues**
**Issue**: Intermittent database connectivity problems during seed execution.

**Impact**:
- Seed script fails midway
- Partial data insertion (user created but biometric data not)
- Subsequent attempts fail due to unique constraints

### 5. **Supabase Auth vs Database Mismatch**
**Issue**: Lecturers need accounts in both:
- Supabase Auth (for login)
- PostgreSQL Database (for user profile)

**Impact**:
- Creating only in database doesn't enable login
- Creating only in auth doesn't create user profile
- Both must be synchronized

## Solution

### Step 1: Verify Current State
Run this query in Supabase SQL Editor to check if lecturers exist:

```sql
SELECT
  id,
  email,
  "firstName",
  "lastName",
  "matricNumber",
  "isActive"
FROM "User"
WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');
```

### Step 2: Clean Up (If Needed)
If partial data exists, clean it up:

```sql
-- Delete biometric data for lecturers
DELETE FROM "BiometricData"
WHERE "userId" IN (
  SELECT id FROM "User"
  WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng')
);

-- Delete lecturer users
DELETE FROM "User"
WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');
```

### Step 3: Create Lecturers (Corrected Approach)

**Option A: Using Corrected SQL (Recommended)**

```sql
-- Insert Lecturer 1
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
);

-- Insert Lecturer 2
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
);

-- Create biometric data for both
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
WHERE u.email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');

-- Verify
SELECT
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  bd.id as biometric_id
FROM "User" u
LEFT JOIN "BiometricData" bd ON u.id = bd."userId"
WHERE u.email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');
```

**Option B: Using Upsert (If Lecturers May Already Exist)**

```sql
-- Use INSERT ... ON CONFLICT to handle existing records
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
) VALUES
  (gen_random_uuid(), 'LEC/2024/001', 'adeyemi.lecturer@tasued.edu.ng', 'Adeyemi', 'Okafor', '+234 803 456 7890', 'Computer Science', true, false, now(), now()),
  (gen_random_uuid(), 'LEC/2024/002', 'johnson.lecturer@tasued.edu.ng', 'Johnson', 'Akinwale', '+234 805 678 9012', 'Computer Science', true, false, now(), now())
ON CONFLICT (email) DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  "phoneNumber" = EXCLUDED."phoneNumber",
  "updatedAt" = now()
RETURNING id, email;

-- Then create biometric data for any users without it
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
```

### Step 4: Create Supabase Auth Accounts

After creating database records, create auth accounts:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter email and password
4. Set user_metadata:
   ```json
   {
     "firstName": "Adeyemi",
     "lastName": "Okafor",
     "type": "lecturer"
   }
   ```

Or use Supabase CLI:
```bash
supabase auth admin create-user \
  --email adeyemi.lecturer@tasued.edu.ng \
  --password "Lecturer@2024!" \
  --user-metadata '{"firstName":"Adeyemi","lastName":"Okafor","type":"lecturer"}'
```

## Why Previous Attempts Failed

1. **Seed Script**: Database connection dropped during execution
2. **SQL Scripts**: `ON CONFLICT` silently skipped inserts, biometric data insert failed
3. **API Endpoints**: Server wasn't running to test
4. **TypeScript Scripts**: Environment variables not loaded properly

## Prevention for Future

### 1. Update Seed Script
```typescript
// Better error handling
for (const lecturer of lecturersSetup) {
  try {
    // First, ensure user doesn't exist
    const existing = await prisma.user.findUnique({
      where: { email: lecturer.email }
    });

    if (existing) {
      console.log(`Lecturer already exists: ${lecturer.email}`);
      continue;
    }

    // Create user
    const user = await prisma.user.create({
      data: { /* ... */ }
    });

    // Create biometric data
    await prisma.biometricData.create({
      data: { userId: user.id, /* ... */ }
    });

    console.log(`✓ Created: ${lecturer.email}`);
  } catch (error) {
    console.error(`✗ Failed: ${lecturer.email}`, error.message);
    // Don't continue on error - report it
  }
}
```

### 2. Add Database Constraints Check
```sql
-- Check constraints before inserting
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'User';
```

### 3. Implement Idempotent Operations
- Always check if record exists before creating
- Use `ON CONFLICT` properly with `DO UPDATE`
- Handle foreign key constraints explicitly

## Recommended Action

**Run this in Supabase SQL Editor:**

```sql
-- Clean up any partial data
DELETE FROM "BiometricData"
WHERE "userId" IN (
  SELECT id FROM "User"
  WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng')
);

DELETE FROM "User"
WHERE email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');

-- Create lecturers fresh
INSERT INTO "User" (
  id, "matricNumber", email, "firstName", "lastName", "phoneNumber",
  department, "isActive", "biometricEnrolled", "createdAt", "updatedAt"
) VALUES
  (gen_random_uuid(), 'LEC/2024/001', 'adeyemi.lecturer@tasued.edu.ng', 'Adeyemi', 'Okafor', '+234 803 456 7890', 'Computer Science', true, false, now(), now()),
  (gen_random_uuid(), 'LEC/2024/002', 'johnson.lecturer@tasued.edu.ng', 'Johnson', 'Akinwale', '+234 805 678 9012', 'Computer Science', true, false, now(), now());

-- Create biometric data
INSERT INTO "BiometricData" (id, "userId", "fingerprintTemplate", "fingerprintQuality", "facialTemplate", "facialQuality", "facialPhotos", "enrolledAt", "updatedAt")
SELECT gen_random_uuid(), u.id, NULL, NULL, NULL, NULL, ARRAY[]::text[], now(), now()
FROM "User" u
WHERE u.email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');

-- Verify
SELECT u.id, u.email, u."firstName", bd.id as biometric_id
FROM "User" u
LEFT JOIN "BiometricData" bd ON u.id = bd."userId"
WHERE u.email IN ('adeyemi.lecturer@tasued.edu.ng', 'johnson.lecturer@tasued.edu.ng');
```

Then create Supabase Auth accounts manually or via CLI.

---

**Summary**: The main issue is the combination of unique constraints and foreign key relationships. The SQL `ON CONFLICT` clause only handles the User insert, not the dependent BiometricData insert. The solution is to ensure both inserts succeed or both fail together, and to verify the database state before attempting creation.
