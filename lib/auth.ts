import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper to ensure JWT_SECRET is set in production at runtime
function ensureSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    if (typeof window === 'undefined') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  ensureSecret();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

export function verifyToken(token: string): JWTPayload | null {
  ensureSecret();
  try {
    // Ensure token starts with "Bearer " or is a raw token
    if (!token || token.length < 10) {
      console.warn('Invalid token format');
      return null;
    }

    // Extract token from "Bearer <token>" format if needed
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    const decoded = jwt.verify(tokenValue, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token expired:', error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid token:', error);
    } else {
      console.error('Token verification error:', error);
    }
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    // Extract token from "Bearer <token>" format if needed
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const decoded = jwt.decode(tokenValue) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}