'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { authenticatedFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  SettingsIcon,
} from '@/components/icons';

interface AppointmentType {
  id: string;
  name: string;
  duration: number; // in minutes
  description: string;
  color: string;
  requiresStaff: string[]; // staff roles that can handle this appointment
  isActive: boolean;
  price?: number;
}

interface BusinessHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface AppointmentSystemProps {
  user: User;
  onAppointmentUpdate: (hasAppointments: boolean) => void;
}

interface OfficeHours {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Holiday {
  id?: string;
  holiday_date: string;
  holiday_name: string;
  description?: string;
  is_recurring?: boolean;
}

export function AppointmentSystemConfig({
  user,
  onAppointmentUpdate,
}: AppointmentSystemProps) {
  const t = useTranslations('appointmentSystem');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>(
    []
  );

  // Enhanced Office Hours State
  const [officeHours, setOfficeHours] = useState<OfficeHours[]>([]);
  const [editingHours, setEditingHours] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  // Holiday State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showBankHolidaysDialog, setShowBankHolidaysDialog] = useState(false);
  const [selectedBankHolidays, setSelectedBankHolidays] = useState<string[]>(
    []
  );
  const [savingBankHolidays, setSavingBankHolidays] = useState(false);

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState('appointment-types');
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalAppointmentTypes, setOriginalAppointmentTypes] = useState<
    AppointmentType[]
  >([]);
  const [savingAppointmentTypes, setSavingAppointmentTypes] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: '30',
    description: '',
    color: '#3B82F6',
    requiresStaff: '',
    price: '',
  });

  const [bookingSettings, setBookingSettings] = useState({
    advanceBookingDays: 30,
    minAdvanceHours: 2,
    allowOnlineBooking: true,
    requireConfirmation: true,
    sendReminders: true,
    reminderHours: 24,
  });

  // Days of week mapping
  const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  useEffect(() => {
    loadAppointmentData();
    loadOfficeHours();
    loadHolidays();
  }, [user, selectedYear]);

  useEffect(() => {
    onAppointmentUpdate(appointmentTypes.length > 0);
  }, [appointmentTypes.length, onAppointmentUpdate]);

  const loadAppointmentData = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/appointments/types', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setAppointmentTypes(data.appointmentTypes || []);

      // Initialize with default template appointment types
      const defaultAppointments: AppointmentType[] =
        predefinedAppointmentTypes.map((type, index) => ({
          id: `default-${Date.now()}-${index}`,
          ...type,
          color: colorOptions[index % colorOptions.length],
          requiresStaff: [],
          isActive: true,
        }));

      setAppointmentTypes(defaultAppointments);
      setOriginalAppointmentTypes([...defaultAppointments]); // Store original for comparison
    } catch (error) {
      console.error('Failed to load appointment data:', error);
    }
  };

  // Enhanced Office Hours Functions
  const loadOfficeHours = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/business/office-hours?user_id=${user.id}&business_id=${user.id}`
      );

      if (response.ok) {
        const data = await response.json();
        const existingHours = data.office_hours || [];

        // Initialize with default hours for all days if none exist
        const allDays = DAYS_OF_WEEK.map(day => {
          const existing = existingHours.find(
            (h: OfficeHours) => h.day_of_week === day.value
          );
          return (
            existing || {
              day_of_week: day.value,
              start_time: day.value >= 1 && day.value <= 5 ? '09:00' : '10:00',
              end_time: day.value >= 1 && day.value <= 5 ? '17:00' : '16:00',
              is_active: day.value >= 1 && day.value <= 5, // Default Mon-Fri active
            }
          );
        });

        setOfficeHours(allDays);
      }
    } catch (error) {
      console.error('Failed to load office hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    try {
      const response = await authenticatedFetch(
        `/api/business/holidays?user_id=${user.id}&business_id=${user.id}&year=${selectedYear}`
      );

      if (response.ok) {
        const data = await response.json();
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error('Failed to load holidays:', error);
    }
  };

  const updateDayHours = (
    dayIndex: number,
    field: keyof OfficeHours,
    value: any
  ) => {
    setOfficeHours(prev =>
      prev.map((day, index) =>
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const copyToAllDays = (sourceDayIndex: number) => {
    const sourceDay = officeHours[sourceDayIndex];
    if (!sourceDay.is_active) return;

    setOfficeHours(prev =>
      prev.map(day => ({
        ...day,
        start_time: sourceDay.start_time,
        end_time: sourceDay.end_time,
      }))
    );
  };

  const saveOfficeHours = async () => {
    try {
      setSavingHours(true);

      // Save all days (active and inactive)
      const allHours = officeHours.map(day => ({
        day_of_week: day.day_of_week,
        start_time: day.is_active ? day.start_time : null,
        end_time: day.is_active ? day.end_time : null,
        is_active: day.is_active,
      }));

      console.log('Sending office hours data:', allHours);

      const response = await authenticatedFetch('/api/business/office-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          business_id: user.id,
          office_hours: allHours,
        }),
      });

      if (response.ok) {
        toast.success('Business hours saved successfully!');
        setEditingHours(false);
        await loadOfficeHours();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save business hours');
      }
    } catch (error) {
      console.error('Failed to save business hours:', error);
      toast.error('Failed to save business hours. Please try again.');
    } finally {
      setSavingHours(false);
    }
  };

  // Bank holidays data
  const getBankHolidays = (year: number) => [
    {
      date: `${year}-01-01`,
      name: "New Year's Day",
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-01-15`,
      name: 'Martin Luther King Jr. Day',
      description: '3rd Monday in January',
      category: 'federal',
    },
    {
      date: `${year}-02-19`,
      name: "Presidents' Day",
      description: '3rd Monday in February',
      category: 'federal',
    },
    {
      date: `${year}-05-27`,
      name: 'Memorial Day',
      description: 'Last Monday in May',
      category: 'federal',
    },
    {
      date: `${year}-06-19`,
      name: 'Juneteenth',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-07-04`,
      name: 'Independence Day',
      description: 'Fourth of July',
      category: 'federal',
    },
    {
      date: `${year}-09-02`,
      name: 'Labor Day',
      description: '1st Monday in September',
      category: 'federal',
    },
    {
      date: `${year}-10-14`,
      name: 'Columbus Day',
      description: '2nd Monday in October',
      category: 'federal',
    },
    {
      date: `${year}-11-11`,
      name: 'Veterans Day',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-11-28`,
      name: 'Thanksgiving',
      description: '4th Thursday in November',
      category: 'federal',
    },
    {
      date: `${year}-11-29`,
      name: 'Black Friday',
      description: 'Day after Thanksgiving',
      category: 'common',
    },
    {
      date: `${year}-12-24`,
      name: 'Christmas Eve',
      description: 'Common business closure',
      category: 'common',
    },
    {
      date: `${year}-12-25`,
      name: 'Christmas Day',
      description: 'Federal Holiday',
      category: 'federal',
    },
    {
      date: `${year}-12-31`,
      name: "New Year's Eve",
      description: 'Common business closure',
      category: 'common',
    },
  ];

  const toggleBankHoliday = (holidayDate: string) => {
    setSelectedBankHolidays(prev =>
      prev.includes(holidayDate)
        ? prev.filter(date => date !== holidayDate)
        : [...prev, holidayDate]
    );
  };

  const saveBankHolidays = async () => {
    if (selectedBankHolidays.length === 0) {
      toast.error('Please select at least one holiday to add.');
      return;
    }

    setSavingBankHolidays(true);
    try {
      const bankHolidays = getBankHolidays(selectedYear);
      let addedCount = 0;

      for (const holidayDate of selectedBankHolidays) {
        const holiday = bankHolidays.find(h => h.date === holidayDate);
        if (!holiday) continue;

        // Check if holiday already exists
        const exists = holidays.some(h => h.holiday_date === holiday.date);
        if (exists) continue;

        const response = await authenticatedFetch('/api/business/holidays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            business_id: user.id,
            holiday_date: holiday.date,
            holiday_name: holiday.name,
            description: holiday.description,
            is_recurring: holiday.category === 'federal',
          }),
        });

        if (response.ok) {
          addedCount++;
        }
      }

      await loadHolidays();
      setShowBankHolidaysDialog(false);
      setSelectedBankHolidays([]);
      toast.success(
        `Successfully added ${addedCount} holiday${addedCount !== 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Failed to add bank holidays:', error);
      toast.error('Failed to add bank holidays. Please try again.');
    } finally {
      setSavingBankHolidays(false);
    }
  };

  const deleteHoliday = async (holiday: Holiday) => {
    const confirmed = await confirm({
      title: 'Delete Holiday',
      description: `Are you sure you want to delete "${holiday.holiday_name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(
        `/api/business/holidays?id=${holiday.id}&user_id=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await loadHolidays();
        toast.success('Holiday deleted successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      toast.error('Failed to delete holiday. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const handleAddAppointmentType = async () => {
    if (formData.name && formData.duration) {
      const newAppointment: AppointmentType = {
        id: Date.now().toString(),
        name: formData.name,
        duration: parseInt(formData.duration),
        description: formData.description,
        color: formData.color,
        requiresStaff: formData.requiresStaff
          ? formData.requiresStaff.split(',').map(s => s.trim())
          : [],
        isActive: true,
        price: formData.price ? parseFloat(formData.price) : undefined,
      };

      setAppointmentTypes(prev => [...prev, newAppointment]);
      setHasUnsavedChanges(true);
      setFormData({
        name: '',
        duration: '30',
        description: '',
        color: '#3B82F6',
        requiresStaff: '',
        price: '',
      });
      setShowAddForm(false);

      // TODO: Save to database
      console.log('Added appointment type:', newAppointment);
    }
  };

  const handleDeleteAppointmentType = async (id: string) => {
    const appointmentToDelete = appointmentTypes.find(a => a.id === id);
    if (!appointmentToDelete) return;

    const confirmed = await confirm({
      title: 'Delete Appointment Type',
      description: `Are you sure you want to delete "${appointmentToDelete.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    setAppointmentTypes(prev => prev.filter(a => a.id !== id));
    setHasUnsavedChanges(true);
    // TODO: Delete from database
    console.log('Deleted appointment type:', appointmentToDelete);
  };

  const handleEditAppointmentType = (appointment: AppointmentType) => {
    setEditingAppointmentId(appointment.id);
  };

  const handleSaveAppointmentType = async (
    id: string,
    updatedData: { name: string; duration: number }
  ) => {
    const updatedAppointment = appointmentTypes.find(a => a.id === id);
    if (!updatedAppointment) return;

    setAppointmentTypes(prev =>
      prev.map(appointment =>
        appointment.id === id
          ? {
              ...appointment,
              name: updatedData.name,
              duration: updatedData.duration,
            }
          : appointment
      )
    );
    setEditingAppointmentId(null);
    setHasUnsavedChanges(true);

    // TODO: Save to database
    console.log('Updated appointment type:', {
      ...updatedAppointment,
      ...updatedData,
    });
  };

  const handleCancelEditAppointmentType = () => {
    setEditingAppointmentId(null);
  };

  const saveAllAppointmentTypes = async () => {
    try {
      setSavingAppointmentTypes(true);

      // TODO: Replace with actual API call to save all appointment types
      // const response = await fetch('/api/appointment-types', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     user_id: user.id,
      //     appointment_types: appointmentTypes
      //   })
      // });

      // if (response.ok) {
      setOriginalAppointmentTypes([...appointmentTypes]);
      setHasUnsavedChanges(false);
      toast.success('All appointment types saved successfully!');
      // } else {
      //   throw new Error('Failed to save appointment types');
      // }

      console.log('Saved appointment types:', appointmentTypes);
    } catch (error) {
      console.error('Failed to save appointment types:', error);
      toast.error('Failed to save appointment types. Please try again.');
    } finally {
      setSavingAppointmentTypes(false);
    }
  };

  const cancelAllAppointmentChanges = async () => {
    if (!hasUnsavedChanges) return;

    const confirmed = await confirm({
      title: 'Cancel Changes',
      description:
        'Are you sure you want to cancel all changes? This will reset all appointment types to their last saved state.',
      confirmText: 'Yes, Cancel Changes',
      cancelText: 'Keep Editing',
    });

    if (confirmed) {
      setAppointmentTypes([...originalAppointmentTypes]);
      setHasUnsavedChanges(false);
      setEditingAppointmentId(null);
      setShowAddForm(false);
    }
  };

  const handleUpdateAppointmentField = async (
    id: string,
    field: string,
    value: any
  ) => {
    const appointment = appointmentTypes.find(a => a.id === id);
    if (!appointment) return;

    setAppointmentTypes(prev =>
      prev.map(appointment =>
        appointment.id === id ? { ...appointment, [field]: value } : appointment
      )
    );

    setHasUnsavedChanges(true);
    // TODO: Auto-save field updates to database
    console.log('Updated appointment field:', { id, field, value });
  };

  const predefinedAppointmentTypes = [
    {
      name: 'Consultation',
      duration: 30,
      description: 'Initial consultation and assessment',
    },
    {
      name: 'Check-up',
      duration: 45,
      description: 'Regular check-up appointment',
    },
    {
      name: 'Treatment',
      duration: 60,
      description: 'Treatment or procedure session',
    },
    {
      name: 'Follow-up',
      duration: 20,
      description: 'Follow-up visit or review',
    },
    {
      name: 'Cleaning',
      duration: 60,
      description: 'Professional cleaning service',
    },
    {
      name: 'Emergency',
      duration: 30,
      description: 'Emergency or urgent appointment',
    },
    {
      name: 'Assessment',
      duration: 90,
      description: 'Comprehensive assessment or evaluation',
    },
    {
      name: 'Maintenance',
      duration: 45,
      description: 'Routine maintenance or service',
    },
  ];

  const colorOptions = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1', // Indigo
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 dark:bg-gray-800">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading appointment system configuration...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ensure we have office hours data
  if (!officeHours || officeHours.length === 0) {
    console.warn('Office hours data is missing or empty');
    return (
      <Card>
        <CardContent className="p-6 dark:bg-gray-800">
          <div className="text-center">
            <p className="text-red-600">
              Error loading office hours data. Please refresh the page.
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/40 dark:to-purple-900/40 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            {t('title')}
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            {t('description')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4 bg-muted dark:bg-gray-800">
              <TabsTrigger
                value="appointment-types"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-300 dark:hover:text-white"
              >
                <CalendarIcon className="h-4 w-4" />
                {t('tabs.appointmentTypes')}
              </TabsTrigger>
              <TabsTrigger
                value="business-hours"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-300 dark:hover:text-white"
              >
                <ClockIcon className="h-4 w-4" />
                {t('tabs.businessHours')}
              </TabsTrigger>
              <TabsTrigger
                value="holidays"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-300 dark:hover:text-white"
              >
                <CalendarIcon className="h-4 w-4" />
                {t('tabs.holidays')}
              </TabsTrigger>
              <TabsTrigger
                value="booking-settings"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-white dark:text-gray-300 dark:hover:text-white"
              >
                <SettingsIcon className="h-4 w-4" />
                {t('tabs.bookingSettings')}
              </TabsTrigger>
            </TabsList>
          </CardHeader>
        </Card>

        {/* Appointment Types Tab */}
        <TabsContent value="appointment-types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {t('appointmentTypes.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('appointmentTypes.description')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <>
                      <Button
                        onClick={saveAllAppointmentTypes}
                        disabled={savingAppointmentTypes}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        {savingAppointmentTypes ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>{t('appointmentTypes.saveChanges')}</>
                        )}
                      </Button>
                      <Button
                        onClick={cancelAllAppointmentChanges}
                        disabled={savingAppointmentTypes}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {t('appointmentTypes.cancelChanges')}
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {t('appointmentTypes.addAppointmentType')}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="dark:bg-gray-800">
              {appointmentTypes.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Loading Appointment Types...
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Setting up your default appointment types
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Info Panel */}
                  <div
                    className={`border rounded-lg p-4 ${
                      hasUnsavedChanges
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <CalendarIcon
                        className={`h-5 w-5 mt-0.5 ${
                          hasUnsavedChanges
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                      <div>
                        <h4
                          className={`font-medium ${
                            hasUnsavedChanges
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {hasUnsavedChanges
                            ? '⚠️ Unsaved Changes'
                            : 'Default Appointment Types Loaded'}
                        </h4>
                        <p
                          className={`text-sm mt-1 ${
                            hasUnsavedChanges
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {hasUnsavedChanges
                            ? 'You have made changes to your appointment types. Click "Save Changes" to keep your modifications or "Cancel Changes" to revert.'
                            : "We've added common appointment types to get you started. You can customize these templates, remove ones you don't need, or add new appointment types specific to your business."}
                        </p>
                        {!hasUnsavedChanges && (
                          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                            <li>
                              • <strong>Edit:</strong> Click the edit icon (✏️)
                              to modify names and durations
                            </li>
                            <li>
                              • <strong>Toggle:</strong> Use the switch to
                              activate/deactivate appointment types
                            </li>
                            <li>
                              • <strong>Delete:</strong> Click the trash icon
                              (🗑️) to remove unwanted types
                            </li>
                            <li>
                              • <strong>Add New:</strong> Use the "Add
                              Appointment Type" button above
                            </li>
                          </ul>
                        )}
                        {hasUnsavedChanges && (
                          <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                            <li>
                              • <strong>💾 Save Changes:</strong> Permanently
                              save all your modifications
                            </li>
                            <li>
                              • <strong>❌ Cancel Changes:</strong> Discard all
                              changes and return to last saved state
                            </li>
                            <li>
                              • <strong>Continue Editing:</strong> Make more
                              changes before saving
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="col-span-4">
                      {t('appointmentTypes.table.appointmentType')}
                    </div>
                    <div className="col-span-2">
                      {t('appointmentTypes.table.duration')}
                    </div>
                    <div className="col-span-2">
                      {t('appointmentTypes.table.status')}
                    </div>
                    <div className="col-span-1">
                      {t('appointmentTypes.table.color')}
                    </div>
                    <div className="col-span-3 text-right">
                      {t('appointmentTypes.table.actions')}
                    </div>
                  </div>

                  {/* Appointment List */}
                  {appointmentTypes.map(appointment => (
                    <div
                      key={appointment.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {/* Appointment Name */}
                      <div className="col-span-4 flex items-center">
                        {editingAppointmentId === appointment.id ? (
                          <Input
                            value={appointment.name}
                            onChange={e =>
                              handleUpdateAppointmentField(
                                appointment.id,
                                'name',
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                            placeholder="Appointment name"
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {appointment.name}
                            </div>
                            {appointment.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {appointment.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="col-span-2 flex items-center">
                        {editingAppointmentId === appointment.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={appointment.duration}
                              onChange={e =>
                                handleUpdateAppointmentField(
                                  appointment.id,
                                  'duration',
                                  parseInt(e.target.value) || 30
                                )
                              }
                              className="h-8 text-sm w-16"
                              min="5"
                              max="480"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              min
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {appointment.duration} minutes
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={appointment.isActive}
                            onCheckedChange={checked =>
                              handleUpdateAppointmentField(
                                appointment.id,
                                'isActive',
                                checked
                              )
                            }
                            disabled={editingAppointmentId === appointment.id}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {appointment.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Color */}
                      <div className="col-span-1 flex items-center">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: appointment.color }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="col-span-3 flex items-center justify-end gap-1">
                        {editingAppointmentId === appointment.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                handleSaveAppointmentType(appointment.id, {
                                  name: appointment.name,
                                  duration: appointment.duration,
                                });
                              }}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEditAppointmentType}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleEditAppointmentType(appointment)
                              }
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleDeleteAppointmentType(appointment.id)
                              }
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours Tab */}
        <TabsContent value="business-hours">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    {t('businessHours.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('businessHours.description')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!editingHours ? (
                    <Button
                      onClick={() => setEditingHours(true)}
                      variant="outline"
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      {t('businessHours.editHours')}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={saveOfficeHours}
                        disabled={savingHours}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {savingHours ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>💾 Save Hours</>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingHours(false);
                          loadOfficeHours();
                        }}
                        variant="outline"
                        disabled={savingHours}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 dark:bg-gray-800">
              {DAYS_OF_WEEK.map((day, index) => {
                const dayHours = officeHours[index];
                if (!dayHours) {
                  console.warn(
                    `No hours data for day ${day.label} at index ${index}`
                  );
                  return null;
                }

                return (
                  <div
                    key={day.value}
                    className={`flex items-center gap-4 p-4 border rounded-lg ${dayHours.is_active ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                  >
                    <div className="w-24">
                      <Label className="font-medium text-lg text-gray-900 dark:text-white">
                        {day.label}
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={dayHours.is_active}
                        onCheckedChange={checked =>
                          editingHours &&
                          updateDayHours(index, 'is_active', checked)
                        }
                        disabled={!editingHours}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[40px]">
                        {dayHours.is_active ? 'Open' : 'Closed'}
                      </span>
                    </div>

                    {dayHours.is_active && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">From:</Label>
                          <Input
                            type="time"
                            value={dayHours.start_time}
                            onChange={e =>
                              editingHours &&
                              updateDayHours(
                                index,
                                'start_time',
                                e.target.value
                              )
                            }
                            className="w-32"
                            disabled={!editingHours}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">To:</Label>
                          <Input
                            type="time"
                            value={dayHours.end_time}
                            onChange={e =>
                              editingHours &&
                              updateDayHours(index, 'end_time', e.target.value)
                            }
                            className="w-32"
                            disabled={!editingHours}
                          />
                        </div>

                        {editingHours && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToAllDays(index)}
                            className="text-xs"
                          >
                            Copy to all days
                          </Button>
                        )}
                      </>
                    )}

                    {!dayHours.is_active && (
                      <span className="text-sm text-gray-500 italic flex-1">
                        Closed all day
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Business Hours Configuration
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                      <li>
                        • <strong>All days are customizable</strong> - Enable
                        weekends or any day you operate
                      </li>
                      <li>
                        • <strong>Individual control</strong> - Set different
                        hours for each day of the week
                      </li>
                      <li>
                        • <strong>Copy function</strong> - Use "Copy to all
                        days" to apply same hours quickly
                      </li>
                      <li>
                        • <strong>Weekend support</strong> - Saturday and Sunday
                        can be enabled with custom hours
                      </li>
                      <li>
                        • These hours serve as defaults for staff calendars and
                        online booking
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holiday Configuration Tab */}
        <TabsContent value="holidays">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Holiday Configuration for {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    Manage business holidays and closures. Select from bank
                    holidays or add custom dates.
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="w-24"
                    min="2020"
                    max="2030"
                  />
                  <Button
                    onClick={() => {
                      setSelectedBankHolidays([]);
                      setShowBankHolidaysDialog(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Bank Holidays
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {holidays.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No holidays configured for {selectedYear}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add holidays to let customers know when you're closed for
                    business
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedBankHolidays([]);
                      setShowBankHolidaysDialog(true);
                    }}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Your First Holidays
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {holidays.map(holiday => (
                      <div
                        key={holiday.id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {holiday.holiday_name}
                          </h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteHoliday(holiday)}
                            className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                          >
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {formatDate(holiday.holiday_date)}
                          </span>
                          {holiday.is_recurring && (
                            <Badge variant="secondary" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                          {isUpcoming(holiday.holiday_date) && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Upcoming
                            </Badge>
                          )}
                        </div>

                        {holiday.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        setSelectedBankHolidays([]);
                        setShowBankHolidaysDialog(true);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add More Holidays
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings Tab */}
        <TabsContent value="booking-settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Booking Settings
              </CardTitle>
              <CardDescription>
                Configure appointment booking rules and customer policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 dark:bg-gray-800">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="advance-days">
                    Maximum advance booking (days)
                  </Label>
                  <Input
                    id="advance-days"
                    type="number"
                    value={bookingSettings.advanceBookingDays}
                    onChange={e =>
                      setBookingSettings(prev => ({
                        ...prev,
                        advanceBookingDays: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="min-hours">
                    Minimum advance notice (hours)
                  </Label>
                  <Input
                    id="min-hours"
                    type="number"
                    value={bookingSettings.minAdvanceHours}
                    onChange={e =>
                      setBookingSettings(prev => ({
                        ...prev,
                        minAdvanceHours: parseInt(e.target.value) || 2,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow online booking</Label>
                    <p className="text-sm text-gray-600">
                      Enable customers to book appointments through the AI agent
                    </p>
                  </div>
                  <Switch
                    checked={bookingSettings.allowOnlineBooking}
                    onCheckedChange={checked =>
                      setBookingSettings(prev => ({
                        ...prev,
                        allowOnlineBooking: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require confirmation</Label>
                    <p className="text-sm text-gray-600">
                      All appointments need manual confirmation
                    </p>
                  </div>
                  <Switch
                    checked={bookingSettings.requireConfirmation}
                    onCheckedChange={checked =>
                      setBookingSettings(prev => ({
                        ...prev,
                        requireConfirmation: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Send reminders</Label>
                    <p className="text-sm text-gray-600">
                      Automatically send appointment reminders
                    </p>
                  </div>
                  <Switch
                    checked={bookingSettings.sendReminders}
                    onCheckedChange={checked =>
                      setBookingSettings(prev => ({
                        ...prev,
                        sendReminders: checked,
                      }))
                    }
                  />
                </div>

                {bookingSettings.sendReminders && (
                  <div>
                    <Label htmlFor="reminder-hours">
                      Reminder time (hours before)
                    </Label>
                    <Input
                      id="reminder-hours"
                      type="number"
                      value={bookingSettings.reminderHours}
                      onChange={e =>
                        setBookingSettings(prev => ({
                          ...prev,
                          reminderHours: parseInt(e.target.value) || 24,
                        }))
                      }
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Appointment Type Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Appointment Type</CardTitle>
            <CardDescription>
              Create a new appointment type with specific duration and
              requirements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 dark:bg-gray-800">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment-name">Appointment Name *</Label>
                <Input
                  id="appointment-name"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Consultation, Check-up"
                />
              </div>
              <div>
                <Label htmlFor="appointment-duration">
                  Duration (minutes) *
                </Label>
                <Select
                  value={formData.duration}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, duration: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="appointment-description">Description</Label>
              <Input
                id="appointment-description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the appointment"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment-color">Color</Label>
                <div className="flex gap-2 mt-1">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color
                          ? 'border-gray-400'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="appointment-price">Price (optional)</Label>
                <Input
                  id="appointment-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requires-staff">
                Required Staff Roles (comma-separated)
              </Label>
              <Input
                id="requires-staff"
                value={formData.requiresStaff}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    requiresStaff: e.target.value,
                  }))
                }
                placeholder="e.g., Doctor, Hygienist, Specialist"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAddAppointmentType}
                disabled={!formData.name || !formData.duration}
              >
                Add Appointment Type
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    name: '',
                    duration: '30',
                    description: '',
                    color: '#3B82F6',
                    requiresStaff: '',
                    price: '',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Appointment System Status
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {appointmentTypes.length > 0
                  ? `${appointmentTypes.length} appointment type${appointmentTypes.length > 1 ? 's' : ''} ready for your business. Business hours and holidays are configured. The AI agent can now handle comprehensive appointment booking requests with these service options.`
                  : 'Setting up default appointment types to enable booking functionality for the AI agent.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Holidays Selection Dialog */}
      <Dialog
        open={showBankHolidaysDialog}
        onOpenChange={setShowBankHolidaysDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Select Bank Holidays for {selectedYear}
            </DialogTitle>
            <DialogDescription>
              Choose from federal holidays and common business closures to add
              to your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">
                    {selectedBankHolidays.length} holiday
                    {selectedBankHolidays.length !== 1 ? 's' : ''} selected
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Select multiple holidays and save them all at once
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allHolidays = getBankHolidays(selectedYear);
                      setSelectedBankHolidays(allHolidays.map(h => h.date));
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBankHolidays([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>

            {/* Federal Holidays */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                🇺🇸 Federal Holidays
                <Badge variant="secondary">Official US holidays</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getBankHolidays(selectedYear)
                  .filter(holiday => holiday.category === 'federal')
                  .map(holiday => {
                    const isExisting = holidays.some(
                      h => h.holiday_date === holiday.date
                    );
                    const isSelected = selectedBankHolidays.includes(
                      holiday.date
                    );

                    return (
                      <div
                        key={holiday.date}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isExisting
                            ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            : isSelected
                              ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <Checkbox
                          id={holiday.date}
                          checked={isSelected}
                          disabled={isExisting}
                          onCheckedChange={() =>
                            !isExisting && toggleBankHoliday(holiday.date)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={holiday.date}
                              className={`font-medium ${isExisting ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
                          >
                            {holiday.description}
                            {isExisting && ' (Already added)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Common Business Closures */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                🏢 Common Business Closures
                <Badge variant="outline">Optional closures</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getBankHolidays(selectedYear)
                  .filter(holiday => holiday.category === 'common')
                  .map(holiday => {
                    const isExisting = holidays.some(
                      h => h.holiday_date === holiday.date
                    );
                    const isSelected = selectedBankHolidays.includes(
                      holiday.date
                    );

                    return (
                      <div
                        key={holiday.date}
                        className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isExisting
                            ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            : isSelected
                              ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <Checkbox
                          id={holiday.date}
                          checked={isSelected}
                          disabled={isExisting}
                          onCheckedChange={() =>
                            !isExisting && toggleBankHoliday(holiday.date)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={holiday.date}
                              className={`font-medium ${isExisting ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}
                          >
                            {holiday.description}
                            {isExisting && ' (Already added)'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={saveBankHolidays}
                disabled={
                  selectedBankHolidays.length === 0 || savingBankHolidays
                }
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {savingBankHolidays ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Add Selected Holidays ({selectedBankHolidays.length})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBankHolidaysDialog(false)}
                disabled={savingBankHolidays}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog />
    </div>
  );
}
