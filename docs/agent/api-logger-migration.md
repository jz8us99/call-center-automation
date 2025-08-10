# API日志拦截器迁移指南

## 概述

API日志拦截器已从**手动调用方式**改为**自动中间件方式**，无需在每个API中手动添加日志代码。

## 变更内容

### 🔄 从手动调用改为自动拦截

**之前的方式（已废弃）**:
```typescript
import { withApiLogger } from '@/lib/interceptors';

export async function POST(request: NextRequest) {
  return withApiLogger(request, handlePOST);
}
```

**现在的方式（推荐）**:
```typescript
// 无需任何额外代码，中间件自动处理日志记录
export async function POST(request: NextRequest) {
  return handlePOST(request);
}
```

## 自动拦截配置

### 默认拦截路径
```typescript
const defaultLogPaths = [
  '/api/webhook',
  '/api/retell', 
  '/api/admin',
  '/api/clinic',
];
```

### 排除路径
```typescript
const excludePaths = [
  '/api/health',
  '/api/status', 
  '/api/ping',
];
```

### 中间件配置
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/api/admin/:path*',
    '/api/webhook/:path*', 
    '/api/retell/:path*',
    '/api/clinic/:path*'
  ]
};
```

## 环境变量配置

可以通过环境变量自定义API日志行为：

```bash
# 启用/禁用API日志
API_LOGGING_ENABLED=true

# 自定义日志路径
API_LOGGING_PATHS=/api/webhook,/api/retell,/api/custom

# 排除特定路径
API_LOGGING_EXCLUDE=/api/health,/api/internal

# 日志级别
API_LOGGING_LEVEL=basic  # 或 detailed
```

## 配置选项

### 基础配置
```typescript
export interface InterceptorConfig {
  apiLogger: {
    enabled: boolean;           // 是否启用API日志
    includePaths: string[];     // 包含的路径
    excludePaths: string[];     // 排除的路径
    logLevel: 'basic' | 'detailed';  // 日志级别
  };
}
```

### 日志级别

- **basic**: 记录基本请求信息（方法、URL、时间戳）
- **detailed**: 记录详细信息（包含请求/响应体，目前未实现）

## 迁移步骤

### 1. 移除手动调用
删除所有 `withApiLogger` 的使用：
```typescript
// 删除这行import
import { withApiLogger } from '@/lib/interceptors';

// 修改这种调用
export async function POST(request: NextRequest) {
  return withApiLogger(request, handlePOST);  // ❌ 删除
}

// 改为直接调用
export async function POST(request: NextRequest) {
  return handlePOST(request);  // ✅ 使用这种方式
}
```

### 2. 检查路径匹配
确保你的API路径在默认配置中，或通过环境变量添加：
```bash
API_LOGGING_PATHS=/api/your-custom-path
```

### 3. 测试日志输出
启动应用后，访问API会在控制台看到日志：
```
[API Logger] 2024-01-01T10:00:00.000Z POST http://localhost:3000/api/webhook/test
[API Logger] Headers: {"content-type": "application/json", ...}
```

## 已迁移的文件

✅ **已完成迁移**:
- `src/app/api/retell/webhook/route.ts`
- `src/app/api/clinic/functions/route.ts`

## 优势

1. **自动化**: 无需手动添加日志代码
2. **统一管理**: 所有日志规则集中配置
3. **性能优化**: 中间件层面过滤，避免不必要处理
4. **灵活配置**: 支持环境变量动态控制
5. **维护简单**: 修改日志规则无需改动业务代码

## 故障排除

### 日志没有显示
1. 检查路径是否匹配配置
2. 确认 `API_LOGGING_ENABLED` 不是 `false`
3. 检查路径是否在排除列表中

### 配置不生效
1. 重启应用以重新加载环境变量
2. 检查环境变量格式是否正确
3. 确认中间件配置的 matcher 包含你的路径