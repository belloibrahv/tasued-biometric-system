# 🚀 TASUED BioVault - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get these from: https://supabase.com/dashboard/project/_/settings/api
```

**Required Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL="postgresql://postgres:password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
JWT_SECRET="your-secret-key-here"
ENCRYPTION_KEY="your-32-char-encryption-key!"
```

### 3. Configure Supabase (IMPORTANT!)

**To fix the registration redirect issue:**

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, **DISABLE** "Confirm email"
4. Save changes

This allows users to log in immediately after registration in development.

### 4. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed with test data
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ Test the Fixed Registration Flow

### Register a New User:
1. Go to `/register`
2. Fill in the form:
   - Matric Number: `CSC/2023/001`
   - Email: `test@tasued.edu.ng`
   - Phone: `08012345678`
   - Complete all other fields
3. Capture your face (allow camera access)
4. Set a password (min 8 characters)
5. Click "Complete Registration"

**Expected Result:** ✅ Automatically redirected to `/dashboard` and logged in!

## 🎯 Key Features

- ✅ **Auto-login after registration** - No redirect to login page
- ✅ **Professional biometric processing** - Enhanced facial embeddings
- ✅ **Error boundaries** - Graceful error handling
- ✅ **Loading states** - Professional UI feedback
- ✅ **Input validation** - Comprehensive form validation
- ✅ **Smooth animations** - Framer Motion integration

## 🔧 Troubleshooting

### Still redirecting to login after registration?
- **Check:** Email confirmation is disabled in Supabase
- **Check:** All environment variables are set correctly
- **Try:** Clear browser cookies and restart dev server

### Camera not working?
- **Chrome/Edge:** Allow camera permissions
- **Safari:** Go to Settings → Privacy → Camera
- **Firefox:** Allow camera in permissions dialog

### Database errors?
- **Check:** DATABASE_URL is correct
- **Run:** `npx prisma migrate reset` (WARNING: deletes all data)

## 📚 Next Steps

- Read `IMPLEMENTATION_GUIDE.md` for full documentation
- Check `docs/` folder for architecture details
- Review `SECURITY_DOCUMENTATION.md` for security features
- See `DEPLOYMENT.md` for production deployment

---

**Need Help?** Open an issue or contact the CSC 415 team!
