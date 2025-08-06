# Staff Calendar System Implementation

## Overview

A comprehensive staff calendar and appointment scheduling system has been implemented with the following features:

- **Staff Calendar Configuration UI**: Configure calendar for each staff member
- **Calendar Year Range**: Generate and display calendars for current and following years  
- **Default Calendar Logic**: Auto-generate availability based on business hours and holidays
- **Custom Availability Overrides**: Allow per-staff override of default availability
- **Dynamic Database Integration**: All data stored in Supabase tables

## Database Schema

### New Tables Created

1. **staff_calendars**
   - `id` (UUID): Primary key
   - `staff_id` (UUID): FK to staff
   - `user_id` (UUID): FK to auth.users
   - `year` (INT): Calendar year
   - `default_generated` (BOOLEAN): Whether defaults were generated
   - `created_at`, `updated_at` (TIMESTAMP)

2. **staff_availability**
   - `id` (UUID): Primary key
   - `calendar_id` (UUID): FK to staff_calendars
   - `staff_id` (UUID): Staff reference
   - `date` (DATE): Specific date
   - `start_time`, `end_time` (TIME): Available hours
   - `is_available` (BOOLEAN): Availability status
   - `is_override` (BOOLEAN): True if overriding default
   - `reason` (TEXT): Optional reason (vacation, sick, etc.)
   - `notes` (TEXT): Additional notes
   - `created_at`, `updated_at` (TIMESTAMP)

3. **business_holidays**
   - `id` (UUID): Primary key
   - `business_id` (UUID): FK to clients
   - `user_id` (UUID): FK to auth.users
   - `holiday_date` (DATE): Holiday date
   - `holiday_name` (VARCHAR): Holiday name
   - `description` (TEXT): Holiday description
   - `is_recurring` (BOOLEAN): Applies every year
   - `created_at`, `updated_at` (TIMESTAMP)

4. **staff_calendar_configs**
   - `id` (UUID): Primary key
   - `staff_id` (UUID): Staff reference
   - `user_id` (UUID): FK to auth.users
   - `default_start_time`, `default_end_time` (TIME): Default working hours
   - `working_days` (INTEGER): Bit flags for working days
   - `lunch_break_start`, `lunch_break_end` (TIME): Lunch break times
   - `buffer_minutes` (INTEGER): Buffer between appointments
   - `max_advance_days` (INTEGER): Maximum advance booking
   - `is_configured` (BOOLEAN): Configuration complete
   - `created_at`, `updated_at` (TIMESTAMP)

## API Endpoints

### Staff Calendars (`/api/staff-calendars`)
- **GET**: Fetch staff calendars with availability data
- **POST**: Create calendar or generate default availability
- **PUT**: Update calendar information
- **DELETE**: Remove calendar

### Staff Availability (`/api/staff-availability`)
- **GET**: Fetch availability for date range
- **POST**: Create availability record
- **PUT**: Update availability (overrides)
- **DELETE**: Remove availability record

### Business Holidays (`/api/business-holidays`)
- **GET**: Fetch business holidays
- **POST**: Create holiday
- **PUT**: Update holiday
- **DELETE**: Remove holiday

### Staff Calendar Configs (`/api/staff-calendar-configs`)
- **GET**: Fetch calendar configurations
- **POST**: Create configuration
- **PUT**: Update configuration
- **DELETE**: Remove configuration

## User Interface Components

### 1. Enhanced Staff Management
- **Location**: `src/components/configuration/FinalStaffManagement.tsx`
- **New Feature**: "Configure Calendar" button for each staff member
- **Integration**: Opens calendar configuration modal

### 2. Staff Calendar Configuration
- **Location**: `src/components/configuration/StaffCalendarConfiguration.tsx`
- **Features**:
  - **Calendar Tab**: Visual calendar display for current + next year
  - **Settings Tab**: Configure working hours, days, breaks
  - **Holidays Tab**: Manage business holidays
  - **Year Navigation**: Switch between years
  - **Default Generation**: Auto-create availability based on settings

## Key Features Implemented

### 1. Calendar Generation
- Generates availability for entire year based on business hours
- Respects configured working days (Mon-Fri by default)
- Automatically excludes holidays
- Creates override-able default schedule

### 2. Visual Calendar Interface
- 12-month grid view showing availability
- Color-coded availability states:
  - **Green**: Available
  - **Gray**: Unavailable
  - **Red**: Holiday
  - **Blue**: Selected date
- Click dates to view/edit availability

### 3. Flexible Configuration
- Working days selection (Monday-Sunday)
- Custom start/end times
- Lunch break configuration
- Buffer time between appointments
- Maximum advance booking period

### 4. Holiday Management
- Add business holidays
- Recurring annual holidays
- Automatic availability blocking on holidays
- Holiday descriptions and notes

## Database Functions

### Key Stored Procedures

1. **generate_default_staff_availability()**
   - Parameters: `staff_id`, `user_id`, `year`
   - Generates full year availability based on configuration
   - Respects working days and holidays
   - Returns created calendar ID

2. **get_staff_availability_range()**
   - Parameters: `staff_id`, `start_date`, `end_date`
   - Returns availability records for date range
   - Used for calendar display and booking checks

3. **is_staff_available()**
   - Parameters: `staff_id`, `date`, `start_time`, `end_time`
   - Returns boolean availability check
   - Used for appointment booking validation

## Security Implementation

- **Row Level Security (RLS)** enabled on all tables
- **User-based policies**: Users can only access their own data
- **Ownership verification**: All operations verify user ownership
- **Input validation**: API endpoints validate required fields
- **SQL injection protection**: Using parameterized queries

## Usage Workflow

### For Business Owners:

1. **Add Staff Members**: Use existing staff management interface
2. **Configure Calendar**: Click "Configure Calendar" button on staff member
3. **Set Working Hours**: Configure default start/end times and working days
4. **Add Holidays**: Set business holidays that apply to all staff
5. **Generate Calendar**: Click "Generate Default Calendar" to create availability
6. **Customize Availability**: Override specific dates as needed
7. **Save & Continue**: Complete configuration to enable appointment system

### For Developers:

1. **Database Setup**: Run `staff-calendar-schema.sql` to create tables
2. **API Integration**: Use provided endpoints for calendar operations  
3. **Component Usage**: Import `StaffCalendarConfiguration` component
4. **Customization**: Extend availability logic for specific business needs

## Future Enhancements

- **Appointment Booking**: Build booking interface using availability data
- **Staff Dashboard**: Allow staff to manage their own availability
- **Email Notifications**: Send availability updates to staff
- **Recurring Availability Patterns**: Templates for common schedules
- **Integration APIs**: Connect with external calendar systems
- **Mobile Interface**: Responsive design for mobile calendar management
- **Reporting**: Analytics on staff utilization and availability patterns

## Testing Instructions

1. **Database Setup**: Import the schema file
2. **Start Development Server**: `npm run dev`
3. **Navigate to Configuration**: Go to configuration page
4. **Add Staff Member**: Create at least one staff member
5. **Configure Calendar**: Click calendar button and test all tabs
6. **Generate Default**: Test default calendar generation
7. **Customize Availability**: Try overriding specific dates
8. **Add Holidays**: Test holiday management functionality
9. **Year Navigation**: Switch between current and next year
10. **Save Configuration**: Complete the workflow

## File Structure

```
src/
├── app/api/
│   ├── staff-calendars/route.ts
│   ├── staff-availability/route.ts
│   ├── business-holidays/route.ts
│   └── staff-calendar-configs/route.ts
├── components/configuration/
│   ├── FinalStaffManagement.tsx (updated)
│   └── StaffCalendarConfiguration.tsx (new)
└── database/
    └── staff-calendar-schema.sql
```

The implementation provides a robust foundation for staff scheduling and appointment management, with all requested features fully implemented and ready for production use.