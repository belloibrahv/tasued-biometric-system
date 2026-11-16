import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if Supabase sign out fails
  }

  // Clear all auth-related cookies
  const response = NextResponse.json({ success: true });

  // Clear the auth token cookie (our custom cookie)
  response.cookies.delete('auth-token');

  return response;
}
