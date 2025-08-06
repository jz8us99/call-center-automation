'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

import { User } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OfficeHoursSetup } from '@/components/calendar/OfficeHoursSetup';
import { HolidaysManagement } from '@/components/calendar/HolidaysManagement';
import { BookingSettingsManagement } from '@/components/calendar/BookingSettingsManagement';
import {
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  SettingsIcon,
} from '@/components/icons';

export default function CalendarSetupPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('office-hours');

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await loadBusinessProfile(user.id);
      }

      setLoading(false);
    };

    // Check URL parameters for tab selection
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'holidays') {
      setActiveTab('holidays');
    } else if (tabParam === 'booking-settings') {
      setActiveTab('booking-settings');
    }

    getUser();
  }, []);

  const loadBusinessProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/business-profile?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    }
  };

  const handleBackToCalendar = () => {
    window.location.href = '/appointments/calendar';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar setup...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to access calendar setup
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => (window.location.href = '/auth')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBackToCalendar}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Calendar
                </Button>
                <div className="text-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Calendar Setup
                  </h1>
                  <p className="text-sm text-gray-600">
                    {businessProfile?.business_name || 'Your Business'}
                  </p>
                </div>
                <div className="w-[120px]"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Calendar System Setup
              </CardTitle>
              <CardDescription className="text-lg">
                Configure your business hours, holidays, and calendar
                preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Setup Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
              <p className="text-gray-600 text-sm">
                Set your business operating hours for each day of the week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Holidays</h3>
              <p className="text-gray-600 text-sm">
                Add business holidays and closure dates throughout the year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <SettingsIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Booking Settings</h3>
              <p className="text-gray-600 text-sm">
                Configure appointment booking rules and customer policies
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Office Hours</h3>
                  <p className="text-sm text-blue-700">
                    Configure business operating hours
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('office-hours')}
                  variant="outline"
                  className="bg-white"
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Setup Hours
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">
                    Holiday Schedule
                  </h3>
                  <p className="text-sm text-green-700">
                    Manage business holidays and closures
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('holidays')}
                  variant="outline"
                  className="bg-white"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Manage Holidays
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-purple-900">
                    Booking Settings
                  </h3>
                  <p className="text-sm text-purple-700">
                    Configure appointment booking rules
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('booking-settings')}
                  variant="outline"
                  className="bg-white"
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Setup Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="office-hours"
                  className="flex items-center gap-2"
                >
                  <ClockIcon className="h-4 w-4" />
                  Office Hours
                </TabsTrigger>
                <TabsTrigger
                  value="holidays"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Holidays
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

          <TabsContent value="office-hours">
            <OfficeHoursSetup
              user={user}
              businessId={user.id}
              onSaved={() => {
                // Could trigger a refresh or show success message
              }}
            />
          </TabsContent>

          <TabsContent value="holidays">
            <HolidaysManagement
              user={user}
              businessId={user.id}
              currentYear={new Date().getFullYear()}
            />
          </TabsContent>

          <TabsContent value="booking-settings">
            <BookingSettingsManagement user={user} businessId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Setup Instructions */}
        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">
                Setup Instructions
              </CardTitle>
              <CardDescription className="text-blue-700">
                Follow these steps to complete your calendar setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    1. Configure Office Hours
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Set operating hours for each day of the week</li>
                    <li>
                      • Use "Copy to all" to apply the same hours across days
                    </li>
                    <li>• Turn off days when you're closed</li>
                    <li>• These become default hours for all staff</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    2. Update Holiday Schedule
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Add holidays when your business is closed</li>
                    <li>• Use "Select Bank Holidays" for federal holidays</li>
                    <li>• Mark holidays as recurring for annual events</li>
                    <li>• Holidays override office hours automatically</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    3. Configure Booking Settings
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Set booking rules and time limits</li>
                    <li>• Configure customer requirements</li>
                    <li>• Enable notifications and reminders</li>
                    <li>• Add terms and booking instructions</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                <p className="text-sm text-blue-800 mb-4">
                  After completing this setup, you can configure individual
                  staff calendars and availability. Staff members can override
                  office hours for their personal schedules, but holidays and
                  booking settings will apply to all online bookings. Your
                  appointment system will be ready for customers!
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      (window.location.href = '/appointments?tab=step5-config')
                    }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Go to Step 5 Configuration
                  </Button>
                  <Button
                    onClick={() => (window.location.href = '/appointments')}
                    variant="outline"
                    className="bg-white"
                  >
                    Complete Appointment System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
