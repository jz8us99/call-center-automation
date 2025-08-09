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

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'user_id is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('appointment_bookings').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
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
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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

    console.log(
      'POST /api/appointments received data:',
      JSON.stringify(body, null, 2)
    );

    const {
      user_id,
      staff_id,
      appointment_type_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      title,
      notes,
      booking_source = 'manual',
      // Customer info from frontend
      customer_first_name,
      customer_last_name,
      customer_phone,
      customer_email,
    } = body;

    if (
      !user_id ||
      !staff_id ||
      !appointment_date ||
      !start_time ||
      !end_time ||
      !customer_first_name ||
      !customer_last_name ||
      !customer_phone
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: user_id, staff_id, appointment_date, start_time, end_time, customer_first_name, customer_last_name, customer_phone',
        },
        { status: 400 }
      );
    }

    // Check for conflicting appointments (simplified approach)
    console.log('Checking time slot availability for:', {
      staff_id,
      appointment_date,
      start_time,
      end_time,
    });

    // Get all appointments for this staff member on this date
    const { data: existingAppointments, error: conflictError } = await supabase
      .from('appointment_bookings')
      .select('id, start_time, end_time, status')
      .eq('staff_id', staff_id)
      .eq('appointment_date', appointment_date)
      .neq('status', 'cancelled')
      .neq('status', 'no_show');

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return NextResponse.json(
        { error: 'Error checking availability' },
        { status: 500 }
      );
    }

    console.log('Found existing appointments:', existingAppointments);

    // Check for time conflicts manually
    const conflictingAppointments =
      existingAppointments?.filter(apt => {
        // Check if appointments overlap
        // Overlap occurs if: new start < existing end AND new end > existing start
        return start_time < apt.end_time && end_time > apt.start_time;
      }) || [];

    if (conflictingAppointments.length > 0) {
      console.log('Time slot conflict detected:', conflictingAppointments);
      return NextResponse.json(
        {
          error: `Selected time slot conflicts with existing appointment. Conflicting appointments: ${conflictingAppointments.map(a => `${a.start_time}-${a.end_time}`).join(', ')}`,
        },
        { status: 409 }
      );
    }

    console.log('No conflicts found, creating appointment...');

    // Create the appointment (matching appointment_bookings schema)
    const appointmentInsertData = {
      user_id,
      staff_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes: duration_minutes || 30,
      title,
      notes,
      booking_source,
      status: 'scheduled',
      // Store customer info directly in appointment
      customer_name: `${customer_first_name} ${customer_last_name}`,
      customer_email: customer_email || null,
      customer_phone: customer_phone,
    };

    // Add service_id if provided (maps to appointment_type_id from frontend)
    if (appointment_type_id) {
      (appointmentInsertData as any).service_id = appointment_type_id;
    }

    console.log(
      'Inserting appointment with data:',
      JSON.stringify(appointmentInsertData, null, 2)
    );

    const { data, error } = await supabase
      .from('appointment_bookings')
      .insert(appointmentInsertData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    // Optional: Create appointment history record (skip if function doesn't exist)
    try {
      await supabase.rpc('create_appointment_history', {
        p_appointment_id: data.id,
        p_action: 'created',
        p_changed_by: user_id,
        p_change_reason: `Appointment created via ${booking_source}`,
      });
    } catch (historyError) {
      console.log('History function not available:', historyError);
    }

    // Optional: Update customer appointment statistics (skip if function doesn't exist)
    try {
      await supabase.rpc('update_customer_appointment_stats', {
        p_customer_id: data.customer_id || null,
      });
    } catch (statsError) {
      console.log('Stats function not available:', statsError);
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
      .from('appointment_bookings')
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
      // Get all appointments for this staff member on the new date (excluding current appointment)
      const { data: existingAppointments, error: conflictError } =
        await supabase
          .from('appointment_bookings')
          .select('id, start_time, end_time, status')
          .eq('staff_id', currentAppointment.staff_id)
          .eq('appointment_date', appointment_date)
          .neq('status', 'cancelled')
          .neq('status', 'no_show')
          .neq('id', id); // Exclude current appointment being updated

      if (conflictError) {
        console.error('Error checking conflicts for update:', conflictError);
        return NextResponse.json(
          { error: 'Error checking availability' },
          { status: 500 }
        );
      }

      // Check for time conflicts manually
      const conflictingAppointments =
        existingAppointments?.filter(apt => {
          // Check if appointments overlap
          return start_time < apt.end_time && end_time > apt.start_time;
        }) || [];

      if (conflictingAppointments.length > 0) {
        return NextResponse.json(
          {
            error: 'Selected time slot is not available',
          },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
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
      .from('appointment_bookings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    // Optional: Create appointment history record (skip if function doesn't exist)
    try {
      await supabase.rpc('create_appointment_history', {
        p_appointment_id: id,
        p_action: 'updated',
        p_changed_by: changed_by || user_id,
        p_change_reason: change_reason || 'Appointment updated',
      });
    } catch (historyError) {
      console.log('History function not available:', historyError);
    }

    // Optional: Update customer statistics if status changed to completed
    if (status === 'completed' || status === 'no_show') {
      try {
        await supabase.rpc('update_customer_appointment_stats', {
          p_customer_id: currentAppointment.customer_id,
        });
      } catch (statsError) {
        console.log('Stats function not available:', statsError);
      }
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
        .from('appointment_bookings')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error deleting appointment:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment permanently deleted',
      });
    } else {
      // Soft delete - mark as cancelled
      const { data, error } = await supabase
        .from('appointment_bookings')
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
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
      }

      // Optional: Create appointment history record (skip if function doesn't exist)
      try {
        await supabase.rpc('create_appointment_history', {
          p_appointment_id: id,
          p_action: 'cancelled',
          p_changed_by: cancelled_by || user_id,
          p_change_reason: cancellation_reason || 'Appointment cancelled',
        });
      } catch (historyError) {
        console.log('History function not available:', historyError);
      }

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
