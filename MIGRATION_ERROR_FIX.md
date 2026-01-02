# Fix: "Could not create user profile. Please run the database migration first."

## What This Error Means

This error occurs when:
1. Prisma migrations haven't been applied to your database
2. The database tables don't exist yet
3. The database connection is working, but the schema is missing

## Quick Fix (Choose One)

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
npm run db:setup
```

This will:
- ✓ Check environment variables
- ✓ Install dependencies
- ✓ Generate Prisma Client
- ✓ Run all migrations
- ✓ Verify database connection
- ✓ Optionally seed sample data

### Option 2: Manual Migration

```bash
# Step 1: Generate Prisma Client
npx prisma generate

# Step 2: Deploy migrations
npx prisma migrate deploy

# Step 3: Verify
npx prisma migrate status
```

### Option 3: Development Migration

```bash
# For development with new migrations
npx prisma migrate dev
```

## Step-by-Step Instructions

### Step 1: Verify Environment Variables

```bash
# Check .env file
cat .env | grep DATABASE_URL
cat .env | grep DIRECT_URL
```

Should output:
```
DATABASE_URL="postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

If missing, add them to `.env` file.

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

Expected output:
```
✔ Generated Prisma Client (v5.8.0) to ./node_modules/@prisma/client in 123ms
```

### Step 4: Run Migrations

```bash
npx prisma migrate deploy
```

Expected output:
```
Applying migration `20251219185922_init`
Applying migration `20251219233017_add_biometric_enrolled_column`

2 migrations applied successfully
```

### Step 5: Verify Setup

```bash
# Check migration status
npx prisma migrate status
```

Expected output:
```
Migrations to apply:
(none)

Database schema is up to date! 🎉
```

### Step 6: Test Database Connection

```bash
# Open Prisma Studio
npm run db:studio
```

Should open http://localhost:5555 with database browser.

## What Gets Created

The migrations create these tables:

### User Table
- Stores student/user accounts
- Fields: id, email, firstName, lastName, matricNumber, department, level, etc.

### Admin Table
- Stores admin/operator accounts
- Fields: id, email, fullName, role, permissions

### BiometricData Table
- Stores facial recognition data
- Fields: userId, facialTemplate, facialQuality, enrolledAt

### QRCode Table
- Stores QR codes for access
- Fields: userId, code, data, createdAt

### AccessLog Table
- Stores access history
- Fields: userId, timestamp, status, method

### Session Table
- Stores user sessions
- Fields: userId, token, expiresAt

### AuditLog Table
- Stores audit trail
- Fields: userId, action, details, timestamp

### LectureAttendance Table
- Stores attendance records
- Fields: userId, lectureId, timestamp

### ServiceAccess Table
- Stores service access logs
- Fields: userId, serviceId, timestamp

## Troubleshooting

### Issue 1: "Can't reach database server"

**Cause:** Database connection failed

**Solution:**
```bash
# Verify connection string
cat .env | grep DATABASE_URL

# Test connection
psql "postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

If connection fails:
1. Go to Supabase Dashboard
2. Settings → Database → Connection String
3. Copy correct connection string
4. Update DATABASE_URL in .env
5. Try again

### Issue 2: "Authentication failed"

**Cause:** Invalid credentials

**Solution:**
1. Go to Supabase Dashboard
2. Settings → Database
3. Reset password if needed
4. Copy correct connection string
5. Update .env
6. Try again

### Issue 3: "Permission denied"

**Cause:** User doesn't have permission to create tables

**Solution:**
1. Go to Supabase Dashboard
2. SQL Editor
3. Run: `GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;`
4. Try migrations again

### Issue 4: "Relation already exists"

**Cause:** Migrations already applied

**Solution:**
```bash
# Check status
npx prisma migrate status

# If all applied, you're good to go
# If not, run:
npx prisma migrate deploy
```

### Issue 5: "Migration failed"

**Cause:** Schema mismatch or database error

**Solution:**
```bash
# Check what migration failed
npx prisma migrate status

# View the migration SQL
cat prisma/migrations/*/migration.sql

# Check Supabase logs
# Dashboard → Logs → Database

# If needed, reset (WARNING: Deletes all data)
npx prisma migrate reset
```

## Verification Checklist

- [ ] .env file has DATABASE_URL and DIRECT_URL
- [ ] npm install completed
- [ ] npx prisma generate succeeded
- [ ] npx prisma migrate deploy succeeded
- [ ] npx prisma migrate status shows "up to date"
- [ ] npm run db:studio opens successfully
- [ ] Can see tables in Prisma Studio

## After Migration

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Registration
1. Open http://localhost:3000
2. Click "Register"
3. Fill in form
4. Submit
5. Should see success page

### 3. Test Login
1. Go to http://localhost:3000/login
2. Enter credentials
3. Should login successfully
4. Should see dashboard

### 4. Verify in Database
```bash
# Open Prisma Studio
npm run db:studio

# Should see your new user in User table
```

## Common Commands

```bash
# Check migration status
npx prisma migrate status

# View database in browser
npm run db:studio

# Create new migration (after schema changes)
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Seed database with sample data
npm run db:seed

# View raw migration SQL
cat prisma/migrations/*/migration.sql
```

## Database Connection Details

### Connection Pooling (DATABASE_URL)
- **Host:** aws-1-eu-west-1.pooler.supabase.com
- **Port:** 6543
- **Uses:** PgBouncer for connection pooling
- **Best for:** Serverless, many connections

### Direct Connection (DIRECT_URL)
- **Host:** aws-1-eu-west-1.pooler.supabase.com
- **Port:** 5432
- **Uses:** Direct PostgreSQL connection
- **Best for:** Migrations, admin tasks

## Getting Help

### Check Logs
```bash
# Supabase logs
# Dashboard → Logs → Database

# Application logs
# Check server console output
```

### Enable Debug Mode
```bash
# Show detailed Prisma logs
DEBUG=prisma:* npm run dev
```

### Resources
- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

## Next Steps

After successful migration:
1. ✅ Database is ready
2. ✅ Users can register
3. ✅ Users can login
4. ✅ Onboarding flow works
5. ✅ Biometric enrollment works

You're all set! 🎉

---

**Last Updated:** January 2, 2026
**Status:** Complete
