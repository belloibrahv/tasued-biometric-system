import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/sync-profile',
    '/api/health',
  ];

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/static')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/operator', '/enroll-biometric', '/api/dashboard', '/api/admin', '/api/operator', '/api/lectures', '/api/webauthn', '/api/biometric/enroll'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-middleware-auth', 'missing-token');
    return response;
  }

  // Verify token
  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('x-middleware-auth', 'invalid-token');
    response.cookies.delete('auth-token');
    return response;
  }

  // Role-based access control
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (payload.type !== 'admin' || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'ADMIN')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/operator') || pathname.startsWith('/api/operator')) {
    if (payload.type !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/dashboard')) {
    if (payload.type !== 'student') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check biometric enrollment from token payload
    // The biometricEnrolled flag is included in the JWT token
    if (!pathname.startsWith('/api/biometric/enroll') && !pathname.includes('/enroll-biometric')) {
      if (!payload.biometricEnrolled) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Biometric enrollment required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/enroll-biometric', request.url));
      }
    }
  }

  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role || 'STUDENT');
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-type', payload.type || 'student');

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|sounds).*)',
  ],
};
