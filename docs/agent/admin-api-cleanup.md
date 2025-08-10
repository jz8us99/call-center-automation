# Admin API权限检查清理总结

## 清理前的情况

所有 `/api/admin/*` 路由中都包含重复的权限验证代码，存在两种模式：

### 旧模式（直接使用supabase.auth）
```typescript
// Get the authenticated user
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check if user is admin
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role, is_super_admin')
  .eq('user_id', user.id)
  .single();

if (
  profileError ||
  !profile?.role ||
  (profile.role !== 'admin' && !profile.is_super_admin)
) {
  return NextResponse.json(
    { error: 'Forbidden - Admin access required' },
    { status: 403 }
  );
}
```

### 新模式（使用标准化函数）
```typescript
// Authenticate user from request headers
const user = await authenticateRequest(request);

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check if user has admin permissions
if (!checkPermission(user, 'read')) {
  return NextResponse.json(
    { error: 'Forbidden - Admin access required' },
    { status: 403 }
  );
}
```

## 清理后的结果

### 统一的中间件验证
现在所有 `/api/admin/*` 路由都通过 `middleware.ts` 自动进行权限验证：

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    return adminMiddleware(request);
  }
  return;
}
```

### 简化的API代码
每个admin API现在只需要：

```typescript
export async function GET(request: NextRequest) {
  try {
    // 权限验证已由中间件处理
    
    // 直接进行业务逻辑
    const { data, error } = await supabaseAdmin
      .from('table')
      .select('*');
      
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 清理的文件列表

1. **src/app/api/admin/users/route.ts**
   - 移除 GET 和 POST 方法中的权限检查
   - 清理相关 import

2. **src/app/api/admin/users/[userId]/route.ts**
   - 移除 GET、PUT、DELETE 方法中的权限检查

3. **src/app/api/admin/users/[userId]/upgrade/route.ts**
   - 移除 POST 方法中的权限检查

4. **src/app/api/admin/pricing/route.ts**
   - 移除 GET 和 POST 方法中的权限检查

5. **src/app/api/admin/pricing/[tierId]/route.ts**
   - 移除 PUT 和 DELETE 方法中的权限检查

6. **src/app/api/admin/calls/route.ts**
   - 移除 GET 方法中的权限检查
   - 清理相关 import

## 优势

1. **代码复用性**: 权限验证逻辑统一管理，避免重复代码
2. **维护性**: 权限验证规则修改只需要在一个地方进行
3. **一致性**: 所有admin API使用相同的权限验证逻辑
4. **性能**: 中间件在路由级别进行验证，无需在每个API中重复执行
5. **安全性**: 统一的验证入口降低了权限检查遗漏的风险

## 注意事项

- 所有 `/api/admin/*` 路由现在都自动需要admin权限
- 如果需要不同的权限级别，可以在具体的API中添加额外的检查
- 中间件会拦截所有admin请求，确保只有授权用户才能访问