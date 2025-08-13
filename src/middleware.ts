import { NextRequest, NextResponse } from 'next/server';
import { adminMiddleware } from '@/lib/interceptors/middleware/admin-middleware';
import {
  shouldLogApi,
  logApiRequest,
} from '@/lib/interceptors/middleware/api-logger-middleware';

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

  // Continue with other paths
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/webhook/:path*', '/api/clinic/:path*'],
};
