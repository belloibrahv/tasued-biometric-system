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
    '/api/auth/sync-profile',
    '/api/health',
  ];

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/static')
  );

  // If user is already logged in, don't allow them to go to login/register
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isPublicRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Dashboard / Enrollment check
  const role = user.user_metadata?.role || 'STUDENT';
  const biometricEnrolled = user.user_metadata?.biometricEnrolled === true;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/student')) {
    if (!biometricEnrolled && pathname !== '/enroll-biometric' && pathname !== '/api/auth/me') {
      return NextResponse.redirect(new URL('/enroll-biometric', request.url));
    }
  }

  // Role-based access control
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/operator') && role !== 'OPERATOR' && role !== 'ADMIN') {
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
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', role);

  // Copy over the cookies from supabaseResponse (which contains the refreshed session)
  supabaseResponse.cookies.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|sounds).*)',
  ],
};
