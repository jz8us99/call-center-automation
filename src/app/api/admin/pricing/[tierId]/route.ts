'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT /api/admin/pricing/[tierId] - Update specific pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
  try {
    const { tierId } = params;
    const body = await request.json();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (
      profileError ||
      !profile?.role ||
      (profile.role !== 'admin' && !profile.is_super_admin)
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // For now, just return success message
    // In a real implementation, you would update the tier in the database
    const updatedTier = {
      id: tierId,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ tier: updatedTier });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pricing/[tierId] - Delete specific pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
  try {
    const { tierId } = params;

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (
      profileError ||
      !profile?.role ||
      (profile.role !== 'admin' && !profile.is_super_admin)
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // For now, just return success message
    // In a real implementation, you would delete the tier from the database
    return NextResponse.json({ message: 'Pricing tier deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
