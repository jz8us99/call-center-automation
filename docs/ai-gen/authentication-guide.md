# 🔐 API认证使用指南

## 如何获取JWT令牌

### 方法1：浏览器控制台
在已登录的应用页面，打开浏览器开发者工具控制台，运行：

```javascript
supabase.auth.getSession().then(({data}) => {
  console.log('Access Token:', data.session?.access_token);
  console.log('User ID:', data.session?.user?.id);
});
```

### 方法2：程序化获取
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 用户登录后
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'your-email@example.com',
  password: 'your-password'
})

const token = data.session?.access_token
```

## API调用示例

### 使用curl
```bash
curl -X GET \
  "http://localhost:3000/api/business/profile?user_id=7be6daca-9929-4cff-94be-2dc7f29ceea5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 使用fetch
```javascript
const response = await fetch('/api/business/profile?user_id=7be6daca-9929-4cff-94be-2dc7f29ceea5', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

## 为什么需要JWT认证？

1. **RLS策略要求** - 数据库的行级安全策略需要 `auth.uid()` 来自JWT
2. **用户隔离** - 确保用户只能访问自己的数据
3. **安全合规** - 符合企业级安全标准
4. **权限控制** - 精确的访问权限管理