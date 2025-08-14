# Cache Invalidation Middleware - Usage Examples

## Basic Usage

### Simple API Route with Cache Invalidation

```typescript
// src/app/api/business/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';
import { createCacheInvalidationHandler } from '@/lib/interceptors';

async function handleGET(request: NextRequest) {
  const authResult = await withAuth(request);
  if (isAuthError(authResult)) return authResult;
  
  // Your GET logic here - no cache invalidation
  return NextResponse.json({ products: [] });
}

async function handlePOST(request: NextRequest) {
  const authResult = await withAuth(request);
  if (isAuthError(authResult)) return authResult;
  
  // Your POST logic here - cache will be invalidated automatically
  return NextResponse.json({ success: true });
}

// Export handlers with automatic cache invalidation
const handlers = createCacheInvalidationHandler({
  GET: handleGET,
  POST: handlePOST,
});

export const { GET, POST } = handlers;
```

## Advanced Patterns

### Custom Wildcard Patterns

```typescript
// src/app/api/custom/user-data/route.ts
import { addCachePattern, createCacheInvalidationHandler } from '@/lib/interceptors';

// Add custom patterns at module load time
addCachePattern('/api/custom/user-data/**');
addCachePattern('/api/user-profiles/*');

async function handlePUT(request: NextRequest) {
  // This will trigger cache invalidation due to the custom pattern
  return NextResponse.json({ updated: true });
}

const handlers = createCacheInvalidationHandler({
  PUT: handlePUT,
});

export const { PUT } = handlers;
```

### Conditional Cache Invalidation

```typescript
// src/app/api/business/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCacheInvalidationMiddleware } from '@/lib/interceptors';

// Create conditional middleware
const conditionalCacheMiddleware = createCacheInvalidationMiddleware({
  enabled: process.env.NODE_ENV === 'production', // Only in production
  patterns: ['/api/business/settings/**'],
  methods: ['POST', 'PUT', 'PATCH'],
  logLevel: 'debug',
});

async function handlePOST(request: NextRequest) {
  // Business logic here
  return NextResponse.json({ success: true });
}

export const POST = conditionalCacheMiddleware(handlePOST);
```

## Manual Cache Management

### Manual Cache Invalidation in Business Logic

```typescript
// src/app/api/business/bulk-update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { invalidateUserCache, extractUserIdFromJWT } from '@/lib/interceptors';

export async function POST(request: NextRequest) {
  try {
    // Extract user ID from JWT
    const userId = await extractUserIdFromJWT(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Perform bulk operations
    await performBulkUpdates();

    // Manually invalidate cache for this user
    const invalidated = await invalidateUserCache(userId);
    
    if (!invalidated) {
      console.warn('Failed to invalidate cache for user:', userId);
    }

    return NextResponse.json({ 
      success: true, 
      cacheInvalidated: invalidated 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Dynamic Pattern Management

```typescript
// src/app/api/admin/cache-patterns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  addCachePattern, 
  removeCachePattern, 
  CacheInvalidationMiddleware 
} from '@/lib/interceptors';

export async function POST(request: NextRequest) {
  const { action, pattern } = await request.json();

  try {
    switch (action) {
      case 'add':
        addCachePattern(pattern);
        break;
      case 'remove':
        removeCachePattern(pattern);
        break;
      case 'list':
        const patterns = CacheInvalidationMiddleware.getCacheInvalidationPatterns();
        return NextResponse.json({ patterns });
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage pattern' }, { status: 500 });
  }
}
```

## Integration with Existing Middleware

### Combining with Admin Auth

```typescript
// src/app/api/admin/business-data/route.ts
import { createAdminMiddleware, createCacheInvalidationHandler } from '@/lib/interceptors';

// First apply admin authentication
const withAdminAuth = createAdminMiddleware({
  requireSuperAdmin: false,
  logAccess: true,
});

async function handlePOST(request: NextRequest) {
  // Admin-only business data modification
  return NextResponse.json({ success: true });
}

// Apply both admin auth and cache invalidation
const handlers = createCacheInvalidationHandler({
  POST: withAdminAuth(handlePOST),
});

export const { POST } = handlers;
```

### Custom Middleware Chain

```typescript
// src/app/api/business/complex/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  withCacheInvalidationMiddleware,
  withAdminAuth,
  apiLoggerMiddleware 
} from '@/lib/interceptors';

// Create a middleware chain
function withMiddlewareChain(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withCacheInvalidationMiddleware(
    withAdminAuth(
      async (request: NextRequest) => {
        return apiLoggerMiddleware(request, () => handler(request));
      }
    )
  );
}

async function handleComplexOperation(request: NextRequest) {
  // Complex business operation
  return NextResponse.json({ result: 'complex operation completed' });
}

export const POST = withMiddlewareChain(handleComplexOperation);
```

## Health Monitoring

### Cache Health Check Endpoint

```typescript
// src/app/api/health/cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CacheInvalidationMiddleware } from '@/lib/interceptors';

export async function GET(request: NextRequest) {
  try {
    const isHealthy = await CacheInvalidationMiddleware.healthCheck();
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'cache-invalidation',
    }, {
      status: isHealthy ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
```

### Cache Statistics Endpoint

```typescript
// src/app/api/admin/cache-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CacheInvalidationMiddleware } from '@/lib/interceptors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userIds = searchParams.get('userIds')?.split(',') || [];

  if (userIds.length === 0) {
    return NextResponse.json({ error: 'userIds parameter required' }, { status: 400 });
  }

  try {
    const stats = await CacheInvalidationMiddleware.getCacheStats(userIds);
    
    return NextResponse.json({
      stats,
      patterns: CacheInvalidationMiddleware.getCacheInvalidationPatterns(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
}
```

## Real-world Scenarios

### E-commerce Product Updates

```typescript
// src/app/api/business/products/[productId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCacheInvalidationHandler } from '@/lib/interceptors';

// Product updates should invalidate user's business cache
async function handlePUT(request: NextRequest, { params }: { params: { productId: string } }) {
  const { productId } = params;
  
  // Update product logic
  await updateProduct(productId, await request.json());
  
  // Cache will be automatically invalidated for the user
  return NextResponse.json({ success: true, productId });
}

async function handleDELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  const { productId } = params;
  
  // Delete product logic
  await deleteProduct(productId);
  
  // Cache invalidation happens automatically
  return NextResponse.json({ success: true, deleted: productId });
}

const handlers = createCacheInvalidationHandler({
  PUT: handlePUT,
  DELETE: handleDELETE,
});

export const { PUT, DELETE } = handlers;
```

### Staff Schedule Management

```typescript
// src/app/api/business/staff/[staffId]/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCacheInvalidationHandler, addCachePattern } from '@/lib/interceptors';

// Add specific pattern for staff schedule updates
addCachePattern('/api/business/staff/*/schedule/**');

async function handlePOST(request: NextRequest, { params }: { params: { staffId: string } }) {
  const { staffId } = params;
  const scheduleData = await request.json();
  
  // Update staff schedule
  await updateStaffSchedule(staffId, scheduleData);
  
  // Cache invalidation will happen automatically due to the pattern match
  return NextResponse.json({ 
    success: true, 
    staffId, 
    message: 'Schedule updated successfully' 
  });
}

const handlers = createCacheInvalidationHandler({
  POST: handlePOST,
});

export const { POST } = handlers;
```

These examples demonstrate the flexibility and power of the cache invalidation middleware system, from simple automatic invalidation to complex custom patterns and manual cache management.