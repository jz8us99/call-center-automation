import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch appointments with filtering options
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');
    const customer_id = searchParams.get('customer_id');
    const staff_id = searchParams.get('staff_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';

    if (!user_id && !business_id) {
      return NextResponse.json(
        {
          error: 'Either user_id or business_id is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('appointments').select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        appointment_types (
          id,
          name,
          duration_minutes,
          price,
          color_code
        )
      `);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (staff_id) {
      query = query.eq('staff_id', staff_id);
    }

    if (start_date) {
      query = query.gte('appointment_date', start_date);
    }

    if (end_date) {
      query = query.lte('appointment_date', end_date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ appointments: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      business_id,
      user_id,
      customer_id,
      staff_id,
      appointment_type_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      title,
      notes,
      customer_notes,
      booking_source = 'online',
      booked_by,
    } = body;

    if (
      !business_id ||
      !user_id ||
      !customer_id ||
      !staff_id ||
      !appointment_date ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: business_id, user_id, customer_id, staff_id, appointment_date, start_time, end_time',
        },
        { status: 400 }
      );
    }

    // Check if the time slot is available
    const { data: availabilityCheck } = await supabase.rpc(
      'is_appointment_slot_available',
      {
        p_staff_id: staff_id,
        p_date: appointment_date,
        p_start_time: start_time,
        p_end_time: end_time,
      }
    );

    if (!availabilityCheck) {
      return NextResponse.json(
        {
          error: 'Selected time slot is not available',
        },
        { status: 409 }
      );
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        business_id,
        user_id,
        customer_id,
        staff_id,
        appointment_type_id,
        appointment_date,
        start_time,
        end_time,
        duration_minutes: duration_minutes || 30,
        title,
        notes,
        customer_notes,
        booking_source,
        booked_by,
        status: 'scheduled',
      })
      .select(
        `
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        appointment_types (
          id,
          name,
          duration_minutes,
          price,
          color_code
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create appointment history record
    await supabase.rpc('create_appointment_history', {
      p_appointment_id: data.id,
      p_action: 'created',
      p_changed_by: booked_by || user_id,
      p_change_reason: `Appointment created via ${booking_source}`,
    });

    // Update customer appointment statistics
    await supabase.rpc('update_customer_appointment_stats', {
      p_customer_id: customer_id,
    });

    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      user_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      title,
      notes,
      customer_notes,
      status,
      changed_by,
      change_reason,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // Get current appointment data for history tracking
    const { data: currentAppointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (!currentAppointment) {
      return NextResponse.json(
        {
          error: 'Appointment not found',
        },
        { status: 404 }
      );
    }

    // If changing time/date, check availability
    if (
      appointment_date &&
      start_time &&
      end_time &&
      (appointment_date !== currentAppointment.appointment_date ||
        start_time !== currentAppointment.start_time ||
        end_time !== currentAppointment.end_time)
    ) {
      const { data: availabilityCheck } = await supabase.rpc(
        'is_appointment_slot_available',
        {
          p_staff_id: currentAppointment.staff_id,
          p_date: appointment_date,
          p_start_time: start_time,
          p_end_time: end_time,
          p_exclude_appointment_id: id,
        }
      );

      if (!availabilityCheck) {
        return NextResponse.json(
          {
            error: 'Selected time slot is not available',
          },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (appointment_date !== undefined)
      updateData.appointment_date = appointment_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (duration_minutes !== undefined)
      updateData.duration_minutes = duration_minutes;
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (customer_notes !== undefined)
      updateData.customer_notes = customer_notes;
    if (status !== undefined) updateData.status = status;

    // Handle status-specific updates
    if (status === 'confirmed') {
      updateData.customer_confirmed_at = new Date().toISOString();
    } else if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancelled_by = changed_by;
      updateData.cancellation_reason = change_reason;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select(
        `
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        appointment_types (
          id,
          name,
          duration_minutes,
          price,
          color_code
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create appointment history record
    await supabase.rpc('create_appointment_history', {
      p_appointment_id: id,
      p_action: 'updated',
      p_changed_by: changed_by || user_id,
      p_change_reason: change_reason || 'Appointment updated',
    });

    // Update customer statistics if status changed to completed
    if (status === 'completed' || status === 'no_show') {
      await supabase.rpc('update_customer_appointment_stats', {
        p_customer_id: currentAppointment.customer_id,
      });
    }

    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete appointment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const cancelled_by = searchParams.get('cancelled_by');
    const cancellation_reason = searchParams.get('cancellation_reason');
    const hard_delete = searchParams.get('hard_delete') === 'true';

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment ID and user ID are required',
        },
        { status: 400 }
      );
    }

    if (hard_delete) {
      // Permanently delete the appointment
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment permanently deleted',
      });
    } else {
      // Soft delete - mark as cancelled
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: cancelled_by || user_id,
          cancellation_reason: cancellation_reason || 'Appointment cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling appointment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Create appointment history record
      await supabase.rpc('create_appointment_history', {
        p_appointment_id: id,
        p_action: 'cancelled',
        p_changed_by: cancelled_by || user_id,
        p_change_reason: cancellation_reason || 'Appointment cancelled',
      });

      return NextResponse.json({
        success: true,
        message: 'Appointment cancelled',
        appointment: data,
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
