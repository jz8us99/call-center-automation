import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

// GET - Fetch appointment bookings
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const staff_id = searchParams.get('staff_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const status = searchParams.get('status');
    const history_only = searchParams.get('history_only') === 'true';

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    let query = supabase
      .from('appointment_bookings')
      .select('*')
      .eq('user_id', user_id);

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

    // For history view - only show appointments older than 3 years
    if (history_only) {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      query = query.lt(
        'appointment_date',
        threeYearsAgo.toISOString().split('T')[0]
      );
    }

    const { data, error } = await query.order('appointment_date', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching appointment bookings:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// POST - Create appointment booking
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      staff_id,
      user_id,
      customer_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      title,
      notes,
      customer_name,
      customer_email,
      customer_phone,
      booking_source,
    } = body;

    if (
      !staff_id ||
      !user_id ||
      !appointment_date ||
      !start_time ||
      !end_time
    ) {
      return NextResponse.json(
        {
          error:
            'Staff ID, user ID, appointment date, start time, and end time are required',
        },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointment_date)) {
      return NextResponse.json(
        {
          error: 'Appointment date must be in YYYY-MM-DD format',
        },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        {
          error: 'Time must be in HH:MM or HH:MM:SS format',
        },
        { status: 400 }
      );
    }

    // Check for conflicts using stored function
    const { data: conflictExists, error: conflictError } = await supabase.rpc(
      'check_appointment_conflict',
      {
        p_staff_id: staff_id,
        p_appointment_date: appointment_date,
        p_start_time: start_time,
        p_end_time: end_time,
      }
    );

    if (conflictError) {
      console.error('Error checking for conflicts:', conflictError);
      return NextResponse.json(
        { error: conflictError.message },
        { status: 500 }
      );
    }

    if (conflictExists) {
      return NextResponse.json(
        {
          error: 'Appointment conflicts with existing booking',
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('appointment_bookings')
      .insert({
        staff_id,
        user_id,
        customer_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        duration_minutes: duration_minutes || 30,
        title,
        notes,
        customer_name,
        customer_email,
        customer_phone,
        booking_source: booking_source || 'manual',
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment booking:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// PUT - Update appointment booking
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      id,
      user_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      status,
      title,
      notes,
      customer_name,
      customer_email,
      customer_phone,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // If updating time, check for conflicts
    if (appointment_date && start_time && end_time) {
      const { data: conflictExists, error: conflictError } = await supabase.rpc(
        'check_appointment_conflict',
        {
          p_staff_id: body.staff_id,
          p_appointment_date: appointment_date,
          p_start_time: start_time,
          p_end_time: end_time,
          p_exclude_appointment_id: id,
        }
      );

      if (conflictError) {
        console.error('Error checking for conflicts:', conflictError);
        return NextResponse.json(
          { error: conflictError.message },
          { status: 500 }
        );
      }

      if (conflictExists) {
        return NextResponse.json(
          {
            error: 'Appointment conflicts with existing booking',
          },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (appointment_date !== undefined)
      updateData.appointment_date = appointment_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (duration_minutes !== undefined)
      updateData.duration_minutes = duration_minutes;
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_email !== undefined)
      updateData.customer_email = customer_email;
    if (customer_phone !== undefined)
      updateData.customer_phone = customer_phone;

    const { data, error } = await supabase
      .from('appointment_bookings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment booking:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
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

// DELETE - Delete appointment booking
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Appointment ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('appointment_bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting appointment booking:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
