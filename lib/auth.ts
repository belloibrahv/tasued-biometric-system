import { supabase } from './supabase';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  matricNumber?: string;
  type: string;
  biometricEnrolled: boolean;
  [key: string]: any;
}


export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    if (!token || token.length < 10) {
      return null;
    }

    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

    // Strictly verify with Supabase
    // Note: getUser() fetches the freshest data from the Supabase service, including metadata changes
    const { data: { user }, error } = await supabase.auth.getUser(tokenValue);

    if (error || !user) {
      console.warn('Auth: Token verification failed or user not found', error);
      return null;
    }

    // Map Supabase User to JWTPayload
    // We prioritize user_metadata for flags like role and biometricEnrolled
    const payload = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || user.user_metadata?.type?.toUpperCase() || 'STUDENT',
      matricNumber: user.user_metadata?.matric_number || '',
      type: user.user_metadata?.type || 'student',
      biometricEnrolled: user.user_metadata?.biometricEnrolled === true,
    };

    return payload;
  } catch (error: any) {
    console.error('Token verification error:', error.message || error);
    return null;
  }
}


export function decodeToken(token: string): JWTPayload | null {
  try {
    const tokenValue = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const base64Url = tokenValue.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}