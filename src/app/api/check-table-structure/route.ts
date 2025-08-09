import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Try to get the actual table structure by attempting inserts with known fields
    const testFields = {
      // Required fields we know should exist
      client_id: 'test',
      agent_type_id: 'test',
      agent_name: 'test',

      // Fields we want to save
      greeting_message: 'test greeting',
      custom_instructions: 'test instructions',
      basic_info_prompt: 'test prompt',
      agent_personality: 'professional',

      // JSON fields
      call_scripts: {},
      voice_settings: {},
      call_routing: {},
    };

    // Try a dry run insert to see what fields are missing
    const { error: structureError } = await supabase
      .from('agent_configurations_scoped')
      .insert(testFields)
      .select();

    console.log('Table structure test error:', structureError);

    // Also check what happens with a minimal insert
    const { error: minimalError } = await supabase
      .from('agent_configurations_scoped')
      .insert({
        client_id: 'test-minimal',
        agent_type_id: 'a946c78f-b5ad-4789-9457-07f7b58c32d4', // valid agent type ID
        agent_name: 'Test Agent',
      })
      .select();

    console.log('Minimal insert test error:', minimalError);

    return NextResponse.json({
      success: true,
      full_insert_error: structureError?.message || null,
      minimal_insert_error: minimalError?.message || null,
      test_fields: Object.keys(testFields),
    });
  } catch (error) {
    console.error('Check table structure error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
