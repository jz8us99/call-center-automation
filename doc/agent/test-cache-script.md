# Cache Invalidation Test Script

## 测试缓存失效拦截器

使用以下curl命令测试缓存失效是否正常工作：

### 1. 设置测试数据（应该触发缓存失效）

```bash
curl -X POST http://localhost:3000/api/test-cache \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "test_user_123",
    "test_data": {
      "message": "test cache data",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }' \
  -v
```

**期望结果**:
- 状态码: 200
- 响应头包含: `X-Cache-Invalidated: true`
- 控制台显示缓存失效日志

### 2. 查看缓存状态

```bash
curl "http://localhost:3000/api/test-cache?user_id=test_user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

**期望结果**:
```json
{
  "userId": "test_user_123",
  "stats": {
    "exists": true,
    "ttl": 900,
    "agentCount": 1
  },
  "agentList": ["test_agent"],
  "allData": {
    "test_agent": {
      "message": "test cache data",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  }
}
```

### 3. 手动清理缓存

```bash
curl -X DELETE "http://localhost:3000/api/test-cache?user_id=test_user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

### 4. 验证缓存已清理

```bash
curl "http://localhost:3000/api/test-cache?user_id=test_user_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -v
```

**期望结果**:
```json
{
  "userId": "test_user_123",
  "stats": {
    "exists": false,
    "ttl": -1,
    "agentCount": 0
  },
  "agentList": [],
  "allData": null
}
```

## 测试真实业务端点

### 测试 /api/business/profile

```bash
curl -X POST http://localhost:3000/api/business/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "user_id": "your_real_user_id",
    "business_name": "Test Business",
    "business_phone": "+1234567890"
  }' \
  -v
```

**检查点**:
1. 响应状态码应该是 200
2. 响应头应该包含 `X-Cache-Invalidated: true`
3. 控制台应该显示缓存失效日志

## JavaScript 测试（浏览器控制台）

```javascript
// 获取当前用户的JWT token
const token = localStorage.getItem('supabase.auth.token') || 
              sessionStorage.getItem('supabase.auth.token');

// 或者从其他地方获取token
// const token = 'your_jwt_token_here';

// 测试缓存设置
fetch('/api/test-cache', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    user_id: 'test_user_123',
    test_data: { message: 'test from browser', timestamp: new Date().toISOString() }
  })
})
.then(response => {
  console.log('Response headers:', [...response.headers.entries()]);
  console.log('Cache invalidated:', response.headers.get('X-Cache-Invalidated'));
  return response.json();
})
.then(data => console.log('Response data:', data))
.catch(error => console.error('Error:', error));

// 检查缓存状态
fetch('/api/test-cache?user_id=test_user_123', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => console.log('Cache status:', data))
.catch(error => console.error('Error:', error));
```

## 验证步骤

1. **启动开发服务器**: `yarn dev`
2. **获取有效的JWT token**（从浏览器的开发者工具或登录响应中）
3. **运行上述测试命令**
4. **检查控制台日志**是否显示正确的缓存失效流程
5. **验证响应头**包含缓存失效标识

## 故障排除

如果测试失败，按以下顺序检查：

1. **JWT Token**: 确保token有效且未过期
2. **环境变量**: 检查 `SUPABASE_JWT_SECRET` 是否正确设置
3. **路由配置**: 确认拦截器正确配置
4. **缓存服务**: 确认Redis/KV服务正常运行
5. **日志输出**: 查看详细的调试日志

## 清理

测试完成后，删除测试路由：

```bash
rm src/app/api/test-cache/route.ts
```

这个测试可以帮助您验证缓存失效拦截器是否正确工作，并定位任何配置问题。