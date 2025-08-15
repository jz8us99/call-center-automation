require('dotenv').config();

async function testActualDeployment() {
  try {
    console.log('🧪 Testing actual deployment flow with database storage...\n');

    const { createClient } = require('@supabase/supabase-js');
    const {
      RetellDeploymentService,
    } = require('../src/lib/services/retell-deployment-service');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Getting a test business...');
    const { data: businesses, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(1);

    if (businessError || !businesses || businesses.length === 0) {
      console.log('❌ Cannot find business profiles:', businessError?.message);
      return { error: 'No business profiles found for testing' };
    }

    const testBusiness = businesses[0];
    console.log(`✅ Using business: ${testBusiness.business_name}`);
    console.log(`   User ID: ${testBusiness.user_id}`);
    console.log(`   Business ID: ${testBusiness.id}`);

    console.log('\n2. Checking current retell_agents records...');
    const { data: currentRecords, error: selectError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('business_id', testBusiness.id);

    if (selectError) {
      console.log('❌ Error checking current records:', selectError.message);
    } else {
      console.log(
        `📊 Found ${currentRecords?.length || 0} existing records for this business`
      );
      if (currentRecords && currentRecords.length > 0) {
        currentRecords.forEach(record => {
          console.log(
            `   - Agent: ${record.agent_name} (ID: ${record.retell_agent_id})`
          );
        });
      }
    }

    console.log('\n3. Testing deployment service directly...');

    // Test with user_id (as the frontend would pass)
    const deploymentService = new RetellDeploymentService();

    console.log('   Testing resolveBusinessId method...');
    // Access the resolveBusinessId method (it's private, so we'll test the public interface)

    console.log('   Creating a test agent configuration...');
    const testAgentConfig = {
      agent_name: 'Test Agent ' + Date.now(),
      greeting_message: 'Hello, how can I help you today?',
      basic_info_prompt:
        'This is a test agent for ' + testBusiness.business_name,
      custom_instructions: 'Be helpful and professional.',
      call_scripts: 'Follow standard greeting protocol.',
      voice_settings: {
        voice_id: '11labs-Adrian',
        speed: 1.28,
        temperature: 1,
      },
    };

    console.log('   Testing single agent deployment...');

    // Deploy single agent using user_id (as frontend would do)
    const singleDeployResult = await deploymentService.deploySingleAgent(
      testBusiness.user_id, // Use user_id to test the resolution
      testAgentConfig
    );

    if (singleDeployResult.success) {
      console.log('✅ Single agent deployment succeeded:');
      console.log(`   Agent ID: ${singleDeployResult.agent?.agent_id}`);
      console.log(`   Agent Name: ${singleDeployResult.agent?.agent_name}`);

      // Check if record was stored in database
      console.log('\n4. Verifying database record...');
      const { data: deployedRecord, error: verifyError } = await supabase
        .from('retell_agents')
        .select('*')
        .eq('retell_agent_id', singleDeployResult.agent.agent_id)
        .single();

      if (verifyError) {
        console.log('❌ PROBLEM: Agent deployed but no database record found!');
        console.log('   Error:', verifyError.message);

        // Try to insert the missing record manually
        console.log('\n5. Manually inserting missing record...');
        const manualRecord = {
          business_id: testBusiness.id, // Use business_profiles.id
          agent_type: 'receptionist',
          retell_agent_id: singleDeployResult.agent.agent_id,
          agent_name: singleDeployResult.agent.agent_name,
          status: 'deployed',
          response_engine_type: 'retell-llm',
          voice_settings: JSON.stringify(testAgentConfig.voice_settings),
          updated_at: new Date().toISOString(),
        };

        const { data: manualInsert, error: manualError } = await supabase
          .from('retell_agents')
          .insert(manualRecord)
          .select();

        if (manualError) {
          console.log('❌ Manual insert also failed:', manualError.message);
          console.log('   Record details:', manualRecord);
        } else {
          console.log('✅ Manual insert successful:', manualInsert[0].id);
          console.log(
            '💡 This proves the table works - there must be an issue in the deployment service'
          );
        }
      } else {
        console.log('✅ Database record found successfully:');
        console.log(`   ID: ${deployedRecord.id}`);
        console.log(`   Business ID: ${deployedRecord.business_id}`);
        console.log(`   Agent Name: ${deployedRecord.agent_name}`);
        console.log(`   Retell Agent ID: ${deployedRecord.retell_agent_id}`);
        console.log(`   Status: ${deployedRecord.status}`);
      }
    } else {
      console.log('❌ Single agent deployment failed:');
      console.log('   Error:', singleDeployResult.error);
    }

    console.log('\n6. Checking for agent configurations in Step 6...');
    const { data: agentConfigs, error: configError } = await supabase
      .from('agent_configurations_scoped')
      .select('*')
      .eq('user_id', testBusiness.user_id);

    if (configError) {
      console.log(
        '❌ Error checking agent configurations:',
        configError.message
      );
    } else {
      console.log(
        `📊 Found ${agentConfigs?.length || 0} agent configurations for user_id`
      );
      if (agentConfigs && agentConfigs.length > 0) {
        console.log('   Available configurations:');
        agentConfigs.forEach(config => {
          console.log(
            `   - ${config.agent_name || 'Unnamed'} (Active: ${config.is_active})`
          );
        });

        console.log(
          '\n7. Testing full deployment with existing configurations...'
        );
        const fullDeployResult = await deploymentService.deployAgents(
          testBusiness.user_id
        );

        if (fullDeployResult.success) {
          console.log('✅ Full deployment succeeded:');
          console.log(
            `   Deployed ${fullDeployResult.agents?.length || 0} agents`
          );

          // Check database for all records
          const { data: allRecords, error: allRecordsError } = await supabase
            .from('retell_agents')
            .select('*')
            .eq('business_id', testBusiness.id);

          if (!allRecordsError && allRecords) {
            console.log(
              `📊 Database now has ${allRecords.length} records total for this business`
            );
            allRecords.forEach(record => {
              console.log(`   - ${record.agent_name} (${record.agent_type})`);
            });
          }
        } else {
          console.log('❌ Full deployment failed:');
          console.log('   Errors:', fullDeployResult.errors);
        }
      } else {
        console.log(
          '⚠️  No agent configurations found - you may need to complete Step 6 first'
        );
      }
    }

    return {
      success: true,
      testBusiness,
      deploymentTested: true,
    };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return { error: 'Test failed: ' + error.message };
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('ACTUAL DEPLOYMENT FLOW TEST');
  console.log('='.repeat(70));

  const result = await testActualDeployment();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ DEPLOYMENT TEST COMPLETED');
    console.log(
      'Check the output above to see if database records were created'
    );

    if (result.testBusiness) {
      console.log('\n📋 Test Details:');
      console.log(`   Business: ${result.testBusiness.business_name}`);
      console.log(`   User ID: ${result.testBusiness.user_id}`);
      console.log(`   Business ID: ${result.testBusiness.id}`);
    }
  } else {
    console.log('❌ DEPLOYMENT TEST FAILED');
    console.log('Error:', result.error);
  }
  console.log('='.repeat(70));
}

runTest();
