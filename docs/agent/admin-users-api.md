# Admin Users API 搜索功能

## API端点

`GET /api/admin/users`

## 功能说明

该API现在支持用户搜索功能，可以通过email或full_name字段进行模糊匹配查询。

## 请求参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `search` | string | "" | 搜索关键字，支持email和full_name的模糊匹配 |
| `limit` | number | 4 | 返回用户数量限制 |

## 使用示例

### 1. 默认查询（显示4个最新用户）
```
GET /api/admin/users
```

### 2. 搜索特定用户
```
GET /api/admin/users?search=john
```
会匹配包含"john"的email或full_name

### 3. 搜索并限制数量
```
GET /api/admin/users?search=admin&limit=2
```

### 4. 只设置数量限制
```
GET /api/admin/users?limit=10
```

## 响应格式

```json
{
  "users": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "full_name": "User Name",
      "phone_number": "+1234567890",
      "role": "user",
      "pricing_tier": "basic",
      "agent_types_allowed": ["inbound_call"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "business_name": "Company Name",
      "business_type": "tech"
    }
  ],
  "search": "john",
  "limit": 4,
  "total": 1
}
```

## 搜索逻辑

- 使用PostgreSQL的`ilike`操作符进行不区分大小写的模糊匹配
- 同时搜索`email`和`full_name`字段
- 搜索关键字两端会自动添加通配符（%）
- 结果按创建时间倒序排列

## 技术实现

```typescript
// 构建LIKE查询条件
if (search.trim()) {
  query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
}
```

## 安全性

- 所有admin API都通过中间件进行权限验证
- 只有具有admin或super_admin角色的用户才能访问
- 使用参数化查询防止SQL注入