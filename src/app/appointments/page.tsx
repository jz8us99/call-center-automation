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
import { AppointmentBookingInterface } from '@/components/booking/AppointmentBookingInterface';
import { AppointmentManagementDashboard } from '@/components/appointments/AppointmentManagementDashboard';
import { Step5AppointmentSystem } from '@/components/appointments/Step5AppointmentSystem';
import { CalendarIcon, UserIcon, ClockIcon } from '@/components/icons';

export default function AppointmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('booking');

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    // Check URL parameters for tab selection
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'step5-config') {
      setActiveTab('step5-config');
    }

    getUser();
  }, []);

  const handleBookingComplete = (appointmentId: string) => {
    console.log('Booking completed:', appointmentId);
    // Could switch to management tab or show success message
    setActiveTab('management');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              Please log in to access the appointment system
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
        {/* Header */}
        <div className="mb-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <CalendarIcon className="h-8 w-8" />
                Appointment System
              </CardTitle>
              <CardDescription className="text-lg">
                Complete appointment booking and management solution
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Online Booking</h3>
              <p className="text-gray-600 text-sm">
                Customer-friendly booking interface with real-time availability
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <UserIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Staff Management</h3>
              <p className="text-gray-600 text-sm">
                Manage staff schedules, availability, and calendar
                configurations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <ClockIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
              <p className="text-gray-600 text-sm">
                Intelligent time slot calculation with conflict prevention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Quick Access - Appointment System
            </CardTitle>
            <CardDescription className="text-blue-700">
              Access key appointment system features and calendar management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-blue-50"
                onClick={() => (window.location.href = '/calendar')}
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Staff Calendars</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  Configure individual staff availability and schedules
                </p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-green-50"
                onClick={() => (window.location.href = '/calendar/setup')}
              >
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Business Hours</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  Set office hours and operating schedule
                </p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-purple-50"
                onClick={() =>
                  (window.location.href = '/calendar/setup?tab=holidays')
                }
              >
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Holiday Schedule</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  Manage business holidays and closures
                </p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-orange-50"
                onClick={() => setActiveTab('management')}
              >
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold">Today's Appointments</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  View and manage today's appointments
                </p>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 bg-white hover:bg-indigo-50"
                onClick={() => setActiveTab('step5-config')}
              >
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold">Step 5 Config</span>
                </div>
                <p className="text-sm text-gray-600 text-left">
                  Complete appointment system setup
                </p>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="booking"
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="h-4 w-4" />
                  Customer Booking
                </TabsTrigger>
                <TabsTrigger
                  value="management"
                  className="flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  Staff Management
                </TabsTrigger>
                <TabsTrigger
                  value="step5-config"
                  className="flex items-center gap-2"
                >
                  <ClockIcon className="h-4 w-4" />
                  Step 5: Configuration
                </TabsTrigger>
              </TabsList>
            </CardHeader>
          </Card>

          <TabsContent value="booking" className="space-y-6">
            <AppointmentBookingInterface
              businessId={user.id}
              businessName="Demo Business"
              onBookingComplete={handleBookingComplete}
            />
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <AppointmentManagementDashboard user={user} businessId={user.id} />
          </TabsContent>

          <TabsContent value="step5-config" className="space-y-6">
            <Step5AppointmentSystem user={user} businessId={user.id} />
          </TabsContent>
        </Tabs>

        {/* Calendar Management Actions */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">
                📅 Step 5: Calendar System Management
              </CardTitle>
              <CardDescription className="text-blue-700">
                Complete calendar and scheduling system with staff availability
                management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Staff Calendar Configuration
                      </h4>
                      <p className="text-sm text-gray-600">
                        Individual staff scheduling
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Configure individual staff availability</li>
                    <li>• Color-coded calendar views</li>
                    <li>• Override office hours per staff</li>
                    <li>• Vacation and time-off management</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => (window.location.href = '/calendar')}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Manage Staff Calendars
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Business Hours Setup
                      </h4>
                      <p className="text-sm text-gray-600">
                        Operating hours configuration
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Set hours for each day of week</li>
                    <li>• Copy hours to multiple days</li>
                    <li>• Enable/disable specific days</li>
                    <li>• Default hours for all staff</li>
                  </ul>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => (window.location.href = '/calendar/setup')}
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Configure Business Hours
                  </Button>
                </div>

                <div className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Holiday Management
                      </h4>
                      <p className="text-sm text-gray-600">
                        Business closures & holidays
                      </p>
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Add business holidays</li>
                    <li>• Recurring annual holidays</li>
                    <li>• Override staff availability</li>
                    <li>• Multi-year holiday planning</li>
                  </ul>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      (window.location.href = '/calendar/setup?tab=holidays')
                    }
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Update Holiday Schedule
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">
                      Calendar System Ready
                    </h4>
                    <p className="text-sm text-blue-800 mt-1 mb-3">
                      Your appointment calendar system is fully configured and
                      ready for online bookings. Staff can manage their
                      individual schedules while respecting business hours and
                      holidays.
                    </p>
                    <Button
                      onClick={() => setActiveTab('step5-config')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Access Step 5 Configuration
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Features */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
              <CardDescription>
                Comprehensive appointment booking system capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">
                    ✅ Database Integration
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Customer management</li>
                    <li>• Appointment types</li>
                    <li>• Staff calendars</li>
                    <li>• Business holidays</li>
                    <li>• Appointment history</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ Smart Scheduling</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Real-time availability</li>
                    <li>• Conflict prevention</li>
                    <li>• Buffer time management</li>
                    <li>• Business rules validation</li>
                    <li>• Holiday exclusions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ User Experience</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Step-by-step booking</li>
                    <li>• Visual calendar interface</li>
                    <li>• Mobile-responsive design</li>
                    <li>• Instant confirmations</li>
                    <li>• Status management</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ Staff Tools</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Calendar configuration</li>
                    <li>• Availability overrides</li>
                    <li>• Appointment dashboard</li>
                    <li>• Status updates</li>
                    <li>• Customer information</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ Business Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Service configuration</li>
                    <li>• Pricing management</li>
                    <li>• Working hours setup</li>
                    <li>• Holiday management</li>
                    <li>• Booking rules</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🔄 Future Enhancements</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Email notifications</li>
                    <li>• SMS reminders</li>
                    <li>• Payment integration</li>
                    <li>• Analytics dashboard</li>
                    <li>• Calendar sync</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Getting Started</CardTitle>
              <CardDescription className="text-blue-700">
                Follow these steps to set up your appointment system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    1. Database Setup
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Run the SQL schema files to create the required database
                    tables:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • <code>staff-calendar-schema.sql</code>
                    </li>
                    <li>
                      • <code>appointment-booking-schema.sql</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    2. Staff Configuration
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Configure your staff and their availability:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Add staff members</li>
                    <li>• Configure working hours</li>
                    <li>• Set up calendar availability</li>
                    <li>• Add business holidays</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    3. Service Setup
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Define your appointment types and services:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Create appointment types</li>
                    <li>• Set duration and pricing</li>
                    <li>• Configure booking rules</li>
                    <li>• Enable online booking</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    4. Go Live
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Your appointment system is ready to use:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Test the booking flow</li>
                    <li>• Train staff on management tools</li>
                    <li>• Share booking link with customers</li>
                    <li>• Monitor appointments daily</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
