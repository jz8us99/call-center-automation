'use server';

import { NextRequest, NextResponse } from 'next/server';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  billing_period: 'monthly' | 'yearly';
  features: string[];
  agent_types_allowed: string[];
  max_agents: number;
  max_calls_per_month: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/pricing - Fetch all pricing tiers
export async function GET(_request: NextRequest) {
  try {
    // 权限验证已由中间件处理

    // For now, return mock pricing tiers since we don't have a pricing_tiers table yet
    // In a real implementation, you would fetch from the database
    const mockTiers: PricingTier[] = [
      {
        id: '1',
        name: 'Basic',
        price: 29,
        billing_period: 'monthly',
        features: [
          'Up to 2 AI agents',
          'Inbound call handling',
          '500 calls per month',
          'Basic analytics',
          'Email support',
        ],
        agent_types_allowed: ['inbound_call'],
        max_agents: 2,
        max_calls_per_month: 500,
        is_active: true,
        is_popular: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        name: 'Premium',
        price: 79,
        billing_period: 'monthly',
        features: [
          'Up to 5 AI agents',
          'Inbound & outbound calls',
          'Appointment scheduling',
          '2,000 calls per month',
          'Advanced analytics',
          'Priority support',
          'Custom voice settings',
        ],
        agent_types_allowed: [
          'inbound_call',
          'outbound_appointment',
          'customer_support',
        ],
        max_agents: 5,
        max_calls_per_month: 2000,
        is_active: true,
        is_popular: true,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '3',
        name: 'Enterprise',
        price: 199,
        billing_period: 'monthly',
        features: [
          'Unlimited AI agents',
          'All agent types',
          'Marketing campaigns',
          '10,000+ calls per month',
          'Custom integrations',
          'White-label option',
          'Dedicated support',
          'SLA guarantee',
        ],
        agent_types_allowed: [
          'inbound_call',
          'outbound_appointment',
          'outbound_marketing',
          'customer_support',
        ],
        max_agents: -1, // -1 = unlimited
        max_calls_per_month: 10000,
        is_active: true,
        is_popular: false,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ];

    return NextResponse.json({ tiers: mockTiers });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pricing - Create a new pricing tier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 权限验证已由中间件处理

    // For now, just return success message
    // In a real implementation, you would create the tier in the database
    const newTier = {
      id: Date.now().toString(),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ tier: newTier }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
