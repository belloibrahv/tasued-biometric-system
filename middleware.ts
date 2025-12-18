import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Export the security middleware to protect routes
export default function middleware(request: NextRequest) {
  // Define protected routes
  const protectedRoutes = [
    '/api/biometric',
    '/api/users',
    '/api/export',
    '/api/import',
    '/dashboard',
    '/collect',
    '/records',
    '/admin',
    '/profile',
    // Add more protected routes here
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route) &&
    !request.nextUrl.pathname.startsWith('/api/auth/login') && // Allow login
    !request.nextUrl.pathname.startsWith('/api/auth/register') // Allow register
  );

  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authHeader?.split(' ')[1]; // Bearer token

    if (!token) {
      // For API routes, return JSON error
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        );
      } else {
        // For page routes, redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Add user info to request headers for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.id);
    requestHeaders.set('x-user-role', decodedToken.role);
    requestHeaders.set('x-user-email', decodedToken.email);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/login|api/auth/register).*)',
  ],
};