import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const { data: agentTypes, error } = await supabase
      .from('agent_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching agent types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agent types' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      agent_types: agentTypes,
    });
  } catch (error) {
    console.error('Error in agent-types GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
