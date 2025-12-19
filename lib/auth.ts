import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper to get encoded secret
function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

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
  [key: string]: any;
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  ensureSecret();

  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  ensureSecret();
  try {
    if (!token || token.length < 10) {
      return null;
    }

    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    const { payload } = await jose.jwtVerify(tokenValue, getSecretKey());
    return payload as unknown as JWTPayload;
  } catch (error: any) {
    console.error('Token verification error:', error.message || error);
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    return jose.decodeJwt(tokenValue) as unknown as JWTPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}