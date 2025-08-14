// Type definitions
export * from './types';

// API logger interceptor
export { ApiLogger, apiLogger } from './api-logger';
// Note: withApiLogger is deprecated, now handled automatically through middleware

// Admin permission interceptor
export {
  AdminAuth,
  adminAuth,
  requireAdminAuth,
  getAdminUser,
} from './admin-auth';

// Cache invalidation interceptor (DEPRECATED - use global middleware instead)
// Kept for backward compatibility only
export {
  CacheInvalidationMiddleware,
  createCacheInvalidationHandler,
  invalidateUserCache,
  addCachePattern,
  removeCachePattern,
} from './cache-invalidation';

// Middleware
export {
  adminMiddleware,
  createAdminMiddleware,
} from './middleware/admin-middleware';

export {
  apiLoggerMiddleware,
  shouldLogApi,
  logApiRequest,
} from './middleware/api-logger-middleware';

// Global cache invalidation middleware (CURRENT APPROACH)
export {
  shouldApplyCacheInvalidation,
  processCacheInvalidation,
  GlobalCacheInvalidationMiddleware,
} from './middleware/cache-invalidation-global';

// Configuration
export { interceptorConfig, loadInterceptorConfig } from './config';

// Convenient export of all interceptor instances
import { apiLogger } from './api-logger';
import { adminAuth } from './admin-auth';
import { CacheInvalidationMiddleware } from './cache-invalidation';

export const interceptors = {
  apiLogger,
  adminAuth,
  cacheInvalidation: CacheInvalidationMiddleware,
} as const;
