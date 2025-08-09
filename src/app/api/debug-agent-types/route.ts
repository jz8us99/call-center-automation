import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Check if agent_types table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'agent_types');

    console.log('Tables check:', { tables, tablesError });

    // Try to get all agent types
    const { data: agentTypes, error: agentTypesError } = await supabase
      .from('agent_types')
      .select('*');

    console.log('Agent types:', { agentTypes, agentTypesError });

    // Check table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'agent_types');

    console.log('Table structure:', { columns, columnsError });

    return NextResponse.json({
      success: true,
      tableExists: tables && tables.length > 0,
      agentTypes: agentTypes || [],
      agentTypesError: agentTypesError?.message || null,
      tableStructure: columns || [],
      columnsError: columnsError?.message || null,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
