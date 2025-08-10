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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface JobType {
  id: string;
  service_type_code: string;
  category_id?: string;
  job_name: string;
  job_description?: string;
  default_duration_minutes: number;
  default_price?: number;
  is_active: boolean;
  is_system_default: boolean;
  // Legacy field names for backward compatibility
  job_type?: string;
  duration?: number;
  price?: number;
  description?: string;
}

interface Appointment {
  id: string;
  staff_id: string;
  job_type_id: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  // Legacy support
  service_id?: string;
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
  isStaffView?: boolean;
}

export function StaffCalendarConfiguration({
  user,
  staffMember,
  onBack,
  onSaveAndContinue,
  isStaffView = false,
}: StaffCalendarConfigurationProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<
    'yearly' | 'monthly' | 'daily'
  >('monthly');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalType, setBookingModalType] = useState<
    'availability' | 'appointment'
  >('availability');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{
    hour: number;
    dateString: string;
  } | null>(null);
  const [dayAvailability, setDayAvailability] = useState<any>(null);
  const [calendars, setCalendars] = useState<StaffCalendar[]>([]);
  const [holidays, setHolidays] = useState<BusinessHoliday[]>([]);
  const [config, setConfig] = useState<StaffCalendarConfig | null>(null);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [serviceTypeCode, setServiceTypeCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'calendar' | 'settings' | 'holidays'
  >('calendar');
  const [officeHours, setOfficeHours] = useState<any[]>([]);

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

  // Appointment booking form state
  const [appointmentForm, setAppointmentForm] = useState({
    job_type_id: '',
    customer_first_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  // Initialize calendar view date to today
  useEffect(() => {
    if (!calendarViewDate) {
      setCalendarViewDate(new Date());
    }
  }, []);

  useEffect(() => {
    if (staffMember && user) {
      loadCalendarData();
    }
  }, [staffMember, user, currentYear]);

  // Load day availability when switching to daily view
  useEffect(() => {
    if (calendarViewMode === 'daily' && calendarViewDate) {
      const dateString = calendarViewDate.toISOString().split('T')[0];
      setSelectedDate(dateString);
      loadDayAvailability(dateString);
    }
  }, [calendarViewMode, calendarViewDate]);

  // Load job types when appointment booking modal opens
  useEffect(() => {
    if (bookingModalType === 'appointment' && user) {
      console.log('Appointment modal opened, reloading job types...');
      if (!serviceTypeCode) {
        // If service type code isn't loaded yet, load business profile first
        loadBusinessProfile().then(() => {
          loadJobTypes();
        });
      } else {
        loadJobTypes();
      }
    }
  }, [bookingModalType, user, serviceTypeCode]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // First load business profile to get service_type_code
      await loadBusinessProfile();

      // Then load other data (job types depends on service_type_code being set)
      await Promise.all([
        loadStaffCalendars(),
        loadHolidays(),
        loadConfig(),
        loadAppointments(),
        loadOfficeHours(),
      ]);

      // Load job types after service type code is available
      await loadJobTypes();
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      console.log('Loading business profile for user:', user.id);
      const response = await fetch(`/api/business-profile?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Business profile data:', data);
        if (data.profile?.business_type) {
          console.log(
            'Setting service type code to:',
            data.profile.business_type
          );
          setServiceTypeCode(data.profile.business_type);
        } else {
          console.log('No business type found in profile data');
        }
      } else {
        console.log(
          'Business profile request failed with status:',
          response.status
        );
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    }
  };

  const loadOfficeHours = async () => {
    try {
      const response = await fetch(`/api/office-hours?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setOfficeHours(data.office_hours || []);
      }
    } catch (error) {
      console.error('Failed to load office hours:', error);
    }
  };

  const loadJobTypes = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading job types');
      return;
    }

    if (!serviceTypeCode) {
      console.log(
        'No service type code available, current value:',
        serviceTypeCode,
        'skipping job types loading'
      );
      return;
    }

    console.log(
      'Loading job types with service_type_code:',
      serviceTypeCode,
      'and user_id:',
      user.id
    );
    try {
      const url = `/api/job-types?service_type_code=${serviceTypeCode}&user_id=${user.id}`;
      console.log('Making request to:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded job types raw data:', data); // Debug log
        console.log('Job types array:', data.job_types); // Debug log
        console.log('Job types array length:', (data.job_types || []).length);
        setJobTypes(data.job_types || []);
      } else {
        console.error('Failed to load job types, status:', response.status);
        const errorData = await response.text();
        console.error('Error response body:', errorData);
        // If 404, job types might not be configured yet
        if (response.status === 404) {
          console.log('No job types configured yet');
          setJobTypes([]);
        }
      }
    } catch (error) {
      console.error('Failed to load job types:', error);
      setJobTypes([]);
    }
  };

  // Helper function to calculate end time based on start time and job type duration
  const calculateEndTime = (startTime: string, jobTypeId: string): string => {
    if (!startTime) return '10:00'; // Default fallback
    if (!jobTypeId) return startTime; // If no job type selected, return start time

    const jobType = jobTypes.find(j => j.id === jobTypeId);
    const durationMinutes = jobType
      ? jobType.default_duration_minutes || jobType.duration || 60
      : 60;

    try {
      // Parse start time
      const [startHour, startMinute] = startTime.split(':').map(Number);

      // Validate parsed values
      if (isNaN(startHour) || isNaN(startMinute)) {
        console.warn('Invalid start time format:', startTime);
        return '10:00';
      }

      // Calculate end time in minutes
      const totalMinutes = startHour * 60 + startMinute + durationMinutes;
      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;

      // Ensure we don't go past 23:59
      if (endHour >= 24) {
        console.warn(
          'Calculated end time extends past midnight, capping at 23:59'
        );
        return '23:59';
      }

      return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating end time:', error);
      return '10:00';
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await fetch(
        `/api/appointments?user_id=${user.id}&staff_id=${staffMember.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
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

  const handleDayClick = async (dateString: string) => {
    setSelectedDate(dateString);
    setCalendarViewDate(new Date(dateString + 'T00:00:00'));
    setCalendarViewMode('daily');

    // Load availability for this specific day
    await loadDayAvailability(dateString);
  };

  const handleTimeSlotClick = (
    hour: number,
    dateString: string,
    isAvailable: boolean,
    hasAppointment: boolean
  ) => {
    setSelectedTimeSlot({ hour, dateString });

    if (hasAppointment) {
      // If there's already an appointment, open edit modal
      const currentSlotTime = `${hour.toString().padStart(2, '0')}:00`;
      const nextSlotTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const appointment = appointments.find(
        apt =>
          apt.appointment_date === dateString &&
          !['cancelled', 'no_show'].includes(apt.status) &&
          apt.start_time < nextSlotTime &&
          apt.end_time > currentSlotTime
      );
      if (appointment) {
        // Populate the form with existing appointment data for editing
        const [firstName, lastName] = (appointment.customer_name || '').split(
          ' ',
          2
        );
        setAppointmentForm({
          job_type_id: appointment.service_id || appointment.job_type_id || '',
          customer_first_name: firstName || '',
          customer_last_name: lastName || '',
          customer_phone: appointment.customer_phone || '',
          customer_email: (appointment as any).customer_email || '',
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          notes: appointment.notes || '',
        });
        setSelectedAppointment(appointment);
        setBookingModalType('appointment');
        setShowBookingModal(true);
        return;
      }
    }

    // Show booking options modal
    setShowBookingModal(true);
  };

  const loadDayAvailability = async (dateString: string) => {
    try {
      const response = await fetch(
        `/api/staff-availability?staff_id=${staffMember.id}&user_id=${user.id}&start_date=${dateString}&end_date=${dateString}`
      );

      if (response.ok) {
        const data = await response.json();
        setDayAvailability(
          data.availability?.[0] || {
            availability_date: dateString,
            staff_id: staffMember.id,
            user_id: user.id,
            is_available: true,
            start_time: config?.default_start_time || '09:00',
            end_time: config?.default_end_time || '17:00',
            is_override: false,
            reason: '',
            notes: '',
          }
        );
      }
    } catch (error) {
      console.error('Failed to load day availability:', error);
    }
  };

  const saveDayAvailability = async (availability: any) => {
    try {
      setSaving(true);
      const method = availability.id ? 'PUT' : 'POST';
      const response = await fetch('/api/staff-availability', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...availability,
          availability_date: availability.availability_date || selectedDate,
          staff_id: staffMember.id,
          user_id: user.id,
        }),
      });

      if (response.ok) {
        setShowDayDetail(false);
        // Refresh calendar data if needed
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save availability');
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
      alert('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const isWithinBusinessHours = (
    date: string,
    startTime: string,
    endTime: string
  ) => {
    const dayOfWeek = new Date(date).getDay();
    const businessHours = officeHours.find(
      oh => oh.day_of_week === dayOfWeek && oh.is_active
    );

    if (!businessHours) {
      return false; // Office is closed on this day
    }

    const appointmentStart = startTime.substring(0, 5);
    const appointmentEnd = endTime.substring(0, 5);
    const businessStart = businessHours.start_time.substring(0, 5);
    const businessEnd = businessHours.end_time.substring(0, 5);

    return appointmentStart >= businessStart && appointmentEnd <= businessEnd;
  };

  const saveAppointment = async () => {
    console.log('saveAppointment called with:', {
      selectedTimeSlot,
      appointmentForm,
      staffMember: staffMember.id,
      user: user.id,
    });

    if (
      !selectedTimeSlot ||
      !appointmentForm.job_type_id ||
      !appointmentForm.customer_first_name ||
      !appointmentForm.customer_last_name ||
      !appointmentForm.customer_phone
    ) {
      alert(
        'Please fill in all required fields (first name, last name, phone number)'
      );
      return;
    }

    if (!appointmentForm.start_time || !appointmentForm.end_time) {
      alert('Start time and end time must be set');
      return;
    }

    // Check if appointment is within business hours
    const isWithinHours = isWithinBusinessHours(
      selectedTimeSlot.dateString,
      appointmentForm.start_time,
      appointmentForm.end_time
    );

    if (!isWithinHours && isStaffView) {
      const confirmed = confirm(
        'This appointment is outside of business hours. Are you sure you want to book this appointment?'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setSaving(true);

      // Create appointment directly with customer info (simplified approach)
      const selectedJobType = jobTypes.find(
        jt => jt.id === appointmentForm.job_type_id
      );
      const appointmentData = {
        user_id: user.id,
        staff_id: staffMember.id,
        appointment_type_id: appointmentForm.job_type_id,
        appointment_date: selectedTimeSlot.dateString,
        start_time: appointmentForm.start_time,
        end_time: appointmentForm.end_time,
        duration_minutes:
          selectedJobType?.default_duration_minutes ||
          selectedJobType?.duration ||
          60,
        title: `${selectedJobType?.job_name || (selectedJobType as any)?.name || 'Appointment'} - ${appointmentForm.customer_first_name} ${appointmentForm.customer_last_name}`,
        notes: appointmentForm.notes || '',
        booking_source: 'manual',
        // Customer info
        customer_first_name: appointmentForm.customer_first_name,
        customer_last_name: appointmentForm.customer_last_name,
        customer_phone: appointmentForm.customer_phone,
        customer_email: appointmentForm.customer_email || null,
      };

      console.log('Sending appointment data:', appointmentData);
      console.log('selectedTimeSlot:', selectedTimeSlot);
      console.log('appointmentForm:', appointmentForm);
      console.log('Staff ID:', staffMember.id);
      console.log('Appointment Date:', selectedTimeSlot.dateString);
      console.log('Start Time:', appointmentForm.start_time);
      console.log('End Time:', appointmentForm.end_time);

      const isEditing = selectedAppointment !== null;
      const method = isEditing ? 'PUT' : 'POST';
      const url = '/api/appointments';

      if (isEditing) {
        (appointmentData as any).id = selectedAppointment.id;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        await loadAppointments();
        setBookingModalType('availability');
        setSelectedAppointment(null);
        setAppointmentForm({
          job_type_id: '',
          customer_first_name: '',
          customer_last_name: '',
          customer_phone: '',
          customer_email: '',
          start_time: '',
          end_time: '',
          notes: '',
        });
        alert(
          isEditing
            ? 'Appointment updated successfully!'
            : 'Appointment booked successfully!'
        );
      } else {
        const errorData = await response.json();
        console.error('Appointment creation failed:', errorData);
        console.error('Response status:', response.status);
        console.error(
          'Response headers:',
          Object.fromEntries(response.headers.entries())
        );
        throw new Error(errorData.error || 'Failed to save appointment');
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
      alert(
        'Failed to save appointment: ' +
          (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setSaving(false);
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
        const result = await response.json();
        console.log('Calendar generated successfully:', result);

        // Load the fresh calendar data
        await loadStaffCalendars();

        // Show the monthly calendar view immediately
        setShowCalendarView(true);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);

        // Show more helpful error message
        if (errorData.error.includes('calendar_id')) {
          alert(
            'Database schema issue detected. Please run the database migration scripts first.'
          );
        } else {
          alert(errorData.error || 'Failed to generate default calendar');
        }
      }
    } catch (error) {
      console.error('Failed to generate default calendar:', error);
      alert(
        'Failed to generate default calendar. Please check the console for details.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const method = config ? 'PUT' : 'POST';
      const body: any = {
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

  // Inline calendar view renderers for the Calendar tab
  const renderInlineYearlyView = () => {
    const year = calendarViewDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthName = monthDate.toLocaleDateString('en-US', {
        month: 'long',
      });
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = monthDate.getDay();

      const monthDays = [];
      const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

      for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - firstDayOfWeek + 1;
        const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
        const date = new Date(year, month, Math.max(1, dayNumber));
        const dateString = date.toISOString().split('T')[0];
        const isToday = new Date().toDateString() === date.toDateString();

        monthDays.push(
          <div
            key={i}
            onClick={() => isCurrentMonth && handleDayClick(dateString)}
            className={`
              w-6 h-6 text-xs flex items-center justify-center cursor-pointer rounded
              ${isCurrentMonth ? 'hover:bg-blue-100' : 'text-gray-300'}
              ${isToday ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {isCurrentMonth ? dayNumber : ''}
          </div>
        );
      }

      months.push(
        <div key={month} className="p-4 border rounded-lg bg-white">
          <div className="text-center font-medium mb-2 text-sm">
            {monthName}
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{monthDays}</div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">{months}</div>
    );
  };

  const renderInlineMonthlyView = () => {
    const currentMonth = calendarViewDate.getMonth();
    const currentYear = calendarViewDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const calendarDays = [];
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstDayOfWeek + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentYear, currentMonth, Math.max(1, dayNumber));
      const dateString = date.toISOString().split('T')[0];
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      const isHoliday = holidays.some(
        holiday =>
          new Date(holiday.holiday_date).toDateString() === date.toDateString()
      );

      const dayOfWeek = date.getDay();
      const officeHoursForDay =
        config &&
        config.working_days & Math.pow(2, dayOfWeek === 0 ? 6 : dayOfWeek - 1);

      calendarDays.push(
        <div
          key={i}
          onClick={() => isCurrentMonth && handleDayClick(dateString)}
          className={`
            min-h-20 p-2 border border-gray-200 text-sm transition-all
            ${isCurrentMonth ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300' : 'text-gray-300 bg-gray-50'}
            ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''}
            ${isWeekend && !isHoliday && isCurrentMonth ? 'bg-gray-100' : ''}
            ${isHoliday && isCurrentMonth ? 'bg-red-50 border-red-200' : ''}
            ${officeHoursForDay && !isWeekend && !isHoliday && isCurrentMonth ? 'bg-green-50' : ''}
            ${selectedDate === dateString ? 'ring-2 ring-purple-300 bg-purple-50' : ''}
          `}
        >
          {isCurrentMonth && (
            <>
              <div className="font-medium mb-1">{dayNumber}</div>
              {isHoliday && (
                <div className="text-xs text-red-600 font-medium">Holiday</div>
              )}
              {!isHoliday && officeHoursForDay && (
                <div className="text-xs text-green-600">
                  {config?.default_start_time?.substring(0, 5)} -{' '}
                  {config?.default_end_time?.substring(0, 5)}
                </div>
              )}
              {!isHoliday && !officeHoursForDay && (
                <div className="text-xs text-gray-500">Closed</div>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="p-3 text-center font-medium text-gray-600 border-b"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
          {calendarDays}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>Office Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
            <span>Today</span>
          </div>
        </div>
      </div>
    );
  };

  const renderInlineDailyView = () => {
    const selectedDateObj = new Date(calendarViewDate);
    const dateString = selectedDateObj.toISOString().split('T')[0];

    // Generate hourly time slots
    const timeSlots = [];
    for (let hour = 0; hour <= 23; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const isBusinessHour = hour >= 9 && hour <= 17;

      // Check for appointments at this time (improved to handle custom durations)
      const currentSlotTime = `${hour.toString().padStart(2, '0')}:00`;
      const nextSlotTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

      const appointment = appointments.find(
        apt =>
          apt.appointment_date === dateString &&
          !['cancelled', 'no_show'].includes(apt.status) &&
          // Check if appointment overlaps with this hour slot
          apt.start_time < nextSlotTime &&
          apt.end_time > currentSlotTime
      );

      const hasAppointment = !!appointment;

      // Check for custom availability override
      const hasAvailability =
        dayAvailability &&
        dayAvailability.is_available &&
        dayAvailability.start_time &&
        dayAvailability.end_time;

      let isAvailable = false;
      if (hasAppointment) {
        isAvailable = false; // Appointments make slots unavailable
      } else if (hasAvailability) {
        const startTime = parseInt(dayAvailability.start_time.split(':')[0]);
        const endTime = parseInt(dayAvailability.end_time.split(':')[0]);
        isAvailable = hour >= startTime && hour < endTime;
      } else {
        // Business hours are available by default
        isAvailable = isBusinessHour;
      }

      timeSlots.push(
        <div
          key={hour}
          className={`
            flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors hover:ring-2 hover:ring-blue-200
            ${
              hasAppointment
                ? 'bg-gray-200 border-gray-400 opacity-75'
                : isAvailable
                  ? 'bg-green-50 border-green-200 hover:bg-green-100'
                  : isBusinessHour
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }
          `}
          onClick={() =>
            handleTimeSlotClick(hour, dateString, isAvailable, hasAppointment)
          }
        >
          <div className="w-16 text-sm font-mono text-gray-600">
            {timeString}
          </div>
          <div className="flex-1">
            {hasAppointment ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-700 text-sm font-medium">
                  {appointment?.customer_name} -{' '}
                  {(() => {
                    const jobType = jobTypes.find(
                      j =>
                        j.id ===
                        (appointment?.job_type_id || appointment?.service_id)
                    );
                    return (
                      jobType?.job_name ||
                      (jobType as any)?.job_type ||
                      (jobType as any)?.service_name ||
                      (jobType as any)?.name ||
                      (jobType as any)?.title ||
                      'Unknown Job'
                    );
                  })()}
                </span>
              </div>
            ) : isAvailable ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 text-sm">Available</span>
              </div>
            ) : isBusinessHour ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600 text-sm">Business Hours</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-gray-500 text-sm">After Hours</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto">{timeSlots}</div>
    );
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

  // Calendar Yearly View Component
  const renderYearlyCalendar = () => {
    const year = calendarViewDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthName = monthDate.toLocaleDateString('en-US', {
        month: 'long',
      });
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = monthDate.getDay();

      // Simple mini calendar for each month
      const monthDays = [];
      const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

      for (let i = 0; i < totalCells; i++) {
        const dayNumber = i - firstDayOfWeek + 1;
        const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
        const date = new Date(year, month, Math.max(1, dayNumber));
        const dateString = date.toISOString().split('T')[0];
        const isToday = new Date().toDateString() === date.toDateString();

        monthDays.push(
          <div
            key={i}
            onClick={() => isCurrentMonth && handleDayClick(dateString)}
            className={`
              w-6 h-6 text-xs flex items-center justify-center cursor-pointer rounded
              ${isCurrentMonth ? 'hover:bg-blue-100' : 'text-gray-300'}
              ${isToday ? 'bg-blue-500 text-white' : ''}
            `}
          >
            {isCurrentMonth ? dayNumber : ''}
          </div>
        );
      }

      months.push(
        <div key={month} className="p-4 border rounded-lg bg-white">
          <div className="text-center font-medium mb-2 text-sm">
            {monthName}
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{monthDays}</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Yearly View: {staffMember.first_name} {staffMember.last_name}
                </CardTitle>
                <CardDescription>
                  Year {year} overview for {staffMember.title}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1 mr-4">
                  <button
                    onClick={() => setCalendarViewMode('yearly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'yearly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('monthly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'monthly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('daily')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'daily'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Day
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarViewDate(new Date(year - 1, 0, 1))}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
                  {year}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarViewDate(new Date(year + 1, 0, 1))}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendarView(false)}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Config
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {months}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Calendar Daily View Component
  const renderDailyCalendar = () => {
    const selectedDateObj = new Date(calendarViewDate);
    const dateString = selectedDateObj.toISOString().split('T')[0];
    const dayName = selectedDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Outlook-style day calendar
    const renderOutlookDayCalendar = () => {
      const hours = [];

      // Helper function to convert time string to minutes from midnight
      const timeToMinutes = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Helper function to convert minutes to pixels (1 hour = 60px)
      const minutesToPixels = (minutes: number): number => {
        return (minutes / 60) * 60;
      };

      // Get appointments for this day
      const dayAppointments = appointments.filter(
        apt =>
          apt.appointment_date === dateString &&
          !['cancelled', 'no_show'].includes(apt.status)
      );

      // Generate hour rows
      for (let hour = 6; hour <= 22; hour++) {
        // Show 6 AM to 10 PM like Outlook
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const isBusinessHour = hour >= 9 && hour <= 17;

        hours.push(
          <div key={hour} className="relative">
            {/* Hour row */}
            <div className="flex border-b border-gray-200">
              {/* Time column */}
              <div className="w-20 pr-3 text-right text-sm text-gray-600 font-mono py-2">
                {hour === 0
                  ? '12:00 AM'
                  : hour === 12
                    ? '12:00 PM'
                    : hour > 12
                      ? `${hour - 12}:00 PM`
                      : `${hour}:00 AM`}
              </div>

              {/* Calendar column */}
              <div
                className={`flex-1 relative min-h-[60px] ${isBusinessHour ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer border-r border-gray-200`}
                onClick={() =>
                  handleTimeSlotClick(hour, dateString, isBusinessHour, false)
                }
              >
                {/* Half-hour line */}
                <div className="absolute top-[30px] left-0 right-0 h-px bg-gray-100"></div>

                {/* Appointment blocks positioned absolutely */}
                {dayAppointments.map((appointment, idx) => {
                  const startMinutes = timeToMinutes(appointment.start_time);
                  const endMinutes = timeToMinutes(appointment.end_time);
                  const hourStartMinutes = hour * 60;
                  const hourEndMinutes = (hour + 1) * 60;

                  // Check if appointment overlaps with this hour
                  if (
                    startMinutes < hourEndMinutes &&
                    endMinutes > hourStartMinutes
                  ) {
                    const blockStart = Math.max(startMinutes, hourStartMinutes);
                    const blockEnd = Math.min(endMinutes, hourEndMinutes);
                    const topOffset =
                      ((blockStart - hourStartMinutes) / 60) * 60;
                    const height = ((blockEnd - blockStart) / 60) * 60;

                    const jobType = jobTypes.find(
                      j =>
                        j.id ===
                        (appointment?.job_type_id || appointment?.service_id)
                    );
                    const jobName =
                      jobType?.job_name ||
                      (jobType as any)?.job_type ||
                      (jobType as any)?.service_name ||
                      (jobType as any)?.name ||
                      (jobType as any)?.title ||
                      'Appointment';

                    return (
                      <div
                        key={`${appointment.id}-${hour}`}
                        className="absolute left-1 right-1 bg-blue-600 text-white rounded px-2 py-1 text-sm shadow-sm hover:bg-blue-700 cursor-pointer z-10 border border-blue-700"
                        style={{
                          top: `${topOffset}px`,
                          height: `${Math.max(height, 20)}px`, // Minimum height for visibility
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          handleTimeSlotClick(hour, dateString, false, true);
                        }}
                      >
                        <div className="text-xs font-semibold truncate">
                          {appointment.customer_name}
                        </div>
                        <div className="text-xs opacity-90 truncate">
                          {jobName}
                        </div>
                        <div className="text-xs opacity-75">
                          {appointment.start_time} - {appointment.end_time}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        );
      }

      return hours;
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Daily Calendar: {staffMember.first_name}{' '}
                  {staffMember.last_name}
                </CardTitle>
                <CardDescription>
                  {dayName} - {staffMember.title}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1 mr-4">
                  <button
                    onClick={() => setCalendarViewMode('yearly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'yearly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('monthly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'monthly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('daily')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'daily'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Day
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const prevDay = new Date(selectedDateObj);
                    prevDay.setDate(prevDay.getDate() - 1);
                    setCalendarViewDate(prevDay);
                    setSelectedDate(prevDay.toISOString().split('T')[0]);
                    loadDayAvailability(prevDay.toISOString().split('T')[0]);
                  }}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextDay = new Date(selectedDateObj);
                    nextDay.setDate(nextDay.getDate() + 1);
                    setCalendarViewDate(nextDay);
                    setSelectedDate(nextDay.toISOString().split('T')[0]);
                    loadDayAvailability(nextDay.toISOString().split('T')[0]);
                  }}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendarView(false)}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Config
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-0">
            {/* Outlook-style day calendar */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* All-day header */}
              <div className="flex border-b border-gray-300 bg-gray-50">
                <div className="w-20 text-right text-sm font-medium text-gray-700 py-2 pr-3">
                  All day
                </div>
                <div className="flex-1 min-h-[40px] bg-gray-100 border-r border-gray-200"></div>
              </div>

              {/* Hour slots */}
              <div className="max-h-[600px] overflow-y-auto">
                {renderOutlookDayCalendar()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Calendar Monthly View Component
  const renderMonthlyCalendar = () => {
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

    const currentMonth = calendarViewDate.getMonth();
    const currentYear = calendarViewDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Create calendar grid
    const calendarDays = [];
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - firstDayOfWeek + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const date = new Date(currentYear, currentMonth, Math.max(1, dayNumber));
      const dateString = date.toISOString().split('T')[0];
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

      // Check if it's a holiday
      const isHoliday = holidays.some(
        holiday =>
          new Date(holiday.holiday_date).toDateString() === date.toDateString()
      );

      // Get office hours for this day
      const dayOfWeek = date.getDay();
      const officeHoursForDay =
        config &&
        config.working_days & Math.pow(2, dayOfWeek === 0 ? 6 : dayOfWeek - 1);

      calendarDays.push(
        <div
          key={i}
          onClick={() => isCurrentMonth && handleDayClick(dateString)}
          className={`
            min-h-20 p-2 border border-gray-200 text-sm transition-all
            ${isCurrentMonth ? 'cursor-pointer hover:bg-blue-100 hover:border-blue-300' : 'text-gray-300 bg-gray-50'}
            ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''}
            ${isWeekend && !isHoliday && isCurrentMonth ? 'bg-gray-100' : ''}
            ${isHoliday && isCurrentMonth ? 'bg-red-50 border-red-200' : ''}
            ${officeHoursForDay && !isWeekend && !isHoliday && isCurrentMonth ? 'bg-green-50' : ''}
            ${selectedDate === dateString ? 'ring-2 ring-purple-300 bg-purple-50' : ''}
          `}
        >
          {isCurrentMonth && (
            <>
              <div className="font-medium mb-1">{dayNumber}</div>
              {isHoliday && (
                <div className="text-xs text-red-600 font-medium">Holiday</div>
              )}
              {!isHoliday && officeHoursForDay && (
                <div className="text-xs text-green-600">
                  {config?.default_start_time?.substring(0, 5)} -{' '}
                  {config?.default_end_time?.substring(0, 5)}
                </div>
              )}
              {!isHoliday && !officeHoursForDay && (
                <div className="text-xs text-gray-500">Closed</div>
              )}
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Monthly View: {staffMember.first_name} {staffMember.last_name}
                </CardTitle>
                <CardDescription>
                  {monthNames[currentMonth]} {currentYear} - {staffMember.title}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setCalendarViewMode('yearly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'yearly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('monthly')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'monthly'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('daily')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      calendarViewMode === 'daily'
                        ? 'bg-white shadow text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Day
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendarView(false)}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Config
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(
                        currentYear,
                        currentMonth - 1,
                        1
                      );
                      setCalendarViewDate(newDate);
                    }}
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(
                        currentYear,
                        currentMonth + 1,
                        1
                      );
                      setCalendarViewDate(newDate);
                    }}
                  >
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-3 text-center font-medium text-gray-600 border-b"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
                {calendarDays}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                  <span>Office Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                  <span>Weekend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBookingOptionsModal = () => {
    if (!showBookingModal || !selectedTimeSlot) return null;

    const selectedDateObj = new Date(selectedTimeSlot.dateString + 'T00:00:00');
    const timeString = `${selectedTimeSlot.hour.toString().padStart(2, '0')}:00`;

    return (
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Book Time Slot
            </DialogTitle>
            <DialogDescription>
              {selectedDateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              at {timeString}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center gap-2 min-w-[200px]"
                onClick={() => {
                  setBookingModalType('appointment');
                  // Initialize appointment form with default times
                  const startTime = `${selectedTimeSlot.hour.toString().padStart(2, '0')}:00`;
                  const defaultEndTime = `${(selectedTimeSlot.hour + 1).toString().padStart(2, '0')}:00`;
                  setAppointmentForm(prev => ({
                    ...prev,
                    start_time: startTime,
                    end_time: defaultEndTime,
                  }));
                }}
              >
                <CalendarIcon className="h-6 w-6" />
                <span className="text-sm">Make Appointment</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderAppointmentBookingModal = () => {
    if (bookingModalType !== 'appointment' || !selectedTimeSlot) return null;

    const selectedDateObj = new Date(selectedTimeSlot.dateString + 'T00:00:00');

    return (
      <Dialog
        open={bookingModalType === 'appointment'}
        onOpenChange={() => {
          setBookingModalType('availability');
          setSelectedAppointment(null);
          setAppointmentForm({
            job_type_id: '',
            customer_first_name: '',
            customer_last_name: '',
            customer_phone: '',
            customer_email: '',
            start_time: '',
            end_time: '',
            notes: '',
          });
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedAppointment ? 'Edit Appointment' : 'Book Appointment'}
            </DialogTitle>
            <DialogDescription>
              {selectedDateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              - {staffMember.first_name} {staffMember.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded space-y-1">
                <div>Debug: {jobTypes.length} job types loaded</div>
                <div>Service Type Code: {serviceTypeCode || 'not loaded'}</div>
                <div>User ID: {user?.id || 'not loaded'}</div>
                <div>Booking Modal Type: {bookingModalType}</div>
                {jobTypes.length > 0 && (
                  <div>
                    Job Types:{' '}
                    {jobTypes
                      .map(
                        j =>
                          j.job_name ||
                          (j as any).job_type ||
                          (j as any).service_name ||
                          (j as any).name
                      )
                      .join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Job Type Selection */}
            <div>
              <Label htmlFor="job-type">Job Type *</Label>
              <Select
                value={appointmentForm.job_type_id}
                onValueChange={value => {
                  setAppointmentForm(prev => ({
                    ...prev,
                    job_type_id: value,
                    end_time: calculateEndTime(prev.start_time, value),
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      jobTypes.length > 0
                        ? 'Select a job type...'
                        : 'No job types available'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.length > 0 ? (
                    jobTypes.map(jobType => {
                      const jobTypeName =
                        jobType.job_name ||
                        (jobType as any).job_type ||
                        (jobType as any).service_name ||
                        (jobType as any).name ||
                        (jobType as any).title ||
                        'Unnamed Job';
                      const duration =
                        jobType.default_duration_minutes ||
                        jobType.duration ||
                        60;
                      const price = jobType.default_price || jobType.price || 0;
                      return (
                        <SelectItem key={jobType.id} value={jobType.id}>
                          {jobTypeName} ({duration} min - ${price})
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-job-types" disabled>
                      No job types configured. Please add job types in the
                      Services tab.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {jobTypes.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-amber-600">
                    No job types available. Please configure job types in the
                    Services configuration tab first.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Manually refreshing job types...');
                      loadJobTypes();
                    }}
                  >
                    Refresh Job Types
                  </Button>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-first-name">First Name *</Label>
                <Input
                  id="customer-first-name"
                  value={appointmentForm.customer_first_name}
                  onChange={e =>
                    setAppointmentForm(prev => ({
                      ...prev,
                      customer_first_name: e.target.value,
                    }))
                  }
                  placeholder="First name"
                />
              </div>

              <div>
                <Label htmlFor="customer-last-name">Last Name *</Label>
                <Input
                  id="customer-last-name"
                  value={appointmentForm.customer_last_name}
                  onChange={e =>
                    setAppointmentForm(prev => ({
                      ...prev,
                      customer_last_name: e.target.value,
                    }))
                  }
                  placeholder="Last name"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone">Phone Number *</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  value={appointmentForm.customer_phone}
                  onChange={e =>
                    setAppointmentForm(prev => ({
                      ...prev,
                      customer_phone: e.target.value,
                    }))
                  }
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="customer-email">Email Address</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={appointmentForm.customer_email}
                  onChange={e =>
                    setAppointmentForm(prev => ({
                      ...prev,
                      customer_email: e.target.value,
                    }))
                  }
                  placeholder="email@example.com (optional)"
                />
              </div>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={appointmentForm.start_time}
                  onChange={e => {
                    const newStartTime = e.target.value;
                    setAppointmentForm(prev => ({
                      ...prev,
                      start_time: newStartTime,
                      end_time: calculateEndTime(
                        newStartTime,
                        prev.job_type_id
                      ),
                    }));
                  }}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={appointmentForm.end_time}
                  onChange={e =>
                    setAppointmentForm(prev => ({
                      ...prev,
                      end_time: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={appointmentForm.notes}
                onChange={e =>
                  setAppointmentForm(prev => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div>
                {selectedAppointment && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (
                        confirm(
                          'Are you sure you want to delete this appointment?'
                        )
                      ) {
                        try {
                          setSaving(true);
                          const response = await fetch(
                            `/api/appointments?id=${selectedAppointment.id}&user_id=${user.id}`,
                            {
                              method: 'DELETE',
                            }
                          );
                          if (response.ok) {
                            await loadAppointments();
                            setBookingModalType('availability');
                            setSelectedAppointment(null);
                            setAppointmentForm({
                              job_type_id: '',
                              customer_first_name: '',
                              customer_last_name: '',
                              customer_phone: '',
                              customer_email: '',
                              start_time: '',
                              end_time: '',
                              notes: '',
                            });
                            alert('Appointment deleted successfully!');
                          } else {
                            const errorData = await response.json();
                            alert(
                              'Failed to delete appointment: ' +
                                (errorData.error || 'Unknown error')
                            );
                          }
                        } catch (error) {
                          alert(
                            'Failed to delete appointment: ' +
                              (error instanceof Error
                                ? error.message
                                : 'Unknown error')
                          );
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookingModalType('availability');
                    setSelectedAppointment(null);
                    setAppointmentForm({
                      job_type_id: '',
                      customer_first_name: '',
                      customer_last_name: '',
                      customer_phone: '',
                      customer_email: '',
                      start_time: '',
                      end_time: '',
                      notes: '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveAppointment}
                  disabled={
                    saving ||
                    !appointmentForm.job_type_id ||
                    !appointmentForm.customer_first_name ||
                    !appointmentForm.customer_last_name ||
                    !appointmentForm.customer_phone
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving
                    ? selectedAppointment
                      ? 'Updating...'
                      : 'Booking...'
                    : selectedAppointment
                      ? 'Update Appointment'
                      : 'Book Appointment'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDayDetailModal = () => {
    if (!showDayDetail || !selectedDate || !dayAvailability) return null;

    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const isWeekend =
      selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6;
    const isHoliday = holidays.some(
      holiday =>
        new Date(holiday.holiday_date).toDateString() ===
        selectedDateObj.toDateString()
    );

    return (
      <Dialog open={showDayDetail} onOpenChange={setShowDayDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedDateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogTitle>
            <DialogDescription>
              Manage availability for {staffMember.first_name}{' '}
              {staffMember.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Availability Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="available">Available this day</Label>
              <Switch
                id="available"
                checked={dayAvailability.is_available}
                onCheckedChange={checked =>
                  setDayAvailability((prev: any) => ({
                    ...prev,
                    is_available: checked,
                  }))
                }
              />
            </div>

            {/* Time Slots */}
            {dayAvailability.is_available && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={dayAvailability.start_time || ''}
                      onChange={e =>
                        setDayAvailability((prev: any) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={dayAvailability.end_time || ''}
                      onChange={e =>
                        setDayAvailability((prev: any) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Quick Time Preset Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDayAvailability((prev: any) => ({
                        ...prev,
                        start_time: '09:00',
                        end_time: '17:00',
                      }))
                    }
                  >
                    9 AM - 5 PM
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDayAvailability((prev: any) => ({
                        ...prev,
                        start_time: '08:00',
                        end_time: '18:00',
                      }))
                    }
                  >
                    8 AM - 6 PM
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDayAvailability((prev: any) => ({
                        ...prev,
                        start_time: '10:00',
                        end_time: '14:00',
                      }))
                    }
                  >
                    Half Day
                  </Button>
                </div>
              </div>
            )}

            {/* Reason for unavailability */}
            {!dayAvailability.is_available && (
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Select
                  value={dayAvailability.reason || ''}
                  onValueChange={value =>
                    setDayAvailability((prev: any) => ({
                      ...prev,
                      reason: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={dayAvailability.notes || ''}
                onChange={e =>
                  setDayAvailability((prev: any) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Info badges */}
            <div className="flex gap-2">
              {isWeekend && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-800"
                >
                  Weekend
                </Badge>
              )}
              {isHoliday && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-800"
                >
                  Holiday
                </Badge>
              )}
              {dayAvailability.is_override && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Custom Override
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDayDetail(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  saveDayAvailability({
                    ...dayAvailability,
                    is_override: true,
                  })
                }
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Show calendar view if requested
  if (showCalendarView) {
    return (
      <>
        {calendarViewMode === 'yearly' && renderYearlyCalendar()}
        {calendarViewMode === 'monthly' && renderMonthlyCalendar()}
        {calendarViewMode === 'daily' && renderDailyCalendar()}
        {renderBookingOptionsModal()}
        {renderAppointmentBookingModal()}
        {renderDayDetailModal()}
      </>
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
              <div>
                <CardTitle>Staff Availability Calendar</CardTitle>
                <CardDescription>
                  View and manage {staffMember.first_name}{' '}
                  {staffMember.last_name}'s availability
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* Calendar View Selector */}
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="calendar-view-select"
                    className="text-sm font-medium"
                  >
                    View:
                  </Label>
                  <Select
                    value={calendarViewMode}
                    onValueChange={(value: 'yearly' | 'monthly' | 'daily') =>
                      setCalendarViewMode(value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {calendars.length === 0 && (
                  <Button onClick={generateDefaultCalendar} disabled={saving}>
                    {saving ? 'Generating...' : 'Generate Default Calendar'}
                  </Button>
                )}
              </div>
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
              <div className="space-y-4">
                {/* Calendar Navigation Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {calendarViewMode === 'yearly' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCalendarViewDate(
                              new Date(calendarViewDate.getFullYear() - 1, 0, 1)
                            )
                          }
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-16 text-center">
                          {calendarViewDate.getFullYear()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCalendarViewDate(
                              new Date(calendarViewDate.getFullYear() + 1, 0, 1)
                            )
                          }
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {calendarViewMode === 'monthly' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(calendarViewDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCalendarViewDate(newDate);
                          }}
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-32 text-center">
                          {calendarViewDate.toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(calendarViewDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCalendarViewDate(newDate);
                          }}
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {calendarViewMode === 'daily' && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(calendarViewDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setCalendarViewDate(newDate);
                            setSelectedDate(
                              newDate.toISOString().split('T')[0]
                            );
                            loadDayAvailability(
                              newDate.toISOString().split('T')[0]
                            );
                          }}
                        >
                          <ArrowLeftIcon className="h-4 w-4" />
                        </Button>
                        <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-40 text-center">
                          {calendarViewDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(calendarViewDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setCalendarViewDate(newDate);
                            setSelectedDate(
                              newDate.toISOString().split('T')[0]
                            );
                            loadDayAvailability(
                              newDate.toISOString().split('T')[0]
                            );
                          }}
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calendar Content Based on View Mode */}
                {calendarViewMode === 'yearly' && renderInlineYearlyView()}
                {calendarViewMode === 'monthly' && renderInlineMonthlyView()}
                {calendarViewMode === 'daily' && renderInlineDailyView()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Modals for Calendar Tab */}
      {activeTab === 'calendar' && renderBookingOptionsModal()}
      {activeTab === 'calendar' && renderAppointmentBookingModal()}
      {activeTab === 'calendar' && renderDayDetailModal()}

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
