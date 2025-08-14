# Cache Invalidation Middleware for Business API

## Overview

This document describes the cache invalidation middleware implementation that automatically invalidates user cache when business data is modified through POST, PUT, DELETE requests to `/api/business/*` endpoints.

## Features

- **Automatic Cache Invalidation**: Automatically invalidates cache for user data when business information is modified
- **JWT User ID Extraction**: Extracts user_id from Supabase JWT tokens in Authorization headers
- **Non-blocking Operations**: Cache invalidation happens asynchronously to not block API responses
- **Comprehensive Coverage**: Covers all business-related endpoints
- **Health Monitoring**: Includes health check functionality for the cache system

## Architecture

### Components

1. **JWT Utils** (`/src/lib/jwt-utils.ts`)
   - Extracts user_id from Supabase JWT tokens
   - Provides JWT payload parsing functionality
   - Includes permission checking utilities

2. **Cache Invalidation Middleware** (`/src/lib/middleware/cache-invalidation.ts`)
   - Main middleware for handling cache invalidation
   - Wraps API handlers to add cache invalidation logic
   - Provides convenience functions for API route integration

3. **Metadata Cache** (`/src/lib/metadata/cache.ts`)
   - Existing cache management using Vercel KV
   - Provides cache invalidation methods

## Implementation

### How to Use

1. **Import the middleware**:
```typescript
import { createCacheInvalidationHandler } from '@/lib/interceptors/cache-invalidation';
// Or import from the main interceptors index
import { createCacheInvalidationHandler } from '@/lib/interceptors';
```

2. **Wrap your handlers**:
```typescript
// Define your handlers as regular functions
async function handleGET(request: NextRequest) {
  // Your GET logic here
}

async function handlePOST(request: NextRequest) {
  // Your POST logic here
}

// Create wrapped handlers with cache invalidation
const handlers = createCacheInvalidationHandler({
  GET: handleGET,
  POST: handlePOST,
  PUT: handlePUT,
  DELETE: handleDELETE,
});

// Export the wrapped handlers
export const { GET, POST, PUT, DELETE } = handlers;
```

### Supported Endpoints

The middleware automatically handles cache invalidation using **wildcard patterns** when using mutation methods (POST, PUT, DELETE, PATCH):

#### Wildcard Patterns (Primary)
- `/api/business/**` - All business-related endpoints
- `/api/ai-agents/**` - All AI agents endpoints  
- `/api/customers/**` - All customer-related endpoints
- `/api/appointments/**` - All appointment-related endpoints

#### Specific Paths (Fallback)
- `/api/business/staff`
- `/api/business/staff-members`
- `/api/business/services`
- `/api/business/products`
- `/api/business/locations`
- `/api/business/office-hours`
- `/api/business/holidays`
- `/api/business/booking-settings`
- `/api/business/staff-availability`
- `/api/business/staff-calendars`
- `/api/business/calendar-integrations`
- `/api/business/agent-configurations`
- `/api/business/context`
- `/api/business/types`
- `/api/business/insurance`
- `/api/business/job-categories`
- `/api/business/job-types`
- `/api/business/product-categories`
- `/api/business/staff-job-assignments`
- `/api/business/upload-documents`
- `/api/business/upload-business-files`
- `/api/business/profile`

#### Wildcard Pattern Syntax

- `**` - Matches any number of path segments (including zero)
- `*` - Matches any single path segment
- Exact paths for precise control

Examples:
- `/api/business/**` matches `/api/business/staff`, `/api/business/staff/123`, `/api/business/products/category/items`
- `/api/*/profile` matches `/api/business/profile`, `/api/admin/profile`
- `/api/business/staff/*` matches `/api/business/staff/123` but not `/api/business/staff/123/edit`

## How It Works

1. **Request Processing**: The middleware wraps the original API handler
2. **Handler Execution**: The original handler is executed first
3. **Success Check**: If the response is successful (status 200-299)
4. **Path Check**: Checks if the request path should trigger cache invalidation
5. **Method Check**: Ensures the request method is a mutation method (POST, PUT, DELETE, PATCH)
6. **JWT Extraction**: Extracts user_id from the JWT token in the Authorization header
7. **Cache Invalidation**: Asynchronously invalidates all cache entries for the user
8. **Response Headers**: Adds cache invalidation headers to the response

## Response Headers

When cache invalidation is triggered, the following headers are added to the response:

- `X-Cache-Invalidated: true` - Indicates that cache invalidation was triggered
- `X-Cache-User-Id: <user_id>` - Shows which user's cache was invalidated

## Benefits

1. **Data Consistency**: Ensures cache is always in sync with database
2. **Automatic**: No need to manually invalidate cache in each API endpoint
3. **Performance**: Cache invalidation is non-blocking and asynchronous
4. **Security**: Uses JWT token to ensure users can only invalidate their own cache
5. **Comprehensive**: Covers all business-related data modifications

## Example API Route

Here's an example of how to update an existing API route to use the cache invalidation middleware:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { createCacheInvalidationHandler } from '@/lib/middleware/cache-invalidation';

async function handleGET(request: NextRequest) {
  // GET logic - no cache invalidation needed
}

async function handlePOST(request: NextRequest) {
  // POST logic - cache will be invalidated automatically
}

async function handlePUT(request: NextRequest) {
  // PUT logic - cache will be invalidated automatically
}

async function handleDELETE(request: NextRequest) {
  // DELETE logic - cache will be invalidated automatically
}

// Export handlers with cache invalidation middleware
const handlers = createCacheInvalidationHandler({
  GET: handleGET,
  POST: handlePOST,
  PUT: handlePUT,
  DELETE: handleDELETE,
});

export const { GET, POST, PUT, DELETE } = handlers;
```

## Health Check

The middleware includes a health check function to verify the cache system is working:

```typescript
import { CacheInvalidationMiddleware } from '@/lib/middleware/cache-invalidation';

const isHealthy = await CacheInvalidationMiddleware.healthCheck();
```

## Manual Cache Invalidation

You can also manually invalidate cache for a specific user:

```typescript
import { invalidateUserCache } from '@/lib/interceptors/cache-invalidation';

const success = await invalidateUserCache(userId);
```

## Dynamic Pattern Management

You can add or remove cache invalidation patterns at runtime:

```typescript
import { addCachePattern, removeCachePattern } from '@/lib/interceptors/cache-invalidation';

// Add a new pattern
addCachePattern('/api/custom/**');

// Add pattern for specific user operations
addCachePattern('/api/users/*/profile');

// Remove a pattern
removeCachePattern('/api/business/legacy/*');

// Get all current patterns
const patterns = CacheInvalidationMiddleware.getCacheInvalidationPatterns();
console.log('Active patterns:', patterns);
```

## Advanced Configuration

Use the middleware configuration for more control:

```typescript
import { createCacheInvalidationMiddleware } from '@/lib/interceptors/middleware/cache-invalidation-middleware';

// Create a custom middleware with specific configuration
const customCacheMiddleware = createCacheInvalidationMiddleware({
  enabled: true,
  patterns: ['/api/business/**', '/api/custom/**'],
  methods: ['POST', 'PUT', 'DELETE'],
  logLevel: 'debug',
});

// Use the custom middleware
export const POST = customCacheMiddleware(handlePOST);
export const PUT = customCacheMiddleware(handlePUT);
```

## Cache Statistics

Get cache statistics for multiple users:

```typescript
import { CacheInvalidationMiddleware } from '@/lib/middleware/cache-invalidation';

const stats = await CacheInvalidationMiddleware.getCacheStats(['user1', 'user2']);
// Returns: { user1: { exists: true, ttl: 600 }, user2: { exists: false, ttl: -1 } }
```

## Error Handling

- If JWT extraction fails, a warning is logged but the request continues normally
- If cache invalidation fails, an error is logged but the API response is not affected
- All cache operations are non-blocking to ensure API performance

## Security Considerations

- Only users can invalidate their own cache (based on JWT user_id)
- JWT tokens are verified using Supabase JWT secret
- No sensitive information is logged during cache operations

## Future Enhancements

- Add support for selective cache invalidation based on data type
- Implement cache warming strategies
- Add metrics and monitoring for cache invalidation operations
- Support for batch cache invalidation operations