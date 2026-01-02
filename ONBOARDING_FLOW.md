# Post-Registration Onboarding Flow

## Overview

This document describes the professional post-registration flow implemented in BioVault. After successful registration, users are guided through a structured onboarding experience before accessing the main dashboard.

## Flow Diagram

```
Registration Form
    ↓
Validate & Create Account (Supabase Auth)
    ↓
Auto-login (if session created)
    ↓
Registration Success Page (5s countdown)
    ↓
Onboarding Page (3-step guided setup)
    ├─ Step 1: Welcome & Overview
    ├─ Step 2: Biometric Enrollment Info
    └─ Step 3: QR Code Generation Info
    ↓
Biometric Enrollment Page
    ├─ Facial Recognition Capture
    ├─ Embedding Generation
    └─ Database Sync
    ↓
Onboarding Complete Page (3s countdown)
    ↓
Dashboard (Main Application)
```

## Pages and Components

### 1. Registration Page (`app/register/page.tsx`)
**Purpose:** Collect user information and create account

**Features:**
- Two-step form process
- Step 1: Personal information (name, email, matric number, phone)
- Step 2: Academic info (department, level) and credentials (password)
- Real-time validation
- Progress indicator
- Responsive design with desktop/mobile layouts

**Post-Registration Behavior:**
- On success: Redirects to `/registration-success`
- On email confirmation required: Redirects to `/login` with message
- Toast notifications for user feedback

### 2. Registration Success Page (`app/registration-success/page.tsx`)
**Purpose:** Celebrate successful registration and prepare for onboarding

**Features:**
- Animated success icon with pulse effect
- Display of registered account details (email, matric number, department)
- 5-second countdown timer
- Manual "Continue to Setup" button
- Professional gradient background
- Smooth transitions

**User Experience:**
- Confirms account creation
- Shows account details for verification
- Explains next steps
- Auto-redirects to onboarding after 5 seconds

### 3. Onboarding Page (`app/onboarding/page.tsx`)
**Purpose:** Guide users through setup process with professional UI

**Features:**
- **Progress Tracking:**
  - Visual progress bar
  - Step indicators with icons
  - Current step highlighting
  - Completion checkmarks

- **Three-Step Process:**
  1. **Welcome Step**
     - Personalized greeting
     - Feature highlights (Biometric Security, QR Code Access, Quick Setup)
     - "Get Started" and "Skip for Now" buttons

  2. **Biometric Step**
     - Explanation of facial recognition
     - Benefits of biometric security
     - Tips for best results
     - Continue/Skip options

  3. **QR Code Step**
     - Explanation of QR code functionality
     - How it's used for verification
     - Information about regeneration
     - Complete Setup button

- **Design Elements:**
  - Smooth page transitions with Framer Motion
  - Gradient backgrounds and icons
  - Color-coded steps (blue, purple, green)
  - Responsive layout
  - Skip option available at each step

**User Interactions:**
- Users can proceed through steps sequentially
- Skip option allows bypassing to biometric enrollment
- All steps lead to biometric enrollment page

### 4. Biometric Enrollment Page (`app/enroll-biometric/page.tsx`)
**Purpose:** Capture facial biometric data

**Features:**
- Webcam access with permission handling
- Real-time facial capture
- Embedding generation via ML model
- Quality assessment
- Retry mechanism
- Error handling for camera issues

**Process:**
1. Request camera permission
2. Capture facial image
3. Generate facial embedding
4. Submit to `/api/biometric/enroll`
5. Update user metadata with `biometricEnrolled: true`
6. Redirect to onboarding completion page

### 5. Onboarding Complete Page (`app/onboarding-complete/page.tsx`)
**Purpose:** Celebrate completion and transition to dashboard

**Features:**
- Animated success icon with pulse and ripple effects
- Confetti animation (emoji-based)
- Completed items checklist
- Account readiness confirmation
- 3-second countdown timer
- Manual "Go to Dashboard" button

**User Experience:**
- Celebrates successful setup
- Shows all completed steps
- Explains what users can now do
- Auto-redirects to dashboard after 3 seconds

## Authentication & Authorization

### Middleware Protection (`middleware.ts`)

**Public Routes:**
- `/` (home)
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify/*` (email verification)

**Auth-Only Routes (No Biometric Required):**
- `/enroll-biometric`
- `/onboarding`
- `/onboarding-complete`
- `/registration-success`
- `/api/biometric/enroll`
- `/api/auth/me`
- `/api/auth/logout`

**Protected Routes (Biometric Required):**
- `/dashboard/*` (all dashboard pages)
- `/admin/*` (admin pages)
- `/operator/*` (operator pages)

### Session Management

**Token Storage:**
- HttpOnly cookies (secure, not accessible to JavaScript)
- Automatically refreshed on each request via middleware
- Verified via `/api/auth/me` endpoint

**User Metadata:**
- Stored in Supabase Auth metadata
- Synced to PostgreSQL database
- Includes: firstName, lastName, matricNumber, department, level, type, role, biometricEnrolled

## Database Schema

### User Table
```prisma
model User {
  id                String        @id @default(uuid())
  matricNumber      String        @unique
  email             String        @unique
  firstName         String
  lastName          String
  otherNames        String?
  phoneNumber       String?
  department        String?
  level             String?
  profilePhoto      String?
  isActive          Boolean       @default(true)
  biometricEnrolled Boolean       @default(false)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relations
  biometricData     BiometricData?
  qrCodes           QRCode[]
  accessLogs        AccessLog[]
  sessions          Session[]
  auditLogs         AuditLog[]
}
```

### BiometricData Table
```prisma
model BiometricData {
  id                  String    @id @default(uuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  facialTemplate      String?   // Encrypted embedding
  facialQuality       Float?
  facialPhotos        String[]  // Array of photo URLs
  enrolledAt          DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Biometric
- `POST /api/biometric/enroll` - Enroll facial biometric
- `POST /api/biometric/facial-embed` - Generate facial embedding
- `GET /api/biometric/check-enrollment` - Check enrollment status

### User
- `GET /api/users` - Get user list (admin)
- `POST /api/users` - Create user (via registration)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

## Best Practices Implemented

### 1. User Experience
- **Progressive Disclosure:** Information revealed step-by-step
- **Clear Feedback:** Toast notifications and visual indicators
- **Graceful Degradation:** Skip options available at each step
- **Smooth Transitions:** Framer Motion animations for professional feel
- **Mobile Responsive:** Works seamlessly on all devices

### 2. Security
- **HttpOnly Cookies:** Token storage secure from XSS
- **Session Validation:** Every request verified via middleware
- **Biometric Requirement:** Mandatory for students before dashboard access
- **Encrypted Storage:** Biometric templates encrypted in database
- **Audit Logging:** All actions logged for compliance

### 3. Performance
- **Lazy Loading:** Components load on demand
- **Optimized Images:** Compressed and cached
- **Efficient Queries:** Minimal database calls
- **Client-Side Validation:** Reduces server load
- **Streaming:** Progressive page rendering

### 4. Accessibility
- **Semantic HTML:** Proper heading hierarchy
- **ARIA Labels:** Screen reader support
- **Keyboard Navigation:** Full keyboard support
- **Color Contrast:** WCAG AA compliant
- **Focus Management:** Clear focus indicators

### 5. Error Handling
- **Graceful Fallbacks:** Handles missing data
- **User-Friendly Messages:** Clear error descriptions
- **Retry Mechanisms:** Allows recovery from failures
- **Logging:** Detailed error logs for debugging
- **Timeout Protection:** Prevents hanging requests

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### Middleware Configuration
The middleware automatically handles:
- Session refresh on every request
- Role-based routing (student/admin/operator)
- Biometric enrollment enforcement
- Redirect loops prevention

## Testing the Flow

### Manual Testing Steps

1. **Registration:**
   - Navigate to `/register`
   - Fill in all required fields
   - Submit form
   - Verify redirect to `/registration-success`

2. **Success Page:**
   - Verify account details displayed
   - Wait for 5-second countdown
   - Or click "Continue to Setup"
   - Verify redirect to `/onboarding`

3. **Onboarding:**
   - Verify progress bar updates
   - Go through all 3 steps
   - Test skip functionality
   - Complete final step
   - Verify redirect to `/enroll-biometric`

4. **Biometric Enrollment:**
   - Allow camera access
   - Capture facial image
   - Verify embedding generation
   - Verify redirect to `/onboarding-complete`

5. **Completion:**
   - Verify success animation
   - Wait for 3-second countdown
   - Or click "Go to Dashboard"
   - Verify redirect to `/dashboard`

6. **Dashboard Access:**
   - Verify user data displayed
   - Verify all dashboard features accessible
   - Verify logout functionality

### Automated Testing
```bash
# Run test suite
npm run test

# Run specific test file
npm run test -- onboarding.test.ts

# Run with coverage
npm run test -- --coverage
```

## Troubleshooting

### Issue: User stuck on registration page
**Solution:** Check browser console for errors, verify Supabase credentials

### Issue: Biometric enrollment fails
**Solution:** Check camera permissions, ensure good lighting, try different browser

### Issue: Redirect loops
**Solution:** Clear browser cookies, check middleware configuration

### Issue: User data not syncing
**Solution:** Check database connection, verify Supabase metadata format

## Future Enhancements

1. **Multi-factor Authentication:** Add SMS/email verification
2. **Fingerprint Enrollment:** Add fingerprint biometric option
3. **Onboarding Analytics:** Track completion rates and drop-off points
4. **Customizable Onboarding:** Allow admins to customize flow
5. **Offline Support:** Cache onboarding data for offline access
6. **A/B Testing:** Test different onboarding variations
7. **Accessibility Improvements:** Enhanced screen reader support
8. **Internationalization:** Multi-language support

## Support

For issues or questions about the onboarding flow:
1. Check this documentation
2. Review error logs in browser console
3. Check server logs for API errors
4. Contact development team

---

**Last Updated:** January 2, 2026
**Version:** 1.0
**Status:** Production Ready
