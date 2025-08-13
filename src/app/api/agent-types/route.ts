import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }

    const { supabaseWithAuth } = authResult;

    const { data: agentTypes, error } = await supabaseWithAuth
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
