# 拦截器使用指南

## 概述

项目中的拦截器已重构到 `src/lib/interceptors/` 目录，提供了更清晰的结构和职责分离。

## 目录结构

```
src/lib/interceptors/
├── index.ts                    # 统一导出文件
├── types.ts                    # 拦截器类型定义
├── api-logger.ts              # API请求日志拦截器
├── admin-auth.ts              # Admin权限验证拦截器
└── middleware/                # Next.js中间件
    └── admin-middleware.ts    # Admin API路由中间件
```

## 拦截器说明

### 1. API日志拦截器 (api-logger.ts)

**用途**: 记录所有API请求和响应的详细信息，用于调试和监控。

**使用方法**:
```typescript
import { withApiLogger } from '@/lib/interceptors';

export async function GET(request: NextRequest) {
  return withApiLogger(request, async (req) => {
    // 你的API逻辑
    return NextResponse.json({ message: 'Hello' });
  });
}
```

### 2. Admin权限拦截器 (admin-auth.ts)

**用途**: 验证用户是否具有admin或super_admin权限。

**使用方法**:
```typescript
import { requireAdminAuth, getAdminUser } from '@/lib/interceptors';

export async function GET(request: NextRequest) {
  // 方法1: 基础权限检查
  const authResult = await requireAdminAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  
  // 方法2: 获取admin用户信息
  const { user, error, status } = await getAdminUser(request);
  if (!user) {
    return NextResponse.json({ error }, { status });
  }
  
  // 你的admin API逻辑
  return NextResponse.json({ data: 'admin data' });
}
```

### 3. Admin中间件 (admin-middleware.ts)

**用途**: 自动应用于所有 `/api/admin/*` 路由的权限检查。

**配置**: 已在 `middleware.ts` 中配置，无需额外设置。所有 `/api/admin/*` 路由会自动进行admin权限验证。

## 迁移说明

### 从旧版本迁移

如果你之前使用了 `@/lib/api-interceptor`，请更新导入：

```typescript
// 旧版本
import { withApiInterceptor } from '@/lib/api-interceptor';

// 新版本
import { withApiLogger } from '@/lib/interceptors';
```

### Admin API简化

对于admin API，由于已配置了全局中间件，你可以简化权限检查：

```typescript
// 之前需要手动检查权限
export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request);
  if (!user || (user.role !== 'admin' && !user.is_super_admin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // API逻辑
}

// 现在中间件会自动处理权限检查
export async function GET(request: NextRequest) {
  // 直接写API逻辑，权限已由中间件验证
  return NextResponse.json({ data: 'admin data' });
}
```

## 优势

1. **职责分离**: 每个拦截器有明确的单一职责
2. **自动化**: admin API权限检查完全自动化
3. **类型安全**: 完整的TypeScript类型支持
4. **易于维护**: 清晰的目录结构和统一的导出方式
5. **可扩展**: 易于添加新的拦截器类型

## 注意事项

- 所有 `/api/admin/*` 路由会自动进行权限验证
- API日志拦截器会记录敏感信息（如headers），生产环境中请注意数据安全
- 中间件运行在所有admin API之前，确保权限检查的一致性