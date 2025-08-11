'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

import { User } from '@supabase/supabase-js';
import { StaffCalendarListing } from '@/components/appointments/StaffCalendarListing';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@/components/icons';

export default function AppointmentCalendarPage() {
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
          <p className="text-gray-600">Loading calendar configuration...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <StaffCalendarListing
          user={user}
          businessId={user.id}
          businessName={businessProfile?.business_name || 'Your Business'}
        />
      </div>
    </div>
  );
}
