import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

// GET - Fetch insurance providers
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { supabaseWithAuth } = authResult;
    const { searchParams } = new URL(request.url);
    const providerType = searchParams.get('type'); // medical, dental, vision, mental_health

    let query = supabaseWithAuth
      .from('insurance_providers')
      .select('*')
      .eq('is_active', true)
      .order('provider_name');

    if (providerType) {
      query = query.eq('provider_type', providerType);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error('Error fetching insurance providers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insurance providers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ providers: providers || [] });
  } catch (error) {
    console.error('Error in insurance-providers GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new insurance provider (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { supabaseWithAuth } = authResult;
    const body = await request.json();

    const { provider_name, provider_code, provider_type, website, phone } =
      body;

    if (!provider_name || !provider_type) {
      return NextResponse.json(
        { error: 'provider_name and provider_type are required' },
        { status: 400 }
      );
    }

    const { data: provider, error } = await supabaseWithAuth
      .from('insurance_providers')
      .insert({
        provider_name,
        provider_code,
        provider_type,
        website,
        phone,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating insurance provider:', error);
      return NextResponse.json(
        {
          error: 'Failed to create insurance provider',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error in insurance-providers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
