import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // 1. Refresh session and get user
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Path protection logic...
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/health',
    '/api/biometric/facial-embed',
    '/api/biometric/check-enrollment',
    '/api/verify-qr',
    '/verify',
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ];

  // Routes that require auth but not biometric enrollment
  const authOnlyRoutes = [
    '/enroll-biometric',
    '/onboarding',
    '/onboarding-complete',
    '/registration-success',
    '/api/biometric/enroll',
    '/api/auth/me',
    '/api/auth/logout',
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.startsWith('/verify/') ||
    pathname.startsWith('/api/verify-qr/')
  );

  const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route));

  // If user is already logged in, redirect to appropriate dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    const userType = user.user_metadata?.type || 'student';
    const role = user.user_metadata?.role || 'STUDENT';
    const isAdmin = userType === 'admin' || 
                    role === 'ADMIN' || 
                    role === 'SUPER_ADMIN' || 
                    role === 'OPERATOR';
    
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url));
    } else {
      // For students, check biometric enrollment from session metadata
      const biometricEnrolled = user.user_metadata?.biometricEnrolled === true;
      
      if (!biometricEnrolled) {
        return NextResponse.redirect(new URL('/enroll-biometric', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isPublicRoute) {
    return supabaseResponse;
  }

  if (!user) {
    // If this is an API request, return 401 instead of redirecting to HTML
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Dashboard / Enrollment check
  const role = user.user_metadata?.role || 'STUDENT';
  const userType = user.user_metadata?.type || 'student';
  const biometricEnrolled = user.user_metadata?.biometricEnrolled === true;

  // Check if user is admin/staff - admins don't need biometric enrollment
  const isAdmin = userType === 'admin' || 
                  role === 'ADMIN' || 
                  role === 'SUPER_ADMIN' || 
                  role === 'OPERATOR';

  // If admin tries to access dashboard, redirect to admin panel
  if (isAdmin && (pathname.startsWith('/dashboard') || pathname.startsWith('/student'))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Allow auth-only routes without biometric check
  if (isAuthOnlyRoute) {
    const response = NextResponse.next({
      request: { headers: new Headers(request.headers) }
    });
    response.headers.set('x-user-id', user?.id || '');
    response.headers.set('x-user-role', role);
    response.headers.set('x-user-type', userType);
    
    if (supabaseResponse && typeof supabaseResponse.cookies?.getAll === 'function') {
      supabaseResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie.name, cookie.value, cookie);
      });
    }
    return response;
  }

  // Skip biometric check for admins/operators - they don't need it
  if (!isAdmin && (pathname.startsWith('/dashboard') || pathname.startsWith('/student'))) {
    if (!biometricEnrolled) {
      return NextResponse.redirect(new URL('/enroll-biometric', request.url));
    }
  }

  // Role-based access control
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/operator') && !isAdmin && role !== 'OPERATOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to request headers for downstream use
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers)
    }
  });

  response.headers.set('x-user-id', user?.id || '');
  response.headers.set('x-user-role', role);
  response.headers.set('x-user-type', userType);

  // Copy over the cookies from supabaseResponse
  if (supabaseResponse && typeof supabaseResponse.cookies?.getAll === 'function') {
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie);
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|sounds|manifest.json|sw.js|robots.txt|sitemap.xml).*)',
  ],
};
