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

// Configuration
export { interceptorConfig, loadInterceptorConfig } from './config';

// Convenient export of all interceptor instances
import { apiLogger } from './api-logger';
import { adminAuth } from './admin-auth';

export const interceptors = {
  apiLogger,
  adminAuth,
} as const;
