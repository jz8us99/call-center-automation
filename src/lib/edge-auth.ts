import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export interface EdgeAuthUser {
  id: string;
  email: string;
  role?: string;
  is_super_admin?: boolean;
}

/**
 * Edge Runtime兼容的JWT验证函数
 * 使用jose库在Edge Runtime中验证JWT token
 */
export async function verifyJWTEdgeRuntime(
  request: NextRequest
): Promise<EdgeAuthUser | null> {
  try {
    const authorization = request.headers.get('authorization');

    if (!authorization) {
      return null;
    }

    const token = authorization.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // 获取Supabase JWT密钥
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET environment variable is missing');
      return null;
    }

    // 使用jose库验证JWT (Edge Runtime兼容)
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    if (!payload.sub || !payload.email) {
      return null;
    }

    // 从JWT payload中提取基础用户信息
    return {
      id: payload.sub,
      email: payload.email as string,
      role: payload.user_metadata?.role || payload.app_metadata?.role,
      is_super_admin:
        payload.user_metadata?.is_super_admin ||
        payload.app_metadata?.is_super_admin ||
        false,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * 检查用户权限的轻量级版本 (Edge Runtime兼容)
 */
export function checkEdgePermission(
  user: EdgeAuthUser,
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

/**
 * 获取Cookie中的JWT token (Edge Runtime兼容)
 */
export function getTokenFromCookies(request: NextRequest): string | null {
  try {
    // 从cookie中获取Supabase access token
    const cookies = request.cookies;

    // Supabase默认cookie名称模式
    const supabaseAccessToken =
      cookies.get('sb-access-token')?.value ||
      cookies.get('supabase.auth.token')?.value;

    if (supabaseAccessToken) {
      return supabaseAccessToken;
    }

    // 尝试从其他可能的cookie名称中获取
    const cookieNames = Array.from(cookies.getAll()).map(cookie => cookie.name);
    const authCookie = cookieNames.find(
      name => name.includes('sb-') && name.includes('auth')
    );

    if (authCookie) {
      const cookieValue = cookies.get(authCookie)?.value;
      if (cookieValue) {
        try {
          const parsed = JSON.parse(cookieValue);
          return parsed.access_token;
        } catch {
          return cookieValue;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get token from cookies:', error);
    return null;
  }
}

/**
 * Edge Runtime兼容的完整认证函数
 * 优先从Authorization header获取token，fallback到cookies
 */
export async function authenticateEdgeRequest(
  request: NextRequest
): Promise<EdgeAuthUser | null> {
  try {
    // 首先尝试从Authorization header获取token
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 如果header中没有token，尝试从cookies获取
    if (!token) {
      token = getTokenFromCookies(request);
    }

    if (!token) {
      return null;
    }

    // 创建带有token的临时request对象用于验证
    const tempHeaders = new Headers(request.headers);
    tempHeaders.set('authorization', `Bearer ${token}`);

    const tempRequest = new NextRequest(request.url, {
      headers: tempHeaders,
      method: request.method,
    });

    return await verifyJWTEdgeRuntime(tempRequest);
  } catch (error) {
    console.error('Edge authentication failed:', error);
    return null;
  }
}
