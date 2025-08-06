'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  SettingsIcon,
  AlertIcon,
} from '@/components/icons';

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title: string;
}

interface StaffCalendar {
  id: string;
  staff_id: string;
  user_id: string;
  year: number;
  default_generated: boolean;
  created_at: string;
  updated_at: string;
  staff_availability?: StaffAvailability[];
}

interface StaffAvailability {
  id: string;
  calendar_id: string;
  staff_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
  is_override: boolean;
  reason: string | null;
  notes: string | null;
}

interface BusinessHoliday {
  id: string;
  business_id: string;
  user_id: string;
  holiday_date: string;
  holiday_name: string;
  description: string | null;
  is_recurring: boolean;
}

interface StaffCalendarConfig {
  id: string;
  staff_id: string;
  user_id: string;
  default_start_time: string;
  default_end_time: string;
  working_days: number;
  lunch_break_start: string | null;
  lunch_break_end: string | null;
  buffer_minutes: number;
  max_advance_days: number;
  is_configured: boolean;
}

interface StaffCalendarConfigurationProps {
  user: User;
  staffMember: StaffMember;
  onBack: () => void;
  onSaveAndContinue: () => void;
}

export function StaffCalendarConfiguration({
  user,
  staffMember,
  onBack,
  onSaveAndContinue,
}: StaffCalendarConfigurationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<StaffCalendar[]>([]);
  const [holidays, setHolidays] = useState<BusinessHoliday[]>([]);
  const [config, setConfig] = useState<StaffCalendarConfig | null>(null);
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'settings' | 'holidays'
  >('calendar');

  // Configuration form state
  const [configForm, setConfigForm] = useState({
    default_start_time: '09:00',
    default_end_time: '17:00',
    working_days: 31, // Mon-Fri
    lunch_break_start: '',
    lunch_break_end: '',
    buffer_minutes: 15,
    max_advance_days: 90,
  });

  // Holiday form state
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: '',
    holiday_name: '',
    description: '',
    is_recurring: false,
  });

  const [showHolidayForm, setShowHolidayForm] = useState(false);

  useEffect(() => {
    if (staffMember && user) {
      loadCalendarData();
    }
  }, [staffMember, user, currentYear]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStaffCalendars(), loadHolidays(), loadConfig()]);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStaffCalendars = async () => {
    try {
      const response = await fetch(
        `/api/staff-calendars?user_id=${user.id}&staff_id=${staffMember.id}&year=${currentYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
      }
    } catch (error) {
      console.error('Failed to load staff calendars:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const response = await fetch(
        `/api/business-holidays?user_id=${user.id}&year=${currentYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch(
        `/api/staff-calendar-configs?user_id=${user.id}&staff_id=${staffMember.id}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.configs && data.configs.length > 0) {
          const configData = data.configs[0];
          setConfig(configData);
          setConfigForm({
            default_start_time: configData.default_start_time.substring(0, 5), // Remove seconds
            default_end_time: configData.default_end_time.substring(0, 5),
            working_days: configData.working_days,
            lunch_break_start: configData.lunch_break_start
              ? configData.lunch_break_start.substring(0, 5)
              : '',
            lunch_break_end: configData.lunch_break_end
              ? configData.lunch_break_end.substring(0, 5)
              : '',
            buffer_minutes: configData.buffer_minutes,
            max_advance_days: configData.max_advance_days,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const generateDefaultCalendar = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/staff-calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          staff_id: staffMember.id,
          year: currentYear,
          generate_default: true,
        }),
      });

      if (response.ok) {
        await loadStaffCalendars();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate default calendar');
      }
    } catch (error) {
      console.error('Failed to generate default calendar:', error);
      alert('Failed to generate default calendar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const method = config ? 'PUT' : 'POST';
      const body = {
        ...configForm,
        staff_id: staffMember.id,
        user_id: user.id,
        is_configured: true,
      };

      if (config) {
        body.id = config.id;
      }

      const response = await fetch('/api/staff-calendar-configs', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadConfig();
        alert('Configuration saved successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async () => {
    if (!holidayForm.holiday_date || !holidayForm.holiday_name) {
      alert('Holiday date and name are required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business-holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...holidayForm,
          business_id: staffMember.user_id, // Use staff member's user_id as business_id
          user_id: user.id,
        }),
      });

      if (response.ok) {
        await loadHolidays();
        setHolidayForm({
          holiday_date: '',
          holiday_name: '',
          description: '',
          is_recurring: false,
        });
        setShowHolidayForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add holiday');
      }
    } catch (error) {
      console.error('Failed to add holiday:', error);
      alert('Failed to add holiday. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = (month: number) => {
    const daysInMonth = getDaysInMonth(currentYear, month);
    const firstDay = getFirstDayOfMonth(currentYear, month);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isHoliday = holidays.some(h => h.holiday_date === dateStr);
      const availability = calendars[0]?.staff_availability?.find(
        a => a.date === dateStr
      );

      days.push(
        <div
          key={day}
          className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
            selectedDate === dateStr
              ? 'bg-blue-500 text-white'
              : isHoliday
                ? 'bg-red-100 text-red-800'
                : availability?.is_available
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setSelectedDate(dateStr)}
        >
          <div className="font-medium">{day}</div>
          {availability && (
            <div className="text-xs">
              {availability.start_time && availability.end_time
                ? `${availability.start_time.substring(0, 5)}-${availability.end_time.substring(0, 5)}`
                : availability.is_available
                  ? 'Available'
                  : 'Unavailable'}
            </div>
          )}
          {isHoliday && <div className="text-xs text-red-600">Holiday</div>}
        </div>
      );
    }

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          {monthNames[month]} {currentYear}
        </h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="p-2 text-center font-medium text-gray-600 text-sm"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{days}</div>
      </div>
    );
  };

  const getWorkingDayName = (flag: number) => {
    const days = [];
    if (flag & 1) days.push('Mon');
    if (flag & 2) days.push('Tue');
    if (flag & 4) days.push('Wed');
    if (flag & 8) days.push('Thu');
    if (flag & 16) days.push('Fri');
    if (flag & 32) days.push('Sat');
    if (flag & 64) days.push('Sun');
    return days.join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar Configuration: {staffMember.first_name}{' '}
                {staffMember.last_name}
              </CardTitle>
              <CardDescription>
                Configure availability, working hours, and holidays for{' '}
                {staffMember.title}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Staff
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Year Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentYear(currentYear - 1)}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              {currentYear - 1}
            </Button>
            <h2 className="text-xl font-semibold">{currentYear}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentYear(currentYear + 1)}
            >
              {currentYear + 1}
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'calendar'
              ? 'bg-white shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar View
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-white shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'holidays'
              ? 'bg-white shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('holidays')}
        >
          Holidays
        </button>
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Staff Availability Calendar</CardTitle>
              {calendars.length === 0 && (
                <Button onClick={generateDefaultCalendar} disabled={saving}>
                  {saving ? 'Generating...' : 'Generate Default Calendar'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {calendars.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Calendar Generated
                </h3>
                <p className="text-gray-600 mb-4">
                  Generate a default calendar based on business hours and
                  holidays.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 12 }, (_, i) => renderCalendar(i))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-sm">Holiday</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                <span className="text-sm">Selected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Calendar Settings
            </CardTitle>
            <CardDescription>
              Configure default working hours and calendar preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default-start-time">Default Start Time</Label>
                <Input
                  id="default-start-time"
                  type="time"
                  value={configForm.default_start_time}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      default_start_time: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="default-end-time">Default End Time</Label>
                <Input
                  id="default-end-time"
                  type="time"
                  value={configForm.default_end_time}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      default_end_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Working Days</Label>
              <p className="text-sm text-gray-600 mb-2">
                Currently: {getWorkingDayName(configForm.working_days)}
              </p>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                  (day, index) => {
                    const flag = Math.pow(2, index);
                    const isSelected = (configForm.working_days & flag) > 0;
                    return (
                      <Button
                        key={day}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setConfigForm(prev => ({
                            ...prev,
                            working_days: isSelected
                              ? prev.working_days & ~flag
                              : prev.working_days | flag,
                          }));
                        }}
                      >
                        {day}
                      </Button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lunch-start">Lunch Break Start</Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={configForm.lunch_break_start}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      lunch_break_start: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lunch-end">Lunch Break End</Label>
                <Input
                  id="lunch-end"
                  type="time"
                  value={configForm.lunch_break_end}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      lunch_break_end: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buffer-minutes">Buffer Time (minutes)</Label>
                <Input
                  id="buffer-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={configForm.buffer_minutes}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      buffer_minutes: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="max-advance-days">
                  Max Advance Booking (days)
                </Label>
                <Input
                  id="max-advance-days"
                  type="number"
                  min="1"
                  max="365"
                  value={configForm.max_advance_days}
                  onChange={e =>
                    setConfigForm(prev => ({
                      ...prev,
                      max_advance_days: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
            </div>

            <Button onClick={saveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Business Holidays</CardTitle>
                <CardDescription>
                  Manage company holidays and closures
                </CardDescription>
              </div>
              <Button onClick={() => setShowHolidayForm(true)}>
                Add Holiday
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showHolidayForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Add New Holiday</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="holiday-date">Holiday Date</Label>
                      <Input
                        id="holiday-date"
                        type="date"
                        value={holidayForm.holiday_date}
                        onChange={e =>
                          setHolidayForm(prev => ({
                            ...prev,
                            holiday_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="holiday-name">Holiday Name</Label>
                      <Input
                        id="holiday-name"
                        value={holidayForm.holiday_name}
                        onChange={e =>
                          setHolidayForm(prev => ({
                            ...prev,
                            holiday_name: e.target.value,
                          }))
                        }
                        placeholder="e.g., Christmas Day"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="holiday-description">Description</Label>
                    <Textarea
                      id="holiday-description"
                      value={holidayForm.description}
                      onChange={e =>
                        setHolidayForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-recurring"
                      checked={holidayForm.is_recurring}
                      onCheckedChange={checked =>
                        setHolidayForm(prev => ({
                          ...prev,
                          is_recurring: checked,
                        }))
                      }
                    />
                    <Label htmlFor="is-recurring">Recurring annually</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={addHoliday} disabled={saving}>
                      {saving ? 'Adding...' : 'Add Holiday'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowHolidayForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {holidays.map(holiday => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{holiday.holiday_name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(holiday.holiday_date).toLocaleDateString()}
                    </p>
                    {holiday.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {holiday.is_recurring && (
                      <Badge variant="secondary">Recurring</Badge>
                    )}
                  </div>
                </div>
              ))}

              {holidays.length === 0 && (
                <div className="text-center py-8">
                  <AlertIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Holidays Configured
                  </h3>
                  <p className="text-gray-600">
                    Add business holidays to automatically block staff
                    availability.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save & Continue */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Calendar Configuration Status
              </h3>
              <p className="text-sm text-blue-700">
                {config?.is_configured
                  ? 'Calendar is configured and ready for appointments'
                  : 'Complete the configuration to enable appointment scheduling'}
              </p>
            </div>
            <Button
              onClick={onSaveAndContinue}
              disabled={!config?.is_configured}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
