import { NextRequest, NextResponse } from 'next/server';
import { extractUserIdFromJWT } from '@/lib/jwt-utils';
import { MetaDataCache } from '@/lib/metadata/cache';

/**
 * Global cache invalidation middleware for Next.js middleware
 */
export class GlobalCacheInvalidationMiddleware {
  private static readonly CACHE_INVALIDATION_PATTERNS = [
    '/api/business/**', // Wildcard pattern for all business endpoints
    '/api/ai-agents/**', // AI agents data changes
    '/api/customers/**', // Customer data changes
    '/api/appointments/**', // Appointment data changes
  ];

  private static readonly MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

  /**
   * Check if path matches a wildcard pattern
   */
  private static matchesWildcardPattern(
    pathname: string,
    pattern: string
  ): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** -> .* (match anything)
      .replace(/(?<!\.)\*/g, '[^/]*') // * -> [^/]* (match anything except /)
      .replace(/\//g, '\\/'); // Escape forward slashes

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  }

  /**
   * Check if the request should trigger cache invalidation
   */
  private static shouldInvalidateCache(
    pathname: string,
    method: string
  ): boolean {
    if (!this.MUTATION_METHODS.includes(method.toUpperCase())) {
      return false;
    }

    // Check wildcard patterns
    return this.CACHE_INVALIDATION_PATTERNS.some(pattern =>
      this.matchesWildcardPattern(pathname, pattern)
    );
  }

  /**
   * Invalidate user's metadata cache
   */
  private static async invalidateUserCache(userId: string): Promise<void> {
    try {
      console.log(
        `[Global Middleware] Starting cache invalidation for user: ${userId}`
      );
      const result = await MetaDataCache.invalidateAll(userId);
      console.log(
        `[Global Middleware] Cache invalidation result for user ${userId}: ${result}`
      );
    } catch (error) {
      console.error(
        `[Global Middleware] Failed to invalidate user cache for ${userId}:`,
        error
      );
    }
  }

  /**
   * Process cache invalidation for successful responses
   */
  static async processResponse(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    const pathname = new URL(request.url).pathname;
    const method = request.method;

    // Only invalidate cache if the request was successful
    if (response.status >= 200 && response.status < 300) {
      const shouldInvalidate = this.shouldInvalidateCache(pathname, method);
      console.log(
        `[Global Middleware] Cache invalidation check: ${method} ${pathname} -> ${shouldInvalidate}`
      );

      if (shouldInvalidate) {
        // Extract user_id from JWT token
        const userId = await extractUserIdFromJWT(request);
        console.log(
          `[Global Middleware] Extracted user_id from JWT: ${userId}`
        );

        if (userId) {
          // Invalidate cache asynchronously (don't block the response)
          this.invalidateUserCache(userId).catch(error => {
            console.error(
              '[Global Middleware] Async cache invalidation failed:',
              error
            );
          });

          console.log(
            `[Global Middleware] Cache invalidation triggered for user: ${userId}`
          );

          // Clone response and add cache invalidation headers
          const newHeaders = new Headers(response.headers);
          newHeaders.set('X-Cache-Invalidated', 'true');
          newHeaders.set('X-Cache-User-Id', userId);
          newHeaders.set('X-Cache-Invalidated-By', 'global-middleware');

          return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } else {
          console.warn(
            `[Global Middleware] Could not extract user_id from JWT for cache invalidation: ${method} ${pathname}`
          );
        }
      }
    }

    return response;
  }

  /**
   * Check if cache invalidation should be applied to the request
   */
  static shouldApplyToPath(pathname: string): boolean {
    return this.CACHE_INVALIDATION_PATTERNS.some(pattern =>
      this.matchesWildcardPattern(pathname, pattern)
    );
  }

  /**
   * Add custom patterns for cache invalidation
   */
  static addPattern(pattern: string): void {
    if (!this.CACHE_INVALIDATION_PATTERNS.includes(pattern)) {
      this.CACHE_INVALIDATION_PATTERNS.push(pattern);
      console.log(
        `[Global Middleware] Added cache invalidation pattern: ${pattern}`
      );
    }
  }

  /**
   * Get all current cache invalidation patterns
   */
  static getPatterns(): string[] {
    return [...this.CACHE_INVALIDATION_PATTERNS];
  }
}

/**
 * Convenience function to check if cache invalidation should be applied
 */
export function shouldApplyCacheInvalidation(pathname: string): boolean {
  return GlobalCacheInvalidationMiddleware.shouldApplyToPath(pathname);
}

/**
 * Process cache invalidation for responses
 */
export function processCacheInvalidation(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  return GlobalCacheInvalidationMiddleware.processResponse(request, response);
}
