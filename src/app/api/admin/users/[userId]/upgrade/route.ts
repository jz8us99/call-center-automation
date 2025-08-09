'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/admin/users/[userId]/upgrade - Upgrade user's pricing tier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { newTier } = body;

    if (!newTier || !['basic', 'premium', 'enterprise'].includes(newTier)) {
      return NextResponse.json(
        { error: 'Invalid pricing tier' },
        { status: 400 }
      );
    }

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

    // Determine agent types based on new tier
    let agent_types_allowed: string[] = [];
    if (newTier === 'basic') {
      agent_types_allowed = ['inbound_call'];
    } else if (newTier === 'premium') {
      agent_types_allowed = [
        'inbound_call',
        'outbound_appointment',
        'customer_support',
      ];
    } else if (newTier === 'enterprise') {
      agent_types_allowed = [
        'inbound_call',
        'outbound_appointment',
        'outbound_marketing',
        'customer_support',
      ];
    }

    // Update user's pricing tier and agent types
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        pricing_tier: newTier,
        agent_types_allowed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error upgrading user:', updateError);
      return NextResponse.json(
        { error: 'Failed to upgrade user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: updatedUser,
      message: `Successfully upgraded user to ${newTier} tier`,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
