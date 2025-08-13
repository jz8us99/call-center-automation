import { createClient } from '@supabase/supabase-js';

// Note: service_role key is required here, it can bypass RLS
// If no service_role key, we'll use regular client but disable RLS checks

function createSupabaseAdmin() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  });
}

// Server-side client for API routes, can bypass RLS
export const supabaseAdmin = createSupabaseAdmin();

// For compatibility, also export as supabase
export const supabase = supabaseAdmin;
