import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.clientId;

    // Verify user has access to this client's data
    if (user.id !== clientId && !user.is_super_admin && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get agent configurations for this client
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(
        `
        *,
        agent_configurations(*)
      `
      )
      .eq('client_id', clientId);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json(
        { error: 'Failed to fetch agent status' },
        { status: 500 }
      );
    }

    // Get business knowledge count for this client
    const { count: knowledgeCount, error: knowledgeError } = await supabase
      .from('business_knowledge')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (knowledgeError) {
      console.error('Error fetching knowledge count:', knowledgeError);
    }

    // Get recent call logs
    const { data: recentCalls, error: callsError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('client_id', clientId)
      .order('started_at', { ascending: false })
      .limit(10);

    if (callsError) {
      console.error('Error fetching recent calls:', callsError);
    }

    // Calculate statistics
    const activeAgents =
      agents?.filter(agent => agent.status === 'active').length || 0;
    const totalAgents = agents?.length || 0;
    const hasBusinessKnowledge = (knowledgeCount || 0) > 0;

    return NextResponse.json({
      success: true,
      data: {
        client_id: clientId,
        agents: agents || [],
        statistics: {
          total_agents: totalAgents,
          active_agents: activeAgents,
          inactive_agents: totalAgents - activeAgents,
          business_knowledge_items: knowledgeCount || 0,
          has_business_knowledge: hasBusinessKnowledge,
          recent_calls_count: recentCalls?.length || 0,
        },
        recent_calls: recentCalls || [],
        last_updated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Agent status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
