import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Fetch customers with filtering and search options
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const { searchParams } = new URL(request.url);

    const user_id = searchParams.get('user_id');
    const business_id = searchParams.get('business_id');
    const search = searchParams.get('search');
    const is_active = searchParams.get('is_active');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    if (!user_id && !business_id) {
      return NextResponse.json(
        {
          error: 'Either user_id or business_id is required',
        },
        { status: 400 }
      );
    }

    let query = supabase.from('customers').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (business_id) {
      query = query.eq('business_id', business_id);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      customers: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      business_id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      street_address,
      city,
      state,
      postal_code,
      country = 'US',
      preferences = {},
      medical_notes,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_provider,
      insurance_policy_number,
      insurance_group_number,
      email_notifications = true,
      sms_notifications = true,
      marketing_emails = false,
    } = body;

    if (!business_id || !user_id || !first_name || !last_name) {
      return NextResponse.json(
        {
          error: 'Business ID, user ID, first name, and last name are required',
        },
        { status: 400 }
      );
    }

    // Check for duplicate email or phone within the business
    if (email) {
      const { data: existingEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business_id)
        .eq('email', email)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          {
            error: 'A customer with this email already exists',
          },
          { status: 409 }
        );
      }
    }

    if (phone) {
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business_id)
        .eq('phone', phone)
        .single();

      if (existingPhone) {
        return NextResponse.json(
          {
            error: 'A customer with this phone number already exists',
          },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        street_address,
        city,
        state,
        postal_code,
        country,
        preferences,
        medical_notes,
        allergies,
        emergency_contact_name,
        emergency_contact_phone,
        insurance_provider,
        insurance_policy_number,
        insurance_group_number,
        email_notifications,
        sms_notifications,
        marketing_emails,
        customer_since: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  try {
    const supabase = supabaseAdmin;
    const body = await request.json();

    const {
      id,
      user_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      street_address,
      city,
      state,
      postal_code,
      country,
      preferences,
      medical_notes,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_provider,
      insurance_policy_number,
      insurance_group_number,
      email_notifications,
      sms_notifications,
      marketing_emails,
      is_active,
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        {
          error: 'Customer ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // Check for duplicate email or phone within the business (excluding current customer)
    if (email) {
      const { data: existingEmail } = await supabase
        .from('customers')
        .select('id, business_id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingEmail) {
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('business_id')
          .eq('id', id)
          .single();

        if (
          currentCustomer &&
          existingEmail.business_id === currentCustomer.business_id
        ) {
          return NextResponse.json(
            {
              error: 'A customer with this email already exists',
            },
            { status: 409 }
          );
        }
      }
    }

    if (phone) {
      const { data: existingPhone } = await supabase
        .from('customers')
        .select('id, business_id')
        .eq('phone', phone)
        .neq('id', id)
        .single();

      if (existingPhone) {
        const { data: currentCustomer } = await supabase
          .from('customers')
          .select('business_id')
          .eq('id', id)
          .single();

        if (
          currentCustomer &&
          existingPhone.business_id === currentCustomer.business_id
        ) {
          return NextResponse.json(
            {
              error: 'A customer with this phone number already exists',
            },
            { status: 409 }
          );
        }
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (street_address !== undefined)
      updateData.street_address = street_address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (country !== undefined) updateData.country = country;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (medical_notes !== undefined) updateData.medical_notes = medical_notes;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (emergency_contact_name !== undefined)
      updateData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined)
      updateData.emergency_contact_phone = emergency_contact_phone;
    if (insurance_provider !== undefined)
      updateData.insurance_provider = insurance_provider;
    if (insurance_policy_number !== undefined)
      updateData.insurance_policy_number = insurance_policy_number;
    if (insurance_group_number !== undefined)
      updateData.insurance_group_number = insurance_group_number;
    if (email_notifications !== undefined)
      updateData.email_notifications = email_notifications;
    if (sms_notifications !== undefined)
      updateData.sms_notifications = sms_notifications;
    if (marketing_emails !== undefined)
      updateData.marketing_emails = marketing_emails;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer (soft delete by default)
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
          error: 'Customer ID and user ID are required',
        },
        { status: 400 }
      );
    }

    // Check if customer has future appointments
    const { data: futureAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('customer_id', id)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .eq('status', 'scheduled');

    if (futureAppointments && futureAppointments.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete customer with future appointments. Please cancel appointments first.',
        },
        { status: 409 }
      );
    }

    if (hard_delete) {
      // Permanently delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Customer permanently deleted',
      });
    } else {
      // Soft delete - mark as inactive
      const { data, error } = await supabase
        .from('customers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating customer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Customer deactivated',
        customer: data,
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
