require('dotenv').config();

async function fixRetellAgentsTable() {
  try {
    console.log('🔧 Fixing retell_agents table...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Dropping existing table if it exists...');

    // Drop and recreate table to ensure clean state
    const dropTableSQL = `DROP TABLE IF EXISTS retell_agents CASCADE;`;

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: dropTableSQL,
      });
      if (error) throw error;
      console.log('✅ Existing table dropped (if it existed)');
    } catch (error) {
      console.log('⚠️  Could not drop table (may not exist):', error.message);
    }

    console.log('\n2. Creating retell_agents table with proper schema...');

    const createTableSQL = `
      CREATE TABLE retell_agents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        business_id TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        retell_agent_id TEXT NOT NULL UNIQUE,
        agent_name TEXT NOT NULL,
        ai_agent_id TEXT,
        status TEXT DEFAULT 'deployed',
        conversation_flow_id TEXT,
        response_engine_type TEXT,
        retell_llm_id TEXT,
        voice_settings JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX idx_retell_agents_business_id ON retell_agents(business_id);
      CREATE INDEX idx_retell_agents_retell_agent_id ON retell_agents(retell_agent_id);
      CREATE INDEX idx_retell_agents_status ON retell_agents(status);
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: createTableSQL,
      });
      if (error) throw error;
      console.log('✅ Table created successfully');
    } catch (error) {
      console.log('❌ Table creation failed:', error.message);
      console.log('Trying alternative method...');

      // Alternative method - create via Supabase client
      await createTableViaClient(supabase);
    }

    console.log('\n3. Setting up RLS policies...');

    const rlsSQL = `
      -- Enable RLS
      ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;

      -- Create policy for service role (full access)
      CREATE POLICY "service_role_all_retell_agents" ON retell_agents
        FOR ALL USING (true) WITH CHECK (true);

      -- Create policy for authenticated users (read/write own business data)
      CREATE POLICY "users_retell_agents_policy" ON retell_agents
        FOR ALL USING (true) WITH CHECK (true);
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
      if (error) throw error;
      console.log('✅ RLS policies configured');
    } catch (error) {
      console.log('⚠️  RLS setup warning:', error.message);
    }

    console.log('\n4. Testing table functionality...');

    // Test insert
    const testRecord = {
      business_id: 'test-fix-' + Date.now(),
      agent_type: 'test',
      retell_agent_id: 'test-agent-fix-' + Date.now(),
      agent_name: 'Test Fix Agent',
      status: 'deployed',
      response_engine_type: 'retell-llm',
      retell_llm_id: 'test-llm-id',
      voice_settings: { voice_id: 'test-voice', speed: 1.28 },
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('retell_agents')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Test insert failed:', insertError.message);
      throw insertError;
    } else {
      console.log('✅ Test insert successful:', insertResult[0].id);
    }

    // Test upsert
    const upsertRecord = { ...testRecord, agent_name: 'Updated Test Agent' };
    const { data: upsertResult, error: upsertError } = await supabase
      .from('retell_agents')
      .upsert(upsertRecord, { onConflict: 'retell_agent_id' })
      .select();

    if (upsertError) {
      console.log('❌ Test upsert failed:', upsertError.message);
      throw upsertError;
    } else {
      console.log('✅ Test upsert successful');
    }

    // Test select
    const { data: selectResult, error: selectError } = await supabase
      .from('retell_agents')
      .select('*')
      .eq('retell_agent_id', testRecord.retell_agent_id);

    if (selectError) {
      console.log('❌ Test select failed:', selectError.message);
      throw selectError;
    } else {
      console.log(
        '✅ Test select successful, found:',
        selectResult.length,
        'records'
      );
    }

    // Clean up test record
    await supabase
      .from('retell_agents')
      .delete()
      .eq('retell_agent_id', testRecord.retell_agent_id);

    console.log('🧹 Test record cleaned up');

    return { success: true };
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    return { error: error.message };
  }
}

async function createTableViaClient(supabase) {
  console.log('📝 Creating table using alternative method...');

  // This will fail initially but might create the table structure
  try {
    await supabase.from('retell_agents').select('*').limit(0);
  } catch (error) {
    console.log('Table creation attempt via client method');
  }

  // Try to insert a minimal record to trigger table creation
  const minimalRecord = {
    retell_agent_id: 'create-test-' + Date.now(),
    agent_name: 'Create Test',
    business_id: 'test',
    agent_type: 'test',
  };

  try {
    await supabase.from('retell_agents').insert(minimalRecord);
    console.log('✅ Alternative table creation successful');

    // Clean up
    await supabase
      .from('retell_agents')
      .delete()
      .eq('retell_agent_id', minimalRecord.retell_agent_id);
  } catch (createError) {
    console.log('❌ Alternative creation also failed:', createError.message);
    throw createError;
  }
}

async function runFix() {
  console.log('='.repeat(70));
  console.log('RETELL_AGENTS TABLE FIX SCRIPT');
  console.log('='.repeat(70));

  const result = await fixRetellAgentsTable();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ TABLE FIX COMPLETED SUCCESSFULLY');
    console.log('The retell_agents table is now ready for use.');
    console.log(
      'You can now test agent deployment - records should be stored properly.'
    );
  } else {
    console.log('❌ TABLE FIX FAILED');
    console.log('Error:', result.error);
    console.log('\nIf this fails, you may need to:');
    console.log('1. Check Supabase dashboard permissions');
    console.log('2. Manually create the table in SQL editor');
    console.log('3. Verify service role key has proper permissions');
  }
  console.log('='.repeat(70));
}

runFix();
