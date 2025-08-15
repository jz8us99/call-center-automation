'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  CalendarIcon,
  LinkIcon,
  CheckIcon,
  XIcon,
  RefreshIcon,
  TrashIcon,
  AlertIcon,
  UserIcon,
  HelpIcon,
} from '@/components/icons';

interface CalendarCredential {
  id: string;
  staff_id: string;
  provider: 'google' | 'outlook' | 'calendly';
  provider_email: string;
  calendar_name: string;
  sync_enabled: boolean;
  sync_direction: 'inbound' | 'outbound' | 'bidirectional';
  last_sync_at: string | null;
  is_active: boolean;
  staff_members: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface StaffCalendarIntegrationProps {
  businessId: string;
  staffMembers: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

export function StaffCalendarIntegration({
  businessId,
  staffMembers,
}: StaffCalendarIntegrationProps) {
  const [credentials, setCredentials] = useState<CalendarCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStaff, setConnectingStaff] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

  useEffect(() => {
    loadCredentials();
    // Auto-select staff member if only one is provided
    if (staffMembers.length === 1) {
      setSelectedStaff(staffMembers[0].id);
    }
  }, [businessId, staffMembers]);

  const loadCredentials = async () => {
    try {
      setLoading(true);

      // Skip API call if businessId is 'temp' (no business profile loaded yet)
      if (businessId === 'temp') {
        setCredentials([]);
        setLoading(false);
        return;
      }

      const response = await fetch(
        `/api/staff/calendar-integration?business_id=${businessId}`
      );
      const data = await response.json();
      if (response.ok) {
        setCredentials(data.credentials || []);
      } else {
        console.error('Failed to load calendar credentials:', data.error);
      }
    } catch (error) {
      console.error('Error loading calendar credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleCalendar = async (staffId: string) => {
    try {
      setConnectingStaff(staffId);

      const state = encodeURIComponent(
        JSON.stringify({
          business_id: businessId,
          staff_id: staffId,
        })
      );

      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: `${window.location.origin}/api/calendar/google/callback`,
        response_type: 'code',
        scope:
          'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent',
        state,
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      setConnectingStaff(null);
    }
  };

  const connectOutlookCalendar = async (staffId: string) => {
    try {
      setConnectingStaff(staffId);

      const state = encodeURIComponent(
        JSON.stringify({
          business_id: businessId,
          staff_id: staffId,
        })
      );

      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
        redirect_uri: `${window.location.origin}/api/calendar/outlook/callback`,
        response_type: 'code',
        scope:
          'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read',
        state,
      });

      window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
    } catch (error) {
      console.error('Error connecting Outlook Calendar:', error);
      setConnectingStaff(null);
    }
  };

  const connectCalendlyCalendar = async (staffId: string) => {
    // For Calendly, we'd implement their OAuth flow
    // This is a placeholder for now
    alert('Calendly integration coming soon!');
  };

  const openGoogleSetupGuide = () => {
    const guideContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Calendar Setup Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { background: #4285f4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .step { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #4285f4; }
        .code { background: #e8f0fe; padding: 10px; border-radius: 4px; font-family: monospace; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 Google Calendar Integration Setup</h1>
        <p>Follow these steps to enable Google Calendar integration for your staff</p>
    </div>

    <div class="step">
        <h3>Step 1: Access Google Cloud Console</h3>
        <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></p>
        <p>2. Sign in with your Google account</p>
    </div>

    <div class="step">
        <h3>Step 2: Create or Select Project</h3>
        <p>1. Click the project dropdown at the top</p>
        <p>2. Either select an existing project or click "New Project"</p>
        <p>3. Project name: <code>call-center-automation</code></p>
    </div>

    <div class="step">
        <h3>Step 3: Enable Google Calendar API</h3>
        <p>1. Go to "APIs & Services" → "Library"</p>
        <p>2. Search for "Google Calendar API"</p>
        <p>3. Click on it and press "Enable"</p>
    </div>

    <div class="step">
        <h3>Step 4: Configure OAuth Consent Screen</h3>
        <p>1. Go to "APIs & Services" → "OAuth consent screen"</p>
        <p>2. Choose "External" user type</p>
        <p>3. Fill in required information:</p>
        <ul>
            <li><strong>App name:</strong> Call Center Calendar Integration</li>
            <li><strong>User support email:</strong> Your email address</li>
            <li><strong>Developer contact:</strong> Your email address</li>
        </ul>
        <p>4. In Scopes section, add:</p>
        <div class="code">
            https://www.googleapis.com/auth/calendar.readonly<br>
            https://www.googleapis.com/auth/userinfo.email
        </div>
    </div>

    <div class="step">
        <h3>Step 5: Create OAuth Credentials</h3>
        <p>1. Go to "APIs & Services" → "Credentials"</p>
        <p>2. Click "Create Credentials" → "OAuth client ID"</p>
        <p>3. Choose "Web application"</p>
        <p>4. <strong>Name:</strong> Call Center App</p>
        <p>5. <strong>Authorized redirect URIs:</strong></p>
        <div class="code">http://localhost:19080/api/calendar/google/callback</div>
        <p>6. Click "Create"</p>
    </div>

    <div class="step">
        <h3>Step 6: Update Environment Variables</h3>
        <p>1. Copy the Client ID and Client Secret from the popup</p>
        <p>2. Update your .env file:</p>
        <div class="code">
            GOOGLE_CLIENT_ID=your_client_id_here<br>
            GOOGLE_CLIENT_SECRET=your_client_secret_here
        </div>
        <p>3. Restart your development server</p>
    </div>

    <div class="warning">
        <strong>⚠️ Important:</strong> The redirect URI must match exactly: 
        <code>http://localhost:19080/api/calendar/google/callback</code>
    </div>

    <div class="step">
        <h3>Troubleshooting</h3>
        <ul>
            <li>If you get "access blocked" error, check redirect URIs match exactly</li>
            <li>If you get "app not verified" warning, click "Advanced" → "Go to app"</li>
            <li>Make sure APIs are enabled and OAuth consent screen is configured</li>
            <li>For development, add yourself as a test user in OAuth consent screen</li>
        </ul>
    </div>
</body>
</html>`;

    const newWindow = window.open(
      '',
      '_blank',
      'width=900,height=700,scrollbars=yes'
    );
    if (newWindow) {
      newWindow.document.write(guideContent);
      newWindow.document.close();
    }
  };

  const openOutlookSetupGuide = () => {
    const guideContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microsoft Outlook Setup Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { background: #0078d4; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .step { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #0078d4; }
        .code { background: #e1f5fe; padding: 10px; border-radius: 4px; font-family: monospace; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 Microsoft Outlook Integration Setup</h1>
        <p>Follow these steps to enable Outlook Calendar integration for your staff</p>
    </div>

    <div class="step">
        <h3>Step 1: Access Azure Portal</h3>
        <p>1. Go to <a href="https://portal.azure.com/" target="_blank">Azure Portal</a></p>
        <p>2. Sign in with your Microsoft account</p>
    </div>

    <div class="step">
        <h3>Step 2: Register Application</h3>
        <p>1. Go to "Azure Active Directory" → "App registrations"</p>
        <p>2. Click "New registration"</p>
        <p>3. Fill in:</p>
        <ul>
            <li><strong>Name:</strong> Call Center Calendar Integration</li>
            <li><strong>Supported account types:</strong> Accounts in any organizational directory and personal Microsoft accounts</li>
            <li><strong>Redirect URI:</strong> Web</li>
        </ul>
        <div class="code">http://localhost:19080/api/calendar/outlook/callback</div>
    </div>

    <div class="step">
        <h3>Step 3: Configure API Permissions</h3>
        <p>1. In your app registration, go to "API permissions"</p>
        <p>2. Click "Add a permission" → "Microsoft Graph"</p>
        <p>3. Choose "Delegated permissions"</p>
        <p>4. Add these permissions:</p>
        <ul>
            <li>Calendars.ReadWrite</li>
            <li>User.Read</li>
        </ul>
        <p>5. Click "Grant admin consent" (if you're an admin)</p>
    </div>

    <div class="step">
        <h3>Step 4: Get Client Credentials</h3>
        <p>1. Go to "Certificates & secrets"</p>
        <p>2. Click "New client secret"</p>
        <p>3. Add description and set expiration</p>
        <p>4. Copy the client secret value immediately (it won't be shown again)</p>
        <p>5. Go to "Overview" and copy the "Application (client) ID"</p>
    </div>

    <div class="step">
        <h3>Step 5: Update Environment Variables</h3>
        <p>Add these to your .env file:</p>
        <div class="code">
            NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your_application_id_here<br>
            MICROSOFT_CLIENT_SECRET=your_client_secret_here
        </div>
        <p>Restart your development server</p>
    </div>

    <div class="warning">
        <strong>⚠️ Important:</strong> The redirect URI must match exactly: 
        <code>http://localhost:19080/api/calendar/outlook/callback</code>
    </div>

    <div class="step">
        <h3>Troubleshooting</h3>
        <ul>
            <li>Make sure redirect URI is configured correctly</li>
            <li>Verify API permissions are granted</li>
            <li>Check that client secret hasn't expired</li>
            <li>Ensure you're using the correct tenant ID if using organizational accounts</li>
        </ul>
    </div>
</body>
</html>`;

    const newWindow = window.open(
      '',
      '_blank',
      'width=900,height=700,scrollbars=yes'
    );
    if (newWindow) {
      newWindow.document.write(guideContent);
      newWindow.document.close();
    }
  };

  const openCalendlySetupGuide = () => {
    const guideContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendly Setup Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { background: #006bff; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .step { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #006bff; }
        .code { background: #e3f2fd; padding: 10px; border-radius: 4px; font-family: monospace; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Calendly Integration Setup</h1>
        <p>Follow these steps to enable Calendly integration for your staff</p>
    </div>

    <div class="info">
        <strong>📝 Note:</strong> Calendly integration is currently in development. This guide shows the planned implementation.
    </div>

    <div class="step">
        <h3>Step 1: Access Calendly Developer Portal</h3>
        <p>1. Go to <a href="https://developer.calendly.com/" target="_blank">Calendly Developer Portal</a></p>
        <p>2. Sign in with your Calendly account</p>
        <p>3. If you don't have a Calendly account, create one at <a href="https://calendly.com/" target="_blank">calendly.com</a></p>
    </div>

    <div class="step">
        <h3>Step 2: Create OAuth Application</h3>
        <p>1. In the developer portal, go to "My Apps"</p>
        <p>2. Click "Create new app"</p>
        <p>3. Fill in application details:</p>
        <ul>
            <li><strong>App name:</strong> Call Center Calendar Integration</li>
            <li><strong>Description:</strong> Staff calendar integration for appointment booking</li>
            <li><strong>Redirect URI:</strong></li>
        </ul>
        <div class="code">http://localhost:19080/api/calendar/calendly/callback</div>
    </div>

    <div class="step">
        <h3>Step 3: Configure Webhooks (Optional)</h3>
        <p>1. In your app settings, configure webhooks for real-time updates</p>
        <p>2. Webhook URL:</p>
        <div class="code">http://localhost:19080/api/calendar/calendly/webhook</div>
        <p>3. Subscribe to events:</p>
        <ul>
            <li>invitee.created</li>
            <li>invitee.canceled</li>
        </ul>
    </div>

    <div class="step">
        <h3>Step 4: Get API Credentials</h3>
        <p>1. From your app dashboard, copy:</p>
        <ul>
            <li>Client ID</li>
            <li>Client Secret</li>
        </ul>
        <p>2. Note your Calendly organization URI</p>
    </div>

    <div class="step">
        <h3>Step 5: Update Environment Variables</h3>
        <p>Add these to your .env file:</p>
        <div class="code">
            NEXT_PUBLIC_CALENDLY_CLIENT_ID=your_client_id_here<br>
            CALENDLY_CLIENT_SECRET=your_client_secret_here<br>
            CALENDLY_WEBHOOK_SECRET=your_webhook_secret_here
        </div>
        <p>Restart your development server</p>
    </div>

    <div class="warning">
        <strong>🚧 Development Status:</strong> Calendly integration is currently being implemented. 
        The OAuth flow and API integration will be available in a future update.
    </div>

    <div class="step">
        <h3>Available Calendly Features (When Implemented)</h3>
        <ul>
            <li>View staff availability from Calendly</li>
            <li>Sync booked appointments</li>
            <li>Real-time webhook notifications</li>
            <li>Integration with existing calendar events</li>
        </ul>
    </div>

    <div class="step">
        <h3>Current Alternatives</h3>
        <p>While Calendly integration is in development, you can:</p>
        <ul>
            <li>Use Google Calendar integration to sync with your Google calendar</li>
            <li>Use Outlook integration to sync with Microsoft calendars</li>
            <li>Manually manage availability through the staff calendar interface</li>
        </ul>
    </div>
</body>
</html>`;

    const newWindow = window.open(
      '',
      '_blank',
      'width=900,height=700,scrollbars=yes'
    );
    if (newWindow) {
      newWindow.document.write(guideContent);
      newWindow.document.close();
    }
  };

  const updateSyncSettings = async (
    credentialId: string,
    updates: Partial<CalendarCredential>
  ) => {
    try {
      // This would call an API to update sync settings
      console.log('Updating sync settings:', credentialId, updates);
      await loadCredentials(); // Refresh the list
    } catch (error) {
      console.error('Error updating sync settings:', error);
    }
  };

  const disconnectCalendar = async (credentialId: string) => {
    try {
      const response = await fetch(
        `/api/staff/calendar-integration?credential_id=${credentialId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await loadCredentials();
      } else {
        console.error('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔗'; // Google icon
      case 'outlook':
        return '📅'; // Outlook icon
      case 'calendly':
        return '📋'; // Calendly icon
      default:
        return '📊';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Outlook Calendar';
      case 'calendly':
        return 'Calendly';
      default:
        return provider;
    }
  };

  const getSyncDirectionText = (direction: string) => {
    switch (direction) {
      case 'inbound':
        return 'External → System';
      case 'outbound':
        return 'System → External';
      case 'bidirectional':
        return 'Both Ways';
      default:
        return direction;
    }
  };

  if (loading && businessId !== 'temp') {
    return (
      <Card className="dark:bg-gray-800">
        <CardContent className="py-6 dark:bg-gray-800">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
            <CalendarIcon className="h-5 w-5" />
            <span>Staff Calendar Integration</span>
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            Connect staff calendars to sync availability and appointments in
            real-time
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Connect New Calendar */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="dark:text-gray-100">Connect Calendar</CardTitle>
          <CardDescription className="dark:text-gray-300">
            {staffMembers.length === 1
              ? `Connect ${staffMembers[0].first_name}'s external calendar to sync availability`
              : "Connect a staff member's external calendar to sync their availability"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 dark:bg-gray-800">
          {staffMembers.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Staff Member
              </label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} ({staff.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedStaff && (
            <div>
              {staffMembers.length === 1 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      {staffMembers[0].first_name} {staffMembers[0].last_name}
                    </span>
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      ({staffMembers[0].email})
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {/* Google Calendar */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => connectGoogleCalendar(selectedStaff)}
                    disabled={connectingStaff === selectedStaff}
                    className="flex items-center space-x-2 flex-1"
                    variant="outline"
                  >
                    <span>🔗</span>
                    <span>Connect Google Calendar</span>
                    {connectingStaff === selectedStaff && (
                      <RefreshIcon className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                  <Button
                    onClick={openGoogleSetupGuide}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Setup Guide"
                  >
                    <HelpIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Outlook Calendar */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => connectOutlookCalendar(selectedStaff)}
                    disabled={connectingStaff === selectedStaff}
                    className="flex items-center space-x-2 flex-1"
                    variant="outline"
                  >
                    <span>📅</span>
                    <span>Connect Outlook</span>
                    {connectingStaff === selectedStaff && (
                      <RefreshIcon className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                  <Button
                    onClick={openOutlookSetupGuide}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Setup Guide"
                  >
                    <HelpIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendly */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => connectCalendlyCalendar(selectedStaff)}
                    disabled={connectingStaff === selectedStaff}
                    className="flex items-center space-x-2 flex-1"
                    variant="outline"
                  >
                    <span>📋</span>
                    <span>Connect Calendly</span>
                    {connectingStaff === selectedStaff && (
                      <RefreshIcon className="h-4 w-4 animate-spin" />
                    )}
                  </Button>
                  <Button
                    onClick={openCalendlySetupGuide}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Setup Guide"
                  >
                    <HelpIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Calendars */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="dark:text-gray-100">
            Connected Calendars ({credentials.length})
          </CardTitle>
          <CardDescription className="dark:text-gray-300">
            Manage existing calendar connections and sync settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 dark:bg-gray-800">
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No calendar integrations configured</p>
              <p className="text-sm">
                Connect staff calendars to enable real-time availability sync
              </p>
            </div>
          ) : (
            credentials.map(credential => (
              <Card
                key={credential.id}
                className="border border-gray-200 dark:border-gray-600 dark:bg-gray-700"
              >
                <CardContent className="p-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getProviderIcon(credential.provider)}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {credential.staff_members.first_name}{' '}
                          {credential.staff_members.last_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {getProviderName(credential.provider)} •{' '}
                          {credential.calendar_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {credential.provider_email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <Badge
                          variant={
                            credential.sync_enabled ? 'default' : 'secondary'
                          }
                          className={
                            credential.sync_enabled
                              ? 'bg-green-600 text-white'
                              : ''
                          }
                        >
                          {credential.sync_enabled ? 'Syncing' : 'Paused'}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getSyncDirectionText(credential.sync_direction)}
                        </p>
                        {credential.last_sync_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last sync:{' '}
                            {new Date(
                              credential.last_sync_at
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={credential.sync_enabled}
                          onCheckedChange={enabled =>
                            updateSyncSettings(credential.id, {
                              sync_enabled: enabled,
                            })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectCalendar(credential.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Sync Direction Settings */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sync Direction:
                        </label>
                        <Select
                          value={credential.sync_direction}
                          onValueChange={direction =>
                            updateSyncSettings(credential.id, {
                              sync_direction: direction as any,
                            })
                          }
                        >
                          <SelectTrigger className="w-40 mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bidirectional">
                              Both Ways
                            </SelectItem>
                            <SelectItem value="inbound">
                              External → System
                            </SelectItem>
                            <SelectItem value="outbound">
                              System → External
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <p>
                            <strong>Both Ways:</strong> Sync appointments and
                            availability in both directions
                          </p>
                          <p>
                            <strong>External → System:</strong> Only import
                            external calendar events
                          </p>
                          <p>
                            <strong>System → External:</strong> Only export
                            system appointments
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="dark:bg-gray-800">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
            <AlertIcon className="h-5 w-5" />
            <span>How Calendar Integration Works</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>
              <strong>Real-time Availability:</strong> When staff connect their
              calendars, the AI receptionist can check their real-time
              availability during calls.
            </p>
            <p>
              <strong>Automatic Syncing:</strong> Appointments booked through
              the AI are automatically added to staff calendars, and existing
              calendar events block availability.
            </p>
            <p>
              <strong>Bidirectional Sync:</strong> Changes made in external
              calendars are reflected in the system, and system appointments
              appear in staff calendars.
            </p>
            <p>
              <strong>Privacy & Security:</strong> All calendar tokens are
              encrypted and stored securely. Staff can disconnect at any time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
