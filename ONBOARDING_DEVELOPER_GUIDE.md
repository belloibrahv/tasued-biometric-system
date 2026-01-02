# Onboarding Flow - Developer Quick Reference

## Quick Start

### File Structure
```
app/
├── register/
│   └── page.tsx                 # Registration form (2-step)
├── registration-success/
│   └── page.tsx                 # Success confirmation (5s countdown)
├── onboarding/
│   └── page.tsx                 # Guided setup (3 steps)
├── enroll-biometric/
│   └── page.tsx                 # Facial capture (existing)
└── onboarding-complete/
    └── page.tsx                 # Completion celebration (3s countdown)

middleware.ts                     # Route protection & redirects
```

## User Journey

```
User Registration
    ↓
/register (2-step form)
    ↓
/registration-success (5s countdown)
    ↓
/onboarding (3-step guide)
    ├─ Welcome
    ├─ Biometric Info
    └─ QR Code Info
    ↓
/enroll-biometric (facial capture)
    ↓
/onboarding-complete (3s countdown)
    ↓
/dashboard (main app)
```

## Key Features

### 1. Registration Success Page
- **Location:** `app/registration-success/page.tsx`
- **Purpose:** Confirm account creation
- **Features:**
  - Animated success icon
  - Account details display
  - 5-second auto-redirect
  - Manual continue button

### 2. Onboarding Page
- **Location:** `app/onboarding/page.tsx`
- **Purpose:** Guide users through setup
- **Features:**
  - 3-step process with progress tracking
  - Animated transitions
  - Skip option at each step
  - Color-coded steps (blue, purple, green)

### 3. Onboarding Complete Page
- **Location:** `app/onboarding-complete/page.tsx`
- **Purpose:** Celebrate setup completion
- **Features:**
  - Confetti animation
  - Completed items checklist
  - 3-second auto-redirect
  - Manual dashboard button

## Middleware Configuration

### Protected Routes
```typescript
// Routes requiring authentication but NOT biometric enrollment
const authOnlyRoutes = [
  '/enroll-biometric',
  '/onboarding',
  '/onboarding-complete',
  '/registration-success',
  '/api/biometric/enroll',
  '/api/auth/me',
  '/api/auth/logout',
];

// Routes requiring both authentication AND biometric enrollment
// (all other routes except public ones)
```

### Redirect Logic
```typescript
// If user is logged in but not enrolled:
// /login or /register → /enroll-biometric

// If user is admin:
// /login or /register → /admin

// If user is operator:
// /login or /register → /operator
```

## API Integration

### Registration Flow
```typescript
// 1. User submits registration form
POST /api/auth/signup (via Supabase)

// 2. User auto-logged in
// Session created with HttpOnly cookie

// 3. Redirect to success page
window.location.href = '/registration-success'

// 4. Fetch user data
GET /api/auth/me

// 5. Redirect to onboarding
window.location.href = '/onboarding'

// 6. User completes onboarding
// Redirects to /enroll-biometric

// 7. Biometric enrollment
POST /api/biometric/enroll

// 8. Redirect to completion
window.location.href = '/onboarding-complete'

// 9. Final redirect to dashboard
window.location.href = '/dashboard'
```

## Component Patterns

### Success Page Pattern
```typescript
// Fetch user data
useEffect(() => {
  const fetchUser = async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  };
  fetchUser();
}, []);

// Auto-redirect after countdown
useEffect(() => {
  const timer = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        router.push('/next-page');
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  return () => clearInterval(timer);
}, [router]);
```

### Onboarding Step Pattern
```typescript
// Step component with animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Step content */}
</motion.div>

// Progress tracking
const currentStepIndex = steps.findIndex(s => s.id === currentStep);
const progress = ((currentStepIndex + 1) / steps.length) * 100;
```

## Styling Approach

### Color Scheme
- **Primary:** Blue (welcome, general)
- **Secondary:** Purple (biometric)
- **Success:** Green (QR code, completion)
- **Background:** Slate gradient (dark theme)

### Responsive Design
```typescript
// Desktop: Full layout with sidebar
// Tablet: Adjusted spacing
// Mobile: Single column, full width

// Breakpoints
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

## Common Customizations

### Change Countdown Timer
```typescript
// In registration-success/page.tsx
const [countdown, setCountdown] = useState(5); // Change this number

// In onboarding-complete/page.tsx
const [countdown, setCountdown] = useState(3); // Change this number
```

### Modify Onboarding Steps
```typescript
// In onboarding/page.tsx
const steps = [
  {
    id: 'welcome',
    title: 'Your Title',
    description: 'Your description',
    icon: YourIcon,
  },
  // Add more steps...
];
```

### Change Colors
```typescript
// Update Tailwind classes
// from-blue-500 → from-purple-500
// to-blue-600 → to-purple-600
// bg-green-500 → bg-yellow-500
```

### Disable Skip Option
```typescript
// In onboarding/page.tsx
// Remove or hide the skip button
{/* <button onClick={onSkip}>Skip</button> */}
```

## Testing Checklist

- [ ] Registration form validates correctly
- [ ] Success page displays account details
- [ ] 5-second countdown works
- [ ] Manual continue button works
- [ ] Onboarding steps progress correctly
- [ ] Skip option works at each step
- [ ] Progress bar updates
- [ ] Biometric enrollment completes
- [ ] Completion page shows animations
- [ ] 3-second countdown works
- [ ] Dashboard loads after completion
- [ ] Mobile responsive on all pages
- [ ] Animations smooth and performant
- [ ] Error handling works
- [ ] Logout clears session

## Performance Tips

1. **Lazy Load Images:** Use Next.js Image component
2. **Optimize Animations:** Use Framer Motion's `AnimatePresence`
3. **Minimize Re-renders:** Use `useCallback` for handlers
4. **Cache User Data:** Store in localStorage after fetch
5. **Prefetch Routes:** Use Next.js Link prefetch

## Debugging

### Check User Session
```typescript
// In browser console
const res = await fetch('/api/auth/me');
const data = await res.json();
console.log(data);
```

### Check Middleware Logs
```typescript
// In middleware.ts
console.log('User:', user);
console.log('Pathname:', pathname);
console.log('Redirect target:', target);
```

### Check Biometric Status
```typescript
// In browser console
const res = await fetch('/api/auth/me');
const data = await res.json();
console.log('Biometric Enrolled:', data.user.biometricEnrolled);
```

## Common Issues & Solutions

### Issue: Redirect loop
**Cause:** Middleware configuration incorrect
**Solution:** Check `authOnlyRoutes` includes all onboarding pages

### Issue: User data not loading
**Cause:** `/api/auth/me` failing
**Solution:** Check Supabase connection, verify token

### Issue: Animations stuttering
**Cause:** Too many animations running
**Solution:** Reduce animation complexity, use `will-change` CSS

### Issue: Mobile layout broken
**Cause:** Tailwind breakpoints not applied
**Solution:** Check responsive classes, test on actual device

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Supabase auth configured
- [ ] Email templates configured
- [ ] Biometric service running
- [ ] CDN configured for images
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] SSL certificate valid
- [ ] Rate limiting configured
- [ ] CORS headers correct
- [ ] Security headers set

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Hooks Docs](https://react.dev/reference/react)

---

**Last Updated:** January 2, 2026
**Version:** 1.0
