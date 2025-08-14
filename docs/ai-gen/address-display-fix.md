# Address Display Fix - 地址显示修复

## 问题分析

通过用户提供的API响应数据分析，发现业务地址信息实际存储在`business_profiles`表中，包含：

```json
{
  "business_address": "123 Main street, pomona, ca, 98232",
  "street_address": "123 Main street",
  "city": "pomona", 
  "state": "ca",
  "postal_code": "98232"
}
```

但我们的metadata服务只从`business_locations`表获取地址信息，导致地址显示为空。

## ✅ 已实施的修复

### 1. 更新BusinessProfileData接口
添加了地址相关字段：
```typescript
export interface BusinessProfileData {
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;     // 新增
  street_address: string;       // 新增  
  city: string;                 // 新增
  state: string;                // 新增
  postal_code: string;          // 新增
  business_hours: any;
  support_content: string;
}
```

### 2. 更新数据库查询
扩展business_profiles查询以包含所有地址字段：
```sql
SELECT business_name, business_phone, business_email, business_address, 
       street_address, city, state, postal_code, business_hours, support_content
FROM business_profiles 
WHERE user_id = ? AND is_active = true
```

### 3. 优化地址格式化逻辑
重构`formatLocation`方法实现双重数据源支持：

```typescript
private static formatLocation(
  businessProfile: BusinessProfileData | null,
  location: BusinessLocationData | null
): string {
  // 优先级1: business_profiles的完整地址
  if (businessProfile?.business_address) {
    return businessProfile.business_address;
  }
  
  // 优先级2: business_profiles的拆分地址字段
  if (businessProfile) {
    const parts = [
      businessProfile.street_address,
      businessProfile.city,
      businessProfile.state,
      businessProfile.postal_code,
    ].filter(Boolean);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  // 优先级3: business_locations表降级方案
  // ...
}
```

### 4. 更新聚合逻辑
修改`aggregateMetaData`方法传递businessProfile参数：
```typescript
const location = this.formatLocation(businessProfile, primaryLocation);
```

## 🎯 预期效果

修复后，地址显示逻辑按以下优先级工作：

1. **business_profiles.business_address** (完整地址字符串)
2. **business_profiles拆分字段拼接** (street_address + city + state + postal_code)  
3. **business_locations表降级** (原有逻辑保持不变)

对于用户的数据，现在应该能正确显示：
```
"123 Main street, pomona, ca, 98232"
```

## ✅ 代码质量

- TypeScript类型安全 ✅
- 向后兼容性保证 ✅  
- 错误处理完善 ✅
- 代码格式化完成 ✅

## 📋 测试就绪

地址显示修复已完成，可以进行以下测试验证：

1. **API响应测试**: 调用metadata API检查location字段
2. **数据源验证**: 确认从business_profiles正确获取地址
3. **降级测试**: 验证business_locations表的降级逻辑
4. **格式验证**: 确认地址格式正确显示

修复已准备好部署和测试。