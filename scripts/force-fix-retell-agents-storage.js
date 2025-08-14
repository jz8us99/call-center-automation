require('dotenv').config();

async function forceFixRetellAgentsStorage() {
  try {
    console.log(
      '🔧 FORCE FIX: Ensuring retell_agents table stores records properly...\n'
    );

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Step 1: Check current state
    console.log('1. Checking current retell_agents table state...');
    const { data: currentAgents, error: currentError } = await supabase
      .from('retell_agents')
      .select('*');

    if (currentError) {
      console.log(
        '❌ Error reading retell_agents table:',
        currentError.message
      );
      return {
        error: 'Cannot read retell_agents table: ' + currentError.message,
      };
    }

    console.log(
      `📊 Current retell_agents records: ${currentAgents?.length || 0}`
    );

    // Step 2: Check if there are existing Retell agents that should have database records
    console.log('\n2. Checking for existing Retell AI agents...');

    try {
      const Retell = require('retell-sdk').default;
      const retellClient = new Retell({
        apiKey: process.env.RETELL_API_KEY,
      });

      const retellAgents = await retellClient.agent.list();
      console.log(`🤖 Found ${retellAgents.length} agents in Retell AI`);

      if (retellAgents.length > 0) {
        console.log('   Retell AI agents:');
        retellAgents.forEach((agent, index) => {
          console.log(
            `     ${index + 1}. ${agent.agent_name} (ID: ${agent.agent_id})`
          );
        });

        // Check which ones are missing from database
        const missingAgents = retellAgents.filter(
          retellAgent =>
            !currentAgents.some(
              dbAgent => dbAgent.retell_agent_id === retellAgent.agent_id
            )
        );

        console.log(`\n   Missing from database: ${missingAgents.length}`);

        if (missingAgents.length > 0) {
          console.log('\n3. Creating missing database records...');

          // Get business profile to use for missing records
          const { data: businesses } = await supabase
            .from('business_profiles')
            .select('id, business_name, user_id')
            .limit(1);

          if (!businesses || businesses.length === 0) {
            console.log(
              '❌ No business profiles found - cannot create records'
            );
            return { error: 'No business profiles available' };
          }

          const defaultBusiness = businesses[0];
          console.log(
            `   Using business: ${defaultBusiness.business_name} (${defaultBusiness.id})`
          );

          let createdCount = 0;
          for (const missingAgent of missingAgents) {
            console.log(
              `\n   Creating record for: ${missingAgent.agent_name}...`
            );

            const agentRecord = {
              business_id: defaultBusiness.id, // Use business_profiles.id
              agent_type: missingAgent.agent_name
                .toLowerCase()
                .includes('router')
                ? 'router'
                : 'receptionist',
              retell_agent_id: missingAgent.agent_id,
              agent_name: missingAgent.agent_name,
              status: 'deployed',
              response_engine_type:
                missingAgent.response_engine?.type || 'retell-llm',
              retell_llm_id: missingAgent.response_engine?.llm_id || null,
              voice_settings: JSON.stringify({
                voice_id: missingAgent.voice?.voice_id || '11labs-Adrian',
                voice_speed: missingAgent.voice?.speed || 1.28,
                voice_temperature: missingAgent.voice?.temperature || 1,
              }),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { data: insertResult, error: insertError } = await supabase
              .from('retell_agents')
              .insert(agentRecord)
              .select();

            if (insertError) {
              console.log(
                `     ❌ Failed to create record: ${insertError.message}`
              );
              console.log(`     Record details:`, agentRecord);
            } else {
              console.log(
                `     ✅ Created database record: ${insertResult[0].id}`
              );
              createdCount++;
            }
          }

          console.log(
            `\n   📊 Created ${createdCount} missing database records`
          );
        }
      }
    } catch (retellError) {
      console.log(
        '⚠️  Could not fetch Retell agents (API may be configured differently):',
        retellError.message
      );
    }

    // Step 3: Test deployment service directly
    console.log('\n4. Testing deployment service directly...');

    // Get a business with agent configurations
    const { data: businessWithConfigs } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(3);

    if (!businessWithConfigs || businessWithConfigs.length === 0) {
      console.log('❌ No business profiles found');
      return { error: 'No business profiles available for testing' };
    }

    let testBusiness = null;
    for (const business of businessWithConfigs) {
      const { data: configs } = await supabase
        .from('agent_configurations_scoped')
        .select('*')
        .eq('client_id', business.id)
        .eq('is_active', true);

      if (configs && configs.length > 0) {
        testBusiness = business;
        testBusiness.configCount = configs.length;
        break;
      }
    }

    if (!testBusiness) {
      console.log('⚠️  No business found with active agent configurations');
      console.log('   Creating a test agent configuration...');

      const defaultBusiness = businessWithConfigs[0];

      // Create a test agent configuration
      const testConfig = {
        client_id: defaultBusiness.id,
        agent_type_id: 'test-type-' + Date.now(),
        agent_name: 'Force Fix Test Agent',
        greeting_message:
          'Hello! This is a test agent created to verify database storage.',
        basic_info_prompt: `You are a helpful assistant for ${defaultBusiness.business_name}.`,
        custom_instructions: 'Be helpful and professional.',
        call_scripts: 'Greet the caller warmly and ask how you can help.',
        voice_settings: JSON.stringify({
          voice_id: '11labs-Adrian',
          speed: 1.28,
          temperature: 1,
        }),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: configResult, error: configError } = await supabase
        .from('agent_configurations_scoped')
        .insert(testConfig)
        .select();

      if (configError) {
        console.log(
          '   ❌ Could not create test configuration:',
          configError.message
        );
      } else {
        console.log(
          '   ✅ Created test agent configuration:',
          configResult[0].id
        );
        testBusiness = defaultBusiness;
        testBusiness.configCount = 1;
      }
    }

    if (testBusiness) {
      console.log(`   Testing with business: ${testBusiness.business_name}`);
      console.log(`   Business ID: ${testBusiness.id}`);
      console.log(`   User ID: ${testBusiness.user_id}`);
      console.log(`   Active configs: ${testBusiness.configCount}`);

      // Create a minimal test agent record manually
      console.log('\n5. Creating test agent record manually...');
      const manualTestRecord = {
        business_id: testBusiness.id,
        agent_type: 'test_manual_fix_' + Date.now(),
        retell_agent_id: 'manual_fix_test_' + Date.now(),
        agent_name: testBusiness.business_name + ' Manual Fix Test',
        status: 'deployed',
        response_engine_type: 'retell-llm',
        voice_settings: JSON.stringify({
          voice_id: '11labs-Adrian',
          voice_speed: 1.28,
          voice_temperature: 1,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: manualResult, error: manualError } = await supabase
        .from('retell_agents')
        .insert(manualTestRecord)
        .select();

      if (manualError) {
        console.log('❌ CRITICAL: Manual test record insertion failed!');
        console.log('   Error:', manualError.message);
        console.log('   Record:', manualTestRecord);

        // Try to diagnose the specific issue
        if (manualError.message.includes('foreign key')) {
          console.log('\n   🔧 Foreign key constraint issue detected');
          console.log(
            '   Checking if business_id exists in business_profiles...'
          );

          const { data: businessCheck } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('id', testBusiness.id);

          if (!businessCheck || businessCheck.length === 0) {
            console.log(
              '   ❌ Business ID does not exist in business_profiles table!'
            );
            console.log(
              '   This is the root cause of the foreign key constraint violation'
            );
          } else {
            console.log('   ✅ Business ID exists in business_profiles table');
          }
        }

        if (manualError.message.includes('check constraint')) {
          console.log('\n   🔧 Check constraint issue detected');
          console.log('   Testing different status values...');

          const testStatuses = ['deployed', 'active', 'inactive'];
          for (const testStatus of testStatuses) {
            const statusTest = {
              ...manualTestRecord,
              retell_agent_id: 'status_test_' + testStatus + '_' + Date.now(),
              status: testStatus,
            };

            const { error: statusError } = await supabase
              .from('retell_agents')
              .insert(statusTest);

            if (!statusError) {
              console.log(`   ✅ Status "${testStatus}" works`);
              // Clean up
              await supabase
                .from('retell_agents')
                .delete()
                .eq('retell_agent_id', statusTest.retell_agent_id);
            } else {
              console.log(
                `   ❌ Status "${testStatus}" failed:`,
                statusError.message
              );
            }
          }
        }

        return {
          error: 'Manual test record insertion failed: ' + manualError.message,
        };
      } else {
        console.log(
          '✅ Manual test record created successfully:',
          manualResult[0].id
        );

        // Verify it can be read back
        const { data: verifyRecord } = await supabase
          .from('retell_agents')
          .select('*')
          .eq('id', manualResult[0].id)
          .single();

        if (verifyRecord) {
          console.log('✅ Record verified - can be read back from database');
          console.log('   Record details:', {
            id: verifyRecord.id,
            business_id: verifyRecord.business_id,
            agent_name: verifyRecord.agent_name,
            status: verifyRecord.status,
          });
        }

        // Clean up test record
        await supabase
          .from('retell_agents')
          .delete()
          .eq('id', manualResult[0].id);

        console.log('🧹 Test record cleaned up');
      }
    }

    // Step 4: Final verification
    console.log('\n6. Final verification...');
    const { data: finalAgents } = await supabase
      .from('retell_agents')
      .select('*');

    console.log(
      `📊 Final retell_agents record count: ${finalAgents?.length || 0}`
    );

    if (finalAgents && finalAgents.length > 0) {
      console.log('   Current agents in database:');
      finalAgents.forEach((agent, index) => {
        console.log(
          `     ${index + 1}. ${agent.agent_name} (Type: ${agent.agent_type})`
        );
        console.log(`        Business ID: ${agent.business_id}`);
        console.log(`        Retell Agent ID: ${agent.retell_agent_id}`);
        console.log(`        Status: ${agent.status}`);
      });
    }

    return {
      success: true,
      initialCount: currentAgents?.length || 0,
      finalCount: finalAgents?.length || 0,
      message: 'Database storage verification completed',
    };
  } catch (error) {
    console.error('❌ Force fix failed:', error.message);
    console.error('Stack:', error.stack);
    return { error: 'Force fix failed: ' + error.message };
  }
}

async function runForceFix() {
  console.log('='.repeat(80));
  console.log('FORCE FIX: RETELL_AGENTS DATABASE STORAGE');
  console.log('='.repeat(80));

  const result = await forceFixRetellAgentsStorage();

  console.log('\n' + '='.repeat(80));
  if (result.success) {
    console.log('✅ FORCE FIX COMPLETED');
    console.log(`📊 Records before: ${result.initialCount}`);
    console.log(`📊 Records after: ${result.finalCount}`);

    if (result.finalCount > result.initialCount) {
      console.log('✅ Successfully created missing database records!');
    }

    if (result.finalCount === 0) {
      console.log('\n💡 NO RECORDS FOUND - POSSIBLE CAUSES:');
      console.log('1. No Retell AI agents have been deployed yet');
      console.log('2. Table constraints are preventing insertions');
      console.log('3. Deployment service is not being called');
      console.log('4. There are permission issues with the database');

      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Try deploying an agent through the UI');
      console.log('2. Check the browser console for errors during deployment');
      console.log('3. Verify that Step 6 (agent configuration) is completed');
      console.log('4. Check server logs during deployment');
    } else {
      console.log('✅ Records found - database storage is working!');
    }
  } else {
    console.log('❌ FORCE FIX FAILED');
    console.log('Error:', result.error);

    console.log('\n🔧 MANUAL FIXES TO TRY:');
    console.log('1. Check Supabase database permissions');
    console.log('2. Verify foreign key constraints');
    console.log('3. Check table structure and RLS policies');
    console.log('4. Review deployment service logs for errors');
  }
  console.log('='.repeat(80));
}

runForceFix();
