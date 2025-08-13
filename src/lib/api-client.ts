import { getCurrentUserToken } from '@/lib/get-jwt-token';

/**
 * 统一的带认证的API调用工具
 */
export class AuthenticatedApiClient {
  /**
   * 带认证的fetch请求
   */
  static async fetch(url: string, options: RequestInit = {}) {
    try {
      const token = await getCurrentUserToken();

      // 检查是否为 FormData，如果是则不设置 Content-Type
      const isFormData = options.body instanceof FormData;

      const authenticatedOptions: RequestInit = {
        ...options,
        headers: {
          // 只有当不是 FormData 时才设置 Content-Type
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {}),
        },
      };

      const response = await fetch(url, authenticatedOptions);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      console.error(`API request error for ${url}:`, error);
      throw error;
    }
  }

  /**
   * GET请求快捷方法
   */
  static async get(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * POST请求快捷方法
   */
  static async post(url: string, body?: any, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT请求快捷方法
   */
  static async put(url: string, body?: any, options: RequestInit = {}) {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE请求快捷方法
   */
  static async delete(url: string, options: RequestInit = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }
}

/**
 * 简化的API调用函数（向后兼容）
 */
export const authenticatedFetch = AuthenticatedApiClient.fetch;
