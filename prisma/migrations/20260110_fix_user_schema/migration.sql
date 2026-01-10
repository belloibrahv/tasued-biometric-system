-- Fix User table schema to match current Prisma schema
-- Remove NOT NULL constraints on optional fields
-- Remove fields that are no longer used

-- Step 1: Drop constraints that conflict
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";

-- Step 2: Rename old table
ALTER TABLE "users" RENAME TO "users_old";

-- Step 3: Create new User table with correct schema
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "matricNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "phoneNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "department" TEXT,
    "level" TEXT,
    "profilePhoto" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "biometricEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create unique indexes
CREATE UNIQUE INDEX "User_matricNumber_key" ON "User"("matricNumber");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Step 5: Migrate data from old table if it exists
INSERT INTO "User" (
    "id",
    "matricNumber",
    "email",
    "firstName",
    "lastName",
    "otherNames",
    "phoneNumber",
    "dateOfBirth",
    "department",
    "level",
    "profilePhoto",
    "isActive",
    "biometricEnrolled",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "matricNumber",
    "email",
    "firstName",
    "lastName",
    "otherNames",
    "phoneNumber",
    "dateOfBirth",
    "department",
    "level",
    "profilePhoto",
    "isActive",
    false as "biometricEnrolled",
    "createdAt",
    "updatedAt"
FROM "users_old"
ON CONFLICT ("email") DO NOTHING;

-- Step 6: Drop old table
DROP TABLE "users_old";

-- Step 7: Recreate other tables that reference User
-- BiometricData
CREATE TABLE IF NOT EXISTS "BiometricData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fingerprintTemplate" TEXT,
    "fingerprintQuality" DOUBLE PRECISION,
    "facialTemplate" TEXT,
    "facialQuality" DOUBLE PRECISION,
    "facialPhotos" TEXT[],
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricData_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BiometricData_userId_key" ON "BiometricData"("userId");

-- QRCode
CREATE TABLE IF NOT EXISTS "QRCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "QRCode_code_key" ON "QRCode"("code");
CREATE INDEX IF NOT EXISTS "QRCode_userId_idx" ON "QRCode"("userId");
CREATE INDEX IF NOT EXISTS "QRCode_expiresAt_idx" ON "QRCode"("expiresAt");

-- Add foreign key constraints
ALTER TABLE "BiometricData" ADD CONSTRAINT "BiometricData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
