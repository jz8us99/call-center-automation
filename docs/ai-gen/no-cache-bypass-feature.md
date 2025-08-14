# No-Cache Header Bypass Feature - 无缓存绕过功能

## 功能概述

已为metadata服务添加了支持 `Cache-Control: no-cache` 请求头的功能，允许在需要时绕过Redis缓存直接从数据库获取最新数据。

## ✅ 修复的问题

### 1. Business Profiles查询错误
修复了查询不存在字段的错误：
```sql
-- 原来的错误查询（包含不存在的字段）
street_address, city, state, postal_code

-- 修复后的查询（只查询存在的字段）
business_address  -- 完整地址字符串
```

### 2. No-Cache请求头支持
在 `MetaDataService.getMetaData()` 方法中添加了缓存绕过逻辑：

```typescript
// 检查 Cache-Control 请求头
const cacheControl = 
  request?.headers.get('Cache-Control') || 
  request?.headers.get('cache-control');

const skipCache = 
  cacheControl?.includes('no-cache') || 
  cacheControl?.includes('no-store');

if (skipCache) {
  console.log(`Cache bypassed due to no-cache header for user: ${userId}`);
  // 跳过缓存检查，直接查询数据库
} else {
  // 正常的缓存检查流程
}
```

## 🚀 使用方法

### 普通请求（使用缓存）
```bash
curl -X POST https://your-api.com/api/retell/functions/clinic \
  -H "Content-Type: application/json" \
  -d '{"name": "get_meta_data"}'
```

### 绕过缓存请求（获取最新数据）
```bash
curl -X POST https://your-api.com/api/retell/functions/clinic \
  -H "Content-Type: application/json" \
  -H "Cache-Control: no-cache" \
  -d '{"name": "get_meta_data"}'
```

### 支持的Cache-Control指令
- `no-cache` - 绕过缓存读取，直接查询数据库
- `no-store` - 绕过缓存读取，且不存储到缓存

## 📊 行为对比

| 场景 | 缓存行为 | 数据库查询 | 响应时间 | 日志输出 |
|------|----------|------------|----------|----------|
| 正常请求 (缓存命中) | 从Redis读取 | 否 | 5-20ms | `Cache hit for metadata: userId-agentId` |
| 正常请求 (缓存未命中) | 从Redis读取失败 → 查询DB → 存储到Redis | 是 | 300-800ms | `Cache miss, fetching from database` |
| No-Cache请求 | 跳过Redis | 是 | 300-800ms | `Cache bypassed due to no-cache header` |

## 🔧 技术实现

### 路由更新
```typescript
// src/app/api/retell/functions/clinic/route.ts
case 'get_meta_data':
  return await metaDataService.getMetaData(
    retellCall.args as MetaDataRequest,
    request  // 传递request对象以访问headers
  );
```

### 服务方法更新
```typescript
// src/lib/metadata/service.ts
async getMetaData(
  _args?: MetaDataRequest,
  request?: Request  // 新增request参数
): Promise<NextResponse<RetellFunctionResponse | ErrorResponse>>
```

### 缓存控制逻辑
```typescript
if (skipCache) {
  // 跳过缓存直接查询数据库
  console.log(`Cache bypassed due to no-cache header for user: ${this.userId}`);
} else {
  // 正常缓存流程
  const cachedData = await MetaDataCache.get(this.userId, this.agentId);
  // ...
}

// 只有在非跳过缓存模式下才存储结果
if (!skipCache) {
  await MetaDataCache.set(this.userId, metaData, this.agentId);
}
```

## 🎯 使用场景

### 开发调试
当需要测试数据库中的最新更改时：
```bash
# 绕过缓存获取最新数据
curl -H "Cache-Control: no-cache" [API_URL]
```

### 数据同步
在业务数据更新后需要立即验证更改：
```bash
# 更新business_profiles表后验证
curl -H "Cache-Control: no-cache" [API_URL]
```

### 问题排查
当怀疑缓存数据有问题时，对比缓存和数据库数据：
```bash
# 从缓存获取
curl [API_URL]

# 从数据库获取  
curl -H "Cache-Control: no-cache" [API_URL]
```

## 📈 性能影响

### 正面影响
- ✅ 确保在需要时能获取最新数据
- ✅ 不影响正常缓存性能
- ✅ 灵活的缓存控制机制

### 注意事项
- ⚠️ No-cache请求绕过缓存，响应时间较长（300-800ms）
- ⚠️ 不建议在生产环境频繁使用no-cache
- ⚠️ No-cache请求不会更新缓存内容

## 🔍 日志监控

### 缓存绕过日志
```
Cache bypassed due to no-cache header for user: f4056f55-ad6d-4c6d-8aba-17544327b45a
```

### 正常缓存日志
```
Cache hit for metadata: f4056f55-ad6d-4c6d-8aba-17544327b45a-agent123
Cache miss for metadata: f4056f55-ad6d-4c6d-8aba-17544327b45a-agent123, fetching from database
```

---

**功能已成功实现，现在可以通过添加 `Cache-Control: no-cache` 请求头来绕过缓存获取最新数据！**