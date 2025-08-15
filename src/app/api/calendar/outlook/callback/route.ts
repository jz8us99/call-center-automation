import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

/**
 * Handle Microsoft Outlook Calendar OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Outlook OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=missing_parameters`
      );
    }

    // Parse state to get business_id and staff_id
    const stateData = JSON.parse(decodeURIComponent(state));
    const { business_id, staff_id } = stateData;

    if (!business_id || !staff_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=invalid_state`
      );
    }

    // Exchange code for tokens with Microsoft
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/outlook/callback`,
          scope:
            'https://graph.microsoft.com/calendars.readwrite https://graph.microsoft.com/user.read',
        }),
      }
    );

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Microsoft token exchange error:', tokens);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=token_exchange_failed`
      );
    }

    // Get user profile from Microsoft Graph
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      console.error('Microsoft profile fetch error:', profile);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=profile_fetch_failed`
      );
    }

    // Get primary calendar
    const calendarResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/calendar',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const calendarData = await calendarResponse.json();

    // Save credentials to database
    const credentialData = {
      business_id,
      staff_id,
      provider: 'outlook',
      provider_user_id: profile.id,
      provider_email: profile.mail || profile.userPrincipalName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
      calendar_id: calendarData.id || 'primary',
      calendar_name: calendarData.name || 'Calendar',
    };

    // Create calendar integration via API
    const integrationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/staff/calendar-integration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(credentialData),
      }
    );

    if (!integrationResponse.ok) {
      console.error('Failed to save calendar integration');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=save_failed`
      );
    }

    // Success redirect
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_success=outlook_connected`
    );
  } catch (error) {
    console.error('Outlook calendar callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=staff&calendar_error=unexpected_error`
    );
  }
}
