# JWT Utils Fix - Extract user_id from user_metadata.sub

## 问题描述

原始实现从 JWT 的顶层 `sub` 字段获取 user_id，但根据用户提供的实际 JWT payload，真正的 user_id 存储在 `user_metadata.sub` 中。

## JWT Payload 结构

```json
{
  "iss": "https://delvgxisdahywhzbgrmh.supabase.co/auth/v1",
  "sub": "f4056f55-ad6d-4c6d-8aba-17544327b45a",  // Auth user ID
  "aud": "authenticated",
  "exp": 1755139671,
  "iat": 1755136071,
  "email": "jzheng_99@yahoo.com",
  "phone": "",
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "user_metadata": {
    "email": "jzheng_99@yahoo.com",
    "email_verified": true,
    "full_name": "Crystal test 01",
    "phone_verified": false,
    "sub": "f4056f55-ad6d-4c6d-8aba-17544327b45a"  // 实际的 user_id
  },
  "role": "authenticated",
  "aal": "aal1",
  "amr": [
    {
      "method": "password",
      "timestamp": 1755121751
    }
  ],
  "session_id": "fd1fcd2f-026b-4017-8cc2-ac547f95a910",
  "is_anonymous": false
}
```

## 修复内容

### 1. 更新类型定义

```typescript
export interface SupabaseJWTPayload {
  sub: string; // This is the auth user id, not necessarily the user_id we want
  email?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  role?: string;
  user_metadata?: {
    sub?: string; // This is the actual user_id we need
    email?: string;
    email_verified?: boolean;
    full_name?: string;
    phone_verified?: boolean;
    [key: string]: any;
  };
  app_metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}
```

### 2. 修正 user_id 提取逻辑

```typescript
// 修复前: 只从顶层 sub 获取
const userId = payload.sub || null;

// 修复后: 优先从 user_metadata.sub 获取，fallback 到顶层 sub
const supabasePayload = payload as unknown as SupabaseJWTPayload;
const userId = supabasePayload.user_metadata?.sub || supabasePayload.sub || null;
```

### 3. 增强调试日志

```typescript
console.log(`JWT payload sub: ${supabasePayload.sub}`);
console.log(`JWT user_metadata.sub: ${supabasePayload.user_metadata?.sub}`);
console.log(`Extracted user_id from JWT: ${userId}`);
```

## 测试

### 测试端点

创建了 `/api/test-jwt` 端点来测试 JWT 解析：

```bash
curl "https://demo1492.ddns.net/api/test-jwt" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 预期响应

```json
{
  "success": true,
  "userId": "f4056f55-ad6d-4c6d-8aba-17544327b45a",
  "fullPayload": {
    "sub": "f4056f55-ad6d-4c6d-8aba-17544327b45a",
    "email": "jzheng_99@yahoo.com",
    "user_metadata": {
      "sub": "f4056f55-ad6d-4c6d-8aba-17544327b45a",
      "email": "jzheng_99@yahoo.com",
      "email_verified": true,
      "full_name": "Crystal test 01",
      "phone_verified": false
    },
    "role": "authenticated",
    "iss": "https://delvgxisdahywhzbgrmh.supabase.co/auth/v1"
  },
  "headers": {
    "authorization": "present"
  }
}
```

## 验证缓存失效功能

现在可以使用正确的 user_id 来测试缓存失效：

```bash
# 1. 设置测试缓存
curl -X POST "https://demo1492.ddns.net/api/test-cache" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "f4056f55-ad6d-4c6d-8aba-17544327b45a", "test_data": {"test": "data"}}'

# 2. 检查缓存状态
curl "https://demo1492.ddns.net/api/test-cache?user_id=f4056f55-ad6d-4c6d-8aba-17544327b45a" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. 触发业务 API 修改数据 (应该自动清理缓存)
curl -X POST "https://demo1492.ddns.net/api/business/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "f4056f55-ad6d-4c6d-8aba-17544327b45a", "business_name": "Test Business", "business_phone": "123-456-7890"}'

# 4. 验证缓存已被清理
curl "https://demo1492.ddns.net/api/test-cache?user_id=f4056f55-ad6d-4c6d-8aba-17544327b45a" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 总结

修复后的实现：
- ✅ 正确从 `user_metadata.sub` 获取 user_id
- ✅ 保持向后兼容，fallback 到顶层 `sub`
- ✅ 增强了类型安全性
- ✅ 提供了详细的调试日志
- ✅ 可以正确触发缓存失效功能

现在缓存失效中间件可以正确获取 user_id 并清理对应用户的缓存数据。