import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

/**
 * Get calendar integrations for staff members
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id');
    const staffId = searchParams.get('staff_id');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('staff_calendar_credentials')
      .select(
        `
        *,
        staff_members (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }

    const { data: credentials, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Error fetching calendar credentials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calendar integrations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ credentials: credentials || [] });
  } catch (error) {
    console.error('Calendar integration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create or update calendar integration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const body = await request.json();
    const {
      business_id,
      staff_id,
      provider,
      provider_user_id,
      provider_email,
      access_token,
      refresh_token,
      token_expires_at,
      calendar_id,
      calendar_name,
      sync_direction = 'bidirectional',
    } = body;

    if (!business_id || !staff_id || !provider) {
      return NextResponse.json(
        { error: 'Business ID, staff ID, and provider are required' },
        { status: 400 }
      );
    }

    // Check if business belongs to user
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', business_id)
      .eq('user_id', user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 403 }
      );
    }

    // Deactivate any existing credentials for this staff/provider combination
    await supabase
      .from('staff_calendar_credentials')
      .update({ is_active: false })
      .eq('staff_id', staff_id)
      .eq('provider', provider)
      .eq('is_active', true);

    // Create new credential record
    const credentialData = {
      business_id,
      staff_id,
      provider,
      provider_user_id,
      provider_email,
      access_token: access_token ? await encryptToken(access_token) : null,
      refresh_token: refresh_token ? await encryptToken(refresh_token) : null,
      token_expires_at,
      calendar_id,
      calendar_name,
      sync_direction,
      is_active: true,
    };

    const { data: credential, error: credentialError } = await supabase
      .from('staff_calendar_credentials')
      .insert(credentialData)
      .select()
      .single();

    if (credentialError) {
      console.error('Error creating calendar credential:', credentialError);
      return NextResponse.json(
        { error: 'Failed to create calendar integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      credential: {
        ...credential,
        access_token: undefined, // Don't return sensitive data
        refresh_token: undefined,
      },
    });
  } catch (error) {
    console.error('Calendar integration creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete calendar integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credential_id');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID is required' },
        { status: 400 }
      );
    }

    // Verify credential belongs to user's business
    const { data: credential, error: credentialError } = await supabase
      .from('staff_calendar_credentials')
      .select(
        `
        id,
        business_profiles!inner (
          user_id
        )
      `
      )
      .eq('id', credentialId)
      .eq('business_profiles.user_id', user.id)
      .single();

    if (credentialError || !credential) {
      return NextResponse.json(
        { error: 'Calendar integration not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('staff_calendar_credentials')
      .update({ is_active: false })
      .eq('id', credentialId);

    if (deleteError) {
      console.error('Error deleting calendar credential:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete calendar integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar integration deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Basic token encryption (replace with proper encryption in production)
async function encryptToken(token: string): Promise<string> {
  // In production, use proper encryption like AES-256
  // For now, just base64 encode (NOT secure for production)
  return Buffer.from(token).toString('base64');
}

// Basic token decryption
async function decryptToken(encryptedToken: string): Promise<string> {
  // In production, use proper decryption
  return Buffer.from(encryptedToken, 'base64').toString('utf-8');
}
