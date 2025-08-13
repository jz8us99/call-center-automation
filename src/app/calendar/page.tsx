'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

import { User } from '@supabase/supabase-js';
import { CalendarConfigurationDashboard } from '@/components/settings/business/steps/step5-staff/CalendarConfigurationDashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@/components/icons';

export default function CalendarDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessProfile, setBusinessProfile] = useState<any>(null);

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

    getUser();
  }, []);

  const loadBusinessProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/business/profile?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar dashboard...</p>
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
              Please log in to access the calendar system
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
                Calendar Management System
              </CardTitle>
              <CardDescription className="text-lg">
                Comprehensive staff scheduling and appointment calendar
                management
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Staff Calendars</h3>
              <p className="text-gray-600 text-sm">
                Individual calendar management with custom availability settings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
              <p className="text-gray-600 text-sm">
                Business-wide operating hours and holiday management
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Appointment Booking
              </h3>
              <p className="text-gray-600 text-sm">
                Real-time availability and intelligent booking system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <CalendarConfigurationDashboard
          user={user}
          businessId={user.id}
          businessName={businessProfile?.business_name || 'Your Business'}
        />

        {/* System Features */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Calendar System Features</CardTitle>
              <CardDescription>
                Complete appointment and scheduling system capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">✅ Staff Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Individual staff calendars</li>
                    <li>• Custom availability settings</li>
                    <li>• Override office hours</li>
                    <li>• Vacation and time-off tracking</li>
                    <li>• Real-time availability status</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    ✅ Business Configuration
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Office hours by day of week</li>
                    <li>• Holiday and closure management</li>
                    <li>• Business-wide settings</li>
                    <li>• Color-coded calendar views</li>
                    <li>• Flexible scheduling rules</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ Smart Scheduling</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Conflict prevention</li>
                    <li>• Multi-year calendar support</li>
                    <li>• Appointment history tracking</li>
                    <li>• Real-time availability calculation</li>
                    <li>• Booking validation and rules</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">
                    🔄 Calendar Integrations
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Google Calendar sync</li>
                    <li>• Outlook calendar integration</li>
                    <li>• Calendly connection</li>
                    <li>• Two-way synchronization</li>
                    <li>• External booking detection</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">✅ Data Management</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 3-year appointment history</li>
                    <li>• Current + next year booking</li>
                    <li>• Audit trail and changes log</li>
                    <li>• Staff performance tracking</li>
                    <li>• Appointment analytics</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🎯 User Experience</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Intuitive calendar interface</li>
                    <li>• Mobile-responsive design</li>
                    <li>• Drag-and-drop scheduling</li>
                    <li>• Quick availability overview</li>
                    <li>• Real-time status updates</li>
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
                Follow these steps to set up your calendar system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    1. Configure Business Settings
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Set up your business-wide calendar preferences:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • Click &quot;Office Setup&quot; to configure office hours
                    </li>
                    <li>• Add business holidays and closure dates</li>
                    <li>• Set default working hours for staff</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    2. Setup Staff Calendars
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Configure individual staff availability:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • Click &quot;Configure Calendar&quot; for each staff
                      member
                    </li>
                    <li>• Set individual working hours and availability</li>
                    <li>• Add personal time-off and vacation days</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    3. Enable Online Booking
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Make your calendar system available for customers:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Test the appointment booking flow</li>
                    <li>• Configure booking rules and restrictions</li>
                    <li>• Share booking links with customers</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">
                    4. Connect External Calendars
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Integrate with existing calendar systems:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Connect Google Calendar for staff members</li>
                    <li>• Set up Outlook calendar synchronization</li>
                    <li>• Link Calendly for external bookings</li>
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
