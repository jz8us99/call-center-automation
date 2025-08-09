import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch comprehensive business context for AI prompt generation
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        {
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch all business data in parallel
    const [
      businessProfileResult,
      productsResult,
      servicesResult,
      staffResult,
      officeHoursResult,
      appointmentTypesResult,
      holidaysResult,
    ] = await Promise.all([
      // Business Profile
      supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single(),

      // Products
      supabase
        .from('business_products')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true),

      // Services
      supabase
        .from('business_services')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true),

      // Staff
      supabase
        .from('staff')
        .select(
          `
          *,
          staff_calendar_configs(*),
          staff_job_assignments(
            job_titles(name, category_id),
            job_categories(name)
          )
        `
        )
        .eq('user_id', user_id)
        .eq('is_active', true),

      // Office Hours
      supabase
        .from('office_hours')
        .select('*')
        .eq('user_id', user_id)
        .order('day_of_week', { ascending: true }),

      // Appointment Types
      supabase
        .from('appointment_types')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true),

      // Business Holidays
      supabase
        .from('business_holidays')
        .select('*')
        .eq('user_id', user_id)
        .gte('holiday_date', new Date().toISOString().split('T')[0])
        .order('holiday_date', { ascending: true })
        .limit(10),
    ]);

    // Handle errors
    const errors = [
      businessProfileResult.error,
      productsResult.error,
      servicesResult.error,
      staffResult.error,
      officeHoursResult.error,
      appointmentTypesResult.error,
      holidaysResult.error,
    ].filter(error => error !== null);

    if (errors.length > 0) {
      console.error('Database errors:', errors);
      // Continue with available data rather than failing completely
    }

    // Format office hours for better readability
    const formattedOfficeHours =
      officeHoursResult.data?.map(hour => ({
        ...hour,
        day_name: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][hour.day_of_week],
        formatted_hours:
          hour.is_active && hour.start_time && hour.end_time
            ? `${hour.start_time.substring(0, 5)} - ${hour.end_time.substring(0, 5)}`
            : 'Closed',
      })) || [];

    // Format staff with their specialties and availability
    const formattedStaff =
      staffResult.data?.map(staff => ({
        ...staff,
        specialties:
          staff.staff_job_assignments?.map(
            (assignment: {
              job_titles?: { name: string };
              job_categories?: { name: string };
            }) =>
              `${assignment.job_titles?.name} (${assignment.job_categories?.name})`
          ) || [],
        has_calendar_config:
          staff.staff_calendar_configs &&
          staff.staff_calendar_configs.length > 0,
      })) || [];

    const businessContext = {
      business_profile: businessProfileResult.data,
      products: productsResult.data || [],
      services: servicesResult.data || [],
      staff: formattedStaff,
      office_hours: formattedOfficeHours,
      appointment_types: appointmentTypesResult.data || [],
      upcoming_holidays: holidaysResult.data || [],
    };

    return NextResponse.json({
      success: true,
      business_context: businessContext,
    });
  } catch (error) {
    console.error('Unexpected error fetching business context:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
