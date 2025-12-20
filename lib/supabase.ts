
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  if (typeof window === 'undefined') {
    console.warn('Supabase environment variables are missing on the server/middleware');
  }
}

// Create a dummy client if variables are missing to avoid crash on import
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : {
    auth: {
      getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase variables') }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Missing Supabase variables') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Missing Supabase variables') }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Missing Supabase variables') }) }) })
    })
  } as any;
