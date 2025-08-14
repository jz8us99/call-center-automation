const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupLLMManagement() {
  try {
    console.log('🔧 Setting up LLM Management System...\n');

    // Initialize Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Step 1: Check if retell_llm_configs table exists
    console.log('1. Checking retell_llm_configs table...');
    const { data: tables, error: tablesError } = await supabase
      .from('retell_llm_configs')
      .select('*')
      .limit(1);
    
    if (tablesError && tablesError.code === 'PGRST116') {
      console.log('   ❌ retell_llm_configs table does not exist');
      console.log('   📝 Please run the SQL migration first:');
      console.log('   docs/sql/add-llm-id-to-agents.sql\n');
      return;
    } else if (tablesError) {
      throw tablesError;
    }
    
    console.log('   ✅ retell_llm_configs table exists\n');

    // Step 2: Check current default LLM
    console.log('2. Checking default LLM configuration...');
    const { data: defaultLlm, error: defaultError } = await supabase
      .from('retell_llm_configs')
      .select('*')
      .eq('is_default', true)
      .single();

    if (defaultError && defaultError.code === 'PGRST116') {
      console.log('   ⚠️  No default LLM found');
      
      // Insert the current LLM as default
      const { error: insertError } = await supabase
        .from('retell_llm_configs')
        .insert({
          llm_id: process.env.RETELL_LLM_ID || 'llm_f56f731b3105a4b42d8cb522ffa7',
          llm_name: 'Default GPT-4.1 Model',
          model: 'gpt-4.1',
          description: 'Default Retell LLM for multilingual appointment scheduling',
          is_active: true,
          is_default: true
        });

      if (insertError) {
        throw insertError;
      }

      console.log('   ✅ Created default LLM configuration');
    } else if (defaultError) {
      throw defaultError;
    } else {
      console.log(`   ✅ Default LLM: ${defaultLlm.llm_name} (${defaultLlm.llm_id})`);
    }

    // Step 3: Check agent_configurations_scoped table for retell_llm_id column
    console.log('\n3. Checking agent_configurations_scoped table...');
    const { data: sampleConfig } = await supabase
      .from('agent_configurations_scoped')
      .select('retell_llm_id')
      .limit(1)
      .single();
    
    if (sampleConfig && 'retell_llm_id' in sampleConfig) {
      console.log('   ✅ retell_llm_id column exists in agent_configurations_scoped');
    } else {
      console.log('   ❌ retell_llm_id column missing in agent_configurations_scoped');
      console.log('   📝 Please run the SQL migration first:');
      console.log('   docs/sql/add-llm-id-to-agents.sql\n');
      return;
    }

    // Step 4: Update existing agent configurations to use default LLM
    console.log('\n4. Updating existing agent configurations...');
    const { data: configs, error: configsError } = await supabase
      .from('agent_configurations_scoped')
      .select('id, agent_name, retell_llm_id')
      .is('retell_llm_id', null);

    if (configsError) {
      throw configsError;
    }

    if (configs && configs.length > 0) {
      console.log(`   Found ${configs.length} configurations without LLM assignment`);
      
      const { error: updateError } = await supabase
        .from('agent_configurations_scoped')
        .update({ 
          retell_llm_id: process.env.RETELL_LLM_ID || 'llm_f56f731b3105a4b42d8cb522ffa7' 
        })
        .is('retell_llm_id', null);

      if (updateError) {
        throw updateError;
      }

      console.log('   ✅ Updated configurations with default LLM');
    } else {
      console.log('   ✅ All configurations already have LLM assignments');
    }

    // Step 5: Test the LLM Management Service
    console.log('\n5. Testing LLM Management functionality...');
    
    // Get all LLMs
    const { data: allLlms } = await supabase
      .from('retell_llm_configs')
      .select('*')
      .order('is_default', { ascending: false });

    console.log(`   ✅ Found ${allLlms?.length || 0} LLM configurations`);
    
    if (allLlms && allLlms.length > 0) {
      allLlms.forEach((llm, index) => {
        const status = llm.is_default ? '(DEFAULT)' : llm.is_active ? '(ACTIVE)' : '(INACTIVE)';
        console.log(`      ${index + 1}. ${llm.llm_name} - ${llm.llm_id} ${status}`);
      });
    }

    // Step 6: Verify agent configurations with LLMs
    console.log('\n6. Verifying agent configurations...');
    const { data: configsWithLlm } = await supabase
      .from('agent_configurations_scoped')
      .select(`
        id,
        agent_name,
        retell_llm_id,
        is_active,
        retell_llm_configs!retell_llm_id (
          llm_name,
          model
        )
      `)
      .limit(5);

    if (configsWithLlm && configsWithLlm.length > 0) {
      console.log(`   ✅ Sample agent configurations (showing first 5):`);
      configsWithLlm.forEach((config, index) => {
        const llmName = config.retell_llm_configs?.llm_name || 'Unknown';
        const model = config.retell_llm_configs?.model || 'Unknown';
        console.log(`      ${index + 1}. ${config.agent_name} -> ${llmName} (${model})`);
      });
    } else {
      console.log('   ⚠️  No agent configurations found');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ LLM Management Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📋 What you can do now:');
    console.log('   1. Use the LLM Management API: /api/llm-management');
    console.log('   2. Sync LLMs from Retell: GET /api/llm-management?action=sync');
    console.log('   3. Assign different LLMs to agents via the API');
    console.log('   4. Deploy agents with their assigned LLM IDs');
    console.log('\n🔗 Available endpoints:');
    console.log('   GET  /api/llm-management?action=list     - List all LLMs');
    console.log('   GET  /api/llm-management?action=sync     - Sync from Retell');
    console.log('   POST /api/llm-management {action: "assign"} - Assign LLM to agent');
    console.log('   POST /api/llm-management {action: "set-default"} - Set default LLM');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    if (error.details) {
      console.error('   Details:', error.details);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your .env file has correct Supabase credentials');
    console.log('   2. Run the SQL migration: docs/sql/add-llm-id-to-agents.sql');
    console.log('   3. Ensure SUPABASE_SERVICE_ROLE_KEY has proper permissions');
  }
}

setupLLMManagement();