import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // First, let's try to add the missing columns to the existing table
    const columnsToAdd = [
      { name: 'agent_name', type: 'VARCHAR(255)' },
      { name: 'greeting_message', type: 'TEXT' },
      { name: 'custom_instructions', type: 'TEXT' },
      { name: 'basic_info_prompt', type: 'TEXT' },
      { name: 'agent_personality', type: "VARCHAR(50) DEFAULT 'professional'" },
      { name: 'call_scripts_prompt', type: 'TEXT' },
      { name: 'call_scripts', type: "JSONB DEFAULT '{}'::jsonb" },
      { name: 'voice_settings', type: "JSONB DEFAULT '{}'::jsonb" },
      { name: 'call_routing', type: "JSONB DEFAULT '{}'::jsonb" },
      { name: 'custom_settings', type: "JSONB DEFAULT '{}'::jsonb" },
      { name: 'based_on_template_id', type: 'UUID' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true' },
      {
        name: 'created_at',
        type: "TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())",
      },
      {
        name: 'updated_at',
        type: "TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())",
      },
    ];

    const results = [];

    for (const column of columnsToAdd) {
      try {
        // Try to add each column - it will fail silently if it already exists
        const { error } = await supabase.rpc('sql', {
          query: `ALTER TABLE public.agent_configurations_scoped ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`,
        });

        results.push({
          column: column.name,
          success: !error,
          error: error?.message || null,
        });
      } catch (e) {
        // Try alternative approach for adding columns
        try {
          const { error: altError } = await supabase.from('_sql').insert({
            query: `ALTER TABLE public.agent_configurations_scoped ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`,
          });

          results.push({
            column: column.name,
            success: !altError,
            error: altError?.message || 'Used alternative method',
          });
        } catch (altE) {
          results.push({
            column: column.name,
            success: false,
            error: `Both methods failed: ${e} | ${altE}`,
          });
        }
      }
    }

    // Now test if we can insert data
    const testData = {
      client_id: '9aae05e7-744e-4897-b493-2e4dd1719caa', // From the existing business profile
      agent_type_id: 'a946c78f-b5ad-4789-9457-07f7b58c32d4', // inbound_receptionist
      agent_name: 'Test Agent',
      greeting_message: 'Hello! Welcome to our business.',
      custom_instructions: 'Be professional and helpful.',
      basic_info_prompt: 'You are a professional receptionist.',
      agent_personality: 'professional',
    };

    const { data: testInsert, error: insertError } = await supabase
      .from('agent_configurations_scoped')
      .upsert(testData, {
        onConflict: 'client_id,agent_type_id',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      column_results: results,
      test_insert: {
        success: !insertError,
        error: insertError?.message || null,
        data: testInsert,
      },
    });
  } catch (error) {
    console.error('Error in fix-database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
