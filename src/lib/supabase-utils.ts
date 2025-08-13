import { createClient } from '@supabase/supabase-js';

/**
 * @deprecated SECURITY WARNING: This function bypasses Row Level Security (RLS)
 *
 * ⚠️  This function uses the service role key which bypasses all RLS policies.
 * It should only be used for system-level operations like database setup,
 * debugging, or data seeding where admin access is explicitly required.
 *
 * For user-related operations, use `withAuth` from '@/lib/api-auth-helper' instead:
 *
 * @example
 * ```typescript
 * // ❌ Don't use this for user operations
 * const supabase = createServerSupabaseClient();
 *
 * // ✅ Use this instead
 * import { withAuth, isAuthError } from '@/lib/api-auth-helper';
 * const authResult = await withAuth(request);
 * if (isAuthError(authResult)) return authResult;
 * const { supabaseWithAuth } = authResult;
 * ```
 */
export function createServerSupabaseClient() {
  console.warn(
    '🚨 SECURITY WARNING: createServerSupabaseClient bypasses RLS. Only use for system operations.'
  );

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
  });
}
