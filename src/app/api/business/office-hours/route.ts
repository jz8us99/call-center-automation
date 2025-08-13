import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

// Function to sync staff availability with office hours changes
async function syncStaffAvailabilityWithOfficeHours(
  user_id: string,
  business_id: string,
  office_hours: Array<{
    day_of_week: number;
    start_time?: string;
    end_time?: string;
    is_active: boolean;
  }>,
  supabase: any
) {
  // Get all staff members for this business
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id')
    .eq('user_id', user_id)
    .eq('is_active', true);

  if (staffError || !staff || staff.length === 0) {
    console.log('No active staff found to sync availability');
    return;
  }

  // For each staff member, update their default availability based on office hours
  for (const staffMember of staff) {
    try {
      // Get current date range (current year + next year)
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear + 1}-12-31`;

      // Get existing staff availability records
      const { data: existingAvailability } = await supabase
        .from('staff_availability')
        .select('id, date, day_of_week, is_override')
        .eq('staff_id', staffMember.id)
        .gte('date', startDate)
        .lte('date', endDate);

      // Create a map of existing records by date
      const existingMap = new Map();
      if (existingAvailability) {
        existingAvailability.forEach(record => {
          existingMap.set(record.date, record);
        });
      }

      // Generate dates for the range and update availability
      const batchUpdates = [];
      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      while (currentDate <= finalDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Find matching office hour
        const officeHour = office_hours.find(
          oh => oh.day_of_week === dayOfWeek
        );
        const existing = existingMap.get(dateStr);

        // Only update if no existing record or existing record is not a manual override
        if (!existing || !existing.is_override) {
          if (officeHour && officeHour.is_active) {
            // Office is open, set staff as available with office hours
            batchUpdates.push({
              staff_id: staffMember.id,
              date: dateStr,
              start_time: officeHour.start_time || '09:00',
              end_time: officeHour.end_time || '17:00',
              is_available: true,
              is_override: false,
              reason: 'office_hours_sync',
              source: 'office_hours_update',
            });
          } else {
            // Office is closed, set staff as unavailable
            batchUpdates.push({
              staff_id: staffMember.id,
              date: dateStr,
              start_time: '09:00',
              end_time: '17:00',
              is_available: false,
              is_override: false,
              reason: 'office_closed',
              source: 'office_hours_update',
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Batch update staff availability (in chunks to avoid large queries)
      const chunkSize = 100;
      for (let i = 0; i < batchUpdates.length; i += chunkSize) {
        const chunk = batchUpdates.slice(i, i + chunkSize);

        // Use upsert to handle existing records
        await supabase.from('staff_availability').upsert(chunk, {
          onConflict: 'staff_id,date',
        });
      }

      console.log(
        `Synced availability for staff ${staffMember.id}: ${batchUpdates.length} records`
      );
    } catch (error) {
      console.error(
        `Failed to sync availability for staff ${staffMember.id}:`,
        error
      );
    }
  }
}

// GET - Fetch office hours for a business
export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('office_hours')
      .select('*')
      .eq('user_id', user_id)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching office hours:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ office_hours: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update office hours
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const { user_id, business_id, office_hours } = body;

    if (!user_id || !business_id || !Array.isArray(office_hours)) {
      return NextResponse.json(
        {
          error: 'User ID, business ID, and office hours array are required',
        },
        { status: 400 }
      );
    }

    // Validate office hours format
    for (const hour of office_hours) {
      if (
        typeof hour.day_of_week !== 'number' ||
        hour.day_of_week < 0 ||
        hour.day_of_week > 6
      ) {
        return NextResponse.json(
          {
            error: 'Invalid day_of_week. Must be 0-6 (Sunday-Saturday)',
          },
          { status: 400 }
        );
      }

      // Only validate times for active days
      if (hour.is_active && (!hour.start_time || !hour.end_time)) {
        return NextResponse.json(
          {
            error: 'Start time and end time are required for active days',
          },
          { status: 400 }
        );
      }
    }

    // Delete existing office hours for this business
    const { error: deleteError } = await supabase
      .from('office_hours')
      .delete()
      .eq('user_id', user_id)
      .eq('business_id', business_id);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('Error deleting existing office hours:', deleteError);
    }

    // Insert new office hours
    const insertData = office_hours.map(hour => ({
      user_id,
      business_id,
      day_of_week: hour.day_of_week,
      start_time: hour.is_active ? hour.start_time : '09:00',
      end_time: hour.is_active ? hour.end_time : '17:00',
      is_active: hour.is_active !== false,
    }));

    console.log('Attempting to insert office hours:', insertData);

    const { data, error } = await supabase
      .from('office_hours')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error creating office hours:', error);

      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error:
              'office_hours table does not exist. Please create the table first using the office-hours-schema.sql file.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: `Database error: ${(error as any).message} (Code: ${(error as any).code})`,
        },
        { status: 500 }
      );
    }

    // After successfully saving office hours, update staff default availability
    try {
      await syncStaffAvailabilityWithOfficeHours(
        user_id,
        business_id,
        office_hours,
        supabase
      );
    } catch (syncError) {
      console.warn(
        'Failed to sync staff availability with office hours:',
        syncError
      );
      // Don't fail the request if sync fails
    }

    return NextResponse.json({ office_hours: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update specific office hours
export async function PUT(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const { id, user_id, day_of_week, start_time, end_time, is_active } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Office hours ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('office_hours')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating office hours:', error);
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({ office_hours: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete office hours
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
          error: 'Office hours ID and user ID are required',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('office_hours')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting office hours:', error);
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
