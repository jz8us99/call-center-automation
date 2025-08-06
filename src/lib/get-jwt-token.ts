import { supabase } from '@/lib/supabase';

/**
 * 获取当前登录用户的JWT token
 * 在客户端组件中使用
 */
export async function getCurrentUserToken(): Promise<string | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session?.access_token || null;
  } catch (error) {
    console.error('Unexpected error getting token:', error);
    return null;
  }
}

/**
 * 获取当前用户信息和token
 */
export async function getCurrentUserInfo() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, token: null };
    }

    const token = await getCurrentUserToken();

    return { user, token };
  } catch (error) {
    console.error('Error getting user info:', error);
    return { user: null, token: null };
  }
}

/**
 * 检查用户是否已登录
 */
export async function isUserLoggedIn(): Promise<boolean> {
  const { user } = await getCurrentUserInfo();
  return !!user;
}
