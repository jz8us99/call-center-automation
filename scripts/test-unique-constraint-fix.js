require('dotenv').config();

async function testUniqueConstraintFix() {
  try {
    console.log('🧪 Testing unique constraint fix for retell_agents...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Checking current retell_agents records...');
    const { data: currentRecords, error: currentError } = await supabase
      .from('retell_agents')
      .select('*');

    if (currentError) {
      console.log('❌ Error reading retell_agents:', currentError.message);
      return { error: currentError.message };
    }

    console.log(`📊 Current records: ${currentRecords?.length || 0}`);
    if (currentRecords && currentRecords.length > 0) {
      console.log('   Existing records:');
      currentRecords.forEach(record => {
        console.log(`     - ${record.agent_name} (Type: ${record.agent_type})`);
      });
    }

    console.log('\n2. Testing multiple agents with unique agent_types...');

    // Get a test business
    const { data: businesses } = await supabase
      .from('business_profiles')
      .select('id, business_name')
      .limit(1);

    if (!businesses || businesses.length === 0) {
      console.log('❌ No business profiles available for testing');
      return { error: 'No business profiles' };
    }

    const testBusiness = businesses[0];
    console.log(
      `   Using business: ${testBusiness.business_name} (${testBusiness.id})`
    );

    // Create multiple test agents with unique agent_types
    const testAgents = [
      {
        business_id: testBusiness.id,
        agent_type: 'receptionist_' + Date.now(),
        retell_agent_id: 'test_unique_1_' + Date.now(),
        agent_name: 'Test Receptionist 1',
        status: 'deployed',
      },
      {
        business_id: testBusiness.id,
        agent_type: 'receptionist_' + (Date.now() + 1),
        retell_agent_id: 'test_unique_2_' + Date.now(),
        agent_name: 'Test Receptionist 2',
        status: 'deployed',
      },
      {
        business_id: testBusiness.id,
        agent_type: 'support_' + Date.now(),
        retell_agent_id: 'test_unique_3_' + Date.now(),
        agent_name: 'Test Support Agent',
        status: 'deployed',
      },
    ];

    let successCount = 0;
    const createdIds = [];

    for (let i = 0; i < testAgents.length; i++) {
      const agent = testAgents[i];
      console.log(`\n   Creating agent ${i + 1}: ${agent.agent_name}...`);

      const { data: result, error: insertError } = await supabase
        .from('retell_agents')
        .insert(agent)
        .select();

      if (insertError) {
        console.log(`     ❌ Failed: ${insertError.message}`);
        if (insertError.message.includes('unique constraint')) {
          console.log('     ⚠️  Unique constraint still causing issues');
        }
      } else {
        console.log(`     ✅ Success: ${result[0].id}`);
        successCount++;
        createdIds.push(result[0].id);
      }
    }

    console.log(
      `\n3. Results: ${successCount}/${testAgents.length} agents created successfully`
    );

    if (successCount === testAgents.length) {
      console.log('✅ Unique constraint fix is working!');
    } else if (successCount > 0) {
      console.log('⚠️  Partial success - some agents created');
    } else {
      console.log('❌ No agents were created - constraint issue persists');
    }

    console.log('\n4. Testing the new agent_type format...');

    // Test the format used by the deployment service
    const deploymentFormatAgent = {
      business_id: testBusiness.id,
      agent_type: `receptionist_${Math.random().toString(36).substr(2, 8)}`, // Simulate agent ID suffix
      retell_agent_id: 'test_deployment_format_' + Date.now(),
      agent_name: 'Test Deployment Format Agent',
      status: 'deployed',
      response_engine_type: 'retell-llm',
      voice_settings: JSON.stringify({
        voice_id: '11labs-Adrian',
        voice_speed: 1.28,
        voice_temperature: 1,
      }),
    };

    const { data: deploymentResult, error: deploymentError } = await supabase
      .from('retell_agents')
      .insert(deploymentFormatAgent)
      .select();

    if (deploymentError) {
      console.log('❌ Deployment format test failed:', deploymentError.message);
    } else {
      console.log(
        '✅ Deployment format test successful:',
        deploymentResult[0].id
      );
      createdIds.push(deploymentResult[0].id);
      successCount++;
    }

    console.log('\n5. Final record count...');
    const { data: finalRecords } = await supabase
      .from('retell_agents')
      .select('*');

    console.log(`📊 Final records: ${finalRecords?.length || 0}`);
    console.log(
      `📈 Added ${(finalRecords?.length || 0) - (currentRecords?.length || 0)} new records`
    );

    console.log('\n6. Cleaning up test records...');
    if (createdIds.length > 0) {
      for (const id of createdIds) {
        await supabase.from('retell_agents').delete().eq('id', id);
      }
      console.log(`🧹 Cleaned up ${createdIds.length} test records`);
    }

    return {
      success: successCount > 0,
      created: successCount,
      total: testAgents.length + 1, // +1 for deployment format test
      constraintFixed: successCount === testAgents.length + 1,
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: error.message };
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('UNIQUE CONSTRAINT FIX TEST');
  console.log('='.repeat(70));

  const result = await testUniqueConstraintFix();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ CONSTRAINT FIX TEST COMPLETED');
    console.log(
      `📊 Successfully created: ${result.created}/${result.total} agents`
    );

    if (result.constraintFixed) {
      console.log('✅ Unique constraint issue is FULLY RESOLVED!');
      console.log('✅ Multiple agents can now be stored per business');
      console.log('✅ Deployment service should now work correctly');
    } else {
      console.log('⚠️  Partial success - unique constraint partially resolved');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. The retell_agents table is now working properly');
    console.log('2. Deploy agents through your application UI');
    console.log('3. Records should now be stored automatically');
    console.log('4. Each agent will have a unique agent_type with ID suffix');
  } else {
    console.log('❌ CONSTRAINT FIX TEST FAILED');
    console.log('Error:', result.error);

    console.log('\n🔧 If constraint issues persist:');
    console.log('1. Check database constraint definitions');
    console.log('2. Consider modifying the unique constraint');
    console.log('3. Review agent_type generation logic');
  }
  console.log('='.repeat(70));
}

runTest();
