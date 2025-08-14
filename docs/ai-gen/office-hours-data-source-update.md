# Office Hours Data Source Update - 营业时间数据源更新

## 更新概述

根据用户需求，将metadata接口中的`hours`字段数据源从business_profiles的JSONB字段改为主要使用`office_hours`表的结构化数据，以提供更准确和灵活的营业时间信息。

## ✅ 实施的更改

### 1. 更新OfficeHoursData接口
修改接口以匹配实际的office_hours表结构：

```typescript
// 修改前
export interface OfficeHoursData {
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_open: boolean;
}

// 修改后
export interface OfficeHoursData {
  day_of_week: number;  // 0=周日, 1=周一, ..., 6=周六
  start_time: string;   // 格式: "09:00:00"
  end_time: string;     // 格式: "17:00:00"
  is_active: boolean;   // 是否营业
}
```

### 2. 更新查询逻辑
修改`getOfficeHours`方法：

```typescript
// 移除is_active过滤，获取所有记录
async getOfficeHours(): Promise<OfficeHoursData[]> {
  const { data, error } = await this.supabase
    .from('office_hours')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('user_id', this.userId)
    .order('day_of_week');  // 按星期排序
}
```

### 3. 修正day_of_week映射
更新`formatOfficeHours`方法的星期映射逻辑：

```typescript
// 修正星期映射（0=周日开始）
const daysOfWeek = [
  'Sunday',    // 0
  'Monday',    // 1  
  'Tuesday',   // 2
  'Wednesday', // 3
  'Thursday',  // 4
  'Friday',    // 5
  'Saturday',  // 6
];

// 使用准确的day_of_week匹配
const dayData = officeHours.find(hour => hour.day_of_week === index);

// 使用is_active字段判断是否营业
if (!dayData || !dayData.is_active) {
  return `${dayName}: Closed`;
}
```

### 4. 更新默认营业时间
调整默认营业时间格式以匹配office_hours的星期顺序：

```typescript
// 新的默认营业时间（周日开始）
return [
  'Sunday: Closed',
  'Monday: 9:00 AM to 5:00 PM',
  'Tuesday: 9:00 AM to 5:00 PM', 
  'Wednesday: 9:00 AM to 5:00 PM',
  'Thursday: 9:00 AM to 5:00 PM',
  'Friday: 9:00 AM to 5:00 PM',
  'Saturday: Closed',
];
```

## 📊 数据格式对比

### API响应数据结构
```json
{
  "office_hours": [
    {
      "day_of_week": 0,
      "start_time": "09:00:00",
      "end_time": "17:00:00", 
      "is_active": false
    },
    {
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "17:00:00",
      "is_active": true
    }
  ]
}
```

### 预期输出格式
基于提供的API数据，hours字段将显示：

```json
{
  "hours": [
    "Sunday: Closed",
    "Monday: 9:00 AM to 5:00 PM",
    "Tuesday: 9:00 AM to 5:00 PM", 
    "Wednesday: 9:00 AM to 5:00 PM",
    "Thursday: 9:00 AM to 5:00 PM",
    "Friday: 9:00 AM to 5:00 PM",
    "Saturday: Closed"
  ]
}
```

## 🎯 星期映射逻辑

### day_of_week数值对应
```
0 → Sunday (周日)
1 → Monday (周一)
2 → Tuesday (周二)
3 → Wednesday (周三)
4 → Thursday (周四)
5 → Friday (周五)
6 → Saturday (周六)
```

### 营业状态判断
- `is_active: true` → 显示营业时间
- `is_active: false` → 显示"Closed"
- 数据库中无记录 → 显示"Closed"

## 🔧 技术实现细节

### 查询优化
- **获取全部**: 不再过滤`is_active`，获取所有星期的记录
- **排序处理**: 按`day_of_week`数值排序
- **数据映射**: 准确映射星期索引和营业状态

### 时间格式化
继续使用现有的`formatTime`方法：
```typescript
// "09:00:00" → "9:00 AM"
// "17:00:00" → "5:00 PM"
private static formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

### 降级机制
保持多层降级策略：
1. **优先**: office_hours表数据
2. **降级**: business_profiles.business_hours JSONB
3. **默认**: 固定的默认营业时间

## ✅ 数据验证

基于提供的API响应，预期处理结果：

| day_of_week | is_active | 显示结果 |
|------------|-----------|---------|
| 0 (周日) | false | "Sunday: Closed" |
| 1 (周一) | true | "Monday: 9:00 AM to 5:00 PM" |
| 2 (周二) | true | "Tuesday: 9:00 AM to 5:00 PM" |
| 3 (周三) | true | "Wednesday: 9:00 AM to 5:00 PM" |
| 4 (周四) | true | "Thursday: 9:00 AM to 5:00 PM" |
| 5 (周五) | true | "Friday: 9:00 AM to 5:00 PM" |
| 6 (周六) | false | "Saturday: Closed" |

## 🚀 部署影响

- **零停机**: 不影响现有API可用性
- **数据准确**: 使用结构化的office_hours表数据
- **灵活配置**: 支持每天独立的营业时间设置
- **向后兼容**: 保持现有响应格式

## 🔄 与原有系统的关系

- **数据源优先级**: office_hours表 > business_hours JSONB > 默认值
- **接口格式**: 保持string[]格式不变
- **错误处理**: 现有验证和降级机制继续有效

---

**营业时间数据源已成功更新为使用office_hours表，提供更精确的业务时间信息！**