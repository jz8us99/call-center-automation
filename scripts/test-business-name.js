const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testBusinessName() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Testing business name retrieval...');

    // Get all business profiles to see what's available
    const { data: allProfiles, error: allError } = await supabase
      .from('business_profiles')
      .select('user_id, business_name, created_at')
      .limit(5);

    if (allError) {
      console.error('Error getting all profiles:', allError);
      return;
    }

    console.log('Available business profiles:');
    console.log(allProfiles);

    if (allProfiles && allProfiles.length > 0) {
      const testUserId = allProfiles[0].user_id;
      console.log(`\nTesting with user_id: ${testUserId}`);

      // Test single business name retrieval
      const { data: business, error } = await supabase
        .from('business_profiles')
        .select('business_name')
        .eq('user_id', testUserId)
        .single();

      if (error) {
        console.error('Error getting business name:', error);
      } else {
        console.log('Business name retrieved:', business.business_name);

        // Test the full agent name format
        const agentName = 'Customer Support';
        const fullAgentName = `${business.business_name} ${agentName}`;
        console.log('Full agent name would be:', fullAgentName);
      }
    } else {
      console.log('No business profiles found');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBusinessName();
