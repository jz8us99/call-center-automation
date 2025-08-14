const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testDatabaseLLMQuery() {
  try {
    console.log('🔍 Testing database LLM queries...\n');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Supabase client initialized');

    // Test 1: Check if retell_llm_configs table exists and has data
    console.log('\n📋 Test 1: Checking retell_llm_configs table...');
    const { data: llmConfigs, error: llmError } = await supabase
      .from('retell_llm_configs')
      .select('*');

    if (llmError) {
      console.log('❌ Error querying retell_llm_configs:', llmError);
      return {
        success: false,
        error: 'retell_llm_configs table error: ' + llmError.message,
      };
    }

    console.log('✅ Found', llmConfigs?.length || 0, 'LLM configs');
    if (llmConfigs && llmConfigs.length > 0) {
      llmConfigs.forEach((llm, index) => {
        console.log(
          `   ${index + 1}. ${llm.llm_name} - ${llm.llm_id} (default: ${llm.is_default})`
        );
      });
    }

    // Test 2: Check for default LLM (this is what the deployment service queries)
    console.log('\n📋 Test 2: Checking default LLM query...');
    const { data: defaultLlm, error: defaultError } = await supabase
      .from('retell_llm_configs')
      .select('llm_id')
      .eq('is_default', true)
      .single();

    if (defaultError && defaultError.code !== 'PGRST116') {
      console.log('❌ Error querying default LLM:', defaultError);
      return {
        success: false,
        error: 'Default LLM query error: ' + defaultError.message,
      };
    }

    if (defaultError && defaultError.code === 'PGRST116') {
      console.log('⚠️  No default LLM found (this could cause issues)');
    } else {
      console.log('✅ Default LLM found:', defaultLlm?.llm_id);
    }

    // Test 3: Check agent_configurations_scoped table for retell_llm_id column
    console.log('\n📋 Test 3: Checking agent_configurations_scoped table...');
    const { data: sampleAgent, error: agentError } = await supabase
      .from('agent_configurations_scoped')
      .select('id, agent_name, retell_llm_id')
      .limit(1);

    if (agentError) {
      console.log('❌ Error querying agent_configurations_scoped:', agentError);
      return {
        success: false,
        error: 'Agent configs error: ' + agentError.message,
      };
    }

    console.log('✅ Agent configurations table accessible');
    if (sampleAgent && sampleAgent.length > 0) {
      console.log(
        '   Sample agent:',
        sampleAgent[0].agent_name,
        'LLM ID:',
        sampleAgent[0].retell_llm_id || 'null'
      );
    } else {
      console.log('   No agent configurations found');
    }

    // Test 4: Test the exact query the deployment service would make
    console.log('\n📋 Test 4: Testing business profile query...');
    const testBusinessId = 'test-business-id';
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('user_id', testBusinessId)
      .single();

    if (businessError && businessError.code !== 'PGRST116') {
      console.log('❌ Error querying business profiles:', businessError);
    } else if (businessError && businessError.code === 'PGRST116') {
      console.log('⚠️  No business profile found for test ID (expected)');
    } else {
      console.log('✅ Business profile query works:', business?.business_name);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runDatabaseTests() {
  console.log('='.repeat(60));
  console.log('DATABASE LLM QUERY TEST');
  console.log('='.repeat(60));

  const result = await testDatabaseLLMQuery();

  console.log('\n' + '='.repeat(60));
  if (result.success) {
    console.log('✅ DATABASE QUERIES WORKING');
    console.log('The issue might be elsewhere in the deployment service.');
  } else {
    console.log('❌ DATABASE ISSUE FOUND');
    console.log('Error:', result.error);
    console.log('This is likely causing the 500 error.');
  }
  console.log('='.repeat(60));
}

runDatabaseTests();
