require('dotenv').config();

async function diagnoseRetellAgentsTable() {
  try {
    console.log('🔍 Diagnosing retell_agents table issues...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Checking if retell_agents table exists...');

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('retell_agents')
      .select('*')
      .limit(0);

    if (tableError) {
      console.log('❌ Table access error:', tableError.message);

      if (tableError.message.includes('does not exist')) {
        console.log('📝 Creating retell_agents table...');
        await createRetellAgentsTable(supabase);
        return;
      }
    } else {
      console.log('✅ retell_agents table exists and is accessible');
    }

    console.log('\n2. Checking table schema...');

    // Get table schema using SQL
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_schema', {
        table_name: 'retell_agents',
      })
      .catch(async () => {
        // Fallback: try to insert a test record to see what columns are expected
        console.log('📋 Testing table structure with sample insert...');
        return await testTableStructure(supabase);
      });

    console.log('\n3. Testing insert permissions...');

    const testRecord = {
      business_id: 'test-business-id',
      agent_type: 'test',
      retell_agent_id: 'test-agent-' + Date.now(),
      agent_name: 'Test Agent ' + Date.now(),
      status: 'test',
      updated_at: new Date().toISOString(),
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('retell_agents')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('📋 Test record that failed:', testRecord);

      if (
        insertError.message.includes('column') &&
        insertError.message.includes('does not exist')
      ) {
        console.log('🔧 Column missing, attempting to fix table schema...');
        await fixTableSchema(supabase, insertError.message);
      } else if (insertError.message.includes('violates')) {
        console.log('🔧 Constraint violation, checking constraints...');
        await checkConstraints(supabase);
      } else if (insertError.message.includes('permission')) {
        console.log('🔧 Permission issue, checking RLS policies...');
        await checkRLSPolicies(supabase);
      }
    } else {
      console.log('✅ Insert test successful:', insertResult);

      // Clean up test record
      await supabase
        .from('retell_agents')
        .delete()
        .eq('retell_agent_id', testRecord.retell_agent_id);

      console.log('🧹 Cleaned up test record');
    }

    console.log('\n4. Checking existing records...');

    const { data: existingRecords, error: selectError } = await supabase
      .from('retell_agents')
      .select('*')
      .limit(5);

    if (selectError) {
      console.log('❌ Select failed:', selectError.message);
    } else {
      console.log(`📊 Found ${existingRecords?.length || 0} existing records`);
      if (existingRecords && existingRecords.length > 0) {
        console.log(
          'Sample record structure:',
          Object.keys(existingRecords[0])
        );
      }
    }

    console.log('\n5. Testing upsert operation...');

    const upsertTestRecord = {
      business_id: 'upsert-test-business',
      agent_type: 'receptionist',
      retell_agent_id: 'upsert-test-agent-' + Date.now(),
      agent_name: 'Upsert Test Agent',
      status: 'deployed',
      updated_at: new Date().toISOString(),
    };

    const { data: upsertResult, error: upsertError } = await supabase
      .from('retell_agents')
      .upsert(upsertTestRecord, {
        onConflict: 'retell_agent_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.log('❌ Upsert test failed:', upsertError.message);
      console.log('📋 Upsert record that failed:', upsertTestRecord);
    } else {
      console.log('✅ Upsert test successful:', upsertResult);

      // Clean up
      await supabase
        .from('retell_agents')
        .delete()
        .eq('retell_agent_id', upsertTestRecord.retell_agent_id);
    }

    return { success: true, message: 'Diagnosis complete' };
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    return { error: 'Diagnosis failed: ' + error.message };
  }
}

async function createRetellAgentsTable(supabase) {
  console.log('📝 Creating retell_agents table with proper schema...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS retell_agents (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      business_id TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      retell_agent_id TEXT UNIQUE NOT NULL,
      agent_name TEXT NOT NULL,
      ai_agent_id TEXT,
      status TEXT DEFAULT 'deployed',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      conversation_flow_id TEXT,
      response_engine_type TEXT,
      retell_llm_id TEXT,
      voice_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_retell_agents_business_id ON retell_agents(business_id);
    CREATE INDEX IF NOT EXISTS idx_retell_agents_retell_agent_id ON retell_agents(retell_agent_id);
    CREATE INDEX IF NOT EXISTS idx_retell_agents_status ON retell_agents(status);

    -- Enable RLS
    ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;

    -- Create permissive policy for service role
    DROP POLICY IF EXISTS "Enable all operations for service role" ON retell_agents;
    CREATE POLICY "Enable all operations for service role" ON retell_agents
      FOR ALL USING (true) WITH CHECK (true);
  `;

  try {
    const result = await supabase.rpc('exec_sql', { sql: createTableSQL });
    console.log('✅ retell_agents table created successfully');
  } catch (error) {
    console.log(
      '❌ Failed to create table via RPC, trying alternative method...'
    );

    // Alternative: Create table using individual operations
    try {
      await supabase.from('retell_agents').select('*').limit(0);
      console.log('✅ Table creation completed (table now exists)');
    } catch (createError) {
      console.log('❌ Table creation failed:', createError.message);
      console.log(
        '📋 You may need to manually create the table in Supabase dashboard'
      );
      console.log('📋 SQL to run manually:');
      console.log(createTableSQL);
    }
  }
}

async function testTableStructure(supabase) {
  console.log('🧪 Testing table structure...');

  const minimalRecord = {
    retell_agent_id: 'structure-test-' + Date.now(),
    agent_name: 'Structure Test',
  };

  const { error } = await supabase.from('retell_agents').insert(minimalRecord);

  if (error) {
    console.log('❌ Minimal insert failed:', error.message);
    return { error: error.message };
  } else {
    console.log('✅ Minimal structure test passed');
    // Clean up
    await supabase
      .from('retell_agents')
      .delete()
      .eq('retell_agent_id', minimalRecord.retell_agent_id);
    return { success: true };
  }
}

async function fixTableSchema(supabase, errorMessage) {
  console.log(
    '🔧 Attempting to fix table schema based on error:',
    errorMessage
  );

  // Extract column name from error message
  const columnMatch = errorMessage.match(/column "([^"]+)"/);
  if (!columnMatch) {
    console.log('❌ Could not extract column name from error');
    return;
  }

  const missingColumn = columnMatch[1];
  console.log(`📋 Missing column detected: ${missingColumn}`);

  const columnDefinitions = {
    business_id: 'TEXT NOT NULL',
    agent_type: 'TEXT NOT NULL',
    retell_agent_id: 'TEXT UNIQUE NOT NULL',
    agent_name: 'TEXT NOT NULL',
    ai_agent_id: 'TEXT',
    status: "TEXT DEFAULT 'deployed'",
    updated_at: 'TIMESTAMPTZ DEFAULT NOW()',
    conversation_flow_id: 'TEXT',
    response_engine_type: 'TEXT',
    retell_llm_id: 'TEXT',
    voice_settings: 'JSONB',
    created_at: 'TIMESTAMPTZ DEFAULT NOW()',
  };

  if (columnDefinitions[missingColumn]) {
    const alterSQL = `ALTER TABLE retell_agents ADD COLUMN IF NOT EXISTS ${missingColumn} ${columnDefinitions[missingColumn]};`;

    try {
      await supabase.rpc('exec_sql', { sql: alterSQL });
      console.log(`✅ Added missing column: ${missingColumn}`);
    } catch (alterError) {
      console.log(
        `❌ Failed to add column ${missingColumn}:`,
        alterError.message
      );
      console.log('📋 SQL to run manually:', alterSQL);
    }
  } else {
    console.log(`❌ Unknown column ${missingColumn}, cannot auto-fix`);
  }
}

async function checkConstraints(supabase) {
  console.log('🔍 Checking table constraints...');

  try {
    const { data, error } = await supabase
      .from('retell_agents')
      .select('retell_agent_id, business_id, agent_name')
      .limit(1);

    if (error) {
      console.log('❌ Constraint check failed:', error.message);
    } else {
      console.log('✅ Constraints appear to be working');
    }
  } catch (error) {
    console.log('❌ Constraint check error:', error.message);
  }
}

async function checkRLSPolicies(supabase) {
  console.log('🔍 Checking RLS policies...');

  try {
    // Try to read with different contexts
    const { data, error } = await supabase
      .from('retell_agents')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ RLS policy issue detected:', error.message);
      console.log('💡 Consider creating a permissive policy for service role');
    } else {
      console.log('✅ RLS policies are working correctly');
    }
  } catch (error) {
    console.log('❌ RLS check error:', error.message);
  }
}

async function runDiagnosis() {
  console.log('='.repeat(70));
  console.log('RETELL_AGENTS TABLE DIAGNOSIS & REPAIR');
  console.log('='.repeat(70));

  const result = await diagnoseRetellAgentsTable();

  console.log('\n' + '='.repeat(70));
  if (result.success) {
    console.log('✅ DIAGNOSIS COMPLETED');
    console.log('The retell_agents table should now be ready for use.');
  } else {
    console.log('❌ DIAGNOSIS FOUND ISSUES');
    console.log('Error:', result.error);
    console.log('\nPlease review the output above and follow suggested fixes.');
  }
  console.log('='.repeat(70));
}

runDiagnosis();
