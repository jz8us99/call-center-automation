require('dotenv').config();

async function checkDeploymentAndLogs() {
  try {
    console.log('🔍 Checking deployment status and database records...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Getting businesses and their agent records...');
    const { data: businesses, error: businessError } = await supabase
      .from('business_profiles')
      .select('id, business_name, user_id')
      .limit(5);

    if (businessError || !businesses || businesses.length === 0) {
      console.log('❌ Cannot find business profiles:', businessError?.message);
      return { error: 'No business profiles found' };
    }

    console.log('✅ Found businesses:');
    businesses.forEach(b => {
      console.log(
        `  - ${b.business_name} (User: ${b.user_id}, Business: ${b.id})`
      );
    });

    console.log('\n2. Checking retell_agents table for ALL businesses...');
    const { data: allAgents, error: agentsError } = await supabase
      .from('retell_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.log('❌ Error checking retell_agents:', agentsError.message);
    } else {
      console.log(`📊 Total retell_agents records: ${allAgents?.length || 0}`);

      if (allAgents && allAgents.length > 0) {
        console.log('\nExisting agents:');
        allAgents.forEach(agent => {
          console.log(`  - ${agent.agent_name} (Type: ${agent.agent_type})`);
          console.log(`    Business ID: ${agent.business_id}`);
          console.log(`    Retell Agent ID: ${agent.retell_agent_id}`);
          console.log(`    Status: ${agent.status}`);
          console.log(`    Created: ${agent.created_at}`);
          console.log('');
        });
      } else {
        console.log('⚠️  NO AGENT RECORDS FOUND IN DATABASE');
        console.log(
          '   This suggests deployments are not storing records properly'
        );
      }
    }

    console.log('3. Checking agent configurations (Step 6 data)...');
    for (const business of businesses) {
      const { data: configs, error: configError } = await supabase
        .from('agent_configurations_scoped')
        .select('*')
        .eq('user_id', business.user_id);

      console.log(`\n   ${business.business_name}:`);
      if (configError) {
        console.log(`     ❌ Error: ${configError.message}`);
      } else {
        console.log(`     📋 ${configs?.length || 0} agent configurations`);
        if (configs && configs.length > 0) {
          configs.forEach(config => {
            console.log(
              `       - ${config.agent_name || 'Unnamed'} (Active: ${config.is_active})`
            );
          });
        }
      }
    }

    console.log(
      '\n4. Testing manual record insertion to verify table works...'
    );
    const testBusiness = businesses[0];
    const testRecord = {
      business_id: testBusiness.id,
      agent_type: 'test_manual_' + Date.now(),
      retell_agent_id: 'manual_test_' + Date.now(),
      agent_name: testBusiness.business_name + ' Manual Test Agent',
      status: 'test',
      updated_at: new Date().toISOString(),
    };

    const { data: manualResult, error: manualError } = await supabase
      .from('retell_agents')
      .insert(testRecord)
      .select();

    if (manualError) {
      console.log('❌ Manual insert failed:', manualError.message);
      console.log('   This suggests a table structure or constraint issue');
    } else {
      console.log('✅ Manual insert successful:', manualResult[0].id);
      console.log('   This proves the table works correctly');

      // Clean up test record
      await supabase
        .from('retell_agents')
        .delete()
        .eq('id', manualResult[0].id);
      console.log('🧹 Test record cleaned up');
    }

    console.log('\n5. Checking for common deployment issues...');

    // Check if there are any constraints or RLS policies blocking inserts
    console.log('   5a. Testing constraint violations...');
    const invalidRecord = {
      business_id: 'invalid-business-id',
      agent_type: 'test',
      retell_agent_id: 'constraint_test_' + Date.now(),
      agent_name: 'Constraint Test',
      status: 'test',
    };

    const { error: constraintError } = await supabase
      .from('retell_agents')
      .insert(invalidRecord);

    if (constraintError) {
      if (constraintError.message.includes('foreign key')) {
        console.log('   ✅ Foreign key constraint is working (this is good)');
      } else {
        console.log(
          '   ⚠️  Unexpected constraint error:',
          constraintError.message
        );
      }
    } else {
      console.log(
        '   ⚠️  Invalid record was accepted - foreign key constraint may be missing'
      );
    }

    return {
      success: true,
      totalAgents: allAgents?.length || 0,
      businesses: businesses.length,
      hasConfigurations: businesses.some(
        b => b.configs && b.configs.length > 0
      ),
    };
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    return { error: 'Check failed: ' + error.message };
  }
}

async function runCheck() {
  console.log('='.repeat(70));
  console.log('DEPLOYMENT STATUS & DATABASE RECORD CHECK');
  console.log('='.repeat(70));

  const result = await checkDeploymentAndLogs();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ CHECK COMPLETED');
    console.log(`📊 Summary:`);
    console.log(`   - Businesses: ${result.businesses}`);
    console.log(`   - Agent records: ${result.totalAgents}`);

    if (result.totalAgents === 0) {
      console.log('\n💡 DIAGNOSIS:');
      console.log('   No agent records found in retell_agents table.');
      console.log('   Possible causes:');
      console.log('   1. Deployments are failing silently');
      console.log('   2. Database insertion is being skipped');
      console.log('   3. Records are being inserted but immediately deleted');
      console.log(
        '   4. Wrong business_id is being used (foreign key violation)'
      );

      console.log('\n🔧 RECOMMENDATIONS:');
      console.log(
        '   1. Check deployment service console logs during actual deployment'
      );
      console.log(
        '   2. Add more verbose logging to track database insertion attempts'
      );
      console.log('   3. Ensure resolveBusinessId is working correctly');
      console.log('   4. Verify Retell API deployment is actually succeeding');
    } else {
      console.log(
        '✅ Agent records found - deployment storage appears to be working'
      );
    }
  } else {
    console.log('❌ CHECK FAILED');
    console.log('Error:', result.error);
  }
  console.log('='.repeat(70));
}

runCheck();
