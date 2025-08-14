import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/interceptors/middleware/admin-middleware';
import {
  shouldLogApi,
  logApiRequest,
} from '@/lib/interceptors/middleware/api-logger-middleware';
import {
  shouldApplyCacheInvalidation,
  processCacheInvalidation,
} from '@/lib/interceptors/middleware/cache-invalidation-global';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API logging (record all matched API requests before permission check)
  if (shouldLogApi(pathname)) {
    await logApiRequest(request);
  }

  // Admin permission check (high priority, returns response or rejects request)
  if (pathname.startsWith('/api/admin')) {
    return adminMiddleware(request);
  }

  // For cache invalidation paths and mutation methods, intercept the response
  const method = request.method;
  const isMutationMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  if (shouldApplyCacheInvalidation(pathname) && isMutationMethod) {
    console.log(
      `[Middleware] Intercepting for cache invalidation: ${method} ${pathname}`
    );

    // Continue to the API handler and capture the response
    const response = await NextResponse.next();

    // Process cache invalidation on successful responses
    return await processCacheInvalidation(request, response);
  }

  // Continue with other paths
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/webhook/:path*',
    '/api/clinic/:path*',
    '/api/business/:path*',
    '/api/ai-agents/:path*',
    '/api/customers/:path*',
    '/api/appointments/:path*',
  ],
};
