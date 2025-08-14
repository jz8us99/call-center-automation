'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/api-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarIcon,
  RefreshIcon,
  XCircleIcon,
} from '@/components/icons';
import { CheckCircle as CheckCircleIcon, Link as LinkIcon } from 'lucide-react';

interface CalendarIntegration {
  provider: 'google' | 'outlook' | 'calendly';
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
  staffId?: string;
}

interface StaffCalendar {
  id: string;
  display_name: string;
  calendar_provider?: string;
  provider_account_id?: string;
  last_sync?: string;
}

interface CalendarIntegrationsProps {
  businessId: string;
}

export function CalendarIntegrations({ businessId }: CalendarIntegrationsProps) {
  const [staffCalendars, setStaffCalendars] = useState<StaffCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadStaffCalendars();
  }, [businessId]);

  const loadStaffCalendars = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `/api/business/staff-members?business_id=${businessId}`
      );

      if (response.ok) {
        const data = await response.json();
        setStaffCalendars(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load staff calendars:', error);
      toast.error('Failed to load calendar integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = async (
    staffId: string,
    provider: 'google' | 'outlook' | 'calendly'
  ) => {
    try {
      setConnecting(`${staffId}-${provider}`);
      
      // Initiate OAuth flow
      const response = await authenticatedFetch('/api/calendar/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          provider,
          redirectUri: `${window.location.origin}/api/calendar/oauth/callback`
        })
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        
        // Open OAuth window
        const authWindow = window.open(
          authUrl,
          'calendar-auth',
          'width=500,height=600'
        );

        // Listen for OAuth completion
        const checkInterval = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkInterval);
            loadStaffCalendars();
            setConnecting(null);
          }
        }, 1000);
      } else {
        toast.error(`Failed to connect ${provider} calendar`);
      }
    } catch (error) {
      console.error('Failed to connect calendar:', error);
      toast.error('Failed to connect calendar');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnectCalendar = async (staffId: string) => {
    try {
      const response = await authenticatedFetch(
        `/api/calendar/oauth/disconnect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId })
        }
      );

      if (response.ok) {
        toast.success('Calendar disconnected successfully');
        loadStaffCalendars();
      } else {
        toast.error('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      toast.error('Failed to disconnect calendar');
    }
  };

  const handleSyncCalendar = async (staffId: string) => {
    try {
      const response = await authenticatedFetch(`/api/calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId })
      });

      if (response.ok) {
        toast.success('Calendar synced successfully');
        loadStaffCalendars();
      } else {
        toast.error('Failed to sync calendar');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      toast.error('Failed to sync calendar');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📆';
      case 'calendly':
        return '🗓️';
      default:
        return <CalendarIcon className="h-5 w-5" />;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-100 text-blue-800';
      case 'outlook':
        return 'bg-indigo-100 text-indigo-800';
      case 'calendly':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshIcon className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2">Loading calendar integrations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar Integrations
        </CardTitle>
        <CardDescription>
          Connect staff calendars to automatically sync appointments and availability
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {Array.isArray(staffCalendars) && staffCalendars.map((staff) => (
            <div
              key={staff.id}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{staff.display_name}</h4>
                  {staff.calendar_provider ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getProviderColor(staff.calendar_provider)}>
                        <span className="mr-1">
                          {getProviderIcon(staff.calendar_provider)}
                        </span>
                        {staff.calendar_provider}
                      </Badge>
                      {staff.provider_account_id && (
                        <span className="text-sm text-gray-600">
                          {staff.provider_account_id}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      No calendar connected
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {staff.calendar_provider ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncCalendar(staff.id)}
                      >
                        <RefreshIcon className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectCalendar(staff.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnectCalendar(staff.id, 'google')}
                        disabled={connecting === `${staff.id}-google`}
                      >
                        {connecting === `${staff.id}-google` ? (
                          <RefreshIcon className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <LinkIcon className="h-4 w-4 mr-1" />
                        )}
                        Google Calendar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnectCalendar(staff.id, 'outlook')}
                        disabled={connecting === `${staff.id}-outlook`}
                      >
                        {connecting === `${staff.id}-outlook` ? (
                          <RefreshIcon className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <LinkIcon className="h-4 w-4 mr-1" />
                        )}
                        Outlook
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConnectCalendar(staff.id, 'calendly')}
                        disabled={connecting === `${staff.id}-calendly`}
                      >
                        {connecting === `${staff.id}-calendly` ? (
                          <RefreshIcon className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <LinkIcon className="h-4 w-4 mr-1" />
                        )}
                        Calendly
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {staff.last_sync && (
                <div className="text-sm text-gray-500">
                  Last synced: {new Date(staff.last_sync).toLocaleString()}
                </div>
              )}
            </div>
          ))}

          {(!Array.isArray(staffCalendars) || staffCalendars.length === 0) && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No staff members found</p>
              <p className="text-sm text-gray-500 mt-1">
                Add staff members in Step 5 to configure calendar integrations
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}