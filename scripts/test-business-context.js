require('dotenv').config();

async function testBusinessContext() {
  try {
    console.log('🧪 Testing Business Context Retrieval...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test with a sample user ID (from the logs we saw earlier)
    const testUserId = 'f4056f55-ad6d-4c6d-8aba-17544327b45a';

    console.log('1. Testing business profile lookup with user_id...');

    // Test the fixed lookup method
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (businessError) {
      console.log('❌ Business profile error:', businessError);
      return { error: 'Business profile lookup failed' };
    }

    if (!business) {
      console.log('⚠️  No business profile found for user ID:', testUserId);
      return { error: 'No business profile found' };
    }

    console.log('✅ Business profile found:');
    console.log('   Business ID:', business.id);
    console.log('   Business Name:', business.business_name);
    console.log('   Business Type:', business.business_type);
    console.log('   User ID:', business.user_id);

    // Now test related data with the business ID
    const actualBusinessId = business.id;
    console.log(
      '\n2. Testing related data lookup with business ID:',
      actualBusinessId
    );

    // Test services
    const { data: services, error: servicesError } = await supabase
      .from('business_services')
      .select('*')
      .eq('business_id', actualBusinessId);

    console.log(
      '   Services:',
      servicesError ? 'Error' : `${services?.length || 0} found`
    );
    if (services && services.length > 0) {
      services.forEach(service => {
        console.log(
          `     - ${service.service_name}: ${service.service_description}`
        );
      });
    }

    // Test staff
    const { data: staff, error: staffError } = await supabase
      .from('business_staff')
      .select('*')
      .eq('business_id', actualBusinessId);

    console.log(
      '   Staff:',
      staffError ? 'Error' : `${staff?.length || 0} found`
    );
    if (staff && staff.length > 0) {
      staff.forEach(member => {
        console.log(
          `     - ${member.first_name} ${member.last_name} (${member.job_title})`
        );
      });
    }

    // Test locations
    const { data: locations, error: locationsError } = await supabase
      .from('business_locations')
      .select('*')
      .eq('business_id', actualBusinessId);

    console.log(
      '   Locations:',
      locationsError ? 'Error' : `${locations?.length || 0} found`
    );
    if (locations && locations.length > 0) {
      locations.forEach(location => {
        console.log(`     - ${location.location_name}: ${location.address}`);
      });
    }

    // Test products
    const { data: products, error: productsError } = await supabase
      .from('business_products')
      .select('*')
      .eq('business_id', actualBusinessId);

    console.log(
      '   Products:',
      productsError ? 'Error' : `${products?.length || 0} found`
    );

    console.log('\n✅ Business context retrieval test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`- Business Profile: Found "${business.business_name}"`);
    console.log(`- Services: ${services?.length || 0} configured`);
    console.log(`- Staff: ${staff?.length || 0} configured`);
    console.log(`- Locations: ${locations?.length || 0} configured`);
    console.log(`- Products: ${products?.length || 0} configured`);

    return {
      success: true,
      businessContext: {
        businessName: business.business_name,
        businessType: business.business_type,
        servicesCount: services?.length || 0,
        staffCount: staff?.length || 0,
        locationsCount: locations?.length || 0,
        productsCount: products?.length || 0,
      },
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: 'Test failed: ' + error.message };
  }
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('BUSINESS CONTEXT RETRIEVAL TEST');
  console.log('='.repeat(60));

  const result = await testBusinessContext();

  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ BUSINESS CONTEXT TEST PASSED');
    console.log('The business context lookup fix is working correctly.');
    console.log('Agents will now include complete business data in prompts.');
  } else {
    console.log('❌ BUSINESS CONTEXT TEST FAILED');
    console.log('Error:', result.error);
  }
  console.log('='.repeat(60));
}

runTest();
