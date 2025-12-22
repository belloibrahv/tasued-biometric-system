# 🚀 TASUED BioVault - Production Deployment Guide

## Vercel Deployment

### Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Supabase project set up

### Step 1: Environment Variables Setup

In your Vercel dashboard, go to **Settings > Environment Variables** and add:

#### Required Variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://bjazjtvigmsgzrfwxdhr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wqXyBDdN74qVZvIWxbTMGQ_xolIURvO
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXpqdHZpZ21zZ3pyZnd4ZGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDg2NzE5MSwiZXhwIjoyMDUwNDQzMTkxfQ.wcn0n5QabXFA64AW

# Database URLs
DATABASE_URL=postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.bjazjtvigmsgzrfwxdhr:wcn0n5QabXFA64AW@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Security Keys (GENERATE NEW ONES FOR PRODUCTION!)
JWT_SECRET=your-super-strong-jwt-secret-at-least-32-characters-long
ENCRYPTION_KEY=your-32-character-encryption-key-for-biometric-data-security

# App URLs (Update with your Vercel domain)
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# WebAuthn Configuration
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app

# Settings
BCRYPT_SALT_ROUNDS=12
MAX_FILE_SIZE=5000000
ALLOWED_FILE_TYPES=image/png,image/jpg,image/jpeg,application/pdf
NODE_ENV=production
```

### Step 2: Generate Secure Keys

**CRITICAL**: Generate new, secure keys for production:

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Encryption Key (32+ characters)
openssl rand -base64 32
```

### Step 3: Database Setup

1. **Run Prisma migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed the database** (optional):
   ```bash
   npx prisma db seed
   ```

### Step 4: Deploy to Vercel

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Deploy**: Click "Deploy" and wait for build completion

### Step 5: Post-Deployment Verification

1. **Test Database Connection**:
   ```bash
   npx prisma db push --force-reset
   npx prisma db seed
   ```

2. **Test Authentication**: Try logging in with seeded accounts
3. **Test Biometric Enrollment**:
   - Register a new user or login as admin
   - Navigate to `/enroll-biometric`
   - Capture facial data (should work without "Failed to encrypt data" error)
4. **Test QR Generation**: Generate and scan QR codes
5. **Test Admin Functions**: Access admin dashboard

## 🔧 Database Setup Commands

If you encounter "BiometricData table does not exist" error:

```bash
# Reset and sync database schema
npx prisma db push --force-reset

# Seed with initial data
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

## 🔒 Security Checklist

- [ ] Generated new JWT_SECRET for production
- [ ] Generated new ENCRYPTION_KEY for production
- [ ] Updated all URLs to production domain
- [ ] Verified Supabase RLS policies are enabled
- [ ] Tested biometric encryption/decryption
- [ ] Confirmed HTTPS is working
- [ ] Verified environment variables are set correctly

## 🐛 Troubleshooting

### "Failed to encrypt data" Error
- Verify `ENCRYPTION_KEY` is set and at least 32 characters
- Check that crypto-js package is installed
- Ensure environment variables are properly loaded

### Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase project is active
- Ensure connection pooling is enabled
- If "BiometricData table does not exist": Run `npx prisma db push --force-reset`

### "BiometricData table does not exist" Error
- Run: `npx prisma db push --force-reset`
- Then: `npx prisma db seed`
- Finally: `npx prisma generate`
- This resets the database schema to match your Prisma models

### Authentication Problems
- Verify Supabase keys are correct
- Check JWT_SECRET is set
- Ensure redirect URLs match production domain

## 📊 Monitoring

After deployment, monitor:
- Application performance in Vercel dashboard
- Database usage in Supabase dashboard
- Error logs in Vercel function logs
- User registration and authentication flows

## 🔄 Updates

To deploy updates:
1. Push changes to main branch
2. Vercel will automatically redeploy
3. Run database migrations if schema changed
4. Test critical functionality after deployment

---

**Need Help?** Check the logs in Vercel dashboard or Supabase for detailed error messages.
