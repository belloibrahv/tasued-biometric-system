# Onboarding Flow - Visual Guide

## User Journey Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐
    │  Registration Page   │
    │  (2-step form)       │
    │  ✓ Personal Info     │
    │  ✓ Academic Info     │
    │  ✓ Credentials       │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │  Supabase Auth       │
    │  Create Account      │
    │  Auto-login          │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Registration Success │
    │ (5s countdown)       │
    │ ✓ Show Details       │
    │ ✓ Celebrate          │
    │ ✓ Auto-redirect      │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │  Onboarding Guide    │
    │  (3-step process)    │
    │  ✓ Welcome           │
    │  ✓ Biometric Info    │
    │  ✓ QR Code Info      │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Biometric Enrollment │
    │ ✓ Facial Capture     │
    │ ✓ Embedding Gen      │
    │ ✓ DB Sync            │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │ Onboarding Complete  │
    │ (3s countdown)       │
    │ ✓ Celebrate          │
    │ ✓ Show Checklist     │
    │ ✓ Auto-redirect      │
    └──────────────────────┘
              │
              ▼
    ┌──────────────────────┐
    │     Dashboard        │
    │  ✓ Full Access       │
    │  ✓ All Features      │
    └──────────────────────┘
```

## Page Layouts

### 1. Registration Page
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │                  │  │  Create Account                  │ │
│  │  Left Panel      │  │  Step 1 of 2                     │ │
│  │  (Desktop Only)  │  │                                  │ │
│  │                  │  │  ┌─────────────────────────────┐ │ │
│  │  • Logo          │  │  │ First Name | Last Name      │ │ │
│  │  • Headline      │  │  └─────────────────────────────┘ │ │
│  │  • Benefits      │  │  ┌─────────────────────────────┐ │ │
│  │  • Sign In Link  │  │  │ Email Address               │ │ │
│  │                  │  │  └─────────────────────────────┘ │ │
│  │                  │  │  ┌─────────────────────────────┐ │ │
│  │                  │  │  │ Matric Number               │ │ │
│  │                  │  │  └─────────────────────────────┘ │ │
│  │                  │  │  ┌─────────────────────────────┐ │ │
│  │                  │  │  │ Phone Number (Optional)     │ │ │
│  │                  │  │  └─────────────────────────────┘ │ │
│  │                  │  │                                  │ │
│  │                  │  │  [Continue →]                   │ │
│  │                  │  │                                  │ │
│  └──────────────────┘  └──────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Registration Success Page
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    Dark Gradient Background                  │
│                                                               │
│                         ✓ Success Icon                       │
│                      (Animated Pulse)                        │
│                                                               │
│                  Welcome to BioVault!                        │
│                  Hi, John! 👋                                │
│                                                               │
│              Your account has been created                   │
│                                                               │
│         ┌─────────────────────────────────────┐             │
│         │ Email: john@example.com             │             │
│         │ Matric: 20220294001                 │             │
│         │ Department: Computer Science        │             │
│         └─────────────────────────────────────┘             │
│                                                               │
│         Next: Biometric enrollment & QR code                │
│                                                               │
│         [Continue to Setup]                                  │
│         Redirecting in 5s                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Onboarding Page
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Setup Progress                                    1 of 3    │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ ✓ Welcome│  │ Biometric│  │ QR Code  │                   │
│  │ Welcome  │  │ Facial   │  │ Generate │                   │
│  │ to Setup │  │ Recog    │  │ QR Code  │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              🛡️ Welcome to BioVault                      │ │
│  │                                                           │ │
│  │         Let's secure your account in just a              │ │
│  │              few minutes.                                │ │
│  │                                                           │ │
│  │  ✓ Biometric Security                                    │ │
│  │    Enroll your facial recognition for secure access      │ │
│  │                                                           │ │
│  │  ✓ QR Code Access                                        │ │
│  │    Generate your unique QR code for quick verification   │ │
│  │                                                           │ │
│  │  ✓ Quick Setup                                           │ │
│  │    Complete setup in less than 5 minutes                 │ │
│  │                                                           │ │
│  │  [Skip for Now]  [Get Started →]                         │ │
│  │                                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4. Onboarding Complete Page
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    Dark Gradient Background                  │
│                                                               │
│                    ✓ Success Icon                            │
│                  (Animated Pulse + Ripple)                   │
│                                                               │
│                    🎉 ✨ 🎊 (Confetti)                       │
│                                                               │
│                      All Set!                                │
│                  Great job, John!                            │
│                                                               │
│              Your account is now fully                       │
│                  configured and ready                        │
│                                                               │
│         ┌─────────────────────────────────────┐             │
│         │ ✓ Account Created                   │             │
│         │ ✓ Biometric Enrolled                │             │
│         │ ✓ QR Code Generated                 │             │
│         └─────────────────────────────────────┘             │
│                                                               │
│         You can now: Access all services,                    │
│         verify identity, track attendance                    │
│                                                               │
│         [Go to Dashboard →]                                  │
│         Redirecting in 3s                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
OnboardingPage
├── Progress Bar
│   ├── Progress Indicator (%)
│   └── Step Indicators
│       ├── Step 1 (Welcome)
│       ├── Step 2 (Biometric)
│       └── Step 3 (QR Code)
│
├── AnimatePresence
│   ├── WelcomeStep
│   │   ├── Icon
│   │   ├── Title
│   │   ├── Description
│   │   ├── FeatureItems
│   │   │   ├── FeatureItem (Biometric)
│   │   │   ├── FeatureItem (QR Code)
│   │   │   └── FeatureItem (Quick Setup)
│   │   └── Buttons
│   │       ├── Skip Button
│   │       └── Continue Button
│   │
│   ├── BiometricStep
│   │   ├── Icon
│   │   ├── Title
│   │   ├── Description
│   │   ├── Info Box
│   │   ├── Tip Box
│   │   └── Buttons
│   │
│   └── QRCodeStep
│       ├── Icon
│       ├── Title
│       ├── Description
│       ├── Info Box
│       ├── Tip Box
│       └── Buttons
│
└── Toaster (Notifications)
```

## Color Scheme

### Primary Colors
```
Blue (Welcome)
├─ from-blue-500 (#3b82f6)
└─ to-blue-600 (#2563eb)

Purple (Biometric)
├─ from-purple-500 (#a855f7)
└─ to-purple-600 (#9333ea)

Green (QR Code & Success)
├─ from-green-500 (#22c55e)
└─ to-green-600 (#16a34a)
```

### Background
```
Dark Gradient
├─ from-slate-900 (#0f172a)
├─ via-slate-800 (#1e293b)
└─ to-slate-900 (#0f172a)
```

### Accent Colors
```
Slate (Borders & Text)
├─ slate-600 (#475569)
├─ slate-700 (#334155)
└─ slate-800 (#1e293b)

Text
├─ white (#ffffff)
├─ slate-300 (#cbd5e1)
└─ slate-400 (#94a3b8)
```

## Animation Timings

```
Page Entrance
├─ Duration: 300ms
├─ Easing: ease-out
└─ Type: fade + slide up

Progress Bar
├─ Duration: 500ms
├─ Easing: easeOut
└─ Type: width animation

Icon Pulse
├─ Duration: 2s
├─ Repeat: infinite
├─ Delay: 2s between repeats
└─ Type: scale animation

Confetti
├─ Duration: 2s
├─ Repeat: infinite
├─ Delay: staggered (0.1s each)
└─ Type: y + x + opacity animation
```

## Responsive Breakpoints

```
Mobile (< 640px)
├─ Single column layout
├─ Full width buttons
├─ Smaller icons
└─ Compact spacing

Tablet (640px - 1024px)
├─ Adjusted spacing
├─ Medium icons
└─ Flexible layout

Desktop (> 1024px)
├─ Full layout
├─ Large icons
├─ Generous spacing
└─ Side-by-side elements
```

## State Transitions

```
Registration Success Page
├─ Initial: opacity 0, scale 0.95
├─ Animate: opacity 1, scale 1
└─ Duration: 500ms

Onboarding Steps
├─ Exit: opacity 0, y -20
├─ Initial: opacity 0, y 20
├─ Animate: opacity 1, y 0
└─ Duration: 300ms

Completion Page
├─ Initial: opacity 0, scale 0.95
├─ Animate: opacity 1, scale 1
├─ Icon Pulse: scale [1, 1.1, 1]
├─ Icon Ripple: scale [1, 1.3], opacity [1, 0]
└─ Duration: 500ms
```

## Accessibility Features

```
Semantic HTML
├─ <button> for interactive elements
├─ <form> for form inputs
├─ <h1>, <h2>, <h3> for headings
└─ <p> for paragraphs

ARIA Labels
├─ aria-label for icons
├─ aria-describedby for descriptions
├─ aria-current for active steps
└─ role="progressbar" for progress

Keyboard Navigation
├─ Tab: Move between elements
├─ Enter/Space: Activate buttons
├─ Escape: Close modals
└─ Arrow keys: Navigate steps

Focus Management
├─ Visible focus indicators
├─ Focus trap in modals
├─ Focus restoration
└─ Skip links
```

## Mobile Optimization

```
Touch Targets
├─ Minimum 44x44px
├─ Adequate spacing
└─ Easy to tap

Text Sizing
├─ Base: 16px
├─ Headings: 24-32px
├─ Body: 14-16px
└─ Small: 12-14px

Viewport
├─ width=device-width
├─ initial-scale=1
└─ viewport-fit=cover

Performance
├─ Lazy load images
├─ Minimize animations
├─ Optimize bundle size
└─ Cache aggressively
```

## Error States

```
Form Validation
├─ Red border on error
├─ Error message below field
├─ Icon indicator
└─ Toast notification

Network Error
├─ Retry button
├─ Error message
├─ Fallback UI
└─ Logging

Biometric Error
├─ Camera permission denied
├─ Poor lighting
├─ Face not detected
└─ Retry option
```

## Success Indicators

```
Visual Feedback
├─ Green checkmarks
├─ Success icons
├─ Animated transitions
└─ Toast notifications

Progress Tracking
├─ Progress bar
├─ Step indicators
├─ Completion checklist
└─ Countdown timer

Confirmation
├─ Account details display
├─ Completed items list
├─ Next steps explanation
└─ Call-to-action button
```

---

**Last Updated:** January 2, 2026
**Version:** 1.0
