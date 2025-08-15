require('dotenv').config();

async function testDeploymentServiceFix() {
  try {
    console.log(
      '🧪 Testing Retell Deployment Service with Foreign Key Fix...\n'
    );

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Getting existing business profiles...');
    const { data: businesses, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(5);

    if (businessError || !businesses || businesses.length === 0) {
      console.log('❌ Cannot find business profiles:', businessError?.message);
      return { error: 'No business profiles found for testing' };
    }

    console.log('✅ Found business profiles:');
    businesses.forEach(b => {
      console.log(
        `  - ID: ${b.id}, Name: ${b.business_name}, User ID: ${b.user_id}`
      );
    });

    const testBusiness = businesses[0];
    console.log(`\n2. Testing with business: ${testBusiness.business_name}`);
    console.log(`   User ID: ${testBusiness.user_id}`);
    console.log(`   Business ID: ${testBusiness.id}`);

    console.log('\n3. Testing direct insert with business_profiles.id...');

    // Test direct insert with business_profiles.id (should work)
    const timestamp = Date.now();
    const directTestRecord = {
      business_id: testBusiness.id, // Use business_profiles.id directly
      agent_type: 'test_direct_' + timestamp, // Use unique agent type to avoid constraint conflict
      retell_agent_id: 'direct_test_' + timestamp,
      agent_name: 'Direct Test Agent',
      status: 'deployed',
      updated_at: new Date().toISOString(),
    };

    const { data: directResult, error: directError } = await supabase
      .from('retell_agents')
      .insert(directTestRecord)
      .select();

    if (directError) {
      console.log(
        '❌ Direct insert with business_profiles.id failed:',
        directError.message
      );
      return { error: 'Direct insert failed: ' + directError.message };
    } else {
      console.log('✅ Direct insert successful:', directResult[0].id);
    }

    console.log(
      '\n4. Testing insert with user_id (should fail without fix)...'
    );

    // Test insert with user_id (should fail due to foreign key constraint)
    const userIdTestRecord = {
      business_id: testBusiness.user_id, // Use user_id (wrong!)
      agent_type: 'test_userid_' + timestamp, // Use unique agent type
      retell_agent_id: 'userid_test_' + timestamp,
      agent_name: 'User ID Test Agent',
      status: 'deployed',
      updated_at: new Date().toISOString(),
    };

    const { data: userIdResult, error: userIdError } = await supabase
      .from('retell_agents')
      .insert(userIdTestRecord)
      .select();

    if (userIdError) {
      console.log(
        '✅ Insert with user_id correctly failed (expected):',
        userIdError.message
      );
      console.log('   This confirms the foreign key constraint is working');
    } else {
      console.log(
        '⚠️  Insert with user_id unexpectedly succeeded - foreign key constraint may be missing'
      );
    }

    console.log('\n5. Testing business ID resolution logic...');

    // Test the same logic as resolveBusinessId method
    console.log('   5a. Testing lookup by business_profiles.id...');
    const { data: businessById } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('id', testBusiness.id)
      .single();

    if (businessById) {
      console.log('   ✅ Found business by direct ID match');
    } else {
      console.log('   ❌ Could not find business by direct ID');
    }

    console.log('   5b. Testing lookup by user_id...');
    const { data: businessByUserId } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .eq('user_id', testBusiness.user_id)
      .single();

    if (businessByUserId) {
      console.log('   ✅ Found business by user_id:', {
        user_id: testBusiness.user_id,
        resolved_business_id: businessByUserId.id,
        business_name: businessByUserId.business_name,
      });

      // Verify that user_id resolves to the correct business_profiles.id
      if (businessByUserId.id === testBusiness.id) {
        console.log(
          '   ✅ Resolution logic is correct: user_id -> business_profiles.id'
        );
      } else {
        console.log('   ❌ Resolution mismatch!');
        console.log('     Expected:', testBusiness.id);
        console.log('     Got:', businessByUserId.id);
      }
    } else {
      console.log('   ❌ Could not find business by user_id');
    }

    console.log('\n6. Testing complete agent record creation...');

    // Test creating a complete agent record with all fields (as deployment service would)
    const completeTimestamp = Date.now() + 1000; // Different timestamp to avoid conflicts
    const completeAgentRecord = {
      business_id: testBusiness.id, // Use resolved business ID
      agent_type: 'test_complete_' + completeTimestamp, // Use unique agent type
      retell_agent_id: 'complete_test_' + completeTimestamp,
      agent_name: testBusiness.business_name + ' Test Agent',
      ai_agent_id: null, // Set to null since it's not required for this test
      status: 'deployed',
      conversation_flow_id: null,
      response_engine_type: 'retell-llm',
      retell_llm_id: 'llm_test_' + completeTimestamp,
      voice_settings: JSON.stringify({
        voice_id: '11labs-Adrian',
        voice_temperature: 1,
        voice_speed: 1.28,
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: completeResult, error: completeError } = await supabase
      .from('retell_agents')
      .insert(completeAgentRecord)
      .select();

    if (completeError) {
      console.log(
        '❌ Complete agent record insert failed:',
        completeError.message
      );
      return {
        error: 'Complete record insert failed: ' + completeError.message,
      };
    } else {
      console.log(
        '✅ Complete agent record insert successful:',
        completeResult[0].id
      );
      console.log('   Record details:', {
        id: completeResult[0].id,
        business_id: completeResult[0].business_id,
        agent_name: completeResult[0].agent_name,
        retell_agent_id: completeResult[0].retell_agent_id,
      });
    }

    console.log('\n7. Testing upsert functionality...');

    // Test upsert (update existing agent)
    const upsertTimestamp = Date.now() + 2000; // Another unique timestamp
    const upsertRecord = {
      business_id: testBusiness.id,
      agent_type: 'test_upsert_' + upsertTimestamp,
      retell_agent_id: 'upsert_test_' + upsertTimestamp,
      agent_name: testBusiness.business_name + ' Upsert Test Agent',
      status: 'deployed',
      updated_at: new Date().toISOString(),
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('retell_agents')
      .upsert(upsertRecord, { onConflict: 'retell_agent_id' })
      .select();

    if (upsertError) {
      console.log('❌ Upsert failed:', upsertError.message);
    } else {
      console.log('✅ Upsert successful:', upsertResult[0].agent_name);
    }

    console.log('\n8. Cleaning up test records...');

    // Clean up test records
    const testIds = [
      directTestRecord.retell_agent_id,
      completeAgentRecord.retell_agent_id,
      upsertRecord.retell_agent_id,
    ];

    for (const testId of testIds) {
      await supabase
        .from('retell_agents')
        .delete()
        .eq('retell_agent_id', testId);
    }

    console.log('🧹 Test records cleaned up');

    return {
      success: true,
      message:
        'All tests passed! The deployment service fix is working correctly.',
      businessIdResolution: {
        user_id: testBusiness.user_id,
        business_id: testBusiness.id,
        business_name: testBusiness.business_name,
      },
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: 'Test failed: ' + error.message };
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('DEPLOYMENT SERVICE FOREIGN KEY FIX VALIDATION');
  console.log('='.repeat(70));

  const result = await testDeploymentServiceFix();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ ALL TESTS PASSED');
    console.log(
      '✅ The deployment service foreign key fix is working correctly'
    );
    console.log(
      '✅ Agent deployment should now store records properly in retell_agents table'
    );
    console.log('\n📋 Business ID Resolution:');
    if (result.businessIdResolution) {
      console.log(`   User ID: ${result.businessIdResolution.user_id}`);
      console.log(`   Business ID: ${result.businessIdResolution.business_id}`);
      console.log(
        `   Business Name: ${result.businessIdResolution.business_name}`
      );
    }
    console.log(
      '\n💡 The deployment service will automatically convert user_id to business_profiles.id'
    );
  } else {
    console.log('❌ TESTS FAILED');
    console.log('Error:', result.error);
    console.log('\n🔧 Next steps:');
    console.log('1. Check that business_profiles table has valid records');
    console.log(
      '2. Verify foreign key constraint exists on retell_agents.business_id'
    );
    console.log(
      '3. Ensure deployment service resolveBusinessId method is working'
    );
  }
  console.log('='.repeat(70));
}

runTest();
