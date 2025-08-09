// AI Agent Dashboard API
// Provides comprehensive dashboard data for agent management

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';
import { AgentDashboardData } from '@/types/ai-agent-types';

// GET /api/ai-agents/dashboard - Get dashboard data
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('client_id');

    // Get client ID if not provided
    let targetClientId = clientId;
    if (!targetClientId) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientData) {
        targetClientId = clientData.id;
      }
    }

    if (!targetClientId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify user has access to this client
    if (
      clientId &&
      user.id !== clientId &&
      !user.is_super_admin &&
      user.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get agent summary
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select(
        `
        id,
        status,
        agent_types(type_code, name),
        supported_languages(code, name)
      `
      )
      .eq('client_id', targetClientId);

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json(
        { error: 'Failed to fetch agents' },
        { status: 500 }
      );
    }

    // Calculate agent summary
    const agentSummary = {
      total_agents: agents?.length || 0,
      active_agents: agents?.filter(a => a.status === 'active').length || 0,
      draft_agents: agents?.filter(a => a.status === 'draft').length || 0,
      inactive_agents: agents?.filter(a => a.status === 'inactive').length || 0,
    };

    // Group agents by type
    const agentsByType: Record<string, { count: number; languages: string[] }> =
      {};

    agents?.forEach(agent => {
      const typeCode = (agent.agent_types as any)?.type_code;
      const languageCode = (agent.supported_languages as any)?.code;

      if (typeCode) {
        if (!agentsByType[typeCode]) {
          agentsByType[typeCode] = { count: 0, languages: [] };
        }
        agentsByType[typeCode].count++;

        if (
          languageCode &&
          !agentsByType[typeCode].languages.includes(languageCode)
        ) {
          agentsByType[typeCode].languages.push(languageCode);
        }
      }
    });

    // Get recent activity (last 50 calls)
    const { data: recentCalls, error: callsError } = await supabase
      .from('ai_call_logs')
      .select(
        `
        call_id,
        agent_id,
        phone_number,
        call_status,
        started_at,
        ended_at,
        duration,
        ai_agents(name)
      `
      )
      .eq('client_id', targetClientId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (callsError) {
      console.error('Error fetching recent calls:', callsError);
    }

    // Get performance metrics for the last 30 days
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: performanceData, error: performanceError } = await supabase
      .from('agent_metrics')
      .select(
        `
        agent_id,
        date,
        total_calls,
        successful_calls,
        average_duration,
        average_sentiment,
        customer_satisfaction,
        ai_agents(name, agent_types(name))
      `
      )
      .gte('date', thirtyDaysAgo.split('T')[0]) // Get date part only
      .order('date', { ascending: false });

    if (performanceError) {
      console.error('Error fetching performance data:', performanceError);
    }

    // Calculate aggregated metrics
    const totalMetrics = {
      total_calls_30d: 0,
      successful_calls_30d: 0,
      average_duration_30d: 0,
      average_sentiment_30d: 0,
      average_satisfaction_30d: 0,
    };

    if (performanceData && performanceData.length > 0) {
      const totals = performanceData.reduce(
        (acc, metric) => {
          acc.total_calls += metric.total_calls || 0;
          acc.successful_calls += metric.successful_calls || 0;
          acc.total_duration +=
            (metric.average_duration || 0) * (metric.total_calls || 0);
          acc.total_sentiment +=
            (metric.average_sentiment || 0) * (metric.total_calls || 0);
          acc.total_satisfaction +=
            (metric.customer_satisfaction || 0) * (metric.total_calls || 0);
          return acc;
        },
        {
          total_calls: 0,
          successful_calls: 0,
          total_duration: 0,
          total_sentiment: 0,
          total_satisfaction: 0,
        }
      );

      totalMetrics.total_calls_30d = totals.total_calls;
      totalMetrics.successful_calls_30d = totals.successful_calls;
      totalMetrics.average_duration_30d =
        totals.total_calls > 0
          ? Math.round(totals.total_duration / totals.total_calls)
          : 0;
      totalMetrics.average_sentiment_30d =
        totals.total_calls > 0
          ? totals.total_sentiment / totals.total_calls
          : 0;
      totalMetrics.average_satisfaction_30d =
        totals.total_calls > 0
          ? totals.total_satisfaction / totals.total_calls
          : 0;
    }

    // Get agent type breakdown
    const { data: agentTypeStats, error: typeStatsError } = await supabase
      .from('ai_agents')
      .select(
        `
        agent_types(type_code, name),
        status,
        COUNT(*) as count
      `
      )
      .eq('client_id', targetClientId);
    // TODO: Add proper GROUP BY syntax when Supabase supports it better

    // Prepare dashboard data
    const dashboardData = {
      client_id: targetClientId,
      agent_summary: agentSummary,
      agents_by_type: agentsByType as any,
      recent_activity:
        recentCalls?.map(call => ({
          call_id: call.call_id,
          agent_id: call.agent_id,
          phone_number: call.phone_number,
          call_status: call.call_status,
          started_at: call.started_at,
          ended_at: call.ended_at,
          duration: call.duration,
          agent_name: (call.ai_agents as any)?.name,
        })) || [],
      performance_metrics: (performanceData || []) as any,
      aggregated_metrics: totalMetrics,
      generated_at: new Date().toISOString(),
    } as AgentDashboardData;

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error in GET /api/ai-agents/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
