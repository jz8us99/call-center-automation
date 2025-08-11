'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

import { User } from '@supabase/supabase-js';
import { useParams, useRouter } from 'next/navigation';
import { StaffCalendarView } from '@/components/calendar/StaffCalendarView';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, CalendarIcon } from '@/components/icons';

export default function StaffCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffMember, setStaffMember] = useState<any>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const staffId = params.staffId as string;

  useEffect(() => {
    const supabase = createClient();

    const initializePage = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user && staffId) {
        await Promise.all([
          loadStaffMember(user.id, staffId),
          loadBusinessProfile(user.id),
        ]);
      }

      setLoading(false);
    };

    initializePage();
  }, [staffId]);

  const loadStaffMember = async (userId: string, staffId: string) => {
    try {
      const response = await fetch(
        `/api/business/staff?user_id=${userId}&staff_id=${staffId}`
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        setError(
          `Failed to load staff data: ${response.status} - ${errorData}`
        );
        return;
      }

      const data = await response.json();
      console.log('Staff API response:', data);

      if (data.staff && data.staff.length > 0) {
        // Find the specific staff member by ID if provided
        const targetStaff =
          data.staff.find((staff: any) => staff.id === staffId) ||
          data.staff[0];
        setStaffMember(targetStaff);
      }
    } catch (error) {
      console.error('Failed to load staff member:', error);
    }
  };

  const loadBusinessProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/business/profile?user_id=${userId}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          'Business Profile API Error:',
          response.status,
          errorData
        );
        return;
      }

      const data = await response.json();
      console.log('Business Profile API response:', data);
      setBusinessProfile(data.profile);
    } catch (error) {
      console.error('Failed to load business profile:', error);
    }
  };

  const handleBackToCalendarDashboard = () => {
    router.push('/calendar');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff calendar...</p>
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
              Please log in to access calendar configuration
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Error Loading Calendar</CardTitle>
            <CardDescription>
              There was an error loading the staff calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
            <Button onClick={handleBackToCalendarDashboard}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Calendar Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Staff Member Not Found</CardTitle>
            <CardDescription>
              The requested staff member could not be found. Staff ID: {staffId}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              <p>This could happen if:</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• The staff member doesn't exist</li>
                <li>• You don't have permission to access this staff member</li>
                <li>• The staff member is no longer active</li>
              </ul>
            </div>
            <Button onClick={handleBackToCalendarDashboard}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Calendar Dashboard
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
                  onClick={handleBackToCalendarDashboard}
                  className="flex items-center gap-2"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Calendar Dashboard
                </Button>
                <div className="text-center">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Staff Calendar Management
                  </h1>
                  <p className="text-sm text-gray-600">
                    {businessProfile?.business_name || 'Your Business'}
                  </p>
                </div>
                <div className="w-[160px]"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Calendar Component */}
        <StaffCalendarView
          user={user}
          staffId={staffId}
          businessId={user.id}
          isOwnerView={true}
          allowSelfEdit={user.id === staffMember.user_id}
        />
      </div>
    </div>
  );
}
