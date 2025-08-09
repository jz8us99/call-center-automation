import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

// This endpoint seeds the agent_types table with the new agent types
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Define the agent types to seed
    const agentTypes = [
      {
        type_code: 'inbound_receptionist',
        name: 'Inbound Receptionist',
        description: 'Professional phone receptionist handling incoming calls, routing, and scheduling',
        icon: '📞',
        is_active: true,
      },
      {
        type_code: 'inbound_customer_support',
        name: 'Inbound Customer Support',
        description: 'Dedicated support agent for handling customer issues, complaints, and technical assistance',
        icon: '🛠️',
        is_active: true,
      },
      {
        type_code: 'outbound_follow_up',
        name: 'Outbound Follow-up',
        description: 'Follow-up agent for appointment confirmations, reminders, and post-service check-ins',
        icon: '📅',
        is_active: true,
      },
      {
        type_code: 'outbound_marketing',
        name: 'Outbound Marketing',
        description: 'Marketing agent for lead generation, sales calls, and promotional campaigns',
        icon: '📈',
        is_active: true,
      },
    ];

    // Insert or update agent types
    for (const agentType of agentTypes) {
      const { error } = await supabase
        .from('agent_types')
        .upsert(agentType, {
          onConflict: 'type_code',
        });

      if (error) {
        console.error(`Error inserting agent type ${agentType.type_code}:`, error);
      } else {
        console.log(`Successfully upserted agent type: ${agentType.name}`);
      }
    }

    // Fetch all agent types to return
    const { data: allAgentTypes, error: fetchError } = await supabase
      .from('agent_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch agent types after seeding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Agent types seeded successfully',
      agent_types: allAgentTypes,
    });
  } catch (error) {
    console.error('Error seeding agent types:', error);
    return NextResponse.json(
      { error: 'Failed to seed agent types' },
      { status: 500 }
    );
  }
}