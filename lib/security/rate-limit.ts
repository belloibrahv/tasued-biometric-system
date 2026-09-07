import { NextRequest } from 'next/server';

// Simple in-memory rate limiter (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Window in milliseconds
  max: number; // Max requests per window
}

export class RateLimiter {
  private windowMs: number;
  private max: number;

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;
  }

  checkLimit(identifier: string): { allowed: boolean; resetTime?: number; message?: string } {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record) {
      // First request from this identifier
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    if (now > record.resetTime) {
      // Window has passed, reset
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return { allowed: true };
    }

    if (record.count >= this.max) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: record.resetTime,
        message: `Rate limit exceeded. Try again after ${new Date(record.resetTime).toLocaleTimeString()}`,
      };
    }

    // Increment count
    rateLimitMap.set(identifier, {
      count: record.count + 1,
      resetTime: record.resetTime,
    });

    return { allowed: true };
  }
}

// Rate limiters for different endpoints
export const biometricRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit authentication attempts
});

// Middleware function to apply rate limiting
export function withRateLimit(
  req: NextRequest,
  limiter: RateLimiter,
  identifier?: string
): { allowed: boolean; message?: string } {
  // Use IP address as identifier if not provided
  const id = identifier || req.ip || req.headers.get('x-forwarded-for') || 'unknown';

  const result = limiter.checkLimit(id);

  if (!result.allowed) {
    return {
      allowed: false,
      message: result.message || 'Rate limit exceeded',
    };
  }

  return { allowed: true };
}
