/**
 * Calendar Synchronization Service
 * Handles syncing between external calendars and the system
 */

interface CalendarCredential {
  id: string;
  business_id: string;
  staff_id: string;
  provider: 'google' | 'outlook' | 'calendly';
  provider_user_id: string;
  provider_email: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  calendar_name: string;
  sync_enabled: boolean;
  sync_direction: 'inbound' | 'outbound' | 'bidirectional';
  last_sync_at: string | null;
  is_active: boolean;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_busy: boolean;
  attendees?: any[];
  location?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
}

export class CalendarSyncService {
  private static instance: CalendarSyncService;

  public static getInstance(): CalendarSyncService {
    if (!CalendarSyncService.instance) {
      CalendarSyncService.instance = new CalendarSyncService();
    }
    return CalendarSyncService.instance;
  }

  /**
   * Sync events from external calendar to system
   */
  async syncInboundEvents(credential: CalendarCredential): Promise<void> {
    try {
      console.log(
        `Starting inbound sync for ${credential.provider} calendar:`,
        credential.calendar_name
      );

      const events = await this.fetchExternalEvents(credential);
      await this.storeEventsInDatabase(credential, events);
      await this.updateLastSyncTime(credential.id);

      console.log(`Inbound sync completed for ${credential.provider} calendar`);
    } catch (error) {
      console.error('Inbound sync failed:', error);
      await this.logSyncError(credential.id, 'inbound', error);
      throw error;
    }
  }

  /**
   * Sync events from system to external calendar
   */
  async syncOutboundEvents(credential: CalendarCredential): Promise<void> {
    try {
      console.log(
        `Starting outbound sync for ${credential.provider} calendar:`,
        credential.calendar_name
      );

      const systemEvents = await this.fetchSystemEvents(credential);
      await this.pushEventsToExternalCalendar(credential, systemEvents);
      await this.updateLastSyncTime(credential.id);

      console.log(
        `Outbound sync completed for ${credential.provider} calendar`
      );
    } catch (error) {
      console.error('Outbound sync failed:', error);
      await this.logSyncError(credential.id, 'outbound', error);
      throw error;
    }
  }

  /**
   * Perform bidirectional sync
   */
  async syncBidirectional(credential: CalendarCredential): Promise<void> {
    try {
      console.log(
        `Starting bidirectional sync for ${credential.provider} calendar:`,
        credential.calendar_name
      );

      // First sync inbound to get latest external events
      await this.syncInboundEvents(credential);

      // Then sync outbound to push system events
      await this.syncOutboundEvents(credential);

      console.log(
        `Bidirectional sync completed for ${credential.provider} calendar`
      );
    } catch (error) {
      console.error('Bidirectional sync failed:', error);
      throw error;
    }
  }

  /**
   * Fetch events from external calendar provider
   */
  private async fetchExternalEvents(
    credential: CalendarCredential
  ): Promise<CalendarEvent[]> {
    const accessToken = await this.decryptToken(credential.access_token);

    switch (credential.provider) {
      case 'google':
        return this.fetchGoogleCalendarEvents(
          accessToken,
          credential.calendar_id
        );
      case 'outlook':
        return this.fetchOutlookCalendarEvents(
          accessToken,
          credential.calendar_id
        );
      case 'calendly':
        return this.fetchCalendlyEvents(accessToken);
      default:
        throw new Error(
          `Unsupported calendar provider: ${credential.provider}`
        );
    }
  }

  /**
   * Fetch Google Calendar events
   */
  private async fetchGoogleCalendarEvents(
    accessToken: string,
    calendarId: string
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const timeMin = now.toISOString();
    const timeMax = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // 30 days ahead

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();

    return (
      data.items?.map((item: any) => ({
        id: item.id,
        title: item.summary || 'No Title',
        description: item.description,
        start_time: item.start.dateTime || item.start.date,
        end_time: item.end.dateTime || item.end.date,
        is_busy: item.transparency !== 'transparent',
        attendees: item.attendees,
        location: item.location,
        is_recurring: !!item.recurrence,
        recurrence_rule: item.recurrence?.[0],
      })) || []
    );
  }

  /**
   * Fetch Outlook Calendar events
   */
  private async fetchOutlookCalendarEvents(
    accessToken: string,
    calendarId: string
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // 30 days ahead

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events?` +
        new URLSearchParams({
          startDateTime: startTime,
          endDateTime: endTime,
          $orderby: 'start/dateTime',
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.status}`);
    }

    const data = await response.json();

    return (
      data.value?.map((item: any) => ({
        id: item.id,
        title: item.subject || 'No Title',
        description: item.body?.content,
        start_time: item.start.dateTime,
        end_time: item.end.dateTime,
        is_busy: item.showAs !== 'free',
        attendees: item.attendees,
        location: item.location?.displayName,
        is_recurring: !!item.recurrence,
        recurrence_rule: item.recurrence?.pattern
          ? JSON.stringify(item.recurrence.pattern)
          : undefined,
      })) || []
    );
  }

  /**
   * Fetch Calendly events (placeholder)
   */
  private async fetchCalendlyEvents(
    accessToken: string
  ): Promise<CalendarEvent[]> {
    // Calendly API implementation would go here
    // This is a placeholder for future implementation
    console.log('Calendly sync not yet implemented');
    return [];
  }

  /**
   * Store events in database
   */
  private async storeEventsInDatabase(
    credential: CalendarCredential,
    events: CalendarEvent[]
  ): Promise<void> {
    try {
      const response = await fetch('/api/calendar/sync/inbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential_id: credential.id,
          events,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to store events: ${response.status}`);
      }
    } catch (error) {
      console.error('Error storing events in database:', error);
      throw error;
    }
  }

  /**
   * Fetch system events for outbound sync
   */
  private async fetchSystemEvents(
    credential: CalendarCredential
  ): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(
        `/api/calendar/sync/outbound?credential_id=${credential.id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch system events: ${response.status}`);
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching system events:', error);
      throw error;
    }
  }

  /**
   * Push events to external calendar
   */
  private async pushEventsToExternalCalendar(
    credential: CalendarCredential,
    events: CalendarEvent[]
  ): Promise<void> {
    const accessToken = await this.decryptToken(credential.access_token);

    for (const event of events) {
      try {
        switch (credential.provider) {
          case 'google':
            await this.createGoogleCalendarEvent(
              accessToken,
              credential.calendar_id,
              event
            );
            break;
          case 'outlook':
            await this.createOutlookCalendarEvent(
              accessToken,
              credential.calendar_id,
              event
            );
            break;
          case 'calendly':
            console.log('Calendly outbound sync not yet implemented');
            break;
        }
      } catch (error) {
        console.error(
          `Failed to create event in ${credential.provider}:`,
          error
        );
        // Continue with other events even if one fails
      }
    }
  }

  /**
   * Create event in Google Calendar
   */
  private async createGoogleCalendarEvent(
    accessToken: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<void> {
    const eventData = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start_time,
      },
      end: {
        dateTime: event.end_time,
      },
      location: event.location,
      attendees: event.attendees,
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google Calendar event creation failed: ${response.status}`
      );
    }
  }

  /**
   * Create event in Outlook Calendar
   */
  private async createOutlookCalendarEvent(
    accessToken: string,
    calendarId: string,
    event: CalendarEvent
  ): Promise<void> {
    const eventData = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || '',
      },
      start: {
        dateTime: event.start_time,
        timeZone: 'UTC',
      },
      end: {
        dateTime: event.end_time,
        timeZone: 'UTC',
      },
      location: {
        displayName: event.location || '',
      },
      attendees: event.attendees,
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Outlook Calendar event creation failed: ${response.status}`
      );
    }
  }

  /**
   * Update last sync time for credential
   */
  private async updateLastSyncTime(credentialId: string): Promise<void> {
    try {
      await fetch('/api/calendar/sync/update-sync-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential_id: credentialId,
          sync_time: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to update sync time:', error);
    }
  }

  /**
   * Log sync error
   */
  private async logSyncError(
    credentialId: string,
    syncType: string,
    error: any
  ): Promise<void> {
    try {
      await fetch('/api/calendar/sync/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential_id: credentialId,
          sync_type: syncType,
          error: error.message || 'Unknown error',
        }),
      });
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }
  }

  /**
   * Decrypt token (basic implementation)
   */
  private async decryptToken(encryptedToken: string): Promise<string> {
    // In production, use proper decryption
    return Buffer.from(encryptedToken, 'base64').toString('utf-8');
  }

  /**
   * Check if token needs refresh
   */
  private async refreshTokenIfNeeded(
    credential: CalendarCredential
  ): Promise<string> {
    const expiresAt = new Date(credential.token_expires_at);
    const now = new Date();

    // If token expires in less than 5 minutes, refresh it
    if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
      return this.refreshToken(credential);
    }

    return this.decryptToken(credential.access_token);
  }

  /**
   * Refresh access token
   */
  private async refreshToken(credential: CalendarCredential): Promise<string> {
    try {
      const response = await fetch('/api/calendar/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential_id: credential.id,
          provider: credential.provider,
          refresh_token: credential.refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
}

export const calendarSyncService = CalendarSyncService.getInstance();
