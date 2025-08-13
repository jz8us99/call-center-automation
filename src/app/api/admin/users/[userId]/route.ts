'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/admin/users/[userId] - Fetch specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // 权限验证已由中间件处理

    // Fetch specific user from profiles table
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        user_id,
        email,
        full_name,
        phone_number,
        role,
        pricing_tier,
        agent_types_allowed,
        is_active,
        created_at,
        updated_at,
        business_name,
        business_type
      `
      )
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: targetUser });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId] - Update specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const {
      email,
      full_name,
      phone_number,
      role,
      pricing_tier,
      agent_types_allowed,
      business_name,
      business_type,
      is_active,
    } = body;

    // 权限验证已由中间件处理

    // Update user in profiles table
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        email,
        full_name,
        phone_number,
        role,
        pricing_tier,
        agent_types_allowed,
        business_name,
        business_type,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // 权限验证已由中间件处理

    // Delete user from profiles table
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
