import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Security middleware to protect API routes
export async function middleware(request: NextRequest) {
  // Define protected routes
  const protectedRoutes = [
    '/api/biometric',
    '/api/users',
    '/api/export',
    '/api/import',
    '/dashboard',
    '/collect',
    '/records',
    '/api/auth'
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route) &&
    !request.nextUrl.pathname.startsWith('/api/auth/login') // Allow login
  );
  
  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    
    const token = authHeader.substring(7);
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
    '/api/:path*',
    '/dashboard/:path*',
    '/collect/:path*',
    '/records/:path*',
    '/export/:path*',
    '/admin/:path*'
  ],
};