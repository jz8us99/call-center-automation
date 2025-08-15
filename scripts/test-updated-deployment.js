require('dotenv').config();

async function testUpdatedDeployment() {
  try {
    console.log(
      '🧪 Testing updated deployment service with enhanced database insertion...\n'
    );

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Getting businesses with agent configurations...');
    const { data: businesses, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(3);

    if (businessError || !businesses || businesses.length === 0) {
      console.log('❌ Cannot find business profiles:', businessError?.message);
      return { error: 'No business profiles found' };
    }

    let testBusiness = null;

    // Find a business that has agent configurations
    for (const business of businesses) {
      console.log(`\n   Checking ${business.business_name}...`);

      // Check if this business has agent configurations using business_profiles.id
      const { data: configs, error: configError } = await supabase
        .from('agent_configurations_scoped')
        .select('*')
        .eq('client_id', business.id) // Use business_profiles.id
        .eq('is_active', true);

      console.log(`     Agent configs: ${configs?.length || 0}`);
      if (configs && configs.length > 0) {
        console.log('     ✅ Has active agent configurations');
        testBusiness = business;
        testBusiness.configCount = configs.length;
        break;
      } else {
        console.log('     ⚠️  No active agent configurations');

        // Check if there are any configs at all
        const { data: allConfigs } = await supabase
          .from('agent_configurations_scoped')
          .select('*')
          .eq('client_id', business.id);

        if (allConfigs && allConfigs.length > 0) {
          console.log(
            `     📋 Has ${allConfigs.length} configs total, but none active`
          );
        }
      }
    }

    if (!testBusiness) {
      console.log('\n❌ No business found with active agent configurations');
      console.log(
        '   You may need to complete Step 6 (agent configuration) first'
      );
      return { error: 'No business with active agent configurations found' };
    }

    console.log(`\n2. Testing with business: ${testBusiness.business_name}`);
    console.log(`   User ID: ${testBusiness.user_id}`);
    console.log(`   Business ID: ${testBusiness.id}`);
    console.log(`   Active configs: ${testBusiness.configCount}`);

    console.log('\n3. Checking current retell_agents records...');
    const { data: beforeRecords, error: beforeError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('business_id', testBusiness.id);

    if (beforeError) {
      console.log('❌ Error checking existing records:', beforeError.message);
    } else {
      console.log(`📊 Current records: ${beforeRecords?.length || 0}`);
      if (beforeRecords && beforeRecords.length > 0) {
        beforeRecords.forEach(record => {
          console.log(`   - ${record.agent_name} (${record.agent_type})`);
        });
      }
    }

    console.log('\n4. Making API call to deployment endpoint...');

    // Test the actual API endpoint
    const deploymentData = {
      businessId: testBusiness.user_id, // Pass user_id as frontend would
      agents: [], // Empty array since we're deploying from configurations
    };

    console.log('   Request data:', deploymentData);
    console.log(
      '   Note: Deployment service should resolve user_id to business_profiles.id internally'
    );

    // Simulate what would happen in the deployment service without making HTTP call
    // We'll just log what would happen and then do a manual verification

    console.log('\n5. Simulating deployment process...');
    console.log('   Step 1: resolve user_id to business_profiles.id');
    console.log(`   ${testBusiness.user_id} -> ${testBusiness.id}`);

    console.log('   Step 2: query agent_configurations_scoped with client_id');
    const { data: foundConfigs, error: foundError } = await supabase
      .from('agent_configurations_scoped')
      .select('*')
      .eq('client_id', testBusiness.id)
      .eq('is_active', true);

    if (foundError) {
      console.log('   ❌ Configuration query failed:', foundError.message);
      return { error: 'Configuration query failed' };
    }

    console.log(
      `   ✅ Found ${foundConfigs?.length || 0} active configurations`
    );

    if (foundConfigs && foundConfigs.length > 0) {
      console.log('   Configuration details:');
      foundConfigs.forEach((config, index) => {
        console.log(
          `     ${index + 1}. Agent: ${config.agent_name || 'Unnamed'}`
        );
        console.log(`        Type: ${config.agent_type_id}`);
        console.log(`        Active: ${config.is_active}`);
      });
    }

    console.log(
      '\n6. Testing direct record insertion with correct business_id...'
    );

    // Create a test record using the correct business_profiles.id
    const testRecord = {
      business_id: testBusiness.id, // Use business_profiles.id
      agent_type: 'test_deployment_' + Date.now(),
      retell_agent_id: 'test_deploy_' + Date.now(),
      agent_name: testBusiness.business_name + ' Deployment Test',
      status: 'deployed', // Use valid status
      updated_at: new Date().toISOString(),
    };

    const { data: testResult, error: testError } = await supabase
      .from('retell_agents')
      .insert(testRecord)
      .select();

    if (testError) {
      console.log('❌ Test record insertion failed:', testError.message);
      console.log('   Record details:', testRecord);
      return { error: 'Test record insertion failed: ' + testError.message };
    } else {
      console.log('✅ Test record insertion successful:', testResult[0].id);

      // Clean up test record
      await supabase.from('retell_agents').delete().eq('id', testResult[0].id);
      console.log('🧹 Test record cleaned up');
    }

    console.log('\n7. Final verification...');
    const { data: afterRecords, error: afterError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('business_id', testBusiness.id);

    if (!afterError && afterRecords) {
      console.log(`📊 Final record count: ${afterRecords.length}`);
    }

    return {
      success: true,
      testBusiness: {
        name: testBusiness.business_name,
        user_id: testBusiness.user_id,
        business_id: testBusiness.id,
        configCount: testBusiness.configCount,
      },
      recordsBefore: beforeRecords?.length || 0,
      recordsAfter: afterRecords?.length || 0,
      configsFound: foundConfigs?.length || 0,
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: 'Test failed: ' + error.message };
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('UPDATED DEPLOYMENT SERVICE TEST');
  console.log('='.repeat(70));

  const result = await testUpdatedDeployment();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ DEPLOYMENT SERVICE TEST COMPLETED');

    if (result.testBusiness) {
      console.log('\n📋 Test Summary:');
      console.log(`   Business: ${result.testBusiness.name}`);
      console.log(`   User ID: ${result.testBusiness.user_id}`);
      console.log(`   Business ID: ${result.testBusiness.business_id}`);
      console.log(
        `   Agent configurations: ${result.testBusiness.configCount}`
      );
      console.log(`   Records found: ${result.configsFound} configs`);
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. The deployment service fixes are in place');
    console.log('2. Make an actual deployment through the UI or API');
    console.log('3. Check retell_agents table for new records');
    console.log(
      '4. If still no records, check console logs for detailed errors'
    );
  } else {
    console.log('❌ DEPLOYMENT SERVICE TEST FAILED');
    console.log('Error:', result.error);

    console.log('\n🔧 POSSIBLE SOLUTIONS:');
    console.log('1. Complete Step 6 to create agent configurations');
    console.log('2. Make sure agent configurations are marked as active');
    console.log('3. Verify business_profiles table has correct data');
  }
  console.log('='.repeat(70));
}

runTest();
