import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { securityConfig } from '@/lib/security/config';
import { withRateLimit, authRateLimiter, biometricRateLimiter } from '@/lib/security/rate-limit';

// Production security middleware
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for sensitive API routes
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
    const rateLimit = withRateLimit(request, authRateLimiter);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }
  }

  if (pathname.startsWith('/api/biometric')) {
    const rateLimit = withRateLimit(request, biometricRateLimiter);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }
  }

  // 2. Authentication Protection
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
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route) &&
    !pathname.startsWith('/api/auth/login') &&
    !pathname.startsWith('/api/auth/register')
  );

  let response = NextResponse.next();

  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    const token = request.cookies.get('auth-token')?.value || authHeader?.split(' ')[1];

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    const decodedToken = verifyToken(token);

    if (!decodedToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.id);
    requestHeaders.set('x-user-role', decodedToken.role);
    requestHeaders.set('x-user-email', decodedToken.email);

    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  // 3. Security Headers
  const headers = response.headers;

  // CSP
  const csp = Object.entries(securityConfig.csp.directives)
    .map(([key, values]) => `${key.replace(/[A-Z]/g, m => '-' + m.toLowerCase())} ${values.join(' ')}`)
    .join('; ');
  headers.set('Content-Security-Policy', csp);

  // HSTS (only on production)
  if (process.env.NODE_ENV === 'production') {
    const hsts = securityConfig.securityHeaders.strictTransportSecurity;
    headers.set('Strict-Transport-Security', `max-age=${hsts.maxAge}; includeSubDomains${hsts.preload ? '; preload' : ''}`);
  }

  headers.set('X-Content-Type-Options', securityConfig.securityHeaders.xContentTypeOptions);
  headers.set('X-Frame-Options', securityConfig.securityHeaders.xFrameOptions);
  headers.set('X-XSS-Protection', securityConfig.securityHeaders.xXssProtection);
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
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