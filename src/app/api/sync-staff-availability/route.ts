import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// POST - Manually sync all staff availability with current office hours
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();
    
    const { user_id, business_id } = body;
    
    if (!user_id || !business_id) {
      return NextResponse.json(
        {
          error: 'User ID and business ID are required',
        },
        { status: 400 }
      );
    }
    
    // Get current office hours
    const { data: officeHours, error: officeHoursError } = await supabase
      .from('office_hours')
      .select('*')
      .eq('user_id', user_id)
      .eq('business_id', business_id)
      .order('day_of_week', { ascending: true });
    
    if (officeHoursError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch office hours: ' + officeHoursError.message,
        },
        { status: 500 }
      );
    }
    
    if (!officeHours || officeHours.length === 0) {
      return NextResponse.json(
        {
          error: 'No office hours configured. Please set up office hours first.',
        },
        { status: 400 }
      );
    }
    
    // Get all active staff members
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('user_id', user_id)
      .eq('is_active', true);
    
    if (staffError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch staff: ' + staffError.message,
        },
        { status: 500 }
      );
    }
    
    if (!staff || staff.length === 0) {
      return NextResponse.json(
        {
          error: 'No active staff members found.',
        },
        { status: 400 }
      );
    }
    
    let totalUpdated = 0;
    const staffResults: Record<string, unknown>[] = [];
    
    // Sync availability for each staff member
    for (const staffMember of staff) {
      try {
        const result = await syncStaffMemberAvailability(
          staffMember.id,
          officeHours
        );
        
        staffResults.push({
          staff_id: staffMember.id,
          staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
          records_updated: result.recordsUpdated,
          success: true,
        });
        
        totalUpdated += result.recordsUpdated;
      } catch (error) {
        console.error(`Failed to sync staff ${staffMember.id}:`, error);
        staffResults.push({
          staff_id: staffMember.id,
          staff_name: `${staffMember.first_name} ${staffMember.last_name}`,
          records_updated: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully synchronized staff availability`,
      total_staff: staff.length,
      total_records_updated: totalUpdated,
      staff_results: staffResults,
    });
  } catch (error) {
    console.error('Unexpected error in sync-staff-availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function syncStaffMemberAvailability(
  staffId: string,
  officeHours: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>
) {
  const supabase = supabaseAdmin;
  
  // Get current date range (current year + next year)
  const currentYear = new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear + 1}-12-31`;
  
  // Get existing staff availability records (only non-overrides)
  const { data: existingAvailability } = await supabase
    .from('staff_availability')
    .select('date, is_override')
    .eq('staff_id', staffId)
    .gte('date', startDate)
    .lte('date', endDate);
  
  // Create a set of dates that are manual overrides (don't update these)
  const overrideDates = new Set();
  if (existingAvailability) {
    existingAvailability.forEach(record => {
      if (record.is_override) {
        overrideDates.add(record.date);
      }
    });
  }
  
  // Generate availability records for the date range
  const batchUpdates = [];
  const currentDate = new Date(startDate);
  const finalDate = new Date(endDate);
  
  while (currentDate <= finalDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Skip if this date has a manual override
    if (overrideDates.has(dateStr)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Find matching office hour
    const officeHour = officeHours.find(oh => oh.day_of_week === dayOfWeek);
    
    if (officeHour && officeHour.is_active) {
      // Office is open, set staff as available with office hours
      batchUpdates.push({
        staff_id: staffId,
        date: dateStr,
        start_time: officeHour.start_time,
        end_time: officeHour.end_time,
        is_available: true,
        is_override: false,
        reason: 'office_hours_sync',
        source: 'manual_sync',
        updated_at: new Date().toISOString(),
      });
    } else {
      // Office is closed, set staff as unavailable
      batchUpdates.push({
        staff_id: staffId,
        date: dateStr,
        start_time: '09:00', // Default times for closed days
        end_time: '17:00',
        is_available: false,
        is_override: false,
        reason: 'office_closed',
        source: 'manual_sync',
        updated_at: new Date().toISOString(),
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Batch update staff availability (in chunks to avoid large queries)
  const chunkSize = 100;
  let totalRecordsUpdated = 0;
  
  for (let i = 0; i < batchUpdates.length; i += chunkSize) {
    const chunk = batchUpdates.slice(i, i + chunkSize);
    
    // Use upsert to handle existing records
    const { error: upsertError } = await supabase
      .from('staff_availability')
      .upsert(chunk, {
        onConflict: 'staff_id,date'
      });
      
    if (upsertError) {
      throw new Error(`Failed to upsert chunk: ${upsertError.message}`);
    }
    
    totalRecordsUpdated += chunk.length;
  }
  
  return { recordsUpdated: totalRecordsUpdated };
}