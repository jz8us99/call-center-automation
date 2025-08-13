# Retell Webhook拦截器使用指南

## 概述

为 `/api/retell` 下的所有POST和PUT方法接口创建了统一的webhook验证拦截器，去除了接口内重复的安全检查代码。

## 拦截器组件

### 1. 中间件 (`retell-webhook-middleware.ts`)
- **文件位置**: `src/lib/interceptors/middleware/retell-webhook-middleware.ts`
- **作用**: 记录Retell webhook请求日志
- **适用范围**: 所有 `/api/retell/*` 下的POST和PUT请求

### 2. 验证装饰器 (`withRetellWebhookVerification`)
- **作用**: 自动验证webhook签名和payload
- **使用方式**: 包装API处理函数

## 使用方法

### 🔄 从旧方式迁移

**之前的方式（已移除）**:
```typescript
export async function POST(request: NextRequest) {
  // 手动验证
  const verification = await verifyRetellWebhook(request);
  if (!verification.success) {
    return verification.error!;
  }
  
  const { payload } = verification;
  // API逻辑...
}
```

**现在的方式（推荐）**:
```typescript
import { withRetellWebhookVerification } from '@/lib/interceptors';

async function handlePOST(request: NextRequest, verification: any) {
  // verification已经包含验证结果，直接使用
  const { payload } = verification;
  // API逻辑...
}

export async function POST(request: NextRequest) {
  return withRetellWebhookVerification(request, handlePOST);
}
```

### 📋 验证结果结构

装饰器会将验证结果作为第二个参数传递给处理函数：

```typescript
verification: {
  success: boolean,
  payload: any,        // webhook payload数据
  body: any,          // 原始请求体
  error?: NextResponse // 如果验证失败的错误响应
}
```

## 已更新的API

### ✅ `/api/retell/webhook/route.ts`
- 移除了手动的 `verifyRetellWebhook` 调用
- 使用 `withRetellWebhookVerification` 装饰器
- 简化了 `handlePOST` 函数参数

### ✅ `/api/retell/functions/clinic/route.ts`
- 移除了手动的webhook验证逻辑
- 使用统一的验证装饰器
- 直接从verification参数获取payload

## 中间件配置

### middleware.ts 配置
```typescript
export async function middleware(request: NextRequest) {
  // Retell Webhook验证
  if (shouldVerifyRetellWebhook(pathname, method)) {
    const result = await retellWebhookMiddleware(request);
    if (result) {
      return result;
    }
  }
  // 其他中间件...
}

export const config = {
  matcher: [
    '/api/retell/:path*', // 包含retell路径
    // 其他路径...
  ]
};
```

### 路径匹配规则
- **包含路径**: `/api/retell/*`
- **适用方法**: POST, PUT
- **验证逻辑**: 自动使用 `verifyRetellWebhook`

## 日志输出

### 中间件日志
```
[Retell Webhook Middleware] Processing POST /api/retell/webhook
```

### 验证装饰器日志
```
[Retell Webhook] Verifying POST /api/retell/webhook
[Retell Webhook] Verification successful
```

## 错误处理

### 验证失败
- 返回标准的HTTP错误响应
- 包含详细的错误信息
- 状态码：400 (签名无效) 或 500 (服务器错误)

### 示例错误响应
```json
{
  "error": "Invalid webhook signature"
}
```

## 优势

### 🎯 **代码简化**
- 移除了重复的验证代码
- API处理函数更专注于业务逻辑

### 🔒 **安全一致性**
- 统一的webhook验证逻辑
- 减少了安全检查的遗漏风险

### 🛠️ **维护便利**
- 验证逻辑集中管理
- 修改验证规则只需更新一处

### 📊 **调试友好**
- 统一的日志格式
- 详细的错误信息记录

## 扩展性

如需添加新的Retell API：

1. 创建API处理函数（接收verification参数）
2. 使用 `withRetellWebhookVerification` 装饰器
3. 中间件会自动处理验证

```typescript
// 新的Retell API示例
async function handleNewAPI(request: NextRequest, verification: any) {
  const { payload } = verification;
  // 新的API逻辑
}

export async function POST(request: NextRequest) {
  return withRetellWebhookVerification(request, handleNewAPI);
}
```