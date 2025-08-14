# Cache Invalidation Debug Guide

## 问题诊断

当您调用 `POST /api/business/profile` 返回 200 状态码但没有看到缓存失效时，可以按照以下步骤进行诊断：

## 1. 检查控制台日志

在服务器控制台中查找以下日志：

### 正常工作的日志顺序：
```
Cache invalidation check: POST /api/business/profile -> true
Authorization header present: true
Extracted user_id from JWT: user_12345
Extracted user_id from JWT: user_12345
Starting cache invalidation for user: user_12345
Cache invalidation triggered for user: user_12345
Invalidated all metadata cache for user: user_12345 (deleted: 1)
Cache invalidation result for user user_12345: true
```

### 可能的问题及对应日志：

#### 问题1：拦截器未触发
```
// 没有看到任何 "Cache invalidation check" 日志
```
**原因**: 拦截器未正确配置
**解决**: 检查 `/api/business/profile/route.ts` 是否正确导入和配置了拦截器

#### 问题2：路径不匹配
```
Cache invalidation check: POST /api/business/profile -> false
```
**原因**: 路径不在缓存失效模式中
**解决**: 确认路径在 `CACHE_INVALIDATION_PATTERNS` 或 `CACHE_INVALIDATION_PATHS` 中

#### 问题3：JWT认证问题
```
Cache invalidation check: POST /api/business/profile -> true
Authorization header present: false
No authorization header found
Could not extract user_id from JWT for cache invalidation: POST /api/business/profile
```
**原因**: 请求没有JWT认证头
**解决**: 确保请求包含有效的 `Authorization: Bearer <token>` 头

#### 问题4：JWT解析失败
```
Authorization header present: true
Failed to extract user_id from JWT: [error details]
```
**原因**: JWT token无效或解析失败
**解决**: 检查 `SUPABASE_JWT_SECRET` 环境变量，确认token有效

#### 问题5：缓存操作失败
```
Starting cache invalidation for user: user_12345
Failed to invalidate user cache for user_12345: [error details]
```
**原因**: Redis/KV 操作失败
**解决**: 检查缓存服务连接

## 2. 检查响应头

成功的缓存失效应该在响应中包含以下头部：

```
X-Cache-Invalidated: true
X-Cache-User-Id: user_12345
```

可以通过浏览器开发者工具的Network标签或curl命令检查：

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"user_123","business_name":"Test"}' \
     -v POST http://localhost:3000/api/business/profile
```

## 3. 手动测试缓存失效

可以通过以下代码手动测试缓存系统：

```typescript
import { MetaDataCache } from '@/lib/metadata/cache';

// 测试缓存设置
await MetaDataCache.set('test_user', { test: 'data' }, 'test_agent');

// 检查缓存是否存在
const exists = await MetaDataCache.exists('test_user', 'test_agent');
console.log('Cache exists:', exists);

// 获取缓存数据
const data = await MetaDataCache.get('test_user', 'test_agent');
console.log('Cached data:', data);

// 失效缓存
const invalidated = await MetaDataCache.invalidateAll('test_user');
console.log('Cache invalidated:', invalidated);

// 再次检查
const existsAfter = await MetaDataCache.exists('test_user', 'test_agent');
console.log('Cache exists after invalidation:', existsAfter);
```

## 4. 验证配置

### 检查拦截器配置
确认 `/api/business/profile/route.ts` 包含：

```typescript
import { createCacheInvalidationHandler } from '@/lib/interceptors/cache-invalidation';

// 内部handler函数
async function handlePOST(request: NextRequest) { /* ... */ }

// 导出包装的handlers
const handlers = createCacheInvalidationHandler({
  POST: handlePOST,
});

export const { POST } = handlers;
```

### 检查路径配置
确认路径在拦截器配置中：

```typescript
// 在 cache-invalidation.ts 中
private static readonly CACHE_INVALIDATION_PATTERNS = [
  '/api/business/**', // 应该匹配 /api/business/profile
];

private static readonly CACHE_INVALIDATION_PATHS = [
  '/api/business/profile', // 直接匹配
];
```

## 5. 常见解决方案

### 解决方案1：重启开发服务器
```bash
yarn dev
```

### 解决方案2：清理缓存
```bash
rm -rf .next
yarn dev
```

### 解决方案3：检查环境变量
确保 `.env.local` 包含：
```
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### 解决方案4：临时移除日志
如果日志过多，可以注释掉调试日志：

```typescript
// console.log(`Cache invalidation check: ${method} ${pathname} -> ${shouldInvalidate}`);
```

## 6. 测试步骤

1. **发送POST请求**到 `/api/business/profile`
2. **检查控制台日志**确认拦截器运行
3. **检查响应头**确认包含缓存失效标识
4. **验证缓存已清除**通过再次调用相关缓存接口

## 7. 故障排除清单

- [ ] 拦截器是否正确配置在路由文件中？
- [ ] 路径是否在 `CACHE_INVALIDATION_PATTERNS` 中？
- [ ] 请求是否包含有效的JWT认证头？
- [ ] JWT secret环境变量是否正确设置？
- [ ] Redis/KV服务是否正常运行？
- [ ] 响应状态码是否在200-299范围内？
- [ ] 请求方法是否是POST/PUT/DELETE/PATCH？

通过这些步骤，您应该能够诊断和解决缓存失效不工作的问题。