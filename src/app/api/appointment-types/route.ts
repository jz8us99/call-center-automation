import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch appointment types
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');
    const is_active = searchParams.get('is_active');
    const category = searchParams.get('category');
    const online_booking_enabled = searchParams.get('online_booking_enabled');

    if (!user_id && !business_id) {
      return NextResponse.json(
        {
          error: 'Either user_id or business_id is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('appointment_types').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (online_booking_enabled !== null) {
      query = query.eq(
        'online_booking_enabled',
        online_booking_enabled === 'true'
      );
    }

    const { data, error } = await query.order('display_order', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching appointment types:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment_types: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create appointment type
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      business_id,
      user_id,
      name,
      description,
      category,
      duration_minutes = 30,
      buffer_before_minutes = 0,
      buffer_after_minutes = 0,
      price,
      deposit_required = 0,
      advance_booking_days = 1,
      max_advance_booking_days = 90,
      same_day_booking = true,
      online_booking_enabled = true,
      requires_specific_staff = false,
      allowed_staff_ids = [],
      new_customer_only = false,
      returning_customer_only = false,
      requires_referral = false,
      booking_instructions,
      color_code = '#3B82F6',
      display_order = 0,
    } = body;

    if (!business_id || !user_id || !name) {
      return NextResponse.json(
        {
          error: 'Business ID, user ID, and name are required',
        },
        { status: 400 }
      );
    }

    // Check for duplicate name within business
    const { data: existing } = await supabase
      .from('appointment_types')
      .select('id')
      .eq('business_id', business_id)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: 'An appointment type with this name already exists',
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('appointment_types')
      .insert({
        business_id,
        user_id,
        name,
        description,
        category,
        duration_minutes,
        buffer_before_minutes,
        buffer_after_minutes,
        price,
        deposit_required,
        advance_booking_days,
        max_advance_booking_days,
        same_day_booking,
        online_booking_enabled,
        requires_specific_staff,
        allowed_staff_ids,
        new_customer_only,
        returning_customer_only,
        requires_referral,
        booking_instructions,
        color_code,
        display_order,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment type:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment_type: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment type
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      user_id,
      name,
      description,
      category,
      duration_minutes,
      buffer_before_minutes,
      buffer_after_minutes,
      price,
      deposit_required,
      advance_booking_days,
      max_advance_booking_days,
      same_day_booking,
      online_booking_enabled,
      requires_specific_staff,
      allowed_staff_ids,
      new_customer_only,
      returning_customer_only,
      requires_referral,
      booking_instructions,
      color_code,
      display_order,
      is_active,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment type ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // Check for duplicate name within business (excluding current appointment type)
    if (name) {
      const { data: existing } = await supabase
        .from('appointment_types')
        .select('id, business_id')
        .eq('name', name)
        .neq('id', id)
        .single();

      if (existing) {
        const { data: currentType } = await supabase
          .from('appointment_types')
          .select('business_id')
          .eq('id', id)
          .single();

        if (currentType && existing.business_id === currentType.business_id) {
          return NextResponse.json(
            {
              error: 'An appointment type with this name already exists',
            },
            { status: 409 }
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (duration_minutes !== undefined)
      updateData.duration_minutes = duration_minutes;
    if (buffer_before_minutes !== undefined)
      updateData.buffer_before_minutes = buffer_before_minutes;
    if (buffer_after_minutes !== undefined)
      updateData.buffer_after_minutes = buffer_after_minutes;
    if (price !== undefined) updateData.price = price;
    if (deposit_required !== undefined)
      updateData.deposit_required = deposit_required;
    if (advance_booking_days !== undefined)
      updateData.advance_booking_days = advance_booking_days;
    if (max_advance_booking_days !== undefined)
      updateData.max_advance_booking_days = max_advance_booking_days;
    if (same_day_booking !== undefined)
      updateData.same_day_booking = same_day_booking;
    if (online_booking_enabled !== undefined)
      updateData.online_booking_enabled = online_booking_enabled;
    if (requires_specific_staff !== undefined)
      updateData.requires_specific_staff = requires_specific_staff;
    if (allowed_staff_ids !== undefined)
      updateData.allowed_staff_ids = allowed_staff_ids;
    if (new_customer_only !== undefined)
      updateData.new_customer_only = new_customer_only;
    if (returning_customer_only !== undefined)
      updateData.returning_customer_only = returning_customer_only;
    if (requires_referral !== undefined)
      updateData.requires_referral = requires_referral;
    if (booking_instructions !== undefined)
      updateData.booking_instructions = booking_instructions;
    if (color_code !== undefined) updateData.color_code = color_code;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('appointment_types')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment type:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointment_type: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete appointment type
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const hard_delete = searchParams.get('hard_delete') === 'true';

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment type ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // Check if appointment type is used in any appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('appointment_type_id', id)
      .limit(1);

    if (appointments && appointments.length > 0) {
      if (hard_delete) {
        return NextResponse.json(
          {
            error:
              'Cannot delete appointment type that is used in appointments',
          },
          { status: 409 }
        );
      }
      // For soft delete, just deactivate
    }

    if (hard_delete && (!appointments || appointments.length === 0)) {
      // Permanently delete the appointment type
      const { error } = await supabase
        .from('appointment_types')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error deleting appointment type:', error);
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment type permanently deleted',
      });
    } else {
      // Soft delete - mark as inactive
      const { data, error } = await supabase
        .from('appointment_types')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating appointment type:', error);
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment type deactivated',
        appointment_type: data,
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
