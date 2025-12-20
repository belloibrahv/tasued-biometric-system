# Deployment Guide

## Quick Start

This application can be deployed to Render (backend + database) and Vercel (frontend + serverless functions).

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Git repository

---

## Option 1: Deploy to Render

### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `tasued-biometric-db`
   - **Database**: `tasued_biometric_system`
   - **User**: (auto-generated)
   - **Region**: Choose closest to your users
   - **Plan**: Free or Starter
4. Click "Create Database"
5. **Copy the Internal Database URL** (starts with `postgresql://`)

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tasued-biometric-system`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `./`
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Plan**: Free or Starter

### Step 3: Add Environment Variables

In the "Environment" tab, add:

```bash
DATABASE_URL=<paste_internal_database_url_here>
JWT_SECRET=<generate_random_32_char_string>
ENCRYPTION_KEY=<generate_random_32_char_string>
NEXT_PUBLIC_API_URL=https://tasued-biometric-system.onrender.com
WEBAUTHN_RP_ID=tasued-biometric-system.onrender.com
WEBAUTHN_ORIGIN=https://tasued-biometric-system.onrender.com
NODE_ENV=production
BCRYPT_SALT_ROUNDS=12
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
```

> **Important**: Use the **Internal Database URL**, not the External one!

### Step 4: Configure Health Check

1. Go to "Settings" tab
2. Find "Health Check Path"
3. Set to: `/api/health`
4. Save changes

### Step 5: Deploy

1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait for build to complete (5-10 minutes)
3. Check logs for any errors
4. Visit your app URL

---

## Option 2: Deploy to Vercel

### Step 1: Prepare Database

You'll need a PostgreSQL database. Options:
- [Neon](https://neon.tech/) (Recommended - Free tier)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Render PostgreSQL](https://render.com/)

Get your database connection string (starts with `postgresql://`).

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: (leave default)
   - **Output Directory**: (leave default)
   - **Install Command**: `npm ci`

### Step 3: Add Environment Variables

In the "Environment Variables" section, add:

```bash
DATABASE_URL=<your_postgresql_connection_string>
JWT_SECRET=<generate_random_32_char_string>
ENCRYPTION_KEY=<generate_random_32_char_string>
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
WEBAUTHN_RP_ID=your-app.vercel.app
WEBAUTHN_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
BCRYPT_SALT_ROUNDS=12
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
```

> **Note**: Replace `your-app` with your actual Vercel project name.

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Once deployed, update environment variables with actual Vercel URL
### Step 5: Critical Database Connection (Supabase on Vercel)

If you see an error like `Can't reach database server at ...:6543`, ensure your `DATABASE_URL` uses the **Transaction Mode** connection string (Port 6543) and includes these parameters:

```env
DATABASE_URL="postgres://postgres.xxxx:[PASSWORD]@db.xxxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
```

> [!IMPORTANT]
> - `pgbouncer=true` is required when using port 6543.
> - `connection_limit=1` prevents serverless functions from exhausting the pool.

### Step 6: Verify Database Connection

> [!CAUTION]
> **Vercel Database Connection**: If you are using a database hosted on Render (PostgreSQL), you **MUST** use the **EXTERNAL Database URL** in Vercel's environment variables. The internal URL only works within Render's private network.
> 
> 1. In Render, go to your PostgreSQL settings.
> 2. Copy the **External Database URL**.
> 3. Paste it into Vercel's `DATABASE_URL` environment variable.

> [!IMPORTANT]
> **Supabase on Vercel**: If you are using Supabase as your database, use the **Transaction Mode** connection string for better stability in serverless functions:
> - Format: `postgres://postgres.[YOUR-PROJECT-ID]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
> - Port: **6543**
> - Parameter: **?pgbouncer=true**

4. Redeploy to apply changes

### Step 5: Run Database Migrations

After first deployment:

1. Go to your project settings
2. Find "Deployments" tab
3. Click on latest deployment
4. Open "Functions" tab
5. You may need to run migrations manually via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migration
vercel env pull .env.production.local
npx prisma migrate deploy
```

---

## Post-Deployment Checklist

### 1. Test Health Endpoint

```bash
curl https://your-app-url.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  ...
}
```

### 2. Test Homepage

- Visit root URL
- Check if images load
- Verify navigation works
- Confirm styles are applied

### 3. Test Authentication

- Try accessing `/dashboard` (should redirect to `/login`)
- Register a test account
- Login with test account
- Verify dashboard loads

### 4. Check Logs

**Render**:
- Go to service → Logs tab
- Look for any errors or warnings

**Vercel**:
- Go to project → Deployments
- Click latest deployment → View Function Logs
- Check for errors

---

## Troubleshooting

### 502 Bad Gateway (Render)

**Causes**:
- Database connection failed
- Build failed
- Start command incorrect
- Missing environment variables

**Solutions**:
1. Check Render logs for specific error
2. Verify DATABASE_URL is the **internal** URL
3. Ensure all environment variables are set
4. Check build command includes `prisma generate` and `prisma migrate deploy`

### Raw HTML Showing (Vercel)

**Causes**:
- CSS/JS not loading
- Build configuration issue
- Hydration mismatch

**Solutions**:
1. Simplify or remove `vercel.json`
2. Check build logs for errors
3. Ensure `@prisma/client` is in `dependencies`
4. Redeploy after fixing

### Database Connection Errors

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database is running
3. Ensure database allows connections from deployment platform
4. For Render: use internal URL
5. For Vercel: ensure database allows external connections

### Prisma Errors

**Solutions**:
```bash
# Ensure these run during build
npx prisma generate
npx prisma migrate deploy
```

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Yes | Secret for JWT tokens (min 32 chars) | `your_random_secret_key_here` |
| `ENCRYPTION_KEY` | Yes | AES-256 encryption key (exactly 32 chars) | `12345678901234567890123456789012` |
| `NEXT_PUBLIC_API_URL` | Yes | Full app URL | `https://your-app.vercel.app` |
| `WEBAUTHN_RP_ID` | Yes | Domain without protocol | `your-app.vercel.app` |
| `WEBAUTHN_ORIGIN` | Yes | Full app URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Yes | Environment | `production` |
| `BCRYPT_SALT_ROUNDS` | No | Password hashing rounds | `12` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL | `https://your-proj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Anon Key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Service Role Key (Server-only) | `secret-role-key...` |

---

## Monitoring & Maintenance

### Set Up Monitoring

1. **Render**: Enable email notifications for deploy failures
2. **Vercel**: Enable Vercel Analytics and Speed Insights
3. Consider adding error tracking (e.g., Sentry)

### Regular Maintenance

- Monitor database size and performance
- Check logs weekly for errors
- Update dependencies monthly
- Backup database regularly

---

## Support

If you encounter issues:

1. Check deployment logs
2. Verify all environment variables
3. Test health endpoint
4. Review browser console for errors
5. Check database connectivity

For platform-specific help:
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
