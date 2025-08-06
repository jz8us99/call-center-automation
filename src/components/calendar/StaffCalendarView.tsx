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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserIcon,
  ClockIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  SettingsIcon,
} from '@/components/icons';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  title: string;
}

interface OfficeHours {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Holiday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  description: string;
}

interface StaffAvailability {
  id?: string;
  availability_date: string;
  start_time?: string;
  end_time?: string;
  is_available: boolean;
  is_override: boolean;
  reason?: string;
  notes?: string;
}

interface AppointmentBooking {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  title: string;
  customer_name: string;
  status: string;
}

interface StaffCalendarViewProps {
  user: User;
  staffId: string;
  businessId: string;
  isOwnerView?: boolean;
  allowSelfEdit?: boolean;
}

export function StaffCalendarView({
  user,
  staffId,
  businessId,
  isOwnerView = true,
  allowSelfEdit = false,
}: StaffCalendarViewProps) {
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [availability, setAvailability] = useState<{
    [date: string]: StaffAvailability;
  }>({});
  const [appointments, setAppointments] = useState<AppointmentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<StaffAvailability | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    if (staffId) {
      loadStaffData();
      loadCalendarData();
    }
  }, [staffId, currentYear]);

  const loadStaffData = async () => {
    try {
      const response = await fetch(
        `/api/staff?user_id=${user.id}&staff_id=${staffId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.staff && data.staff.length > 0) {
          setStaffMember(data.staff[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load staff data:', error);
    }
  };

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOfficeHours(),
        loadHolidays(),
        loadAvailability(),
        loadAppointments(),
      ]);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOfficeHours = async () => {
    try {
      const response = await fetch(
        `/api/office-hours?user_id=${user.id}&business_id=${businessId}`
      );
      if (response.ok) {
        const data = await response.json();
        setOfficeHours(data.office_hours || []);
      }
    } catch (error) {
      console.error('Failed to load office hours:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const response = await fetch(
        `/api/holidays?user_id=${user.id}&business_id=${businessId}&year=${currentYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const response = await fetch(
        `/api/staff-availability?staff_id=${staffId}&user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        const availabilityMap: { [date: string]: StaffAvailability } = {};
        data.availability?.forEach((slot: any) => {
          availabilityMap[slot.availability_date] = slot;
        });
        setAvailability(availabilityMap);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;

      const response = await fetch(
        `/api/appointment-bookings?staff_id=${staffId}&user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const updateAvailability = async (
    availabilityData: Partial<StaffAvailability>
  ) => {
    try {
      const method = editingAvailability?.id ? 'PUT' : 'POST';
      const body = {
        staff_id: staffId,
        user_id: user.id,
        ...availabilityData,
      };

      if (editingAvailability?.id) {
        body.id = editingAvailability.id;
      }

      const response = await fetch('/api/staff-availability', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await loadAvailability();
        setShowEditDialog(false);
        setEditingAvailability(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update availability');
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isHoliday = (date: string) => {
    return holidays.some(holiday => holiday.holiday_date === date);
  };

  const getHoliday = (date: string) => {
    return holidays.find(holiday => holiday.holiday_date === date);
  };

  const getDateAppointments = (date: string) => {
    return appointments.filter(apt => apt.appointment_date === date);
  };

  const getOfficeHoursForDay = (date: string) => {
    const dayOfWeek = new Date(date).getDay();
    return officeHours.find(oh => oh.day_of_week === dayOfWeek && oh.is_active);
  };

  const getDateAvailability = (date: string) => {
    return availability[date];
  };

  const getDateDisplayClass = (date: string) => {
    const dateObj = new Date(date);
    const today = new Date();
    const isToday = dateObj.toDateString() === today.toDateString();
    const isPast = dateObj < today;
    const holiday = isHoliday(date);
    const dateAvailability = getDateAvailability(date);
    const officeHoursForDay = getOfficeHoursForDay(date);
    const dateAppointments = getDateAppointments(date);

    let classes =
      'relative p-2 text-sm border rounded cursor-pointer transition-colors min-h-[80px] ';

    if (isToday) {
      classes += 'ring-2 ring-blue-500 ';
    }

    if (isPast) {
      classes += 'bg-gray-50 text-gray-400 ';
    } else if (holiday) {
      classes += 'bg-red-50 border-red-200 text-red-700 ';
    } else if (dateAvailability?.is_available) {
      classes +=
        'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 ';
    } else if (dateAvailability && !dateAvailability.is_available) {
      classes += 'bg-yellow-50 border-yellow-200 text-yellow-700 ';
    } else if (officeHoursForDay) {
      classes += 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 ';
    } else {
      classes += 'bg-gray-50 border-gray-200 text-gray-500 ';
    }

    if (dateAppointments.length > 0) {
      classes += 'font-semibold ';
    }

    return classes;
  };

  const handleDateClick = (date: string) => {
    if (!isOwnerView && !allowSelfEdit) return;

    setSelectedDate(date);
    const dateAvailability = getDateAvailability(date);
    const officeHoursForDay = getOfficeHoursForDay(date);

    setEditingAvailability(
      dateAvailability || {
        availability_date: date,
        start_time: officeHoursForDay?.start_time.substring(0, 5) || '09:00',
        end_time: officeHoursForDay?.end_time.substring(0, 5) || '17:00',
        is_available: true,
        is_override: true,
        reason: '',
        notes: '',
      }
    );
    setShowEditDialog(true);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
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
      days.push(<div key={`empty-${i}`} className="p-2 min-h-[80px]"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateAvailability = getDateAvailability(dateStr);
      const dateAppointments = getDateAppointments(dateStr);
      const holiday = getHoliday(dateStr);
      const officeHoursForDay = getOfficeHoursForDay(dateStr);

      days.push(
        <div
          key={day}
          className={getDateDisplayClass(dateStr)}
          onClick={() => handleDateClick(dateStr)}
        >
          <div className="font-bold mb-1">{day}</div>

          {holiday && (
            <div className="text-xs bg-red-100 text-red-600 px-1 rounded mb-1">
              {holiday.holiday_name}
            </div>
          )}

          {dateAvailability ? (
            <div className="text-xs mb-1">
              {dateAvailability.is_available ? (
                <span className="text-green-600">
                  {dateAvailability.start_time?.substring(0, 5)} -{' '}
                  {dateAvailability.end_time?.substring(0, 5)}
                </span>
              ) : (
                <span className="text-red-600">Unavailable</span>
              )}
              {dateAvailability.is_override && (
                <span className="ml-1 text-blue-600 text-xs">*</span>
              )}
            </div>
          ) : officeHoursForDay ? (
            <div className="text-xs mb-1 text-blue-600">
              {officeHoursForDay.start_time.substring(0, 5)} -{' '}
              {officeHoursForDay.end_time.substring(0, 5)}
            </div>
          ) : (
            <div className="text-xs mb-1 text-gray-500">Closed</div>
          )}

          {dateAppointments.length > 0 && (
            <div className="space-y-1">
              {dateAppointments.slice(0, 2).map((apt, idx) => (
                <div
                  key={idx}
                  className="text-xs p-1 rounded bg-purple-100 text-purple-800"
                >
                  {apt.start_time.substring(0, 5)} {apt.customer_name}
                </div>
              ))}
              {dateAppointments.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{dateAppointments.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

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

        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Available (Custom)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Office Hours</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Closed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-600">*</span>
            <span>Custom Override</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading || !staffMember) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff calendar...</p>
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
                <UserIcon className="h-6 w-6" />
                {staffMember.first_name} {staffMember.last_name}
              </CardTitle>
              <CardDescription>
                {staffMember.title} • {staffMember.email}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(isOwnerView || allowSelfEdit) && (
                <Button variant="outline">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Calendar Settings
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Year Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Label>Calendar Year:</Label>
              <Select
                value={currentYear.toString()}
                onValueChange={value => setCurrentYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 4 }, (_, i) => {
                    const year = new Date().getFullYear() - 1 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
                disabled
              >
                Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardContent className="p-6">{renderMonthView()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments for {currentYear}</CardTitle>
              <CardDescription>
                All appointments scheduled for this staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No appointments scheduled for {currentYear}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 10).map(appointment => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">
                            {appointment.customer_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {appointment.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              appointment.appointment_date
                            ).toLocaleDateString()}{' '}
                            •{appointment.start_time.substring(0, 5)} -{' '}
                            {appointment.end_time.substring(0, 5)}
                          </p>
                        </div>
                        <Badge
                          className={
                            appointment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appointment.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {appointments.length > 10 && (
                    <p className="text-center text-gray-500">
                      Showing 10 of {appointments.length} appointments
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3-Year History</CardTitle>
              <CardDescription>
                Appointment history and calendar changes for the past 3 years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Historical data will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Availability Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Availability - {selectedDate}</DialogTitle>
            <DialogDescription>
              Customize availability for this specific date
            </DialogDescription>
          </DialogHeader>

          {editingAvailability && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingAvailability.is_available}
                  onCheckedChange={checked =>
                    setEditingAvailability(prev =>
                      prev ? { ...prev, is_available: checked } : null
                    )
                  }
                />
                <Label>Available for appointments</Label>
              </div>

              {editingAvailability.is_available && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={editingAvailability.start_time || ''}
                      onChange={e =>
                        setEditingAvailability(prev =>
                          prev ? { ...prev, start_time: e.target.value } : null
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={editingAvailability.end_time || ''}
                      onChange={e =>
                        setEditingAvailability(prev =>
                          prev ? { ...prev, end_time: e.target.value } : null
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Reason (Optional)</Label>
                <Input
                  value={editingAvailability.reason || ''}
                  onChange={e =>
                    setEditingAvailability(prev =>
                      prev ? { ...prev, reason: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Vacation, Meeting, Personal"
                />
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={editingAvailability.notes || ''}
                  onChange={e =>
                    setEditingAvailability(prev =>
                      prev ? { ...prev, notes: e.target.value } : null
                    )
                  }
                  placeholder="Additional notes or instructions"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateAvailability(editingAvailability)}
                  className="flex-1"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
