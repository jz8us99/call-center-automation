import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth: supabase } = authResult;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // For now, if no userId provided, return empty result (RLS implementation will come later)
    if (!userId) {
      return NextResponse.json({
        profile: null,
      });
    }

    // Get business profile for the user
    const { data: client, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch business profile' },
        { status: 500 }
      );
    }

    // Parse comprehensive data if available
    let result = client;
    if (client?.support_content) {
      try {
        const parsedData = JSON.parse(client.support_content);
        result = {
          ...client,
          ...parsedData,
          support_content: parsedData.basic_support_content || '',
        };
      } catch (e) {
        // If parsing fails, keep original client data
      }
    }

    return NextResponse.json({
      profile: result || null,
    });
  } catch (error) {
    console.error('Error in business-profile GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { supabaseWithAuth: supabase } = authResult;
    const body = await request.json();

    const {
      user_id,
      business_name,
      business_type,
      business_address,
      street_address,
      city,
      state,
      postal_code,
      business_phone,
      business_email,
      business_website,
      timezone,
      contact_person_name,
      contact_person_role,
      contact_person_phone,
      contact_person_email,
      support_content,
      // Enhanced fields
      products_services,
      pricing_information,
      return_policy,
      payment_methods,
      business_hours,
      insurance_accepted,
      specialties,
      certifications,
      service_areas,
      business_documents,
      business_images,
      logo_url,
      common_questions,
      appointment_types,
      staff_information,
      promotional_content,
      compliance_notes,
      document_sections,
      accepted_insurances,
    } = body;

    if (!user_id || !business_name || !business_phone) {
      return NextResponse.json(
        { error: 'user_id, business_name, and business_phone are required' },
        { status: 400 }
      );
    }

    // Store comprehensive business information as JSON in support_content field
    // This allows us to work with existing database structure
    const comprehensiveData = {
      basic_support_content: support_content,
      products_services: products_services || {},
      pricing_information: pricing_information || {},
      return_policy,
      payment_methods: payment_methods || [],
      business_hours: business_hours || {},
      insurance_accepted: insurance_accepted || accepted_insurances || [],
      accepted_insurances: accepted_insurances || [],
      specialties: specialties || [],
      certifications: certifications || [],
      service_areas: service_areas || [],
      business_documents: business_documents || [],
      business_images: business_images || [],
      logo_url,
      common_questions: common_questions || [],
      appointment_types: appointment_types || [],
      staff_information: staff_information || [],
      promotional_content,
      compliance_notes,
      document_sections: document_sections || [],
      contact_person_name,
      contact_person_role,
      contact_person_phone,
      contact_person_email,
      business_address,
      street_address,
      city,
      state,
      postal_code,
      business_website,
    };

    // First try to get existing business profile
    const { data: existingClient } = await supabase
      .from('business_profiles')
      .select()
      .eq('user_id', user_id)
      .single();

    let client, error;

    if (existingClient) {
      // Update existing business profile
      const result = await supabase
        .from('business_profiles')
        .update({
          business_name,
          business_type,
          business_email: business_email,
          business_phone: business_phone,
          business_address,
          business_website,
          timezone: timezone || 'America/New_York',
          contact_person_name,
          contact_person_role,
          contact_person_phone,
          contact_person_email,
          support_content: JSON.stringify(comprehensiveData),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select()
        .single();

      client = result.data;
      error = result.error;
    } else {
      // Insert new business profile
      const result = await supabase
        .from('business_profiles')
        .insert({
          user_id,
          business_name,
          business_type,
          business_email: business_email,
          business_phone: business_phone,
          business_address,
          business_website,
          timezone: timezone || 'America/New_York',
          contact_person_name,
          contact_person_role,
          contact_person_phone,
          contact_person_email,
          support_content: JSON.stringify(comprehensiveData),
        })
        .select()
        .single();

      client = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving business profile:', error);
      return NextResponse.json(
        {
          error: 'Failed to save business profile',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    // If this is a new business profile (not an update), automatically create default business location and admin staff member
    if (!existingClient) {
      try {
        // Create default business location
        const { data: businessLocation, error: locationError } = await supabase
          .from('business_locations')
          .insert({
            business_id: client.id,
            location_name: business_name + ' - Main Location',
            is_primary: true,
            street_address: street_address || business_address || '',
            city: city || '',
            state: state || '',
            postal_code: postal_code || '',
            phone: business_phone,
            email: business_email,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (locationError) {
          console.error(
            'Failed to create default business location:',
            locationError
          );
        }

        // Get user data from auth to get email
        const { data: userData, error: userError } =
          await supabase.auth.admin.getUserById(user_id);

        if (userData?.user?.email) {
          // Add the business owner as a staff member with admin role
          await supabase.from('staff_members').insert({
            user_id: user_id,
            business_id: client.id,
            location_id: businessLocation?.id, // Assign to the default location
            auth_user_id: user_id, // This user can login
            role_code: 'admin',
            first_name: contact_person_name?.split(' ')[0] || 'Business',
            last_name:
              contact_person_name?.split(' ').slice(1).join(' ') || 'Owner',
            email: userData.user.email,
            phone: contact_person_phone || business_phone,
            title: contact_person_role || 'Business Administrator',
            employment_status: 'active',
            is_active: true,
          });
        }
      } catch (staffError) {
        // Log error but don't fail the business profile creation
        console.error(
          'Failed to create admin staff member or location:',
          staffError
        );
      }
    }

    // Parse the comprehensive data back for the response
    let comprehensiveResult = client;
    if (client.support_content) {
      try {
        const parsedData = JSON.parse(client.support_content);
        comprehensiveResult = {
          ...client,
          ...parsedData,
          support_content: parsedData.basic_support_content || '',
        };
      } catch (e) {
        // If parsing fails, keep original support_content
      }
    }

    return NextResponse.json({
      profile: comprehensiveResult,
    });
  } catch (error) {
    console.error('Error in business-profile POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

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
      business_name,
      business_type,
      business_address,
      street_address,
      city,
      state,
      postal_code,
      business_phone,
      business_email,
      business_website,
      timezone,
      contact_person_name,
      contact_person_role,
      contact_person_phone,
      contact_person_email,
      support_content,
      // Enhanced fields
      products_services,
      pricing_information,
      return_policy,
      payment_methods,
      business_hours,
      insurance_accepted,
      specialties,
      certifications,
      service_areas,
      business_documents,
      business_images,
      logo_url,
      common_questions,
      appointment_types,
      staff_information,
      promotional_content,
      compliance_notes,
      document_sections,
      accepted_insurances,
    } = body;

    if (!id && !user_id) {
      return NextResponse.json(
        { error: 'id or user_id is required' },
        { status: 400 }
      );
    }

    // Store comprehensive business information as JSON in support_content field
    const comprehensiveData = {
      basic_support_content: support_content,
      products_services: products_services || {},
      pricing_information: pricing_information || {},
      return_policy,
      payment_methods: payment_methods || [],
      business_hours: business_hours || {},
      insurance_accepted: insurance_accepted || accepted_insurances || [],
      accepted_insurances: accepted_insurances || [],
      specialties: specialties || [],
      certifications: certifications || [],
      service_areas: service_areas || [],
      business_documents: business_documents || [],
      business_images: business_images || [],
      logo_url,
      common_questions: common_questions || [],
      appointment_types: appointment_types || [],
      staff_information: staff_information || [],
      promotional_content,
      compliance_notes,
      document_sections: document_sections || [],
      contact_person_name,
      contact_person_role,
      contact_person_phone,
      contact_person_email,
      business_address,
      street_address,
      city,
      state,
      postal_code,
      business_website,
    };

    // Update client record with comprehensive data stored as JSON
    const updateData = {
      business_name,
      business_type,
      business_email: business_email,
      business_phone: business_phone,
      business_address,
      business_website,
      timezone: timezone || 'America/New_York',
      contact_person_name,
      contact_person_role,
      contact_person_phone,
      contact_person_email,
      support_content: JSON.stringify(comprehensiveData),
      updated_at: new Date().toISOString(),
    };

    const { data: client, error } = await supabase
      .from('business_profiles')
      .update(updateData)
      .eq(id ? 'id' : 'user_id', id || user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating business profile:', error);
      return NextResponse.json(
        {
          error: 'Failed to update business profile',
          details: (error as Error).message,
        },
        { status: 500 }
      );
    }

    // Parse the comprehensive data back for the response
    let comprehensiveResult = client;
    if (client.support_content) {
      try {
        const parsedData = JSON.parse(client.support_content);
        comprehensiveResult = {
          ...client,
          ...parsedData,
          support_content: parsedData.basic_support_content || '',
        };
      } catch (e) {
        // If parsing fails, keep original support_content
      }
    }

    return NextResponse.json({
      profile: comprehensiveResult,
    });
  } catch (error) {
    console.error('Error in business-profile PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
