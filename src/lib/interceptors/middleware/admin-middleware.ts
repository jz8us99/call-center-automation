import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../admin-auth';

/**
 * Admin API middleware
 * Automatically applies permission checking to all /api/admin/* routes
 */
export async function adminMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  try {
    // Check admin permissions
    const authResult = await adminAuth.checkPermission(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Permission verification passed, continue processing request
    return NextResponse.next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convenience function for creating Next.js middleware configuration
 */
export function createAdminMiddleware() {
  return {
    middleware: adminMiddleware,
    config: {
      matcher: '/api/admin/:path*',
    },
  };
}
