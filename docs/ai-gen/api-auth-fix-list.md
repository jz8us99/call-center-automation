# API认证修复清单

## 问题原因
Settings页面中的多个配置组件调用 `/api/business/profile` 时缺少 Authorization 头部。

## ✅ 已修复的文件
1. **StaffCalendarListing.tsx** - 第126行 ✅
2. **useWorkflowState.ts** - 第35行等 ✅
3. **BusinessInformationStep.tsx** - 第227行 ✅

## ❌ 需要修复的Settings页面相关文件

### 修复模式
对于每个文件，执行以下两个修改：

#### 1. 添加import（在文件顶部）
```typescript
import { authenticatedFetch } from '@/lib/api-client';
```

#### 2. 替换fetch调用
```typescript
// 修改前
const response = await fetch(`/api/business/profile?user_id=${user.id}`);

// 修改后
const response = await authenticatedFetch(`/api/business/profile?user_id=${user.id}`);
```

### 待修复文件列表

#### 核心Settings页面组件（优先级最高）
1. **BusinessInformationHeader.tsx** - 第82行
   - 文件路径: `/src/components/configuration/BusinessInformationHeader.tsx`
   - 函数名: `loadBusinessProfile`

2. **BusinessProducts.tsx** - 第132行
   - 文件路径: `/src/components/configuration/BusinessProducts.tsx`  
   - 函数名: `loadBusinessProfileAndData`

3. **BusinessServices.tsx** - 第133行
   - 文件路径: `/src/components/configuration/BusinessServices.tsx`
   - 函数名: `loadBusinessProfileAndData`

4. **StaffManagement.tsx** - 第34行
   - 文件路径: `/src/components/configuration/StaffManagement.tsx`
   - 函数名: `loadBusinessProfile`

5. **AIAgentsStep.tsx** - 第166行和第421行
   - 文件路径: `/src/components/configuration/AIAgentsStep.tsx`
   - 函数名: `loadBusinessInfo` 和 `saveAgentConfiguration`

6. **StaffCalendarConfiguration.tsx** - 第275行
   - 文件路径: `/src/components/configuration/StaffCalendarConfiguration.tsx`
   - 函数名: `loadBusinessProfile`

7. **WorkingBusinessProductsServices.tsx** - 第120行
   - 文件路径: `/src/components/configuration/WorkingBusinessProductsServices.tsx`
   - 函数名: `loadBusinessProfileAndData`

#### 日历页面（优先级中等）
8. **appointments/calendar/[staffId]/page.tsx** - 第69行
9. **appointments/calendar/page.tsx** - 第44行
10. **calendar/page.tsx** - 第44行
11. **calendar/setup/page.tsx** - 第62行

## 修复后的验证
修复完成后，访问 Settings -> Business 页面应该不再出现401错误。

## 快速修复脚本思路
```bash
# 可以使用sed命令批量替换（如果需要）
find src -name "*.tsx" -type f -exec sed -i 's/fetch(`\/api\/business\/profile/authenticatedFetch(`\/api\/business\/profile/g' {} \;
```

**注意**: 还需要手动添加import语句到每个修改的文件。