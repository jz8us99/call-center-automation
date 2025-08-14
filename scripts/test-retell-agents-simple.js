require('dotenv').config();

async function testRetellAgentsTable() {
  try {
    console.log('🧪 Testing retell_agents table...\n');

    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. Testing simple select...');
    const { data: selectTest, error: selectError } = await supabase
      .from('retell_agents')
      .select('*')
      .limit(5);

    if (selectError) {
      console.log('❌ Select failed:', selectError.message);
    } else {
      console.log('✅ Select works, found', selectTest?.length || 0, 'records');
      if (selectTest?.length > 0) {
        console.log('Current table columns:', Object.keys(selectTest[0]));
        console.log('Sample record:', selectTest[0]);
      }
    }

    console.log('\n2. Testing insert with correct data types...');

    // Create test record with proper UUID for business_id
    const testRecord = {
      business_id: 'f4056f55-ad6d-4c6d-8aba-17544327b45a', // Real UUID format
      agent_type: 'receptionist',
      retell_agent_id: 'agent_' + Date.now(), // String ID
      agent_name: 'Test Agent ' + Date.now(),
      status: 'deployed',
      response_engine_type: 'retell-llm',
      retell_llm_id: 'llm_test_' + Date.now(),
      voice_settings: JSON.stringify({
        voice_id: '11labs-Adrian',
        speed: 1.28,
        temperature: 1,
      }),
      updated_at: new Date().toISOString(),
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('retell_agents')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('Failed record:', testRecord);

      // Try with minimal required fields
      console.log('\n3. Trying minimal insert...');
      const minimalRecord = {
        retell_agent_id: 'minimal_' + Date.now(),
        agent_name: 'Minimal Test',
      };

      const { data: minResult, error: minError } = await supabase
        .from('retell_agents')
        .insert(minimalRecord)
        .select();

      if (minError) {
        console.log('❌ Minimal insert also failed:', minError.message);
      } else {
        console.log('✅ Minimal insert successful:', minResult);

        // Clean up
        await supabase
          .from('retell_agents')
          .delete()
          .eq('retell_agent_id', minimalRecord.retell_agent_id);
      }
    } else {
      console.log('✅ Insert successful:', insertResult);

      console.log('\n4. Testing upsert...');
      const upsertRecord = {
        ...testRecord,
        agent_name: 'Updated ' + testRecord.agent_name,
      };

      const { data: upsertResult, error: upsertError } = await supabase
        .from('retell_agents')
        .upsert(upsertRecord, { onConflict: 'retell_agent_id' })
        .select();

      if (upsertError) {
        console.log('❌ Upsert failed:', upsertError.message);
      } else {
        console.log('✅ Upsert successful');
      }

      // Clean up test record
      await supabase
        .from('retell_agents')
        .delete()
        .eq('retell_agent_id', testRecord.retell_agent_id);

      console.log('🧹 Test record cleaned up');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { error: error.message };
  }
}

testRetellAgentsTable();
