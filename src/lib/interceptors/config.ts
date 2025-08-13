/**
 * Interceptor configuration
 */
export interface InterceptorConfig {
  apiLogger: {
    enabled: boolean;
    includePaths: string[];
    excludePaths: string[];
    logLevel: 'basic' | 'detailed';
  };
  adminAuth: {
    enabled: boolean;
    paths: string[];
  };
}

/**
 * Default interceptor configuration
 */
export const defaultConfig: InterceptorConfig = {
  apiLogger: {
    enabled: true,
    includePaths: ['/api'],
    excludePaths: ['/api/health', '/api/status', '/api/ping'],
    logLevel: 'basic',
  },
  adminAuth: {
    enabled: true,
    paths: ['/api/admin'],
  },
};

/**
 * Load configuration from environment variables
 */
export function loadInterceptorConfig(): InterceptorConfig {
  const config = { ...defaultConfig };

  // API logging configuration
  if (process.env.API_LOGGING_ENABLED !== undefined) {
    config.apiLogger.enabled = process.env.API_LOGGING_ENABLED === 'true';
  }

  if (process.env.API_LOGGING_PATHS) {
    config.apiLogger.includePaths = process.env.API_LOGGING_PATHS.split(',')
      .map(p => p.trim())
      .filter(Boolean);
  }

  if (process.env.API_LOGGING_EXCLUDE) {
    config.apiLogger.excludePaths = process.env.API_LOGGING_EXCLUDE.split(',')
      .map(p => p.trim())
      .filter(Boolean);
  }

  if (process.env.API_LOGGING_LEVEL) {
    config.apiLogger.logLevel = process.env.API_LOGGING_LEVEL as
      | 'basic'
      | 'detailed';
  }

  // Admin permission configuration
  if (process.env.ADMIN_AUTH_ENABLED !== undefined) {
    config.adminAuth.enabled = process.env.ADMIN_AUTH_ENABLED === 'true';
  }

  if (process.env.ADMIN_AUTH_PATHS) {
    config.adminAuth.paths = process.env.ADMIN_AUTH_PATHS.split(',')
      .map(p => p.trim())
      .filter(Boolean);
  }

  return config;
}

/**
 * Get current interceptor configuration
 */
export const interceptorConfig = loadInterceptorConfig();
