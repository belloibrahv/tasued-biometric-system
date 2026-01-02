# Database Setup Guide

## Error: "Could not create user profile. Please run the database migration first."

This error occurs when the Prisma migrations haven't been applied to your Supabase database. Follow this guide to fix it.

## Quick Fix (Recommended)

### Option 1: Using Setup Script (Easiest)

```bash
# Make script executable
chmod +x scripts/setup-db.sh

# Run setup script
./scripts/setup-db.sh
```

The script will:
1. ✓ Check environment variables
2. ✓ Install dependencies
3. ✓ Generate Prisma Client
4. ✓ Run all migrations
5. ✓ Verify database connection
6. ✓ Optionally seed sample data

### Option 2: Manual Steps

#### Step 1: Verify Environment Variables
```bash
# Check .env file
cat .env | grep DATABASE_URL
cat .env | grep DIRECT_URL

# Should output:
# DATABASE_URL="postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

If missing, add them to `.env`:
```env
DATABASE_URL="postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

#### Step 4: Run Migrations
```bash
# Deploy all pending migrations
npx prisma migrate deploy
```

#### Step 5: Verify Setup
```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1 as health;"

# Should output: health
#                ------
#                    1
```

#### Step 6: (Optional) Seed Database
```bash
# Add sample data
npx prisma db seed
```

## Understanding Migrations

### What Are Migrations?
Migrations are SQL scripts that create and modify database tables. They ensure your database schema matches your Prisma schema.

### Current Migrations
```
prisma/migrations/
├── 20251219185922_init/
│   └── migration.sql          # Initial schema creation
├── 20251219233017_add_biometric_enrolled_column/
│   └── migration.sql          # Added biometricEnrolled column
└── migration_lock.toml        # Lock file (do not edit)
```

### What Gets Created
The migrations create these tables:
- `User` - Student/user accounts
- `Admin` - Admin/operator accounts
- `BiometricData` - Facial recognition data
- `QRCode` - QR codes for access
- `AccessLog` - Access history
- `Session` - User sessions
- `AuditLog` - Audit trail
- `LectureAttendance` - Attendance records
- `ServiceAccess` - Service access logs

## Troubleshooting

### Issue 1: "Can't reach database server"

**Cause:** Database connection failed

**Solution:**
```bash
# Verify connection string
cat .env | grep DATABASE_URL

# Test direct connection
psql "postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

# If successful, you'll see: postgres=#
```

### Issue 2: "Authentication failed"

**Cause:** Invalid credentials in DATABASE_URL

**Solution:**
1. Go to Supabase Dashboard
2. Settings → Database → Connection String
3. Copy the correct connection string
4. Update DATABASE_URL in .env
5. Run migrations again

### Issue 3: "Permission denied"

**Cause:** User doesn't have permission to create tables

**Solution:**
1. Go to Supabase Dashboard
2. SQL Editor
3. Run: `GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;`
4. Run migrations again

### Issue 4: "Relation already exists"

**Cause:** Migrations already applied

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# If all migrations are applied, you're good to go
# If not, run:
npx prisma migrate deploy
```

### Issue 5: "Migration failed"

**Cause:** Schema mismatch or database error

**Solution:**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or manually check the migration
cat prisma/migrations/*/migration.sql

# Or check Supabase logs
# Dashboard → Logs → Database
```

## Verification Steps

### Step 1: Check Migration Status
```bash
npx prisma migrate status
```

Expected output:
```
Migrations to apply:
(none)

Database schema is up to date! 🎉
```

### Step 2: Verify Tables Exist
```bash
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

Should list all tables:
- User
- Admin
- BiometricData
- QRCode
- AccessLog
- Session
- AuditLog
- LectureAttendance
- ServiceAccess

### Step 3: Test User Creation
```bash
# Try creating a test user
npx prisma db execute --stdin <<< "INSERT INTO \"User\" (id, email, \"firstName\", \"lastName\", \"matricNumber\") VALUES ('test-id', 'test@example.com', 'Test', 'User', 'TEST001');"
```

### Step 4: Verify in Supabase Dashboard
1. Go to Supabase Dashboard
2. SQL Editor
3. Run: `SELECT COUNT(*) FROM "User";`
4. Should return the number of users

## Common Commands

### View Database Schema
```bash
npx prisma studio
```
Opens interactive database browser at http://localhost:5555

### Create New Migration
```bash
# After modifying schema.prisma
npx prisma migrate dev --name migration_name
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

### Check Migration History
```bash
npx prisma migrate status
```

### View Raw SQL
```bash
cat prisma/migrations/*/migration.sql
```

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
```

### Optional
```env
# For development
NODE_ENV=development

# For production
NODE_ENV=production
```

### Where to Get Them
1. Go to Supabase Dashboard
2. Settings → Database
3. Connection String section
4. Copy PostgreSQL connection string
5. Paste into DATABASE_URL
6. Change port from 6543 to 5432 for DIRECT_URL

## Database Connection Details

### Connection Pooling (DATABASE_URL)
- Host: `aws-1-eu-west-1.pooler.supabase.com`
- Port: `6543`
- Uses PgBouncer for connection pooling
- Good for serverless/many connections

### Direct Connection (DIRECT_URL)
- Host: `aws-1-eu-west-1.pooler.supabase.com`
- Port: `5432`
- Direct PostgreSQL connection
- Good for migrations and admin tasks

## After Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Registration
1. Open http://localhost:3000
2. Click "Register"
3. Fill in the form
4. Submit
5. Should see success page

### 3. Test Login
1. Go to http://localhost:3000/login
2. Enter credentials
3. Should login successfully
4. Should see dashboard

### 4. Check Database
```bash
npx prisma studio
```
Should see your new user in the User table

## Deployment

### Before Deploying
- [ ] Migrations run successfully locally
- [ ] Database connection verified
- [ ] All tables created
- [ ] Sample data seeded (optional)

### Deploying to Production
```bash
# Set environment variables on hosting platform
# DATABASE_URL=...
# DIRECT_URL=...

# Run migrations on production
npx prisma migrate deploy

# Verify
npx prisma migrate status
```

### Verifying Production
```bash
# Check production database
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";"
```

## Support

### Check Logs
```bash
# Supabase logs
# Dashboard → Logs → Database

# Application logs
# Check server console output
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=prisma:* npm run dev
```

### Get Help
1. Check this guide
2. Review Supabase documentation
3. Check Prisma documentation
4. Contact support

## Next Steps

After successful setup:
1. ✅ Database is ready
2. ✅ Users can register
3. ✅ Users can login
4. ✅ Onboarding flow works
5. ✅ Biometric enrollment works

You're all set! 🎉

---

**Last Updated:** January 2, 2026
**Status:** Complete
