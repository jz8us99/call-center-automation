import { createClient } from '@supabase/supabase-js';

// 注意：这里需要使用service_role密钥，它可以绕过RLS
// 如果没有service_role密钥，我们将使用常规客户端但禁用RLS检查

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

// 服务端客户端，用于API路由，可以绕过RLS
export const supabaseAdmin = createSupabaseAdmin();
export const supabase = supabaseAdmin; // For backward compatibility
