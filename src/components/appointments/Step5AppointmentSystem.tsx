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
  ClockIcon,
  EditIcon,
  CheckIcon,
  SaveIcon,
  PlusIcon,
  XIcon,
  SettingsIcon,
} from '@/components/icons';

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

interface Step5AppointmentSystemProps {
  user: User;
  businessId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export function Step5AppointmentSystem({
  user,
  businessId,
}: Step5AppointmentSystemProps) {
  const [activeTab, setActiveTab] = useState('business-hours');
  const [loading, setLoading] = useState(true);

  // Business Hours State
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

  useEffect(() => {
    loadOfficeHours();
    loadHolidays();
  }, [user, businessId, selectedYear]);

  const loadOfficeHours = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/business/office-hours?user_id=${user.id}&business_id=${businessId}`
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
      const response = await fetch(
        `/api/business/holidays?user_id=${user.id}&business_id=${businessId}&year=${selectedYear}`
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
        start_time: day.start_time + ':00',
        end_time: day.end_time + ':00',
        is_active: day.is_active,
      }));

      const response = await fetch('/api/business/office-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          business_id: businessId,
          office_hours: allHours,
        }),
      });

      if (response.ok) {
        alert('Business hours saved successfully!');
        setEditingHours(false);
        await loadOfficeHours();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save business hours');
      }
    } catch (error) {
      console.error('Failed to save business hours:', error);
      alert('Failed to save business hours. Please try again.');
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
      alert('Please select at least one holiday to add.');
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

        const response = await fetch('/api/business/holidays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            business_id: businessId,
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
      alert(
        `Successfully added ${addedCount} holiday${addedCount !== 1 ? 's' : ''}!`
      );
    } catch (error) {
      console.error('Failed to add bank holidays:', error);
      alert('Failed to add bank holidays. Please try again.');
    } finally {
      setSavingBankHolidays(false);
    }
  };

  const deleteHoliday = async (holiday: Holiday) => {
    if (
      !confirm(`Are you sure you want to delete "${holiday.holiday_name}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/business/holidays?id=${holiday.id}&user_id=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        await loadHolidays();
        alert('Holiday deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete holiday');
      }
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      alert('Failed to delete holiday. Please try again.');
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Step 5 configuration...</p>
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
        <CardContent className="p-6">
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
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            📅 Step 5: Appointment System Configuration
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure your business hours, holidays, and appointment settings to
            complete your system setup
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="business-hours"
                className="flex items-center gap-2"
              >
                <ClockIcon className="h-4 w-4" />
                Business Hours
              </TabsTrigger>
              <TabsTrigger value="holidays" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Holiday Configuration
              </TabsTrigger>
              <TabsTrigger
                value="booking-settings"
                className="flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                Booking Settings
              </TabsTrigger>
            </TabsList>
          </CardHeader>
        </Card>

        {/* Business Hours Tab */}
        <TabsContent value="business-hours">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    Business Operating Hours
                  </CardTitle>
                  <CardDescription>
                    Set your operating hours for each day. All days are
                    customizable including weekends.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!editingHours ? (
                    <Button
                      onClick={() => setEditingHours(true)}
                      variant="outline"
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Hours
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
                          <>
                            <SaveIcon className="h-4 w-4 mr-2" />
                            Save Hours
                          </>
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
            <CardContent className="space-y-4">
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
                    className={`flex items-center gap-4 p-4 border rounded-lg ${dayHours.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="w-24">
                      <Label className="font-medium text-lg">{day.label}</Label>
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
                      <span className="text-sm text-gray-600 min-w-[40px]">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <ClockIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Business Hours Configuration
                    </h4>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
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
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No holidays configured for {selectedYear}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Add holidays to let customers know when you&apos;re closed
                    for business
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
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm">
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
                          <span className="text-sm font-medium text-blue-600">
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
                          <p className="text-xs text-gray-500">
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
            <CardContent>
              <div className="text-center py-8">
                <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Advanced Booking Configuration
                </h3>
                <p className="text-gray-600 mb-6">
                  Set up detailed booking rules, customer requirements, and
                  notification preferences
                </p>
                <Button
                  onClick={() =>
                    (window.location.href =
                      '/calendar/setup?tab=booking-settings')
                  }
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Configure Booking Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Holidays Selection Dialog */}
      <Dialog
        open={showBankHolidaysDialog}
        onOpenChange={setShowBankHolidaysDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Bank Holidays for {selectedYear}</DialogTitle>
            <DialogDescription>
              Choose from federal holidays and common business closures to add
              to your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-purple-900">
                    {selectedBankHolidays.length} holiday
                    {selectedBankHolidays.length !== 1 ? 's' : ''} selected
                  </h4>
                  <p className="text-sm text-purple-700">
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
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                            ? 'bg-gray-50 border-gray-200'
                            : isSelected
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
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
                              className={`font-medium ${isExisting ? 'text-gray-500' : 'text-gray-900'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400' : 'text-gray-600'}`}
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
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
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
                            ? 'bg-gray-50 border-gray-200'
                            : isSelected
                              ? 'bg-green-50 border-green-200'
                              : 'bg-white border-gray-200'
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
                              className={`font-medium ${isExisting ? 'text-gray-500' : 'text-gray-900'}`}
                            >
                              {holiday.name}
                            </Label>
                            <span className="text-sm text-gray-500">
                              {new Date(holiday.date).toLocaleDateString(
                                'en-US',
                                { month: 'short', day: 'numeric' }
                              )}
                            </span>
                          </div>
                          <p
                            className={`text-sm ${isExisting ? 'text-gray-400' : 'text-gray-600'}`}
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
    </div>
  );
}
