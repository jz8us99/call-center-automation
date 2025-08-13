# Business Settings Component Tree

## 主组件结构

```
BusinessSettings.tsx
├── 引用的 configuration 组件
│   ├── LoadingScreen (@/components/configuration/ConfigurationPage/LoadingScreen)
│   ├── Step (@/components/configuration/ConfigurationPage/StepNavigation)
│   ├── RequirementsNotice (@/components/configuration/ConfigurationPage/RequirementsNotice)
│   ├── StepContent (@/components/configuration/ConfigurationPage/StepContent) ★
│   └── useWorkflowState (hook)
│
├── UI 组件引用 (未使用，但 StepContent 内部使用)
│   └── Card, CardContent (@/components/ui/card)
│
└── 图标组件
    ├── SettingsIcon
    ├── UsersIcon
    ├── CalendarIcon
    ├── BuildingIcon
    ├── ClockIcon
    └── CheckIcon
```

## StepContent 组件包含的六个步骤

### Step 1: BusinessInformationStep
```
BusinessInformationStep.tsx (@/components/configuration/)
├── UI 组件引用
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Textarea (@/components/ui/textarea)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)
│
└── 业务逻辑
    └── BUSINESS_TYPE_CONFIGS (@/types/business-types)
```

### Step 2: BusinessProducts
```
BusinessProducts.tsx (@/components/configuration/)
├── UI 组件引用
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Textarea (@/components/ui/textarea)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)
│
└── 图标组件
    ├── EditIcon
    ├── XIcon
    ├── CheckIcon
    ├── PlusIcon
    └── TrashIcon
```

### Step 3: BusinessServices
```
BusinessServices.tsx (@/components/configuration/)
├── UI 组件引用
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Textarea (@/components/ui/textarea)
│   ├── Badge (@/components/ui/badge)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)
│
└── 图标组件
    ├── EditIcon
    ├── XIcon
    ├── CheckIcon
    ├── PlusIcon
    └── TrashIcon
```

### Step 4: AppointmentSystemConfig
```
AppointmentSystemConfig.tsx (@/components/configuration/)
├── UI 组件引用
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Switch (@/components/ui/switch)
│   ├── Badge (@/components/ui/badge)
│   ├── Tabs, TabsContent, TabsList, TabsTrigger (@/components/ui/tabs)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   ├── Checkbox (@/components/ui/checkbox)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)
│
└── 图标组件
    ├── CalendarIcon
    ├── ClockIcon
    ├── MapPinIcon
    ├── CheckIcon
    ├── EditIcon
    ├── XIcon
    ├── PlusIcon
    └── TrashIcon
```

### Step 5: StaffManagement
```
StaffManagement.tsx (@/components/configuration/)
└── 子组件
    └── FinalStaffManagement.tsx (@/components/configuration/)
        ├── UI 组件引用
        │   ├── Button (@/components/ui/button)
        │   ├── Input (@/components/ui/input)
        │   ├── Label (@/components/ui/label)
        │   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
        │   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
        │   ├── Textarea (@/components/ui/textarea)
        │   ├── Checkbox (@/components/ui/checkbox)
        │   ├── Dialog (@/components/ui/dialog)
        │   └── useConfirmDialog (@/components/ui/confirm-dialog)
        │
        ├── 子组件
        │   └── StaffCalendarConfiguration.tsx (@/components/configuration/)
        │       ├── UI 组件引用
        │       │   ├── Button (@/components/ui/button)
        │       │   ├── Input (@/components/ui/input)
        │       │   ├── Label (@/components/ui/label)
        │       │   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
        │       │   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
        │       │   ├── Textarea (@/components/ui/textarea)
        │       │   ├── Switch (@/components/ui/switch)
        │       │   ├── Badge (@/components/ui/badge)
        │       │   ├── Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle (@/components/ui/dialog)
        │       │   └── useConfirmDialog (@/components/ui/confirm-dialog)
        │       │
        │       ├── 自实现功能
        │       │   ├── 内部实现了完整的日历管理功能 (3137行代码)
        │       │   ├── 办公时间设置
        │       │   ├── 节假日管理  
        │       │   ├── 员工个人日历配置
        │       │   └── 预订设置管理
        │       │
        │       └── 图标组件
        │           ├── CalendarIcon
        │           ├── ClockIcon
        │           ├── CheckIcon
        │           ├── ArrowLeftIcon
        │           ├── ArrowRightIcon
        │           ├── SettingsIcon
        │           └── AlertIcon
        │
        └── 图标组件
            ├── EditIcon
            ├── CheckIcon
            ├── XIcon
            ├── TrashIcon
            ├── CalendarIcon
            ├── ClockIcon
            ├── PhoneIcon
            ├── MailIcon
            └── UserPlusIcon
```

### Step 6: AIAgentsStep
```
AIAgentsStep.tsx (@/components/configuration/)
├── UI 组件引用
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Badge (@/components/ui/badge)
│   ├── Textarea (@/components/ui/textarea)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)
│
├── 子组件 (来自 ai-agents 目录)
│   ├── AgentTypeCallScripts.tsx (@/components/ai-agents/)
│   │   ├── UI 组件引用
│   │   │   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   │   │   ├── Button (@/components/ui/button)
│   │   │   ├── Input (@/components/ui/input)
│   │   │   ├── Textarea (@/components/ui/textarea)
│   │   │   └── Badge (@/components/ui/badge)
│   │   │
│   │   └── 图标组件
│   │       ├── CheckIcon
│   │       ├── EditIcon
│   │       ├── PlusIcon
│   │       ├── Wand2 (lucide-react)
│   │       └── RefreshCw (lucide-react)
│   │
│   ├── AgentTypeVoiceSettings.tsx (@/components/ai-agents/)
│   │   ├── UI 组件引用
│   │   │   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   │   │   ├── Button (@/components/ui/button)
│   │   │   ├── Badge (@/components/ui/badge)
│   │   │   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   │   │   └── Slider (@/components/ui/slider)
│   │   │
│   │   └── 图标组件
│   │       ├── CheckIcon
│   │       ├── PlayIcon
│   │       ├── StopIcon
│   │       └── VolumeIcon
│   │
│   └── AgentTypeCallRouting.tsx (@/components/ai-agents/)
│       ├── UI 组件引用
│       │   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│       │   ├── Button (@/components/ui/button)
│       │   ├── Input (@/components/ui/input)
│       │   ├── Badge (@/components/ui/badge)
│       │   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│       │   └── Switch (@/components/ui/switch)
│       │
│       └── 图标组件
│           ├── EditIcon
│           ├── CheckIcon
│           ├── XIcon
│           ├── PlusIcon
│           └── TrashIcon
│
└── 图标组件
    ├── SettingsIcon
    ├── PhoneIcon
    ├── CheckIcon
    ├── EditIcon
    ├── TrashIcon
    ├── XIcon
    └── PlusIcon
```

## 所有需要更新的 UI 组件引用汇总

以下是所有需要从 `@/components/ui/` 更新到 `@/components/newui/` 的组件：

### 基础 UI 组件
- Button
- Input
- Label
- Badge
- Textarea
- Checkbox
- Switch
- Slider

### 容器组件
- Card (包括 CardContent, CardDescription, CardFooter, CardHeader, CardTitle)
- Dialog (包括 DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle)

### 选择器组件
- Select (包括 SelectContent, SelectItem, SelectTrigger, SelectValue)

### 导航组件
- Tabs (包括 TabsContent, TabsList, TabsTrigger)

### 工具组件
- useConfirmDialog (hook)
- confirm-dialog

## Business Settings 扩展页面组件

这些组件虽然不直接属于 BusinessSettings 组件树，但它们是 Business Settings 功能的扩展页面，特别是 Step 5 (员工管理) 的外部管理界面：

### appointments 目录组件 (Business Settings Step 5 的扩展界面)
```
AppointmentSystem.tsx (@/components/appointments/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Switch (@/components/ui/switch)
│   ├── Badge (@/components/ui/badge)
│   ├── Tabs, TabsContent, TabsList, TabsTrigger (@/components/ui/tabs)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   ├── Checkbox (@/components/ui/checkbox)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)

AppointmentManagementDashboard.tsx (@/components/appointments/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Badge (@/components/ui/badge)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   └── Textarea (@/components/ui/textarea)

StaffAppointmentCalendar.tsx (@/components/appointments/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Badge (@/components/ui/badge)
│   ├── Textarea (@/components/ui/textarea)
│   ├── Switch (@/components/ui/switch)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   └── Tabs, TabsContent, TabsList, TabsTrigger (@/components/ui/tabs)

StaffCalendarListing.tsx (@/components/appointments/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   └── Badge (@/components/ui/badge)
```

**使用场景：**
- `/app/appointments/page.tsx` - 主要预约管理页面，包含 "Step 5: Configuration" 标签页
- `/app/appointments/calendar/page.tsx` - 员工日历列表页面  
- `/app/appointments/calendar/[staffId]/page.tsx` - 单个员工的预约日历页面

**与 Business Settings 的关系：**
- `AppointmentSystem` 组件被用作 Business Settings Step 5 的外部配置界面
- 提供了比 BusinessSettings 内嵌组件更丰富的预约管理功能
- 是 Step 5 (员工管理) 的扩展和补充

### calendar 目录组件 (独立的日历管理页面)
```
CalendarConfigurationDashboard.tsx (@/components/calendar/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Badge (@/components/ui/badge)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Label (@/components/ui/label)
│   ├── Textarea (@/components/ui/textarea)
│   └── useConfirmDialog (@/components/ui/confirm-dialog)

StaffCalendarView.tsx (@/components/calendar/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Textarea (@/components/ui/textarea)
│   ├── Switch (@/components/ui/switch)
│   ├── Badge (@/components/ui/badge)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)
│   └── Tabs, TabsContent, TabsList, TabsTrigger (@/components/ui/tabs)

OfficeHoursSetup.tsx (@/components/calendar/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   └── Switch (@/components/ui/switch)

HolidaysManagement.tsx (@/components/calendar/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Textarea (@/components/ui/textarea)
│   ├── Switch (@/components/ui/switch)
│   ├── Badge (@/components/ui/badge)
│   ├── Checkbox (@/components/ui/checkbox)
│   └── Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle (@/components/ui/dialog)

BookingSettingsManagement.tsx (@/components/calendar/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Textarea (@/components/ui/textarea)
│   ├── Switch (@/components/ui/switch)
│   └── Tabs, TabsContent, TabsList, TabsTrigger (@/components/ui/tabs)
```

**使用场景：**
- `/app/calendar/page.tsx` - 日历配置主控制台
- `/app/calendar/setup/page.tsx` - 办公时间和节假日设置页面
- `/app/calendar/staff/[staffId]/page.tsx` - 单个员工的日历视图页面

**与 Business Settings 的关系：**
- 独立的日历管理系统，与 BusinessSettings Step 5 并行
- 提供更细致的办公时间、节假日、预订设置管理
- 从 `/app/appointments/page.tsx` 中有快速访问链接

### booking 目录组件 (客户预订界面)
```
AppointmentBookingInterface.tsx (@/components/booking/)
├── UI 组件引用
│   ├── Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle (@/components/ui/card)
│   ├── Button (@/components/ui/button)
│   ├── Input (@/components/ui/input)
│   ├── Label (@/components/ui/label)
│   ├── Select, SelectContent, SelectItem, SelectTrigger, SelectValue (@/components/ui/select)
│   ├── Textarea (@/components/ui/textarea)
│   └── Badge (@/components/ui/badge)
```

**使用场景：**
- `/app/appointments/page.tsx` - 作为客户预订界面标签页
- 为客户提供在线预订服务的界面

**与 Business Settings 的关系：**
- 客户端预订界面，使用 Business Settings 中配置的服务和员工信息
- 是整个预约系统的前端客户界面

## 需要更新的文件列表

### configuration 目录 (17个文件)

**重要发现：存在两套配置系统！**
1. **原始 Configuration 系统**：`/app/configuration/page.tsx`
2. **新的 Business Settings 系统**：`/components/settings/business/BusinessSettings.tsx`

**主要步骤组件 (6个文件) - 被两套系统共享：**
1. `/components/configuration/BusinessInformationStep.tsx` ✅ **→ Step 1: Business Information**
2. `/components/configuration/BusinessProducts.tsx` ✅ **→ Step 2: Products**
3. `/components/configuration/BusinessServices.tsx` ✅ **→ Step 3: Services** 
4. `/components/configuration/AppointmentSystemConfig.tsx` ✅ **→ Step 4: Appointment System**
5. `/components/configuration/StaffManagement.tsx` ✅ **→ Step 5: Staff Management**
6. `/components/configuration/AIAgentsStep.tsx` ✅ **→ Step 6: AI Agents Setup**

**子组件 (6个文件) - 被主要组件内部引用：**

**Step 5 子组件：**
7. `/components/configuration/FinalStaffManagement.tsx` (被 StaffManagement 使用)
8. `/components/configuration/StaffCalendarConfiguration.tsx` (被 FinalStaffManagement 使用)

**Admin 管理组件：**
9. `/components/configuration/AgentConfigurationDashboard.tsx` (被 /app/admin 页面使用)
10. `/components/configuration/AgentTypeSelector.tsx` (被 AgentConfigurationDashboard 使用)
11. `/components/configuration/BusinessInformationHeader.tsx` (被 AgentConfigurationDashboard 使用)
12. `/components/configuration/BusinessInformationForm.tsx` (被 BusinessInformationHeader 使用)

**ConfigurationPage 系统组件分析：**

**系统基础设施组件 (5个文件) - 支撑整个配置系统：**
13. `/components/configuration/ConfigurationPage/StepContent.tsx` ✅ **→ 核心路由组件 (包含所有6个步骤)**
14. `/components/configuration/ConfigurationPage/LoadingScreen.tsx` ✅ **→ 加载状态组件**
15. `/components/configuration/ConfigurationPage/StepNavigation.tsx` ✅ **→ 步骤导航类型定义**
16. `/components/configuration/ConfigurationPage/RequirementsNotice.tsx` ✅ **→ 前置条件提醒组件**
17. `/components/configuration/ConfigurationPage/hooks/useWorkflowState.ts` ✅ **→ 工作流状态管理 hook**

**只被原始系统使用的组件 (3个文件) - 可以删除：**
❌ `/components/configuration/ConfigurationPage/index.tsx` (原始系统主入口，已弃用)
❌ `/components/configuration/ConfigurationPage/ProgressBar.tsx` (只被 index.tsx 使用)
❌ `/components/configuration/ConfigurationPage/ProgressNotification.tsx` (只被 index.tsx 使用)

**注意：以下文件未被使用，不需要更新：**
- ❌ `/components/configuration/BusinessProductsServices.tsx` (无引用)
- ❌ `/components/configuration/SimpleBusinessProductsServices.tsx` (无引用) 
- ❌ `/components/configuration/WorkingBusinessProductsServices.tsx` (无引用)
- ❌ `/components/configuration/CallScriptEditor.tsx` (无引用)
- ❌ `/components/configuration/VoiceSettingsPanel.tsx` (无引用)
- ❌ `/components/configuration/ConsolidatedStaffManagement.tsx` (无引用)
- ❌ `/components/configuration/JobCategoriesManagement.tsx` (无引用)
- ❌ `/components/configuration/JobTitleManagement.tsx` (无引用)
- ❌ `/components/configuration/JobTypeManagement.tsx` (无引用)  
- ❌ `/components/configuration/JobTypesForCategoryManagement.tsx` (无引用)
- ❌ `/components/configuration/NewJobTitleManagement.tsx` (无引用)

### ai-agents 目录 (3个文件)
1. `/components/ai-agents/AgentTypeCallScripts.tsx`
2. `/components/ai-agents/AgentTypeVoiceSettings.tsx`
3. `/components/ai-agents/AgentTypeCallRouting.tsx`

### appointments 目录 (4个文件)
1. `/components/appointments/AppointmentSystem.tsx`
2. `/components/appointments/AppointmentManagementDashboard.tsx`
3. `/components/appointments/StaffAppointmentCalendar.tsx`
4. `/components/appointments/StaffCalendarListing.tsx`

### calendar 目录 (5个文件)
1. `/components/calendar/CalendarConfigurationDashboard.tsx`
2. `/components/calendar/StaffCalendarView.tsx`
3. `/components/calendar/OfficeHoursSetup.tsx`
4. `/components/calendar/HolidaysManagement.tsx`
5. `/components/calendar/BookingSettingsManagement.tsx`

### booking 目录 (1个文件)
1. `/components/booking/AppointmentBookingInterface.tsx`

## 总体统计

**清理前总计文件数量：33个**
- configuration 目录：20个文件 (包含两套配置系统)
- ai-agents 目录：3个文件  
- appointments 目录：4个文件
- calendar 目录：5个文件
- booking 目录：1个文件

**清理后需要更新的文件数量：17个** ⭐
- configuration 目录：6个文件 (删除 14个弃用/未使用文件)
- ai-agents 目录：3个文件  
- appointments 目录：4个文件
- calendar 目录：5个文件
- booking 目录：1个文件

**清理收益：减少 16 个不必要的文件更新** 🎉

**重大发现：存在两套配置系统，原始系统已清理**
1. ❌ **原始系统（已删除）**：`/app/configuration` → `ConfigurationPage` 
2. ✅ **新系统（正在使用）**：`/app/settings/business` → `BusinessSettings`  
3. **所有组件现在统一在新的目录结构下**

## 清理计划 - 删除弃用的原始配置系统

### 第一阶段：删除入口文件和路由
1. **删除页面入口**：
   ```bash
   rm /app/configuration/page.tsx
   ```

2. **删除原始系统主组件**：
   ```bash
   rm /components/configuration/ConfigurationPage/index.tsx
   ```

3. **删除只被原始系统使用的组件**：
   ```bash
   rm /components/configuration/ConfigurationPage/ProgressBar.tsx
   rm /components/configuration/ConfigurationPage/ProgressNotification.tsx
   ```

### 第二阶段：删除未使用的组件（可选清理）
```bash
rm /components/configuration/BusinessProductsServices.tsx
rm /components/configuration/SimpleBusinessProductsServices.tsx
rm /components/configuration/WorkingBusinessProductsServices.tsx
rm /components/configuration/CallScriptEditor.tsx
rm /components/configuration/VoiceSettingsPanel.tsx
rm /components/configuration/ConsolidatedStaffManagement.tsx
rm /components/configuration/JobCategoriesManagement.tsx
rm /components/configuration/JobTitleManagement.tsx
rm /components/configuration/JobTypeManagement.tsx
rm /components/configuration/JobTypesForCategoryManagement.tsx
rm /components/configuration/NewJobTitleManagement.tsx
```

### 第三阶段：验证清理结果
1. **确认没有遗留引用**：
   ```bash
   grep -r "ConfigurationPage/index" src/
   grep -r "ProgressBar\|ProgressNotification" src/
   ```

2. **验证新系统仍然正常工作**：
   - 访问 `/settings/business` 页面
   - 确认所有 6 个步骤正常显示
   - 测试组件功能

### 清理后保留的 configuration 文件按 Step 分类

**🏢 Step 1: Business Information**
1. `/components/settings/business/steps/step1-business/BusinessInformationStep.tsx` ✅

**📦 Step 2: Products** 
2. `/components/settings/business/steps/step2-products/BusinessProducts.tsx` ✅

**⚙️ Step 3: Services**
3. `/components/settings/business/steps/step3-services/BusinessServices.tsx` ✅

**📅 Step 4: Appointment System**
4. `/components/settings/business/steps/step4-appointments/AppointmentSystemConfig.tsx` ✅

**👥 Step 5: Staff Management**
5. `/components/settings/business/steps/step5-staff/StaffManagement.tsx` ✅
6. `/components/settings/business/steps/step5-staff/FinalStaffManagement.tsx` (子组件)
7. `/components/settings/business/steps/step5-staff/StaffCalendarConfiguration.tsx` (子组件)

**🤖 Step 6: AI Agents Setup**
8. `/components/settings/business/steps/step6-agents/AIAgentsStep.tsx` ✅

**🔧 Admin 管理组件** (独立于步骤，用于管理员界面)
9. `/components/settings/business/admin/AgentConfigurationDashboard.tsx` - 管理员用户代理配置面板
10. `/components/settings/business/admin/AgentTypeSelector.tsx` - 代理类型选择器
11. `/components/settings/business/admin/BusinessInformationHeader.tsx` - 商业信息头部显示
12. `/components/settings/business/admin/BusinessInformationForm.tsx` - 商业信息编辑表单

**🏗️ 系统基础设施组件** (支撑整个配置系统)
13. `/components/settings/business/common/StepContent.tsx` (核心路由)
14. `/components/settings/business/common/LoadingScreen.tsx` (加载状态)
15. `/components/settings/business/common/StepNavigation.tsx` (类型定义)
16. `/components/settings/business/common/RequirementsNotice.tsx` (前置条件)
17. `/components/settings/business/common/hooks/useWorkflowState.ts` (状态管理)

**总计：17个文件 - 现在已重新组织到统一目录结构** 📋

## Admin 目录组件说明

### 🔧 **Admin 目录用途分析**

`/components/settings/business/admin/` 目录下的组件**不属于任何具体的Business Settings步骤**，而是专门为**管理员后台界面**设计的独立组件：

#### 1. **AgentConfigurationDashboard.tsx** 
- **用途**: 管理员用户代理配置控制面板
- **使用场景**: `/app/admin/users/[userId]/agent-config/page.tsx`
- **功能**: 
  - 管理员可以配置其他用户的AI代理
  - 支持`isAdminMode`属性来区分管理员和普通用户模式
  - 集成了Step 6中的代理配置组件（AgentTypeCallScripts, AgentTypeVoiceSettings, AgentTypeCallRouting）

#### 2. **BusinessInformationHeader.tsx**
- **用途**: 商业信息头部展示组件
- **功能**: 显示和编辑商业基本信息的头部区域
- **被引用**: AgentConfigurationDashboard.tsx

#### 3. **BusinessInformationForm.tsx** 
- **用途**: 商业信息编辑表单
- **功能**: 提供商业信息的编辑界面
- **被引用**: BusinessInformationHeader.tsx

#### 4. **AgentTypeSelector.tsx**
- **用途**: 代理类型选择器
- **功能**: 选择和管理不同类型的AI代理
- **被引用**: AgentConfigurationDashboard.tsx

### 🎯 **Admin组件与Business Settings的关系**

- **独立性**: Admin组件完全独立于Business Settings的6个步骤流程
- **复用性**: Admin组件复用了Step 6中的代理配置子组件
- **权限性**: 专门为管理员权限设计，支持跨用户操作
- **用途区别**: 
  - Business Settings Steps：普通用户配置自己的业务
  - Admin组件：管理员配置其他用户的业务和代理

## UI 组件更新策略

1. 使用 sed 命令批量替换所有文件中的引用路径
2. 从 `@/components/ui/` 替换为 `@/components/newui/`
3. 按目录分批次进行更新，确保每个目录的组件都被正确更新
4. 每个目录更新完成后验证文件完整性
5. 运行 yarn lint 和 yarn format 验证更新

## 重要发现

### BusinessSettings 组件树中的日历功能
- **Step 5 (StaffManagement)** 中的 `StaffCalendarConfiguration.tsx` 组件内部实现了完整的日历管理功能
- 该组件有 3137 行代码，包含：办公时间设置、节假日管理、员工个人日历配置、预订设置管理
- **重要**：这个组件没有引用 `calendar` 目录下的独立组件，而是完全自实现

### 扩展页面组件与BusinessSettings的关系
- **appointments 目录组件**：是 Business Settings Step 5 的扩展管理界面
  - `AppointmentSystem` 在 `/app/appointments/page.tsx` 中作为 "Step 5: Configuration" 使用
  - 提供比 BusinessSettings 内嵌组件更丰富的预约管理功能
  
- **calendar 目录组件**：独立的日历管理系统，与 BusinessSettings 并行
  - 提供更细致的办公时间、节假日、预订设置管理
  - 从预约页面中有快速访问链接，形成完整的管理生态
  
- **booking 目录组件**：客户端预订界面
  - 使用 Business Settings 中配置的服务和员工信息
  - 是整个预约系统的前端客户界面

### 系统架构关系
```
Business Settings 系统架构 (/components/settings/business/)
│
├── BusinessSettings.tsx (主入口)
│
├── common/ (基础设施组件)
│   ├── StepContent.tsx (核心路由)
│   ├── LoadingScreen.tsx 
│   ├── StepNavigation.tsx
│   ├── RequirementsNotice.tsx
│   └── hooks/useWorkflowState.ts
│
├── steps/ (6个业务配置步骤)
│   ├── step1-business/ (业务信息)
│   ├── step2-products/ (产品配置)  
│   ├── step3-services/ (服务配置)
│   ├── step4-appointments/ (预约系统 + 扩展页面组件)
│   ├── step5-staff/ (员工管理 + 日历组件)
│   └── step6-agents/ (AI代理配置)
│
├── admin/ (管理员后台专用组件 - 不属于任何步骤)
│   ├── AgentConfigurationDashboard.tsx (管理员代理配置面板)
│   ├── BusinessInformationHeader.tsx 
│   ├── BusinessInformationForm.tsx
│   └── AgentTypeSelector.tsx
│
└── 扩展应用页面使用组件
    ├── /app/appointments/* (使用 step4-appointments 组件)
    ├── /app/calendar/* (使用 step5-staff 组件)
    ├── /app/ai-agents/* (使用 step6-agents 组件)
    └── /app/admin/users/*/agent-config/* (使用 admin 组件)
```

## 注意事项

- BusinessSettings.tsx 本身不直接引用 UI 组件，但通过 StepContent 间接使用
- appointments、calendar、booking 目录下的组件是独立的页面组件，不属于 BusinessSettings 组件树
- Step 5 员工管理中的日历功能是通过 `StaffCalendarConfiguration.tsx` 内部实现，不依赖 calendar 目录
- 所有的图标组件来自 `@/components/icons` 或 `lucide-react`，不需要更新
- 业务逻辑相关的引用（如 hooks、types、lib）不需要更新
- 确保 useConfirmDialog 这种自定义 hook 的路径也被正确更新

## 🎉 组件重组织完成总结

### ✅ **已完成的工作**

1. **目录重组织**: 将32个分散的组件统一整理到 `/components/settings/business/` 目录下
2. **路径标准化**: 所有引用路径统一使用 `@/components/settings/business/...` 绝对路径格式
3. **功能分类**: 
   - `common/`: 5个系统基础设施组件
   - `steps/`: 23个按步骤分类的业务配置组件  
   - `admin/`: 4个管理员专用组件
4. **文档更新**: 更新组件树文档，明确各组件用途和关系

### 📁 **最终目录结构**

```
src/components/settings/business/
├── BusinessSettings.tsx                    # 主入口组件
├── admin/                                  # 管理员后台组件 (4个)
│   ├── AgentConfigurationDashboard.tsx   # 代理配置面板
│   ├── AgentTypeSelector.tsx             # 代理类型选择器
│   ├── BusinessInformationHeader.tsx     # 商业信息头部
│   └── BusinessInformationForm.tsx       # 商业信息表单
├── common/                                # 基础设施组件 (5个)
│   ├── LoadingScreen.tsx                 # 加载状态
│   ├── RequirementsNotice.tsx            # 前置条件提醒
│   ├── StepContent.tsx                   # 核心路由组件
│   ├── StepNavigation.tsx                # 步骤导航类型
│   └── hooks/useWorkflowState.ts         # 工作流状态管理
└── steps/                                # 业务配置步骤 (23个)
    ├── step1-business/                   # 业务信息 (1个)
    ├── step2-products/                   # 产品配置 (1个)  
    ├── step3-services/                   # 服务配置 (1个)
    ├── step4-appointments/               # 预约系统 (6个)
    ├── step5-staff/                      # 员工管理 (8个)
    └── step6-agents/                     # AI代理配置 (6个)
```

### 🔧 **技术改进**

- **模块化**: 每个步骤的组件独立管理，便于维护
- **可重用性**: Admin组件复用Step组件，避免代码重复
- **路径清晰**: 统一的绝对路径引用，避免相对路径混乱
- **功能分离**: Business Settings步骤流程与管理员后台功能清晰分离