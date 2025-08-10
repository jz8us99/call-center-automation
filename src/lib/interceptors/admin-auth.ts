import { NextRequest } from 'next/server';
import { authenticateRequest, AuthUser } from '@/lib/supabase';
import { AuthInterceptor } from './types';

/**
 * Admin permission interceptor
 * Specifically used to verify if user has admin or super_admin permissions
 */
export class AdminAuth implements AuthInterceptor {
  public readonly name = 'AdminAuth';
  public readonly description = 'Admin permission verification interceptor';

  private static instance: AdminAuth;

  private constructor() {}

  public static getInstance(): AdminAuth {
    if (!AdminAuth.instance) {
      AdminAuth.instance = new AdminAuth();
    }
    return AdminAuth.instance;
  }

  /**
   * Check if user has admin permissions
   */
  public async checkPermission(
    request: NextRequest
  ): Promise<{ success: boolean; error?: string; status?: number }> {
    try {
      // Verify user identity
      const user = await authenticateRequest(request);

      if (!user) {
        return {
          success: false,
          error: 'Unauthorized',
          status: 401,
        };
      }

      // Check if user has admin permissions
      const hasAdminAccess = user.is_super_admin || user.role === 'admin';

      if (!hasAdminAccess) {
        return {
          success: false,
          error: 'Forbidden - Admin access required',
          status: 403,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Admin auth error:', error);
      return {
        success: false,
        error: 'Internal server error',
        status: 500,
      };
    }
  }

  /**
   * Get authenticated admin user information
   */
  public async getAuthenticatedAdmin(
    request: NextRequest
  ): Promise<{ user: AuthUser | null; error?: string; status?: number }> {
    try {
      const user = await authenticateRequest(request);

      if (!user) {
        return {
          user: null,
          error: 'Unauthorized',
          status: 401,
        };
      }

      const hasAdminAccess = user.is_super_admin || user.role === 'admin';

      if (!hasAdminAccess) {
        return {
          user: null,
          error: 'Forbidden - Admin access required',
          status: 403,
        };
      }

      return { user };
    } catch (error) {
      console.error('Admin auth error:', error);
      return {
        user: null,
        error: 'Internal server error',
        status: 500,
      };
    }
  }
}

/**
 * Convenient method to get Admin permission interceptor instance
 */
export const adminAuth = AdminAuth.getInstance();

/**
 * Decorator-style Admin permission check function
 * Usage:
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAdminAuth(request);
 *   if (!authResult.success) {
 *     return NextResponse.json({ error: authResult.error }, { status: authResult.status });
 *   }
 *
 *   // Your API logic
 *   return NextResponse.json({ message: 'Admin API' });
 * }
 */
export async function requireAdminAuth(request: NextRequest) {
  return adminAuth.checkPermission(request);
}

/**
 * Convenient function to get authenticated admin user
 */
export async function getAdminUser(request: NextRequest) {
  return adminAuth.getAuthenticatedAdmin(request);
}
