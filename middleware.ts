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
    '/api/biometric/facial-embed', // Whitelist biometric processing (stateless)
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/static')
  );

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
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isPublicRoute) {
    return supabaseResponse;
  }

  if (!user) {
    // If this is an API request, return 401 instead of redirecting to HTML (which breaks JSON parsing)
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

  // Check if user is admin/staff
  const isAdmin = userType === 'admin' || 
                  role === 'ADMIN' || 
                  role === 'SUPER_ADMIN' || 
                  role === 'OPERATOR';

  // If admin tries to access dashboard, redirect to admin panel
  if (isAdmin && (pathname.startsWith('/dashboard') || pathname.startsWith('/student'))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/student')) {
    if (!biometricEnrolled && pathname !== '/enroll-biometric' && pathname !== '/api/auth/me') {
      return NextResponse.redirect(new URL('/enroll-biometric', request.url));
    }
  }

  // Role-based access control - allow multiple admin roles
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/operator') && !isAdmin && role !== 'OPERATOR') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to request headers for downstream use
  // Note: We create a new response if we need to modify headers,
  // but we must preserve the cookies from supabaseResponse
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers)
    }
  });

  // Inject user info
  response.headers.set('x-user-id', user?.id || '');
  response.headers.set('x-user-role', role);

  // Copy over the cookies from supabaseResponse (which contains the refreshed session)
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
