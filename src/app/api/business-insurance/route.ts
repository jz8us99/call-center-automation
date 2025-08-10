import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

// GET - Fetch business accepted insurance
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const businessId = searchParams.get('business_id');

    if (!userId && !businessId) {
      return NextResponse.json(
        { error: 'user_id or business_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('business_accepted_insurance')
      .select(
        `
        *,
        insurance_providers (
          id,
          provider_name,
          provider_code,
          provider_type,
          website,
          phone
        )
      `
      )
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data: acceptedInsurance, error } = await query.order('created_at', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching business insurance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business insurance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ acceptedInsurance: acceptedInsurance || [] });
  } catch (error) {
    console.error('Error in business-insurance GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add accepted insurance to business
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      business_id,
      user_id,
      insurance_provider_id,
      policy_notes,
      copay_amount,
      requires_referral = false,
      network_status = 'in-network',
      effective_date,
      expiration_date,
    } = body;

    if (!business_id || !user_id || !insurance_provider_id) {
      return NextResponse.json(
        {
          error: 'business_id, user_id, and insurance_provider_id are required',
        },
        { status: 400 }
      );
    }

    const { data: acceptedInsurance, error } = await supabase
      .from('business_accepted_insurance')
      .insert({
        business_id,
        user_id,
        insurance_provider_id,
        policy_notes,
        copay_amount,
        requires_referral,
        network_status,
        effective_date,
        expiration_date,
        is_active: true,
      })
      .select(
        `
        *,
        insurance_providers (
          id,
          provider_name,
          provider_code,
          provider_type,
          website,
          phone
        )
      `
      )
      .single();

    if (error) {
      console.error('Error adding business insurance:', error);
      return NextResponse.json(
        {
          error: 'Failed to add business insurance',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ acceptedInsurance });
  } catch (error) {
    console.error('Error in business-insurance POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update business accepted insurance
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      id,
      user_id,
      policy_notes,
      copay_amount,
      requires_referral,
      network_status,
      effective_date,
      expiration_date,
      is_active,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'id and user_id are required' },
        { status: 400 }
      );
    }

    const { data: acceptedInsurance, error } = await supabase
      .from('business_accepted_insurance')
      .update({
        policy_notes,
        copay_amount,
        requires_referral,
        network_status,
        effective_date,
        expiration_date,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select(
        `
        *,
        insurance_providers (
          id,
          provider_name,
          provider_code,
          provider_type,
          website,
          phone
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating business insurance:', error);
      return NextResponse.json(
        {
          error: 'Failed to update business insurance',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ acceptedInsurance });
  } catch (error) {
    console.error('Error in business-insurance PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove accepted insurance from business
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'id and user_id are required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('business_accepted_insurance')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting business insurance:', error);
      return NextResponse.json(
        { error: 'Failed to delete business insurance' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in business-insurance DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
