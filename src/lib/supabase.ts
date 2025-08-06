import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

function createSupabaseClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_PUBLIC_API_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_API_KEY;

  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!SUPABASE_PUBLIC_API_KEY) {
    throw new Error('Missing SUPABASE_PUBLIC_API_KEY environment variable');
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLIC_API_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export const supabase = createSupabaseClient();

// Export createClient function for compatibility
export { createSupabaseClient as createClient };

// 认证相关类型和函数
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  is_super_admin?: boolean;
}

// 从请求中验证用户身份
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return null;
    }

    const token = authorization.replace('Bearer ', '');

    // 创建带有用户token的supabase客户端
    const supabaseWithAuth = await createAuthenticatedClient(token);

    // 验证JWT token
    const {
      data: { user },
      error,
    } = await supabaseWithAuth.auth.getUser();

    if (error || !user) {
      return null;
    }

    // 获取用户profile信息
    const { data: profile } = await supabaseWithAuth
      .from('profiles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role,
      is_super_admin: profile?.is_super_admin,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// 创建带有用户认证的Supabase客户端
export async function createAuthenticatedClient(token: string) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_PUBLIC_API_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLIC_API_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLIC_API_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

// 检查用户权限
export function checkPermission(
  user: AuthUser,
  action: 'read' | 'write' | 'delete',
  resourceUserId?: string
): boolean {
  // 超级管理员可以访问所有资源
  if (user.is_super_admin) {
    return true;
  }

  // 管理员可以访问所有资源
  if (user.role === 'admin') {
    return true;
  }

  // 普通用户只能访问自己的资源
  if (action === 'read' || action === 'write' || action === 'delete') {
    return resourceUserId ? user.id === resourceUserId : true;
  }

  return false;
}
