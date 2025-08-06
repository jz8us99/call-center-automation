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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SettingsIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
} from '@/components/icons';

interface BookingSettings {
  id?: string;
  advance_booking_days: number;
  min_booking_notice_hours: number;
  max_bookings_per_day: number;
  max_bookings_per_slot: number;
  default_slot_duration: number;
  slot_buffer_minutes: number;
  booking_window_start: string;
  booking_window_end: string;
  allow_same_day_booking: boolean;
  allow_weekend_booking: boolean;
  require_customer_info: boolean;
  require_phone_number: boolean;
  require_email_confirmation: boolean;
  allow_customer_cancellation: boolean;
  cancellation_notice_hours: number;
  allow_customer_reschedule: boolean;
  reschedule_notice_hours: number;
  send_booking_confirmation: boolean;
  send_reminder_email: boolean;
  reminder_hours_before: number;
  send_sms_reminders: boolean;
  blackout_dates: any[];
  special_hours: any;
  booking_instructions?: string;
  terms_and_conditions?: string;
  online_booking_enabled: boolean;
  show_staff_names: boolean;
  show_prices: boolean;
  allow_service_selection: boolean;
  require_deposit: boolean;
  deposit_percentage: number;
}

interface BookingSettingsManagementProps {
  user: User;
  businessId: string;
}

const defaultSettings: BookingSettings = {
  advance_booking_days: 90,
  min_booking_notice_hours: 2,
  max_bookings_per_day: 20,
  max_bookings_per_slot: 1,
  default_slot_duration: 30,
  slot_buffer_minutes: 15,
  booking_window_start: '08:00',
  booking_window_end: '18:00',
  allow_same_day_booking: true,
  allow_weekend_booking: false,
  require_customer_info: true,
  require_phone_number: true,
  require_email_confirmation: true,
  allow_customer_cancellation: true,
  cancellation_notice_hours: 24,
  allow_customer_reschedule: true,
  reschedule_notice_hours: 12,
  send_booking_confirmation: true,
  send_reminder_email: true,
  reminder_hours_before: 24,
  send_sms_reminders: false,
  blackout_dates: [],
  special_hours: {},
  booking_instructions: '',
  terms_and_conditions: '',
  online_booking_enabled: true,
  show_staff_names: true,
  show_prices: true,
  allow_service_selection: true,
  require_deposit: false,
  deposit_percentage: 0.0,
};

export function BookingSettingsManagement({
  user,
  businessId,
}: BookingSettingsManagementProps) {
  const [settings, setSettings] = useState<BookingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBookingSettings();
  }, [user, businessId]);

  const loadBookingSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/booking-settings?user_id=${user.id}&business_id=${businessId}`
      );

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load booking settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (field: keyof BookingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveBookingSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/booking-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          business_id: businessId,
          ...settings,
        }),
      });

      if (response.ok) {
        alert('Booking settings saved successfully!');
        await loadBookingSettings();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to save booking settings');
      }
    } catch (error) {
      console.error('Failed to save booking settings:', error);
      alert('Failed to save booking settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Booking Settings Configuration
        </CardTitle>
        <CardDescription>
          Configure appointment booking rules, policies, and customer experience
          settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="booking-rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="booking-rules">Booking Rules</TabsTrigger>
            <TabsTrigger value="customer-settings">
              Customer Settings
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          {/* Booking Rules Tab */}
          <TabsContent value="booking-rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Time & Availability Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="advance_booking_days">
                      Advance Booking Days
                    </Label>
                    <Input
                      id="advance_booking_days"
                      type="number"
                      value={settings.advance_booking_days}
                      onChange={e =>
                        updateSetting(
                          'advance_booking_days',
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      max="365"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How far in advance customers can book
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="min_booking_notice_hours">
                      Minimum Notice (Hours)
                    </Label>
                    <Input
                      id="min_booking_notice_hours"
                      type="number"
                      value={settings.min_booking_notice_hours}
                      onChange={e =>
                        updateSetting(
                          'min_booking_notice_hours',
                          parseInt(e.target.value)
                        )
                      }
                      min="0"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum notice required for booking
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="default_slot_duration">
                      Slot Duration (Minutes)
                    </Label>
                    <Input
                      id="default_slot_duration"
                      type="number"
                      value={settings.default_slot_duration}
                      onChange={e =>
                        updateSetting(
                          'default_slot_duration',
                          parseInt(e.target.value)
                        )
                      }
                      min="15"
                      max="480"
                      step="15"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Default appointment duration
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="slot_buffer_minutes">
                      Buffer Time (Minutes)
                    </Label>
                    <Input
                      id="slot_buffer_minutes"
                      type="number"
                      value={settings.slot_buffer_minutes}
                      onChange={e =>
                        updateSetting(
                          'slot_buffer_minutes',
                          parseInt(e.target.value)
                        )
                      }
                      min="0"
                      max="60"
                      step="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Buffer time between appointments
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="booking_window_start">
                      Booking Window Start
                    </Label>
                    <Input
                      id="booking_window_start"
                      type="time"
                      value={settings.booking_window_start}
                      onChange={e =>
                        updateSetting('booking_window_start', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Earliest booking time
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="booking_window_end">
                      Booking Window End
                    </Label>
                    <Input
                      id="booking_window_end"
                      type="time"
                      value={settings.booking_window_end}
                      onChange={e =>
                        updateSetting('booking_window_end', e.target.value)
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Latest booking time
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max_bookings_per_day">
                      Max Bookings Per Day
                    </Label>
                    <Input
                      id="max_bookings_per_day"
                      type="number"
                      value={settings.max_bookings_per_day}
                      onChange={e =>
                        updateSetting(
                          'max_bookings_per_day',
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum bookings per day
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max_bookings_per_slot">
                      Max Bookings Per Slot
                    </Label>
                    <Input
                      id="max_bookings_per_slot"
                      type="number"
                      value={settings.max_bookings_per_slot}
                      onChange={e =>
                        updateSetting(
                          'max_bookings_per_slot',
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      max="10"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum bookings per time slot
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow_same_day_booking">
                        Allow Same-Day Booking
                      </Label>
                      <p className="text-xs text-gray-500">
                        Customers can book appointments for today
                      </p>
                    </div>
                    <Switch
                      id="allow_same_day_booking"
                      checked={settings.allow_same_day_booking}
                      onCheckedChange={checked =>
                        updateSetting('allow_same_day_booking', checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow_weekend_booking">
                        Allow Weekend Booking
                      </Label>
                      <p className="text-xs text-gray-500">
                        Enable bookings on weekends
                      </p>
                    </div>
                    <Switch
                      id="allow_weekend_booking"
                      checked={settings.allow_weekend_booking}
                      onCheckedChange={checked =>
                        updateSetting('allow_weekend_booking', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Settings Tab */}
          <TabsContent value="customer-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Customer Information Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_customer_info">
                      Require Customer Information
                    </Label>
                    <p className="text-xs text-gray-500">
                      Customers must provide personal details
                    </p>
                  </div>
                  <Switch
                    id="require_customer_info"
                    checked={settings.require_customer_info}
                    onCheckedChange={checked =>
                      updateSetting('require_customer_info', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_phone_number">
                      Require Phone Number
                    </Label>
                    <p className="text-xs text-gray-500">
                      Phone number is mandatory for booking
                    </p>
                  </div>
                  <Switch
                    id="require_phone_number"
                    checked={settings.require_phone_number}
                    onCheckedChange={checked =>
                      updateSetting('require_phone_number', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_email_confirmation">
                      Require Email Confirmation
                    </Label>
                    <p className="text-xs text-gray-500">
                      Send email confirmation for bookings
                    </p>
                  </div>
                  <Switch
                    id="require_email_confirmation"
                    checked={settings.require_email_confirmation}
                    onCheckedChange={checked =>
                      updateSetting('require_email_confirmation', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="online_booking_enabled">
                      Online Booking Enabled
                    </Label>
                    <p className="text-xs text-gray-500">
                      Allow customers to book online
                    </p>
                  </div>
                  <Switch
                    id="online_booking_enabled"
                    checked={settings.online_booking_enabled}
                    onCheckedChange={checked =>
                      updateSetting('online_booking_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_staff_names">Show Staff Names</Label>
                    <p className="text-xs text-gray-500">
                      Display staff names to customers
                    </p>
                  </div>
                  <Switch
                    id="show_staff_names"
                    checked={settings.show_staff_names}
                    onCheckedChange={checked =>
                      updateSetting('show_staff_names', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show_prices">Show Prices</Label>
                    <p className="text-xs text-gray-500">
                      Display service prices during booking
                    </p>
                  </div>
                  <Switch
                    id="show_prices"
                    checked={settings.show_prices}
                    onCheckedChange={checked =>
                      updateSetting('show_prices', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow_service_selection">
                      Allow Service Selection
                    </Label>
                    <p className="text-xs text-gray-500">
                      Customers can choose services during booking
                    </p>
                  </div>
                  <Switch
                    id="allow_service_selection"
                    checked={settings.allow_service_selection}
                    onCheckedChange={checked =>
                      updateSetting('allow_service_selection', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cancellation & Rescheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow_customer_cancellation">
                      Allow Customer Cancellation
                    </Label>
                    <p className="text-xs text-gray-500">
                      Customers can cancel their own appointments
                    </p>
                  </div>
                  <Switch
                    id="allow_customer_cancellation"
                    checked={settings.allow_customer_cancellation}
                    onCheckedChange={checked =>
                      updateSetting('allow_customer_cancellation', checked)
                    }
                  />
                </div>

                {settings.allow_customer_cancellation && (
                  <div>
                    <Label htmlFor="cancellation_notice_hours">
                      Cancellation Notice (Hours)
                    </Label>
                    <Input
                      id="cancellation_notice_hours"
                      type="number"
                      value={settings.cancellation_notice_hours}
                      onChange={e =>
                        updateSetting(
                          'cancellation_notice_hours',
                          parseInt(e.target.value)
                        )
                      }
                      min="0"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required notice for cancellation
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow_customer_reschedule">
                      Allow Customer Rescheduling
                    </Label>
                    <p className="text-xs text-gray-500">
                      Customers can reschedule appointments
                    </p>
                  </div>
                  <Switch
                    id="allow_customer_reschedule"
                    checked={settings.allow_customer_reschedule}
                    onCheckedChange={checked =>
                      updateSetting('allow_customer_reschedule', checked)
                    }
                  />
                </div>

                {settings.allow_customer_reschedule && (
                  <div>
                    <Label htmlFor="reschedule_notice_hours">
                      Reschedule Notice (Hours)
                    </Label>
                    <Input
                      id="reschedule_notice_hours"
                      type="number"
                      value={settings.reschedule_notice_hours}
                      onChange={e =>
                        updateSetting(
                          'reschedule_notice_hours',
                          parseInt(e.target.value)
                        )
                      }
                      min="0"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required notice for rescheduling
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send_booking_confirmation">
                      Send Booking Confirmation
                    </Label>
                    <p className="text-xs text-gray-500">
                      Email confirmation when booking is made
                    </p>
                  </div>
                  <Switch
                    id="send_booking_confirmation"
                    checked={settings.send_booking_confirmation}
                    onCheckedChange={checked =>
                      updateSetting('send_booking_confirmation', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send_reminder_email">
                      Send Reminder Emails
                    </Label>
                    <p className="text-xs text-gray-500">
                      Automatic reminder emails before appointments
                    </p>
                  </div>
                  <Switch
                    id="send_reminder_email"
                    checked={settings.send_reminder_email}
                    onCheckedChange={checked =>
                      updateSetting('send_reminder_email', checked)
                    }
                  />
                </div>

                {settings.send_reminder_email && (
                  <div>
                    <Label htmlFor="reminder_hours_before">
                      Reminder Hours Before
                    </Label>
                    <Input
                      id="reminder_hours_before"
                      type="number"
                      value={settings.reminder_hours_before}
                      onChange={e =>
                        updateSetting(
                          'reminder_hours_before',
                          parseInt(e.target.value)
                        )
                      }
                      min="1"
                      max="168"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Send reminder X hours before appointment
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="send_sms_reminders">
                      Send SMS Reminders
                    </Label>
                    <p className="text-xs text-gray-500">
                      Text message reminders (requires SMS service)
                    </p>
                  </div>
                  <Switch
                    id="send_sms_reminders"
                    checked={settings.send_sms_reminders}
                    onCheckedChange={checked =>
                      updateSetting('send_sms_reminders', checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment & Deposit Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require_deposit">Require Deposit</Label>
                    <p className="text-xs text-gray-500">
                      Require payment deposit for bookings
                    </p>
                  </div>
                  <Switch
                    id="require_deposit"
                    checked={settings.require_deposit}
                    onCheckedChange={checked =>
                      updateSetting('require_deposit', checked)
                    }
                  />
                </div>

                {settings.require_deposit && (
                  <div>
                    <Label htmlFor="deposit_percentage">
                      Deposit Percentage
                    </Label>
                    <Input
                      id="deposit_percentage"
                      type="number"
                      value={settings.deposit_percentage}
                      onChange={e =>
                        updateSetting(
                          'deposit_percentage',
                          parseFloat(e.target.value)
                        )
                      }
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Percentage of service price required as deposit
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Instructions & Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="booking_instructions">
                    Booking Instructions
                  </Label>
                  <Textarea
                    id="booking_instructions"
                    value={settings.booking_instructions || ''}
                    onChange={e =>
                      updateSetting('booking_instructions', e.target.value)
                    }
                    placeholder="Special instructions shown to customers during booking..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Instructions displayed during booking process
                  </p>
                </div>

                <div>
                  <Label htmlFor="terms_and_conditions">
                    Terms and Conditions
                  </Label>
                  <Textarea
                    id="terms_and_conditions"
                    value={settings.terms_and_conditions || ''}
                    onChange={e =>
                      updateSetting('terms_and_conditions', e.target.value)
                    }
                    placeholder="Terms and conditions customers must agree to..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Terms customers must agree to when booking
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-2 pt-6 border-t">
          <Button
            onClick={saveBookingSettings}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving Settings...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Save Booking Settings
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={loadBookingSettings}
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
